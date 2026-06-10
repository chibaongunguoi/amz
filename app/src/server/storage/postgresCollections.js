import { Buffer } from 'node:buffer';
import { getPool, query } from '../db/postgres.js';
import { isProductDataCollection } from '../data/collections.js';
import { parseStorefrontPipeRecord } from '../../utils/product.utils.js';
import { createPostSlug, stripPostHtml, withPostSeoSlugs } from '../../utils/post.utils.js';

let schemaPromise;

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

function textOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function booleanOrFalse(value) {
  return value === true || value === 'true' || value === '1' || value === 1;
}

function firstTextOrNull(value) {
  if (Array.isArray(value)) return textOrNull(value[0]);
  return textOrNull(value);
}

function imageList(value) {
  if (Array.isArray(value)) return value.map(textOrNull).filter(Boolean);
  if (typeof value === 'string') return value.split(';;').map(textOrNull).filter(Boolean);
  return [];
}

function stringList(value) {
  if (Array.isArray(value)) return value.map(textOrNull).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[;\n,]+/)
      .map(textOrNull)
      .filter(Boolean);
  }
  return [];
}

function dateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function calculateReadingTime(content) {
  const text = stripPostHtml(content || '');
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}

function getVariantKey(variant, index) {
  return textOrNull(variant?.id) || `idx-${index}`;
}

function toIso(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function encodePathPart(value) {
  return Buffer.from(String(value), 'utf8').toString('base64url');
}

function getCollectionNodeType(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number' && Number.isFinite(value)) return 'number';
  return 'string';
}

function collectCollectionNodes(value, path = 'root', parentPath = null, fieldKey = null, sortOrder = 0, nodes = []) {
  const nodeType = getCollectionNodeType(value);
  nodes.push({
    path,
    parentPath,
    fieldKey,
    sortOrder,
    nodeType,
    textValue: nodeType === 'string' ? String(value) : null,
    numberValue: nodeType === 'number' ? value : null,
    booleanValue: nodeType === 'boolean' ? value : null,
  });

  if (nodeType === 'array') {
    value.forEach((item, index) => {
      collectCollectionNodes(item, `${path}/${index}`, path, null, index, nodes);
    });
  } else if (nodeType === 'object') {
    Object.entries(value).forEach(([key, item], index) => {
      collectCollectionNodes(item, `${path}/${index}-${encodePathPart(key)}`, path, key, index, nodes);
    });
  }

  return nodes;
}

function restoreCollectionTree(rows = []) {
  if (rows.length === 0) return null;

  const nodeMap = new Map();
  const childMap = new Map();
  for (const row of rows) {
    nodeMap.set(row.node_path, row);
    if (row.parent_path) {
      const children = childMap.get(row.parent_path) || [];
      children.push(row);
      childMap.set(row.parent_path, children);
    }
  }

  function restoreNode(path) {
    const row = nodeMap.get(path);
    if (!row) return null;

    if (row.node_type === 'array') {
      return (childMap.get(path) || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((child) => restoreNode(child.node_path));
    }

    if (row.node_type === 'object') {
      return (childMap.get(path) || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .reduce((object, child) => {
          object[child.field_key] = restoreNode(child.node_path);
          return object;
        }, {});
    }

    if (row.node_type === 'number') {
      const number = Number(row.number_value);
      return Number.isFinite(number) ? number : null;
    }

    if (row.node_type === 'boolean') return Boolean(row.boolean_value);
    if (row.node_type === 'string') return row.text_value || '';
    return null;
  }

  return restoreNode('root');
}

async function replaceCollectionNodes(client, collection, data) {
  await client.query('DELETE FROM collection_nodes WHERE collection = $1', [collection]);

  const nodes = collectCollectionNodes(data ?? []);
  for (const node of nodes) {
    await client.query(
      `
        INSERT INTO collection_nodes (
          collection,
          node_path,
          parent_path,
          field_key,
          sort_order,
          node_type,
          text_value,
          number_value,
          boolean_value,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      `,
      [
        collection,
        node.path,
        node.parentPath,
        node.fieldKey,
        node.sortOrder,
        node.nodeType,
        node.textValue,
        node.numberValue,
        node.booleanValue,
      ]
    );
  }

  return nodes.length;
}

function mapPostRow(row = {}) {
  return {
    id: row.id || '',
    slug: row.slug || '',
    title: row.title || '',
    date: row.date_text || toIso(row.published_at),
    publishedAt: toIso(row.published_at),
    updatedAt: toIso(row.updated_at),
    createdAt: toIso(row.created_at),
    content: row.content || '',
    excerpt: row.excerpt || '',
    thumbnail: row.thumbnail || '',
    featuredImage: row.featured_image || row.thumbnail || '',
    author: row.author_id || '',
    authorName: row.author_name || '',
    authorAvatar: row.author_avatar || '',
    authorBio: row.author_bio || '',
    category: row.category || '',
    categoryId: row.category_id || '',
    categorySlug: row.category_slug || '',
    categoryName: row.category_name || '',
    status: row.status || '',
    views: integerOrZero(row.views),
    readingTime: integerOrZero(row.reading_time),
    metaDescription: row.meta_description || '',
    metaKeywords: Array.isArray(row.meta_keywords) ? row.meta_keywords : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    relatedPostIds: Array.isArray(row.related_post_ids) ? row.related_post_ids : [],
    featured: Boolean(row.featured),
    pinned: Boolean(row.pinned),
  };
}

async function listPostCollectionRows() {
  const result = await query(`
    SELECT *
    FROM posts
    ORDER BY
      pinned DESC,
      COALESCE(published_at, created_at, updated_at) DESC NULLS LAST,
      title ASC NULLS LAST
  `);
  return withPostSeoSlugs(result.rows.map(mapPostRow));
}

export function ensurePostgresSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
      CREATE TABLE IF NOT EXISTS collection_nodes (
        collection text NOT NULL,
        node_path text NOT NULL,
        parent_path text,
        field_key text,
        sort_order integer NOT NULL DEFAULT 0,
        node_type text NOT NULL CHECK (node_type IN ('object', 'array', 'string', 'number', 'boolean', 'null')),
        text_value text,
        number_value numeric,
        boolean_value boolean,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (collection, node_path)
      );

      CREATE INDEX IF NOT EXISTS collection_nodes_parent_idx
        ON collection_nodes (collection, parent_path, sort_order);

      CREATE TABLE IF NOT EXISTS products (
        id text PRIMARY KEY,
        collection text NOT NULL,
        name text,
        brand text,
        category text,
        sku text,
        status text,
        ma_san_pham text,
        product_type text,
        primary_color text,
        condition_label text,
        price_for_sale numeric,
        price_default numeric,
        sale_percent numeric,
        is_best_seller boolean NOT NULL DEFAULT false,
        is_hiden boolean NOT NULL DEFAULT false,
        description text,
        table_info text,
        video_url text,
        post_id text,
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS ma_san_pham text;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type text;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_color text;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS condition_label text;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_percent numeric;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller boolean NOT NULL DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hide boolean NOT NULL DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS table_info text;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url text;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS post_id text;

      CREATE INDEX IF NOT EXISTS products_collection_idx ON products (collection);
      CREATE INDEX IF NOT EXISTS products_brand_idx ON products (brand);
      CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
      CREATE INDEX IF NOT EXISTS products_ma_san_pham_idx ON products (ma_san_pham);
      CREATE INDEX IF NOT EXISTS products_is_best_seller_idx ON products (is_best_seller);

      CREATE TABLE IF NOT EXISTS product_images (
        product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sort_order integer NOT NULL,
        url text NOT NULL,
        alt text,
        is_primary boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (product_id, sort_order)
      );

      CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images (product_id);

      CREATE TABLE IF NOT EXISTS product_variants (
        product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_key text NOT NULL,
        variant_id text,
        sku text,
        name text,
        color text,
        condition_label text,
        price_for_sale numeric,
        price_default numeric,
        sale_percent numeric,
        inventory integer NOT NULL DEFAULT 0,
        sort_order integer NOT NULL DEFAULT 0,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (product_id, variant_key)
      );

      CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants (product_id);
      CREATE INDEX IF NOT EXISTS product_variants_sku_idx ON product_variants (sku);
      CREATE INDEX IF NOT EXISTS product_variants_color_idx ON product_variants (color);
      CREATE INDEX IF NOT EXISTS product_variants_condition_idx ON product_variants (condition_label);

      CREATE TABLE IF NOT EXISTS product_variant_images (
        product_id text NOT NULL,
        variant_key text NOT NULL,
        sort_order integer NOT NULL,
        url text NOT NULL,
        alt text,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (product_id, variant_key, sort_order),
        FOREIGN KEY (product_id, variant_key)
          REFERENCES product_variants(product_id, variant_key)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS product_variant_images_variant_idx
        ON product_variant_images (product_id, variant_key);

      CREATE TABLE IF NOT EXISTS posts (
        id text PRIMARY KEY,
        slug text,
        title text,
        date_text text,
        published_at timestamptz,
        created_at timestamptz,
        content text,
        excerpt text,
        thumbnail text,
        featured_image text,
        author_id text,
        author_name text,
        author_avatar text,
        author_bio text,
        category text,
        category_id text,
        category_slug text,
        category_name text,
        status text,
        views integer NOT NULL DEFAULT 0,
        reading_time integer NOT NULL DEFAULT 0,
        meta_description text,
        meta_keywords text[] NOT NULL DEFAULT ARRAY[]::text[],
        tags text[] NOT NULL DEFAULT ARRAY[]::text[],
        related_post_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
        featured boolean NOT NULL DEFAULT false,
        pinned boolean NOT NULL DEFAULT false,
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS date_text text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at timestamptz;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at timestamptz;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS content text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumbnail text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured_image text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_id text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_bio text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS category text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS category_name text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_time integer NOT NULL DEFAULT 0;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description text;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_keywords text[] NOT NULL DEFAULT ARRAY[]::text[];
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[];
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS related_post_ids text[] NOT NULL DEFAULT ARRAY[]::text[];
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

      CREATE INDEX IF NOT EXISTS posts_status_idx ON posts (status);
      CREATE INDEX IF NOT EXISTS posts_category_idx ON posts (category_id, category_slug);
      CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug);
      `);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}

// export async function readPostgresCollection(collection) {
//   await ensurePostgresSchema();
//   if (collection === 'postService') {
//     return listPostCollectionRows();
//   }

//   const result = await query(
//     `
//       SELECT *
//       FROM collection_nodes
//       WHERE collection = $1
//       ORDER BY parent_path NULLS FIRST, sort_order ASC, node_path ASC
//     `,
//     [collection]
//   );
//   return restoreCollectionTree(result.rows);
// }
export async function readPostgresCollection(collection) {
  //  KHÔNG chạy schema trong API
  // await ensurePostgresSchema();

  if (collection === 'postService') {
    return listPostCollectionRows();
  }

  const result = await query(
    `
      SELECT *
      FROM collection_nodes
      WHERE collection = $1
      ORDER BY parent_path NULLS FIRST, sort_order ASC, node_path ASC
    `,
    [collection]
  );

  return restoreCollectionTree(result.rows);
}

async function refreshProductProjection(client, collection, data) {
  await client.query('DELETE FROM products WHERE collection = $1', [collection]);
  if (!isProductDataCollection(collection) || !Array.isArray(data)) return 0;

  let count = 0;
  for (const row of data) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;

    for (const [id, value] of Object.entries(row)) {
      if (id === 'id' || typeof value !== 'string') continue;

      const product = parseStorefrontPipeRecord(value, collection);
      if (!product) continue;

      const projected = {
        ...product,
        id,
      };

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
            $16, $17, $18, $19, $20, now()
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
            description = EXCLUDED.description,
            table_info = EXCLUDED.table_info,
            video_url = EXCLUDED.video_url,
            post_id = EXCLUDED.post_id,
            updated_at = now()
        `,
        [
          projected.id,
          collection,
          projected.name || null,
          projected.brand || null,
          projected.category || null,
          projected.sku || null,
          projected.status || null,
          textOrNull(projected.maSanPham),
          textOrNull(projected.loaiSp),
          firstTextOrNull(projected.colors || projected.color),
          firstTextOrNull(projected.condition),
          numberOrNull(projected.priceForSale),
          numberOrNull(projected.priceDefault),
          numberOrNull(projected.salePercent),
          booleanOrFalse(projected.isbestSeller) || booleanOrFalse(projected.isBestSeller),
          booleanOrFalse(projected.isHide),
          textOrNull(projected.description),
          textOrNull(projected.tableInfo),
          textOrNull(projected.videoUrl || projected.youtubeUrl),
          textOrNull(projected.post),
        ]
      );

      for (const [imageIndex, url] of imageList(projected.images).entries()) {
        await client.query(
          `
            INSERT INTO product_images (
              product_id,
              sort_order,
              url,
              alt,
              is_primary
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (product_id, sort_order) DO UPDATE SET
              url = EXCLUDED.url,
              alt = EXCLUDED.alt,
              is_primary = EXCLUDED.is_primary
          `,
          [
            projected.id,
            imageIndex,
            url,
            projected.name || null,
            imageIndex === 0,
          ]
        );
      }

      const variants = Array.isArray(projected.variants) ? projected.variants : [];
      for (const [variantIndex, variant] of variants.entries()) {
        if (!variant || typeof variant !== 'object') continue;
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
            ON CONFLICT (product_id, variant_key) DO UPDATE SET
              variant_id = EXCLUDED.variant_id,
              sku = EXCLUDED.sku,
              name = EXCLUDED.name,
              color = EXCLUDED.color,
              condition_label = EXCLUDED.condition_label,
              price_for_sale = EXCLUDED.price_for_sale,
              price_default = EXCLUDED.price_default,
              sale_percent = EXCLUDED.sale_percent,
              inventory = EXCLUDED.inventory,
              sort_order = EXCLUDED.sort_order,
              updated_at = now()
          `,
          [
            projected.id,
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

        for (const [variantImageIndex, url] of imageList(variant.images).entries()) {
          await client.query(
            `
              INSERT INTO product_variant_images (
                product_id,
                variant_key,
                sort_order,
                url,
                alt
              )
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (product_id, variant_key, sort_order) DO UPDATE SET
                url = EXCLUDED.url,
                alt = EXCLUDED.alt
            `,
            [
              projected.id,
              variantKey,
              variantImageIndex,
              url,
              variant.name || projected.name || null,
            ]
          );
        }
      }

      count += 1;
    }
  }

  return count;
}

function normalizePostInput(post, index, usedSlugs) {
  const id = String(post.id || `post-${index}`);
  const baseSlug = createPostSlug({ ...post, id }) || `post-${index + 1}`;
  let slug = baseSlug;
  let suffix = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  usedSlugs.add(slug);

  const content = textOrNull(post.content);
  return {
    id,
    slug,
    title: textOrNull(post.title),
    dateText: textOrNull(post.date),
    publishedAt: dateOrNull(post.publishedAt),
    createdAt: dateOrNull(post.createdAt),
    updatedAt: dateOrNull(post.updatedAt) || new Date().toISOString(),
    content,
    excerpt: textOrNull(post.excerpt),
    thumbnail: textOrNull(post.thumbnail),
    featuredImage: textOrNull(post.featuredImage || post.thumbnail),
    authorId: textOrNull(post.author),
    authorName: textOrNull(post.authorName || post.author),
    authorAvatar: textOrNull(post.authorAvatar),
    authorBio: textOrNull(post.authorBio),
    category: textOrNull(post.category),
    categoryId: textOrNull(post.categoryId),
    categorySlug: textOrNull(post.categorySlug),
    categoryName: textOrNull(post.categoryName),
    status: textOrNull(post.status) || 'published',
    views: integerOrZero(post.views),
    readingTime: integerOrZero(post.readingTime) || calculateReadingTime(content),
    metaDescription: textOrNull(post.metaDescription || post.excerpt),
    metaKeywords: stringList(post.metaKeywords),
    tags: stringList(post.tags),
    relatedPostIds: stringList(post.relatedPostIds),
    featured: booleanOrFalse(post.featured),
    pinned: booleanOrFalse(post.pinned),
  };
}

async function refreshPostProjection(client, collection, data) {
  if (collection !== 'postService') return 0;

  await client.query('DELETE FROM posts');
  if (!Array.isArray(data)) return 0;

  let count = 0;
  const usedSlugs = new Set();
  for (const [index, post] of data.entries()) {
    if (!post || typeof post !== 'object') continue;
    const normalized = normalizePostInput(post, index, usedSlugs);

    await client.query(
      `
        INSERT INTO posts (
          id,
          slug,
          title,
          date_text,
          published_at,
          created_at,
          content,
          excerpt,
          thumbnail,
          featured_image,
          author_id,
          author_name,
          author_avatar,
          author_bio,
          category,
          category_id,
          category_slug,
          category_name,
          status,
          views,
          reading_time,
          meta_description,
          meta_keywords,
          tags,
          related_post_ids,
          featured,
          pinned,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22,
          $23::text[], $24::text[], $25::text[], $26,
          $27, $28
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          date_text = EXCLUDED.date_text,
          published_at = EXCLUDED.published_at,
          created_at = EXCLUDED.created_at,
          content = EXCLUDED.content,
          excerpt = EXCLUDED.excerpt,
          thumbnail = EXCLUDED.thumbnail,
          featured_image = EXCLUDED.featured_image,
          author_id = EXCLUDED.author_id,
          author_name = EXCLUDED.author_name,
          author_avatar = EXCLUDED.author_avatar,
          author_bio = EXCLUDED.author_bio,
          category = EXCLUDED.category,
          category_id = EXCLUDED.category_id,
          category_slug = EXCLUDED.category_slug,
          category_name = EXCLUDED.category_name,
          status = EXCLUDED.status,
          views = EXCLUDED.views,
          reading_time = EXCLUDED.reading_time,
          meta_description = EXCLUDED.meta_description,
          meta_keywords = EXCLUDED.meta_keywords,
          tags = EXCLUDED.tags,
          related_post_ids = EXCLUDED.related_post_ids,
          featured = EXCLUDED.featured,
          pinned = EXCLUDED.pinned,
          updated_at = EXCLUDED.updated_at
      `,
      [
        normalized.id,
        normalized.slug,
        normalized.title,
        normalized.dateText,
        normalized.publishedAt,
        normalized.createdAt,
        normalized.content,
        normalized.excerpt,
        normalized.thumbnail,
        normalized.featuredImage,
        normalized.authorId,
        normalized.authorName,
        normalized.authorAvatar,
        normalized.authorBio,
        normalized.category,
        normalized.categoryId,
        normalized.categorySlug,
        normalized.categoryName,
        normalized.status,
        normalized.views,
        normalized.readingTime,
        normalized.metaDescription,
        normalized.metaKeywords,
        normalized.tags,
        normalized.relatedPostIds,
        normalized.featured,
        normalized.pinned,
        normalized.updatedAt,
      ]
    );
    count += 1;
  }

  return count;
}

export async function writePostgresCollection(collection, data) {
  await ensurePostgresSchema();
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const products = await refreshProductProjection(client, collection, data);
    const posts = await refreshPostProjection(client, collection, data);
    const isStructuredCollection = isProductDataCollection(collection) || collection === 'postService';

    if (isStructuredCollection) {
      await client.query('DELETE FROM collection_nodes WHERE collection = $1', [collection]);
    } else {
      await replaceCollectionNodes(client, collection, data);
    }

    await client.query('COMMIT');

    return { products, posts };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
