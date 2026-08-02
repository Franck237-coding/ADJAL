import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const ROLES = [
  {
    id: 'ACHETEUR' as const,
    icon: 'bag-handle' as const,
    color: '#F97316',
    title: 'Acheteur',
    desc: 'Je cherche des produits agricoles frais',
    benefits: [
      'Accédez à des millions de produits',
      'Prix directs des producteurs',
      'Recevez des recommandations proches de chez vous',
    ],
  },
  {
    id: 'AGRICULTEUR' as const,
    icon: 'leaf' as const,
    color: '#256B2E',
    title: 'Agriculteur',
    desc: 'Je veux vendre mes récoltes',
    benefits: [
      'Publiez vos produits facilement',
      'Touchez plus d\'acheteurs',
      'Réduisez vos pertes post-récoltes',
    ],
  },
];

export default function RoleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<'ACHETEUR' | 'AGRICULTEUR' | null>(null);
  const [loading, setLoading] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleStart = async () => {
    if (!selected) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/(auth)/register', params: { role: selected } });
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
    >
      <View style={styles.logoBox}>
        <Ionicons name="leaf" size={26} color="#256B2E" />
      </View>
      <Text style={styles.title}>Bienvenue sur A Dial !</Text>
      <Text style={styles.subtitle}>Comment souhaitez-vous utiliser l&apos;application ?</Text>

      <View style={styles.cardsGap}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[styles.card, selected === role.id && styles.cardSelected]}
            onPress={() => setSelected(role.id)}
            activeOpacity={0.85}
          >
            <View style={styles.cardRow}>
              <View style={[styles.roleIcon, { backgroundColor: role.color + '20' }]}>
                <Ionicons name={role.icon} size={24} color={role.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
              </View>
              <View style={[styles.radio, selected === role.id && styles.radioActive]}>
                {selected === role.id && <View style={styles.radioInner} />}
              </View>
            </View>

            <View style={styles.benefits}>
              {role.benefits.map((b) => (
                <View key={b} style={styles.benefitRow}>
                  <Ionicons name="checkmark" size={14} color={role.color} />
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btn, (!selected || loading) && { opacity: 0.5 }]}
        onPress={handleStart}
        disabled={!selected || loading}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            <Text style={styles.btnText}>Commencer</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2' },
  content: { paddingHorizontal: 24, gap: 16 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#1A1A1A', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B7280', textAlign: 'center' },
  cardsGap: { gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 2, borderColor: '#E5E7EB', gap: 14 },
  cardSelected: { borderColor: '#256B2E', backgroundColor: '#FAFFFE' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  roleIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  roleTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  roleDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#6B7280', marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#256B2E' },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#256B2E' },
  benefits: { gap: 8 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 13, color: '#374151', fontFamily: 'Inter_400Regular' },
  btn: { backgroundColor: '#256B2E', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  btnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
