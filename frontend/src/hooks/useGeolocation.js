import { useState, useEffect, useCallback } from 'react';

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 0 } = options;

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const success = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setLocation({
        latitude,
        longitude,
        accuracy,
        timestamp: position.timestamp,
      });
      setLoading(false);
    };

    const errorHandler = (err) => {
      let errorMessage;
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location permission denied';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
        default:
          errorMessage = 'An unknown error occurred';
      }
      setError(errorMessage);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(success, errorHandler, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    getLocation();
  }, []);

  return {
    location,
    error,
    loading,
    getLocation,
    watchPosition,
  };
};

export default useGeolocation;
