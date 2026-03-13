import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CLOTHING_ITEMS: 'clothing_items',
  OUTFITS: 'outfits',
  PREFERENCES: 'user_preferences',
};

// Clothing Items
export async function getClothingItems() {
  try {
    const data = await AsyncStorage.getItem(KEYS.CLOTHING_ITEMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveClothingItems(items) {
  await AsyncStorage.setItem(KEYS.CLOTHING_ITEMS, JSON.stringify(items));
}

export async function addClothingItem(item) {
  const items = await getClothingItems();
  const updated = [...items, item];
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

// Outfits
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

// Preferences
export async function getPreferences() {
  try {
    const data = await AsyncStorage.getItem(KEYS.PREFERENCES);
    return data
      ? JSON.parse(data)
      : {
          style: [],
          occasions: [],
          colorPreferences: [],
          avoidColors: [],
          weatherLocation: '',
          temperatureUnit: 'F',
        };
  } catch {
    return {
      style: [],
      occasions: [],
      colorPreferences: [],
      avoidColors: [],
      weatherLocation: '',
      temperatureUnit: 'F',
    };
  }
}

export async function savePreferences(prefs) {
  await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
}
