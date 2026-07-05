import request from 'supertest';
import express from 'express';

// Setup a minimal express app for testing the health route
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));

describe('API Endpoints', () => {
  it('should return 200 OK from /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
