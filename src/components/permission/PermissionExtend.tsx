import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Drawer,
  Form,
  DatePicker,
  InputNumber,
  Radio,
  message,
  Row,
  Col,
  Progress,
  Tooltip,
  Descriptions,
  Tabs,
  Checkbox,
} from 'antd'
import {
  SearchOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  RollbackOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

export interface ExtendRecord {
  id: string
  employeeId: string
  name: string
  department: string
  title: string
  permissionName: string
  grantedDate: string
  expireDate: string
  daysRemaining: number
  monitorDays: number
  extendCount: number
  status: string
}

interface PermissionLog {
  id: string
  permissionName: string
  type: string
  createDate: string
  operator: string
  beforeOperation: string
  afterOperation: string
  [key: string]: string
}

interface SelectedPerm {
  id: string
  category: string
  permissionName: string
  config: string
  prescriptionTypes?: string[]
  roleTypes?: string[]
  isLimited?: boolean
  validPeriod?: number
}

interface PermissionExtendProps {
  onNavigate?: (key: string) => void
}

const PermissionExtend: React.FC<PermissionExtendProps> = ({ onNavigate }) => {
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [extendType, setExtendType] = useState<'date' | 'period'>('date')
  const [revokeModalOpen, setRevokeModalOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<ExtendRecord[]>([])
  const [searchText, setSearchText] = useState('')
  const [deptFilter, setDeptFilter] = useState<string | undefined>(undefined)
  const [form] = Form.useForm()
  const [revokeForm] = Form.useForm()
  const [editForm] = Form.useForm()

  // 查看抽屉
  const [viewRecord, setViewRecord] = useState<ExtendRecord | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  // 编辑抽屉
  const [editRecord, setEditRecord] = useState<ExtendRecord | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // 权限调整抽屉（内嵌，不跳转页面）
  const [adjustDrawerOpen, setAdjustDrawerOpen] = useState(false)
  const [adjustRecord, setAdjustRecord] = useState<ExtendRecord | null>(null)
  const [adjustPerms, setAdjustPerms] = useState<SelectedPerm[]>([])
  const [adjustCheckedIds, setAdjustCheckedIds] = useState<string[]>([])
  const [adjustCategoryFilter, setAdjustCategoryFilter] = useState<string | undefined>(undefined)
  const [adjustForm] = Form.useForm()

  // 日志查询条件
  const [logSearchForm] = Form.useForm()

  // 权限分类数据
  const permissionCategories = [
    { name: '处方权', color: '#1890ff', count: 2 },
    { name: '临床用血', color: '#fa8c16', count: 1 },
    { name: '手术等级', color: '#722ed1', count: 1 },
    { name: '手术目录', color: '#13c2c2', count: 3 },
    { name: '麻醉等级', color: '#52c41a', count: 2 },
    { name: '操作', color: '#eb2f96', count: 4 },
    { name: '报告', color: '#f5222d', count: 1 },
    { name: '设备', color: '#bfbfbf', count: 2 },
    { name: '病理', color: '#faad14', count: 1 },
  ]

  // 权限数据
  const permissionData = [
    { id: '1', category: '处方权', name: '处方开具权限', config: '普通处方' },
    { id: '2', category: '处方权', name: '麻醉处方权限', config: '麻醉药品处方' },
    { id: '5', category: '手术目录', name: '手术操作权限', config: '三级手术' },
    { id: '15', category: '设备', name: '呼吸机操作权限', config: '有创呼吸机' },
  ]

  const [data, setData] = useState<ExtendRecord[]>([
    { id: '1', employeeId: 'GH20240001', name: '张医生', department: '外科', title: '主治医师', permissionName: '手术操作权限', grantedDate: '2024-06-01', expireDate: '2026-06-15', daysRemaining: 4, monitorDays: 14, extendCount: 1, status: '即将到期' },
    { id: '2', employeeId: 'GH20240002', name: '李医生', department: '内科', title: '副主任医师', permissionName: '处方开具权限', grantedDate: '2025-01-15', expireDate: '2027-01-15', daysRemaining: 218, monitorDays: 14, extendCount: 0, status: '正常' },
    { id: '3', employeeId: 'GH20240004', name: '赵技师', department: '检验科', title: '技师', permissionName: '检验报告审核权限', grantedDate: '2024-09-01', expireDate: '2026-06-20', daysRemaining: 9, monitorDays: 14, extendCount: 2, status: '即将到期' },
    { id: '4', employeeId: 'GH20230005', name: '陈医生', department: '外科', title: '主任医师', permissionName: '手术操作权限', grantedDate: '2023-06-01', expireDate: '2026-06-10', daysRemaining: -1, monitorDays: 14, extendCount: 3, status: '已过期' },
    { id: '5', employeeId: 'GH20250006', name: '刘医生', department: '急诊科', title: '主治医师', permissionName: '处方开具权限', grantedDate: '2025-06-01', expireDate: '2026-06-05', daysRemaining: -6, monitorDays: 14, extendCount: 1, status: '已过期' },
    { id: '6', employeeId: 'GH20250007', name: '吴医生', department: '内科', title: '住院医师', permissionName: '病历查阅权限', grantedDate: '2025-08-01', expireDate: '2026-08-01', daysRemaining: 51, monitorDays: 14, extendCount: 0, status: '正常' },
    { id: '7', employeeId: 'GH20250008', name: '周护士', department: '外科', title: '护士', permissionName: '药品调配权限', grantedDate: '2025-10-01', expireDate: '2026-10-01', daysRemaining: 112, monitorDays: 14, extendCount: 0, status: '正常' },
    { id: '8', employeeId: 'GH20240001', name: '张医生', department: '外科', title: '主治医师', permissionName: '处方开具权限', grantedDate: '2024-08-01', expireDate: '2026-08-01', daysRemaining: 51, monitorDays: 14, extendCount: 0, status: '正常' },
  ])

  // ==================== 权限调整抽屉 打开 ====================
  const handleOpenAdjustDrawer = (record: ExtendRecord) => {
    setAdjustRecord(record)
    setAdjustCategoryFilter(undefined)

    // 找出该人员的所有权限
    const staffPermNames = data
      .filter(r => r.employeeId === record.employeeId)
      .map(r => r.permissionName)

    // 构建权限列表（带 config）
    const perms: SelectedPerm[] = staffPermNames.map((name, idx) => {
      const found = permissionData.find(p => p.name === name)
      return {
        id: found?.id || `perm-${idx}`,
        category: found?.category || '',
        permissionName: name,
        config: found?.config || '',
        prescriptionTypes: [],
        roleTypes: [],
        isLimited: false,
        validPeriod: undefined,
      }
    })
    setAdjustPerms(perms)

    // 预勾选当前行对应的权限
    const targetPerm = perms.find(p => p.permissionName === record.permissionName)
    setAdjustCheckedIds(targetPerm ? [targetPerm.id] : [])

    adjustForm.resetFields()
    setAdjustDrawerOpen(true)
  }

  // ==================== 权限调整抽屉 配置渲染 ====================
  const renderAdjustConfig = (record: SelectedPerm) => {
    const category = record.category
    const isChecked = adjustCheckedIds.includes(record.id)
    const disabled = !isChecked

    if (category === '处方权') {
      const prescriptionTypes = record.prescriptionTypes || []
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <Checkbox
            checked={prescriptionTypes.includes('住院')}
            disabled={disabled}
            onChange={(e) => {
              const newTypes = e.target.checked
                ? [...prescriptionTypes, '住院']
                : prescriptionTypes.filter(t => t !== '住院')
              setAdjustPerms(prev => prev.map(p =>
                p.id === record.id ? { ...p, prescriptionTypes: newTypes } : p
              ))
            }}
          >住院</Checkbox>
          <Checkbox
            checked={prescriptionTypes.includes('门诊')}
            disabled={disabled}
            onChange={(e) => {
              const newTypes = e.target.checked
                ? [...prescriptionTypes, '门诊']
                : prescriptionTypes.filter(t => t !== '门诊')
              setAdjustPerms(prev => prev.map(p =>
                p.id === record.id ? { ...p, prescriptionTypes: newTypes } : p
              ))
            }}
          >门诊</Checkbox>
        </div>
      )
    }

    if (category === '手术等级' || category === '手术目录') {
      const roleTypes = record.roleTypes || []
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          {['主刀', '一助', '开单'].map(role => (
            <Checkbox
              key={role}
              checked={roleTypes.includes(role)}
              disabled={disabled}
              onChange={(e) => {
                const newTypes = e.target.checked
                  ? [...roleTypes, role]
                  : roleTypes.filter(t => t !== role)
                setAdjustPerms(prev => prev.map(p =>
                  p.id === record.id ? { ...p, roleTypes: newTypes } : p
                ))
              }}
            >{role}</Checkbox>
          ))}
        </div>
      )
    }

    if (category === '设备') {
      const roleTypes = record.roleTypes || []
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          {['操作', '维修'].map(role => (
            <Checkbox
              key={role}
              checked={roleTypes.includes(role)}
              disabled={disabled}
              onChange={(e) => {
                const newTypes = e.target.checked
                  ? [...roleTypes, role]
                  : roleTypes.filter(t => t !== role)
                setAdjustPerms(prev => prev.map(p =>
                  p.id === record.id ? { ...p, roleTypes: newTypes } : p
                ))
              }}
            >{role}</Checkbox>
          ))}
        </div>
      )
    }

    return <span>--</span>
  }

  // 过滤权限列表（按分类）
  const filteredAdjustPerms = adjustPerms.filter(p => {
    if (adjustCategoryFilter && p.category !== adjustCategoryFilter) return false
    return true
  })

  // 表格列定义
  const columns: ColumnsType<ExtendRecord> = [
    { title: '员工编号', dataIndex: 'employeeId', key: 'employeeId', width: 120, fixed: 'left' as const },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 90, fixed: 'left' as const },
    { title: '科室', dataIndex: 'department', key: 'department', width: 100 },
    { title: '职称', dataIndex: 'title', key: 'title', width: 110 },
    { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 140 },
    { title: '授权日期', dataIndex: 'grantedDate', key: 'grantedDate', width: 120 },
    { title: '到期日期', dataIndex: 'expireDate', key: 'expireDate', width: 120 },
    {
      title: '剩余天数', key: 'daysRemaining', width: 130,
      render: (_: unknown, r: ExtendRecord) => {
        const pct = Math.max(0, Math.min(100, (r.daysRemaining / 365) * 100))
        let color = '#52c41a'
        if (r.daysRemaining < 0) color = '#ff4d4f'
        else if (r.daysRemaining <= 30) color = '#faad14'
        return (
          <Space>
            <Progress percent={pct} size="small" strokeColor={color} style={{ width: 60 }} />
            <span style={{ color: r.daysRemaining < 0 ? '#ff4d4f' : undefined }}>{r.daysRemaining}</span>
          </Space>
        )
      },
    },
    { title: '监控天数', dataIndex: 'monitorDays', key: 'monitorDays', width: 100 },
    {
      title: '状态', key: 'status', width: 100,
      render: (_: unknown, r: ExtendRecord) => {
        let color = 'green'
        if (r.status === '即将到期') color = 'orange'
        if (r.status === '已过期') color = 'red'
        return <Tag color={color}>{r.status}</Tag>
      },
    },
    {
      title: '操作', key: 'action', width: 240, fixed: 'right' as const,
      render: (_: unknown, record: ExtendRecord) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setViewRecord(record); setViewOpen(true) }}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenAdjustDrawer(record)}>调整</Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => { setSelectedRows([record]); setExtendModalOpen(true) }}>延期</Button>
          <Button type="link" size="small" danger icon={<RollbackOutlined />} onClick={() => { setSelectedRows([record]); setRevokeModalOpen(true) }}>回收</Button>
        </Space>
      ),
    },
  ]

  // ==================== 主渲染 ====================
  const filteredData = data.filter(r => {
    if (deptFilter && r.department !== deptFilter) return false
    if (searchText) {
      const s = searchText.toLowerCase()
      return r.name.toLowerCase().includes(s) || r.employeeId.toLowerCase().includes(s) || r.permissionName.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div>
      {/* 查询区 Card */}
      <Card
        size="small"
        style={{ marginBottom: 16 }}
      >
        {/* 顶部操作栏：左侧批量按钮，右侧查询条件 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Tooltip title="集中调整已选中的权限">
                <Button type="primary" icon={<HistoryOutlined />}
                  onClick={() => onNavigate?.('batch-adjust')}>
                  批量延期
                </Button>
              </Tooltip>
              <Tooltip title="集中回收已选中的权限">
                <Button danger icon={<RollbackOutlined />}
                  onClick={() => onNavigate?.('batch-revoke')}>
                  批量回收
                </Button>
              </Tooltip>
            </Space>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="搜索姓名/工号/权限名称"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                style={{ width: 260 }}
              />
              <Select
                placeholder="科室筛选"
                allowClear
                value={deptFilter}
                onChange={setDeptFilter}
                style={{ width: 130 }}
                options={[
                  { label: '外科', value: '外科' },
                  { label: '内科', value: '内科' },
                  { label: '检验科', value: '检验科' },
                  { label: '急诊科', value: '急诊科' },
                ]}
              />
              <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            </Space>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowSelection={{
            selectedRowKeys: selectedRows.map(r => r.id),
            onChange: (keys: React.Key[]) => {
              setSelectedRows(data.filter(r => keys.includes(r.id)))
            },
          }}
        />
      </Card>

      {/* 查看抽屉 */}
      <Drawer
        title="权限详情"
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        width={640}
      >
        {viewRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="员工编号">{viewRecord.employeeId}</Descriptions.Item>
            <Descriptions.Item label="姓名">{viewRecord.name}</Descriptions.Item>
            <Descriptions.Item label="科室">{viewRecord.department}</Descriptions.Item>
            <Descriptions.Item label="职称">{viewRecord.title}</Descriptions.Item>
            <Descriptions.Item label="权限名称">{viewRecord.permissionName}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={viewRecord.status === '已过期' ? 'red' : viewRecord.status === '即将到期' ? 'orange' : 'green'}>
                {viewRecord.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="授权日期">{viewRecord.grantedDate}</Descriptions.Item>
            <Descriptions.Item label="到期日期">{viewRecord.expireDate}</Descriptions.Item>
            <Descriptions.Item label="剩余天数">{viewRecord.daysRemaining} 天</Descriptions.Item>
            <Descriptions.Item label="监控天数">{viewRecord.monitorDays} 天</Descriptions.Item>
            <Descriptions.Item label="已延期次数">{viewRecord.extendCount} 次</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* 权限调整抽屉 */}
      <Drawer
        title="权限调整"
        open={adjustDrawerOpen}
        onClose={() => setAdjustDrawerOpen(false)}
        width={900}
        extra={
          <Space>
            <Button onClick={() => setAdjustDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => {
              message.success('调整申请已提交')
              setAdjustDrawerOpen(false)
            }}>提交</Button>
          </Space>
        }
      >
        {adjustRecord && (
          <div>
            {/* 人员信息 */}
            <Descriptions column={3} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="姓名">{adjustRecord.name}</Descriptions.Item>
              <Descriptions.Item label="工号">{adjustRecord.employeeId}</Descriptions.Item>
              <Descriptions.Item label="科室">{adjustRecord.department}</Descriptions.Item>
            </Descriptions>

            {/* 分类筛选 */}
            <div style={{ marginBottom: 12 }}>
              <Space>
                <span>分类筛选：</span>
                <Select
                  placeholder="全部分类"
                  allowClear
                  value={adjustCategoryFilter}
                  onChange={setAdjustCategoryFilter}
                  style={{ width: 160 }}
                  options={CATEGORY_OPTIONS}
                />
              </Space>
            </div>

            {/* 权限列表 */}
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: adjustCheckedIds,
                onChange: (keys: React.Key[]) => setAdjustCheckedIds(keys as string[]),
              }}
              columns={[
                { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
                { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 140 },
                { title: '权限配置', key: 'config', render: (_: unknown, r: SelectedPerm) => renderAdjustConfig(r) },
              ]}
              dataSource={filteredAdjustPerms}
            />

            {/* 调整原因 */}
            <Form form={adjustForm} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item name="reason" label="调整原因" rules={[{ required: true, message: '请输入调整原因' }]}>
                <Input.TextArea rows={3} placeholder="请输入调整原因..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>

      {/* 延期弹窗 */}
      <Drawer
        title="权限延期"
        open={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="延期方式" name="extendType" initialValue="date">
            <Radio.Group onChange={e => setExtendType(e.target.value)}>
              <Radio value="date">指定到期日</Radio>
              <Radio value="period">延长周期</Radio>
            </Radio.Group>
          </Form.Item>
          {extendType === 'date' ? (
            <Form.Item label="新到期日" name="newExpireDate" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          ) : (
            <Form.Item label="延长周期（天）" name="periodDays" rules={[{ required: true, message: '请输入天数' }]}>
              <InputNumber min={1} max={365} style={{ width: '100%' }} />
            </Form.Item>
          )}
          <Form.Item label="延期原因" name="reason" rules={[{ required: true, message: '请输入原因' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setExtendModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => {
              message.success('延期成功')
              setExtendModalOpen(false)
            }}>确认延期</Button>
          </Space>
        </div>
      </Drawer>

      {/* 回收弹窗 */}
      <Drawer
        title="权限回收"
        open={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        width={500}
      >
        <Form form={revokeForm} layout="vertical">
          <Form.Item label="回收原因" name="reason" rules={[{ required: true, message: '请输入回收原因' }]}>
            <Input.TextArea rows={3} placeholder="请输入回收原因..." />
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setRevokeModalOpen(false)}>取消</Button>
            <Button danger type="primary" onClick={() => {
              message.success('回收成功')
              setRevokeModalOpen(false)
            }}>确认回收</Button>
          </Space>
        </div>
      </Drawer>
    </div>
  )
}

// CATEGORY_OPTIONS 需要在组件外定义以避免 ts 报错（在调整抽屉 JSX 中引用）
const CATEGORY_OPTIONS = [
  { label: '处方权', value: '处方权' },
  { label: '手术等级', value: '手术等级' },
  { label: '手术目录', value: '手术目录' },
  { label: '新技术目录', value: '新技术目录' },
  { label: '临床用血', value: '临床用血' },
  { label: '麻醉等级', value: '麻醉等级' },
  { label: '操作', value: '操作' },
  { label: '报告', value: '报告' },
  { label: '设备', value: '设备' },
  { label: '病理', value: '病理' },
]

export default PermissionExtend
