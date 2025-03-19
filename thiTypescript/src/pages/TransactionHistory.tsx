import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  Card, 
  Space, 
  Tag, 
  Button, 
  Input, 
  Row, 
  Col, 
  Tooltip,
  Popover,
  Spin,
  message,
  Pagination
} from 'antd';
import { 
  HistoryOutlined, 
  SearchOutlined, 
  LinkOutlined, 
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useBlockchain } from '../contexts/BlockchainContext';
import * as ApiService from '../services/ApiService';

const { Title, Text, Paragraph } = Typography;

interface Transaction {
  _id: string;
  txHash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  type: string;
  metadata?: any;
}

interface PaginationData {
  currentPage: number;
  total: number;
  totalPages: number;
}

const TransactionHistory: React.FC = () => {
  const { users } = useBlockchain();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    total: 0,
    totalPages: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = transactions.filter(tx => 
        tx.txHash.toLowerCase().includes(searchText.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchText.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchText.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [searchText, transactions]);

  const fetchTransactions = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      const result = await ApiService.getTransactionHistory(page, limit);
      
      if (result.success) {
        setTransactions(result.data);
        setPagination({
          currentPage: result.currentPage,
          total: result.total,
          totalPages: result.totalPages
        });
      } else {
        message.error(result.message || 'Không thể tải lịch sử giao dịch');
      }
    } catch (error) {
      console.error('Lỗi tải lịch sử giao dịch:', error);
      message.error('Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchTransactions(page);
  };

  const getUsernameFromAddress = (address: string) => {
    if (!address) return 'Không xác định';
    
    const user = users.find(u => u.walletAddress === address);
    return user ? user.username : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'create_user':
        return 'Tạo người dùng';
      case 'create_task':
        return 'Tạo task';
      case 'assign_task':
        return 'Gán task';
      case 'update_task':
        return 'Cập nhật task';
      case 'comment':
        return 'Bình luận';
      case 'metamask_login':
        return 'Đăng nhập MetaMask';
      case 'metamask_connect':
        return 'Kết nối MetaMask';
      default:
        return 'Giao dịch khác';
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Thành công
          </Tag>
        );
      case 'pending':
        return (
          <Tag icon={<ClockCircleOutlined />} color="processing">
            Đang xử lý
          </Tag>
        );
      case 'failed':
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Thất bại
          </Tag>
        );
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const handleVerifyOnBlockchain = async (txHash: string) => {
    try {
      const result = await ApiService.verifyTransactionOnBlockchain(txHash);
      if (result.success) {
        message.success('Giao dịch đã được xác minh thành công');
      } else {
        message.error(result.message || 'Không thể xác minh giao dịch');
      }
    } catch (error) {
      console.error('Lỗi xác minh giao dịch:', error);
      message.error('Không thể xác minh giao dịch');
    }
  };

  const columns = [
    {
      title: 'Hash',
      dataIndex: 'txHash',
      key: 'txHash',
      ellipsis: true,
      render: (hash: string) => (
        <Tooltip title={hash}>
          <Space>
            <Text copyable={{ text: hash }}>{hash.substring(0, 10)}...</Text>
            <a href={`https://explorer.solana.com/tx/${hash}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
              <LinkOutlined />
            </a>
            <Button
              type="link"
              size="small"
              onClick={() => handleVerifyOnBlockchain(hash)}
              style={{ padding: 0 }}
            >
              Xác minh
            </Button>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Khối',
      dataIndex: 'blockNumber',
      key: 'blockNumber',
      render: (blockNumber: number) => blockNumber || 'N/A',
    },
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => moment(timestamp).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Từ',
      dataIndex: 'from',
      key: 'from',
      ellipsis: true,
      render: (address: string) => (
        <Tooltip title={address}>
          <Space>
            <UserOutlined />
            {getUsernameFromAddress(address)}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Đến',
      dataIndex: 'to',
      key: 'to',
      ellipsis: true,
      render: (address: string) => (
        <Tooltip title={address}>
          <Space>
            <UserOutlined />
            {getUsernameFromAddress(address)}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => formatTransactionType(type),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Chi tiết',
      key: 'details',
      render: (text: string, record: Transaction) => {
        if (record.metadata) {
          let details = '';
          switch (record.type) {
            case 'metamask_login':
              details = `Đăng nhập: ${record.metadata.username}`;
              break;
            case 'metamask_connect':
              details = `Kết nối ví: ${record.metadata.walletAddress}`;
              break;
            case 'create_task':
            case 'update_task':
              if (record.metadata.taskId) {
                details = `Xem task: ${record.metadata.taskId}`;
              }
              break;
          }
          return details ? (
            <Tooltip title={details}>
              <InfoCircleOutlined />
            </Tooltip>
          ) : null;
        }
        return null;
      },
    },
  ];

  return (
    <div>
      <Title level={2}>Lịch sử giao dịch</Title>
      <Paragraph>Xem lịch sử giao dịch của hệ thống trên blockchain</Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Tìm kiếm theo hash, địa chỉ hoặc loại giao dịch"
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredTransactions}
        loading={loading}
        rowKey="_id"
        pagination={false}
      />
      
      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <Pagination
          current={pagination.currentPage}
          total={pagination.total}
          onChange={handlePageChange}
          showSizeChanger={false}
          showTotal={(total) => `Tổng cộng ${total} giao dịch`}
        />
      </div>
    </div>
  );
};

export default TransactionHistory;