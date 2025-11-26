import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const createParticipant = () => ({
  id: Date.now() + Math.random(),
  name: "",
  age: "",
  gender: "",
  contact: "",
  origin: "",
  attendingDates: [],
  travelMode: "",
  travelDetails: {
    departureFromHome: "",
    arrivalAtVenue: ""
  },
  datePreferences: {},
  // One-time preferences per participant
  accommodation: false,
  cot: false,
  difficultyClimbing: false,
  localAssistance: false,
  localAssistancePerson: "",
  recordings: false,
  recordingPrograms: "",
  specialRequests: "",
  collapsed: false
});

const createDatePreference = () => ({
  morningTea: "no",
  morningCoffee: "no",
  afternoonTea: "no",
  afternoonCoffee: "no",
  breakfast: false,
  lunch: false,
  dinner: false,
  packedLunch: false,
  packedDinner: false,
  departureTime: ""
});

const localAssistancePeople = [
  { name: "Shailesh Bhanage", contact: "9850860130" },
  {name : "Shriram Gokhale", contact : "9422628811"}
];

export default function Registrations() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [participants, setParticipants] = useState([createParticipant()]);
  const [formData, setFormData] = useState({
    event: "",
    contact: ""
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addParticipant = () => {
    setParticipants(prev => [...prev, createParticipant()]);
  };

  const removeParticipant = (index) => {
    if (participants.length > 1) {
      setParticipants(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index, field, value) => {
    setParticipants(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const updateTravelDetails = (index, field, value) => {
    setParticipants(prev => prev.map((p, i) => 
      i === index ? { 
        ...p, 
        travelDetails: { ...p.travelDetails, [field]: value }
      } : p
    ));
  };

  const updateDatePreference = (index, dateStr, field, value) => {
    setParticipants(prev => prev.map((p, i) => {
      if (i !== index) return p;
      const newPrefs = { ...p.datePreferences };
      if (!newPrefs[dateStr]) newPrefs[dateStr] = createDatePreference();
      newPrefs[dateStr] = { ...newPrefs[dateStr], [field]: value };
      return { ...p, datePreferences: newPrefs };
    }));
  };

  const onDatesChange = (index, selectedDates) => {
    const dates = Array.isArray(selectedDates) ? selectedDates : selectedDates ? [selectedDates] : [];
    // Sort dates chronologically
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    
    setParticipants(prev => prev.map((p, i) => {
      if (i !== index) return p;
      const newPrefs = { ...p.datePreferences };
      sortedDates.forEach(date => {
        // Fix timezone issue by using local date string
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${day}-${month}-${year}`;
        if (!newPrefs[dateStr]) newPrefs[dateStr] = createDatePreference();
      });
      return { ...p, attendingDates: sortedDates, datePreferences: newPrefs };
    }));
  };

  const copyPreferences = (fromIndex, toIndex) => {
    const fromParticipant = participants[fromIndex];
    setParticipants(prev => prev.map((p, i) => {
      if (i !== toIndex) return p;
      return {
        ...p,
        origin: fromParticipant.origin,
        attendingDates: [...fromParticipant.attendingDates],
        travelMode: fromParticipant.travelMode,
        travelDetails: { ...fromParticipant.travelDetails },
        datePreferences: JSON.parse(JSON.stringify(fromParticipant.datePreferences)),
        accommodation: fromParticipant.accommodation,
        cot: fromParticipant.cot,
        difficultyClimbing: fromParticipant.difficultyClimbing,
        localAssistance: fromParticipant.localAssistance,
        localAssistancePerson: fromParticipant.localAssistancePerson,
        recordings: fromParticipant.recordings,
        recordingPrograms: fromParticipant.recordingPrograms,
        specialRequests: fromParticipant.specialRequests
      };
    }));
  };

  const toggleCollapse = (index) => {
    setParticipants(prev => prev.map((p, i) => 
      i === index ? { ...p, collapsed: !p.collapsed } : p
    ));
  };

  const validateForm = () => {
    if (!formData.event) {
      alert("Please select an event");
      return false;
    }

    const primaryEmail = user?.emailAddresses?.[0]?.emailAddress;
    if (!primaryEmail) {
      alert("Please ensure you are logged in with a valid email");
      return false;
    }

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.name) {
        alert(`Please enter name for participant ${i + 1}`);
        return false;
      }
      if (!p.contact) {
        alert(`Please enter contact number for participant ${i + 1}`);
        return false;
      }
      if (p.attendingDates.length === 0) {
        alert(`Please select attending dates for ${p.name}`);
        return false;
      }
      if (!p.travelMode) {
        alert(`Please select travel mode for ${p.name}`);
        return false;
      }
      if (!p.travelDetails.departureFromHome) {
        alert(`Please enter departure time from hometown for ${p.name}`);
        return false;
      }
      if (!p.travelDetails.arrivalAtVenue) {
        alert(`Please enter arrival time at venue for ${p.name}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const generatePDF = async () => {
    const element = document.getElementById('registration-preview');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${formData.event}-registration-${Date.now()}.pdf`);
  };

  const confirmSubmission = async () => {
    setIsSubmitting(true);
    const primaryEmail = user?.emailAddresses?.[0]?.emailAddress;

    // Prepare data for FastAPI
    const registrationData = {
      event: formData.event,
      contactEmail: primaryEmail,
      contactNumber: formData.contact,
      totalParticipants: participants.length,
      participants: participants.map((p, index) => {
        // Get actual attending dates for this specific participant
        const actualAttendingDates = p.attendingDates.map(d => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${day}-${month}-${year}`;
        });

        // Only include date preferences for dates this participant is actually attending
        const relevantDatePreferences = actualAttendingDates.map(dateStr => {
          // Convert DD-MM-YYYY to YYYY-MM-DD for lookup in datePreferences
          const [day, month, year] = dateStr.split('-');
          const lookupKey = `${year}-${month}-${day}`;
          const datePrefs = p.datePreferences[lookupKey] || createDatePreference();
          
          return {
            date: dateStr, // DD-MM-YYYY format
            morningTea: datePrefs.morningTea,
            morningCoffee: datePrefs.morningCoffee,
            afternoonTea: datePrefs.afternoonTea,
            afternoonCoffee: datePrefs.afternoonCoffee,
            breakfast: datePrefs.breakfast,
            lunch: datePrefs.lunch,
            dinner: datePrefs.dinner,
            packedLunch: datePrefs.packedLunch,
            packedDinner: datePrefs.packedDinner,
            departureTime: datePrefs.departureTime
          };
        });

        const participantData = {
          name: p.name,
          age: p.age || null,
          gender: p.gender || null,
          origin: p.origin || null,
          contactNumber: p.contact || null,
          attendingDates: actualAttendingDates,
          travelMode: p.travelMode,
          travelDetails: {
            departureFromHome: p.travelDetails.departureFromHome,
            arrivalAtVenue: p.travelDetails.arrivalAtVenue
          },
          accommodation: p.accommodation,
          cot: p.cot,
          difficultyClimbingStairs: p.difficultyClimbing,
          localAssistance: p.localAssistance,
          localAssistancePerson: p.localAssistance ? (p.localAssistancePerson || null) : null,
          recordings: p.recordings,
          recordingPrograms: p.recordings ? (p.recordingPrograms || null) : null,
          specialRequests: p.specialRequests || null,
          datePreferences: relevantDatePreferences
        };
        return participantData;
      })
    };

    // Send to FastAPI server
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      if (response.ok) {
        const result = await response.json();
        alert("Registration submitted successfully to the server!");
        console.log("Server response:", result);
        setShowPreview(false);
      } else {
        throw new Error('Failed to submit registration');
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert("Error submitting registration. Please check if the FastAPI server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div id="registration-preview" className="max-w-4xl mx-auto p-8 bg-white">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-indigo-600 pb-6">
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">Rajaram Gurukul</h1>
            <h2 className="text-xl font-semibold text-gray-800">Registration Confirmation</h2>
            <p className="text-gray-600 mt-2">{formData.event}</p>
          </div>

          {/* Contact Info */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-medium">Email:</span> {user?.emailAddresses?.[0]?.emailAddress}</div>
              <div><span className="font-medium">Phone:</span> {formData.contact}</div>
            </div>
          </div>

          {/* Participants */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-6 text-gray-800">Participants ({participants.length})</h3>
            {participants.map((p, index) => (
              <div key={index} className="mb-8 border border-gray-200 rounded-lg p-6">
                <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                  <h4 className="text-lg font-semibold text-indigo-800">Participant {index + 1}: {p.name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div><span className="font-medium">Age:</span> {p.age || 'N/A'}</div>
                    <div><span className="font-medium">Gender:</span> {p.gender || 'N/A'}</div>
                    <div><span className="font-medium">Contact:</span> {p.contact}</div>
                    <div><span className="font-medium">Origin:</span> {p.origin}</div>
                  </div>
                </div>

                {/* Attending Dates */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Attending Dates:</h5>
                  <div className="flex flex-wrap gap-2">
                    {p.attendingDates.map(date => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return (
                        <span key={`${day}-${month}-${year}`} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {`${day}/${month}/${year}`}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Travel Details */}
                <div className="mb-4 bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-700 mb-2">Travel Information:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="font-medium">Mode:</span> {p.travelMode}</div>
                    <div><span className="font-medium">Departure:</span> {p.travelDetails.departureFromHome}</div>
                    <div><span className="font-medium">Arrival:</span> {p.travelDetails.arrivalAtVenue}</div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Preferences:</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {p.accommodation && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Accommodation</span>}
                    {p.cot && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Cot</span>}
                    {p.difficultyClimbing && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">Stair Assistance</span>}
                    {p.localAssistance && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Local Help: {p.localAssistancePerson}</span>}
                    {p.recordings && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Recordings: {p.recordingPrograms}</span>}
                  </div>
                  {p.specialRequests && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Special Requests: </span>
                      <span className="text-sm text-gray-600">{p.specialRequests}</span>
                    </div>
                  )}
                </div>

                {/* Daily Preferences */}
                {p.attendingDates.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-3">Daily Meal & Beverage Preferences:</h5>
                    {p.attendingDates.sort((a, b) => a.getTime() - b.getTime()).map((date, dateIndex) => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      const prefs = p.datePreferences[dateStr] || createDatePreference();
                      const isLastDay = dateIndex === p.attendingDates.length - 1;
                      
                      return (
                        <div key={dateStr} className="mb-3 border-l-4 border-indigo-300 pl-4">
                          <h6 className="font-medium text-sm mb-2">{`${day}/${month}/${year}`} {isLastDay && <span className="text-orange-600">(Last Day)</span>}</h6>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>Morning Tea: <span className="font-medium">{prefs.morningTea === 'no' ? 'No' : prefs.morningTea === 'with' ? 'With Sugar' : 'Without Sugar'}</span></div>
                            <div>Morning Coffee: <span className="font-medium">{prefs.morningCoffee === 'no' ? 'No' : prefs.morningCoffee === 'with' ? 'With Sugar' : 'Without Sugar'}</span></div>
                            <div>Afternoon Tea: <span className="font-medium">{prefs.afternoonTea === 'no' ? 'No' : prefs.afternoonTea === 'with' ? 'With Sugar' : 'Without Sugar'}</span></div>
                            <div>Afternoon Coffee: <span className="font-medium">{prefs.afternoonCoffee === 'no' ? 'No' : prefs.afternoonCoffee === 'with' ? 'With Sugar' : 'Without Sugar'}</span></div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {prefs.breakfast && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Breakfast</span>}
                            {prefs.lunch && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Lunch</span>}
                            {prefs.dinner && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Dinner</span>}
                            {prefs.packedLunch && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Packed Lunch</span>}
                            {prefs.packedDinner && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Packed Dinner</span>}
                            {prefs.departureTime && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Departure: {prefs.departureTime}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>Generated on {new Date().toLocaleString()}</p>
            <p>Rajaram Gurukul - Utsav Registration System</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Edit
            </button>
            <div className="flex space-x-4">
	     {/*<button
                onClick={generatePDF}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📄 Download PDF
              </button>*/}
              <button
                onClick={confirmSubmission}
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : '✅ Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/')}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                ← Back to Home
              </button>
              <h2 className="text-2xl font-bold text-indigo-600">Rajaram Gurukul</h2>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Register for Utsav
          </h1>
          <p className="text-lg text-gray-600">
            Complete registration with participant details and preferences
          </p>
          <button
            onClick={() => navigate('/edit-registrations')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Already Registered? Edit Here
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event & Contact Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">Event & Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event *
                </label>
                <select 
                  value={formData.event}
                  onChange={(e) => setFormData(prev => ({ ...prev, event: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Choose an event...</option>
                  <option value="annual-utsav-jan">January Utsav - Jan 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <input 
                  type="email" 
                  value={user?.emailAddresses?.[0]?.emailAddress || ''}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-indigo-600 mt-1">✓ From your Clerk account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input 
                  type="tel" 
                  value={formData.contact}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only numbers
                    if (value.length <= 10) {
                      setFormData(prev => ({ ...prev, contact: value }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="10-digit phone number"
                  required
                  pattern="[0-9]{10}"
                  maxLength="10"
                />
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Participants ({participants.length})</h3>
              <button
                type="button"
                onClick={addParticipant}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                + Add Participant
              </button>
            </div>

            <div className="space-y-6">
              {participants.map((participant, index) => (
                <div key={participant.id} className="border border-gray-200 rounded-xl p-4">
                  {/* Participant Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => toggleCollapse(index)}
                        className="text-lg font-medium text-gray-800 hover:text-indigo-600"
                      >
                        {participant.collapsed ? '▶' : '▼'} Participant {index + 1}
                        {participant.name && ` - ${participant.name}`}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {index > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              copyPreferences(parseInt(e.target.value), index);
                              e.target.value = "";
                            }
                          }}
                          className="text-sm px-2 py-1 border rounded"
                        >
                          <option value="">Copy from...</option>
                          {participants.slice(0, index).map((p, i) => (
                            <option key={i} value={i}>
                              {p.name || `Participant ${i + 1}`}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {participants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParticipant(index)}
                          className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {!participant.collapsed && (
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                          placeholder="Full Name *"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                        <input
                          type="number"
                          value={participant.age}
                          onChange={(e) => updateParticipant(index, 'age', e.target.value)}
                          placeholder="Age"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <select
                          value={participant.gender}
                          onChange={(e) => updateParticipant(index, 'gender', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="tel"
                          value={participant.contact}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Only numbers
                            if (value.length <= 10) {
                              updateParticipant(index, 'contact', value);
                            }
                          }}
                          placeholder="Contact Number *"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          required
                          pattern="[0-9]{10}"
                          maxLength="10"
                        />
                        <input
                          type="text"
                          value={participant.origin}
                          onChange={(e) => updateParticipant(index, 'origin', e.target.value)}
                          placeholder="Origin/Place"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Attending Dates */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attending Dates *
                        </label>
                        <DayPicker
                          mode="multiple"
                          selected={participant.attendingDates}
                          onSelect={(dates) => onDatesChange(index, dates)}
                          className="border border-gray-300 rounded-lg p-3"
                          defaultMonth={new Date(2026, 0)} // January 2026
                          fromMonth={new Date(2026, 0)} // January 2026
                          toMonth={new Date(2026, 0)} // January 2026
                          disabled={[
                            { before: new Date(2026, 0, 19) }, // Before Jan 19
                            { after: new Date(2026, 0, 22) },  // After Jan 22
                            // Disable all dates except 19, 20, 21, 22
                            (date) => {
                              const day = date.getDate();
                              const month = date.getMonth();
                              const year = date.getFullYear();
                              return year !== 2026 || month !== 0 || ![19, 20, 21, 22].includes(day);
                            }
                          ]}
                        />
                        {participant.attendingDates.length > 0 && (
                          <p className="text-sm text-gray-600 mt-2">
                            Selected: {participant.attendingDates.map(d => {
                              const year = d.getFullYear();
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const day = String(d.getDate()).padStart(2, '0');
                              return `${day}/${month}/${year}`;
                            }).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Travel Details */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Travel Mode *
                        </label>
                        <select
                          value={participant.travelMode}
                          onChange={(e) => updateParticipant(index, 'travelMode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select Travel Mode</option>
                          <option value="Bus">Bus</option>
                          <option value="Train">Train</option>
                          <option value="Car">Car</option>
                          <option value="Flight">Flight</option>
                        </select>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Departure Time from Hometown *
                            </label>
                            <input
                              type="time"
                              value={participant.travelDetails.departureFromHome}
                              onChange={(e) => updateTravelDetails(index, 'departureFromHome', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Arrival Time at Venue *
                            </label>
                            <input
                              type="time"
                              value={participant.travelDetails.arrivalAtVenue}
                              onChange={(e) => updateTravelDetails(index, 'arrivalAtVenue', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* One-time Preferences */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">General Preferences</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Accommodation */}
                          <div>
                            <label className="block text-sm font-medium mb-2">Accommodation</label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={participant.accommodation}
                                  onChange={(e) => updateParticipant(index, 'accommodation', e.target.checked)}
                                  className="mr-2"
                                />
                                Need Accommodation
                              </label>
                              {participant.accommodation && (
                                <label className="flex items-center ml-4">
                                  <input
                                    type="checkbox"
                                    checked={participant.cot}
                                    onChange={(e) => updateParticipant(index, 'cot', e.target.checked)}
                                    className="mr-2"
                                  />
                                  Need Cot
                                </label>
                              )}
                            </div>
                          </div>

                          {/* Assistance */}
                          <div>
                            <label className="block text-sm font-medium mb-2">Assistance Needed</label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={participant.difficultyClimbing}
                                  onChange={(e) => updateParticipant(index, 'difficultyClimbing', e.target.checked)}
                                  className="mr-2"
                                />
                                Difficulty Climbing Stairs
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={participant.localAssistance}
                                  onChange={(e) => {
                                    updateParticipant(index, 'localAssistance', e.target.checked);
                                    if (!e.target.checked) {
                                      updateParticipant(index, 'localAssistancePerson', '');
                                    }
                                  }}
                                  className="mr-2"
                                />
                                Local Assistance
                              </label>
                              {participant.localAssistance && (
                                <div className="mt-2 ml-6">
                                  <label className="block text-sm font-medium mb-1">Select Assistant</label>
                                  <select
                                    value={participant.localAssistancePerson}
                                    onChange={(e) => updateParticipant(index, 'localAssistancePerson', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="">Choose assistant...</option>
                                    {localAssistancePeople.map((person, i) => (
                                      <option key={i} value={person.name}>
                                        {person.name} - {person.contact}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={participant.recordings}
                                  onChange={(e) => updateParticipant(index, 'recordings', e.target.checked)}
                                  className="mr-2"
                                />
                                Need Recordings
                              </label>
                              {participant.recordings && (
                                <input
                                  type="text"
                                  value={participant.recordingPrograms}
                                  onChange={(e) => updateParticipant(index, 'recordingPrograms', e.target.value)}
                                  placeholder="Enter program/recording names..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 ml-6"
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Special Requests */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Special Requests (Optional)
                          </label>
                          <textarea
                            value={participant.specialRequests}
                            onChange={(e) => updateParticipant(index, 'specialRequests', e.target.value)}
                            placeholder="Any special requests or requirements..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            rows="3"
                          />
                        </div>
                      </div>

                      {/* Date-wise Preferences */}
                      {participant.attendingDates.length > 0 && (
                        <div>
                          <h4 className="text-lg font-medium text-gray-800 mb-4">Daily Meal & Beverage Preferences</h4>
                          {participant.attendingDates
                            .sort((a, b) => a.getTime() - b.getTime()) // Sort dates chronologically
                            .map((date, dateIndex) => {
                            // Fix timezone issue by using local date string
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateStr = `${year}-${month}-${day}`;
                            const prefs = participant.datePreferences[dateStr] || createDatePreference();
                            const isLastDay = dateIndex === participant.attendingDates.length - 1;
                            
                            return (
                              <div key={dateStr} className="border border-gray-200 rounded-lg p-4 mb-4">
                                <h5 className="font-medium mb-3">
                                  {`${day}/${month}/${year}`} {isLastDay && <span className="text-sm text-orange-600">(Last Day)</span>}
                                </h5>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Morning Tea */}
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Morning Tea</label>
                                    <div className="space-y-1">
                                      {['no', 'with', 'without'].map(option => (
                                        <label key={option} className="flex items-center">
                                          <input
                                            type="radio"
                                            name={`morningTea-${index}-${dateStr}`}
                                            value={option}
                                            checked={prefs.morningTea === option}
                                            onChange={(e) => updateDatePreference(index, dateStr, 'morningTea', e.target.value)}
                                            className="mr-2"
                                          />
                                          {option === 'no' ? 'No' : option === 'with' ? 'With Sugar' : 'Without Sugar'}
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Morning Coffee */}
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Morning Coffee</label>
                                    <div className="space-y-1">
                                      {['no', 'with', 'without'].map(option => (
                                        <label key={option} className="flex items-center">
                                          <input
                                            type="radio"
                                            name={`morningCoffee-${index}-${dateStr}`}
                                            value={option}
                                            checked={prefs.morningCoffee === option}
                                            onChange={(e) => updateDatePreference(index, dateStr, 'morningCoffee', e.target.value)}
                                            className="mr-2"
                                          />
                                          {option === 'no' ? 'No' : option === 'with' ? 'With Sugar' : 'Without Sugar'}
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Afternoon Tea */}
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Afternoon Tea</label>
                                    <div className="space-y-1">
                                      {['no', 'with', 'without'].map(option => (
                                        <label key={option} className="flex items-center">
                                          <input
                                            type="radio"
                                            name={`afternoonTea-${index}-${dateStr}`}
                                            value={option}
                                            checked={prefs.afternoonTea === option}
                                            onChange={(e) => updateDatePreference(index, dateStr, 'afternoonTea', e.target.value)}
                                            className="mr-2"
                                          />
                                          {option === 'no' ? 'No' : option === 'with' ? 'With Sugar' : 'Without Sugar'}
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Afternoon Coffee */}
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Afternoon Coffee</label>
                                    <div className="space-y-1">
                                      {['no', 'with', 'without'].map(option => (
                                        <label key={option} className="flex items-center">
                                          <input
                                            type="radio"
                                            name={`afternoonCoffee-${index}-${dateStr}`}
                                            value={option}
                                            checked={prefs.afternoonCoffee === option}
                                            onChange={(e) => updateDatePreference(index, dateStr, 'afternoonCoffee', e.target.value)}
                                            className="mr-2"
                                          />
                                          {option === 'no' ? 'No' : option === 'with' ? 'With Sugar' : 'Without Sugar'}
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Meals */}
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Meals</label>
                                    <div className="space-y-2">
                                      {['breakfast', 'lunch', 'dinner'].map(meal => (
                                        <label key={meal} className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={prefs[meal]}
                                            onChange={(e) => updateDatePreference(index, dateStr, meal, e.target.checked)}
                                            className="mr-2"
                                          />
                                          {meal.charAt(0).toUpperCase() + meal.slice(1)}
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Last Day Options */}
                                  {isLastDay && (
                                    <div className="md:col-span-2 lg:col-span-3">
                                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                        <h6 className="font-medium text-orange-800 mb-3">Last Day Departure</h6>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div>
                                            <label className="flex items-center">
                                              <input
                                                type="checkbox"
                                                checked={prefs.packedLunch}
                                                onChange={(e) => updateDatePreference(index, dateStr, 'packedLunch', e.target.checked)}
                                                className="mr-2"
                                              />
                                              Packed Lunch
                                            </label>
                                          </div>
                                          <div>
                                            <label className="flex items-center">
                                              <input
                                                type="checkbox"
                                                checked={prefs.packedDinner}
                                                onChange={(e) => updateDatePreference(index, dateStr, 'packedDinner', e.target.checked)}
                                                className="mr-2"
                                              />
                                              Packed Dinner
                                            </label>
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium mb-1">Departure Time</label>
                                            <input
                                              type="time"
                                              value={prefs.departureTime}
                                              onChange={(e) => updateDatePreference(index, dateStr, 'departureTime', e.target.value)}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button 
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Submit Registration ✨
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}