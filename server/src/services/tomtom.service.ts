import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { TrafficReading } from './waze.service';

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY || '';

// Central points for our tracked road segments in Colombo
const roadSegments = [
  { id: uuidv4(), lat: 6.928, lon: 79.853, geom: 'LINESTRING(79.851 6.927, 79.855 6.929)' }, // Galle Road
  { id: uuidv4(), lat: 6.917, lon: 79.862, geom: 'LINESTRING(79.860 6.915, 79.865 6.920)' }, // Duplication Road
  { id: uuidv4(), lat: 6.932, lon: 79.872, geom: 'LINESTRING(79.870 6.930, 79.875 6.935)' }, // Parliament Road
  { id: uuidv4(), lat: 6.902, lon: 79.852, geom: 'LINESTRING(79.850 6.900, 79.855 6.905)' }, // Wellawatte
  { id: uuidv4(), lat: 6.942, lon: 79.882, geom: 'LINESTRING(79.880 6.940, 79.885 6.945)' }, // Baseline Road
];

export const fetchTomTomTraffic = async (): Promise<TrafficReading[]> => {
  const readings: TrafficReading[] = [];
  const currentHour = new Date().getHours();
  
  // Base congestion on hour (peak hours = 7-9 and 17-19)
  const isMorningPeak = currentHour >= 7 && currentHour <= 9;
  const isEveningPeak = currentHour >= 17 && currentHour <= 19;
  const isPeak = isMorningPeak || isEveningPeak;

  for (const segment of roadSegments) {
    try {
      if (!TOMTOM_API_KEY) throw new Error('No TomTom API Key configured (fallback to mock)');
      
      const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${segment.lat},${segment.lon}&unit=KMPH&key=${TOMTOM_API_KEY}`;
      const response = await axios.get(url);
      const flow = response.data.flowSegmentData;

      const currentSpeed = flow.currentSpeed;
      const freeFlowSpeed = flow.freeFlowSpeed;
      
      const ratio = currentSpeed / (freeFlowSpeed || 1);
      let level = 1;
      if (ratio < 0.2) level = 5;
      else if (ratio < 0.4) level = 4;
      else if (ratio < 0.6) level = 3;
      else if (ratio < 0.8) level = 2;

      readings.push({
        road_segment_id: segment.id,
        speed_kmh: currentSpeed,
        congestion_level: level,
        incident_type: level >= 4 ? 'congestion' : null,
        source: 'tomtom',
        geom: segment.geom
      });
    } catch (error: any) {
      // Mock Data Generation
      // Introduce some random variance based on the segment ID to make it look "live"
      const variance = Math.random();
      const freeFlow = 60; // Assume 60 KMPH limit
      let mockLevel = isPeak ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1; // 4-5 in peak, 1-3 otherwise
      
      // Introduce occasional random congestion
      if (variance > 0.9) mockLevel = Math.min(5, mockLevel + 2);
      
      let speed = freeFlow;
      if (mockLevel === 5) speed = freeFlow * (0.1 + Math.random() * 0.1); // ~6-12 km/h
      else if (mockLevel === 4) speed = freeFlow * (0.2 + Math.random() * 0.2); // ~12-24 km/h
      else if (mockLevel === 3) speed = freeFlow * (0.4 + Math.random() * 0.2); // ~24-36 km/h
      else if (mockLevel === 2) speed = freeFlow * (0.6 + Math.random() * 0.2); // ~36-48 km/h
      else speed = freeFlow * (0.8 + Math.random() * 0.2); // ~48-60 km/h

      readings.push({
        road_segment_id: segment.id,
        speed_kmh: Math.round(speed),
        congestion_level: mockLevel,
        incident_type: mockLevel >= 4 ? 'congestion' : null,
        source: 'tomtom_mock',
        geom: segment.geom
      });
    }
  }

  return readings;
};
