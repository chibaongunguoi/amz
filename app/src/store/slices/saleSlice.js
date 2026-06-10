/**
 * Sale Slice - Quản lý thông tin khuyến mãi
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentSale: null,
  
  items: [],
};

const saleSlice = createSlice({
  name: 'sale',
  initialState,
  reducers: {
    setCurrentSale: (state, action) => {
      state.currentSale = action.payload;
    },
    
    clearCurrentSale: (state) => {
      state.currentSale = null;
    },
    
    setSales: (state, action) => {
      state.items = action.payload;
    },
    
    addSale: (state, action) => {
      state.items.push(action.payload);
    },
    
    updateSale: (state, action) => {
      const { id, data } = action.payload;
      const index = state.items.findIndex(sale => sale.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...data };
      }
    },
    
    deleteSale: (state, action) => {
      state.items = state.items.filter(sale => sale.id !== action.payload);
    },
    
    resetSale: () => initialState,
  },
});

export const selectCurrentSale = (state) => state.sale.currentSale;
export const selectSales = (state) => state.sale.items;
export const selectSaleById = (id) => (state) => 
  state.sale.items.find(sale => sale.id === id);
export const selectActiveSale = (state) => {
  const now = new Date();
  return state.sale.items.find(sale => {
    const startDate = new Date(sale.startDate);
    const endDate = new Date(sale.endDate);
    return now >= startDate && now <= endDate;
  });
};

export const {
  setCurrentSale,
  clearCurrentSale,
  setSales,
  addSale,
  updateSale,
  deleteSale,
  resetSale,
} = saleSlice.actions;

export default saleSlice.reducer;
