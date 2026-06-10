import { migrateAllProductSkus } from '@/server/products/skuMigrationRepository';
import { createJson } from '../../_lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);
    const force = body?.force !== false;
    const { totals, byCollection } = await migrateAllProductSkus({
      dryRun,
      force,
    });

    return createJson({
      success: true,
      dryRun,
      force,
      totals,
      byCollection,
    });
  } catch (error) {
    console.error('migrate-product-skus:', error);
    return createJson(
      { success: false, error: error?.message || 'Loi migrate SKU' },
      { status: 500 }
    );
  }
}
