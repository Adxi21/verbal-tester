import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import supabase from '../supabaseClient';

export default function ShaadsSecretSauceVertex() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [registrations, setRegistrations] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [detailedAnalytics, setDetailedAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [controlType, setControlType] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    checkAdminAndFetchData();
  }, [user]);

  const checkAdminAndFetchData = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return;
    const email = user.emailAddresses[0].emailAddress;

    try {
      // Check admin status
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('control_type')
        .eq('email', email)
        .single();

      if (adminError || !adminData) {
        navigate('/');
        return;
      }
      setControlType(adminData.control_type);

      // Fetch all registrations
      const { data: regs } = await supabase.from('event_registrations').select('*');
      const { data: dates } = await supabase.from('event_dates').select('*');

      const combined = (regs || []).map(reg => ({
        ...reg,
        datePreferences: (dates || []).filter(d => d.name === reg.name && d.email_id === reg.bookers_email)
      }));
      setRegistrations(combined);

      // Analytics: group event_dates by date
      const dateMap = {};
      (dates || []).forEach(d => {
        if (!dateMap[d.date]) dateMap[d.date] = {
          date: d.date,
          morning_tea_with: 0, morning_tea_without: 0,
          morning_coffee_with: 0, morning_coffee_without: 0,
          afternoon_tea_with: 0, afternoon_tea_without: 0,
          afternoon_coffee_with: 0, afternoon_coffee_without: 0,
          breakfast_count: 0, lunch_count: 0, dinner_count: 0
        };
        const entry = dateMap[d.date];
        if (d.morning_tea === 'with') entry.morning_tea_with++;
        if (d.morning_tea === 'without') entry.morning_tea_without++;
        if (d.morning_coffee === 'with') entry.morning_coffee_with++;
        if (d.morning_coffee === 'without') entry.morning_coffee_without++;
        if (d.afternoon_tea === 'with') entry.afternoon_tea_with++;
        if (d.afternoon_tea === 'without') entry.afternoon_tea_without++;
        if (d.afternoon_coffee === 'with') entry.afternoon_coffee_with++;
        if (d.afternoon_coffee === 'without') entry.afternoon_coffee_without++;
        if (d.breakfast) entry.breakfast_count++;
        if (d.lunch) entry.lunch_count++;
        if (d.dinner) entry.dinner_count++;
      });
      setAnalytics(Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)));

      // Detailed analytics
      const accommodations = [];
      (regs || []).forEach(reg => {
        if (reg.accommodation) {
          (reg.attending_dates || []).forEach(date => {
            accommodations.push({ date, name: reg.name, age: reg.age, gender: reg.gender, origin: reg.origin, bookers_email: reg.bookers_email, contact: reg.contact });
          });
        }
      });
      accommodations.sort((a, b) => a.date.localeCompare(b.date));

      const cots = (regs || []).filter(r => r.cot_required).map(r => ({ name: r.name, age: r.age, gender: r.gender, origin: r.origin, bookers_email: r.bookers_email, contact: r.contact }));
      const recordings = (regs || []).filter(r => r.recordings && r.recordprograms).map(r => ({ name: r.name, bookers_email: r.bookers_email, contact: r.contact, recordprograms: r.recordprograms }));
      const special_requests = (regs || []).filter(r => r.specialrequests).map(r => ({ name: r.name, bookers_email: r.bookers_email, contact: r.contact, specialrequests: r.specialrequests }));

      const packed_meals = (dates || []).filter(d => d.packed_lunch || d.packed_dinner).map(d => {
        const reg = (regs || []).find(r => r.bookers_email === d.email_id && r.name === d.name);
        return { date: d.date, name: d.name, bookers_email: d.email_id, contact: d.contact, age: reg?.age, origin: reg?.origin, packed_lunch: d.packed_lunch, packed_dinner: d.packed_dinner };
      });

      setDetailedAnalytics({ accommodations, cots, recordings, special_requests, packed_meals });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRegistration = async (index) => {
    const reg = registrations[index];
    try {
      const { error: regError } = await supabase
        .from('event_registrations')
        .update({
          age: reg.age,
          gender: reg.gender,
          origin: reg.origin,
          travelmode: reg.travelmode,
          departure_from_home: reg.departure_from_home,
          arrival_at_venue: reg.arrival_at_venue,
          accommodation: reg.accommodation,
          cot_required: reg.cot_required,
          difficultyclimbingstairs: reg.difficultyclimbingstairs,
          localassistance: reg.localassistance,
          localassistanceperson: reg.localassistanceperson,
          recordings: reg.recordings,
          recordprograms: reg.recordprograms,
          specialrequests: reg.specialrequests
        })
        .eq('bookers_email', reg.bookers_email)
        .eq('bookers_phone', reg.bookers_phone)
        .eq('name', reg.name);

      if (regError) throw regError;

      if (reg.datePreferences?.length) {
        for (const dp of reg.datePreferences) {
          const { error: dateError } = await supabase
            .from('event_dates')
            .update({
              morning_tea: dp.morning_tea,
              morning_coffee: dp.morning_coffee,
              afternoon_tea: dp.afternoon_tea,
              afternoon_coffee: dp.afternoon_coffee,
              breakfast: dp.breakfast,
              lunch: dp.lunch,
              dinner: dp.dinner,
              packed_lunch: dp.packed_lunch,
              packed_dinner: dp.packed_dinner,
              departuretime: dp.departuretime
            })
            .eq('email_id', dp.email_id)
            .eq('contact', dp.contact)
            .eq('name', dp.name)
            .eq('date', dp.date);
          if (dateError) throw dateError;
        }
      }

      alert('✅ Registration updated successfully!');
      setEditingIndex(-1);
    } catch (error) {
      console.error('Error updating registration:', error);
      alert('❌ Error updating registration');
    }
  };

  const deleteRegistration = async (index) => {
    const reg = registrations[index];
    if (!confirm(`Are you sure you want to delete registration for ${reg.name}?`)) return;

    try {
      await supabase.from('event_dates').delete().eq('email_id', reg.bookers_email).eq('name', reg.name);
      const { error } = await supabase.from('event_registrations').delete()
        .eq('bookers_email', reg.bookers_email)
        .eq('bookers_phone', reg.bookers_phone)
        .eq('name', reg.name);
      if (error) throw error;

      alert('✅ Registration deleted successfully!');
      checkAdminAndFetchData();
    } catch (error) {
      console.error('Error deleting registration:', error);
      alert('❌ Error deleting registration');
    }
  };

  const updateField = (index, field, value) => {
    setRegistrations(prev => prev.map((reg, i) => 
      i === index ? { ...reg, [field]: value } : reg
    ));
  };

  const updateDatePreference = (regIndex, dateIndex, field, value) => {
    setRegistrations(prev => prev.map((reg, i) => {
      if (i !== regIndex) return reg;
      const newDatePrefs = [...reg.datePreferences];
      newDatePrefs[dateIndex] = { ...newDatePrefs[dateIndex], [field]: value };
      return { ...reg, datePreferences: newDatePrefs };
    }));
  };

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const downloadRegistrationsExcel = () => {
    // Sheet 1: Event Dates with Daily Preferences
    const dateHeaders = [
      'Date', 'Person Name', 'Email', 'Phone', 'Contact Number',
      'Cot Required', 'Morning Tea', 'Morning Coffee', 'Afternoon Tea', 'Afternoon Coffee',
      'Breakfast', 'Lunch', 'Dinner', 'Packed Lunch', 'Packed Dinner', 'Departure Time'
    ];

    const dateRows = [];
    registrations.forEach((reg) => {
      const datePrefs = reg.datePreferences || [];
      datePrefs.forEach((dp) => {
        dateRows.push({
          Date: dp.date || '',
          'Person Name': reg.name || '',
          Email: reg.bookers_email || '',
          Phone: reg.bookers_phone || '',
          'Contact Number': reg.contact || '',
          'Cot Required': reg.cot_required ? 'Yes' : 'No',
          'Morning Tea': dp.morning_tea ? (dp.morning_tea === 'with' ? 'With Sugar' : 'Without Sugar') : 'No',
          'Morning Coffee': dp.morning_coffee ? (dp.morning_coffee === 'with' ? 'With Sugar' : 'Without Sugar') : 'No',
          'Afternoon Tea': dp.afternoon_tea ? (dp.afternoon_tea === 'with' ? 'With Sugar' : 'Without Sugar') : 'No',
          'Afternoon Coffee': dp.afternoon_coffee ? (dp.afternoon_coffee === 'with' ? 'With Sugar' : 'Without Sugar') : 'No',
          'Breakfast': dp.breakfast ? 'Yes' : 'No',
          'Lunch': dp.lunch ? 'Yes' : 'No',
          'Dinner': dp.dinner ? 'Yes' : 'No',
          'Packed Lunch': dp.packed_lunch ? 'Yes' : 'No',
          'Packed Dinner': dp.packed_dinner ? 'Yes' : 'No',
          'Departure Time': dp.departuretime || ''
        });
      });
    });

    // Sheet 2: Attendee Details
    const attendeeHeaders = [
      'Name', 'Email', 'Phone', 'Contact Number', 'Gender', 'Origin',
      'Travel Mode', 'Departure from Home', 'Arrival at Venue',
      'Local Assistance Needed', 'Local Assistance Person',
      'Difficulty Climbing Stairs', 'Recordings Required', 'Recording Programs',
      'Special Requests', 'Attending Dates', 'Event Name'
    ];

    const attendeeRows = registrations.map((reg) => ({
      'Name': reg.name || '',
      'Email': reg.bookers_email || '',
      'Phone': reg.bookers_phone || '',
      'Contact Number': reg.contact || '',
      'Gender': reg.gender || '',
      'Origin': reg.origin || '',
      'Travel Mode': reg.travelmode || '',
      'Departure from Home': reg.departure_from_home || '',
      'Arrival at Venue': reg.arrival_at_venue || '',
      'Local Assistance Needed': reg.localassistance ? 'Yes' : 'No',
      'Local Assistance Person': reg.localassistanceperson || '',
      'Difficulty Climbing Stairs': reg.difficultyclimbingstairs ? 'Yes' : 'No',
      'Recordings Required': reg.recordings ? 'Yes' : 'No',
      'Recording Programs': reg.recordprograms || '',
      'Special Requests': reg.specialrequests || '',
      'Attending Dates': Array.isArray(reg.attending_dates) ? reg.attending_dates.join(' | ') : reg.attending_dates || '',
      'Event Name': reg.event_name || ''
    }));

    // Create CSV content for both sheets
    const sheet1CSV = [
      dateHeaders.join(','),
      ...dateRows.map((row) => dateHeaders.map((field) => escapeCsvValue(row[field])).join(','))
    ].join('\n');

    const sheet2CSV = [
      attendeeHeaders.join(','),
      ...attendeeRows.map((row) => attendeeHeaders.map((field) => escapeCsvValue(row[field])).join(','))
    ].join('\n');

    // For better compatibility, create a single professional Excel-style CSV with sheet tabs
    // Or create two separate downloads
    
    // Create Sheet 1 (Event Dates)
    const blob1 = new Blob([sheet1CSV], { type: 'text/csv;charset=utf-8;' });
    const url1 = URL.createObjectURL(blob1);
    const link1 = document.createElement('a');
    link1.href = url1;
    link1.download = `event-dates-preferences_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link1);
    link1.click();
    document.body.removeChild(link1);
    URL.revokeObjectURL(url1);

    // Create Sheet 2 (Attendee Details) with slight delay
    setTimeout(() => {
      const blob2 = new Blob([sheet2CSV], { type: 'text/csv;charset=utf-8;' });
      const url2 = URL.createObjectURL(blob2);
      const link2 = document.createElement('a');
      link2.href = url2;
      link2.download = `attendee-details_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link2);
      link2.click();
      document.body.removeChild(link2);
      URL.revokeObjectURL(url2);
    }, 500);

    alert('✅ Excel reports downloaded successfully!\n\n📋 2 files created:\n1. event-dates-preferences\n2. attendee-details');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
          <p className="mt-4 text-lg">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center text-white hover:text-purple-300 font-medium transition-colors"
              >
                <span className="mr-2">←</span> Back to Home
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">🔐 Admin Control Center</h2>
                <p className="text-purple-300 text-sm">
                  {controlType === 'Q' ? '👑 Head Admin - Full Access' : '👀 View Only Access'}
                </p>
              </div>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'registrations' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            👥 All Registrations ({registrations.length})
          </button>
          <button
            onClick={downloadRegistrationsExcel}
            className="px-6 py-3 rounded-lg font-medium transition-colors bg-emerald-500 text-white hover:bg-emerald-400"
          >
            ⬇️ Download Excel
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">📈 Event Analytics Dashboard</h1>
              <p className="text-purple-300">Daily meal and beverage preferences overview</p>
            </div>

            {analytics.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/10 rounded-2xl p-12 max-w-md mx-auto">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-2xl font-bold text-white mb-4">No Analytics Data</h2>
                  <p className="text-purple-300">No registrations found to generate analytics.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {analytics.map((dayData, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h3 className="text-2xl font-bold text-white mb-6">📅 {dayData.date}</h3>
                    
                    {/* Beverages Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-amber-500/20 rounded-xl p-4">
                        <h4 className="text-lg font-semibold text-amber-200 mb-4">☕ Morning Beverages</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{dayData.morning_tea_with + dayData.morning_tea_without}</div>
                            <div className="text-amber-300 text-sm">Tea Total</div>
                            <div className="text-xs text-amber-400">With: {dayData.morning_tea_with} | Without: {dayData.morning_tea_without}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{dayData.morning_coffee_with + dayData.morning_coffee_without}</div>
                            <div className="text-amber-300 text-sm">Coffee Total</div>
                            <div className="text-xs text-amber-400">With: {dayData.morning_coffee_with} | Without: {dayData.morning_coffee_without}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-500/20 rounded-xl p-4">
                        <h4 className="text-lg font-semibold text-orange-200 mb-4">🫖 Afternoon Beverages</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{dayData.afternoon_tea_with + dayData.afternoon_tea_without}</div>
                            <div className="text-orange-300 text-sm">Tea Total</div>
                            <div className="text-xs text-orange-400">With: {dayData.afternoon_tea_with} | Without: {dayData.afternoon_tea_without}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">{dayData.afternoon_coffee_with + dayData.afternoon_coffee_without}</div>
                            <div className="text-orange-300 text-sm">Coffee Total</div>
                            <div className="text-xs text-orange-400">With: {dayData.afternoon_coffee_with} | Without: {dayData.afternoon_coffee_without}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meals Section */}
                    <div className="bg-green-500/20 rounded-xl p-4">
                      <h4 className="text-lg font-semibold text-green-200 mb-4">🍽️ Meals</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">{dayData.breakfast_count}</div>
                          <div className="text-green-300">🍳 Breakfast</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">{dayData.lunch_count}</div>
                          <div className="text-green-300">🍽️ Lunch</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">{dayData.dinner_count}</div>
                          <div className="text-green-300">🍛 Dinner</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">👥 All Event Registrations</h1>
              <p className="text-purple-300">
                {controlType === 'Q' ? 'Full editing access available' : 'View-only mode'}
              </p>
            </div>

            {registrations.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/10 rounded-2xl p-12 max-w-md mx-auto">
                  <div className="text-6xl mb-4">👥</div>
                  <h2 className="text-2xl font-bold text-white mb-4">No Registrations</h2>
                  <p className="text-purple-300">No event registrations found.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {registrations.map((reg, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    {/* Person Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-bold">{reg.name}</h3>
                          <p className="text-purple-100">{reg.event_name}</p>
                          <p className="text-purple-200 text-sm">Booked by: {reg.bookers_email}</p>
                        </div>
                        {controlType === 'Q' && (
                          <div className="flex space-x-2">
                            {editingIndex === index ? (
                              <>
                                <button
                                  onClick={() => updateRegistration(index)}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                                >
                                  💾 Save
                                </button>
                                <button
                                  onClick={() => setEditingIndex(-1)}
                                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                                >
                                  ❌ Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingIndex(index)}
                                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => deleteRegistration(index)}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                                >
                                  🗑️ Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      {editingIndex === index && controlType === 'Q' ? (
                        // Edit Mode (Only for Q users)
                        <div className="space-y-6">
                          {/* Basic Info */}
                          <div className="bg-white/5 rounded-lg p-4">
                            <h4 className="text-lg font-semibold mb-4 text-white">📋 Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Event Name</label>
                                <input
                                  type="text"
                                  value={reg.event_name || ''}
                                  onChange={(e) => updateField(index, 'event_name', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                <input
                                  type="text"
                                  value={reg.name}
                                  readOnly
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white cursor-not-allowed"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
                                <input
                                  type="number"
                                  value={reg.age || ''}
                                  onChange={(e) => updateField(index, 'age', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                                <select
                                  value={reg.gender || ''}
                                  onChange={(e) => updateField(index, 'gender', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="">Select Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Contact</label>
                                <input
                                  type="text"
                                  value={reg.contact || ''}
                                  onChange={(e) => updateField(index, 'contact', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Origin</label>
                                <input
                                  type="text"
                                  value={reg.origin || ''}
                                  onChange={(e) => updateField(index, 'origin', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Travel Mode</label>
                                <input
                                  type="text"
                                  value={reg.travelmode || ''}
                                  onChange={(e) => updateField(index, 'travelmode', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Departure from Home</label>
                                <input
                                  type="text"
                                  value={reg.departure_from_home || ''}
                                  onChange={(e) => updateField(index, 'departure_from_home', e.target.value)}
                                  placeholder="HH:MM"
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Arrival at Venue</label>
                                <input
                                  type="text"
                                  value={reg.arrival_at_venue || ''}
                                  onChange={(e) => updateField(index, 'arrival_at_venue', e.target.value)}
                                  placeholder="HH:MM"
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                              <label className="flex items-center p-3 border border-white/20 rounded-lg bg-gray-800/70">
                                <input
                                  type="checkbox"
                                  checked={reg.accommodation || false}
                                  onChange={(e) => updateField(index, 'accommodation', e.target.checked)}
                                  className="mr-2 h-4 w-4 text-purple-600"
                                />
                                <span className="text-white">Accommodation needed</span>
                              </label>
                              <label className="flex items-center p-3 border border-white/20 rounded-lg bg-gray-800/70">
                                <input
                                  type="checkbox"
                                  checked={reg.cot_required || false}
                                  onChange={(e) => updateField(index, 'cot_required', e.target.checked)}
                                  className="mr-2 h-4 w-4 text-purple-600"
                                />
                                <span className="text-white">Cot required</span>
                              </label>
                              <label className="flex items-center p-3 border border-white/20 rounded-lg bg-gray-800/70">
                                <input
                                  type="checkbox"
                                  checked={reg.difficultyclimbingstairs || false}
                                  onChange={(e) => updateField(index, 'difficultyclimbingstairs', e.target.checked)}
                                  className="mr-2 h-4 w-4 text-purple-600"
                                />
                                <span className="text-white">Difficulty climbing stairs</span>
                              </label>
                              <label className="flex items-center p-3 border border-white/20 rounded-lg bg-gray-800/70">
                                <input
                                  type="checkbox"
                                  checked={reg.localassistance || false}
                                  onChange={(e) => updateField(index, 'localassistance', e.target.checked)}
                                  className="mr-2 h-4 w-4 text-purple-600"
                                />
                                <span className="text-white">Local assistance needed</span>
                              </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Local Assistance Person</label>
                                <input
                                  type="text"
                                  value={reg.localassistanceperson || ''}
                                  onChange={(e) => updateField(index, 'localassistanceperson', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Recordings</label>
                                <label className="flex items-center gap-3 p-3 border border-white/20 rounded-lg bg-gray-800/70">
                                  <input
                                    type="checkbox"
                                    checked={reg.recordings || false}
                                    onChange={(e) => updateField(index, 'recordings', e.target.checked)}
                                    className="h-4 w-4 text-purple-600"
                                  />
                                  <span className="text-white">Recording requested</span>
                                </label>
                              </div>
                            </div>

                            <div className="mt-6">
                              <label className="block text-sm font-medium text-gray-300 mb-1">Recording Programs</label>
                              <input
                                type="text"
                                value={reg.recordprograms || ''}
                                onChange={(e) => updateField(index, 'recordprograms', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                              />
                            </div>

                            <div className="mt-6">
                              <label className="block text-sm font-medium text-gray-300 mb-1">Special Requests</label>
                              <textarea
                                value={reg.specialrequests || ''}
                                onChange={(e) => updateField(index, 'specialrequests', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          {/* Date Preferences */}
                          {reg.datePreferences && reg.datePreferences.length > 0 && (
                            <div className="bg-white/5 rounded-lg p-4">
                              <h4 className="text-lg font-semibold mb-4 text-white">📅 Daily Preferences</h4>
                              <div className="space-y-4">
                                {reg.datePreferences.map((datePref, dateIndex) => (
                                  <div key={dateIndex} className="bg-white/10 border border-white/20 rounded-lg p-4">
                                    <h5 className="font-medium mb-3 text-purple-300">📆 {datePref.date}</h5>
                                    
                                    {/* Beverages */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-300">☕ Morning Tea</label>
                                        <select
                                          value={datePref.morning_tea || 'no'}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'morning_tea', e.target.value)}
                                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-700 text-white"
                                        >
                                          <option value="no">No</option>
                                          <option value="with">With Sugar</option>
                                          <option value="without">Without Sugar</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-300">☕ Morning Coffee</label>
                                        <select
                                          value={datePref.morning_coffee || 'no'}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'morning_coffee', e.target.value)}
                                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-700 text-white"
                                        >
                                          <option value="no">No</option>
                                          <option value="with">With Sugar</option>
                                          <option value="without">Without Sugar</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-300">🫖 Afternoon Tea</label>
                                        <select
                                          value={datePref.afternoon_tea || 'no'}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'afternoon_tea', e.target.value)}
                                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-700 text-white"
                                        >
                                          <option value="no">No</option>
                                          <option value="with">With Sugar</option>
                                          <option value="without">Without Sugar</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-300">☕ Afternoon Coffee</label>
                                        <select
                                          value={datePref.afternoon_coffee || 'no'}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'afternoon_coffee', e.target.value)}
                                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-700 text-white"
                                        >
                                          <option value="no">No</option>
                                          <option value="with">With Sugar</option>
                                          <option value="without">Without Sugar</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Meals */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                      <label className="flex items-center p-2 border border-white/20 rounded hover:bg-white/5">
                                        <input
                                          type="checkbox"
                                          checked={datePref.breakfast || false}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'breakfast', e.target.checked)}
                                          className="mr-2 h-4 w-4 text-purple-600"
                                        />
                                        <span className="text-white">🍳 Breakfast</span>
                                      </label>
                                      <label className="flex items-center p-2 border border-white/20 rounded hover:bg-white/5">
                                        <input
                                          type="checkbox"
                                          checked={datePref.lunch || false}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'lunch', e.target.checked)}
                                          className="mr-2 h-4 w-4 text-purple-600"
                                        />
                                        <span className="text-white">🍽️ Lunch</span>
                                      </label>
                                      <label className="flex items-center p-2 border border-white/20 rounded hover:bg-white/5">
                                        <input
                                          type="checkbox"
                                          checked={datePref.dinner || false}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'dinner', e.target.checked)}
                                          className="mr-2 h-4 w-4 text-purple-600"
                                        />
                                        <span className="text-white">🍛 Dinner</span>
                                      </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                      <label className="flex items-center p-2 border border-white/20 rounded hover:bg-white/5">
                                        <input
                                          type="checkbox"
                                          checked={datePref.packed_lunch || false}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'packed_lunch', e.target.checked)}
                                          className="mr-2 h-4 w-4 text-purple-600"
                                        />
                                        <span className="text-white">🥡 Packed Lunch</span>
                                      </label>
                                      <label className="flex items-center p-2 border border-white/20 rounded hover:bg-white/5">
                                        <input
                                          type="checkbox"
                                          checked={datePref.packed_dinner || false}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'packed_dinner', e.target.checked)}
                                          className="mr-2 h-4 w-4 text-purple-600"
                                        />
                                        <span className="text-white">🥘 Packed Dinner</span>
                                      </label>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Departure Time</label>
                                        <input
                                          type="text"
                                          value={datePref.departuretime || ''}
                                          onChange={(e) => updateDatePreference(index, dateIndex, 'departuretime', e.target.value)}
                                          placeholder="HH:MM"
                                          className="w-full px-2 py-1 border border-gray-600 rounded text-sm bg-gray-700 text-white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // View Mode
                        <div className="space-y-6">
                          {/* Basic Info */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-white"><span className="font-medium mr-2">👤 Age:</span> {reg.age || 'N/A'}</div>
                            <div className="flex items-center text-white"><span className="font-medium mr-2">⚧️ Gender:</span> {reg.gender || 'N/A'}</div>
                            <div className="flex items-center text-white"><span className="font-medium mr-2">📞 Contact:</span> {reg.contact}</div>
                            <div className="flex items-center text-white"><span className="font-medium mr-2">📍 Origin:</span> {reg.origin || 'N/A'}</div>
                          </div>

                          {/* Date Preferences */}
                          {reg.datePreferences && reg.datePreferences.length > 0 && (
                            <div className="bg-white/5 rounded-lg p-4">
                              <h4 className="font-medium text-white mb-3">📅 Daily Preferences</h4>
                              <div className="space-y-3">
                                {reg.datePreferences.map((datePref, dateIndex) => (
                                  <div key={dateIndex} className="bg-white/10 p-3 rounded-lg border border-white/20">
                                    <div className="font-medium text-sm mb-2 text-purple-300">📆 {datePref.date}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                                      <div className="text-white">☕ Tea: {datePref.morning_tea === 'no' ? 'No' : datePref.morning_tea === 'with' ? 'With Sugar' : 'Without Sugar'}</div>
                                      <div className="text-white">☕ Coffee: {datePref.morning_coffee === 'no' ? 'No' : datePref.morning_coffee === 'with' ? 'With Sugar' : 'Without Sugar'}</div>
                                      <div className="text-white">🫖 A.Tea: {datePref.afternoon_tea === 'no' ? 'No' : datePref.afternoon_tea === 'with' ? 'With Sugar' : 'Without Sugar'}</div>
                                      <div className="text-white">☕ A.Coffee: {datePref.afternoon_coffee === 'no' ? 'No' : datePref.afternoon_coffee === 'with' ? 'With Sugar' : 'Without Sugar'}</div>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {datePref.breakfast && <span className="bg-yellow-500/30 text-yellow-200 px-2 py-0.5 rounded text-xs">🍳 Breakfast</span>}
                                      {datePref.lunch && <span className="bg-yellow-500/30 text-yellow-200 px-2 py-0.5 rounded text-xs">🍽️ Lunch</span>}
                                      {datePref.dinner && <span className="bg-yellow-500/30 text-yellow-200 px-2 py-0.5 rounded text-xs">🍛 Dinner</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Detailed Analytics Tables */}
            <div className="grid gap-8 mt-8">
              {/* Accommodations Table */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6">🏠 Accommodation Requests by Date & Gender</h3>
                {detailedAnalytics.accommodations && detailedAnalytics.accommodations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-white text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Age</th>
                          <th className="text-left p-2">Gender</th>
                          <th className="text-left p-2">Origin</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedAnalytics.accommodations.map((acc, index) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            <td className="p-2">{acc.date}</td>
                            <td className="p-2 font-medium">{acc.name}</td>
                            <td className="p-2">{acc.age}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                acc.gender === 'Male' ? 'bg-blue-500/30 text-blue-200' :
                                acc.gender === 'Female' ? 'bg-pink-500/30 text-pink-200' :
                                'bg-gray-500/30 text-gray-200'
                              }`}>
                                {acc.gender}
                              </span>
                            </td>
                            <td className="p-2">{acc.origin}</td>
                            <td className="p-2 text-xs">{acc.bookers_email}</td>
                            <td className="p-2">{acc.contact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-purple-300">No accommodation requests found.</p>
                )}
              </div>

              {/* Cots Table */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6">🛏️ Cot Requirements ({detailedAnalytics.cots?.length || 0})</h3>
                {detailedAnalytics.cots && detailedAnalytics.cots.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-white text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Age</th>
                          <th className="text-left p-2">Gender</th>
                          <th className="text-left p-2">Origin</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedAnalytics.cots.map((cot, index) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            <td className="p-2 font-medium">{cot.name}</td>
                            <td className="p-2">{cot.age}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                cot.gender === 'Male' ? 'bg-blue-500/30 text-blue-200' :
                                cot.gender === 'Female' ? 'bg-pink-500/30 text-pink-200' :
                                'bg-gray-500/30 text-gray-200'
                              }`}>
                                {cot.gender}
                              </span>
                            </td>
                            <td className="p-2">{cot.origin}</td>
                            <td className="p-2 text-xs">{cot.bookers_email}</td>
                            <td className="p-2">{cot.contact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-purple-300">No cot requirements found.</p>
                )}
              </div>

              {/* Recordings Table */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6">📹 Recording Requests ({detailedAnalytics.recordings?.length || 0})</h3>
                {detailedAnalytics.recordings && detailedAnalytics.recordings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-white text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Contact</th>
                          <th className="text-left p-2">Recording Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedAnalytics.recordings.map((rec, index) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            <td className="p-2 font-medium">{rec.name}</td>
                            <td className="p-2 text-xs">{rec.bookers_email}</td>
                            <td className="p-2">{rec.contact}</td>
                            <td className="p-2">
                              <div className="bg-blue-500/20 p-2 rounded text-blue-200">
                                {rec.recordprograms}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-purple-300">No recording requests found.</p>
                )}
              </div>

              {/* Special Requests Table */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6">💬 Special Requests ({detailedAnalytics.special_requests?.length || 0})</h3>
                {detailedAnalytics.special_requests && detailedAnalytics.special_requests.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-white text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Contact</th>
                          <th className="text-left p-2">Special Request</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedAnalytics.special_requests.map((req, index) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            <td className="p-2 font-medium">{req.name}</td>
                            <td className="p-2 text-xs">{req.bookers_email}</td>
                            <td className="p-2">{req.contact}</td>
                            <td className="p-2">
                              <div className="bg-purple-500/20 p-2 rounded text-purple-200">
                                {req.specialrequests}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-purple-300">No special requests found.</p>
                )}
              </div>

              {/* Packed Meals Table */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6">📦 Packed Meals by Date ({detailedAnalytics.packed_meals?.length || 0})</h3>
                {detailedAnalytics.packed_meals && detailedAnalytics.packed_meals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-white text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Contact</th>
                          <th className="text-left p-2">Age</th>
                          <th className="text-left p-2">Origin</th>
                          <th className="text-left p-2">Packed Lunch</th>
                          <th className="text-left p-2">Packed Dinner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedAnalytics.packed_meals.map((meal, index) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            <td className="p-2 font-medium">{meal.date}</td>
                            <td className="p-2">{meal.name}</td>
                            <td className="p-2 text-xs">{meal.bookers_email}</td>
                            <td className="p-2">{meal.contact}</td>
                            <td className="p-2">{meal.age}</td>
                            <td className="p-2">{meal.origin}</td>
                            <td className="p-2">
                              {meal.packed_lunch ? (
                                <span className="bg-green-500/30 text-green-200 px-2 py-1 rounded text-xs">✓ Yes</span>
                              ) : (
                                <span className="bg-red-500/30 text-red-200 px-2 py-1 rounded text-xs">✗ No</span>
                              )}
                            </td>
                            <td className="p-2">
                              {meal.packed_dinner ? (
                                <span className="bg-green-500/30 text-green-200 px-2 py-1 rounded text-xs">✓ Yes</span>
                              ) : (
                                <span className="bg-red-500/30 text-red-200 px-2 py-1 rounded text-xs">✗ No</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-purple-300">No packed meal requests found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}