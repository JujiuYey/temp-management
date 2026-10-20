import React, { useState, useMemo } from 'react'
import {
  Button,
  Table,
  Tag,
  Tabs,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Card,
  message,
  Popconfirm,
  Descriptions,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { TextArea } = Input
const { RangePicker } = DatePicker

// 换班申请状态
type SwapStatus = 'draft' | 'pending_confirm' | 'pending_approve' | 'approved' | 'rejected' | 'withdrawn'

// 状态配置
const statusConfig: Record<SwapStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  pending_confirm: { label: '申请中', color: 'processing' },
  pending_approve: { label: '待主任审批', color: 'processing' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
  withdrawn: { label: '已撤回', color: 'default' },
}

// 换班申请数据类型
interface SwapRequest {
  id: string
  applicantId: string
  applicantName: string
  applicantDept: string
  applyDate: string
  applyShift: {
    name: string
    time: string
  }
  returnPersonId: string
  returnPersonName: string
  returnDate: string
  returnShift: {
    name: string
    time: string
  }
  reason: string
  status: SwapStatus
  createTime: string
}

// 当前用户信息
const currentUser = {
  id: 'U001',
  name: '张三',
  dept: '信息科',
  role: 'doctor', // doctor: 普通员工, director: 科室主任
}

// 模拟班组成员数据
const groupMembers = [
  { id: 'U001', name: '张三', dept: '信息科' },
  { id: 'U002', name: '李四', dept: '信息科' },
  { id: 'U003', name: '王五', dept: '信息科' },
  { id: 'U004', name: '赵六', dept: '信息科' },
  { id: 'U005', name: '钱七', dept: '胸外科' },
]

// 班次数据
const shiftTemplates = [
  { name: '早班', time: '08:00-12:00', color: '#52c41a' },
  { name: '中班', time: '14:00-18:00', color: '#1677ff' },
  { name: '晚班', time: '18:00-22:00', color: '#fa8c16' },
  { name: '夜班', time: '22:00-08:00', color: '#722ed1' },
  { name: '值班', time: '08:00-次日08:00', color: '#ff4d4f' },
]

// 模拟申请记录数据
const mockSwapRequests: SwapRequest[] = [
  {
    id: 'SW2026020101',
    applicantId: 'U001',
    applicantName: '张三',
    applicantDept: '信息科',
    applyDate: '2026-02-05',
    applyShift: { name: '早班', time: '08:00-12:00' },
    returnPersonId: 'U002',
    returnPersonName: '李四',
    returnDate: '2026-02-10',
    returnShift: { name: '中班', time: '14:00-18:00' },
    reason: '家中有事，需提前回家处理',
    status: 'pending_confirm',
    createTime: '2026-02-01 10:30:00',
  },
  {
    id: 'SW2026011501',
    applicantId: 'U001',
    applicantName: '张三',
    applicantDept: '信息科',
    applyDate: '2026-01-20',
    applyShift: { name: '夜班', time: '22:00-08:00' },
    returnPersonId: 'U003',
    returnPersonName: '王五',
    returnDate: '2026-01-25',
    returnShift: { name: '值班', time: '08:00-次日08:00' },
    reason: '参加同事婚礼',
    status: 'approved',
    createTime: '2026-01-15 09:00:00',
  },
  {
    id: 'SW2026011001',
    applicantId: 'U001',
    applicantName: '张三',
    applicantDept: '信息科',
    applyDate: '2026-01-12',
    applyShift: { name: '中班', time: '14:00-18:00' },
    returnPersonId: 'U002',
    returnPersonName: '李四',
    returnDate: '2026-01-15',
    returnShift: { name: '早班', time: '08:00-12:00' },
    reason: '身体不适，需休息',
    status: 'rejected',
    createTime: '2026-01-10 14:20:00',
  },
  {
    id: 'SW2026010501',
    applicantId: 'U001',
    applicantName: '张三',
    applicantDept: '信息科',
    applyDate: '2026-01-08',
    applyShift: { name: '值班', time: '08:00-次日08:00' },
    returnPersonId: 'U004',
    returnPersonName: '赵六',
    returnDate: '2026-01-12',
    returnShift: { name: '晚班', time: '18:00-22:00' },
    reason: '临时出差',
    status: 'withdrawn',
    createTime: '2026-01-05 08:00:00',
  },
]

// 模拟已排班次数据（申请人日期列表）
const applicantSchedules: Record<string, { date: string; shift: typeof shiftTemplates[0] }[]> = {
  'U001': [
    { date: '2026-02-03', shift: shiftTemplates[0] },
    { date: '2026-02-05', shift: shiftTemplates[0] },
    { date: '2026-02-07', shift: shiftTemplates[1] },
    { date: '2026-02-09', shift: shiftTemplates[3] },
    { date: '2026-02-11', shift: shiftTemplates[4] },
    { date: '2026-02-13', shift: shiftTemplates[0] },
    { date: '2026-02-15', shift: shiftTemplates[1] },
    { date: '2026-02-17', shift: shiftTemplates[3] },
    { date: '2026-02-19', shift: shiftTemplates[4] },
    { date: '2026-02-21', shift: shiftTemplates[0] },
  ],
  'U002': [
    { date: '2026-02-04', shift: shiftTemplates[0] },
    { date: '2026-02-06', shift: shiftTemplates[1] },
    { date: '2026-02-08', shift: shiftTemplates[3] },
    { date: '2026-02-10', shift: shiftTemplates[1] },
    { date: '2026-02-12', shift: shiftTemplates[4] },
    { date: '2026-02-14', shift: shiftTemplates[0] },
    { date: '2026-02-16', shift: shiftTemplates[1] },
    { date: '2026-02-18', shift: shiftTemplates[3] },
    { date: '2026-02-20', shift: shiftTemplates[4] },
    { date: '2026-02-22', shift: shiftTemplates[0] },
  ],
  'U003': [
    { date: '2026-02-03', shift: shiftTemplates[1] },
    { date: '2026-02-05', shift: shiftTemplates[3] },
    { date: '2026-02-07', shift: shiftTemplates[4] },
    { date: '2026-02-09', shift: shiftTemplates[0] },
    { date: '2026-02-11', shift: shiftTemplates[1] },
    { date: '2026-02-13', shift: shiftTemplates[3] },
    { date: '2026-02-15', shift: shiftTemplates[4] },
    { date: '2026-02-17', shift: shiftTemplates[0] },
    { date: '2026-02-19', shift: shiftTemplates[1] },
    { date: '2026-02-21', shift: shiftTemplates[3] },
  ],
  'U004': [
    { date: '2026-02-02', shift: shiftTemplates[4] },
    { date: '2026-02-04', shift: shiftTemplates[3] },
    { date: '2026-02-06', shift: shiftTemplates[0] },
    { date: '2026-02-08', shift: shiftTemplates[1] },
    { date: '2026-02-10', shift: shiftTemplates[3] },
    { date: '2026-02-12', shift: shiftTemplates[0] },
    { date: '2026-02-14', shift: shiftTemplates[1] },
    { date: '2026-02-16', shift: shiftTemplates[3] },
    { date: '2026-02-18', shift: shiftTemplates[4] },
    { date: '2026-02-20', shift: shiftTemplates[0] },
  ],
}

const ShiftSwapRequest: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SwapRequest | null>(null)
  const [activeTab, setActiveTab] = useState('my-requests')
  const [form] = Form.useForm()

  // 申请记录数据
  const [myRequests, setMyRequests] = useState<SwapRequest[]>(mockSwapRequests)

  // 待确认申请（其他人向我发起的）
  const [confirmRequests, setConfirmRequests] = useState<SwapRequest[]>([
    {
      id: 'SW2026020301',
      applicantId: 'U002',
      applicantName: '李四',
      applicantDept: '信息科',
      applyDate: '2026-02-08',
      applyShift: { name: '早班', time: '08:00-12:00' },
      returnPersonId: 'U001',
      returnPersonName: '张三',
      returnDate: '2026-02-12',
      returnShift: { name: '中班', time: '14:00-18:00' },
      reason: '家中有急事，需临时调班',
      status: 'pending_confirm',
      createTime: '2026-02-03 08:00:00',
    },
    {
      id: 'SW2026020501',
      applicantId: 'U003',
      applicantName: '王五',
      applicantDept: '信息科',
      applyDate: '2026-02-10',
      applyShift: { name: '夜班', time: '22:00-08:00' },
      returnPersonId: 'U001',
      returnPersonName: '张三',
      returnDate: '2026-02-15',
      returnShift: { name: '值班', time: '08:00-次日08:00' },
      reason: '临时有会议参加',
      status: 'pending_confirm',
      createTime: '2026-02-05 10:00:00',
    },
  ])

  // 待审批申请（双方确认后，需主任审批）
  const [approveRequests, setApproveRequests] = useState<SwapRequest[]>([
    {
      id: 'SW2026020201',
      applicantId: 'U002',
      applicantName: '李四',
      applicantDept: '信息科',
      applyDate: '2026-02-06',
      applyShift: { name: '中班', time: '14:00-18:00' },
      returnPersonId: 'U001',
      returnPersonName: '张三',
      returnDate: '2026-02-09',
      returnShift: { name: '早班', time: '08:00-12:00' },
      reason: '个人安排调整',
      status: 'pending_approve',
      createTime: '2026-02-02 09:30:00',
    },
  ])

  // 申请记录表格列
  const myRequestColumns: ColumnsType<SwapRequest> = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
    },
    {
      title: '换班日期',
      dataIndex: 'applyDate',
      key: 'applyDate',
      width: 100,
    },
    {
      title: '换班班次',
      dataIndex: 'applyShift',
      key: 'applyShift',
      width: 140,
      render: (shift) => (
        <span>
          <Tag color={shiftTemplates.find(s => s.name === shift.name)?.color}>
            {shift.name} {shift.time}
          </Tag>
        </span>
      ),
    },
    {
      title: '还班人',
      dataIndex: 'returnPersonName',
      key: 'returnPersonName',
      width: 80,
    },
    {
      title: '还班日期',
      dataIndex: 'returnDate',
      key: 'returnDate',
      width: 100,
    },
    {
      title: '还班班次',
      dataIndex: 'returnShift',
      key: 'returnShift',
      width: 140,
      render: (shift) => (
        <span>
          <Tag color={shiftTemplates.find(s => s.name === shift.name)?.color}>
            {shift.name} {shift.time}
          </Tag>
        </span>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SwapStatus) => (
        <Tag color={statusConfig[status].color}>
          {statusConfig[status].label}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRecord(record)
              setDetailVisible(true)
            }}
            className="!bg-blue-50 !border !border-blue-200"
          >
            查看详情
          </Button>
          {record.status === 'pending_confirm' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<UndoOutlined />}
              onClick={() => handleWithdraw(record.id)}
              className="!bg-red-50 !border !border-red-200"
            >
              撤回
            </Button>
          )}
        </Space>
      ),
    },
  ]

  // 待确认申请列
  const confirmColumns: ColumnsType<SwapRequest> = [
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 70,
    },
    {
      title: '换班日期',
      dataIndex: 'applyDate',
      key: 'applyDate',
      width: 100,
    },
    {
      title: '换班班次',
      dataIndex: 'applyShift',
      key: 'applyShift',
      width: 110,
      render: (shift) => (
        <Tag color={shiftTemplates.find(s => s.name === shift.name)?.color}>
          {shift.name} {shift.time}
        </Tag>
      ),
    },
    {
      title: '换班原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 140,
      ellipsis: true,
    },
    {
      title: '还班日期',
      dataIndex: 'returnDate',
      key: 'returnDate',
      width: 100,
    },
    {
      title: '还班班次',
      dataIndex: 'returnShift',
      key: 'returnShift',
      width: 110,
      render: (shift) => (
        <Tag color={shiftTemplates.find(s => s.name === shift.name)?.color}>
          {shift.name} {shift.time}
        </Tag>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 140,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRecord(record)
              setDetailVisible(true)
            }}
            className="!bg-blue-50 !border !border-blue-200"
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<CheckOutlined />}
            type="primary"
            onClick={() => handleConfirm(record.id)}
          >
            同意
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record.id)}
            className="!bg-red-50 !border !border-red-200"
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ]

  // 待审批申请列
  const approveColumns: ColumnsType<SwapRequest> = [
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 100,
    },
    {
      title: '换班日期',
      dataIndex: 'applyDate',
      key: 'applyDate',
      width: 100,
    },
    {
      title: '换班班次',
      dataIndex: 'applyShift',
      key: 'applyShift',
      width: 140,
      render: (shift) => (
        <Tag color={shiftTemplates.find(s => s.name === shift.name)?.color}>
          {shift.name} {shift.time}
        </Tag>
      ),
    },
    {
      title: '还班人',
      dataIndex: 'returnPersonName',
      key: 'returnPersonName',
      width: 80,
    },
    {
      title: '还班日期',
      dataIndex: 'returnDate',
      key: 'returnDate',
      width: 100,
    },
    {
      title: '还班班次',
      dataIndex: 'returnShift',
      key: 'returnShift',
      width: 140,
      render: (shift) => (
        <Tag color={shiftTemplates.find(s => s.name === shift.name)?.color}>
          {shift.name} {shift.time}
        </Tag>
      ),
    },
    {
      title: '换班原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRecord(record)
              setDetailVisible(true)
            }}
            className="!bg-blue-50 !border !border-blue-200"
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<CheckOutlined />}
            type="primary"
            onClick={() => handleApprove(record.id)}
          >
            通过
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleRejectApprove(record.id)}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ]

  // 还班人变更时，获取其已排班次日期列表
  const handleReturnPersonChange = (personId: string) => {
    form.setFieldsValue({ returnDate: null, returnShift: null })
    // 数据已在前端准备好，可通过接口获取
  }

  // 换班日期变更时，自动带出班次
  const handleApplyDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const dateStr = date.format('YYYY-MM-DD')
      const schedule = applicantSchedules[currentUser.id]?.find(s => s.date === dateStr)
      if (schedule) {
        form.setFieldsValue({ applyShift: `${schedule.shift.name} ${schedule.shift.time}` })
      } else {
        form.setFieldsValue({ applyShift: null })
      }
    } else {
      form.setFieldsValue({ applyShift: null })
    }
  }

  // 还班日期变更时，自动带出班次
  const handleReturnDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const dateStr = date.format('YYYY-MM-DD')
      const returnPersonId = form.getFieldValue('returnPersonId')
      const schedule = applicantSchedules[returnPersonId]?.find(s => s.date === dateStr)
      if (schedule) {
        form.setFieldsValue({ returnShift: `${schedule.shift.name} ${schedule.shift.time}` })
      } else {
        form.setFieldsValue({ returnShift: null })
      }
    } else {
      form.setFieldsValue({ returnShift: null })
    }
  }

  // 提交申请
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const newRequest: SwapRequest = {
        id: `SW${dayjs().format('YYYYMMDDHHmmss')}`,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantDept: currentUser.dept,
        applyDate: values.applyDate.format('YYYY-MM-DD'),
        applyShift: { name: values.applyShift.split(' ')[0], time: values.applyShift.split(' ')[1] },
        returnPersonId: values.returnPersonId,
        returnPersonName: groupMembers.find(m => m.id === values.returnPersonId)?.name || '',
        returnDate: values.returnDate.format('YYYY-MM-DD'),
        returnShift: { name: values.returnShift.split(' ')[0], time: values.returnShift.split(' ')[1] },
        reason: values.reason,
        status: 'pending_confirm',
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }

      setMyRequests(prev => [newRequest, ...prev])
      message.success('换班申请提交成功')
      setDrawerVisible(false)
      form.resetFields()
    })
  }

  // 撤回申请
  const handleWithdraw = (id: string) => {
    setMyRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'withdrawn' as SwapStatus } : req
      )
    )
    message.success('申请已撤回')
  }

  // 同意换班（待确认）
  const handleConfirm = (id: string) => {
    // 更新状态而不是清除记录
    setConfirmRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'pending_approve' as SwapStatus } : req
      )
    )
    message.success('已同意换班申请，等待主任审批')
  }

  // 拒绝换班（待确认）
  const handleReject = (id: string) => {
    setMyRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'rejected' as SwapStatus } : req
      )
    )
    setConfirmRequests(prev => prev.filter(req => req.id !== id))
    message.info('已拒绝换班申请')
  }

  // 通过审批（待审批）
  const handleApprove = (id: string) => {
    setApproveRequests(prev => prev.filter(req => req.id !== id))
    // 更新原申请状态
    setMyRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'approved' as SwapStatus } : req
      )
    )
    message.success('换班申请已通过审批')
  }

  // 驳回审批（待审批）
  const handleRejectApprove = (id: string) => {
    setApproveRequests(prev => prev.filter(req => req.id !== id))
    setMyRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'rejected' as SwapStatus } : req
      )
    )
    message.info('换班申请已被驳回')
  }

  // 可选择的还班人列表（本分组内其他成员，排除自己）
  const availableReturnPersons = useMemo(() => {
    return groupMembers
      .filter(m => m.id !== currentUser.id && m.dept === currentUser.dept)
      .map(m => ({ label: m.name, value: m.id }))
  }, [])

  // 当前用户已排班日期列表
  const myScheduledDates = useMemo(() => {
    return applicantSchedules[currentUser.id]?.map(s => ({
      label: `${s.date} ${s.shift.name}`,
      value: s.date,
    })) || []
  }, [])

  return (
    <div className="p-4">
      {/* Tab切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'my-requests',
            label: '我的申请',
            children: (
              <div>
                {/* 操作栏 */}
                <div className="mb-4 flex justify-between items-center">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setDrawerVisible(true)}
                  >
                    发起换班申请
                  </Button>
                </div>

                {/* 申请记录表格 */}
                <Table
                  columns={myRequestColumns}
                  dataSource={myRequests}
                  rowKey="id"
                  pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条`, position: ['bottomLeft'] }}
                  scroll={{ x: 1200 }}
                />
              </div>
            ),
          },
          {
            key: 'pending',
            label: '待我确认',
            children: (
              <div>
                {/* 待我确认部分 */}
                <Card
                  className="mb-4"
                  bordered={false}
                >
                  {confirmRequests.length > 0 ? (
                    <Table
                      columns={confirmColumns}
                      dataSource={confirmRequests}
                      rowKey="id"
                      pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条`, position: ['bottomLeft'] }}
                      scroll={{ x: 1100 }}
                    />
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      暂无待确认的换班申请
                    </div>
                  )}
                </Card>

                {/* 待我审批部分（仅科室主任可见） */}
                {currentUser.role === 'director' && (
                  <Card
                    title={<span className="text-orange-600 font-medium">待我审批</span>}
                    bordered={false}
                  >
                    {approveRequests.length > 0 ? (
                      <Table
                        columns={approveColumns}
                        dataSource={approveRequests}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 1000 }}
                      />
                    ) : (
                      <div className="text-gray-400 text-center py-8">
                        暂无待审批的换班申请
                      </div>
                    )}
                  </Card>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* 发起换班申请抽屉 */}
      <Drawer
        title="发起换班申请"
        width={600}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false)
          form.resetFields()
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setDrawerVisible(false)
              form.resetFields()
            }}>
              取消
            </Button>
            <Button type="primary" onClick={handleSubmit}>
              提交申请
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
        >
          {/* 申请人信息 */}
          <Card title="申请人信息" size="small" className="mb-4 bg-gray-50">
            <Descriptions column={3} size="small">
              <Descriptions.Item label="工号">{currentUser.id}</Descriptions.Item>
              <Descriptions.Item label="姓名">{currentUser.name}</Descriptions.Item>
              <Descriptions.Item label="所属科室">{currentUser.dept}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 换班信息区 */}
          <Card title="换班信息" size="small" className="mb-4">
            <Form.Item
              name="applyDate"
              label="申请换班日期"
              rules={[{ required: true, message: '请选择换班日期' }]}
            >
              <Select
                placeholder="请选择申请换班的日期"
                options={myScheduledDates}
                onChange={(value) => handleApplyDateChange(dayjs(value))}
              />
            </Form.Item>
            <Form.Item
              name="applyShift"
              label="申请换的班次"
            >
              <Input placeholder="根据排班记录自动带出" disabled />
            </Form.Item>
          </Card>

          {/* 还班信息区 */}
          <Card
            title="还班信息"
            size="small"
            className="mb-4"
            style={{ border: '1px solid #1677ff' }}
          >
            <Form.Item
              name="returnPersonId"
              label="还班人员"
              rules={[{ required: true, message: '请选择还班人员' }]}
            >
              <Select
                placeholder="请选择还班人员"
                options={availableReturnPersons}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onChange={handleReturnPersonChange}
              />
            </Form.Item>
            <Form.Item
              name="returnDate"
              label="还班日期"
              rules={[{ required: true, message: '请选择还班日期' }]}
            >
              <Select
                placeholder="请选择还班日期"
                options={[]}
                onChange={(value) => handleReturnDateChange(dayjs(value))}
              />
            </Form.Item>
            <Form.Item
              name="returnShift"
              label="还班班次"
            >
              <Input placeholder="根据还班人排班自动带出" disabled />
            </Form.Item>
          </Card>

          {/* 换班原因 */}
          <Form.Item
            name="reason"
            label="换班原因"
            rules={[{ required: true, message: '请填写换班原因' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入换班原因（必填）"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 查看详情抽屉 */}
      <Drawer
        title="申请详情"
        width={600}
        open={detailVisible}
        onClose={() => {
          setDetailVisible(false)
          setSelectedRecord(null)
        }}
      >
        {selectedRecord && (
          <div>
            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label="申请编号" span={2}>
                {selectedRecord.id}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {selectedRecord.applicantName}
              </Descriptions.Item>
              <Descriptions.Item label="所属科室">
                {selectedRecord.applicantDept}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间" span={2}>
                {selectedRecord.createTime}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[selectedRecord.status].color}>
                  {statusConfig[selectedRecord.status].label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Card title="换班信息" size="small" className="mb-4">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="换班日期">
                  {selectedRecord.applyDate}
                </Descriptions.Item>
                <Descriptions.Item label="换班班次">
                  <Tag color={shiftTemplates.find(s => s.name === selectedRecord.applyShift.name)?.color}>
                    {selectedRecord.applyShift.name} {selectedRecord.applyShift.time}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="还班信息" size="small" className="mb-4">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="还班人">
                  {selectedRecord.returnPersonName}
                </Descriptions.Item>
                <Descriptions.Item label="还班日期">
                  {selectedRecord.returnDate}
                </Descriptions.Item>
                <Descriptions.Item label="还班班次" span={2}>
                  <Tag color={shiftTemplates.find(s => s.name === selectedRecord.returnShift.name)?.color}>
                    {selectedRecord.returnShift.name} {selectedRecord.returnShift.time}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="换班原因" size="small">
              <p className="text-gray-700">{selectedRecord.reason}</p>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default ShiftSwapRequest
