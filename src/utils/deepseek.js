// DeepSeek API integration for outfit suggestions
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

/**
 * Get outfit suggestions from DeepSeek AI.
 *
 * @param {Object} params
 * @param {Array}  params.clothingItems  - Array of clothing items in the user's closet
 * @param {Object} params.preferences   - User style preferences
 * @param {Object|null} params.weather  - Current weather data (may be null)
 * @param {string} params.vibe          - Desired vibe / mood (e.g. "casual", "professional")
 * @param {string} params.customRequest - Free-text custom request from the user
 * @param {string} params.apiKey        - DeepSeek API key
 * @returns {Promise<string>} AI-generated outfit suggestion text
 */
export async function getOutfitSuggestion({ clothingItems, preferences, weather, vibe, customRequest, apiKey }) {
  if (!apiKey) {
    throw new Error('DeepSeek API key is required. Please add it in Settings.');
  }

  const closetSummary = buildClosetSummary(clothingItems);
  const prefSummary = buildPreferenceSummary(preferences);
  const weatherSummary = weather ? buildWeatherSummary(weather) : 'No weather data available.';

  const userMessage = buildPrompt({ closetSummary, prefSummary, weatherSummary, vibe, customRequest });

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            'You are a personal stylist assistant. Your job is to suggest complete, stylish outfits from the user\'s existing wardrobe. Be specific about which items to wear, explain why they work together, and offer practical styling tips. Keep responses concise and friendly.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.8,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? 'No suggestion returned.';
}

function buildClosetSummary(items) {
  if (!items || items.length === 0) {
    return 'The closet is empty.';
  }
  const lines = items.map(
    (item) =>
      `- ${item.name} (${item.category}${item.color ? ', ' + item.color : ''}${item.tags?.length ? ', tags: ' + item.tags.join(', ') : ''})`
  );
  return `Closet items:\n${lines.join('\n')}`;
}

function buildPreferenceSummary(prefs) {
  if (!prefs) return 'No preferences set.';
  const parts = [];
  if (prefs.style?.length) parts.push(`Style: ${prefs.style.join(', ')}`);
  if (prefs.occasions?.length) parts.push(`Occasions: ${prefs.occasions.join(', ')}`);
  if (prefs.colorPreferences?.length) parts.push(`Favorite colors: ${prefs.colorPreferences.join(', ')}`);
  if (prefs.avoidColors?.length) parts.push(`Avoid colors: ${prefs.avoidColors.join(', ')}`);
  return parts.length ? parts.join('. ') : 'No specific preferences set.';
}

function buildWeatherSummary(weather) {
  return `Current weather: ${weather.description}, temperature ${weather.temp}°${weather.unit ?? 'F'}, feels like ${weather.feelsLike}°${weather.unit ?? 'F'}.`;
}

function buildPrompt({ closetSummary, prefSummary, weatherSummary, vibe, customRequest }) {
  const parts = [closetSummary, `\nUser preferences: ${prefSummary}`, `\nWeather: ${weatherSummary}`];
  if (vibe) parts.push(`\nDesired vibe/mood: ${vibe}`);
  if (customRequest) parts.push(`\nCustom request: ${customRequest}`);
  parts.push('\nPlease suggest a complete outfit from the items listed above. Include top, bottom, shoes and any accessories if available.');
  return parts.join('');
}
