import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Platform,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    badge: 'Pour les acheteurs',
    badgeColor: '#F97316',
    title: 'Trouvez des produits frais',
    desc: 'Accédez à des milliers de produits agricoles directement auprès des producteurs camerounais.',
    btnColor: '#F97316',
    btnLabel: 'Suivant',
    image: require('../../assets/images/welcome-bg.jpg'),
  },
  {
    id: '2',
    badge: 'Pour les agriculteurs',
    badgeColor: '#256B2E',
    title: 'Vendez directement,\ngagnez plus',
    desc: 'Publiez vos récoltes en quelques secondes et connectez-vous à des milliers d\'acheteurs à travers le Cameroun.',
    btnColor: '#256B2E',
    btnLabel: 'Suivant',
    image: require('../../assets/images/onboarding-farmer.jpg'),
  },
  {
    id: '3',
    badge: 'Ensemble',
    badgeColor: '#5B4A2E',
    title: 'Réduisez les pertes,\nmaximisez vos revenus',
    desc: 'A Dial connecte fermiers et consommateurs pour un marché agricole plus juste et durable.',
    btnColor: '#256B2E',
    btnLabel: 'Commencer',
    image: require('../../assets/images/banner.jpg'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { markOnboarded } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(activeIndex + 1);
    } else {
      await markOnboarded();
      router.replace('/(auth)/welcome');
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      flatRef.current?.scrollToIndex({ index: activeIndex - 1 });
      setActiveIndex(activeIndex - 1);
    }
  };

  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <ImageBackground source={item.image} style={styles.imageArea}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={StyleSheet.absoluteFill}
              />
            </ImageBackground>

            <View style={[styles.card, { paddingBottom: botPad + 24 }]}>
              <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
                <Ionicons name="leaf-outline" size={12} color="#fff" />
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>

              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.desc}</Text>

              <View style={[styles.dots, { marginBottom: 24 }]}>
                {SLIDES.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === activeIndex
                        ? { backgroundColor: item.btnColor, width: 20 }
                        : { backgroundColor: '#D1D5DB' },
                    ]}
                  />
                ))}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.backBtn, { opacity: activeIndex === 0 ? 0 : 1 }]}
                  onPress={handleBack}
                  disabled={activeIndex === 0}
                >
                  <Ionicons name="arrow-back" size={20} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.nextBtn, { backgroundColor: item.btnColor }]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextText}>{item.btnLabel}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const IMAGE_H = height * 0.52;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageArea: { width, height: IMAGE_H },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#1A1A1A', lineHeight: 32 },
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B7280', lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 6, borderRadius: 3 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
