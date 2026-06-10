import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { loadCollection, loadHomeSettings } from '../../lib/data';
import { STOREFRONT_PRODUCT_COLLECTIONS, FILTER_VALUES } from '../../constants';
import { parseStorefrontPipeRecord } from '@/utils/product.utils.js';

const parseRawItems = (rawItems, collectionCode) => {
  const products = [];
  rawItems.forEach((item) => {
    Object.entries(item).forEach(([id, value]) => {
      if (id === FILTER_VALUES.RESERVED_ID) return;
      const product =
        value && typeof value === 'object' && !Array.isArray(value)
          ? { ...value, id: value.id || id, collection: value.collection || collectionCode }
          : parseStorefrontPipeRecord(value, collectionCode);
      if (product) {
        product.id = product.id || id;
        products.push(product);
      }
    });
  });
  return products;
};

export const firebaseApi = createApi({
  reducerPath: 'firebaseApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Products', 'HomeSettings'],
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      async queryFn() {
        try {
          const merged = [];
          for (const collectionName of STOREFRONT_PRODUCT_COLLECTIONS) {
            const rawPages = await loadCollection(collectionName, true);
            if (!Array.isArray(rawPages)) continue;
            merged.push(...parseRawItems(rawPages, collectionName));
          }
          return { data: merged };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      providesTags: ['Products'],
    }),

    getHomeSettings: builder.query({
      async queryFn() {
        try {
          const data = await loadHomeSettings();
          return { data };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      providesTags: ['HomeSettings'],
    }),

    updateHomeSetting: builder.mutation({
      async queryFn({ id, data }) {
        try {
          // Note: Chỉ update local state, không persist vào Firebase nữa
          // Nếu cần persist, có thể implement localStorage hoặc API backend
          console.warn('updateHomeSetting: Chỉ update local state, không persist');
          return { data: { id, ...data, updatedAt: new Date().toISOString() } };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: ['HomeSettings'],
    }),

    addHomeSetting: builder.mutation({
      async queryFn(data) {
        try {
          // Note: Chỉ update local state
          const newId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.warn('addHomeSetting: Chỉ update local state, không persist');
          return { data: { id: newId, ...data, createdAt: new Date().toISOString() } };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: ['HomeSettings'],
    }),

    deleteHomeSetting: builder.mutation({
      async queryFn(id) {
        try {
          // Note: Chỉ update local state
          console.warn('deleteHomeSetting: Chỉ update local state, không persist');
          return { data: id };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: ['HomeSettings'],
    }),
  }),
});

export const {
  useGetAllProductsQuery,
  useGetHomeSettingsQuery,
  useUpdateHomeSettingMutation,
  useAddHomeSettingMutation,
  useDeleteHomeSettingMutation,
} = firebaseApi;
