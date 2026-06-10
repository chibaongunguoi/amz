import React, { useEffect, useState } from 'react';
import { TagsOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { loadCollection } from '@/lib/data';
import { saveCollectionData } from '@/lib/data.save';

function PostTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6366f1',
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const data = await loadCollection('postTags');
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading tags:', error);
      setTags([]);
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
      alert('Vui lòng nhập tên thẻ tag');
      return;
    }

    try {
      const slug = formData.slug || generateSlug(formData.name);
      const tagData = {
        ...formData,
        slug,
        id: editingTag?.id || `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: editingTag?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedTags;
      if (editingTag) {
        updatedTags = tags.map(tag =>
          tag.id === editingTag.id ? tagData : tag
        );
      } else {
        updatedTags = [...tags, tagData];
      }

      await saveCollectionData('postTags', updatedTags);
      setTags(updatedTags);
      resetForm();
      alert(editingTag ? 'Đã cập nhật tag thành công' : 'Đã thêm tag thành công');
    } catch (error) {
      console.error('Error saving tag:', error);
      alert('Lỗi khi lưu tag: ' + error.message);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name || '',
      slug: tag.slug || '',
      description: tag.description || '',
      color: tag.color || '#6366f1',
    });
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa tag này?')) {
      return;
    }

    try {
      const updatedTags = tags.filter(tag => tag.id !== tagId);
      await saveCollectionData('postTags', updatedTags);
      setTags(updatedTags);
      alert('Đã xóa tag thành công');
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Lỗi khi xóa tag: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingTag(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#6366f1',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TagsOutlined className="text-2xl text-[#D65312]" />
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thẻ Tag</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingTag ? 'Sửa tag' : 'Thêm tag mới'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên tag <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (!editingTag && !formData.slug) {
                    setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="Ví dụ: Công nghệ, Review..."
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
              rows="2"
              placeholder="Mô tả về tag này..."
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
                placeholder="#6366f1"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-[#D65312] text-white rounded-lg hover:bg-[#FF8C42] transition-colors font-medium"
            >
              {editingTag ? 'Cập nhật' : 'Thêm mới'}
            </button>
            {editingTag && (
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
          <h2 className="text-lg font-semibold text-gray-900">Danh sách tags ({tags.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có tag nào</div>
        ) : (
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all hover:shadow-md"
                  style={{
                    borderColor: tag.color || '#6366f1',
                    backgroundColor: `${tag.color || '#6366f1'}15`,
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: tag.color || '#6366f1' }}
                  >
                    {tag.name}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Sửa"
                    >
                      <EditOutlined className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Xóa"
                    >
                      <DeleteOutlined className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostTags;
