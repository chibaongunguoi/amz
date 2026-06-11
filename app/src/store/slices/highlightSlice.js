// store/slices/highlightSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Khởi tạo state ban đầu
const initialState = {
  selector: null,           // Selector của phần tử đang được highlight
  isHighlighting: false,    // Trạng thái đang highlight hay không
  lastHovered: null,        // Lưu lại phần tử cuối cùng được hover
};

const highlightSlice = createSlice({
  name: 'highlight',
  initialState,
  reducers: {
    // Set highlight cho phần tử
    setHighlight: (state, action) => {
      console.log('Reducer setHighlight called with:', action.payload, 'Current state:', state.selector);
      state.selector = action.payload;
      state.isHighlighting = !!action.payload;
      console.log('Updated highlight state:', state.selector);
    },
    
    // Xóa highlight
    clearHighlight: (state) => {
      state.selector = null;
      state.isHighlighting = false;
    },
    
    // Reset toàn bộ state
    resetHighlight: () => initialState,
  },
});

// Export actions
export const { setHighlight, clearHighlight, resetHighlight } = highlightSlice.actions;

// Export selectors (có kiểm tra an toàn)
export const selectHighlightSelector = (state) => state.highlight?.selector ?? null;
export const selectIsHighlighting = (state) => state.highlight?.isHighlighting ?? false;
export const selectLastHovered = (state) => state.highlight?.lastHovered ?? null;

// Export reducer
export default highlightSlice.reducer;