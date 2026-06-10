/**
 * SKU biến thể — cấu hình trong collection `skuSegmentCodes` trên server.
 *
 * Đọc thuộc tính (thứ tự người dùng): Thương hiệu – Loại SP – Tên sản phẩm – Màu – Tình trạng
 * Ví dụ: Bose – Tai nghe True Wireless – QC Ultra Earbuds – Đen – New Seal
 *
 * Ghép mã số theo Book1 (thứ tự byte trong chuỗi 12 số):
 *   hãng(2) + loại SP(2) + màu(2) + tình trạng(2) + tên SP(4)
 * Tiền tố hãng trong bảng Book1 là A01…A31; cấu hình lưu đủ «A06» (không chỉ «06»).
 * digits2() lấy 2 chữ số cuối → Bose A06 hay "06" đều ra 06.
 * Cùng ví dụ trên → 060301010298 → SKU đầy đủ: A060301010298 (A + 12 số).
 */

export const SKU_SEGMENT_CODES_COLLECTION = 'skuSegmentCodes';

/** Chữ A đứng trước khối 12 chữ số (trùng với chữ cái đầu của mã hãng Axx) */
export const SKU_LEADING_LETTER = 'A';

export function normalizeSkuSegmentMaps(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      note: '',
      brands: {},
      loaiSp: {},
      colors: {},
      conditions: {},
      productNames: {},
    };
  }
  return {
    note: typeof raw.note === 'string' ? raw.note : '',
    brands: { ...(raw.brands || {}) },
    loaiSp: { ...(raw.loaiSp || {}) },
    colors: { ...(raw.colors || {}) },
    conditions: { ...(raw.conditions || {}) },
    productNames: { ...(raw.productNames || {}) },
  };
}

function lookupSegment(dict, rawKey) {
  if (!rawKey || !dict || typeof dict !== 'object') return '';
  const k = String(rawKey).trim();
  if (!k) return '';
  if (Object.prototype.hasOwnProperty.call(dict, k)) {
    const v = dict[k];
    return v != null && String(v).trim() !== '' ? String(v).trim() : '';
  }
  const low = k.toLowerCase();
  const found = Object.keys(dict).find((label) => label.toLowerCase() === low);
  if (found) {
    const v = dict[found];
    return v != null && String(v).trim() !== '' ? String(v).trim() : '';
  }
  return '';
}

function digits2(value, fallback = '00') {
  if (value == null || value === '') return fallback;
  const d = String(value).replace(/\D/g, '');
  if (!d) return fallback;
  return d.slice(-2).padStart(2, '0');
}

function digits4(value, fallback = '0000') {
  if (value == null || value === '') return fallback;
  const d = String(value).replace(/\D/g, '');
  if (!d) return fallback;
  return d.slice(-4).padStart(4, '0');
}

function fallbackName4(name) {
  const s = String(name || '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return String((h >>> 0) % 10000).padStart(4, '0');
}

/**
 * 12 chữ số thuần Book1: hãng + loại SP + màu + tình trạng + tên SP
 * (ctx.productName = tên sản phẩm chung trên form, map productNames).
 * Đoạn loại chỉ từ loaiSp + ctx.loaiSpLabel; không dùng danh mục website.
 */
export function buildNumericSku12(ctx, maps) {
  const m = normalizeSkuSegmentMaps(maps);
  const brandPart = digits2(lookupSegment(m.brands, ctx.brand), '00');
  const loaiPart = ctx.loaiSpLabel
    ? digits2(lookupSegment(m.loaiSp, ctx.loaiSpLabel), '00')
    : '00';

  const colorPart = digits2(lookupSegment(m.colors, ctx.color), '00');
  const condPart = digits2(lookupSegment(m.conditions, ctx.condition), '00');
  const nameRaw = lookupSegment(m.productNames, ctx.productName);
  const namePart = nameRaw ? digits4(nameRaw, '0000') : fallbackName4(ctx.productName);

  return `${brandPart}${loaiPart}${colorPart}${condPart}${namePart}`;
}

/**
 * @param {object} ctx
 * @param {string} ctx.collectionCode (không dùng cho mã SKU)
 * @param {string} ctx.categoryLabel (không dùng cho mã SKU)
 * @param {string} ctx.brand
 * @param {string} ctx.productName
 * @param {string} ctx.color
 * @param {string} ctx.condition
 * @param {string} [ctx.loaiSpLabel]
 */
export function buildVariantSku(ctx, maps) {
  const core = buildNumericSku12(ctx, maps);
  return `${SKU_LEADING_LETTER}${core}`;
}

export function applySkuToVariants(variants, ctx, maps) {
  if (!Array.isArray(variants) || variants.length === 0) return variants || [];
  return variants.map((v) => ({
    ...v,
    sku: buildVariantSku(
      {
        ...ctx,
        color: v.color,
        condition: v.condition,
      },
      maps
    ),
  }));
}
