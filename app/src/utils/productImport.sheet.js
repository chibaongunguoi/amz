/**
 * Đọc sheet Excel → mảng object với tiêu đề cột đã chuẩn hóa.
 * Dùng cho Import theo SKU (SanPham + BienThe) và Import theo tên (upsert).
 */
import * as XLSX from 'xlsx';

/**
 * Chuẩn hóa một ô tiêu đề cột → tên trường nội bộ cố định.
 *
 * Luồng «Import theo SKU» (mẫu vận hành):
 * - «Mã SP», ma sp, ma_san_pham → `ma_san_pham` (liên kết với sheet SanPham)
 * - «Mã SKU», mã sku, ma_sku, sku → `ma_sku` (khóa trùng khi merge theo SKU biến thể)
 */
export function canonicalImportHeader(raw) {
  const s = String(raw ?? '')
    .normalize('NFC')
    .trim();
  if (!s) return '';
  const lowerUnderscore = s.toLowerCase().replace(/\s+/g, '_');
  const spaceForm = s.toLowerCase().replace(/\s+/g, ' ').trim();

  if (
    lowerUnderscore === 'ma_san_pham' ||
    spaceForm === 'mã sp' ||
    spaceForm === 'ma sp' ||
    lowerUnderscore === 'mã_sp' ||
    lowerUnderscore === 'ma_sp'
  ) {
    return 'ma_san_pham';
  }

  if (
    lowerUnderscore === 'sku' ||
    lowerUnderscore === 'ma_sku' ||
    lowerUnderscore === 'mã_sku' ||
    spaceForm === 'mã sku' ||
    spaceForm === 'ma sku'
  ) {
    return 'ma_sku';
  }

  return lowerUnderscore;
}

/**
 * @param {import('xlsx').WorkSheet | null | undefined} sheet
 * @param {{ withLine?: boolean }} [opts]
 * @returns {Record<string, unknown>[]}
 */
export function sheetToRowObjects(sheet, opts = {}) {
  const withLine = Boolean(opts.withLine);
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rows.length) return [];
  const header = rows[0].map((h) => canonicalImportHeader(String(h ?? '').trim()));
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const line = rows[r];
    if (!line || !line.some((c) => String(c ?? '').trim() !== '')) continue;
    const o = withLine ? { __line: r + 1 } : {};
    header.forEach((key, i) => {
      if (!key) return;
      o[key] = line[i];
    });
    out.push(o);
  }
  return out;
}
