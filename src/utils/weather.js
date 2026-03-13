// Weather data fetching using Open-Meteo (free, no API key required)
// Geocoding via Open-Meteo geocoding API

/**
 * Geocode a city name to lat/lon using Open-Meteo geocoding API.
 * @param {string} cityName
 * @returns {Promise<{lat: number, lon: number, name: string}>}
 */
export async function geocodeCity(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to geocode city.');
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Could not find location: "${cityName}"`);
  }
  const { latitude, longitude, name } = data.results[0];
  return { lat: latitude, lon: longitude, name };
}

/**
 * Fetch current weather for a lat/lon using Open-Meteo.
 * @param {number} lat
 * @param {number} lon
 * @param {'F'|'C'} unit
 * @returns {Promise<{temp: number, feelsLike: number, description: string, unit: string}>}
 */
export async function fetchWeather(lat, lon, unit = 'F') {
  const tempUnit = unit === 'F' ? 'fahrenheit' : 'celsius';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code&temperature_unit=${tempUnit}&wind_speed_unit=mph&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch weather.');
  const data = await response.json();
  const current = data.current;
  return {
    temp: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    description: weatherCodeToDescription(current.weather_code),
    unit,
  };
}

/**
 * Fetch weather for a city name.
 * @param {string} cityName
 * @param {'F'|'C'} unit
 */
export async function fetchWeatherForCity(cityName, unit = 'F') {
  const { lat, lon, name } = await geocodeCity(cityName);
  const weather = await fetchWeather(lat, lon, unit);
  return { ...weather, cityName: name };
}

// WMO Weather Codes -> Human-readable description
function weatherCodeToDescription(code) {
  const codes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Icy fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return codes[code] ?? 'Unknown conditions';
}
