import Fuse from 'fuse.js';
import { createProductSlug } from './product.utils';

export function normalizeSearchText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripHtml(value) {
  if (!value) return '';
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
}

export function parseImageList(images) {
  if (Array.isArray(images)) return images.filter(Boolean);
  if (typeof images === 'string') {
    return images
      .split(';;')
      .flatMap((item) => item.split('\n'))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function formatProductDisplayName(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  const parts = raw.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts.join(' ');
  return raw;
}

function textValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean).join(' ');
  return String(value ?? '').trim();
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function variantLookupKey(variant, index) {
  return String(variant?.id || variant?.sku || index);
}

function variantLabel(variant, index) {
  return (
    textValue(variant?.name) ||
    [variant?.color, variant?.condition].map(textValue).filter(Boolean).join(' - ') ||
    `Biến thể ${index + 1}`
  );
}

function productSearchText(product, displayName) {
  return [
    product?.name,
    displayName,
    product?.brand,
    product?.category,
    product?.product_type,
    product?.loaiSp,
    product?.tags,
    product?.sku,
    product?.maSanPham,
    textValue(product?.colors || product?.color),
    textValue(product?.condition),
    stripHtml(product?.description),
  ]
    .filter(Boolean)
    .join(' ');
}

function variantSearchText(product, variant, displayName, label) {
  return [
    productSearchText(product, displayName),
    label,
    variant?.sku,
    variant?.color,
    variant?.condition,
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildSearchItems(products = []) {
  const items = [];

  for (const product of Array.isArray(products) ? products : []) {
    if (!product?.id) continue;
    const displayName = formatProductDisplayName(product.name);
    const productImages = parseImageList(product.images);
    const variants = Array.isArray(product.variants) ? product.variants : [];

    if (variants.length > 0) {
      variants.forEach((variant, index) => {
        const lookupKey = variantLookupKey(variant, index);
        const label = variantLabel(variant, index);
        const variantImages = parseImageList(variant.images);
        const priceForSale = numberValue(variant.priceForSale || product.priceForSale);
        const priceDefault = numberValue(variant.priceDefault || product.priceDefault);
        const salePercent = numberValue(variant.salePercent || product.salePercent);
        const inventory = numberValue(variant.inventory);

        items.push({
          searchId: `${product.id}::${lookupKey}`,
          type: 'variant',
          product,
          productId: product.id,
          variant,
          variantId: lookupKey,
          variantIndex: index,
          title: displayName,
          subtitle: label,
          brand: product.brand || '',
          category: product.category || '',
          condition: variant.condition || textValue(product.condition),
          color: variant.color || textValue(product.colors || product.color),
          sku: variant.sku || '',
          images: variantImages.length > 0 ? variantImages : productImages,
          priceForSale,
          priceDefault,
          salePercent,
          isHide:product.isHide,
          inventory,
          inStock: inventory > 0,
          searchText: normalizeSearchText(variantSearchText(product, variant, displayName, label)),
        });
      });
      
      continue;
    }

    const priceForSale = numberValue(product.priceForSale);
    const priceDefault = numberValue(product.priceDefault);
    const salePercent = numberValue(product.salePercent);
    const inventory = numberValue(product.inventory ?? product.inventories);
    
    items.push({
      searchId: String(product.id),
      type: 'product',
      product,
      productId: product.id,
      variant: null,
      variantId: '',
      variantIndex: -1,
      title: displayName,
      subtitle: '',
      brand: product.brand || '',
      category: product.category || '',
      condition: textValue(product.condition),
      color: textValue(product.colors || product.color),
      sku: product.sku || '',
      images: productImages,
      priceForSale,
      priceDefault,
      salePercent,
      inventory,
      inStock: inventory > 0,
      searchText: normalizeSearchText(productSearchText(product, displayName)),
    });
  }

  return items;
}

function rankSearchItems(items, query, threshold) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (!normalizedQuery) return [];

  const fuse = new Fuse(items, {
    keys: ['searchText'],
    threshold,
    distance: 1200,
    ignoreLocation: true,
    minMatchCharLength: 1,
    includeScore: true,
  });

  const ranked = new Map();
  const add = (item, score = 1, boost = 0, hits = 1) => {
    const previous = ranked.get(item.searchId);
    const rank = Math.max(0, 1 - score) + boost + (item.inStock ? 0.18 : 0);
    if (previous) {
      previous.rank += rank;
      previous.hits += hits;
      previous.bestScore = Math.min(previous.bestScore, score);
    } else {
      ranked.set(item.searchId, {
        item,
        rank,
        hits,
        bestScore: score,
      });
    }
  };

  fuse.search(normalizedQuery).forEach(({ item, score = 1 }) => {
    if (score <= threshold) {
      add(item, score, 0.2, 2);
    }
  });

  for (const token of tokens) {
    fuse.search(token).forEach(({ item, score = 1 }) => {
      if (score <= Math.min(0.62, threshold + 0.08)) {
        add(item, score, 0, 1);
      }
    });
  }

  for (const item of items) {
    if (item.searchText.includes(normalizedQuery)) {
      add(item, 0, 1.5, Math.max(2, tokens.length));
      continue;
    }

    const tokenHits = tokens.filter((token) => item.searchText.includes(token)).length;
    if (tokenHits > 0) {
      add(item, 0.45, tokenHits / Math.max(1, tokens.length), tokenHits);
    }
  }

  return [...ranked.values()]
    .sort((a, b) => {
      const aProduct = a.item.productId;
      const bProduct = b.item.productId;
      if (b.hits !== a.hits) return b.hits - a.hits;
      if (b.rank !== a.rank) return b.rank - a.rank;
      if (a.item.inStock !== b.item.inStock) return a.item.inStock ? -1 : 1;
      if (aProduct === bProduct && a.item.inStock !== b.item.inStock) {
        return a.item.inStock ? -1 : 1;
      }
      return a.item.title.localeCompare(b.item.title, 'vi');
    })
    .map((entry) => entry.item);
}

export function searchCatalogItems(products, query, options = {}) {
  const limit = options.limit || 48;
  const suggestionLimit = options.suggestionLimit || 12;
  const items = buildSearchItems(products);
  const primary = rankSearchItems(items, query, 0.42).slice(0, limit);

  if (primary.length > 0) {
    console.log('Primary search results:', primary);
    return {
      query: String(query || '').trim(),
      mode: 'results',
      items: primary,
      suggestions: [],
      allItems: items,
    };
  }

  const suggestions = rankSearchItems(items, query, 0.72).slice(0, suggestionLimit);
  const fallbackSuggestions = suggestions.length > 0
    ? suggestions
    : items
        .filter((item) => item.inStock)
        .slice(0, suggestionLimit);
 
  return {
    query: String(query || '').trim(),
    mode: 'suggestions',
    items: [],
    suggestions: fallbackSuggestions,
    allItems: items,
  };
}

export function createSearchItemUrl(item) {
  if (!item?.product) return '/product';
  const slug = createProductSlug(item.product);
  const search = new URLSearchParams();
  if (item.variantId) search.set('variant', item.variantId);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  if (slug) return `/product-detail/${slug}${suffix}`;
  search.set('id', item.productId || '');
  return `/product-detail?${search.toString()}`;
}
