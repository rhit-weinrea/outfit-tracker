import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CLOTHING_ITEMS: 'clothing_items',
  OUTFITS: 'outfits',
  PREFERENCES: 'user_preferences',
  SCHEDULE: 'outfit_schedule',
  ONBOARDING: 'onboarding_complete',
};

// ── Migration ────────────────────────────────────────────────────────────────
// Converts old inHamper:boolean items to status:'clean'|'worn'|'hamper'
async function migrateClothingItems(items) {
  let needsSave = false;
  const migrated = items.map((item) => {
    if (item.status === undefined) {
      needsSave = true;
      const { inHamper, ...rest } = item;
      return { ...rest, status: inHamper ? 'hamper' : 'clean' };
    }
    return item;
  });
  if (needsSave) await saveClothingItems(migrated);
  return migrated;
}

// ── Clothing Items ───────────────────────────────────────────────────────────
export async function getClothingItems() {
  try {
    const data = await AsyncStorage.getItem(KEYS.CLOTHING_ITEMS);
    const items = data ? JSON.parse(data) : [];
    return migrateClothingItems(items);
  } catch {
    return [];
  }
}

export async function saveClothingItems(items) {
  await AsyncStorage.setItem(KEYS.CLOTHING_ITEMS, JSON.stringify(items));
}

export async function addClothingItem(item) {
  const items = await getClothingItems();
  const updated = [...items, { status: 'clean', ...item }];
  await saveClothingItems(updated);
  return updated;
}

export async function deleteClothingItem(id) {
  const items = await getClothingItems();
  const updated = items.filter((i) => i.id !== id);
  await saveClothingItems(updated);
  return updated;
}

export async function updateClothingItem(updatedItem) {
  const items = await getClothingItems();
  const updated = items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
  await saveClothingItems(updated);
  return updated;
}

// ── Outfits ──────────────────────────────────────────────────────────────────
export async function getOutfits() {
  try {
    const data = await AsyncStorage.getItem(KEYS.OUTFITS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveOutfits(outfits) {
  await AsyncStorage.setItem(KEYS.OUTFITS, JSON.stringify(outfits));
}

export async function addOutfit(outfit) {
  const outfits = await getOutfits();
  const updated = [...outfits, outfit];
  await saveOutfits(updated);
  return updated;
}

export async function deleteOutfit(id) {
  const outfits = await getOutfits();
  const updated = outfits.filter((o) => o.id !== id);
  await saveOutfits(updated);
  return updated;
}

// ── Schedule ─────────────────────────────────────────────────────────────────
// Format: { 'YYYY-MM-DD': outfitId | null }
export async function getSchedule() {
  try {
    const data = await AsyncStorage.getItem(KEYS.SCHEDULE);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function saveSchedule(schedule) {
  await AsyncStorage.setItem(KEYS.SCHEDULE, JSON.stringify(schedule));
}

// ── Preferences ──────────────────────────────────────────────────────────────
const DEFAULT_PREFS = {
  style: [],
  customStyles: [],
  occasions: [],
  colorPreferences: [],
  avoidColors: [],
  weatherLocation: '',
  temperatureUnit: 'F',
};

export async function getPreferences() {
  try {
    const data = await AsyncStorage.getItem(KEYS.PREFERENCES);
    return data ? { ...DEFAULT_PREFS, ...JSON.parse(data) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePreferences(prefs) {
  await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
}

// ── Onboarding ───────────────────────────────────────────────────────────────
export async function isOnboardingComplete() {
  try {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete() {
  await AsyncStorage.setItem(KEYS.ONBOARDING, 'true');
}
