import LegacyClientShell from '@/next/LegacyClientShell';

export const metadata = {
  title: 'Đăng nhập quản trị',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <LegacyClientShell />;
}
