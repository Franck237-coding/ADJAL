import React from 'react';
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
import { useRouter } from 'expo-router';
import TopBar from '@/components/farmer/TopBar';
import { useCart } from '@/context/CartContext';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, removeItem, total, clear } = useCart();
  const topPad = Platform.OS === 'web' ? 44 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TopBar title="Panier" onBack={() => router.back()} right={
        items.length > 0 ? (
          <TouchableOpacity onPress={clear}>
            <Text style={styles.clearText}>Vider</Text>
          </TouchableOpacity>
        ) : null
      } />

      <ScrollView contentContainerStyle={{ paddingBottom: botPad + 100 }} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Votre panier est vide</Text>
            <Text style={styles.emptySub}>Parcourez nos catégories pour ajouter des produits</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(app)/categories')}>
              <Text style={styles.browseBtnText}>Parcourir les produits</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemLeft}>
                  <View style={styles.itemIcon}>
                    <Ionicons name="cube" size={24} color="#256B2E" />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemUnit}>{item.unite}</Text>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity onPress={() => removeItem(item.id)}>
                        <Ionicons name="remove-circle-outline" size={22} color="#C62828" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.qty}</Text>
                      <TouchableOpacity onPress={() => {}}>
                        <Ionicons name="add-circle-outline" size={22} color="#2E7D32" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemPrice}>{(item.price * item.qty).toLocaleString('fr-FR')} F</Text>
                  <Text style={styles.itemUnitPrice}>{item.price} F / {item.unite}</Text>
                </View>
              </View>
            ))}

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total</Text>
                <Text style={styles.summaryValue}>{total.toLocaleString('fr-FR')} F</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Livraison</Text>
                <Text style={styles.summaryValue}>À calculer</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{total.toLocaleString('fr-FR')} F</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.checkoutBtn}>
              <Text style={styles.checkoutBtnText}>Commander</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  clearText: { fontSize: 13, color: '#C62828', fontFamily: 'Inter_500Medium' },
  list: { paddingHorizontal: 16, marginTop: 16, gap: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1A2E1A' },
  itemUnit: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_400Regular', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  qtyText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#1A2E1A', minWidth: 20, textAlign: 'center' },
  itemRight: { alignItems: 'flex-end' },
  itemPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#2E7D32' },
  itemUnitPrice: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  summary: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)', gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B7A6B' },
  summaryValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1A2E1A' },
  totalRow: { paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: '#EDE9E2' },
  totalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1A2E1A' },
  totalValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#2E7D32' },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2E7D32', paddingVertical: 16, borderRadius: 16, marginTop: 16 },
  checkoutBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1A2E1A', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#6B7A6B', fontFamily: 'Inter_400Regular', textAlign: 'center' },
  browseBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 12 },
  browseBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
