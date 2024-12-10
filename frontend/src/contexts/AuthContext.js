import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth as authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authApi.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('token', response.token);
      const userData = await authApi.getProfile();
      setUser(userData);
      return userData;
    } catch (error) {
      throw new Error(error.error || 'Login failed');
    }
  };

  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      localStorage.setItem('token', response.token);
      const profile = await authApi.getProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      throw new Error(error.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      await authApi.updateProfile(data);
      const updatedProfile = await authApi.getProfile();
      setUser(updatedProfile);
      return updatedProfile;
    } catch (error) {
      throw new Error(error.error || 'Failed to update profile');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
