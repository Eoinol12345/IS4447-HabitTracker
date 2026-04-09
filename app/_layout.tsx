import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { db } from '../db/client';
import { sql } from 'drizzle-orm';

async function setupDatabase() {
  await db.run(sql`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    colour TEXT NOT NULL,
    user_id INTEGER NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    notes TEXT
  )`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER,
    category_id INTEGER,
    period TEXT NOT NULL,
    goal INTEGER NOT NULL,
    user_id INTEGER NOT NULL
  )`);
}

function RootLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </>
      )}
    </Stack>
  );
}

export default function Layout() {
  const [dbReady, setDbReady] = useState(false);
  useEffect(() => {
    setupDatabase().then(() => setDbReady(true));
  }, []);
  if (!dbReady) return null;
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}