import { getStorageBackend, readCollection, writeCollection } from '@/server/storage/collectionStore';
import { createJson } from '../../_lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getCollection(params) {
  return decodeURIComponent(params?.collection || '');
}

export async function GET(_request, { params }) {
  try {
    const collection = getCollection(params);
    const data = await readCollection(collection);

    return createJson(data, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Data-Backend': getStorageBackend(),
      },
    });
  } catch (error) {
    console.error('collections.GET:', error);
    return createJson(
      { success: false, error: error?.message || 'Khong the doc collection' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const collection = getCollection(params);
    const body = await request.json();
    const data = body?.data !== undefined ? body.data : body;
    const storage = await writeCollection(collection, data);

    return createJson({
      success: true,
      backend: storage.backend,
      projections: storage.projections,
    });
  } catch (error) {
    console.error('collections.POST:', error);
    const status = String(error?.message || '').includes('Product collections are stored in SQL tables')
      ? 400
      : 500;
    return createJson(
      { success: false, error: error?.message || 'Khong the luu collection' },
      { status }
    );
  }
}

export const PUT = POST;
