import React from 'react'
import { Carousel, ConfigProvider } from 'antd'
import { useSelector } from 'react-redux';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import ImageWithFallback from '../../components/common/ImageWithFallback';



const carouselError = [
  "https://th.bing.com/th/id/OIP.EpBZaK5D9zRRY8kD4ifgAwHaEr?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3",
  "https://th.bing.com/th/id/OIP.YQz2GkHGIa82AOn9n8atUgHaEK?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3",
  "https://th.bing.com/th/id/OIP.w7SmH1vC1Z_FjjQfa9ZICQHaEK?rs=1&pid=ImgDetMain&cb=idpwebp1&o=7&rm=3"
]

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
    {direction === 'prev' ? <LeftOutlined style={{ color: '#333' }} /> : <RightOutlined style={{ color: '#333' }} />}
  </div>
);

function MainCarousel() {
  const home = useSelector(state =>
    state.settings &&
    Array.isArray(state.settings.homeSettings)
      ? state.settings.homeSettings
      : []
  );
  const images =
    home.length > 0 &&
    Array.isArray(home[0]?.imageLinks) &&
    home[0].imageLinks.length > 0
      ? home[0].imageLinks
      : carouselError;

  return (
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
      <div className="carousel-container group">
        <Carousel 
          autoplay 
          arrows 
          prevArrow={<CustomArrow direction="prev" />}
          nextArrow={<CustomArrow direction="next" />}
          className="main-carousel"
        >
          {images.map((image, idx) => (
            <div key={image || idx} className="carousel-image-container">
              <ImageWithFallback
                src={image}
                alt=""
                className="
                  w-full object-cover
                  h-[180px]
                  md:h-[400px]
                  lg:h-[560px]
                  rounded-lg
                  mt-2 md:mt-0
                  carousel-image
                "
                fallback={
                  <div className="w-full h-[180px] md:h-[400px] lg:h-[560px] rounded-lg mt-2 md:mt-0 bg-gray-100 text-gray-400 flex items-center justify-center">
                    Banner chưa cập nhật
                  </div>
                }
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
  )
}

export default MainCarousel
