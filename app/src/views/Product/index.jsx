import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ProductGrid } from '../../components/product'
import { Button, Grid } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { resetFilter } from '../../store/slices/filtersSlice';
import { selectAllProducts } from '../../store/slices/productsSlice'
import {
  clearAllFilters,
  selectBrands,
  selectCategory,
  selectPriceRanges,
} from '../../store/slices/filtersSlice'
import { selectPosts } from '../../store/slices/postsSlice'
import { selectIsLoading } from '../../store/slices/uiSlice'
import { FILTER_VALUES, BESTSELLER_VALUES, SORT_KEYS } from '../../constants'
import { BEST_SELLER_ORDER_EVENT, getBestSellerOrder } from '../../services/bestSellerOrder.service'
import routePath from '../../constants/routePath'
import { sanitizeHtml } from '@/utils/htmlSanitizer'

const { useBreakpoint } = Grid

const SORT_OPTIONS = [
  { label: 'Bán chạy nhất', value: SORT_KEYS.BESTSELLER },
  { label: 'Khuyến mãi hot', value: SORT_KEYS.HOTDEAL },
  { label: 'Giá tăng dần', value: SORT_KEYS.ASC },
  { label: 'Giá giảm dần', value: SORT_KEYS.DESC },
]

const SORT_COMPARATORS = {
  [SORT_KEYS.HOTDEAL]: (a, b) => (Number(b.salePercent) || 0) - (Number(a.salePercent) || 0),
  [SORT_KEYS.ASC]: (a, b) => Number(a.priceForSale) - Number(b.priceForSale),
  [SORT_KEYS.DESC]: (a, b) => Number(b.priceForSale) - Number(a.priceForSale),
}

const productLoadingCards = Array.from({ length: 6 }, (_, index) => index)

function ProductListSkeleton() {
  return (
    <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {productLoadingCards.map((item) => (
          <article className="amz-skeleton-product-card" key={`product-list-skeleton-${item}`}>
            <div className="amz-skeleton-product-media" />
            <div className="amz-skeleton-product-body">
              <span className="amz-skeleton-line amz-skeleton-w-full" />
              <span className="amz-skeleton-line amz-skeleton-w-70" />
              <div className="amz-skeleton-product-meta">
                <span />
                <span />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function ProductEmptyState({ hasActiveFilters, onClearFilters }) {
  return (
    <section className="rounded-lg border border-dashed border-orange-200 bg-white px-5 py-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-[#D65312]">
        <SearchOutlined className="text-xl" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        Chưa tìm thấy sản phẩm phù hợp
      </h2>
      <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-gray-500">
        Thử bỏ bớt thương hiệu, khoảng giá hoặc xem lại toàn bộ sản phẩm đang có trên AMZTECH.
      </p>
      {hasActiveFilters && (
        <Button
          type="default"
          size="large"
          icon={<ReloadOutlined />}
          className="!font-semibold !border-[#D65312] !text-[#D65312] hover:!border-[#F37021] hover:!text-[#F37021]"
          onClick={onClearFilters}
        >
          Xóa bộ lọc
        </Button>
      )}
    </section>
  )
}

function Product() {
  const dispatch = useDispatch()
  const [selectedSort, setSelectedSort] = useState(SORT_KEYS.BESTSELLER)
  const [bestSellerOrderVersion, setBestSellerOrderVersion] = useState(0)
  const screens = useBreakpoint()
  const isSmall = !screens.md
  const isMedium = screens.md && !screens.lg

  const allProducts = useSelector(selectAllProducts)
  const category = useSelector(selectCategory)
  const brands = useSelector(selectBrands)
  const priceRanges = useSelector(selectPriceRanges)
  const posts = useSelector(selectPosts)
  const isStorefrontLoading = useSelector(selectIsLoading)
  const user = useSelector((state) => state.auth?.user)

  /** Không đồng bộ slug URL → danh mục: vào listing chỉ lọc theo ngành khi user chọn menu (Redux). */

  useEffect(() => {
    const onOrderUpdated = () => setBestSellerOrderVersion((version) => version + 1)
    window.addEventListener(BEST_SELLER_ORDER_EVENT, onOrderUpdated)
    return () => window.removeEventListener(BEST_SELLER_ORDER_EVENT, onOrderUpdated)
  }, [])

  const filteredProducts = useMemo(() => {
    // Recompute after the saved best-seller order changes in another admin view.
    void bestSellerOrderVersion

    let result = [...allProducts]

    if (category && category !== FILTER_VALUES.ALL_PRODUCTS) {
      result = result.filter((p) => p.category === category)
    }

    if (brands.length > 0) {
      result = result.filter(p => brands.includes(p.brand))
    }

    if (priceRanges.length > 0) {
      result = result.filter(p => {
        const price = Number(p.priceForSale) || 0
        return priceRanges.some(([min, max]) => price >= min && price <= max)
      })
    }

    // Sắp xếp "Bán chạy nhất": dùng thứ tự đã lưu theo phân loại (getBestSellerOrder)
    if (selectedSort === SORT_KEYS.BESTSELLER) {
      const orderMap = getBestSellerOrder(
        category && category !== FILTER_VALUES.ALL_PRODUCTS ? category : null
      )
      const isBest = (p) =>
        p.isBestSeller === BESTSELLER_VALUES.YES || p.isBestSeller === '1' || p.isBestSeller === 1
      result.sort((a, b) => {
        const aIs = isBest(a)
        const bIs = isBest(b)
        if (aIs && bIs) {
          const oa = orderMap[a.id || a._id] ?? Infinity
          const ob = orderMap[b.id || b._id] ?? Infinity
          return oa - ob
        }
        if (aIs) return -1
        if (bIs) return 1
        return 0
      })
    } else {
      const comparator = SORT_COMPARATORS[selectedSort]
      if (comparator) result.sort(comparator)
    }

    return result
  }, [allProducts, category, brands, priceRanges, selectedSort, bestSellerOrderVersion])

  const randomPost = useMemo(() => {
    if (posts.length === 0) return null
    return posts[Math.floor(Math.random() * posts.length)]
  }, [posts])

  const handleSortClick = (option) => {
    setSelectedSort(option.value)
  }

  const hasActiveFilters =
    Boolean(category && category !== FILTER_VALUES.ALL_PRODUCTS) ||
    brands.length > 0 ||
    priceRanges.length > 0

  const handleClearFilters = () => {
    dispatch(resetFilter()); // Xóa tất cả filters (cả brands và priceRanges)
  };
  const sortButtonStyle = useMemo(() => {
    if (isSmall) return { fontSize: 10, padding: 4 };
    if (isMedium) return { fontSize: 12, padding: '4px 8px' };
    return { fontSize: 20, padding: '4px 24px' };
  }, [isSmall, isMedium]);

  return (
    <div>
      <div
        className={
          `bg-[#FFFFFF] rounded-[10px] px-4 py-3 mb-4 flex items-center gap-3` +
          (isSmall ? ' flex-col items-start mt-3 gap-2' : '')
        }
      >
        {!(isSmall || isMedium) && (
          <span
            className={`font-medium text-[#222] mr-2 text-nowrap ${
              isSmall ? 'text-[16px]' : isMedium ? 'text-[14px]' : 'text-[20px]'
            }`}
          >
            Sắp xếp theo
          </span>
        )}
        <div className="flex flex-wrap items-center gap-2 w-full">
          <div className="flex gap-2 overflow-x-auto">
            {SORT_OPTIONS.map(option => (
              <button
                key={option.value}
	                className={
	                  (selectedSort === option.value
	                    ? "border border-[#D65312] text-[#D65312] bg-white font-medium focus:outline-none"
	                    : "border border-[#e0e0e0] text-[#222] bg-white font-medium focus:outline-none hover:border-[#D65312]") +
	                  ' rounded-[10px]'
	                }
	                style={sortButtonStyle}
	                onClick={() => handleSortClick(option)}
	              >
                {option.label}
              </button>
            ))}
          </div>
          {user && (
            <Link
              to={`${routePath.adminBestSellerSort}${category && category !== FILTER_VALUES.ALL_PRODUCTS ? `?category=${encodeURIComponent(category)}` : ''}`}
              className="text-[#D65312] hover:underline text-sm shrink-0"
            >
              Sắp xếp bán chạy
            </Link>
          )}
        </div>
      </div>
      
      {isStorefrontLoading && allProducts.length === 0 ? (
        <ProductListSkeleton />
      ) : filteredProducts.length === 0 ? (
        <ProductEmptyState
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
      
      {randomPost && (
        <div className='mt-[30px]'>
          <div className="grid grid-cols-1 gap-4">
            <div key={randomPost.id} className="rounded-lg">
              <h1 className="text-[21px] be-vietnam-pro-medium font-semibold">{randomPost.title}</h1>
              <div
                className="text-gray-600 be-vietnam-pro"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(randomPost.content) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Product
