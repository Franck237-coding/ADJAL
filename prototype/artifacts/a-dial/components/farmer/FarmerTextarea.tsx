import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface FarmerTextareaProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export default function FarmerTextarea({ value, onChangeText, placeholder, editable = true }: FarmerTextareaProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      editable={editable}
      multiline
      numberOfLines={3}
      style={styles.input}
      textAlignVertical="top"
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
    minHeight: 80,
  },
});
