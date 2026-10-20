import React, { useState, useMemo } from 'react'
import {
  Button,
  Table,
  Input,
  Select,
  Space,
  Drawer,
} from 'antd'
import {
  ExportOutlined,
  EyeOutlined,
} from '@ant-design/icons'

// 类型定义
interface LeaveBalance {
  id: string
  employeeNo: string
  employeeName: string
  unitName: string
  department: string
  gender: string
  year: string
  projectCode: string
  projectName: string
  unit: string
  shouldGrantDays: number
  deductDays: number
  lastYearBalance: number
  actualGrantDays: number
  usedDays: number
  remainDays: number
  status: 'normal' | 'low' | 'negative'
}

// 发放记录类型
interface LeaveGrantRecord {
  id: string
  year: string
  type: 'grant' | 'deduct' | 'return'
  projectName: string
  occurTime: string
  executeTime: string
  changeValue: number
  expiryDate: string
}

// 发放记录模拟数据
const mockGrantRecords: Record<string, LeaveGrantRecord[]> = {
  '1': [
    { id: 'r1', year: '2026', type: 'grant', projectName: '年假', occurTime: '2026-01-01 00:00:00', executeTime: '2026-01-01 08:30:15', changeValue: 10, expiryDate: '2026-12-31' },
    { id: 'r2', year: '2026', type: 'return', projectName: '年假', occurTime: '2026-01-15 00:00:00', executeTime: '2026-01-15 09:00:00', changeValue: 3, expiryDate: '2026-12-31' },
    { id: 'r3', year: '2026', type: 'deduct', projectName: '年假', occurTime: '2026-04-01 00:00:00', executeTime: '2026-04-01 14:20:30', changeValue: 5, expiryDate: '-' },
  ],
  '2': [
    { id: 'r4', year: '2026', type: 'grant', projectName: '年假', occurTime: '2026-01-01 00:00:00', executeTime: '2026-01-01 08:30:15', changeValue: 5, expiryDate: '2026-12-31' },
    { id: 'r5', year: '2026', type: 'return', projectName: '年假', occurTime: '2026-01-20 00:00:00', executeTime: '2026-01-20 10:15:00', changeValue: 2, expiryDate: '2026-12-31' },
  ],
}

// 模拟数据
const mockBalances: LeaveBalance[] = [
  {
    id: '1',
    employeeNo: 'E001',
    employeeName: '张三分',
    unitName: '贵阳市XX医院总院区',
    department: '心内科',
    gender: '男',
    year: '2026',
    projectCode: 'AL',
    projectName: '年假',
    unit: '天',
    shouldGrantDays: 10,
    deductDays: 0,
    lastYearBalance: 3,
    actualGrantDays: 13,
    usedDays: 5,
    remainDays: 8,
    status: 'normal',
  },
  {
    id: '2',
    employeeNo: 'E002',
    employeeName: '李思思',
    unitName: '贵阳市XX医院总院区',
    department: '消化内科',
    gender: '女',
    year: '2026',
    projectCode: 'AL',
    projectName: '年假',
    unit: '天',
    shouldGrantDays: 5,
    deductDays: 0,
    lastYearBalance: 2,
    actualGrantDays: 7,
    usedDays: 6,
    remainDays: 1,
    status: 'low',
  },
  {
    id: '3',
    employeeNo: 'E003',
    employeeName: '王武',
    unitName: '贵阳市XX医院南院区',
    department: '呼吸内科',
    gender: '男',
    year: '2026',
    projectCode: 'AL',
    projectName: '年假',
    unit: '天',
    shouldGrantDays: 15,
    deductDays: 1,
    lastYearBalance: 0,
    actualGrantDays: 14,
    usedDays: 15,
    remainDays: -1,
    status: 'negative',
  },
  {
    id: '4',
    employeeNo: 'E004',
    employeeName: '赵六',
    unitName: '贵阳市XX医院北院区',
    department: '骨科',
    gender: '男',
    year: '2026',
    projectCode: 'AL',
    projectName: '年假',
    unit: '天',
    shouldGrantDays: 10,
    deductDays: 0,
    lastYearBalance: 5,
    actualGrantDays: 15,
    usedDays: 10,
    remainDays: 5,
    status: 'normal',
  },
  {
    id: '5',
    employeeNo: 'E005',
    employeeName: '孙丽丽',
    unitName: '贵阳市XX医院南院区',
    department: '新生儿科',
    gender: '女',
    year: '2026',
    projectCode: 'SL',
    projectName: '病假',
    unit: '天',
    shouldGrantDays: 0,
    deductDays: 0,
    lastYearBalance: 0,
    actualGrantDays: 0,
    usedDays: 3,
    remainDays: -3,
    status: 'negative',
  },
]

const LeaveBalancePage: React.FC = () => {
  const [balances] = useState<LeaveBalance[]>(mockBalances)

  // 筛选条件
  const [unitFilter, setUnitFilter] = useState<string | null>(null)
  const [employeeFilter, setEmployeeFilter] = useState<string>('')
  const [projectFilter, setProjectFilter] = useState<string[]>([])

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<LeaveBalance | null>(null)
  const [grantRecords, setGrantRecords] = useState<LeaveGrantRecord[]>([])

  // 筛选后的数据
  const filteredBalances = useMemo(() => {
    return balances.filter(b => {
      const matchUnit = !unitFilter || b.unitName === unitFilter
      const matchProject = projectFilter.length === 0 || projectFilter.includes(b.projectCode)
      const matchEmployee = !employeeFilter || b.employeeNo.includes(employeeFilter) || b.employeeName.includes(employeeFilter)
      return matchUnit && matchProject && matchEmployee
    })
  }, [balances, unitFilter, projectFilter, employeeFilter])

  // 重置筛选
  const handleReset = () => {
    setUnitFilter(null)
    setEmployeeFilter('')
    setProjectFilter([])
  }

  // 查看发放记录
  const handleViewRecord = (record: LeaveBalance) => {
    setSelectedRecord(record)
    setGrantRecords(mockGrantRecords[record.id] || [])
    setDrawerVisible(true)
  }

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false)
    setSelectedRecord(null)
    setGrantRecords([])
  }

  return (
    <div>
      {/* 筛选区 */}
      <div className="p-4 mb-4">
        <div className="flex items-center justify-end gap-3">
          <Select
            placeholder="所属单位"
            value={unitFilter}
            onChange={setUnitFilter}
            allowClear
            style={{ width: 200 }}
            options={[
              { label: '贵阳市XX医院总院区', value: '贵阳市XX医院总院区' },
              { label: '贵阳市XX医院南院区', value: '贵阳市XX医院南院区' },
              { label: '贵阳市XX医院北院区', value: '贵阳市XX医院北院区' },
            ]}
          />
          <Input
            placeholder="工号/姓名"
            value={employeeFilter}
            onChange={e => setEmployeeFilter(e.target.value)}
            allowClear
            style={{ width: 120 }}
          />
          <Select
            mode="multiple"
            placeholder="考勤项目"
            value={projectFilter}
            onChange={setProjectFilter}
            allowClear
            style={{ minWidth: 160 }}
            options={[
              { label: '年假', value: 'AL' },
              { label: '病假', value: 'SL' },
              { label: '婚假', value: 'ML' },
              { label: '产假', value: 'PL' },
            ]}
          />
          <Button type="primary" style={{ height: 32 }}>查询</Button>
          <Button style={{ height: 32 }} onClick={handleReset}>重置</Button>
          <Button icon={<ExportOutlined />} style={{ height: 32 }}>
            导出
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <Table
        scroll={{ x: 1400 }}
        columns={[
          { title: '序号', key: 'index', width: 60, fixed: 'left', render: (_: unknown, __: unknown, idx: number) => idx + 1 },
          { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100, fixed: 'left' },
          { title: '姓名', dataIndex: 'employeeName', key: 'employeeName', width: 100, fixed: 'left' },
          { title: '所属单位', dataIndex: 'unitName', key: 'unitName', width: 100 },
          { title: '所属科室', dataIndex: 'department', key: 'department', width: 100 },
          { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
          { title: '考勤项目', dataIndex: 'projectName', key: 'projectName', width: 100 },
          { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
          { title: '本年应发', dataIndex: 'shouldGrantDays', key: 'shouldGrantDays', width: 80 },
          { title: '本年扣除', dataIndex: 'deductDays', key: 'deductDays', width: 80 },
          { title: '上年结余', dataIndex: 'lastYearBalance', key: 'lastYearBalance', width: 80 },
          { title: '本年实发', dataIndex: 'actualGrantDays', key: 'actualGrantDays', width: 80 },
          { title: '当前已用', dataIndex: 'usedDays', key: 'usedDays', width: 80 },
          {
            title: '当前剩余',
            dataIndex: 'remainDays',
            key: 'remainDays',
            width: 100,
            sorter: (a: LeaveBalance, b: LeaveBalance) => a.remainDays - b.remainDays,
            render: (v: number) => {
              const isNegative = v < 0
              const isLow = v >= 0 && v <= 2
              return (
                <span
                  style={{
                    fontWeight: 'bold',
                    color: isNegative ? '#cf1322' : isLow ? '#fa8c16' : '#333',
                  }}
                >
                  {v}
                </span>
              )
            },
          },
          {
            title: '操作',
            key: 'action',
            width: 90,
            fixed: 'right',
            render: (_: unknown, record: LeaveBalance) => (
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => handleViewRecord(record)}
                className="!bg-blue-600"
              >
                查看
              </Button>
            ),
          },
        ]}
        dataSource={filteredBalances}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
          position: ['bottomLeft'],
        }}
        size="middle"
      />

      {/* 发放记录抽屉 */}
      <Drawer
        title={`发放记录 - ${selectedRecord?.employeeName || ''} (${selectedRecord?.employeeNo || ''})`}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={1000}
      >
        <Table
          dataSource={grantRecords}
          rowKey="id"
          pagination={false}
          columns={[
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
              render: (v: number, record: LeaveGrantRecord) => {
                const isDeduct = record.type === 'deduct'
                return (
                  <span style={{ color: isDeduct ? '#cf1322' : '#1677ff', fontWeight: 'bold', display: 'block', textAlign: 'left' }}>
                    {isDeduct ? '-' : '+'}{v}
                  </span>
                )
              },
            },
            { title: '到期日期', dataIndex: 'expiryDate', key: 'expiryDate', width: 120 },
          ]}
          summary={() => {
            const totalChange = grantRecords.reduce((sum, r) => {
              if (r.type === 'deduct') return sum - r.changeValue
              return sum + r.changeValue
            }, 0)
            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                  <Table.Summary.Cell index={0} colSpan={7}>余额合计</Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <span style={{ fontWeight: 'bold', color: totalChange < 0 ? '#cf1322' : '#333', textAlign: 'left' }}>
                      {totalChange}
                    </span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />
      </Drawer>
    </div>
  )
}

export default LeaveBalancePage
