import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopBar from '@/components/farmer/TopBar';
import { NOTIFICATIONS } from '@/data/farmer-mock';

export default function FarmerNotifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 44 : insets.top;
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const remove = (id: number) => setNotifications(notifications.filter((n) => n.id !== id));

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TopBar title="Notifications" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((n) => (
              <View key={n.id} style={[styles.card, n.unread && styles.cardUnread]}>
                <View style={[styles.iconBox, { backgroundColor: n.iconBg }]}>
                  <Ionicons name={n.icon as any} size={20} color={n.iconColor} />
                </View>
                <View style={styles.body}>
                  <View style={styles.row}>
                    <Text style={styles.title}>{n.title}</Text>
                    {n.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.bodyText}>{n.body}</Text>
                  <Text style={styles.time}>{n.time}</Text>
                </View>
                <TouchableOpacity onPress={() => remove(n.id)} style={styles.closeBtn}>
                  <Ionicons name="close" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  list: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  cardUnread: { borderColor: '#F57F17', borderWidth: 1.5 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1A2E1A' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F57F17' },
  bodyText: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_400Regular', marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 4 },
  closeBtn: { padding: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_500Medium' },
});
