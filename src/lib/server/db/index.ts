import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import * as schema from './schema';

mkdirSync('data', { recursive: true });

const sqlite = new Database('data/typing.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
