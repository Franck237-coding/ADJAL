import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface FarmerInputProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  editable?: boolean;
}

export default function FarmerInput({ value, onChangeText, placeholder, keyboardType = 'default', editable = true }: FarmerInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
      editable={editable}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#EDE9E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1A2E1A',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
});
