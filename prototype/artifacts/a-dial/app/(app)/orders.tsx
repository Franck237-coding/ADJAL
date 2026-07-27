import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

const ALL_ORDERS = [
  { id: 'AD-2847', date: '28 Jun 2026', statut: 'Livré', produit: 'Tomates fraîches', details: '5 kg · Jean Mfou', montant: 2250, prog: 100, color: '#059669', tab: 'Livrées' },
  { id: 'AD-2831', date: '30 Jun 2026', statut: 'En transit', produit: 'Maïs séché', details: '10 kg · Paul Beti', montant: 3200, prog: 67, color: '#3B82F6', tab: 'En cours' },
  { id: 'AD-2819', date: '1 Jun 2026', statut: 'En attente', produit: 'Gingembre frais', details: '2 kg · Ahmed Ngaoundéré', montant: 2400, prog: 10, color: '#F59E0B', tab: 'En cours' },
  { id: 'AD-2801', date: '25 Jun 2026', statut: 'Livré', produit: 'Ignames blanches', details: '8 kg · Chantal Bassa', montant: 4400, prog: 100, color: '#059669', tab: 'Livrées' },
];

const TABS = ['Toutes', 'En cours', 'Livrées'] as const;
type Tab = typeof TABS[number];

function AccessDenied() {
  const router = useRouter();
  return (
    <View style={denied.container}>
      <View style={denied.iconBox}>
        <Ionicons name="shield-checkmark" size={40} color="#9CA3AF" />
      </View>
      <Text style={denied.title}>Accès réservé</Text>
      <Text style={denied.desc}>Créez un compte gratuit pour accéder à cette fonctionnalité et bien plus encore.</Text>
      <TouchableOpacity style={denied.btnPrimary} onPress={() => router.push('/(auth)/register')}>
        <Ionicons name="person-add" size={16} color="#fff" />
        <Text style={denied.btnPrimaryText}>Créer un compte gratuit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={denied.btnOutline} onPress={() => router.push('/(auth)/login')}>
        <Ionicons name="log-in" size={16} color="#256B2E" />
        <Text style={denied.btnOutlineText}>Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const denied = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  iconBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#256B2E', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignSelf: 'stretch', justifyContent: 'center' },
  btnPrimaryText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  btnOutline: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#256B2E', paddingVertical: 13, paddingHorizontal: 24, borderRadius: 14, alignSelf: 'stretch', justifyContent: 'center' },
  btnOutlineText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#256B2E' },
});

export default function OrdersScreen() {
  const { user, isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('Toutes');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const orders = activeTab === 'Toutes' ? ALL_ORDERS : ALL_ORDERS.filter((o) => o.tab === activeTab);
  const totalAvoided = 28; // kg of waste avoided

  if (isGuest || !user) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <LinearGradient colors={['#1A4F22', '#256B2E']} style={styles.header}>
          <Text style={styles.headerTitle}>Mes commandes</Text>
          <Text style={styles.headerSub}>Suivez vos achats en temps réel</Text>
        </LinearGradient>
        <AccessDenied />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={['#1A4F22', '#256B2E']} style={styles.header}>
        <Text style={styles.headerTitle}>Mes commandes</Text>
        <Text style={styles.headerSub}>Suivez vos achats en temps réel</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 70 }]} showsVerticalScrollIndicator={false}>
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <View>
                <Text style={styles.orderId}>#{order.id}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: order.color + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: order.color }]} />
                <Text style={[styles.statusText, { color: order.color }]}>{order.statut}</Text>
              </View>
            </View>

            <View style={styles.orderMid}>
              <View style={[styles.productIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="leaf" size={20} color="#256B2E" />
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderProduct}>{order.produit}</Text>
                <Text style={styles.orderDetails}>{order.details}</Text>
              </View>
              <Text style={styles.orderAmount}>{order.montant.toLocaleString()} F</Text>
            </View>

            {order.prog < 100 && (
              <View style={styles.progSection}>
                <View style={styles.progBg}>
                  <View style={[styles.progFill, { width: `${order.prog}%` as `${number}%`, backgroundColor: order.color }]} />
                </View>
                <Text style={styles.progText}>{order.prog}%</Text>
              </View>
            )}
          </View>
        ))}

        {/* Impact card */}
        <View style={styles.impactCard}>
          <Ionicons name="leaf" size={20} color="#256B2E" />
          <View style={styles.impactInfo}>
            <Text style={styles.impactTitle}>Impact positif</Text>
            <Text style={styles.impactDesc}>
              Vos {orders.length} commandes ont permis d&apos;éviter {totalAvoided} kg de pertes post-récolte.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2' },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_400Regular' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0' },
  tabActive: { backgroundColor: '#256B2E' },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  scroll: { paddingHorizontal: 18, paddingTop: 16, gap: 14 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14 },
  orderTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderId: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  orderDate: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  orderMid: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1 },
  orderProduct: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1A1A1A' },
  orderDetails: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  orderAmount: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  progSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  progText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#6B7280', minWidth: 30, textAlign: 'right' },
  impactCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#C6E6CA', marginTop: 4 },
  impactInfo: { flex: 1 },
  impactTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#256B2E' },
  impactDesc: { fontSize: 13, color: '#374151', fontFamily: 'Inter_400Regular', marginTop: 3, lineHeight: 20 },
});
