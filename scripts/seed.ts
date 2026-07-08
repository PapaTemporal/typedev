import { seedAll } from '../src/lib/server/seed';

const results = await seedAll();
for (const r of results) {
	console.log(`seeded ${r.id} (${r.pageCount} pages)`);
}
console.log('Seed complete.');
