import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Alert, Row, Col, Divider, Space, Form, Input } from 'antd';
import { WalletOutlined, LinkOutlined, ExclamationCircleOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../contexts/BlockchainContext';

const { Title, Paragraph, Text } = Typography;

const Login: React.FC = () => {
  const { connectWallet, isConnected, walletAddress, loading } = useBlockchain();
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected && walletAddress) {
      navigate('/');
    }
  }, [isConnected, walletAddress, navigate]);

  // Xử lý đăng nhập bằng private key
  const handleLogin = async (values: { privateKey: string }) => {
    setError(null);
    try {
      await connectWallet(values.privateKey);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Chuyển đến trang đăng ký
  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '80vh' }}>
      <Col xs={22} sm={18} md={12} lg={10} xl={8}>
        <Card
          title={<Title level={2} style={{ textAlign: 'center' }}>Đăng Nhập</Title>}
          bordered={false}
          style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <WalletOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <Paragraph style={{ marginTop: 16 }}>
                Đăng nhập bằng private key để vào hệ thống quản lý công việc blockchain.
              </Paragraph>
            </div>

            {error && (
              <Alert
                message="Lỗi đăng nhập"
                description={error}
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleLogin}
            >
              <Form.Item
                name="privateKey"
                label="Private Key"
                rules={[
                  { required: true, message: 'Vui lòng nhập private key!' },
                  { min: 64, message: 'Private key không hợp lệ!' }
                ]}
              >
                <Input.Password 
                  prefix={<KeyOutlined />} 
                  placeholder="Nhập private key của ví blockchain" 
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LinkOutlined />}
                  size="large"
                  block
                  loading={loading}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </Form.Item>
            </Form>

            <Divider>hoặc</Divider>

            <Button 
              type="default" 
              block 
              onClick={goToRegister}
            >
              Đăng ký tài khoản mới
            </Button>

            <Paragraph style={{ textAlign: 'center', fontSize: 12, marginTop: 16 }}>
              <Text type="secondary">
                Bằng việc đăng nhập, bạn đồng ý với các điều khoản sử dụng và chính sách bảo mật của chúng tôi.
              </Text>
            </Paragraph>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default Login; 