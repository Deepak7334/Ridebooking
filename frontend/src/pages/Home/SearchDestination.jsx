import React from 'react';
import { Navigation, MapPin } from 'lucide-react';

const SearchDestination = ({ pickupLocation, setPickupLocation, dropoffLocation, setDropoffLocation, onSearch }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full md:w-1/3 h-fit z-10">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Where to?</h2>
      
      <div className="space-y-4">
        {/* Pickup Location */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
          <Navigation size={20} className="text-indigo-500 mr-3" />
          <input 
            type="text" 
            placeholder="Current Location"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="bg-transparent w-full focus:outline-none text-sm"
          />
        </div>

        {/* Drop Location */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
          <MapPin size={20} className="text-red-500 mr-3" />
          <input 
            type="text" 
            placeholder="Enter destination"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            className="bg-transparent w-full focus:outline-none text-sm"
          />
        </div>

        <button 
          onClick={onSearch}
          className="w-full py-3.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors mt-4"
        >
          Search Rides
        </button>
      </div>
    </div>
  );
};

export default SearchDestination;
