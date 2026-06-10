import LegacyClientShell from '@/next/LegacyClientShell';
import ClientReadyMarker from '@/next/ClientReadyMarker';

export const metadata = {
  title: 'Khuyến mãi',
  description:
    'Các chương trình khuyến mãi và ưu đãi thiết bị âm thanh tại AMZTECH.',
  alternates: { canonical: '/sale' },
};

export default function SalePage() {
  return (
    <>
      <ClientReadyMarker />
      <section className="amz-seo-fallback">
        <nav className="amz-seo-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Trang chủ</a>
          <span>/</span>
          <span>Khuyến mãi</span>
        </nav>
        <h1>Khuyến mãi AMZTECH</h1>
        <p>Cập nhật ưu đãi tai nghe, loa Bluetooth, loa karaoke và thiết bị âm thanh.</p>
      </section>
      <LegacyClientShell />
    </>
  );
}
