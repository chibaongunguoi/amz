import { lazy } from "react";
import routePath from "../constants/routePath";
import MainLayout from "../layouts/main-layout";
import ProductLayout from "../layouts/product-layout";
import AdminLayout from "../layouts/admin-layout";
import BasicLayout from "../layouts/basic-layout";
import EmptyLayout from "../layouts/empty-layout";
import PolicyPage from "../views/Policy";
import Admin from "../views/Admin";

const Home = lazy(() => import("@/views/Home"));
const Product = lazy(() => import("@/views/Product"));
const Search = lazy(() => import("@/views/Search"));
const ProductDetail = lazy(() => import("@/views/ProductDetail"));
const Sale = lazy(() => import("@/views/Sale"));
const SaleDetail = lazy(() => import("@/views/Sale/SaleDetail"));
const PostForm = lazy(() => import("@/views/Admin/Post/PostForm"));
const PostManagement = lazy(() => import("@/views/Admin/Post"));
const PostCategories = lazy(() => import("@/views/Admin/Post/Categories"));
const PostTags = lazy(() => import("@/views/Admin/Post/Tags"));
const PostAuthors = lazy(() => import("@/views/Admin/Post/Authors"));
const PostAnalytics = lazy(() => import("@/views/Admin/Post/Analytics"));
const AdminPolicy = lazy(() => import("@/views/Admin/Policy"));
const ProductForm = lazy(() => import("@/views/Admin/Product/ProductForm"));
const ProductDisplayCategories = lazy(() => import("@/views/Admin/Product/ProductDisplayCategories"));
const EventManagement = lazy(() => import("@/views/Admin/Event"));
const PageManagement = lazy(() => import("@/views/Admin/Page"));
const BestSellerSort = lazy(() => import("../views/Admin/BestSellerSort"));
const SKUSegmentConfig = lazy(() => import("@/views/Admin/SKUConfig"));
const UIConfigManagement = lazy(() => import("../views/Admin/UIConfig"));
const Login = lazy(() => import("../views/Login"));
const Posts = lazy(() => import("../views/Posts"));
const PostDetail = lazy(() => import("../views/Posts/PostDetail"));

const AppRoute = [
    { path: routePath.home, page: Home, layout: MainLayout },
    { path: routePath.productWithSlug, page: Product, layout: ProductLayout },
    { path: routePath.product, page: Product, layout: ProductLayout },
    { path: routePath.search, page: Search, layout: BasicLayout },
    { path: routePath.productDetailWithSlug, page: ProductDetail, layout: BasicLayout },
    { path: routePath.productDetail, page: ProductDetail, layout: BasicLayout }, // Keep for backward compatibility
    { path: routePath.login, page: Login, layout: EmptyLayout },
    { path: routePath.warranty, page: PolicyPage, layout: BasicLayout },

    { path: routePath.adminProductAdd, page: ProductForm, layout: AdminLayout, protect: true },
    { path: routePath.adminProductEdit, page: ProductForm, layout: AdminLayout, protect: true },
    { path: routePath.adminProductDisplayCategories, page: ProductDisplayCategories, layout: AdminLayout, protect: true },
    { path: routePath.admin, page: Admin, layout: AdminLayout, protect: true },

    { path: routePath.sale, page: Sale, layout: BasicLayout },
    { path: routePath.saleDetail, page: SaleDetail, layout: BasicLayout },

    { path: routePath.posts, page: Posts, layout: MainLayout },
    { path: routePath.postDetailWithSlug, page: PostDetail, layout: MainLayout },
    { path: routePath.postDetail, page: PostDetail, layout: MainLayout },

    { path: routePath.adminPost, page: PostManagement, layout: AdminLayout, protect: true },
    { path: routePath.adminPostEdit, page: PostForm, layout: AdminLayout, protect: true },
    { path: routePath.adminPostAdd, page: PostForm, layout: AdminLayout, protect: true },
    { path: routePath.adminPostCategories, page: PostCategories, layout: AdminLayout, protect: true },
    { path: routePath.adminPostTags, page: PostTags, layout: AdminLayout, protect: true },
    { path: routePath.adminPostAuthors, page: PostAuthors, layout: AdminLayout, protect: true },
    { path: routePath.adminPostAnalytics, page: PostAnalytics, layout: AdminLayout, protect: true },

    { path: routePath.adminPolicyWarranty, page: AdminPolicy, layout: AdminLayout, protect: true },
    { path: routePath.adminPolicyPrivacy, page: AdminPolicy, layout: AdminLayout, protect: true },
    { path: routePath.adminPolicyPurchase, page: AdminPolicy, layout: AdminLayout, protect: true },
    { path: routePath.adminPolicyExchange, page: AdminPolicy, layout: AdminLayout, protect: true },

    { path: routePath.policyWarranty, page: PolicyPage, layout: BasicLayout },
    { path: routePath.policyPrivacy, page: PolicyPage, layout: BasicLayout },
    { path: routePath.policyPurchase, page: PolicyPage, layout: BasicLayout },
    { path: routePath.policyExchange, page: PolicyPage, layout: BasicLayout },

    { path: routePath.adminEvent, page: EventManagement, layout: AdminLayout, protect: true },
    
    { path: routePath.adminConfig, page: PageManagement, layout: AdminLayout, protect: true },
    { path: routePath.adminUIConfig, page: UIConfigManagement, layout: AdminLayout, protect: true },
    
    { path: routePath.adminBestSellerSort, page: BestSellerSort, layout: AdminLayout, protect: true },
    { path: routePath.adminSkuSegments, page: SKUSegmentConfig, layout: AdminLayout, protect: true },
];

export default AppRoute;
