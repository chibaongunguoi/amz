import { useEffect, useState, useMemo, memo,useRef } from 'react';
import { Row, Col, Button, Grid } from 'antd';
import { useLocation } from 'react-router-dom';
import ProductCard from './ProductCard';
import routePath from '../../constants/routePath';
import { UI } from '../../constants';
import ImageWithFallback from '../common/ImageWithFallback';

const { useBreakpoint } = Grid;

const { DEFAULT_VISIBLE, PRODUCT_PAGE_VISIBLE, INCREMENT } = UI.GRID;

const BannerCol = memo(function BannerCol({ image,index }) {
  console.log('Rendering BannerCol with image:', index);
  return (
    <Col xs={24} sm={24} md={24} lg={16}>
      <div id={`banner-${index}`} className="transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl rounded-xl overflow-hidden">
        <ImageWithFallback
          src={image}
          alt="Banner"
          className="w-full object-cover rounded-xl"
          fallback={
            <div className="w-full min-h-[180px] flex items-center justify-center bg-gray-100 text-gray-400 rounded-xl">
              Banner chưa cập nhật
            </div>
          }
        />
      </div>
    </Col>
  );
});

function ProductGrid({ 
  products = [], 
  banners = [], 
  title, 
  buttons = [], 
  activeCategory 
}) {
  const screens = useBreakpoint();
  const location = useLocation();
  const isProductPage = location.pathname.includes(routePath.product);
  const initialCount = isProductPage
    ? PRODUCT_PAGE_VISIBLE
    : DEFAULT_VISIBLE;
    
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);


  useEffect(() => {
    setVisibleCount(initialCount);
    setIsLoadingMore(false);
  }, [initialCount, products, activeCategory]);

  const gridItems = useMemo(() => {
    const visibleProducts = products.slice(0, visibleCount);
    const items = [];
    let productIndex = 0;
    for (let i = 0; i < visibleProducts.length + banners.length; i++) {
      const banner = banners.find(b => b.index === i);
      if (banner && screens.lg) {
        console.log('Checking for banner at index:', i, 'Found:', banners);
        items.push(
          <BannerCol key={`banner-${i}`} image={banner.image} index={banner.indexi} />
        );

      } else if (productIndex < visibleProducts.length) {
        const product = visibleProducts[productIndex];
        items.push(
          <Col 
            key={product.id} 
            xs={12} 
            sm={12} 
            md={12} 
            lg={8} 
            className="flex"
          >
            <ProductCard product={product} />
          </Col>
        );
        productIndex++;
      }

    }

    return items;
  }, [products, visibleCount, banners, screens.lg]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    window.setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + INCREMENT, products.length));
      setIsLoadingMore(false);
    }, 180);
  };

  const hasMore = visibleCount < products.length;
  const showHeader = title || buttons.length > 0;

  const containerClass = screens.lg 
    ? 'p-5 bg-white rounded-lg shadow-md'
    : 'p-0 rounded-lg shadow-md';

  return (
    <div className={containerClass}>
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          {title && screens.lg && (
            <h2 className="text-2xl font-bold mb-0">{title}</h2>
          )}
          
          {buttons.length > 0 && (
            <div className="flex gap-2 ml-auto">
              {buttons.map((btn, index) => (
                <Button
                  key={index}
                  type="default"
                  size={btn.size || 'large'}
                  className={`!font-semibold ${
                    activeCategory === btn.category
                      ? '!bg-[#D65312] !text-white'
                      : '!bg-white !text-[#D65312] border-[#D65312]'
                  }`}
                  onClick={btn.onClick}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <Row 
        gutter={[16, 16]} 
        className="flex flex-wrap rounded-lg bg-gray-50"
      >
        {gridItems}

        {(hasMore || products.length > initialCount) && (
          <Col span={24} className="mt-4 py-4">
            <div className={`relative flex w-full px-2 sm:px-4 ${hasMore ? 'min-h-[44px] items-center justify-center' : 'justify-end'}`}>
              {hasMore && (
                <Button
                  type="default"
                  size="large"
                  loading={isLoadingMore}
                  aria-label={`Xem thêm sản phẩm, còn ${products.length - visibleCount} sản phẩm`}
                  className="!font-semibold !border !border-gray-400 hover:!text-orange-500"
                  onClick={handleLoadMore}
                >
                  Xem thêm ({products.length - visibleCount})
                </Button>
              )}

              <span
                className={
                  hasMore
                    ? 'hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500'
                    : 'text-xs text-gray-500'
                }
              >
                Đã hiển thị {Math.min(visibleCount, products.length)}/{products.length} sản phẩm
              </span>
            </div>

            {hasMore && (
              <div className="mt-2 flex justify-end px-2 sm:hidden">
                <span className="text-xs text-gray-500">
                  Đã hiển thị {Math.min(visibleCount, products.length)}/{products.length} sản phẩm
                </span>
              </div>
            )}
          </Col>
        )}
      </Row>
    </div>
  );
}

export default memo(ProductGrid);
