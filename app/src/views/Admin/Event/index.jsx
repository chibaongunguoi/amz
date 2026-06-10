import React, { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import { useFirestore } from '@/hooks/useFirestore'
import ReactQuill from 'react-quill'
import { getGoogleDriveThumbnail } from '../../../utils/product.utils'

const reactQuillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['blockquote'],
    ['link', 'image'],
    ['clean'],
  ],
}

const reactQuillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'indent',
  'align', 'blockquote', 'code-block',
  'link', 'image'
]

function EventManagement() {
  const [dataSource, setDataSource] = useState([])
  const [modal, setModal] = useState({ visible: false, type: '', record: null })
  const [imageUrl, setImageUrl] = useState('')
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [name, setName] = useState('')
  const [linkBanner, setLinkBanner] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const quillRef = useRef(null)
  const [savedRange, setSavedRange] = useState(null);
  const [content, setContent] = useState('')
  const {
    getAllDocs,
    addDocData,
    updateDocData,
    deleteDocData,
  } = useFirestore(null, "eventAMZ")

  const handleImageClick = () => {
    const editor = quillRef.current?.getEditor()
    const range = editor?.getSelection()
    if (range) setSavedRange(range)
    setIsImageModalOpen(true)
  };

  const insertImage = () => {
    const editor = quillRef.current?.getEditor()

    if (!savedRange) {
      alert('Vui lòng chọn vị trí trong nội dung để chèn ảnh.')
      return;
    }

    if (!imageUrl.trim()) {
      alert('Vui lòng nhập đường dẫn hình ảnh hợp lệ.')
      return;
    }

    editor.insertEmbed(savedRange.index, 'image', getGoogleDriveThumbnail(imageUrl.trim()), 'user')
    setIsImageModalOpen(false)
    setImageUrl("")
    setSavedRange(null)
  };

  const handleChange = (val) => {
    setContent(val)
  }

  const openModal = (type, record = null) => {
    setModal({ visible: true, type, record });
    if (type === 'edit' && record) {
      setContent(record.content || '');
      setName(record.name || '');
      setLinkBanner(record.linkBanner || '');
      setStartDate(record.startDate || '');
      setEndDate(record.endDate || '');
    } else {
      setName('');
      setLinkBanner('');
      setStartDate('');
      setEndDate('');
      setContent('');
    }
  };

  const closeModal = () => {
    setName('');
    setLinkBanner('');
    setStartDate('');
    setEndDate('');
    setContent('');
    setModal({ visible: false, type: '', record: null })
  }

  React.useEffect(() => {
    const fetchEvents = async () => {
      const events = await getAllDocs()
      setDataSource(events)
    }
    fetchEvents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (modal.visible) {
      if (modal.type === 'edit' && modal.record) {
        setTimeout(() => {
          setContent(modal.record.content || '')
        }, 0)
      } else {
        setContent('')
      }
    }
  }, [modal])

  useEffect(() => {
    if (modal.visible && quillRef.current) {
      setTimeout(() => {
        const quill = quillRef.current.getEditor();
        quill.getModule('toolbar').addHandler('image', handleImageClick);
      }, 0);
    }
  }, [modal.visible])

  const handleOk = () => {
    if (!name.trim()) {
      alert('Nhập tên sự kiện')
      return;
    }
    if (!linkBanner.trim()) {
      alert('Nhập link banner')
      return;
    }
    if (!startDate) {
      alert('Chọn ngày bắt đầu')
      return;
    }
    if (!endDate) {
      alert('Chọn ngày kết thúc')
      return;
    }
    if (moment(endDate).isBefore(moment(startDate))) {
      alert('Ngày kết thúc phải sau ngày bắt đầu!')
      return;
    }

    const data = {
      name,
      linkBanner,
      startDate: moment(startDate).format('YYYY-MM-DD'),
      endDate: endDate ? moment(endDate).format('YYYY-MM-DD') : null,
      content
    }

    if (modal.type == 'add') {
      const id = addDocData(data)
      setDataSource([
        ...dataSource,
        { ...data, id },
      ])
      closeModal()
    } else if (modal.type == 'edit') {
      updateDocData(modal.record.id, data)
      setDataSource(dataSource.map(item =>
        item.id === modal.record.id
          ? { ...item, ...data }
          : item
      ))
      closeModal()
    }
  }

  const handleDelete = async (record) => {
    if (window.confirm('Bạn chắc chắn muốn xóa?')) {
      deleteDocData(record.id)
      setDataSource(dataSource.filter(item => item.id !== record.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={() => openModal('add')}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
        >
          Thêm sự kiện
        </button>
      </div>

      {/* Table */}
      {dataSource.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tên sự kiện</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Banner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thời gian bắt đầu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thời gian kết thúc</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataSource.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{record.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.linkBanner ? (
                      <a href={record.linkBanner} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Xem banner
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{record.startDate || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{record.endDate || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal('edit', record)}
                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-900 rounded hover:bg-gray-200"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(record)}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">Không có sự kiện</div>
      )}

      {/* Modal */}
      {modal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal.type === 'add' ? 'Thêm sự kiện' : 'Sửa sự kiện'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên sự kiện *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link banner *</label>
                <input
                  type="text"
                  value={linkBanner}
                  onChange={e => setLinkBanner(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian bắt đầu *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian kết thúc *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bài viết</label>
                <div className="min-h-[200px]">
                  <ReactQuill
                    ref={quillRef}
                    value={content}
                    onChange={handleChange}
                    modules={reactQuillModules}
                    formats={reactQuillFormats}
                    className="min-h-[200px]"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleOk}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
              >
                {modal.type === 'add' ? 'Thêm' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md m-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Thêm URL Hình ảnh</h2>
            </div>
            <div className="p-6">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Nhập link hình ảnh"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
              >
                Thoát
              </button>
              <button
                onClick={insertImage}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventManagement
