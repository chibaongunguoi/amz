import { listProducts } from '@/server/products/productRepository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listProducts(searchParams);

    return Response.json(result, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Data-Backend': result.backend,
      },
    });
  } catch (error) {
    console.error('products.GET:', error);
    return Response.json(
      { success: false, error: error?.message || 'Khong the doc san pham' },
      { status: 500 }
    );
  }
}
