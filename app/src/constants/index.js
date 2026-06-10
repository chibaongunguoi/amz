export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
};

export const BESTSELLER_VALUES = {
  YES: '1',
  NO: '0',
};

export const PRODUCT_DEFAULTS = {
  PRICE: 0,
  SALE_PERCENT: 0,
  INVENTORY: 0,
};

export const POST_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
};

export const POST_CATEGORY = {
  LATEST: 'latest',
  HOT: 'hot',
  BOTH: 'both',
  NONE: 'none',
};

export const POST_CATEGORY_OPTIONS = [
  { label: 'Thông tin mới nhất', value: POST_CATEGORY.LATEST },
  { label: 'Chủ đề hot', value: POST_CATEGORY.HOT },
  { label: 'Cả hai', value: POST_CATEGORY.BOTH },
  { label: 'Không phân loại', value: POST_CATEGORY.NONE },
];

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned',
};

export const FILTER_VALUES = {
  ALL_PRODUCTS: 'Tất cả sản phẩm',
  RESERVED_ID: 'id',
};

export const SORT_KEYS = {
  DEFAULT: '',
  ASC: 'asc',
  DESC: 'desc',
  BESTSELLER: 'bestseller',
  HOTDEAL: 'hotdeal',
};

export const CAROUSEL_DIRECTIONS = {
  PREV: 'prev',
  NEXT: 'next',
};

export const FIREBASE_COLLECTIONS = {
  NHET_TAI: '01-nhet-tai-cu',
  CHUP_TAI: '02-chup-tai-cu',
  DI_DONG: '03-di-dong-cu',
  DE_BAN: '04-de-ban-cu',
  KARAOKE: '05-loa-karaoke',
  NEWSEAL: '06-hang-newseal',
};

export const PRODUCT_COLLECTION_NAMES = Object.values(FIREBASE_COLLECTIONS);

/** Các kho JSON đưa vào Redux / trang shop (ẩn newseal khỏi giao diện; admin vẫn dùng đủ PRODUCT_COLLECTION_NAMES). */
export const STOREFRONT_PRODUCT_COLLECTIONS = PRODUCT_COLLECTION_NAMES.filter(
  (name) => name !== FIREBASE_COLLECTIONS.NEWSEAL
);

export const PRODUCT_CATEGORY_KEYS = {
  NHET_TAI: 'nhet-tai-cu',
  CHUP_TAI: 'chup-tai-cu',
  DI_DONG: 'di-dong-cu',
  DE_BAN: 'de-ban-cu',
  KARAOKE: 'loa-karaoke',
  NEWSEAL: 'hang-newseal',
};

export const CATEGORY_DISPLAY_NAMES = {
  NHET_TAI: 'Tai nghe nhét tai cũ',
  CHUP_TAI: 'Tai nghe chụp tai cũ',
  DI_DONG: 'Loa di động cũ',
  DE_BAN: 'Loa để bàn cũ',
  KARAOKE: 'Loa karaoke cũ',
  NEWSEAL: 'Hàng newseal',
};


export const COLLECTION_TO_CATEGORY = {
  [FIREBASE_COLLECTIONS.NHET_TAI]: CATEGORY_DISPLAY_NAMES.NHET_TAI,
  [FIREBASE_COLLECTIONS.CHUP_TAI]: CATEGORY_DISPLAY_NAMES.CHUP_TAI,
  [FIREBASE_COLLECTIONS.DI_DONG]: CATEGORY_DISPLAY_NAMES.DI_DONG,
  [FIREBASE_COLLECTIONS.DE_BAN]: CATEGORY_DISPLAY_NAMES.DE_BAN,
  [FIREBASE_COLLECTIONS.KARAOKE]: CATEGORY_DISPLAY_NAMES.KARAOKE,
  [FIREBASE_COLLECTIONS.NEWSEAL]: CATEGORY_DISPLAY_NAMES.NEWSEAL,
};

export const CATEGORY_TO_COLLECTION = {
  [CATEGORY_DISPLAY_NAMES.NHET_TAI]: FIREBASE_COLLECTIONS.NHET_TAI,
  [CATEGORY_DISPLAY_NAMES.CHUP_TAI]: FIREBASE_COLLECTIONS.CHUP_TAI,
  [CATEGORY_DISPLAY_NAMES.DI_DONG]: FIREBASE_COLLECTIONS.DI_DONG,
  [CATEGORY_DISPLAY_NAMES.DE_BAN]: FIREBASE_COLLECTIONS.DE_BAN,
  [CATEGORY_DISPLAY_NAMES.KARAOKE]: FIREBASE_COLLECTIONS.KARAOKE,
  [CATEGORY_DISPLAY_NAMES.NEWSEAL]: FIREBASE_COLLECTIONS.NEWSEAL,
};

/** `value` / `label` ngắn trong ui-config sidebar → category dùng filter Redux (trùng `p.category` từ JSON) */
export const SIDEBAR_UI_VALUE_TO_CATEGORY = {
  'Tai nghe nhét tai': CATEGORY_DISPLAY_NAMES.NHET_TAI,
  'Tai nghe chụp tai': CATEGORY_DISPLAY_NAMES.CHUP_TAI,
  'Loa di động': CATEGORY_DISPLAY_NAMES.DI_DONG,
  'Loa để bàn': CATEGORY_DISPLAY_NAMES.DE_BAN,
  'Loa karaoke': CATEGORY_DISPLAY_NAMES.KARAOKE,
};

export function mapSidebarUiValueToCategory(value) {
  if (value == null || value === '') return value;
  return SIDEBAR_UI_VALUE_TO_CATEGORY[value] ?? value;
}

export const COLLECTION_TO_CATEGORY_KEY = {
  [FIREBASE_COLLECTIONS.NHET_TAI]: PRODUCT_CATEGORY_KEYS.NHET_TAI,
  [FIREBASE_COLLECTIONS.CHUP_TAI]: PRODUCT_CATEGORY_KEYS.CHUP_TAI,
  [FIREBASE_COLLECTIONS.DI_DONG]: PRODUCT_CATEGORY_KEYS.DI_DONG,
  [FIREBASE_COLLECTIONS.DE_BAN]: PRODUCT_CATEGORY_KEYS.DE_BAN,
  [FIREBASE_COLLECTIONS.KARAOKE]: PRODUCT_CATEGORY_KEYS.KARAOKE,
  [FIREBASE_COLLECTIONS.NEWSEAL]: PRODUCT_CATEGORY_KEYS.NEWSEAL,
};

export const CATEGORY_GROUPS = {
  'Tai nghe': [CATEGORY_DISPLAY_NAMES.NHET_TAI, CATEGORY_DISPLAY_NAMES.CHUP_TAI],
  'Loa': [CATEGORY_DISPLAY_NAMES.DI_DONG, CATEGORY_DISPLAY_NAMES.DE_BAN, CATEGORY_DISPLAY_NAMES.KARAOKE],
};

export const GROUP_KEYS = {
  TAI_NGHE: 'Tai nghe',
  LOA: 'Loa',
};

export const FILTER_LABELS = {
  TOP_TAI_NGHE: 'Top tai nghe',
  TOP_LOA: 'Top loa',
  TAI_NGHE_SALE: 'Tai nghe đang sale',
  LOA_SALE: 'Loa đang sale',
};

export const CATEGORY_OPTIONS = Object.values(CATEGORY_DISPLAY_NAMES).map(
  (name) => ({ label: name, value: name })
);

export const getCategoryByCollection = (collection) => COLLECTION_TO_CATEGORY[collection] || '';
export const getCollectionByCategory = (category) => CATEGORY_TO_COLLECTION[category] || '';
export const getCategoryKeyByCollection = (collection) => COLLECTION_TO_CATEGORY_KEY[collection] || '';

/** Nhãn ngắn (productDisplayCategories) → nhãn canonical dùng filter Redux */
const CATEGORY_LABEL_ALIASES = {
  'Tai nghe nhét tai': CATEGORY_DISPLAY_NAMES.NHET_TAI,
  'Tai nghe chụp tai': CATEGORY_DISPLAY_NAMES.CHUP_TAI,
  'Loa di động': CATEGORY_DISPLAY_NAMES.DI_DONG,
  'Loa để bàn': CATEGORY_DISPLAY_NAMES.DE_BAN,
  'Loa karaoke': CATEGORY_DISPLAY_NAMES.KARAOKE,
};

export const getCategoryGroup = (category) => {
  const canonical = CATEGORY_LABEL_ALIASES[category] || category;
  for (const [group, categories] of Object.entries(CATEGORY_GROUPS)) {
    if (categories.includes(canonical)) return group;
  }
  return '';
};

export const PRICE_RANGES = {
  DEFAULT: [
    { label: 'Dưới 500.000đ', min: 0, max: 500000 },
    { label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
    { label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000 },
    { label: '2.000.000đ - 5.000.000đ', min: 2000000, max: 5000000 },
    { label: 'Trên 5.000.000đ', min: 5000000, max: Infinity },
  ],
  TAI_NGHE: [
    { label: 'Dưới 1 triệu đồng', value: [0, 1000000] },
    { label: 'Từ 1 triệu - 2 triệu', value: [1000000, 2000000] },
    { label: 'Từ 2 triệu - 3 triệu', value: [2000000, 3000000] },
    { label: 'Từ 3 triệu - 5 triệu', value: [3000000, 5000000] },
    { label: 'Từ 5 triệu - 7 triệu', value: [5000000, 7000000] },
    { label: 'Trên 7 triệu', value: [7000000, Infinity] },
  ],
  LOA: [
    { label: 'Dưới 5 triệu', value: [0, 5000000] },
    { label: '5 - 10 triệu', value: [5000000, 10000000] },
    { label: 'Trên 10 triệu', value: [10000000, Infinity] },
  ],
};

export const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'asc', label: 'Giá tăng dần' },
  { value: 'desc', label: 'Giá giảm dần' },
  { value: 'bestseller', label: 'Bán chạy nhất' },
  { value: 'hotdeal', label: 'Giảm giá nhiều nhất' },
];

export const PRODUCT_FIELDS = [
  'id', 'collection', 'document', 'brand', 'name', 'color',
  'priceForSale', 'priceDefault', 'salePercent', 'isBestSeller',
  'condition', 'images', 'description', 'features', 'tableInfo',
  'youtubeUrl', 'post', 'category',
];

export const COLOR_HEX = {
  'đen': '#000000',
  'trắng': '#FFFFFF',
  'xám': '#808080',
  'đỏ': '#FF0000',
  'xanh dương': '#0000FF',
  'xanh da trời': '#87CEEB',
  'xanh lá': '#008000',
  'xanh lá cây': '#008000',
  'vàng': '#FFD700',
  'cam': '#FFA500',
  'hồng': '#FFC0CB',
  'tím': '#800080',
  'nâu': '#8B4513',
  'bạc': '#C0C0C0',
  'vàng đồng': '#FFD700',
  'xanh navy': '#000080',
  'kem': '#FFFDD0',
  'đỏ đô': '#800020',
  'xanh đen': '#191970',
  'xanh ô liu': '#808000',
  'san hô': '#FF7F50',
  'xanh ngọc': '#00FFFF',
  'hồng đậm': '#FF00FF',
  'đỏ sẫm': '#800000',
  'xanh cổ vịt': '#008080',
  'tím nhạt': '#E6E6FA',
  'vàng hồng': '#B76E79',
  'xám đậm': '#36454F',
  'ngà': '#FFFFF0',
  'xanh mint': '#98FF98',
  'đào': '#FFE5B4',
  'xanh ngọc bích': '#40E0D0',
  'black': '#000000',
  'white': '#FFFFFF',
  'gray': '#808080',
  'grey': '#808080',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#008000',
  'yellow': '#FFD700',
  'orange': '#FFA500',
  'pink': '#FFC0CB',
  'purple': '#800080',
  'brown': '#8B4513',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'navy': '#000080',
  'beige': '#F5F5DC',
  'burgundy': '#800020',
  'midnight blue': '#191970',
  'olive': '#808000',
  'coral': '#FF7F50',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'maroon': '#800000',
  'teal': '#008080',
  'lavender': '#E6E6FA',
  'rose gold': '#B76E79',
  'charcoal': '#36454F',
  'ivory': '#FFFFF0',
  'champagne': '#F7E7CE',
  'mint': '#98FF98',
  'peach': '#FFE5B4',
  'turquoise': '#40E0D0',
};

export const getColorHex = (colorName) => {
  if (!colorName) return '#ccc';
  return COLOR_HEX[colorName.toLowerCase().trim()] || '#ccc';
};

export const VIETNAMESE_CHAR_MAP = {
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'đ': 'd',
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
};

export const MENU_CATEGORIES = [
  { key: CATEGORY_DISPLAY_NAMES.NHET_TAI, label: 'Tai nghe nhét tai', icon: 'Headphones' },
  { key: CATEGORY_DISPLAY_NAMES.CHUP_TAI, label: 'Tai nghe chụp tai', icon: 'Headset' },
  { key: CATEGORY_DISPLAY_NAMES.DI_DONG, label: 'Loa di động', icon: 'Speaker' },
  { key: CATEGORY_DISPLAY_NAMES.DE_BAN, label: 'Loa để bàn', icon: 'Speaker' },
  { key: CATEGORY_DISPLAY_NAMES.KARAOKE, label: 'Loa karaoke', icon: 'Mic' },
];

export const THEME = {
  PRIMARY: '#D65312',
  PRIMARY_LIGHT: '#FFE8D3',
  PRIMARY_GRADIENT: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
  BORDER_DEFAULT: '#e0e0e0',
  TEXT_DEFAULT: '#222',
};

export const UI = {
  FLOAT_BUTTON: {
    WIDTH: 70,
    HEIGHT: 70,
    FONT_SIZE: 36,
    ICON_SIZE: 40,
  },
  TOOLTIP: {
    SHOW_INTERVAL: 5000,
    HIDE_DELAY: 3000,
  },
  GRID: {
    DEFAULT_VISIBLE: 8,
    PRODUCT_PAGE_VISIBLE: 9,
    INCREMENT: 18,
  },
};

export const SOCIAL_COLORS = {
  ZALO: {
    bg: '#0068FF',
    shadow: 'rgba(0, 104, 255, 0.3)',
  },
  FACEBOOK: {
    bg: '#1877f2',
    shadow: 'rgba(24, 119, 242, 0.3)',
  },
  PHONE: {
    bg: '#25D366',
    shadow: 'rgba(37, 211, 102, 0.3)',
  },
};

export const CACHE = {
  DURATION: 30 * 1000,
  KEYS: {
    POSTS: 'posts_last_fetched',
    SETTINGS: 'settings_last_fetched',
    PRODUCTS: 'products_last_fetched',
  },
};

export const DEFAULT_PAGE_SIZE = 12;

export const DEFAULT_BRANDS = [
  'Acnos',
  'Alpha Works',
  'Anker',
  'Bang & Olufsen',
  'Baseus',
  'Beats',
  'Bose',
  'Harman Kardon',
  'JBL',
  'Klipsch',
  'Marshall',
  'Others',
  'Sennheiser',
  'Skullcandy',
  'Sony',
  'Ultimate Ears'
];

export const SERVICE_COLLECTIONS = {
  PRODUCTS: 'productStore',
  POSTS: 'postService',
  HOME_SETTINGS: 'homeSettingService',
  BRANDS: 'brands',
  CATEGORIES: 'categories',
  COLORS: 'colors',
};

export const PRODUCT_CATEGORIES = PRODUCT_CATEGORY_KEYS;
export const COLLECTIONS = SERVICE_COLLECTIONS;
export const COLOR_MAP = COLOR_HEX;
