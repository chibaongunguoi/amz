import React, { useEffect, useState } from 'react';
import { UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { loadCollection } from '@/lib/data';
import { saveCollectionData } from '@/lib/data.save';
import OptimizedImage from '@/components/common/OptimizedImage';

function PostAuthors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    bio: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      linkedin: '',
    },
  });

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const data = await loadCollection('postAuthors');
      setAuthors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading authors:', error);
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên tác giả');
      return;
    }

    try {
      const authorData = {
        ...formData,
        id: editingAuthor?.id || `author_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: editingAuthor?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedAuthors;
      if (editingAuthor) {
        updatedAuthors = authors.map(author =>
          author.id === editingAuthor.id ? authorData : author
        );
      } else {
        updatedAuthors = [...authors, authorData];
      }

      await saveCollectionData('postAuthors', updatedAuthors);
      setAuthors(updatedAuthors);
      resetForm();
      alert(editingAuthor ? 'Đã cập nhật tác giả thành công' : 'Đã thêm tác giả thành công');
    } catch (error) {
      console.error('Error saving author:', error);
      alert('Lỗi khi lưu tác giả: ' + error.message);
    }
  };

  const handleEdit = (author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name || '',
      email: author.email || '',
      avatar: author.avatar || '',
      bio: author.bio || '',
      socialLinks: author.socialLinks || {
        facebook: '',
        twitter: '',
        linkedin: '',
      },
    });
  };

  const handleDelete = async (authorId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa tác giả này?')) {
      return;
    }

    try {
      const updatedAuthors = authors.filter(author => author.id !== authorId);
      await saveCollectionData('postAuthors', updatedAuthors);
      setAuthors(updatedAuthors);
      alert('Đã xóa tác giả thành công');
    } catch (error) {
      console.error('Error deleting author:', error);
      alert('Lỗi khi xóa tác giả: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingAuthor(null);
    setFormData({
      name: '',
      email: '',
      avatar: '',
      bio: '',
      socialLinks: {
        facebook: '',
        twitter: '',
        linkedin: '',
      },
    });
  };

  const updateSocialLink = (platform, value) => {
    setFormData({
      ...formData,
      socialLinks: {
        ...formData.socialLinks,
        [platform]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <UserOutlined className="text-2xl text-[#D65312]" />
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Tác giả</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingAuthor ? 'Sửa tác giả' : 'Thêm tác giả mới'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên tác giả <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="Nhập tên tác giả"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
              placeholder="https://example.com/avatar.jpg"
            />
            {formData.avatar && (
              <OptimizedImage
                src={formData.avatar}
                alt="Avatar preview"
                width={80}
                height={80}
                sizes="80px"
                className="mt-2 w-20 h-20 rounded-full object-cover border border-gray-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiểu sử
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
              rows="4"
              placeholder="Mô tả về tác giả..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Liên kết mạng xã hội
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="url"
                value={formData.socialLinks.facebook}
                onChange={(e) => updateSocialLink('facebook', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="Facebook URL"
              />
              <input
                type="url"
                value={formData.socialLinks.twitter}
                onChange={(e) => updateSocialLink('twitter', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="Twitter URL"
              />
              <input
                type="url"
                value={formData.socialLinks.linkedin}
                onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                placeholder="LinkedIn URL"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-[#D65312] text-white rounded-lg hover:bg-[#FF8C42] transition-colors font-medium"
            >
              {editingAuthor ? 'Cập nhật' : 'Thêm mới'}
            </button>
            {editingAuthor && (
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
          <h2 className="text-lg font-semibold text-gray-900">Danh sách tác giả ({authors.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : authors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có tác giả nào</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {authors.map((author) => (
              <div
                key={author.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {author.avatar ? (
                    <OptimizedImage
                      src={author.avatar}
                      alt={author.name}
                      width={64}
                      height={64}
                      sizes="64px"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/64';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D65312] to-[#FF8C42] flex items-center justify-center">
                      <UserOutlined className="text-white text-2xl" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{author.name}</h3>
                    {author.email && (
                      <p className="text-sm text-gray-600 truncate">{author.email}</p>
                    )}
                    {author.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{author.bio}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(author)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Sửa"
                      >
                        <EditOutlined />
                      </button>
                      <button
                        onClick={() => handleDelete(author.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa"
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PostAuthors;
