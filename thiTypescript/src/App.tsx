import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { message } from 'antd';

import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import TaskComments from './pages/TaskComments';
import UserManagement from './pages/UserManagement';
import TaskManagement from './pages/TaskManagement';
import TaskDetails from './pages/TaskDetails';
import TransactionHistory from './pages/TransactionHistory';
import PerformanceReport from './pages/PerformanceReport';
import RegisterUser from './pages/RegisterUser';
import AssignTask from './pages/AssignTask';
import WalletConnect from './components/WalletConnect';
import { BlockchainProvider, useBlockchain } from './contexts/BlockchainContext';

const { Content, Header } = Layout;

// Component kiểm tra quyền truy cập dựa vào vai trò
const ProtectedRoute = ({ element, requiredRoles = [] }: { element: React.ReactNode, requiredRoles?: string[] }) => {
  const { isConnected, userRole } = useBlockchain();

  if (!isConnected) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles.length > 0 && userRole && !requiredRoles.includes(userRole)) {
    // Hiển thị thông báo trước khi chuyển về trang chủ
    message.error(`Bạn không có quyền truy cập vào trang này. Yêu cầu vai trò: ${requiredRoles.join(', ')}`);
    return <Navigate to="/" />;
  }

  return <>{element}</>;
};

// Component chứa toàn bộ layout và routes của ứng dụng
const AppContent = () => {
  const { fetchUsers, fetchTasks } = useBlockchain();

  // Lấy dữ liệu ban đầu
  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar />
        <Layout>
          <Header style={{ background: '#fff', padding: 0 }}>
            <WalletConnect />
          </Header>
          <Content style={{ padding: '20px' }}>
            <Routes>
              <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/user-management" element={<ProtectedRoute element={<UserManagement />} requiredRoles={['admin']} />} />
              <Route path="/task-management" element={<ProtectedRoute element={<TaskManagement />} />} />
              <Route path="/task-details" element={<ProtectedRoute element={<TaskDetails />} />} />
              <Route path="/task-comments" element={<ProtectedRoute element={<TaskComments />} />} />
              <Route path="/transaction-history" element={<ProtectedRoute element={<TransactionHistory />} />} />
              <Route path="/performance-report" element={<ProtectedRoute element={<PerformanceReport />} requiredRoles={['admin', 'teamLead']} />} />
              <Route path="/assign-task" element={<ProtectedRoute element={<AssignTask />} requiredRoles={['admin', 'teamLead']} />} />
              <Route path="/register" element={<ProtectedRoute element={<RegisterUser />} requiredRoles={['admin']} />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

const App = () => {
  return (
    <BlockchainProvider>
      <AppContent />
    </BlockchainProvider>
  );
};

export default App;
