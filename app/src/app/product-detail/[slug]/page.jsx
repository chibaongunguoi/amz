import { notFound, redirect } from 'next/navigation';
import LegacyClientShell from '@/next/LegacyClientShell';
import ClientReadyMarker from '@/next/ClientReadyMarker';
import { listProducts } from '@/server/products/productRepository';
import { createProductSlug, findProductBySlug, withProductSeoSlugs } from '@/utils/product.utils';
import { formatCurrency } from '@/utils/format.utils';
import { formatProductDisplayName } from '@/utils/productSearch.utils';
import { sanitizeHtml, stripHtml } from '@/utils/htmlSanitizer';
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

function getProductImages(product) {
  const productImages = Array.isArray(product?.images) ? product.images : [];
  if (productImages.length > 0) return productImages.filter(Boolean);
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.flatMap((variant) => Array.isArray(variant.images) ? variant.images : []).filter(Boolean);
}

function getInStockVariants(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.filter((variant) => Number(variant.inventory) > 0);
}

function getPriceText(product) {
  const variants = getInStockVariants(product);
  const prices = variants
    .map((variant) => Number(variant.priceForSale))
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);

  if (prices.length > 1 && prices[0] !== prices[prices.length - 1]) {
    return `${formatCurrency(prices[0])} - ${formatCurrency(prices[prices.length - 1])}`;
  }

  const price = prices[0] || Number(product?.priceForSale) || 0;
  return price > 0 ? formatCurrency(price) : 'Liên hệ';
}

async function getProduct(slug) {
  const result = await listProducts(new URLSearchParams({ limit: '1000' }));
  return findProductBySlug(slug, withProductSeoSlugs(result.items || []));
}

function getDescription(product) {
  const raw = stripHtml(product?.description || '');
  if (raw) return raw.slice(0, 155);
  const displayName = formatProductDisplayName(product?.name);
  const category = product?.category ? ` thuộc ${product.category}` : '';
  return `${displayName}${category} tại AMZTECH. Giá ${getPriceText(product)}. Có nhiều biến thể theo màu sắc, tình trạng và tồn kho.`;
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  if (!product) {
    return {
      title: 'Sản phẩm | AMZTECH',
      alternates: { canonical: `/product-detail/${params.slug}` },
    };
  }

  const title = formatProductDisplayName(product.name);
  const description = getDescription(product);
  const canonical = `/product-detail/${createProductSlug(product)}`;
  const image = absoluteUrl(getProductImages(product)[0]);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      images: image ? [{ url: image, alt: formatProductDisplayName(product.name) }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductDetailSeoPage({ params, searchParams }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const canonicalSlug = createProductSlug(product);
  if (canonicalSlug && params.slug !== canonicalSlug) {
    const query = new URLSearchParams();
    const variant = Array.isArray(searchParams?.variant)
      ? searchParams.variant[0]
      : searchParams?.variant;
    if (variant) query.set('variant', variant);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    redirect(`/product-detail/${canonicalSlug}${suffix}`);
  }

  const displayName = formatProductDisplayName(product.name);
  const images = getProductImages(product);
  const image = absoluteUrl(images[0]);
  const inStockVariants = getInStockVariants(product);
  const description = getDescription(product);
  const canonicalUrl = absoluteUrl(`/product-detail/${canonicalSlug}`);
  const price = Number(inStockVariants[0]?.priceForSale || product.priceForSale || 0);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    sku: product.maSanPham || product.sku || product.id,
    image: images.map(absoluteUrl).filter(Boolean),
    description,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'VND',
      price: price || undefined,
      availability: inStockVariants.length > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/UsedCondition',
    },
  };

  return (
    <>
      <ClientReadyMarker />
      <article className="amz-seo-fallback">
        <nav className="amz-seo-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Trang chủ</a>
          <span>/</span>
          <a href="/product">Sản phẩm</a>
          <span>/</span>
          <span>{displayName}</span>
        </nav>

        <div className="amz-seo-product">
          {image && (
            <OptimizedImage
              src={image}
              alt={displayName}
              width={640}
              height={640}
              sizes="(max-width: 768px) 100vw, 640px"
              className="amz-seo-product-image"
              loading="eager"
              priority
            />
          )}
          <div>
            <p className="amz-seo-brand">{product.brand}</p>
            <h1>{displayName}</h1>
            <p className="amz-seo-price">{getPriceText(product)}</p>
            <p className={inStockVariants.length > 0 ? 'amz-seo-stock-in' : 'amz-seo-stock-out'}>
              {inStockVariants.length > 0 ? 'Còn hàng' : 'Hết hàng'}
            </p>
            <p>{description}</p>
          </div>
        </div>

        {product.description && (
          <section
            className="amz-seo-description"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
          />
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, '\\u003c') }}
        />
      </article>
      <LegacyClientShell />
    </>
  );
}
