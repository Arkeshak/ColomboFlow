import { Request, Response } from 'express';
import stripe from '../services/stripe.service';
import { db } from '../db';
import { sendSms } from '../services/sms.service';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_secret';

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Requires raw body (handled in index.ts)
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata?.bookingId;
      
      if (bookingId) {
        // Update booking status to confirmed
        await db.none("UPDATE parking_bookings SET status = 'confirmed' WHERE id = $1", [bookingId]);
        console.log(`Booking ${bookingId} confirmed via Stripe webhook.`);

        // Fetch user phone number and lot name
        const details = await db.oneOrNone(`
          SELECT u.phone, p.name as lot_name, b.slot_number, b.qr_code
          FROM parking_bookings b
          JOIN users u ON b.user_id = u.id
          JOIN parking_lots p ON b.lot_id = p.id
          WHERE b.id = $1
        `, [bookingId]);

        if (details && details.phone) {
          const msg = `ColomboFlow: Your parking at ${details.lot_name} is confirmed. Show this QR at the gate: ${details.qr_code}`;
          await sendSms(details.phone, msg);
        }
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
};
