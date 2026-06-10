import React, { useEffect, useState, useMemo } from 'react';
import { BarChartOutlined, EyeOutlined, FileTextOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { loadPosts } from '@/lib/data';
import moment from 'moment';

function PostAnalytics() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // all, week, month, year

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const allPosts = await loadPosts();
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    if (dateRange === 'all') return posts;
    
    const now = moment();
    let startDate;
    
    switch (dateRange) {
      case 'week':
        startDate = now.clone().subtract(7, 'days');
        break;
      case 'month':
        startDate = now.clone().subtract(30, 'days');
        break;
      case 'year':
        startDate = now.clone().subtract(365, 'days');
        break;
      default:
        return posts;
    }
    
    return posts.filter(post => {
      const postDate = moment(post.date || post.publishedAt);
      return postDate.isAfter(startDate);
    });
  }, [posts, dateRange]);

  const stats = useMemo(() => {
    const totalPosts = filteredPosts.length;
    const totalViews = filteredPosts.reduce((sum, post) => sum + (Number(post.views) || 0), 0);
    const avgViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
    const topPost = filteredPosts.reduce((top, post) => {
      const views = Number(post.views) || 0;
      return views > (Number(top.views) || 0) ? post : top;
    }, filteredPosts[0] || null);

    // Posts by status
    const published = filteredPosts.filter(p => !p.status || p.status === 'published').length;
    const drafts = filteredPosts.filter(p => p.status === 'draft').length;

    // Posts by category
    const latest = filteredPosts.filter(p => p.category === 'latest' || p.category === 'both').length;
    const hot = filteredPosts.filter(p => p.category === 'hot' || p.category === 'both').length;

    return {
      totalPosts,
      totalViews,
      avgViews,
      topPost,
      published,
      drafts,
      latest,
      hot,
    };
  }, [filteredPosts]);

  const topPosts = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
      .slice(0, 10);
  }, [filteredPosts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#D65312] mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChartOutlined className="text-2xl text-[#D65312]" />
          <h1 className="text-2xl font-bold text-gray-900">Thống kê Bài viết</h1>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D65312]"
        >
          <option value="all">Tất cả thời gian</option>
          <option value="week">7 ngày qua</option>
          <option value="month">30 ngày qua</option>
          <option value="year">1 năm qua</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng bài viết</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
            <FileTextOutlined className="text-4xl text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng lượt xem</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString('vi-VN')}</p>
            </div>
            <EyeOutlined className="text-4xl text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Lượt xem trung bình</p>
              <p className="text-3xl font-bold text-gray-900">{stats.avgViews.toLocaleString('vi-VN')}</p>
            </div>
            <BarChartOutlined className="text-4xl text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bài viết đã xuất bản</p>
              <p className="text-3xl font-bold text-gray-900">{stats.published}</p>
            </div>
            <CalendarOutlined className="text-4xl text-orange-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân loại</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bài viết mới nhất</span>
              <span className="font-semibold text-gray-900">{stats.latest}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bài viết hot</span>
              <span className="font-semibold text-gray-900">{stats.hot}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bản nháp</span>
              <span className="font-semibold text-gray-900">{stats.drafts}</span>
            </div>
          </div>
        </div>

        {stats.topPost && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bài viết phổ biến nhất</h3>
            <div>
              <p className="font-medium text-gray-900 mb-2 line-clamp-2">{stats.topPost.title}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <EyeOutlined />
                  {stats.topPost.views?.toLocaleString('vi-VN') || 0} lượt xem
                </span>
                {stats.topPost.date && (
                  <span className="flex items-center gap-1">
                    <CalendarOutlined />
                    {moment(stats.topPost.date).format('DD/MM/YYYY')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tỷ lệ xuất bản</span>
              <span className="font-semibold text-gray-900">
                {stats.totalPosts > 0
                  ? Math.round((stats.published / stats.totalPosts) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tỷ lệ bản nháp</span>
              <span className="font-semibold text-gray-900">
                {stats.totalPosts > 0
                  ? Math.round((stats.drafts / stats.totalPosts) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top 10 Bài viết phổ biến</h2>
        </div>
        {topPosts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có dữ liệu</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tiêu đề</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Lượt xem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ngày đăng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topPosts.map((post, index) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{post.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(Number(post.views) || 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {post.date ? moment(post.date).format('DD/MM/YYYY') : '-'}
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

export default PostAnalytics;
