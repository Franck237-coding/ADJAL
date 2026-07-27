import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const CODE_LENGTH = 6;

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode ?? 'register';
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState(180); // 3 minutes
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleDigit = (val: string, index: number) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleVerify = async () => {
    const full = code.join('');
    if (full.length < CODE_LENGTH) return;
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setLoading(false);
      if (mode === 'forgot') {
        router.replace('/(auth)/reset');
      } else {
        router.replace('/(auth)/role');
      }
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
      </TouchableOpacity>

      <Text style={styles.title}>Vérification</Text>
      <Text style={styles.subtitle}>Code à 6 chiffres envoyé à vous@exemple.com</Text>

      <View style={styles.codeRow}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputRefs.current[i] = r; }}
            style={[styles.codeInput, digit ? styles.codeInputFilled : {}]}
            value={digit}
            onChangeText={(v) => handleDigit(v, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            textAlign="center"
          />
        ))}
      </View>

      <View style={styles.timerRow}>
        {timer > 0 ? (
          <Text style={styles.timerText}>Renvoyer le code dans {formatTimer(timer)}</Text>
        ) : (
          <TouchableOpacity onPress={() => setTimer(180)}>
            <Text style={styles.resendText}>Renvoyer le code</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.btn, code.join('').length < CODE_LENGTH && styles.btnDisabled, loading && { opacity: 0.7 }]}
        onPress={handleVerify}
        disabled={code.join('').length < CODE_LENGTH || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.btnText}>Vérifier</Text>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2', paddingHorizontal: 24, gap: 16 },
  backBtn: { marginBottom: 8, alignSelf: 'flex-start', padding: 4 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#1A1A1A' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B7280', lineHeight: 22 },
  codeRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  codeInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A1A',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  codeInputFilled: { borderColor: '#256B2E', backgroundColor: '#F0FAF1' },
  timerRow: { alignItems: 'center', marginTop: 4 },
  timerText: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  resendText: { fontSize: 14, color: '#256B2E', fontFamily: 'Inter_600SemiBold' },
  btn: { backgroundColor: '#256B2E', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  btnDisabled: { backgroundColor: '#D1D5DB' },
  btnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
