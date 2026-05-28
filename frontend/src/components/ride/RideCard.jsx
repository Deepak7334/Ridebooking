import React from 'react';
import { MapPin, Clock, Star, Car } from 'lucide-react';

const RideCard = ({ ride, onClick, isActive }) => {
  const statusColors = {
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    in_progress: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      onClick={() => onClick?.(ride)}
      className={`bg-white rounded-xl shadow-sm p-4 mb-3 cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-indigo-500' : ''
      }`}
    >
      {/* Date and Status */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center text-gray-500 text-sm">
          <Clock size={14} className="mr-1" />
          {formatDate(ride.createdAt)} at {formatTime(ride.createdAt)}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ride.status] || 'bg-gray-100 text-gray-700'}`}>
          {ride.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
        </span>
      </div>

      {/* Route Info */}
      <div className="flex items-start mb-3">
        <div className="flex flex-col items-center mr-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="w-0.5 h-8 bg-gray-300"></div>
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 mb-2">{ride.pickup || 'Pickup Location'}</p>
          <p className="text-sm text-gray-600">{ride.dropoff || 'Drop Location'}</p>
        </div>
      </div>

      {/* Trip Details */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex items-center">
          <Car size={16} className="text-gray-400 mr-1" />
          <span className="text-sm text-gray-500">{ride.distance || '0'} km</span>
        </div>
        <div className="flex items-center">
          <Clock size={14} className="text-gray-400 mr-1" />
          <span className="text-sm text-gray-500">{ride.duration || '0'} min</span>
        </div>
        <div className="text-right">
          <p className="font-semibold text-indigo-600">₹{ride.fare || 0}</p>
        </div>
      </div>

      {/* Driver Info (if ride is completed) */}
      {ride.driver && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
              <span className="text-sm font-medium text-indigo-600">
                {ride.driver.name?.charAt(0) || 'D'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{ride.driver.name || 'Driver'}</p>
              <div className="flex items-center">
                <Star size={12} className="text-yellow-500 fill-current" />
                <span className="text-xs text-gray-500 ml-1">{ride.driver.rating || '0'}</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-500">{ride.driver.vehicle || 'Vehicle'}</span>
        </div>
      )}
    </div>
  );
};

export default RideCard;
