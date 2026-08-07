import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TopBar from '@/components/farmer/TopBar';
import FarmerInput from '@/components/farmer/FarmerInput';
import FarmerSelect from '@/components/farmer/FarmerSelect';
import FarmerTextarea from '@/components/farmer/FarmerTextarea';
import FarmerBtn from '@/components/farmer/FarmerBtn';
import StatusBadge from '@/components/farmer/StatusBadge';
import { PRODUCTS, EMOJI_LIST } from '@/data/farmer-mock';

const UNITS = ['kg', 'g', 'sac', 'panier', 'régime', 'litre', 'unité'];
const CATEGORIES = ['Légumes', 'Fruits', 'Céréales', 'Tubercules', 'Épices', 'Autre'];

export default function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const existing = PRODUCTS.find((p) => String(p.id) === params.id);

  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 44 : insets.top;

  const [emoji, setEmoji] = useState(existing?.emoji || '🍅');
  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || '');
  const [qty, setQty] = useState(existing?.qty?.toString() || '');
  const [unit, setUnit] = useState(existing?.unit || 'kg');
  const [price, setPrice] = useState(existing?.price?.toString() || '');
  const [harvest, setHarvest] = useState(existing?.harvestDate || '');
  const [exp, setExp] = useState(existing?.expDate || '');
  const [location, setLocation] = useState(existing?.location || '');
  const [description, setDescription] = useState(existing?.description || '');

  const qtyNum = parseInt(qty || '0', 10);
  let status: 'Disponible' | 'Stock faible' | 'Épuisé' = 'Disponible';
  if (qtyNum === 0) status = 'Épuisé';
  else if (qtyNum < 5) status = 'Stock faible';

  const handleSave = () => {
    if (!name || !category || !qty || !price || !location) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    Alert.alert('Succès', 'Produit mis à jour');
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer ce produit ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <TopBar title="Modifier le produit" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={styles.emojiRow}>
          {EMOJI_LIST.map((e) => (
            <TouchableOpacity key={e} onPress={() => setEmoji(e)} style={[styles.emojiPill, emoji === e && styles.emojiPillActive]}>
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.photoZone}>
          <View style={styles.photoInner}>
            <Ionicons name="camera" size={28} color="#9CA3AF" />
            <Text style={styles.photoText}>Modifier la photo</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nom du produit *</Text>
            <FarmerInput value={name} onChangeText={setName} placeholder="Ex: Tomates" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Catégorie *</Text>
            <FarmerSelect value={category} onSelect={setCategory} options={CATEGORIES} placeholder="Sélectionner..." />
          </View>

          <View style={styles.row2}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Quantité *</Text>
              <FarmerInput value={qty} onChangeText={setQty} placeholder="0" keyboardType="numeric" />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Unité *</Text>
              <FarmerSelect value={unit} onSelect={setUnit} options={UNITS} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Prix (FCFA) *</Text>
            <FarmerInput value={price} onChangeText={setPrice} placeholder="Ex: 1500" keyboardType="numeric" />
          </View>

          <View style={styles.row2}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Date récolte</Text>
              <FarmerInput value={harvest} onChangeText={setHarvest} placeholder="JJ/MM/AAAA" />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Date expiration</Text>
              <FarmerInput value={exp} onChangeText={setExp} placeholder="JJ/MM/AAAA" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Localisation *</Text>
            <FarmerInput value={location} onChangeText={setLocation} placeholder="Ex: Yaoundé" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <FarmerTextarea value={description} onChangeText={setDescription} placeholder="Décrire votre produit..." />
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Statut automatique:</Text>
            <StatusBadge label={status} color={statusColor(status)} bg={statusBg(status)} />
          </View>

          <FarmerBtn title="Mettre à jour" onPress={handleSave} />
          <FarmerBtn title="Supprimer" onPress={handleDelete} variant="outline" color="#C62828" style={{ marginTop: 10 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'Disponible': return '#2E7D32';
    case 'Stock faible': return '#F57F17';
    case 'Épuisé': return '#C62828';
    default: return '#6B7A6B';
  }
}

function statusBg(status: string) {
  switch (status) {
    case 'Disponible': return '#E8F5E9';
    case 'Stock faible': return '#FFF8E1';
    case 'Épuisé': return '#FFEBEE';
    default: return '#EDE9E2';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  emojiPill: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(46,125,50,0.12)' },
  emojiPillActive: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  emojiText: { fontSize: 22 },
  photoZone: { marginHorizontal: 16, marginTop: 16, borderWidth: 1.5, borderColor: 'rgba(46,125,50,0.2)', borderStyle: 'dashed', borderRadius: 16, padding: 24 },
  photoInner: { alignItems: 'center', gap: 8 },
  photoText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_500Medium' },
  form: { paddingHorizontal: 16, marginTop: 16, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_500Medium' },
  row2: { flexDirection: 'row', gap: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  statusLabel: { fontSize: 12, color: '#6B7A6B', fontFamily: 'Inter_500Medium' },
});
