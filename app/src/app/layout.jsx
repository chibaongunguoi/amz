import 'antd/dist/reset.css';
import 'react-quill/dist/quill.snow.css';
import '../index.css';
import '../App.css';
import '../assets/css/FloatButton.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:2011';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AMZTECH - Tai nghe, loa Bluetooth chính hãng',
    template: '%s | AMZTECH',
  },
  description:
    'AMZTECH cung cấp tai nghe, loa Bluetooth, loa karaoke và thiết bị âm thanh chính hãng với nhiều lựa chọn theo tình trạng, màu sắc và mức giá.',
  applicationName: 'AMZTECH',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'AMZTECH',
    title: 'AMZTECH - Tai nghe, loa Bluetooth chính hãng',
    description:
      'Mua tai nghe, loa Bluetooth, loa karaoke và thiết bị âm thanh chính hãng tại AMZTECH.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AMZTECH - Tai nghe, loa Bluetooth chính hãng',
    description:
      'Mua tai nghe, loa Bluetooth, loa karaoke và thiết bị âm thanh chính hãng tại AMZTECH.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
