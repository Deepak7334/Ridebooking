import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { AUTH_ENDPOINTS } from '../api/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await axiosInstance.get(AUTH_ENDPOINTS.LOGIN);
        setUser(response.data.user);
      } catch (err) {
        localStorage.removeItem('authToken');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, credentials);
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await axiosInstance.post(AUTH_ENDPOINTS.REGISTER, userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const verifyOTP = async (otp) => {
    try {
      setError(null);
      const response = await axiosInstance.post(AUTH_ENDPOINTS.OTP_VERIFY, { otp });
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    verifyOTP,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
