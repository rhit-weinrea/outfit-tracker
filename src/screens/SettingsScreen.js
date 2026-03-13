import React, { useState, useEffect, useCallback } from 'react';
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

const STYLE_OPTIONS = ['Casual', 'Classic', 'Minimalist', 'Bohemian', 'Streetwear', 'Preppy', 'Athleisure', 'Edgy', 'Romantic', 'Business'];
const OCCASION_OPTIONS = ['Everyday', 'Work', 'Formal', 'Date Night', 'Sport', 'Party', 'Travel', 'Beach'];
const COLOR_OPTIONS = ['Black', 'White', 'Navy', 'Beige', 'Camel', 'Olive', 'Burgundy', 'Gray', 'Brown', 'Pastel', 'Bold / Bright'];

export default function SettingsScreen() {
  const { preferences, savePreferences } = useApp();

  const [style, setStyle] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [colorPreferences, setColorPreferences] = useState([]);
  const [avoidColors, setAvoidColors] = useState([]);
  const [weatherLocation, setWeatherLocation] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState('F');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (preferences) {
      setStyle(preferences.style ?? []);
      setOccasions(preferences.occasions ?? []);
      setColorPreferences(preferences.colorPreferences ?? []);
      setAvoidColors(preferences.avoidColors ?? []);
      setWeatherLocation(preferences.weatherLocation ?? '');
      setTemperatureUnit(preferences.temperatureUnit ?? 'F');
    }
  }, [preferences]);

  const toggle = useCallback((list, setList, value) => {
    setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    await savePreferences({ style, occasions, colorPreferences, avoidColors, weatherLocation, temperatureUnit });
    setDirty(false);
    Alert.alert('Saved', 'Your preferences have been saved!');
  }, [style, occasions, colorPreferences, avoidColors, weatherLocation, temperatureUnit, savePreferences]);

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
      <Text style={styles.subheading}>Customize your style profile for better AI suggestions</Text>

      {renderMultiSelect(STYLE_OPTIONS, style, (v) => toggle(style, setStyle, v), '🎨  Style')}
      {renderMultiSelect(OCCASION_OPTIONS, occasions, (v) => toggle(occasions, setOccasions, v), '📅  Occasions')}
      {renderMultiSelect(COLOR_OPTIONS, colorPreferences, (v) => toggle(colorPreferences, setColorPreferences, v), '❤️  Favorite Colors')}
      {renderMultiSelect(COLOR_OPTIONS, avoidColors, (v) => toggle(avoidColors, setAvoidColors, v), '🚫  Avoid Colors')}

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍  Weather Location</Text>
        <TextInput
          style={styles.input}
          placeholder="City name (e.g. New York, London)"
          placeholderTextColor="#aaa"
          value={weatherLocation}
          onChangeText={(v) => { setWeatherLocation(v); setDirty(true); }}
        />
      </View>

      {/* Temperature Unit */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌡  Temperature Unit</Text>
        <View style={styles.unitRow}>
          <TouchableOpacity
            style={[styles.unitBtn, temperatureUnit === 'F' && styles.unitBtnActive]}
            onPress={() => { setTemperatureUnit('F'); setDirty(true); }}
          >
            <Text style={[styles.unitBtnText, temperatureUnit === 'F' && styles.unitBtnTextActive]}>°F</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitBtn, temperatureUnit === 'C' && styles.unitBtnActive]}
            onPress={() => { setTemperatureUnit('C'); setDirty(true); }}
          >
            <Text style={[styles.unitBtnText, temperatureUnit === 'C' && styles.unitBtnTextActive]}>°C</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={[styles.saveBtn, !dirty && styles.saveBtnDisabled]} onPress={handleSave} disabled={!dirty}>
        <Text style={styles.saveBtnText}>Save Preferences</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡  How it works</Text>
        <Text style={styles.infoText}>
          Your preferences are sent to DeepSeek AI along with your closet items and current weather to generate
          personalized outfit suggestions. Add your DeepSeek API key in the Suggestions tab to get started.
        </Text>
      </View>
    </ScrollView>
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
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 48 },
  heading: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 4 },
  subheading: { fontSize: 14, color: C.textLight, marginBottom: 24 },
  section: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
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
  chipText: { fontSize: 13, color: C.textLight },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
    marginTop: 4,
  },
  unitRow: { flexDirection: 'row', gap: 12 },
  unitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  unitBtnActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  unitBtnText: { fontSize: 16, fontWeight: '700', color: C.textLight },
  unitBtnTextActive: { color: C.primary },
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  saveBtnDisabled: { backgroundColor: '#A0B4A8', shadowOpacity: 0 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoBox: {
    backgroundColor: C.primaryLight,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 6 },
  infoText: { fontSize: 13, color: '#374151', lineHeight: 20 },
});
