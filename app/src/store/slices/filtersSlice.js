import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  category: null,
  brands: [],
  priceRanges: [],
  priceRangeType: null,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCategory: (state, action) => { state.category = action.payload; },
    setBrands: (state, action) => { state.brands = action.payload; },
    addBrand: (state, action) => {
      if (!state.brands.includes(action.payload)) state.brands.push(action.payload);
    },
    removeBrand: (state, action) => {
      state.brands = state.brands.filter(brand => brand !== action.payload);
    },
    setPriceRanges: (state, action) => { state.priceRanges = action.payload; },
    addPriceRange: (state, action) => {
      const exists = state.priceRanges.some(
        range => range.min === action.payload.min && range.max === action.payload.max
      );
      if (!exists) state.priceRanges.push(action.payload);
    },
    removePriceRange: (state, action) => {
      state.priceRanges = state.priceRanges.filter(
        range => range.min !== action.payload.min || range.max !== action.payload.max
      );
    },
    setPriceRangeType: (state, action) => { state.priceRangeType = action.payload; },
    resetFilters: (state) => { state.brands = []; state.priceRanges = []; state.priceRangeType = null; },
    clearAllFilters: () => initialState,
  },
});

export const selectCategory = (state) => state.filters.category;
export const selectBrands = (state) => state.filters.brands;
export const selectPriceRanges = (state) => state.filters.priceRanges;
export const selectPriceRangeType = (state) => state.filters.priceRangeType;
export const selectHasActiveFilters = (state) => state.filters.brands.length > 0 || state.filters.priceRanges.length > 0;

export const {
  setCategory, setBrands, addBrand, removeBrand,
  setPriceRanges, addPriceRange, removePriceRange, setPriceRangeType,
  resetFilters, clearAllFilters,
} = filtersSlice.actions;

export const resetFilter = resetFilters;

export default filtersSlice.reducer;
