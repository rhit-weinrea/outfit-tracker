import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getClothingItems,
  saveClothingItems,
  getOutfits,
  saveOutfits,
  getPreferences,
  savePreferences,
  addClothingItem,
  deleteClothingItem,
  updateClothingItem,
  addOutfit,
  deleteOutfit,
  getSchedule,
  saveSchedule,
} from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [clothingItems, setClothingItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [items, savedOutfits, prefs, sched] = await Promise.all([
        getClothingItems(),
        getOutfits(),
        getPreferences(),
        getSchedule(),
      ]);
      setClothingItems(items);
      setOutfits(savedOutfits);
      setPreferences(prefs);
      setSchedule(sched);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleAddClothingItem = useCallback(async (item) => {
    const updated = await addClothingItem(item);
    setClothingItems(updated);
  }, []);

  const handleDeleteClothingItem = useCallback(async (id) => {
    const updated = await deleteClothingItem(id);
    setClothingItems(updated);
    const updatedOutfits = outfits.map((outfit) => ({
      ...outfit,
      itemIds: outfit.itemIds.filter((itemId) => itemId !== id),
    }));
    await saveOutfits(updatedOutfits);
    setOutfits(updatedOutfits);
  }, [outfits]);

  const handleUpdateClothingItem = useCallback(async (item) => {
    const updated = await updateClothingItem(item);
    setClothingItems(updated);
  }, []);

  const handleAddOutfit = useCallback(async (outfit) => {
    const updated = await addOutfit(outfit);
    setOutfits(updated);
  }, []);

  const handleDeleteOutfit = useCallback(async (id) => {
    const updated = await deleteOutfit(id);
    setOutfits(updated);
  }, []);

  const handleSavePreferences = useCallback(async (prefs) => {
    await savePreferences(prefs);
    setPreferences(prefs);
  }, []);

  const handleSaveSchedule = useCallback(async (sched) => {
    await saveSchedule(sched);
    setSchedule(sched);
  }, []);

  return (
    <AppContext.Provider
      value={{
        clothingItems,
        outfits,
        preferences,
        schedule,
        loading,
        addClothingItem: handleAddClothingItem,
        deleteClothingItem: handleDeleteClothingItem,
        updateClothingItem: handleUpdateClothingItem,
        addOutfit: handleAddOutfit,
        deleteOutfit: handleDeleteOutfit,
        savePreferences: handleSavePreferences,
        saveSchedule: handleSaveSchedule,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
