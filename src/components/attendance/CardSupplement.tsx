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
  DatePicker,
  Popconfirm,
} from 'antd'
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  UndoOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

// 类型定义
interface SupplementRecord {
  id: string
  requestNo: string
  employeeNo: string
  employeeName: string
  department: string
  abnormalDate: string
  abnormalType: 'late' | 'early' | 'absent'
  originalTime: string
  supplementTime: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  applyTime: string
  approveTime?: string
  approver?: string
}

// 模拟数据（合并所有记录）
const mockSupplementRecords: SupplementRecord[] = [
  {
    id: '1',
    requestNo: 'SC202605001',
    employeeNo: 'E001',
    employeeName: '张三',
    department: '心内科',
    abnormalDate: '2026-05-10',
    abnormalType: 'late',
    originalTime: '08:00',
    supplementTime: '2026-05-10 08:30',
    reason: '早会延误，已报备',
    status: 'pending',
    applyTime: '2026-05-10 09:00',
  },
  {
    id: '2',
    requestNo: 'SC202605002',
    employeeNo: 'E001',
    employeeName: '张三',
    department: '心内科',
    abnormalDate: '2026-05-08',
    abnormalType: 'absent',
    originalTime: '-',
    supplementTime: '2026-05-08 08:00',
    reason: '临时出差',
    status: 'approved',
    applyTime: '2026-05-08 08:30',
    approveTime: '2026-05-08 10:00',
    approver: '李四',
  },
  {
    id: '3',
    requestNo: 'SC202605003',
    employeeNo: 'E002',
    employeeName: '李四',
    department: '骨科',
    abnormalDate: '2026-05-11',
    abnormalType: 'early',
    originalTime: '17:30',
    supplementTime: '2026-05-11 17:00',
    reason: '家中有急事',
    status: 'pending',
    applyTime: '2026-05-11 16:00',
  },
]

const CardSupplementPage: React.FC = () => {
  const [records] = useState<SupplementRecord[]>(mockSupplementRecords)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SupplementRecord | null>(null)

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      pending: { color: 'processing', text: '待审核' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已驳回' },
    }
    const { color, text } = config[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  // 获取异常类型标签
  const getAbnormalTypeTag = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      late: { color: 'warning', text: '迟到' },
      early: { color: 'warning', text: '早退' },
      absent: { color: 'error', text: '缺卡' },
    }
    const { color, text } = map[type] || { color: 'default', text: type }
    return <Tag color={color}>{text}</Tag>
  }

  // 表格列定义（合并视图）
  const columns = [
    {
      title: '申请编号',
      dataIndex: 'requestNo',
      key: 'requestNo',
      width: 140,
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
      title: '所属科室',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '异常日期',
      dataIndex: 'abnormalDate',
      key: 'abnormalDate',
      width: 120,
    },
    {
      title: '异常类型',
      dataIndex: 'abnormalType',
      key: 'abnormalType',
      width: 80,
      render: (v: string) => getAbnormalTypeTag(v),
    },
    {
      title: '补卡时间',
      dataIndex: 'supplementTime',
      key: 'supplementTime',
      width: 160,
    },
    {
      title: '补卡事由',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
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
      width: 200,
      render: (_: unknown, record: SupplementRecord) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => {
            setSelectedRecord(record)
            setDetailDrawerVisible(true)
          }}>
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确定撤回该申请？"
                onConfirm={() => message.success('已撤回')}
              >
                <Button size="small" icon={<UndoOutlined />}>
                  撤回
                </Button>
              </Popconfirm>
            </>
          )}
          <Popconfirm
            title="确定删除该申请记录？"
            onConfirm={() => message.success('已删除')}
            disabled={record.status !== 'pending'}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={record.status !== 'pending'}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 筛选区 - 无背景色，控件靠右 */}
      <div className="p-4">
        <div className="flex items-center justify-end gap-3">
          <Input
            placeholder="工号/姓名"
            prefix={<SearchOutlined />}
            style={{ width: 160 }}
          />
          <DatePicker picker="month" placeholder="选择月份" />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '待审核', value: 'pending' },
              { label: '已通过', value: 'approved' },
              { label: '已驳回', value: 'rejected' },
            ]}
          />
          <Button type="primary" className="!bg-blue-600">查询</Button>
          <Button>重置</Button>
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

      {/* 查看详情抽屉 */}
      <Drawer
        title="补卡申请详情"
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false)
          setSelectedRecord(null)
        }}
        width={520}
      >
        {selectedRecord && (
          <div>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>申请编号：{selectedRecord.requestNo}</div>
                <div>申请人：{selectedRecord.employeeName}</div>
                <div>工号：{selectedRecord.employeeNo}</div>
                <div>所属科室：{selectedRecord.department}</div>
              </div>
            </div>

            <h4 className="font-bold mb-3">异常信息</h4>
            <div className="bg-red-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>异常日期：{selectedRecord.abnormalDate}</div>
                <div>异常类型：{getAbnormalTypeTag(selectedRecord.abnormalType)}</div>
                <div>原打卡时间：{selectedRecord.originalTime}</div>
              </div>
            </div>

            <h4 className="font-bold mb-3">补卡信息</h4>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div>补卡时间：{selectedRecord.supplementTime}</div>
              <div className="mt-2">补卡事由：{selectedRecord.reason}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
              <div>申请时间：{selectedRecord.applyTime}</div>
              <div>状态：{getStatusTag(selectedRecord.status)}</div>
              {selectedRecord.approveTime && (
                <>
                  <div>审批时间：{selectedRecord.approveTime}</div>
                  <div>审批人：{selectedRecord.approver}</div>
                </>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default CardSupplementPage
