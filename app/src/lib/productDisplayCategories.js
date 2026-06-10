import {
  COLLECTION_TO_CATEGORY,
  CATEGORY_TO_COLLECTION,
  FIREBASE_COLLECTIONS,
  STOREFRONT_PRODUCT_COLLECTIONS,
} from '@/constants';

export const PRODUCT_DISPLAY_CATEGORIES_COLLECTION = 'productDisplayCategories';

const DEFAULT_ICON_BY_COLLECTION = {
  [FIREBASE_COLLECTIONS.NHET_TAI]: '🎧',
  [FIREBASE_COLLECTIONS.CHUP_TAI]: '🎵',
  [FIREBASE_COLLECTIONS.DI_DONG]: '📻',
  [FIREBASE_COLLECTIONS.DE_BAN]: '🔊',
  [FIREBASE_COLLECTIONS.KARAOKE]: '🎤',
};

/** Mặc định khi collection cấu hình trống hoặc lỗi — chỉ kho hiển thị trên shop (không newseal). */
export const DEFAULT_PRODUCT_DISPLAY_CATEGORY_ROWS = STOREFRONT_PRODUCT_COLLECTIONS.map(
  (collection, idx) => ({
    id: `pdc_${collection.replace(/[^a-z0-9]/gi, '_')}`,
    label: COLLECTION_TO_CATEGORY[collection] || collection,
    collection,
    sortOrder: idx,
    icon: DEFAULT_ICON_BY_COLLECTION[collection] || '📦',
  })
);

export function normalizeProductDisplayCategories(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const rows = raw
    .filter((r) => r && r.collection && String(r.label || '').trim())
    .map((r, i) => ({
      id: r.id || `pdc_${i}_${r.collection}`,
      label: String(r.label).trim(),
      collection: String(r.collection).trim(),
      sortOrder: Number.isFinite(Number(r.sortOrder)) ? Number(r.sortOrder) : i,
      icon: typeof r.icon === 'string' && r.icon.trim() ? r.icon.trim() : DEFAULT_ICON_BY_COLLECTION[r.collection] || '📦',
    }));
  return [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'vi'));
}

export function buildLabelByCollection(rows) {
  const map = {};
  for (const r of rows) {
    if (r.collection && r.label) map[r.collection] = r.label;
  }
  return map;
}

export function buildCollectionByLabel(rows) {
  const map = {};
  for (const r of rows) {
    if (r.collection && r.label) map[r.label] = r.collection;
  }
  return map;
}

export function toSelectOptions(rows) {
  return normalizeProductDisplayCategories(rows).map((r) => ({
    label: r.label,
    value: r.label,
  }));
}

export function resolveCollectionForCategoryLabel(categoryLabel, rows) {
  if (categoryLabel == null || categoryLabel === '') return '';
  const byDynamic = buildCollectionByLabel(rows);
  return byDynamic[categoryLabel] || CATEGORY_TO_COLLECTION[categoryLabel] || '';
}

export function resolveLabelForCollection(collectionCode, rows) {
  if (collectionCode == null || collectionCode === '') return '';
  const byCol = buildLabelByCollection(rows);
  return byCol[collectionCode] || COLLECTION_TO_CATEGORY[collectionCode] || '';
}
