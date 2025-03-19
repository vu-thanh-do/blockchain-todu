import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Descriptions, 
  Tag, 
  Space, 
  Button, 
  Divider, 
  Timeline, 
  Empty, 
  Spin,
  Progress,
  Badge,
  Avatar,
  message,
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
  InputNumber
} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircleOutlined, 
  SyncOutlined, 
  ClockCircleOutlined, 
  UserOutlined,
  CommentOutlined,
  HistoryOutlined,
  EditOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useBlockchain } from '../contexts/BlockchainContext';
import * as ApiService from '../services/ApiService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
  createdBy: string;
  creatorName?: string;
  assignee?: string;
  assigneeName?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  priority: 'low' | 'medium' | 'high';
  ipfsHash?: string;
}

interface StatusHistory {
  id: string;
  status: string;
  timestamp: string;
  user: string;
  comment?: string;
}

const TaskDetails: React.FC = () => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { walletAddress, userRole, updateTaskStatus } = useBlockchain();

  // Lấy taskId từ query parameter
  const taskId = new URLSearchParams(location.search).get('id');

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails(taskId);
      fetchStatusHistory(taskId);
    } else {
      message.error('Task ID không hợp lệ');
      navigate('/task-management');
    }
  }, [taskId]);

  const fetchTaskDetails = async (id: string) => {
    setLoading(true);
    try {
      const result = await ApiService.getTaskById(id);
      
      if (result.success) {
        setTask(result.data);
      } else {
        message.error(result.message || 'Không thể tải thông tin task');
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết task:', error);
      message.error('Lỗi khi tải chi tiết task');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async (id: string) => {
    try {
      // Fetch status history from API
      const result = await ApiService.getTaskStatusHistory(id);
      
      if (result.success) {
        setStatusHistory(result.data);
      } else {
        // Nếu API chưa hỗ trợ, dùng dữ liệu mẫu
        const mockHistory: StatusHistory[] = [
          {
            id: '1',
            status: 'created',
            timestamp: task?.createdAt || new Date().toLocaleString(),
            user: task?.creatorName || 'Admin',
            comment: 'Task được tạo'
          }
        ];
        
        if (task?.status !== 'created') {
          mockHistory.push({
            id: '2',
            status: 'assigned',
            timestamp: task?.updatedAt || new Date().toLocaleString(),
            user: 'Admin',
            comment: `Task được gán cho ${task?.assigneeName || 'người dùng'}`
          });
        }
        
        if (task?.status === 'in_progress' || task?.status === 'completed') {
          mockHistory.push({
            id: '3',
            status: 'in_progress',
            timestamp: task?.updatedAt || new Date().toLocaleString(),
            user: task?.assigneeName || 'Người dùng',
            comment: 'Bắt đầu làm việc trên task'
          });
        }
        
        if (task?.status === 'completed') {
          mockHistory.push({
            id: '4',
            status: 'completed',
            timestamp: task?.updatedAt || new Date().toLocaleString(),
            user: task?.assigneeName || 'Người dùng',
            comment: 'Task hoàn thành'
          });
        }
        
        setStatusHistory(mockHistory);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử trạng thái:', error);
      message.error('Lỗi khi tải lịch sử trạng thái');
    }
  };

  const handleUpdateProgress = async (values: any) => {
    if (!task) return;

    try {
      const result = await ApiService.updateTaskStatus(task.id, values.status);
      
      if (result.success) {
        setTask(result.data);

        // Thêm vào lịch sử trạng thái
        const newHistoryItem: StatusHistory = {
          id: (statusHistory.length + 1).toString(),
          status: values.status,
          timestamp: new Date().toLocaleString(),
          user: localStorage.getItem('username') || walletAddress || 'Người dùng',
          comment: `Cập nhật tiến độ: ${values.progress}% - ${values.comment}`
        };
        setStatusHistory([...statusHistory, newHistoryItem]);

        message.success('Cập nhật tiến độ thành công');
        setUpdateModalVisible(false);
        form.resetFields();
        
        // Refresh data
        fetchTaskDetails(task.id);
        fetchStatusHistory(task.id);
      } else {
        throw new Error(result.message || 'Cập nhật không thành công');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật tiến độ:', error);
      message.error('Lỗi khi cập nhật tiến độ: ' + (error as Error).message);
    }
  };

  const handleCompleteTask = async (values: any) => {
    if (!task) return;

    try {
      const result = await ApiService.updateTaskStatus(task.id, 'completed');
      
      if (result.success) {
        setTask(result.data);

        // Thêm vào lịch sử trạng thái
        const newHistoryItem: StatusHistory = {
          id: (statusHistory.length + 1).toString(),
          status: 'completed',
          timestamp: new Date().toLocaleString(),
          user: localStorage.getItem('username') || walletAddress || 'Người dùng',
          comment: `Task hoàn thành - ${values.result}`
        };
        setStatusHistory([...statusHistory, newHistoryItem]);

        message.success('Đánh dấu task hoàn thành');
        setCompleteModalVisible(false);
        completeForm.resetFields();
        
        // Refresh data
        fetchTaskDetails(task.id);
        fetchStatusHistory(task.id);
      } else {
        throw new Error(result.message || 'Cập nhật không thành công');
      }
    } catch (error) {
      console.error('Lỗi khi hoàn thành task:', error);
      message.error('Lỗi khi hoàn thành task: ' + (error as Error).message);
    }
  };

  const handleAcceptTask = async () => {
    if (!task) return;
    
    try {
      const result = await ApiService.updateTaskStatus(task.id, 'in_progress');
      
      if (result.success) {
        message.success('Đã nhận task thành công');
        
        // Refresh data
        fetchTaskDetails(task.id);
        fetchStatusHistory(task.id);
      } else {
        throw new Error(result.message || 'Nhận task không thành công');
      }
    } catch (error) {
      console.error('Lỗi khi nhận task:', error);
      message.error('Lỗi khi nhận task: ' + (error as Error).message);
    }
  };

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
        return <Tag>{status}</Tag>;
    }
  };

  const getPriorityTag = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Tag color="green">Thấp</Tag>;
      case 'medium':
        return <Tag color="blue">Trung bình</Tag>;
      case 'high':
        return <Tag color="red">Cao</Tag>;
      default:
        return <Tag>{priority}</Tag>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 30) return 'normal';
    return 'exception';
  };

  const canEditTask = () => {
    if (!task || !walletAddress) return false;
    
    // Admin và TeamLead luôn có thể chỉnh sửa
    if (userRole === 'admin' || userRole === 'teamLead') return true;
    
    // Employee chỉ có thể chỉnh sửa task đã được gán cho mình
    return task.assignee === walletAddress && task.status !== 'completed';
  };

  const canTakeTask = () => {
    if (!task || !walletAddress || !userRole) return false;
    
    // Chỉ employee hoặc teamLead mới có thể nhận task
    const validRole = userRole === 'employee' || userRole === 'teamLead';
    
    // Task phải ở trạng thái created hoặc assigned
    const validStatus = task.status === 'created' || task.status === 'assigned';
    
    // Task chưa được gán cho ai hoặc đã gán cho người dùng hiện tại
    const notAssigned = !task.assignee || task.assignee === walletAddress;
    
    return validRole && validStatus && notAssigned;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!task) {
    return (
      <Empty description="Không tìm thấy thông tin task" />
    );
  }

  return (
    <div className="task-details-container">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Title level={2}>{task.title}</Title>
              <Space>
                {getStatusTag(task.status)}
                {getPriorityTag(task.priority)}
                <Text type="secondary">ID: {task._id}</Text>
              </Space>
            </div>
            <Space>
              <Button 
                icon={<CommentOutlined />} 
                onClick={() => navigate(`/task-comments?id=${task._id}`)}
              >
                Bình luận
              </Button>
              
              {canEditTask() && task.status === 'in_progress' && (
                <>
                  <Button 
                    type="primary" 
                    ghost 
                    icon={<EditOutlined />} 
                    onClick={() => {
                      form.setFieldsValue({
                        progress: task.progress || 0,
                        status: task.status,
                        comment: ''
                      });
                      setUpdateModalVisible(true);
                    }}
                  >
                    Cập nhật tiến độ
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />} 
                    onClick={() => setCompleteModalVisible(true)}
                  >
                    Đánh dấu hoàn thành
                  </Button>
                </>
              )}
              
              {canTakeTask() && (
                <Popconfirm 
                  title="Bạn muốn nhận task này phải không?"
                  onConfirm={handleAcceptTask}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button type="primary">Nhận Task</Button>
                </Popconfirm>
              )}
            </Space>
          </div>

          <Divider />

          <Row gutter={24}>
            <Col span={16}>
              <div className="task-description">
                <Title level={4}>Mô tả</Title>
                <Paragraph>{task.description}</Paragraph>
              </div>
              
              {task.progress !== undefined && (
                <div className="task-progress" style={{ marginTop: 24 }}>
                  <Title level={4}>Tiến độ</Title>
                  <Progress 
                    percent={task.progress} 
                    status={getProgressColor(task.progress)} 
                    strokeWidth={15}
                  />
                </div>
              )}

              <Divider />

              <div className="task-history">
                <Title level={4}>
                  <Space>
                    <HistoryOutlined />
                    Lịch sử hoạt động
                  </Space>
                </Title>
                <Timeline>
                  {statusHistory.map((item) => (
                    <Timeline.Item key={item.id} color={
                      item.status === 'completed' ? 'green' : 
                      item.status === 'in_progress' ? 'blue' : 'gray'
                    }>
                      <div>
                        <Text strong>{item.user}</Text>
                        <Text> {item.comment}</Text>
                      </div>
                      <div>
                        <Text type="secondary">{item.timestamp}</Text>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            </Col>
            <Col span={8}>
              <Card title="Thông tin Task" type="inner">
                <Descriptions column={1} layout="horizontal" bordered>
                  <Descriptions.Item label="Người tạo">
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      {task.creatorName || task.createdBy}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {task.createdAt}
                  </Descriptions.Item>
                  <Descriptions.Item label="Người thực hiện">
                    {task.assignee ? (
                      <Space>
                        <Avatar icon={<UserOutlined />} />
                        {task.assigneeName || task.assignee}
                      </Space>
                    ) : (
                      <Text type="secondary">Chưa giao</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hạn hoàn thành">
                    {task.dueDate || <Text type="secondary">Không có</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    {getStatusTag(task.status)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Độ ưu tiên">
                    {getPriorityTag(task.priority)}
                  </Descriptions.Item>
                  {task.ipfsHash && (
                    <Descriptions.Item label="IPFS Hash">
                      <Text copyable>{task.ipfsHash}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Modal cập nhật tiến độ */}
      <Modal
        title="Cập nhật tiến độ Task"
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProgress}
        >
          <Form.Item
            name="progress"
            label="Tiến độ (%)"
            rules={[{ required: true, message: 'Vui lòng nhập tiến độ' }]}
          >
            <InputNumber 
              min={0} 
              max={100} 
              style={{ width: '100%' }} 
              formatter={value => `${value}%`}
              parser={(value) => {
                const parsed = parseInt(value!.replace('%', ''), 10);
                if (isNaN(parsed)) return 0;
                if (parsed < 0) return 0;
                if (parsed > 100) return 100;
                return parsed;
              }}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select>
              <Option value="in_progress">Đang xử lý</Option>
              <Option value="completed">Hoàn thành</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="Ghi chú"
            rules={[{ required: true, message: 'Vui lòng nhập ghi chú' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Mô tả về cập nhật tiến độ này" 
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
              <Button onClick={() => setUpdateModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal hoàn thành task */}
      <Modal
        title="Đánh dấu Task hoàn thành"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={completeForm}
          layout="vertical"
          onFinish={handleCompleteTask}
        >
          <Form.Item
            name="result"
            label="Kết quả công việc"
            rules={[{ required: true, message: 'Vui lòng nhập kết quả công việc' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Mô tả kết quả đã đạt được" 
            />
          </Form.Item>

          <Form.Item
            name="ipfsHash"
            label="IPFS Hash (nếu có)"
          >
            <Input placeholder="Hash của tài liệu đã tải lên IPFS" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Hoàn thành Task
              </Button>
              <Button onClick={() => setCompleteModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskDetails; 