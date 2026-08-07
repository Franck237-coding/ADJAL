import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Avatar from '@/components/farmer/Avatar';
import StatusBadge from '@/components/farmer/StatusBadge';
import { PRODUCTS, ORDERS, NOTIFICATIONS, PERFORMANCE, FARMER } from '@/data/farmer-mock';

export default function FarmerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [dismissed, setDismissed] = useState<number[]>([]);
  const topPad = Platform.OS === 'web' ? 44 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const visibleNotifications = NOTIFICATIONS.filter((n) => !dismissed.includes(n.id)).slice(0, 3);
  const recentOrders = ORDERS.slice(0, 3);
  const featuredProducts = PRODUCTS.filter((p) => p.status === 'Disponible').slice(0, 3);

  const activeProducts = PRODUCTS.filter((p) => p.status === 'Disponible').length;
  const pendingOrders = ORDERS.filter((o) => o.status === 'En attente').length;
  const deliveredOrders = ORDERS.filter((o) => o.status === 'Livrée').length;
  const deliveredRevenue = ORDERS.filter((o) => o.status === 'Livrée').reduce((sum, o) => sum + o.total, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#2E7D32', '#1B5E20']} style={[styles.header, { paddingTop: topPad }]}>
        <View style={styles.statusBar} />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Avatar initials={FARMER.initials} size={48} bg={['#2E7D32', '#1B5E20']} />
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{FARMER.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationText}>{FARMER.location}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.certifiedBadge}>
              <Text style={styles.certifiedText}>Certifié</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/(farmer)/(inner)/notifications')}>
              <Ionicons name="notifications" size={22} color="#fff" />
              {NOTIFICATIONS.filter((n) => n.unread).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{NOTIFICATIONS.filter((n) => n.unread).length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <Text style={styles.searchInput}>Chercher un produit, une commande...</Text>
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
        {/* Banner */}
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
            <Text style={styles.bannerSub}>Vendez directement aux consommateurs</Text>
          </LinearGradient>
        </ImageBackground>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Produits vedettes</Text>
            <TouchableOpacity onPress={() => router.push('/(farmer)/products')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 4 }}>
            {featuredProducts.map((product) => (
              <View key={product.id} style={styles.featCard}>
                <View style={styles.featImgWrap}>
                  <View style={styles.featImgPlaceholder}>
                    <Text style={styles.featEmoji}>{product.emoji}</Text>
                  </View>
                  <View style={[styles.featBadge, { backgroundColor: statusColor(product.status) }]}>
                    <Text style={styles.featBadgeText}>{product.status}</Text>
                  </View>
                </View>
                <Text style={styles.featName}>{product.name}</Text>
                <Text style={styles.featLoc}>{product.location}</Text>
                <View style={styles.featBottom}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{PERFORMANCE.rating} ({product.qty} {product.unit})</Text>
                  </View>
                </View>
                <View style={styles.featPriceRow}>
                  <Text style={styles.featPrice}>{product.price.toLocaleString('fr-FR')} F<Text style={styles.featUnit}>/{product.unit}</Text></Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(farmer)/(inner)/edit-product')}>
                    <Ionicons name="create" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/(farmer)/products')}>
            <View style={[styles.summaryIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="cube" size={20} color="#2E7D32" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>{activeProducts}</Text>
              <Text style={styles.summaryLabel}>Produits actifs</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#2E7D32" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/(farmer)/orders')}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="time" size={20} color="#F57F17" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>{pendingOrders}</Text>
              <Text style={styles.summaryLabel}>En attente</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#F57F17" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/(farmer)/(inner)/stats')}>
            <View style={[styles.summaryIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="cash" size={20} color="#1565C0" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>{(deliveredRevenue / 1000).toFixed(0)}k</Text>
              <Text style={styles.summaryLabel}>Revenus livrés</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#1565C0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.summaryCard} onPress={() => router.push('/(farmer)/orders')}>
            <View style={[styles.summaryIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>{deliveredOrders}</Text>
              <Text style={styles.summaryLabel}>Livrées</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commandes récentes</Text>
            <TouchableOpacity onPress={() => router.push('/(farmer)/orders')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ordersList}>
            {recentOrders.map((order) => (
              <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => router.push({ pathname: '/(farmer)/(inner)/order-detail', params: { id: order.id } })}>
                <View style={styles.orderCardLeft}>
                  <Avatar initials={order.initials} size={40} bg={['#2E7D32', '#1B5E20']} />
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderCustomer}>{order.customer}</Text>
                    <Text style={styles.orderProduct}>{order.product} · {order.qty}</Text>
                  </View>
                </View>
                <View style={styles.orderCardRight}>
                  <Text style={styles.orderTotal}>{order.total.toLocaleString('fr-FR')} F</Text>
                  <StatusBadge label={order.status} color={statusColor(order.status)} bg={statusBg(order.status)} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <TouchableOpacity onPress={() => router.push('/(farmer)/(inner)/notifications')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.notificationsList}>
            {visibleNotifications.map((n) => (
              <View key={n.id} style={[styles.notificationCard, n.unread && styles.notificationCardUnread]}>
                <View style={[styles.notificationIcon, { backgroundColor: n.iconBg }]}>
                  <Ionicons name={n.icon as any} size={18} color={n.iconColor} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{n.title}</Text>
                  <Text style={styles.notificationBody} numberOfLines={1}>{n.body}</Text>
                  <Text style={styles.notificationTime}>{n.time}</Text>
                </View>
                <TouchableOpacity onPress={() => setDismissed([...dismissed, n.id])}>
                  <Ionicons name="close" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Card */}
        <View style={styles.section}>
          <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Performance ferme</Text>
            <View style={styles.performanceStats}>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>{PERFORMANCE.rating}</Text>
                <Text style={styles.performanceLabel}>Note</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>{PERFORMANCE.loyalty}%</Text>
                <Text style={styles.performanceLabel}>Fidélité</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>{PERFORMANCE.delivery}%</Text>
                <Text style={styles.performanceLabel}>Livraison</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.performanceBtn} onPress={() => router.push('/(farmer)/(inner)/stats')}>
              <Text style={styles.performanceBtnText}>Voir statistiques</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
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
  header: { paddingHorizontal: 18, paddingBottom: 18, gap: 6 },
  statusBar: { height: 20, backgroundColor: '#fff' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerInfo: { gap: 2 },
  headerName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter_400Regular' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  certifiedBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  certifiedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  notificationBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notificationBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#F57F17', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  notificationBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },
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
  featCard: { width: 165, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', gap: 8, padding: 10 },
  featImgWrap: { position: 'relative', height: 120, borderRadius: 12, overflow: 'hidden' },
  featImgPlaceholder: { width: '100%', height: '100%', backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  featEmoji: { fontSize: 48 },
  featBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  featBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  featName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1A1A1A' },
  featLoc: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  featBottom: { flexDirection: 'row', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  featPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  featUnit: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#9CA3AF' },
  addBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#256B2E', alignItems: 'center', justifyContent: 'center' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  summaryCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryContent: { flex: 1 },
  summaryValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1A2E1A' },
  summaryLabel: { fontSize: 11, color: '#6B7A6B', fontFamily: 'Inter_400Regular' },
  ordersList: { gap: 10 },
  orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  orderCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  orderInfo: { gap: 2 },
  orderCustomer: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1A2E1A' },
  orderProduct: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_400Regular' },
  orderCardRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#2E7D32' },
  notificationsList: { gap: 10 },
  notificationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  notificationCardUnread: { borderWidth: 1.5, borderColor: '#F57F17' },
  notificationIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1A2E1A' },
  notificationBody: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_400Regular', marginTop: 2 },
  notificationTime: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  performanceCard: { borderRadius: 20, padding: 20, gap: 16 },
  performanceTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  performanceStats: { flexDirection: 'row', justifyContent: 'space-between' },
  performanceStat: { alignItems: 'center', gap: 4 },
  performanceValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  performanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular' },
  performanceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 10, borderRadius: 12 },
  performanceBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
