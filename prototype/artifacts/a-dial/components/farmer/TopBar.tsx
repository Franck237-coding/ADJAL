import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  transparent?: boolean;
}

export default function TopBar({ title, onBack, right, transparent = false }: TopBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: Platform.OS === 'web' ? 12 : insets.top, backgroundColor: transparent ? 'transparent' : '#fff' }, transparent && styles.transparent]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={transparent ? '#fff' : '#2E7D32'} />
          </TouchableOpacity>
        ) : <View style={styles.iconBtn} />}
        <Text style={[styles.title, { color: transparent ? '#fff' : '#1A2E1A' }]}>{title}</Text>
        <View style={styles.iconBtn}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 10 },
  transparent: { backgroundColor: 'transparent' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 48 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
});
