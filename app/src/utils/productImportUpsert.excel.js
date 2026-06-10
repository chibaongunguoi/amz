/**
 * Import sản phẩm số lượng lớn (UPSERT) — mọi trường đều có thể để trống.
 *
 * Quy tắc xác định insert / update (xác minh kép khi không có `id`):
 *   1) Cột `id` Redux → update đúng bản ghi đó.
 *   2) Không có `id`: (a) trùng `ma_san_pham` (Mã SP) với DB → update;
 *      (b) không trùng mã: chỉ khi `ten_san_pham` khớp hoàn toàn với tên trong DB (chuẩn hóa) → update, kèm cập nhật `ma_san_pham` trong sheet nếu có;
 *      (c) không khớp cả hai → INSERT (cần `danh_muc` để chọn collection sản phẩm).
 *   3) Row trống → bỏ qua.
 *
 * Khi UPDATE: trường nào trống trong Excel sẽ giữ nguyên giá trị cũ.
 * Khi INSERT: trường trống sẽ dùng default ('null' khi serialize).
 */
import * as XLSX from 'xlsx';
import {
  CATEGORY_TO_COLLECTION,
  PRODUCT_COLLECTION_NAMES,
  COLLECTION_TO_CATEGORY,
  BESTSELLER_VALUES,
} from '@/constants';
import { resolveCollectionCode as resolveImportCollectionFromCell } from '@/utils/productImport.excel.js';
import { sheetToRowObjects } from '@/utils/productImport.sheet.js';

export const SHEET_PRODUCT = 'SanPham';
export const SHEET_VARIANT = 'BienThe';
export const SHEET_GUIDE = 'HuongDan';

/** Header sheet SanPham — tất cả optional. `id` để update theo Redux ID. */
export const PRODUCT_HEADERS = [
  'id',
  'ma_san_pham',
  'danh_muc',
  'thuong_hieu',
  'ten_san_pham',
  'mau_chinh',
  'tinh_trang',
  'gia_goc',
  'gia_ban',
  'giam_pt',
  'ban_chay',
  'mo_ta',
  'thong_so',
  'video_url',
  'post_id',
  'images',
];

/** Header sheet BienThe — biến thể (gắn vào SP cha theo Mã SP; mỗi dòng một Mã SKU). */
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
  'images',
];

const CATEGORY_ALIASES = {
  'hàng new seal': 'Hàng newseal',
  'hang new seal': 'Hàng newseal',
  'hang newseal': 'Hàng newseal',
};

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

const str = (v) => {
  if (isBlank(v)) return '';
  if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  return String(v).trim();
};

const numOrNull = (v) => {
  if (isBlank(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const truthyBanChay = (v) => {
  if (isBlank(v)) return null; // null = không thay đổi (update giữ nguyên)
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'có', 'co', 'yes', 'x'].includes(s)) return true;
  if (['0', 'false', 'không', 'khong', 'no', '-'].includes(s)) return false;
  if (typeof v === 'number') return v === 1;
  if (v === true) return true;
  if (v === false) return false;
  return null;
};

const splitImagesCell = (v) => {
  if (isBlank(v)) return null;
  return String(v)
    .split(/[;\n]+|;;/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/**
 * Chuẩn hoá ô `thong_so`: cho phép viết nhiều dòng (mỗi dòng 1 cặp) thay vì
 * phải dồn `;;` một dòng dài. Vẫn giữ tương thích ngược với format `key::v;;k::v`.
 *
 *   Loại :: In-ear
 *   Pin :: 8h
 *   ↓ trở thành ↓
 *   Loại::In-ear;;Pin::8h
 */
const normalizeThongSoCell = (v) => {
  if (isBlank(v)) return null;
  const text = String(v).trim();
  // Tách theo `;;` hoặc xuống dòng, rồi chuẩn hoá khoảng trắng quanh `::`
  const parts = text
    .split(/\s*;;\s*|\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const normalized = [];
  for (const p of parts) {
    if (!p.includes('::')) continue;
    const idx = p.indexOf('::');
    const key = p.slice(0, idx).trim();
    const value = p.slice(idx + 2).trim();
    if (!key || !value) continue;
    normalized.push(`${key}::${value}`);
  }
  return normalized.length > 0 ? normalized.join(';;') : '';
};

function normalizeCategoryLabel(raw) {
  let s = str(raw);
  if (!s) return '';
  s = s.replace(/\s+/g, ' ').trim();
  const low = s.toLowerCase();
  return CATEGORY_ALIASES[low] || s;
}

/** Map ô danh_muc / danh_muc_SP → mã collection. Trả về null nếu không nhận diện được. */
export function resolveCollectionCode(danhMucCell) {
  const r = resolveImportCollectionFromCell(danhMucCell);
  return r.code || null;
}

/** Tách Redux ID ("{collection}-{pageKey}-{productKey}") thành các thành phần. */
export function parseReduxProductId(rawId) {
  const id = str(rawId);
  if (!id) return null;
  const collection = PRODUCT_COLLECTION_NAMES.find((c) => id.startsWith(`${c}-`));
  if (!collection) return null;
  const rest = id.slice(collection.length + 1);
  const dash = rest.indexOf('-');
  if (dash <= 0) return null;
  const pageKey = rest.slice(0, dash); // vd "page1"
  const productKey = rest.slice(dash + 1); // vd "1734567890"
  if (!/^page\d+$/.test(pageKey) || !productKey) return null;
  return { collection, pageKey, productKey };
}

/**
 * Gán nhóm biến thể BienThe (key = ma_san_pham cha) vào dòng SanPham chỉ có ten_san_pham
 * (chưa có ma trên SanPham) theo thứ tự dòng — để import theo tên không bị reject chỉ vì
 * chưa trùng mã trên sheet; mã từ BienThe được đưa vào patch.maSanPham cho bước cập nhật DB.
 * @param {{ line: number, matchBy?: string, patch: object, variantPatches: unknown, matchValue: object, rowMaEmpty: boolean }[]} intents
 * @param {Map<string, object[]>} variantPatchMap
 */
function attachOrphanVariantPatches(intents, variantPatchMap) {
  const needVariants = intents
    .filter(
      (it) =>
        it.matchBy === 'lookup' &&
        !it.variantPatches?.length &&
        it.rowMaEmpty === true &&
        (it.matchValue?.name || it.patch?.name)
    )
    .sort((a, b) => a.line - b.line);
  const orphanKeys = [...variantPatchMap.keys()]
    .filter((k) => (variantPatchMap.get(k) || []).length > 0)
    .sort((a, b) => String(a).localeCompare(String(b), 'vi'));
  const n = Math.min(needVariants.length, orphanKeys.length);
  for (let i = 0; i < n; i += 1) {
    const oid = orphanKeys[i];
    const list = variantPatchMap.get(oid);
    const intent = needVariants[i];
    intent.variantPatches = list;
    if (!intent.patch.maSanPham && oid != null && String(oid).trim() !== '') {
      intent.patch.maSanPham = String(oid).trim();
    }
    if (intent.matchBy === 'lookup' && intent.matchValue) {
      intent.matchValue.maSanPham = intent.patch.maSanPham || intent.matchValue.maSanPham || null;
    }
    variantPatchMap.delete(oid);
  }
}

function buildVariantPatch(row) {
  const patch = {};
  if (!isBlank(row.ten_bien_the)) patch.name = str(row.ten_bien_the);
  if (!isBlank(row.mau)) patch.color = str(row.mau);
  if (!isBlank(row.tinh_trang)) patch.condition = str(row.tinh_trang);
  const skuCell = str(row.ma_sku || row.sku || row['mã_sku'] || '');
  if (!isBlank(skuCell)) patch.sku = skuCell;
  const pd = numOrNull(row.gia_goc);
  if (pd !== null) patch.priceDefault = pd;
  const pf = numOrNull(row.gia_ban);
  if (pf !== null) patch.priceForSale = pf;
  const sp = numOrNull(row.giam_pt);
  if (sp !== null) patch.salePercent = sp;
  const inv = numOrNull(row.ton_kho);
  if (inv !== null) patch.inventory = inv;
  const imgs = splitImagesCell(row.images);
  if (imgs !== null) patch.images = imgs;
  return patch;
}

/**
 * Parse workbook → mảng "intent" upsert (chưa biết khớp DB ra sao, lớp save sẽ quyết định).
 * @returns {{ ok:boolean, intents: object[], errors: string[], warnings?: string[], conditionLabels: string[] }}
 */
export function parseProductUpsertWorkbook(arrayBuffer) {
  const fatalErrors = [];
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const findSheet = (name) => {
    const found = wb.SheetNames.find((n) => String(n).trim() === name);
    return found ? wb.Sheets[found] : null;
  };
  const shP = findSheet(SHEET_PRODUCT);
  const shV = findSheet(SHEET_VARIANT);

  if (!shP) {
    return {
      ok: false,
      intents: [],
      errors: [`Thiếu sheet "${SHEET_PRODUCT}".`],
      warnings: [],
      conditionLabels: [],
    };
  }

  const productRows = sheetToRowObjects(shP, { withLine: true });
  const variantRows = shV ? sheetToRowObjects(shV) : [];

  // Gom variants theo ma_san_pham. Mỗi variant là patch (chỉ có field người dùng điền).
  const variantPatchMap = new Map();
  for (const vr of variantRows) {
    const mid = str(vr.ma_san_pham || vr.ma_sp || vr['mã_sp'] || '');
    if (!mid) continue;
    if (!variantPatchMap.has(mid)) variantPatchMap.set(mid, []);
    variantPatchMap.get(mid).push(buildVariantPatch(vr));
  }

  const intents = [];
  const conditionLabels = [];
  const seenMa = new Set();

  for (const row of productRows) {
    const line = row.__line;
    const idCell = str(row.id);
    const ma = str(row.ma_san_pham);
    const danhMuc = str(row.danh_muc || row.danh_muc_sp);
    const collectionCode = danhMuc ? resolveCollectionCode(danhMuc) : null;
    if (danhMuc && !collectionCode) {
      fatalErrors.push(
        `Dòng ${line}: không nhận diện danh_muc "${danhMuc}". Dùng tên đầy đủ (vd "Tai nghe nhét tai cũ") hoặc mã file (${PRODUCT_COLLECTION_NAMES.join(', ')}).`
      );
      continue;
    }
    if (ma) {
      if (seenMa.has(ma)) {
        fatalErrors.push(`Dòng ${line}: trùng ma_san_pham "${ma}" trong sheet ${SHEET_PRODUCT}.`);
        continue;
      }
      seenMa.add(ma);
    }

    // Xây patch chỉ chứa field người dùng điền (để khi update giữ nguyên field trống).
    const patch = {};
    if (!isBlank(row.thuong_hieu)) patch.brand = str(row.thuong_hieu);
    if (!isBlank(row.ten_san_pham)) patch.name = str(row.ten_san_pham);
    if (!isBlank(row.mau_chinh)) patch.colors = [str(row.mau_chinh)];
    if (!isBlank(row.tinh_trang)) patch.condition = [str(row.tinh_trang)];
    const pd = numOrNull(row.gia_goc);
    if (pd !== null) patch.priceDefault = pd;
    const pf = numOrNull(row.gia_ban);
    if (pf !== null) patch.priceForSale = pf;
    const sp = numOrNull(row.giam_pt);
    if (sp !== null) patch.salePercent = sp;
    const bc = truthyBanChay(row.ban_chay);
    if (bc !== null) {
      patch.isBestSeller = bc ? BESTSELLER_VALUES.YES : BESTSELLER_VALUES.NO;
      patch.isbestSeller = bc; // ghi đè cả 2 vì productToPipeString ưu tiên isbestSeller
    }
    if (!isBlank(row.mo_ta)) patch.description = str(row.mo_ta);
    const ts = normalizeThongSoCell(row.thong_so);
    if (ts !== null && ts !== '') patch.tableInfo = ts;
    if (!isBlank(row.video_url)) patch.videoUrl = str(row.video_url);
    if (!isBlank(row.post_id)) patch.post = str(row.post_id);
    if (!isBlank(row.loai_sp)) patch.loaiSp = str(row.loai_sp);
    if (!isBlank(row.ma_san_pham)) patch.maSanPham = str(row.ma_san_pham);
    const imgs = splitImagesCell(row.images);
    if (imgs !== null) patch.images = imgs;

    // Variants patch (nếu có)
    let variantPatches = null;
    if (ma && variantPatchMap.has(ma)) {
      variantPatches = variantPatchMap.get(ma);
      variantPatchMap.delete(ma);
    }

    // Thu thập condition labels cho preset
    if (patch.condition?.[0]) conditionLabels.push(patch.condition[0]);
    if (variantPatches) {
      for (const vp of variantPatches) {
        if (vp.condition) conditionLabels.push(vp.condition);
      }
    }

    // Resolve match strategy: id Redux > (ma_san_pham > ten_san_pham) trong lớp save
    let matchBy = null;
    let matchValue = null;
    if (idCell) {
      const parsed = parseReduxProductId(idCell);
      if (!parsed) {
        fatalErrors.push(
          `Dòng ${line}: id "${idCell}" không đúng định dạng "{danh_muc}-pageN-{productKey}".`
        );
        continue;
      }
      matchBy = 'id';
      matchValue = parsed; // { collection, pageKey, productKey }
    } else {
      const tenSanPhamLookup = str(row.ten_san_pham);
      matchBy = 'lookup';
      matchValue = {
        maSanPham: ma || null,
        name: tenSanPhamLookup || null,
        collection: collectionCode || null,
      };
    }

    // Row trống không có gì để insert/update — bỏ qua.
    const hasAnyData =
      Object.keys(patch).length > 0 ||
      (variantPatches && variantPatches.length > 0);
    if (!hasAnyData && !idCell) {
      continue;
    }

    intents.push({
      line,
      collectionHint: collectionCode, // gợi ý collection khi insert
      matchBy, // 'id' | 'lookup' (ma → tên → insert)
      matchValue,
      patch,
      variantPatches,
      rowMaEmpty: !ma,
    });
  }

  attachOrphanVariantPatches(intents, variantPatchMap);

  const warnings = [];
  for (const [orphanId, list] of variantPatchMap) {
    if (list.length) {
      warnings.push(
        `Sheet ${SHEET_VARIANT}: nhóm biến thể theo ma_san_pham cha "${orphanId}" chưa gán được tới dòng SanPham — hãy điền cùng mã trên SanPham, hoặc (import theo tên) để trống ma_san_pham trên SanPham và có ten_san_pham, thứ tự dòng khớp với nhóm BienThe.`
      );
    }
  }

  if (intents.length === 0 && fatalErrors.length === 0) {
    fatalErrors.push(`Không có dòng nào có dữ liệu trong sheet "${SHEET_PRODUCT}".`);
  }

  return {
    ok: fatalErrors.length === 0 && intents.length > 0,
    intents,
    errors: fatalErrors,
    warnings,
    conditionLabels: [...new Set(conditionLabels.map((s) => s.trim()).filter(Boolean))],
  };
}

const GUIDE_LINES = [
  'IMPORT THEO TÊN SẢN PHẨM (UPSERT) — Xác minh kép: Mã SP → Tên SP → id Redux',
  '',
  'Cách khớp (ưu tiên từ trên xuống):',
  '  - Cột id (Redux): luôn update đúng một bản ghi (bỏ qua xác minh kép).',
  '  - Không có id: (1) Trùng ma_san_pham (Mã SP) với dữ liệu → UPDATE.',
  '              (2) Không trùng mã: chỉ khi ten_san_pham khớp hoàn toàn với tên trong kho (chuẩn hóa; không phân biệt hoa thường) → UPDATE; nếu có ma_san_pham → cập nhật mã SP cho đúng sản phẩm.',
  '              (3) Không trùng cả hai → INSERT (cần danh_muc để chọn file).',
  '  - Phạm vi tìm: theo danh_muc nếu có, không thì tìm khắp mọi file sản phẩm.',
  '',
  'NGUYÊN TẮC CHUNG:',
  '  - Mọi cột đều có thể để trống.',
  '  - id Redux (nếu có) → update đúng bản ghi; id dạng: {ma_danh_muc}-pageN-{productKey}.',
  '  - Không có id: khớp ma_san_pham trước, không được thì khớp ten_san_pham, rồi mới insert.',
  '  - Khi UPDATE, ô trống sẽ giữ nguyên giá trị cũ trong DB.',
  '',
  'CỘT TRONG SHEET SanPham:',
  '  id            (tuỳ chọn) Redux ID để update chính xác.',
  '  ma_san_pham   (tuỳ chọn) Mã nội bộ trong file để liên kết với sheet BienThe.',
  '  danh_muc      (khuyên dùng) Tên đầy đủ hoặc mã file (vd 01-nhet-tai-cu).',
  '  thuong_hieu   (tuỳ chọn)',
  '  ten_san_pham  (tuỳ chọn)',
  '  mau_chinh     (tuỳ chọn) Màu mặc định (1 màu). Nhiều màu nên dùng sheet BienThe.',
  '  tinh_trang    (tuỳ chọn) vd "New Seal", "99% Fullbox", "98% Nobox".',
  '  gia_goc       (số)  Giá niêm yết.',
  '  gia_ban       (số)  Giá đang bán cho khách.',
  '  giam_pt       (số)  Phần trăm giảm. Nếu để trống → tự tính từ gia_goc/gia_ban.',
  '  ban_chay      Giá trị nhận: 1, 0, có, không, true, false.',
  '  mo_ta         "Đặc điểm nổi bật" trên trang chi tiết. Hỗ trợ HTML (<b>, <ul>, <br>, ...).',
  '  thong_so      Bảng "Thông số kỹ thuật". Hai cách viết tương đương:',
  '                  (a) Một dòng:  Loại::In-ear;;Pin::8h;;Chống nước::IPX4',
  '                  (b) Nhiều dòng (Alt+Enter trong cell, dễ đọc hơn):',
  '                        Loại :: In-ear',
  '                        Pin :: 8h liên tục, 32h với case',
  '                        Chống nước :: IPX4',
  '                Tránh dùng "::" hoặc ";;" trong nội dung giá trị.',
  '                value chấp nhận HTML: vd "Bluetooth <b>5.3</b>".',
  '  video_url     URL YouTube (vd https://youtu.be/xxx hoặc /watch?v=xxx).',
  '  post_id       ID bài viết blog đính kèm (nếu có).',
  '  images        Nhiều URL phân tách bằng ";;" hoặc xuống dòng (Alt+Enter).',
  '',
  'SHEET BienThe (biến thể — gắn SP cha bằng Mã SP, mỗi dòng một Mã SKU):',
  '  - Import theo tên + BienThe: khi UPDATE, biến thể merge theo Mã SKU (trùng SKU → cập nhật;',
  '    SKU mới → thêm vào SP; biến thể cũ không có trong file vẫn giữ).',
  '  - Cập nhật giá/tồn hàng loạt sau này: dùng file mau-import-theo-sku.xlsx (chỉ BienThe).',
  '  - Có thể để trống ma_san_pham trên SanPham nhưng có ten_san_pham; BienThe dùng mã cha —',
  '    gán theo thứ tự dòng (số nhóm BienThe = số dòng SanPham chỉ có tên).',
  '  - Cột images (variant): nhiều URL phân tách ";;" hoặc xuống dòng.',
  '',
  'DANH MỤC HỢP LỆ (cột danh_muc — gõ tên đầy đủ hoặc mã file):',
  ...Object.keys(CATEGORY_TO_COLLECTION).map((k) => `  - ${k}    →   ${CATEGORY_TO_COLLECTION[k]}`),
];

const SAMPLE_DESCRIPTION_HTML = [
  '<h3>Tai nghe Sony WF-1000XM5 — đỉnh cao chống ồn 2024</h3>',
  '<ul>',
  '  <li><b>Chống ồn chủ động</b> bằng chip QN2e &amp; HD QN1 thế hệ mới.</li>',
  '  <li>Driver Dynamic 8.4mm cho âm bass mạnh, treble chi tiết.</li>',
  '  <li>Pin 8 giờ liên tục, tổng 24 giờ với hộp sạc.</li>',
  '  <li>Sạc nhanh: 3 phút dùng 1 giờ. Chuẩn chống nước IPX4.</li>',
  '  <li>Bluetooth 5.3, hỗ trợ LDAC &amp; multipoint 2 thiết bị.</li>',
  '</ul>',
].join('');

const SAMPLE_THONG_SO = [
  'Loại :: In-ear chống ồn chủ động',
  'Driver :: Dynamic 8.4mm',
  'Kết nối :: Bluetooth 5.3, LDAC, AAC, SBC',
  'Pin :: 8h tai + 16h case (24h tổng)',
  'Sạc nhanh :: 3 phút dùng 1 giờ',
  'Chống nước :: IPX4',
  'Trọng lượng :: 5.9g/tai, 39g case',
  'Phụ kiện :: 4 cỡ ear-tip, cáp USB-C',
  'Bảo hành :: 6 tháng tại AMZ Tech',
].join('\n');

const SAMPLE_IMAGES = [
  'https://example.com/uploads/sony-wf1000xm5-1.jpg',
  'https://example.com/uploads/sony-wf1000xm5-2.jpg',
  'https://example.com/uploads/sony-wf1000xm5-3.jpg',
].join('\n');

export function downloadProductUpsertTemplate(fileName = 'mau-import-theo-ten-san-pham.xlsx') {
  const wb = XLSX.utils.book_new();

  const exampleProductRows = [
    PRODUCT_HEADERS,
    // === DÒNG 1: Sản phẩm mẫu ĐẦY ĐỦ — insert mới, dùng tham chiếu nhanh ===
    [
      '',                                  // id: trống → INSERT (vì chưa có sản phẩm này)
      'SONY-WF1000XM5',                    // ma_san_pham: liên kết với sheet BienThe
      'Tai nghe nhét tai cũ',              // danh_muc
      'Sony',                              // thuong_hieu
      'Tai nghe Sony WF-1000XM5 chính hãng', // ten_san_pham
      'Đen',                               // mau_chinh (chỉ định màu mặc định; nhiều màu → sheet BienThe)
      '99% Fullbox',                       // tinh_trang
      4990000,                             // gia_goc
      3590000,                             // gia_ban
      28,                                  // giam_pt (cũng có thể để trống, hệ thống tự tính)
      1,                                   // ban_chay (1/0/có/không/true/false)
      SAMPLE_DESCRIPTION_HTML,             // mo_ta — Đặc điểm nổi bật, HỖ TRỢ HTML
      SAMPLE_THONG_SO,                     // thong_so — viết nhiều dòng (Alt+Enter), Loại :: Giá trị
      'https://youtu.be/A2VpR3z3Yxs',      // video_url
      '',                                  // post_id (id bài blog đính kèm — nếu có)
      SAMPLE_IMAGES,                       // images — nhiều URL, mỗi URL 1 dòng
    ],
    // === DÒNG 2: UPDATE chính xác bằng id (cập nhật chỉ giá bán + tắt cờ bán chạy) ===
    [
      '01-nhet-tai-cu-page1-1734567890',   // id (lấy từ Admin)
      '', '', '', '', '', '', '',
      3290000,                             // gia_ban: chỉ đổi field này
      '',
      0,                                   // tắt bán chạy
      '', '', '', '', '',
    ],
    // === DÒNG 3: UPDATE/INSERT theo (brand + name + color) — không cần id ===
    [
      '',
      '',
      'Tai nghe nhét tai cũ',              // gợi ý danh_muc để khớp nhanh trong 1 file
      'Sony',
      'Tai nghe Sony WF-1000XM5 chính hãng',
      'Trắng',                             // khớp được với sản phẩm trắng (nếu đã có)
      '',
      '',
      '',
      '',
      '',
      '',
      'Bộ nhớ :: 256GB\nMàn hình :: AMOLED 6.1"', // ví dụ thong_so trên 1 dòng riêng
      '',
      '',
      '',
    ],
  ];
  const wsP = XLSX.utils.aoa_to_sheet(exampleProductRows);
  // Ô mo_ta + thong_so + images bật wrapText để dễ đọc trong Excel
  const wrapCols = ['mo_ta', 'thong_so', 'images'].map((h) => PRODUCT_HEADERS.indexOf(h));
  for (let r = 1; r < exampleProductRows.length; r++) {
    for (const c of wrapCols) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (wsP[cellRef]) {
        wsP[cellRef].s = { alignment: { wrapText: true, vertical: 'top' } };
      }
    }
  }
  wsP['!cols'] = PRODUCT_HEADERS.map((h) => {
    if (h === 'mo_ta') return { wch: 60 };
    if (h === 'thong_so') return { wch: 50 };
    if (h === 'images') return { wch: 50 };
    if (h === 'id') return { wch: 36 };
    if (h === 'ten_san_pham') return { wch: 30 };
    if (h === 'video_url') return { wch: 30 };
    return { wch: 16 };
  });
  // Hàng có mo_ta dài cần row height lớn hơn để hiển thị
  wsP['!rows'] = exampleProductRows.map((_, idx) => (idx === 1 ? { hpt: 220 } : { hpt: 28 }));
  XLSX.utils.book_append_sheet(wb, wsP, SHEET_PRODUCT);

  // === Sheet BienThe: 3 biến thể đầy đủ cho sản phẩm mẫu ở dòng 1 ===
  const exampleVariantRows = [
    VARIANT_HEADERS,
    [
      'SONY-WF1000XM5',
      'SONY-WF1000XM5-DEN-FB',
      'Sony WF-1000XM5 Đen - 99% Fullbox',
      'Đen',
      '99% Fullbox',
      4990000, 3590000, 28, 5,
      'https://example.com/uploads/sony-wf1000xm5-den-1.jpg\nhttps://example.com/uploads/sony-wf1000xm5-den-2.jpg',
    ],
    [
      'SONY-WF1000XM5',
      'SONY-WF1000XM5-TR-NB',
      'Sony WF-1000XM5 Trắng - 98% Nobox',
      'Trắng',
      '98% Nobox',
      4990000, 3290000, 34, 3,
      'https://example.com/uploads/sony-wf1000xm5-trang-1.jpg',
    ],
    [
      'SONY-WF1000XM5',
      'SONY-WF1000XM5-BAC-NS',
      'Sony WF-1000XM5 Bạc - New Seal',
      'Bạc',
      'New Seal',
      4990000, 4490000, 10, 2,
      '',
    ],
  ];
  const wsV = XLSX.utils.aoa_to_sheet(exampleVariantRows);
  wsV['!cols'] = VARIANT_HEADERS.map((h) => {
    if (h === 'ten_bien_the') return { wch: 36 };
    if (h === 'Mã SKU') return { wch: 22 };
    if (h === 'images') return { wch: 50 };
    return { wch: 16 };
  });
  XLSX.utils.book_append_sheet(wb, wsV, SHEET_VARIANT);

  const wsG = XLSX.utils.aoa_to_sheet(GUIDE_LINES.map((line) => [line]));
  wsG['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, wsG, SHEET_GUIDE);

  XLSX.writeFile(wb, fileName);
}

/** Cùng nội dung với import UPSERT; tên file mặc định nhấn mạnh khớp theo tên SP. */
export function downloadProductNameImportTemplate() {
  downloadProductUpsertTemplate('mau-import-theo-ten-san-pham.xlsx');
}

/** Cùng parser; dùng cho import theo tên (lookup Mã SP → tên / id Redux). */
export const parseNameImportWorkbook = parseProductUpsertWorkbook;

/**
 * Tiện ích: từ object sản phẩm Redux + collection → tạo header row gợi ý cho user
 * (không bắt buộc dùng, để mở rộng tính năng "Export hiện trạng" sau).
 */
export function productToTemplateRow(p, collection) {
  const cat = COLLECTION_TO_CATEGORY[collection] || '';
  return {
    id: p.id || '',
    ma_san_pham: '',
    danh_muc: cat,
    thuong_hieu: p.brand || '',
    ten_san_pham: p.name || '',
    mau_chinh: Array.isArray(p.colors) ? p.colors[0] : (p.colors || ''),
    tinh_trang: Array.isArray(p.condition) ? p.condition[0] : (p.condition || ''),
    gia_goc: p.priceDefault ?? '',
    gia_ban: p.priceForSale ?? '',
    giam_pt: p.salePercent ?? '',
    ban_chay: p.isBestSeller === BESTSELLER_VALUES.YES || p.isbestSeller === true ? 1 : 0,
    mo_ta: p.description || '',
    thong_so: p.tableInfo || '',
    video_url: p.videoUrl || '',
    post_id: p.post || '',
    images: Array.isArray(p.images) ? p.images.join(';;') : (p.images || ''),
  };
}
