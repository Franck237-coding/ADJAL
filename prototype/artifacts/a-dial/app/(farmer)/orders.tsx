import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopBar from '@/components/farmer/TopBar';
import StatusBadge from '@/components/farmer/StatusBadge';
import { ORDERS } from '@/data/farmer-mock';

type FilterType = 'Toutes' | 'En attente' | 'Confirmée' | 'Livrée' | 'Annulée';

export default function FarmerOrders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('Toutes');

  const topPad = Platform.OS === 'web' ? 44 : insets.top;

  const counts: Record<FilterType, number> = {
    Toutes: ORDERS.length,
    'En attente': ORDERS.filter((o) => o.status === 'En attente').length,
    Confirmée: ORDERS.filter((o) => o.status === 'Confirmée').length,
    Livrée: ORDERS.filter((o) => o.status === 'Livrée').length,
    Annulée: ORDERS.filter((o) => o.status === 'Annulée').length,
  };

  const filtered = filter === 'Toutes' ? ORDERS : ORDERS.filter((o) => o.status === filter);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TopBar title="Commandes" />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['Toutes', 'En attente', 'Confirmée', 'Livrée', 'Annulée'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f} ({counts[f]})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {filtered.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => router.push({ pathname: '/(farmer)/(inner)/order-detail', params: { id: order.id } })}>
              <View style={styles.orderTop}>
                <View style={styles.orderTopLeft}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <StatusBadge label={order.status} color={statusColor(order.status)} bg={statusBg(order.status)} />
                </View>
                <Text style={styles.orderDate}>{order.deliveryDate}</Text>
              </View>
              <View style={styles.orderBody}>
                <View style={styles.orderLeft}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{order.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.customerName}>{order.customer}</Text>
                    <Text style={styles.customerProduct}>{order.product} · {order.qty}</Text>
                  </View>
                </View>
                <Text style={styles.orderTotal}>{order.total.toLocaleString('fr-FR')} FCFA</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" style={{ position: 'absolute', right: 14, top: '50%', marginTop: -9 }} />
            </TouchableOpacity>
          ))}
          {filtered.length === 0 && (
            <Text style={styles.empty}>Aucune commande</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'En attente': return '#F57F17';
    case 'Confirmée': return '#2E7D32';
    case 'Livrée': return '#1565C0';
    case 'Annulée': return '#C62828';
    default: return '#6B7A6B';
  }
}

function statusBg(status: string) {
  switch (status) {
    case 'En attente': return '#FFF8E1';
    case 'Confirmée': return '#E8F5E9';
    case 'Livrée': return '#E3F2FD';
    case 'Annulée': return '#FFEBEE';
    default: return '#EDE9E2';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  filterRow: { paddingHorizontal: 16, marginTop: 12, gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  filterPillActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#6B7A6B' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)', position: 'relative' },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  orderTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderId: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1A2E1A' },
  orderDate: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  orderBody: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  orderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  customerName: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#1A2E1A' },
  customerProduct: { fontSize: 11, color: '#6B7A6B', fontFamily: 'Inter_400Regular', marginTop: 2 },
  orderTotal: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#2E7D32' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 14 },
});
