import { PRODUCT_COLLECTION_NAMES } from '../../constants/index.js';
import { readCollection } from '../storage/collectionStore.js';
import { listAdminProducts, upsertAdminProduct } from './adminProductRepository.js';
import {
  SKU_SEGMENT_CODES_COLLECTION,
  applySkuToVariants,
  normalizeSkuSegmentMaps,
} from '../../utils/sku.build.js';

function mapSize(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value).length
    : 0;
}

function hasSkuMaps(maps) {
  return (
    mapSize(maps.brands) > 0 ||
    mapSize(maps.loaiSp) > 0 ||
    mapSize(maps.colors) > 0 ||
    mapSize(maps.conditions) > 0 ||
    mapSize(maps.productNames) > 0
  );
}

function variantsSkuTally(variants) {
  if (!Array.isArray(variants)) return '';
  return variants.map((variant) => String(variant?.sku ?? '')).join('\u0001');
}

function buildSyntheticVariant(product) {
  const color = Array.isArray(product.colors) ? product.colors[0] : product.color;
  const condition = Array.isArray(product.condition) ? product.condition[0] : product.condition;
  return {
    id: `variant-sku-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name: product.name || 'Mặc định',
    color: color || '',
    condition: condition || '',
    priceDefault: Number(product.priceDefault) || 0,
    priceForSale: Number(product.priceForSale) || 0,
    salePercent: Number(product.salePercent) || 0,
    inventory: 0,
    images: Array.isArray(product.images) ? product.images : [],
    sku: '',
  };
}

async function migrateProduct(product, skuMaps, { dryRun, force }) {
  let variants = Array.isArray(product.variants) ? product.variants : [];
  let synthetic = false;

  if (variants.length === 0) {
    variants = [buildSyntheticVariant(product)];
    synthetic = true;
  }

  const before = variantsSkuTally(variants);
  const nextVariants = applySkuToVariants(
    variants,
    {
      collectionCode: product.collection,
      categoryLabel: product.category || '',
      brand: product.brand || '',
      productName: product.name || '',
      loaiSpLabel: product.loaiSp || '',
    },
    skuMaps
  );
  const after = variantsSkuTally(nextVariants);
  const changed = synthetic || before !== after;

  if (!changed) {
    return { changed: false, synthetic };
  }

  if (!dryRun) {
    await upsertAdminProduct({
      ...product,
      variants: nextVariants,
    });
  }

  return { changed: true, synthetic };
}

export async function migrateAllProductSkus(options = {}) {
  const dryRun = Boolean(options.dryRun);
  const force = options.force !== false;
  const skuMaps = normalizeSkuSegmentMaps(await readCollection(SKU_SEGMENT_CODES_COLLECTION));

  if (!hasSkuMaps(skuMaps)) {
    throw new Error('Chưa có cấu hình SKU trên server.');
  }

  const totals = {
    products: 0,
    updated: 0,
    synthetic: 0,
    unchanged: 0,
    bad: 0,
  };
  const byCollection = {};

  for (const collection of PRODUCT_COLLECTION_NAMES) {
    const result = await listAdminProducts(new URLSearchParams({ collection }));
    const products = Array.isArray(result.items) ? result.items : [];
    const row = { products: products.length, updated: 0, synthetic: 0, unchanged: 0, bad: 0 };

    for (const product of products) {
      totals.products += 1;
      try {
        const migrated = await migrateProduct(product, skuMaps, { dryRun, force });
        if (migrated.synthetic) {
          totals.synthetic += 1;
          row.synthetic += 1;
        }
        if (migrated.changed || force) {
          if (migrated.changed) {
            totals.updated += 1;
            row.updated += 1;
          } else {
            totals.unchanged += 1;
            row.unchanged += 1;
          }
        } else {
          totals.unchanged += 1;
          row.unchanged += 1;
        }
      } catch {
        totals.bad += 1;
        row.bad += 1;
      }
    }

    byCollection[collection] = row;
  }

  return { totals, byCollection, dryRun, force };
}
