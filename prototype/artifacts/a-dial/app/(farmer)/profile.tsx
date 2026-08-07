import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import TopBar from '@/components/farmer/TopBar';
import Avatar from '@/components/farmer/Avatar';
import FarmerBtn from '@/components/farmer/FarmerBtn';
import { FARMER } from '@/data/farmer-mock';

type Section = 'informations' | 'apropos' | 'certifications' | 'avis' | 'deconnexion';

export default function FarmerProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 44 : insets.top;
  const [editing, setEditing] = useState(false);
  const [section, setSection] = useState<Section>('informations');
  const [name, setName] = useState(FARMER.name);
  const [farm, setFarm] = useState(FARMER.farm);
  const [phone, setPhone] = useState(FARMER.phone);
  const [location, setLocation] = useState(FARMER.location);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la galerie nécessaire pour changer la photo');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const sections: { key: Section; label: string; icon: string }[] = [
    { key: 'informations', label: 'Informations', icon: 'person' },
    { key: 'apropos', label: 'À propos', icon: 'information-circle' },
    { key: 'certifications', label: 'Certifications', icon: 'shield-checkmark' },
    { key: 'avis', label: 'Avis clients', icon: 'star' },
    { key: 'deconnexion', label: 'Déconnexion', icon: 'log-out' },
  ];

  const handleSave = () => {
    setEditing(false);
    Alert.alert('Succès', 'Profil mis à jour');
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => router.replace('/(auth)/welcome') },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Avatar initials={FARMER.initials} size={80} bg={['#fff', '#fff']} />
            )}
            <TouchableOpacity style={styles.editAvatarBtn} onPress={pickImage}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{name}</Text>
            <Text style={styles.headerFarm}>{farm}</Text>
            <View style={styles.headerLoc}>
              <Ionicons name="location" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.headerLocText}>{location}</Text>
            </View>
            <View style={styles.badgesRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>⭐ {FARMER.note}</Text></View>
              <View style={styles.badgeCert}><Text style={styles.badgeCertText}>Certifié</Text></View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* Sections tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionsRow}>
          {sections.map((s) => (
            <TouchableOpacity key={s.key} onPress={() => { if (s.key === 'deconnexion') handleLogout(); else setSection(s.key); }} style={[styles.sectionPill, section === s.key && styles.sectionPillActive]}>
              <Ionicons name={s.icon as any} size={16} color={section === s.key ? '#fff' : '#2E7D32'} />
              <Text style={[styles.sectionText, section === s.key && styles.sectionTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.content}>
          {section === 'informations' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informations personnelles</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Nom complet</Text>
                <TextInput value={name} onChangeText={setName} editable={editing} style={[styles.input, !editing && styles.inputDisabled]} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Ferme</Text>
                <TextInput value={farm} onChangeText={setFarm} editable={editing} style={[styles.input, !editing && styles.inputDisabled]} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Téléphone</Text>
                <TextInput value={phone} onChangeText={setPhone} editable={editing} style={[styles.input, !editing && styles.inputDisabled]} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Localisation</Text>
                <TextInput value={location} onChangeText={setLocation} editable={editing} style={[styles.input, !editing && styles.inputDisabled]} />
              </View>
              {editing && <FarmerBtn title="Enregistrer" onPress={handleSave} />}
            </View>
          )}

          {section === 'apropos' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>À propos</Text>
              <Text style={styles.aboutText}>Je suis agriculteur depuis 10 ans, spécialisé dans la culture de légumes et fruits tropicaux. Je m'engage à fournir des produits frais et de qualité à mes clients.</Text>
            </View>
          )}

          {section === 'certifications' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Certifications</Text>
              {[
                { title: "Agriculture durable certifiée", desc: "Certifié par le Ministère de l'Agriculture" },
                { title: "Bonnes pratiques agricoles", desc: "Formation validée en 2024" },
              ].map((c, i) => (
                <View key={i} style={styles.certRow}>
                  <Ionicons name="checkmark-circle" size={22} color="#2E7D32" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certTitle}>{c.title}</Text>
                    <Text style={styles.certDesc}>{c.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section === 'avis' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Avis clients</Text>
              <View style={styles.globalNote}>
                <Text style={styles.globalNoteValue}>{FARMER.note}</Text>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.globalNoteLabel}>Note globale</Text>
              </View>
              {[
                { name: 'Aïssatou Camara', stars: 5, text: 'Produits frais et livraison rapide !' },
                { name: 'Ibrahima Sow', stars: 4, text: 'Bon rapport qualité-prix.' },
              ].map((r, i) => (
                <View key={i} style={styles.reviewCard}>
                  <Text style={styles.reviewName}>{r.name}</Text>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Ionicons key={si} name={si < r.stars ? 'star' : 'star-outline'} size={14} color="#F59E0B" />
                    ))}
                  </View>
                  <Text style={styles.reviewText}>{r.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bouton déconnexion visible */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color="#C62828" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>

      <TopBar
        title="Profil"
        right={
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons name={editing ? 'checkmark' : 'create-outline'} size={22} color="#2E7D32" />
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  editAvatarBtn: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 19, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerFarm: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter_400Regular', marginTop: 2 },
  headerLoc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  headerLocText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular' },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  badgeCert: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeCertText: { fontSize: 12, color: '#2E7D32', fontFamily: 'Inter_600SemiBold' },
  sectionsRow: { paddingHorizontal: 16, marginTop: 12, gap: 8 },
  sectionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  sectionPillActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  sectionText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#6B7A6B' },
  sectionTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, marginTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#1A2E1A', marginBottom: 14 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: { backgroundColor: '#EDE9E2', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1A2E1A', borderWidth: 1.5, borderColor: 'transparent' },
  inputDisabled: { backgroundColor: '#F5F1EB' },
  aboutText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1A2E1A', lineHeight: 22 },
  certRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDE9E2' },
  certTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1A2E1A' },
  certDesc: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_400Regular', marginTop: 2 },
  globalNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  globalNoteValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#1A2E1A' },
  globalNoteLabel: { fontSize: 13, color: '#6B7A6B', fontFamily: 'Inter_400Regular' },
  reviewCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDE9E2' },
  reviewName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1A2E1A' },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewText: { fontSize: 13, color: '#6B7A6B', fontFamily: 'Inter_400Regular', marginTop: 6, lineHeight: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingVertical: 14, borderRadius: 16, backgroundColor: '#FFEBEE', borderWidth: 1.5, borderColor: '#FECACA' },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#C62828' },
});
