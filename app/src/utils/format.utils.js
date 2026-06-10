/**
 * Format Helpers - Các hàm format hiển thị
 */
import { VIETNAMESE_CHAR_MAP } from '../constants/index.js';

/**
 * Format số điện thoại Việt Nam
 * @param {string} number - Số điện thoại
 * @returns {string} - Số đã format (0xxx.xxx.xxx)
 */
export const formatPhoneNumber = (number) => {
  if (!number) return '';
  const digits = number.replace(/\D/g, '');
  if (digits.length !== 10) return number;
  return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
};

/**
 * Format tiền tệ Việt Nam
 * @param {number} amount - Số tiền
 * @param {boolean} showCurrency - Có hiển thị đơn vị không
 * @returns {string} - Số tiền đã format
 */
export const formatCurrency = (amount, showCurrency = true) => {
  if (amount === null || amount === undefined) return '';
  
  const formatted = new Intl.NumberFormat('vi-VN').format(amount);
  return showCurrency ? `${formatted}đ` : formatted;
};

/**
 * Format phần trăm
 * @param {number} percent - Phần trăm
 * @returns {string} - Phần trăm đã format
 */
export const formatPercent = (percent) => {
  if (!percent) return '';
  return `-${percent}%`;
};

/**
 * Format ngày tháng
 * @param {Date|string} date - Ngày
 * @param {string} format - Định dạng ('short', 'long', 'datetime')
 * @returns {string} - Ngày đã format
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'datetime':
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'short':
    default:
      return d.toLocaleDateString('vi-VN');
  }
};

/**
 * Rút gọn text với ellipsis
 * @param {string} text - Text gốc
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} - Text đã rút gọn
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Tạo slug từ text
 * @param {string} text - Text gốc
 * @returns {string} - Slug
 */
export const slugify = (text) => {
  if (!text) return '';

  return text
    .toLowerCase()
    .split('')
    .map(char => VIETNAMESE_CHAR_MAP[char] || char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const formatVNPhoneNumber = formatPhoneNumber;
export const formatPrice = formatCurrency;
