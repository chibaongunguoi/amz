import LegacyClientShell from '@/next/LegacyClientShell';

export const metadata = {
  title: 'Quản trị AMZTECH',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <LegacyClientShell />;
}
