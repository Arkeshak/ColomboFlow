import { Router, Request, Response } from 'express';
import axios from 'axios';
import { getHolidayCache } from '../utils/festivals';

const router = Router();

// ML Service URL (from docker-compose)
const ML_API_URL = process.env.ML_API_URL || 'http://ml:5000';

router.post('/driver-risk', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${ML_API_URL}/predict_risk`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching driver risk from ML:', error.message);
    res.status(500).json({ error: 'Failed to predict driver risk' });
  }
});

router.get('/weather/:city', async (req: Request, res: Response) => {
  const city = (req.params.city as string).toLowerCase();
  
  // Simple geocoding for prominent cities
  const cityCoords: { [key: string]: { lat: number, lon: number } } = {
    'colombo': { lat: 6.9271, lon: 79.8612 },
    'kandy': { lat: 7.2906, lon: 80.6337 },
    'galle': { lat: 6.0535, lon: 80.2210 },
    'jaffna': { lat: 9.6615, lon: 80.0255 },
    'trincomalee': { lat: 8.5811, lon: 81.2335 },
    'negombo': { lat: 7.2008, lon: 79.8737 },
    'anuradhapura': { lat: 8.3114, lon: 80.4037 }
  };
  
  const coords = cityCoords[city];
  if (!coords) {
    return res.status(404).json({ error: 'City not found in supported Sri Lankan cities.' });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=Asia/Colombo&past_days=7&forecast_days=7`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching intercity weather:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

router.get('/holidays', (req: Request, res: Response) => {
  const currentYear = new Date().getFullYear();
  const cache = getHolidayCache();
  
  if (!cache[currentYear] || cache[currentYear].length === 0) {
    return res.status(404).json({ error: 'Holidays not loaded yet' });
  }
  
  res.json(cache[currentYear]);
});

export default router;
