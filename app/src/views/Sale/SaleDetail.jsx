import React from "react";
import routePath from "../../constants/routePath";
import { Carousel, Grid } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sanitizeHtml } from "@/utils/htmlSanitizer";

const SaleDetailPage = () => {
  const SaleInfo = useSelector((state) => state.sale.sale);
  const navigate = useNavigate()

  return (
    <div>
      <div className="mb-4">
        <nav className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 text-black border-2 p-2 rounded-full border-black" onClick={() => navigate(routePath.home)}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M3 10.75L12 4l9 6.75" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.5 10.75V19a1 1 0 001 1h3.5v-4.25a1 1 0 011-1h2a1 1 0 011 1V20H18.5a1 1 0 001-1v-8.25" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Trang chủ</span>
          </span>
          <span className="mx-1 text-black">{'>'}</span>
          <div className="flex items-center gap-1 text-black border-2 p-2 rounded-full border-black cursor-pointer" onClick={() => navigate(routePath.sale)}>
          
            <span>Khuyến mãi hot</span>
          </div>
          <span className="mx-1 text-black">{'>'}</span>
          <span className="flex items-center gap-1 bg-orange-500 text-white font-semibold p-2 rounded-full border-2 border-orange-500">
            {'Thông tin khuyến mãi'}
          </span>
        </nav>
      </div>
      <div className='mt-[30px]'>
        {SaleInfo ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-lg">
              <h1 className="text-[21px] be-vietnam-pro-medium  font-semibold">{SaleInfo.title}</h1>
              <div
                className="text-gray-600 be-vietnam-pro"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(SaleInfo.content) }}
              />
            </div>
          </div>
        ) : (
          <section className="rounded-lg border border-dashed border-orange-200 bg-white px-5 py-10 text-center shadow-sm">
            <h1 className="mb-2 text-xl font-semibold text-gray-900">
              Thông tin khuyến mãi đang được cập nhật
            </h1>
            <p className="text-sm leading-6 text-gray-500">
              Vui lòng quay lại sau để xem chi tiết chương trình mới nhất.
            </p>
          </section>
        )}
      </div>
    </div>
  );
};

export default SaleDetailPage;
