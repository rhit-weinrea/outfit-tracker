import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  TextInput, Modal, ScrollView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import { C, F } from '../theme';

const HANGING_CATS  = ['Top', 'Dress', 'Outerwear'];
const SHELF_CATS    = ['Bottom', 'Shoes', 'Accessories'];
const ALL_CATEGORIES = ['Top', 'Bottom', 'Dress', 'Outerwear', 'Shoes', 'Accessories', 'Other'];

const COLORS = [
  'Black', 'White', 'Gray', 'Charcoal', 'Navy', 'Cobalt', 'Blue', 'Red', 'Rust',
  'Pink', 'Blush', 'Mauve', 'Green', 'Forest Green', 'Olive', 'Teal', 'Mint',
  'Yellow', 'Mustard', 'Orange', 'Coral', 'Purple', 'Plum', 'Lavender',
  'Brown', 'Tan', 'Camel', 'Beige', 'Cream', 'Ivory', 'Multicolor',
];

const BLANK_FORM = { name: '', category: 'Top', color: '', brand: '', tags: '', imageUri: null };

// ── Wooden shelf divider ──────────────────────────────────────────────────────
function WoodShelf() {
  return (
    <View>
      <View style={styles.shelfHighlight} />
      <View style={styles.shelfBody} />
      <View style={styles.shelfShadow} />
    </View>
  );
}

// ── Hanging category button ───────────────────────────────────────────────────
function HangerBtn({ label, count, selected, onPress }) {
  return (
    <TouchableOpacity style={styles.catBtnWrapper} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.hookOuter} />
      <View style={styles.hookStem} />
      <View style={[styles.catCard, selected && styles.catCardActive]}>
        <Text style={[styles.catLabel, selected && styles.catLabelActive]}>{label}</Text>
        <Text style={[styles.catCount, selected && styles.catCountActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Shelf category button ─────────────────────────────────────────────────────
function ShelfBtn({ label, count, selected, onPress, flex }) {
  return (
    <TouchableOpacity
      style={[styles.catCard, styles.shelfBtnExtra, selected && styles.catCardActive, flex && { flex }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.catLabel, selected && styles.catLabelActive]}>{label}</Text>
      <Text style={[styles.catCount, selected && styles.catCountActive]}>{count}</Text>
    </TouchableOpacity>
  );
}

// ── Item form (shared by add + edit) ─────────────────────────────────────────
function ItemForm({ form, setForm, onPickImage, onSave, onCancel, title, saveLabel }) {
  const scrollRef = useRef(null);
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        ref={scrollRef}
        style={styles.modal}
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.imagePicker} onPress={onPickImage}>
          {form.imageUri ? (
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
          ) : (
            <Text style={styles.imagePickerText}>Tap to add photo</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. White Oxford Shirt"
          placeholderTextColor={C.muted}
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
        />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {ALL_CATEGORIES.map((cat) => (
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
          placeholder="e.g. Levi's, Zara..."
          placeholderTextColor={C.muted}
          value={form.brand}
          onChangeText={(v) => setForm((f) => ({ ...f, brand: v }))}
        />

        <Text style={styles.label}>Tags (comma-separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. casual, summer"
          placeholderTextColor={C.muted}
          value={form.tags}
          onChangeText={(v) => setForm((f) => ({ ...f, tags: v }))}
          onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
        />

        <TouchableOpacity style={styles.addBtn} onPress={onSave}>
          <Text style={styles.addBtnText}>{saveLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ClosetScreen() {
  const { clothingItems, addClothingItem, deleteClothingItem, updateClothingItem } = useApp();

  // View toggle: closet, worn, or hamper
  const [view, setView] = useState('closet');

  // Add
  const [addVisible, setAddVisible] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_FORM);

  // Edit
  const [editVisible, setEditVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState(BLANK_FORM);

  // Filters (closet view)
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);

  // Derived lists (status: 'clean' | 'worn' | 'hamper')
  const cleanItems  = clothingItems.filter((i) => i.status === 'clean');
  const wornItems   = clothingItems.filter((i) => i.status === 'worn');
  const hamperItems = clothingItems.filter((i) => i.status === 'hamper');

  const catCount = (cat) => cleanItems.filter((i) => i.category === cat).length;

  const filteredCloset = cleanItems.filter((item) => {
    const matchesSearch =
      searchText === '' ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // ── Image picker (shared) ───────────────────────────────────────────────────
  const pickImage = useCallback(async (setForm) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.7,
    });
    if (!result.canceled) setForm((f) => ({ ...f, imageUri: result.assets[0].uri }));
  }, []);

  // ── Add ─────────────────────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setAddForm({ ...BLANK_FORM, category: filterCategory || 'Top' });
    setAddVisible(true);
  }, [filterCategory]);

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim()) { Alert.alert('Name required', 'Please enter a name.'); return; }
    const tags = addForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    await addClothingItem({
      id: generateId(), name: addForm.name.trim(), category: addForm.category,
      color: addForm.color, brand: addForm.brand.trim(), tags,
      imageUri: addForm.imageUri, status: 'clean',
      createdAt: new Date().toISOString(),
    });
    setAddForm(BLANK_FORM);
    setAddVisible(false);
  }, [addForm, addClothingItem]);

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = useCallback((item) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      category: item.category,
      color: item.color || '',
      brand: item.brand || '',
      tags: item.tags?.join(', ') || '',
      imageUri: item.imageUri || null,
    });
    setEditVisible(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editForm.name.trim()) { Alert.alert('Name required', 'Please enter a name.'); return; }
    const tags = editForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    await updateClothingItem({
      ...editItem,
      name: editForm.name.trim(),
      category: editForm.category,
      color: editForm.color,
      brand: editForm.brand.trim(),
      tags,
      imageUri: editForm.imageUri,
    });
    setEditVisible(false);
    setEditItem(null);
  }, [editForm, editItem, updateClothingItem]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((item) => {
    Alert.alert('Remove Item', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteClothingItem(item.id) },
    ]);
  }, [deleteClothingItem]);

  // ── Status actions ───────────────────────────────────────────────────────────
  const sendToHamper = useCallback((item) => {
    updateClothingItem({ ...item, status: 'hamper' });
  }, [updateClothingItem]);

  const markWorn = useCallback((item) => {
    updateClothingItem({ ...item, status: 'worn' });
  }, [updateClothingItem]);

  const markClean = useCallback((item) => {
    updateClothingItem({ ...item, status: 'clean' });
  }, [updateClothingItem]);

  const clearHamper = useCallback(() => {
    if (hamperItems.length === 0) return;
    Alert.alert('Clear Hamper', `Mark all ${hamperItems.length} items as clean?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        onPress: () => hamperItems.forEach((item) => updateClothingItem({ ...item, status: 'clean' })),
      },
    ]);
  }, [hamperItems, updateClothingItem]);

  const toggle = (cat) => setFilterCategory((prev) => (prev === cat ? null : cat));

  // ── Item card (closet) ──────────────────────────────────────────────────────
  const renderClosetItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.85}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
        <Text style={styles.deleteBtnText}>×</Text>
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.category}{item.color ? ` · ${item.color}` : ''}</Text>
        {item.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 2).map((tag) => (
              <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </View>
        )}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.wornBtn]} onPress={() => markWorn(item)}>
            <Text style={styles.wornBtnText}>Worn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.hamperBtn]} onPress={() => sendToHamper(item)}>
            <Text style={styles.hamperBtnText}>Hamper</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Item card (worn) ────────────────────────────────────────────────────────
  const renderWornItem = ({ item }) => (
    <View style={[styles.card, styles.wornCard]}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.imagePlaceholderWorn]}>
          <Text style={styles.imagePlaceholderText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.category}{item.color ? ` · ${item.color}` : ''}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.cleanBtnSmall]} onPress={() => markClean(item)}>
            <Text style={styles.cleanBtnText}>Clean</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.hamperBtn]} onPress={() => sendToHamper(item)}>
            <Text style={styles.hamperBtnText}>Hamper</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ── Item card (hamper) ──────────────────────────────────────────────────────
  const renderHamperItem = ({ item }) => (
    <View style={[styles.card, styles.hamperCard]}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.imagePlaceholderDirty]}>
          <Text style={styles.imagePlaceholderText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.category}{item.color ? ` · ${item.color}` : ''}</Text>
        <TouchableOpacity style={styles.cleanBtn} onPress={() => markClean(item)}>
          <Text style={styles.cleanBtnText}>Mark Clean</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Wardrobe header ─────────────────────────────────────────────────────────
  const ClosetHeader = () => (
    <>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={C.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.wardrobeFrame}>
        {/* Hanging rod section */}
        <View style={styles.hangingSection}>
          <View style={styles.rodBracketRow}>
            <View style={styles.rodBracket} />
            <View style={styles.rodBracket} />
          </View>
          <View style={styles.rodWrap}>
            <View style={styles.rodHighlight} />
            <View style={styles.rodBody} />
            <View style={styles.rodShadow} />
          </View>
          <View style={styles.hangingRow}>
            {HANGING_CATS.map((cat) => (
              <HangerBtn
                key={cat}
                label={cat}
                count={catCount(cat)}
                selected={filterCategory === cat}
                onPress={() => toggle(cat)}
              />
            ))}
          </View>
        </View>

        {/* Shelf 1 */}
        <WoodShelf />
        <View style={styles.shelfSection}>
          {SHELF_CATS.map((cat) => (
            <ShelfBtn
              key={cat}
              label={cat}
              count={catCount(cat)}
              selected={filterCategory === cat}
              onPress={() => toggle(cat)}
              flex={1}
            />
          ))}
        </View>

        {/* Shelf 2 */}
        <WoodShelf />
        <View style={styles.shelfSection}>
          <ShelfBtn
            label="Other"
            count={catCount('Other')}
            selected={filterCategory === 'Other'}
            onPress={() => toggle('Other')}
            flex={1}
          />
          <ShelfBtn
            label="All Items"
            count={cleanItems.length}
            selected={!filterCategory}
            onPress={() => setFilterCategory(null)}
            flex={2}
          />
        </View>

        <WoodShelf />
      </View>

      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>{filterCategory ?? 'All Items'}</Text>
        <Text style={styles.sectionCount}>{filteredCloset.length}</Text>
      </View>
    </>
  );

  // ── Hamper header ───────────────────────────────────────────────────────────
  const HamperHeader = () => (
    <View style={styles.hamperHeaderRow}>
      <Text style={styles.sectionLabel}>Hamper</Text>
      {hamperItems.length > 0 && (
        <TouchableOpacity style={styles.clearHamperBtn} onPress={clearHamper}>
          <Text style={styles.clearHamperText}>Clear All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* View toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'closet' && styles.toggleBtnActive]}
          onPress={() => setView('closet')}
        >
          <Text style={[styles.toggleBtnText, view === 'closet' && styles.toggleBtnTextActive]}>
            Closet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'worn' && styles.toggleBtnActive]}
          onPress={() => setView('worn')}
        >
          <Text style={[styles.toggleBtnText, view === 'worn' && styles.toggleBtnTextActive]}>
            Worn{wornItems.length > 0 ? ` (${wornItems.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'hamper' && styles.toggleBtnActive]}
          onPress={() => setView('hamper')}
        >
          <Text style={[styles.toggleBtnText, view === 'hamper' && styles.toggleBtnTextActive]}>
            Hamper{hamperItems.length > 0 ? ` (${hamperItems.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'closet' ? (
        <FlatList
          data={filteredCloset}
          keyExtractor={(item) => item.id}
          renderItem={renderClosetItem}
          ListHeaderComponent={<ClosetHeader />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {filterCategory ? `No ${filterCategory}s yet` : 'Your closet is empty'}
              </Text>
              <Text style={styles.emptySubtitle}>Tap + to add your first item</Text>
            </View>
          }
          contentContainerStyle={styles.list}
          numColumns={2}
          key="closet-grid"
        />
      ) : view === 'worn' ? (
        <FlatList
          data={wornItems}
          keyExtractor={(item) => item.id}
          renderItem={renderWornItem}
          ListHeaderComponent={
            <View style={styles.hamperHeaderRow}>
              <Text style={styles.sectionLabel}>Worn</Text>
              <Text style={styles.sectionCount}>{wornItems.length} item{wornItems.length !== 1 ? 's' : ''}</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing worn yet</Text>
              <Text style={styles.emptySubtitle}>Tap "Worn" on closet items after wearing them</Text>
            </View>
          }
          contentContainerStyle={styles.list}
          numColumns={2}
          key="worn-grid"
        />
      ) : (
        <FlatList
          data={hamperItems}
          keyExtractor={(item) => item.id}
          renderItem={renderHamperItem}
          ListHeaderComponent={<HamperHeader />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Hamper is empty</Text>
              <Text style={styles.emptySubtitle}>No items waiting to be washed</Text>
            </View>
          }
          contentContainerStyle={styles.list}
          numColumns={2}
          key="hamper-grid"
        />
      )}

      {/* FAB — only in closet view */}
      {view === 'closet' && (
        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Modal */}
      <Modal visible={addVisible} animationType="slide" presentationStyle="pageSheet">
        <ItemForm
          form={addForm}
          setForm={setAddForm}
          onPickImage={() => pickImage(setAddForm)}
          onSave={handleAdd}
          onCancel={() => setAddVisible(false)}
          title="Add Item"
          saveLabel="Add to Closet"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <ItemForm
          form={editForm}
          setForm={setEditForm}
          onPickImage={() => pickImage(setEditForm)}
          onSave={handleSaveEdit}
          onCancel={() => { setEditVisible(false); setEditItem(null); }}
          title="Edit Item"
          saveLabel="Save Changes"
        />
      </Modal>
    </View>
  );
}

// ── WOOD COLOR PALETTE ────────────────────────────────────────────────────────
const WOOD = {
  highlight: '#E8D5B7',
  body:      '#C4A882',
  shadow:    '#8B6F47',
  frame:     '#B8965A',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── View toggle ───────────────────────────────────────────────────────────
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: C.primary },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: C.muted },
  toggleBtnTextActive: { color: '#fff' },

  // ── Search ────────────────────────────────────────────────────────────────
  searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  searchInput: {
    backgroundColor: C.surface, borderRadius: 8, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: C.text,
  },

  // ── Wardrobe Frame ────────────────────────────────────────────────────────
  wardrobeFrame: {
    marginHorizontal: 16, borderWidth: 2, borderColor: WOOD.frame,
    borderRadius: 10, overflow: 'hidden', backgroundColor: '#FEFEFE', marginBottom: 4,
  },

  // ── Hanging section ───────────────────────────────────────────────────────
  hangingSection: { paddingBottom: 12, backgroundColor: '#FAFAF8' },
  rodBracketRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  rodBracket: { width: 6, height: 10, backgroundColor: WOOD.body, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  rodWrap: { marginHorizontal: 18 },
  rodHighlight: { height: 1.5, backgroundColor: '#E8E8E8' },
  rodBody:      { height: 5,   backgroundColor: '#B0B0B0' },
  rodShadow:    { height: 2,   backgroundColor: '#808080' },
  hangingRow: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 0, gap: 8 },

  // ── Shelf section ─────────────────────────────────────────────────────────
  shelfSection: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, gap: 8, backgroundColor: '#FAFAF8' },

  // ── Wooden shelf ─────────────────────────────────────────────────────────
  shelfHighlight: { height: 2, backgroundColor: WOOD.highlight },
  shelfBody:      { height: 7, backgroundColor: WOOD.body },
  shelfShadow:    { height: 3, backgroundColor: WOOD.shadow },

  // ── Category buttons ──────────────────────────────────────────────────────
  catBtnWrapper: { flex: 1, alignItems: 'center' },
  hookOuter: {
    width: 14, height: 9,
    borderTopLeftRadius: 7, borderTopRightRadius: 7,
    borderWidth: 2, borderBottomWidth: 0, borderColor: '#AAAAAA',
    backgroundColor: 'transparent',
  },
  hookStem: { width: 2, height: 10, backgroundColor: '#AAAAAA' },
  catCard: {
    width: '100%', paddingVertical: 12, paddingHorizontal: 6,
    borderWidth: 1, borderColor: C.border, borderRadius: 6,
    alignItems: 'center', backgroundColor: C.bg, minHeight: 64, justifyContent: 'center',
  },
  catCardActive: { backgroundColor: C.primary, borderColor: C.primary },
  shelfBtnExtra: {},
  catLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    textAlign: 'center', letterSpacing: 0.8, textTransform: 'uppercase',
  },
  catLabelActive: { color: '#fff' },
  catCount: { fontFamily: F.display, fontSize: 22, color: C.text, marginTop: 2, lineHeight: 24 },
  catCountActive: { color: '#fff' },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabelRow: {
    flexDirection: 'row', alignItems: 'baseline',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6, gap: 8,
  },
  sectionLabel: { fontFamily: F.display, fontSize: 26, color: C.text, letterSpacing: 0.5 },
  sectionCount: { fontSize: 13, color: C.muted },

  // ── Hamper header ─────────────────────────────────────────────────────────
  hamperHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6,
  },
  clearHamperBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  clearHamperText: { fontSize: 13, color: C.muted, fontWeight: '600' },

  // ── Items grid ────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 8, paddingBottom: 100 },
  card: {
    flex: 1, margin: 6, backgroundColor: C.surface,
    borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border,
  },
  hamperCard: { borderColor: '#D4A373', borderStyle: 'dashed' },
  wornCard: { borderColor: '#A0A0C0', borderStyle: 'dashed' },
  itemImage: { width: '100%', height: 130 },
  imagePlaceholder: { backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderDirty: { backgroundColor: '#F5ECD7', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderWorn: { backgroundColor: '#EDEDF5', justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { fontFamily: F.display, fontSize: 40, color: C.primary },
  deleteBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  deleteBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  itemInfo: { padding: 10 },
  itemName: { fontFamily: F.heading, fontSize: 14, color: C.text, marginBottom: 2, letterSpacing: 0.2 },
  itemMeta: { fontSize: 11, color: C.muted, marginBottom: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  tag: { borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, color: C.muted },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 7 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 4, borderWidth: 1 },
  wornBtn: { borderColor: '#A0A0C0', backgroundColor: '#F0F0F8' },
  wornBtnText: { fontSize: 11, color: '#6060A0', fontWeight: '600', letterSpacing: 0.3 },
  hamperBtn: { borderColor: '#D4A373', backgroundColor: '#FDF5E8' },
  hamperBtnText: { fontSize: 11, color: '#B07D3A', fontWeight: '600', letterSpacing: 0.3 },
  cleanBtn: {
    borderTopWidth: 1, borderTopColor: '#D4A373',
    paddingTop: 7, marginTop: 2, alignItems: 'center',
  },
  cleanBtnSmall: { borderColor: C.primary, backgroundColor: C.primaryLight },
  cleanBtnText: { fontSize: 11, color: C.primary, fontWeight: '600', letterSpacing: 0.3 },

  // ── Empty state ───────────────────────────────────────────────────────────
  empty: { paddingHorizontal: 32, paddingTop: 40, alignItems: 'center' },
  emptyTitle: { fontFamily: F.display, fontSize: 24, color: C.text, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: C.muted, textAlign: 'center' },

  // ── FAB ───────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modal: { flex: 1, backgroundColor: C.bg },
  modalContent: { padding: 20, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontFamily: F.display, fontSize: 28, color: C.text, letterSpacing: 0.5 },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 20, color: C.muted },
  imagePicker: {
    width: '100%', height: 180, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, overflow: 'hidden', backgroundColor: C.surface,
  },
  imagePickerText: { fontSize: 14, color: C.muted },
  previewImage: { width: '100%', height: '100%' },
  label: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1,
    textTransform: 'uppercase', color: C.muted, marginBottom: 8, marginTop: 16,
  },
  input: {
    backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: C.text,
  },
  chipRow: { marginVertical: 2 },
  chipContent: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.muted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  addBtn: { backgroundColor: C.primary, borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 32 },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  cancelBtn: { alignItems: 'center', marginTop: 14, paddingVertical: 10 },
  cancelBtnText: { color: C.muted, fontSize: 14 },
});
