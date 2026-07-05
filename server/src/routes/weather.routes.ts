import { Router, Request, Response } from 'express';
import { fetchWeather } from '../services/weather.service';
import { generateLiveWeatherNews } from '../services/ai.service';

const router = Router();

router.get('/colombo', async (req: Request, res: Response) => {
  try {
    const data = await fetchWeather();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

router.get('/news', async (req: Request, res: Response) => {
  try {
    const data = await generateLiveWeatherNews();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
