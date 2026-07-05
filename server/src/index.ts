import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';

// Routes
// (Force nodemon restart)
import authRoutes from './routes/auth.routes';
import trafficRoutes from './routes/traffic.routes';
import weatherRoutes from './routes/weather.routes';
import parkingRoutes from './routes/parking.routes';
import stripeRoutes from './routes/stripe.routes';
import routeRoutes from './routes/route.routes';
import aiRoutes from './routes/ai.routes';
import incidentRoutes from './routes/incident.routes';
import insightsRoutes from './routes/insights.routes';

// Services
import { pollAndStoreTraffic } from './services/traffic.service';
import { loadHolidays } from './utils/festivals';

dotenv.config({ override: true });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});
app.set('io', io);

app.use(cors());
app.use(helmet());

// Stripe webhooks need raw body, mount before express.json()
app.use('/stripe', stripeRoutes);

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/traffic', trafficRoutes);
app.use('/weather', weatherRoutes);
app.use('/parking', parkingRoutes);
app.use('/route', routeRoutes);
app.use('/ai', aiRoutes);
app.use('/incidents', incidentRoutes);
app.use('/insights', insightsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Setup Cron Job for Traffic Polling every 60s
cron.schedule('* * * * *', () => {
  console.log('Running traffic polling cron job...');
  pollAndStoreTraffic(io);
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await loadHolidays(new Date().getFullYear());
});
