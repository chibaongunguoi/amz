import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import createIndexedDBStorage from 'redux-persist-indexeddb-storage';

import productsReducer from './slices/productsSlice';
import postsReducer from './slices/postsSlice';
import filtersReducer from './slices/filtersSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import highlightReducer from './slices/highlightSlice';


const indexedDBStorageFactory =
  typeof createIndexedDBStorage === 'function'
    ? createIndexedDBStorage
    : createIndexedDBStorage?.default;

const storage = indexedDBStorageFactory('AMZWebDB');

const rootReducer = combineReducers({
  products: productsReducer,
  posts: postsReducer,
  filters: filtersReducer,
  settings: settingsReducer,
  ui: uiReducer,
  auth: authReducer,
  highlight: highlightReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['products', 'posts', 'settings', 'auth', 'filters', 'highlight'],
  blacklist: ['ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
