import express, { Router } from 'express';
import { handleWebhook } from '../controllers/stripe.controller';

const router = Router();

// Stripe requires the raw body to construct the event, so we bypass express.json() here
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
