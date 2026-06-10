import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { loadPosts, getDocumentById } from '../../lib/data';
import routePath from '../../constants/routePath';
import { POST_STATUS } from '../../constants';
import { createPostSlug, findPostBySlug } from '@/utils/post.utils';
import moment from 'moment';
import { 
  ArrowLeftOutlined, 
  CalendarOutlined, 
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TagOutlined
} from '@ant-design/icons';
import SocialShare from '../../components/blog/SocialShare';
import AuthorBio from '../../components/blog/AuthorBio';
import RelatedPosts from '../../components/blog/RelatedPosts';
import TableOfContents from '../../components/blog/TableOfContents';
import SEOHead from '../../components/blog/SEOHead';
import { sanitizeHtml } from '@/utils/htmlSanitizer';
import OptimizedImage from '@/components/common/OptimizedImage';

function PostDetail() {
  const { slug } = useParams();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const postId = queryParams.get('id');
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId && !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allPosts = await loadPosts();
        const postData = slug
          ? findPostBySlug(slug, allPosts)
          : await getDocumentById('postService', postId);
        
        if (postData && (!postData.status || postData.status === POST_STATUS.PUBLISHED)) {
          const canonicalSlug = createPostSlug(postData);
          if (canonicalSlug && slug !== canonicalSlug) {
            navigate(`${routePath.postDetail}/${canonicalSlug}`, { replace: true });
            return;
          }

          setPost(postData);
          
          // Load related posts
          if (postData.relatedPostIds && postData.relatedPostIds.length > 0) {
            const related = allPosts.filter(p => 
              postData.relatedPostIds.includes(p.id) && 
              p.id !== postData.id &&
              (!p.status || p.status === POST_STATUS.PUBLISHED)
            );
            setRelatedPosts(related);
          } else {
            // Load related posts by tags or category
            const related = allPosts
              .filter(p => 
                p.id !== postData.id &&
                (!p.status || p.status === POST_STATUS.PUBLISHED) &&
                (postData.tags?.some(tag => p.tags?.includes(tag)) || 
                 p.category === postData.category)
              )
              .slice(0, 3);
            setRelatedPosts(related);
          }
        } else {
          // If not found, try loading all posts
          const foundPost = allPosts.find(p => p.id === postId);
          if (foundPost && (!foundPost.status || foundPost.status === POST_STATUS.PUBLISHED)) {
            const canonicalSlug = createPostSlug(foundPost);
            if (canonicalSlug) {
              navigate(`${routePath.postDetail}/${canonicalSlug}`, { replace: true });
              return;
            }

            setPost(foundPost);
            
            // Load related posts
            const related = allPosts
              .filter(p => 
                p.id !== postId &&
                (!p.status || p.status === POST_STATUS.PUBLISHED) &&
                (foundPost.tags?.some(tag => p.tags?.includes(tag)) || 
                 p.category === foundPost.category)
              )
              .slice(0, 3);
            setRelatedPosts(related);
          }
        }
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, slug, navigate]);


  const formatDate = (dateString) => {
    if (!dateString) return '';
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
        return parsed.format('DD/MM/YYYY');
      }
    }
    
    const isoParsed = moment(dateString);
    return isoParsed.isValid() ? isoParsed.format('DD/MM/YYYY') : dateString;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = moment(dateString);
    return date.isValid() ? date.format('DD/MM/YYYY [lúc] HH:mm') : dateString;
  };

  const calculateReadingTime = (content) => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / 200);
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

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy bài viết</h1>
          <button
            onClick={() => navigate(routePath.posts)}
            className="px-6 py-2 bg-[#D65312] text-white rounded-lg hover:bg-[#FF8C42] transition-colors"
          >
            Quay lại danh sách bài viết
          </button>
        </div>
      </div>
    );
  }

  const readingTime = post.readingTime || calculateReadingTime(post.content);
  const featuredImage = post.featuredImage || post.thumbnail;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Head */}
      <SEOHead post={post} />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={() => navigate(routePath.posts)}
              className="hover:text-[#D65312] transition-colors"
            >
              Bài viết
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium line-clamp-1">{post.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Article */}
          <article className="lg:col-span-8">
            {/* Back Button */}
            <button
              onClick={() => navigate(routePath.posts)}
              className="flex items-center gap-2 text-gray-600 hover:text-[#D65312] mb-6 transition-colors group"
            >
              <ArrowLeftOutlined className="group-hover:-translate-x-1 transition-transform" />
              <span>Quay lại danh sách bài viết</span>
            </button>

            {/* Featured Image */}
            {featuredImage && (
              <div className="w-full h-64 md:h-96 lg:h-[500px] overflow-hidden bg-gray-100 rounded-2xl mb-8 shadow-lg">
                <OptimizedImage
                  src={featuredImage}
                  alt={post.title}
                  width={1200}
                  height={630}
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Article Header */}
            <header className="mb-8">
              {/* Category/Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <TagOutlined className="text-[#D65312]" />
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#D65312]/10 text-[#D65312] text-sm font-medium rounded-full border border-[#D65312]/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                {post.authorName || post.author ? (
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span className="font-medium">{post.authorName || post.author}</span>
                  </div>
                ) : null}
                
                <div className="flex items-center gap-2">
                  <CalendarOutlined />
                  <time dateTime={post.publishedAt || post.date}>
                    {formatDateTime(post.publishedAt || post.date)}
                  </time>
                </div>

                {post.views > 0 && (
                  <div className="flex items-center gap-2">
                    <EyeOutlined />
                    <span>{post.views.toLocaleString('vi-VN')} lượt xem</span>
                  </div>
                )}

                {readingTime > 0 && (
                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined />
                    <span>{readingTime} phút đọc</span>
                  </div>
                )}
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <div className="bg-gradient-to-r from-[#D65312]/5 to-transparent border-l-4 border-[#D65312] pl-6 py-4 mb-8 rounded-r-lg">
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed italic">
                    {post.excerpt}
                  </p>
                </div>
              )}
            </header>

            {/* Article Content */}
            <div className="prose prose-lg md:prose-xl max-w-none post-content">
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                style={{
                  lineHeight: '1.8',
                }}
              />
            </div>

            {/* Social Share */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <SocialShare 
                url={currentUrl}
                title={post.title}
                description={post.excerpt || post.metaDescription}
              />
            </div>

            {/* Author Bio */}
            {(post.authorName || post.author || post.authorBio) && (
              <div className="mt-12">
                <AuthorBio
                  author={post.author}
                  authorName={post.authorName}
                  authorAvatar={post.authorAvatar}
                  authorBio={post.authorBio}
                />
              </div>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <RelatedPosts posts={relatedPosts} currentPostId={post.id} />
            )}

            {/* Navigation Buttons */}
            <div className="mt-12 flex justify-center">
              <button
                onClick={() => navigate(routePath.posts)}
                className="px-8 py-3 bg-[#D65312] text-white rounded-lg hover:bg-[#FF8C42] transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Xem thêm bài viết khác
              </button>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Table of Contents */}
              {post.content && (
                <TableOfContents content={post.content} />
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
