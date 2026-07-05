import { Router, Request, Response } from 'express';
import { getChatResponse } from '../services/ai.service';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Valid messages array is required' });
    }
    const reply = await getChatResponse(messages);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process AI chat' });
  }
});

export default router;
