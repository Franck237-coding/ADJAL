import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopBar from '@/components/farmer/TopBar';
import StatusBadge from '@/components/farmer/StatusBadge';
import { PRODUCTS } from '@/data/farmer-mock';

type FilterType = 'Tous' | 'Disponible' | 'Stock faible' | 'Épuisé';

export default function FarmerProducts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('Tous');

  const topPad = Platform.OS === 'web' ? 44 : insets.top;

  const filtered = PRODUCTS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tous' ? true : p.status === filter;
    return matchSearch && matchFilter;
  });

  const removeProduct = (id: number) => {
    alert('Produit supprimé (mock)');
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TopBar title="Mes Produits" onBack={() => router.back()} right={
        <TouchableOpacity onPress={() => router.push('/(farmer)/(inner)/add-product')}>
          <Ionicons name="add" size={24} color="#2E7D32" />
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un produit..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['Tous', 'Disponible', 'Stock faible', 'Épuisé'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products */}
        <View style={styles.list}>
          {filtered.map((p) => (
            <View key={p.id} style={styles.productCard}>
              <View style={styles.productRow}>
                <Text style={styles.emoji}>{p.emoji}</Text>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productCat}>{p.category}</Text>
                  <Text style={styles.productPrice}>{p.price.toLocaleString('fr-FR')} FCFA / {p.unit}</Text>
                  <Text style={styles.productStock}>{p.qty} {p.unit} · {p.location}</Text>
                </View>
                <StatusBadge label={p.status} color={statusColor(p.status)} bg={statusBg(p.status)} />
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/(farmer)/(inner)/edit-product', params: { id: String(p.id) } })}>
                  <Text style={styles.editBtnText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => removeProduct(p.id)}>
                  <Text style={styles.deleteBtnText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {filtered.length === 0 && (
            <Text style={styles.empty}>Aucun produit trouvé</Text>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(farmer)/(inner)/add-product')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'Disponible': return '#2E7D32';
    case 'Stock faible': return '#F57F17';
    case 'Épuisé': return '#C62828';
    default: return '#6B7A6B';
  }
}

function statusBg(status: string) {
  switch (status) {
    case 'Disponible': return '#E8F5E9';
    case 'Stock faible': return '#FFF8E1';
    case 'Épuisé': return '#FFEBEE';
    default: return '#EDE9E2';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  searchRow: { paddingHorizontal: 16, marginTop: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9E2', borderRadius: 12, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1A2E1A' },
  filterRow: { paddingHorizontal: 16, marginTop: 12, gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  filterPillActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#6B7A6B' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, marginTop: 16, gap: 12 },
  productCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  productRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  emoji: { fontSize: 56 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#1A2E1A' },
  productCat: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_400Regular', marginTop: 2 },
  productPrice: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2E7D32', marginTop: 4 },
  productStock: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_400Regular', marginTop: 2 },
  productActions: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EDE9E2' },
  editBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center' },
  editBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2E7D32' },
  deleteBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFEBEE', alignItems: 'center' },
  deleteBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#C62828' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 14 },
  fab: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
});
