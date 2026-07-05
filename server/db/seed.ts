import { db } from '../src/db';

async function seedParkingLots() {
  console.log('Seeding fallback parking lots...');
  try {
    const mockLots = [
      { name: "Fort City Parking", lat: 6.9338, lon: 79.8436, total: 100, available: 24, price: 80, covered: true, has_ev: false, ev_total: 0, ev_available: 0 },
      { name: "Galle Face Centre", lat: 6.9242, lon: 79.8453, total: 200, available: 45, price: 100, covered: true, has_ev: true, ev_total: 10, ev_available: 4 },
      { name: "Liberty Plaza", lat: 6.9085, lon: 79.8510, total: 150, available: 12, price: 120, covered: false, has_ev: true, ev_total: 5, ev_available: 2 },
      { name: "WTC Basement", lat: 6.9329, lon: 79.8441, total: 300, available: 89, price: 150, covered: true, has_ev: false, ev_total: 0, ev_available: 0 },
    ];

    let count = 0;
    for (const lot of mockLots) {
      await db.none(`
        INSERT INTO parking_lots 
        (name, location, total_slots, available_slots, price_per_hour, is_covered, has_ev, ev_total, ev_available) 
        VALUES 
        ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8, $9, $10)
      `, [lot.name, lot.lon, lot.lat, lot.total, lot.available, lot.price, lot.covered, lot.has_ev, lot.ev_total, lot.ev_available]);
      count++;
    }

    console.log(`Seeded ${count} fallback parking lots successfully!`);
  } catch (error) {
    console.error('Error seeding parking lots:', error);
  } finally {
    process.exit(0);
  }
}

seedParkingLots();
