import React, { useState } from 'react'
import { Card, Row, Col, Badge, Tag, Timeline, Progress, Table, Avatar, List, Typography } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  BellOutlined,
  FileTextOutlined,
  SyncOutlined,
  RiseOutlined,
  FallOutlined,
  ToolOutlined,
  ScheduleOutlined,
  MoneyCollectOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  SwapOutlined,
  RightOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { Line, Pie } from '@ant-design/charts'

const { Text, Title } = Typography

// 模拟待办数据
const pendingTasks = [
  { id: 1, type: '补卡', title: '王五 - 5月10日补卡申请', time: '10分钟前', urgent: true },
  { id: 2, type: '加班', title: '李四 - 平日加班申请(3小时)', time: '30分钟前', urgent: false },
  { id: 3, type: '换班', title: '张三 ↔ 李四 换班待确认', time: '1小时前', urgent: false },
  { id: 4, type: '考勤确认', title: '心内科 - 5月考勤待确认(12人)', time: '2小时前', urgent: true },
  { id: 5, type: '假期', title: '赵六 - 年假申请(5天)', time: '3小时前', urgent: false },
]

// 模拟考勤趋势数据
const attendanceTrendData = [
  { month: '1月', normal: 92, late: 5, absent: 3 },
  { month: '2月', normal: 88, late: 7, absent: 5 },
  { month: '3月', normal: 90, late: 6, absent: 4 },
  { month: '4月', normal: 93, late: 4, absent: 3 },
  { month: '5月', normal: 91, late: 5, absent: 4 },
]

// 模拟异常类型分布
const exceptionDistData = [
  { type: '迟到', value: 35, percent: 42 },
  { type: '早退', value: 22, percent: 27 },
  { type: '缺卡', value: 15, percent: 18 },
  { type: '旷工', value: 8, percent: 10 },
  { type: '其他', value: 3, percent: 3 },
]

// 模拟考勤异常人员
const abnormalEmployees = [
  { name: '王五', dept: '心内科', type: '连续迟到3天', status: 'warning' },
  { name: '李四', dept: '神经内科', type: '本月缺卡2次', status: 'warning' },
  { name: '赵六', dept: '骨科', type: '旷工1天', status: 'danger' },
]

const Dashboard: React.FC = () => {
  const [loading] = useState(false)

  // 考勤趋势图配置
  const trendConfig = {
    data: attendanceTrendData,
    xField: 'month',
    yField: 'normal',
    label: {
      position: 'top' as const,
    },
    color: '#52c41a',
    point: { size: 5, shape: 'diamond', style: { fill: '#52c41a' } },
  }

  // 异常类型饼图配置
  const pieConfig = {
    data: exceptionDistData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer' as const,
      content: '{percentage}',
    },
    legend: false,
    color: ['#faad14', '#1890ff', '#52c41a', '#ff4d4f', '#722ed1'],
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      warning: '#faad14',
      danger: '#ff4d4f',
      success: '#52c41a',
    }
    return colors[status] || '#999'
  }

  // 获取任务图标
  const getTaskIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      '补卡': <FileTextOutlined className="text-blue-500" />,
      '加班': <ClockCircleOutlined className="text-orange-500" />,
      '换班': <SwapOutlined className="text-purple-500" />,
      '考勤确认': <AuditOutlined className="text-green-500" />,
      '假期': <CalendarOutlined className="text-cyan-500" />,
    }
    return icons[type] || <BellOutlined />
  }

  return (
    <div className="space-y-4">
      {/* 欢迎标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={4} className="m-0">人事科考勤工作台</Title>
          <Text type="secondary">2026年5月13日 星期三 · 贵阳市第一人民医院</Text>
        </div>
        <Badge count={pendingTasks.length} overflowCount={99}>
          <Tag icon={<BellOutlined />} color="blue" className="px-3 py-1">
            待办事项
          </Tag>
        </Badge>
      </div>

      {/* 第一行：核心指标卡片 */}
      <Row gutter={[16, 16]}>
        {/* 出勤率 */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircleOutlined className="text-2xl text-green-500" />
              </div>
              <div className="flex-1">
                <Text type="secondary" className="text-xs">出勤率</Text>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-green-600">96.8</span>
                  <span className="text-sm text-green-500">%</span>
                  <UpOutlined className="text-green-500 text-xs" />
                </div>
                <Text type="secondary" className="text-xs">较上月 +1.2%</Text>
              </div>
            </div>
            <Progress percent={96.8} showInfo={false} strokeColor="#52c41a" size="small" className="mt-3" />
          </Card>
        </Col>

        {/* 待审批 */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                <AuditOutlined className="text-2xl text-blue-500" />
              </div>
              <div className="flex-1">
                <Text type="secondary" className="text-xs">待审批</Text>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-blue-600">28</span>
                  <span className="text-sm text-gray-400">件</span>
                </div>
                <div className="flex gap-2 mt-1">
                  <Tag color="orange">补卡 8</Tag>
                  <Tag color="blue">加班 12</Tag>
                  <Tag color="purple">换班 5</Tag>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 异常考勤 */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                <WarningOutlined className="text-2xl text-orange-500" />
              </div>
              <div className="flex-1">
                <Text type="secondary" className="text-xs">本月异常</Text>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-orange-600">83</span>
                  <span className="text-sm text-gray-400">人次</span>
                  <DownOutlined className="text-green-500 text-xs" />
                </div>
                <Text type="secondary" className="text-xs">较上月 -12%</Text>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Tag color="gold">迟到 35</Tag>
              <Tag color="cyan">早退 22</Tag>
              <Tag color="red">缺卡 15</Tag>
            </div>
          </Card>
        </Col>

        {/* 假期余额预警 */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
                <CalendarOutlined className="text-2xl text-purple-500" />
              </div>
              <div className="flex-1">
                <Text type="secondary" className="text-xs">假期预警</Text>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-purple-600">5</span>
                  <span className="text-sm text-gray-400">人</span>
                </div>
                <Text type="danger" className="text-xs">年假余额不足</Text>
              </div>
            </div>
            <div className="mt-2">
              <Tag color="purple">3人年假≤2天</Tag>
              <Tag color="red">2人已透支</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第二行：待办事项 + 考勤趋势 */}
      <Row gutter={[16, 16]}>
        {/* 左侧：待办事项 */}
        <Col xs={24} lg={8}>
          <Card 
            title={<><BellOutlined className="mr-2" />待办事项</>}
            bordered={false} 
            className="shadow-sm"
            extra={<Badge count={pendingTasks.length} />}
          >
            <List
              size="small"
              dataSource={pendingTasks.slice(0, 5)}
              renderItem={(item) => (
                <List.Item 
                  className="cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                  extra={item.urgent && <Tag color="red">紧急</Tag>}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size={36} 
                        icon={getTaskIcon(item.type)}
                        className="bg-white"
                      />
                    }
                    title={<Text ellipsis>{item.title}</Text>}
                    description={<Text type="secondary" className="text-xs">{item.time}</Text>}
                  />
                  <RightOutlined className="text-gray-300" />
                </List.Item>
              )}
            />
            <div className="text-center mt-2">
              <a className="text-blue-500 text-sm">查看全部 28 件待办 <RightOutlined /></a>
            </div>
          </Card>
        </Col>

        {/* 中间：考勤趋势 */}
        <Col xs={24} lg={10}>
          <Card 
            title={<><RiseOutlined className="mr-2" />考勤趋势分析</>}
            bordered={false} 
            className="shadow-sm"
          >
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <Text>正常</Text>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                <Text>迟到</Text>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <Text>旷工</Text>
              </div>
            </div>
            <Line {...trendConfig} height={180} />
          </Card>
        </Col>

        {/* 右侧：异常分布 */}
        <Col xs={24} lg={6}>
          <Card 
            title={<><ExclamationCircleOutlined className="mr-2" />异常类型分布</>}
            bordered={false} 
            className="shadow-sm"
          >
            <div className="flex items-center">
              <Pie {...pieConfig} height={140} />
              <div className="flex flex-col gap-2 ml-2">
                {exceptionDistData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: ['#faad14', '#1890ff', '#52c41a', '#ff4d4f', '#722ed1'][idx] }}
                    ></span>
                    <Text className="text-xs">{item.type}</Text>
                    <Text className="text-xs text-gray-400">{item.percent}%</Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第三行：重点关注 + 快捷入口 */}
      <Row gutter={[16, 16]}>
        {/* 异常考勤人员 */}
        <Col xs={24} lg={10}>
          <Card 
            title={<><WarningOutlined className="mr-2 text-orange-500" />重点关注人员</>}
            bordered={false} 
            className="shadow-sm"
            style={{ minHeight: 200 }}
          >
            <div className="space-y-3">
              {abnormalEmployees.map((emp, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar icon={<UserOutlined />} className="bg-blue-500" />
                    <div>
                      <Text strong>{emp.name}</Text>
                      <Text type="secondary" className="ml-2 text-xs">{emp.dept}</Text>
                      <div>
                        <Text type="secondary" className="text-xs">{emp.type}</Text>
                      </div>
                    </div>
                  </div>
                  <Tag color={emp.status === 'danger' ? 'red' : 'orange'}>
                    {emp.status === 'danger' ? '需处理' : '观察中'}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 快捷入口 */}
        <Col xs={24} lg={14}>
          <Card 
            title={<><ToolOutlined className="mr-2" />快捷操作</>}
            bordered={false} 
            className="shadow-sm"
            style={{ minHeight: 200 }}
          >
            <Row gutter={[12, 12]}>
              <Col span={6}>
                <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors">
                  <CalendarOutlined className="text-xl text-blue-600 mb-1" />
                  <Text className="text-xs text-blue-700">考勤期间</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="flex flex-col items-center p-3 rounded-lg bg-green-50 hover:bg-green-100 cursor-pointer transition-colors">
                  <TeamOutlined className="text-xl text-green-600 mb-1" />
                  <Text className="text-xs text-green-700">考勤人员</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="flex flex-col items-center p-3 rounded-lg bg-orange-50 hover:bg-orange-100 cursor-pointer transition-colors">
                  <ScheduleOutlined className="text-xl text-orange-600 mb-1" />
                  <Text className="text-xs text-orange-700">排班一览</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="flex flex-col items-center p-3 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors">
                  <FileTextOutlined className="text-xl text-purple-600 mb-1" />
                  <Text className="text-xs text-purple-700">考勤确认</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="flex flex-col items-center p-3 rounded-lg bg-cyan-50 hover:bg-cyan-100 cursor-pointer transition-colors">
                  <MoneyCollectOutlined className="text-xl text-cyan-600 mb-1" />
                  <Text className="text-xs text-cyan-700">假期发放</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="flex flex-col items-center p-3 rounded-lg bg-red-50 hover:bg-red-100 cursor-pointer transition-colors">
                  <ClockCircleOutlined className="text-xl text-red-600 mb-1" />
                  <Text className="text-xs text-red-700">补卡审核</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="flex flex-col items-center p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition-colors">
                  <SyncOutlined className="text-xl text-indigo-600 mb-1" />
                  <Text className="text-xs text-indigo-700">换班审批</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="flex flex-col items-center p-3 rounded-lg bg-pink-50 hover:bg-pink-100 cursor-pointer transition-colors">
                  <SafetyCertificateOutlined className="text-xl text-pink-600 mb-1" />
                  <Text className="text-xs text-pink-700">假期余额</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 第四行：考勤期间信息 */}
      <Card bordered={false} className="shadow-sm" style={{ minHeight: 100 }}>
        <Row gutter={24} align="middle">
          <Col span={8}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarOutlined className="text-xl text-blue-600" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">当前考勤期间</Text>
                <Title level={4} className="m-0">2026年5月</Title>
                <Text type="secondary">2026-05-01 至 2026-05-31</Text>
              </div>
            </div>
          </Col>
          <Col span={4}>
            <div className="text-center border-l border-gray-200">
              <Text type="secondary" className="text-xs">应考勤人数</Text>
              <div className="text-2xl font-bold text-blue-600">256</div>
              <Text type="secondary" className="text-xs">人</Text>
            </div>
          </Col>
          <Col span={4}>
            <div className="text-center border-l border-gray-200">
              <Text type="secondary" className="text-xs">已打卡</Text>
              <div className="text-2xl font-bold text-green-600">198</div>
              <Text type="secondary" className="text-xs">人 · 77.3%</Text>
            </div>
          </Col>
          <Col span={4}>
            <div className="text-center border-l border-gray-200">
              <Text type="secondary" className="text-xs">迟到</Text>
              <div className="text-2xl font-bold text-orange-600">12</div>
              <Text type="secondary" className="text-xs">人 · 4.7%</Text>
            </div>
          </Col>
          <Col span={4}>
            <div className="text-center border-l border-gray-200">
              <Text type="secondary" className="text-xs">异常</Text>
              <div className="text-2xl font-bold text-red-600">8</div>
              <Text type="secondary" className="text-xs">人 · 3.1%</Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard
