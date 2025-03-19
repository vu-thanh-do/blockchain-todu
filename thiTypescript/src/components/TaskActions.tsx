import React, { useState } from 'react';
import { Button, Space, message, Modal, Popconfirm, Tooltip, Tag, Typography } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  PlayCircleOutlined, 
  UserAddOutlined,
  InfoCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useBlockchain } from '../contexts/BlockchainContext';
import UserSelect from './UserSelect';

const { Text } = Typography;

interface TaskActionsProps {
  task: {
    id: string;
    status: string;
    assignee?: string;
    txHash?: string;
  };
  onStatusUpdate: () => void;
}

const TaskActions: React.FC<TaskActionsProps> = ({ task, onStatusUpdate }) => {
  const { updateTaskStatus, assignTask, userRole, walletAddress, loading, provider, contract } = useBlockchain();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState({
    start: false,
    complete: false,
    reject: false
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  // Kiểm tra xem người dùng hiện tại có quyền gán task không
  const canAssign = userRole === 'admin' || userRole === 'teamLead';
  
  // Kiểm tra xem người dùng hiện tại có quyền cập nhật trạng thái task không
  const canUpdateStatus = task.assignee === walletAddress || userRole === 'admin';

  // Hiển thị trạng thái dưới dạng tag
  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'created':
        return <Tag color="default">Đã tạo</Tag>;
      case 'assigned':
        return <Tag color="blue">Đã gán</Tag>;
      case 'in_progress':
        return <Tag color="processing">Đang thực hiện</Tag>;
      case 'completed':
        return <Tag color="success">Hoàn thành</Tag>;
      case 'rejected':
        return <Tag color="error">Từ chối</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Mở modal gán người dùng
  const showAssignModal = () => {
    setIsAssigning(true);
  };

  // Đóng modal gán người dùng
  const handleAssignCancel = () => {
    setIsAssigning(false);
    setSelectedUser(null);
  };

  // Xử lý gán task
  const handleAssign = async () => {
    if (!selectedUser) {
      message.warning('Vui lòng chọn người dùng để gán task');
      return;
    }

    try {
      await assignTask(task.id, selectedUser);
      message.success('Gán task thành công');
      setIsAssigning(false);
      setSelectedUser(null);
      onStatusUpdate();
    } catch (error) {
      console.error('Lỗi khi gán task:', error);
    }
  };

  // Xử lý cập nhật trạng thái task
  const handleUpdateStatus = async (status: string) => {
    try {
      setLoadingState({ ...loadingState, [status]: true });
      await updateTaskStatus(task.id, status);
      message.success(`Cập nhật trạng thái task thành ${renderStatusTag(status)}`);
      onStatusUpdate();
    } catch (error) {
      console.error(`Lỗi khi cập nhật trạng thái task sang ${status}:`, error);
    } finally {
      setLoadingState({ ...loadingState, [status]: false });
    }
  };

  // Xem thông tin transaction
  const viewTransactionInfo = async () => {
    if (!task.txHash) {
      message.info('Task này chưa có giao dịch blockchain');
      return;
    }

    setIsModalVisible(true);

    try {
      // Lấy thông tin giao dịch từ blockchain
      if (provider) {
        const txReceipt = await provider.getTransactionReceipt(task.txHash);
        const tx = await provider.getTransaction(task.txHash);
        
        setTransactionDetails({
          hash: task.txHash,
          blockNumber: txReceipt?.blockNumber,
          from: tx?.from,
          to: tx?.to,
          gasUsed: txReceipt?.gasUsed.toString(),
          status: txReceipt?.status === 1 ? 'Thành công' : 'Thất bại',
          timestamp: new Date().toISOString() // Ideally this should come from the block timestamp
        });
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin giao dịch:', error);
      message.error('Không thể lấy thông tin giao dịch');
    }
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ marginBottom: '8px' }}>
          <Text strong>Trạng thái hiện tại:</Text> {renderStatusTag(task.status)}
          
          {task.txHash && (
            <Tooltip title="Xem thông tin giao dịch blockchain">
              <Button 
                type="link" 
                icon={<InfoCircleOutlined />} 
                onClick={viewTransactionInfo}
                size="small"
              >
                Xem giao dịch
              </Button>
            </Tooltip>
          )}
        </div>

        <Space wrap>
          {canAssign && (task.status === 'created' || !task.assignee) && (
            <Button 
              type="primary" 
              icon={<UserAddOutlined />} 
              onClick={showAssignModal}
              loading={loading}
            >
              Gán task
            </Button>
          )}

          {canUpdateStatus && task.status === 'assigned' && (
            <Button
              type="primary" 
              icon={loadingState.start ? <LoadingOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleUpdateStatus('in_progress')}
              loading={loadingState.start}
            >
              Bắt đầu thực hiện
            </Button>
          )}

          {canUpdateStatus && task.status === 'in_progress' && (
            <>
              <Button
                type="primary" 
                icon={loadingState.complete ? <LoadingOutlined /> : <CheckCircleOutlined />}
                onClick={() => handleUpdateStatus('completed')}
                loading={loadingState.complete}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Hoàn thành
              </Button>
              
              <Popconfirm
                title="Bạn có chắc chắn muốn từ chối task này?"
                onConfirm={() => handleUpdateStatus('rejected')}
                okText="Có"
                cancelText="Không"
              >
                <Button
                  danger
                  icon={loadingState.reject ? <LoadingOutlined /> : <CloseCircleOutlined />}
                  loading={loadingState.reject}
                >
                  Từ chối
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </Space>

      {/* Modal gán task */}
      <Modal
        title="Gán Task cho Người Dùng"
        open={isAssigning}
        onOk={handleAssign}
        onCancel={handleAssignCancel}
        confirmLoading={loading}
      >
        <p>Chọn người dùng để gán task:</p>
        <UserSelect value={selectedUser} onChange={setSelectedUser} />
      </Modal>

      {/* Modal thông tin transaction */}
      <Modal
        title="Thông tin Giao dịch Blockchain"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>
        ]}
      >
        {transactionDetails ? (
          <div>
            <p><strong>Hash:</strong> {transactionDetails.hash}</p>
            <p><strong>Block Number:</strong> {transactionDetails.blockNumber}</p>
            <p><strong>From:</strong> {transactionDetails.from}</p>
            <p><strong>To:</strong> {transactionDetails.to}</p>
            <p><strong>Gas Used:</strong> {transactionDetails.gasUsed}</p>
            <p><strong>Status:</strong> {transactionDetails.status}</p>
            
            <div style={{ marginTop: '16px' }}>
              <a 
                href={`https://sepolia.etherscan.io/tx/${transactionDetails.hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Xem trên Etherscan
              </a>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <LoadingOutlined style={{ fontSize: 24 }} />
            <p>Đang tải thông tin giao dịch...</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TaskActions; 