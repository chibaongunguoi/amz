import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Carousel, ConfigProvider } from 'antd'
import { useNavigate } from 'react-router-dom';
// Firebase đã được loại bỏ
import { useFirestore } from '../../hooks/useFirestore'
import { Flame, Clock } from 'lucide-react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import fireGif from '@/assets/fire.gif';
import clockGif from '@/assets/clock.gif';
import routePath from '../../constants/routePath'
import moment from 'moment';
import { useDispatch } from 'react-redux';
import { setCurrentSale as setSale } from '../../store/slices/saleSlice';
import { CAROUSEL_DIRECTIONS } from '../../constants';
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

const CustomCarousel = ({ saleEvents, navigate, dispatch }) => {
    const handleSelectEvent = (event) =>{
        dispatch(setSale(event))
        navigate(routePath.saleDetail)
    }

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
                    dots={true}
                    autoplay
                    arrows={true}
                    prevArrow={<CustomArrow direction="prev" />}
                    nextArrow={<CustomArrow direction="next" />}
                    className="main-carousel"
                >
                    {saleEvents.map(event => (
                        <div key={event.id} className="carousel-image-container">
                            <div
                                key={event.id}
                                className="carousel-image-container"
                                onClick={() => handleSelectEvent(event)}
                            >
                                <OptimizedImage
                                    alt={event.name}
                                    src={event.linkBanner}
                                    width={1400}
                                    height={560}
                                    sizes="(max-width: 768px) 100vw, 1400px"
                                    className="
                                w-full object-cover
                                h-[180px]
                                md:h-[400px]
                                lg:h-[560px]
                                rounded-lg
                                mt-2 md:mt-0
                                carousel-image
                            "
                                />
                            </div>

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

function Sale() {
    const navigate = useNavigate();
    const [saleEvents, setEvents] = useState([]);
    const [currentSaleEvents, setCurrentSaleEvents] = useState([])
    const [nextSaleEvents, setNextSaleEvents] = useState([])
    const { getAllDocs } = useFirestore(null, "eventAMZ");
    const dispatch = useDispatch();

    useEffect(() => {
        getAllDocs().then(setEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!saleEvents || saleEvents.length === 0) return;

        const today = moment().startOf('day');

        const current = [];
        const next = [];

        saleEvents.forEach(event => {
            const start = moment(event.startDate, 'YYYY-MM-DD');
            const end = moment(event.endDate, 'YYYY-MM-DD');

            if (start.isSameOrBefore(today) && end.isSameOrAfter(today)) {
                current.push(event);
            } else if (start.isAfter(today)) {
                next.push(event);
            }
        });

        setCurrentSaleEvents(current);
        setNextSaleEvents(next);

    }, [saleEvents]);

    useEffect(() => {

    }, [currentSaleEvents, nextSaleEvents]);

    return (
        <div>
            <div className="mb-4">
                <nav className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1 text-black border-2 p-2 rounded-full border-black hover:bg-gray-100 transition-all duration-300 cursor-pointer" onClick={() => navigate(routePath.home)}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                            <path d="M3 10.75L12 4l9 6.75" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4.5 10.75V19a1 1 0 001 1h3.5v-4.25a1 1 0 011-1h2a1 1 0 011 1V20H18.5a1 1 0 001-1v-8.25" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Trang chủ</span>
                    </span>
                    <span className="mx-1 text-black">{'>'}</span>
                    <span className="flex items-center cursor-pointer gap-1 bg-orange-500 text-white font-semibold p-2 rounded-full border-2 border-orange-500">
                        {'Khuyến mãi hot'}
                    </span>
                </nav>
            </div>

            <div className="mt-8">
                <h2 className="!text-base font-bold mb-[20px] mt-[34px] flex items-center gap-2">
                    Khuyến mãi HOT <OptimizedImage src={fireGif} width={36} height={36} sizes="36px" alt="" />
                </h2>
                <CustomCarousel saleEvents={currentSaleEvents} navigate={navigate} dispatch={dispatch} ></CustomCarousel>
            </div>

            <div className="mt-8">
                <h2 className="!text-base font-bold mb-[20px] mt-[34px] flex items-center gap-2">
                    Sắp diễn ra <OptimizedImage src={clockGif} width={36} height={36} sizes="36px" alt="" />
                </h2>
                <CustomCarousel saleEvents={nextSaleEvents} navigate={navigate}  dispatch={dispatch} ></CustomCarousel>
            </div>


        </div>
    )
}

export default Sale
