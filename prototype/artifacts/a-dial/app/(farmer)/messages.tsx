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
import { useRouter } from 'expo-router';
import Avatar from '@/components/farmer/Avatar';
import { CONVERSATIONS } from '@/data/farmer-mock';

export default function FarmerMessages() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 44 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const totalUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  const filtered = CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMsg.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSub}>Communiquez avec vos clients</Text>
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
        {filtered.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.convRow}
            onPress={() =>
              router.push({
                pathname: '/(farmer)/(inner)/chat',
                params: { id: String(c.id) },
              })
            }
          >
            <View style={[styles.avatar, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.avatarText}>{c.initials}</Text>
              {c.unread > 0 && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.convInfo}>
              <View style={styles.convTop}>
                <Text style={styles.convName}>{c.name}</Text>
                <Text style={styles.convTime}>{c.time}</Text>
              </View>
              {c.product && <Text style={styles.convRole}>📦 {c.product}</Text>}
              <Text style={[styles.convMsg, c.unread > 0 && styles.convMsgBold]} numberOfLines={1}>{c.lastMsg}</Text>
            </View>
            {c.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{c.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <Text style={styles.empty}>Aucune conversation</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
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
  convRole: { fontSize: 12, color: '#2E7D32', fontFamily: 'Inter_500Medium', marginTop: 1 },
  convMsg: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular', marginTop: 2 },
  convMsgBold: { fontFamily: 'Inter_600SemiBold', color: '#374151' },
  unreadBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  unreadText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 14 },
});
