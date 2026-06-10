import React from 'react'
import { Card, Rate, Button, Avatar } from 'antd'
import feebackIcon from '../../assets/feedbackIcon.png'
import { MAP_URL } from '../../constants/mapsUrl'
import OptimizedImage from '@/components/common/OptimizedImage'
const feedbacks = [
  {
    name: 'Ngọc Anh',
    date: '12/03/2024',
    location: 'AMZ TECH Đà Nẵng',
    rating: 5,
    content:
      'Dịch vụ tuyệt vời, nhân viên tư vấn nhiệt tình. Sản phẩm chất lượng đúng như quảng cáo. Sẽ quay lại mua lần sau!',
    avatar: 'https://i.pravatar.cc/40?img=1',
  },
  {
    name: 'Quang Huy',
    date: '05/11/2023',
    location: 'AMZ TECH Đà Nẵng',
    rating: 4,
    content:
      'Giao hàng nhanh, đóng gói cẩn thận. Giá cả hợp lý, nhiều chương trình khuyến mãi hấp dẫn.',
    avatar: 'https://i.pravatar.cc/40?img=2',
  },
  {
    name: 'Minh Châu',
    date: '28/07/2022',
    location: 'AMZ TECH Hà Nội',
    rating: 5,
    content:
      'Mình rất hài lòng với trải nghiệm mua sắm tại đây. Nhân viên hỗ trợ rất chu đáo và thân thiện.',
    avatar: 'https://i.pravatar.cc/40?img=3',
  },
]

function Feeback() {

  return (
    <div className=" py-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 flex gap-2 items-center">
          <span>Khách hàng nói gì về Amz Tech</span> <OptimizedImage height={24} width={24} sizes="24px" src={feebackIcon} alt="" />
        </h2>
        <div className="flex flex-col lg:flex-row flex-wrap gap-4 justify-center mb-6">
          {feedbacks.map((fb, idx) => (
            <Card
              key={idx}
              className="flex-1 rounded-xl shadow-md transition transform hover:-translate-y-2 hover:shadow-xl"
              style={{
                body: { padding: '20px' }
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Avatar src={fb.avatar} size={48} />
                <div>
                  <div className="font-semibold">{fb.name}</div>
                  <Rate disabled defaultValue={fb.rating} className="text-yellow-400 text-sm" />
                </div>
              </div>
              <div className="text-gray-500 text-sm mb-2">
                {fb.date} - Mua hàng tại {fb.location}
              </div>
              <div className="text-gray-700 text-sm">
                {fb.content}
              </div>
            </Card>
          ))}
        </div>
        <div className="flex justify-center gap-4">
          <a
            href= {MAP_URL.HA_NOI_REVIEW}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              className="rounded-full px-8 !font-semibold !border-1 !border-[#999999] hover:!text-orange-500"
              type="default"
              size="large"
            >
              Khách HN tin tưởng AMZ
            </Button>
          </a>
          <a
            href={MAP_URL.DA_NANG_REVIEW}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              className="rounded-full px-8 !font-semibold !border-1 !border-[#999999] hover:!text-orange-500"
              type="default"
              size="large"
            >
              Số 1 Đà Nẵng
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Feeback
