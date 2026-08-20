import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api, ApiError } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  demoLogin: (role: 'ADMIN' | 'STUDENT') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('scalora_user');
      if (!savedUser || savedUser === 'undefined' || savedUser === 'null') return null;
      const parsed = JSON.parse(savedUser);
      return (parsed && typeof parsed === 'object' && parsed.role) ? parsed : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('scalora_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('scalora_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ success: boolean; user: User }>('/auth/me');
        if (response.success && response.user) {
          setUser(response.user);
          localStorage.setItem('scalora_user', JSON.stringify(response.user));
        } else {
          logout();
        }
      } catch (err: any) {
        // If explicitly unauthorized (invalid token), log out. Otherwise, retain cached session for network resilience.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          logout();
        } else {
          const savedUser = localStorage.getItem('scalora_user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {}
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', {
        email,
        password,
      });

      if (response.success && response.token && response.user) {
        localStorage.setItem('scalora_token', response.token);
        localStorage.setItem('scalora_user', JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
        return;
      }
      throw new Error(response.user ? 'Login failed' : 'Invalid response from server');
    } catch (err: any) {
      throw new Error(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: Role = 'STUDENT') => {
    setIsLoading(true);
    try {
      const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/register', {
        name,
        email,
        password,
        role,
      });

      if (response.success && response.token && response.user) {
        localStorage.setItem('scalora_token', response.token);
        localStorage.setItem('scalora_user', JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
        return;
      }
      throw new Error('Registration failed');
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'ADMIN' | 'STUDENT') => {
    if (role === 'ADMIN') {
      await login('admin@scalora.com', 'ScaloraAdmin123!');
    } else {
      await login('student@scalora.com', 'Student123!');
    }
  };

  const logout = () => {
    localStorage.removeItem('scalora_token');
    localStorage.removeItem('scalora_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...userData };
      setUser(updated);
      localStorage.setItem('scalora_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        demoLogin,
      }}
    >
      {children}
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
