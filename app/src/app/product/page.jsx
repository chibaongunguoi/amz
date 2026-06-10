import LegacyClientShell from '@/next/LegacyClientShell';
import ClientReadyMarker from '@/next/ClientReadyMarker';

export const metadata = {
  title: 'Sản phẩm âm thanh',
  description:
    'Danh sách tai nghe, loa Bluetooth, loa karaoke và thiết bị âm thanh tại AMZTECH, có nhiều lựa chọn theo thương hiệu, tình trạng, màu sắc và mức giá.',
  alternates: { canonical: '/product' },
  openGraph: {
    type: 'website',
    url: '/product',
    title: 'Sản phẩm âm thanh | AMZTECH',
    description:
      'Khám phá sản phẩm âm thanh tại AMZTECH: tai nghe, loa Bluetooth, loa karaoke và phụ kiện chính hãng.',
  },
};

export default function ProductPage() {
  return (
    <>
      <ClientReadyMarker />
      <section className="amz-seo-fallback">
        <nav className="amz-seo-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Trang chủ</a>
          <span>/</span>
          <span>Sản phẩm</span>
        </nav>
        <h1>Sản phẩm âm thanh AMZTECH</h1>
        <p>
          Mua tai nghe, loa Bluetooth, loa karaoke và thiết bị âm thanh với thông tin biến thể,
          tình trạng, tồn kho và mức giá được cập nhật theo từng sản phẩm.
        </p>
        <ul>
          <li><a href="/product/nhet-tai-cu">Tai nghe nhét tai</a></li>
          <li><a href="/product/chup-tai-cu">Tai nghe chụp tai</a></li>
          <li><a href="/product/di-dong-cu">Loa di động</a></li>
          <li><a href="/product/de-ban-cu">Loa để bàn</a></li>
          <li><a href="/product/loa-karaoke">Loa karaoke</a></li>
        </ul>
      </section>
      <LegacyClientShell />
    </>
  );
}
