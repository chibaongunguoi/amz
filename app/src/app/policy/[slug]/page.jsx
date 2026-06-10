import LegacyClientShell from '@/next/LegacyClientShell';
import ClientReadyMarker from '@/next/ClientReadyMarker';

const POLICY_META = {
  warranty: {
    title: 'Chính sách bảo hành',
    description: 'Thông tin chính sách bảo hành sản phẩm tại AMZTECH.',
  },
  privacy: {
    title: 'Chính sách bảo mật',
    description: 'Thông tin bảo mật dữ liệu và quyền riêng tư khi sử dụng website AMZTECH.',
  },
  purchase: {
    title: 'Chính sách mua hàng',
    description: 'Hướng dẫn mua hàng, thanh toán và nhận sản phẩm tại AMZTECH.',
  },
  exchange: {
    title: 'Chính sách đổi trả',
    description: 'Quy định đổi trả sản phẩm và hỗ trợ sau bán hàng tại AMZTECH.',
  },
};

function getPolicyMeta(slug) {
  return POLICY_META[slug] || {
    title: 'Chính sách AMZTECH',
    description: 'Thông tin chính sách dịch vụ tại AMZTECH.',
  };
}

export function generateMetadata({ params }) {
  const meta = getPolicyMeta(params.slug);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/policy/${params.slug}` },
  };
}

export default function PolicyPage({ params }) {
  const meta = getPolicyMeta(params.slug);
  return (
    <>
      <ClientReadyMarker />
      <section className="amz-seo-fallback">
        <nav className="amz-seo-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Trang chủ</a>
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
