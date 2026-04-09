import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Switch
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

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
          },
        },
      ]
    );
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
        <Text style={[styles.cardTitle, { color: colors.subtext }]}>ACTIONS</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={logout}
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