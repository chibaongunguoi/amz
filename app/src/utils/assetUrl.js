export function assetUrl(asset) {
  if (!asset) return '';
  if (typeof asset === 'string') return asset;
  if (typeof asset.src === 'string') return asset.src;
  return '';
}

export function assetList(src) {
  const list = Array.isArray(src) ? src : src ? [src] : [];
  return list.map(assetUrl).filter(Boolean);
}
