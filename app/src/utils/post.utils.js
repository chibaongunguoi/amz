import { slugify } from './format.utils.js';

export function stripPostHtml(value = '') {
  return String(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createPostBaseSlug(post = {}) {
  return slugify(post.slug || post.title || '');
}

function createPostIdSlug(post = {}) {
  return slugify(post.id || '');
}

export function createPostSlug(post = {}) {
  if (!post) return '';
  if (post.seoSlug) return String(post.seoSlug);
  return createPostBaseSlug(post) || createPostIdSlug(post);
}

export function withPostSeoSlugs(posts = []) {
  if (!Array.isArray(posts)) return [];

  const baseCounts = posts.reduce((acc, post) => {
    const baseSlug = createPostBaseSlug(post);
    if (baseSlug) acc.set(baseSlug, (acc.get(baseSlug) || 0) + 1);
    return acc;
  }, new Map());

  const used = new Set();
  return posts.map((post) => {
    const baseSlug = createPostBaseSlug(post);
    const idSlug = createPostIdSlug(post);
    let seoSlug = baseSlug || idSlug;

    if (seoSlug && baseCounts.get(baseSlug) > 1 && idSlug) {
      seoSlug = `${baseSlug}-${idSlug}`;
    }

    const originalSlug = seoSlug;
    let suffix = 2;
    while (seoSlug && used.has(seoSlug)) {
      seoSlug = `${originalSlug}-${suffix}`;
      suffix += 1;
    }

    if (seoSlug) used.add(seoSlug);
    return post && typeof post === 'object' ? { ...post, seoSlug } : post;
  });
}

export function findPostBySlug(slug, posts = []) {
  if (!slug || !Array.isArray(posts)) return null;
  const normalizedSlug = String(slug);

  return (
    posts.find((post) => normalizedSlug === createPostSlug(post)) ||
    posts.find((post) => normalizedSlug === createPostBaseSlug(post)) ||
    posts.find((post) => normalizedSlug === createPostIdSlug(post)) ||
    posts.find((post) => String(post?.id || '') === normalizedSlug) ||
    null
  );
}

export function getPostDescription(post = {}, maxLength = 155) {
  const raw =
    post.metaDescription ||
    post.excerpt ||
    stripPostHtml(post.content || '');
  return String(raw || '').slice(0, maxLength);
}
