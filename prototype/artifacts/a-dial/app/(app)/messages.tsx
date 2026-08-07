import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

const CONVERSATIONS = [
  { id: '1', nom: 'Jean Mfou', role: 'Agriculteur', msg: 'Votre commande est prête pour l\'expédition.', heure: '09:14', nonLu: true, init: 'JM', color: '#256B2E' },
  { id: '2', nom: 'Marie Ewondo', role: 'Agricultrice', msg: 'Bonjour ! Avez-vous vu mes nouveaux ananas ?', heure: 'Hier', nonLu: false, init: 'ME', color: '#3D8B44' },
  { id: '3', nom: 'A Dial Support', role: 'Service client', msg: 'Merci pour votre retour. Nous traitons votre...', heure: '1 an', nonLu: false, init: 'AD', color: '#F97316' },
  { id: '4', nom: 'Paul Beti', role: 'Agriculteur', msg: 'Le stock de maïs est maintenant disponible.', heure: '28 jun', nonLu: false, init: 'PB', color: '#5B4A2E' },
  { id: '5', nom: 'Rose Bamiléké', role: 'Agricultrice', msg: 'J\'ai de nouveaux lots de taro disponibles !', heure: '27 jun', nonLu: false, init: 'RB', color: '#C62828' },
];

function AccessDenied() {
  const router = useRouter();
  return (
    <View style={denied.container}>
      <View style={denied.iconBox}>
        <Ionicons name="chatbubbles" size={40} color="#9CA3AF" />
      </View>
      <Text style={denied.title}>Accès réservé</Text>
      <Text style={denied.desc}>Connectez-vous pour accéder à votre boîte de messages et chatter avec les agriculteurs.</Text>
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

export default function MessagesScreen() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = CONVERSATIONS.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.msg.toLowerCase().includes(search.toLowerCase())
  );

  if (isGuest || !user) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <LinearGradient colors={['#1A4F22', '#256B2E']} style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSub}>Communiquez avec les agriculteurs</Text>
        </LinearGradient>
        <AccessDenied />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={['#1A4F22', '#256B2E']} style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSub}>Communiquez avec les agriculteurs</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une conversation..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: botPad + 70 }} showsVerticalScrollIndicator={false}>
        {filtered.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            style={styles.convRow}
            activeOpacity={0.75}
            onPress={() => router.push({ pathname: '/(app)/(inner)/chat', params: { id: String(conv.id) } })}
          >
            <View style={[styles.avatar, { backgroundColor: conv.color }]}>
              <Text style={styles.avatarText}>{conv.init}</Text>
              {conv.nonLu && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.convInfo}>
              <View style={styles.convTop}>
                <Text style={styles.convName}>{conv.nom}</Text>
                <Text style={styles.convTime}>{conv.heure}</Text>
              </View>
              <Text style={styles.convRole}>{conv.role}</Text>
              <Text style={[styles.convMsg, conv.nonLu && styles.convMsgBold]} numberOfLines={1}>{conv.msg}</Text>
            </View>
            {conv.nonLu && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  convRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff' },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  unreadDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#F97316', borderWidth: 2, borderColor: '#fff' },
  convInfo: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#1A1A1A' },
  convTime: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  convRole: { fontSize: 12, color: '#256B2E', fontFamily: 'Inter_500Medium', marginTop: 1 },
  convMsg: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular', marginTop: 2 },
  convMsgBold: { fontFamily: 'Inter_600SemiBold', color: '#374151' },
  unreadBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  unreadText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
});
