
import { useMemo, memo } from 'react';
import { Card, Tag, Grid } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getColorHex } from '../../constants';
import { formatCurrency, createProductSlug } from '../../utils';
import { PHONE_NUMBER } from '../../constants/phoneNumber';
import routePath from '../../constants/routePath';
import ImageWithFallback from '../common/ImageWithFallback';
import { formatProductDisplayName } from '@/utils/productSearch.utils';

const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  return images.split(';;').filter(Boolean);
};

const getProductColors = (product) => {
  const baseColors = Array.isArray(product.colors)
    ? product.colors
    : [product.colors || product.color].filter(Boolean);
  if (baseColors.length > 0) return baseColors;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  return [...new Set(variants.map((variant) => variant?.color).filter(Boolean))];
};

function ProductCard({ product }) {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isSmall = !screens.sm;

  const { images, colors, displayPrice, originalPrice } = useMemo(() => {
    const clrs = getProductColors(product);
    
    // Check if product has variants
    const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
    
    let priceForSale = Number(product.priceForSale) || 0;
    let priceDefault = Number(product.priceDefault) || 0;
    let salePercent = Number(product.salePercent) || 0;
    // Ưu tiên ảnh đại diện sản phẩm (product.images) - dùng làm thumbnail trên các trang
    // listing, đồng nhất với cách trang chi tiết hiển thị mặc định khi chưa chọn biến thể.
    let imgs = parseImages(product.images);
    
    // Pricing vẫn lấy theo biến thể (in-stock đầu tiên, hoặc biến thể đầu tiên).
    // Ảnh chỉ fallback sang biến thể nếu product không có ảnh đại diện.
   if (hasVariants) {
  // Lọc các variant còn hàng (inventory > 0)
  const inStockVariants = product.variants.filter(v => Number(v.inventory) > 0);
  
  let variant = null;
  
  if (inStockVariants.length > 0) {
    // Tìm variant có priceForSale thấp nhất trong số các variant còn hàng
    variant = inStockVariants.reduce((minVariant, currentVariant) => {
      const minPrice = Number(minVariant.priceForSale) || Infinity;
      const currentPrice = Number(currentVariant.priceForSale) || Infinity;
      return currentPrice < minPrice ? currentVariant : minVariant;
    }, inStockVariants[0]);
  } else {
    // Nếu không có variant nào còn hàng, lấy variant đầu tiên (hết hàng)
    variant = product.variants[0];
  }
  
  if (variant) {
    priceForSale = Number(variant.priceForSale) || priceForSale;
    priceDefault = Number(variant.priceDefault) || priceDefault;
    salePercent = Number(variant.salePercent) || salePercent;
    
    if (imgs.length === 0 && variant.images) {
      const variantImages = parseImages(variant.images);
      if (variantImages.length > 0) {
        imgs = variantImages;
      }
    }
  }
}
    
    // priceForSale đã là giá cuối (đã giảm) theo convention của admin form,
    // không nhân (1 - salePercent/100) thêm lần nữa để tránh double-discount.
    const finalPrice = priceForSale;

    return {
      images: imgs,
      colors: clrs,
      displayPrice: formatCurrency(finalPrice),
      originalPrice: priceDefault > finalPrice ? formatCurrency(priceDefault) : null,
    };
  }, [product]);

  const handleCardClick = () => {
    const slug = createProductSlug(product);
    if (slug) {
      navigate(`/product-detail/${slug}`);
    } else {
      // Fallback to old URL format if slug generation fails
      const params = new URLSearchParams();
      params.set('id', product.id || product.sku || '');
      navigate({
        pathname: routePath.productDetail,
        search: params.toString(),
      });
    }
  };

  const handleContactClick = (e) => {
    e.stopPropagation();
    window.open(`https://zalo.me/${PHONE_NUMBER.GENERAL}`, '_blank');
  };

  const isBestSeller = product.isBestSeller === '1' || product.isBestSeller === true;
  
  // Calculate sale percent from product or selected variant
  const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
  let salePercent = Number(product.salePercent) || 0;
  if (hasVariants) {
    const variant = product.variants.find(v => Number(v.inventory) > 0) || product.variants[0];
    if (variant) {
      salePercent = Number(variant.salePercent) || salePercent;
    }
  }
  
  return (
    <Card
      hoverable
      onClick={handleCardClick}
      className="w-full mb-4 !rounded-2xl flex flex-col flex-1 h-full overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
      styles={{
        body: {
          padding: isSmall ? 4 : 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        },
      }}
      cover={
        <div className="relative w-full aspect-square bg-gray-50">
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between p-3">
            {salePercent > 0 && (
              <Tag
                color="#FFE8D3"
                className="font-bold !rounded-lg"
                style={{
                  padding: isSmall ? '2px 4px' : '4px 10px',
                  color: '#D65312',
                  fontSize: isSmall ? 10 : 14,
                }}
              >
                Giảm {salePercent}%
              </Tag>
            )}
          </div>

          <ImageWithFallback
            src={images}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
            fallback={
              <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 rounded-lg">
                Ảnh chưa được cập nhật
              </div>
            }
          />
        </div>
      }
    >
      <div className="flex flex-col justify-end h-full">
        <div className="flex justify-between gap-1">
          <div className="flex-1">
            <div className="be-vietnam-pro-medium text-sm sm:text-base mb-1">
              {formatProductDisplayName(product.name)}
              {console.log('ProductCard render:', product)}
            </div>
            
            <div className="font-bold text-base sm:text-xl text-[#D65312] leading-none">
              {displayPrice}
              {originalPrice && (
                <span className="be-vietnam-pro-light text-xs sm:text-sm text-[#aaa] ml-2 line-through">
                  {originalPrice}
                </span>
              )}
            </div>
            
            <button
              className="text-[#888] text-sm mt-1 cursor-pointer hover:underline text-left"
              onClick={handleContactClick}
            >
              Giá tham khảo. Chi tiết xin liên hệ zalo
            </button>

            {isBestSeller && (
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium tracking-wide uppercase text-[#D65312] bg-[#FFF1E5] border border-[#FFD7B5] rounded-full px-2 py-[2px]">
                  <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-[#D65312]" />
                  Best seller
                </span>
              </div>
            )}
          </div>

          <ColorDots colors={colors} />
        </div>
      </div>
    </Card>
  );
}

const ColorDots = memo(function ColorDots({ colors }) {
  if (!colors.length) return null;
  
  const visibleColors = colors.slice(0, 3);
  const remainingCount = colors.length - 3;

  return (
    <div className="flex flex-col gap-1 items-center relative group">
      <div className="flex flex-col gap-1 items-center">
        {visibleColors.map((color) => (
          <span
            key={color}
            title={color}
            className="inline-block w-4 h-4 rounded-full border border-gray-300"
            style={{ background: getColorHex(color) }}
          />
        ))}
        
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500">+{remainingCount}</span>
        )}
      </div>

      {remainingCount > 0 && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-1 items-center border border-gray-200 min-w-[60px] z-50">
          {colors.map((color) => (
            <span
              key={color}
              title={color}
              className="inline-block w-4 h-4 rounded-full border border-gray-300"
              style={{ background: getColorHex(color) }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default memo(ProductCard);
