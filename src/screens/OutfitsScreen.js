import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/helpers';

export default function OutfitsScreen() {
  const { clothingItems, outfits, addOutfit, deleteOutfit } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [outfitOccasion, setOutfitOccasion] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const OCCASIONS = ['Casual', 'Work', 'Formal', 'Sport', 'Date Night', 'Party', 'Travel'];

  const toggleItem = useCallback((id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleSaveOutfit = useCallback(async () => {
    if (!outfitName.trim()) {
      Alert.alert('Name required', 'Please give your outfit a name.');
      return;
    }
    if (selectedItemIds.length === 0) {
      Alert.alert('No items selected', 'Please select at least one clothing item.');
      return;
    }
    await addOutfit({
      id: generateId(),
      name: outfitName.trim(),
      occasion: outfitOccasion,
      itemIds: selectedItemIds,
      createdAt: new Date().toISOString(),
    });
    setOutfitName('');
    setOutfitOccasion('');
    setSelectedItemIds([]);
    setModalVisible(false);
  }, [outfitName, outfitOccasion, selectedItemIds, addOutfit]);

  const handleDeleteOutfit = useCallback(
    (outfit) => {
      Alert.alert('Delete Outfit', `Delete "${outfit.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteOutfit(outfit.id) },
      ]);
    },
    [deleteOutfit]
  );

  const getItemsForOutfit = (outfit) =>
    outfit.itemIds.map((id) => clothingItems.find((ci) => ci.id === id)).filter(Boolean);

  const renderOutfit = ({ item: outfit }) => {
    const items = getItemsForOutfit(outfit);
    return (
      <TouchableOpacity style={styles.outfitCard} onLongPress={() => handleDeleteOutfit(outfit)} activeOpacity={0.9}>
        <View style={styles.outfitHeader}>
          <Text style={styles.outfitName}>{outfit.name}</Text>
          {outfit.occasion ? <View style={styles.occasionBadge}><Text style={styles.occasionText}>{outfit.occasion}</Text></View> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsRow}>
          {items.map((ci) => (
            <View key={ci.id} style={styles.outfitItem}>
              {ci.imageUri ? (
                <Image source={{ uri: ci.imageUri }} style={styles.outfitItemImage} />
              ) : (
                <View style={[styles.outfitItemImage, styles.outfitItemPlaceholder]}>
                  <Text style={styles.outfitItemPlaceholderText}>{ci.category[0]}</Text>
                </View>
              )}
              <Text style={styles.outfitItemName} numberOfLines={1}>{ci.name}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.outfitMeta}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {outfits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No outfits yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to create your first outfit</Text>
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id}
          renderItem={renderOutfit}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>Create Outfit</Text>

          <Text style={styles.label}>Outfit Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Weekend Casual"
            placeholderTextColor="#aaa"
            value={outfitName}
            onChangeText={setOutfitName}
          />

          <Text style={styles.label}>Occasion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
            {OCCASIONS.map((occ) => (
              <TouchableOpacity
                key={occ}
                style={[styles.chip, outfitOccasion === occ && styles.chipActive]}
                onPress={() => setOutfitOccasion(outfitOccasion === occ ? '' : occ)}
              >
                <Text style={[styles.chipText, outfitOccasion === occ && styles.chipTextActive]}>{occ}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Select Items ({selectedItemIds.length} selected)</Text>
          {clothingItems.length === 0 ? (
            <Text style={styles.noItemsText}>Add items to your closet first.</Text>
          ) : (
            clothingItems.map((ci) => {
              const selected = selectedItemIds.includes(ci.id);
              return (
                <TouchableOpacity
                  key={ci.id}
                  style={[styles.selectItem, selected && styles.selectItemActive]}
                  onPress={() => toggleItem(ci.id)}
                >
                  {ci.imageUri ? (
                    <Image source={{ uri: ci.imageUri }} style={styles.selectItemImage} />
                  ) : (
                    <View style={[styles.selectItemImage, styles.selectItemPlaceholder]}>
                      <Text style={styles.selectItemPlaceholderText}>{ci.category[0]}</Text>
                    </View>
                  )}
                  <View style={styles.selectItemInfo}>
                    <Text style={styles.selectItemName}>{ci.name}</Text>
                    <Text style={styles.selectItemMeta}>{ci.category}{ci.color ? ` · ${ci.color}` : ''}</Text>
                  </View>
                  <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
                    {selected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveOutfit}>
            <Text style={styles.saveBtnText}>Save Outfit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const C = {
  bg: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#2D6A4F',
  primaryLight: '#E8F5E9',
  text: '#1A1A2E',
  textLight: '#6B7280',
  border: '#E5E7EB',
  badge: '#FEF3C7',
  badgeText: '#D97706',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 90 },
  outfitCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  outfitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  outfitName: { flex: 1, fontSize: 17, fontWeight: '700', color: C.text },
  occasionBadge: { backgroundColor: C.badge, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  occasionText: { fontSize: 12, color: C.badgeText, fontWeight: '600' },
  itemsRow: { marginBottom: 8 },
  outfitItem: { alignItems: 'center', marginRight: 12, width: 72 },
  outfitItemImage: { width: 72, height: 88, borderRadius: 10, marginBottom: 4 },
  outfitItemPlaceholder: { backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  outfitItemPlaceholderText: { fontSize: 24, color: C.primary },
  outfitItemName: { fontSize: 11, color: C.textLight, textAlign: 'center' },
  outfitMeta: { fontSize: 12, color: C.textLight, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: C.textLight },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
  modal: { flex: 1, backgroundColor: C.bg },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
  },
  chipRow: { marginVertical: 4 },
  chipContent: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.textLight },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  noItemsText: { fontSize: 14, color: C.textLight, fontStyle: 'italic', marginTop: 8 },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 10,
    marginVertical: 4,
  },
  selectItemActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  selectItemImage: { width: 48, height: 58, borderRadius: 8, marginRight: 12 },
  selectItemPlaceholder: { backgroundColor: '#E0F0EA', justifyContent: 'center', alignItems: 'center' },
  selectItemPlaceholderText: { fontSize: 18, color: C.primary },
  selectItemInfo: { flex: 1 },
  selectItemName: { fontSize: 14, fontWeight: '600', color: C.text },
  selectItemMeta: { fontSize: 12, color: C.textLight, marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: { backgroundColor: C.primary, borderColor: C.primary },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 10 },
  cancelBtnText: { color: C.textLight, fontSize: 15 },
});
