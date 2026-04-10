import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

type Props = {
  label: string;
  placeholder: string;
  value?: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
};

export default function FormField({ label, placeholder, value, onChangeText, secureTextEntry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
});