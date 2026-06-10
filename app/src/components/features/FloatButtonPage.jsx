import React from 'react'
import { FloatButton } from 'antd'
import ZaloIcon from '../../assets/ic-zalo.svg'
import FacebookIcon from '../../assets/ic-facebook.svg'
import PhoneIcon from '../../assets/ic-phone.svg'
import { PHONE_NUMBER } from '../../constants/phoneNumber'
import { UI, SOCIAL_COLORS } from '../../constants'
import OptimizedImage from '@/components/common/OptimizedImage'

const createButtonStyle = (colors) => ({
  width: UI.FLOAT_BUTTON.WIDTH,
  height: UI.FLOAT_BUTTON.HEIGHT,
  fontSize: UI.FLOAT_BUTTON.FONT_SIZE,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  animation: 'pulse 2s infinite',
  backgroundColor: colors.bg,
  borderColor: colors.bg,
  boxShadow: `0 4px 15px ${colors.shadow}`,
});

const BUTTON_STYLES = {
  zalo: createButtonStyle(SOCIAL_COLORS.ZALO),
  facebook: createButtonStyle(SOCIAL_COLORS.FACEBOOK),
  phone: createButtonStyle(SOCIAL_COLORS.PHONE),
};

const iconStyle = {
  width: UI.FLOAT_BUTTON.ICON_SIZE,
  height: UI.FLOAT_BUTTON.ICON_SIZE,
};

function FloatButtonPage() {
  return (
    <>
      <FloatButton.Group shape="circle" style={{ right: 24, bottom: 24 }}>
        <FloatButton
          icon={<OptimizedImage src={ZaloIcon} alt="Zalo" width={UI.FLOAT_BUTTON.ICON_SIZE} height={UI.FLOAT_BUTTON.ICON_SIZE} sizes={`${UI.FLOAT_BUTTON.ICON_SIZE}px`} style={iconStyle} />}
          style={BUTTON_STYLES.zalo}
          onClick={() => window.open(`https://zalo.me/${PHONE_NUMBER.GENERAL}`, '_blank')}
        />
        <FloatButton
          icon={<OptimizedImage src={FacebookIcon} alt="Facebook" width={UI.FLOAT_BUTTON.ICON_SIZE} height={UI.FLOAT_BUTTON.ICON_SIZE} sizes={`${UI.FLOAT_BUTTON.ICON_SIZE}px`} style={iconStyle} />}
          style={BUTTON_STYLES.facebook}
          onClick={() => window.open('https://www.facebook.com/amztechdn', '_blank')}
        />
        <FloatButton
          icon={<OptimizedImage src={PhoneIcon} alt="Phone" width={UI.FLOAT_BUTTON.ICON_SIZE} height={UI.FLOAT_BUTTON.ICON_SIZE} sizes={`${UI.FLOAT_BUTTON.ICON_SIZE}px`} style={iconStyle} />}
          style={BUTTON_STYLES.phone}
          onClick={() => window.open(`tel:${PHONE_NUMBER.GENERAL}`)}
        />
      </FloatButton.Group>
    </>
  )
}

export default FloatButtonPage
