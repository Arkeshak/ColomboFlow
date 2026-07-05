import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000';

export interface MLPredictionRequest {
  hour_of_day?: number;
  day_of_week?: number;
  is_poya_day?: number;
  rainfall_mm?: number;
  road_segment_id?: number;
}

export interface MLPredictionResponse {
  congestion_score: number;
  confidence: number;
}

export const getCongestionPrediction = async (data: MLPredictionRequest): Promise<MLPredictionResponse> => {
  try {
    const response = await axios.post(`${ML_API_URL}/predict`, data);
    return response.data;
  } catch (error) {
    console.error('ML API Error:', error);
    // Fallback if ML service is down
    return {
      congestion_score: 3.0,
      confidence: 0.5
    };
  }
};
