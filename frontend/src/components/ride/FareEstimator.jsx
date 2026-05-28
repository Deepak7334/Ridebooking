import React, { useState, useEffect } from 'react';
import { Car, Bike, ArrowRight, Clock, MapPin } from 'lucide-react';

const FareEstimator = ({ pickup, dropoff, distance, duration, onSelectFare, loading }) => {
  const [estimates, setEstimates] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('car');

  // Base fare and per km/min rates (can be customized based on backend response)
  const baseFare = {
    car: 50,
    auto: 30,
    bike: 20,
  };

  const perKm = {
    car: 15,
    auto: 10,
    bike: 8,
  };

  const perMin = {
    car: 2,
    auto: 1.5,
    bike: 1,
  };

  const vehicles = [
    {
      id: 'car',
      name: 'Car',
      icon: <Car size={24} />,
      description: 'Comfortable rides',
    },
    {
      id: 'auto',
      name: 'Auto',
      icon: <Car size={24} className="transform rotate-180" />,
      description: 'Affordable rides',
    },
    {
      id: 'bike',
      name: 'Bike',
      icon: <Bike size={24} />,
      description: 'Quick rides',
    },
  ];

  useEffect(() => {
    if (distance && duration) {
      // Calculate estimates based on distance and duration
      const calculatedEstimates = vehicles.reduce((acc, vehicle) => {
        const base = baseFare[vehicle.id];
        const kmCost = parseFloat(distance) * perKm[vehicle.id];
        const minCost = parseFloat(duration) * perMin[vehicle.id];
        
        acc[vehicle.id] = {
          fare: Math.round(base + kmCost + minCost),
          perKm: perKm[vehicle.id],
          perMin: perMin[vehicle.id],
        };
        return acc;
      }, {});

      setEstimates(calculatedEstimates);
    }
  }, [distance, duration]);

  const handleSelect = (vehicleId) => {
    setSelectedVehicle(vehicleId);
    if (estimates && onSelectFare) {
      onSelectFare({
        vehicle: vehicleId,
        fare: estimates[vehicleId].fare,
        distance,
        duration,
      });
    }
  };

  if (!distance || !duration) {
    return (
      <div className="bg-white rounded-xl p-4 text-center text-gray-500">
        <MapPin size={24} className="mx-auto mb-2" />
        <p>Enter pickup and dropoff locations to see fare estimates</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Select Ride</h3>
        <div className="text-sm text-gray-500">
          {distance} km • {duration} min
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : estimates ? (
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              onClick={() => handleSelect(vehicle.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                selectedVehicle === vehicle.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className={`mr-3 ${selectedVehicle === vehicle.id ? 'text-indigo-600' : 'text-gray-600'}`}>
                  {vehicle.icon}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">{vehicle.name}</p>
                  <p className="text-xs text-gray-500">{vehicle.description}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-right mr-2">
                  <p className="font-bold text-gray-800">₹{estimates[vehicle.id].fare}</p>
                </div>
                <ArrowRight 
                  size={18} 
                  className={`transition-colors ${
                    selectedVehicle === vehicle.id 
                      ? 'text-indigo-600' 
                      : 'text-gray-300'
                  }`} 
                />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          Calculating estimates...
        </div>
      )}

      {/* Fare Breakdown */}
      {estimates && selectedVehicle && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Fare Details</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Fare</span>
            <span className="font-medium">₹{baseFare[selectedVehicle]}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">{distance} km × ₹{estimates[selectedVehicle].perKm}/km</span>
            <span className="font-medium">₹{Math.round(distance * estimates[selectedVehicle].perKm)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">{duration} min × ₹{estimates[selectedVehicle].perMin}/min</span>
            <span className="font-medium">₹{Math.round(duration * estimates[selectedVehicle].perMin)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100 font-semibold">
            <span className="text-gray-800">Total Estimate</span>
            <span className="text-indigo-600">₹{estimates[selectedVehicle].fare}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FareEstimator;
