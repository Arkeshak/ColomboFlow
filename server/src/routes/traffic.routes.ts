import { Router, Request, Response } from 'express';
import { getLiveTraffic, getTrafficHistory } from '../services/traffic.service';

const router = Router();

router.get('/live', async (req: Request, res: Response) => {
  try {
    const data = await getLiveTraffic();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch live traffic' });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : 24;
    const data = await getTrafficHistory(hours);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch traffic history' });
  }
});

export default router;
