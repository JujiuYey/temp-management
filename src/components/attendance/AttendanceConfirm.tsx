import React, { useState, useCallback } from 'react'
import {
  Button,
  Table,
  Input,
  Select,
  Space,
  Tag,
  message,
  Drawer,
  Tree,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  WarningOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

// 院区选项
const orgOptions = [
  { id: 'org1', name: '贵阳市XX医院总院区' },
  { id: 'org2', name: '贵阳市XX医院南院区' },
  { id: 'org3', name: '贵阳市XX医院北院区' },
  { id: 'org4', name: '贵阳市XX医院西院区' },
]

// 考勤年度数据 - 树形结构：年度 -> 月度
const mockYearDataByOrg = {
  org1: [
    {
      id: '2026-org1',
      name: '2026年',
      children: [
        { id: '2026-12-org1', name: '12月', status: 'not_start' },
        { id: '2026-11-org1', name: '11月', status: 'not_start' },
        { id: '2026-10-org1', name: '10月', status: 'not_start' },
        { id: '2026-9-org1', name: '9月', status: 'not_start' },
        { id: '2026-8-org1', name: '8月', status: 'not_start' },
        { id: '2026-7-org1', name: '7月', status: 'not_start' },
        { id: '2026-6-org1', name: '6月', status: 'not_start' },
        { id: '2026-5-org1', name: '5月', status: 'not_start' },
        { id: '2026-4-org1', name: '4月', status: 'archived' },
        { id: '2026-3-org1', name: '3月', status: 'archived' },
        { id: '2026-2-org1', name: '2月', status: 'archived' },
        { id: '2026-1-org1', name: '1月', status: 'archived' },
      ],
    },
    {
      id: '2025-org1',
      name: '2025年',
      children: [
        { id: '2025-12-org1', name: '12月', status: 'archived' },
        { id: '2025-11-org1', name: '11月', status: 'archived' },
        { id: '2025-10-org1', name: '10月', status: 'archived' },
        { id: '2025-9-org1', name: '9月', status: 'archived' },
        { id: '2025-8-org1', name: '8月', status: 'archived' },
        { id: '2025-7-org1', name: '7月', status: 'archived' },
        { id: '2025-6-org1', name: '6月', status: 'archived' },
        { id: '2025-5-org1', name: '5月', status: 'archived' },
        { id: '2025-4-org1', name: '4月', status: 'archived' },
        { id: '2025-3-org1', name: '3月', status: 'archived' },
        { id: '2025-2-org1', name: '2月', status: 'archived' },
        { id: '2025-1-org1', name: '1月', status: 'archived' },
      ],
    },
  ],
  org2: [
    {
      id: '2026-org2',
      name: '2026年',
      children: [
        { id: '2026-12-org2', name: '12月', status: 'not_start' },
        { id: '2026-11-org2', name: '11月', status: 'not_start' },
        { id: '2026-10-org2', name: '10月', status: 'not_start' },
        { id: '2026-9-org2', name: '9月', status: 'not_start' },
        { id: '2026-8-org2', name: '8月', status: 'not_start' },
        { id: '2026-7-org2', name: '7月', status: 'not_start' },
        { id: '2026-6-org2', name: '6月', status: 'not_start' },
        { id: '2026-5-org2', name: '5月', status: 'not_start' },
        { id: '2026-4-org2', name: '4月', status: 'archived' },
        { id: '2026-3-org2', name: '3月', status: 'archived' },
        { id: '2026-2-org2', name: '2月', status: 'archived' },
        { id: '2026-1-org2', name: '1月', status: 'archived' },
      ],
    },
    {
      id: '2025-org2',
      name: '2025年',
      children: [
        { id: '2025-12-org2', name: '12月', status: 'archived' },
        { id: '2025-11-org2', name: '11月', status: 'archived' },
        { id: '2025-10-org2', name: '10月', status: 'archived' },
        { id: '2025-9-org2', name: '9月', status: 'archived' },
        { id: '2025-8-org2', name: '8月', status: 'archived' },
        { id: '2025-7-org2', name: '7月', status: 'archived' },
        { id: '2025-6-org2', name: '6月', status: 'archived' },
        { id: '2025-5-org2', name: '5月', status: 'archived' },
        { id: '2025-4-org2', name: '4月', status: 'archived' },
        { id: '2025-3-org2', name: '3月', status: 'archived' },
        { id: '2025-2-org2', name: '2月', status: 'archived' },
        { id: '2025-1-org2', name: '1月', status: 'archived' },
      ],
    },
  ],
  org3: [
    {
      id: '2026-org3',
      name: '2026年',
      children: [
        { id: '2026-12-org3', name: '12月', status: 'not_start' },
        { id: '2026-11-org3', name: '11月', status: 'not_start' },
        { id: '2026-10-org3', name: '10月', status: 'not_start' },
        { id: '2026-9-org3', name: '9月', status: 'not_start' },
        { id: '2026-8-org3', name: '8月', status: 'not_start' },
        { id: '2026-7-org3', name: '7月', status: 'not_start' },
        { id: '2026-6-org3', name: '6月', status: 'not_start' },
        { id: '2026-5-org3', name: '5月', status: 'not_start' },
        { id: '2026-4-org3', name: '4月', status: 'archived' },
        { id: '2026-3-org3', name: '3月', status: 'archived' },
        { id: '2026-2-org3', name: '2月', status: 'archived' },
        { id: '2026-1-org3', name: '1月', status: 'archived' },
      ],
    },
    {
      id: '2025-org3',
      name: '2025年',
      children: [
        { id: '2025-12-org3', name: '12月', status: 'archived' },
        { id: '2025-11-org3', name: '11月', status: 'archived' },
        { id: '2025-10-org3', name: '10月', status: 'archived' },
        { id: '2025-9-org3', name: '9月', status: 'archived' },
        { id: '2025-8-org3', name: '8月', status: 'archived' },
        { id: '2025-7-org3', name: '7月', status: 'archived' },
        { id: '2025-6-org3', name: '6月', status: 'archived' },
        { id: '2025-5-org3', name: '5月', status: 'archived' },
        { id: '2025-4-org3', name: '4月', status: 'archived' },
        { id: '2025-3-org3', name: '3月', status: 'archived' },
        { id: '2025-2-org3', name: '2月', status: 'archived' },
        { id: '2025-1-org3', name: '1月', status: 'archived' },
      ],
    },
  ],
  org4: [
    {
      id: '2026-org4',
      name: '2026年',
      children: [
        { id: '2026-12-org4', name: '12月', status: 'not_start' },
        { id: '2026-11-org4', name: '11月', status: 'not_start' },
        { id: '2026-10-org4', name: '10月', status: 'not_start' },
        { id: '2026-9-org4', name: '9月', status: 'not_start' },
        { id: '2026-8-org4', name: '8月', status: 'not_start' },
        { id: '2026-7-org4', name: '7月', status: 'not_start' },
        { id: '2026-6-org4', name: '6月', status: 'not_start' },
        { id: '2026-5-org4', name: '5月', status: 'not_start' },
        { id: '2026-4-org4', name: '4月', status: 'archived' },
        { id: '2026-3-org4', name: '3月', status: 'archived' },
        { id: '2026-2-org4', name: '2月', status: 'archived' },
        { id: '2026-1-org4', name: '1月', status: 'archived' },
      ],
    },
    {
      id: '2025-org4',
      name: '2025年',
      children: [
        { id: '2025-12-org4', name: '12月', status: 'archived' },
        { id: '2025-11-org4', name: '11月', status: 'archived' },
        { id: '2025-10-org4', name: '10月', status: 'archived' },
        { id: '2025-9-org4', name: '9月', status: 'archived' },
        { id: '2025-8-org4', name: '8月', status: 'archived' },
        { id: '2025-7-org4', name: '7月', status: 'archived' },
        { id: '2025-6-org4', name: '6月', status: 'archived' },
        { id: '2025-5-org4', name: '5月', status: 'archived' },
        { id: '2025-4-org4', name: '4月', status: 'archived' },
        { id: '2025-3-org4', name: '3月', status: 'archived' },
        { id: '2025-2-org4', name: '2月', status: 'archived' },
        { id: '2025-1-org4', name: '1月', status: 'archived' },
      ],
    },
  ],
}

// 类型定义
interface AttendanceConfirm {
  id: string
  year: number
  month: number
  unit: string
  department: string
  operator: string
  status: 'not_start' | 'pending_calculate' | 'pending_submit' | 'pending_approve' | 'archived'
  // 待生成状态时以下字段为 null 或 undefined
  attendanceCount?: number  // 考勤人数
  perfectCount?: number     // 全勤人数
  lateCount?: number        // 迟到人次
  absentCount?: number      // 缺勤人次
  absentHours?: number      // 缺勤累计时长(小时)
  leaveCount?: number       // 请假人次
  leaveHours?: number       // 请假累计时长(小时)
  archivedTime?: string
  archivedBy?: string
}

interface EmployeeAttendance {
  id: string
  employeeNo: string
  employeeName: string
  position: string
  title: string
  level: string
  shouldAttendDays: number
  actualAttendDays: number
  absentDays: number
  lateDays: number
  earlyDays: number
  annualLeave: number
  sickLeave: number
  personalLeave: number
  overtimeHours: number
  holidayOvertime: number
  hasAbnormal: boolean
}

// 模拟确认单列表数据
const mockConfirmList: AttendanceConfirm[] = [
  {
    id: '1',
    year: 2026,
    month: 5,
    unit: '总院',
    department: '心内科',
    operator: '张三',
    status: 'not_start',  // 待生成状态
  },
  {
    id: '2',
    year: 2026,
    month: 5,
    unit: '总院',
    department: '骨科',
    operator: '李四',
    status: 'pending_submit',
    attendanceCount: 20,
    perfectCount: 15,
    lateCount: 3,
    absentCount: 1,
    absentHours: 8,
    leaveCount: 2,
    leaveHours: 16,
  },
  {
    id: '3',
    year: 2026,
    month: 4,
    unit: '总院',
    department: '心内科',
    operator: '王五',
    status: 'pending_approve',
    attendanceCount: 22,
    perfectCount: 18,
    lateCount: 2,
    absentCount: 0,
    absentHours: 0,
    leaveCount: 3,
    leaveHours: 24,
  },
  {
    id: '4',
    year: 2026,
    month: 5,
    unit: '分院',
    department: '神经科',
    operator: '赵六',
    status: 'archived',
    attendanceCount: 15,
    perfectCount: 12,
    lateCount: 1,
    absentCount: 0,
    absentHours: 0,
    leaveCount: 2,
    leaveHours: 12,
    archivedTime: '2026-05-10 10:00',
    archivedBy: '系统管理员',
  },
]

// 模拟人员考勤数据
const mockEmployeeAttendance: EmployeeAttendance[] = [
  {
    id: '1',
    employeeNo: 'E001',
    employeeName: '张三',
    position: '医生',
    title: '主任医师',
    level: '高级',
    shouldAttendDays: 22,
    actualAttendDays: 21,
    absentDays: 0,
    lateDays: 1,
    earlyDays: 0,
    annualLeave: 2,
    sickLeave: 0,
    personalLeave: 0,
    overtimeHours: 4,
    holidayOvertime: 0,
    hasAbnormal: true,
  },
  {
    id: '2',
    employeeNo: 'E002',
    employeeName: '李四',
    position: '护士',
    title: '护士长',
    level: '中级',
    shouldAttendDays: 22,
    actualAttendDays: 22,
    absentDays: 0,
    lateDays: 0,
    earlyDays: 0,
    annualLeave: 0,
    sickLeave: 1,
    personalLeave: 0,
    overtimeHours: 0,
    holidayOvertime: 8,
    hasAbnormal: false,
  },
  {
    id: '3',
    employeeNo: 'E003',
    employeeName: '王五',
    position: '医生',
    title: '主治医师',
    level: '中级',
    shouldAttendDays: 22,
    actualAttendDays: 20,
    absentDays: 1,
    lateDays: 0,
    earlyDays: 1,
    annualLeave: 0,
    sickLeave: 0,
    personalLeave: 1,
    overtimeHours: 2,
    holidayOvertime: 0,
    hasAbnormal: true,
  },
]

const AttendanceConfirmPage: React.FC = () => {
  const [confirmList] = useState<AttendanceConfirm[]>(mockConfirmList)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedConfirm, setSelectedConfirm] = useState<AttendanceConfirm | null>(null)
  const [calendarDrawerVisible, setCalendarDrawerVisible] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeAttendance | null>(null)

  // 院区选择状态
  const [selectedOrg, setSelectedOrg] = useState<string>('org1')
  // 左侧树相关状态
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [selectedTreeKey, setSelectedTreeKey] = useState<string | null>(null)

  // 筛选状态
  const [deptFilter, setDeptFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchName, setSearchName] = useState('')

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      not_start: { color: 'default', text: '待生成' },
      pending_calculate: { color: 'default', text: '待计算' },
      pending_submit: { color: 'warning', text: '待提交' },
      pending_approve: { color: 'processing', text: '待审核' },
      archived: { color: 'success', text: '已归档' },
    }
    const { color, text } = config[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  // 获取当前选中院区的树形数据（年度 -> 月度）
  const getTreeData = useCallback(() => {
    const orgData = mockYearDataByOrg[selectedOrg as keyof typeof mockYearDataByOrg] || []

    // 转换为 Ant Design Tree 需要的格式，保留 status 属性
    const processNode = (node: any): any => ({
      key: node.id,
      title: node.name,
      status: node.status,
      children: node.children?.map((child: any) => processNode(child))
    })

    return orgData.map(org => processNode(org))
  }, [selectedOrg])

  // 处理院区切换
  const handleOrgChange = (orgId: string) => {
    setSelectedOrg(orgId)
    setSelectedTreeKey(null)
    // 切换院区时自动展开两个年度节点
    const orgData = mockYearDataByOrg[orgId as keyof typeof mockYearDataByOrg] || []
    if (orgData.length > 0) {
      setExpandedKeys(orgData.map(d => d.id))
    } else {
      setExpandedKeys([])
    }
  }

  // 处理树节点选择
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string
      // 只选择月度节点（id 格式：YYYY-MM-orgX）
      if (/^\d{4}-\d{1,2}-/.test(key)) {
        setSelectedTreeKey(key)
      }
    } else {
      setSelectedTreeKey(null)
    }
  }

  // 获取当前选中院区名称
  const getSelectedOrgName = () => {
    const org = orgOptions.find(o => o.id === selectedOrg)
    return org ? org.name : ''
  }

  // 确认单列表列
  const listColumns = [
    {
      title: '考勤年度',
      dataIndex: 'year',
      key: 'year',
      width: 100,
    },
    {
      title: '考勤月度',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      render: (v: number) => `${v}月`,
    },
    {
      title: '考勤单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '科室名称',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '考勤员',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '考勤人数',
      dataIndex: 'attendanceCount',
      key: 'attendanceCount',
      width: 100,
      render: (v: number | undefined, record: AttendanceConfirm) =>
        record.status === 'not_start' ? '--' : v,
    },
    {
      title: '全勤人数',
      dataIndex: 'perfectCount',
      key: 'perfectCount',
      width: 100,
      render: (v: number | undefined, record: AttendanceConfirm) =>
        record.status === 'not_start' ? '--' : v ?? '-',
    },
    {
      title: '迟到人次',
      dataIndex: 'lateCount',
      key: 'lateCount',
      width: 100,
      render: (v: number | undefined, record: AttendanceConfirm) =>
        record.status === 'not_start' ? '--' : v ?? '-',
    },
    {
      title: '缺勤人次',
      dataIndex: 'absentCount',
      key: 'absentCount',
      width: 100,
      render: (v: number | undefined, record: AttendanceConfirm) =>
        record.status === 'not_start' ? '--' : v ?? '-',
    },
    {
      title: '缺勤累计时长',
      dataIndex: 'absentHours',
      key: 'absentHours',
      width: 110,
      render: (v: number | undefined, record: AttendanceConfirm) =>
        record.status === 'not_start' ? '--' : (v ? `${v}h` : '-'),
    },
    {
      title: '请假人次',
      dataIndex: 'leaveCount',
      key: 'leaveCount',
      width: 100,
      render: (v: number | undefined, record: AttendanceConfirm) =>
        record.status === 'not_start' ? '--' : v ?? '-',
    },
    {
      title: '请假累计时长',
      dataIndex: 'leaveHours',
      key: 'leaveHours',
      width: 110,
      render: (v: number | undefined, record: AttendanceConfirm) =>
        record.status === 'not_start' ? '--' : (v ? `${v}h` : '-'),
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
      width: 120,
      render: (_: unknown, record: AttendanceConfirm) => (
        <Space size="small">
          {record.status === 'not_start' && (
            <Button size="small" type="primary" icon={<CalendarOutlined />} className="!bg-blue-600" onClick={() => {
              setSelectedConfirm(record)
              setDetailDrawerVisible(true)
            }}>
              生成考勤
            </Button>
          )}
          {['pending_submit', 'pending_calculate'].includes(record.status) && (
            <Button size="small" icon={<CalendarOutlined />} onClick={() => {
              setSelectedConfirm(record)
              setDetailDrawerVisible(true)
            }}>
              进入核对
            </Button>
          )}
          {['pending_approve', 'archived'].includes(record.status) && (
            <Button size="small" icon={<EyeOutlined />} onClick={() => {
              setSelectedConfirm(record)
              setDetailDrawerVisible(true)
            }}>
              查看
            </Button>
          )}
        </Space>
      ),
    },
  ]

  // 人员考勤明细列
  const detailColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      fixed: 'left' as const,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '工号',
      dataIndex: 'employeeNo',
      key: 'employeeNo',
      width: 100,
      fixed: 'left' as const,
    },
    {
      title: '姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
      fixed: 'left' as const,
      render: (v: string, record: EmployeeAttendance) => (
        <Button type="link" className="p-0" onClick={() => {
          setSelectedEmployee(record)
          setCalendarDrawerVisible(true)
        }}>
          {v}
          {record.hasAbnormal && <WarningOutlined className="text-orange-500 ml-1" />}
        </Button>
      ),
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      width: 80,
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
      width: 100,
    },
    {
      title: '职级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
    },
    {
      title: '应出勤天数',
      dataIndex: 'shouldAttendDays',
      key: 'shouldAttendDays',
      width: 100,
    },
    {
      title: '实出勤天数',
      dataIndex: 'actualAttendDays',
      key: 'actualAttendDays',
      width: 100,
    },
    {
      title: '旷工天数',
      dataIndex: 'absentDays',
      key: 'absentDays',
      width: 100,
      render: (v: number) => v > 0 ? <span className="text-red-500">{v}</span> : v || '-',
    },
    {
      title: '迟到天数',
      dataIndex: 'lateDays',
      key: 'lateDays',
      width: 100,
      render: (v: number) => v > 0 ? <span className="text-orange-500">{v}</span> : v || '-',
    },
    {
      title: '早退天数',
      dataIndex: 'earlyDays',
      key: 'earlyDays',
      width: 100,
      render: (v: number) => v > 0 ? <span className="text-orange-500">{v}</span> : v || '-',
    },
    {
      title: '年假',
      dataIndex: 'annualLeave',
      key: 'annualLeave',
      width: 80,
      render: (v: number) => v || '-',
    },
    {
      title: '病假',
      dataIndex: 'sickLeave',
      key: 'sickLeave',
      width: 80,
      render: (v: number) => v || '-',
    },
    {
      title: '事假',
      dataIndex: 'personalLeave',
      key: 'personalLeave',
      width: 80,
      render: (v: number) => v || '-',
    },
    {
      title: '平日加班',
      dataIndex: 'overtimeHours',
      key: 'overtimeHours',
      width: 100,
      render: (v: number) => v ? `${v}小时` : '-',
    },
    {
      title: '节假日加班',
      dataIndex: 'holidayOvertime',
      key: 'holidayOvertime',
      width: 100,
      render: (v: number) => v ? `${v}小时` : '-',
    },
  ]

  return (
    <div className="flex gap-4">
      {/* 左侧院区选择 + 年度树 */}
      <div className="w-72 flex flex-col bg-white overflow-hidden shadow-sm h-[calc(100vh-180px)]">
        {/* 院区选择下拉框 */}
        <div className="p-2 border-b">
          <Select
            value={selectedOrg}
            onChange={handleOrgChange}
            style={{ width: '100%' }}
            options={orgOptions.map(org => ({ label: org.name, value: org.id }))}
            placeholder="请选择院区"
          />
        </div>

        {/* 树形结构 */}
        <div className="flex-1 overflow-auto p-2">
          <Tree
            treeData={getTreeData()}
            selectedKeys={selectedTreeKey ? [selectedTreeKey] : []}
            expandedKeys={expandedKeys}
            onSelect={handleTreeSelect}
            onExpand={setExpandedKeys}
            blockNode
            titleRender={(node: any) => {
              // 判断是否是月度节点（id 格式：YYYY-MM-orgX）
              const isMonthNode = /^\d{4}-\d{1,2}-/.test(node.key as string)
              return (
                <span className="flex items-center gap-2">
                  {node.title}
                  {isMonthNode && node.status === 'archived' && (
                    <Tag color="blue" style={{ margin: 0, backgroundColor: '#e6f4ff', color: '#1677ff', border: 'none' }}>
                      归档
                    </Tag>
                  )}
                  {isMonthNode && node.status === 'not_start' && (
                    <Tag color="orange" style={{ margin: 0, backgroundColor: '#fff7e6', color: '#fa8c16', border: 'none' }}>
                      未归档
                    </Tag>
                  )}
                </span>
              )
            }}
          />
        </div>
      </div>

      {/* 右侧表格区域 */}
      <div className="flex-1">
        {/* 筛选栏 */}
        <div className="p-4">
          <div className="flex items-center justify-end mb-4">
            <Space size="middle" wrap>
              <Input
                placeholder="科室名称"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                style={{ width: 120 }}
                prefix={<SearchOutlined />}
                allowClear
              />
              <Select
                placeholder="状态"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 120 }}
                options={[
                  { label: '待计算', value: 'pending_calculate' },
                  { label: '待提交', value: 'pending_submit' },
                  { label: '待审核', value: 'pending_approve' },
                  { label: '已归档', value: 'archived' },
                ]}
              />
              <Button type="primary" icon={<SearchOutlined />} className="!bg-blue-600">
                查询
              </Button>
              <Button icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </div>
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-lg border">
          <Table
            columns={listColumns}
            dataSource={confirmList}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total: number) => `共 ${total} 条`,
              position: ['bottomLeft'],
            }}
            size="middle"
          />
        </div>
      </div>

      {/* 确认单详情抽屉 */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span>考勤确认单详情</span>
            {selectedConfirm && getStatusTag(selectedConfirm.status)}
          </div>
        }
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false)
          setSelectedConfirm(null)
        }}
        width={window.innerWidth - 100}
      >
        {selectedConfirm && (
          <>
            {/* 顶部信息栏 */}
            <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
              <Space size="large">
                <span>考勤年度：{selectedConfirm.year}年</span>
                <span>考勤月度：{selectedConfirm.month}月</span>
                <span>考勤单位：{selectedConfirm.unit}</span>
                <span>科室名称：{selectedConfirm.department}</span>
                <span>状态：{getStatusTag(selectedConfirm.status)}</span>
              </Space>
              <Space>
                {selectedConfirm.status === 'pending_calculate' && (
                  <Button type="primary" icon={<CalendarOutlined />} className="!bg-blue-600">
                    计算考勤
                  </Button>
                )}
                {selectedConfirm.status === 'pending_submit' && (
                  <>
                    <Button>通知员工确认</Button>
                    <Button type="primary" icon={<CheckOutlined />} className="!bg-blue-600">
                      提交至人事
                    </Button>
                    <Button icon={<ExportOutlined />}>导出</Button>
                  </>
                )}
                {selectedConfirm.status === 'pending_approve' && (
                  <>
                    <Button type="primary" icon={<CheckOutlined />} className="!bg-green-500">
                      审核通过
                    </Button>
                    <Button danger icon={<CloseOutlined />}>退回</Button>
                    <Button icon={<ExportOutlined />}>导出</Button>
                  </>
                )}
                {selectedConfirm.status === 'archived' && (
                  <Button icon={<ExportOutlined />}>导出</Button>
                )}
              </Space>
            </div>

            {/* 归档提示 */}
            {selectedConfirm.status === 'archived' && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4 text-green-600">
                已归档 · 归档时间：{selectedConfirm.archivedTime} · 归档人：{selectedConfirm.archivedBy}
              </div>
            )}

            {/* 人员考勤汇总表格 */}
            <Table
              columns={detailColumns}
              dataSource={mockEmployeeAttendance}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ x: 1600 }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row className="bg-gray-100 font-medium">
                    <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                    <Table.Summary.Cell index={1}></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}></Table.Summary.Cell>
                    <Table.Summary.Cell index={3}></Table.Summary.Cell>
                    <Table.Summary.Cell index={4}></Table.Summary.Cell>
                    <Table.Summary.Cell index={5}></Table.Summary.Cell>
                    <Table.Summary.Cell index={6}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.shouldAttendDays, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.actualAttendDays, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.absentDays, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={9}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.lateDays, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={10}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.earlyDays, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={11}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.annualLeave, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={12}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.sickLeave, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={13}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.personalLeave, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={14}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.overtimeHours, 0)}小时
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={15}>
                      {mockEmployeeAttendance.reduce((sum, e) => sum + e.holidayOvertime, 0)}小时
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </>
        )}
      </Drawer>

      {/* 员工逐日考勤详情抽屉 */}
      <Drawer
        title={`${selectedEmployee?.employeeName || ''} ${dayjs().year()}年${dayjs().month() + 1}月 考勤详情`}
        open={calendarDrawerVisible}
        onClose={() => {
          setCalendarDrawerVisible(false)
          setSelectedEmployee(null)
        }}
        width={900}
      >
        {selectedEmployee && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-sm">
              逐日考勤日历（展示1-31日打卡数据）
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-left">
                <div>本月汇总：</div>
                <div>应出勤天数：{selectedEmployee.shouldAttendDays}</div>
                <div>实出勤天数：{selectedEmployee.actualAttendDays}</div>
                <div>旷工天数：{selectedEmployee.absentDays}</div>
                <div>迟到天数：{selectedEmployee.lateDays}</div>
                <div>早退天数：{selectedEmployee.earlyDays}</div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default AttendanceConfirmPage
