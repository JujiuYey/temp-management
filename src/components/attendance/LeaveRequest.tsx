import React, { useState, useMemo } from 'react'
import {
  Button,
  Table,
  Input,
  Select,
  Space,
  Tag,
  message,
  Drawer,
  Form,
  Radio,
  DatePicker,
  Popconfirm,
  Tooltip,
  Upload,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  RollbackOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker


// 类型定义
interface LeaveRequest {
  id: string
  requestNo: string
  projectCode: string
  projectName: string
  employeeName: string
  department: string
  startDate: string
  startNode: 'morning' | 'afternoon'
  endDate: string
  endNode: 'morning' | 'afternoon'
  days: number
  reason: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancel_pending' | 'cancel_approved'
  createTime: string
  employeeNo: string
  // 销假字段
  hasCancel: boolean
  cancelResult: 'pass' | 'fail' | null
  cancelApplyTime: string | null
  cancelStartDate: string | null
  cancelEndDate: string | null
  cancelDays: number | null
  cancelNode: 'morning' | 'afternoon' | null
}

// 模拟数据
const mockMyRequests: LeaveRequest[] = [
  {
    id: '1',
    requestNo: 'LR202605001',
    projectCode: 'AL',
    projectName: '年假',
    employeeName: '张三分',
    department: '心内科',
    startDate: '2026-05-15',
    startNode: 'morning',
    endDate: '2026-05-17',
    endNode: 'afternoon',
    days: 3,
    reason: '家人出游',
    status: 'pending',
    createTime: '2026-05-09 10:30',
    employeeNo: 'E001',
    hasCancel: false,
    cancelResult: null,
    cancelApplyTime: null,
    cancelStartDate: null,
    cancelEndDate: null,
    cancelDays: null,
    cancelNode: null,
  },
  {
    id: '2',
    requestNo: 'LR202605002',
    projectCode: 'SL',
    projectName: '病假',
    employeeName: '张三分',
    department: '心内科',
    startDate: '2026-05-20',
    startNode: 'morning',
    endDate: '2026-05-21',
    endNode: 'afternoon',
    days: 2,
    reason: '身体不适需就医',
    status: 'approved',
    createTime: '2026-05-08 09:00',
    employeeNo: 'E001',
    hasCancel: false,
    cancelResult: null,
    cancelApplyTime: null,
    cancelStartDate: null,
    cancelEndDate: null,
    cancelDays: null,
    cancelNode: null,
  },
  {
    id: '3',
    requestNo: 'LR202605003',
    projectCode: 'AL',
    projectName: '年假',
    employeeName: '张三分',
    department: '心内科',
    startDate: '2026-06-01',
    startNode: 'morning',
    endDate: '2026-06-05',
    endNode: 'afternoon',
    days: 5,
    reason: '端午假期',
    status: 'approved',
    createTime: '2026-05-09 14:00',
    employeeNo: 'E001',
    hasCancel: true,
    cancelResult: 'fail',
    cancelApplyTime: '2026-05-28 16:00',
    cancelStartDate: '2026-06-01',
    cancelEndDate: '2026-06-03',
    cancelDays: 3,
    cancelNode: 'morning',
  },
]

const LeaveRequestPage: React.FC = () => {
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>(mockMyRequests)

  // 筛选条件
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null])
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // 抽屉
  const [leaveDrawerVisible, setLeaveDrawerVisible] = useState(false)
  const [cancelDrawerVisible, setCancelDrawerVisible] = useState(false)
  const [leaveForm] = Form.useForm()
  const [cancelForm] = Form.useForm()

  // 当前余额（模拟）
  const currentBalance = 8

  // 计算请假时长
  const calculateDays = (startDate: dayjs.Dayjs, startNode: string, endDate: dayjs.Dayjs, endNode: string) => {
    const days = endDate.diff(startDate, 'day') + 1
    let result = days
    if (startNode === 'afternoon') result -= 0.5
    if (endNode === 'morning') result -= 0.5
    return result
  }

  // 筛选后的数据
  const filteredMyRequests = useMemo(() => {
    return myRequests.filter(r => {
      const matchProject = !projectFilter || r.projectCode === projectFilter
      const matchStatus = !statusFilter || r.status === statusFilter
      return matchProject && matchStatus
    })
  }, [myRequests, projectFilter, statusFilter])

  // 提交请假
  const handleSubmitLeave = () => {
    leaveForm.validateFields().then(values => {
      const days = calculateDays(
        values.startDate,
        values.startNode,
        values.endDate,
        values.endNode
      )

      const newRequest: LeaveRequest = {
        id: `lr${Date.now()}`,
        requestNo: `LR${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
        projectCode: values.project,
        projectName: '年假',
        employeeName: '张三分',
        department: '心内科',
        startDate: values.startDate.format('YYYY-MM-DD'),
        startNode: values.startNode,
        endDate: values.endDate.format('YYYY-MM-DD'),
        endNode: values.endNode,
        days,
        reason: values.reason,
        status: 'pending',
        createTime: new Date().toLocaleString(),
        employeeNo: 'E001',
        hasCancel: false,
        cancelResult: null,
        cancelApplyTime: null,
        cancelStartDate: null,
        cancelEndDate: null,
        cancelDays: null,
        cancelNode: null,
      }

      setMyRequests([newRequest, ...myRequests])
      setLeaveDrawerVisible(false)
      leaveForm.resetFields()
      message.success('提交成功')
    })
  }

  // 保存草稿
  const handleSaveDraft = () => {
    leaveForm.validateFields().then(values => {
      const days = calculateDays(
        values.startDate,
        values.startNode,
        values.endDate,
        values.endNode
      )

      const newRequest: LeaveRequest = {
        id: `lr${Date.now()}`,
        requestNo: `LR${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
        projectCode: values.project,
        projectName: '年假',
        employeeName: '张三分',
        department: '心内科',
        startDate: values.startDate.format('YYYY-MM-DD'),
        startNode: values.startNode,
        endDate: values.endDate.format('YYYY-MM-DD'),
        endNode: values.endNode,
        days,
        reason: values.reason,
        status: 'draft',
        createTime: new Date().toLocaleString(),
        employeeNo: 'E001',
        hasCancel: false,
        cancelResult: null,
        cancelApplyTime: null,
        cancelStartDate: null,
        cancelEndDate: null,
        cancelDays: null,
        cancelNode: null,
      }

      setMyRequests([newRequest, ...myRequests])
      setLeaveDrawerVisible(false)
      leaveForm.resetFields()
      message.success('保存草稿成功')
    })
  }

  // 撤回申请
  const handleWithdraw = (request: LeaveRequest) => {
    setMyRequests(myRequests.map(r =>
      r.id === request.id ? { ...r, status: 'withdrawn' as const } : r
    ))
    message.success('已撤回')
  }

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      pending: { color: 'blue', text: '待审核' },
      approved: { color: 'green', text: '已完成' },
      rejected: { color: 'red', text: '已驳回' },
      withdrawn: { color: 'gray', text: '已撤回' },
      cancel_pending: { color: 'orange', text: '销假待审' },
      cancel_approved: { color: 'cyan', text: '已销假' },
    }
    const { color, text } = config[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  // 重置筛选
  const handleReset = () => {
    setProjectFilter(null)
    setDateRange([null, null])
    setStatusFilter(null)
  }

  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '工号',
      dataIndex: 'employeeNo',
      key: 'employeeNo',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
    },
    {
      title: '科室',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '申请状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => getStatusTag(v),
    },
    {
      title: '假勤类型',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 100,
    },
    {
      title: '开始日期',
      key: 'startDate',
      width: 150,
      render: (_: unknown, record: LeaveRequest) => `${record.startDate} ${record.startNode === 'morning' ? '上午' : '下午'}`,
    },
    {
      title: '结束日期',
      key: 'endDate',
      width: 150,
      render: (_: unknown, record: LeaveRequest) => `${record.endDate} ${record.endNode === 'morning' ? '上午' : '下午'}`,
    },
    {
      title: '请假天数',
      dataIndex: 'days',
      key: 'days',
      width: 80,
      render: (v: number) => `${v}天`,
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
    },
    {
      title: '销假状态',
      key: 'cancelResult',
      width: 100,
      render: (_: unknown, record: LeaveRequest) => {
        if (!record.hasCancel) return '-'
        if (record.cancelResult === 'pass') {
          return <Tag color="green">已完成</Tag>
        }
        if (record.cancelResult === 'fail') {
          return <Tag color="orange">待审核</Tag>
        }
        return '-'
      },
    },
    {
      title: '销假申请时间',
      dataIndex: 'cancelApplyTime',
      key: 'cancelApplyTime',
      width: 160,
      render: (v: string | null) => v || '-',
    },
    {
      title: '到岗时间',
      key: 'cancelRange',
      width: 180,
      render: (_: unknown, record: LeaveRequest) => {
        if (!record.cancelStartDate) return '-'
        return `${record.cancelStartDate} ${record.cancelNode === 'morning' ? '上午' : '下午'}`
      },
    },
    {
      title: '销假时长',
      dataIndex: 'cancelDays',
      key: 'cancelDays',
      width: 80,
      render: (v: number | null) => (v != null ? `${v}天` : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: LeaveRequest) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />}>
            查看
          </Button>
          {record.status === 'pending' && (
            <Popconfirm
              title="确定撤回该申请？"
              onConfirm={() => handleWithdraw(record)}
            >
              <Button size="small" icon={<RollbackOutlined />}>
                撤回
              </Button>
            </Popconfirm>
          )}
          {record.status === 'approved' && !record.hasCancel && (
            <Button
              size="small"
              type="primary"
              icon={<RollbackOutlined />}
              onClick={() => setCancelDrawerVisible(true)}
              className="!bg-blue-600 hover:!bg-blue-700"
            >
              发起销假
            </Button>
          )}
          {record.cancelResult === 'fail' && (
            <Popconfirm
              title="确定撤回该销假申请？"
              onConfirm={() => message.success('已撤回销假')}
            >
              <Button size="small" icon={<RollbackOutlined />}>
                撤回销假
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 筛选栏 */}
      <div className="p-4 mb-4 flex items-center justify-between">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setLeaveDrawerVisible(true)}
          style={{ height: 32 }}
          className="!bg-blue-600 hover:!bg-blue-700"
        >
          新增
        </Button>
        <Space size="middle" wrap>
          <Select
            placeholder="假期类型"
            value={projectFilter}
            onChange={setProjectFilter}
            allowClear
            style={{ width: 140 }}
            options={[
              { label: '年假', value: 'AL' },
              { label: '病假', value: 'SL' },
              { label: '婚假', value: 'ML' },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
            style={{ width: 240 }}
          />
          <Select
            placeholder="状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 100 }}
            options={[
              { label: '草稿', value: 'draft' },
              { label: '待审核', value: 'pending' },
              { label: '已通过', value: 'approved' },
              { label: '已驳回', value: 'rejected' },
            ]}
          />
          <Button type="primary" style={{ height: 32 }}>查询</Button>
          <Button style={{ height: 32 }} onClick={handleReset}>重置</Button>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={filteredMyRequests}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
          position: ['bottomLeft'],
        }}
        size="middle"
      />

      {/* 发起请假抽屉 */}
      <Drawer
        title="发起请假申请"
        open={leaveDrawerVisible}
        onClose={() => setLeaveDrawerVisible(false)}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setLeaveDrawerVisible(false)}>取消</Button>
            <Button onClick={handleSaveDraft}>保存草稿</Button>
            <Button
              type="primary"
              onClick={handleSubmitLeave}
              disabled={currentBalance <= 0}
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
            <div>所属单位：内科</div>
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
                { label: '年假', value: 'AL' },
                { label: '病假', value: 'SL' },
                { label: '婚假', value: 'ML' },
              ]}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-600 font-medium">
              当前余额：{currentBalance}天
            </span>
            {currentBalance <= 2 && (
              <Tooltip title="余额不足">
                <ExclamationCircleOutlined className="text-red-500" />
              </Tooltip>
            )}
          </div>

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
              请假时长：<span className="text-lg">3</span> 天
            </div>
          </div>

          <Form.Item
            name="reason"
            label={<span className="font-bold">请假事由</span>}
            rules={[{ required: true, message: '请输入请假事由' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入请假事由（必填，最多200字）" maxLength={200} />
          </Form.Item>

          <Form.Item label={<span className="font-bold">附件上传</span>}>
            <Upload>
              <Button icon={<PlusOutlined />}>点击上传</Button>
            </Upload>
            <div className="text-gray-400 text-sm mt-1">根据考勤项目设置，可能为必填项</div>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 发起销假抽屉 */}
      <Drawer
        title="发起销假申请"
        open={cancelDrawerVisible}
        onClose={() => setCancelDrawerVisible(false)}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCancelDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => setCancelDrawerVisible(false)} className="!bg-blue-600">
              提交
            </Button>
          </div>
        }
      >
        <Form form={cancelForm} layout="vertical">
          {/* 请假单汇总 */}
          <div className="bg-gray-100 p-3 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>申请人：张三分</div>
              <div>假期类型：年假</div>
              <div>请假时间：2026-05-20 至 2026-05-21</div>
              <div>请假天数：2天</div>
            </div>
          </div>

          {/* 到岗日期 */}
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <Form.Item
                name="returnDate"
                label={<span className="font-bold">到岗日期</span>}
                rules={[{ required: true, message: '请选择到岗日期' }]}
                className="flex-1 mb-0"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="returnNode"
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
            <div className="text-green-600 font-medium">
              销假<span className="text-lg">1</span>天
            </div>
          </div>

          <Form.Item label={<span className="font-bold">销假事由</span>}>
            <Input.TextArea rows={3} placeholder="请输入销假事由" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default LeaveRequestPage
