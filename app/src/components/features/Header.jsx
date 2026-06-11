import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Input, Button, Space, Drawer, AutoComplete, Dropdown, Grid, Spin } from 'antd'
import { MenuOutlined, SearchOutlined, EnvironmentOutlined, PhoneOutlined, ThunderboltOutlined, DollarCircleOutlined, HeartOutlined, ClockCircleOutlined, TruckOutlined, CloseCircleOutlined, HistoryOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import routePath from '../../constants/routePath'
import AMZLogo from '../../assets/amzLogo.jpg'
import images from '../../utils/images'
import { setCategory } from '../../store/slices/filtersSlice'
import SideBarProduct from './SideBarProduct'
import { PHONE_NUMBER } from '../../constants/phoneNumber'
import { formatVNPhoneNumber, slugify } from '../../utils/format.utils'
import { MAP_URL } from '../../constants/mapsUrl'
import { PRICE_RANGES, DEFAULT_BRANDS, mapSidebarUiValueToCategory } from '../../constants'
import { useFirestore } from '../../hooks/useFirestore'
import { useProductDisplayCategories } from '@/hooks/useProductDisplayCategories'
import { buildMainNavItemConfigs, buildExploreNavItemConfigs } from '@/utils/productNavBuilders'
import {
  createSearchItemUrl,
  searchCatalogItems,
} from '@/utils/productSearch.utils'
import OptimizedImage from '@/components/common/OptimizedImage'

// Thumb cho dropdown search: ảnh lỗi → thử URL kế; hết URL → ẩn ảnh, fallback placeholder
const ProductThumb = ({ images, alt }) => {
  const list = Array.isArray(images) ? images.filter(Boolean) : []
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)
 
  useEffect(() => {
    setIdx(0)
    setFailed(false)
  }, [images])

  const placeholder = (
    <div style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
      <ThunderboltOutlined style={{ color: '#F37021', fontSize: 24 }} />
    </div>
  )

  if (failed || list.length === 0 || idx >= list.length) return placeholder

  return (
    <OptimizedImage
      src={list[idx]}
      alt={alt}
      width={40}
      height={40}
      sizes="40px"
      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
      onError={() => {
        if (idx + 1 < list.length) setIdx(idx + 1)
        else setFailed(true)
      }}
    />
  )
}

function Header() {
  const screens = Grid.useBreakpoint()
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const searchContainerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceTimerRef = useRef(null)
  const skipNextOnChangeRef = useRef(false) // Bỏ qua onChange(option.value=id) sau khi chọn sản phẩm
  const selectedProductNameRef = useRef('')  // Lưu tên sản phẩm để hiển thị trong ô search khi đã chọn
  const { getAllDocs } = useFirestore(null, 'ui-config')
  const [uiConfig, setUiConfig] = useState(null)
  const { rows: displayCategoryRows } = useProductDisplayCategories()

  const mainItems = useMemo(
    () =>
      buildMainNavItemConfigs(displayCategoryRows).map((c) => ({
        icon: <OptimizedImage src={images[c.imageKey] || images['item11.png']} alt="" width={30} height={30} sizes="30px" />,
        label: c.label,
        value: c.filterValue,
        navKind: c.kind,
      })),
    [displayCategoryRows]
  )

  const exploreItems = useMemo(
    () =>
      buildExploreNavItemConfigs(displayCategoryRows).map((c) => ({
        icon: <OptimizedImage src={images[c.imageKey] || images['item5.png']} alt="" width={30} height={30} sizes="30px" />,
        label: c.label,
        value: c.filterValue,
        navKind: c.kind,
      })),
    [displayCategoryRows]
  )

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchValue')
    if (saved) setSearchValue(saved)
    
    const recent = localStorage.getItem('recentSearches')
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent))
      } catch (e) {
        setRecentSearches([])
      }
    }
  }, [])

  // Save search value to localStorage
  useEffect(() => {
    if (searchValue) {
      localStorage.setItem('searchValue', searchValue)
    } else {
      localStorage.removeItem('searchValue')
    }
  }, [searchValue])

  // Click outside to close search dropdown (không đóng khi click vào option trong dropdown - dropdown render bằng portal nên nằm ngoài searchContainerRef)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Bỏ qua nếu click nằm trong dropdown của AutoComplete (portal) — tránh đóng trước khi onSelect kịp chạy
      if (event.target.closest?.('.ant-select-dropdown')) return
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false)
      }
    }

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isSearchOpen])

  // Keyboard shortcuts - will be handled after handleSelect is defined

  // Save to recent searches
  const saveToRecentSearches = useCallback((value) => {
    if (!value || value.trim() === '') return
    
    const updated = [value, ...recentSearches.filter(s => s !== value)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }, [recentSearches])

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const home = useSelector(state => state.settings.homeSettings);
  const allProductsState = useSelector((state) => state.products.items);
  const allProductsArray = useMemo(
    () => (Array.isArray(allProductsState) ? allProductsState : (allProductsState ? Object.values(allProductsState).flat() : [])),
    [allProductsState]
  );
  const productSearchMapRef = useRef(new Map())

  // Load UI config
  useEffect(() => {
    const fetchUIConfig = async () => {
      try {
        const docs = await getAllDocs()
        if (docs.length > 0) {
          setUiConfig(docs[0])
        }
      } catch (error) {
        console.error('Error loading UI config:', error)
      }
    }
    fetchUIConfig()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const performSearch = useCallback(async (value) => {
    if (!value || value.trim() === '') {
      setOptions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Simulate slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 100))

    const searchResult = searchCatalogItems(allProductsArray, value, {
      limit: 8,
      suggestionLimit: 8,
    })
    const results = (searchResult.mode === 'results' ? searchResult.items : searchResult.suggestions).slice(0, 8)
    const searchMap = new Map()
    results.forEach(item => {
      searchMap.set(item.searchId, item)
    })
    productSearchMapRef.current = searchMap

    const mappedOptions = results.map((item) => {
      const originalPrice = Number(item.priceDefault) > Number(item.priceForSale)
        ? Number(item.priceDefault).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
        : ''
      
      return {
        key: item.searchId,
        value: item.searchId,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 4 }}>
            <>
              <div>
                <ProductThumb images={item.images} alt={item.title} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#333', fontSize: 15, lineHeight: 1.25 }}>
                  {item.title}
                </div>
                {item.subtitle && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {item.subtitle}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {item.condition && (
                    <span
                      style={{
                        fontSize: 12,
                        color: '#ff4d4f',
                        background: '#fff1f0',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontWeight: 400,
                      }}
                    >
                      {item.condition}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      color: item.inStock ? '#15803d' : '#777',
                      background: item.inStock ? '#f0fdf4' : '#f3f4f6',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontWeight: 500,
                    }}
                  >
                    {item.inStock ? `Còn hàng${item.inventory ? ` (${item.inventory})` : ''}` : 'Hết hàng'}
                  </span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ color: '#F37021', fontWeight: 600 }}>
                    {Number(item.priceForSale).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </span>
                  {originalPrice && (
                    <span
                      style={{
                        textDecoration: 'line-through',
                        color: '#aaa',
                        marginLeft: 8,
                        fontSize: 13,
                      }}
                    >
                      {originalPrice}
                    </span>
                  )}
                </div>
              </div>
            </>
          </div>
        ),
        id: item.searchId,
        item,
        name: [item.title, item.subtitle].filter(Boolean).join(' '),
      };
    });
    setOptions(mappedOptions)
    setIsLoading(false)
  }, [allProductsArray])

  const handleSearch = useCallback((value) => {
    setSearchValue(value)
    
    if (!value || value.trim() === '') {
      setOptions([])
      setIsSearchOpen(false)
      return
    }

    setIsSearchOpen(true)

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }, [performSearch])

  const handleClear = useCallback(() => {
    setSearchValue('')
    setOptions([])
    setIsSearchOpen(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Tránh ô search hiển thị product.id: AutoComplete gọi onChange(id) sau onSelect. Bỏ qua và giữ tên sản phẩm.
  const handleChange = useCallback((val) => {
    if (skipNextOnChangeRef.current) {
      skipNextOnChangeRef.current = false
      setSearchValue(selectedProductNameRef.current || '')
      selectedProductNameRef.current = ''
      return
    }
    setSearchValue(val)
  }, [])

  const goToSearchPage = useCallback((rawValue = searchValue) => {
    const keyword = String(rawValue || '').trim()
    if (!keyword) return
    saveToRecentSearches(keyword)
    setOptions([])
    setIsSearchOpen(false)
    navigate(`${routePath.search}?q=${encodeURIComponent(keyword)}`)
  }, [navigate, saveToRecentSearches, searchValue])

  const handleFocus = useCallback(() => {
    if (searchValue) {
      setIsSearchOpen(true)
    } else if (recentSearches.length > 0) {
      setIsSearchOpen(true)
      // Show recent searches as options
      const recentOptions = recentSearches.map((search, idx) => ({
        key: `recent-${idx}`,
        value: search,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>
            <HistoryOutlined style={{ color: '#999', fontSize: 16 }} />
            <span style={{ color: '#666' }}>{search}</span>
          </div>
        ),
        isRecent: true,
      }))
      setOptions(recentOptions)
    }
  }, [searchValue, recentSearches])

  const handleSelect = useCallback((value, option) => {
    // Handle recent search selection
    if (option?.isRecent) {
      setSearchValue(value)
      goToSearchPage(value)
      return
    }

    setOptions([])
    setIsSearchOpen(false)
    saveToRecentSearches(searchValue)

    // Ưu tiên option.item (đã lưu trong mỗi option), fallback productSearchMapRef
    const searchItem = option?.item || productSearchMapRef.current.get(value)
    if (searchItem) {
      const displayName = [searchItem.title, searchItem.subtitle].filter(Boolean).join(' ')
      selectedProductNameRef.current = displayName
      skipNextOnChangeRef.current = true // Bỏ qua onChange(id) từ AutoComplete sau onSelect
      setSearchValue(displayName)
      navigate(createSearchItemUrl(searchItem))
    }
  }, [searchValue, navigate, saveToRecentSearches, goToSearchPage])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false)
        if (inputRef.current) {
          inputRef.current.blur()
        }
      }
      if (event.key === 'Enter' && searchValue && isSearchOpen) {
        goToSearchPage(searchValue)
      }
    }

    if (isSearchOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isSearchOpen, searchValue, goToSearchPage])

  const storeMenuItems = {
    items: [
      {
        key: 'danang',
        label: (
          <a
            href={MAP_URL.DA_NANG}
            target="_blank"
            rel="noopener noreferrer"
          >
            Đà Nẵng
          </a>
        ),
      },
      {
        key: 'hanoi',
        label: (
          <a
            href={MAP_URL.HA_NOI}
            target="_blank"
            rel="noopener noreferrer"
          >
            Hà Nội
          </a>
        ),
      },
    ],
  }

  const brands = DEFAULT_BRANDS
  const priceRanges = PRICE_RANGES.TAI_NGHE
  const needs = [
    { value: 'chongon', label: 'Chống ồn' },
    { value: 'xuyendam', label: 'Xuyên âm' },
    { value: 'mic', label: 'Có micro đàm thoại' },
    { value: 'nghegoitot', label: 'Nghe gọi tốt' },
    { value: 'tapthethao', label: 'Tập luyện thể thao' },
    { value: 'chongnuoc', label: 'Chống nước, chống bụi' },
    { value: 'choigame', label: 'Chơi game' },
    { value: 'nghenhac', label: 'Nghe nhạc trữ tình' },
    { value: 'nghenhacso', label: 'Nghe nhạc sôi động' },
  ]

  const drawerContent = (
    <div>
      {location.pathname === '/product' ? (
        <SideBarProduct brands={brands} priceRanges={priceRanges} needs={needs} forceShow={true} />
      ) : (
        <Space size="large" direction="vertical" className="w-full">
          <Space className="ml-4">
            <Dropdown menu={storeMenuItems} trigger={['click']}>
              <a onClick={(e) => e.preventDefault()} className="!text-[#F37021] inline-block cursor-pointer">
                <EnvironmentOutlined style={{ color: '#F37021', fontSize: '1.125rem' }} /> Tìm cửa hàng
              </a>
            </Dropdown>
          </Space>
          <Space>
            <PhoneOutlined style={{ color: '#F37021', fontSize: '1.125rem' }} />
            <a
              href={"https://zalo.me/" + PHONE_NUMBER.GENERAL}
              target="_blank"
              rel="noopener noreferrer"
              className="!text-[#F37021] inline-block"
              style={{ textDecoration: 'none' }}
            >
              {"Zalo: " + formatVNPhoneNumber(PHONE_NUMBER.GENERAL)}
            </a>
          </Space>
          <div className="rounded-lg mb-4">
            <div className="font-semibold text-[16px] text-gray-700 mb-2 tracking-wide">
              Hàng cũ giá tốt - Sản phẩm chính
            </div>
            <div className="flex flex-col gap-3">
              {mainItems.map((item, idx) => (
                <div id={`sidebar-item-${idx+1}`}
                  key={idx}
                  className="w-full flex items-center gap-3 text-[15px] text-gray-800 rounded py-1 cursor-pointer transition-all duration-200 group hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:scale-[1.03] hover:shadow-md"
                  onClick={() => {
                    setOpen(false)
                    if (item.value === "Thu cũ đổi mới" || item.navKind === 'exchange') {
                      dispatch(setCategory("Thu cũ đổi mới"))
                      navigate(routePath.policyExchange)
                    } else {
                      dispatch(setCategory(mapSidebarUiValueToCategory(item.value)))
                      const categorySlug = slugify(item.label)
                      navigate(`/product/${categorySlug}`)
                    }
                  }}
                >
                  <span className="transition-transform duration-200 group-hover:scale-110">
                    {item.icon}
                  </span>
                  <span className="transition-colors duration-200 group-hover:text-blue-700 font-semibold text-[16px]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg">
            <div className="font-semibold text-[16px] text-gray-700 mb-2 tracking-wide">
              Khám phá thêm
            </div>
            <div className="flex flex-col gap-3">
              {exploreItems.map((item, idx) => (
                <div 
                  key={idx}
                  className="w-full flex items-center gap-3 text-[15px] text-gray-800 rounded py-1 cursor-pointer transition-all duration-200 group hover:bg-gradient-to-r hover:from-pink-100 hover:to-yellow-100 hover:scale-[1.03] hover:shadow-md"
                  onClick={() => {
                    setOpen(false)
                    if (item.navKind === 'sale' || item.label === "Khuyến mãi hot") {
                      navigate(routePath.sale)
                    } else if (item.navKind === 'warranty' || item.label === "Bảo hành - sửa chữa") {
                      dispatch(setCategory("Bảo hành - sửa chữa"))
                      navigate(routePath.policyWarranty)
                    } else if (item.navKind === 'posts' || item.label === "Bài viết") {
                      navigate(routePath.posts)
                    }
                  }}
                >
                  <span className="transition-transform duration-200 group-hover:scale-110">
                    {item.icon}
                  </span>
                  <span className="transition-colors duration-200 group-hover:text-pink-700 font-semibold text-[16px]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Space>
      )}
    </div>
  )

  // Get icon component from string
  const getIconComponent = (iconName) => {
    const iconMap = {
      ClockCircleOutlined,
      DollarCircleOutlined,
      TruckOutlined,
    }
    return iconMap[iconName] || ClockCircleOutlined
  }

  // Get top banner items from config or default
  const topBannerItems = uiConfig?.header?.topBanner || [
    { text: 'THU CŨ ĐỔI MỚI - LÊN ĐỜI SIÊU PHẨM', icon: 'ClockCircleOutlined', enabled: true },
    { text: 'HÀNG CŨ GIÁ RẺ - BẢO HÀNH SIÊU LÂU', icon: 'DollarCircleOutlined', enabled: true },
    { text: 'BÁN HÀNG CÓ TÂM - VẬN CHUYỂN CÓ TẦM', icon: 'TruckOutlined', enabled: true },
  ]

  // Get keywords from config or default
  const keywords = uiConfig?.header?.keywords || ['Tai nghe Sony', 'Loa JBL', 'Tai nghe AirPods', 'Loa Marshall']

  return (
    <div className="p-0 z-[100] relative">
      <div className="bg-orange-50 py-1 hidden lg:block">
        <Row justify="space-between" align="middle" className="max-w-[1400px] mx-auto px-8">
          {topBannerItems.filter(item => item.enabled).map((banner, index) => {
            const IconComponent = getIconComponent(banner.icon)
            return (
              <Col key={index}>
                <span id={`header-${index+1}`} className="text-[#F37021] font-medium text-base flex items-center gap-1">
                  <IconComponent className="text-[#F37021]" style={{ fontSize: '16px' }} />
                  {banner.text}
                </span>
              </Col>
            )
          })}
        </Row>
      </div>
      <Row justify="space-between" align="middle" className="max-w-[1400px] mx-auto py-4 px-4 md:px-8">
        <Col xs={0} sm={4} md={3} lg={2}>
          <OptimizedImage
            src={AMZLogo}
            alt="Logo"
            width={100}
            height={100}
            sizes="(max-width: 768px) 60px, 100px"
            onClick={() => navigate(routePath.home)}
            className="hidden sm:block w-[60px] h-[60px] md:w-[100px] md:h-[100px] rounded-full object-cover"
          />
        </Col>
        <Col xs={24} sm={20} md={21} lg={14} flex="auto" className="px-0 md:px-8">
          <div className="flex items-center gap-2">
            {!screens.sm && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 24, color: '#F37021' }} />}
                onClick={() => setOpen(true)}
                className="flex items-center"
              />
            )}
            <div className="flex-1" ref={searchContainerRef}>
              <AutoComplete
                value={searchValue}
                options={options}
                style={{ width: '100%' }}
                onSearch={handleSearch}
                onChange={handleChange}
                onSelect={handleSelect}
                onFocus={handleFocus}
                className="rounded-full bg-gray-50"
                classNames={{ popup: { root: "w-full" } }}
                open={isSearchOpen && (options.length > 0 || (recentSearches.length > 0 && !searchValue))}
                dropdownRender={(menu) => (
                  <div>
                    {isLoading && (
                      <div style={{ padding: '12px', textAlign: 'center' }}>
                        <Spin size="small" />
                        <span style={{ marginLeft: 8, color: '#666' }}>Đang tìm kiếm...</span>
                      </div>
                    )}
                    {!isLoading && menu}
                    {!isLoading && options.length === 0 && searchValue && (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                        Không tìm thấy kết quả nào
                      </div>
                    )}
                  </div>
                )}
              >
                <Input
                  ref={inputRef}
                  size="large"
                  placeholder="Hôm nay bạn muốn tìm kiếm gì?"
                  suffix={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {searchValue && (
                        <Button
                          type="text"
                          icon={<CloseCircleOutlined className="text-gray-400 hover:text-gray-600" />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClear()
                          }}
                          style={{ 
                            background: 'transparent', 
                            border: 'none',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        />
                      )}
                      <Button
                        type="text"
                        icon={<SearchOutlined className="text-[#F37021]" />}
                        onClick={() => {
                          goToSearchPage(searchValue)
                        }}
                        style={{ background: '#fff', color: '#F37021' }}
                      >
                        <span className="hidden md:inline">Tìm kiếm</span>
                      </Button>
                    </div>
                  }
                  style={{ border: '1px solid #F37021' }}
                  onPressEnter={() => {
                    goToSearchPage(searchValue)
                  }}
                />
              </AutoComplete>
            </div>
          </div>
          <div id="trending-keywords" className="mt-6 flex items-baseline">
            <h3 className='mb-2 text-[16px] text-[#D65312] font-medium'>Từ khoá xu hướng&nbsp;</h3>
            <span className="text-gray-500 text-xs flex gap-1">
              {keywords.map((keyword, idx) => (
                <a
                  key={`${keyword}-${idx}`}
                  className="hover:underline !text-black cursor-pointer mx-1 !text-[12px]"
                  onClick={() => {
                    setSearchValue(keyword)
                    goToSearchPage(keyword)
                  }}
                >
                  {keyword}
                </a>
              ))}
            </span>
          </div>
        </Col>
        <Col xs={0} sm={0} md={0} lg={6} className="hidden lg:block">
          <div className='!mt-[-25px]  hidden lg:block'>
            <Space className="ml-4">
              <Dropdown menu={storeMenuItems} trigger={['click']}>
                <a onClick={(e) => e.preventDefault()} className="!text-[#F37021] inline-block cursor-pointer">
                  <EnvironmentOutlined style={{ color: '#F37021', fontSize: '1.125rem' }} /> Tìm cửa hàng
                </a>
              </Dropdown>
            </Space>
            <Space className='ml-4'>
              <PhoneOutlined style={{ color: '#F37021', fontSize: '1.125rem' }} />
              <a
                href={"https://zalo.me/" + PHONE_NUMBER.GENERAL}
                target="_blank"
                rel="noopener noreferrer"
                className="!text-[#F37021] inline-block"
                style={{ textDecoration: 'none' }}
              >
                {"Zalo: " + formatVNPhoneNumber(PHONE_NUMBER.GENERAL)}
              </a>
            </Space>
          </div>
        </Col>
      </Row>
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setOpen(false)}
        open={open}
        className="md:hidden"
        width={280}
      >
        {drawerContent}
      </Drawer>
    </div>
  )
}

export default Header
