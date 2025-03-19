import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  OrderedListOutlined,
  CommentOutlined,
  HistoryOutlined,
  LineChartOutlined,
  FormOutlined,
  LoginOutlined,
  UserAddOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

// Giả định có 3 vai trò: admin, teamLead, employee
type UserRole = 'admin' | 'teamLead' | 'employee' | 'guest';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const navigate = useNavigate();
  const location = useLocation();

  // Giả định: Kiểm tra vai trò người dùng từ localStorage hoặc context
  useEffect(() => {
    // Đây là phần giả định, cần được thay thế bằng logic thực tế
    const role = localStorage.getItem('userRole') as UserRole;
    setUserRole(role || 'guest');
  }, []);

  // Các menu item cho mỗi vai trò
  const adminItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Bảng Điều Khiển' },
    { key: '/user-management', icon: <UserOutlined />, label: 'Quản Lý Người Dùng' },
    { key: '/task-management', icon: <OrderedListOutlined />, label: 'Quản Lý Task' },
    { key: '/transaction-history', icon: <HistoryOutlined />, label: 'Lịch Sử Giao Dịch' },
    { key: '/register', icon: <UserAddOutlined />, label: 'Đăng Ký Người Dùng' }
  ];

  const teamLeadItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Bảng Điều Khiển' },
    { key: '/task-management', icon: <OrderedListOutlined />, label: 'Quản Lý Task' },
    { key: '/assign-task', icon: <FormOutlined />, label: 'Phân Công Task' },
    { key: '/performance-report', icon: <LineChartOutlined />, label: 'Báo Cáo Hiệu Suất' }
  ];

  const employeeItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Bảng Điều Khiển' },
    { key: '/my-tasks', icon: <OrderedListOutlined />, label: 'Task Của Tôi' },
    { key: '/task-details', icon: <FormOutlined />, label: 'Chi Tiết Task' },
    { key: '/task-comments', icon: <CommentOutlined />, label: 'Bình Luận Task' }
  ];

  const guestItems = [
    { key: '/login', icon: <LoginOutlined />, label: 'Đăng Nhập' }
  ];

  // Chọn menu items dựa trên vai trò
  const getMenuItems = () => {
    return adminItems;
    switch (userRole) {
      case 'admin':
        return adminItems;
      case 'teamLead':
        return teamLeadItems;
      case 'employee':
        return employeeItems;
      default:
        return guestItems;
    }
  };

  const onMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {!collapsed && <span style={{ color: 'white', fontWeight: 'bold' }}>Task Blockchain</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={[location.pathname]}
        items={getMenuItems()}
        onClick={onMenuClick}
      />
    </Sider>
  );
};

export default Sidebar; 