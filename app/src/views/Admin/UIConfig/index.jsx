import React, { useEffect, useState,useRef } from 'react'
import { useFirestore } from '@/hooks/useFirestore'
import { message } from 'antd'
import { saveCollectionData } from '@/lib/data.save'
import { clearCollectionCache, loadCollection } from '@/lib/data'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import {
  FOOTER_DEFAULT_TITLES,
  normalizeFooterContactBlock,
} from '@/constants/footerContact'
import { useDispatch, useSelector } from 'react-redux';
import { selectHighlightSelector,setHighlight,clearHighlight } from '../../../store/slices/highlightSlice';
import {selectHomeSettings} from '@/store/slices/settingsSlice'
const EMPTY_BRANCH = () => ({
  label: '',
  phones: [''],
  address: '',
  mapEmbedUrl: '',
})
function UIConfigManagement() {
  const dispatch = useDispatch();
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('header')
  const [saving, setSaving] = useState(false)
  const { updateDocData, addDocData } = useFirestore(null, 'ui-config')
   const iframeRef = useRef();
  const highlightSelector = useSelector(selectHighlightSelector);
  const homeSettings = useSelector(selectHomeSettings);
  useEffect(() => {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    if (!iframe.contentWindow) return;
    
    // Gửi message sang iframe
    if (highlightSelector) {
      iframe.contentWindow.postMessage({
        type: 'HOVER',
        selector: highlightSelector,
      }, '*');
    } else {
      iframe.contentWindow.postMessage({
        type: 'LEAVE',
      }, '*');
    }
  }, [highlightSelector]);

 const handleMouseEnter = (selector) => {
    console.log('1️⃣ Dispatching setHighlight with:', selector);
  dispatch(setHighlight(selector));
  };
  
  const handleMouseLeave = () => {
    dispatch(clearHighlight());
  };


  useEffect(() => {
    fetchConfig()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const migrateSocialLinks = (sl) => {
    const keys = ['facebook', 'instagram', 'tiktok', 'whatsapp', 'youtube']
    const migrate = (v) => {
      if (typeof v === 'string') return { url: v, enabled: true }
      if (v && typeof v === 'object') return { url: String(v.url ?? ''), enabled: v.enabled !== false }
      return { url: '', enabled: true }
    }
    const next = { ...(sl || {}) }
    keys.forEach((k) => { next[k] = migrate(next[k]) })
    return next
  }

  const fetchConfig = async () => {
    try {
      // loadCollection(..., true) = forceReload: luôn đọc từ server, bỏ qua cache
      const docs = await loadCollection('ui-config', true)
      if (docs.length > 0) {
        let doc = docs[0]
        if (doc.footer) {
          doc = {
            ...doc,
            footer: {
              ...doc.footer,
              socialLinks: migrateSocialLinks(doc.footer.socialLinks),
              contactBlock: normalizeFooterContactBlock(doc.footer.contactBlock || {}),
            },
          }
        }
        setConfig(doc)
      } else {
        // Tạo config mặc định
        const defaultConfig = {
          id: 'ui-config',
          header: {
            topBanner: [
              { text: 'THU CŨ ĐỔI MỚI - LÊN ĐỜI SIÊU PHẨM', icon: 'ClockCircleOutlined', enabled: true },
              { text: 'HÀNG CŨ GIÁ RẺ - BẢO HÀNH SIÊU LÂU', icon: 'DollarCircleOutlined', enabled: true },
              { text: 'BÁN HÀNG CÓ TÂM - VẬN CHUYỂN CÓ TẦM', icon: 'TruckOutlined', enabled: true },
            ],
            keywords: ['Tai nghe Sony', 'Loa JBL', 'Tai nghe AirPods', 'Loa Marshall'],
          },
          footer: {
            contactBlock: normalizeFooterContactBlock({}),
            socialLinks: {
              facebook: { url: '', enabled: true },
              instagram: { url: '', enabled: true },
              tiktok: { url: '', enabled: true },
              whatsapp: { url: '', enabled: true },
              youtube: { url: '', enabled: true },
            },
            categories: {
              loa: ['Loa mini', 'Loa bluetooth cầm tay', 'Loa cắm điện', 'Loa để bàn', 'Loa decor', 'Loa cao cấp', 'Loa đi cắm trại', 'Loa hát karaoke'],
              taiNghe: ['Tai nghe true wireless', 'Tai nghe nhét tai', 'Tai nghe chụp tai', 'Tai nghe tập gym', 'Tai nghe chống ồn'],
            },
          },
          sidebar: {
            mainItems: [
              { icon: 'item11.png', label: 'Tai nghe nhét tai', value: 'Tai nghe nhét tai', order: 0, enabled: true },
              { icon: 'item10.png', label: 'Tai nghe chụp tai', value: 'Tai nghe chụp tai', order: 1, enabled: true },
              { icon: 'item9.png', label: 'Loa di động', value: 'Loa di động', order: 2, enabled: true },
              { icon: 'item8.png', label: 'Loa để bàn', value: 'Loa để bàn', order: 3, enabled: true },
              { icon: 'item7.png', label: 'Loa karaoke', value: 'Loa karaoke', order: 4, enabled: true },
              { icon: 'item6.png', label: 'Thu cũ đổi mới', value: 'Thu cũ đổi mới', order: 5, enabled: true },
            ],
            exploreItems: [
              { icon: 'item4.png', label: 'Khuyến mãi hot', value: 'Khuyến mãi hot', order: 0, enabled: true },
              { icon: 'item3.png', label: 'Bảo hành - sửa chữa', value: 'Bảo hành - sửa chữa', order: 1, enabled: true },
              { icon: 'item2.png', label: 'Bài viết', value: 'Bài viết', order: 2, enabled: true },
            ],
            
          },banner: {
            mainItems: [
              { name: 'Top Banner', value: 'https://th.bing.com/th/id/R.0e5a9cfa08afb4f4343c30e30fe59c5f?rik=WzZPUckcfG0Qsg&pid=ImgRaw&r=0', enabled: true },
              { name: 'Best Seller',  value: "https://hoanghamobile.com/Uploads/2024/05/07/tai-nghe-marshall-11.jpg",enabled: true },
              { name: 'Bot Banner',  value: "https://hoanghamobile.com/Uploads/2024/05/07/tai-nghe-marshall-6.jpg",  enabled: true },
              { name: 'deal cháy', value: "https://baochauelec.com/cdn/images/tai-nghe/tai-nghe-sony-wh-ch510-6.jpg", enabled: true },
              { name: 'deal cháy 2', value: "https://baochauelec.com/cdn/images/tai-nghe/tai-nghe-sony-wh-ch510-6.jpg", enabled: true },
             
            ],
          },
        }
        setConfig(defaultConfig)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      message.error('Lỗi khi tải cấu hình')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      if (config.id) {
        await updateDocData(config.id, config)
        // Lưu vào collection cấu hình giao diện
        await saveCollectionData('ui-config', [config])
        clearCollectionCache('ui-config') // để lần load/reload lấy bản mới, không dùng cache cũ
        message.success('Đã lưu cấu hình thành công')
      } else {
        const newId = await addDocData(config)
        const newConfig = { ...config, id: newId }
        setConfig(newConfig)
        await saveCollectionData('ui-config', [newConfig])
        clearCollectionCache('ui-config')
        message.success('Đã tạo cấu hình mới')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      message.error('Lỗi khi lưu cấu hình')
    } finally {
      setSaving(false)
    }
  }

  const handleMoveItem = (itemsKey, currentOrder, direction) => {
    if (!config) return
    
    // Parse itemsKey (e.g., 'sidebar.mainItems' -> ['sidebar', 'mainItems'])
    const keys = itemsKey.split('.')
    let items = config
    for (const key of keys) {
      items = items[key]
    }
    
    // Sort items by order first
    const sortedItems = [...items].sort((a, b) => a.order - b.order)
    const currentIndex = sortedItems.findIndex(item => item.order === currentOrder)
    
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sortedItems.length) return
    
    // Swap items
    const temp = sortedItems[currentIndex]
    sortedItems[currentIndex] = sortedItems[newIndex]
    sortedItems[newIndex] = temp
    
    // Update order
    const updatedItems = sortedItems.map((item, idx) => ({ ...item, order: idx }))
    
    // Update config with nested path
    if (keys.length === 2) {
      setConfig({
        ...config,
        [keys[0]]: {
          ...config[keys[0]],
          [keys[1]]: updatedItems,
        },
      })
    } else {
      setConfig({
        ...config,
        [itemsKey]: updatedItems,
      })
    }
  }

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  if (!config) {
    return <div className="text-center py-12 text-gray-500">Không có cấu hình</div>
  }

  return (
    <div>
      <main className="flex-1 flex flex-nowrap" style={{ justifyContent: 'space-between' }}>
    <div className="space-y-6 w-3/10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tùy chỉnh giao diện</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50 relative top-7"
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {['banner','header', 'footer', 'sidebar'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'banner' ? 'Banner' : tab === 'header' ? 'Header' : tab === 'footer' ? 'Footer' : 'Sidebar'}
            </button>
          ))}
        </div>
      </div>

           {activeTab === 'banner' && (
        <div className="space-y-6 ">
          {/* Top Banner */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Banner</h2>
            <div className="space-y-4">
              {config.banner.mainItems.map((banner, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4"
                 onMouseEnter={() => handleMouseEnter(`#banner-${index+1}`)}
                         onMouseLeave={handleMouseLeave}>
                  {/* <div className="flex items-center gap-4 mb-3">
                    <input
                      type="checkbox"
                      checked={banner.enabled}
                      onChange={(e) => {
                        const newBanner = [...config.banner.mainItems]
                        newBanner[index] = { ...newBanner[index], enabled: e.target.checked }
                        setConfig({
                          ...config,
                          banner: { ...config.banner, mainItems: newBanner },
                        })
                      }}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-medium text-gray-700">Hiển thị</label>
                  </div> */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                      <input
                        type="text"
                        defaultValue={banner.value}
                        onChange={(e) => {
                          const newBanner = [...config.banner.mainItems]
                          newBanner[index] = { ...newBanner[index], value: e.target.value }
                          setConfig({
                            ...config,
                            banner: { ...config.banner, mainItems: newBanner },
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </div>
                      <div>
                        <img src={banner.value} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          
        </div>
      )}
      
      {activeTab === 'header' && (
        <div className="space-y-6 ">
          {/* Top Banner */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Banner</h2>
            <div className="space-y-4">
              {config.header.topBanner.map((banner, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4"
                 onMouseEnter={() => handleMouseEnter(`#header-${index+1}`)}
                         onMouseLeave={handleMouseLeave}>
                  <div className="flex items-center gap-4 mb-3">
                    <input
                      type="checkbox"
                      checked={banner.enabled}
                      onChange={(e) => {
                        const newBanner = [...config.header.topBanner]
                        newBanner[index] = { ...newBanner[index], enabled: e.target.checked }
                        setConfig({
                          ...config,
                          header: { ...config.header, topBanner: newBanner },
                        })
                      }}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-medium text-gray-700">Hiển thị</label>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                      <input
                       
                        type="text"
                        value={banner.text}
                        onChange={(e) => {
                          const newBanner = [...config.header.topBanner]
                          newBanner[index] = { ...newBanner[index], text: e.target.value }
                          setConfig({
                            ...config,
                            header: { ...config.header, topBanner: newBanner },
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                      <select
                        value={banner.icon}
                        onChange={(e) => {
                          const newBanner = [...config.header.topBanner]
                          newBanner[index] = { ...newBanner[index], icon: e.target.value }
                          setConfig({
                            ...config,
                            header: { ...config.header, topBanner: newBanner },
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                      >
                        <option value="ClockCircleOutlined">ClockCircleOutlined</option>
                        <option value="DollarCircleOutlined">DollarCircleOutlined</option>
                        <option value="TruckOutlined">TruckOutlined</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div                 onMouseEnter={() => handleMouseEnter("#trending-keywords")}
                         onMouseLeave={handleMouseLeave}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Từ khóa xu hướng</h2>
            <div className="space-y-2">
              {config.header.keywords.map((keyword, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => {
                      const newKeywords = [...config.header.keywords]
                      newKeywords[index] = e.target.value
                      setConfig({
                        ...config,
                        header: { ...config.header, keywords: newKeywords },
                      })
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <button
                    onClick={() => {
                      const newKeywords = config.header.keywords.filter((_, i) => i !== index)
                      setConfig({
                        ...config,
                        header: { ...config.header, keywords: newKeywords },
                      })
                    }}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Xóa
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setConfig({
                    ...config,
                    header: { ...config.header, keywords: [...config.header.keywords, ''] },
                  })
                }}
                className="px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
              >
                + Thêm từ khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Tab */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kết nối AMZ TECH &amp; chi nhánh</h2>
            <p className="text-sm text-gray-600 mb-4">
              Mỗi chi nhánh gồm tên, <strong>nhiều số điện thoại</strong> (thêm/xóa từng số), địa chỉ và (tuỳ chọn) URL nhúng Google Maps.
            </p>
            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề khối kết nối</label>
                <input
                  onMouseEnter={() => handleMouseEnter(`#connect-title`)}
                         onMouseLeave={handleMouseLeave}
                  type="text"
                  value={config.footer.contactBlock?.connectTitle ?? FOOTER_DEFAULT_TITLES.connectTitle}
                  onChange={(e) => {
                    const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                    setConfig({
                      ...config,
                      footer: {
                        ...config.footer,
                        contactBlock: { ...cb, connectTitle: e.target.value },
                      },
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {(config.footer.contactBlock?.locations ?? []).map((loc, li) => (
                <div key={li} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50"
                onMouseEnter={() => handleMouseEnter(`#branch-${li+1}`)}
                         onMouseLeave={handleMouseLeave}>
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="text-md font-medium text-gray-800">Chi nhánh {li + 1}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                        const nextLoc = cb.locations.filter((_, i) => i !== li)
                        setConfig({
                          ...config,
                          footer: {
                            ...config.footer,
                            contactBlock: { ...cb, locations: nextLoc },
                          },
                        })
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Xóa chi nhánh
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chi nhánh</label>
                    <input
                    
                      type="text"
                      value={loc.label}
                      onChange={(e) => {
                        const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                        const nextLoc = [...cb.locations]
                        nextLoc[li] = { ...nextLoc[li], label: e.target.value }
                        setConfig({
                          ...config,
                          footer: { ...config.footer, contactBlock: { ...cb, locations: nextLoc } },
                        })
                      }}
                      placeholder="Ví dụ: Đà Nẵng"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</span>
                    <div className="space-y-2">
                      {(loc.phones?.length ? loc.phones : ['']).map((ph, pi) => (
                        <div key={pi} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={ph}
                            onChange={(e) => {
                              const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                              const nextLoc = [...cb.locations]
                              const phones = [...(nextLoc[li].phones?.length ? nextLoc[li].phones : [''])]
                              phones[pi] = e.target.value
                              nextLoc[li] = { ...nextLoc[li], phones }
                              setConfig({
                                ...config,
                                footer: { ...config.footer, contactBlock: { ...cb, locations: nextLoc } },
                              })
                            }}
                            placeholder="Ví dụ: 0935.241.243"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          />
                          <button
                            type="button"
                            disabled={(loc.phones?.length ? loc.phones : ['']).length <= 1}
                            onClick={() => {
                              const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                              const nextLoc = [...cb.locations]
                              const phones = [...(nextLoc[li].phones?.length ? nextLoc[li].phones : [''])]
                              const filtered = phones.filter((_, i) => i !== pi)
                              nextLoc[li] = { ...nextLoc[li], phones: filtered.length ? filtered : [''] }
                              setConfig({
                                ...config,
                                footer: { ...config.footer, contactBlock: { ...cb, locations: nextLoc } },
                              })
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                          >
                            Xóa SĐT
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                        const nextLoc = [...cb.locations]
                        const phones = [...(nextLoc[li].phones?.length ? nextLoc[li].phones : ['']), '']
                        nextLoc[li] = { ...nextLoc[li], phones }
                        setConfig({
                          ...config,
                          footer: { ...config.footer, contactBlock: { ...cb, locations: nextLoc } },
                        })
                      }}
                      className="mt-2 px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
                    >
                      + Thêm số điện thoại
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <textarea
                      rows={2}
                      value={loc.address}
                      onChange={(e) => {
                        const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                        const nextLoc = [...cb.locations]
                        nextLoc[li] = { ...nextLoc[li], address: e.target.value }
                        setConfig({
                          ...config,
                          footer: { ...config.footer, contactBlock: { ...cb, locations: nextLoc } },
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL nhúng Google Maps (tuỳ chọn)
                    </label>
                    <input
                      type="url"
                      value={loc.mapEmbedUrl ?? ''}
                      onChange={(e) => {
                        const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                        const nextLoc = [...cb.locations]
                        nextLoc[li] = { ...nextLoc[li], mapEmbedUrl: e.target.value }
                        setConfig({
                          ...config,
                          footer: { ...config.footer, contactBlock: { ...cb, locations: nextLoc } },
                        })
                      }}
                      placeholder="https://www.google.com/maps/embed?..."
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                  setConfig({
                    ...config,
                    footer: {
                      ...config.footer,
                      contactBlock: { ...cb, locations: [...cb.locations, EMPTY_BRANCH()] },
                    },
                  })
                }}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
              >
                + Thêm chi nhánh
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề khối mạng xã hội</label>
                <input
                onMouseEnter={() => handleMouseEnter(`#social-title`)}
                         onMouseLeave={handleMouseLeave}
                  type="text"
                  value={config.footer.contactBlock?.socialTitle ?? FOOTER_DEFAULT_TITLES.socialTitle}
                  onChange={(e) => {
                    const cb = normalizeFooterContactBlock(config.footer.contactBlock || {})
                    setConfig({
                      ...config,
                      footer: {
                        ...config.footer,
                        contactBlock: { ...cb, socialTitle: e.target.value },
                      },
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Liên kết mạng xã hội</h2>
            <div className="space-y-3">
              {['facebook', 'instagram', 'tiktok', 'whatsapp', 'youtube'].map((social, index) => {
                const v = config.footer.socialLinks[social]
                const url = typeof v === 'string' ? v : (v?.url ?? '')
                const enabled = typeof v === 'string' ? true : (v?.enabled !== false)
                return (
                  <div key={social} className="border border-gray-200 rounded-lg p-4"
                  onMouseEnter={() => handleMouseEnter(`#social-${index + 1}`)}
                         onMouseLeave={handleMouseLeave}>
                    <div className="flex items-center gap-4 mb-3">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => {
                          setConfig({
                            ...config,
                            footer: {
                              ...config.footer,
                              socialLinks: {
                                ...config.footer.socialLinks,
                                [social]: { url, enabled: e.target.checked },
                              },
                            },
                          })
                        }}
                        className="w-4 h-4"
                      />
                      <label className="text-sm font-medium text-gray-700">Hiển thị</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{social}</label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          setConfig({
                            ...config,
                            footer: {
                              ...config.footer,
                              socialLinks: {
                                ...config.footer.socialLinks,
                                [social]: { url: e.target.value, enabled },
                              },
                            },
                          })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                        placeholder={`Nhập link ${social}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh mục</h2>
            <div className=" gap-6">
              {/* Loa Categories */}
              <div onMouseEnter={() => handleMouseEnter(`#loa`)}
                         onMouseLeave={handleMouseLeave}>
                <h3 className="text-md font-medium text-gray-700 mb-3">Loa</h3>
                <div className="space-y-2">
                  {config.footer.categories.loa.map((category, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => {
                          const newLoa = [...config.footer.categories.loa]
                          newLoa[index] = e.target.value
                          setConfig({
                            ...config,
                            footer: {
                              ...config.footer,
                              categories: { ...config.footer.categories, loa: newLoa },
                            },
                          })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                      <button
                        onClick={() => {
                          const newLoa = config.footer.categories.loa.filter((_, i) => i !== index)
                          setConfig({
                            ...config,
                            footer: {
                              ...config.footer,
                              categories: { ...config.footer.categories, loa: newLoa },
                            },
                          })
                        }}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setConfig({
                        ...config,
                        footer: {
                          ...config.footer,
                          categories: {
                            ...config.footer.categories,
                            loa: [...config.footer.categories.loa, ''],
                          },
                        },
                      })
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
                  >
                    + Thêm danh mục Loa
                  </button>
                </div>
              </div>

              {/* Tai Nghe Categories */}
              <div onMouseEnter={() => handleMouseEnter(`#tai_nghe`)}
                         onMouseLeave={handleMouseLeave}>
                <h3 className="text-md font-medium text-gray-700 mb-3">Tai nghe</h3>
                <div className="space-y-2">
                  {config.footer.categories.taiNghe.map((category, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => {
                          const newTaiNghe = [...config.footer.categories.taiNghe]
                          newTaiNghe[index] = e.target.value
                          setConfig({
                            ...config,
                            footer: {
                              ...config.footer,
                              categories: { ...config.footer.categories, taiNghe: newTaiNghe },
                            },
                          })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                      <button
                        onClick={() => {
                          const newTaiNghe = config.footer.categories.taiNghe.filter((_, i) => i !== index)
                          setConfig({
                            ...config,
                            footer: {
                              ...config.footer,
                              categories: { ...config.footer.categories, taiNghe: newTaiNghe },
                            },
                          })
                        }}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setConfig({
                        ...config,
                        footer: {
                          ...config.footer,
                          categories: {
                            ...config.footer.categories,
                            taiNghe: [...config.footer.categories.taiNghe, ''],
                          },
                        },
                      })
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
                  >
                    + Thêm danh mục Tai nghe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Tab */}
      {activeTab === 'sidebar' && (
        <div className="space-y-6">
          {/* Main Items */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm chính</h2>
            <div className="space-y-3">
              {config.sidebar.mainItems
                .sort((a, b) => a.order - b.order)
                .map((item, index) => (
                  <div key={item.order} className="flex items-start gap-2">
                    <div className="flex flex-col gap-1 pt-4">
                      <button
                        onClick={() => handleMoveItem('sidebar.mainItems', item.order, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUpOutlined />
                      </button>
                      <button
                        onClick={() => handleMoveItem('sidebar.mainItems', item.order, 'down')}
                        disabled={index === config.sidebar.mainItems.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDownOutlined />
                      </button>
                    </div>
                    <div  onMouseEnter={() => handleMouseEnter(`#sidebar-item-${item.order + 1}`)}
                         onMouseLeave={handleMouseLeave}
                    className="flex-1 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-4 mb-3">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => {
                            const newItems = [...config.sidebar.mainItems]
                            const itemIndex = newItems.findIndex(i => i.order === item.order)
                            newItems[itemIndex] = { ...newItems[itemIndex], enabled: e.target.checked }
                            setConfig({
                              ...config,
                              sidebar: { ...config.sidebar, mainItems: newItems },
                            })
                          }}
                          className="w-4 h-4"
                        />
                        <label className="text-sm font-medium text-gray-700">Hiển thị</label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                          <input
                            type="text"
                            value={item.icon}
                            onChange={(e) => {
                              const newItems = [...config.sidebar.mainItems]
                              const itemIndex = newItems.findIndex(i => i.order === item.order)
                              newItems[itemIndex] = { ...newItems[itemIndex], icon: e.target.value }
                              setConfig({
                                ...config,
                                sidebar: { ...config.sidebar, mainItems: newItems },
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nhãn</label>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => {
                              const newItems = [...config.sidebar.mainItems]
                              const itemIndex = newItems.findIndex(i => i.order === item.order)
                              newItems[itemIndex] = { ...newItems[itemIndex], label: e.target.value }
                              setConfig({
                                ...config,
                                sidebar: { ...config.sidebar, mainItems: newItems },
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị</label>
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => {
                            const newItems = [...config.sidebar.mainItems]
                            const itemIndex = newItems.findIndex(i => i.order === item.order)
                            newItems[itemIndex] = { ...newItems[itemIndex], value: e.target.value }
                            setConfig({
                              ...config,
                              sidebar: { ...config.sidebar, mainItems: newItems },
                            })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newItems = config.sidebar.mainItems.filter(i => i.order !== item.order)
                          // Cập nhật order
                          const updatedItems = newItems.map((i, idx) => ({ ...i, order: idx }))
                          setConfig({
                            ...config,
                            sidebar: { ...config.sidebar, mainItems: updatedItems },
                          })
                        }}
                        className="mt-3 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <button
              onClick={() => {
                const maxOrder = Math.max(...config.sidebar.mainItems.map(i => i.order), -1)
                const newItem = {
                  icon: 'item.png',
                  label: 'Mục mới',
                  value: 'Mục mới',
                  order: maxOrder + 1,
                  enabled: true,
                }
                setConfig({
                  ...config,
                  sidebar: { ...config.sidebar, mainItems: [...config.sidebar.mainItems, newItem] },
                })
              }}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
            >
              + Thêm mục
            </button>
          </div>

          {/* Explore Items */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Khám phá thêm</h2>
            <div className="space-y-3">
              {config.sidebar.exploreItems
                .sort((a, b) => a.order - b.order)
                .map((item, index) => (
                  <div key={item.order} className="flex items-start gap-2" onMouseEnter={() => handleMouseEnter(`#sidebar-more-${item.order + 1}`)}
                         onMouseLeave={handleMouseLeave}>
                    <div className="flex flex-col gap-1 pt-4">
                      <button
                        onClick={() => handleMoveItem('sidebar.exploreItems', item.order, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUpOutlined />
                      </button>
                      <button
                        onClick={() => handleMoveItem('sidebar.exploreItems', item.order, 'down')}
                        disabled={index === config.sidebar.exploreItems.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDownOutlined />
                      </button>
                    </div>
                    <div className="flex-1 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-4 mb-3">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => {
                            const newItems = [...config.sidebar.exploreItems]
                            const itemIndex = newItems.findIndex(i => i.order === item.order)
                            newItems[itemIndex] = { ...newItems[itemIndex], enabled: e.target.checked }
                            setConfig({
                              ...config,
                              sidebar: { ...config.sidebar, exploreItems: newItems },
                            })
                          }}
                          className="w-4 h-4"
                        />
                        <label className="text-sm font-medium text-gray-700">Hiển thị</label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                          <input
                            type="text"
                            value={item.icon}
                            onChange={(e) => {
                              const newItems = [...config.sidebar.exploreItems]
                              const itemIndex = newItems.findIndex(i => i.order === item.order)
                              newItems[itemIndex] = { ...newItems[itemIndex], icon: e.target.value }
                              setConfig({
                                ...config,
                                sidebar: { ...config.sidebar, exploreItems: newItems },
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nhãn</label>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => {
                              const newItems = [...config.sidebar.exploreItems]
                              const itemIndex = newItems.findIndex(i => i.order === item.order)
                              newItems[itemIndex] = { ...newItems[itemIndex], label: e.target.value }
                              setConfig({
                                ...config,
                                sidebar: { ...config.sidebar, exploreItems: newItems },
                              })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị</label>
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => {
                            const newItems = [...config.sidebar.exploreItems]
                            const itemIndex = newItems.findIndex(i => i.order === item.order)
                            newItems[itemIndex] = { ...newItems[itemIndex], value: e.target.value }
                            setConfig({
                              ...config,
                              sidebar: { ...config.sidebar, exploreItems: newItems },
                            })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newItems = config.sidebar.exploreItems.filter(i => i.order !== item.order)
                          const updatedItems = newItems.map((i, idx) => ({ ...i, order: idx }))
                          setConfig({
                            ...config,
                            sidebar: { ...config.sidebar, exploreItems: updatedItems },
                          })
                        }}
                        className="mt-3 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <button
              onClick={() => {
                const maxOrder = Math.max(...config.sidebar.exploreItems.map(i => i.order), -1)
                const newItem = {
                  icon: 'item.png',
                  label: 'Mục mới',
                  value: 'Mục mới',
                  order: maxOrder + 1,
                  enabled: true,
                }
                setConfig({
                  ...config,
                  sidebar: { ...config.sidebar, exploreItems: [...config.sidebar.exploreItems, newItem] },
                })
              }}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
            >
              + Thêm mục
            </button>
          </div>
        </div>
      )}
    </div>
    
        {/* Phần bên trái - Settings */}
        {/* <div className="w-3/10 bg-gray-100 p-4 overflow-y-auto"> */}
          {/* Nội dung chỉnh giao diện bên trái */}
        {/* </div> */}
        
        {/* Phần bên phải - Preview */}
       <div className="w-7/10 bg-white relative" style={{ minHeight: '100vh', marginLeft: '30px' }}>
  <h3 className="text-lg font-semibold mb-2">Xem trước</h3>
  
  {/* Sticky chỉ hoạt động trong div này */}
  <div className="fixed top-20 scale-70 origin-top-left" 
       style={{ 
         width: `${100 / 0.7}%`, 
         height: `${100 / 0.7}%`,
         top: '150px',
        //  right: '-1800px',
        left: '650px',
       }}>
    <iframe
      ref={iframeRef}
      key={"1"}
      src="http://localhost:2011/"
      className="w-full h-full border rounded shadow-lg"
      style={{ height: '100vh',width: '55%' }}
      title="Website Preview"
    />
  </div>
  
  {/* Thêm nội dung để có thể scroll */}

</div>
      </main>
    </div>
  )
}

export default UIConfigManagement
