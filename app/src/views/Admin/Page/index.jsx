import React, { useState, useEffect } from 'react'
import ReactQuill from 'react-quill'
import { useFirestore } from '../../../hooks/useFirestore'
import { message } from 'antd'
import { saveCollectionData } from '@/lib/data.save'
import dayjs from 'dayjs'

const PageManagement = () => {
  const [eventContent, setEventContent] = useState('')
  const { getAllDocs, updateDocData, addDocData } = useFirestore(null, 'homeSettingService')
  const [docId, setDocId] = useState(null)
  const [formData, setFormData] = useState({
    keywords: [],
    youtubeBanner: '',
    imageLinks: [],
    bannerAllLink: '',
    bannerNowLink: '',
    topSellingImage1: '',
    topSellingImage2: '',
    hotDealImage1: '',
    hotDealImage2: '',
    eventDate: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const docs = await getAllDocs()
      if (docs.length > 0) {
        setDocId(docs[0].id)
        setFormData({
          keywords: docs[0].keywords || [],
          youtubeBanner: docs[0].youtubeBanner || '',
          imageLinks: docs[0].imageLinks || [],
          bannerAllLink: docs[0].bannerAllLink || '',
          bannerNowLink: docs[0].bannerNowLink || '',
          topSellingImage1: docs[0].topSellingImage1 || '',
          topSellingImage2: docs[0].topSellingImage2 || '',
          hotDealImage1: docs[0].hotDealImage1 || '',
          hotDealImage2: docs[0].hotDealImage2 || '',
          eventDate: docs[0].eventDate || '',
        })
        setEventContent(docs[0].eventContent || '')
      }
    }
    fetchData()
  // eslint-disable-next-line
  }, [])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleKeywordsChange = (value) => {
    setFormData(prev => ({ ...prev, keywords: value }))
  }

  const handleImageLinksChange = (value) => {
    setFormData(prev => ({ ...prev, imageLinks: value }))
  }

  const onFinish = async () => {
    const data = {
      ...formData,
      eventContent,
      eventDate: formData.eventDate || undefined,
      keywords: formData.keywords || [],
    }
    
    try {
      message.loading({ content: 'Đang lưu...', key: 'saving' })
      
      if (docId) {
        await updateDocData(docId, data)
        // Lưu vào collection cấu hình qua API server
        await saveCollectionData('homeSettingService', [{ ...data, id: docId }])
        message.success({ content: 'Đã lưu cấu hình thành công', key: 'saving' })
      } else {
        const newId = await addDocData(data)
        const newData = { ...data, id: newId }
        // Lưu vào collection cấu hình qua API server
        await saveCollectionData('homeSettingService', [newData])
        setDocId(newId)
        message.success({ content: 'Đã tạo cấu hình mới', key: 'saving' })
      }
    } catch (error) {
      console.error('Error saving:', error)
      const errorMessage = error.message || 'Lỗi khi lưu cấu hình. Vui lòng thử lại.'
      message.error({ content: errorMessage, key: 'saving', duration: 5 })
    }
  }

  const onReset = () => {
    setFormData({
      keywords: [],
      youtubeBanner: '',
      imageLinks: [],
      bannerAllLink: '',
      bannerNowLink: '',
      topSellingImage1: '',
      topSellingImage2: '',
      hotDealImage1: '',
      hotDealImage2: '',
      eventDate: '',
    })
    setEventContent('')
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Keywords */}
      <div className="border border-gray-200 rounded p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Từ khóa</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Từ khóa</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.keywords.map((keyword, idx) => (
              <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                {keyword}
                <button
                  onClick={() => handleKeywordsChange(formData.keywords.filter((_, i) => i !== idx))}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Nhập từ khóa và nhấn Enter"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault()
                handleKeywordsChange([...formData.keywords, e.target.value.trim()])
                e.target.value = ''
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      {/* Youtube Banner */}
      <div className="border border-gray-200 rounded p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Youtube Banner</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Youtube Banner (URL hoặc iframe embed code)
          </label>
          <textarea
            value={formData.youtubeBanner}
            onChange={e => handleChange('youtubeBanner', e.target.value)}
            placeholder='Nhập URL YouTube (ví dụ: https://www.youtube.com/watch?v=VIDEO_ID) hoặc iframe embed code (ví dụ: <iframe src="https://www.youtube.com/embed/VIDEO_ID" ...></iframe>)'
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 font-mono text-xs"
          />
          <p className="mt-2 text-xs text-gray-500">
            Bạn có thể nhập URL YouTube hoặc toàn bộ iframe embed code từ YouTube. 
            Ví dụ iframe: <code className="bg-gray-100 px-1 rounded">&lt;iframe src=&quot;https://www.youtube.com/embed/DAPS1rBUPZ0?si=-WfnSN7SdhL5KWPa&quot; ...&gt;&lt;/iframe&gt;</code>
          </p>
        </div>
      </div>

      {/* Banner nhiều link */}
      <div className="border border-gray-200 rounded p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Banner nhiều link</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link ảnh *</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.imageLinks.map((link, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {link}
                <button
                  onClick={() => handleImageLinksChange(formData.imageLinks.filter((_, i) => i !== idx))}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Nhập link ảnh và nhấn Enter"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault()
                handleImageLinksChange([...formData.imageLinks, e.target.value.trim()])
                e.target.value = ''
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      {/* Banner xem tất cả */}
      <div className="border border-gray-200 rounded p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Banner xem tất cả</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link banner *</label>
          <input
            type="text"
            value={formData.bannerAllLink}
            onChange={e => handleChange('bannerAllLink', e.target.value)}
            placeholder="Nhập link banner xem tất cả"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      {/* Banner đổi mới ngay */}
      <div className="border border-gray-200 rounded p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Banner đổi mới ngay</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link banner *</label>
          <input
            type="text"
            value={formData.bannerNowLink}
            onChange={e => handleChange('bannerNowLink', e.target.value)}
            placeholder="Nhập link banner đổi mới ngay"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      {/* Top bán chạy */}
      <div className="border border-gray-200 rounded p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top bán chạy</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link ảnh 1 *</label>
            <input
              type="text"
              value={formData.topSellingImage1}
              onChange={e => handleChange('topSellingImage1', e.target.value)}
              placeholder="Nhập link ảnh 1 cho Top bán chạy"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link ảnh 2 *</label>
            <input
              type="text"
              value={formData.topSellingImage2}
              onChange={e => handleChange('topSellingImage2', e.target.value)}
              placeholder="Nhập link ảnh 2 cho Top bán chạy"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Deal cực cháy */}
      <div className="border border-gray-200 rounded p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Deal cực cháy - Mua ngay kẻo lỡ</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link ảnh 1 *</label>
            <input
              type="text"
              value={formData.hotDealImage1}
              onChange={e => handleChange('hotDealImage1', e.target.value)}
              placeholder="Nhập link ảnh 1 cho Deal cực cháy"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link ảnh 2 *</label>
            <input
              type="text"
              value={formData.hotDealImage2}
              onChange={e => handleChange('hotDealImage2', e.target.value)}
              placeholder="Nhập link ảnh 2 cho Deal cực cháy"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Sự kiện */}
      <div className="border border-gray-200 rounded p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Sự kiện</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sự kiện</label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={e => handleChange('eventDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung sự kiện</label>
            <div className="min-h-[150px]">
              <ReactQuill
                value={eventContent}
                onChange={setEventContent}
                placeholder="Nhập nội dung sự kiện"
                className="min-h-[150px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onFinish}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
        >
          Lưu tất cả
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
        >
          Reset về dữ liệu gốc
        </button>
      </div>
    </div>
  )
}

export default PageManagement
