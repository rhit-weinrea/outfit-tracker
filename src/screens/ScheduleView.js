import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { C, F } from '../theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return d;
  });
}

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

export default function ScheduleView() {
  const { outfits, clothingItems, schedule, saveSchedule } = useApp();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState(null);

  const weekDates = getWeekDates();
  const today = dateKey(new Date());

  const openPicker = useCallback((d) => {
    setPickerDate(d);
    setPickerVisible(true);
  }, []);

  const assignOutfit = useCallback(async (outfitId) => {
    const key = dateKey(pickerDate);
    const updated = { ...schedule, [key]: outfitId };
    await saveSchedule(updated);
    setPickerVisible(false);
  }, [pickerDate, schedule, saveSchedule]);

  const clearDay = useCallback(async (d) => {
    const key = dateKey(d);
    const updated = { ...schedule };
    delete updated[key];
    await saveSchedule(updated);
  }, [schedule, saveSchedule]);

  const getOutfitForDate = (d) => {
    const id = schedule[dateKey(d)];
    return id ? outfits.find((o) => o.id === id) : null;
  };

  const getItemsForOutfit = (outfit) =>
    outfit.itemIds.map((id) => clothingItems.find((ci) => ci.id === id)).filter(Boolean);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>This Week</Text>

        {weekDates.map((d, i) => {
          const key = dateKey(d);
          const isToday = key === today;
          const outfit = getOutfitForDate(d);
          const items = outfit ? getItemsForOutfit(outfit) : [];

          return (
            <View key={key} style={[styles.dayRow, isToday && styles.dayRowToday]}>
              <View style={styles.dayLabel}>
                <Text style={[styles.dayName, isToday && styles.dayNameToday]}>{DAYS[d.getDay()]}</Text>
                <Text style={[styles.dayDate, isToday && styles.dayDateToday]}>{d.getDate()}</Text>
              </View>

              <View style={styles.dayContent}>
                {outfit ? (
                  <TouchableOpacity style={styles.assignedOutfit} onPress={() => openPicker(d)} activeOpacity={0.8}>
                    <View style={styles.outfitThumbsRow}>
                      {items.slice(0, 3).map((ci) =>
                        ci.imageUri ? (
                          <Image key={ci.id} source={{ uri: ci.imageUri }} style={styles.thumb} />
                        ) : (
                          <View key={ci.id} style={[styles.thumb, styles.thumbPlaceholder]}>
                            <Text style={styles.thumbPlaceholderText}>{ci.name[0]?.toUpperCase()}</Text>
                          </View>
                        )
                      )}
                      {items.length > 3 && (
                        <View style={[styles.thumb, styles.thumbMore]}>
                          <Text style={styles.thumbMoreText}>+{items.length - 3}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.outfitName} numberOfLines={1}>{outfit.name}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.emptyDay} onPress={() => openPicker(d)}>
                    <Text style={styles.emptyDayText}>+ Assign outfit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {outfit && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => clearDay(d)}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Outfit picker modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {pickerDate ? `${DAY_FULL[pickerDate.getDay()]}, ${pickerDate.getDate()}` : ''}
            </Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {outfits.length === 0 ? (
            <View style={styles.noOutfits}>
              <Text style={styles.noOutfitsText}>No outfits saved yet.</Text>
              <Text style={styles.noOutfitsSubtext}>Create outfits in the Outfits tab first.</Text>
            </View>
          ) : (
            <FlatList
              data={outfits}
              keyExtractor={(o) => o.id}
              contentContainerStyle={styles.pickerList}
              renderItem={({ item: outfit }) => {
                const items = getItemsForOutfit(outfit);
                const assigned = schedule[pickerDate ? dateKey(pickerDate) : ''] === outfit.id;
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, assigned && styles.pickerItemActive]}
                    onPress={() => assignOutfit(outfit.id)}
                  >
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerThumbs}>
                      {items.slice(0, 4).map((ci) =>
                        ci.imageUri ? (
                          <Image key={ci.id} source={{ uri: ci.imageUri }} style={styles.pickerThumb} />
                        ) : (
                          <View key={ci.id} style={[styles.pickerThumb, styles.pickerThumbPlaceholder]}>
                            <Text style={styles.pickerThumbText}>{ci.name[0]?.toUpperCase()}</Text>
                          </View>
                        )
                      )}
                    </ScrollView>
                    <View style={styles.pickerInfo}>
                      <Text style={styles.pickerOutfitName}>{outfit.name}</Text>
                      {outfit.occasion ? <Text style={styles.pickerOccasion}>{outfit.occasion}</Text> : null}
                      <Text style={styles.pickerPieces}>{items.length} piece{items.length !== 1 ? 's' : ''}</Text>
                    </View>
                    {assigned && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontFamily: F.display, fontSize: 32, color: C.text, marginBottom: 16, letterSpacing: 0.5 },

  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
    padding: 12,
    gap: 12,
  },
  dayRowToday: { borderColor: C.primary, borderWidth: 1.5 },

  dayLabel: { width: 40, alignItems: 'center' },
  dayName: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  dayNameToday: { color: C.primary },
  dayDate: { fontFamily: F.display, fontSize: 22, color: C.text, lineHeight: 24 },
  dayDateToday: { color: C.primary },

  dayContent: { flex: 1 },
  assignedOutfit: { gap: 6 },
  outfitThumbsRow: { flexDirection: 'row', gap: 4 },
  thumb: { width: 36, height: 44, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  thumbPlaceholder: { backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  thumbPlaceholderText: { fontFamily: F.display, fontSize: 14, color: C.primary },
  thumbMore: { backgroundColor: C.border, justifyContent: 'center', alignItems: 'center' },
  thumbMoreText: { fontSize: 11, color: C.muted, fontWeight: '600' },
  outfitName: { fontFamily: F.heading, fontSize: 14, color: C.text, letterSpacing: 0.2 },

  emptyDay: {
    borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14,
    alignItems: 'center',
  },
  emptyDayText: { fontSize: 13, color: C.muted },

  clearBtn: { padding: 6 },
  clearBtnText: { fontSize: 16, color: C.muted },

  modal: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { fontFamily: F.display, fontSize: 24, color: C.text, letterSpacing: 0.5 },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 20, color: C.muted },

  noOutfits: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  noOutfitsText: { fontFamily: F.display, fontSize: 22, color: C.text, marginBottom: 8 },
  noOutfitsSubtext: { fontSize: 14, color: C.muted, textAlign: 'center' },

  pickerList: { padding: 16, paddingBottom: 40 },
  pickerItem: {
    backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    padding: 12, marginBottom: 10,
  },
  pickerItemActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  pickerThumbs: { marginBottom: 8 },
  pickerThumb: { width: 52, height: 64, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: C.border },
  pickerThumbPlaceholder: { backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
  pickerThumbText: { fontFamily: F.display, fontSize: 18, color: C.primary },
  pickerInfo: {},
  pickerOutfitName: { fontFamily: F.heading, fontSize: 18, color: C.text },
  pickerOccasion: { fontSize: 12, color: C.muted, marginTop: 2 },
  pickerPieces: { fontSize: 12, color: C.muted },
  checkMark: { position: 'absolute', top: 12, right: 12, fontSize: 18, color: C.primary, fontWeight: '700' },
});
