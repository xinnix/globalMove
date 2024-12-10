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
          const { data: userData } = await authApi.getProfile();
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
      const { data: response } = await authApi.login(credentials);
      localStorage.setItem('token', response.token);
      
      // 直接使用登录响应中的用户信息
      const userData = {
        id: response.userId,
        username: response.username
      };
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (userData) => {
    try {
      const { data: response } = await authApi.register(userData);
      localStorage.setItem('token', response.token);
      
      // 直接使用注册响应中的用户信息
      const profile = {
        id: response.userId,
        username: response.username
      };
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Registration error:', error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
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
