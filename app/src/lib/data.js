// Frontend data facade. Component chỉ gọi collection API, không đọc trực tiếp file storage.
import { STOREFRONT_PRODUCT_COLLECTIONS, SERVICE_COLLECTIONS } from '../constants';

// Cache để tránh load lại nhiều lần
const dataCache = {};

/**
 * Load data từ API collection
 * @param {string} fileName - Tên collection
 * @param {boolean} forceReload - Force reload từ server, bypass cache
 */
async function loadCollectionApi(fileName, forceReload = false) {
  if (!forceReload && dataCache[fileName]) {
    return dataCache[fileName];
  }

  try {
    // Thêm cache busting nếu force reload
    const cacheBuster = forceReload ? `?t=${Date.now()}` : '';
    const response = await fetch(`/api/collections/${encodeURIComponent(fileName)}${cacheBuster}`, {
      // Luôn no-cache để tránh trình duyệt dùng bản JSON cũ sau khi Admin đã lưu (checkbox, ô input, v.v.)
      cache: 'no-cache'
    });
    if (!response.ok) {
      // Nếu file không tồn tại, return empty array (silent fail)
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to load collection ${fileName}: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Nếu response không phải JSON (có thể là HTML), return empty array (silent fail)
      return [];
    }
    const data = await response.json();
    let result;
    if (Array.isArray(data)) {
      result = data;
    } else if (data !== null && typeof data === 'object') {
      result = data;
    } else {
      result = [];
    }
    dataCache[fileName] = result;
    return result;
  } catch (error) {
    // Nếu lỗi parse JSON (có thể là HTML), return empty array (silent fail)
    if (error instanceof SyntaxError) {
      return [];
    }
    // Chỉ log error nếu không phải 404
    if (!error.message?.includes('404')) {
      console.error(`Error loading collection ${fileName}:`, error);
    }
    return [];
  }
}

/**
 * Load tất cả products từ các collections
 */
export async function loadAllProducts() {
  const allProducts = [];
  
  for (const collectionName of STOREFRONT_PRODUCT_COLLECTIONS) {
    const data = await loadCollectionApi(collectionName);
    allProducts.push(...data);
  }
  
  return allProducts;
}

/**
 * Load data từ một collection cụ thể
 * Chỉ load từ API server, không sử dụng localStorage
 * @param {string} collectionName - Tên collection
 * @param {boolean} forceReload - Force reload từ server, bypass cache
 */
export async function loadCollection(collectionName, forceReload = false) {
  return await loadCollectionApi(collectionName, forceReload);
}

/**
 * Load home settings
 */
export async function loadHomeSettings() {
  return await loadCollectionApi(SERVICE_COLLECTIONS.HOME_SETTINGS);
}

/**
 * Load posts
 */
export async function loadPosts() {
  return await loadCollectionApi(SERVICE_COLLECTIONS.POSTS);
}

/**
 * Clear cache (nếu cần reload data)
 */
export function clearDataCache() {
  Object.keys(dataCache).forEach(key => delete dataCache[key]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('amz:products-updated'));
  }
}

/**
 * Xóa cache của một collection (sau khi Admin lưu để lần đọc tiếp theo lấy bản mới)
 */
export function clearCollectionCache(collectionName) {
  delete dataCache[collectionName];
}

/**
 * Get document by ID từ collection
 */
export async function getDocumentById(collectionName, id) {
  const data = await loadCollection(collectionName);
  return data.find(item => item.id === id) || null;
}

/**
 * Simulate real-time updates (optional - có thể implement với polling)
 */
export function subscribeToCollection(collectionName, callback) {
  // Load initial data
  loadCollection(collectionName).then(callback);
  
  // Return unsubscribe function
  return () => {
    // Cleanup nếu cần
  };
}
