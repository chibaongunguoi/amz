import { createSlice, createSelector } from '@reduxjs/toolkit';
import { getCategoryGroup, FILTER_VALUES, BESTSELLER_VALUES, PRODUCT_DEFAULTS, PRODUCT_STATUS } from '../../constants';
import { getEffectiveProductPricing } from '../../utils/product.utils.js';
import { getBestSellerOrder } from '../../services/bestSellerOrder.service';

const initialState = {
  items: [],
  bestSellerFilter: '',
  onSaleFilter: '',
  currentProduct: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setAllProducts: (state, action) => { state.items = action.payload; },
    setCurrentProduct: (state, action) => { state.currentProduct = action.payload; },
    clearCurrentProduct: (state) => { state.currentProduct = null; },
    setBestSellerFilter: (state, action) => {
      state.bestSellerFilter = state.bestSellerFilter === action.payload ? '' : action.payload;
    },
    setOnSaleFilter: (state, action) => {
      state.onSaleFilter = state.onSaleFilter === action.payload ? '' : action.payload;
    },
    resetFilters: (state) => { state.bestSellerFilter = ''; state.onSaleFilter = ''; },
    resetProducts: () => initialState,
  },
});

const selectProductsState = (state) => state.products;

export const selectAllProducts = createSelector(
  selectProductsState,
  (products) => products.items || []
);

export const selectProductsByCategory = (category) => createSelector(
  selectAllProducts,
  (products) => (!category || category === FILTER_VALUES.ALL_PRODUCTS) ? products : products.filter(p => p.category === category)
);

export const selectBestSellers = createSelector(
  selectAllProducts,
  (products) => {
    // Sản phẩm bán chạy là sản phẩm được bật thẻ bán chạy
    // Chỉ lấy sản phẩm có isBestSeller = '1' (string) hoặc 1 (number)
    const seenIds = new Set();
    const filtered = products.filter((p) => {
      // Phải có ID hợp lệ
      const productId = p.id || p._id;
      if (!productId || typeof productId !== 'string') {
        return false;
      }
      
      // Loại bỏ trùng lặp dựa trên ID
      if (seenIds.has(productId)) {
        return false;
      }
      
      // Chỉ lấy sản phẩm active (mặc định là active nếu không có status)
      if (p.status && p.status !== PRODUCT_STATUS.ACTIVE) {
        return false;
      }
      
      // Kiểm tra isBestSeller - chỉ chấp nhận '1' (string) hoặc 1 (number)
      // Không kiểm tra isbestSeller vì field này không tồn tại trong dữ liệu thực tế
      const isBestSeller = p.isBestSeller === BESTSELLER_VALUES.YES || 
                           p.isBestSeller === '1' || 
                           p.isBestSeller === 1;
      
      if (isBestSeller) {
        seenIds.add(productId);
        return true;
      }
      
      return false;
    });
    return filtered;
  }
);

export const selectOnSaleProducts = createSelector(
  selectAllProducts,
  (products) =>
    products.filter((p) => {
      const { salePercent, priceForSale, priceDefault } = getEffectiveProductPricing(p);
      return salePercent > 0 || (priceDefault > 0 && priceForSale > 0 && priceForSale < priceDefault);
    })
);

export const selectBestSellerFilter = (state) => state.products.bestSellerFilter;
export const selectOnSaleFilter = (state) => state.products.onSaleFilter;
export const selectCurrentProduct = (state) => state.products.currentProduct;

export const selectFilteredBestSellers = createSelector(
  [selectBestSellers, selectBestSellerFilter],
  (products, filter) => {
    // Lọc theo category nếu có filter
    let filtered = filter 
      ? products.filter((p) => {
          if (!p.category) return false;
          const categoryGroup = getCategoryGroup(p.category);
          return categoryGroup === filter;
        })
      : products;
    
    // Sắp xếp theo thứ tự đã lưu
    const orderMap = getBestSellerOrder();
    filtered = [...filtered].sort((a, b) => {
      const orderA = orderMap[a.id] ?? Infinity;
      const orderB = orderMap[b.id] ?? Infinity;
      
      // Nếu cả hai đều có order, sắp xếp theo order
      if (orderA !== Infinity && orderB !== Infinity) {
        return orderA - orderB;
      }
      
      // Nếu chỉ một trong hai có order, đưa lên trước
      if (orderA !== Infinity) return -1;
      if (orderB !== Infinity) return 1;
      
      // Cả hai đều không có order, giữ nguyên thứ tự ban đầu
      return 0;
    });
    
    return filtered;
  }
);

export const selectFilteredOnSale = createSelector(
  [selectOnSaleProducts, selectOnSaleFilter],
  (products, filter) => filter ? products.filter((p) => getCategoryGroup(p.category) === filter) : products
);

export const selectProductById = (id) => (state) => state.products.items.find((p) => p.id === id);

export const selectRelatedProducts = (productId, category, limit = 4) => createSelector(
  selectAllProducts,
  (products) => category ? products.filter(p => p.id !== productId && p.category === category).slice(0, limit) : []
);

export const selectUniqueBrands = createSelector(
  selectAllProducts,
  (products) => [...new Set(products.map(p => p.brand).filter(Boolean))].sort()
);

export const {
  setAllProducts,
  setCurrentProduct,
  clearCurrentProduct,
  setBestSellerFilter,
  setOnSaleFilter,
  resetFilters,
  resetProducts,
} = productsSlice.actions;

export default productsSlice.reducer;
