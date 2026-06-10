import { notFound, redirect } from 'next/navigation';
import LegacyClientShell from '@/next/LegacyClientShell';
import ClientReadyMarker from '@/next/ClientReadyMarker';
import { getPostBySlugOrId } from '@/server/posts/postRepository';
import { createPostSlug, getPostDescription, stripPostHtml } from '@/utils/post.utils';
import { sanitizeHtml } from '@/utils/htmlSanitizer';
import OptimizedImage from '@/components/common/OptimizedImage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:2011';

function absoluteUrl(value) {
  if (!value) return '';
  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return '';
  }
}

function getPostImage(post) {
  return post?.featuredImage || post?.thumbnail || '';
}

function getPostDate(post) {
  return post?.publishedAt || post?.date || post?.createdAt || '';
}

export async function generateMetadata({ params }) {
  const post = await getPostBySlugOrId(params.slug);
  if (!post) {
    return {
      title: 'Bài viết | AMZTECH',
      alternates: { canonical: `/post-detail/${params.slug}` },
    };
  }

  const canonical = `/post-detail/${createPostSlug(post)}`;
  const description = getPostDescription(post);
  const image = absoluteUrl(getPostImage(post));

  return {
    title: post.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: post.title,
      description,
      images: image ? [{ url: image, alt: post.title }] : [],
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function PostDetailSeoPage({ params }) {
  const post = await getPostBySlugOrId(params.slug);
  if (!post) notFound();

  const canonicalSlug = createPostSlug(post);
  if (canonicalSlug && params.slug !== canonicalSlug) {
    redirect(`/post-detail/${canonicalSlug}`);
  }

  const canonicalUrl = absoluteUrl(`/post-detail/${canonicalSlug}`);
  const image = absoluteUrl(getPostImage(post));
  const description = getPostDescription(post);
  const plainText = stripPostHtml(post.content || '');

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: image ? [image] : undefined,
    datePublished: getPostDate(post) || undefined,
    dateModified: post.updatedAt || getPostDate(post) || undefined,
    author: {
      '@type': 'Person',
      name: post.authorName || post.author || 'AMZTECH',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AMZTECH',
    },
    mainEntityOfPage: canonicalUrl,
    articleBody: plainText || undefined,
  };

  return (
    <>
      <ClientReadyMarker />
      <article className="amz-seo-fallback">
        <nav className="amz-seo-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Trang chủ</a>
          <span>/</span>
          <a href="/posts">Bài viết</a>
          <span>/</span>
          <span>{post.title}</span>
        </nav>
        <header>
          <h1>{post.title}</h1>
          {getPostDate(post) && <p>{getPostDate(post)}</p>}
          {description && <p>{description}</p>}
          {image && (
            <OptimizedImage
              src={image}
              alt={post.title}
              width={1200}
              height={630}
              sizes="(max-width: 768px) 100vw, 1200px"
              loading="eager"
              priority
            />
          )}
        </header>
        {post.content && (
          <section dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c') }}
        />
      </article>
      <LegacyClientShell />
    </>
  );
}
