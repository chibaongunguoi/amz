import React from 'react';
import { useNavigate } from 'react-router-dom';
import routePath from '../../constants/routePath';
import { ArrowRightOutlined } from '@ant-design/icons';
import { createPostSlug } from '@/utils/post.utils';
import moment from 'moment';
import OptimizedImage from '@/components/common/OptimizedImage';

function RelatedPosts({ posts, currentPostId }) {
  const navigate = useNavigate();

  if (!posts || posts.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = moment(dateString);
    return date.isValid() ? date.format('DD/MM/YYYY') : dateString;
  };

  const handlePostClick = (post) => {
    const slug = createPostSlug(post);
    if (slug) navigate(`${routePath.postDetail}/${slug}`);
    else navigate(`${routePath.postDetail}?id=${encodeURIComponent(post.id)}`);
  };

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bài viết liên quan</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-[#D65312] to-transparent"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, 3).map((post) => (
          <article
            key={post.id}
            onClick={() => handlePostClick(post)}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group border border-gray-100 flex flex-col h-full"
          >
            {post.thumbnail || post.featuredImage ? (
              <div className="w-full h-48 overflow-hidden bg-gray-100">
                <OptimizedImage
                  src={post.thumbnail || post.featuredImage}
                  alt={post.title}
                  width={400}
                  height={240}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-4xl">📄</span>
              </div>
            )}
            
            <div className="p-4 md:p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <span>{formatDate(post.date || post.publishedAt)}</span>
                {post.views > 0 && (
                  <>
                    <span>•</span>
                    <span>{post.views} lượt xem</span>
                  </>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#D65312] transition-colors duration-200 line-clamp-2 flex-1">
                {post.title}
              </h3>
              
              {post.excerpt && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
                  {post.excerpt}
                </p>
              )}
              
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[#D65312] font-semibold text-sm group-hover:underline flex items-center gap-1">
                  Đọc thêm
                  <ArrowRightOutlined className="text-xs" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RelatedPosts;
