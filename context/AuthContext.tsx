import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

type User = {
  id: number;
  email: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Loaded user from storage:', parsed);
        setUser(parsed);
      }
    } catch (e) {
      console.error('Load user error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      console.log('Attempting login with:', email, password);
      const result = await db.select().from(users).where(eq(users.email, email));
      console.log('DB result:', JSON.stringify(result));
      if (result.length > 0 && result[0].password === password) {
        const u = { id: result[0].id, email: result[0].email };
        setUser(u);
        await AsyncStorage.setItem('user', JSON.stringify(u));
        console.log('Login successful, user set:', u);
        return true;
      }
      console.log('Login failed - no match');
      return false;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  }

  async function register(email: string, password: string): Promise<boolean> {
    try {
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) return false;
      await db.insert(users).values({ email, password });
      const result = await db.select().from(users).where(eq(users.email, email));
      const u = { id: result[0].id, email: result[0].email };
      setUser(u);
      await AsyncStorage.setItem('user', JSON.stringify(u));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async function logout() {
    console.log('Logging out');
    setUser(null);
    await AsyncStorage.removeItem('user');
  }

  async function deleteAccount() {
    if (!user) return;
    await db.delete(users).where(eq(users.id, user.id));
    await logout();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}