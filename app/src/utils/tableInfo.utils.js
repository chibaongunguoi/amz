/**
 * Table Info Parser - Parse dữ liệu thông số sản phẩm
 */

/**
 * Parse tableInfo array thành string để lưu trữ
 * @param {Array} tableInfo - Array of {key, value} objects
 * @returns {string} - String format: "key1::value1;;key2::value2"
 */
export const tableInfoToString = (tableInfo) => {
  if (!Array.isArray(tableInfo)) return '';

  return tableInfo
    .map(item => {
      const key = item.key?.trim();
      const value = item.value?.trim();
      if (!key || !value) return null;
      return `${key}::${value}`;
    })
    .filter(Boolean)
    .join(';;');
};

/**
 * Parse string thành tableInfo array
 * @param {string} tableString - String format: "key1::value1;;key2::value2"
 * @returns {Array} - Array of {key, value} objects
 */
export const stringToTableInfo = (tableString) => {
  if (typeof tableString !== 'string' || !tableString.includes('::')) {
    return [];
  }

  return tableString
    .split(';;')
    .map(pair => {
      const [key, value] = pair.split('::');
      return {
        key: key?.trim() || '',
        value: value?.trim() || '',
      };
    })
    .filter(item => item.key && item.value);
};
