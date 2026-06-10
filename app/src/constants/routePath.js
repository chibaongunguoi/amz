const routePath = {
    // ======= User Pages =======
    home: "/",
    product: "/product",
    search: "/search",
    productWithSlug: "/product/:slug",
    productDetail: "/product-detail",
    productDetailWithSlug: "/product-detail/:slug",
    exchange: "/exchange",
    login: "/login",
    warranty: "/warranty",
    
    // ======= Admin Product Pages =======
    admin: "/admin",
    adminProduct: "/admin/products",
    adminProductAdd: "/admin/products/add",
    adminProductEdit: "/admin/products/edit",
    adminProductDisplayCategories: "/admin/products/display-categories",

    // ======= Admin Sale Pages =======
    sale: "/sale",
    saleDetail: "/sale/detail",


    // ======= Admin Post Pages =======
    adminPost: "/admin/posts",
    adminPostAdd: "/admin/posts/add",
    adminPostEdit: "/admin/posts/edit",
    adminPostCategories: "/admin/posts/categories",
    adminPostTags: "/admin/posts/tags",
    adminPostAuthors: "/admin/posts/authors",
    adminPostAnalytics: "/admin/posts/analytics",

    // ======= Admin Policy Pages =======
    adminPolicyWarranty: "/admin/policy/warranty",
    adminPolicyPrivacy: "/admin/policy/privacy",
    adminPolicyPurchase: "/admin/policy/purchase",
    adminPolicyExchange: "/admin/policy/exchange",

    // ======= Policy Pages =======
    policyWarranty: "/policy/warranty",
    policyPrivacy: "/policy/privacy",
    policyPurchase: "/policy/purchase",
    policyExchange: "/policy/exchange",

    // ======= Posts Pages =======
    posts: "/posts",
    postDetail: "/post-detail",
    postDetailWithSlug: "/post-detail/:slug",

    // ======= Admin Event Pages =======
    adminEvent: "/events",
    adminEventAdd: "/admin/events/add",
    adminEventEdit: "/admin/events/edit",

    // ======= Admin Config Pages =======
    adminConfig: "/admin/config",
    adminUIConfig: "/admin/ui-config",
    
    // ======= Admin Best Seller Sort Pages =======
    adminBestSellerSort: "/admin/best-seller-sort",

    /** Mã đoạn SKU (danh mục / thương hiệu / màu / tình trạng) */
    adminSkuSegments: "/admin/sku-segments",
};

export default routePath;
