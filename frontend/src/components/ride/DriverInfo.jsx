import React from 'react';
import { Star, Phone, MessageSquare, Car } from 'lucide-react';

const DriverInfo = ({ driver, onCall, onMessage, compact }) => {
  if (!driver) {
    return (
      <div className="bg-white rounded-xl p-4 text-center text-gray-500">
        No driver information available
      </div>
    );
  }

  const defaultDriver = {
    name: 'Driver',
    phone: '',
    vehicle: '',
    plate: '',
    rating: 0,
    ...driver,
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-semibold text-indigo-600">
              {defaultDriver.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">{defaultDriver.name}</p>
            <div className="flex items-center text-xs text-gray-500">
              <Star size={12} className="text-yellow-500 fill-current mr-1" />
              {defaultDriver.rating}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {defaultDriver.phone && (
            <>
              <button
                onClick={() => onMessage?.(defaultDriver.phone)}
                className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
              >
                <MessageSquare size={14} className="text-blue-600" />
              </button>
              <button
                onClick={() => onCall?.(defaultDriver.phone)}
                className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
              >
                <Phone size={14} className="text-green-600" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-xl font-bold text-indigo-600">
              {defaultDriver.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-lg">{defaultDriver.name}</p>
            <div className="flex items-center mt-1">
              <Star size={16} className="text-yellow-500 fill-current" />
              <span className="ml-1 font-medium">{defaultDriver.rating}</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-gray-600">{defaultDriver.vehicle || 'Vehicle'}</span>
            </div>
          </div>
        </div>
      </div>

      {defaultDriver.plate && (
        <div className="bg-gray-100 rounded-lg p-2 mb-4 text-center">
          <p className="font-medium text-gray-700">{defaultDriver.plate}</p>
        </div>
      )}

      <div className="flex space-x-3">
        {defaultDriver.phone && (
          <>
            <button
              onClick={() => onMessage?.(defaultDriver.phone)}
              className="flex-1 py-3 bg-blue-100 rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors"
            >
              <MessageSquare size={20} className="text-blue-600 mr-2" />
              <span className="font-medium text-blue-600">Message</span>
            </button>
            <button
              onClick={() => onCall?.(defaultDriver.phone)}
              className="flex-1 py-3 bg-green-100 rounded-xl flex items-center justify-center hover:bg-green-200 transition-colors"
            >
              <Phone size={20} className="text-green-600 mr-2" />
              <span className="font-medium text-green-600">Call</span>
            </button>
          </>
        )}
      </div>

      {/* Vehicle Details */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-600">
          <Car size={16} className="mr-2" />
          <span>{defaultDriver.vehicle || 'Vehicle information not available'}</span>
        </div>
      </div>
    </div>
  );
};

export default DriverInfo;
