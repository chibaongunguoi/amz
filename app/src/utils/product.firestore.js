const PAGE_SIZE = 100;

async function loadSqlProductsByCollection(collectionName) {
  const response = await fetch(
    `/api/admin/products?collection=${encodeURIComponent(collectionName)}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `API trả về lỗi ${response.status}`);
  }

  const products = Array.isArray(data.items) ? data.items : [];
  const pages = [];
  for (let i = 0; i < products.length; i += PAGE_SIZE) {
    const pageProducts = products.slice(i, i + PAGE_SIZE);
    const page = {};
    for (const product of pageProducts) {
      if (!product?.id) continue;
      page[product.id] = product;
    }
    pages.push(page);
  }
  return pages.length > 0 ? pages : [];
}

const createCollectionListener = (collectionName, callback) => {
  loadSqlProductsByCollection(collectionName)
    .then(callback)
    .catch((error) => {
      console.error(`Không thể tải sản phẩm SQL ${collectionName}:`, error);
      callback([]);
    });
  return () => {};
};

export const getAllTaiNgheNhetTai = (callback) => createCollectionListener('01-nhet-tai-cu', callback);
export const getAllTaiNgheChupTai = (callback) => createCollectionListener('02-chup-tai-cu', callback);
export const getAllLoaDiDong = (callback) => createCollectionListener('03-di-dong-cu', callback);
export const getAllLoaDeBan = (callback) => createCollectionListener('04-de-ban-cu', callback);
export const getAllLoaKaraoke = (callback) => createCollectionListener('05-loa-karaoke', callback);
export const getAllNewSealTaiNghe = (callback) => createCollectionListener('06-hang-newseal', callback);
