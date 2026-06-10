import { redirect } from 'next/navigation';
import LegacyClientShell from '@/next/LegacyClientShell';
import { getPostBySlugOrId } from '@/server/posts/postRepository';
import { createPostSlug } from '@/utils/post.utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Bài viết | AMZTECH',
  alternates: { canonical: '/posts' },
};

export default async function LegacyPostDetailPage({ searchParams }) {
  const id = Array.isArray(searchParams?.id) ? searchParams.id[0] : searchParams?.id;
  if (id) {
    const post = await getPostBySlugOrId(id);
    const slug = createPostSlug(post);
    if (slug) redirect(`/post-detail/${slug}`);
  }

  return <LegacyClientShell />;
}
