import React, { useEffect, useState } from 'react';
import { FolderOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { loadCollection, clearDataCache } from '@/lib/data';
import { saveCollectionData } from '@/lib/data.save';

function PostCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#D65312',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await loadCollection('postCategories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      const slug = formData.slug || generateSlug(formData.name);
      const categoryData = {
        ...formData,
        slug,
        id: editingCategory?.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: editingCategory?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedCategories;
      if (editingCategory) {
        updatedCategories = categories.map(cat =>
          cat.id === editingCategory.id ? categoryData : cat
        );
      } else {
        updatedCategories = [...categories, categoryData];
      }

      await saveCollectionData('postCategories', updatedCategories);
      // Clear cache và reload lại data từ server
      clearDataCache();
      // Force reload để đảm bảo lấy dữ liệu mới nhất
      const freshData = await loadCollection('postCategories', true);
      setCategories(Array.isArray(freshData) ? freshData : []);
      resetForm();
      alert(editingCategory ? 'Đã cập nhật danh mục thành công' : 'Đã thêm danh mục thành công');
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Lỗi khi lưu danh mục: ' + error.message);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      color: category.color || '#D65312',
    });
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa danh mục này?')) {
      return;
    }

    try {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      await saveCollectionData('postCategories', updatedCategories);
      // Clear cache và reload lại data từ server
      clearDataCache();
      // Force reload để đảm bảo lấy dữ liệu mới nhất
      const freshData = await loadCollection('postCategories', true);
      setCategories(Array.isArray(freshData) ? freshData : []);
      alert('Đã xóa danh mục thành công');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Lỗi khi xóa danh mục: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#D65312',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FolderOutlined className="text-2xl text-[#D65312]" />
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Danh mục Bài viết</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (!editingCategory && !formData.slug) {
                    setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="Ví dụ: Tin tức, Hướng dẫn..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL-friendly)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="Tự động tạo từ tên"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
              rows="3"
              placeholder="Mô tả về danh mục này..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Màu sắc
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="#D65312"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-[#D65312] text-white rounded-lg hover:bg-[#FF8C42] transition-colors font-medium"
            >
              {editingCategory ? 'Cập nhật' : 'Thêm mới'}
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách danh mục ({categories.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có danh mục nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Màu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Mô tả</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: category.color || '#D65312' }}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{category.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{category.description || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa"
                        >
                          <EditOutlined />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostCategories;
