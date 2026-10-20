import React, { useState } from 'react'
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
  DatePicker,
  Popconfirm,
  InputNumber,
  Radio,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  RollbackOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { TextArea } = Input

// 类型定义
interface OvertimeRecord {
  id: string
  requestNo: string
  overtimeType: 'normal' | 'holiday'
  projectName: string
  startTime: string
  endTime: string
  hours: number
  subsidyType: string
  subsidyContent: string
  reason: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn'
  createTime: string
  employeeName: string
  employeeNo: string
}

// 模拟数据（合并所有记录）
const mockOvertimeRecords: OvertimeRecord[] = [
  {
    id: '1',
    requestNo: 'OT202605001',
    overtimeType: 'normal',
    projectName: '平日加班',
    startTime: '2026-05-10 18:00',
    endTime: '2026-05-10 21:00',
    hours: 3,
    subsidyType: '调休',
    subsidyContent: '可换算3小时调休时间',
    reason: '项目紧急上线',
    status: 'pending',
    createTime: '2026-05-10 17:00',
    employeeName: '张三',
    employeeNo: 'E001',
  },
  {
    id: '2',
    requestNo: 'OT202605002',
    overtimeType: 'holiday',
    projectName: '节假日加班',
    startTime: '2026-05-01 09:00',
    endTime: '2026-05-01 17:00',
    hours: 8,
    subsidyType: '加班费',
    subsidyContent: '按日薪的3倍计算',
    reason: '节假日值班',
    status: 'approved',
    createTime: '2026-04-28 10:00',
    employeeName: '张三',
    employeeNo: 'E001',
  },
  {
    id: '3',
    requestNo: 'OT202605003',
    overtimeType: 'normal',
    projectName: '平日加班',
    startTime: '2026-05-11 18:30',
    endTime: '2026-05-11 22:00',
    hours: 3.5,
    subsidyType: '调休',
    subsidyContent: '可换算3.5小时调休时间',
    reason: '月度报告整理',
    status: 'pending',
    createTime: '2026-05-11 17:00',
    employeeName: '李四',
    employeeNo: 'E002',
  },
]

const OvertimeRequestPage: React.FC = () => {
  const [records] = useState<OvertimeRecord[]>(mockOvertimeRecords)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null)
  const [form] = Form.useForm()

  // 计算加班时长
  const calculateHours = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
    return end.diff(start, 'hour', true)
  }

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      pending: { color: 'blue', text: '待审核' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已驳回' },
      withdrawn: { color: 'gray', text: '已撤回' },
    }
    const { color, text } = config[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  // 表格列定义
  const columns = [
    {
      title: '申请编号',
      dataIndex: 'requestNo',
      key: 'requestNo',
      width: 140,
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 120,
      render: (_: unknown, record: OvertimeRecord) => `${record.employeeName}(${record.employeeNo})`,
    },
    {
      title: '加班类型',
      dataIndex: 'overtimeType',
      key: 'overtimeType',
      width: 100,
      render: (v: 'normal' | 'holiday') => v === 'normal' ? '常规加班' : '节假日加班',
    },
    {
      title: '加班项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 120,
    },
    {
      title: '加班日期',
      key: 'date',
      width: 120,
      render: (_: unknown, record: OvertimeRecord) => record.startTime.split(' ')[0],
    },
    {
      title: '加班时长',
      dataIndex: 'hours',
      key: 'hours',
      width: 100,
      render: (v: number) => `${v}小时`,
    },
    {
      title: '补贴方式',
      dataIndex: 'subsidyType',
      key: 'subsidyType',
      width: 100,
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
      render: (v: string) => getStatusTag(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: OvertimeRecord) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => {
            setSelectedRecord(record)
            setDetailDrawerVisible(true)
          }}>
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                icon={<UndoOutlined />}
                onClick={() => message.success('已撤回')}
                className="!bg-blue-50 !border !border-blue-200"
              >
                撤回
              </Button>
              <Popconfirm
                title="确定删除该加班申请？"
                onConfirm={() => message.success('已删除')}
              >
                <Button
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 筛选区 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields()
              setDrawerVisible(true)
            }}
            className="!bg-blue-600"
          >
            发起加班申请
          </Button>
          <Space size="middle">
            <Input placeholder="姓名" style={{ width: 120 }} prefix={<SearchOutlined />} />
            <Select
              placeholder="加班类型"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '常规加班', value: 'normal' },
                { label: '节假日加班', value: 'holiday' },
              ]}
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '待审核', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已驳回', value: 'rejected' },
                { label: '已撤回', value: 'withdrawn' },
              ]}
            />
            <Button type="primary" className="!bg-blue-600">查询</Button>
            <Button>重置</Button>
          </Space>
        </div>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
          showQuickJumper: true,
        }}
        size="middle"
      />

      {/* 发起加班申请抽屉 */}
      <Drawer
        title="发起加班申请"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => {
              form.validateFields().then(values => {
                const start = values.startTime
                const end = values.endTime
                const hours = calculateHours(start, end)
                message.success('提交成功')
                setDrawerVisible(false)
                form.resetFields()
              })
            }} className="!bg-blue-600">
              提交申请
            </Button>
          </div>
        }
      >
        {/* 申请人信息 */}
        <Form.Item
          name="employee"
          label="选择人员"
          rules={[{ required: true, message: '请输入工号选择人员' }]}
        >
          <Input placeholder="请输入工号" />
        </Form.Item>

        {/* 申请人信息展示 */}
        <div className="bg-gray-100 p-3 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>工号：-</div>
            <div>姓名：-</div>
            <div>所属单位：-</div>
            <div>所属科室：-</div>
          </div>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="project"
            label="加班项目"
            rules={[{ required: true, message: '请选择加班项目' }]}
          >
            <Select
              placeholder="请选择加班项目"
              options={[
                { label: '平日加班', value: 'normal' },
                { label: '节假日加班', value: 'holiday' },
              ]}
            />
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              name="startTime"
              label="加班开始时间"
              rules={[{ required: true, message: '请选择开始时间' }]}
              className="flex-1"
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="endTime"
              label="加班结束时间"
              rules={[{ required: true, message: '请选择结束时间' }]}
              className="flex-1"
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="text-blue-600 font-medium">
              加班时长：<span className="text-lg">0</span> 小时
            </div>
          </div>

          <div className="bg-gray-100 p-3 rounded-lg mb-4">
            <div className="text-sm space-y-1">
              <div className="flex gap-4">
                <span className="text-gray-500">补贴方式：</span>
                <span>调休</span>
              </div>
              <div className="flex gap-4">
                <span className="text-gray-500">补贴内容：</span>
                <span>可换算调休时间</span>
              </div>
            </div>
          </div>

          {/* 警告提示 */}
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4 text-red-600 text-sm hidden">
            {/* 系统自动校验提示 */}
          </div>

          <Form.Item
            name="reason"
            label="加班说明"
            rules={[{ required: true, message: '请输入加班说明' }]}
          >
            <TextArea rows={4} placeholder="请输入加班说明（必填）" />
          </Form.Item>

          <Form.Item label="附件上传">
            <Button icon={<PlusOutlined />}>点击上传</Button>
            <div className="text-gray-400 text-sm mt-1">根据加班项目设置，可能为必填项</div>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 查看详情抽屉 */}
      <Drawer
        title="加班申请详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={520}
      >
        {selectedRecord && (
          <div>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>申请编号：{selectedRecord.requestNo}</div>
                <div>申请人：{selectedRecord.employeeName}</div>
                <div>加班类型：{selectedRecord.overtimeType === 'normal' ? '常规加班' : '节假日加班'}</div>
                <div>加班项目：{selectedRecord.projectName}</div>
                <div>加班时长：{selectedRecord.hours}小时</div>
                <div>状态：{getStatusTag(selectedRecord.status)}</div>
              </div>
            </div>

            <h4 className="font-bold mb-3">加班时间</h4>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <div>{selectedRecord.startTime} 至 {selectedRecord.endTime}</div>
            </div>

            <h4 className="font-bold mb-3">补贴信息</h4>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>补贴方式：{selectedRecord.subsidyType}</div>
                <div>补贴内容：{selectedRecord.subsidyContent}</div>
              </div>
            </div>

            <h4 className="font-bold mb-3">加班说明</h4>
            <div className="p-3 border rounded-lg">
              {selectedRecord.reason}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default OvertimeRequestPage
