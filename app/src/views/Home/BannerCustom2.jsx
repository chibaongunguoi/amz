import React from 'react'
import { Button } from 'antd'
import bannerCustom2 from '../../assets/bannerCustom2.png'
import { useDispatch, useSelector } from "react-redux";
import { setCategory } from "../../store/slices/filtersSlice";
import { useNavigate } from "react-router-dom";
import routePath from "../../constants/routePath";
import ImageWithFallback from "../../components/common/ImageWithFallback";

function BannerCustom2() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const home = useSelector(state => state.settings.homeSettings);
  console.log('home settings in BannerCustom2:', home);
  const bannerSources = (home && home[0] && home[0].bannerNowLink)
    ? [home[0].bannerNowLink, bannerCustom2]
    : [bannerCustom2];

  return (
    <div className="relative rounded-xl overflow-hidden bg-white shadow-md p-0 min-h-[260px] md:min-h-[350px] lg:min-h-[550px] group flex items-center">
      <ImageWithFallback
        src={bannerSources}
        alt="Tai nghe"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 scale-100 group-hover:scale-105"
        style={{ zIndex: 1 }}
        fallback={
          <div
            className="absolute inset-0 w-full h-full bg-gray-200"
            style={{ zIndex: 1 }}
            aria-hidden
          />
        }
      />
      <div className="flex-1 flex flex-col justify-center pl-8 pr-8 py-6 z-10 animate-fade-in">
        <div>
          <h2 className="!font-extrabold text-3xl md:text-6xl leading-tight mb-2 text-white drop-shadow-lg transition-all duration-300">
            <span className="block transition-transform duration-300 hover:translate-x-6 hover:scale-105 cursor-pointer">
              THU CŨ
              <br />
              ĐỔI MỚI
              <br />
              GIÁ TỐT NHẤT
              <br />
              THỊ TRƯỜNG
            </span>
          </h2>
          <div className="gap-4 mb-4 transition-all duration-300">
            <p className="text-sm md:text-base w-100 text-white opacity-80 m-0">
              <span className="font-semibold">AMZ TECH</span> – chuyên cung cấp loa và tai nghe đã qua sử dụng với chất lượng được tuyển chọn kỹ càng. Chúng tôi cam kết mang đến trải nghiệm âm thanh tuyệt vời với mức giá hợp lý nhất.
            </p>
            <Button
              type="primary"
              size='large'
              className="!bg-[#FFE8D3] !text-[#D65312] border-none !text-[21px] !font-semibold rounded-full px-6 py-2 hover:bg-orange-500 transition-all duration-300 shadow-lg whitespace-nowrap btn-shake mt-3"
              onClick={() => {
                dispatch(setCategory("Thu cũ đổi mới"))
                navigate(routePath.policyExchange);
              }}
            >
              Đổi mới ngay
            </Button>
          </div>
        </div>
      </div>
      <style>
        {`
          .animate-fade-in {
            animation: fadeInUp 1s ease;
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .btn-shake:hover {
            animation: shake 0.4s;
          }
          @keyframes shake {
            0% { transform: translateX(0); }
            20% { transform: translateX(-4px); }
            40% { transform: translateX(4px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
            100% { transform: translateX(0); }
          }
        `}
      </style>
    </div>
  )
}

export default BannerCustom2