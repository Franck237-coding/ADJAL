import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

interface FarmerBtnProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function FarmerBtn({ title, onPress, variant = 'solid', color = '#2E7D32', disabled, loading, style }: FarmerBtnProps) {
  const isSolid = variant === 'solid';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        isSolid ? { backgroundColor: color } : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={isSolid ? '#fff' : color} /> : (
        <Text style={[styles.text, { color: isSolid ? '#fff' : color }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  disabled: { opacity: 0.5 },
});
