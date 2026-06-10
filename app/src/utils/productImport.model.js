/**
 * Mô hình dữ liệu import sản phẩm (2 luồng tách biệt).
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ SẢN PHẨM CHA (pipe JSON trong collection theo danh mục)         │
 * │  • Khóa nghiệp vụ: maSanPham («Mã SP») — cố định, 1 SP = 1 mã  │
 * │  • Tên, thương hiệu, mô tả, ảnh, giá tổng quát…                 │
 * │  • Nạp / sửa qua: Import THEO TÊN (sheet SanPham + BienThe*)    │
 * └─────────────────────────────────────────────────────────────────┘
 *                              │
 *                              │ 1 ── N
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ BIẾN THỂ (product.variants[])                                  │
 * │  • Khóa nghiệp vụ: sku («Mã SKU») — mỗi dòng BienThe = 1 SKU   │
 * │  • Thuộc đúng một Mã SP cha                                     │
 * │  • Giá, màu, tình trạng, tồn kho theo từng SKU                 │
 * │  • Cập nhật qua: Import THEO SKU (chỉ sheet BienThe)            │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * * Sheet BienThe kèm import theo tên: gom theo Mã SP; khi UPDATE merge theo SKU
 *   (không xóa biến thể cũ nếu không có trong file).
 */

export const IMPORT_FLOW = {
  BY_NAME: 'by_name',
  BY_SKU: 'by_sku',
};

export const SHEET_PRODUCT = 'SanPham';
export const SHEET_VARIANT = 'BienThe';
