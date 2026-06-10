const productSkeletons = Array.from({ length: 8 }, (_, index) => index);
const categorySkeletons = Array.from({ length: 6 }, (_, index) => index);

function PageSkeleton() {
  return (
    <main className="amz-page-skeleton" aria-busy="true">
      <header className="amz-skeleton-header" aria-hidden="true">
        <div className="amz-skeleton-topline">
          <div className="amz-skeleton-pill amz-skeleton-w-20" />
          <div className="amz-skeleton-topline-actions">
            <div className="amz-skeleton-pill amz-skeleton-w-12" />
            <div className="amz-skeleton-pill amz-skeleton-w-16" />
            <div className="amz-skeleton-pill amz-skeleton-w-10" />
          </div>
        </div>

        <div className="amz-skeleton-nav">
          <div className="amz-skeleton-brand-mark" />
          <div className="amz-skeleton-search">
            <span className="amz-skeleton-search-dot" />
            <span className="amz-skeleton-line amz-skeleton-w-40" />
          </div>
          <div className="amz-skeleton-nav-actions">
            <span />
            <span />
            <span />
          </div>
        </div>
      </header>

      <div className="amz-skeleton-shell" aria-hidden="true">
        <section className="amz-skeleton-hero">
          <aside className="amz-skeleton-sidebar">
            {categorySkeletons.map((item) => (
              <div className="amz-skeleton-category-row" key={`category-${item}`}>
                <span className="amz-skeleton-icon" />
                <span className={`amz-skeleton-line amz-skeleton-category-line-${(item % 3) + 1}`} />
              </div>
            ))}
          </aside>

          <div className="amz-skeleton-banner">
            <span className="amz-skeleton-badge" />
            <span className="amz-skeleton-title-line" />
            <span className="amz-skeleton-title-line amz-skeleton-title-line-short" />
            <div className="amz-skeleton-banner-footer">
              <span />
              <span />
              <span />
            </div>
          </div>

          <aside className="amz-skeleton-promo-stack">
            <div className="amz-skeleton-promo" />
            <div className="amz-skeleton-promo amz-skeleton-promo-soft" />
          </aside>
        </section>

        <section className="amz-skeleton-strip">
          {categorySkeletons.map((item) => (
            <div className="amz-skeleton-mini-card" key={`strip-${item}`}>
              <span />
              <i />
            </div>
          ))}
        </section>

        <section className="amz-skeleton-products">
          <div className="amz-skeleton-section-head">
            <span className="amz-skeleton-heading" />
            <div className="amz-skeleton-tabs">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="amz-skeleton-product-grid">
            {productSkeletons.map((item) => (
              <article className="amz-skeleton-product-card" key={`product-${item}`}>
                <div className="amz-skeleton-product-media" />
                <div className="amz-skeleton-product-body">
                  <span className="amz-skeleton-line amz-skeleton-w-full" />
                  <span className="amz-skeleton-line amz-skeleton-w-70" />
                  <div className="amz-skeleton-product-meta">
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default PageSkeleton;
