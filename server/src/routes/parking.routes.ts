import { Router, Request, Response } from 'express';
import { getNearbyParking, getLotAvailability, bookSlot } from '../services/parking.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { createPaymentIntent } from '../services/stripe.service';
import { db } from '../db';
import { generateBookingQR } from '../utils/qrcode';

const router = Router();

router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lon, radius, preferCovered } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

    const radiusMeters = radius ? parseInt(radius as string, 10) : 1000;
    const isPreferCovered = preferCovered === 'true';
    const lots = await getNearbyParking(parseFloat(lat as string), parseFloat(lon as string), radiusMeters, isPreferCovered);
    res.json(lots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nearby parking' });
  }
});

router.get('/:lotId/availability', async (req: Request, res: Response) => {
  try {
    const lotId = req.params.lotId as string;
    const availability = await getLotAvailability(lotId);
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lot availability' });
  }
});

// GET /parking/bookings — authenticated, returns user's booking history
router.get('/bookings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const bookings = await db.any(`
      SELECT 
        b.id, b.slot_number, b.start_time, b.end_time, b.status, b.qr_code,
        p.name AS lot_name, p.price_per_hour
      FROM parking_bookings b
      JOIN parking_lots p ON b.lot_id = p.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT 20
    `, [userId]);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.post('/book', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { lotId, startTime, endTime } = req.body;
    const userId = req.user!.id;

    if (!lotId || !startTime || !endTime) {
      return res.status(400).json({ error: 'lotId, startTime, and endTime are required' });
    }

    // Attempt to reserve slot locally
    const booking = await bookSlot(userId, lotId, new Date(startTime), new Date(endTime));

    // Get pricing from lot
    const lot = await db.one('SELECT price_per_hour, name FROM parking_lots WHERE id = $1', [lotId]);
    
    // Calculate rough cost based on hours
    const hours = Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60));
    const amount = hours * parseFloat(lot.price_per_hour);

    // Generate QR code for immediate return (though status is still 'pending')
    const qrCodeUrl = await generateBookingQR(booking.id, userId, lotId);

    // Try Stripe payment intent — gracefully fall back if not configured
    let clientSecret: string | null = null;
    try {
      const paymentIntent = await createPaymentIntent(amount, booking.id);
      clientSecret = paymentIntent.client_secret;
      // Update booking with stripe payment intent ID and QR
      await db.none('UPDATE parking_bookings SET stripe_payment_id = $1, qr_code = $2 WHERE id = $3', [
        paymentIntent.id, qrCodeUrl, booking.id
      ]);
    } catch (stripeError) {
      console.warn('Stripe not configured, storing QR only:', stripeError);
      await db.none('UPDATE parking_bookings SET qr_code = $1 WHERE id = $2', [qrCodeUrl, booking.id]);
    }

    res.json({
      bookingId: booking.id,
      clientSecret,
      qrCodeUrl,
      amount,
      slotNumber: booking.slot_number,
      lotName: lot.name,
      status: 'pending_payment'
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to book slot' });
  }
});

// POST /parking/confirm-payment — demo mode confirm (no real Stripe required)
// Marks booking as confirmed and returns the QR code
router.post('/confirm-payment', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user!.id;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    // Fetch the booking to verify ownership and get QR
    const booking = await db.oneOrNone(`
      SELECT b.id, b.qr_code, b.slot_number, b.status, p.name AS lot_name
      FROM parking_bookings b
      JOIN parking_lots p ON b.lot_id = p.id
      WHERE b.id = $1 AND b.user_id = $2
    `, [bookingId, userId]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    // Confirm the booking
    await db.none("UPDATE parking_bookings SET status = 'confirmed' WHERE id = $1", [bookingId]);

    // If no QR yet (edge case), generate one
    let qrCodeUrl = booking.qr_code;
    if (!qrCodeUrl) {
      qrCodeUrl = await generateBookingQR(bookingId, userId, booking.lot_id);
      await db.none('UPDATE parking_bookings SET qr_code = $1 WHERE id = $2', [qrCodeUrl, bookingId]);
    }

    res.json({
      bookingId,
      qrCodeUrl,
      slotNumber: booking.slot_number,
      lotName: booking.lot_name,
      status: 'confirmed'
    });
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm payment' });
  }
});

export default router;
