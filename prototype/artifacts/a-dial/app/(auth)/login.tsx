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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleLogin = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
    setError('');
    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await login(email, password);
      router.replace('/(app)/');
    } catch {
      setError('Email ou mot de passe incorrect.');
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

      <View style={styles.logoRow}>
        <View style={styles.logoBox}>
          <Ionicons name="leaf" size={22} color="#256B2E" />
        </View>
        <Text style={styles.logoText}>A Dial</Text>
      </View>

      <Text style={styles.title}>Bon retour</Text>
      <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>

      {error !== '' && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Adresse email</Text>
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
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
        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
          />
          <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
            <Ionicons name={showPwd ? 'eye' : 'eye-off'} size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rememberRow}>
        <TouchableOpacity onPress={() => setRemember(!remember)} style={styles.checkRow}>
          <View style={[styles.checkbox, remember && styles.checkboxActive]}>
            {remember && <Ionicons name="checkmark" size={12} color="#fff" />}
          </View>
          <Text style={styles.rememberText}>Se souvenir de moi</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot')}>
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.btnPrimaryText}>Se connecter</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.sepText}>ou</Text>
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

      <View style={styles.signupRow}>
        <Text style={styles.signupHint}>Pas encore de compte ? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
          <Text style={styles.signupLink}>S&apos;inscrire</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2' },
  content: { paddingHorizontal: 24, gap: 16 },
  backBtn: { marginBottom: 8, alignSelf: 'flex-start', padding: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  logoBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#256B2E' },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B7280', marginBottom: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { fontSize: 13, color: '#EF4444', fontFamily: 'Inter_400Regular' },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#374151' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: '#1A1A1A' },
  eyeBtn: { padding: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#256B2E', borderColor: '#256B2E' },
  rememberText: { fontSize: 13, color: '#374151', fontFamily: 'Inter_400Regular' },
  forgotText: { fontSize: 13, color: '#256B2E', fontFamily: 'Inter_500Medium' },
  btnPrimary: { backgroundColor: '#256B2E', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimaryText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  sepText: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  socialRow: { flexDirection: 'row', gap: 8 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 11, backgroundColor: '#fff' },
  socialText: { fontSize: 12, color: '#374151', fontFamily: 'Inter_500Medium' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  signupHint: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  signupLink: { fontSize: 14, color: '#256B2E', fontFamily: 'Inter_700Bold' },
});
