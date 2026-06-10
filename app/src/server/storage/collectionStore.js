import { assertCollectionName, isProductDataCollection } from '../data/collections.js';
import { isPostgresEnabled } from '../db/postgres.js';
import { listAdminProducts } from '../products/adminProductRepository.js';
import {
  readPostgresCollection,
  writePostgresCollection,
} from './postgresCollections.js';

export function getStorageBackend() {
  return isPostgresEnabled() ? 'postgres' : 'postgres-unconfigured';
}

function assertPostgresStorage() {
  if (!isPostgresEnabled()) {
    throw new Error('PostgreSQL storage is required. Set DATABASE_URL.');
  }
}

function productsToCollectionPages(products, pageSize = 100) {
  const pages = [];
  for (let i = 0; i < products.length; i += pageSize) {
    const page = {};
    for (const product of products.slice(i, i + pageSize)) {
      if (product?.id) page[product.id] = product;
    }
    pages.push(page);
  }
  return pages;
}

export async function readCollection(collection) {
  const safeCollection = assertCollectionName(collection);
  assertPostgresStorage();

  if (isProductDataCollection(safeCollection)) {
    const result = await listAdminProducts(new URLSearchParams({ collection: safeCollection }));
    return productsToCollectionPages(result.items || []);
  }

  const postgresData = await readPostgresCollection(safeCollection);
  if (postgresData !== null) return postgresData;

  return [];
}

export async function writeCollection(collection, data) {
  const safeCollection = assertCollectionName(collection);
  assertPostgresStorage();

  if (isProductDataCollection(safeCollection)) {
    throw new Error('Product collections are stored in SQL tables. Use /api/admin/products.');
  }

  const projections = await writePostgresCollection(safeCollection, data);
  return { backend: 'postgres', projections };
}
