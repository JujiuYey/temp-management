import React, { useState, useMemo } from 'react'
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
  Switch,
  Row,
  Col,
  message,
  Popconfirm,
  Checkbox,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface PermissionGroupRecord {
  id: string
  groupName: string
  groupCode: string
  memberCount: number
  permissions: string[]
  description: string
  status: boolean
}

/** 抽屉内权限列表的模拟数据 */
const PERMISSION_CATALOG = [
  { id: 'P001', category: '处方权', permissionName: '普通处方权' },
  { id: 'P002', category: '处方权', permissionName: '抗菌药物处方权' },
  { id: 'P003', category: '处方权', permissionName: '麻醉处方权' },
  { id: 'P004', category: '手术等级', permissionName: '一级手术权限' },
  { id: 'P005', category: '手术等级', permissionName: '二级手术权限' },
  { id: 'P006', category: '手术等级', permissionName: '三级手术权限' },
  { id: 'P007', category: '手术等级', permissionName: '四级手术权限' },
  { id: 'P008', category: '手术目录', permissionName: '腹腔镜胆囊切除术' },
  { id: 'P009', category: '手术目录', permissionName: '阑尾切除术' },
  { id: 'P010', category: '临床用血', permissionName: '红细胞输注权限' },
  { id: 'P011', category: '临床用血', permissionName: '血浆输注权限' },
  { id: 'P012', category: '麻醉等级', permissionName: '一级麻醉权限' },
  { id: 'P013', category: '麻醉等级', permissionName: '三级麻醉权限' },
  { id: 'P014', category: '操作', permissionName: '经皮穿刺活检术' },
  { id: 'P015', category: '操作', permissionName: '胃镜检查术' },
  { id: 'P016', category: '报告', permissionName: '检验报告签发权' },
  { id: 'P017', category: '报告', permissionName: '影像报告审核权' },
  { id: 'P018', category: '设备', permissionName: '大型设备操作权' },
  { id: 'P019', category: '设备', permissionName: '特种设备操作权' },
  { id: 'P020', category: '病理', permissionName: '病理诊断报告权' },
]

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

const PermissionGroup: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PermissionGroupRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [form] = Form.useForm()

  // 抽屉内权限列表的筛选条件
  const [drawerCategoryFilter, setDrawerCategoryFilter] = useState<string | undefined>(undefined)
  const [drawerNameFilter, setDrawerNameFilter] = useState('')
  // 已勾选的权限ID列表
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])

  const [data, setData] = useState<PermissionGroupRecord[]>([
    { id: '1', groupName: '外科医生组', groupCode: 'SURG_GRP', memberCount: 45, permissions: ['P004', 'P005', 'P008', 'P009'], description: '新入职人员', status: true },
    { id: '2', groupName: '内科医生组', groupCode: 'MED_GRP', memberCount: 38, permissions: ['P001', 'P002', 'P016'], description: '内科全体医生', status: true },
    { id: '3', groupName: '护理组', groupCode: 'NUR_GRP', memberCount: 120, permissions: ['P010', 'P011'], description: '全体护理人员', status: true },
    { id: '4', groupName: '药剂科组', groupCode: 'PHR_GRP', memberCount: 25, permissions: ['P001', 'P002', 'P003'], description: '药剂科人员', status: true },
    { id: '5', groupName: '医技组', groupCode: 'TEC_GRP', memberCount: 30, permissions: ['P016', 'P017'], description: '检验/影像人员', status: true },
    { id: '6', groupName: '实习生组', groupCode: 'INT_GRP', memberCount: 15, permissions: ['P001'], description: '实习医生', status: true },
    { id: '7', groupName: '急诊科组', groupCode: 'ER_GRP', memberCount: 32, permissions: ['P001', 'P003', 'P012'], description: '急诊科人员', status: true },
  ])

  // 抽屉内权限列表根据筛选条件过滤
  const filteredPermissions = useMemo(() => {
    let result = PERMISSION_CATALOG
    if (drawerCategoryFilter) {
      result = result.filter((item) => item.category === drawerCategoryFilter)
    }
    if (drawerNameFilter.trim()) {
      const keyword = drawerNameFilter.trim().toLowerCase()
      result = result.filter((item) => item.permissionName.toLowerCase().includes(keyword))
    }
    return result
  }, [drawerCategoryFilter, drawerNameFilter])

  // 权限列表表格列（抽屉内）
  const permissionColumns: ColumnsType<typeof PERMISSION_CATALOG[number]> = [
    {
      title: <Checkbox
        checked={filteredPermissions.length > 0 && filteredPermissions.every((p) => selectedPermissionIds.includes(p.id))}
        indeterminate={filteredPermissions.some((p) => selectedPermissionIds.includes(p.id)) && !filteredPermissions.every((p) => selectedPermissionIds.includes(p.id))}
        onChange={(e) => {
          const ids = filteredPermissions.map((p) => p.id)
          if (e.target.checked) {
            setSelectedPermissionIds([...new Set([...selectedPermissionIds, ...ids])])
          } else {
            setSelectedPermissionIds(selectedPermissionIds.filter((id) => !ids.includes(id)))
          }
        }}
      />,
      key: 'select',
      width: 50,
      render: (_: unknown, record: typeof PERMISSION_CATALOG[number]) => (
        <Checkbox
          checked={selectedPermissionIds.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedPermissionIds([...selectedPermissionIds, record.id])
            } else {
              setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== record.id))
            }
          }}
        />
      ),
    },
    { title: '权限分类', dataIndex: 'category', key: 'category', width: 120 },
    { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 200 },
  ]

  // 外层表格列
  const columns: ColumnsType<PermissionGroupRecord> = [
    { title: '序号', key: 'index', width: 60, align: 'center', render: (_: unknown, __: PermissionGroupRecord, index: number) => index + 1 },
    { title: '分组名称', dataIndex: 'groupName', key: 'groupName', width: 140 },
    { title: '数量', dataIndex: 'permissions', key: 'permissions', width: 80, align: 'center',
      render: (perms: string[]) => perms.length },
    {
      title: '权限', dataIndex: 'permissions', key: 'permissions', width: 260,
      render: (perms: string[]) => {
        const names = perms.map((id) => PERMISSION_CATALOG.find((p) => p.id === id)?.permissionName).filter(Boolean) as string[]
        const displayNames = names.slice(0, 3)
        const restNames = names.slice(3)
        return (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {displayNames.map((p) => (
                <Tag key={p} color="purple" style={{ marginBottom: 0 }}>{p}</Tag>
              ))}
              {restNames.length > 0 && (
                <Tooltip title={restNames.map((p) => p).join('、')}>
                  <Tag color="purple" style={{ marginBottom: 0, cursor: 'pointer' }}>+{restNames.length}</Tag>
                </Tooltip>
              )}
            </div>
          </div>
        )
      },
    },
    { title: '描述', dataIndex: 'description', key: 'description', width: 140, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (status: boolean) => <Tag color={status ? 'green' : 'default'}>{status ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 150, fixed: 'right',
      render: (_: unknown, record: PermissionGroupRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record)
              form.setFieldsValue({ groupName: record.groupName, description: record.description, status: record.status })
              setSelectedPermissionIds(record.permissions)
              setDrawerCategoryFilter(undefined)
              setDrawerNameFilter('')
              setDrawerOpen(true)
            }}>
            编辑
          </Button>
          <Popconfirm title="确定删除该分组？" onConfirm={() => { setData(data.filter((item) => item.id !== record.id)); message.success('删除成功') }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleSearch = () => { message.info('搜索功能待接入后端接口') }
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ status: true })
    setSelectedPermissionIds([])
    setDrawerCategoryFilter(undefined)
    setDrawerNameFilter('')
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        setData(data.map((item) =>
          item.id === editingRecord.id ? { ...item, ...values, permissions: selectedPermissionIds } : item
        ))
        message.success('修改成功')
      } else {
        setData([...data, { ...values, id: String(Date.now()), groupCode: '', memberCount: 0, permissions: selectedPermissionIds }])
        message.success('新增成功')
      }
      setDrawerOpen(false)
    } catch { /* 表单验证失败 */ }
  }

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增分组</Button>
          <Space wrap>
            <Input placeholder="搜索分组名称/编码" prefix={<SearchOutlined />} value={searchText}
              onChange={(e) => setSearchText(e.target.value)} onPressEnter={handleSearch} style={{ width: 240 }} allowClear />
            <Select placeholder="状态" value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} allowClear
              options={[{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }]} />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
            <Button onClick={() => { setSearchText(''); setStatusFilter(undefined) }}>重置</Button>
          </Space>
        </div>
      </Card>

      <Table columns={columns} dataSource={data} rowKey="id" scroll={{ x: 1020 }} size="middle"
        pagination={{ total: data.length, pageSize: 10, showTotal: (total) => `共 ${total} 条记录`, showSizeChanger: true, showQuickJumper: true }} />

      {/* 新增/编辑抽屉 */}
      <Drawer
        title={editingRecord ? '编辑权限分组' : '新增权限分组'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSave}>保存</Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="horizontal" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} labelAlign="left">
          <Form.Item label="分组名称" name="groupName" rules={[{ required: true, message: '请输入分组名称' }]}>
            <Input placeholder="请输入分组名称" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入描述信息" />
          </Form.Item>
          <Form.Item label="状态" name="status" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>

        {/* 权限筛选条件 */}
        <div style={{ marginTop: 16, marginBottom: 12 }}>
          <Row gutter={12}>
            <Col span={8}>
              <Select
                placeholder="权限分类"
                value={drawerCategoryFilter}
                onChange={setDrawerCategoryFilter}
                style={{ width: '100%' }}
                allowClear
                options={CATEGORY_OPTIONS}
              />
            </Col>
            <Col span={16}>
              <Input
                placeholder="权限名称查询"
                prefix={<SearchOutlined />}
                value={drawerNameFilter}
                onChange={(e) => setDrawerNameFilter(e.target.value)}
                allowClear
              />
            </Col>
          </Row>
        </div>

        {/* 权限列表 */}
        <Table
          columns={permissionColumns}
          dataSource={filteredPermissions}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 360 }}
        />
      </Drawer>
    </div>
  )
}

export default PermissionGroup
