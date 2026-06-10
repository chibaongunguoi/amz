import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { DATA_COLLECTIONS } from '../src/server/data/collections.js';
import {
  ensurePostgresSchema,
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

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    schemaOnly: args.has('--schema-only'),
    dataDir:
      process.argv.find((arg) => arg.startsWith('--data-dir='))?.slice('--data-dir='.length) ||
      path.join(root, 'public', 'data'),
  };
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  await loadEnv();
  const { schemaOnly, dataDir } = parseArgs();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Example: DATABASE_URL=postgresql://user:pass@host:5432/amz');
  }

  await ensurePostgresSchema();
  if (schemaOnly) {
    console.log('PostgreSQL schema is ready.');
    return;
  }

  const summary = [];
  for (const collection of DATA_COLLECTIONS) {
    const filePath = path.join(dataDir, `${collection}.json`);
    let data;

    try {
      data = await readJson(filePath);
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }

    const projections = await writePostgresCollection(collection, data);
    summary.push({
      collection,
      products: projections.products || 0,
      posts: projections.posts || 0,
      type: Array.isArray(data) ? `array(${data.length})` : typeof data,
    });
  }

  console.table(summary);
  console.log(`Migrated ${summary.length} collections to PostgreSQL.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
