import pgPromise from 'pg-promise';
import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

const pgp = pgPromise();

const pgConnectionString = process.env.DATABASE_URL || 'postgres://postgres:colombo123@localhost:5432/colomboflow';
const tsConnectionString = process.env.TIMESCALEDB_URL || 'postgres://postgres:colombo123@localhost:5433/colombo_ts';

export const db = pgp(pgConnectionString);
export const tsdb = pgp(tsConnectionString);

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect().catch(console.error);

export default { db, tsdb, pgp, redis };
