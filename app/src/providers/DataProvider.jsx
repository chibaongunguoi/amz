import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAllProducts, selectAllProducts } from '../store/slices/productsSlice';
import { setHomeSettings } from '../store/slices/settingsSlice';
import { setIsLoading, setError } from '../store/slices/uiSlice';
import { STOREFRONT_PRODUCT_COLLECTIONS, FILTER_VALUES } from '../constants';
import { loadCollection, loadHomeSettings } from '../lib/data';
import { parseStorefrontPipeRecord, withProductSeoSlugs } from '@/utils/product.utils.js';
import { PRODUCT_DISPLAY_CATEGORIES_COLLECTION } from '@/lib/productDisplayCategories';
import { loadBestSellerOrderFromServer } from '@/services/bestSellerOrder.service';

const parseRawItems = (rawItems, collectionCode) => {
  const products = [];
  rawItems.forEach((item) => {
    Object.entries(item).forEach(([id, value]) => {
      if (id === FILTER_VALUES.RESERVED_ID) return;
      const product =
        value && typeof value === 'object' && !Array.isArray(value)
          ? { ...value, id: value.id || id, collection: value.collection || collectionCode }
          : parseStorefrontPipeRecord(value, collectionCode);
      if (product) {
        product.id = product.id || id;
        products.push(product);
      }
    });
  });
  return products;
};

const loadStorefrontProductsFromSql = async () => {
  const response = await fetch('/api/products?limit=1000', {
    cache: 'no-cache',
  });
  if (!response.ok) {
    throw new Error(`Failed to load SQL products: ${response.status}`);
  }
  const payload = await response.json();
  return Array.isArray(payload?.items) ? payload.items : [];
};

const loadStorefrontProductsFromCollections = async () => {
  const allParsed = [];
  for (const collectionName of STOREFRONT_PRODUCT_COLLECTIONS) {
    const rawPages = await loadCollection(collectionName, true);
    if (!Array.isArray(rawPages)) continue;
    allParsed.push(...parseRawItems(rawPages, collectionName));
  }
  return allParsed;
};

export function DataProvider({ children }) {
  const dispatch = useDispatch();
  const hasInitialized = useRef(false);
  const existingProducts = useSelector(selectAllProducts);
  const hasPersistedData = existingProducts.length > 0;

  const loadStorefrontProducts = useCallback(async (showLoading = !hasPersistedData) => {
    if (showLoading) dispatch(setIsLoading(true));
    try {
      await Promise.allSettled([
        loadCollection(PRODUCT_DISPLAY_CATEGORIES_COLLECTION, true),
        loadBestSellerOrderFromServer(),
      ]);

      let allParsed = [];
      try {
        allParsed = await loadStorefrontProductsFromSql();
      } catch (error) {
        console.warn('SQL product API unavailable, falling back to collections:', error);
        allParsed = await loadStorefrontProductsFromCollections();
      }
      dispatch(setAllProducts(withProductSeoSlugs(allParsed)));

      const settings = await loadHomeSettings();
      console.log('Loaded home settings:', settings);
      dispatch(setHomeSettings(settings));
      dispatch(setIsLoading(false));
    } catch (error) {
      dispatch(setError(error.message));
      dispatch(setIsLoading(false));
    }
  }, [dispatch, hasPersistedData]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    loadStorefrontProducts(!hasPersistedData);
  }, [hasPersistedData, loadStorefrontProducts]);

  useEffect(() => {
    const onProductsUpdated = () => {
      loadStorefrontProducts(false);
    };
    window.addEventListener('amz:products-updated', onProductsUpdated);
    return () => window.removeEventListener('amz:products-updated', onProductsUpdated);
  }, [loadStorefrontProducts]);

  return children;
}

export default DataProvider;
