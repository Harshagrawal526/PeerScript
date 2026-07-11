import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components -- hook lives with its provider; only costs HMR granularity
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = sessionStorage.getItem('token');
      
      if (storedToken) {
        try {
          const { ok, data } = await api.get('/api/auth/me', storedToken);

          if (ok) {
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token invalid, clear it
            sessionStorage.removeItem('token');
            setUser(null);
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check error:', error);
          sessionStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      }
      
      setLoading(false);
      setInitialCheckDone(true);
    };

    checkAuth();
  }, []);

  const register = async (username, email, password) => {
    try {
      const { ok, data } = await api.post('/api/auth/register', { username, email, password });

      if (ok) {
        setUser(data.user);
        setToken(data.token);
        sessionStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return {
          success: false,
          message: data?.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const login = async (email, password) => {
    try {
      const { ok, data } = await api.post('/api/auth/login', { email, password });

      if (ok) {
        setUser(data.user);
        setToken(data.token);
        sessionStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return {
          success: false,
          message: data?.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      initialCheckDone,
      register, 
      login, 
      logout,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};