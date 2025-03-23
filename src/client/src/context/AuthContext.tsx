import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (localStorage.getItem('token')) {
        setAuthToken(localStorage.getItem('token'));
        
        try {
          const res = await axios.get('/api/auth/user');
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('token');
          setAuthToken(null);
          setError('Session expired, please login again');
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Set Auth token for all axios requests
  const setAuthToken = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      const { token, user } = res.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set auth token in headers
      setAuthToken(token);
      
      setUser(user);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      localStorage.removeItem('token');
      setAuthToken(null);
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  // Register user
  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/register', { 
        username, 
        email, 
        password 
      });
      
      const { token, user } = res.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set auth token in headers
      setAuthToken(token);
      
      setUser(user);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      localStorage.removeItem('token');
      setAuthToken(null);
      setError(err.response?.data?.msg || 'Registration failed');
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Clear any auth errors
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
