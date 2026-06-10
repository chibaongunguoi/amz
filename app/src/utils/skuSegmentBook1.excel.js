/**
 * Import bảng mã SKU từ `public/raws/Book1.xlsx` (hoặc file cùng bố cục).
 *
 * Hàng 1: tiêu đề (ô A1 = "Hãng"). Từ hàng 2:
 * - Cột A–B: mã hãng (vd A01) + tên hãng → brands[tên] = «A01»…«A31» (khớp cột SKU prefix Book1)
 * - C–D: mã + Loại SP → loaiSp
 * - E–F: mã + Màu sắc → colors
 * - G–H: mã + Tình trạng → conditions
 * - I–J: mã tên SP (4 số) + Tên SP → productNames
 *
 * Các cột sau (Bảo hành, Quy tắc, …) bị bỏ qua — chỉ đồng bộ 5 map phục vụ SKU (A + 12 chữ số Book1).
 */
import * as XLSX from 'xlsx';

function str(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return String(v).trim();
}

function toCode2(cell) {
  const d = str(cell).replace(/\D/g, '');
  if (!d) return '';
  return d.slice(-2).padStart(2, '0');
}

/** Cột hãng Book1: A01…A31 → lưu nguyên dạng tiền tố «A» + 2 số (khớp bảng SKU prefix) */
function toBrandSkuPrefix(cell) {
  const two = toCode2(cell);
  if (!two) return '';
  return `A${two}`;
}

function toCode4(cell) {
  const d = str(cell).replace(/\D/g, '');
  if (!d) return '';
  return d.slice(-4).padStart(4, '0');
}

function isHeaderRow(row) {
  if (!row || !row.length) return true;
  const a = str(row[0]).toLowerCase();
  return a === 'hãng' || a === 'hang';
}

function setSegment(map, label, code, segmentName, rowNum, conflicts) {
  const lab = str(label);
  const cod = str(code);
  if (!lab || !cod) return;
  const prev = map[lab];
  if (prev != null && prev !== cod) {
    conflicts.push(
      `Dòng ${rowNum} [${segmentName}]: «${lab}» đã có mã «${prev}», file có «${cod}»`
    );
    return;
  }
  map[lab] = cod;
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {{ ok: boolean, errors: string[], warnings: string[], maps: object, dataRows: number }}
 */
export function parseSkuSegmentBook1Workbook(arrayBuffer) {
  const errors = [];
  const warnings = [];

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    return {
      ok: false,
      errors: ['File rỗng.'],
      warnings: [],
      maps: null,
      dataRows: 0,
    };
  }

  let wb;
  try {
    wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  } catch (e) {
    return {
      ok: false,
      errors: [`Không đọc được file Excel: ${e?.message || e}`],
      warnings: [],
      maps: null,
      dataRows: 0,
    };
  }

  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return {
      ok: false,
      errors: ['File không có sheet.'],
      warnings: [],
      maps: null,
      dataRows: 0,
    };
  }

  const matrix = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: '',
  });

  const brands = {};
  const loaiSp = {};
  const colors = {};
  const conditions = {};
  const productNames = {};
  const conflicts = [];

  let dataRows = 0;
  let skippedEmpty = 0;

  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    const excelRow = i + 1;

    if (!Array.isArray(row) || isHeaderRow(row)) continue;

    const hasAny =
      str(row[0]) ||
      str(row[1]) ||
      str(row[2]) ||
      str(row[3]) ||
      str(row[4]) ||
      str(row[5]) ||
      str(row[6]) ||
      str(row[7]) ||
      str(row[8]) ||
      str(row[9]);
    if (!hasAny) {
      skippedEmpty++;
      continue;
    }

    dataRows++;

    const bPrefix = toBrandSkuPrefix(row[0]);
    const bLabel = str(row[1]);
    if (bLabel && bPrefix) {
      setSegment(brands, bLabel, bPrefix, 'Thương hiệu', excelRow, conflicts);
    } else if (bLabel && !bPrefix) {
      conflicts.push(`Dòng ${excelRow} [Thương hiệu]: có tên «${bLabel}» nhưng không suy ra được tiền tố Axx từ cột A`);
    }

    const loCode = toCode2(row[2]);
    const loLabel = str(row[3]);
    if (loLabel && loCode) {
      setSegment(loaiSp, loLabel, loCode, 'Loại SP', excelRow, conflicts);
    } else if (loLabel && !loCode) {
      conflicts.push(`Dòng ${excelRow} [Loại SP]: có nhãn «${loLabel}» nhưng thiếu mã 2 số (cột C)`);
    }

    const coCode = toCode2(row[4]);
    const coLabel = str(row[5]);
    if (coLabel && coCode) {
      setSegment(colors, coLabel, coCode, 'Màu sắc', excelRow, conflicts);
    } else if (coLabel && !coCode) {
      conflicts.push(`Dòng ${excelRow} [Màu sắc]: có nhãn «${coLabel}» nhưng thiếu mã 2 số (cột E)`);
    }

    const cdCode = toCode2(row[6]);
    const cdLabel = str(row[7]);
    if (cdLabel && cdCode) {
      setSegment(conditions, cdLabel, cdCode, 'Tình trạng', excelRow, conflicts);
    }

    const pnCode = toCode4(row[8]);
    const pnLabel = str(row[9]);
    if (pnLabel && pnCode) {
      setSegment(productNames, pnLabel, pnCode, 'Tên SP', excelRow, conflicts);
    } else if (pnLabel && !pnCode) {
      conflicts.push(`Dòng ${excelRow} [Tên SP]: có «${pnLabel}» nhưng thiếu mã 4 số (cột I)`);
    }
  }

  if (skippedEmpty > 0) {
    warnings.push(`Đã bỏ qua ${skippedEmpty} dòng trống.`);
  }

  if (dataRows === 0) {
    errors.push('Không có dòng dữ liệu (chỉ thấy header hoặc sheet trống).');
  }

  const allErrors = [...errors, ...conflicts];
  const maps = {
    brands,
    loaiSp,
    colors,
    conditions,
    productNames,
  };

  return {
    ok: allErrors.length === 0 && dataRows > 0,
    errors: allErrors,
    warnings,
    maps,
    dataRows,
  };
}
