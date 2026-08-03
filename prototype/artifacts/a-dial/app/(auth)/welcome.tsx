import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleGuest = () => {
    continueAsGuest();
    router.replace('/(app)/' as any);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/welcome-bg.jpg')}
      style={styles.bg}
    >
      <LinearGradient
        colors={['rgba(26,79,34,0.55)', 'rgba(26,79,34,0.75)', 'rgba(26,79,34,0.95)']}
        style={[styles.overlay, { paddingTop: topPad + 24 }]}
      >
        {/* Hero content */}
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <Ionicons name="leaf" size={28} color="#256B2E" />
          </View>
          <Text style={styles.brand}>A Dial</Text>
          <Text style={styles.tagline}>Le marché agricole qui connecte{'\n'}fermiers et acheteurs au Cameroun</Text>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="people" size={13} color="#fff" />
              <Text style={styles.statText}> 12 000+ utilisateurs</Text>
            </View>
            <View style={styles.statPill}>
              <Ionicons name="shield-checkmark" size={13} color="#fff" />
              <Text style={styles.statText}> 100% sécurisé</Text>
            </View>
          </View>
        </View>

        {/* Bottom card */}
        <View style={[styles.card, { paddingBottom: botPad + 20 }]}>
          <Text style={styles.cardTitle}>Rejoignez la communauté{'\n'}agricole du Cameroun</Text>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push('/(auth)/role')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Créer un compte gratuit</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnOutlineText}>Se connecter</Text>
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>ou continuer avec</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            {[
              { icon: 'logo-google' as const, label: 'Google' },
              { icon: 'logo-facebook' as const, label: 'Facebook' },
              { icon: 'call' as const, label: 'Téléphone' },
            ].map((s) => (
              <TouchableOpacity key={s.label} style={styles.socialBtn} activeOpacity={0.75}>
                <Ionicons name={s.icon} size={16} color="#374151" />
                <Text style={styles.socialText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleGuest} style={styles.guestLink}>
            <Text style={styles.guestText}>Parcourir sans compte</Text>
            <Ionicons name="arrow-forward" size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  hero: { alignItems: 'center', gap: 10, paddingHorizontal: 24, marginBottom: 24 },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 32, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statText: { fontSize: 11, color: '#fff', fontFamily: 'Inter_500Medium' },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
    paddingHorizontal: 24,
    gap: 12,
  },
  cardTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  btnPrimary: {
    backgroundColor: '#256B2E',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: '#256B2E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnOutlineText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#256B2E' },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  separatorText: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  socialRow: { flexDirection: 'row', gap: 8 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 11,
    backgroundColor: '#fff',
  },
  socialText: { fontSize: 12, color: '#374151', fontFamily: 'Inter_500Medium' },
  guestLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 4 },
  guestText: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
});
