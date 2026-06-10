import React, { useEffect, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { POST_CATEGORY, POST_CATEGORY_OPTIONS } from '../../../constants'
import { loadCollection, clearDataCache } from '../../../lib/data'
import { saveCollectionData } from '../../../lib/data.save'
import OptimizedImage from '@/components/common/OptimizedImage'

const formatDateTime = (date) => {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

const postTypeOptions = [
  { label: 'Bài viết chung', value: 'postService' },
  { label: 'Sản phẩm', value: 'productPosts' },
]

function PostForm({ initialValues = {}, collectionOrigin = "postService", type = "Add", onFinish }) {
  const [content, setContent] = useState('')
  const [collectionName, setCollectionName] = useState(collectionOrigin)
  const [titlePost, setTitlePost] = useState("")
  const [postCategory, setPostCategory] = useState(POST_CATEGORY.NONE)
  const [postCategoryId, setPostCategoryId] = useState('') // Danh mục bài viết từ Categories
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [currentTime, setCurrentTime] = useState(formatDateTime(new Date()));

  const handleEditorChange = (content) => {
    setContent(content)
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // Load categories
  useEffect(() => {
    const fetchCategories = async (forceReload = false) => {
      setLoadingCategories(true);
      try {
        const data = await loadCollection('postCategories', forceReload);
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    // Load lần đầu
    fetchCategories(true);
    
    // Reload khi window focus (nếu user quay lại từ tab khác sau khi tạo category)
    const handleFocus = () => {
      fetchCategories(true);
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatDateTime(new Date()));
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (initialValues) {
      setTitlePost(initialValues.title ? initialValues.title : '')
      setContent(initialValues.content ? initialValues.content : '')
      setCollectionName(collectionOrigin)
      setPostCategory(initialValues.category || POST_CATEGORY.NONE)
      setPostCategoryId(initialValues.categoryId || initialValues.categorySlug || '')
      setExcerpt(initialValues.excerpt || '')
      setThumbnail(initialValues.thumbnail || initialValues.featuredImage || '')
      setTags(Array.isArray(initialValues.tags) ? initialValues.tags : [])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!titlePost.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết')
      return
    }

    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bài viết')
      return
    }

    try {
      // Load dữ liệu hiện tại từ collection
      const currentData = await loadCollection(collectionName, true);
      const dataArray = Array.isArray(currentData) ? currentData : [];

      const selectedCategory = categories.find(cat => cat.id === postCategoryId || cat.slug === postCategoryId);
      
      const postData = {
        id: initialValues.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: titlePost,
        date: type === "Add" ? new Date().toLocaleString('vi-VN') : (initialValues.date || currentTime),
        publishedAt: type === "Add" ? new Date().toISOString() : (initialValues.publishedAt || new Date().toISOString()),
        updatedAt: new Date().toISOString(),
        createdAt: initialValues.createdAt || new Date().toISOString(),
        content,
        excerpt: excerpt.trim() || undefined,
        thumbnail: thumbnail.trim() || undefined,
        featuredImage: thumbnail.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        category: postCategory, // Phân loại hiển thị (latest, hot, both, none)
        categoryId: postCategoryId || undefined, // ID danh mục bài viết
        categorySlug: selectedCategory?.slug || undefined,
        categoryName: selectedCategory?.name || undefined,
        status: 'published',
        views: initialValues.views || 0,
      }

      let updatedData;
      if (type === "Add") {
        // Thêm bài viết mới
        updatedData = [...dataArray, postData];
      } else {
        // Cập nhật bài viết hiện có
        updatedData = dataArray.map(item => 
          item.id === initialValues.id ? postData : item
        );
      }

      // Lưu vào collection bài viết qua API server
      await saveCollectionData(collectionName, updatedData);
      
      // Clear cache để đảm bảo load lại dữ liệu mới
      clearDataCache();
      
      alert(type === "Add" ? 'Đã thêm bài viết thành công!' : 'Đã cập nhật bài viết thành công!');

      // Call onFinish callback
      if (onFinish) {
        onFinish(postData)
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Lỗi khi lưu bài viết: ' + error.message);
    }
  }

  const handleClear = () => {
    setContent('')
    setExcerpt('')
    setThumbnail('')
    setTags([])
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tên bài viết:</label>
        <input
          type="text"
          value={titlePost}
          onChange={(e) => setTitlePost(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      <div>
        <span className="text-sm font-medium text-gray-700">Ngày viết: </span>
        <span className="text-sm text-gray-600">{currentTime}</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn loại bài viết:</label>
        <select
          value={collectionName}
          onChange={e => setCollectionName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          {postTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục bài viết:</label>
        <select
          value={postCategoryId}
          onChange={(e) => setPostCategoryId(e.target.value)}
          disabled={loadingCategories}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value="">-- Chọn danh mục (tùy chọn) --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {postCategoryId && (
          <div className="mt-2 flex items-center gap-2">
            {(() => {
              const selectedCat = categories.find(cat => cat.id === postCategoryId);
              return selectedCat ? (
                <>
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: selectedCat.color || '#D65312' }}
                  />
                  <span className="text-xs text-gray-600">
                    {selectedCat.description || 'Không có mô tả'}
                  </span>
                </>
              ) : null;
            })()}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Chọn danh mục để phân loại bài viết (quản lý tại Quản lý Blog → Danh mục bài viết)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phân loại hiển thị:</label>
        <select
          value={postCategory}
          onChange={e => setPostCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          {POST_CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Chọn loại hiển thị: Thông tin mới nhất, Chủ đề hot, hoặc cả hai
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả ngắn (Excerpt):</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          rows="3"
          placeholder="Mô tả ngắn về bài viết (hiển thị ở trang danh sách)..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Mô tả ngắn sẽ hiển thị ở trang danh sách bài viết và trong meta description (SEO)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện (Thumbnail/Featured Image):</label>
        <input
          type="url"
          value={thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          placeholder="https://example.com/image.jpg"
        />
        {thumbnail && (
          <div className="mt-2">
            <OptimizedImage
              src={thumbnail}
              alt="Thumbnail preview"
              width={320}
              height={128}
              sizes="320px"
              className="max-w-xs h-32 object-cover rounded border border-gray-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          URL ảnh đại diện cho bài viết (hiển thị ở trang danh sách và đầu bài viết)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Thẻ tag:</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            placeholder="Nhập tag và nhấn Enter"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
          >
            Thêm
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#D65312]/10 text-[#D65312] text-sm rounded-full border border-[#D65312]/20"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Thêm các thẻ tag để phân loại và tìm kiếm bài viết dễ dàng hơn
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung bài viết:</label>
        <div className="min-h-[500px]">
          <Editor
            apiKey="b4ryhxq7nnx5nwmr46ft5ifo6da5zw2i6g7lthivcyr9acot"
            value={content}
            onEditorChange={handleEditorChange}
            init={{
              height: 500,
              menubar: 'file edit view insert format tools table help',
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount',
                'emoticons', 'template', 'pagebreak', 'nonbreaking', 'directionality',
                'visualchars', 'textcolor', 'colorpicker', 'textpattern',
                'hr', 'paste', 'autosave', 'save', 'print', 'spellchecker', 'contextmenu'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic underline strikethrough | forecolor backcolor | ' +
                'alignleft aligncenter alignright alignjustify | ' +
                'bullist numlist outdent indent | ' +
                'removeformat | help | ' +
                'fontsize fontfamily | ' +
                'link image media table | ' +
                'code fullscreen preview | ' +
                'emoticons charmap hr pagebreak | ' +
                'searchreplace visualblocks visualchars | ' +
                'template insertdatetime print',
              font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 30pt 32pt 34pt 36pt 40pt 44pt 48pt 52pt 56pt 60pt 64pt 68pt 72pt',
              font_family_formats: 'Andale Mono=andale mono,times; Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva; Webdings=webdings; Wingdings=wingdings,zapf dingbats',
              content_style: 'body { font-family: "Be Vietnam Pro", Arial, sans-serif; font-size: 14px; line-height: 1.8; }',
              branding: false,
              promotion: false,
              mobile: {
                toolbar_mode: 'sliding',
                plugins: 'autosave lists link table',
              },
              image_advtab: true,
              paste_data_images: true,
              automatic_uploads: true,
              file_picker_types: 'image',
              images_upload_handler: async (blobInfo) => {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader()
                  reader.onload = () => {
                    resolve(reader.result)
                  }
                  reader.onerror = () => {
                    reject('Image upload failed')
                  }
                  reader.readAsDataURL(blobInfo.blob())
                })
              },
              resize: true,
              elementpath: true,
              statusbar: true,
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Xóa hết
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
        >
          Lưu
        </button>
      </div>

    </div>
  )
}

export default PostForm
