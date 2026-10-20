import React, { useState } from 'react'
import {
  Button,
  Table,
  Space,
  Tag,
  Drawer,
  Form,
  Input,
  Select,
  Radio,
  DatePicker,
  message,
  Card,
  Descriptions,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

// 假期类型定义
interface LeaveType {
  id: string
  name: string
  type: 'unlimited' | 'limited'
  remainingDays: number
  expiryDate: string
  totalDays: number
  usedDays: number
  unit: string
}

// 发放记录类型
interface GrantRecord {
  id: string
  year: string
  type: 'grant' | 'deduct' | 'return'
  projectName: string
  occurTime: string
  executeTime: string
  changeValue: number
  expiryDate: string
}

// 我的请假记录类型
interface MyLeaveRequest {
  id: string
  requestNo: string
  projectName: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn'
  createTime: string
}

// 当前用户的假期余额数据
const myLeaveBalances: LeaveType[] = [
  {
    id: '1',
    name: '年假',
    type: 'limited',
    remainingDays: 8.5,
    expiryDate: '2026-12-31',
    totalDays: 13,
    usedDays: 4.5,
    unit: '天',
  },
  {
    id: '2',
    name: '病假',
    type: 'unlimited',
    remainingDays: -2,
    expiryDate: '-',
    totalDays: 0,
    usedDays: 2,
    unit: '天',
  },
  {
    id: '3',
    name: '婚假',
    type: 'limited',
    remainingDays: 10,
    expiryDate: '2027-12-31',
    totalDays: 10,
    usedDays: 0,
    unit: '天',
  },
  {
    id: '4',
    name: '产假',
    type: 'limited',
    remainingDays: 120,
    expiryDate: '2027-06-30',
    totalDays: 158,
    usedDays: 38,
    unit: '天',
  },
  {
    id: '5',
    name: '陪产假',
    type: 'limited',
    remainingDays: 10,
    expiryDate: '2027-01-01',
    totalDays: 20,
    usedDays: 10,
    unit: '天',
  },
  {
    id: '6',
    name: '丧假',
    type: 'unlimited',
    remainingDays: 5,
    expiryDate: '-',
    totalDays: 0,
    usedDays: 0,
    unit: '天',
  },
]

// 发放记录模拟数据
const mockGrantRecords: GrantRecord[] = [
  { id: 'r1', year: '2026', type: 'grant', projectName: '年假', occurTime: '2026-01-01 00:00:00', executeTime: '2026-01-01 08:30:15', changeValue: 10, expiryDate: '2026-12-31' },
  { id: 'r2', year: '2026', type: 'return', projectName: '年假', occurTime: '2026-01-15 00:00:00', executeTime: '2026-01-15 09:00:00', changeValue: 3, expiryDate: '2026-12-31' },
  { id: 'r3', year: '2026', type: 'deduct', projectName: '年假', occurTime: '2026-04-01 00:00:00', executeTime: '2026-04-01 14:20:30', changeValue: 2, expiryDate: '-' },
]

// 我的请假记录
const mockMyLeaveRequests: MyLeaveRequest[] = [
  {
    id: '1',
    requestNo: 'LR202605001',
    projectName: '年假',
    startDate: '2026-05-15',
    endDate: '2026-05-17',
    days: 3,
    reason: '家人出游',
    status: 'pending',
    createTime: '2026-05-09 10:30',
  },
  {
    id: '2',
    requestNo: 'LR202605002',
    projectName: '病假',
    startDate: '2026-05-20',
    endDate: '2026-05-21',
    days: 2,
    reason: '身体不适需就医',
    status: 'approved',
    createTime: '2026-05-08 09:00',
  },
]

// 状态配置
const statusConfig: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pending: { color: 'blue', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已驳回' },
  withdrawn: { color: 'gray', text: '已撤回' },
}

const MyLeavePage: React.FC = () => {
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null)
  const [leaveDrawerOpen, setLeaveDrawerOpen] = useState(false)
  const [leaveForm] = Form.useForm()

  // 计算请假时长
  const calculateDays = (startDate: dayjs.Dayjs, startNode: string, endDate: dayjs.Dayjs, endNode: string) => {
    const days = endDate.diff(startDate, 'day') + 1
    let result = days
    if (startNode === 'afternoon') result -= 0.5
    if (endNode === 'morning') result -= 0.5
    return result
  }

  // 提交请假申请
  const handleSubmitLeave = () => {
    leaveForm.validateFields().then(values => {
      const days = calculateDays(
        values.startDate,
        values.startNode,
        values.endDate,
        values.endNode
      )
      console.log('提交请假:', values, '天数:', days)
      message.success('提交成功')
      setLeaveDrawerOpen(false)
      leaveForm.resetFields()
    })
  }

  // 保存草稿
  const handleSaveDraft = () => {
    leaveForm.validateFields().then(values => {
      console.log('保存草稿:', values)
      message.success('保存草稿成功')
      setLeaveDrawerOpen(false)
      leaveForm.resetFields()
    })
  }

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 发放记录表格列
  const grantColumns = [
    { title: '序号', key: 'index', width: 60, render: (_: unknown, __: unknown, idx: number) => idx + 1 },
    { title: '年度', dataIndex: 'year', key: 'year', width: 80 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => {
        const map: Record<string, string> = { grant: '发放', deduct: '扣除', return: '返还' }
        const color: Record<string, string> = { grant: 'blue', deduct: 'red', return: 'blue' }
        return <span style={{ color: color[v] || '#333' }}>{map[v] || v}</span>
      },
    },
    { title: '考勤项目', dataIndex: 'projectName', key: 'projectName', width: 100 },
    { title: '发生时间', dataIndex: 'occurTime', key: 'occurTime', width: 160 },
    { title: '执行时间', dataIndex: 'executeTime', key: 'executeTime', width: 160 },
    {
      title: '变化内容',
      dataIndex: 'changeValue',
      key: 'changeValue',
      width: 120,
      render: (v: number, record: GrantRecord) => {
        const isDeduct = record.type === 'deduct'
        return (
          <span style={{ color: isDeduct ? '#cf1322' : '#1677ff', fontWeight: 'bold' }}>
            {isDeduct ? '-' : '+'}{v}
          </span>
        )
      },
    },
    { title: '到期日期', dataIndex: 'expiryDate', key: 'expiryDate', width: 120 },
  ]

  // 请假记录表格列
  const requestColumns = [
    { title: '序号', key: 'index', width: 60, render: (_: unknown, __: unknown, idx: number) => idx + 1 },
    { title: '单据编号', dataIndex: 'requestNo', key: 'requestNo', width: 140 },
    { title: '假期类型', dataIndex: 'projectName', key: 'projectName', width: 100 },
    {
      title: '开始日期',
      key: 'startDate',
      width: 120,
      render: (_: unknown, record: MyLeaveRequest) => record.startDate,
    },
    {
      title: '结束日期',
      key: 'endDate',
      width: 120,
      render: (_: unknown, record: MyLeaveRequest) => record.endDate,
    },
    {
      title: '时长',
      dataIndex: 'days',
      key: 'days',
      width: 80,
      render: (v: number) => `${v}天`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => getStatusTag(v),
    },
    { title: '申请时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
  ]

  // 渲染假期卡片
  const renderLeaveCard = (leave: LeaveType) => {
    const isSelected = selectedLeaveType?.id === leave.id
    const isNegative = leave.remainingDays < 0
    const isLow = leave.remainingDays >= 0 && leave.remainingDays <= 2

    return (
      <div
        key={leave.id}
        onClick={() => setSelectedLeaveType(leave)}
        className={`
          p-4 rounded-lg border cursor-pointer transition-all
          ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'}
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-500" />
            <span className="font-medium text-lg">{leave.name}</span>
          </div>
          <Tag color={leave.type === 'unlimited' ? 'green' : 'blue'}>
            {leave.type === 'unlimited' ? '不限额' : '限额'}
          </Tag>
        </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">剩余</span>
              <span
                className="font-bold text-base"
                style={{
                  color: isNegative ? '#cf1322' : isLow ? '#fa8c16' : '#333',
                }}
              >
                {leave.type === 'unlimited' ? '--' : `${leave.remainingDays} ${leave.unit}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">最近截止日期</span>
              <span className="text-gray-700">{leave.type === 'unlimited' ? '-' : leave.expiryDate}</span>
            </div>
          </div>
      </div>
    )
  }

  // 渲染详情区域
  const renderDetailArea = () => {
    if (!selectedLeaveType) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <CalendarOutlined style={{ fontSize: 64 }} />
            <div className="mt-4 text-lg">请选择左侧假期类型查看详情</div>
          </div>
        </div>
      )
    }

    const leave = selectedLeaveType
    const isNegative = leave.remainingDays < 0
    const isLow = leave.remainingDays >= 0 && leave.remainingDays <= 2

    return (
      <div className="h-full flex flex-col">
        {/* 假期余额概览 */}
        <div className="p-4 border-b bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{leave.name}</span>
              <Tag color={leave.type === 'unlimited' ? 'green' : 'blue'}>
                {leave.type === 'unlimited' ? '不限额' : '限额'}
              </Tag>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip title={isNegative ? '余额不足' : isLow ? '余额较少' : '余额充足'}>
                {isNegative ? (
                  <CloseCircleOutlined className="text-red-500 text-xl" />
                ) : isLow ? (
                  <ExclamationCircleOutlined className="text-orange-500 text-xl" />
                ) : (
                  <CheckCircleOutlined className="text-green-500 text-xl" />
                )}
              </Tooltip>
              <span
                className="text-2xl font-bold"
                style={{
                  color: isNegative ? '#cf1322' : isLow ? '#fa8c16' : '#333',
                }}
              >
                {leave.type === 'unlimited' ? '--' : leave.remainingDays}
              </span>
              <span className="text-gray-500">{leave.unit}</span>
            </div>
          </div>

          {/* 累计发放 & 累计使用 */}
          <div className="flex gap-8 mb-3 pb-3 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">累计发放</span>
              <span className="font-bold text-lg">{leave.type === 'unlimited' ? '-' : `${leave.totalDays} ${leave.unit}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">累计使用</span>
              <span className="font-bold text-lg">{leave.usedDays} {leave.unit}</span>
            </div>
          </div>

          <Descriptions size="small" column={2}>
            <Descriptions.Item label="本年实发">{leave.type === 'unlimited' ? '-' : `${leave.totalDays} ${leave.unit}`}</Descriptions.Item>
            <Descriptions.Item label="当前已用">{leave.usedDays} {leave.unit}</Descriptions.Item>
            <Descriptions.Item label="最近截止日期">{leave.type === 'unlimited' ? '-' : leave.expiryDate}</Descriptions.Item>
            <Descriptions.Item label="剩余可用">
              <span style={{ color: isNegative ? '#cf1322' : '#333', fontWeight: 'bold' }}>
                {leave.type === 'unlimited' ? '--' : `${leave.remainingDays} ${leave.unit}`}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 发放记录 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-base font-medium mb-3 flex items-center gap-2">
            <ClockCircleOutlined />
            发放记录
          </div>
          <Table
            dataSource={mockGrantRecords}
            rowKey="id"
            columns={grantColumns}
            pagination={false}
            size="small"
            summary={() => {
              const totalChange = mockGrantRecords.reduce((sum, r) => {
                if (r.type === 'deduct') return sum - r.changeValue
                return sum + r.changeValue
              }, 0)
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                    <Table.Summary.Cell index={0} colSpan={7}>余额合计</Table.Summary.Cell>
                    <Table.Summary.Cell index={7}>
                      <span style={{ fontWeight: 'bold', color: totalChange < 0 ? '#cf1322' : '#333' }}>
                        {totalChange}
                      </span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex" style={{ height: '100%', overflow: 'hidden' }}>
      {/* 左侧：假期类型列表 */}
      <div className="w-80 flex-shrink-0 border-r bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-lg font-medium">我的假期</div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setLeaveDrawerOpen(true)}
            className="!bg-blue-600"
          >
            请假
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {myLeaveBalances.map(leave => renderLeaveCard(leave))}
          </div>
        </div>
      </div>

      {/* 右侧：详情区域 */}
      <div className="flex-1 overflow-hidden">
        {renderDetailArea()}
      </div>

      {/* 发起请假抽屉 */}
      <Drawer
        title="发起请假申请"
        open={leaveDrawerOpen}
        onClose={() => setLeaveDrawerOpen(false)}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setLeaveDrawerOpen(false)}>取消</Button>
            <Button onClick={handleSaveDraft}>保存草稿</Button>
            <Button
              type="primary"
              onClick={handleSubmitLeave}
              className="!bg-blue-600"
            >
              提交申请
            </Button>
          </div>
        }
      >
        {/* 申请人信息 */}
        <div className="bg-gray-100 p-3 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>工号：E001</div>
            <div>姓名：张三分</div>
            <div>所属单位：贵阳市XX医院总院区</div>
            <div>所属科室：心内科</div>
          </div>
        </div>

        <Form form={leaveForm} layout="vertical">
          <Form.Item
            name="project"
            label={<span className="font-bold">假期类型</span>}
            rules={[{ required: true, message: '请选择假期类型' }]}
          >
            <Select
              placeholder="请选择假期类型"
              options={[
                { label: '年假（剩余 8.5 天）', value: 'AL' },
                { label: '病假（不限额）', value: 'SL' },
                { label: '婚假（剩余 10 天）', value: 'ML' },
                { label: '产假（剩余 120 天）', value: 'PL' },
              ]}
              style={{ width: '100%' }}
            />
          </Form.Item>

          {/* 请假时间 */}
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <Form.Item
                name="startDate"
                label={<span className="font-bold">开始日期</span>}
                rules={[{ required: true, message: '请选择开始日期' }]}
                className="flex-1 mb-0"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="startNode"
                label={<span className="font-bold">节点</span>}
                rules={[{ required: true }]}
                className="mb-0"
              >
                <Radio.Group>
                  <Radio value="morning">上午</Radio>
                  <Radio value="afternoon">下午</Radio>
                </Radio.Group>
              </Form.Item>
            </div>
          </div>

          {/* 结束时间 */}
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <Form.Item
                name="endDate"
                label={<span className="font-bold">结束日期</span>}
                rules={[{ required: true, message: '请选择结束日期' }]}
                className="flex-1 mb-0"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="endNode"
                label={<span className="font-bold">节点</span>}
                rules={[{ required: true }]}
                className="mb-0"
              >
                <Radio.Group>
                  <Radio value="morning">上午</Radio>
                  <Radio value="afternoon">下午</Radio>
                </Radio.Group>
              </Form.Item>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="text-blue-600 font-medium">
              请假时长：<span className="text-lg">-</span> 天
            </div>
          </div>

          <Form.Item
            name="reason"
            label={<span className="font-bold">请假事由</span>}
            rules={[{ required: true, message: '请输入请假事由' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入请假事由（必填，最多200字）" maxLength={200} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default MyLeavePage
