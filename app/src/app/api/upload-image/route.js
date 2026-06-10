import {
  MAX_IMAGE_SIZE,
  createJson,
  createUploadFilename,
  ensureDir,
  getImageExtension,
  getUploadPath,
} from '../_lib/storage';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { image } = await request.json();
    if (!image || typeof image !== 'string') {
      return createJson({ error: 'Thieu anh base64' }, { status: 400 });
    }

    const match = image.match(/^data:(image\/(?:jpeg|jpg|png|gif|webp));base64,/i);
    if (!match) {
      return createJson(
        { error: 'Sai dinh dang anh. Chi chap nhan JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    const ext = getImageExtension(match[1]);
    if (!ext) {
      return createJson({ error: 'Loai anh khong duoc ho tro' }, { status: 400 });
    }

    const base64 = image.replace(/^data:image\/(?:jpeg|jpg|png|gif|webp);base64,/i, '');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > MAX_IMAGE_SIZE) {
      return createJson({ error: 'Anh vuot qua gioi han 15MB' }, { status: 413 });
    }

    const filename = createUploadFilename(ext);
    const filePath = getUploadPath(filename);
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, buffer);

    return createJson({ url: `/uploads/products/${filename}` });
  } catch (error) {
    console.error('upload-image:', error);
    return createJson(
      { error: error?.message || 'Loi khi luu anh' },
      { status: 500 }
    );
  }
}
