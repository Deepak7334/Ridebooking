import React, { useState } from 'react';
import { AlertTriangle, Phone, X, Bell } from 'lucide-react';
import axiosInstance from '../../api/axios';

const SOSButton = ({ rideId, userLocation }) => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Emergency contacts - in production, these would come from user profile
  const emergencyContacts = [
    { name: 'Police', phone: '100' },
    { name: 'Ambulance', phone: '102' },
    { name: 'Emergency Helpline', phone: '112' },
  ];

  const handleSOS = async () => {
    setIsActive(true);
    setMessage('Sending emergency alert...');
    
    try {
      // In production, this would call an actual SOS API
      // await axiosInstance.post('/api/emergency/sos', {
      //   rideId,
      //   location: userLocation,
      //   timestamp: new Date()
      // });
      
      setMessage('Emergency alert sent! Authorities have been notified.');
      
      // Play alert sound (in production)
      // const audio = new Audio('/emergency-alert.mp3');
      // audio.play();
      
    } catch (error) {
      setMessage('Failed to send alert. Please call emergency services directly.');
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = () => {
    setIsActive(false);
    setMessage('');
  };

  return (
    <div className="relative">
      {/* SOS Button */}
      <button
        onClick={handleSOS}
        disabled={loading}
        className="fixed bottom-6 right-6 w-16 h-16 bg-red-600 rounded-full shadow-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center z-50 animate-pulse"
        title="Emergency SOS"
      >
        <AlertTriangle size={28} className="text-white" />
      </button>

      {/* SOS Modal */}
      {isActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Bell className="text-red-600 animate-pulse" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Emergency SOS</h2>
              </div>
              <button onClick={cancelSOS} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Status Message */}
            <div className={`p-4 rounded-lg mb-4 ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <p className="text-sm font-medium">{message || 'Processing emergency alert...'}</p>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-medium">Quick Dial:</p>
              {emergencyContacts.map((contact, index) => (
                <a
                  key={index}
                  href={`tel:${contact.phone}`}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="font-medium text-gray-800">{contact.name}</span>
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Phone size={16} />
                    <span className="font-semibold">{contact.phone}</span>
                  </div>
                </a>
              ))}
            </div>

            {/* Cancel Button */}
            <button
              onClick={cancelSOS}
              className="w-full mt-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>

            {/* Share Ride Location */}
            <button
              onClick={() => {
                const locationUrl = userLocation 
                  ? `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`
                  : '';
                const text = `EMERGENCY! My Rapido ride location: ${locationUrl}`;
                navigator.clipboard.writeText(text);
                alert('Location copied to clipboard!');
              }}
              className="w-full mt-2 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Share My Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSButton;
