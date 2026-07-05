import axios from 'axios';
import { getFestival, isPoyaDay } from '../utils/festivals';
import { fetchWeather } from './weather.service';
import { getDepartureAdvice } from './ai.service';
import { getCongestionPrediction } from './ml.service';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export const getRoutePlan = async (startLng: number, startLat: number, endLng: number, endLat: number) => {
  try {
    const url = `${OSRM_BASE_URL}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await axios.get(url);
    const data = response.data;

    let warnings: string[] = [];
    try {
      const weather = await fetchWeather();
      if (weather.rain && weather.rain['1h'] > 10) {
        warnings.push("Heavy rain detected. Low-lying areas (e.g., Armour Street, Thummulla) may be waterlogged. Proceed with caution.");
      }
    } catch (e) {
      console.warn("Could not fetch weather for route warning", e);
    }

    if (warnings.length > 0) {
      data.warnings = warnings;
    }

    return data;
  } catch (error) {
    console.error('OSRM Route Error:', error);
    throw new Error('Failed to compute route');
  }
};

export const getDepartureTimeAdvice = async (originName: string, destName: string) => {
  try {
    // 1. Get Weather
    const weather = await fetchWeather();
    const rainfall = weather.rain ? weather.rain['1h'] || 0 : 0;

    // 2. Get Festival
    const today = new Date();
    const festival = getFestival(today);
    const poya = isPoyaDay(today) ? 1 : 0;

    // 3. Get ML Prediction
    const mlPrediction = await getCongestionPrediction({
      hour_of_day: today.getHours(),
      day_of_week: today.getDay(),
      is_poya_day: poya,
      rainfall_mm: rainfall,
      road_segment_id: 1 // Default or derived from route
    });

    // 4. Generate AI Advice
    const advice = await getDepartureAdvice(originName, destName, mlPrediction, weather, festival);

    let warnings: string[] = [];
    if (rainfall > 10) {
      warnings.push("Heavy rain detected. Low-lying areas (e.g., Armour Street, Thummulla) may be waterlogged. Proceed with caution.");
    }

    return {
      mlPrediction,
      weather: weather.weather[0].description,
      festival: festival ? festival.name : null,
      aiAdvice: advice,
      warnings
    };
  } catch (error) {
    console.error('Departure time calculation error:', error);
    throw new Error('Failed to calculate optimal departure time');
  }
};
