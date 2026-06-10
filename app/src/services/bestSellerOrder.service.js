/**
 * Quản lý thứ tự sản phẩm bán chạy.
 * Nguồn chính là collection server `bestSellerOrder`; localStorage chỉ là cache/fallback.
 * Cấu trúc: { _global: { productId: order }, "Tai nghe nhét tai cũ": { productId: order }, ... }
 */

const STORAGE_KEY = 'bestSellerOrder';
const COLLECTION_NAME = 'bestSellerOrder';
const EVENT_NAME = 'amz:bestseller-order-updated';

let cachedOrder = null;

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeData(value) {
  if (!isPlainObject(value)) return {};
  if (!('_global' in value) && Object.keys(value).some((key) => Number.isFinite(Number(value[key])))) {
    return { _global: value };
  }
  return value;
}

function notifyOrderUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

const getLocalData = (convertLegacy = true) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let data = stored ? JSON.parse(stored) : {};
    if (!isPlainObject(data)) data = {};
    if (convertLegacy) data = normalizeData(data);
    return data;
  } catch (error) {
    console.error('Error loading best seller order:', error);
  }
  return {};
};

const setLocalData = (data) => {
  try {
    const normalized = normalizeData(data);
    cachedOrder = normalized;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    notifyOrderUpdated();
    return true;
  } catch (error) {
    console.error('Error saving best seller order:', error);
    return false;
  }
};

const getFullData = () => cachedOrder || getLocalData();

export const BEST_SELLER_ORDER_EVENT = EVENT_NAME;

export async function loadBestSellerOrderFromServer() {
  if (typeof fetch !== 'function') return getFullData();

  try {
    const response = await fetch(`/api/collections/${COLLECTION_NAME}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`API trả về lỗi ${response.status}`);
    const data = normalizeData(await response.json());
    setLocalData(data);
    return data;
  } catch (error) {
    console.warn('Không tải được thứ tự bán chạy từ server:', error);
    return getFullData();
  }
}

async function saveFullDataToServer(data) {
  const normalized = normalizeData(data);
  setLocalData(normalized);

  const response = await fetch(`/api/collections/${COLLECTION_NAME}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: normalized }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `API trả về lỗi ${response.status}`);
  }

  return true;
}

export const getBestSellerOrder = (category) => {
  const key = category || '_global';
  return getFullData()[key] || {};
};

export const saveBestSellerOrderPart = (category, orderMap) => {
  const data = getFullData();
  data[category || '_global'] = orderMap;
  return setLocalData(data);
};

export async function saveBestSellerOrderPartOnServer(category, orderMap) {
  const data = getFullData();
  data[category || '_global'] = orderMap;
  return saveFullDataToServer(data);
}

export const updateProductOrder = (productId, order) => {
  const orderMap = getBestSellerOrder();
  orderMap[productId] = order;
  return saveBestSellerOrderPart(null, orderMap);
};

export const updateMultipleProductOrders = (products, category) => {
  const orderMap = {};
  products.forEach(({ id, order }) => {
    if (id) orderMap[id] = order;
  });
  return saveBestSellerOrderPart(category || null, orderMap);
};

export async function updateMultipleProductOrdersOnServer(products, category) {
  const orderMap = {};
  products.forEach(({ id, order }) => {
    if (id) orderMap[id] = order;
  });
  return saveBestSellerOrderPartOnServer(category || null, orderMap);
}

export const removeProductOrder = (productId) => {
  const orderMap = getBestSellerOrder();
  delete orderMap[productId];
  return saveBestSellerOrderPart(null, orderMap);
};

export const getProductOrder = (productId, category) => {
  const orderMap = getBestSellerOrder(category);
  return orderMap[productId] ?? null;
};

export const resetBestSellerOrder = (category) => {
  try {
    if (category != null && category !== '') {
      const data = getFullData();
      delete data[category];
      return setLocalData(data);
    }
    cachedOrder = {};
    localStorage.removeItem(STORAGE_KEY);
    notifyOrderUpdated();
    return true;
  } catch (error) {
    console.error('Error resetting best seller order:', error);
    return false;
  }
};

export async function resetBestSellerOrderOnServer(category) {
  const data = getFullData();
  if (category != null && category !== '') {
    delete data[category];
    return saveFullDataToServer(data);
  }
  return saveFullDataToServer({});
}
