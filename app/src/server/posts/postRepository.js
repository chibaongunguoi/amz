import { query } from '../db/postgres.js';
import { ensurePostgresSchema } from '../storage/postgresCollections.js';
import { findPostBySlug, withPostSeoSlugs } from '../../utils/post.utils.js';

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function arrayValue(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toIso(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
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
    views: numberValue(row.views),
    readingTime: numberValue(row.reading_time),
    metaDescription: row.meta_description || '',
    metaKeywords: arrayValue(row.meta_keywords),
    tags: arrayValue(row.tags),
    relatedPostIds: arrayValue(row.related_post_ids),
    featured: Boolean(row.featured),
    pinned: Boolean(row.pinned),
  };
}

export async function listPosts(options = {}) {
  await ensurePostgresSchema();
  const includeDrafts = Boolean(options.includeDrafts);
  const values = [];
  const where = [];

  if (!includeDrafts) {
    values.push('published');
    where.push(`(status IS NULL OR status = '' OR status = $${values.length})`);
  }

  const result = await query(
    `
      SELECT *
      FROM posts
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY
        pinned DESC,
        COALESCE(published_at, created_at, updated_at) DESC NULLS LAST,
        title ASC NULLS LAST
    `,
    values
  );

  return withPostSeoSlugs(result.rows.map(mapPostRow));
}

export async function getPostBySlugOrId(slugOrId, options = {}) {
  const posts = await listPosts(options);
  return findPostBySlug(slugOrId, posts);
}
