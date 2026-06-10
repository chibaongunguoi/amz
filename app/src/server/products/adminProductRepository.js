import {
  BESTSELLER_VALUES,
  CATEGORY_TO_COLLECTION,
  COLLECTION_TO_CATEGORY,
  PRODUCT_COLLECTION_NAMES,
} from '../../constants/index.js';
import { getPool, query } from '../db/postgres.js';
import { ensurePostgresSchema } from '../storage/postgresCollections.js';

const ADMIN_PRODUCT_LIMIT = 5000;

function textOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function textValue(value, fallback = '') {
  const text = textOrNull(value);
  return text === null ? fallback : text;
}

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

function booleanValue(value) {
  return value === true || value === 'true' || value === '1' || value === 1;
}

function arrayOfText(value) {
  if (Array.isArray(value)) return value.map(textOrNull).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(';;')
      .flatMap((part) => part.split('\n'))
      .map(textOrNull)
      .filter(Boolean);
  }
  return [];
}

function firstText(value) {
  if (Array.isArray(value)) return textValue(value[0]);
  return textValue(value);
}

function getVariantKey(variant, index) {
  return textOrNull(variant?.id) || `idx-${index}`;
}

function newProductId() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function newVariantId(index) {
  return `variant-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeVariant(variant = {}, index = 0) {
  const id = textValue(variant.id, newVariantId(index));
  return {
    id,
    sku: textValue(variant.sku),
    name: textValue(variant.name),
    color: textValue(variant.color),
    condition: textValue(variant.condition ?? variant.condition_label),
    priceForSale: numberValue(variant.priceForSale ?? variant.price_for_sale),
    priceDefault: numberValue(variant.priceDefault ?? variant.price_default),
    salePercent: numberValue(variant.salePercent ?? variant.sale_percent),
    inventory: integerOrZero(variant.inventory),
    images: arrayOfText(variant.images),
  };
}

function derivePrices(product) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  let priceForSale = variants.length > 0 ? 0 : numberValue(product.priceForSale);
  let priceDefault = variants.length > 0 ? 0 : numberValue(product.priceDefault);
  let salePercent = variants.length > 0 ? 0 : numberValue(product.salePercent);
  const pricedVariants = variants
    .filter((variant) => numberValue(variant.priceForSale) > 0)
    .sort((a, b) => numberValue(a.priceForSale) - numberValue(b.priceForSale));
  const inStockVariant = pricedVariants.find((variant) => Number(variant.inventory) > 0);
  const variant = inStockVariant || pricedVariants[0] || variants[0];

  if (variant) {
    if (priceForSale <= 0) priceForSale = numberValue(variant.priceForSale);
    if (priceDefault <= 0) priceDefault = numberValue(variant.priceDefault);
    if (salePercent <= 0) salePercent = numberValue(variant.salePercent);
  }

  if (salePercent <= 0 && priceDefault > 0 && priceForSale > 0 && priceForSale < priceDefault) {
    salePercent = Math.round((1 - priceForSale / priceDefault) * 100);
  }

  return { priceForSale, priceDefault, salePercent };
}

export function normalizeSqlProductInput(input = {}, options = {}) {
  const raw = input && typeof input === 'object' ? input : {};
  const category = textValue(raw.category, COLLECTION_TO_CATEGORY[options.collection] || '');
  const collection =
    textValue(raw.collection) ||
    textValue(raw.collectionName) ||
    textValue(options.collection) ||
    CATEGORY_TO_COLLECTION[category] ||
    '';

  if (!collection || !PRODUCT_COLLECTION_NAMES.includes(collection)) {
    throw new Error('Danh mục sản phẩm không hợp lệ.');
  }

  const id = textValue(raw.id || raw.key || options.id, newProductId());
  const variants = Array.isArray(raw.variants)
    ? raw.variants.map((variant, index) => normalizeVariant(variant, index))
    : [];
  const images = arrayOfText(raw.images);
  const colors = variants.length > 0 ? [] : arrayOfText(raw.colors ?? raw.color);
  const condition = variants.length > 0 ? [] : arrayOfText(raw.condition ?? raw.condition_label);
  const isbestSeller =
    raw.isbestSeller === true ||
    raw.isBestSeller === BESTSELLER_VALUES.YES ||
    booleanValue(raw.is_best_seller);
  const prices = derivePrices({
    ...raw,
    variants,
  });
  return {
    id,
    collection,
    name: textValue(raw.name),
    brand: textValue(raw.brand),
    category: category || COLLECTION_TO_CATEGORY[collection] || '',
    sku: textValue(raw.sku),
    status: textValue(raw.status, 'active'),
    maSanPham: textValue(raw.maSanPham ?? raw.ma_san_pham),
    loaiSp: textValue(raw.loaiSp ?? raw.product_type),
    colors,
    color: colors[0] || '',
    condition,
    priceForSale: prices.priceForSale,
    priceDefault: prices.priceDefault,
    salePercent: prices.salePercent,
    isBestSeller: isbestSeller ? BESTSELLER_VALUES.YES : BESTSELLER_VALUES.NO,
    isbestSeller,
    isHide: booleanValue(raw.isHide),
    description: textValue(raw.description),
    tableInfo: textValue(raw.tableInfo ?? raw.table_info),
    videoUrl: textValue(raw.videoUrl ?? raw.video_url ?? raw.youtubeUrl),
    post: textValue(raw.post ?? raw.post_id),
    images,
    variants,
  };
}

function mapAdminVariant(variant = {}) {
  return normalizeVariant({
    id: variant.id,
    sku: variant.sku,
    name: variant.name,
    color: variant.color,
    condition: variant.condition,
    priceForSale: variant.priceForSale,
    priceDefault: variant.priceDefault,
    salePercent: variant.salePercent,
    inventory: variant.inventory,
    images: Array.isArray(variant.images) ? variant.images : [],
  });
}

function mapAdminProductRow(row) {
  const images = Array.isArray(row.normalized_images) ? row.normalized_images : [];
  const variants = Array.isArray(row.normalized_variants)
    ? row.normalized_variants.map(mapAdminVariant)
    : [];
  const colors = row.primary_color ? [row.primary_color] : [];
  const condition = row.condition_label ? [row.condition_label] : [];
  const isbestSeller = Boolean(row.is_best_seller);
  return {
    id: row.id,
    collection: row.collection,
    name: row.name || '',
    brand: row.brand || '',
    category: row.category || COLLECTION_TO_CATEGORY[row.collection] || '',
    sku: row.sku || '',
    status: row.status || 'active',
    maSanPham: row.ma_san_pham || '',
    loaiSp: row.product_type || '',
    colors,
    color: colors[0] || '',
    condition,
    priceForSale: numberValue(row.price_for_sale),
    priceDefault: numberValue(row.price_default),
    salePercent: numberValue(row.sale_percent),
    isBestSeller: isbestSeller ? BESTSELLER_VALUES.YES : BESTSELLER_VALUES.NO,
    isbestSeller,
    isHide:row.is_hide,
    description: row.description || '',
    tableInfo: row.table_info || '',
    videoUrl: row.video_url || '',
    post: row.post_id || '',
    images,
    variants,
    updatedAt: row.updated_at,
  };
}

async function selectProducts(whereSql, values, orderSql = 'collection ASC, name ASC NULLS LAST') {
  await ensurePostgresSchema();
  const result = await query(
    `
      SELECT
        products.*,
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
        ) AS normalized_variants
      FROM products
      ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ${ADMIN_PRODUCT_LIMIT}
    `,
    values
  );
  return result.rows.map(mapAdminProductRow);
}

export async function listAdminProducts(searchParams = new URLSearchParams()) {
  const collection = textValue(searchParams.get('collection'));
  const q = textValue(searchParams.get('q'));
  const where = [];
  const values = [];

  if (collection) {
    if (!PRODUCT_COLLECTION_NAMES.includes(collection)) {
      throw new Error('Danh mục sản phẩm không hợp lệ.');
    }
    values.push(collection);
    where.push(`collection = $${values.length}`);
  } else {
    values.push(PRODUCT_COLLECTION_NAMES);
    where.push(`collection = ANY($${values.length}::text[])`);
  }

  if (q) {
    values.push(`%${q}%`);
    where.push(`
      (
        products.id ILIKE $${values.length}
        OR name ILIKE $${values.length}
        OR brand ILIKE $${values.length}
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

  const products = await selectProducts(
    `WHERE ${where.join(' AND ')}`,
    values,
    'collection ASC, updated_at DESC, name ASC NULLS LAST'
  );
  return {
    backend: 'postgres',
    total: products.length,
    items: products,
  };
}

export async function getAdminProductById(id) {
  const productId = textValue(id);
  if (!productId) return null;
  const products = await selectProducts('WHERE id = $1', [productId], 'id ASC');
  return products[0] || null;
}

export async function upsertAdminProduct(input = {}, options = {}) {
  const product = normalizeSqlProductInput(input, options);
  await ensurePostgresSchema();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `
        INSERT INTO products (
          id,
          collection,
          name,
          brand,
          category,
          sku,
          status,
          ma_san_pham,
          product_type,
          primary_color,
          condition_label,
          price_for_sale,
          price_default,
          sale_percent,
          is_best_seller,
          is_hide,
          description,
          table_info,
          video_url,
          post_id,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,  now()
        )
        ON CONFLICT (id) DO UPDATE SET
          collection = EXCLUDED.collection,
          name = EXCLUDED.name,
          brand = EXCLUDED.brand,
          category = EXCLUDED.category,
          sku = EXCLUDED.sku,
          status = EXCLUDED.status,
          ma_san_pham = EXCLUDED.ma_san_pham,
          product_type = EXCLUDED.product_type,
          primary_color = EXCLUDED.primary_color,
          condition_label = EXCLUDED.condition_label,
          price_for_sale = EXCLUDED.price_for_sale,
          price_default = EXCLUDED.price_default,
          sale_percent = EXCLUDED.sale_percent,
          is_best_seller = EXCLUDED.is_best_seller,
          is_hide = EXCLUDED.is_hide,
          description = EXCLUDED.description,
          table_info = EXCLUDED.table_info,
          video_url = EXCLUDED.video_url,
          post_id = EXCLUDED.post_id,
          updated_at = now()
      `,
      [
        product.id,
        product.collection,
        textOrNull(product.name),
        textOrNull(product.brand),
        textOrNull(product.category),
        textOrNull(product.sku),
        textOrNull(product.status),
        textOrNull(product.maSanPham),
        textOrNull(product.loaiSp),
        firstText(product.colors || product.color) || null,
        firstText(product.condition) || null,
        numberOrNull(product.priceForSale),
        numberOrNull(product.priceDefault),
        numberOrNull(product.salePercent),
        product.isbestSeller,
        product.isHide,
        textOrNull(product.description),
        textOrNull(product.tableInfo),
        textOrNull(product.videoUrl),
        textOrNull(product.post),
      ]
    );
    await client.query('DELETE FROM product_images WHERE product_id = $1', [product.id]);
    await client.query('DELETE FROM product_variants WHERE product_id = $1', [product.id]);

    for (const [imageIndex, url] of product.images.entries()) {
      await client.query(
        `
          INSERT INTO product_images (product_id, sort_order, url, alt, is_primary)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [product.id, imageIndex, url, product.name || null, imageIndex === 0]
      );
    }

    for (const [variantIndex, variant] of product.variants.entries()) {
      const variantKey = getVariantKey(variant, variantIndex);
      await client.query(
        `
          INSERT INTO product_variants (
            product_id,
            variant_key,
            variant_id,
            sku,
            name,
            color,
            condition_label,
            price_for_sale,
            price_default,
            sale_percent,
            inventory,
            sort_order,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
        `,
        [
          product.id,
          variantKey,
          textOrNull(variant.id),
          textOrNull(variant.sku),
          textOrNull(variant.name),
          textOrNull(variant.color),
          textOrNull(variant.condition),
          numberOrNull(variant.priceForSale),
          numberOrNull(variant.priceDefault),
          numberOrNull(variant.salePercent),
          integerOrZero(variant.inventory),
          variantIndex,
        ]
      );

      for (const [variantImageIndex, url] of variant.images.entries()) {
        await client.query(
          `
            INSERT INTO product_variant_images (product_id, variant_key, sort_order, url, alt)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [
            product.id,
            variantKey,
            variantImageIndex,
            url,
            variant.name || product.name || null,
          ]
        );
      }
    }

    await client.query('COMMIT');
    return getAdminProductById(product.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteAdminProduct(id) {
  const productId = textValue(id);
  if (!productId) throw new Error('Thiếu ID sản phẩm.');
  await ensurePostgresSchema();
  const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [productId]);
  return {
    deleted: result.rowCount > 0,
    id: productId,
  };
}
