import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface TrafficReading {
  road_segment_id: string;
  speed_kmh: number;
  congestion_level: number; // 1 to 5
  incident_type: string | null;
  source: string;
  geom: string; // WKT representation
}

// Mock Waze Public Feed URL for Colombo
// Real one requires an authorized partner link
const WAZE_FEED_URL = process.env.WAZE_FEED_URL || 'https://www.waze.com/live-map/api/georss';

const mockRoadSegments = [
  { id: uuidv4(), geom: 'LINESTRING(79.851 6.927, 79.855 6.929)' }, // Galle Road segment
  { id: uuidv4(), geom: 'LINESTRING(79.860 6.915, 79.865 6.920)' }, // Duplication Road
  { id: uuidv4(), geom: 'LINESTRING(79.870 6.930, 79.875 6.935)' }, // Parliament Road
  { id: uuidv4(), geom: 'LINESTRING(79.850 6.900, 79.855 6.905)' }, // Wellawatte
  { id: uuidv4(), geom: 'LINESTRING(79.880 6.940, 79.885 6.945)' }, // Baseline Road
];

export const fetchLiveTraffic = async (): Promise<TrafficReading[]> => {
  try {
    // Attempt to fetch from real API if provided, else use mock
    // Note: public api/georss might be blocked by Waze for automated scraping
    // Implementing a fallback mock data generator here for the assignment
    
    // In a real scenario:
    // const response = await axios.get(WAZE_FEED_URL);
    // parse response...
    
    throw new Error('Using mock fallback for Waze feed');
  } catch (error) {
    console.log('Generating mock traffic data for Colombo');
    return mockRoadSegments.map(segment => {
      // Generate somewhat random but realistic data
      const isCongested = Math.random() > 0.6;
      const speed = isCongested ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 40) + 30;
      const level = isCongested ? (speed < 10 ? 5 : 4) : (speed > 50 ? 1 : 2);
      const incident = level >= 4 && Math.random() > 0.8 ? 'jam' : null;

      return {
        road_segment_id: segment.id,
        speed_kmh: speed,
        congestion_level: level,
        incident_type: incident,
        source: 'waze_mock',
        geom: segment.geom
      };
    });
  }
};
