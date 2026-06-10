import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Row, Col, Grid, Skeleton, Empty } from 'antd'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import routePath from '../../constants/routePath'
import { Breadcrumb as Breadcum, ImageZoom } from '../../components/common'
import { setCategory, resetFilter } from '../../store/slices/filtersSlice'
import { selectAllProducts } from '../../store/slices/productsSlice'
import { ProductCard } from '../../components/product'
import { stringToTableInfo as parseStringToTableInfo } from '../../utils/tableInfo.utils'
import { getDocumentById } from "@/lib/data";
import { formatVNPhoneNumber } from '../../utils/format.utils'
import { PHONE_NUMBER } from '../../constants/phoneNumber'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { createProductSlug, findProductBySlug } from '../../utils'
import { formatProductDisplayName } from '@/utils/productSearch.utils'
import { sanitizeHtml } from '@/utils/htmlSanitizer'
import OptimizedImage from '@/components/common/OptimizedImage'

const getRelatedProducts = (targetProduct, allProducts, limit = 4) => {
  if (!targetProduct || !targetProduct.collection || !targetProduct.priceForSale) return [];

  const targetPrice = Number(targetProduct.priceForSale);

  return allProducts
    .filter(product =>
      product.id !== targetProduct.id &&
      product.collection === targetProduct.collection
    )
    .sort((a, b) => {
      const priceA = Number(a.priceForSale);
      const priceB = Number(b.priceForSale);
      return Math.abs(priceA - targetPrice) - Math.abs(priceB - targetPrice);
    })
    .slice(0, limit);
};

function toText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean).join(', ');
  }
  return String(value ?? '').trim();
}

function getInventoryLabel(product, selectedVariant) {
  if (selectedVariant) {
    const inventory = Number(selectedVariant.inventory) || 0;
    return inventory > 0 ? `Còn hàng (${inventory} sản phẩm)` : 'Hết hàng';
  }

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length > 0) {
    return '';
  }

  const inventory = Number(product?.inventory ?? product?.inventories);
  if (Number.isFinite(inventory) && inventory > 0) return `Còn hàng (${inventory} sản phẩm)`;
  return '';
}

function formatCurrency(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return '';
  return price.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

function getInStockVariantPriceRange(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const prices = variants
    .filter((variant) => Number(variant.inventory) > 0)
    .map((variant) => Number(variant.priceForSale ?? variant.price_for_sale))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) return '';

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (minPrice === maxPrice) return formatCurrency(minPrice);
  return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
}

function findVariantByQuery(product, variantKey) {
  if (!variantKey || !Array.isArray(product?.variants)) return null;
  const decoded = String(variantKey);
  return product.variants.find((variant, index) => (
    String(variant.id || '') === decoded ||
    String(variant.sku || '') === decoded ||
    String(index) === decoded
  )) || null;
}

function getVariantUrlKey(variant) {
  if (!variant) return '';
  return String(variant.sku || variant.id || '').trim();
}

function createProductDetailUrl(product, variant) {
  const slug = createProductSlug(product);
  const params = new URLSearchParams();
  const variantKey = getVariantUrlKey(variant);
  if (variantKey) params.set('variant', variantKey);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return slug ? `/product-detail/${slug}${suffix}` : `${routePath.productDetail}${suffix}`;
}

function ProductDetail() {
  const { slug } = useParams();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const idFromQuery = queryParams.get("id");
  const variantFromQuery = queryParams.get("variant");
  const [product, setProduct] = useState({});
  const [selectedImage, setSelectedImage] = useState(0)
  const [isProduct, setIsProduct] = useState(true)
  const [currentPost, setCurrentPost] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { md } = Grid.useBreakpoint()
  const isSmall = !md
  const allProductsArray = useSelector(selectAllProducts);
  const [youtubeTitle, setYoutubeTitle] = useState('')
  const relatedProducts = getRelatedProducts(product, allProductsArray)
  const [selectedOptions, setSelectedOptions] = useState({
    color: null,
    condition: null,
    branch: null
  })
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 0);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1); 
  };

  const scrollByAmount = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  useEffect(() => {
    checkArrows();
    const el = scrollRef.current;
    if (!el) return;
    const onResize = () => checkArrows();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  const itemSize = 120;

  const [productName, setProductName] = useState("");
  const [images, setImages] = useState([]);
  const [productColor, setProductColor] = useState([]);
  const [priceForSale, setPriceForSale] = useState("");
  const [priceDefault, setPriceDefault] = useState("");
  const [condition, setCondition] = useState("");
  const [, setVideoUrl] = useState("");
  const [ytbVideoId, setYtbVideoId] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);

  const sortedVariants = useMemo(() => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    return variants
      .map((variant, index) => ({ variant, index }))
      .sort((a, b) => {
        const aInStock = Number(a.variant.inventory) > 0;
        const bInStock = Number(b.variant.inventory) > 0;
        if (aInStock !== bInStock) return aInStock ? -1 : 1;
        return a.index - b.index;
      })
      .map((item) => item.variant);
  }, [product?.variants]);

  const conditionLabel = toText(condition);
  const inventoryLabel = getInventoryLabel(product, selectedVariant);


  useEffect(() => {
    if (!allProductsArray || allProductsArray.length === 0) return;
    
    let foundProduct = null;
    
    // Ưu tiên tìm sản phẩm theo slug (SEO-friendly URL)
    if (slug) {
      foundProduct = findProductBySlug(slug, allProductsArray);
    }
    
    // Fallback: nếu có id từ query params (backward compatibility)
    if (!foundProduct && idFromQuery) {
      foundProduct = allProductsArray.find(item => String(item.id) === String(idFromQuery));
      
      // Nếu tìm thấy bằng ID và không có slug, redirect sang URL có slug (SEO improvement)
      if (foundProduct && !slug) {
        const newSlug = createProductSlug(foundProduct);
        if (newSlug) {
          const params = new URLSearchParams();
          if (variantFromQuery) params.set('variant', variantFromQuery);
          const suffix = params.toString() ? `?${params.toString()}` : '';
          navigate(`/product-detail/${newSlug}${suffix}`, { replace: true });
          return; // Return early để tránh set state trước khi redirect
        }
      }
    }
    
    if (foundProduct) {
      const newSlug = createProductSlug(foundProduct);
      if (newSlug && slug !== newSlug) {
        const params = new URLSearchParams(search);
        const suffix = params.toString() ? `?${params.toString()}` : '';
        navigate(`/product-detail/${newSlug}${suffix}`, { replace: true });
        return;
      }

      setIsProduct(false);
      setProduct(foundProduct);
      setSelectedVariant(findVariantByQuery(foundProduct, variantFromQuery));
      setSelectedImage(0);
    } else {
      setIsProduct(true);
      setProduct(null);
      setSelectedVariant(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, idFromQuery, variantFromQuery, search, allProductsArray, navigate]);

  function extractYoutubeVideoId(url) {
    const match = url.match(/(?:[?&]v=|youtu\.be\/|embed\/)([\w-]{11})/)
    return match ? match[1] : null
  }

  const getPostById = async (id) => {
    if (!id) {
      setCurrentPost("");
      return;
    }
    const snapshot = await getDocumentById('productPosts', id);
    if (snapshot) {
      setCurrentPost(snapshot.content || '')
    } else {
      setCurrentPost("")
    }
  };

  useEffect(() => {
    if (product?.post) {
      getPostById(product.post)
    }
  }, [product]);


  useEffect(() => {
    async function fetchYoutubeTitle() {
      if (!ytbVideoId) {
        setYoutubeTitle('')
        return
      }
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytbVideoId}&format=json`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setYoutubeTitle(data.title || '')
      } catch {
        setYoutubeTitle('')
      }
    }
    fetchYoutubeTitle()
  }, [ytbVideoId])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [product])

  const handleSelectOption = (type, value) => {
    setSelectedOptions(prev => {
      const isSame = prev[type] === value
      return { ...prev, [type]: isSame ? null : value }
    })
  }

  // priceForSale đã là giá cuối (đã giảm) theo convention của admin form.
  // Hàm này giữ chữ ký 2 tham số để các call-site cũ không phải đổi, nhưng
  // không nhân thêm (1 - salePercent/100) để tránh double-discount.
  const calculateFinalPrice = (priceForSale) => {
    return Number(priceForSale) || 0;
  };

  // Update display when product or selected variant changes
  useEffect(() => {
    if (!product) return;

    setProductName(product.name || "");

    // Check if product has variants
    const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
    
    // Nếu có variant được chọn, hiển thị thông tin variant
    // Nếu không có variant nào được chọn, hiển thị thông tin sản phẩm gốc
    if (hasVariants && selectedVariant) {
      // Update images from variant or fallback to product images
      // Ưu tiên ảnh của variant, nếu không có thì dùng ảnh của sản phẩm chính
      let variantImages = [];
      
      if (selectedVariant.images) {
        // Xử lý variant.images có thể là array hoặc string
        if (Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0) {
          variantImages = selectedVariant.images;
        } else if (typeof selectedVariant.images === 'string' && selectedVariant.images.trim()) {
          // Nếu là string, split bằng ';;' như format của product images
          variantImages = selectedVariant.images.split(';;').filter(Boolean);
        }
      }
      
      // Nếu variant không có ảnh, fallback về ảnh của sản phẩm chính
      if (variantImages.length === 0) {
        const productImages = product.images || [];
        if (Array.isArray(productImages)) {
          variantImages = productImages;
        } else if (typeof productImages === 'string') {
          variantImages = productImages.split(';;').filter(Boolean);
        }
      }
      
      setImages(variantImages);
      
      // Update price from variant
      const variantPriceForSale = selectedVariant.priceForSale || product.priceForSale || 0;
      const variantPriceDefault = selectedVariant.priceDefault || product.priceDefault || 0;
      const variantSalePercent = selectedVariant.salePercent || product.salePercent || 0;
      
      const finalPrice = calculateFinalPrice(variantPriceForSale, variantSalePercent);
      
      setPriceForSale(formatCurrency(finalPrice));

      setPriceDefault(formatCurrency(variantPriceDefault));

      setCondition(selectedVariant.condition || product.condition || "");
      setProductColor(selectedVariant.color ? [selectedVariant.color] : (product.colors || product.color || []));
    } else {
      // No variants selected or no variants at all, use product data
      const rawImages = product.images || [];
      setImages(Array.isArray(rawImages) ? rawImages : rawImages.split(";;"));

      setProductColor(product.colors || product.color || []);

      if (hasVariants) {
        setPriceForSale(getInStockVariantPriceRange(product));
        setPriceDefault("");
        setCondition("");
      } else {
        const finalPrice = calculateFinalPrice(product.priceForSale, product.salePercent);
        setPriceForSale(formatCurrency(finalPrice));
        setPriceDefault(formatCurrency(product.priceDefault));
        setCondition(product.condition || "");
      }
    }

    const url = product.videoUrl || product.youtubeUrl || "https://www.youtube.com/watch?v=hwsKMrkCalE";
    setVideoUrl(url);
    setYtbVideoId(extractYoutubeVideoId(url));
  }, [product, selectedVariant]);

  if (isProduct) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Empty description="Sản phẩm không tồn tại" />
      </div>
    )
  }

  return (
    <div>
      <Breadcum
        content={[
          {
            label: (
              <>
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  style={{ display: 'inline', verticalAlign: 'middle' }}
                >
                  <path
                    d="M3 10.75L12 4l9 6.75"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.5 10.75V19a1 1 0 001 1h3.5v-4.25a1 1 0 011-1h2a1 1 0 011 1V20H18.5a1 1 0 001-1v-8.25"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="ml-1">Trang chủ</span>
              </>
            ),
            onClick: () => navigate(routePath.home)
          },
          {
            label: product.category || 'Danh mục',
            onClick: () => {
              dispatch(resetFilter())
              dispatch(setCategory(product.category))
              navigate(routePath.product)
            }
          },
          {
            label: formatProductDisplayName(productName),
            onClick: () => { },
            active: true
          }
        ]}
      />
      <Row gutter={[24, 16]} className="mb-8">
        <Col xs={24} md={14}>
          <div
            className="mx-auto w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden mb-4"
            style={{
              // Cap khung ảnh theo chiều cao viewport để chừa chỗ cho breadcrumb,
              // header và strip thumbnail bên dưới (không bị che bởi cạnh dưới màn hình).
              // Cap cả max-width tương ứng để khung vẫn giữ tỉ lệ 1:1.
              maxHeight: 'calc(100vh - 320px)',
              maxWidth: 'calc(100vh - 320px)',
            }}
          >
            {loading ? (
              <Skeleton.Image style={{ width: '100%', height: '100%' }} active />
            ) : Array.isArray(images) && images.length > 0 ? (
              <ImageZoom
                src={images[selectedImage]}
                alt={productName}
                images={images}
                currentIndex={selectedImage}
                onIndexChange={(newIndex) => setSelectedImage(newIndex)}
                className="rounded-lg object-contain w-full h-full transition-all duration-300 hover:scale-105"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <span className="text-gray-300">No Image</span>
            )}
          </div>
      
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={checkArrows}
              className="flex gap-2 mb-4 overflow-x-auto"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style>{`
          div::-webkit-scrollbar { display: none; height: 0; }
        `}</style>

              {loading
                ? Array(3)
                  .fill(0)
                  .map((_, idx) => (
                    <Skeleton.Image
                      key={`s-${idx}`}
                      style={{ width: itemSize, height: itemSize }}
                      active
                    />
                  ))
                : Array.isArray(images) &&
                images.length > 1 &&
                images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`border ${selectedImage === idx ? "border-orange-500" : "border-gray-300"
                      } rounded-md p-0.5 cursor-pointer bg-white flex items-center justify-center box-border transition-all duration-200 hover:shadow-lg hover:scale-105`}
                    style={{
                      width: itemSize,
                      height: itemSize,
                      minWidth: itemSize,
                      flex: "0 0 auto",
                    }}
                  >
                    <OptimizedImage
                      src={img}
                      alt={`thumb-${idx}`}
                      width={itemSize}
                      height={itemSize}
                      sizes={`${itemSize}px`}
                      className="w-full h-full object-cover rounded transition-all duration-200 hover:brightness-110"
                      draggable={false}
                    />
                  </div>
                ))}
            </div>

            {canLeft && (
              <button
                type="button"
                onClick={() => scrollByAmount(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 shadow px-2 py-2 transition hover:bg-white"
              >
                <LeftOutlined />
              </button>
            )}

            {canRight && (
              <button
                type="button"
                onClick={() => scrollByAmount(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 shadow px-2 py-2 transition hover:bg-white"
              >
                <RightOutlined />
              </button>
            )}
          </div>
        </Col>

        <Col xs={24} md={10}>
          <h1 className={`m-0 font-bold ${isSmall ? 'text-xl' : 'text-2xl'} leading-tight mb-2`}>
            {loading ? (
              <Skeleton.Input active size="default" style={{ width: 240 }} />
            ) : (
              formatProductDisplayName(productName)
            )}
          </h1>

          {!loading && (product.brand || conditionLabel || inventoryLabel) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-sm">
              {product.brand && (
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2" data-product-meta="brand">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Thương hiệu
                  </div>
                  <div className="mt-0.5 font-semibold text-gray-800">{product.brand}</div>
                </div>
              )}
              {conditionLabel && (
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2" data-product-meta="condition">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Tình trạng
                  </div>
                  <div className="mt-0.5 font-semibold text-gray-800">{conditionLabel}</div>
                </div>
              )}
              {inventoryLabel && (
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2" data-product-meta="inventory">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Tồn kho
                  </div>
                  <div
                    className={`mt-0.5 font-semibold ${
                      inventoryLabel.includes('Hết') ? 'text-red-600' : 'text-green-700'
                    }`}
                  >
                    {inventoryLabel}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 mb-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className={`text-orange-600 font-bold ${isSmall ? 'text-[26px]' : 'text-[40px]'} leading-none`}
              >
                {loading ? (
                  <Skeleton.Input active size="large" style={{ width: 140 }} />
                ) : (
                  priceForSale
                )}
              </span>
              {!loading && selectedVariant && priceDefault && (
                <span
                  className={`text-gray-400 line-through ${isSmall ? 'text-sm' : 'text-lg'}`}
                >
                  {priceDefault}
                </span>
              )}
              {!loading && selectedVariant && Number(selectedVariant?.salePercent ?? product.salePercent) > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  -{Number(selectedVariant?.salePercent ?? product.salePercent)}%
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Giá tham khảo. Liên hệ Zalo để báo giá chi tiết.
            </div>
          </div>

          {/* Variants Selection */}
          {product.variants && Array.isArray(product.variants) && product.variants.length > 0 ? (
            <>
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {loading ? (
                    Array(2)
                      .fill(0)
                      .map((_, idx) => (
                        <Skeleton.Button
                          key={idx}
                          active
                          size="small"
                          style={{ width: 120, height: 60 }}
                        />
                      ))
                  ) : (
                    sortedVariants.map((variant, idx) => {
                      const isSelected =
                        selectedVariant === variant ||
                        (selectedVariant?.id && variant.id && selectedVariant.id === variant.id);
                      const isInStock = Number(variant.inventory) > 0;
                      const variantLabel = variant.name || `${variant.color || ''} - ${variant.condition || ''}`.trim() || `Biến thể ${idx + 1}`;
                      
                      return (
                        <div
                          key={variant.id || idx}
                          data-variant-card
                          data-in-stock={isInStock ? 'true' : 'false'}
                          className={`rounded-lg p-2.5 border-2 transition-all duration-150 ${
                            isSelected
                              ? 'bg-orange-500 text-white border-orange-500 shadow-lg cursor-pointer'
                              : isInStock
                              ? 'bg-white text-gray-800 border-gray-300 hover:border-orange-300 hover:shadow-md cursor-pointer'
                              : 'bg-gray-50 text-gray-400 border-gray-200 opacity-50 cursor-not-allowed pointer-events-none'
                          }`}
                          style={{
                            minWidth: 132,
                            maxWidth: 180,
                            minHeight: 48,
                            position: 'relative',
                            filter: !isInStock && !isSelected ? 'grayscale(100%)' : 'none',
                          }}
                          title={isInStock ? variantLabel : `${variantLabel} - Hết hàng`}
                          aria-disabled={!isInStock}
                          onClick={() => {
                            if (isInStock) {
                              const nextVariant = isSelected ? null : variant;
                              setSelectedVariant(nextVariant);
                              // Reset selected image về 0 khi chọn variant mới hoặc quay lại sản phẩm gốc
                              setSelectedImage(0);
                              navigate(createProductDetailUrl(product, nextVariant), { replace: true });
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (!isInStock) {
                              e.currentTarget.style.cursor = 'not-allowed';
                            }
                          }}
                        >
                          <div className="font-medium text-sm leading-snug">{variantLabel}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3">
                <div className="font-semibold mb-1">Màu sắc</div>
                <div className="flex gap-2">
                  {loading
                    ? Array(2)
                        .fill(0)
                        .map((_, idx) => (
                          <Skeleton.Button
                            key={idx}
                            active
                            size="small"
                            style={{ width: 60 }}
                          />
                        ))
                    : (Array.isArray(productColor) ? productColor : [productColor]).map((color, idx, arr) => {
                        const isSingleColor = arr.length === 1;
                        const isSelected = isSingleColor || selectedOptions.color === color;

                        return (
                          <span
                            key={idx}
                            className={`rounded-md px-4 py-1 font-medium cursor-${isSingleColor ? 'default' : 'pointer'} border transition-colors duration-150 ${isSelected
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-gray-800 border-gray-300'
                              }`}
                            style={{ minWidth: 60, display: 'inline-block', textAlign: 'center' }}
                            onClick={() => {
                              if (!isSingleColor) handleSelectOption('color', color);
                            }}
                          >
                            {color}
                          </span>
                        );
                      })}
                </div>
              </div>

              <div className="mb-3">
                <div className="font-semibold mb-1">Tình trạng</div>
                <div className="flex gap-2">
                  {loading ? (
                    <Skeleton.Button active size="small" style={{ width: 80 }} />
                  ) : (
                    <span
                      className={`rounded-md px-4 py-1 font-medium ${'cursor-default'
                        } border transition-colors duration-150 bg-orange-500 text-white border-orange-500`}
                      style={{
                        minWidth: 80,
                        display: 'inline-block',
                        textAlign: 'center',
                      }}
                    >
                      {condition}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mb-3">
            <div className="font-semibold mb-2">Đặt hàng / Tư vấn miễn phí</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loading
                ? Array(2)
                    .fill(0)
                    .map((_, idx) => (
                      <Skeleton.Button
                        key={idx}
                        active
                        size="large"
                        block
                        style={{ height: 64 }}
                      />
                    ))
                : (
                  <>
                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-lg p-3 text-left transition-all duration-150 border border-orange-200 bg-white hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md cursor-pointer"
                      onClick={() =>
                        window.open('https://zalo.me/' + PHONE_NUMBER.HA_NOI, '_blank')
                      }
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                        Zalo
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide opacity-80">Chi nhánh Hà Nội</div>
                        <div className="font-semibold truncate">
                          {formatVNPhoneNumber(PHONE_NUMBER.HA_NOI)}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-lg p-3 text-left transition-all duration-150 border border-orange-200 bg-white hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md cursor-pointer"
                      onClick={() =>
                        window.open('https://zalo.me/' + PHONE_NUMBER.DA_NANG, '_blank')
                      }
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                        Zalo
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide opacity-80">Chi nhánh Đà Nẵng</div>
                        <div className="font-semibold truncate">
                          {formatVNPhoneNumber(PHONE_NUMBER.DA_NANG)}
                        </div>
                      </div>
                    </button>
                  </>
                )}
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-8">
        <Col xs={24} md={15}>
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-orange-500 mb-3 border-b border-orange-100 pb-2">
              Đặc điểm nổi bật
            </h3>
            {loading ? (
              <div className="space-y-2">
                {Array(4)
                  .fill(0)
                  .map((_, idx) => (
                    <Skeleton.Input
                      key={idx}
                      active
                      size="small"
                      block
                      style={{ width: '100%' }}
                    />
                  ))}
              </div>
            ) : product.description ? (
              <div
                className="text-[15px] text-justify whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
              />
            ) : (
              <div className="text-gray-500 italic">Chưa cập nhật đặc điểm nổi bật...</div>
            )}
          </div>
          {currentPost && (
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div
                className="text-black text-base"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentPost) }}
              />
            </div>
          )}
        </Col>

        <Col xs={24} md={9}>
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-orange-500 mb-3 border-b border-orange-100 pb-2">
              Thông số sản phẩm
            </h3>
            {loading ? (
              <Skeleton
                active
                paragraph={{
                  rows: 8,
                  width: ['60%', '40%', '50%', '70%', '60%', '50%', '40%', '60%']
                }}
              />
            ) : (
              (() => {
                const rows = parseStringToTableInfo(product.tableInfo)
                  .filter((r) => (r?.key && r.key.trim()) || (r?.value && String(r.value).trim()))
                if (!rows.length) {
                  return <div className='text-gray-500 italic'>Chưa cập nhật thông tin sản phẩm...</div>
                }
                return (
                  <dl className="divide-y divide-gray-100">
                    {rows.map((row, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:grid sm:grid-cols-[40%_1fr] sm:items-start gap-y-1 sm:gap-x-4 py-2.5 px-2 -mx-2 rounded-md transition-colors hover:bg-orange-50/50"
                      >
                        <dt className="text-[13px] sm:text-sm font-medium uppercase tracking-wide text-gray-500 leading-relaxed break-words">
                          {row.key}
                        </dt>
                        <dd className="text-sm sm:text-[15px] text-gray-900 leading-relaxed [&_p]:m-0 [&_p]:leading-relaxed [&_a]:text-orange-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-gray-900 [&_strong]:font-semibold">
                          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.value) }} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                )
              })()
            )}
          </div>

        </Col>
      </Row>

      {product.youtubeUrl && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-xl md:text-2xl font-semibold text-orange-500 mb-4">
            Video đánh giá sản phẩm
          </h3>
          <div className="grid md:grid-cols-12 gap-4 md:gap-6 items-start">
            <div className="md:col-span-7">
              <div
                style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  height: 0,
                  overflow: 'hidden',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <iframe
                  src={
                    ytbVideoId
                      ? `https://www.youtube.com/embed/${ytbVideoId}`
                      : 'https://www.youtube.com/embed/hwsKMrkCalE'
                  }
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 0,
                  }}
                />
              </div>
            </div>
            <div className="md:col-span-5">
              <div className="text-base md:text-lg font-semibold text-gray-800">
                {youtubeTitle.length > 160
                  ? youtubeTitle.slice(0, 160) + '...'
                  : youtubeTitle}
              </div>
            </div>
          </div>
        </div>
      )}

      {(loading || relatedProducts.length > 0) && (
        <div className="mt-10">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Sản phẩm tương tự</h2>
          <Row gutter={[24, 24]}>
            {loading
              ? Array(4)
                  .fill(0)
                  .map((_, idx) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                      <Skeleton active avatar paragraph={{ rows: 4 }} />
                    </Col>
                  ))
              : relatedProducts.map((item, idx) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={item.id || idx}>
                    <ProductCard
                      product={item}
                      onClickCard={() => setLoading(true)}
                    />
                  </Col>
                ))}
          </Row>
        </div>
      )}
    </div>
  )
}


export default ProductDetail
