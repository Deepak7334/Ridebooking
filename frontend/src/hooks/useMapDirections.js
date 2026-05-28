import { useState, useCallback, useEffect, useRef } from 'react';

const useMapDirections = () => {
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const directionsServiceRef = useRef(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }
  }, []);

  const calculateRoute = useCallback(async (origin, destination, travelMode = 'DRIVING') => {
    if (!directionsServiceRef.current) {
      // Initialize if not already done
      if (window.google && window.google.maps) {
        directionsServiceRef.current = new window.google.maps.DirectionsService();
      } else {
        setError('Google Maps API not loaded');
        return null;
      }
    }

    if (!origin || !destination) {
      setError('Origin and destination are required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await directionsServiceRef.current.route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode[travelMode],
        unitSystem: window.google.maps.UnitSystem.METRIC,
      });

      setDirections(response);
      
      if (response.routes.length > 0) {
        const leg = response.routes[0].legs[0];
        setDistance(leg.distance);
        setDuration(leg.duration);
      }

      setLoading(false);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to calculate route');
      setLoading(false);
      return null;
    }
  }, []);

  const clearDirections = useCallback(() => {
    setDirections(null);
    setDistance(null);
    setDuration(null);
    setError(null);
  }, []);

  const getDistanceMatrix = useCallback(async (origins, destinations, travelMode = 'DRIVING') => {
    if (!window.google || !window.google.maps) {
      setError('Google Maps API not loaded');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const service = new window.google.maps.DistanceMatrixService();
      const response = await service.getDistanceMatrix({
        origins,
        destinations,
        travelMode: window.google.maps.TravelMode[travelMode],
        unitSystem: window.google.maps.UnitSystem.METRIC,
      });

      setLoading(false);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to get distance matrix');
      setLoading(false);
      return null;
    }
  }, []);

  return {
    directions,
    distance,
    duration,
    error,
    loading,
    calculateRoute,
    clearDirections,
    getDistanceMatrix,
  };
};

export default useMapDirections;
