import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import CountSale from './CountSale';
import BannerCustom from './BannerCustom';
import BannerCustom2 from './BannerCustom2';
import Feeback from './Feeback';
import VideoBanner from './VideoBanner';
import { ProductGrid } from '../../components/product';

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
  console.log('home settings in Home component:', homeSettings);
  const allProducts = useSelector(selectAllProducts).filter(p => p.isHide !== true);
  const bestSellersFiltered = useSelector(selectFilteredBestSellers);
  const onSaleFiltered = useSelector(selectFilteredOnSale);
  const bestSellers =
    bestSellersFiltered.length > 0 ? bestSellersFiltered : allProducts.slice(0, 12);
  const onSaleProducts =
    onSaleFiltered.length > 0 ? onSaleFiltered : allProducts.slice(12, 24);
  const bestSellerFilter = useSelector(selectBestSellerFilter);
  const onSaleFilter = useSelector(selectOnSaleFilter);
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
      <VideoBanner />
      <CountSale endDate={homeSettings?.[0]?.endDate} content={homeSettings?.[0]?.content} />
      <BannerCustom />
      <ProductGrid
        title={
          <span className="flex gap-2">
            <b>Top bán chạy</b>
            <OptimizedImage width={34} height={24} sizes="34px" src={iconPopular} alt="" />
          </span>
        }
        buttons={bestSellerButtons}
        products={bestSellers}
        banners={[
          { index: 0, image: homeSettings?.[0]?.topSellingImage1 || '' },
          { index: 6, image: homeSettings?.[0]?.topSellingImage2 || '' },
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
          { index: 0, image: homeSettings?.[0]?.hotDealImage1 || '' },
          { index: 6, image: homeSettings?.[0]?.hotDealImage1 || '' },
        ]}
        activeCategory={onSaleFilter}
      />
      <Feeback />
    </div>
  );
}

export default Home;
