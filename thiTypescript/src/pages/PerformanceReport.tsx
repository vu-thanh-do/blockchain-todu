import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Progress, 
  Space, 
  Row, 
  Col, 
  Tag, 
  Avatar, 
  Statistic, 
  Select,
  DatePicker,
  Button,
  Spin,
  Divider,
  message
} from 'antd';
import { 
  LineChartOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  BarChartOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface PerformanceData {
  userId: string;
  username: string;
  completedTasks: number;
  totalAssignedTasks: number;
  onTimeCompletion: number;
  averageCompletionTime: number; // Tính bằng giờ
  lastActivity: string;
}

const PerformanceReport: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<[string, string] | null>(null);
  const [dateRangeType, setDateRangeType] = useState<'week' | 'month' | 'quarter' | 'custom'>('month');
  
  useEffect(() => {
    fetchPerformanceData();
  }, [dateRangeType, timeRange]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Giả định: Đây là nơi bạn sẽ gọi API hoặc blockchain để lấy dữ liệu hiệu suất
      // Ví dụ:
      /*
      let fromDate, toDate;
      if (timeRange) {
        [fromDate, toDate] = timeRange;
      } else {
        const now = new Date();
        if (dateRangeType === 'week') {
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (dateRangeType === 'month') {
          fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
        } else {
          fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();
        }
        toDate = now.toISOString();
      }

      const performanceData = await contractInstance.getEmployeePerformance(fromDate, toDate);
      setPerformanceData(performanceData.map(data => ({
        userId: data.userId,
        username: data.username,
        completedTasks: data.completedTasks,
        totalAssignedTasks: data.totalAssignedTasks,
        onTimeCompletion: data.onTimeCompletion,
        averageCompletionTime: data.averageCompletionTime,
        lastActivity: new Date(data.lastActivity * 1000).toLocaleString()
      })));
      */

      // Dữ liệu mẫu
      setTimeout(() => {
        const mockData: PerformanceData[] = [
          {
            userId: '1',
            username: 'Alice',
            completedTasks: 15,
            totalAssignedTasks: 18,
            onTimeCompletion: 85,
            averageCompletionTime: 24,
            lastActivity: '12/03/2023 16:20:00'
          },
          {
            userId: '2',
            username: 'Bob',
            completedTasks: 12,
            totalAssignedTasks: 15,
            onTimeCompletion: 90,
            averageCompletionTime: 30,
            lastActivity: '14/03/2023 09:45:00'
          },
          {
            userId: '3',
            username: 'Charlie',
            completedTasks: 8,
            totalAssignedTasks: 10,
            onTimeCompletion: 80,
            averageCompletionTime: 36,
            lastActivity: '10/03/2023 11:30:00'
          },
          {
            userId: '4',
            username: 'David',
            completedTasks: 5,
            totalAssignedTasks: 8,
            onTimeCompletion: 70,
            averageCompletionTime: 48,
            lastActivity: '08/03/2023 14:15:00'
          }
        ];
        setPerformanceData(mockData);
        setLoading(false);
      }, 1500);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu hiệu suất');
      setLoading(false);
    }
  };

  const handleDateRangeChange = (value: 'week' | 'month' | 'quarter' | 'custom') => {
    setDateRangeType(value);
    
    if (value !== 'custom') {
      setTimeRange(null);
    }
  };

  const handleCustomDateRange = (dates: any) => {
    if (dates && dates.length === 2) {
      setTimeRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
    } else {
      setTimeRange(null);
    }
  };

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Task hoàn thành',
      dataIndex: 'completedTasks',
      key: 'completedTasks',
      render: (text: number, record: PerformanceData) => (
        <Space>
          <Text>{`${text}/${record.totalAssignedTasks}`}</Text>
          <Progress 
            percent={Math.round((text / record.totalAssignedTasks) * 100)} 
            size="small" 
            width={50}
            status={
              (text / record.totalAssignedTasks) >= 0.8 ? 'success' : 
              (text / record.totalAssignedTasks) >= 0.5 ? 'normal' : 'exception'
            }
          />
        </Space>
      ),
      sorter: (a: PerformanceData, b: PerformanceData) => 
        (a.completedTasks / a.totalAssignedTasks) - (b.completedTasks / b.totalAssignedTasks)
    },
    {
      title: 'Hoàn thành đúng hạn',
      dataIndex: 'onTimeCompletion',
      key: 'onTimeCompletion',
      render: (percent: number) => (
        <Space>
          <Progress 
            percent={percent} 
            size="small" 
            width={60}
            status={
              percent >= 80 ? 'success' : 
              percent >= 50 ? 'normal' : 'exception'
            }
          />
          <Text>{`${percent}%`}</Text>
        </Space>
      ),
      sorter: (a: PerformanceData, b: PerformanceData) => a.onTimeCompletion - b.onTimeCompletion
    },
    {
      title: 'Thời gian hoàn thành TB',
      dataIndex: 'averageCompletionTime',
      key: 'averageCompletionTime',
      render: (hours: number) => (
        <Tag color={
          hours <= 24 ? 'green' : 
          hours <= 48 ? 'blue' : 'orange'
        }>
          {hours} giờ
        </Tag>
      ),
      sorter: (a: PerformanceData, b: PerformanceData) => a.averageCompletionTime - b.averageCompletionTime
    },
    {
      title: 'Hoạt động gần nhất',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (text: string) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{text}</Text>
        </Space>
      )
    }
  ];

  // Tính toán các số liệu tổng hợp
  const calculateSummary = () => {
    if (performanceData.length === 0) return null;

    const totalAssigned = performanceData.reduce((sum, item) => sum + item.totalAssignedTasks, 0);
    const totalCompleted = performanceData.reduce((sum, item) => sum + item.completedTasks, 0);
    const avgCompletionRate = Math.round((totalCompleted / totalAssigned) * 100);
    const avgOnTimeRate = Math.round(
      performanceData.reduce((sum, item) => sum + item.onTimeCompletion, 0) / performanceData.length
    );
    const avgCompletionTime = Math.round(
      performanceData.reduce((sum, item) => sum + item.averageCompletionTime, 0) / performanceData.length
    );

    return { totalAssigned, totalCompleted, avgCompletionRate, avgOnTimeRate, avgCompletionTime };
  };

  const summary = calculateSummary();

  return (
    <div className="performance-report-container">
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2}>
              <Space>
                <LineChartOutlined />
                Báo Cáo Hiệu Suất
              </Space>
            </Title>
            <Space>
              <Select 
                value={dateRangeType} 
                onChange={handleDateRangeChange}
                style={{ width: 120 }}
              >
                <Option value="week">Tuần này</Option>
                <Option value="month">Tháng này</Option>
                <Option value="quarter">Quý này</Option>
                <Option value="custom">Tùy chỉnh</Option>
              </Select>
              {dateRangeType === 'custom' && (
                <RangePicker onChange={handleCustomDateRange} />
              )}
              <Button 
                type="primary" 
                onClick={fetchPerformanceData} 
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </div>
          
          <Paragraph>
            Báo cáo hiệu suất làm việc của nhân viên, bao gồm số lượng task hoàn thành, tỉ lệ hoàn thành đúng hạn, và thời gian trung bình.
          </Paragraph>

          {summary && (
            <>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card>
                    <Statistic
                      title="Tổng Task đã giao"
                      value={summary.totalAssigned}
                      prefix={<BarChartOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card>
                    <Statistic
                      title="Tổng Task hoàn thành"
                      value={summary.totalCompleted}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card>
                    <Statistic
                      title="Tỉ lệ hoàn thành đúng hạn"
                      value={summary.avgOnTimeRate}
                      suffix="%"
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: summary.avgOnTimeRate >= 80 ? '#3f8600' : '#cf1322' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Card>
                    <Statistic
                      title="Thời gian hoàn thành TB"
                      value={summary.avgCompletionTime}
                      suffix="giờ"
                      prefix={<SyncOutlined />}
                    />
                  </Card>
                </Col>
              </Row>

              <Divider />
            </>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={performanceData}
              rowKey="userId"
              pagination={false}
              scroll={{ x: 800 }}
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PerformanceReport; 