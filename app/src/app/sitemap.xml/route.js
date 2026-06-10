import { listProducts } from '../../server/products/productRepository';
import { listPosts } from '../../server/posts/postRepository';
import { createProductSlug, withProductSeoSlugs } from '../../utils/product.utils';
import { createPostSlug } from '../../utils/post.utils';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:2011';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const staticRoutes = [
  '/',
  '/product',
  '/product/nhet-tai-cu',
  '/product/chup-tai-cu',
  '/product/di-dong-cu',
  '/product/de-ban-cu',
  '/product/loa-karaoke',
  '/posts',
  '/sale',
  '/policy/warranty',
  '/policy/privacy',
  '/policy/purchase',
  '/policy/exchange',
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function readProductRoutes() {
  const products = await listProducts(new URLSearchParams({ limit: '1000' }));
  return withProductSeoSlugs(Array.isArray(products.items) ? products.items : [])
    .map((product) => createProductSlug(product))
    .filter(Boolean)
    .map((slug) => `/product-detail/${slug}`);
}

async function readPostRoutes() {
  const posts = await listPosts();
  return posts
    .map((post) => createPostSlug(post))
    .filter(Boolean)
    .map((slug) => `/post-detail/${slug}`);
}

export async function GET() {
  const [productRoutes, postRoutes] = await Promise.all([
    readProductRoutes(),
    readPostRoutes(),
  ]);

  const routes = [...staticRoutes, ...productRoutes, ...postRoutes];
  const now = new Date().toISOString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${escapeXml(new URL(route, siteUrl).toString())}</loc>
    <lastmod>${now}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
