import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  List,
  Avatar,
  Form,
  Button,
  Input,
  Divider,
  Space,
  Empty,
  Spin,
  message,
  Badge,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  UserOutlined,
  SendOutlined,
  MessageOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useBlockchain } from "../contexts/BlockchainContext";
import * as ApiService from "../services/ApiService";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CommentItem {
  _id: string;
  taskId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  assignee?: string;
  createdBy: string;
  createdAt: string;
}

const TaskComments: React.FC = () => {
  const { users, userRole } = useBlockchain();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingTask, setLoadingTask] = useState(true);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy taskId từ query parameter
  const taskId = new URLSearchParams(location.search).get("id");

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails(taskId);
      fetchComments(taskId);
    } else {
      message.error("ID task không hợp lệ");
      navigate("/task-management");
    }
  }, [taskId]);

  const fetchTaskDetails = async (id: string) => {
    try {
      setLoadingTask(true);
      const result = await ApiService.getTaskById(id);
      
      if (result.success) {
        setTask(result.data);
      } else {
        message.error(result.message || "Không thể tải thông tin task");
        navigate("/task-management");
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin task:", error);
      message.error("Không thể tải thông tin task");
      navigate("/task-management");
    } finally {
      setLoadingTask(false);
    }
  };

  const fetchComments = async (id: string) => {
    try {
      setLoading(true);
      const result = await ApiService.getCommentsByTaskId(id);
      
      if (result.success) {
        setComments(result.data);
      } else {
        message.error(result.message || "Không thể tải bình luận");
      }
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error);
      message.error("Không thể tải bình luận");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setDeletingCommentId(commentId);
      const result = await ApiService.deleteComment(commentId);
      
      if (result.success) {
        message.success("Đã xóa bình luận");
        await fetchComments(taskId!);
      } else {
        message.error(result.message || "Không thể xóa bình luận");
      }
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      message.error("Không thể xóa bình luận");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const getUsernameFromAddress = (address: string) => {
    const user = users.find(u => u.walletAddress === address);
    return user ? user.username : address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  const getAvatarColor = (authorAddress: string) => {
    // Tạo màu ngẫu nhiên nhưng nhất quán cho mỗi địa chỉ
    const hash = authorAddress.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    const colors = [
      '#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#f56a00',
      '#7265e6', '#ffbf00', '#00a2ae', '#f56a00'
    ];
    
    return colors[hash % colors.length];
  };

  const handleSubmitComment = async () => {
    if (!commentValue.trim()) return;

    try {
      setSubmitting(true);
      const result = await ApiService.addComment(taskId!, commentValue.trim());
      
      if (result.success) {
        setCommentValue("");
        await fetchComments(taskId!);
        message.success("Đã thêm bình luận");
      } else {
        message.error(result.message || "Không thể thêm bình luận");
      }
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
      message.error("Không thể thêm bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  const canDeleteComment = (commentAuthor: string) => {
    const currentUserAddress = localStorage.getItem('walletAddress');
    return userRole === 'admin' || userRole === 'teamLead' || commentAuthor === currentUserAddress;
  };

  return (
    <>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={goBack}
              style={{ padding: 0 }}
            >
              Quay lại
            </Button>
          </Space>

          {loadingTask ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Spin tip="Đang tải thông tin task..." />
            </div>
          ) : task ? (
            <>
              <Title level={3}>{task.title}</Title>
              <Paragraph>{task.description}</Paragraph>
              <Space style={{ marginBottom: 16 }}>
                <Text type="secondary">
                  Người tạo: {getUsernameFromAddress(task.createdBy)}
                </Text>
                <Divider type="vertical" />
                <Text type="secondary">
                  Ngày tạo: {moment(task.createdAt).format("DD/MM/YYYY HH:mm")}
                </Text>
              </Space>
            </>
          ) : (
            <Empty description="Không tìm thấy thông tin task" />
          )}

          <Divider>
            <Space>
              <MessageOutlined />
              <span>Bình luận</span>
              <Badge count={comments.length} style={{ backgroundColor: '#52c41a' }} />
            </Space>
          </Divider>

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Spin tip="Đang tải bình luận..." />
            </div>
          ) : comments.length === 0 ? (
            <Empty description="Chưa có bình luận nào" />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={comments}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    deletingCommentId === item._id ? (
                      <Spin size="small" />
                    ) : canDeleteComment(item.author) ? (
                      <Popconfirm
                        title="Bạn có chắc chắn muốn xóa bình luận này?"
                        onConfirm={() => handleDeleteComment(item._id)}
                        okText="Có"
                        cancelText="Không"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                        />
                      </Popconfirm>
                    ) : null
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ backgroundColor: getAvatarColor(item.author) }}
                        icon={<UserOutlined />}
                      >
                        {getUsernameFromAddress(item.author).charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text strong>{getUsernameFromAddress(item.author)}</Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {moment(item.createdAt).fromNow()}
                        </Text>
                      </Space>
                    }
                    description={<div style={{ whiteSpace: 'pre-line' }}>{item.content}</div>}
                  />
                </List.Item>
              )}
            />
          )}

          <Divider />

          <Form.Item>
            <TextArea
              rows={4}
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
              placeholder="Thêm bình luận của bạn..."
              disabled={submitting}
            />
          </Form.Item>
          <Form.Item>
            <Button
              htmlType="submit"
              loading={submitting}
              onClick={handleSubmitComment}
              type="primary"
              icon={<SendOutlined />}
              disabled={!commentValue.trim()}
            >
              Gửi bình luận
            </Button>
          </Form.Item>
        </Space>
      </Card>
    </>
  );
};

export default TaskComments;
