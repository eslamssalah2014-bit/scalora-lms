import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../lib/api';

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
  const [user, setUser] = useState<User | null>(null);
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
        } else {
          logout();
        }
      } catch {
        logout();
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

      if (response.success && response.token) {
        localStorage.setItem('scalora_token', response.token);
        setToken(response.token);
        setUser(response.user);
      }
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

      if (response.success && response.token) {
        localStorage.setItem('scalora_token', response.token);
        setToken(response.token);
        setUser(response.user);
      }
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
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
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
