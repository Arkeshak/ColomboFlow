import { Router, Request, Response } from 'express';
import { getActiveIncidents, reportIncident } from '../services/incident.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const incidents = await getActiveIncidents();
    res.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch active incidents' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, lat, lon, lng } = req.body;
    const longitude = lon ?? lng; // Accept both field names from client
    if (!type || !lat || !longitude) {
      return res.status(400).json({ error: 'type, lat, and lon/lng are required' });
    }

    const io = req.app.get('io');
    if (!io) {
      return res.status(500).json({ error: 'Socket.IO not initialized on server' });
    }

    const incident = await reportIncident(type, lat, longitude, io);
    res.status(201).json(incident);
  } catch (error) {
    console.error('Error reporting incident:', error);
    res.status(500).json({ error: 'Failed to report incident' });
  }
});

export default router;
