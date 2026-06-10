import LegacyClientShell from '@/next/LegacyClientShell';

export const metadata = {
  title: 'Tìm kiếm sản phẩm',
  description: 'Tìm kiếm sản phẩm âm thanh tại AMZTECH.',
  alternates: { canonical: '/search' },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchPage() {
  return <LegacyClientShell />;
}
