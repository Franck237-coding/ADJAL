import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AvatarProps {
  initials: string;
  size?: number;
  bg?: [string, string];
}

export default function Avatar({ initials, size = 48, bg = ['#2E7D32', '#1B5E20'] }: AvatarProps) {
  const fontSize = size * 0.4;
  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }]}>
      <LinearGradient colors={bg} style={StyleSheet.absoluteFill}>
        <Text style={[styles.text, { fontSize }]}>{initials}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontFamily: 'Inter_700Bold' },
});
