import { db } from '../db';
import { Server } from 'socket.io';

export const getActiveIncidents = async () => {
  // Fetch incidents created within the last 2 hours
  return await db.any(`
    SELECT id, type, status, created_at,
      ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon
    FROM incidents
    WHERE status = 'active' AND created_at > NOW() - INTERVAL '2 hours'
  `);
};

export const reportIncident = async (type: string, lat: number, lon: number, io: Server) => {
  const incident = await db.one(`
    INSERT INTO incidents (type, location, status)
    VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), 'active')
    RETURNING id, type, status, created_at, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon
  `, [type, lon, lat]);

  // Broadcast to all connected clients
  io.emit('new_incident', incident);

  return incident;
};
