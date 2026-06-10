import React, { useEffect, useState } from 'react'
import Header from '../components/features/Header'
import SideBarProduct from '../components/features/SideBarProduct'
import { Col, Row } from 'antd'
import { Grid, Carousel, ConfigProvider } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import Footer from '../components/features/Footer'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import routePath from '../constants/routePath';
import { Breadcrumb } from '../components/common';
import { selectCategory } from '../store/slices/filtersSlice';
import { selectAllProducts } from '../store/slices/productsSlice';
import FloatButtonPage from '../components/features/FloatButtonPage';
import { PRICE_RANGES, DEFAULT_BRANDS, CAROUSEL_DIRECTIONS, FIREBASE_COLLECTIONS, CATEGORY_TO_COLLECTION } from '../constants';
import { useProductDisplayCategories } from '@/hooks/useProductDisplayCategories';
import OptimizedImage from '@/components/common/OptimizedImage';

const CustomArrow = ({ className, style, onClick, direction }) => (
  <div
    className={`${className} custom-arrow`}
    style={{
      ...style,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      zIndex: 2,
      opacity: 0,
      transition: 'opacity 0.3s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    }}
    onClick={onClick}
  >
    {direction === CAROUSEL_DIRECTIONS.PREV ? <LeftOutlined style={{ color: '#333' }} /> : <RightOutlined style={{ color: '#333' }} />}
  </div>
);

function ProductLayout({ children }) {
  const screens = Grid.useBreakpoint()
  const category = useSelector(selectCategory);
  const allProductsArray = useSelector(selectAllProducts);
  const { collectionByLabel } = useProductDisplayCategories();

  const [brands, setBrands] = useState(DEFAULT_BRANDS)

  useEffect(() => {
    if (category) {
      const filteredBrands = Array.from(
        new Set(
          allProductsArray
            .map(p => p.brand)
            .filter(Boolean)
        )
      )
      setBrands(filteredBrands.length > 0 ? filteredBrands : DEFAULT_BRANDS)

    } else {
      setBrands(DEFAULT_BRANDS)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const navigate = useNavigate()

  const getPriceRangesByCategory = () => {
    const collection = category ? collectionByLabel[category] || CATEGORY_TO_COLLECTION[category] : null;
    if (collection === FIREBASE_COLLECTIONS.KARAOKE) return PRICE_RANGES.LOA;
    return PRICE_RANGES.TAI_NGHE;
  };

  const carouselImages = [
    {
      src: "https://chauaudio.com/cdn/images/tin-tuc/loa-marshall-la-thuong-hieu-nuoc-nao-phu-hop-voi-nhung-ai-5.jpg",
      alt: "carousel-1"
    },
    {
      src: "https://th.bing.com/th/id/R.b1c51812c16cb5d4d84dabec2e75265d?rik=1t0PlY8a%2b649rA&pid=ImgRaw&r=0",
      alt: "carousel-2"
    },
    {
      src: "https://th.bing.com/th/id/OIP.skBzSDoI0713daeCX87n4QHaEK?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3",
      alt: "carousel-3"
    }
  ];

  return (
    <div>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#F3F3F3'
        }}
      >
        <Header />
      </div>

      <div className="max-w-[1400px] mx-auto px-2 md:px-3 lg:px-0">
        <Row>
          <Breadcrumb
            items={[
              {
                label: (
                  <>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ display: 'inline', verticalAlign: 'middle' }}>
                      <path d="M3 10.75L12 4l9 6.75" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.5 10.75V19a1 1 0 001 1h3.5v-4.25a1 1 0 011-1h2a1 1 0 011 1V20H18.5a1 1 0 001-1v-8.25" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="ml-1">Trang chủ</span>
                  </>
                ),
                onClick: () => navigate(routePath.home)
              },
              {
                label: category == 'Loa' ? "Loa karaoke cũ" : category || 'Tất cả sản phẩm',
                onClick: () => { },
                active: true
              }
            ]}
          />
        </Row>
        <Row>
          <Col span={24}>
            <ConfigProvider
              theme={{
                components: {
                  Carousel: {
                    arrowSize: 0,
                    arrowOffset: 24,
                  },
                },
              }}
            >
              <div className="carousel-container group mb-4">
                <Carousel
                  autoplay
                  arrows
                  prevArrow={<CustomArrow direction="prev" />}
                  nextArrow={<CustomArrow direction="next" />}
                  className="product-carousel"
                >
                  {carouselImages.map((img, idx) => (
                    <div key={idx} className="carousel-image-container">
                      <OptimizedImage
                        src={img.src}
                        alt={img.alt}
                        width={1400}
                        height={350}
                        sizes="(max-width: 768px) 100vw, 1400px"
                        className={`
                          w-full object-cover rounded-lg carousel-image
                          ${screens.lg ? 'h-[350px]' : screens.md ? 'h-[250px]' : 'h-[180px]'}
                        `}
                      />
                    </div>
                  ))}
                </Carousel>
                <style jsx>{`
                  .carousel-container {
                    position: relative;
                  }
                  
                  .carousel-container .custom-arrow {
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                  }
                  
                  .carousel-container:hover .custom-arrow {
                    opacity: 1 !important;
                    transform: scale(1);
                  }

                  .carousel-image-container {
                    overflow: hidden;
                    border-radius: 8px;
                  }

                  .carousel-image {
                    transition: transform 0.5s ease-in-out;
                    cursor: pointer;
                  }

                  .carousel-image:hover {
                    transform: scale(1.05);
                  }
                `}</style>
              </div>
            </ConfigProvider>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={6} md={7} lg={5}>
            {screens.sm && (
              <div className={`bg-white rounded-lg p-4 shadow-lg transition-shadow duration-300 hover:shadow-2xl`}>
                <SideBarProduct
                  brands={brands}
                  priceRanges={getPriceRangesByCategory()}
                  needs={[
                    { value: 'chongon', label: 'Chống ồn' },
                    { value: 'xuyendam', label: 'Xuyên âm' },
                    { value: 'mic', label: 'Có micro đàm thoại' },
                    { value: 'nghegoitot', label: 'Nghe gọi tốt' },
                    { value: 'tapthethao', label: 'Tập luyện thể thao' },
                    { value: 'chongnuoc', label: 'Chống nước, chống bụi' },
                    { value: 'choigame', label: 'Chơi game' },
                    { value: 'nghenhac', label: 'Nghe nhạc trữ tình' },
                    { value: 'nghenhacso', label: 'Nghe nhạc sôi động' },
                  ]}
                />
              </div>
            )}
          </Col>
          <Col xs={24} sm={18} md={17} lg={19}>
            {children}
            <Footer />
          </Col>
        </Row>
      </div>
      <FloatButtonPage />
    </div>
  )
}

export default ProductLayout
