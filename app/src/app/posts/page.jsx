import LegacyClientShell from '@/next/LegacyClientShell';
import ClientReadyMarker from '@/next/ClientReadyMarker';
import { listPosts } from '@/server/posts/postRepository';
import { createPostSlug, getPostDescription } from '@/utils/post.utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Bài viết âm thanh',
  description:
    'Tin tức, kinh nghiệm chọn mua tai nghe, loa Bluetooth, loa karaoke và thiết bị âm thanh từ AMZTECH.',
  alternates: { canonical: '/posts' },
  openGraph: {
    type: 'website',
    url: '/posts',
    title: 'Bài viết âm thanh | AMZTECH',
    description:
      'Cập nhật kiến thức và kinh nghiệm chọn mua thiết bị âm thanh từ AMZTECH.',
  },
};

export default async function PostsPage() {
  const posts = await listPosts();
  const visiblePosts = posts.slice(0, 8);

  return (
    <>
      <ClientReadyMarker />
      <section className="amz-seo-fallback">
        <nav className="amz-seo-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Trang chủ</a>
          <span>/</span>
          <span>Bài viết</span>
        </nav>
        <h1>Bài viết âm thanh AMZTECH</h1>
        <p>
          Tin tức, hướng dẫn và kinh nghiệm chọn mua tai nghe, loa Bluetooth, loa karaoke và thiết bị
          âm thanh.
        </p>
        <ul>
          {visiblePosts.map((post) => {
            const slug = createPostSlug(post);
            return (
              <li key={post.id}>
                <a href={`/post-detail/${slug}`}>{post.title}</a>
                <p>{getPostDescription(post, 120)}</p>
              </li>
            );
          })}
        </ul>
      </section>
      <LegacyClientShell />
    </>
  );
}
