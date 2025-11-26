import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";

export default function CRUD_Registrations() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(-1);

  useEffect(() => {
    fetchRegistrations();
  }, [user]);

  const fetchRegistrations = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/registrations/${user.emailAddresses[0].emailAddress}`);
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRegistration = async (index) => {
    const registration = registrations[index];
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/update-registration`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration)
      });

      if (response.ok) {
        alert('✅ Registration updated successfully!');
        setEditingIndex(-1);
      } else {
        alert('❌ Failed to update registration');
      }
    } catch (error) {
      console.error('Error updating registration:', error);
      alert('❌ Error updating registration');
    }
  };

  const deleteRegistration = async (index) => {
    const registration = registrations[index];
    if (!confirm(`Are you sure you want to delete registration for ${registration.name}?`)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delete-registration`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookers_email: registration.bookers_email,
          bookers_phone: registration.bookers_phone,
          name: registration.name
        })
      });

      if (response.ok) {
        alert('✅ Registration deleted successfully!');
        fetchRegistrations(); // Refresh the list
      } else {
        alert('❌ Failed to delete registration');
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/registrations')}
                className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                <span className="mr-2">←</span> Back to Register
              </button>
              <h2 className="text-2xl font-bold text-indigo-600">Manage Registrations</h2>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {registrations.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">No Registrations Found</h1>
              <p className="text-gray-600 mb-6">You haven't registered for any events yet.</p>
              <button
                onClick={() => navigate('/registrations')}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Register Now
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Event Registrations</h1>
              <p className="text-gray-600">Manage your registrations and daily preferences</p>
            </div>
            
            {registrations.map((reg, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Person Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold">{reg.name}</h3>
                      <p className="text-indigo-100">{reg.event_name}</p>
                      <p className="text-indigo-200 text-sm">Contact: {reg.contact}</p>
                    </div>
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
                  </div>
                </div>

                <div className="p-6">
                  {editingIndex === index ? (
                    // Edit Mode
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold mb-4 text-gray-800">📋 Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={reg.name}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                            <input
                              type="number"
                              value={reg.age || ''}
                              onChange={(e) => updateField(index, 'age', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                              value={reg.gender || ''}
                              onChange={(e) => updateField(index, 'gender', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                            <input
                              type="text"
                              value={reg.origin || ''}
                              onChange={(e) => updateField(index, 'origin', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Travel Details */}
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold mb-4 text-gray-800">🚗 Travel Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Travel Mode</label>
                            <select
                              value={reg.travelmode || ''}
                              onChange={(e) => updateField(index, 'travelmode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Select Mode</option>
                              <option value="Bus">Bus</option>
                              <option value="Train">Train</option>
                              <option value="Car">Car</option>
                              <option value="Flight">Flight</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                            <input
                              type="time"
                              value={reg.departure_from_home || ''}
                              onChange={(e) => updateField(index, 'departure_from_home', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                            <input
                              type="time"
                              value={reg.arrival_at_venue || ''}
                              onChange={(e) => updateField(index, 'arrival_at_venue', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold mb-4 text-gray-800">⚙️ Preferences</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <label className="flex items-center p-2 border rounded-lg hover:bg-white transition-colors">
                            <input
                              type="checkbox"
                              checked={reg.accommodation || false}
                              onChange={(e) => updateField(index, 'accommodation', e.target.checked)}
                              className="mr-3 h-4 w-4 text-indigo-600"
                            />
                            🏠 Accommodation
                          </label>
                          <label className="flex items-center p-2 border rounded-lg hover:bg-white transition-colors">
                            <input
                              type="checkbox"
                              checked={reg.cot_required || false}
                              onChange={(e) => updateField(index, 'cot_required', e.target.checked)}
                              className="mr-3 h-4 w-4 text-indigo-600"
                            />
                            🛏️ Cot Required
                          </label>
                          <label className="flex items-center p-2 border rounded-lg hover:bg-white transition-colors">
                            <input
                              type="checkbox"
                              checked={reg.difficultyclimbingstairs || false}
                              onChange={(e) => updateField(index, 'difficultyclimbingstairs', e.target.checked)}
                              className="mr-3 h-4 w-4 text-indigo-600"
                            />
                            🚶 Stair Help
                          </label>
                          <label className="flex items-center p-2 border rounded-lg hover:bg-white transition-colors">
                            <input
                              type="checkbox"
                              checked={reg.recordings || false}
                              onChange={(e) => updateField(index, 'recordings', e.target.checked)}
                              className="mr-3 h-4 w-4 text-indigo-600"
                            />
                            📹 Recordings
                          </label>
                        </div>
                      </div>

                      {/* Special Requests */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold mb-4 text-gray-800">💬 Special Requests</h4>
                        <textarea
                          value={reg.specialrequests || ''}
                          onChange={(e) => updateField(index, 'specialrequests', e.target.value)}
                          placeholder="Any special requests or requirements..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          rows="3"
                        />
                      </div>

                      {/* Date Preferences */}
                      {reg.datePreferences && reg.datePreferences.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="text-lg font-semibold mb-4 text-gray-800">📅 Daily Meal & Beverage Preferences</h4>
                          <div className="space-y-4">
                            {reg.datePreferences.map((datePref, dateIndex) => (
                              <div key={dateIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                                <h5 className="font-medium mb-3 text-indigo-600">📆 {datePref.date}</h5>
                                
                                {/* Beverages */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">☕ Morning Tea</label>
                                    <select
                                      value={datePref.morning_tea || 'no'}
                                      onChange={(e) => updateDatePreference(index, dateIndex, 'morning_tea', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="no">No</option>
                                      <option value="with">With Sugar</option>
                                      <option value="without">Without Sugar</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">☕ Morning Coffee</label>
                                    <select
                                      value={datePref.morning_coffee || 'no'}
                                      onChange={(e) => updateDatePreference(index, dateIndex, 'morning_coffee', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="no">No</option>
                                      <option value="with">With Sugar</option>
                                      <option value="without">Without Sugar</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">🫖 Afternoon Tea</label>
                                    <select
                                      value={datePref.afternoon_tea || 'no'}
                                      onChange={(e) => updateDatePreference(index, dateIndex, 'afternoon_tea', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="no">No</option>
                                      <option value="with">With Sugar</option>
                                      <option value="without">Without Sugar</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">☕ Afternoon Coffee</label>
                                    <select
                                      value={datePref.afternoon_coffee || 'no'}
                                      onChange={(e) => updateDatePreference(index, dateIndex, 'afternoon_coffee', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="no">No</option>
                                      <option value="with">With Sugar</option>
                                      <option value="without">Without Sugar</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Meals */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                  <label className="flex items-center p-2 border rounded hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      checked={datePref.breakfast || false}
                                      onChange={(e) => updateDatePreference(index, dateIndex, 'breakfast', e.target.checked)}
                                      className="mr-2 h-4 w-4 text-indigo-600"
                                    />
                                    🍳 Breakfast
                                  </label>
                                  <label className="flex items-center p-2 border rounded hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      checked={datePref.lunch || false}
                                      onChange={(e) => updateDatePreference(index, dateIndex, 'lunch', e.target.checked)}
                                      className="mr-2 h-4 w-4 text-indigo-600"
                                    />
                                    🍽️ Lunch
                                  </label>
                                  <label className="flex items-center p-2 border rounded hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      checked={datePref.dinner || false}
                                      onChange={(e) => updateDatePreference(index, dateIndex, 'dinner', e.target.checked)}
                                      className="mr-2 h-4 w-4 text-indigo-600"
                                    />
                                    🍛 Dinner
                                  </label>
                                  <label className="flex items-center p-2 border rounded hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      checked={datePref.packed_lunch || false}
                                      onChange={(e) => updateDatePreference(index, dateIndex, 'packed_lunch', e.target.checked)}
                                      className="mr-2 h-4 w-4 text-indigo-600"
                                    />
                                    📦 Packed Lunch
                                  </label>
                                  <label className="flex items-center p-2 border rounded hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      checked={datePref.packed_dinner || false}
                                      onChange={(e) => updateDatePreference(index, dateIndex, 'packed_dinner', e.target.checked)}
                                      className="mr-2 h-4 w-4 text-indigo-600"
                                    />
                                    📦 Packed Dinner
                                  </label>
                                </div>

                                {/* Departure Time */}
                                <div>
                                  <label className="block text-sm font-medium mb-1">🕐 Departure Time</label>
                                  <input
                                    type="time"
                                    value={datePref.departuretime || ''}
                                    onChange={(e) => updateDatePreference(index, dateIndex, 'departuretime', e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
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
                        <div className="flex items-center"><span className="font-medium mr-2">👤 Age:</span> {reg.age || 'N/A'}</div>
                        <div className="flex items-center"><span className="font-medium mr-2">⚧️ Gender:</span> {reg.gender || 'N/A'}</div>
                        <div className="flex items-center"><span className="font-medium mr-2">📞 Contact:</span> {reg.contact}</div>
                        <div className="flex items-center"><span className="font-medium mr-2">📍 Origin:</span> {reg.origin || 'N/A'}</div>
                      </div>
                      
                      {/* Travel Info */}
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">🚗 Travel Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div><span className="font-medium">Mode:</span> {reg.travelmode}</div>
                          <div><span className="font-medium">Departure:</span> {reg.departure_from_home}</div>
                          <div><span className="font-medium">Arrival:</span> {reg.arrival_at_venue}</div>
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className="flex flex-wrap gap-2">
                        {reg.accommodation && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">🏠 Accommodation</span>}
                        {reg.cot_required && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">🛏️ Cot</span>}
                        {reg.difficultyclimbingstairs && <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">🚶 Stair Help</span>}
                        {reg.recordings && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">📹 Recordings</span>}
                      </div>

                      {/* Special Requests */}
                      {reg.specialrequests && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <span className="font-medium text-sm">💬 Special Requests: </span>
                          <span className="text-sm">{reg.specialrequests}</span>
                        </div>
                      )}

                      {/* Date Preferences */}
                      {reg.datePreferences && reg.datePreferences.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-3">📅 Daily Preferences</h4>
                          <div className="space-y-3">
                            {reg.datePreferences.map((datePref, dateIndex) => (
                              <div key={dateIndex} className="bg-white p-3 rounded-lg border">
                                <div className="font-medium text-sm mb-2 text-indigo-600">📆 {datePref.date}</div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                                  <div>☕ Tea: {datePref.morning_tea === 'no' ? 'No' : datePref.morning_tea === 'with' ? 'With Sugar' : 'Without Sugar'}</div>
                                  <div>☕ Coffee: {datePref.morning_coffee === 'no' ? 'No' : datePref.morning_coffee === 'with' ? 'With Sugar' : 'Without Sugar'}</div>
                                  <div>🫖 A.Tea: {datePref.afternoon_tea === 'no' ? 'No' : datePref.afternoon_tea === 'with' ? 'With Sugar' : 'Without Sugar'}</div>
                                  <div>☕ A.Coffee: {datePref.afternoon_coffee === 'no' ? 'No' : datePref.afternoon_coffee === 'with' ? 'With Sugar' : 'Without Sugar'}</div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {datePref.breakfast && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">🍳 Breakfast</span>}
                                  {datePref.lunch && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">🍽️ Lunch</span>}
                                  {datePref.dinner && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">🍛 Dinner</span>}
                                  {datePref.packed_lunch && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs">📦 P.Lunch</span>}
                                  {datePref.packed_dinner && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs">📦 P.Dinner</span>}
                                  {datePref.departuretime && <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">🕐 {datePref.departuretime}</span>}
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
      </main>
    </div>
  );
}