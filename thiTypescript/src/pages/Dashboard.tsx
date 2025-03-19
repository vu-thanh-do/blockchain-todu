import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, List, Tag, Divider, Button, Spin } from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../contexts/BlockchainContext';
import * as ApiService from '../services/ApiService';

const { Title, Paragraph } = Typography;

interface Activity {
  id: string;
  action: string;
  user: string;
  time: string;
  taskId?: string;
}

const Dashboard: React.FC = () => {
  const { isConnected, tasks, users, userRole, loading } = useBlockchain();
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [inProgressTasks, setInProgressTasks] = useState<number>(0);
  const [pendingTasks, setPendingTasks] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [loadingWallet, setLoadingWallet] = useState<boolean>(false);
  const navigate = useNavigate();

  // Lấy số dư ví
  const fetchWalletBalance = async () => {
    try {
      setLoadingWallet(true);
      const result = await ApiService.getWalletBalance();
      if (result && result.success) {
        setWalletBalance(result.data.balance);
      } else {
        // Xử lý khi API trả về success: false
        console.warn('Failed to fetch wallet balance, using default value');
        setWalletBalance('0');
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      // Nếu lỗi kết nối API, vẫn hiển thị số dư mặc định
      setWalletBalance('0');
    } finally {
      setLoadingWallet(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      // Thử lấy số dư ví nhưng không làm gián đoạn trải nghiệm người dùng 
      // nếu API bị lỗi
      fetchWalletBalance().catch(() => {
        console.warn('Wallet balance fetch failed silently');
      });
    }
  }, [isConnected]);

  useEffect(() => {
    if (tasks.length > 0) {
      // Tính toán tổng số task theo trạng thái
      setTotalTasks(tasks.length);
      setCompletedTasks(tasks.filter(task => task.status === 'completed').length);
      setInProgressTasks(tasks.filter(task => task.status === 'in_progress').length);
      setPendingTasks(tasks.filter(task => 
        task.status === 'created' || task.status === 'assigned').length);
    }

    if (users.length > 0) {
      setTotalUsers(users.length);
    }

    // Giả định: Lấy dữ liệu từ API/Blockchain cho hoạt động gần đây
    // Đây là dữ liệu mẫu
    setRecentActivities([
      { id: '1', action: 'hoàn thành task', user: 'Bob', time: '2 giờ trước', taskId: '3' },
      { id: '2', action: 'gán task', user: 'Admin', time: '3 giờ trước', taskId: '4' },
      { id: '3', action: 'tạo task mới', user: 'Admin', time: '5 giờ trước', taskId: '5' },
      { id: '4', action: 'bắt đầu làm việc', user: 'Alice', time: '1 ngày trước', taskId: '2' },
      { id: '5', action: 'đăng ký người dùng mới', user: 'Admin', time: '2 ngày trước' }
    ]);

  }, [tasks, users]);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'created':
        return <Tag icon={<ClockCircleOutlined />} color="default">Đã tạo</Tag>;
      case 'assigned':
        return <Tag icon={<ClockCircleOutlined />} color="orange">Đã giao</Tag>;
      case 'in_progress':
        return <Tag icon={<SyncOutlined spin />} color="processing">Đang xử lý</Tag>;
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Hoàn thành</Tag>;
      case 'rejected':
        return <Tag icon={<ExclamationCircleOutlined />} color="error">Từ chối</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const renderAdminDashboard = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số Task"
              value={totalTasks}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={completedTasks}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang xử lý"
              value={inProgressTasks}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SyncOutlined spin />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số người dùng"
              value={totalUsers}
              valueStyle={{ color: '#722ed1' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Số dư ví</Divider>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Số dư"
              value={loadingWallet ? "Đang tải..." : walletBalance}
              precision={4}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowUpOutlined />}
              suffix="SOL"
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Task gần đây</Divider>
      <List
        bordered
        dataSource={tasks.slice(0, 5)}
        renderItem={item => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => navigate(`/task-details?id=${item._id}`)}>
                Xem chi tiết
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.title}
              description={item.assignee ? `Giao cho: ${item.assignee}` : 'Chưa giao'}
            />
            {getStatusTag(item.status)}
          </List.Item>
        )}
      />
    </>
  );

  const renderTeamLeadDashboard = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số Task"
              value={totalTasks}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={completedTasks}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang xử lý"
              value={inProgressTasks}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SyncOutlined spin />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Số dư ví"
              value={loadingWallet ? "Đang tải..." : walletBalance}
              precision={4}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowUpOutlined />}
              suffix="SOL"
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Task gần đây</Divider>
      <List
        bordered
        dataSource={tasks.slice(0, 5)}
        renderItem={item => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => navigate(`/task-details?id=${item._id}`)}>
                Xem chi tiết
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.title}
              description={item.assignee ? `Giao cho: ${item.assignee}` : 'Chưa giao'}
            />
            {getStatusTag(item.status)}
          </List.Item>
        )}
      />
    </>
  );

  const renderEmployeeDashboard = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Tasks được giao"
              value={tasks.filter(task => task.assignee === localStorage.getItem('walletAddress')).length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Đã hoàn thành"
              value={tasks.filter(task => 
                task.assignee === localStorage.getItem('walletAddress') && 
                task.status === 'completed'
              ).length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Số dư ví"
              value={loadingWallet ? "Đang tải..." : walletBalance}
              precision={4}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowUpOutlined />}
              suffix="SOL"
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Task của tôi</Divider>
      <List
        bordered
        dataSource={tasks.filter(task => task.assignee === localStorage.getItem('walletAddress'))}
        renderItem={item => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => navigate(`/task-details?id=${item._id}`)}>
                Xem chi tiết
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.title}
            />
            {getStatusTag(item.status)}
          </List.Item>
        )}
      />
    </>
  );

  const renderDashboard = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    }

    if (!isConnected) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Title level={3}>Chưa kết nối ví</Title>
          <Paragraph>Vui lòng đăng nhập hoặc đăng ký để sử dụng ứng dụng</Paragraph>
          <Button type="primary" onClick={() => navigate('/login')}>Đăng nhập</Button>
        </div>
      );
    }

    switch (userRole) {
      case 'admin':
        return renderAdminDashboard();
      case 'teamLead':
        return renderTeamLeadDashboard();
      case 'employee':
        return renderEmployeeDashboard();
      default:
        return (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Title level={3}>Vai trò không hợp lệ</Title>
            <Paragraph>Vai trò của bạn không được xác định. Vui lòng liên hệ quản trị viên.</Paragraph>
          </div>
        );
    }
  };

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Paragraph>
        Chào mừng đến với ứng dụng quản lý công việc trên Blockchain. Dưới đây là tổng quan về các tasks và hoạt động của bạn.
      </Paragraph>
      {renderDashboard()}
    </div>
  );
};

export default Dashboard; 