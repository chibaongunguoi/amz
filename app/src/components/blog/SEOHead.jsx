import { useEffect } from 'react';
import { createPostSlug } from '@/utils/post.utils';

function SEOHead({ post }) {
  useEffect(() => {
    if (!post) return;

    // Update title
    document.title = `${post.title} | AMZTECH`;

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    const description = post.metaDescription || post.excerpt || '';
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = description;
      document.head.appendChild(metaDescription);
    }

    // Update or create Open Graph tags
    const slug = createPostSlug(post);
    const canonicalUrl = slug
      ? `${window.location.origin}/post-detail/${slug}`
      : window.location.href;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', canonicalUrl);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonical);
    }

    const ogTags = {
      'og:title': post.title,
      'og:description': description,
      'og:type': 'article',
      'og:url': canonicalUrl,
      'og:image': post.featuredImage || post.thumbnail || '',
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      if (!content) return;
      
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    });

    // Update or create Twitter Card tags
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': post.title,
      'twitter:description': description,
      'twitter:image': post.featuredImage || post.thumbnail || '',
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      if (!content) return;
      
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    });

    // Add article meta tags
    if (post.publishedAt || post.date) {
      let publishedTime = document.querySelector('meta[property="article:published_time"]');
      const publishedDate = post.publishedAt || post.date;
      if (publishedTime) {
        publishedTime.setAttribute('content', publishedDate);
      } else {
        publishedTime = document.createElement('meta');
        publishedTime.setAttribute('property', 'article:published_time');
        publishedTime.setAttribute('content', publishedDate);
        document.head.appendChild(publishedTime);
      }
    }

    if (post.updatedAt) {
      let modifiedTime = document.querySelector('meta[property="article:modified_time"]');
      if (modifiedTime) {
        modifiedTime.setAttribute('content', post.updatedAt);
      } else {
        modifiedTime = document.createElement('meta');
        modifiedTime.setAttribute('property', 'article:modified_time');
        modifiedTime.setAttribute('content', post.updatedAt);
        document.head.appendChild(modifiedTime);
      }
    }

    if (post.authorName || post.author) {
      let author = document.querySelector('meta[name="author"]');
      const authorName = post.authorName || post.author;
      if (author) {
        author.setAttribute('content', authorName);
      } else {
        author = document.createElement('meta');
        author.setAttribute('name', 'author');
        author.setAttribute('content', authorName);
        document.head.appendChild(author);
      }
    }

    // Add keywords if available
    if (post.metaKeywords && post.metaKeywords.length > 0) {
      let keywords = document.querySelector('meta[name="keywords"]');
      const keywordsContent = post.metaKeywords.join(', ');
      if (keywords) {
        keywords.setAttribute('content', keywordsContent);
      } else {
        keywords = document.createElement('meta');
        keywords.setAttribute('name', 'keywords');
        keywords.setAttribute('content', keywordsContent);
        document.head.appendChild(keywords);
      }
    }

    // Add structured data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: description,
      image: post.featuredImage || post.thumbnail || '',
      datePublished: post.publishedAt || post.date || '',
      dateModified: post.updatedAt || post.publishedAt || post.date || '',
      author: {
        '@type': 'Person',
        name: post.authorName || post.author || 'Unknown',
      },
      publisher: {
        '@type': 'Organization',
        name: 'AMZ Blog',
      },
    };

    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"][data-post-id]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-post-id', post.id);
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Optionally clean up meta tags on unmount
      // For now, we'll leave them as they might be useful for SEO
    };
  }, [post]);

  return null;
}

export default SEOHead;

