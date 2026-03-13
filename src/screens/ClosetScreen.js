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
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/helpers';

const CATEGORIES = ['Top', 'Bottom', 'Dress', 'Outerwear', 'Shoes', 'Accessories', 'Other'];
const COLORS = ['Black', 'White', 'Gray', 'Navy', 'Blue', 'Red', 'Pink', 'Green', 'Yellow', 'Orange', 'Purple', 'Brown', 'Beige', 'Multicolor'];

export default function ClosetScreen({ navigation }) {
  const { clothingItems, addClothingItem, deleteClothingItem } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: 'Top',
    color: '',
    brand: '',
    tags: '',
    imageUri: null,
  });

  const filteredItems = clothingItems.filter((item) => {
    const matchesSearch =
      searchText === '' ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to add clothing photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled) {
      setForm((f) => ({ ...f, imageUri: result.assets[0].uri }));
    }
  }, []);

  const handleAdd = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter a name for this item.');
      return;
    }
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await addClothingItem({
      id: generateId(),
      name: form.name.trim(),
      category: form.category,
      color: form.color,
      brand: form.brand.trim(),
      tags,
      imageUri: form.imageUri,
      createdAt: new Date().toISOString(),
    });
    setForm({ name: '', category: 'Top', color: '', brand: '', tags: '', imageUri: null });
    setModalVisible(false);
  }, [form, addClothingItem]);

  const handleDelete = useCallback(
    (item) => {
      Alert.alert('Remove Item', `Remove "${item.name}" from your closet?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteClothingItem(item.id),
        },
      ]);
    },
    [deleteClothingItem]
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.85}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>{item.category[0]}</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.category}{item.color ? ` · ${item.color}` : ''}</Text>
        {item.brand ? <Text style={styles.itemBrand}>{item.brand}</Text> : null}
        {item.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search & filter */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your closet…"
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
          onPress={() => setFilterCategory(null)}
        >
          <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
            onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
          >
            <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your closet is empty</Text>
          <Text style={styles.emptySubtitle}>Tap + to add your first item</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          numColumns={2}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>Add Clothing Item</Text>

          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            {form.imageUri ? (
              <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            ) : (
              <Text style={styles.imagePickerText}>📷  Tap to add photo</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. White Oxford Shirt"
            placeholderTextColor="#aaa"
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, form.category === cat && styles.chipActive]}
                onPress={() => setForm((f) => ({ ...f, category: cat }))}
              >
                <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.chip, form.color === color && styles.chipActive]}
                onPress={() => setForm((f) => ({ ...f, color: f.color === color ? '' : color }))}
              >
                <Text style={[styles.chipText, form.color === color && styles.chipTextActive]}>{color}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Levi's, Zara…"
            placeholderTextColor="#aaa"
            value={form.brand}
            onChangeText={(v) => setForm((f) => ({ ...f, brand: v }))}
          />

          <Text style={styles.label}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. casual, summer, formal"
            placeholderTextColor="#aaa"
            value={form.tags}
            onChangeText={(v) => setForm((f) => ({ ...f, tags: v }))}
          />

          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>Add to Closet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const COLORS_PALETTE = {
  bg: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#2D6A4F',
  primaryLight: '#E8F5E9',
  text: '#1A1A2E',
  textLight: '#6B7280',
  border: '#E5E7EB',
  tag: '#EEF2FF',
  tagText: '#4338CA',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS_PALETTE.bg },
  searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchInput: {
    backgroundColor: COLORS_PALETTE.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS_PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS_PALETTE.text,
  },
  filterRow: { paddingVertical: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS_PALETTE.border,
    backgroundColor: COLORS_PALETTE.card,
  },
  filterChipActive: { backgroundColor: COLORS_PALETTE.primary, borderColor: COLORS_PALETTE.primary },
  filterChipText: { fontSize: 13, color: COLORS_PALETTE.textLight },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 8 },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: COLORS_PALETTE.card,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  itemImage: { width: '100%', height: 140 },
  imagePlaceholder: {
    backgroundColor: COLORS_PALETTE.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { fontSize: 36, color: COLORS_PALETTE.primary },
  itemInfo: { padding: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS_PALETTE.text, marginBottom: 2 },
  itemMeta: { fontSize: 12, color: COLORS_PALETTE.textLight, marginBottom: 2 },
  itemBrand: { fontSize: 11, color: COLORS_PALETTE.textLight, fontStyle: 'italic' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: { backgroundColor: COLORS_PALETTE.tag, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, color: COLORS_PALETTE.tagText, fontWeight: '500' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS_PALETTE.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS_PALETTE.textLight },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS_PALETTE.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
  modal: { flex: 1, backgroundColor: COLORS_PALETTE.bg },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: COLORS_PALETTE.text, marginBottom: 20 },
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS_PALETTE.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: COLORS_PALETTE.card,
  },
  imagePickerText: { fontSize: 16, color: COLORS_PALETTE.textLight },
  previewImage: { width: '100%', height: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS_PALETTE.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS_PALETTE.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS_PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS_PALETTE.text,
  },
  chipRow: { marginVertical: 4 },
  chipContent: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS_PALETTE.border,
    backgroundColor: COLORS_PALETTE.card,
  },
  chipActive: { backgroundColor: COLORS_PALETTE.primary, borderColor: COLORS_PALETTE.primary },
  chipText: { fontSize: 13, color: COLORS_PALETTE.textLight },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  addBtn: {
    backgroundColor: COLORS_PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 10 },
  cancelBtnText: { color: COLORS_PALETTE.textLight, fontSize: 15 },
});
