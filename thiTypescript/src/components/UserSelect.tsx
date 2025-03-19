import React, { useEffect, useState } from 'react';
import { Select, Avatar, Typography } from 'antd';
import { useBlockchain } from '../contexts/BlockchainContext';
import { User } from '../contexts/BlockchainContext';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface UserSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  showOnlyEmployees?: boolean;
  style?: React.CSSProperties;
  exclude?: string[];
}

// Tạo một kiểu tùy chỉnh để sử dụng React element trong options của Select
interface UserOption {
  value: string;
  label: string;
  renderLabel: React.ReactNode;
}

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  placeholder = 'Chọn người dùng',
  showOnlyEmployees = false,
  style,
  exclude = []
}) => {
  const { users, fetchUsers } = useBlockchain();
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    // Tải danh sách người dùng nếu cần
    if (users.length === 0) {
      fetchUsers();
    }

    // Lọc danh sách người dùng
    let filtered = [...users];
    
    // Chỉ hiển thị nhân viên nếu có yêu cầu
    if (showOnlyEmployees) {
      filtered = filtered.filter(user => user.role === 'employee');
    }
    
    // Loại trừ các người dùng không mong muốn
    if (exclude.length > 0) {
      filtered = filtered.filter(user => !exclude.includes(user.walletAddress));
    }
    
    // Chỉ hiển thị người dùng active
    filtered = filtered.filter(user => user.status === 'active');
    
    setFilteredUsers(filtered);
  }, [users, showOnlyEmployees, exclude, fetchUsers]);

  // Sắp xếp người dùng theo tên
  const sortedUsers = [...filteredUsers].sort((a, b) => a.username.localeCompare(b.username));

  // Chuyển đổi danh sách người dùng thành options cho Select
  const options: UserOption[] = sortedUsers.map(user => ({
    value: user.walletAddress,
    label: user.username, // Sử dụng username làm label để có thể tìm kiếm
    renderLabel: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar icon={<UserOutlined />} size="small" style={{ marginRight: 8 }} />
        <span>{user.username}</span>
        {user.role === 'admin' && (
          <Text type="danger" style={{ marginLeft: 8 }}>(Admin)</Text>
        )}
        {user.role === 'teamLead' && (
          <Text type="warning" style={{ marginLeft: 8 }}>(Team Lead)</Text>
        )}
      </div>
    ),
  }));

  return (
    <Select
      style={{ width: '100%', ...style }}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      allowClear
      showSearch
      filterOption={(input, option) => {
        // Kiểm tra xem option có tồn tại và label là string không
        if (!option || typeof option.label !== 'string') return false;
        return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
      }}
      optionLabelProp="label"
    >
      {options.map(option => (
        <Select.Option key={option.value} value={option.value} label={option.label}>
          {option.renderLabel}
        </Select.Option>
      ))}
    </Select>
  );
};

export default UserSelect; 