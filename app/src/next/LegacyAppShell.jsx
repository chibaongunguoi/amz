'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import App from '@/App.jsx';
import { store, persistor } from '@/store';

export default function LegacyAppShell() {
  useEffect(() => {
    window.__AMZ_IS_SAVING__ = false;

    const handleStorage = (event) => {
      console.log(
        'Storage event detected:',
        event.key,
        event.newValue ? 'changed' : 'removed'
      );
    };

    const handleBeforeUnload = () => {
      if (window.__AMZ_IS_SAVING__) {
        console.warn('Attempted to unload during save operation');
      }
    };

    window.addEventListener('storage', handleStorage, false);
    window.addEventListener('beforeunload', handleBeforeUnload, false);

    return () => {
      window.removeEventListener('storage', handleStorage, false);
      window.removeEventListener('beforeunload', handleBeforeUnload, false);
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  );
}
