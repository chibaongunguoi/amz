import React, { useState, useEffect } from 'react';
import {
  FileTextOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SortAscendingOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  TagsOutlined,
  FolderOutlined,
  UserOutlined,
  BarChartOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  FileAddOutlined,
  DownOutlined,
  RightOutlined,
  BarcodeOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { listenToAuthChanges, logout } from '../store/slices/authSlice';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AMZLogo from '../assets/amzLogo.jpg';
import routePath from '../constants/routePath';
import { setCategory } from '@/store/slices/filtersSlice';
import OptimizedImage from '@/components/common/OptimizedImage';

function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    products: true,
    blog: true,
    website: true,
    policies: false,
  });
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const authLoading = useSelector(state => state.auth.loading);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    dispatch(listenToAuthChanges());
  }, [dispatch]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(routePath.login, { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) return null;

  const toggleGroup = (group) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const menuGroups = [
    {
      id: 'dashboard',
      items: [
        { path: routePath.adminConfig, icon: HomeOutlined, label: 'Trang chủ' },
      ]
    },
    {
      id: 'products',
      title: 'Quản lý sản phẩm',
      icon: UnorderedListOutlined,
      items: [
        { path: routePath.admin, icon: UnorderedListOutlined, label: 'Danh sách sản phẩm' },
        { path: routePath.adminProductAdd, icon: PlusOutlined, label: 'Thêm sản phẩm' },
        { path: routePath.adminProductDisplayCategories, icon: AppstoreOutlined, label: 'Danh mục để hiển thị' },
        { path: routePath.adminBestSellerSort, icon: SortAscendingOutlined, label: 'Sắp xếp bán chạy' },
        { path: routePath.adminSkuSegments, icon: BarcodeOutlined, label: 'Mã đoạn SKU' },
      ]
    },
    {
      id: 'blog',
      title: 'Quản lý Blog',
      icon: FileTextOutlined,
      items: [
        { path: routePath.adminPost, icon: FileTextOutlined, label: 'Danh sách bài viết' },
        { path: routePath.adminPostAdd, icon: FileAddOutlined, label: 'Thêm bài viết' },
        { path: routePath.adminPostCategories, icon: FolderOutlined, label: 'Danh mục bài viết' },
        { path: routePath.adminPostTags, icon: TagsOutlined, label: 'Thẻ tag' },
        { path: routePath.adminPostAuthors, icon: UserOutlined, label: 'Tác giả' },
        { path: routePath.adminPostAnalytics, icon: BarChartOutlined, label: 'Thống kê bài viết' },
      ]
    },
    {
      id: 'website',
      title: 'Quản lý website',
      icon: GlobalOutlined,
      items: [
        { path: routePath.adminUIConfig, icon: SettingOutlined, label: 'Tùy chỉnh giao diện' },
        { path: routePath.adminEvent, icon: CalendarOutlined, label: 'Quản lý sự kiện' },
      ]
    },
    {
      id: 'policies',
      title: 'Chính sách',
      icon: SafetyCertificateOutlined,
      items: [
        { path: routePath.adminPolicyPurchase, icon: ShoppingCartOutlined, label: 'Chính sách mua hàng', category: 'Chính sách mua hàng' },
        { path: routePath.adminPolicyWarranty, icon: ToolOutlined, label: 'Chính sách bảo hành', category: 'Chính sách bảo hành' },
        { path: routePath.adminPolicyPrivacy, icon: SafetyCertificateOutlined, label: 'Chính sách bảo mật', category: 'Chính sách bảo mật' },
        { path: routePath.adminPolicyExchange, icon: SwapOutlined, label: 'Thu cũ đổi mới', category: 'Thu cũ đổi mới' },
      ]
    },
  ];

  return (
    <div className="amz-admin-shell flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`amz-admin-sidebar ${collapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 bottom-0 z-50`}>
        {/* Logo */}
        <div className="amz-admin-logo-area h-16 flex items-center justify-center border-b border-gray-200">
          <OptimizedImage
            src={AMZLogo}
            alt="Logo"
            width={40}
            height={40}
            sizes="40px"
            onClick={() => navigate(routePath.admin)}
            className={`amz-admin-logo ${collapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-full cursor-pointer object-cover`}
          />
        </div>

        {/* Menu */}
        <nav className="amz-admin-nav flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            {menuGroups.map((group) => {
              // Single item (dashboard)
              if (!group.title) {
                return group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => item.category && dispatch(setCategory(item.category))}
                      title={collapsed ? item.label : ''}
                      className={`flex items-center px-3 py-2 text-sm rounded transition-colors ${
                        isActive
                          ? 'bg-[#D65312] text-white font-medium shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">{item.label}</span>}
                    </Link>
                  );
                });
              }

              // Group with submenu
              const GroupIcon = group.icon;
              const isGroupOpen = openGroups[group.id];
              const hasActiveChild = group.items.some(item => location.pathname === item.path);

              return (
                <div key={group.id} className="mb-1">
                  <button
                    onClick={() => !collapsed && toggleGroup(group.id)}
                    title={collapsed ? group.title : ''}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded transition-colors ${
                      hasActiveChild
                        ? 'bg-[#D65312]/10 text-[#D65312] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <GroupIcon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="ml-3">{group.title}</span>}
                    </div>
                    {!collapsed && (
                      isGroupOpen ? (
                        <DownOutlined className="w-3 h-3 text-gray-400 transition-transform" />
                      ) : (
                        <RightOutlined className="w-3 h-3 text-gray-400 transition-transform" />
                      )
                    )}
                  </button>
                  
                  {!collapsed && isGroupOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3 animate-in slide-in-from-top-2 duration-200">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => item.category && dispatch(setCategory(item.category))}
                            className={`flex items-center px-3 py-2 text-sm rounded transition-colors ${
                              isActive
                                ? 'bg-[#D65312] text-white font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="ml-3">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Collapse button */}
        <div className="amz-admin-collapse border-t border-gray-200 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded"
          >
            {collapsed ? <MenuUnfoldOutlined className="w-5 h-5" /> : <MenuFoldOutlined className="w-5 h-5" />}
            {!collapsed && <span className="ml-3 text-sm">Thu gọn</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`amz-admin-main flex-1 flex flex-col ${collapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <header className="amz-admin-topbar h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">Quản trị</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded"
            >
              <LogoutOutlined />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="amz-admin-content flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
