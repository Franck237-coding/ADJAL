import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { isOnboarded, user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(ring1, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(ring2, { toValue: 1, duration: 900, delay: 150, useNativeDriver: true }),
        Animated.timing(ring3, { toValue: 1, duration: 1200, delay: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      if (isLoading) return;
      if (!isOnboarded) {
        router.replace('/(auth)/onboarding');
      } else if (user) {
        router.replace('/(app)/');
      } else {
        router.replace('/(auth)/welcome');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [isLoading]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <LinearGradient colors={['#1A4F22', '#256B2E', '#2E7D32']} style={styles.container}>
      <Animated.View style={[styles.ring, styles.ring1, { opacity: ring1 }]} />
      <Animated.View style={[styles.ring, styles.ring2, { opacity: ring2 }]} />
      <Animated.View style={[styles.ring, styles.ring3, { opacity: ring3 }]} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }], paddingTop: topPad },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="leaf" size={34} color="#256B2E" />
        </View>
        <Text style={styles.brand}>a djal</Text>
        <Text style={styles.tagline}>Chaque récolte compte</Text>
        <Text style={styles.subtitle}>Marché agricole camerounais</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="people" size={12} color="#fff" />
            <Text style={styles.statText}> 12 000+ utilisateurs</Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#fff" />
            <Text style={styles.statText}> 100% sécurisé</Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const S = 280;
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ring1: { width: S, height: S },
  ring2: { width: S + 120, height: S + 120 },
  ring3: { width: S + 240, height: S + 240 },
  content: { alignItems: 'center', gap: 10 },
  iconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  brand: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontFamily: 'Inter_500Medium' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statText: { fontSize: 11, color: '#fff', fontFamily: 'Inter_500Medium' },
});
