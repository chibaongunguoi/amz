import React from 'react';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import CountSale from './CountSale';
import BannerCustom from './BannerCustom';
import BannerCustom2 from './BannerCustom2';
import Feeback from './Feeback';
import VideoBanner from './VideoBanner';
import { ProductGrid } from '../../components/product';
import { loadCollection } from '@/lib/data';
import iconPopular from '../../assets/iconPopular.png';
import fireIcon from '../../assets/fire.png';
import OptimizedImage from '@/components/common/OptimizedImage';

import { GROUP_KEYS, FILTER_LABELS } from '../../constants';
import {
  selectAllProducts,
  selectFilteredBestSellers,
  selectFilteredOnSale,
  selectBestSellerFilter,
  selectOnSaleFilter,
  setBestSellerFilter,
  setOnSaleFilter,
} from '../../store/slices/productsSlice';
import { selectHomeSettings } from '../../store/slices/settingsSlice';

function Home() {
  const dispatch = useDispatch();
  
  const homeSettings = useSelector(selectHomeSettings);
  const allProducts = useSelector(selectAllProducts).filter(p => p.isHide !== true);
  const bestSellersFiltered = useSelector(selectFilteredBestSellers);
  const onSaleFiltered = useSelector(selectFilteredOnSale);
  const bestSellers =
    bestSellersFiltered.length > 0 ? bestSellersFiltered : allProducts.slice(0, 12);
  const onSaleProducts =
    onSaleFiltered.length > 0 ? onSaleFiltered : allProducts.slice(12, 24);
  const bestSellerFilter = useSelector(selectBestSellerFilter);
  const onSaleFilter = useSelector(selectOnSaleFilter);
 const [highlightedElement, setHighlightedElement] = useState(null);
 const [config, setConfig] = useState(null);
 const fetchConfig = async () => {
     try {
       // loadCollection(..., true) = forceReload: luôn đọc từ server, bỏ qua cache
       const docs = await loadCollection('ui-config', true)
       if (docs.length > 0) {
         let doc = docs[0]
         setConfig(doc)
       }
     } catch (error) {
       console.error('Error fetching config:', error)
       message.error('Lỗi khi tải cấu hình')
     } 
   }
   useEffect(() => {
       fetchConfig()
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [])
    useEffect(() => {
      const handleMessage = (event) => {
        console.log('Received message from iframe:', event.data);
        // Kiểm tra nguồn gốc (bảo mật)
        // if (event.origin !== 'http://localhost:3000') return;
        
        const { type, selector } = event.data;
        
        if (type === 'HOVER') {
          console.log('🔴 Highlight element:', selector);
          setHighlightedElement(selector);
        } else if (type === 'LEAVE') {
          console.log('⚪ Clear highlight');
          setHighlightedElement(null);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, []);
    
    // Xử lý highlight khi có selector mới
    useEffect(() => {
      // Xóa highlight cũ
      document.querySelectorAll('.admin-highlight').forEach((el) => {
        el.classList.remove('admin-highlight');
        el.style.outline = '';
        el.style.backgroundColor = '';
        el.style.transition = '';
      });
      
      // Thêm highlight mới
      if (highlightedElement) {
        const element = document.querySelector(highlightedElement);
        if (element) {
          element.classList.add('admin-highlight');
          element.style.outline = '3px solid #ef4444';
          element.style.outlineOffset = '2px';
          element.style.backgroundColor = '#fee2e2';
          element.style.transition = 'all 0.3s ease';
          
          // Tự động scroll đến phần tử
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.warn('Element not found:', highlightedElement);
        }
      }
    }, [highlightedElement]);

  const bestSellerButtons = [
    {
      label: FILTER_LABELS.TOP_TAI_NGHE,
      type: 'primary',
      className: '!font-semibold !bg-[#D65312]',
      onClick: () => dispatch(setBestSellerFilter(GROUP_KEYS.TAI_NGHE)),
      category: GROUP_KEYS.TAI_NGHE,
    },
    {
      label: FILTER_LABELS.TOP_LOA,
      className: '!font-semibold',
      onClick: () => dispatch(setBestSellerFilter(GROUP_KEYS.LOA)),
      category: GROUP_KEYS.LOA,
    },
  ];

  const onSaleButtons = [
    {
      label: FILTER_LABELS.TAI_NGHE_SALE,
      type: 'primary',
      className: '!font-semibold !bg-[#D65312]',
      onClick: () => dispatch(setOnSaleFilter(GROUP_KEYS.TAI_NGHE)),
      category: GROUP_KEYS.TAI_NGHE,
    },
    {
      label: FILTER_LABELS.LOA_SALE,
      className: '!font-semibold',
      onClick: () => dispatch(setOnSaleFilter(GROUP_KEYS.LOA)),
      category: GROUP_KEYS.LOA,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {console.log('Home render with config:', config) }
      <VideoBanner />
      <CountSale endDate={homeSettings?.[0]?.endDate} content={homeSettings?.[0]?.content} />
      <BannerCustom />
      <ProductGrid
        title={
          <span className="flex gap-2">
            <b>Top bán chạy</b>
            <OptimizedImage width={34} height={24} sizes="34px"  src={iconPopular} alt="" />
          </span>
        }
        buttons={bestSellerButtons}
        products={bestSellers}
        banners={[
          { index: 0, image:config?.banner.mainItems?.[1]?.value || '', indexi: 2 },
          { index: 6, image: config?.banner.mainItems?.[1]?.value || '' , indexi: 2},
        ]}
        activeCategory={bestSellerFilter}
      />
      <BannerCustom2 />
      <ProductGrid
        title={
          <span className="flex gap-2">
            <b>Deal cực cháy - Mua ngay kẻo lỡ</b>
            <OptimizedImage width={34} height={24} sizes="34px" src={fireIcon} alt="" />
          </span>
        }
        buttons={onSaleButtons}
        products={onSaleProducts}
        banners={[
          { index: 0, image: config?.banner.mainItems?.[3]?.value  || '' ,indexi: 4},
          { index: 6, image: config?.banner.mainItems?.[4]?.value || '' ,indexi: 5},
        ]}
        activeCategory={onSaleFilter}
      />
      <Feeback />
    </div>
  );
}

export default Home;
