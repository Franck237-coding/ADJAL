import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  activeColor?: string;
}

export default function Toggle({ value, onValueChange, activeColor = '#2E7D32' }: ToggleProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onValueChange(!value)}>
      <View style={[styles.track, value && { backgroundColor: activeColor }]}>
        <View style={[styles.thumb, value && styles.thumbActive]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#CBD5E1', padding: 2 },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  thumbActive: { marginLeft: 20 },
});
