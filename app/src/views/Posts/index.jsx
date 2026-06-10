import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPosts, loadCollection } from '../../lib/data';
import routePath from '../../constants/routePath';
import { POST_STATUS } from '../../constants';
import { createPostSlug } from '@/utils/post.utils';
import moment from 'moment';
import { 
  SearchOutlined, 
  CalendarOutlined, 
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FolderOutlined,
  TagOutlined
} from '@ant-design/icons';
import OptimizedImage from '@/components/common/OptimizedImage';

function Posts() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, popular
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const postsPerPage = 12;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load posts và categories song song
        const [allPosts, allCategories] = await Promise.all([
          loadPosts(),
          loadCollection('postCategories').catch(() => [])
        ]);
        
        // Filter only published posts
        const publishedPosts = allPosts.filter(post => 
          !post.status || post.status === POST_STATUS.PUBLISHED
        );
        setPosts(publishedPosts);
        setCategories(Array.isArray(allCategories) ? allCategories : []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Parse date from string format
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    const formats = [
      'HH:mm DD/MM/YYYY',
      'HH:mm:ss D/M/YYYY',
      'HH:mm D/M/YYYY',
      'DD/MM/YYYY',
      'D/M/YYYY',
      'YYYY-MM-DD',
      'YYYY-MM-DD HH:mm:ss',
    ];
    
    for (const format of formats) {
      const parsed = moment(dateString, format, true);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }
    
    const isoParsed = moment(dateString);
    return isoParsed.isValid() ? isoParsed.toDate() : null;
  };

  // Calculate reading time
  const calculateReadingTime = (content) => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / 200);
  };

  // Get category info by ID
  const getCategoryInfo = (categoryId) => {
    if (!categoryId) return null;
    return categories.find(cat => cat.id === categoryId || cat.slug === categoryId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseDate(dateString);
    if (!date) return dateString;
    return moment(date).format('DD/MM/YYYY');
  };

  const getExcerpt = (content, excerpt) => {
    if (excerpt) return excerpt;
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  const handlePostClick = (post) => {
    const slug = createPostSlug(post);
    if (slug) navigate(`${routePath.postDetail}/${slug}`);
    else navigate(`${routePath.postDetail}?id=${encodeURIComponent(post.id)}`);
  };

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [posts]);

  // Filter and sort all posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title?.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.content?.toLowerCase().includes(query) ||
        post.categoryName?.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(post =>
        post.tags && post.tags.includes(selectedTag)
      );
    }

    // Category filter
    if (selectedCategoryId) {
      filtered = filtered.filter(post =>
        post.categoryId === selectedCategoryId || post.categorySlug === selectedCategoryId
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = parseDate(a.publishedAt || a.date);
        const dateB = parseDate(b.publishedAt || b.date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA;
      } else if (sortBy === 'oldest') {
        const dateA = parseDate(a.publishedAt || a.date);
        const dateB = parseDate(b.publishedAt || b.date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      } else if (sortBy === 'popular') {
        const viewsA = Number(a.views) || 0;
        const viewsB = Number(b.views) || 0;
        if (viewsA !== viewsB) return viewsB - viewsA;
        const dateA = parseDate(a.publishedAt || a.date);
        const dateB = parseDate(b.publishedAt || b.date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA;
      }
      return 0;
    });

    return sorted;
  }, [posts, searchQuery, selectedTag, selectedCategoryId, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    return filteredAndSortedPosts.slice(startIndex, startIndex + postsPerPage);
  }, [filteredAndSortedPosts, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Post Card Component
  const PostCard = ({ post }) => {
    const categoryInfo = getCategoryInfo(post.categoryId);
    const readingTime = post.readingTime || calculateReadingTime(post.content);
    const featuredImage = post.featuredImage || post.thumbnail;

    return (
      <article
        onClick={() => handlePostClick(post)}
        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group border border-gray-100 flex flex-col h-full"
      >
        {/* Image */}
        {featuredImage ? (
          <div className="w-full h-48 md:h-56 overflow-hidden bg-gray-100 relative">
            <OptimizedImage
              src={featuredImage}
              alt={post.title}
              width={420}
              height={260}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {/* Category Badge on Image */}
            {categoryInfo && (
              <div className="absolute bottom-4 left-4">
                <span
                  className="px-3 py-1.5 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm"
                  style={{ backgroundColor: `${categoryInfo.color || '#D65312'}CC` }}
                >
                  {categoryInfo.name}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 md:h-56 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            {categoryInfo ? (
              <div className="text-center">
                <FolderOutlined className="text-4xl mb-2" style={{ color: categoryInfo.color || '#D65312' }} />
                <div
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${categoryInfo.color || '#D65312'}20`,
                    color: categoryInfo.color || '#D65312'
                  }}
                >
                  {categoryInfo.name}
                </div>
              </div>
            ) : (
              <span className="text-gray-400 text-4xl">📄</span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-6 flex-1 flex flex-col">
          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 flex-wrap">
            <span className="flex items-center gap-1">
              <CalendarOutlined />
              {formatDate(post.publishedAt || post.date)}
            </span>
            {post.views > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <EyeOutlined />
                  {post.views.toLocaleString('vi-VN')}
                </span>
              </>
            )}
            {readingTime > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ClockCircleOutlined />
                  {readingTime} phút
                </span>
              </>
            )}
            {post.authorName || post.author ? (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <UserOutlined />
                  {post.authorName || post.author}
                </span>
              </>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 group-hover:text-[#D65312] transition-colors duration-200 line-clamp-2 flex-1">
            {post.title}
          </h3>

          {/* Excerpt */}
          {(post.excerpt || post.content) && (
            <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
              {getExcerpt(post.content, post.excerpt)}
            </p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <TagOutlined className="text-gray-400 text-xs" />
              {post.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{post.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
            <span className="text-[#D65312] font-semibold text-sm group-hover:underline flex items-center gap-1">
              Đọc thêm
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
            {categoryInfo && !featuredImage && (
              <span
                className="px-3 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${categoryInfo.color || '#D65312'}15`,
                  color: categoryInfo.color || '#D65312'
                }}
              >
                {categoryInfo.name}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#D65312] mb-4"></div>
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#D65312] to-[#FF8C42] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ marginBottom: 16 }}>
            Bài viết
          </h1>
          <p className="text-xl md:text-2xl opacity-90" style={{ marginBottom: 0 }}>
            Khám phá những thông tin mới nhất và chủ đề hot về sản phẩm âm thanh
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-9">
            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm kiếm bài viết..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <FolderOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312] appearance-none bg-white"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tag Filter */}
                <div className="relative">
                  <TagOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={selectedTag}
                    onChange={(e) => {
                      setSelectedTag(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312] appearance-none bg-white"
                  >
                    <option value="">Tất cả thẻ tag</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312] appearance-none bg-white"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="popular">Phổ biến nhất</option>
                  </select>
                </div>
              </div>

              {/* Active filters */}
              {(searchQuery || selectedTag || selectedCategoryId) && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 font-medium">Bộ lọc:</span>
                  {searchQuery && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                      &quot;{searchQuery}&quot;
                      <button
                        onClick={() => setSearchQuery('')}
                        className="hover:text-blue-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedCategoryId && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
                      {getCategoryInfo(selectedCategoryId)?.name || 'Danh mục'}
                      <button
                        onClick={() => setSelectedCategoryId('')}
                        className="hover:text-green-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedTag && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                      {selectedTag}
                      <button
                        onClick={() => setSelectedTag('')}
                        className="hover:text-purple-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Results count and view mode */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Tìm thấy <strong className="text-[#D65312]">{filteredAndSortedPosts.length}</strong> bài viết
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-[#D65312] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Lưới"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-[#D65312] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Danh sách"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Posts Grid/List */}
            {paginatedPosts.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {paginatedPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6 mb-8">
                    {paginatedPosts.map((post) => {
                      const categoryInfo = getCategoryInfo(post.categoryId);
                      const readingTime = post.readingTime || calculateReadingTime(post.content);
                      const featuredImage = post.featuredImage || post.thumbnail;
                      
                      return (
                        <article
                          key={post.id}
                          onClick={() => handlePostClick(post)}
                          className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group border border-gray-100 flex flex-col md:flex-row h-full"
                        >
                          {featuredImage ? (
                            <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden bg-gray-100 flex-shrink-0">
                              <OptimizedImage
                                src={featuredImage}
                                alt={post.title}
                                width={256}
                                height={192}
                                sizes="(max-width: 768px) 100vw, 256px"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-full md:w-64 h-48 md:h-auto bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                              {categoryInfo ? (
                                <div className="text-center">
                                  <FolderOutlined className="text-4xl mb-2" style={{ color: categoryInfo.color || '#D65312' }} />
                                  <div
                                    className="text-xs font-semibold px-3 py-1 rounded-full"
                                    style={{ 
                                      backgroundColor: `${categoryInfo.color || '#D65312'}20`,
                                      color: categoryInfo.color || '#D65312'
                                    }}
                                  >
                                    {categoryInfo.name}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-4xl">📄</span>
                              )}
                            </div>
                          )}
                          <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              {categoryInfo && (
                                <span
                                  className="px-3 py-1 text-xs font-semibold rounded-full"
                                  style={{
                                    backgroundColor: `${categoryInfo.color || '#D65312'}15`,
                                    color: categoryInfo.color || '#D65312'
                                  }}
                                >
                                  {categoryInfo.name}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <CalendarOutlined />
                                {formatDate(post.publishedAt || post.date)}
                              </span>
                              {post.views > 0 && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <EyeOutlined />
                                  {post.views.toLocaleString('vi-VN')}
                                </span>
                              )}
                              {readingTime > 0 && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <ClockCircleOutlined />
                                  {readingTime} phút
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#D65312] transition-colors duration-200">
                              {post.title}
                            </h3>
                            {(post.excerpt || post.content) && (
                              <p className="text-gray-600 mb-4 line-clamp-2">
                                {getExcerpt(post.content, post.excerpt)}
                              </p>
                            )}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <TagOutlined className="text-gray-400" />
                                {post.tags.slice(0, 5).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-auto">
                              <span className="text-[#D65312] font-semibold text-sm group-hover:underline flex items-center gap-1">
                                Đọc thêm
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 border rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-[#D65312] text-white border-[#D65312]'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
                Không tìm thấy bài viết nào
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FolderOutlined className="text-[#D65312]" />
                  Danh mục
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategoryId('');
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      !selectedCategoryId
                        ? 'bg-[#D65312] text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Tất cả danh mục
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        selectedCategoryId === cat.id
                          ? 'bg-[#D65312] text-white font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || '#D65312' }}
                      />
                      <span>{cat.name}</span>
                      <span className="ml-auto text-xs opacity-75">
                        ({posts.filter(p => p.categoryId === cat.id || p.categorySlug === cat.slug).length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Tags */}
            {allTags.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TagOutlined className="text-[#D65312]" />
                  Thẻ tag phổ biến
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 20).map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(selectedTag === tag ? '' : tag);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedTag === tag
                          ? 'bg-[#D65312] text-white font-semibold'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Posts;
