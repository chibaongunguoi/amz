import React, { useMemo, useState } from 'react';
import { Input, Button, Skeleton } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAllProducts } from '@/store/slices/productsSlice';
import { selectIsLoading } from '@/store/slices/uiSlice';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { formatCurrency } from '@/utils/format.utils';
import {
  createSearchItemUrl,
  searchCatalogItems,
} from '@/utils/productSearch.utils';
import routePath from '@/constants/routePath';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

function SearchResultCard({ item }) {
  const navigate = useNavigate();
  const originalPrice =
    Number(item.priceDefault) > Number(item.priceForSale)
      ? formatCurrency(Number(item.priceDefault))
      : '';

  return (
    <button
      type="button"
      data-search-result-card
      data-in-stock={item.inStock ? 'true' : 'false'}
      data-variant-id={item.variantId || ''}
      onClick={() => navigate(createSearchItemUrl(item))}
      className="group text-left bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="relative aspect-square bg-gray-50">
        {Number(item.salePercent) > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-orange-50 border border-orange-200 px-2 py-1 text-xs font-semibold text-[#D65312]">
            Giảm {item.salePercent}%
          </span>
        )}
        <span
          className={`absolute right-2 top-2 z-10 rounded-md px-2 py-1 text-xs font-semibold ${
            item.inStock
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}
        >
          {item.inStock ? `Còn hàng${item.inventory > 0 ? ` (${item.inventory})` : ''}` : 'Hết hàng'}
        </span>
        <ImageWithFallback
          src={item.images}
          alt={[item.title, item.subtitle].filter(Boolean).join(' ')}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          fallback={
            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
              Ảnh chưa được cập nhật
            </div>
          }
        />
      </div>

      <div className="p-3">
        <div className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">
          {item.title}
        </div>
        {item.subtitle && (
          <div className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2">
            {item.subtitle}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-gray-600">
          {item.brand && (
            <span className="rounded bg-gray-50 border border-gray-200 px-2 py-0.5">
              {item.brand}
            </span>
          )}
          {item.color && (
            <span className="rounded bg-gray-50 border border-gray-200 px-2 py-0.5">
              {item.color}
            </span>
          )}
          {item.condition && (
            <span className="rounded bg-orange-50 border border-orange-100 px-2 py-0.5 text-[#D65312]">
              {item.condition}
            </span>
          )}
        </div>
        <div className="mt-3">
          <span className="text-lg font-bold text-[#D65312]">
            {formatCurrency(Number(item.priceForSale) || 0)}
          </span>
          {originalPrice && (
            <span className="ml-2 text-sm text-gray-400 line-through">
              {originalPrice}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3">
          <Skeleton.Image active className="!w-full !h-48" />
          <Skeleton active paragraph={{ rows: 3 }} className="mt-3" />
        </div>
      ))}
    </div>
  );
}

function Search() {
  const query = useQuery();
  const navigate = useNavigate();
  const q = query.get('q') || '';
  const [inputValue, setInputValue] = useState(q);
  const products = useSelector(selectAllProducts);
  const isLoading = useSelector(selectIsLoading);

  const result = useMemo(
    () => searchCatalogItems(products, q, { limit: 60, suggestionLimit: 16 }),
    [products, q]
  );

  const displayedItems = result.mode === 'results' ? result.items : result.suggestions;

  const submitSearch = () => {
    const next = inputValue.trim();
    if (!next) {
      navigate(routePath.product);
      return;
    }
    navigate(`${routePath.search}?q=${encodeURIComponent(next)}`);
  };

  return (
    <div className="py-5 md:py-8">
      <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {result.mode === 'suggestions'
              ? `Không có sản phẩm phù hợp với “${q}”`
              : `Kết quả tìm kiếm cho “${q}”`}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {result.mode === 'suggestions'
              ? 'Dưới đây là các sản phẩm gần nhất để bạn tham khảo.'
              : `Tìm thấy ${result.items.length} kết quả, bao gồm các biến thể sản phẩm.`}
          </p>
        </div>

        <div className="flex gap-2 md:min-w-[360px]">
          <Input
            size="large"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onPressEnter={submitSearch}
            placeholder="Tìm sản phẩm, màu, SKU, tình trạng..."
          />
          <Button
            size="large"
            type="primary"
            icon={<SearchOutlined />}
            onClick={submitSearch}
            className="!bg-[#D65312]"
          >
            Tìm
          </Button>
        </div>
      </div>

      {isLoading && products.length === 0 ? (
        <SearchSkeleton />
      ) : displayedItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {displayedItems.map((item) => (
            <SearchResultCard key={item.searchId} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
          <div className="text-lg font-semibold text-gray-900">
            Không có sản phẩm phù hợp
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Hãy thử tên model, thương hiệu, màu sắc hoặc mã SKU khác.
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;
