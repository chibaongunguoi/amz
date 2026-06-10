import { useSelector, useDispatch } from 'react-redux';
import { useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';

import {
  selectAllProducts, selectBestSellers, selectOnSaleProducts,
  selectFilteredBestSellers, selectFilteredOnSale, selectCurrentProduct,
  selectProductById, selectUniqueBrands, setCurrentProduct, clearCurrentProduct,
} from '../store/slices/productsSlice';

import { selectPosts, selectEditingPost } from '../store/slices/postsSlice';
import { selectHomeSettings, selectBrands } from '../store/slices/settingsSlice';
import { selectCategory, selectBrands as selectFilterBrands, selectPriceRanges } from '../store/slices/filtersSlice';
import { FILTER_VALUES, BESTSELLER_VALUES, SORT_KEYS } from '../constants';

const FUSE_OPTIONS = { keys: ['name', 'brand', 'category'], threshold: 0.4, ignoreLocation: true };

const SORT_FUNCTIONS = {
  [SORT_KEYS.ASC]: (a, b) => (a.priceForSale || 0) - (b.priceForSale || 0),
  [SORT_KEYS.DESC]: (a, b) => (b.priceForSale || 0) - (a.priceForSale || 0),
  [SORT_KEYS.HOTDEAL]: (a, b) => (b.salePercent || 0) - (a.salePercent || 0),
  [SORT_KEYS.BESTSELLER]: (a, b) => (b.isBestSeller === BESTSELLER_VALUES.YES ? 1 : 0) - (a.isBestSeller === BESTSELLER_VALUES.YES ? 1 : 0),
};

export const useProducts = () => {
  const dispatch = useDispatch();
  const allProducts = useSelector(selectAllProducts);
  const currentProduct = useSelector(selectCurrentProduct);
  const category = useSelector(selectCategory);
  const filterBrands = useSelector(selectFilterBrands);
  const priceRanges = useSelector(selectPriceRanges);
  
  const fuseInstance = useMemo(() => 
    allProducts.length > 0 ? new Fuse(allProducts, FUSE_OPTIONS) : null, 
  [allProducts]);

  const searchProducts = useCallback((query) => 
    query && fuseInstance ? fuseInstance.search(query).map(r => r.item) : [], 
  [fuseInstance]);

  const getProductsByCategory = useCallback((cat) => 
    (!cat || cat === FILTER_VALUES.ALL_PRODUCTS) ? allProducts : allProducts.filter(p => p.category === cat), 
  [allProducts]);

  const getFilteredProducts = useCallback((sortBy = SORT_KEYS.DEFAULT) => {
    let result = (category && category !== FILTER_VALUES.ALL_PRODUCTS)
      ? allProducts.filter(p => p.category === category)
      : [...allProducts];

    if (filterBrands.length > 0) {
      result = result.filter(p => filterBrands.some(b => b.toLowerCase() === p.brand?.toLowerCase()));
    }

    if (priceRanges.length > 0) {
      result = result.filter(p => {
        const price = Number(p.priceForSale) || 0;
        return priceRanges.some(([min, max]) => price >= min && price <= max);
      });
    }

    if (SORT_FUNCTIONS[sortBy]) result.sort(SORT_FUNCTIONS[sortBy]);
    return result;
  }, [allProducts, category, filterBrands, priceRanges]);

  const getProductById = useCallback((id) => allProducts.find(p => p.id === id) || null, [allProducts]);

  const getRelatedProducts = useCallback((product, limit = 4) => 
    product?.category 
      ? allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, limit) 
      : [], 
  [allProducts]);

  const viewProduct = useCallback((product) => dispatch(setCurrentProduct(product)), [dispatch]);
  const clearProduct = useCallback(() => dispatch(clearCurrentProduct()), [dispatch]);

  return {
    allProducts, currentProduct,
    searchProducts, getProductsByCategory, getFilteredProducts, getProductById, getRelatedProducts,
    viewProduct, clearProduct,
  };
};

export const useFeaturedProducts = () => ({
  bestSellers: useSelector(selectBestSellers),
  onSaleProducts: useSelector(selectOnSaleProducts),
  filteredBestSellers: useSelector(selectFilteredBestSellers),
  filteredOnSale: useSelector(selectFilteredOnSale),
});

export const usePosts = () => {
  const posts = useSelector(selectPosts);
  const editingPost = useSelector(selectEditingPost);
  const getPostById = useCallback((id) => posts.find(p => p.id === id) || null, [posts]);
  return { posts, editingPost, getPostById };
};

export const useSettings = () => {
  const homeSettings = useSelector(selectHomeSettings);
  const brands = useSelector(selectBrands);
  const uniqueBrands = useSelector(selectUniqueBrands);
  return { homeSettings, brands: brands.length > 0 ? brands : uniqueBrands };
};

export {
  selectAllProducts, selectBestSellers, selectOnSaleProducts,
  selectFilteredBestSellers, selectFilteredOnSale, selectCurrentProduct, selectProductById,
};
