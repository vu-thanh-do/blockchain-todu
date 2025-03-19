import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Select,
  Button,
  DatePicker,
  Descriptions,
  Space,
  Spin,
  Empty,
  message,
  Divider,
  Row,
  Col,
  Tag,
  Avatar,
  Result
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  SendOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import { useBlockchain } from '../contexts/BlockchainContext';
import { Task, User } from '../contexts/BlockchainContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const AssignTask: React.FC = () => {
  const { tasks, users, loading, assignTask } = useBlockchain();
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [eligibleUsers, setEligibleUsers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy taskId từ query parameter
  const taskId = new URLSearchParams(location.search).get('id');
  console.log(taskId, 'taskId');
  useEffect(() => {
    if (taskId) {
      findTask(taskId);
      findEligibleUsers();
    }
  }, [taskId, tasks, users]);

  // Tìm task từ danh sách tasks
  const findTask = (id: string) => {
    const task = tasks.find(t => t._id === id);
    if (task) {
      setCurrentTask(task);
    }
  };

  // Tìm danh sách người dùng có thể được giao task (employees)
  const findEligibleUsers = () => {
    const employees = users.filter(user =>
      user.role === 'employee' && user.status === 'active'
    );
    setEligibleUsers(employees);
  };

  // Xử lý phân công task
  const handleAssignTask = async (values: any) => {
    if (!currentTask) return;

    setSubmitting(true);
    try {
      await assignTask(currentTask._id, values.assignee);
      setSuccess(true);
      message.success('Phân công nhiệm vụ thành công!');

      // Sau 2 giây, chuyển về trang quản lý task
      setTimeout(() => {
        navigate('/task-management');
      }, 2000);
    } catch (error) {
      console.error('Lỗi phân công task:', error);
      console.error('Không thể phân công nhiệm vụ!');
    } finally {
      setSubmitting(false);
    }
  };

  // Hiển thị chi tiết task
  const renderTaskDetailsCard = () => {
    if (!currentTask) return null;

    return (
      <Card title="Thông tin nhiệm vụ" type="inner">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="ID">{currentTask._id}</Descriptions.Item>
          <Descriptions.Item label="Tiêu đề">{currentTask.title}</Descriptions.Item>
          <Descriptions.Item label="Mô tả">{currentTask.description}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={getStatusColor(currentTask.status)}>{getStatusText(currentTask.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">
            {getUsernameFromAddress(currentTask.createdBy)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{currentTask.createdAt}</Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // Chuyển đổi trạng thái thành văn bản
  const getStatusText = (status: string) => {
    switch (status) {
      case 'created': return 'Đã tạo';
      case 'assigned': return 'Đã phân công';
      case 'in_progress': return 'Đang xử lý';
      case 'completed': return 'Hoàn thành';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  // Chuyển đổi trạng thái thành màu sắc
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'default';
      case 'assigned': return 'blue';
      case 'in_progress': return 'processing';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // Lấy tên người dùng từ địa chỉ
  const getUsernameFromAddress = (address: string) => {
    if (!address) return 'Không xác định';

    const user = users.find(u => u.walletAddress === address);
    return user ? user.username : address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  if (success) {
    return (
      <Result
        status="success"
        title="Phân công nhiệm vụ thành công!"
        subTitle="Nhiệm vụ đã được phân công và thông báo đến người thực hiện."
        extra={[
          <Button type="primary" key="console" onClick={() => navigate('/task-management')}>
            Quay lại Quản lý Nhiệm vụ
          </Button>
        ]}
      />
    );
  }

  if (loading || !currentTask) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Title level={2}>
            <Space>
              <TeamOutlined />
              Phân công nhiệm vụ
            </Space>
          </Title>
          <Paragraph type="secondary">
            Chỉ định nhân viên để thực hiện nhiệm vụ này. Sau khi phân công, nhân viên sẽ được thông báo về nhiệm vụ mới.
          </Paragraph>

          <Row gutter={24}>
            <Col span={12}>
              {renderTaskDetailsCard()}
            </Col>
            <Col span={12}>
              <Card title="Chỉ định người thực hiện" type="inner">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleAssignTask}
                >
                  <Form.Item
                    name="assignee"
                    label="Chọn người thực hiện"
                    rules={[{ required: true, message: 'Vui lòng chọn người thực hiện!' }]}
                  >
                    <Select
                      placeholder="Chọn một nhân viên"
                      optionLabelProp="label"
                      disabled={submitting}
                    >
                      {eligibleUsers.map(user => (
                        <Option
                          key={user.walletAddress}
                          value={user.walletAddress}
                          label={user.username}
                        >
                          <Space>
                            <Avatar icon={<UserOutlined />} size="small" />
                            <Text>{user.username}</Text>
                            <Text type="secondary">({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})</Text>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Divider />

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={submitting}
                      >
                        Phân công
                      </Button>
                      <Button onClick={() => navigate('/task-management')}>
                        Hủy
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>
    </div>
  );
};

export default AssignTask; 