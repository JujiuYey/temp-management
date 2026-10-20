import React, { useState, useMemo, useCallback } from 'react'
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
  Tree,
  Badge,
  Upload,
  Radio,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  EditOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  WifiOutlined,
  FieldTimeOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { RangePicker } = DatePicker

// 机构模拟数据（与考勤人员页面一致）
const mockOrgs = [
  {
    id: 'org1',
    name: '贵阳市xx医院总院区',
    children: [
      { id: 'dept1', name: '内科', employeeCount: 45 },
      { id: 'dept2', name: '外科', employeeCount: 38 },
      { id: 'dept3', name: '儿科', employeeCount: 28 },
      { id: 'dept4', name: '急诊科', employeeCount: 22 },
    ],
  },
  {
    id: 'org2',
    name: '贵阳市xx医院南院区',
    children: [
      { id: 'dept5', name: 'ICU', employeeCount: 15 },
      { id: 'dept6', name: '手术室', employeeCount: 20 },
    ],
  },
  {
    id: 'org3',
    name: '贵阳市xx医院北院区',
    children: [
      { id: 'dept7', name: '康复科', employeeCount: 18 },
      { id: 'dept8', name: '体检中心', employeeCount: 12 },
    ],
  },
]

// 机构选项
const orgOptions = mockOrgs.map(org => ({
  label: org.name,
  value: org.id,
}))

// 类型定义
interface ClockRecord {
  id: string
  employeeNo: string
  employeeName: string
  adminOrgName: string // 所属院区
  adminOrgId: string
  adminDeptName: string // 所属机构（行政机构）
  adminDeptId: string
  attendanceUnitName: string // 考勤单元
  attendanceUnitId: string
  department: string // 考勤科室
  clockDate: string
  weekDay: string
  shiftClass: string
  clockTime: string // 打卡时间（年月日时分秒）
  clockMethod: 'location' | 'wifi' // 打卡方式
  clockType: '上班' | '下班' // 打卡类型
  result: 'normal' | 'late' | 'early' | 'absent' | 'supplement'
  remark: string // 手动备注
  resultNote?: string // 结果说明（自动备注）
}

// 模拟打卡数据（每条记录只有一个打卡时间和方式）
const mockClockRecords: ClockRecord[] = [
  // 张三 - 上班和下班打卡各一条
  {
    id: '1-1',
    employeeNo: 'E001',
    employeeName: '张三',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '心内科',
    adminDeptId: 'dept1',
    attendanceUnitName: '总院区-心内科',
    attendanceUnitId: 'unit1',
    department: '心内科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '白班',
    clockTime: '2026-05-11 08:32:00',
    clockMethod: 'location',
    clockType: '上班',
    result: 'normal',
    remark: '',
  },
  {
    id: '1-2',
    employeeNo: 'E001',
    employeeName: '张三',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '心内科',
    adminDeptId: 'dept1',
    attendanceUnitName: '总院区-心内科',
    attendanceUnitId: 'unit1',
    department: '心内科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '白班',
    clockTime: '2026-05-11 18:05:00',
    clockMethod: 'location',
    clockType: '下班',
    result: 'normal',
    remark: '',
  },
  // 李四 - 上班迟到
  {
    id: '2-1',
    employeeNo: 'E002',
    employeeName: '李四',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '心内科',
    adminDeptId: 'dept1',
    attendanceUnitName: '总院区-心内科',
    attendanceUnitId: 'unit1',
    department: '心内科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '白班',
    clockTime: '2026-05-11 09:15:00',
    clockMethod: 'wifi',
    clockType: '上班',
    result: 'late',
    remark: '早会延误',
    resultNote: '李四的打卡结果由"迟到"变更为"正常"',
  },
  {
    id: '2-2',
    employeeNo: 'E002',
    employeeName: '李四',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '心内科',
    adminDeptId: 'dept1',
    attendanceUnitName: '总院区-心内科',
    attendanceUnitId: 'unit1',
    department: '心内科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '白班',
    clockTime: '2026-05-11 18:30:00',
    clockMethod: 'wifi',
    clockType: '下班',
    result: 'normal',
    remark: '',
  },
  // 王五 - 缺卡
  {
    id: '3-1',
    employeeNo: 'E003',
    employeeName: '王五',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '骨科',
    adminDeptId: 'dept2',
    attendanceUnitName: '总院区-骨科',
    attendanceUnitId: 'unit2',
    department: '骨科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '夜班',
    clockTime: '2026-05-11 20:00:00',
    clockMethod: 'location',
    clockType: '上班',
    result: 'absent',
    remark: '未排班',
  },
  {
    id: '3-2',
    employeeNo: 'E003',
    employeeName: '王五',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '骨科',
    adminDeptId: 'dept2',
    attendanceUnitName: '总院区-骨科',
    attendanceUnitId: 'unit2',
    department: '骨科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '夜班',
    clockTime: '2026-05-11 08:00:00',
    clockMethod: 'location',
    clockType: '下班',
    result: 'absent',
    remark: '未排班',
  },
  // 赵六 - 早退
  {
    id: '4-1',
    employeeNo: 'E004',
    employeeName: '赵六',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '骨科',
    adminDeptId: 'dept2',
    attendanceUnitName: '总院区-骨科',
    attendanceUnitId: 'unit2',
    department: '骨科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '白班',
    clockTime: '2026-05-11 08:00:00',
    clockMethod: 'location',
    clockType: '上班',
    result: 'normal',
    remark: '',
  },
  {
    id: '4-2',
    employeeNo: 'E004',
    employeeName: '赵六',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '骨科',
    adminDeptId: 'dept2',
    attendanceUnitName: '总院区-骨科',
    attendanceUnitId: 'unit2',
    department: '骨科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '白班',
    clockTime: '2026-05-11 16:30:00',
    clockMethod: 'location',
    clockType: '下班',
    result: 'early',
    remark: '提前下班',
  },
  // 孙七 - 补卡
  {
    id: '5-1',
    employeeNo: 'E005',
    employeeName: '孙七',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '神经科',
    adminDeptId: 'dept3',
    attendanceUnitName: '总院区-神经科',
    attendanceUnitId: 'unit3',
    department: '神经科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '白班',
    clockTime: '2026-05-11 08:05:00',
    clockMethod: 'wifi',
    clockType: '上班',
    result: 'supplement',
    remark: '补卡已通过',
  },
  {
    id: '5-2',
    employeeNo: 'E005',
    employeeName: '孙七',
    adminOrgName: '贵阳市xx医院总院区',
    adminOrgId: 'org1',
    adminDeptName: '神经科',
    adminDeptId: 'dept3',
    attendanceUnitName: '总院区-神经科',
    attendanceUnitId: 'unit3',
    department: '神经科',
    clockDate: '2026-05-11',
    weekDay: '周日',
    shiftClass: '白班',
    clockTime: '2026-05-11 18:00:00',
    clockMethod: 'wifi',
    clockType: '下班',
    result: 'supplement',
    remark: '补卡已通过',
  },
]

const ClockRecordPage: React.FC = () => {
  const [records] = useState<ClockRecord[]>(mockClockRecords)
  const [searchName, setSearchName] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>('org1')
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['org1'])
  const [deptSearchText, setDeptSearchText] = useState('')
  const [resultFilter, setResultFilter] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([dayjs(), dayjs()])

  // 抽屉状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ClockRecord | null>(null)
  const [supplementDrawerVisible, setSupplementDrawerVisible] = useState(false)
  const [supplementForm] = Form.useForm()

  // 导入抽屉状态
  const [importDrawerVisible, setImportDrawerVisible] = useState(false)
  const [importFileList, setImportFileList] = useState<any[]>([])
  const [importMode, setImportMode] = useState<'append' | 'partial'>('partial')
  const [importSummary, setImportSummary] = useState<{ employees: number; total: number } | null>(null)
  const [importProgress, setImportProgress] = useState(false)

  // 获取结果文本
  const getResultText = (result: string) => {
    const map: Record<string, string> = {
      normal: '正常',
      late: '迟到',
      early: '早退',
      absent: '缺卡',
      supplement: '补卡',
    }
    return map[result] || result
  }

  // 标为正常
  const handleMarkAsNormal = useCallback(() => {
    if (!selectedRecord) return
    const originalResult = selectedRecord.result
    const newResultNote = `${selectedRecord.employeeName}的打卡结果由"${getResultText(originalResult)}"变更为"正常"`

    const updatedRecord: ClockRecord = {
      ...selectedRecord,
      result: 'normal',
      resultNote: newResultNote,
    }
    setSelectedRecord(updatedRecord)

    const index = records.findIndex(r => r.id === selectedRecord.id)
    if (index !== -1) {
      records[index] = updatedRecord
    }

    message.success('打卡结果已更新')
  }, [selectedRecord, records])

  // 判断是否为异常结果（可标为正常）
  const isAbnormal = selectedRecord && ['late', 'early', 'absent'].includes(selectedRecord.result)

  // 下载导入模版
  const handleDownloadTemplate = () => {
    const template = [
      ['工号', '姓名', '打卡日期', '打卡时间', '打卡结果', '备注'],
      ['E001', '张三', '2026-05-11', '08:32:00', '正常', ''],
      ['E002', '李四', '2026-05-11', '09:15:00', '迟到', '早会延误'],
    ]
    const csvContent = template.map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '打卡记录导入模版.csv'
    link.click()
    URL.revokeObjectURL(link.href)
    message.success('模版下载成功')
  }

  // 模拟导入处理
  const handleImport = () => {
    if (importFileList.length === 0) {
      message.warning('请先选择要导入的文件')
      return
    }
    setImportProgress(true)
    // 模拟导入过程
    setTimeout(() => {
      setImportSummary({ employees: 5, total: 12 })
      setImportProgress(false)
      message.success('导入完成')
    }, 1500)
  }

  // 确认导入
  const handleConfirmImport = () => {
    message.success(`已${importMode === 'append' ? '追加导入' : '部分覆盖'} ${importSummary?.total} 条打卡记录`)
    setImportDrawerVisible(false)
    setImportFileList([])
    setImportSummary(null)
  }

  // 打开导入抽屉
  const handleOpenImportDrawer = () => {
    setImportDrawerVisible(true)
    setImportFileList([])
    setImportSummary(null)
  }

  // 筛选后的数据
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchName = !searchName || r.employeeName.includes(searchName) || r.employeeNo.includes(searchName)
      const matchDept = !selectedDeptId || r.department === mockOrgs.flatMap(o => o.children || []).find(d => d.id === selectedDeptId)?.name
      const matchResult = resultFilter.length === 0 || resultFilter.includes(r.result)
      return matchName && matchDept && matchResult
    })
  }, [records, searchName, selectedDeptId, resultFilter])

  // 获取当前机构的树形数据
  const getCurrentOrgTreeData = useCallback(() => {
    if (!selectedOrgId) return []
    const org = mockOrgs.find(o => o.id === selectedOrgId)
    if (!org) return []

    // 过滤科室（根据搜索文本）
    const filteredChildren = deptSearchText
      ? org.children?.filter(d => d.name.includes(deptSearchText)) || []
      : org.children || []

    return [{
      key: org.id,
      title: org.name,
      selectable: false,
      children: filteredChildren.map(dept => ({
        key: dept.id,
        title: (
          <span className="flex items-center gap-2">
            {dept.name}
            <Badge count={dept.employeeCount} size="small" style={{ backgroundColor: '#9ca3af' }} />
          </span>
        ),
      })),
    }]
  }, [selectedOrgId, deptSearchText])

  // 处理机构切换
  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId || null)
    setSelectedDeptId(null)
    if (orgId) {
      setExpandedKeys([orgId])
    } else {
      setExpandedKeys([])
    }
  }

  // 处理树节点选择
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string
      if (key.startsWith('dept')) {
        setSelectedDeptId(key)
      }
    } else {
      setSelectedDeptId(null)
    }
  }

  // 获取结果标签
  const getResultTag = (result: string) => {
    const config: Record<string, { color: string; text: string }> = {
      normal: { color: 'success', text: '正常' },
      late: { color: 'warning', text: '迟到' },
      early: { color: 'warning', text: '早退' },
      absent: { color: 'error', text: '缺卡' },
      supplement: { color: 'processing', text: '补卡' },
    }
    const { color, text } = config[result] || { color: 'default', text: result }
    return <Tag color={color}>{text}</Tag>
  }

  // 表格列定义
  const columns: ColumnsType<ClockRecord> = [
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
      title: '所属科室',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '打卡日期',
      dataIndex: 'clockDate',
      key: 'clockDate',
      width: 120,
    },
    {
      title: '星期',
      dataIndex: 'weekDay',
      key: 'weekDay',
      width: 60,
    },
    {
      title: '排班班次',
      dataIndex: 'shiftClass',
      key: 'shiftClass',
      width: 100,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '打卡时间',
      dataIndex: 'clockTime',
      key: 'clockTime',
      width: 180,
    },
    {
      title: '打卡方式',
      key: 'clockMethod',
      width: 100,
      render: (_: unknown, record: ClockRecord) => (
        <Tag icon={record.clockMethod === 'location' ? <EnvironmentOutlined /> : <WifiOutlined />}>
          {record.clockMethod === 'location' ? '地点' : 'WIFI'}
        </Tag>
      ),
    },
    {
      title: '打卡结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (v: string) => getResultTag(v),
    },
    {
      title: '打卡备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 120,
      ellipsis: true,
    },
    {
      title: '结果说明',
      dataIndex: 'resultNote',
      key: 'resultNote',
      width: 180,
      ellipsis: true,
      render: (v: string) => v ? <span className="text-orange-600 text-xs">{v}</span> : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: unknown, record: ClockRecord) => (
        <Button
          size="small"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedRecord(record)
            setDetailDrawerVisible(true)
          }}
          className="!bg-blue-600"
        >
          修改
        </Button>
      ),
    },
  ]

  // 获取行样式
  const getRowClassName = (record: ClockRecord) => {
    if (record.result === 'absent') return 'bg-red-50'
    if (['late', 'early'].includes(record.result)) return 'bg-orange-50'
    return ''
  }

  return (
    <div className="flex gap-4 min-w-0">
      {/* 左侧机构/科室树 */}
      <div className="flex flex-col bg-white overflow-hidden shadow-sm h-[calc(100vh-180px)]" style={{ width: 288, minWidth: 288 }}>
        {/* 机构切换 Select */}
        <div className="p-2">
          <Select
            placeholder="选择机构"
            value={selectedOrgId}
            onChange={handleOrgChange}
            allowClear
            options={orgOptions}
            style={{ width: '100%' }}
          />
        </div>
        {/* 科室搜索 */}
        <div className="p-2">
          <Input
            placeholder="搜索科室"
            value={deptSearchText}
            onChange={e => setDeptSearchText(e.target.value)}
            allowClear
            prefix={<span className="text-gray-400">🔍</span>}
          />
        </div>
        {/* 科室树 */}
        <div className="flex-1 overflow-auto p-2">
          {selectedOrgId ? (
            <Tree
              treeData={getCurrentOrgTreeData()}
              selectedKeys={selectedDeptId ? [selectedDeptId] : []}
              expandedKeys={expandedKeys}
              onSelect={handleTreeSelect}
              onExpand={setExpandedKeys}
              blockNode
              className="attendance-tree"
            />
          ) : (
            <div className="text-gray-400 text-sm text-center py-8">请先选择机构</div>
          )}
        </div>
      </div>

      {/* 右侧表格区域 */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* 筛选区 */}
        <div className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <Space size="middle">
              <Button type="primary" icon={<UploadOutlined />} onClick={handleOpenImportDrawer} className="!bg-blue-600">
                导入打卡结果
              </Button>
            </Space>
            <Space size="middle" wrap>
              <Input
                placeholder="工号/姓名"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                style={{ width: 140 }}
                prefix={<SearchOutlined />}
                allowClear
              />
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                style={{ width: 240 }}
              />
              <Select
                mode="multiple"
                placeholder="打卡结果"
                value={resultFilter}
                onChange={setResultFilter}
                allowClear
                style={{ width: 200 }}
                options={[
                  { label: '正常', value: 'normal' },
                  { label: '迟到', value: 'late' },
                  { label: '早退', value: 'early' },
                  { label: '缺卡', value: 'absent' },
                  { label: '补卡', value: 'supplement' },
                ]}
              />
              <Button type="primary" icon={<SearchOutlined />} className="!bg-blue-600">
                查询
              </Button>
              <Button icon={<ReloadOutlined />}>重置</Button>
              <Button icon={<ExportOutlined />}>导出</Button>
            </Space>
          </div>
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-lg border overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredRecords}
            rowKey="id"
            rowClassName={getRowClassName}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total: number) => `共 ${total} 条`,
              position: ['bottomLeft'],
            }}
            size="middle"
            scroll={{ x: 1600 }}
          />
        </div>
      </div>

      {/* 打卡详情抽屉 */}
      <Drawer
        title="打卡详情"
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={520}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDetailDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => setDetailDrawerVisible(false)} className="!bg-blue-600">
              保存
            </Button>
          </div>
        }
      >
        {selectedRecord && (
          <div>
            {/* 基本信息 */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">工号：</span>
                  <span className="font-medium">{selectedRecord.employeeNo}</span>
                </div>
                <div>
                  <span className="text-gray-500">姓名：</span>
                  <span className="font-medium">{selectedRecord.employeeName}</span>
                </div>
                <div>
                  <span className="text-gray-500">所属院区：</span>
                  <span className="font-medium">{selectedRecord.adminOrgName}</span>
                </div>
                <div>
                  <span className="text-gray-500">所属机构：</span>
                  <span className="font-medium">{selectedRecord.adminDeptName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">考勤单元：</span>
                  <span className="font-medium">{selectedRecord.attendanceUnitName}</span>
                </div>
              </div>
            </div>

            {/* 打卡信息 */}
            <div className="mb-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                <span className="text-gray-500">打卡时间：</span>
                <span className="font-medium">{selectedRecord.clockTime}</span>
                <Tag icon={selectedRecord.clockMethod === 'location' ? <EnvironmentOutlined /> : <WifiOutlined />}>
                  {selectedRecord.clockMethod === 'location' ? '地点打卡' : 'WIFI打卡'}
                </Tag>
              </div>
            </div>

            {/* 打卡结果 */}
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-500">打卡结果：</span>
                {getResultTag(selectedRecord.result)}
                {isAbnormal && (
                  <Button type="link" size="small" onClick={handleMarkAsNormal}>
                    标为正常
                  </Button>
                )}
              </div>
            </div>

            {/* 补卡说明（仅补卡记录显示） */}
            {selectedRecord.result === 'supplement' && (
              <div className="mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 mb-2">补卡信息</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">补卡申请时间：</span>
                      <span>{selectedRecord.clockTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">补卡结果：</span>
                      <Tag color="success">已通过</Tag>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 结果说明（自动备注） */}
            {selectedRecord.resultNote && (
              <div className="mb-4">
                <div className="text-sm">
                  <span className="text-gray-500">结果说明：</span>
                  <span className="text-orange-600">{selectedRecord.resultNote}</span>
                </div>
              </div>
            )}

            {/* 备注 */}
            <div className="mb-4">
              <div className="text-sm">
                <span className="text-gray-500">备注：</span>
                <span>{selectedRecord.remark || '-'}</span>
              </div>
            </div>

            {/* 打卡图片占位 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center text-gray-400">
              <div className="mb-2">打卡图片</div>
              <div className="text-sm">(暂无图片)</div>
            </div>

            {/* 打卡位置占位 */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-400">
              <div className="mb-2">打卡位置</div>
              <div className="text-sm">(暂无位置信息)</div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 补卡申请抽屉 */}
      <Drawer
        title="补卡申请"
        open={supplementDrawerVisible}
        onClose={() => setSupplementDrawerVisible(false)}
        width={480}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSupplementDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => {
              supplementForm.validateFields().then(() => {
                message.success('提交成功')
                setSupplementDrawerVisible(false)
                supplementForm.resetFields()
              })
            }} className="!bg-blue-600">
              提交
            </Button>
          </div>
        }
      >
        <Form form={supplementForm} layout="vertical">
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <div className="text-sm space-y-2">
              <div>异常日期：<span className="font-medium">{supplementForm.getFieldValue('abnormalDate')}</span></div>
              <div>异常类型：{supplementForm.getFieldValue('abnormalType') === 'late' ? '迟到' : supplementForm.getFieldValue('abnormalType') === 'early' ? '早退' : '缺卡'}</div>
              <div>原打卡记录：<span className="text-gray-500">{supplementForm.getFieldValue('originalRecord')}</span></div>
            </div>
          </div>

          <Form.Item
            name="supplementTime"
            label="补卡时间"
            rules={[{ required: true, message: '请选择补卡时间' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="reason"
            label="补卡事由"
            rules={[{ required: true, message: '请输入补卡事由' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入补卡事由（必填）" />
          </Form.Item>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-600">
            <div>本期间已使用 1 次补卡机会</div>
            <div>剩余 1 次</div>
          </div>
        </Form>
      </Drawer>

      {/* 导入打卡结果抽屉 */}
      <Drawer
        title="导入打卡结果"
        open={importDrawerVisible}
        onClose={() => {
          setImportDrawerVisible(false)
          setImportFileList([])
          setImportSummary(null)
        }}
        width={520}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setImportDrawerVisible(false)
              setImportFileList([])
              setImportSummary(null)
            }}>取消</Button>
            <Button
              type="primary"
              onClick={handleConfirmImport}
              disabled={!importSummary}
              className="!bg-blue-600 !text-white"
            >
              确认导入
            </Button>
          </div>
        }
      >
        {/* 下载模版区域 */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-3">第一步：下载导入模版</div>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <FileExcelOutlined /> 下载打卡记录导入模版
          </Button>
          <div className="mt-2 text-xs text-gray-500">
            请先下载模版，按模版格式填写数据后再导入
          </div>
        </div>

        <div className="border-t my-6" />

        {/* 选择文件区域 */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-3">第二步：选择模版进行导入</div>
          <Upload
            fileList={importFileList}
            onChange={({ fileList }) => setImportFileList(fileList)}
            beforeUpload={() => false}
            accept=".csv,.xlsx,.xls"
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          <div className="mt-2 text-xs text-gray-500">
            支持 CSV、Excel 格式文件
          </div>
        </div>

        {/* 导入汇总 */}
        {importSummary && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 font-medium">导入预览</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">导入人员：</span>
                  <span className="font-medium text-blue-600">{importSummary.employees} 人</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">导入条数：</span>
                  <span className="font-medium text-blue-600">{importSummary.total} 条</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 导入模式 */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-3">导入方式</div>
          <Radio.Group
            value={importMode}
            onChange={(e) => setImportMode(e.target.value)}
            className="flex flex-col gap-2"
          >
            <Radio value="append">
              <div>
                <div className="font-medium">追加导入</div>
                <div className="text-xs text-gray-500">模版中的记录全部导入，保留现有记录</div>
              </div>
            </Radio>
            <Radio value="partial">
              <div>
                <div className="font-medium">部分覆盖</div>
                <div className="text-xs text-gray-500">覆盖人员和日期相同的记录，保留其他现有记录</div>
              </div>
            </Radio>
          </Radio.Group>
        </div>

        {/* 导入按钮 */}
        <div className="text-center">
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleImport}
            loading={importProgress}
            disabled={importFileList.length === 0}
            className="!bg-blue-600 !text-white"
          >
            开始导入
          </Button>
        </div>
      </Drawer>
    </div>
  )
}

export default ClockRecordPage
