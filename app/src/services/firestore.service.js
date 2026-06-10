import { loadCollection, getDocumentById } from '../lib/data';

export const createFirestoreService = (collectionName) => {
  return {
    getAll: async () => {
      return await loadCollection(collectionName);
    },

    getById: async (id) => {
      return await getDocumentById(collectionName, id);
    },

    add: async (data) => {
      // Note: Chỉ return local ID, không persist
      console.warn(`add to ${collectionName}: Chỉ update local state, không persist`);
      return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    update: async (id, data) => {
      // Note: Chỉ update local state
      console.warn(`update ${collectionName}/${id}: Chỉ update local state, không persist`);
    },

    delete: async (id) => {
      // Note: Chỉ update local state
      console.warn(`delete ${collectionName}/${id}: Chỉ update local state, không persist`);
    },

    getWhere: async (field, operator, value) => {
      const allData = await loadCollection(collectionName);
      return allData.filter(item => {
        const itemValue = item[field];
        switch (operator) {
          case '==':
            return itemValue === value;
          case '!=':
            return itemValue !== value;
          case '>':
            return itemValue > value;
          case '>=':
            return itemValue >= value;
          case '<':
            return itemValue < value;
          case '<=':
            return itemValue <= value;
          case 'array-contains':
            return Array.isArray(itemValue) && itemValue.includes(value);
          default:
            return false;
        }
      });
    },

    getPaginated: async ({ pageSize = 10, lastDoc = null, sortField = 'createdAt', sortOrder = 'desc' }) => {
      const allData = await loadCollection(collectionName);
      
      // Sort data
      const sorted = [...allData].sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
      
      // Find start index if lastDoc provided
      let startIndex = 0;
      if (lastDoc) {
        startIndex = sorted.findIndex(item => item.id === lastDoc.id) + 1;
        if (startIndex === 0) startIndex = sorted.length; // Not found, return empty
      }
      
      // Get page
      const docs = sorted.slice(startIndex, startIndex + pageSize);
      const lastDocResult = docs.length > 0 ? docs[docs.length - 1] : null;
      
      return {
        docs,
        lastDoc: lastDocResult,
        hasMore: startIndex + pageSize < sorted.length,
      };
    },
  };
};

export const productsService = createFirestoreService(SERVICE_COLLECTIONS.PRODUCTS);
export const postsService = createFirestoreService(SERVICE_COLLECTIONS.POSTS);
export const homeSettingsService = createFirestoreService(SERVICE_COLLECTIONS.HOME_SETTINGS);
