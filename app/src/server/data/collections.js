import { FIREBASE_COLLECTIONS } from '../../constants/index.js';

export const DATA_COLLECTIONS = [
  FIREBASE_COLLECTIONS.NHET_TAI,
  FIREBASE_COLLECTIONS.CHUP_TAI,
  FIREBASE_COLLECTIONS.DI_DONG,
  FIREBASE_COLLECTIONS.DE_BAN,
  FIREBASE_COLLECTIONS.KARAOKE,
  FIREBASE_COLLECTIONS.NEWSEAL,
  '07-policy',
  'brands',
  'categories',
  'colors',
  'database',
  'eventAMZ',
  'events',
  'bestSellerOrder',
  'homeSettingService',
  'postAuthors',
  'postCategories',
  'postService',
  'postTags',
  'productPosts',
  'productConditionPresets',
  'productDisplayCategories',
  'productStore',
  'skuSegmentCodes',
  'summary',
  'ui-config',
];

export const DATA_COLLECTION_SET = new Set(DATA_COLLECTIONS);
export const PRODUCT_DATA_COLLECTIONS = Object.values(FIREBASE_COLLECTIONS);
export const PRODUCT_DATA_COLLECTION_SET = new Set(PRODUCT_DATA_COLLECTIONS);

export function assertCollectionName(collection) {
  if (!collection || typeof collection !== 'string') {
    throw new Error('Missing collection');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(collection) || !DATA_COLLECTION_SET.has(collection)) {
    throw new Error(`Collection is not allowed: ${collection}`);
  }

  return collection;
}

export function isProductDataCollection(collection) {
  return PRODUCT_DATA_COLLECTION_SET.has(collection);
}
