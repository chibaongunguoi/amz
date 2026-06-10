import LegacyClientShell from '@/next/LegacyClientShell';
import ClientReadyMarker from '@/next/ClientReadyMarker';

const CATEGORY_META = {
  'nhet-tai-cu': {
    title: 'Tai nghe nhét tai',
    description:
      'Tai nghe nhét tai tại AMZTECH với nhiều lựa chọn theo thương hiệu, màu sắc, tình trạng và tồn kho.',
  },
  'chup-tai-cu': {
    title: 'Tai nghe chụp tai',
    description:
      'Tai nghe chụp tai tại AMZTECH, gồm các mẫu chống ồn, nghe nhạc và làm việc từ nhiều thương hiệu âm thanh.',
  },
  'di-dong-cu': {
    title: 'Loa di động',
    description:
      'Loa Bluetooth di động tại AMZTECH, dễ mang theo, nhiều mức giá và tình trạng sản phẩm.',
  },
  'de-ban-cu': {
    title: 'Loa để bàn',
    description:
      'Loa để bàn tại AMZTECH dành cho không gian nghe nhạc tại nhà, làm việc và giải trí.',
  },
  'loa-karaoke': {
    title: 'Loa karaoke',
    description:
      'Loa karaoke, micro và thiết bị giải trí âm thanh tại AMZTECH với thông tin tồn kho rõ ràng.',
  },
};

function getCategoryMeta(slug) {
  return CATEGORY_META[slug] || {
    title: 'Danh mục sản phẩm',
    description: 'Danh mục sản phẩm âm thanh tại AMZTECH.',
  };
}

export function generateMetadata({ params }) {
  const meta = getCategoryMeta(params.slug);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/product/${params.slug}` },
    openGraph: {
      type: 'website',
      url: `/product/${params.slug}`,
      title: `${meta.title} | AMZTECH`,
      description: meta.description,
    },
  };
}

export default function ProductCategoryPage({ params }) {
  const meta = getCategoryMeta(params.slug);
  return (
    <>
      <ClientReadyMarker />
      <section className="amz-seo-fallback">
        <nav className="amz-seo-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Trang chủ</a>
          <span>/</span>
          <a href="/product">Sản phẩm</a>
          <span>/</span>
          <span>{meta.title}</span>
        </nav>
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </section>
      <LegacyClientShell />
    </>
  );
}
