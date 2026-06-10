import { getStorageBackend } from '@/server/storage/collectionStore';
import { isPostgresEnabled, query } from '@/server/db/postgres';
import { ensurePostgresSchema } from '@/server/storage/postgresCollections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    ok: true,
    storage: getStorageBackend(),
    postgresEnabled: isPostgresEnabled(),
    database: null,
  };

  if (isPostgresEnabled()) {
    try {
      await ensurePostgresSchema();
      const result = await query(`
        SELECT
          (SELECT COUNT(DISTINCT collection)::int FROM collection_nodes) AS collections,
          (SELECT COUNT(*)::int FROM collection_nodes) AS collection_nodes,
          (SELECT COUNT(*)::int FROM products) AS products,
          (SELECT COUNT(*)::int FROM product_variants) AS product_variants,
          (SELECT COUNT(*)::int FROM product_images) AS product_images,
          (SELECT COUNT(*)::int FROM product_variant_images) AS product_variant_images,
          (SELECT COUNT(*)::int FROM posts) AS posts
      `);
      health.database = {
        connected: true,
        ...result.rows[0],
      };
    } catch (error) {
      health.ok = false;
      health.database = {
        connected: false,
        error: error?.message || 'PostgreSQL connection failed',
      };
    }
  }

  return Response.json(health, {
    status: health.ok ? 200 : 500,
    headers: { 'Cache-Control': 'no-store' },
  });
}
