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
import { C, F } from '../theme';
import ScheduleView from './ScheduleView';

const OCCASIONS = ['Casual', 'Work', 'Formal', 'Sport', 'Date Night', 'Party', 'Travel'];
const OUTFIT_CATEGORIES = ['Top', 'Bottom', 'Dress', 'Outerwear', 'Shoes', 'Accessories', 'Other'];

export default function OutfitsScreen() {
  const { clothingItems, outfits, addOutfit, deleteOutfit } = useApp();
  const [tab, setTab] = useState('outfits');
  const [modalVisible, setModalVisible] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [outfitOccasion, setOutfitOccasion] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [categoryIndex, setCategoryIndex] = useState(0);

  const currentCategory = OUTFIT_CATEGORIES[categoryIndex];
  const itemsInCategory = clothingItems.filter((ci) => ci.category === currentCategory);

  const openModal = useCallback(() => {
    setOutfitName('');
    setOutfitOccasion('');
    setSelectedItemIds([]);
    setCategoryIndex(0);
    setModalVisible(true);
  }, []);

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
      <TouchableOpacity
        style={styles.outfitCard}
        onLongPress={() => handleDeleteOutfit(outfit)}
        activeOpacity={0.85}
      >
        <View style={styles.outfitHeader}>
          <Text style={styles.outfitName}>{outfit.name}</Text>
          {outfit.occasion ? (
            <View style={styles.occasionBadge}>
              <Text style={styles.occasionText}>{outfit.occasion}</Text>
            </View>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsRow}>
          {items.map((ci) => (
            <View key={ci.id} style={styles.outfitItem}>
              {ci.imageUri ? (
                <Image source={{ uri: ci.imageUri }} style={styles.outfitItemImage} />
              ) : (
                <View style={[styles.outfitItemImage, styles.outfitItemPlaceholder]}>
                  <Text style={styles.outfitItemPlaceholderText}>{ci.name[0]?.toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.outfitItemName} numberOfLines={1}>{ci.name}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.outfitMeta}>{items.length} piece{items.length !== 1 ? 's' : ''}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab toggle */}
      <View style={styles.tabToggle}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'outfits' && styles.tabBtnActive]}
          onPress={() => setTab('outfits')}
        >
          <Text style={[styles.tabBtnText, tab === 'outfits' && styles.tabBtnTextActive]}>Outfits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'schedule' && styles.tabBtnActive]}
          onPress={() => setTab('schedule')}
        >
          <Text style={[styles.tabBtnText, tab === 'schedule' && styles.tabBtnTextActive]}>Schedule</Text>
        </TouchableOpacity>
      </View>

      {tab === 'schedule' ? (
        <ScheduleView />
      ) : outfits.length === 0 ? (
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

      {tab === 'outfits' && (
        <TouchableOpacity style={styles.fab} onPress={openModal}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Outfit</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Weekend Casual"
            placeholderTextColor={C.muted}
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

          <Text style={styles.label}>
            Select Items — {selectedItemIds.length} selected
          </Text>

          {/* Category navigator */}
          <View style={styles.categoryNav}>
            <TouchableOpacity
              style={[styles.navBtn, categoryIndex === 0 && styles.navBtnDisabled]}
              onPress={() => setCategoryIndex((i) => Math.max(0, i - 1))}
              disabled={categoryIndex === 0}
            >
              <Text style={[styles.navBtnText, categoryIndex === 0 && styles.navBtnTextDisabled]}>‹</Text>
            </TouchableOpacity>

            <View style={styles.categoryNavCenter}>
              <Text style={styles.categoryNavTitle}>{currentCategory}</Text>
              <Text style={styles.categoryNavSub}>
                {itemsInCategory.length} item{itemsInCategory.length !== 1 ? 's' : ''}
                {itemsInCategory.filter((ci) => selectedItemIds.includes(ci.id)).length > 0
                  ? ` · ${itemsInCategory.filter((ci) => selectedItemIds.includes(ci.id)).length} selected`
                  : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.navBtn, categoryIndex === OUTFIT_CATEGORIES.length - 1 && styles.navBtnDisabled]}
              onPress={() => setCategoryIndex((i) => Math.min(OUTFIT_CATEGORIES.length - 1, i + 1))}
              disabled={categoryIndex === OUTFIT_CATEGORIES.length - 1}
            >
              <Text style={[styles.navBtnText, categoryIndex === OUTFIT_CATEGORIES.length - 1 && styles.navBtnTextDisabled]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Step dots */}
          <View style={styles.stepDots}>
            {OUTFIT_CATEGORIES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setCategoryIndex(i)}>
                <View style={[styles.dot, i === categoryIndex && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Items */}
          {clothingItems.length === 0 ? (
            <Text style={styles.noItemsText}>Add items to your closet first.</Text>
          ) : itemsInCategory.length === 0 ? (
            <Text style={styles.noItemsText}>No {currentCategory} items in your closet.</Text>
          ) : (
            itemsInCategory.map((ci) => {
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
                      <Text style={styles.selectItemPlaceholderText}>{ci.name[0]?.toUpperCase()}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 90 },

  tabToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: C.primary },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabBtnTextActive: { color: '#fff' },

  outfitCard: {
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  outfitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  outfitName: {
    flex: 1,
    fontFamily: F.heading,
    fontSize: 20,
    color: C.text,
    letterSpacing: 0.3,
  },
  occasionBadge: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  occasionText: { fontSize: 11, color: C.muted, fontWeight: '600', letterSpacing: 0.5 },
  itemsRow: { marginBottom: 8 },
  outfitItem: { alignItems: 'center', marginRight: 12, width: 68 },
  outfitItemImage: { width: 68, height: 82, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: C.border },
  outfitItemPlaceholder: { backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  outfitItemPlaceholderText: { fontFamily: F.display, fontSize: 22, color: C.primary },
  outfitItemName: { fontSize: 10, color: C.muted, textAlign: 'center' },
  outfitMeta: { fontSize: 11, color: C.muted },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontFamily: F.display, fontSize: 24, color: C.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: C.muted },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },

  modal: { flex: 1, backgroundColor: C.bg },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontFamily: F.display, fontSize: 28, color: C.text, letterSpacing: 0.5 },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 20, color: C.muted },

  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: C.muted,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: C.text,
  },
  chipRow: { marginVertical: 2 },
  chipContent: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.muted },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  categoryNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: C.primaryLight,
  },
  navBtnDisabled: { backgroundColor: '#F3F4F6' },
  navBtnText: { fontSize: 24, color: C.primary, fontWeight: '700' },
  navBtnTextDisabled: { color: '#D1D5DB' },
  categoryNavCenter: { flex: 1, alignItems: 'center' },
  categoryNavTitle: { fontFamily: F.heading, fontSize: 20, color: C.text },
  categoryNavSub: { fontSize: 12, color: C.muted, marginTop: 2 },

  stepDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { backgroundColor: C.primary, width: 18, borderRadius: 3 },

  noItemsText: { fontSize: 13, color: C.muted, fontStyle: 'italic', marginTop: 12 },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    marginVertical: 4,
  },
  selectItemActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  selectItemImage: { width: 46, height: 56, borderRadius: 6, marginRight: 12, borderWidth: 1, borderColor: C.border },
  selectItemPlaceholder: { backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  selectItemPlaceholderText: { fontFamily: F.display, fontSize: 18, color: C.primary },
  selectItemInfo: { flex: 1 },
  selectItemName: { fontFamily: F.heading, fontSize: 16, color: C.text },
  selectItemMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: { backgroundColor: C.primary, borderColor: C.primary },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },

  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  cancelBtn: { alignItems: 'center', marginTop: 14, paddingVertical: 10 },
  cancelBtnText: { color: C.muted, fontSize: 14 },
});
