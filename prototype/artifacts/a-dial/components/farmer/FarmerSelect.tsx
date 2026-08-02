import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FarmerSelectProps {
  value: string;
  onSelect: (v: string) => void;
  options: string[];
  placeholder?: string;
}

export default function FarmerSelect({ value, onSelect, options, placeholder }: FarmerSelectProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <TouchableOpacity style={styles.wrapper} onPress={() => setOpen(true)} activeOpacity={0.8}>
      <Text style={[styles.text, !value && styles.placeholder]}>{value || placeholder || 'Sélectionner...'}</Text>
      <Ionicons name="chevron-down" size={18} color="#6B7A6B" />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => { onSelect(item); setOpen(false); }}>
                  <Text style={[styles.optionText, value === item && styles.optionActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EDE9E2', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: 'transparent' },
  text: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1A2E1A', flex: 1 },
  placeholder: { color: '#9CA3AF' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 8, maxHeight: 280 },
  option: { paddingHorizontal: 18, paddingVertical: 14 },
  optionText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1A2E1A' },
  optionActive: { color: '#2E7D32', fontFamily: 'Inter_600SemiBold' },
});
