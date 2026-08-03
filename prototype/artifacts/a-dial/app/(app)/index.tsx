import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  ImageBackground,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
  { id: 'all', nom: 'Tout', icon: 'apps' as const, color: '#256B2E' },
  { id: 'fruits', nom: 'Fruits', icon: 'nutrition' as const, color: '#F97316' },
  { id: 'legumes', nom: 'Légumes', icon: 'leaf' as const, color: '#22C55E' },
  { id: 'cereales', nom: 'Céréales', icon: 'flower' as const, color: '#F59E0B' },
  { id: 'tubercules', nom: 'Tubercules', icon: 'earth' as const, color: '#A16207' },
  { id: 'epices', nom: 'Épices', icon: 'flame' as const, color: '#EF4444' },
];

const MARKET_PRICES = [
  { nom: 'Tomates', prix: 450, unite: 'kg', pct: 12, hausse: true },
  { nom: 'Maïs', prix: 320, unite: 'kg', pct: 5, hausse: false },
  { nom: 'Ignames', prix: 550, unite: 'kg', pct: 8, hausse: true },
  { nom: 'Gingembre', prix: 1200, unite: 'kg', pct: 22, hausse: true },
  { nom: 'Ananas', prix: 800, unite: 'pièce', pct: 3, hausse: false },
];

const FEATURED = [
  { id: '1', nom: 'Tomates fraîches', vendeur: 'Jean Mfou', loc: 'Yaoundé', prix: 450, unite: 'kg', note: 4.8, avis: 124, badge: 'Frais', img: require('../../assets/images/tomatoes.jpg') },
  { id: '2', nom: 'Ananas Douala', vendeur: 'Marie Ewondo', loc: 'Douala', prix: 800, unite: 'pièce', note: 4.6, avis: 87, badge: 'Bio', img: require('../../assets/images/pineapple.jpg') },
];

const RECOMMENDED = [
  { id: '1', nom: 'Tomates fraîches', vendeur: 'Jean Mfou', loc: 'Yaoundé', prix: 450, unite: 'kg', note: 4.8, img: require('../../assets/images/tomatoes.jpg') },
  { id: '2', nom: 'Ananas Douala', vendeur: 'Marie Ewondo', loc: 'Douala', prix: 800, unite: 'pièce', note: 4.6, img: require('../../assets/images/pineapple.jpg') },
  { id: '3', nom: 'Maïs séché', vendeur: 'Paul Beti', loc: 'Bafoussam', prix: 320, unite: 'kg', note: 4.7, img: require('../../assets/images/corn.jpg') },
  { id: '4', nom: 'Ignames blanches', vendeur: 'Chantal Bassa', loc: 'Bertoua', prix: 550, unite: 'kg', note: 4.5, img: require('../../assets/images/ginger.jpg') },
  { id: '5', nom: 'Gingembre frais', vendeur: 'Ahmed Ngaoundéré', loc: 'Ngaoundéré', prix: 1200, unite: 'kg', note: 4.9, img: require('../../assets/images/ginger.jpg') },
];

export default function HomeScreen() {
  const { user, isGuest } = useAuth();
  const { addItem, count } = useCart();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const firstName = user?.nom?.split(' ')[0] ?? 'Amina';

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1A4F22', '#256B2E']} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={16} color="#256B2E" />
            </View>
            <Text style={styles.logoText}>A Dial</Text>
            <View style={styles.marketBadge}>
              <Text style={styles.marketBadgeText}>Marché agricole</Text>
            </View>
            {isGuest && (
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>Mode invité</Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            {isGuest ? (
              <TouchableOpacity style={styles.signupBtn} onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.signupBtnText}>S&apos;inscrire</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="notifications-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(app)/(inner)/cart')}>
                  <Ionicons name="cart-outline" size={22} color="#fff" />
                  {count > 0 && (
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.avatar}>
                  <Text style={styles.avatarText}>{firstName[0]}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={styles.locationText}>Yaoundé, Cameroun</Text>
        </View>
        <Text style={styles.greeting}>Bonjour, {firstName}</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Chercher un produit, un agriculteur..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: botPad + 70 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily offer banner */}
        <ImageBackground
          source={require('../../assets/images/banner.jpg')}
          style={styles.banner}
          imageStyle={{ borderRadius: 16 }}
        >
          <LinearGradient colors={['transparent', 'rgba(26,79,34,0.85)']} style={styles.bannerOverlay}>
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>OFFRE DU JOUR</Text>
            </View>
            <Text style={styles.bannerTitle}>Réduisez les pertes,{'\n'}maximisez vos revenus</Text>
            <Text style={styles.bannerSub}>Connectez-vous directement aux agriculteurs</Text>
          </LinearGradient>
        </ImageBackground>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/categories')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(c) => c.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.catItem} onPress={() => router.push('/(app)/categories')}>
                <View style={[styles.catIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={styles.catLabel}>{item.nom}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Featured products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produits vedettes</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/categories')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={FEATURED}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingHorizontal: 4 }}
            renderItem={({ item }) => (
              <View style={styles.featCard}>
                <View style={styles.featImgWrap}>
                  <Image source={item.img} style={styles.featImg} />
                  <View style={styles.featBadge}>
                    <Text style={styles.featBadgeText}>{item.badge}</Text>
                  </View>
                  <TouchableOpacity style={styles.heartBtn}>
                    <Ionicons name="heart-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.featName}>{item.nom}</Text>
                <Text style={styles.featLoc}>{item.loc}</Text>
                <View style={styles.featBottom}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{item.note} ({item.avis})</Text>
                  </View>
                </View>
                <View style={styles.featPriceRow}>
                  <Text style={styles.featPrice}>{item.prix} F<Text style={styles.featUnit}>/{item.unite}</Text></Text>
                   <TouchableOpacity style={styles.addBtn} onPress={() => addItem({ id: item.id, name: item.nom, price: item.prix, unite: item.unite, img: item.img })}>
                     <Ionicons name="add" size={18} color="#fff" />
                   </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>

        {/* Market prices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prix du marché</Text>
            <Text style={styles.updatedAt}>Mis à jour 08:00</Text>
          </View>
          <View style={styles.priceCard}>
            {MARKET_PRICES.map((p) => (
              <View key={p.nom} style={styles.priceRow}>
                <Text style={styles.priceName}>{p.nom}</Text>
                <Text style={styles.priceVal}>{p.prix} F/{p.unite}</Text>
                <View style={[styles.priceBadge, { backgroundColor: p.hausse ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Ionicons
                    name={p.hausse ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={p.hausse ? '#059669' : '#EF4444'}
                  />
                  <Text style={[styles.pricePct, { color: p.hausse ? '#059669' : '#EF4444' }]}>
                    {p.hausse ? '+' : '-'}{p.pct}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recommended */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommandés</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recList}>
            {RECOMMENDED.map((p) => (
              <View key={p.id} style={styles.recRow}>
                <Image source={p.img} style={styles.recImg} />
                <View style={styles.recInfo}>
                  <Text style={styles.recName}>{p.nom}</Text>
                  <Text style={styles.recSeller}>{p.vendeur} · {p.loc}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={styles.ratingText}>{p.note}</Text>
                  </View>
                </View>
                 <View style={styles.recRight}>
                   <Text style={styles.recPrice}>{p.prix} F</Text>
                   <Text style={styles.recUnit}>/{p.unite}</Text>
                    <TouchableOpacity style={styles.addSmallBtn} onPress={() => addItem({ id: p.id, name: p.nom, price: p.prix, unite: p.unite, img: p.img })}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                 </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2' },
  header: { paddingHorizontal: 18, paddingBottom: 18, gap: 6 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  logoCircle: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  marketBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  marketBadgeText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#fff' },
  guestBadge: { backgroundColor: '#F97316', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  guestBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#3D8B44', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  cartBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#F97316', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },
  signupBtn: { backgroundColor: '#F97316', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  signupBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular' },
  greeting: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1A1A1A' },
  filterBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#256B2E', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, paddingHorizontal: 18, paddingTop: 16 },
  banner: { height: 150, marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16, borderRadius: 16, gap: 4 },
  offerBadge: { backgroundColor: '#F97316', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  offerBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.5 },
  bannerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff', lineHeight: 23 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter_400Regular' },
  section: { marginBottom: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  seeAll: { fontSize: 13, color: '#256B2E', fontFamily: 'Inter_500Medium' },
  updatedAt: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  catItem: { alignItems: 'center', gap: 6 },
  catIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#374151', textAlign: 'center' },
  featCard: { width: 165, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', gap: 8, padding: 10 },
  featImgWrap: { position: 'relative', height: 120, borderRadius: 12, overflow: 'hidden' },
  featImg: { width: '100%', height: '100%' },
  featBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#256B2E', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  featBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  heartBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.35)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1A1A1A' },
  featLoc: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  featBottom: { flexDirection: 'row', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  featPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  featUnit: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#9CA3AF' },
  addBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#256B2E', alignItems: 'center', justifyContent: 'center' },
  priceCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  priceName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: '#374151' },
  priceVal: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1A1A1A', marginRight: 12 },
  priceBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  pricePct: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  recList: { gap: 12 },
  recRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, gap: 12 },
  recImg: { width: 56, height: 56, borderRadius: 12 },
  recInfo: { flex: 1, gap: 3 },
  recName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1A1A1A' },
  recSeller: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  recRight: { alignItems: 'flex-end', gap: 4 },
  recPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  recUnit: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  addSmallBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#256B2E', alignItems: 'center', justifyContent: 'center' },
});
