import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TopBar from '@/components/farmer/TopBar';
import Avatar from '@/components/farmer/Avatar';

const CONVERSATIONS: any[] = [
  {
    id: 1,
    name: 'Jean Mfou',
    initials: 'JM',
    product: 'Tomates fraîches',
    messages: [
      { id: 1, from: 'them', text: 'Bonjour, vos tomates sont toujours disponibles ?', time: '09:14' },
      { id: 2, from: 'me', text: 'Oui, 50kg disponibles à 450 FCFA/kg.', time: '09:20' },
      { id: 3, from: 'them', text: 'Parfait, je commande 5kg.', time: '09:22' },
    ],
  },
  {
    id: 2,
    name: 'Marie Ewondo',
    initials: 'ME',
    product: 'Ananas Douala',
    messages: [
      { id: 1, from: 'me', text: 'Bonjour, je suis intéressé par vos ananas.', time: 'Hier' },
      { id: 2, from: 'them', text: 'Bonjour ! Oui, ils sont frais.', time: 'Hier' },
    ],
  },
];

export default function BuyerChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const conversation = CONVERSATIONS.find((c) => String(c.id) === params.id) || CONVERSATIONS[0];
  const [messages, setMessages] = useState(conversation.messages);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const newMsg = {
      id: Date.now(),
      from: 'me' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev: any[]) => [...prev, newMsg]);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TopBar
        title={conversation.name}
        onBack={() => router.back()}
        right={
          <TouchableOpacity>
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
        }
        transparent
      />

      <View style={[styles.chatHeader, { marginTop: insets.top + 48 }]}>
        <Avatar initials={conversation.initials} size={40} bg={['#256B2E', '#1A4F22']} />
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderName}>{conversation.name}</Text>
          {conversation.product && <Text style={styles.chatHeaderProduct}>📦 {conversation.product}</Text>}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m: any) => (
          <View
            key={m.id}
            style={[styles.msgRow, m.from === 'me' ? styles.msgRowMe : styles.msgRowThem]}
          >
            {m.from === 'them' && (
              <Avatar initials={conversation.initials} size={28} bg={['#CBD5E1', '#9CA3AF']} />
            )}
            <View
              style={[
                styles.bubble,
                m.from === 'me' ? styles.bubbleMe : styles.bubbleThem,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  m.from === 'me' ? styles.bubbleTextMe : styles.bubbleTextThem,
                ]}
              >
                {m.text}
              </Text>
              <Text
                style={[
                  styles.bubbleTime,
                  m.from === 'me' ? styles.bubbleTimeMe : styles.bubbleTimeThem,
                ]}
              >
                {m.time}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(botPad, 10) }]}>
        <TouchableOpacity style={styles.barIcon}>
          <Ionicons name="attach" size={22} color="#9CA3AF" />
        </TouchableOpacity>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Écrire un message..."
          placeholderTextColor="#9CA3AF"
          style={styles.barInput}
          onSubmitEditing={send}
        />
        <TouchableOpacity onPress={send} style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}>
          <Ionicons name="send" size={18} color={text.trim() ? '#fff' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  scroll: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46,125,50,0.12)',
  },
  chatHeaderName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A2E1A',
  },
  chatHeaderProduct: {
    fontSize: 12,
    color: '#256B2E',
    fontFamily: 'Inter_400Regular',
  },
  msgRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: '#256B2E',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.12)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: '#1A2E1A' },
  bubbleTime: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  bubbleTimeThem: {
    color: '#9CA3AF',
    textAlign: 'left',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(46,125,50,0.12)',
  },
  barIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barInput: {
    flex: 1,
    backgroundColor: '#EDE9E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1A2E1A',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#256B2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#EDE9E2' },
});
