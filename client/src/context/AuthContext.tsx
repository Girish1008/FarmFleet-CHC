import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<User>;
  logout: () => void;
  quickLoginAsRole: (role: Role) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('farmfleet_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('farmfleet_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const profile = await api.auth.me();
          setUser(profile);
          localStorage.setItem('farmfleet_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('[Auth] Token verification failed:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (identifier: string, pass: string): Promise<User> => {
    const res = await api.auth.login({ emailOrPhone: identifier, password: pass });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('farmfleet_token', res.token);
    localStorage.setItem('farmfleet_user', JSON.stringify(res.user));
    return res.user;
  };

  const quickLoginAsRole = async (targetRole: Role): Promise<User> => {
    const credentials: Record<Role, { id: string; pass: string }> = {
      ADMIN: { id: 'admin@farmfleet.in', pass: 'Admin@123' },
      CHC_MANAGER: { id: 'manager@farmfleet.in', pass: 'Manager@123' },
      OPERATOR: { id: 'operator@farmfleet.in', pass: 'Operator@123' },
      FARMER: { id: 'farmer@farmfleet.in', pass: 'Farmer@123' },
    };

    const target = credentials[targetRole];
    return login(target.id, target.pass);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('farmfleet_token');
    localStorage.removeItem('farmfleet_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isLoading,
        login,
        logout,
        quickLoginAsRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
