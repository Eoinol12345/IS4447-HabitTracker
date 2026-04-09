import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !confirm) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    const success = await register(email.trim().toLowerCase(), password.trim());
    setLoading(false);
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', 'Email already in use');
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={[styles.logo, { color: colors.primary }]}>🌱 HabitTracker</Text>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Email"
          placeholderTextColor={colors.subtext}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email input"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Password"
          placeholderTextColor={colors.subtext}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password input"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.subtext}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          accessibilityLabel="Confirm password input"
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityLabel="Register button"
        >
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Register'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={[styles.link, { color: colors.primary }]}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 32 },
  input: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    fontSize: 16, marginBottom: 16,
  },
  button: {
    borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', fontSize: 14, marginTop: 8 },
});