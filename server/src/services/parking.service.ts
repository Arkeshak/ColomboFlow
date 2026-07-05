import { db, redis } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const getNearbyParking = async (lat: number, lon: number, radiusInMeters: number = 1000, preferCovered: boolean = false) => {
  // PostGIS spatial query
  return await db.any(`
    SELECT id, name, total_slots, available_slots, price_per_hour, is_covered, has_ev, ev_total, ev_available,
      ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon,
      ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance
    FROM parking_lots
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326), $3)
    ORDER BY ${preferCovered ? 'is_covered DESC, ' : ''}distance ASC
  `, [lon, lat, radiusInMeters]); // PostGIS uses Lon, Lat
};

export const getLotAvailability = async (lotId: string) => {
  // Check Redis cache first
  const cached = await redis.get(`parking_slots:${lotId}`);
  if (cached) {
    return { lotId, available_slots: parseInt(cached, 10) };
  }

  // Fallback to DB
  const lot = await db.oneOrNone('SELECT available_slots FROM parking_lots WHERE id = $1', [lotId]);
  if (!lot) throw new Error('Parking lot not found');

  // Set to Redis with an expiry
  await redis.set(`parking_slots:${lotId}`, lot.available_slots, { EX: 60 });
  return { lotId, available_slots: lot.available_slots };
};

export const bookSlot = async (userId: string, lotId: string, startTime: Date, endTime: Date) => {
  // Check availability
  const { available_slots } = await getLotAvailability(lotId);
  if (available_slots <= 0) {
    throw new Error('No available slots');
  }

  // Decrement slots locally in DB & Redis (simplified transaction logic)
  await db.none('UPDATE parking_lots SET available_slots = available_slots - 1 WHERE id = $1', [lotId]);
  await redis.decr(`parking_slots:${lotId}`);

  // Create booking
  const booking = await db.one(`
    INSERT INTO parking_bookings (user_id, lot_id, slot_number, start_time, end_time, status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
    RETURNING *
  `, [userId, lotId, Math.floor(Math.random() * 100) + 1, startTime, endTime]);

  return booking;
};
