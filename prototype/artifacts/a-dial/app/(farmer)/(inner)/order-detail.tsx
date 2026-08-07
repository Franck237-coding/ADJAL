import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TopBar from '@/components/farmer/TopBar';
import Avatar from '@/components/farmer/Avatar';
import FarmerBtn from '@/components/farmer/FarmerBtn';
import { ORDERS } from '@/data/farmer-mock';

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 44 : insets.top;

  const order = ORDERS.find((o) => o.id === params.id) || ORDERS[0];

  const statusConfig: Record<string, { icon: string; color: string; bg: string; title: string }> = {
    'En attente': { icon: 'time', color: '#F57F17', bg: '#FFF8E1', title: 'En attente de confirmation' },
    Confirmée: { icon: 'checkmark-circle', color: '#2E7D32', bg: '#E8F5E9', title: 'Commande confirmée' },
    Livrée: { icon: 'checkmark-done-circle', color: '#1565C0', bg: '#E3F2FD', title: 'Commande livrée' },
    Annulée: { icon: 'close-circle', color: '#C62828', bg: '#FFEBEE', title: 'Commande annulée' },
  };

  const cfg = statusConfig[order.status] || statusConfig['En attente'];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TopBar title={`Commande ${order.id}`} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View style={[styles.statusCard, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusIcon, { backgroundColor: cfg.color }]}>
            <Ionicons name={cfg.icon as any} size={24} color="#fff" />
          </View>
          <Text style={[styles.statusTitle, { color: cfg.color }]}>{cfg.title}</Text>
          <Text style={styles.statusDate}>Date: {order.deliveryDate}</Text>
        </View>

        {/* Client */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <View style={styles.clientRow}>
             <Avatar initials={order.initials} size={48} bg={['#2E7D32', '#1B5E20']} />
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{order.customer}</Text>
              <Text style={styles.clientPhone}>{order.phone}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>DÉTAILS</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Produit</Text>
              <Text style={styles.tableLabel}>Qté</Text>
              <Text style={styles.tableLabel}>Montant</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableValue}>{order.product}</Text>
              <Text style={styles.tableValue}>{order.qty}</Text>
              <Text style={styles.tableValue}>{order.total.toLocaleString('fr-FR')} FCFA</Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{order.total.toLocaleString('fr-FR')} FCFA</Text>
          </View>
        </View>

        {/* Delivery */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>LIVRAISON</Text>
          <View style={styles.deliveryRow}>
            <Ionicons name="location" size={18} color="#2E7D32" />
            <Text style={styles.deliveryText}>{order.address}</Text>
          </View>
          <View style={styles.deliveryRow}>
            <Ionicons name="calendar" size={18} color="#2E7D32" />
            <Text style={styles.deliveryText}>{order.deliveryDate}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {order.status === 'En attente' && (
            <>
              <FarmerBtn title="Accepter" onPress={() => { alert('Commande acceptée'); router.back(); }} />
              <FarmerBtn title="Refuser" onPress={() => { alert('Commande refusée'); router.back(); }} variant="outline" color="#C62828" />
            </>
          )}
          {order.status === 'Confirmée' && (
            <FarmerBtn title="Marquer comme livrée" onPress={() => { alert('Marquée comme livrée'); router.back(); }} />
          )}
          {(order.status === 'Livrée' || order.status === 'Annulée') && (
            <Text style={styles.finalized}>Commande {order.status.toLowerCase()}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  statusCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 20, alignItems: 'center', gap: 8 },
  statusIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  statusDate: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_400Regular' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  sectionTitle: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 10 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#1A2E1A' },
  clientPhone: { fontSize: 13, color: '#6B7A6B', fontFamily: 'Inter_400Regular', marginTop: 2 },
  table: { borderWidth: 1, borderColor: '#EDE9E2', borderRadius: 12, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#EDE9E2' },
  tableLabel: { flex: 1, fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_600SemiBold' },
  tableValue: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: '#1A2E1A' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EDE9E2' },
  totalLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#6B7A6B' },
  totalValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#2E7D32' },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  deliveryText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1A2E1A' },
  actions: { paddingHorizontal: 16, marginTop: 20, gap: 10 },
  finalized: { textAlign: 'center', color: '#6B7A6B', fontSize: 14, fontFamily: 'Inter_500Medium', paddingVertical: 20 },
});
