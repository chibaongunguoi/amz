import React, { useState } from 'react'
import { Layout, Menu } from 'antd'
import {
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import routePath from '../../constants/routePath'

const { Sider } = Layout

function SidebarAdmin() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuKeyToRoute = {
    productList: routePath.admin,
    productAdd: routePath.adminProductAdd,
    productEdit: routePath.adminProductEdit,
    productDisplayCategories: routePath.adminProductDisplayCategories,

    postList: routePath.adminPost,
    postAdd: routePath.adminPostAdd,
    postEdit: routePath.adminPostEdit,

    eventList: routePath.adminEvent,

    config: routePath.adminConfig,
  }

  const routeToMenuKey = Object.entries(menuKeyToRoute).reduce((acc, [key, path]) => {
    acc[path] = key
    return acc
  }, {})

  const currentKey = routeToMenuKey[location.pathname]

  const [openKeys, setOpenKeys] = useState(['sub1', 'sub2', 'sub3'])

  const handleMenuClick = ({ key }) => {
    const route = menuKeyToRoute[key]
    if (route) {
      navigate(route)
    }
  }

  const handleOpenChange = (keys) => {
    setOpenKeys(keys)
  }

  return (
    <Sider width={300} style={{ minHeight: '100vh', background: '#fff' }}>
      <Menu
        mode="inline"
        selectedKeys={currentKey ? [currentKey] : []}
        openKeys={openKeys}
        style={{ fontSize: 16 }}
        onClick={handleMenuClick}
        onOpenChange={handleOpenChange}
      >
        <Menu.SubMenu key="sub1" icon={<AppstoreOutlined />} title="Quản lý sản phẩm">
          <Menu.Item key="productList">Danh sách sản phẩm</Menu.Item>
          <Menu.Item key="productAdd">Thêm sản phẩm</Menu.Item>
          <Menu.Item key="productEdit">Sửa sản phẩm</Menu.Item>
          <Menu.Item key="productDisplayCategories">Danh mục để hiển thị</Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu key="sub2" icon={<FileTextOutlined />} title="Quản lý bài đăng">
          <Menu.Item key="postList">Danh sách bài đăng</Menu.Item>
          <Menu.Item key="postAdd">Thêm bài đăng</Menu.Item>
          <Menu.Item key="postEdit">Sửa bài đăng</Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu key="sub3" icon={<SettingOutlined />} title="Quản lý website">
          <Menu.Item key="eventList">Sự kiện</Menu.Item>
          <Menu.Item key="config" icon={<VideoCameraOutlined />}>Quản lý trang chủ & Video</Menu.Item>
        </Menu.SubMenu>
      </Menu>
    </Sider>
  )
}

export default SidebarAdmin