import React, { useEffect, useState } from 'react'
import { Card, Row, Col } from 'antd'
import dayjs from 'dayjs'
import { useSelector } from 'react-redux';
import { PHONE_NUMBER } from '../../constants/phoneNumber';
import { formatVNPhoneNumber } from '../../utils/format.utils';
import { sanitizeHtml } from '@/utils/htmlSanitizer';

function CountSale() {
  const [countdown, setCountdown] = useState('')
  const [zaloFontSize, setZaloFontSize] = useState('16px')
  const home = useSelector(state => state.settings.homeSettings);

  const endDate = Array.isArray(home) && home.length > 0 ? home[0].eventDate : null;
  const content = Array.isArray(home) && home.length > 0 ? home[0].eventContent : null;

  useEffect(() => {
    if (!endDate) return
    const interval = setInterval(() => {
      const now = dayjs()
      const end = dayjs(endDate)
      const diff = end.diff(now)
      if (diff <= 0) {
        setCountdown('Đã kết thúc')
        clearInterval(interval)
        return
      }
      const days = end.diff(now, 'day')
      const hours = end.subtract(days, 'day').diff(now, 'hour')
      const minutes = end.subtract(days, 'day').subtract(hours, 'hour').diff(now, 'minute')
      setCountdown(`${days} ngày : ${hours} giờ : ${minutes} phút`)
    }, 1000)
    return () => clearInterval(interval)
  }, [endDate])


  useEffect(() => {
    if (window.devicePixelRatio === 1.5) {
      setZaloFontSize('16px');
    } else {
      setZaloFontSize('18px');
    }
  }, []);

  if (!endDate || !content || dayjs(endDate).isBefore(dayjs())) {
    return (
      <Row gutter={10} align="top">
        <Col xs={24} md={24} lg={9}>
          <Row gutter={15}>
            <Col xs={24} md={12} className="mb-3 md:mb-0 flex justify-center">
              <Card
                className="!rounded-xl !p-0 !border-[#E6E6E6] !shadow-none flex-shrink-0 !bg-[#FFE8D3]"
                styles={{ body: { padding: '10px' } }}
              >
                <div className="flex flex-col items-center h-full justify-center">
                  <span className="text-[16px] font-semibold text-[#D65312] mb-1">
                    Thu cũ tại Hà Nội:
                  </span>
                  <span
                    className={`text-[16px] md:text-[18px] lg:text-[${zaloFontSize}] font-bold text-[#D65312]`}
                    style={{ wordBreak: 'break-all' }}
                  >
                    {"Zalo: " + formatVNPhoneNumber(PHONE_NUMBER.HA_NOI)}
                  </span>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12} className="flex justify-center">
              <Card
                className="!rounded-xl !p-0 !border-[#E6E6E6] !shadow-none flex-shrink-0 !bg-[#FFE8D3]"
                styles={{ body: { padding: '10px' } }}
              >
                <div className="flex flex-col items-center h-full justify-center">
                  <span className="text-[16px] font-semibold text-[#D65312] mb-1">
                    Thu cũ Đà Nẵng:
                  </span>
                  <span
                     className={`text-[16px] md:text-[18px] lg:text-[${zaloFontSize}] font-bold text-[#D65312]`}
                    style={{ wordBreak: 'break-all',  }}
                  >
                    {"Zalo: "+ formatVNPhoneNumber(PHONE_NUMBER.DA_NANG)}
                  </span>
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col xs={24} md={24} lg={15} className="flex justify-center items-center text-center">
          <div
            className="text-[12px] md:text-[12px] lg:text-[16px] md:!mt-2 be-vietnam-pro-light text-[#222] leading-5 text-center"
            style={{wordBreak: 'break-word', margin: '0 auto' }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }}
          />
        </Col>
      </Row>
    )
  }

  return (
    <Row gutter={24} align="top">
      <Col xs={24} md={24} lg={8}>
        <Card
          className="!rounded-xl !p-0 !border-[#E6E6E6] !shadow-none flex-shrink-0 !bg-[#FFE8D3]"
          styles={{ body: { padding: '25px 17px' } }}
          style={{ height: 104 }}
        >
          <div className="flex flex-col items-center h-full justify-center">
            <span className="text-[13px] sm:!text-[16px] text-[#D65312] font-semibold mb-1">
              Kết thúc sau:
            </span>
            <span className="text-[16px] sm:text-[21px] font-bold text-[#D65312]">
              {countdown}
            </span>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={24} lg={16} className="flex justify-center items-center text-center">
        <span
          className="text-[12px] md:text-[12px] lg:text-[16px] be-vietnam-pro-light text-[#222] leading-5 text-center"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }}
        />
      </Col>
    </Row>
  )
}

export default CountSale
