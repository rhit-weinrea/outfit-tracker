import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { C, F } from '../theme';

const STYLE_OPTIONS = [
  'Casual', 'Classic', 'Minimalist', 'Bohemian', 'Streetwear', 'Preppy',
  'Athleisure', 'Edgy', 'Romantic', 'Business', 'Alt', 'Goth', 'Vintage',
  'Y2K', 'Dark Academia', 'Cottagecore', 'Grunge', 'Normcore', 'Smart Casual',
];

const OCCASION_OPTIONS = ['Everyday', 'Work', 'Formal', 'Date Night', 'Sport', 'Party', 'Travel', 'Beach'];

const COLOR_OPTIONS = [
  'Black', 'White', 'Gray', 'Charcoal', 'Navy', 'Cobalt', 'Blue',
  'Red', 'Rust', 'Pink', 'Blush', 'Mauve', 'Green', 'Forest Green',
  'Olive', 'Teal', 'Mint', 'Yellow', 'Mustard', 'Orange', 'Coral',
  'Purple', 'Plum', 'Lavender', 'Brown', 'Tan', 'Camel', 'Beige',
  'Cream', 'Ivory', 'Bold / Bright', 'Pastel',
];

export default function SettingsScreen() {
  const { preferences, savePreferences } = useApp();

  const [style, setStyle] = useState([]);
  const [customStyles, setCustomStyles] = useState([]);
  const [customStyleInput, setCustomStyleInput] = useState('');
  const [occasions, setOccasions] = useState([]);
  const [colorPreferences, setColorPreferences] = useState([]);
  const [avoidColors, setAvoidColors] = useState([]);
  const [weatherLocation, setWeatherLocation] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState('F');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (preferences) {
      setStyle(preferences.style ?? []);
      setCustomStyles(preferences.customStyles ?? []);
      setOccasions(preferences.occasions ?? []);
      setColorPreferences(preferences.colorPreferences ?? []);
      setAvoidColors(preferences.avoidColors ?? []);
      setWeatherLocation(preferences.weatherLocation ?? '');
      setTemperatureUnit(preferences.temperatureUnit ?? 'F');
    }
  }, [preferences]);

  const addCustomStyle = useCallback(() => {
    const val = customStyleInput.trim();
    if (!val) return;
    if (customStyles.includes(val)) { setCustomStyleInput(''); return; }
    setCustomStyles((prev) => [...prev, val]);
    setCustomStyleInput('');
    setDirty(true);
  }, [customStyleInput, customStyles]);

  const removeCustomStyle = useCallback((val) => {
    setCustomStyles((prev) => prev.filter((s) => s !== val));
    setDirty(true);
  }, []);

  const toggle = useCallback((list, setList, value) => {
    setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    await savePreferences({ style, customStyles, occasions, colorPreferences, avoidColors, weatherLocation, temperatureUnit });
    setDirty(false);
    Alert.alert('Saved', 'Your preferences have been saved.');
  }, [style, customStyles, occasions, colorPreferences, avoidColors, weatherLocation, temperatureUnit, savePreferences]);

  const renderMultiSelect = (options, selected, onToggle, label) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.chipGrid}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggle(opt)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Preferences</Text>
      <Text style={styles.subheading}>Customize your style profile for better suggestions</Text>

      {renderMultiSelect(STYLE_OPTIONS, style, (v) => toggle(style, setStyle, v), 'Style')}

      {/* Custom styles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Styles</Text>
        <View style={styles.customInputRow}>
          <TextInput
            style={[styles.input, styles.customInput]}
            placeholder="Add your own style..."
            placeholderTextColor={C.muted}
            value={customStyleInput}
            onChangeText={setCustomStyleInput}
            onSubmitEditing={addCustomStyle}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addCustomBtn} onPress={addCustomStyle}>
            <Text style={styles.addCustomBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        {customStyles.length > 0 && (
          <View style={[styles.chipGrid, { marginTop: 12 }]}>
            {customStyles.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, styles.chipActive]} onPress={() => removeCustomStyle(s)}>
                <Text style={[styles.chipText, styles.chipTextActive]}>{s} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {renderMultiSelect(OCCASION_OPTIONS, occasions, (v) => toggle(occasions, setOccasions, v), 'Occasions')}
      {renderMultiSelect(COLOR_OPTIONS, colorPreferences, (v) => toggle(colorPreferences, setColorPreferences, v), 'Favorite Colors')}
      {renderMultiSelect(COLOR_OPTIONS, avoidColors, (v) => toggle(avoidColors, setAvoidColors, v), 'Avoid Colors')}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weather Location</Text>
        <TextInput
          style={styles.input}
          placeholder="City name (e.g. New York, London)"
          placeholderTextColor={C.muted}
          value={weatherLocation}
          onChangeText={(v) => { setWeatherLocation(v); setDirty(true); }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Temperature</Text>
        <View style={styles.unitRow}>
          {['F', 'C'].map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[styles.unitBtn, temperatureUnit === unit && styles.unitBtnActive]}
              onPress={() => { setTemperatureUnit(unit); setDirty(true); }}
            >
              <Text style={[styles.unitBtnText, temperatureUnit === unit && styles.unitBtnTextActive]}>
                {unit === 'F' ? 'Fahrenheit' : 'Celsius'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, !dirty && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!dirty}
      >
        <Text style={styles.saveBtnText}>Save Preferences</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 48 },
  heading: { fontFamily: F.display, fontSize: 32, color: C.text, marginBottom: 2, letterSpacing: 0.5 },
  subheading: { fontSize: 13, color: C.muted, marginBottom: 24, letterSpacing: 0.3 },

  section: {
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: { fontFamily: F.heading, fontSize: 18, color: C.text, marginBottom: 14, letterSpacing: 0.3 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.muted },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  input: {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
    marginTop: 4,
  },

  unitRow: { flexDirection: 'row', gap: 10 },
  unitBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  unitBtnActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  unitBtnText: { fontSize: 14, fontWeight: '600', color: C.muted },
  unitBtnTextActive: { color: C.primary },

  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveBtnDisabled: { backgroundColor: '#A0B4A8' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

  customInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customInput: { flex: 1, marginTop: 0 },
  addCustomBtn: {
    backgroundColor: C.primary, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  addCustomBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
