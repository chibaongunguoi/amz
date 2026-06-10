import {
  collectSkusFromPayload,
  mergeProductImportPayload,
  mergeVariantListsBySku,
  normalizeSkuKey,
} from '@/utils/product.utils.js';
import { PRODUCT_COLLECTION_NAMES } from '@/constants';

function text(value) {
  if (value == null) return '';
  return String(value).trim();
}

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function arrayValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(';;')
      .flatMap((part) => part.split('\n'))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function collectionForProduct(product, fallback = '') {
  return text(product?.collection || product?.collectionName || fallback);
}

function normalizeProductPayload(product, collectionName, id) {
  const collection = collectionForProduct(product, collectionName);
  return {
    ...product,
    id: text(product?.id || id) || undefined,
    collection,
    collectionName: undefined,
    images: arrayValue(product?.images),
    colors: arrayValue(product?.colors ?? product?.color),
    condition: arrayValue(product?.condition),
    priceDefault: numberValue(product?.priceDefault),
    priceForSale: numberValue(product?.priceForSale),
    salePercent: numberValue(product?.salePercent),
    isbestSeller:
      product?.isbestSeller === true ||
      product?.isBestSeller === '1' ||
      product?.is_best_seller === true,
    variants: Array.isArray(product?.variants)
      ? product.variants.map((variant) => ({
          ...variant,
          id: text(variant.id) || undefined,
          sku: text(variant.sku),
          name: text(variant.name),
          color: text(variant.color),
          condition: text(variant.condition),
          priceDefault: numberValue(variant.priceDefault),
          priceForSale: numberValue(variant.priceForSale),
          salePercent: numberValue(variant.salePercent),
          inventory: numberValue(variant.inventory),
          images: arrayValue(variant.images),
        }))
      : [],
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `API trả về lỗi ${response.status}`);
  }
  return data;
}

async function listSqlProducts(params = {}) {
  const search = new URLSearchParams();
  if (params.collection) search.set('collection', params.collection);
  if (params.q) search.set('q', params.q);
  const qs = search.toString();
  const result = await requestJson(`/api/admin/products${qs ? `?${qs}` : ''}`);
  return Array.isArray(result.items) ? result.items : [];
}

async function upsertSqlProduct(product, options = {}) {
  const payload = normalizeProductPayload(product, options.collection, options.id);
  const id = text(options.id || payload.id);
  const url = id ? `/api/admin/products/${encodeURIComponent(id)}` : '/api/admin/products';
  const method = id ? 'PUT' : 'POST';
  const result = await requestJson(url, {
    method,
    body: JSON.stringify({
      product: payload,
      collection: options.collection || payload.collection,
    }),
  });
  return result.product;
}

async function insertSqlProduct(product, collectionName) {
  const payload = normalizeProductPayload(product, collectionName);
  delete payload.id;
  const result = await requestJson('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify({
      product: payload,
      collection: collectionName || payload.collection,
    }),
  });
  return result.product;
}

async function deleteSqlProduct(productId) {
  return requestJson(`/api/admin/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}

function replaceProduct(products, nextProduct) {
  const idx = products.findIndex((p) => p.id === nextProduct.id);
  if (idx >= 0) {
    products[idx] = nextProduct;
  } else {
    products.push(nextProduct);
  }
}

function productMatchesScope(product, collection) {
  return !collection || product.collection === collection;
}

function findBySku(products, skus, collection = '') {
  for (const sku of skus) {
    const normalized = normalizeSkuKey(sku);
    if (!normalized) continue;
    const found = products.find(
      (product) =>
        productMatchesScope(product, collection) &&
        Array.isArray(product.variants) &&
        product.variants.some((variant) => normalizeSkuKey(variant.sku) === normalized)
    );
    if (found) return found;
  }
  return null;
}

function findByMaSanPham(products, maSanPham, collection = '') {
  const key = text(maSanPham);
  if (!key) return null;
  return (
    products.find(
      (product) => productMatchesScope(product, collection) && text(product.maSanPham) === key
    ) || null
  );
}

function findByName(products, name, collection = '') {
  const key = text(name).normalize('NFC').toLowerCase();
  if (!key) return null;
  return (
    products.find(
      (product) =>
        productMatchesScope(product, collection) &&
        text(product.name).normalize('NFC').toLowerCase() === key
    ) || null
  );
}

function findProductForImportRecord(products, record, collection = '') {
  const bySku = findBySku(products, collectSkusFromPayload(record), collection);
  if (bySku) return bySku;
  return findByMaSanPham(products, record.maSanPham ?? record.ma_san_pham, collection);
}

function stripImportMetaForMerge(record = {}) {
  const { collectionName, product_type, tags, sku, __line, ...rest } = record;
  return rest;
}

function skippedDetailForRecord(record, allowInsert) {
  const skus = collectSkusFromPayload(record);
  return {
    maSanPham: text(record.maSanPham ?? record.ma_san_pham) || '—',
    sku: skus[0] || '—',
    reason: allowInsert
      ? 'Không khớp SKU/Mã SP và thiếu collectionName.'
      : 'Không tìm thấy sản phẩm (Mã SP) hoặc biến thể (Mã SKU) trong kho — dùng Import theo tên để tạo sản phẩm trước.',
  };
}

async function processAppendOrMergeBySku(importRecords, options = {}) {
  const allowInsert = options.allowInsert !== false;
  if (!Array.isArray(importRecords) || importRecords.length === 0) {
    return { added: 0, updated: 0, skipped: 0, skippedDetails: [], collectionsTouched: [] };
  }

  const products = await listSqlProducts();
  const touched = new Set();
  const skippedDetails = [];
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const record of importRecords) {
    const collectionName = text(record.collectionName);
    const target = findProductForImportRecord(products, record);

    if (target) {
      const merged = mergeProductImportPayload(target, stripImportMetaForMerge(record));
      const saved = await upsertSqlProduct(
        {
          ...merged,
          id: target.id,
          collection: target.collection,
          category: target.category,
        },
        { id: target.id, collection: target.collection }
      );
      replaceProduct(products, saved);
      touched.add(saved.collection);
      updated += 1;
      continue;
    }

    if (allowInsert && collectionName) {
      const saved = await insertSqlProduct(
        {
          ...stripImportMetaForMerge(record),
          collection: collectionName,
        },
        collectionName
      );
      replaceProduct(products, saved);
      touched.add(saved.collection);
      added += 1;
      continue;
    }

    skipped += 1;
    skippedDetails.push(skippedDetailForRecord(record, allowInsert));
  }

  return { added, updated, skipped, skippedDetails, collectionsTouched: [...touched] };
}

/**
 * Thêm một sản phẩm từ form: trùng SKU hoặc Mã SP thì merge, không trùng thì insert SQL.
 */
export async function appendOrMergeProductRecord(payload, preferredCollectionName) {
  const collectionName = text(preferredCollectionName || payload.collectionName || payload.collection);
  if (!collectionName) {
    throw new Error('Thiếu collection khi lưu sản phẩm.');
  }
  const rec = { ...payload, collectionName };
  const { added, updated } = await processAppendOrMergeBySku([rec], { allowInsert: true });
  return {
    added,
    updated,
    mergedBySku: updated > 0,
  };
}

/**
 * Lưu dữ liệu collection cấu hình vào server. Product collection không dùng hàm này nữa.
 */
export async function saveCollectionData(collectionName, data) {
  if (PRODUCT_COLLECTION_NAMES.includes(collectionName)) {
    throw new Error('Product collection đã chuyển sang SQL; hãy dùng API /api/admin/products.');
  }

  if (typeof window !== 'undefined') {
    window.__AMZ_IS_SAVING__ = true;
  }

  try {
    await requestJson(`/api/collections/${encodeURIComponent(collectionName)}`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
    return true;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API server không khả dụng. Vui lòng chạy: npm run server');
    }
    throw error;
  } finally {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.__AMZ_IS_SAVING__ = false;
      }, 100);
    }
  }
}

export async function migrateAllProductSkusViaApi(opts = {}) {
  const dryRun = Boolean(opts.dryRun);
  const force = opts.force !== false;
  const data = await requestJson('/api/admin/migrate-product-skus', {
    method: 'POST',
    body: JSON.stringify({ dryRun, force }),
  });
  if (!data.success) {
    throw new Error(data.error || 'Migrate SKU thất bại.');
  }
  return data;
}

const PRODUCT_CONDITION_PRESETS_COLLECTION = 'productConditionPresets';

export async function appendProductConditionPresets(labels) {
  const trimmed = (Array.isArray(labels) ? labels : [])
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);
  if (trimmed.length === 0) return;

  const { loadCollection, clearCollectionCache } = await import('./data.js');
  let current = await loadCollection(PRODUCT_CONDITION_PRESETS_COLLECTION, true);
  if (!Array.isArray(current)) current = [];

  const existing = new Set(
    current.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim())
  );
  for (const item of trimmed) existing.add(item);

  const next = [...existing].sort((a, b) => a.localeCompare(b, 'vi'));
  await saveCollectionData(PRODUCT_CONDITION_PRESETS_COLLECTION, next);
  clearCollectionCache(PRODUCT_CONDITION_PRESETS_COLLECTION);
}

export async function updateProductInCollection(collectionName, productId, product) {
  try {
    await upsertSqlProduct(
      {
        ...product,
        id: productId,
        collection: collectionName || product?.collection,
      },
      { id: productId, collection: collectionName || product?.collection }
    );
    return true;
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm SQL:', error);
    throw error;
  }
}

export async function deleteProductFromCollection(_collectionName, productId) {
  try {
    await deleteSqlProduct(productId);
    return true;
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm SQL:', error);
    throw error;
  }
}

export async function renameProductKeyInCollection(collectionName, _page, oldKey, newKey) {
  if (!oldKey || !newKey || oldKey === newKey) return { ok: true, newKey };
  if (newKey === 'id') {
    throw new Error('Không được đặt mã trùng tên khóa hệ thống.');
  }

  const products = await listSqlProducts({ collection: collectionName });
  const product = products.find((item) => item.id === oldKey);
  if (!product) throw new Error('Không tìm thấy sản phẩm với mã cũ.');
  if (products.some((item) => item.id === newKey)) {
    throw new Error('Mã mới đã tồn tại trong danh mục này.');
  }

  await upsertSqlProduct({ ...product, id: newKey }, { id: newKey, collection: collectionName });
  await deleteSqlProduct(oldKey);
  return { ok: true, newKey };
}

export async function batchAppendProductRecords(collectionName, records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { added: 0, updated: 0, collectionsTouched: [] };
  }
  const list = records.map((record) => ({
    ...record,
    collectionName: record.collectionName || collectionName,
  }));
  return processAppendOrMergeBySku(list, { allowInsert: true });
}

function createVariantFromPatch(patch = {}, index = 0) {
  return {
    id: `variant-import-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`,
    name: text(patch.name),
    color: text(patch.color),
    condition: text(patch.condition),
    priceDefault: numberValue(patch.priceDefault),
    priceForSale: numberValue(patch.priceForSale),
    salePercent: numberValue(patch.salePercent),
    inventory: numberValue(patch.inventory),
    images: arrayValue(patch.images),
    sku: text(patch.sku),
  };
}

function applyProductIntentPatch(oldProduct, patch, variantPatches) {
  const merged = { ...oldProduct };
  for (const [key, value] of Object.entries(patch || {})) {
    merged[key] = value;
  }

  if (Array.isArray(variantPatches) && variantPatches.length > 0) {
    const incoming = variantPatches.map((variantPatch, index) =>
      createVariantFromPatch(variantPatch, index)
    );
    merged.variants = mergeVariantListsBySku(oldProduct.variants, incoming);
  }

  return merged;
}

function findIntentTarget(products, intent) {
  if (intent.matchBy === 'id' && intent.matchValue) {
    const { collection, productKey } = intent.matchValue;
    return (
      products.find(
        (product) => product.id === productKey && productMatchesScope(product, collection)
      ) || null
    );
  }

  if (intent.matchBy !== 'lookup' || !intent.matchValue) return null;

  const scopeCollection = text(intent.matchValue.collection || intent.collectionHint);
  const byMa = findByMaSanPham(products, intent.matchValue.maSanPham, scopeCollection);
  if (byMa) return { product: byMa, matchedBy: 'ma_san_pham' };

  const byName = findByName(products, intent.matchValue.name, scopeCollection);
  if (byName) return { product: byName, matchedBy: 'ten_san_pham' };

  return null;
}

export async function batchUpsertProductIntents(intents) {
  if (!Array.isArray(intents) || intents.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0, collectionsTouched: [], details: [] };
  }

  const products = await listSqlProducts();
  const touched = new Set();
  const details = [];
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const intent of intents) {
    const target = findIntentTarget(products, intent);
    const targetProduct = target?.product || target;

    if (targetProduct) {
      let merged = applyProductIntentPatch(targetProduct, intent.patch, intent.variantPatches);
      if (target?.matchedBy === 'ten_san_pham') {
        const maFromSheet = text(intent.patch?.maSanPham);
        if (maFromSheet) merged = { ...merged, maSanPham: maFromSheet };
      }

      const saved = await upsertSqlProduct(
        {
          ...merged,
          id: targetProduct.id,
          collection: targetProduct.collection,
          category: targetProduct.category,
        },
        { id: targetProduct.id, collection: targetProduct.collection }
      );
      replaceProduct(products, saved);
      touched.add(saved.collection);
      updated += 1;
      details.push({
        line: intent.line,
        status: 'updated',
        id: saved.id,
        matchedBy: intent.matchBy === 'id' ? 'id_sql' : target?.matchedBy || 'lookup',
      });
      continue;
    }

    const targetCollection = text(intent.collectionHint || intent.matchValue?.collection);
    if (!targetCollection) {
      details.push({
        line: intent.line,
        status: 'skipped',
        reason:
          'Không khớp mã SP / tên sản phẩm với dữ liệu cũ và thiếu danh_muc → không thể insert.',
      });
      skipped += 1;
      continue;
    }

    const fresh = applyProductIntentPatch(
      {
        collection: targetCollection,
        variants: [],
      },
      intent.patch,
      intent.variantPatches
    );
    const saved = await insertSqlProduct(fresh, targetCollection);
    replaceProduct(products, saved);
    touched.add(saved.collection);
    inserted += 1;
    details.push({
      line: intent.line,
      status: 'inserted',
      id: saved.id,
      matchedBy: 'insert',
    });
  }

  return {
    inserted,
    updated,
    skipped,
    collectionsTouched: [...touched],
    details,
  };
}

export async function batchAppendProductRecordsGrouped(importRecords) {
  if (!Array.isArray(importRecords) || importRecords.length === 0) {
    return { added: 0, updated: 0, skipped: 0, skippedDetails: [], collectionsTouched: [] };
  }
  return processAppendOrMergeBySku(importRecords, { allowInsert: true });
}

export async function batchMergeVariantsBySkuImport(importRecords) {
  if (!Array.isArray(importRecords) || importRecords.length === 0) {
    return { added: 0, updated: 0, skipped: 0, skippedDetails: [], collectionsTouched: [] };
  }
  return processAppendOrMergeBySku(importRecords, { allowInsert: false });
}

export async function getCollectionData(collectionName) {
  if (PRODUCT_COLLECTION_NAMES.includes(collectionName)) {
    const products = await listSqlProducts({ collection: collectionName });
    return products;
  }

  const { loadCollection } = await import('./data.js');
  const data = await loadCollection(collectionName, true);
  return Array.isArray(data) ? data : [];
}

export function exportChangesFromLocalStorage() {
  console.warn('exportChangesFromLocalStorage is deprecated. Data is now saved directly to server.');
  return {};
}

export function clearLocalStorageChanges() {
  console.warn('clearLocalStorageChanges is deprecated. Data is now saved directly to server.');
}
