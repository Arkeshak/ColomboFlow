import { Router, Request, Response } from 'express';
import { getRoutePlan, getDepartureTimeAdvice } from '../services/route.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/plan', async (req: Request, res: Response) => {
  try {
    const { startLng, startLat, endLng, endLat } = req.body;
    
    if (startLng == null || startLat == null || endLng == null || endLat == null) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }

    const routeData = await getRoutePlan(startLng, startLat, endLng, endLat);
    res.json(routeData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to plan route' });
  }
});

router.get('/departure-time', async (req: Request, res: Response) => {
  try {
    const { origin, destination } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Missing origin or destination names' });
    }

    const adviceData = await getDepartureTimeAdvice(origin as string, destination as string);
    res.json(adviceData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get departure advice' });
  }
});

export default router;
