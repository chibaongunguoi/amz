/**
 * Product Service - Quản lý sản phẩm
 * Hook sử dụng Firestore service và Redux
 */
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Fuse from 'fuse.js';
import { productsService } from './firestore.service';
import {
  setAllProducts,
  setCurrentProduct,
  setSelectedProduct,
  setRelatedProducts,
  selectAllProducts,
  selectCurrentProduct,
  selectSelectedProduct,
} from '../store/slices/productsSlice';

const FUSE_OPTIONS = {
  keys: ['name', 'brand', 'category'],
  threshold: 0.4,
  ignoreLocation: true,
};


export const useProducts = () => {
  const dispatch = useDispatch();
  const allProducts = useSelector(selectAllProducts);
  const currentProduct = useSelector(selectCurrentProduct);
  const selectedProduct = useSelector(selectSelectedProduct);

  const fuseInstance = useMemo(() => {
    return allProducts.length > 0 ? new Fuse(allProducts, FUSE_OPTIONS) : null;
  }, [allProducts]);


  const fetchAllProducts = useCallback(async () => {
    const products = await productsService.getAll();
    dispatch(setAllProducts(products));
    return products;
  }, [dispatch]);


  const getProductById = useCallback(async (id) => {
    const cached = allProducts.find(p => p.id === id);
    if (cached) {
      dispatch(setCurrentProduct(cached));
      return cached;
    }
    
    const product = await productsService.getById(id);
    if (product) {
      dispatch(setCurrentProduct(product));
    }
    return product;
  }, [allProducts, dispatch]);


  const searchProducts = useCallback((query) => {
    if (!query || !fuseInstance) return [];
    return fuseInstance.search(query).map(result => result.item);
  }, [fuseInstance]);


  const filterByCategory = useCallback((category) => {
    if (!category) return allProducts;
    const lowerCategory = category.toLowerCase();
    return allProducts.filter(p => 
      p.category?.toLowerCase().includes(lowerCategory)
    );
  }, [allProducts]);


  const getFinalPrice = useCallback((product) => {
    // priceForSale đã là giá cuối (đã giảm) theo convention admin form,
    // dùng trực tiếp cho lọc theo khoảng giá và sắp xếp giá tăng/giảm dần.
    return Number(product?.priceForSale) || 0;
  }, []);


  const filterAndSort = useCallback((filters = {}, sortBy = '') => {
    let result = [...allProducts];

    if (filters.category) {
      const lowerCategory = filters.category.toLowerCase();
      result = result.filter(p => 
        p.category?.toLowerCase().includes(lowerCategory)
      );
    }

    if (filters.brands?.length > 0) {
      result = result.filter(p =>
        filters.brands.some(b => b.toLowerCase() === p.brand?.toLowerCase())
      );
    }

    if (filters.priceRanges?.length > 0) {
      result = result.filter(p => {
        const price = getFinalPrice(p);
        return filters.priceRanges.some(([min, max]) => 
          price >= min && price <= max
        );
      });
    }

    switch (sortBy) {
      case 'asc':
        result.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
        break;
      case 'desc':
        result.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
        break;
      case 'hotdeal':
        result.sort((a, b) => (b.salePercent || 0) - (a.salePercent || 0));
        break;
      case 'bestseller':
        result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      default:
        result.sort((a, b) => a.name?.localeCompare(b.name, 'vi') || 0);
    }

    return result;
  }, [allProducts, getFinalPrice]);


  const getRelatedProducts = useCallback((product, count = 4) => {
    if (!product?.category) return [];
    
    const category = product.category.toLowerCase();
    const related = allProducts.filter(p =>
      p.id !== product.id && p.category?.toLowerCase() === category
    );

    const shuffled = [...related].sort(() => Math.random() - 0.5);
    const result = shuffled.slice(0, count);
    
    dispatch(setRelatedProducts(result));
    return result;
  }, [allProducts, dispatch]);


  const selectProductForEdit = useCallback((product) => {
    dispatch(setSelectedProduct(product));
  }, [dispatch]);

  const addProduct = useCallback(async (data) => {
    return await productsService.add(data);
  }, []);

  const updateProduct = useCallback(async (id, data) => {
    await productsService.update(id, data);
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await productsService.delete(id);
  }, []);

  return {
    allProducts,
    currentProduct,
    selectedProduct,
    
    fetchAllProducts,
    getProductById,
    
    searchProducts,
    filterByCategory,
    filterAndSort,
    getRelatedProducts,
    getRelatedProductsByCategory: getRelatedProducts, 
    
    getFinalPrice,
    selectProductForEdit,
    
    addProduct,
    updateProduct,
    deleteProduct,
  };
};

export const useProductService = useProducts;

export default useProducts;
