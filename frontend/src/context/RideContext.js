import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from '../api/axios';
import { RIDE_ENDPOINTS } from '../api/endpoints';

const RideContext = createContext(null);

export const RideProvider = ({ children }) => {
  const [currentRide, setCurrentRide] = useState(null);
  const [rideStatus, setRideStatus] = useState(null); // 'searching', 'driver-assigned', 'arriving', 'in-progress', 'completed', 'cancelled'
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null); // Driver's live location

  const createRide = async (rideData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.post(RIDE_ENDPOINTS.CREATE_RIDE, rideData);
      setCurrentRide(response.data.ride);
      setRideStatus('searching');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmRide = async (rideId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(RIDE_ENDPOINTS.CONFIRM_RIDE.replace(':id', rideId));
      setCurrentRide(response.data.ride);
      setRideStatus('driver-assigned');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async (rideId) => {
    try {
      setLoading(true);
      await axiosInstance.post(RIDE_ENDPOINTS.CANCEL_RIDE.replace(':id', rideId));
      setCurrentRide(null);
      setRideStatus(null);
      setPickupLocation(null);
      setDropoffLocation(null);
      setEstimatedFare(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const estimateFare = async (pickup, dropoff, vehicleType) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(RIDE_ENDPOINTS.ESTIMATE_FARE, {
        pickup,
        dropoff,
        vehicleType,
      });
      setEstimatedFare(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to estimate fare');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDrivers = async (location) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(RIDE_ENDPOINTS.GET_NEARBY_DRIVERS, {
        params: location,
      });
      setAvailableDrivers(response.data.drivers);
      return response.data.drivers;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get drivers');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = useCallback((status) => {
    setRideStatus(status);
  }, []);

  const updateRideDetails = useCallback((rideDetails) => {
    setCurrentRide((prev) => ({ ...prev, ...rideDetails }));
  }, []);

  const resetRide = useCallback(() => {
    setCurrentRide(null);
    setRideStatus(null);
    setPickupLocation(null);
    setDropoffLocation(null);
    setEstimatedFare(null);
    setAvailableDrivers([]);
    setSelectedVehicle(null);
  }, []);

  const value = {
    currentRide,
    rideStatus,
    pickupLocation,
    dropoffLocation,
    estimatedFare,
    availableDrivers,
    selectedVehicle,
    loading,
    error,
    createRide,
    confirmRide,
    cancelRide,
    estimateFare,
    getAvailableDrivers,
    updateRideStatus,
    updateRideDetails,
    resetRide,
    setPickupLocation,
    setDropoffLocation,
    setSelectedVehicle,
  };

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};

export default RideContext;
