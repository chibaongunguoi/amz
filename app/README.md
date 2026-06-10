# AMZTECH NextJS

Ban NextJS nay duoc tao tu source Vite cu theo huong compatibility port:

- Chay app React hien tai trong Next App Router bang catch-all route.
- Frontend chi goi API; khong doc truc tiep `public/data`.
- Backend storage co 2 mode: JSON fallback va PostgreSQL.
- Port cac API cu sang Next route handlers:
  - `GET/POST /api/collections/:collection`
  - `GET /api/products`
  - `GET /api/health`
  - `POST /api/save-collection`
  - `POST /api/upload-image`
  - `POST /api/upload-image-file`
  - `POST /api/admin/migrate-product-skus`
- Them metadata mac dinh, `robots.txt`, va `sitemap.xml`.

## Chay local

```bash
npm install
npm run dev
```

Local URL:

```text
http://localhost:2011
```

## Build

```bash
npm run build
npm run start
```

## Kien truc

```text
src/views, src/components, src/providers  Frontend UI
src/lib                                  Frontend API facade
src/app/api                              API route handlers
src/server                               Backend services/storage/db
public/data                              JSON fallback va seed data
```

`src/server/storage/collectionStore.js` quyet dinh backend storage:

- Mac dinh: doc/ghi JSON trong `public/data`.
- Khi co `DATABASE_URL` va `DATA_STORAGE=postgres`: doc/ghi PostgreSQL.

## PostgreSQL

Tao database va set env:

```bash
DATABASE_URL=postgresql://amz_app:<password>@127.0.0.1:5432/amz
DATA_STORAGE=postgres
NEXT_PUBLIC_SITE_URL=http://180.93.96.87
```

Migrate JSON hien tai sang PostgreSQL:

```bash
npm run db:migrate:json
```

Kiem tra backend dang chay:

```bash
curl http://localhost:3000/api/health
curl 'http://localhost:3000/api/products?limit=12&offset=0'
```

## SEO roadmap

Ban hien tai uu tien chay dung giao dien va admin cu. De SEO manh hon, nen tach tiep:

1. `/product-detail/[slug]` thanh Next server route co metadata rieng tung san pham.
2. `/post-detail/[id]` hoac `/posts/[slug]` thanh route SSR/SSG cho blog.
3. `/product/[category]` thanh listing SSR co canonical, title, description rieng.
4. Chuyen data pipe-string sang database/schema chuan truoc khi lam order/tim kiem nang cao.
