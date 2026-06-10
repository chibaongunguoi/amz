import React, { useEffect, useState } from 'react'
import PostForm from './PostForm'
import { loadCollection, clearDataCache } from '@/lib/data'
import { saveCollectionData } from '@/lib/data.save'

const postTypeOptions = [
  { label: 'Bài viết chung', value: 'postService' },
  { label: 'Sản phẩm', value: 'productPosts' },
]

function PostManagement() {
  const [dataSource, setDataSource] = useState([])
  const [loading, setLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [collectionName, setCollectionName] = useState('postService')
  const [formType, setFormType] = useState('Add')

  const fetchData = async () => {
    setLoading(true)
    try {
      // Force reload để đảm bảo lấy dữ liệu mới nhất
      const result = await loadCollection(collectionName, true);
      setDataSource(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setDataSource([]);
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName])

  const handleDelete = async (record) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa?')) {
      return;
    }

    try {
      // Load dữ liệu hiện tại
      const currentData = await loadCollection(collectionName, true);
      const dataArray = Array.isArray(currentData) ? currentData : [];
      
      // Xóa bài viết
      const updatedData = dataArray.filter(item => item.id !== record.id);
      
      // Lưu lại qua API server
      await saveCollectionData(collectionName, updatedData);
      
      // Clear cache và reload
      clearDataCache();
      await fetchData();
      
      alert('Đã xóa bài viết thành công!');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Lỗi khi xóa bài viết: ' + error.message);
    }
  }

  const handleEdit = (record = {}, type = "Add") => {
    setEditRecord(record || '')
    setEditModalOpen(true)
    setFormType(type)
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setEditRecord(null)
  }

  const handleFinishPostForm = async () => {
    // Clear cache và reload lại data
    clearDataCache();
    await fetchData();
    setEditModalOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chọn loại bài viết:</label>
          <select
            value={collectionName}
            onChange={e => setCollectionName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 min-w-[200px]"
          >
            {postTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => handleEdit('', 'Add')}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
        >
          Thêm bài viết
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : dataSource.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ngày đăng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataSource.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{record.title || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{record.date || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(record, 'Update')}
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
        <div className="text-center py-12 text-gray-500">Không có bài viết</div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {formType === 'Add' ? 'Thêm bài viết' : 'Sửa bài viết'}
              </h2>
            </div>
            <div className="p-6">
              <PostForm 
                initialValues={editRecord} 
                type={formType} 
                collectionOrigin={collectionName} 
                onFinish={handleFinishPostForm}
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleCloseEditModal}
                className="px-4 py-2 bg-gray-100 text-gray-900 text-sm rounded hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostManagement
