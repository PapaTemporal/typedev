import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '$lib/server/db';

migrate(db, { migrationsFolder: 'drizzle' });
