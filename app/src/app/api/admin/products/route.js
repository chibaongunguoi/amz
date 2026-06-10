import { listAdminProducts, upsertAdminProduct } from '@/server/products/adminProductRepository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listAdminProducts(searchParams);

    return Response.json(result, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Data-Backend': result.backend,
      },
    });
  } catch (error) {
    console.error('admin.products.GET:', error);
    return Response.json(
      { success: false, error: error?.message || 'Khong the doc san pham admin' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const product = await upsertAdminProduct(body?.product || body, {
      collection: body?.collection,
      id: body?.id,
    });

    return Response.json({
      success: true,
      backend: 'postgres',
      product,
    });
  } catch (error) {
    console.error('admin.products.POST:', error);
    return Response.json(
      { success: false, error: error?.message || 'Khong the luu san pham' },
      { status: 500 }
    );
  }
}
