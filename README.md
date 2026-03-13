# outfit-tracker
AI powered outfit creator + clothing tracker

A React Native (Expo) mobile app that lets you:

- **Catalog your closet** — Add clothing items with photos, category, color, brand and tags
- **Create outfits** — Build and save outfits from your wardrobe, organized by occasion
- **Set style preferences** — Choose your style, favorite occasions, and preferred colors
- **Get AI outfit suggestions** — Powered by [DeepSeek API](https://platform.deepseek.com/), factoring in weather, vibe, preferences and custom requests

## Getting Started

```bash
npm install
npm start      # Expo Go – scan QR code on your device
npm run android
npm run ios
```

## Configuration

Open the **AI Stylist** tab in the app and tap **Add** next to "DeepSeek API Key" to enter your key.  
Get your key at <https://platform.deepseek.com/>.

Weather is provided by [Open-Meteo](https://open-meteo.com/) — no API key required.  
Set your city in the **Preferences** tab to enable weather-aware outfit suggestions.

## Project Structure

```
src/
  screens/
    ClosetScreen.js      – Browse, search, add and remove clothing items
    OutfitsScreen.js     – Create and view saved outfits
    SuggestionsScreen.js – AI-powered outfit suggestions
    SettingsScreen.js    – Style preferences & location settings
  context/
    AppContext.js        – Global state (React Context + AsyncStorage)
  utils/
    storage.js           – AsyncStorage CRUD helpers
    deepseek.js          – DeepSeek API integration
    weather.js           – Open-Meteo weather + geocoding
    helpers.js           – Shared utilities
```

