import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  loadingMessage: null,
  error: null,
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsLoading: (state, action) => { state.isLoading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    clearError: (state) => { state.error = null; },
    setLoading: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.isLoading = action.payload;
      } else {
        state.isLoading = action.payload.isLoading;
        state.loadingMessage = action.payload.message || null;
      }
    },
    startLoading: (state, action) => { state.isLoading = true; state.loadingMessage = action.payload || null; },
    stopLoading: (state) => { state.isLoading = false; state.loadingMessage = null; },
    setSidebarCollapsed: (state, action) => { state.sidebarCollapsed = action.payload; },
    toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    resetUI: () => initialState,
  },
});

export const selectIsLoading = (state) => state.ui.isLoading;
export const selectLoadingMessage = (state) => state.ui.loadingMessage;
export const selectError = (state) => state.ui.error;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;

export const { setIsLoading, setError, clearError, setLoading, startLoading, stopLoading, setSidebarCollapsed, toggleSidebar, resetUI } = uiSlice.actions;

export default uiSlice.reducer;
