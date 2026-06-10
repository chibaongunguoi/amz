import { 
  COLLECTION_TO_CATEGORY, 
  CATEGORY_TO_COLLECTION,
  PRODUCT_FIELDS,
  FIREBASE_COLLECTIONS,
  CATEGORY_DISPLAY_NAMES,
  FILTER_VALUES,
  BESTSELLER_VALUES,
  PRODUCT_STATUS,
  PRODUCT_DEFAULTS,
} from '../constants/index.js';
import { slugify } from './format.utils.js';

export { PRODUCT_FIELDS } from '../constants/index.js';

export const parseProductFromArray = (data) => {
  const product = {};
  PRODUCT_FIELDS.forEach((key, index) => {
    product[key] = data[index] !== undefined ? data[index] : '';
  });
  product.category = COLLECTION_TO_CATEGORY[product.collection] || '';
  return product;
};

export const getCollectionByCategory = (category) => CATEGORY_TO_COLLECTION[category] || 'test';

export const getCategoryByCollection = (collection) => COLLECTION_TO_CATEGORY[collection] || '';

export const productToPipeString = (product, code, page) => {
  // Xác định isBestSeller: ưu tiên isbestSeller (boolean từ form), sau đó mới đến isBestSeller (string từ data)
  let isBestSellerValue = BESTSELLER_VALUES.NO;
  
  // Kiểm tra isbestSeller từ form (boolean) - ưu tiên cao nhất
  if (product.isbestSeller === true || product.isbestSeller === 'true') {
    isBestSellerValue = BESTSELLER_VALUES.YES;
  } else if (product.isbestSeller === false || product.isbestSeller === 'false') {
    isBestSellerValue = BESTSELLER_VALUES.NO;
  } else {
    // Nếu không có isbestSeller, kiểm tra isBestSeller (string '1' hoặc '0')
    if (product.isBestSeller === BESTSELLER_VALUES.YES || product.isBestSeller === '1' || product.isBestSeller === 1) {
      isBestSellerValue = BESTSELLER_VALUES.YES;
    } else {
      isBestSellerValue = BESTSELLER_VALUES.NO;
    }
  }
  
  // Serialize variants to JSON string
  let variantsString = 'null';
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    try {
      variantsString = JSON.stringify(product.variants);
    } catch (e) {
      console.error('Error serializing variants:', e);
      variantsString = 'null';
    }
  }

  const loaiSpRaw =
    product.loaiSp != null && String(product.loaiSp).trim() !== ''
      ? String(product.loaiSp).trim().replace(/\|/g, ' ')
      : 'null';

  const maSanPhamRaw =
    product.maSanPham != null && String(product.maSanPham).trim() !== ''
      ? String(product.maSanPham).trim().replace(/\|/g, ' ')
      : 'null';

  const fields = [
    code,
    page,
    product.brand || 'null',
    product.name || 'null',
    Array.isArray(product.colors) ? product.colors[0] : (product.colors || 'null'),
    product.priceForSale || 'null',
    product.priceDefault || 'null',
    product.salePercent || 'null',
    isBestSellerValue,
    Array.isArray(product.condition) ? product.condition[0] : (product.condition || 'null'),
    (() => {
      const imgs = Array.isArray(product.images) ? product.images : (typeof product.images === 'string' && product.images) ? product.images.split(';;').filter(Boolean) : [];
      return imgs.length ? transformGoogleDriveUrls(imgs).join(';;') : 'null';
    })(),
    product.description || 'null',
    'null', // legacy highlights slot (field removed from admin)
    product.tableInfo || 'null',
    product.videoUrl || 'null',
    product.post || 'null',
    variantsString, // Field 14 in slice(2) indexing
    loaiSpRaw, // Field 15: Loại SP (Book1) — không chứa ký tự |
    maSanPhamRaw, // Field 16: Mã sản phẩm (import / vận hành, vd A07050217)
  ];
  return fields.join('|');
};

export const pipeStringToProduct = (fields, code) => {
  // fields đã được slice(2) để bỏ code và page
  // Mapping: fields[0]=brand, fields[1]=name, fields[2]=color, fields[3]=priceForSale,
  //          fields[4]=priceDefault, fields[5]=salePercent, fields[6]=isBestSeller,
  //          fields[7]=condition, fields[8]=images, fields[9]=description,
  //          fields[10]=legacy highlights (always null on save), fields[11]=tableInfo, fields[12]=videoUrl, fields[13]=post,
  //          fields[14]=variants (JSON string, optional), fields[15]=loaiSp (optional),
  //          fields[16]=maSanPham (mã SP import / vận hành)
  const isBestSellerValue = fields[6] === BESTSELLER_VALUES.YES || fields[6] === '1';
  
  // Parse variants from JSON string
  let variants = [];
  if (fields[14] && fields[14] !== 'null') {
    try {
      const parsed = JSON.parse(fields[14]);
      if (Array.isArray(parsed)) {
        variants = parsed;
      }
    } catch (e) {
      console.error('Error parsing variants:', e);
      variants = [];
    }
  }
  
  return {
    brand: fields[0] || '',
    name: fields[1] || '',
    colors: fields[2] ? [fields[2]] : [],
    priceForSale: Number(fields[3]) || PRODUCT_DEFAULTS.PRICE,
    priceDefault: Number(fields[4]) || PRODUCT_DEFAULTS.PRICE,
    salePercent: Number(fields[5]) || PRODUCT_DEFAULTS.SALE_PERCENT,
    isBestSeller: fields[6] || BESTSELLER_VALUES.NO, // Giữ nguyên string '1' hoặc '0'
    isbestSeller: isBestSellerValue, // Map sang boolean cho form
    condition: fields[7] ? [fields[7]] : [],
    images: fields[8] ? fields[8].split(';;') : [],
    description: fields[9] || '',
    tableInfo: fields[11] || '',
    videoUrl: fields[12] || '',
    post: fields[13] || '',
    variants: variants,
    loaiSp:
      fields[15] != null && fields[15] !== '' && fields[15] !== 'null'
        ? String(fields[15]).trim()
        : '',
    maSanPham:
      fields[16] != null && fields[16] !== '' && fields[16] !== 'null'
        ? String(fields[16]).trim()
        : '',
    category: getCategoryByCollection(code),
  };
};

export const transformGoogleDriveUrls = (urlOrArray) => {
  const extractId = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) return url;
    const match = url.match(/(?:\/d\/|id=|\/file\/d\/|open\?id=)([a-zA-Z0-9_-]{10,})/);
    return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : url;
  };
  return Array.isArray(urlOrArray) ? urlOrArray.map(extractId) : extractId(urlOrArray);
};

export const calculateFinalPrice = (product) => {
  if (!product) return 0;
  // priceForSale đã là giá cuối (đã giảm) theo convention của admin form.
  // priceDefault chỉ dùng để hiển thị giá gốc gạch ngang, salePercent dùng cho badge.
  return Number(product.priceForSale) || 0;
};

export const isProductOnSale = (product) => product?.salePercent > 0;

export const getPrimaryColor = (product) => {
  if (Array.isArray(product?.colors) && product.colors.length > 0) return product.colors[0];
  return product?.color || null;
};

export const pipeStringToProductObject = pipeStringToProduct;

/** Chuẩn hoá SKU để so trùng (trim). */
export function normalizeSkuKey(s) {
  if (s == null) return '';
  return String(s).trim();
}

/** Các SKU không rỗng trên biến thể (dùng tìm trùng khi import / thêm SP). */
export function collectSkusFromPayload(payload) {
  const variants = Array.isArray(payload?.variants) ? payload.variants : [];
  const set = new Set();
  for (const v of variants) {
    const k = normalizeSkuKey(v.sku);
    if (k) set.add(k);
  }
  return [...set];
}

function newVariantId() {
  return `variant-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Gộp danh sách biến thể: trùng SKU → cập nhật lên bản cũ (giữ id); SKU mới → thêm;
 * biến thể cũ không có trong incoming → giữ nguyên.
 */
export function mergeVariantListsBySku(oldList, incomingList) {
  if (!Array.isArray(incomingList) || incomingList.length === 0) {
    return Array.isArray(oldList) ? [...oldList] : [];
  }
  const old = Array.isArray(oldList) ? [...oldList] : [];
  const incomingBySku = new Map();
  for (const iv of incomingList) {
    const s = normalizeSkuKey(iv.sku);
    if (s) incomingBySku.set(s, iv);
  }

  const out = [];
  const handledSku = new Set();

  for (const ov of old) {
    const s = normalizeSkuKey(ov.sku);
    if (s && incomingBySku.has(s)) {
      const inc = incomingBySku.get(s);
      out.push({
        ...ov,
        ...inc,
        id: ov.id || inc.id || newVariantId(),
        sku: s,
      });
      handledSku.add(s);
    } else {
      out.push(ov);
    }
  }

  for (const iv of incomingList) {
    const s = normalizeSkuKey(iv.sku);
    if (s) {
      if (!handledSku.has(s)) {
        out.push({ ...iv, id: iv.id || newVariantId(), sku: s });
        handledSku.add(s);
      }
    } else {
      out.push({ ...iv, id: iv.id || newVariantId() });
    }
  }
  return out;
}

const nonemptyStr = (x) => x != null && String(x).trim() !== '';

/**
 * Gộp payload form/import lên bản product đã có (bổ sung / đè phần có dữ liệu).
 * `incoming` có thể chứa thuộc tính thừa (collectionName, …) — sẽ bị bỏ qua nếu không vào out.
 */
export function mergeProductImportPayload(existing, incoming) {
  if (!existing || typeof existing !== 'object') return existing;
  const out = { ...existing };
  const inc = incoming || {};

  if (nonemptyStr(inc.brand)) out.brand = inc.brand;
  if (nonemptyStr(inc.name)) out.name = inc.name;
  if (nonemptyStr(inc.description)) out.description = inc.description;
  if (nonemptyStr(inc.tableInfo)) out.tableInfo = inc.tableInfo;
  if (nonemptyStr(inc.videoUrl)) out.videoUrl = inc.videoUrl;
  if (nonemptyStr(inc.post)) out.post = inc.post;
  if (nonemptyStr(inc.loaiSp)) out.loaiSp = inc.loaiSp;
  if (nonemptyStr(inc.maSanPham)) out.maSanPham = inc.maSanPham;
  else if (nonemptyStr(inc.ma_san_pham)) out.maSanPham = String(inc.ma_san_pham).trim();

  if (inc.colors != null) {
    if (Array.isArray(inc.colors) && inc.colors.length > 0) {
      out.colors = [...inc.colors];
    } else if (typeof inc.colors === 'string' && nonemptyStr(inc.colors)) {
      out.colors = [inc.colors.trim()];
    }
  }

  if (inc.condition != null) {
    if (Array.isArray(inc.condition) && inc.condition.length > 0) {
      out.condition = [...inc.condition];
    } else if (typeof inc.condition === 'string' && nonemptyStr(inc.condition)) {
      out.condition = [inc.condition.trim()];
    }
  }

  const numOk = (v) => v != null && v !== '' && Number.isFinite(Number(v));
  if (numOk(inc.priceForSale)) out.priceForSale = Number(inc.priceForSale);
  if (numOk(inc.priceDefault)) out.priceDefault = Number(inc.priceDefault);
  if (numOk(inc.salePercent)) out.salePercent = Number(inc.salePercent);

  if (inc.isbestSeller === true || inc.isbestSeller === false) {
    out.isbestSeller = inc.isbestSeller;
    out.isBestSeller = inc.isbestSeller ? BESTSELLER_VALUES.YES : BESTSELLER_VALUES.NO;
  } else if (inc.isBestSeller === BESTSELLER_VALUES.YES || inc.isBestSeller === BESTSELLER_VALUES.NO) {
    out.isBestSeller = inc.isBestSeller;
    out.isbestSeller = inc.isBestSeller === BESTSELLER_VALUES.YES;
  }

  if (inc.images != null) {
    if (Array.isArray(inc.images) && inc.images.length > 0) {
      out.images = transformGoogleDriveUrls([...inc.images]);
    } else if (typeof inc.images === 'string' && inc.images.includes(';;')) {
      out.images = inc.images.split(';;').filter(Boolean);
    } else if (typeof inc.images === 'string' && nonemptyStr(inc.images)) {
      out.images = [transformGoogleDriveUrls(inc.images)];
    }
  }

  if (Array.isArray(inc.variants)) {
    out.variants = mergeVariantListsBySku(existing.variants, inc.variants);
  }

  if (out.category == null && existing.category) out.category = existing.category;
  return out;
}

export const getGoogleDriveThumbnail = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) return url;
  const match = url.match(/(?:\/d\/|id=|\/file\/d\/|open\?id=)([a-zA-Z0-9_-]{10,})/);
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : url;
};

export const handleProduct = (rawData) => {
  if (!rawData) return null;
  if (Array.isArray(rawData)) return parseProductFromArray(rawData);
  return rawData;
};

export const getProductsByCollection = (allProducts, collection) => {
  if (!allProducts || !collection) return [];
  return allProducts.filter(p => p.collection === collection);
};

export const getAllTaiNgheNhetTai = (allProducts) => getProductsByCollection(allProducts, FIREBASE_COLLECTIONS.NHET_TAI);
export const getAllTaiNgheChupTai = (allProducts) => getProductsByCollection(allProducts, FIREBASE_COLLECTIONS.CHUP_TAI);
export const getAllLoaDiDong = (allProducts) => getProductsByCollection(allProducts, FIREBASE_COLLECTIONS.DI_DONG);
export const getAllLoaDeBan = (allProducts) => getProductsByCollection(allProducts, FIREBASE_COLLECTIONS.DE_BAN);
export const getAllLoaKaraoke = (allProducts) => getProductsByCollection(allProducts, FIREBASE_COLLECTIONS.KARAOKE);
export const getAllNewSealTaiNghe = (allProducts) => getProductsByCollection(allProducts, FIREBASE_COLLECTIONS.NEWSEAL);

/** Số field cố định trong pipe (khớp productToPipeString). */
const PIPE_RECORD_FIELD_COUNT = 19;

/**
 * Chuẩn hóa chuỗi pipe khi mô tả/thông số có ký tự `|` — giữ 12 field đầu + 4 field cuối cố định.
 */
export function normalizePipeProductParts(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return [];
  if (parts.length === PIPE_RECORD_FIELD_COUNT) return parts;
  if (parts.length < PIPE_RECORD_FIELD_COUNT) {
    return [...parts, ...Array(PIPE_RECORD_FIELD_COUNT - parts.length).fill('')];
  }
  const head = parts.slice(0, 12);
  const tail = parts.slice(-3);
  const mid = parts.slice(12, -3);
  const legacy = mid[0] ?? '';
  const post = mid.length > 0 ? mid[mid.length - 1] : '';
  const videoUrl = mid.length > 1 ? mid[mid.length - 2] : '';
  const tableInfo = mid.length > 2 ? mid.slice(1, -2).join('|') : mid[1] ?? '';
  return [...head, legacy, tableInfo, videoUrl, post, ...tail];
}

/**
 * Parse một dòng pipe JSON → object dùng cho shop (Redux / ProductCard).
 * `category` luôn là nhãn canonical (…cũ) để khớp menu/filter.
 */
export function parseStorefrontPipeRecord(value, collectionCode) {
  if (!value || typeof value !== 'string') return null;
  const rawParts = value.split('|').map((v) => (v === 'null' ? '' : v));
  const parts = normalizePipeProductParts(rawParts);
  const code = parts[0] || collectionCode;
  const parsed = pipeStringToProduct(parts.slice(2), code);
  if (!parsed?.name) return null;

  const resolvedCollection =
    collectionCode && COLLECTION_TO_CATEGORY[collectionCode] ? collectionCode : code;

  return {
    ...parsed,
    category: COLLECTION_TO_CATEGORY[resolvedCollection] || parsed.category || CATEGORY_DISPLAY_NAMES.DI_DONG,
    collection: resolvedCollection,
    status: PRODUCT_STATUS.ACTIVE,
  };
}

/** Giá / % giảm hiệu lực (ưu tiên biến thể có tồn). */
export function getEffectiveProductPricing(product) {
  let priceForSale = Number(product?.priceForSale) || 0;
  let priceDefault = Number(product?.priceDefault) || 0;
  let salePercent = Number(product?.salePercent) || 0;

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length > 0) {
    const v = variants.find((x) => Number(x.inventory) > 0) || variants[0];
    if (v) {
      priceForSale = Number(v.priceForSale) || priceForSale;
      priceDefault = Number(v.priceDefault) || priceDefault;
      salePercent = Number(v.salePercent) || salePercent;
    }
  }

  if (salePercent <= 0 && priceDefault > 0 && priceForSale > 0 && priceForSale < priceDefault) {
    salePercent = Math.round((1 - priceForSale / priceDefault) * 100);
  }

  return { priceForSale, priceDefault, salePercent };
}

export const parseRawProductData = (value) => {
  const parsed = parseStorefrontPipeRecord(value, null);
  if (!parsed) return null;
  return {
    ...parsed,
    inventories: PRODUCT_DEFAULTS.INVENTORY,
    tags: '',
    sku: `${parsed.brand?.replace(/\s/g, '-') || ''}-${parsed.name?.replace(/\s/g, '-') || ''}`,
    product_type: parsed.category,
  };

  // Parse variants from JSON string (field 16)
  let variants = [];
  if (variantsString && variantsString !== 'null') {
    try {
      const parsed = JSON.parse(variantsString);
      if (Array.isArray(parsed)) {
        variants = parsed;
      }
    } catch (e) {
      console.error('Error parsing variants in parseRawProductData:', e);
      variants = [];
    }
  }

  return {
    name: name || '',
    status: PRODUCT_STATUS.ACTIVE,
    isBestSeller: isBestSeller || BESTSELLER_VALUES.NO,
    colors: color ? color.split(',') : [],
    condition: condition ? [condition] : [],
    priceDefault: Number(priceDefault) || PRODUCT_DEFAULTS.PRICE,
    priceForSale: Number(priceForSale) || PRODUCT_DEFAULTS.PRICE,
    salePercent: Number(salePercent) || PRODUCT_DEFAULTS.SALE_PERCENT,
    inventories: PRODUCT_DEFAULTS.INVENTORY,
    brand: brand || '',
    category,
    tags: '',
    description: description || '',
    images: images ? images.split(';;').filter(Boolean) : [],
    tableInfo: tableInfo || '',
    sku: `${brand?.replace(/\s/g, '-') || ''}-${name?.replace(/\s/g, '-') || ''}-${color?.replace(/\s/g, '-') || ''}`,
    product_type: category,
    videoUrl: videoUrl || '',
    post: post || '',
    variants: variants,
    loaiSp:
      loaiSpPart != null && loaiSpPart !== '' && loaiSpPart !== 'null'
        ? String(loaiSpPart).trim()
        : '',
    maSanPham:
      maSanPhamPart != null && maSanPhamPart !== '' && maSanPhamPart !== 'null'
        ? String(maSanPhamPart).trim()
        : '',
  };
};

export const parseAllRawProducts = (rawItems) => {
  const products = [];
  rawItems.forEach(item => {
    Object.entries(item).forEach(([id, value]) => {
      if (id === FILTER_VALUES.RESERVED_ID) return;
      const product = parseRawProductData(value);
      if (product) {
        const parentId = item.id != null && item.id !== '' && item.id !== 'null' ? String(item.id) : '';
        product.id = parentId ? `${parentId}-${id}` : String(id);
        products.push(product);
      }
    });
  });
  return products;
};

export const createProductBaseSlug = (product) => {
  if (!product) return '';
  const nameSlug = slugify(product.name || '');
  return nameSlug.length > 100 ? nameSlug.substring(0, 100).replace(/-+$/g, '') : nameSlug;
};

export const createProductCodeSlug = (product) => {
  if (!product) return '';
  return slugify(product.maSanPham || product.ma_san_pham || product.sku || product.code || '');
};

/**
 * Tạo URL slug SEO-friendly. Slug chính chỉ dùng tên sản phẩm; khi có danh sách
 * đầy đủ, withProductSeoSlugs sẽ tự thêm mã sản phẩm rõ nghĩa cho các tên bị trùng.
 */
export const createProductSlug = (product) => {
  if (!product) return '';
  if (product.seoSlug) return String(product.seoSlug);
  return createProductBaseSlug(product) || createProductCodeSlug(product) || String(product.id || '');
};

export const withProductSeoSlugs = (products = []) => {
  if (!Array.isArray(products)) return [];

  const baseCounts = products.reduce((acc, product) => {
    const baseSlug = createProductBaseSlug(product);
    if (baseSlug) acc.set(baseSlug, (acc.get(baseSlug) || 0) + 1);
    return acc;
  }, new Map());

  const usedSlugs = new Set();
  return products.map((product) => {
    const baseSlug = createProductBaseSlug(product);
    const codeSlug = createProductCodeSlug(product);
    let seoSlug = baseSlug || codeSlug;

    if (seoSlug && baseCounts.get(baseSlug) > 1 && codeSlug) {
      seoSlug = `${baseSlug}-${codeSlug}`;
    }

    if (!seoSlug) {
      seoSlug = String(product?.id || '');
    }

    const originalSlug = seoSlug;
    let suffix = 2;
    while (seoSlug && usedSlugs.has(seoSlug)) {
      if (codeSlug && originalSlug !== `${baseSlug}-${codeSlug}`) {
        seoSlug = `${baseSlug || originalSlug}-${codeSlug}`;
      } else {
        seoSlug = `${originalSlug}-${suffix}`;
        suffix += 1;
      }
    }

    if (seoSlug) usedSlugs.add(seoSlug);
    return product && typeof product === 'object' ? { ...product, seoSlug } : product;
  });
};

/**
 * Tìm sản phẩm theo slug
 * @param {string} slug - Slug URL
 * @param {Array} allProducts - Danh sách tất cả sản phẩm
 * @returns {Object|null} - Sản phẩm tìm được hoặc null
 */
export const findProductBySlug = (slug, allProducts) => {
  if (!slug || !allProducts || allProducts.length === 0) return null;

  const normalizedSlug = String(slug);

  // Tìm bằng slug SEO mới hoặc slug đã được gắn sẵn trên dữ liệu.
  let foundProduct = allProducts.find(item => {
    const itemSlug = createProductSlug(item);
    return normalizedSlug === itemSlug;
  });

  if (!foundProduct) {
    foundProduct = allProducts.find(item => normalizedSlug === createProductBaseSlug(item));
  }

  if (!foundProduct) {
    foundProduct = allProducts.find(item => {
      const codeSlug = createProductCodeSlug(item);
      return codeSlug && (
        normalizedSlug === codeSlug ||
        normalizedSlug.endsWith(`-${codeSlug}`)
      );
    });
  }

  // Backward compatibility cho URL cũ dạng name-id.
  if (!foundProduct) {
    const slugParts = normalizedSlug.split('-');
    const possibleId = slugParts[slugParts.length - 1];
    foundProduct = allProducts.find(item => String(item.id) === String(possibleId));

    if (!foundProduct && slugParts.length > 1) {
      const possibleId2 = slugParts.slice(-2).join('-');
      foundProduct = allProducts.find(item => String(item.id) === String(possibleId2));
    }

    if (!foundProduct) {
      foundProduct = allProducts.find(item => {
        const itemId = String(item.id);
        return normalizedSlug.endsWith(`-${itemId}`) || normalizedSlug === itemId;
      });
    }
  }
  
  return foundProduct || null;
};
