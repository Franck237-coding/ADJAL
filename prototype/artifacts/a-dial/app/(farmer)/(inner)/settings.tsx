import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopBar from '@/components/farmer/TopBar';
import FarmerSelect from '@/components/farmer/FarmerSelect';
import Toggle from '@/components/farmer/Toggle';

export default function FarmerSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 44 : insets.top;

  const [lang, setLang] = useState('Français');
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifDelivery, setNotifDelivery] = useState(false);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => router.replace('/(auth)/welcome') },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TopBar title="Paramètres" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={styles.sections}>
          {/* Langue */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>LANGUE</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Langue</Text>
              <FarmerSelect value={lang} onSelect={setLang} options={['Français', 'English']} />
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>NOTIFICATIONS</Text>
            {[
              { label: 'Commandes', value: notifOrders, set: setNotifOrders },
              { label: 'Promotions', value: notifPromos, set: setNotifPromos },
              { label: 'Messages', value: notifMessages, set: setNotifMessages },
              { label: 'Livraisons', value: notifDelivery, set: setNotifDelivery },
            ].map((item) => (
              <View key={item.label} style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{item.label}</Text>
                <Toggle value={item.value} onValueChange={item.set} />
              </View>
            ))}
          </View>

          {/* Confidentialité */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>CONFIDENTIALITÉ</Text>
            <TouchableOpacity style={styles.linkRow}>
              <Ionicons name="lock-closed" size={18} color="#2E7D32" />
              <Text style={styles.linkText}>Confidentialité des données</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow}>
              <Ionicons name="shield-checkmark" size={18} color="#2E7D32" />
              <Text style={styles.linkText}>Conditions d'utilisation</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Support */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>SUPPORT</Text>
            <TouchableOpacity style={styles.linkRow}>
              <Ionicons name="help-circle" size={18} color="#2E7D32" />
              <Text style={styles.linkText}>FAQ et aide</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#2E7D32" />
              <Text style={styles.linkText}>Contacter le support</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out" size={18} color="#C62828" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>À Dial v1.0.0 · © 2026</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  sections: { paddingHorizontal: 16, marginTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  cardTitle: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 12 },
  field: { gap: 6 },
  label: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_500Medium' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDE9E2' },
  toggleLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#1A2E1A' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDE9E2' },
  linkText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: '#1A2E1A' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: '#FFEBEE', borderWidth: 1.5, borderColor: '#FECACA' },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#C62828' },
  footer: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 16, marginBottom: 4 },
});
