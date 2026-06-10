'use client';

import { useEffect } from 'react';

export default function ClientReadyMarker() {
  useEffect(() => {
    document.documentElement.classList.add('amz-client-ready');
    return () => document.documentElement.classList.remove('amz-client-ready');
  }, []);

  return null;
}
