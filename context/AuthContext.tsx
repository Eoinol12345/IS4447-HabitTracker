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
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const result = await db.select().from(users)
        .where(eq(users.email, email));
      if (result.length > 0 && result[0].password === password) {
        const u = { id: result[0].id, email: result[0].email };
        setUser(u);
        await AsyncStorage.setItem('user', JSON.stringify(u));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async function register(email: string, password: string): Promise<boolean> {
    try {
      const existing = await db.select().from(users)
        .where(eq(users.email, email));
      if (existing.length > 0) return false;
      await db.insert(users).values({ email, password });
      const result = await db.select().from(users)
        .where(eq(users.email, email));
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
    setUser(null);
    await AsyncStorage.removeItem('user');
  }

  async function deleteAccount() {
    if (!user) return;
    await db.delete(users).where(eq(users.id, user.id));
    await logout();
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}