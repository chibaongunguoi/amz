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
    const formData = await request.formData();
    const file = formData.get('image') || formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return createJson(
        { error: 'Khong co file anh. Gui field "image" trong FormData.' },
        { status: 400 }
      );
    }

    const ext = getImageExtension(file.type);
    if (!ext) {
      return createJson(
        { error: 'Chi chap nhan anh: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return createJson({ error: 'Anh vuot qua gioi han 15MB' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = createUploadFilename(ext);
    const filePath = getUploadPath(filename);
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, buffer);

    return createJson({ url: `/uploads/products/${filename}` });
  } catch (error) {
    console.error('upload-image-file:', error);
    return createJson(
      { error: error?.message || 'Loi khi luu anh' },
      { status: 500 }
    );
  }
}
