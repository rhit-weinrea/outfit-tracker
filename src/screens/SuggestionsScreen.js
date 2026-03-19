import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { getOutfitSuggestion } from '../utils/deepseek';
import { fetchWeatherForCity } from '../utils/weather';
import { C, F } from '../theme';

const VIBES = ['Casual', 'Cozy', 'Professional', 'Chic', 'Sporty', 'Date Night', 'Edgy', 'Minimalist', 'Bohemian', 'Streetwear'];

export default function SuggestionsScreen() {
  const { clothingItems, preferences } = useApp();

  const [selectedVibe, setSelectedVibe] = useState('');
  const [customRequest, setCustomRequest] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preferences?.weatherLocation && !weather) {
      handleFetchWeather(preferences.weatherLocation, preferences.temperatureUnit ?? 'F');
    }
  }, [preferences]);

  const handleFetchWeather = useCallback(async (city, unit) => {
    const loc = city ?? preferences?.weatherLocation;
    if (!loc) {
      Alert.alert('No location set', 'Please set your city in Settings to fetch weather.');
      return;
    }
    setWeatherLoading(true);
    try {
      const w = await fetchWeatherForCity(loc, unit ?? preferences?.temperatureUnit ?? 'F');
      setWeather(w);
    } catch (e) {
      Alert.alert('Weather error', e.message);
    } finally {
      setWeatherLoading(false);
    }
  }, [preferences]);

  const handleGetSuggestion = useCallback(async () => {
    if (clothingItems.length === 0) {
      Alert.alert('Empty closet', 'Add some clothes to your closet first!');
      return;
    }
    setLoading(true);
    setSuggestion('');
    try {
      const result = await getOutfitSuggestion({
        clothingItems,
        preferences,
        weather,
        vibe: selectedVibe,
        customRequest,
      });
      setSuggestion(result);
    } catch (e) {
      Alert.alert('Suggestion error', e.message);
    } finally {
      setLoading(false);
    }
  }, [clothingItems, preferences, weather, selectedVibe, customRequest]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>AI Stylist</Text>
        <Text style={styles.subheading}>Powered by DeepSeek</Text>

        {/* Weather */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weather</Text>
            <TouchableOpacity onPress={() => handleFetchWeather()} disabled={weatherLoading}>
              <Text style={styles.action}>{weatherLoading ? 'Loading...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>
          {weather ? (
            <View style={styles.weatherCard}>
              <Text style={styles.weatherTemp}>{weather.temp}°{weather.unit}</Text>
              <View>
                <Text style={styles.weatherDesc}>{weather.description}</Text>
                <Text style={styles.weatherCity}>{weather.cityName}</Text>
                <Text style={styles.weatherFeels}>Feels like {weather.feelsLike}°{weather.unit}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.mutedText}>
              {preferences?.weatherLocation ? 'Tap Refresh to load weather' : 'Set your city in Settings'}
            </Text>
          )}
        </View>

        {/* Vibe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vibe</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
            {VIBES.map((vibe) => (
              <TouchableOpacity
                key={vibe}
                style={[styles.chip, selectedVibe === vibe && styles.chipActive]}
                onPress={() => setSelectedVibe(selectedVibe === vibe ? '' : vibe)}
              >
                <Text style={[styles.chipText, selectedVibe === vibe && styles.chipTextActive]}>{vibe}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Custom Request */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Request</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="e.g. I have a job interview, something smart but relaxed..."
            placeholderTextColor={C.muted}
            value={customRequest}
            onChangeText={setCustomRequest}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Closet summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Closet</Text>
          <Text style={styles.mutedText}>{clothingItems.length} item{clothingItems.length !== 1 ? 's' : ''} available</Text>
        </View>

        {/* Get Suggestion */}
        <TouchableOpacity style={styles.suggestBtn} onPress={handleGetSuggestion} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.suggestBtnText}>Get Outfit Suggestion</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {suggestion ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Your Outfit</Text>
            <Text style={styles.resultText}>{suggestion}</Text>
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSuggestion('')}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontFamily: F.heading, fontSize: 18, color: C.text, letterSpacing: 0.3 },
  action: { fontSize: 13, color: C.primary, fontWeight: '600' },

  mutedText: { fontSize: 13, color: C.muted, fontStyle: 'italic' },
  weatherCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  weatherTemp: { fontFamily: F.display, fontSize: 44, color: C.primary },
  weatherDesc: { fontSize: 15, color: C.text, fontWeight: '600' },
  weatherCity: { fontSize: 13, color: C.muted },
  weatherFeels: { fontSize: 12, color: C.muted },

  chipRow: { marginTop: 8 },
  chipContent: { gap: 8 },
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
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    marginTop: 8,
  },
  multilineInput: { height: 80, paddingTop: 10 },

  suggestBtn: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  suggestBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

  resultCard: {
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  resultTitle: { fontFamily: F.heading, fontSize: 20, color: C.primary, marginBottom: 12 },
  resultText: { fontSize: 15, color: C.text, lineHeight: 24 },
  clearBtn: {
    alignSelf: 'flex-end',
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  clearBtnText: { fontSize: 12, color: C.muted },
});
