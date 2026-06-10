import { useMemo, useState, useEffect } from 'react';
import { loadCollection } from '@/lib/data';
import {
  normalizeProductDisplayCategories,
  buildLabelByCollection,
  buildCollectionByLabel,
  toSelectOptions,
  DEFAULT_PRODUCT_DISPLAY_CATEGORY_ROWS,
  PRODUCT_DISPLAY_CATEGORIES_COLLECTION,
} from '@/lib/productDisplayCategories';

export function useProductDisplayCategories() {
  const [rows, setRows] = useState(DEFAULT_PRODUCT_DISPLAY_CATEGORY_ROWS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await loadCollection(PRODUCT_DISPLAY_CATEGORIES_COLLECTION, true);
        if (cancelled) return;
        const next = normalizeProductDisplayCategories(raw);
        setRows(next.length ? next : DEFAULT_PRODUCT_DISPLAY_CATEGORY_ROWS);
      } catch {
        if (!cancelled) setRows(DEFAULT_PRODUCT_DISPLAY_CATEGORY_ROWS);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const labelByCollection = useMemo(() => buildLabelByCollection(rows), [rows]);
  const collectionByLabel = useMemo(() => buildCollectionByLabel(rows), [rows]);
  const selectOptions = useMemo(() => toSelectOptions(rows), [rows]);

  return {
    rows,
    loaded,
    labelByCollection,
    collectionByLabel,
    selectOptions,
  };
}
