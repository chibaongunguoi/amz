import { BESTSELLER_VALUES, FILTER_VALUES, SORT_KEYS, STOREFRONT_PRODUCT_COLLECTIONS } from '../../constants/index.js';
import { isPostgresEnabled, query } from '../db/postgres.js';
import { readCollection } from '../storage/collectionStore.js';
import { ensurePostgresSchema } from '../storage/postgresCollections.js';
import { parseStorefrontPipeRecord } from '../../utils/product.utils.js';

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 24;

function normalizeLimit(value) {
  const limit = Number.parseInt(value, 10);
  if (!Number.isFinite(limit) || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

function normalizeOffset(value) {
  const offset = Number.parseInt(value, 10);
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return offset;
}

function parseCsv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProductArgs(searchParams = new URLSearchParams()) {
  const category = searchParams.get('category');
  const collection = searchParams.get('collection');
  const q = searchParams.get('q');
  return {
    limit: normalizeLimit(searchParams.get('limit')),
    offset: normalizeOffset(searchParams.get('offset')),
    sort: searchParams.get('sort') || SORT_KEYS.BESTSELLER,
    category: category && category !== FILTER_VALUES.ALL_PRODUCTS ? category : '',
    collection: collection && STOREFRONT_PRODUCT_COLLECTIONS.includes(collection) ? collection : '',
    brands: parseCsv(searchParams.get('brands')),
    q: q ? q.trim() : '',
  };
}

function parseRawItems(rawItems, collectionCode) {
  if (!Array.isArray(rawItems)) return [];

  const products = [];
  for (const item of rawItems) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    for (const [id, value] of Object.entries(item)) {
      if (id === FILTER_VALUES.RESERVED_ID) continue;
      const product = parseStorefrontPipeRecord(value, collectionCode);
      if (product) products.push({ ...product, id });
    }
  }
  return products;
}

function productMatches(product, args) {
  if (args.collection && product.collection !== args.collection) return false;
  if (args.category && product.category !== args.category) return false;
  if (args.brands.length > 0 && !args.brands.includes(product.brand)) return false;
  if (args.q) {
    const haystack = [product.name, product.brand, product.category, product.sku]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(args.q.toLowerCase())) return false;
  }
  return true;
}

function sortProducts(products, sort) {
  const next = [...products];
  if (sort === SORT_KEYS.ASC) {
    next.sort((a, b) => Number(a.priceForSale) - Number(b.priceForSale));
  } else if (sort === SORT_KEYS.DESC) {
    next.sort((a, b) => Number(b.priceForSale) - Number(a.priceForSale));
  } else if (sort === SORT_KEYS.HOTDEAL) {
    next.sort((a, b) => (Number(b.salePercent) || 0) - (Number(a.salePercent) || 0));
  } else {
    next.sort((a, b) => {
      const aBest = a.isBestSeller === BESTSELLER_VALUES.YES || a.isBestSeller === true;
      const bBest = b.isBestSeller === BESTSELLER_VALUES.YES || b.isBestSeller === true;
      if (aBest && !bBest) return -1;
      if (!aBest && bBest) return 1;
      return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
    });
  }
  return next;
}

async function listJsonProducts(args) {
  const collections = args.collection ? [args.collection] : STOREFRONT_PRODUCT_COLLECTIONS;
  const allProducts = [];

  for (const collectionName of collections) {
    const rawItems = await readCollection(collectionName);
    allProducts.push(...parseRawItems(rawItems, collectionName));
  }

  const filtered = sortProducts(allProducts.filter((product) => productMatches(product, args)), args.sort);
  return {
    backend: 'json',
    total: filtered.length,
    limit: args.limit,
    offset: args.offset,
    items: filtered.slice(args.offset, args.offset + args.limit),
  };
}

function buildPostgresOrder(sort) {
  if (sort === SORT_KEYS.ASC) return 'display_price_for_sale ASC NULLS LAST, name ASC NULLS LAST';
  if (sort === SORT_KEYS.DESC) return 'display_price_for_sale DESC NULLS LAST, name ASC NULLS LAST';
  if (sort === SORT_KEYS.HOTDEAL) return 'sale_percent DESC NULLS LAST, name ASC NULLS LAST';
  return 'is_best_seller DESC, name ASC NULLS LAST';
}

async function listPostgresProducts(args) {
  await ensurePostgresSchema();

  const where = ['collection = ANY($1::text[])'];
  const values = [args.collection ? [args.collection] : STOREFRONT_PRODUCT_COLLECTIONS];

  if (args.category) {
    values.push(args.category);
    where.push(`category = $${values.length}`);
  }

  if (args.brands.length > 0) {
    values.push(args.brands);
    where.push(`brand = ANY($${values.length}::text[])`);
  }

  if (args.q) {
    values.push(`%${args.q}%`);
    where.push(`
      (
        name ILIKE $${values.length}
        OR brand ILIKE $${values.length}
        OR sku ILIKE $${values.length}
        OR ma_san_pham ILIKE $${values.length}
        OR EXISTS (
          SELECT 1
          FROM product_variants pv
          WHERE pv.product_id = products.id
            AND (
              pv.sku ILIKE $${values.length}
              OR pv.name ILIKE $${values.length}
              OR pv.color ILIKE $${values.length}
              OR pv.condition_label ILIKE $${values.length}
            )
        )
      )
    `);
  }

  values.push(args.limit);
  const limitIndex = values.length;
  values.push(args.offset);
  const offsetIndex = values.length;

  const result = await query(
    `
      SELECT
        products.*,
        COALESCE(
          (
            SELECT MIN(pv.price_for_sale)
            FROM product_variants pv
            WHERE pv.product_id = products.id
              AND pv.inventory > 0
              AND pv.price_for_sale > 0
          ),
          (
            SELECT MIN(pv.price_for_sale)
            FROM product_variants pv
            WHERE pv.product_id = products.id
              AND pv.price_for_sale > 0
          ),
          products.price_for_sale
        ) AS display_price_for_sale,
        COALESCE(
          (
            SELECT jsonb_agg(pi.url ORDER BY pi.sort_order)
            FROM product_images pi
            WHERE pi.product_id = products.id
          ),
          '[]'::jsonb
        ) AS normalized_images,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', pv.variant_id,
                'sku', pv.sku,
                'name', pv.name,
                'color', pv.color,
                'condition', pv.condition_label,
                'priceForSale', pv.price_for_sale,
                'priceDefault', pv.price_default,
                'salePercent', pv.sale_percent,
                'inventory', pv.inventory,
                'images', COALESCE(
                  (
                    SELECT jsonb_agg(pvi.url ORDER BY pvi.sort_order)
                    FROM product_variant_images pvi
                    WHERE pvi.product_id = pv.product_id
                      AND pvi.variant_key = pv.variant_key
                  ),
                  '[]'::jsonb
                )
              )
              ORDER BY pv.sort_order
            )
            FROM product_variants pv
            WHERE pv.product_id = products.id
          ),
          '[]'::jsonb
        ) AS normalized_variants,
        COUNT(*) OVER()::int AS total
      FROM products
      WHERE ${where.join(' AND ')}
      ORDER BY ${buildPostgresOrder(args.sort)}
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `,
    values
  );

  return {
    backend: 'postgres',
    total: result.rows[0]?.total || 0,
    limit: args.limit,
    offset: args.offset,
    items: result.rows.map(mapNormalizedProductRow),
  };
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function mapNormalizedVariant(variant = {}) {
  return {
    id: variant.id || '',
    sku: variant.sku || '',
    name: variant.name || '',
    color: variant.color || '',
    condition: variant.condition || '',
    priceForSale: numberValue(variant.priceForSale),
    priceDefault: numberValue(variant.priceDefault),
    salePercent: numberValue(variant.salePercent),
    inventory: numberValue(variant.inventory),
    images: arrayValue(variant.images),
  };
}

function getDisplayVariant(variants = []) {
  const pricedVariants = variants
    .filter((variant) => numberValue(variant.priceForSale) > 0)
    .sort((a, b) => numberValue(a.priceForSale) - numberValue(b.priceForSale));
  return (
    pricedVariants.find((variant) => numberValue(variant.inventory) > 0) ||
    pricedVariants[0] ||
    variants[0] ||
    null
  );
}

function mapNormalizedProductRow(row) {
  const images = arrayValue(row.normalized_images);
  const variants = arrayValue(row.normalized_variants).map(mapNormalizedVariant);
  const displayVariant = getDisplayVariant(variants);
  const hasVariants = variants.length > 0;
  const primaryColor = hasVariants ? '' : (row.primary_color || '');
  const condition = hasVariants ? '' : (row.condition_label || '');
  const priceForSale = numberValue(
    displayVariant?.priceForSale ||
    row.display_price_for_sale ||
    row.price_for_sale
  );
  const priceDefault = numberValue(
    displayVariant?.priceDefault ||
    row.price_default
  );
  const salePercent = numberValue(
    displayVariant?.salePercent ||
    row.sale_percent
  );
  const isBestSeller = Boolean(row.is_best_seller);

  return {
    id: row.id,
    collection: row.collection,
    name: row.name || '',
    brand: row.brand || '',
    category: row.category || '',
    sku: row.sku || '',
    status: row.status || '',
    maSanPham: row.ma_san_pham || '',
    loaiSp: row.product_type || '',
    colors: hasVariants ? [] : (primaryColor ? [primaryColor] : []),
    color: primaryColor,
    condition: hasVariants ? [] : (condition ? [condition] : []),
    priceForSale,
    priceDefault,
    salePercent,
    isBestSeller: isBestSeller ? BESTSELLER_VALUES.YES : BESTSELLER_VALUES.NO,
    isbestSeller: isBestSeller,
    isHide: Boolean(row.is_hide),
    description: row.description || '',
    tableInfo: row.table_info || '',
    videoUrl: row.video_url || '',
    post: row.post_id || '',
    images,
    variants,
  };
}

export async function listProducts(searchParams) {
  const args = normalizeProductArgs(searchParams);
  if (!isPostgresEnabled()) return listJsonProducts(args);
  return listPostgresProducts(args);
}
