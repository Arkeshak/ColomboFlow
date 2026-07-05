import axios from 'axios';

const COLOMBO_LAT = 6.9271;
const COLOMBO_LON = 79.8612;

const mapWeatherCode = (code: number) => {
  if (code === 0) return { main: 'Clear', desc: 'clear sky' };
  if (code <= 3) return { main: 'Clouds', desc: 'partly cloudy' };
  if (code <= 48) return { main: 'Fog', desc: 'foggy' };
  if (code <= 57) return { main: 'Drizzle', desc: 'light drizzle' };
  if (code <= 67) return { main: 'Rain', desc: 'moderate rain' };
  if (code <= 77) return { main: 'Snow', desc: 'snow' };
  if (code <= 82) return { main: 'Rain', desc: 'rain showers' };
  if (code <= 86) return { main: 'Snow', desc: 'snow showers' };
  if (code >= 95) return { main: 'Thunderstorm', desc: 'thunderstorms' };
  return { main: 'Unknown', desc: 'unknown' };
};

export const fetchWeather = async () => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${COLOMBO_LAT}&longitude=${COLOMBO_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility,precipitation&timezone=Asia/Colombo`;
    const response = await axios.get(url);
    const curr = response.data.current;
    
    const weather = mapWeatherCode(curr.weather_code);
    
    return {
      weather: [{ main: weather.main, description: weather.desc }],
      main: { temp: curr.temperature_2m, humidity: curr.relative_humidity_2m },
      wind: { speed: curr.wind_speed_10m },
      visibility: curr.visibility || 10000,
      rain: { '1h': curr.precipitation || 0 }
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    // Fallback to mock data if API fails
    return {
      weather: [{ main: 'Rain', description: 'moderate rain' }],
      main: { temp: 28, humidity: 85 },
      wind: { speed: 12 },
      visibility: 8000,
      rain: { '1h': 5.2 }
    };
  }
};
