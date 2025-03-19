import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, Row, Col, Typography, Alert, Space, message, Modal, Divider, Steps } from 'antd';
import { UserAddOutlined, CopyOutlined, KeyOutlined, WalletOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../contexts/BlockchainContext';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const RegisterUser: React.FC = () => {
  const [form] = Form.useForm();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newWallet, setNewWallet] = useState<{ address: string, privateKey: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigate = useNavigate();
  const { createWallet, loading } = useBlockchain();

  // Đăng ký người dùng mới
  const onFinish = async (values: any) => {
    setError(null);

    try {
      // Gọi hàm tạo ví và đăng ký người dùng
      const wallet = await createWallet(values.username, values.role);
      
      setNewWallet(wallet);
      setSuccess(true);
      setModalVisible(true);
      form.resetFields();
      message.success('Đăng ký người dùng mới thành công!');
    } catch (err) {
      setError((err as Error).message);
      message.error('Đăng ký người dùng thất bại!');
    }
  };

  // Sao chép vào clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => message.success('Đã sao chép vào clipboard'))
      .catch(() => message.error('Không thể sao chép. Vui lòng sao chép thủ công.'));
  };

  // Đóng modal và chuyển hướng
  const handleCloseModal = () => {
    setModalVisible(false);
    navigate('/');
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
                Tạo tài khoản mới và nhận ví blockchain
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
              disabled={loading || success}
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

        {/* Modal hiển thị thông tin ví sau khi đăng ký thành công */}
        <Modal
          title={<Title level={4}>Đăng Ký Thành Công!</Title>}
          open={modalVisible}
          onCancel={handleCloseModal}
          footer={[
            <Button key="ok" type="primary" onClick={handleCloseModal}>
              Tôi đã lưu thông tin
            </Button>
          ]}
          closable={false}
          maskClosable={false}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="Lưu ý quan trọng"
              description="Hãy lưu lại Private Key của bạn! Đây là lần duy nhất bạn có thể xem nó. Private Key là chìa khóa để truy cập vào tài khoản của bạn."
              type="warning"
              showIcon
            />

            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Địa chỉ ví:</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                    <Text code style={{ flexGrow: 1, wordBreak: 'break-all' }}>{newWallet?.address}</Text>
                    <Button 
                      type="text" 
                      icon={<CopyOutlined />} 
                      onClick={() => newWallet && copyToClipboard(newWallet.address)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <Text strong>Private Key:</Text>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                    <Text code style={{ flexGrow: 1, wordBreak: 'break-all' }}>{newWallet?.privateKey}</Text>
                    <Button 
                      type="text" 
                      icon={<CopyOutlined />} 
                      onClick={() => newWallet && copyToClipboard(newWallet.privateKey)}
                    />
                  </div>
                </div>
              </Space>
            </div>

            <Divider />

            <Title level={5}>Làm thế nào để sử dụng ví này với MetaMask?</Title>
            <Steps
              size="small"
              current={-1}
              direction="vertical"
              items={[
                {
                  title: 'Cài đặt MetaMask',
                  description: 'Cài đặt tiện ích mở rộng MetaMask cho trình duyệt của bạn'
                },
                {
                  title: 'Mở Ví MetaMask',
                  description: 'Nhấp vào biểu tượng MetaMask ở góc trình duyệt'
                },
                {
                  title: 'Nhập Private Key',
                  description: 'Chọn "Nhập tài khoản" và dán Private Key ở trên'
                },
                {
                  title: 'Kết nối Mạng',
                  description: 'Thêm mạng Blockchain mà ứng dụng sử dụng (thông số có thể xem trong tài liệu)'
                }
              ]}
            />

            <Paragraph>
              <Text type="danger" strong>Lưu ý:</Text> Đây là lần duy nhất bạn thấy Private Key. Hãy tải về hoặc lưu trữ nó ở nơi an toàn.
            </Paragraph>
          </Space>
        </Modal>
      </Col>
    </Row>
  );
};

export default RegisterUser; 