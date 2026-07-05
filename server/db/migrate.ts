import { db, tsdb } from '../src/db';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  console.log('Running migrations...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Remove timescaledb specific things for postgres
  const pgSql = schemaSql
    .replace('CREATE EXTENSION IF NOT EXISTS timescaledb;', '')
    .replace(/SELECT create_hypertable.*/, '');

  // Fix timescaledb syntax
  const tsSql = schemaSql.replace("by_range('time')", "'time'");

  try {
    console.log('Migrating PostgreSQL database...');
    await db.none(pgSql);
    console.log('PostgreSQL migration completed.');
  } catch (err) {
    console.error('Error migrating PostgreSQL:', err);
  }

  try {
    console.log('Migrating TimescaleDB database...');
    await tsdb.none(tsSql);
    console.log('TimescaleDB migration completed.');
  } catch (err) {
    console.error('Error migrating TimescaleDB:', err);
  }

  process.exit(0);
}

migrate();
