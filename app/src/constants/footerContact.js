import { LINK_CONSTANT } from './linkConstant'

export const FOOTER_DEFAULT_TITLES = {
  connectTitle: 'Kết nối với AMZ TECH',
  socialTitle: 'Liên kết mạng xã hội',
}

/** Mỗi phần tử là một chi nhánh: nhiều SĐT + một địa chỉ (+ embed bản đồ tùy chọn) */
export const FOOTER_DEFAULT_LOCATIONS = [
  {
    label: 'Đà Nẵng',
    phones: ['0935.241.243'],
    address: '14 Nguyễn Thông - An Hải Tây - Sơn Trà - Đà Nẵng',
    mapEmbedUrl: LINK_CONSTANT.GOOGLE_MAP_DA_NANG,
  },
  {
    label: 'Hà Nội',
    phones: ['0333.571.236'],
    address: 'Số 2, Ngõ 92 Láng Hạ - Đống Đa - Hà Nội',
    mapEmbedUrl: LINK_CONSTANT.GOOGLE_MAP_HA_NOI,
  },
]

/** Chuẩn hóa danh sách số điện thoại một chi nhánh */
function normalizePhonesFromRaw(l, fallbackPhones) {
  if (Array.isArray(l?.phones)) {
    const out = l.phones.map((p) => String(p ?? '').trim()).filter(Boolean)
    if (out.length > 0) return out
    if (fallbackPhones?.length) return [...fallbackPhones]
    return []
  }
  const one = l?.phone != null ? String(l.phone).trim() : ''
  if (one) return [one]
  return fallbackPhones?.length ? [...fallbackPhones] : []
}

function normalizeOneLocation(l, fallbacks = {}) {
  const fbPhones = fallbacks.phones
  const fbMap = fallbacks.mapEmbedUrl ?? ''
  return {
    label: String(l?.label ?? '').trim(),
    phones: normalizePhonesFromRaw(l, fbPhones),
    address: String(l?.address ?? '').trim(),
    mapEmbedUrl: (l?.mapEmbedUrl != null && String(l.mapEmbedUrl).trim() !== '')
      ? String(l.mapEmbedUrl).trim()
      : String(fbMap).trim(),
  }
}

/**
 * @param {Record<string, unknown>} cb - footer.contactBlock từ ui-config
 * @returns {{ connectTitle: string, socialTitle: string, locations: Array<{ label: string, phones: string[], address: string, mapEmbedUrl: string }> }}
 */
export function normalizeFooterContactBlock(cb) {
  const titles = {
    connectTitle: (cb?.connectTitle != null && String(cb.connectTitle).trim() !== '')
      ? String(cb.connectTitle).trim()
      : FOOTER_DEFAULT_TITLES.connectTitle,
    socialTitle: (cb?.socialTitle != null && String(cb.socialTitle).trim() !== '')
      ? String(cb.socialTitle).trim()
      : FOOTER_DEFAULT_TITLES.socialTitle,
  }

  if (Array.isArray(cb?.locations)) {
    return {
      ...titles,
      locations: cb.locations.map((l) => normalizeOneLocation(l)),
    }
  }

  const legacy = cb || {}
  const hasLegacy =
    legacy.daNangPhone != null ||
    legacy.daNangAddress != null ||
    legacy.haNoiPhone != null ||
    legacy.haNoiAddress != null

  if (hasLegacy) {
    const locs = []
    const d0 = FOOTER_DEFAULT_LOCATIONS[0]
    const d1 = FOOTER_DEFAULT_LOCATIONS[1]
    const dnP = legacy.daNangPhone != null ? String(legacy.daNangPhone).trim() : ''
    const dnA = legacy.daNangAddress != null ? String(legacy.daNangAddress).trim() : ''
    const hnP = legacy.haNoiPhone != null ? String(legacy.haNoiPhone).trim() : ''
    const hnA = legacy.haNoiAddress != null ? String(legacy.haNoiAddress).trim() : ''

    if (dnP || dnA) {
      locs.push(
        normalizeOneLocation(
          {
            label: 'Đà Nẵng',
            phones: dnP ? [dnP] : [],
            address: dnA,
            mapEmbedUrl: d0.mapEmbedUrl,
          },
          { phones: d0.phones, mapEmbedUrl: d0.mapEmbedUrl },
        ),
      )
    }
    if (hnP || hnA) {
      locs.push(
        normalizeOneLocation(
          {
            label: 'Hà Nội',
            phones: hnP ? [hnP] : [],
            address: hnA,
            mapEmbedUrl: d1.mapEmbedUrl,
          },
          { phones: d1.phones, mapEmbedUrl: d1.mapEmbedUrl },
        ),
      )
    }
    return {
      ...titles,
      locations: locs.length > 0
        ? locs
        : FOOTER_DEFAULT_LOCATIONS.map((l) => normalizeOneLocation(l, { phones: l.phones, mapEmbedUrl: l.mapEmbedUrl })),
    }
  }

  return {
    ...titles,
    locations: FOOTER_DEFAULT_LOCATIONS.map((l) =>
      normalizeOneLocation(l, { phones: l.phones, mapEmbedUrl: l.mapEmbedUrl }),
    ),
  }
}
