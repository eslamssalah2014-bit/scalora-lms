import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../lib/api';
import { FALLBACK_USERS, savePersistentStudent } from '../data/fallbackData';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('scalora_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // If it's a fallback demo session, restore user directly
      if (storedToken.startsWith('demo_token_')) {
        const role = storedToken.replace('demo_token_', '') as Role;
        const fallbackUser = role === 'ADMIN' ? FALLBACK_USERS['admin@scalora.com'] : FALLBACK_USERS['student@scalora.com'];
        setUser(fallbackUser);
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
      } catch {
        // If API is unreachable but we have cached user data, keep session active
        const savedUser = localStorage.getItem('scalora_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          logout();
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

      if (response.success && response.token) {
        localStorage.setItem('scalora_token', response.token);
        localStorage.setItem('scalora_user', JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
        return;
      }
    } catch {
      // Fallback: If live server is offline, authenticate demo credentials seamlessly
      const fallbackUser = FALLBACK_USERS[email.toLowerCase()];
      if (fallbackUser) {
        const demoToken = `demo_token_${fallbackUser.role}`;
        localStorage.setItem('scalora_token', demoToken);
        localStorage.setItem('scalora_user', JSON.stringify(fallbackUser));
        setToken(demoToken);
        setUser(fallbackUser);
        return;
      }
      throw new Error('Invalid email or password. Try the 1-Click Demo Login buttons.');
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
        localStorage.setItem('scalora_user', JSON.stringify(response.user));
        savePersistentStudent(response.user);
        setToken(response.token);
        setUser(response.user);
        return;
      }
    } catch {
      // Offline fallback for registration
      const newUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        role,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        bio: 'Scalora Academy Learner',
      };
      const demoToken = `demo_token_${role}`;
      localStorage.setItem('scalora_token', demoToken);
      localStorage.setItem('scalora_user', JSON.stringify(newUser));
      savePersistentStudent(newUser);
      setToken(demoToken);
      setUser(newUser);
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
