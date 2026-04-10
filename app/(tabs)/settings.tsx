import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Switch
} from 'react-native';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../db/client';
import { habits, habitLogs, categories } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { scheduleDailyReminder, cancelAllNotifications } from '../../hooks/useNotifications';

export default function SettingsScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Are you sure? This will permanently delete your account and all your data.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            router.replace('/login');
          },
        },
      ]
    );
  }

  async function handleExportCSV() {
    try {
      if (!user) return;
      const allHabits = await db.select().from(habits).where(eq(habits.userId, user.id));
      const allLogs = await db.select().from(habitLogs);
      const allCategories = await db.select().from(categories).where(eq(categories.userId, user.id));

      let csv = 'Habit,Category,Date,Completed\n';
      for (const habit of allHabits) {
        const cat = allCategories.find(c => c.id === habit.categoryId);
        const logs = allLogs.filter(l => l.habitId === habit.id);
        for (const log of logs) {
          csv += `"${habit.name}","${cat?.name ?? ''}","${log.date}",${log.count > 0 ? 'Yes' : 'No'}\n`;
        }
      }

      const path = FileSystem.documentDirectory + 'habits_export.csv';
      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: 'utf8' as any,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Habits CSV',
        });
      } else {
        Alert.alert('Saved', 'CSV saved to: ' + path);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to export: ' + String(e));
    }
  }

  async function handleToggleNotifications(value: boolean) {
    if (value) {
      const success = await scheduleDailyReminder(20, 0);
      if (success) {
        setNotificationsEnabled(true);
        Alert.alert('✅ Reminders On', 'You will be reminded every day at 8:00 PM to log your habits!');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
      }
    } else {
      await cancelAllNotifications();
      setNotificationsEnabled(false);
      Alert.alert('Reminders Off', 'Daily reminders have been cancelled.');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>⚙️ Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.subtext }]}>ACCOUNT</Text>
        <Text style={[styles.email, { color: colors.text }]}>📧 {user?.email}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.subtext }]}>APPEARANCE</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
            accessibilityLabel="Toggle dark mode"
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.subtext }]}>NOTIFICATIONS</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            🔔 Daily Reminder (8:00 PM)
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
            accessibilityLabel="Toggle notifications"
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.subtext }]}>DATA</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2196F3' }]}
          onPress={handleExportCSV}
          accessibilityLabel="Export CSV button"
        >
          <Text style={styles.buttonText}>📤 Export to CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.subtext }]}>ACTIONS</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleLogout}
          accessibilityLabel="Logout button"
        >
          <Text style={styles.buttonText}>🚪 Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.danger }]}
          onPress={handleDeleteAccount}
          accessibilityLabel="Delete account button"
        >
          <Text style={styles.buttonText}>🗑️ Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.subtext }]}>ABOUT</Text>
        <Text style={[styles.info, { color: colors.subtext }]}>🌱 HabitTracker v1.0</Text>
        <Text style={[styles.info, { color: colors.subtext }]}>Built with React Native & Expo</Text>
        <Text style={[styles.info, { color: colors.subtext }]}>IS4447 — 2026</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  email: { fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 16 },
  button: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  info: { fontSize: 14, marginBottom: 4 },
});