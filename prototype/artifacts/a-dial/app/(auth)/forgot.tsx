import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleSend = () => {
    if (!value) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push({ pathname: '/(auth)/otp', params: { mode: 'forgot' } });
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
      </TouchableOpacity>

      <Ionicons name="key" size={36} color="#256B2E" style={{ marginBottom: 4 }} />
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>Sélectionnez la méthode de récupération</Text>

      {/* Toggle */}
      <View style={styles.toggle}>
        {(['email', 'phone'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.toggleBtn, method === m && styles.toggleActive]}
            onPress={() => { setMethod(m); setValue(''); }}
          >
            <Ionicons
              name={m === 'email' ? 'mail' : 'call'}
              size={15}
              color={method === m ? '#256B2E' : '#6B7280'}
            />
            <Text style={[styles.toggleText, method === m && styles.toggleTextActive]}>
              {m === 'email' ? 'Email' : 'Téléphone'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={18} color="#256B2E" />
        <Text style={styles.infoText}>
          Nous vous enverrons un code de vérification à votre{' '}
          {method === 'email' ? 'adresse email' : 'numéro de téléphone'} pour réinitialiser votre mot de passe.
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{method === 'email' ? 'Adresse email' : 'Numéro de téléphone'}</Text>
        <View style={styles.inputRow}>
          <Ionicons
            name={method === 'email' ? 'mail-outline' : 'call-outline'}
            size={18}
            color="#9CA3AF"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder={method === 'email' ? 'vous@exemple.com' : '6XX XXX XXX'}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={setValue}
            keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.btn, (!value || loading) && { opacity: 0.6 }]}
        onPress={handleSend}
        disabled={!value || loading}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            <Text style={styles.btnText}>Envoyer le code</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2', paddingHorizontal: 24, gap: 14 },
  backBtn: { marginBottom: 4, alignSelf: 'flex-start', padding: 4 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B7280' },
  toggle: { flexDirection: 'row', backgroundColor: '#E8F5E9', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  toggleText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  toggleTextActive: { color: '#256B2E' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#E8F5E9', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#C6E6CA' },
  infoText: { flex: 1, fontSize: 13, color: '#374151', fontFamily: 'Inter_400Regular', lineHeight: 20 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#374151' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: '#1A1A1A' },
  btn: { backgroundColor: '#256B2E', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  btnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
