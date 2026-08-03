import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '@/context/CartContext';

const CATS = ['Tout', 'Fruits', 'Légumes', 'Céréales', 'Tubercules', 'Épices'];

const PRODUCTS = [
  { id: '1', nom: 'Tomates fraîches', cat: 'Légumes', prix: 450, unite: 'kg', vendeur: 'Jean Mfou', loc: 'Yaoundé', note: 4.8, avis: 124, badge: 'Frais', img: require('../../assets/images/tomatoes.jpg') },
  { id: '2', nom: 'Ananas Douala', cat: 'Fruits', prix: 800, unite: 'pièce', vendeur: 'Marie Ewondo', loc: 'Douala', note: 4.6, avis: 87, badge: 'Bio', img: require('../../assets/images/pineapple.jpg') },
  { id: '3', nom: 'Maïs séché', cat: 'Céréales', prix: 320, unite: 'kg', vendeur: 'Paul Beti', loc: 'Bafoussam', note: 4.7, avis: 203, badge: null, img: require('../../assets/images/corn.jpg') },
  { id: '4', nom: 'Ignames blanches', cat: 'Tubercules', prix: 550, unite: 'kg', vendeur: 'Chantal Bassa', loc: 'Bertoua', note: 4.5, avis: 56, badge: null, img: require('../../assets/images/ginger.jpg') },
  { id: '5', nom: 'Gingembre frais', cat: 'Épices', prix: 1200, unite: 'kg', vendeur: 'Ahmed Ngaoundéré', loc: 'Ngaoundéré', note: 4.9, avis: 89, badge: 'Bio', img: require('../../assets/images/ginger.jpg') },
  { id: '6', nom: 'Tomates cerises', cat: 'Légumes', prix: 600, unite: 'kg', vendeur: 'Rose Bamiléké', loc: 'Bafoussam', note: 4.3, avis: 34, badge: 'Frais', img: require('../../assets/images/tomatoes.jpg') },
  { id: '7', nom: 'Bananes plantain', cat: 'Fruits', prix: 250, unite: 'kg', vendeur: 'Joseph Duala', loc: 'Douala', note: 4.4, avis: 67, badge: null, img: require('../../assets/images/pineapple.jpg') },
  { id: '8', nom: 'Mil blanc', cat: 'Céréales', prix: 280, unite: 'kg', vendeur: 'Ibrahim Maroua', loc: 'Maroua', note: 4.2, avis: 45, badge: null, img: require('../../assets/images/corn.jpg') },
];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [activeCat, setActiveCat] = useState('Tout');
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = activeCat === 'Tout' || p.cat === activeCat;
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase()) || p.vendeur.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <LinearGradient colors={['#1A4F22', '#256B2E']} style={styles.header}>
        <Text style={styles.headerTitle}>Catégories</Text>
        <Text style={styles.headerSub}>Explorez tous nos produits agricoles</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans les catégories..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
        {CATS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.catChip, activeCat === c && styles.catChipActive]}
            onPress={() => setActiveCat(c)}
          >
            <Text style={[styles.catChipText, activeCat === c && styles.catChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.countText}>{filtered.length} produits disponibles</Text>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={[styles.grid, { paddingBottom: botPad + 70 }]}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            <View style={styles.imgWrap}>
              <Image source={item.img} style={styles.img} />
              {item.badge && (
                <View style={[styles.badge, { backgroundColor: item.badge === 'Frais' ? '#256B2E' : '#F97316' }]}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={2}>{item.nom}</Text>
              <Text style={styles.cardSeller} numberOfLines={1}>{item.vendeur}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingText}>{item.note} ({item.avis})</Text>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.price}>{item.prix} F<Text style={styles.unit}>/{item.unite}</Text></Text>
                 <TouchableOpacity style={styles.addBtn} onPress={() => addItem({ id: item.id, name: item.nom, price: item.prix, unite: item.unite, img: item.img })}>
                   <Ionicons name="add" size={18} color="#fff" />
                 </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="search" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2' },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18, gap: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_400Regular', marginBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1A1A1A' },
  catScroll: { maxHeight: 54 },
  catRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingVertical: 12 },
  catChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
  catChipActive: { backgroundColor: '#256B2E', borderColor: '#256B2E' },
  catChipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  catChipTextActive: { color: '#fff' },
  countText: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', paddingHorizontal: 18, marginBottom: 2 },
  grid: { paddingHorizontal: 18, paddingTop: 8 },
  gridRow: { justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  imgWrap: { height: 130, position: 'relative' },
  img: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  cardBody: { padding: 10, gap: 4 },
  cardName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1A1A1A' },
  cardSeller: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  price: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  unit: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#9CA3AF' },
  addBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#256B2E', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9CA3AF', fontFamily: 'Inter_500Medium' },
});
