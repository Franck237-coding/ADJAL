import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

function AccessDenied() {
  const router = useRouter();
  return (
    <View style={denied.container}>
      <View style={denied.iconBox}>
        <Ionicons name="person" size={40} color="#9CA3AF" />
      </View>
      <Text style={denied.title}>Accès réservé</Text>
      <Text style={denied.desc}>Connectez-vous pour accéder à votre profil, vos commandes et bien plus encore.</Text>
      <TouchableOpacity style={denied.btnPrimary} onPress={() => router.push('/(auth)/register')}>
        <Text style={denied.btnPrimaryText}>Créer un compte gratuit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={denied.btnOutline} onPress={() => router.push('/(auth)/login')}>
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
  btnPrimary: { backgroundColor: '#256B2E', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignSelf: 'stretch', alignItems: 'center' },
  btnPrimaryText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  btnOutline: { borderWidth: 1.5, borderColor: '#256B2E', paddingVertical: 13, paddingHorizontal: 24, borderRadius: 14, alignSelf: 'stretch', alignItems: 'center' },
  btnOutlineText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#256B2E' },
});

const MENU_ITEMS = [
  { id: 'delivery', icon: 'location' as const, label: 'Adresses de livraison', sub: '2 adresses enregistrées' },
  { id: 'payment', icon: 'card' as const, label: 'Moyens de paiement', sub: 'MTN Mobile Money + Visa' },
  { id: 'notif', icon: 'notifications' as const, label: 'Notifications', sub: 'Activées', toggle: true },
  { id: 'lang', icon: 'language' as const, label: 'Langue', sub: 'Français' },
  { id: 'sponsor', icon: 'people' as const, label: 'Parrainandez un agriculteur', sub: 'Gagnez 500 FCFA par parrainage' },
  { id: 'help', icon: 'help-circle' as const, label: 'Aide et support', sub: 'FAQ, contact' },
  { id: 'settings', icon: 'settings' as const, label: 'Paramètres du compte', sub: 'Sécurité, confidentialité' },
];

export default function ProfileScreen() {
  const { user, isGuest, logout, role } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const firstName = user?.nom?.split(' ')[0] ?? 'A';

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  if (isGuest || !user) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <LinearGradient colors={['#1A4F22', '#256B2E']} style={styles.header}>
          <Text style={styles.headerTitle}>Mon profil</Text>
        </LinearGradient>
        <AccessDenied />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={['#1A4F22', '#256B2E']} style={styles.header}>
        <Text style={styles.headerTitle}>Mon profil</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: botPad + 70 }} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{firstName[0]}</Text>
            <TouchableOpacity style={styles.editAvatar}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.nom}</Text>
            <Text style={styles.profileRole}>{role === 'AGRICULTEUR' ? 'Agriculteur' : 'Acheteur'} · Yaoundé</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>4.9 · 47 commandes</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color="#256B2E" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Commandes', val: '47' },
            { label: 'Économies', val: '12 500 F' },
            { label: 'Impact', val: '98 kg' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity key={item.id} style={[styles.menuRow, idx < MENU_ITEMS.length - 1 && styles.menuBorder]} activeOpacity={0.7}>
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon} size={18} color="#256B2E" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              {item.toggle ? (
                <Switch value={true} onValueChange={() => {}} trackColor={{ true: '#256B2E' }} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>A Dial v1.0.0 · Fait avec ♥ au Cameroun</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2' },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', marginHorizontal: 18, marginTop: 16, borderRadius: 18, padding: 16 },
  avatarLarge: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#256B2E', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarLargeText: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff' },
  editAvatar: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  profileRole: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 18, marginTop: 12, borderRadius: 16, padding: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  menuCard: { backgroundColor: '#fff', marginHorizontal: 18, marginTop: 16, borderRadius: 18, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#1A1A1A' },
  menuSub: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 18, marginTop: 16, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#EF4444' },
  versionText: { textAlign: 'center', fontSize: 12, color: '#D1D5DB', fontFamily: 'Inter_400Regular', marginTop: 16, marginBottom: 4 },
});
