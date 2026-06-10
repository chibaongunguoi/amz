import { ensureDir, getProjectPath } from '@/server/storage/fileStorage';

export { ensureDir, getProjectPath };

export const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

export function getImageExtension(mimeType = '') {
  const normalized = String(mimeType).toLowerCase();
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[normalized] || null;
}

export function createUploadFilename(ext) {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
}

export function getUploadPath(filename) {
  return getProjectPath('public', 'uploads', 'products', filename);
}

export function createJson(data, init = {}) {
  return Response.json(data, init);
}
