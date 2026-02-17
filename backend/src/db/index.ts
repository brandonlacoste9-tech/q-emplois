/**
 * Drizzle + Neon connection
 * Project: red ocean
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required. Set it in .env');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
