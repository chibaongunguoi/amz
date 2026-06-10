import { deleteAdminProduct, upsertAdminProduct } from '@/server/products/adminProductRepository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getId(params) {
  return decodeURIComponent(params?.id || '');
}

export async function PUT(request, { params }) {
  try {
    const id = getId(params);
    const body = await request.json();
    const product = await upsertAdminProduct(body?.product || body, {
      collection: body?.collection,
      id,
    });

    return Response.json({
      success: true,
      backend: 'postgres',
      product,
    });
  } catch (error) {
    console.error('admin.products.PUT:', error);
    return Response.json(
      { success: false, error: error?.message || 'Khong the cap nhat san pham' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const result = await deleteAdminProduct(getId(params));
    return Response.json({
      success: true,
      backend: 'postgres',
      ...result,
    });
  } catch (error) {
    console.error('admin.products.DELETE:', error);
    return Response.json(
      { success: false, error: error?.message || 'Khong the xoa san pham' },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;
