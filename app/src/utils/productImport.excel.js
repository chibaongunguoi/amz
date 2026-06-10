/**
 * Import theo SKU — chỉ sheet BienThe (cập nhật biến thể).
 * Sản phẩm cha: xem productImportUpsert.excel.js (import theo tên).
 * Mô hình: @/utils/productImport.model.js
 */
import * as XLSX from 'xlsx';
import {
  CATEGORY_TO_COLLECTION,
  FIREBASE_COLLECTIONS,
  PRODUCT_COLLECTION_NAMES,
  mapSidebarUiValueToCategory,
} from '@/constants';
import { sheetToRowObjects } from '@/utils/productImport.sheet.js';

export const SHEET_PRODUCT = 'SanPham';
export const SHEET_VARIANT = 'BienThe';
export const SHEET_GUIDE = 'HuongDan';

/**
 * Cột sheet SanPham (hàng 1 = header).
 * Hỗ trợ mẫu mới: danh_muc_SP (nhãn ngắn như cột "Danh mục"), Loai_SP; vẫn đọc được mẫu cũ (danh_muc, mau_chinh, tinh_trang).
 */
/** Tiêu đề cột mẫu — «Mã SP» được chuẩn hóa thành `ma_san_pham` khi đọc file. */
export const PRODUCT_HEADERS = [
  'Mã SP',
  'thuong_hieu',
  'Loai_SP',
  'ten_san_pham',
  'danh_muc_SP',
  'gia_goc',
  'gia_ban',
  'giam_pt',
  'ban_chay',
  'mo_ta',
  'thong_so',
  'video_url',
  'post_id',
];

/**
 * Sheet BienThe — cột hiển thị (mẫu vận hành).
 * Parser chuẩn hóa về trường nội bộ: ma_san_pham (Mã SP), ma_sku (Mã SKU), …
 */
export const VARIANT_HEADERS = [
  'Mã SP',
  'Mã SKU',
  'ten_bien_the',
  'mau',
  'tinh_trang',
  'gia_goc',
  'gia_ban',
  'giam_pt',
  'ton_kho',
];

const CATEGORY_ALIASES = {
  'hàng new seal': 'Hàng newseal',
  'hang new seal': 'Hàng newseal',
  'hang newseal': 'Hàng newseal',
};

function str(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  return String(v).trim();
}

function num(v, fallback = 0) {
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function truthyBanChay(v) {
  const s = str(v).toLowerCase();
  if (s === '1' || s === 'true' || s === 'có' || s === 'co' || s === 'yes' || s === 'x') return true;
  if (typeof v === 'number' && v === 1) return true;
  if (v === true) return true;
  return false;
}

function normalizeCategoryLabel(raw) {
  let s = str(raw);
  if (!s) return '';
  s = s.replace(/\s+/g, ' ').trim();
  const low = s.toLowerCase();
  if (CATEGORY_ALIASES[low]) return CATEGORY_ALIASES[low];
  return s;
}

/**
 * Map ô danh_muc → mã collection (vd 01-nhet-tai-cu)
 */
export function resolveCollectionCode(danhMucCell) {
  const s0 = str(danhMucCell);
  if (!s0) return { code: null, error: 'Thiếu danh_muc / danh_muc_SP' };
  if (PRODUCT_COLLECTION_NAMES.includes(s0)) return { code: s0, error: null };
  const label = normalizeCategoryLabel(s0);
  let code = CATEGORY_TO_COLLECTION[label];
  if (code) return { code, error: null };
  // Nhãn ngắn sidebar (vd "Tai nghe nhét tai") → category đầy đủ trong CATEGORY_TO_COLLECTION
  const fromSidebar = mapSidebarUiValueToCategory(s0);
  if (fromSidebar && CATEGORY_TO_COLLECTION[fromSidebar]) {
    return { code: CATEGORY_TO_COLLECTION[fromSidebar], error: null };
  }
  const fromSidebarNorm = mapSidebarUiValueToCategory(label);
  if (fromSidebarNorm && CATEGORY_TO_COLLECTION[fromSidebarNorm]) {
    return { code: CATEGORY_TO_COLLECTION[fromSidebarNorm], error: null };
  }
  return {
    code: null,
    error: `Không nhận diện danh_muc / danh_muc_SP "${s0}". Dùng tên đầy đủ (vd "Tai nghe nhét tai cũ"), nhãn trong sheet Data, hoặc mã file (vd ${FIREBASE_COLLECTIONS.NHET_TAI}).`,
  };
}

/** Mã SP cha — sau chuẩn hóa header → `ma_san_pham`. */
function variantSheetParentKey(row) {
  return str(
    row.ma_san_pham ||
      row.ma_sp ||
      row.mã_sp ||
      row['mã_sp'] ||
      ''
  );
}

/** Mã SKU biến thể — sau chuẩn hóa → `ma_sku`. */
function variantSheetSku(row) {
  return str(row.ma_sku || row.sku || '');
}

function numOrUndefined(v) {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function buildVariant(row) {
  const variant = {
    id: `variant-import-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    name: str(row.ten_bien_the),
    color: str(row.mau),
    condition: str(row.tinh_trang),
    priceDefault: num(row.gia_goc, 0),
    priceForSale: num(row.gia_ban, 0),
    inventory: num(row.ton_kho, 0),
    images: [],
    sku: variantSheetSku(row),
  };
  const salePercent = numOrUndefined(row.giam_pt);
  if (salePercent !== undefined) variant.salePercent = salePercent;
  return variant;
}

/**
 * @returns {{ ok: boolean, records: object[], errors: string[], conditionLabels: string[] }}
 * records: payload giống object truyền vào productToPipeString (handleFinish result shape)
 */
function findWorksheet(wb, targetName) {
  const name = wb.SheetNames.find((n) => String(n).trim() === targetName);
  return name ? wb.Sheets[name] : null;
}

/**
 * Mỗi dòng BienThe → một payload chỉ gồm Mã SP + một biến thể (merge theo SKU ở lớp save).
 */
function recordsFromBienThePerSkuRow(variantRows, errors) {
  const records = [];
  const conditionLabels = [];

  for (const vr of variantRows) {
    const mid = variantSheetParentKey(vr);
    const sku = variantSheetSku(vr);
    const ln = vr.__line;

    if (!mid) {
      errors.push(
        typeof ln === 'number'
          ? `Dòng ${ln} sheet ${SHEET_VARIANT}: thiếu Mã SP.`
          : `Sheet ${SHEET_VARIANT}: thiếu Mã SP.`
      );
      continue;
    }
    if (!sku) {
      errors.push(
        typeof ln === 'number'
          ? `Dòng ${ln} sheet ${SHEET_VARIANT}: thiếu Mã SKU.`
          : `Sheet ${SHEET_VARIANT}: thiếu Mã SKU (Mã SP "${mid}").`
      );
      continue;
    }

    const variant = buildVariant(vr);
    if (variant.condition) conditionLabels.push(variant.condition);

    records.push({
      maSanPham: mid,
      variants: [variant],
      __line: ln,
    });
  }

  if (records.length === 0 && errors.length === 0) {
    errors.push(`Không có dòng biến thể hợp lệ trong sheet "${SHEET_VARIANT}".`);
  }

  return { records, conditionLabels };
}

/**
 * Import theo SKU — chỉ sheet BienThe; không tạo sản phẩm cha (dùng import theo tên).
 * @param {ArrayBuffer} arrayBuffer
 */
export function parseSkuImportWorkbook(arrayBuffer) {
  const errors = [];
  const warnings = [];
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const shV = findWorksheet(wb, SHEET_VARIANT);

  if (!shV) {
    errors.push(
      `Import theo SKU cần sheet "${SHEET_VARIANT}" (cột: Mã SP, Mã SKU, ten_bien_the, mau, tinh_trang, gia_goc, gia_ban, giam_pt, ton_kho).`
    );
    return { ok: false, records: [], errors, warnings, conditionLabels: [], variantRowCount: 0 };
  }

  if (findWorksheet(wb, SHEET_PRODUCT)) {
    warnings.push(
      `Sheet "${SHEET_PRODUCT}" bị bỏ qua trong luồng Import theo SKU. Dùng Import theo tên sản phẩm để nạp/sửa sản phẩm cha (Mã SP, tên, thương hiệu…).`
    );
  }

  const variantRows = sheetToRowObjects(shV, { withLine: true });
  if (!variantRows.length) {
    errors.push(`Sheet "${SHEET_VARIANT}" không có dòng dữ liệu.`);
    return { ok: false, records: [], errors, warnings, conditionLabels: [], variantRowCount: 0 };
  }

  const { records, conditionLabels } = recordsFromBienThePerSkuRow(variantRows, errors);
  const uniqueConditions = [...new Set(conditionLabels.map((s) => s.trim()).filter(Boolean))];

  return {
    ok: errors.length === 0 && records.length > 0,
    records,
    errors,
    warnings,
    conditionLabels: uniqueConditions,
    variantRowCount: variantRows.length,
  };
}

const GUIDE_LINES = [
  'IMPORT THEO SKU — Chỉ cập nhật BIẾN THỂ (sheet BienThe)',
  '',
  'Sản phẩm cha (tên, thương hiệu, mô tả, Mã SP cố định) → Import THEO TÊN (file mau-import-theo-ten-san-pham.xlsx).',
  'Biến thể (giá, màu, tồn theo từng Mã SKU) → file NÀY.',
  '',
  'Mỗi dòng BienThe = một SKU:',
  '  • Mã SKU đã có → cập nhật biến thể đó.',
  '  • Mã SKU mới + Mã SP đã có trong kho → thêm biến thể vào đúng sản phẩm cha.',
  '  • Mã SP chưa có → bỏ qua dòng (tạo SP trước bằng Import theo tên).',
  '',
  'Cột (hàng 1): Mã SP | Mã SKU | ten_bien_the | mau | tinh_trang | gia_goc | gia_ban | giam_pt | ton_kho',
  '',
  'Không dùng sheet SanPham trong file này.',
  'Ảnh biến thể: bổ sung sau trong Admin.',
];

/**
 * @param {string} [fileName='mau-import-theo-sku.xlsx']
 */
export function buildSkuImportWorkbook() {
  const wb = XLSX.utils.book_new();

  const variantHeader = [...VARIANT_HEADERS];
  const exampleVariants = [
    ['A07050217', 'A070501030217', 'Đen - 99-98% Fullbox', 'Đen', '99-98% Fullbox', 9500000, 8450000, '', 1],
    ['A11040198', 'A110401110198', 'Đen - 99-98% Fullbox VN', 'Đen', '99-98% Fullbox VN', 5800000, 5120000, '', 1],
    ['A06050415', 'A060502030415', 'Trắng - 99-98% Fullbox', 'Trắng', '99-98% Fullbox', 4000000, 3500000, '', 7],
  ];
  const wsV = XLSX.utils.aoa_to_sheet([variantHeader, ...exampleVariants]);
  wsV['!cols'] = variantHeader.map(() => ({ wch: 12 }));
  XLSX.utils.book_append_sheet(wb, wsV, SHEET_VARIANT);

  const guideAoa = GUIDE_LINES.map((line) => [line]);
  const wsG = XLSX.utils.aoa_to_sheet(guideAoa);
  wsG['!cols'] = [{ wch: 92 }];
  XLSX.utils.book_append_sheet(wb, wsG, SHEET_GUIDE);

  return wb;
}

/** @deprecated Dùng downloadProductSkuImportTemplate hoặc buildSkuImportWorkbook */
export function downloadProductImportTemplate(fileName = 'mau-import-theo-sku.xlsx') {
  XLSX.writeFile(buildSkuImportWorkbook(), fileName);
}

export function downloadProductSkuImportTemplate() {
  downloadProductImportTemplate('mau-import-theo-sku.xlsx');
}
