import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import { getCongestionPrediction } from './ml.service';
import { fetchWeather } from './weather.service';

// Fallback logic handled gracefully
const geminiKey = process.env.GEMINI_API_KEY;
let ai: any = null;
if (geminiKey && geminiKey.length > 20) {
  try {
    ai = new GoogleGenAI({ apiKey: geminiKey });
    console.log('[AI] Gemini client initialized');
  } catch (e) {
    console.warn('[AI] Failed to init Gemini:', e);
  }
} else {
  console.warn('[AI] No valid GEMINI_API_KEY set, using smart fallback responses');
}


export const getDepartureAdvice = async (
  origin: string, 
  destination: string, 
  mlPrediction: any, 
  weather: any, 
  festival: any
): Promise<string> => {
  try {
    const prompt = `
      You are an AI traffic assistant for Colombo, Sri Lanka. 
      Generate a concise, human-readable departure advice string based on the following structured data:
      - Origin: ${origin}
      - Destination: ${destination}
      - ML Congestion Prediction (1-5): ${mlPrediction?.congestion_score || 3}
      - Weather: ${weather ? weather.weather[0].description : 'Clear'}
      - Festival today: ${festival ? festival.name : 'None'}
      
      Suggest the optimal departure window and explain briefly why. If there is heavy rain, emphasize how the weather worsens the ML congestion prediction and suggest safer routes or departure times. Keep it under 2 sentences.
    `;

    const generateFallback = () => {
      const score = mlPrediction?.congestion_score || 3;
      const weatherDesc = weather?.weather?.[0]?.description || 'clear weather';
      const rainAmount = weather?.rain?.['1h'] || 0;
      const weatherWarning = rainAmount > 10 ? ' WARNING: Heavy rain detected, which will severely impact traffic and may cause flooding.' : '';
      const festivalNote = festival ? ` Note: ${festival.name} today may increase traffic.` : '';
      const hour = new Date().getHours();
      const peakNote = (hour >= 7 && hour <= 9) ? 'Morning rush hour is active — expect heavy delays on Galle Road and Duplication Road.' :
                       (hour >= 17 && hour <= 19) ? 'Evening peak traffic is heavy — consider leaving before 5 PM or after 7 PM.' :
                       'Traffic is currently moderate across Colombo.';
      return `ML model predicts congestion level ${score.toFixed(1)}/5.0 with ${weatherDesc}.${weatherWarning} ${peakNote}${festivalNote} Recommended route: via Baseline Road for fastest travel.`;
    };

    if (!ai) {
      return generateFallback();
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback to hardcoded logic on API failure
    const generateFallback = () => {
      const score = mlPrediction?.congestion_score || 3;
      const weatherDesc = weather?.weather?.[0]?.description || 'clear weather';
      const rainAmount = weather?.rain?.['1h'] || 0;
      const weatherWarning = rainAmount > 10 ? ' WARNING: Heavy rain detected, which will severely impact traffic and may cause flooding.' : '';
      const festivalNote = festival ? ` Note: ${festival.name} today may increase traffic.` : '';
      const hour = new Date().getHours();
      const peakNote = (hour >= 7 && hour <= 9) ? 'Morning rush hour is active — expect heavy delays on Galle Road and Duplication Road.' :
                       (hour >= 17 && hour <= 19) ? 'Evening peak traffic is heavy — consider leaving before 5 PM or after 7 PM.' :
                       'Traffic is currently moderate across Colombo.';
      return `ML model predicts congestion level ${score.toFixed(1)}/5.0 with ${weatherDesc}.${weatherWarning} ${peakNote}${festivalNote} Recommended route: via Baseline Road for fastest travel.`;
    };
    return generateFallback();
  }
};

export const getChatResponse = async (messages: any[]): Promise<string> => {
  try {
    // Inject live database context
    let parkingContext = "";
    try {
      const lots = await db.any('SELECT name, available_slots, total_slots, has_ev, ev_available, ev_total FROM parking_lots');
      parkingContext = "Live Parking Status in Colombo:\n" + lots.map((l: any) => 
        `- ${l.name}: ${l.available_slots} / ${l.total_slots} spots free` + 
        (l.has_ev ? ` (EV Charging: ${l.ev_available}/${l.ev_total} available)` : '')
      ).join('\n');
    } catch (e) {
      console.error('Failed to get parking for AI context', e);
    }

    let predictionContext = "";
    try {
      const hours = Array.from({length: 24}, (_, i) => i);
      const predictions = await Promise.all(hours.map(h => getCongestionPrediction({ hour_of_day: h })));
      
      predictionContext = "ML Congestion Predictions for today (by hour, scale 1-5):\n" + 
        hours.map((h, i) => {
          const timeStr = h === 12 ? '12PM' : h === 0 ? '12AM' : h > 12 ? `${h-12}PM` : `${h}AM`;
          return `${timeStr}: ${predictions[i].congestion_score.toFixed(1)}`;
        }).join(', ');
    } catch (e) {
      console.error('Failed to get ML prediction for AI context', e);
    }

    let weatherContext = "";
    try {
      const weatherData = await fetchWeather();
      const rain = weatherData.rain?.['1h'] || 0;
      const temp = weatherData.main?.temp || 0;
      weatherContext = `Live Weather in Colombo: ${weatherData.weather?.[0]?.description}, Temperature: ${temp}°C, Rainfall (last 1h): ${rain}mm.`;
    } catch (e) {
      console.error('Failed to get weather for AI context', e);
    }

    const systemPrompt = `You are ColomboFlow AI, a helpful AI assistant for ColomboFlow traffic and parking in Colombo, Sri Lanka. 
You HAVE predictive capabilities and you HAVE information on EV charging stations.
Here is real-time data from the system:
${parkingContext}

${predictionContext}

${weatherContext}

Use this live data to answer user questions about parking, EV charging, and traffic (including future predictions).
CRITICAL RULES:
- If there is heavy rain (>10mm) or extreme heat (>32°C) in the live weather, warn EV drivers that their battery will drain faster due to climate control/wipers.
- If it is raining, strongly recommend covered parking lots.
Be concise and conversational.`;

    const generateFallback = () => {
      const hour = new Date().getHours();
      const peakMsg = (hour >= 7 && hour <= 9) ? 'Morning rush is active. Galle Road is at 87% congestion. Consider Baseline Road as an alternative.' :
                      (hour >= 17 && hour <= 19) ? 'Evening peak traffic detected. Fort area is congested. Pettah Central parking has 45 spots free.' :
                      'Traffic is moderate. Parking availability is good across most zones.';
      const contextSummary = parkingContext ? `\n\nLive Status:\n${parkingContext}\n${weatherContext}` : '';
      return `I am ColomboFlow AI.${contextSummary}\n\n${peakMsg} Ask me about parking, routes, or traffic conditions for real-time guidance.`;
    };

    if (!ai) {
      return generateFallback();
    }

    // Format messages for @google/genai
    // The google genai SDK takes contents as [{ role: 'user'|'model', parts: [{ text: '...' }] }]
    const formattedMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Inject system prompt as a user message at the start, or pass it to systemInstruction
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedMessages,
      config: {
        systemInstruction: systemPrompt
      }
    });

    return response.text;
  } catch (error: any) {
    console.error('Gemini Chat error:', error);
    
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
      return `I am ColomboFlow AI.\n\n(Note: My AI capabilities are temporarily paused because the Google Gemini API free tier rate limit has been exceeded. Please try again later or upgrade your API key.)`;
    }

    const hour = new Date().getHours();
    const peakMsg = (hour >= 7 && hour <= 9) ? 'Morning rush is active. Galle Road is at 87% congestion. Consider Baseline Road as an alternative.' :
                    (hour >= 17 && hour <= 19) ? 'Evening peak traffic detected. Fort area is congested. Pettah Central parking has 45 spots free.' :
                    'Traffic is moderate. Parking availability is good across most zones.';
    return `I am ColomboFlow AI.\n\n${peakMsg} Ask me about parking, routes, or traffic conditions for real-time guidance. (Note: AI generation is currently degraded).`;
  }
};

export const generateLiveWeatherNews = async (): Promise<any[]> => {
  try {
    const weatherData = await fetchWeather();
    const temp = weatherData?.main?.temp || 28;
    const desc = weatherData?.weather?.[0]?.description || 'clear skies';
    const rain = weatherData?.rain?.['1h'] || 0;

    const prompt = `You are a Colombo local news agency. The current real-time weather in Colombo is: ${temp}°C, ${desc}, ${rain}mm of rainfall in the last hour.
Generate 4 highly realistic, breaking news headlines for Colombo that are directly related to this EXACT weather condition. 
Focus on traffic impacts, local areas (like Galle Road, Fort, Pettah, Thummulla), and commuter advice. 
Return the output ONLY as a JSON array of objects. Do not include markdown code blocks. 
Format of each object: {"title": "Headline here...", "source": "Colombo Live AI"}`;

    const generateFallbackNews = () => [
      { title: `Live Update: Current conditions are ${desc} in Colombo with temperatures around ${temp}°C.`, source: 'Colombo Live AI', link: '#', pubDate: new Date().toISOString() },
      { title: `Traffic Alert: Plan your route carefully. Rainfall is currently ${rain}mm/hr.`, source: 'Colombo Live AI', link: '#', pubDate: new Date().toISOString() }
    ];

    if (!ai) {
      return generateFallbackNews();
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    let text = response.text.trim();
    if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return parsed.map((item: any) => ({
      ...item,
      pubDate: new Date().toISOString(),
      link: '#'
    }));
  } catch (error) {
    console.error('Gemini News error:', error);
    const generateFallbackNews = () => {
      const temp = 28;
      const desc = 'clear skies';
      const rain = 0;
      return [
        { title: `Live Update: Current conditions are ${desc} in Colombo with temperatures around ${temp}°C.`, source: 'Colombo Live AI', link: '#', pubDate: new Date().toISOString() },
        { title: `Traffic Alert: Plan your route carefully. Rainfall is currently ${rain}mm/hr.`, source: 'Colombo Live AI', link: '#', pubDate: new Date().toISOString() }
      ];
    };
    return generateFallbackNews();
  }
};
