import { FIREBASE_COLLECTIONS } from '@/constants';

/** Ảnh sidebar/header mặc định theo collection */
export const COLLECTION_TO_NAV_IMAGE = {
  [FIREBASE_COLLECTIONS.NHET_TAI]: 'item11.png',
  [FIREBASE_COLLECTIONS.CHUP_TAI]: 'item10.png',
  [FIREBASE_COLLECTIONS.DI_DONG]: 'item9.png',
  [FIREBASE_COLLECTIONS.DE_BAN]: 'item8.png',
  [FIREBASE_COLLECTIONS.KARAOKE]: 'item7.png',
};

function sortDisplayRows(rows) {
  return [...rows].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      String(a.label || '').localeCompare(String(b.label || ''), 'vi')
  );
}

/** Cấu hình menu “Hàng cũ…” (không JSX) */
export function buildMainNavItemConfigs(rows) {
  const sorted = sortDisplayRows(rows);
  const main = sorted
    .filter((r) => r.collection !== FIREBASE_COLLECTIONS.NEWSEAL)
    .map((r) => ({
      kind: 'category',
      imageKey: COLLECTION_TO_NAV_IMAGE[r.collection] || 'item11.png',
      label: r.label,
      filterValue: r.label,
      collection: r.collection,
    }));

  const thuCu = {
    kind: 'exchange',
    imageKey: 'item6.png',
    label: 'Thu cũ đổi mới',
    filterValue: 'Thu cũ đổi mới',
  };

  return [...main, thuCu];
}

/** “Khám phá thêm” — không còn mục Hàng newseal */
export function buildExploreNavItemConfigs(_rows) {
  return [
    { kind: 'sale', imageKey: 'item4.png', label: 'Khuyến mãi hot' },
    { kind: 'warranty', imageKey: 'item3.png', label: 'Bảo hành - sửa chữa' },
    { kind: 'posts', imageKey: 'item2.png', label: 'Bài viết' },
  ];
}
