'use client';

import dynamic from 'next/dynamic';
import PageSkeleton from '@/components/common/PageSkeleton';

const LegacyAppShell = dynamic(() => import('@/next/LegacyAppShell'), {
  ssr: false,
  loading: () => <PageSkeleton />,
});

export default function LegacyCatchAllPage() {
  return <LegacyAppShell />;
}
