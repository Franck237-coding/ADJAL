import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleContinue = async () => {
    if (!nom || !email || !telephone) { setError('Veuillez remplir tous les champs.'); return; }
    if (!email.includes('@')) { setError('Adresse email invalide.'); return; }
    setError('');
    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await register({ nom, email, telephone: `+237 ${telephone}` });
      router.push('/(auth)/otp');
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
      </TouchableOpacity>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        <View style={styles.stepActive}><Text style={styles.stepActiveText}>1</Text></View>
        <View style={styles.stepLine} />
        <View style={styles.stepInactive}><Text style={styles.stepInactiveText}>2</Text></View>
        <Text style={styles.stepLabel}>Étape 1/2</Text>
      </View>

      <Text style={styles.title}>Créer un compte</Text>
      <Text style={styles.subtitle}>Rejoignez le marché agricole du Cameroun</Text>

      {error !== '' && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Nom complet</Text>
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Jean Dupont"
            placeholderTextColor="#9CA3AF"
            value={nom}
            onChangeText={setNom}
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Adresse email</Text>
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="vous@exemple.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Numéro de téléphone</Text>
        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>CM +237</Text>
          </View>
          <View style={styles.divider} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="6XX XXX XXX"
            placeholderTextColor="#9CA3AF"
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
        onPress={handleContinue}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.btnText}>Continuer</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.loginHint}>Déjà un compte ? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.loginLink}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2' },
  content: { paddingHorizontal: 24, gap: 16 },
  backBtn: { marginBottom: 8, alignSelf: 'flex-start', padding: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepActive: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#256B2E', alignItems: 'center', justifyContent: 'center' },
  stepActiveText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#D1D5DB', maxWidth: 40 },
  stepInactive: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepInactiveText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#9CA3AF' },
  stepLabel: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B7280', marginBottom: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { fontSize: 13, color: '#EF4444', fontFamily: 'Inter_400Regular' },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#374151' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: '#1A1A1A' },
  prefix: { marginRight: 10 },
  prefixText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#256B2E' },
  divider: { width: 1, height: 20, backgroundColor: '#E5E7EB', marginRight: 12 },
  btnPrimary: { backgroundColor: '#256B2E', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  btnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginHint: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  loginLink: { fontSize: 14, color: '#256B2E', fontFamily: 'Inter_700Bold' },
});
