import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, Row, Col, Typography, Alert, Space, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../contexts/BlockchainContext';
import { ethers } from 'ethers';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const RegisterUser: React.FC = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { createUser, loading } = useBlockchain();

  // Validate địa chỉ ví
  const validateWalletAddress = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('Vui lòng nhập địa chỉ ví');
    }
    if (!ethers.utils.isAddress(value)) {
      return Promise.reject('Địa chỉ ví không hợp lệ');
    }
    return Promise.resolve();
  };

  // Đăng ký người dùng mới
  const onFinish = async (values: any) => {
    setError(null);
    try {
      await createUser(values.username, values.role, values.walletAddress);
      message.success('Đăng ký người dùng mới thành công!');
      form.resetFields();
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
      message.error('Đăng ký người dùng thất bại!');
    }
  };

  return (
    <Row justify="center">
      <Col xs={24} sm={20} md={16} lg={14} xl={12}>
        <Card
          title={
            <div style={{ textAlign: 'center' }}>
              <UserAddOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
              <Title level={2}>Đăng Ký Người Dùng Mới</Title>
              <Paragraph type="secondary">
                Tạo tài khoản mới với địa chỉ ví của bạn
              </Paragraph>
            </div>
          }
          style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {error && (
              <Alert
                message="Lỗi đăng ký"
                description={error}
                type="error"
                showIcon
              />
            )}

            <Form
              form={form}
              name="register_user"
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              disabled={loading}
            >
              <Form.Item
                name="username"
                label="Tên Người Dùng"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên người dùng' },
                  { min: 3, message: 'Tên người dùng phải có ít nhất 3 ký tự' }
                ]}
              >
                <Input placeholder="Nhập tên hiển thị của bạn" />
              </Form.Item>

              <Form.Item
                name="walletAddress"
                label="Địa Chỉ Ví"
                rules={[
                  { validator: validateWalletAddress }
                ]}
              >
                <Input placeholder="Nhập địa chỉ ví Ethereum của bạn (0x...)" />
              </Form.Item>

              <Form.Item
                name="role"
                label="Vai Trò"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                initialValue="employee"
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="admin">Admin</Option>
                  <Option value="teamLead">Team Lead</Option>
                  <Option value="employee">Nhân viên</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  icon={<UserAddOutlined />}
                >
                  Đăng Ký
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default RegisterUser; 