import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { DATA_COLLECTIONS } from '../src/server/data/collections.js';
import { query } from '../src/server/db/postgres.js';
import {
  ensurePostgresSchema,
  readPostgresCollection,
  writePostgresCollection,
} from '../src/server/storage/postgresCollections.js';

const root = process.cwd();

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, value] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

async function loadEnv() {
  for (const file of ['.env.local', '.env.production', '.env']) {
    await loadEnvFile(path.join(root, file));
  }
}

async function main() {
  await loadEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  await ensurePostgresSchema();

  const summary = [];
  for (const collection of DATA_COLLECTIONS) {
    const data = await readPostgresCollection(collection);
    if (data === null) continue;

    const projections = await writePostgresCollection(collection, data);
    summary.push({ collection, ...projections });
  }

  const counts = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM product_images) AS product_images,
      (SELECT COUNT(*)::int FROM product_variants) AS product_variants,
      (SELECT COUNT(*)::int FROM product_variant_images) AS product_variant_images,
      (SELECT COUNT(*)::int FROM posts) AS posts
  `);

  console.table(summary);
  console.log('Normalized counts:', counts.rows[0]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
