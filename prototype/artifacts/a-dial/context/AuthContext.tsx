import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'ACHETEUR' | 'AGRICULTEUR';

export interface User {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  role: Role | null;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isOnboarded: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { nom: string; email: string; telephone: string }) => Promise<void>;
  setUserRole: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  markOnboarded: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const [onboarded, userData, roleData] = await Promise.all([
        AsyncStorage.getItem('@adial:onboarded'),
        AsyncStorage.getItem('@adial:user'),
        AsyncStorage.getItem('@adial:role'),
      ]);
      if (onboarded === 'true') setIsOnboarded(true);
      if (userData) setUser(JSON.parse(userData) as User);
      if (roleData) setRole(roleData as Role);
    } catch {
      // ignore errors
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, _password: string) => {
    const mockUser: User = {
      id: '1',
      nom: 'Amina Kouassi',
      email,
      telephone: '+237 6XX XXX XXX',
      role: 'ACHETEUR',
    };
    setUser(mockUser);
    setRole('ACHETEUR');
    setIsGuest(false);
    await Promise.all([
      AsyncStorage.setItem('@adial:user', JSON.stringify(mockUser)),
      AsyncStorage.setItem('@adial:role', 'ACHETEUR'),
    ]);
  };

  const register = async (data: { nom: string; email: string; telephone: string }) => {
    const mockUser: User = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      nom: data.nom,
      email: data.email,
      telephone: data.telephone,
      role: null,
    };
    setUser(mockUser);
    setIsGuest(false);
    await AsyncStorage.setItem('@adial:user', JSON.stringify(mockUser));
  };

  const setUserRole = async (newRole: Role) => {
    setRole(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      await AsyncStorage.setItem('@adial:user', JSON.stringify(updated));
    }
    await AsyncStorage.setItem('@adial:role', newRole);
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    setIsGuest(false);
    await Promise.all([
      AsyncStorage.removeItem('@adial:user'),
      AsyncStorage.removeItem('@adial:role'),
    ]);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    setRole(null);
  };

  const markOnboarded = async () => {
    setIsOnboarded(true);
    await AsyncStorage.setItem('@adial:onboarded', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user, role, isOnboarded, isGuest, isLoading,
        login, register, setUserRole, logout, continueAsGuest, markOnboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
