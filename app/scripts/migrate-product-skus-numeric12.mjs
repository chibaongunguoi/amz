/**
 * Gán lại SKU (A + 12 số Book1) cho mọi biến thể trong bảng SQL sản phẩm.
 *
 *   npm run migrate:skus
 *   npm run migrate:skus -- --dry-run
 *   npm run migrate:skus -- --force
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { migrateAllProductSkus } from '../src/server/products/skuMigrationRepository.js';

const root = process.cwd();
const DRY = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

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
  console.log(DRY ? 'Dry-run (không ghi SQL)' : 'Ghi trực tiếp vào bảng SQL sản phẩm');
  if (FORCE) console.log('Chế độ --force: kiểm tra lại toàn bộ biến thể.');

  const { totals, byCollection } = await migrateAllProductSkus({ dryRun: DRY, force: FORCE });

  for (const [collection, summary] of Object.entries(byCollection)) {
    if (summary.products > 0) {
      console.log(
        `${collection}: ${summary.updated} sản phẩm cập nhật, ${summary.synthetic} tạo biến thể mặc định, ${summary.unchanged} giữ nguyên, ${summary.bad} lỗi (${summary.products} sản phẩm)`
      );
    }
  }

  console.log('\nTổng:', totals);
  if (DRY && totals.updated > 0) {
    console.log('\nChạy lại không có --dry-run để ghi vào SQL.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
