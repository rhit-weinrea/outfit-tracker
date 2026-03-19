import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { setOnboardingComplete } from '../utils/storage';
import { generateId } from '../utils/helpers';
import { C, F } from '../theme';

const STYLE_OPTIONS = [
  'Casual', 'Classic', 'Minimalist', 'Streetwear', 'Preppy',
  'Athleisure', 'Edgy', 'Romantic', 'Business', 'Bohemian',
];

const OCCASION_OPTIONS = ['Everyday', 'Work', 'Formal', 'Date Night', 'Sport', 'Party'];

// Basic wardrobe pieces the user likely already owns
const BASIC_PIECES = [
  { name: 'White T-Shirt', category: 'Top', color: 'White' },
  { name: 'Black T-Shirt', category: 'Top', color: 'Black' },
  { name: 'Blue Jeans', category: 'Bottom', color: 'Blue' },
  { name: 'Black Jeans', category: 'Bottom', color: 'Black' },
  { name: 'White Button-Down', category: 'Top', color: 'White' },
  { name: 'Chinos', category: 'Bottom', color: 'Tan' },
  { name: 'Black Dress Pants', category: 'Bottom', color: 'Black' },
  { name: 'Sneakers', category: 'Shoes', color: 'White' },
  { name: 'White Sneakers', category: 'Shoes', color: 'White' },
  { name: 'Black Sneakers', category: 'Shoes', color: 'Black' },
  { name: 'Ankle Boots', category: 'Shoes', color: 'Black' },
  { name: 'Loafers', category: 'Shoes', color: 'Brown' },
  { name: 'Denim Jacket', category: 'Outerwear', color: 'Blue' },
  { name: 'Black Blazer', category: 'Outerwear', color: 'Black' },
  { name: 'Hoodie', category: 'Top', color: 'Gray' },
  { name: 'Sweatpants', category: 'Bottom', color: 'Gray' },
  { name: 'Little Black Dress', category: 'Dress', color: 'Black' },
  { name: 'Floral Dress', category: 'Dress', color: 'Multicolor' },
  { name: 'Belt', category: 'Accessories', color: 'Black' },
  { name: 'Watch', category: 'Accessories', color: 'Black' },
];

const TOTAL_STEPS = 4;

export default function OnboardingModal({ visible, onComplete }) {
  const { addClothingItem, savePreferences, preferences } = useApp();
  const [step, setStep] = useState(0);

  // Step 1: style
  const [selectedStyles, setSelectedStyles] = useState([]);
  // Step 2: occasions
  const [selectedOccasions, setSelectedOccasions] = useState([]);
  // Step 3: basic pieces
  const [selectedPieces, setSelectedPieces] = useState([]);
  // Step 4: location
  const [location, setLocation] = useState('');

  const toggleStyle = useCallback((s) => {
    setSelectedStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }, []);

  const toggleOccasion = useCallback((o) => {
    setSelectedOccasions((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]);
  }, []);

  const togglePiece = useCallback((name) => {
    setSelectedPieces((prev) => prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]);
  }, []);

  const handleFinish = useCallback(async () => {
    // Save preferences
    await savePreferences({
      ...(preferences || {}),
      style: selectedStyles,
      occasions: selectedOccasions,
      weatherLocation: location.trim(),
    });

    // Add selected basic pieces to closet
    for (const piece of BASIC_PIECES.filter((p) => selectedPieces.includes(p.name))) {
      await addClothingItem({
        id: generateId(),
        name: piece.name,
        category: piece.category,
        color: piece.color,
        brand: '',
        tags: ['basic'],
        imageUri: null,
        status: 'clean',
        createdAt: new Date().toISOString(),
      });
    }

    await setOnboardingComplete();
    onComplete();
  }, [selectedStyles, selectedOccasions, selectedPieces, location, preferences, savePreferences, addClothingItem, onComplete]);

  const canNext = () => {
    if (step === 0) return selectedStyles.length > 0;
    return true;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <>
              <Text style={styles.heading}>Welcome</Text>
              <Text style={styles.subheading}>Let's set up your style profile. What best describes your style?</Text>
              <View style={styles.chipGrid}>
                {STYLE_OPTIONS.map((s) => {
                  const active = selectedStyles.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleStyle(s)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.hint}>Select all that apply</Text>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.heading}>Occasions</Text>
              <Text style={styles.subheading}>What do you typically dress for?</Text>
              <View style={styles.chipGrid}>
                {OCCASION_OPTIONS.map((o) => {
                  const active = selectedOccasions.includes(o);
                  return (
                    <TouchableOpacity
                      key={o}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleOccasion(o)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{o}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.heading}>Your Wardrobe</Text>
              <Text style={styles.subheading}>Check the basics you already own — we'll add them to your closet.</Text>
              <View style={styles.pieceList}>
                {BASIC_PIECES.map((piece) => {
                  const selected = selectedPieces.includes(piece.name);
                  return (
                    <TouchableOpacity
                      key={piece.name}
                      style={[styles.pieceRow, selected && styles.pieceRowActive]}
                      onPress={() => togglePiece(piece.name)}
                    >
                      <View style={[styles.pieceCheck, selected && styles.pieceCheckActive]}>
                        {selected && <Text style={styles.pieceCheckMark}>✓</Text>}
                      </View>
                      <View style={styles.pieceInfo}>
                        <Text style={styles.pieceName}>{piece.name}</Text>
                        <Text style={styles.pieceMeta}>{piece.category} · {piece.color}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.hint}>You can always add, edit, or remove items later</Text>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.heading}>Weather</Text>
              <Text style={styles.subheading}>Enter your city to get weather-based outfit suggestions.</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. New York, London, Tokyo"
                placeholderTextColor={C.muted}
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
              />
              <Text style={styles.hint}>You can skip this and set it later in Preferences</Text>
            </>
          )}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}

          <View style={styles.stepDots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          {step < TOTAL_STEPS - 1 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
              onPress={() => setStep((s) => s + 1)}
              disabled={!canNext()}
            >
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleFinish}>
              <Text style={styles.nextBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  progressBar: { height: 3, backgroundColor: C.border },
  progressFill: { height: 3, backgroundColor: C.primary },

  content: { padding: 28, paddingTop: 48, paddingBottom: 20 },
  heading: { fontFamily: F.display, fontSize: 40, color: C.text, marginBottom: 8, letterSpacing: 0.5 },
  subheading: { fontSize: 15, color: C.muted, marginBottom: 28, lineHeight: 22 },
  hint: { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 16, textAlign: 'center' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 14, color: C.muted },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  pieceList: { gap: 8 },
  pieceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.surface, borderRadius: 10, borderWidth: 1,
    borderColor: C.border, padding: 14,
  },
  pieceRowActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  pieceCheck: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  pieceCheckActive: { backgroundColor: C.primary, borderColor: C.primary },
  pieceCheckMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  pieceInfo: {},
  pieceName: { fontFamily: F.heading, fontSize: 16, color: C.text },
  pieceMeta: { fontSize: 12, color: C.muted, marginTop: 2 },

  input: {
    backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.text,
  },

  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface,
  },
  backBtn: { width: 70, alignItems: 'flex-start' },
  backBtnText: { fontSize: 15, color: C.muted, fontWeight: '600' },
  stepDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { backgroundColor: C.primary, width: 20, borderRadius: 3 },
  nextBtn: {
    width: 70, backgroundColor: C.primary, borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: '#A0B4A8' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
