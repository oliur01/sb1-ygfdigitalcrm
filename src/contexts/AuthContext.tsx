import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string, company: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchUserData(token);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      setUser(response.data.user);
    } catch (error) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || 'Login failed. Please check your credentials and try again.';
      }
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const register = async (username: string, email: string, password: string, company: string) => {
    try {
      await axios.post('http://localhost:5000/api/auth/register', { username, email, password, company });
    } catch (error) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || 'Registration failed. Please try again.';
      }
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};