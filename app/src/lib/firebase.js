// Firebase đã được thay thế bằng data service từ JSON files
// File này chỉ để tương thích ngược với các import cũ

// Mock auth object (nếu cần cho authSlice)
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    // Mock: không có user nào đăng nhập
    callback(null);
    return () => {}; // unsubscribe function
  },
};

// Mock db object (không còn sử dụng, nhưng giữ để tránh lỗi import)
export const db = {
  // Empty object để tương thích
};

// Mock app
const app = {};

export default app;
