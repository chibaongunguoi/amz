import { writeCollection } from '@/server/storage/collectionStore';
import { createJson } from '../_lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { collection, data } = await request.json();

    if (!collection || data === undefined) {
      return createJson(
        { success: false, error: 'Missing collection or data' },
        { status: 400 }
      );
    }

    const storage = await writeCollection(collection, data);

    return createJson({
      success: true,
      backend: storage.backend,
      projections: storage.projections,
      message: `Collection ${collection} da duoc luu thanh cong`,
    });
  } catch (error) {
    console.error('save-collection:', error);
    return createJson(
      { success: false, error: error?.message || 'Khong the luu collection' },
      { status: 500 }
    );
  }
}
