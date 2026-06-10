import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';

// Prevent unwanted page reloads from storage events or other sources
if (typeof window !== 'undefined') {
  // Track if we're currently saving data
  window.__AMZ_IS_SAVING__ = false;
  
  // Listen to storage events but don't reload
  // Storage events fire on other tabs when localStorage/IndexedDB changes
  window.addEventListener('storage', (e) => {
    // Storage events fire on other tabs when localStorage changes
    // We don't want to reload on storage events - just log it
    console.log('📦 Storage event detected (from other tab):', e.key, e.newValue ? 'changed' : 'removed');
    // Don't reload - just log it
  }, false);
  
  // Prevent beforeunload if we're saving (though this shouldn't be needed)
  window.addEventListener('beforeunload', (e) => {
    if (window.__AMZ_IS_SAVING__) {
      console.warn('🚫 Attempted to reload during save operation');
      // Note: We can't prevent reload here, but we can log it
    }
  }, false);
}

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);