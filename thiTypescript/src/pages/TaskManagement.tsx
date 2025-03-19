import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Space,
  Tag,
  Card,
  Input,
  Row,
  Col,
  Select,
  Modal,
  Form,
  DatePicker,
  message,
  Tooltip,
  Popconfirm,
  Spin
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useBlockchain } from '../contexts/BlockchainContext';
import { Task } from '../contexts/BlockchainContext';
import * as ApiService from '../services/ApiService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TaskManagement: React.FC = () => {
  const { tasks, users, loading, userRole, fetchTasks, createTask, assignTask, updateTaskStatus } = useBlockchain();
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Cập nhật tasks đã lọc khi data hoặc bộ lọc thay đổi
  useEffect(() => {
    let result = [...tasks];

    // Lọc theo trạng thái
    if (statusFilter) {
      result = result.filter(task => task.status === statusFilter);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTasks(result);
  }, [tasks, statusFilter, searchText]);

  // Xử lý tạo task mới
  const handleCreateTask = async (values: any) => {
    try {
      await createTask(
        values.title, 
        values.description,
        values.priority,
        values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined
      );
      setCreateModalVisible(false);
      form.resetFields();
      message.success('Tạo task mới thành công!');
    } catch (error) {
      console.error('Lỗi tạo task:', error);
      message.error('Không thể tạo task: ' + (error as Error).message);
    }
  };

  // Mở modal chỉnh sửa task
  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    editForm.setFieldsValue({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? moment(task.dueDate) : undefined
    });
    setEditModalVisible(true);
  };

  // Cập nhật task
  const handleUpdateTask = async (values: any) => {
    try {
      if (!currentTask) return;
      
      setProcessingTaskId(currentTask.id);

      // Cập nhật thông tin task
      await ApiService.updateTask(currentTask.id, {
        title: values.title,
        description: values.description,
        priority: values.priority,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined
      });

      // Nếu trạng thái thay đổi, cập nhật trạng thái
      if (values.status !== currentTask.status) {
        await updateTaskStatus(currentTask.id, values.status);
      }

      await fetchTasks();
      setEditModalVisible(false);
      message.success('Cập nhật nhiệm vụ thành công!');
    } catch (error) {
      console.error('Lỗi cập nhật task:', error);
      message.error('Không thể cập nhật nhiệm vụ: ' + (error as Error).message);
    } finally {
      setProcessingTaskId(null);
    }
  };

  // Xử lý xóa task
  const handleDeleteTask = async (taskId: string) => {
    try {
      // Chức năng này chưa được hỗ trợ trong smart contract
      message.info('Chức năng xóa nhiệm vụ chưa được hỗ trợ trong smart contract');
    } catch (error) {
      console.error('Lỗi xóa task:', error);
      message.error('Không thể xóa nhiệm vụ!');
    }
  };

  // Xử lý xem chi tiết task
  const handleViewTaskDetails = (taskId: string) => {
    navigate(`/task-details?id=${taskId}`);
  };

  // Lấy tag hiển thị trạng thái
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'created':
        return <Tag icon={<ClockCircleOutlined />} color="default">Đã tạo</Tag>;
      case 'assigned':
        return <Tag icon={<ClockCircleOutlined />} color="blue">Đã phân công</Tag>;
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

  // Lấy tag hiển thị độ ưu tiên
  const getPriorityTag = (priority: string = 'medium') => {
    switch (priority) {
      case 'high':
        return <Tag color="red">Cao</Tag>;
      case 'medium':
        return <Tag color="orange">Trung bình</Tag>;
      case 'low':
        return <Tag color="green">Thấp</Tag>;
      default:
        return <Tag>Không xác định</Tag>;
    }
  };

  // Lấy tên người dùng từ địa chỉ ví
  const getUsernameFromAddress = (address: string) => {
    const user = users.find(u => u.walletAddress === address);
    return user ? user.username : address ? address.substring(0, 6) + '...' + address.substring(address.length - 4) : 'Chưa gán';
  };

  // Sự kiện thay đổi trạng thái task
  const handleToggleStatus = async (taskId: string, status: string) => {
    try {
      setProcessingTaskId(taskId);
      await updateTaskStatus(taskId, status);
      message.success('Cập nhật trạng thái thành công!');
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      message.error('Không thể cập nhật trạng thái nhiệm vụ: ' + (error as Error).message);
    } finally {
      setProcessingTaskId(null);
    }
  };

  // Sự kiện phân công task
  const handleAssignTask = (taskId: string) => {
    navigate(`/assign-task?id=${taskId}`);
  };

  // Cấu hình cột cho bảng task
  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <a onClick={() => handleViewTaskDetails(record._id)}>{text}</a>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => getPriorityTag(priority)
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (address: string) => getUsernameFromAddress(address)
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (address: string) => address ? getUsernameFromAddress(address) : 'Chưa gán'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => moment(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (text: string, record: Task) => {

        console.log(record,'record');
        return (
          <Space size="small">
            {processingTaskId === record._id ? (
              <Spin size="small" />
            ) : (
              <>
                <Tooltip title="Xem chi tiết">
                  <Button 
                    icon={<EyeOutlined />} 
                    size="small" 
                    onClick={() => handleViewTaskDetails(record._id)} 
                  />
                </Tooltip>
                
                {(userRole === 'admin' || userRole === 'teamLead' || record.createdBy === localStorage.getItem('walletAddress')) && (
                  <Tooltip title="Chỉnh sửa">
                    <Button 
                      icon={<EditOutlined />} 
                      size="small" 
                      onClick={() => handleEditTask(record)} 
                    />
                  </Tooltip>
                )}
  
                {(userRole === 'admin' || userRole === 'teamLead') && record.status === 'created' && (
                  <Tooltip title="Phân công">
                    <Button 
                      type="primary" 
                      size="small" 
                      onClick={() => handleAssignTask(record._id)}
                    >
                      Phân công
                    </Button>
                  </Tooltip>
                )}
  
                {record.status === 'assigned' && record.assignee === localStorage.getItem('walletAddress') && (
                  <Tooltip title="Bắt đầu làm việc">
                    <Button 
                      type="primary" 
                      size="small" 
                      onClick={() => handleToggleStatus(record._id, 'in_progress')}
                    >
                      Bắt đầu
                    </Button>
                  </Tooltip>
                )}
  
                {record.status === 'in_progress' && record.assignee === localStorage.getItem('walletAddress') && (
                  <Tooltip title="Đánh dấu hoàn thành">
                    <Button 
                      type="primary" 
                      size="small" 
                      onClick={() => handleToggleStatus(record._id, 'completed')}
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                      Hoàn thành
                    </Button>
                  </Tooltip>
                )}
              </>
            )}
          </Space>
        )
      }
    }
  ];

  return (
    <div>
      <Title level={2}>Quản lý công việc</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Tìm kiếm tác vụ..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: '100%', marginBottom: 16 }}
              allowClear
              onChange={value => setStatusFilter(value)}
            >
              <Option value="created">Đã tạo</Option>
              <Option value="assigned">Đã phân công</Option>
              <Option value="in_progress">Đang xử lý</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="rejected">Từ chối</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} lg={6} style={{ textAlign: 'right', marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Tạo nhiệm vụ mới
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredTasks.map(task => ({ ...task, key: task.id }))}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal tạo task mới */}
      <Modal
        title="Tạo nhiệm vụ mới"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề nhiệm vụ" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả chi tiết" />
          </Form.Item>
          <Form.Item
            name="priority"
            label="Mức độ ưu tiên"
            initialValue="medium"
          >
            <Select>
              <Option value="low">Thấp</Option>
              <Option value="medium">Trung bình</Option>
              <Option value="high">Cao</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dueDate"
            label="Hạn hoàn thành"
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Tạo nhiệm vụ
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chỉnh sửa task */}
      <Modal
        title="Cập nhật nhiệm vụ"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateTask}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề nhiệm vụ" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả chi tiết" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select>
              <Option value="created">Đã tạo</Option>
              <Option value="assigned">Đã phân công</Option>
              <Option value="in_progress">Đang xử lý</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="rejected">Từ chối</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label="Mức độ ưu tiên"
          >
            <Select>
              <Option value="low">Thấp</Option>
              <Option value="medium">Trung bình</Option>
              <Option value="high">Cao</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dueDate"
            label="Hạn hoàn thành"
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskManagement; 