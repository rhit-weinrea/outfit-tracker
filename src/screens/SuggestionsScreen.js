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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { getOutfitSuggestion } from '../utils/deepseek';
import { fetchWeatherForCity } from '../utils/weather';

const VIBES = ['Casual', 'Cozy', 'Professional', 'Chic', 'Sporty', 'Date Night', 'Edgy', 'Minimalist', 'Bohemian', 'Streetwear'];
const API_KEY_STORAGE = 'deepseek_api_key';

export default function SuggestionsScreen() {
  const { clothingItems, preferences } = useApp();

  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const [selectedVibe, setSelectedVibe] = useState('');
  const [customRequest, setCustomRequest] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);

  // Load saved API key on mount
  useEffect(() => {
    AsyncStorage.getItem(API_KEY_STORAGE).then((key) => {
      if (key) setApiKey(key);
    });
  }, []);

  // Auto-fetch weather if location is set in preferences
  useEffect(() => {
    if (preferences?.weatherLocation && !weather) {
      handleFetchWeather(preferences.weatherLocation, preferences.temperatureUnit ?? 'F');
    }
  }, [preferences, weather, handleFetchWeather]);

  const handleSaveApiKey = useCallback(async () => {
    const trimmed = apiKeyInput.trim();
    await AsyncStorage.setItem(API_KEY_STORAGE, trimmed);
    setApiKey(trimmed);
    setApiKeyInput('');
    setShowApiKeyInput(false);
  }, [apiKeyInput]);

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
    if (!apiKey) {
      Alert.alert('API Key needed', 'Please save your DeepSeek API key first.');
      setShowApiKeyInput(true);
      return;
    }
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
        apiKey,
      });
      setSuggestion(result);
    } catch (e) {
      Alert.alert('Suggestion error', e.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, clothingItems, preferences, weather, selectedVibe, customRequest]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>AI Outfit Suggestions</Text>
        <Text style={styles.subheading}>Powered by DeepSeek</Text>

        {/* API Key Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔑  DeepSeek API Key</Text>
            <TouchableOpacity onPress={() => setShowApiKeyInput(!showApiKeyInput)}>
              <Text style={styles.editLink}>{apiKey ? 'Change' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
          {apiKey && !showApiKeyInput ? (
            <Text style={styles.apiKeySet}>✅  API key saved</Text>
          ) : null}
          {showApiKeyInput && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                placeholderTextColor="#aaa"
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.smallBtn} onPress={handleSaveApiKey}>
                <Text style={styles.smallBtnText}>Save Key</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Weather Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌤  Weather</Text>
            <TouchableOpacity onPress={() => handleFetchWeather()} disabled={weatherLoading}>
              <Text style={styles.editLink}>{weatherLoading ? 'Loading…' : 'Refresh'}</Text>
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
            <Text style={styles.noWeatherText}>
              {preferences?.weatherLocation
                ? 'Tap Refresh to load weather'
                : 'Set your city in Settings to auto-fetch weather'}
            </Text>
          )}
        </View>

        {/* Vibe Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨  Vibe / Mood</Text>
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
          <Text style={styles.sectionTitle}>💬  Custom Request</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="e.g. I have a job interview, need something smart but not too formal…"
            placeholderTextColor="#aaa"
            value={customRequest}
            onChangeText={setCustomRequest}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Closet summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👗  Your Closet</Text>
          <Text style={styles.closetCount}>{clothingItems.length} item{clothingItems.length !== 1 ? 's' : ''} available</Text>
        </View>

        {/* Suggest Button */}
        <TouchableOpacity style={styles.suggestBtn} onPress={handleGetSuggestion} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.suggestBtnText}>✨  Get Outfit Suggestion</Text>
          )}
        </TouchableOpacity>

        {/* Suggestion Result */}
        {suggestion ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Your Outfit Suggestion</Text>
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  editLink: { fontSize: 14, color: C.primary, fontWeight: '600' },
  apiKeySet: { fontSize: 14, color: '#15803D' },
  input: {
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
    marginTop: 8,
  },
  multilineInput: { height: 80, paddingTop: 10 },
  smallBtn: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 18,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  smallBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  weatherCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  weatherTemp: { fontSize: 40, fontWeight: '800', color: C.primary },
  weatherDesc: { fontSize: 15, color: C.text, fontWeight: '600' },
  weatherCity: { fontSize: 13, color: C.textLight },
  weatherFeels: { fontSize: 12, color: C.textLight },
  noWeatherText: { fontSize: 13, color: C.textLight, fontStyle: 'italic', marginTop: 4 },
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
  chipText: { fontSize: 13, color: C.textLight },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  closetCount: { fontSize: 14, color: C.textLight, marginTop: 4 },
  suggestBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  suggestBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  resultCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  resultTitle: { fontSize: 16, fontWeight: '700', color: C.primary, marginBottom: 12 },
  resultText: { fontSize: 15, color: C.text, lineHeight: 24 },
  clearBtn: { alignSelf: 'flex-end', marginTop: 16, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  clearBtnText: { fontSize: 13, color: C.textLight },
});
