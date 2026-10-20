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
  Row,
  Col,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Empty,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HolderOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

// ==================== 类型定义 ====================

interface RotationDeptItem {
  key: string
  deptName: string
  duration: number // 月
  exitAssessment: string[] // 出科考核项
  required: boolean
}

interface RotationTemplateRecord {
  id: string
  templateName: string
  description: string
  deptCount: number
  totalMonths: number
  status: boolean
  depts: RotationDeptItem[]
}

// ==================== 常量 ====================

const DEPT_OPTIONS = [
  { label: '内科', value: '内科' },
  { label: '外科', value: '外科' },
  { label: '妇产科', value: '妇产科' },
  { label: '儿科', value: '儿科' },
  { label: '急诊科', value: '急诊科' },
  { label: '麻醉科', value: '麻醉科' },
  { label: '检验科', value: '检验科' },
  { label: '影像科', value: '影像科' },
  { label: '病理科', value: '病理科' },
  { label: '药剂科', value: '药剂科' },
  { label: 'ICU', value: 'ICU' },
  { label: '心电图室', value: '心电图室' },
]

const ASSESSMENT_OPTIONS = [
  { label: '理论考核', value: '理论考核' },
  { label: '技能操作', value: '技能操作' },
  { label: '病例分析', value: '病例分析' },
  { label: '出科小结', value: '出科小结' },
  { label: '带教评价', value: '带教评价' },
  { label: '工作量统计', value: '工作量统计' },
]

const mockData: RotationTemplateRecord[] = [
  {
    id: '1',
    templateName: '住院医师规范化培训轮转模版',
    description: '适用于住院医师规培，覆盖主要临床科室',
    deptCount: 4,
    totalMonths: 12,
    status: true,
    depts: [
      { key: 'd1', deptName: '内科', duration: 3, exitAssessment: ['理论考核', '技能操作', '出科小结'], required: true },
      { key: 'd2', deptName: '外科', duration: 3, exitAssessment: ['理论考核', '技能操作', '病例分析'], required: true },
      { key: 'd3', deptName: '急诊科', duration: 3, exitAssessment: ['理论考核', '带教评价'], required: true },
      { key: 'd4', deptName: '麻醉科', duration: 3, exitAssessment: ['技能操作', '出科小结'], required: true },
    ],
  },
  {
    id: '2',
    templateName: '全科医师轮转模版',
    description: '适用于全科医师培养，侧重基层常见病',
    deptCount: 5,
    totalMonths: 12,
    status: true,
    depts: [
      { key: 'd1', deptName: '内科', duration: 4, exitAssessment: ['理论考核', '技能操作', '出科小结'], required: true },
      { key: 'd2', deptName: '儿科', duration: 2, exitAssessment: ['理论考核', '带教评价'], required: true },
      { key: 'd3', deptName: '妇产科', duration: 2, exitAssessment: ['技能操作', '出科小结'], required: true },
      { key: 'd4', deptName: '急诊科', duration: 2, exitAssessment: ['理论考核', '病例分析'], required: true },
      { key: 'd5', deptName: '检验科', duration: 2, exitAssessment: ['工作量统计'], required: false },
    ],
  },
  {
    id: '3',
    templateName: '进修医师短期轮转模版',
    description: '适用于进修医师，6个月短期轮转',
    deptCount: 3,
    totalMonths: 6,
    status: true,
    depts: [
      { key: 'd1', deptName: '外科', duration: 2, exitAssessment: ['技能操作', '病例分析', '出科小结'], required: true },
      { key: 'd2', deptName: 'ICU', duration: 2, exitAssessment: ['理论考核', '技能操作'], required: true },
      { key: 'd3', deptName: '麻醉科', duration: 2, exitAssessment: ['带教评价', '出科小结'], required: true },
    ],
  },
  {
    id: '4',
    templateName: '医技科室轮转模版',
    description: '适用于医技科室人员跨科轮转',
    deptCount: 3,
    totalMonths: 6,
    status: false,
    depts: [
      { key: 'd1', deptName: '检验科', duration: 2, exitAssessment: ['理论考核', '工作量统计'], required: true },
      { key: 'd2', deptName: '影像科', duration: 2, exitAssessment: ['技能操作', '出科小结'], required: true },
      { key: 'd3', deptName: '病理科', duration: 2, exitAssessment: ['理论考核', '病例分析'], required: true },
    ],
  },
]

let deptKeyCounter = 100

const RotationRule: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add')
  const [editingRecord, setEditingRecord] = useState<RotationTemplateRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [data, setData] = useState<RotationTemplateRecord[]>(mockData)
  const [form] = Form.useForm()

  const filteredData = useMemo(() => {
    let result = data
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase()
      result = result.filter((r) => r.templateName.toLowerCase().includes(kw) || r.description.toLowerCase().includes(kw))
    }
    if (statusFilter === '启用') result = result.filter((r) => r.status)
    if (statusFilter === '停用') result = result.filter((r) => !r.status)
    return result
  }, [data, searchText, statusFilter])

  const handleAdd = () => {
    setDrawerMode('add')
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ depts: [], status: true })
    setDrawerOpen(true)
  }

  const handleEdit = (record: RotationTemplateRecord) => {
    setDrawerMode('edit')
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      depts: record.depts,
    })
    setDrawerOpen(true)
  }

  const handleView = (record: RotationTemplateRecord) => {
    setDrawerMode('view')
    setEditingRecord(record)
    form.setFieldsValue(record)
    setDrawerOpen(true)
  }

  const handleDelete = (record: RotationTemplateRecord) => {
    setData(data.filter((r) => r.id !== record.id))
    message.success('删除成功')
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const depts = values.depts || []
      const totalMonths = depts.reduce((sum: number, d: RotationDeptItem) => sum + (d.duration || 0), 0)
      const payload = {
        ...values,
        depts,
        deptCount: depts.length,
        totalMonths,
      }
      if (drawerMode === 'add') {
        const newRecord: RotationTemplateRecord = {
          id: String(Date.now()),
          ...payload,
        }
        setData([newRecord, ...data])
        message.success('新增成功')
      } else if (drawerMode === 'edit') {
        setData(data.map((r) => (r.id === editingRecord?.id ? { ...r, ...payload } : r)))
        message.success('修改成功')
      }
      setDrawerOpen(false)
    })
  }

  const columns: ColumnsType<RotationTemplateRecord> = [
    {
      title: '序号',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    { title: '模版名称', dataIndex: 'templateName', width: 220 },
    { title: '描述', dataIndex: 'description', width: 220, ellipsis: true },
    { title: '轮转科室数', dataIndex: 'deptCount', width: 100, align: 'center' as const },
    { title: '总时长(月)', dataIndex: 'totalMonths', width: 100, align: 'center' as const },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: boolean) => <Tag color={status ? 'green' : 'default'}>{status ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 抽屉内轮转科室表格列
  const deptColumns = [
    {
      title: '序号',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    { title: '科室', dataIndex: 'deptName', width: 120 },
    { title: '轮转时长(月)', dataIndex: 'duration', width: 100, align: 'center' as const },
    {
      title: '出科考核',
      dataIndex: 'exitAssessment',
      render: (items: string[]) => (
        <Space wrap size={[4, 4]}>
          {items?.map((item) => (
            <Tag key={item} color="blue" style={{ fontSize: 12 }}>
              {item}
            </Tag>
          )) || <span style={{ color: '#ccc' }}>-</span>}
        </Space>
      ),
    },
    {
      title: '必须',
      dataIndex: 'required',
      width: 60,
      align: 'center' as const,
      render: (v: boolean) => (v ? <Tag color="red">必须</Tag> : <Tag>可选</Tag>),
    },
  ]

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      {/* 顶部操作栏 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增轮转模版
            </Button>
          </Space>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="搜索模版名称/描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 220 }}
            />
            <Select
              placeholder="状态筛选"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[
                { label: '启用', value: '启用' },
                { label: '停用', value: '停用' },
              ]}
            />
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        size="small"
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      {/* 新增/编辑/查看抽屉 */}
      <Drawer
        title={
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            {drawerMode === 'add' ? '新增轮转模版' : drawerMode === 'edit' ? '编辑轮转模版' : '查看轮转模版'}
          </span>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={760}
        styles={{ body: { paddingBottom: 80 } }}
      >
        <Form
          form={form}
          layout="horizontal"
          size="small"
          labelAlign="left"
          labelCol={{ flex: '0 0 100px' }}
          wrapperCol={{ flex: '1' }}
          disabled={drawerMode === 'view'}
        >
          {/* 基本信息section */}
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
            基本信息
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="templateName" label="模版名称" rules={[{ required: true, message: '请输入' }]}>
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={2} placeholder="请输入描述" />
              </Form.Item>
            </Col>
          </Row>

          {/* 轮转科室配置section */}
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0', marginTop: 8 }}>
            轮转科室配置
          </div>

          {drawerMode === 'view' ? (
            // 查看模式：表格展示
            <Table
              columns={deptColumns}
              dataSource={editingRecord?.depts || []}
              rowKey="key"
              size="small"
              pagination={false}
              style={{ marginBottom: 16 }}
            />
          ) : (
            // 编辑模式：Form.List 动态表单
            <Form.List name="depts">
              {(fields, { add, remove, move }) => (
                <>
                  {fields.length === 0 && (
                    <Empty description="暂无轮转科室" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginBottom: 16 }} />
                  )}
                  {fields.map((field, index) => (
                    <div
                      key={field.key}
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                        padding: '12px 12px 0 12px',
                        marginBottom: 12,
                        background: '#fafafa',
                      }}
                    >
                      <Row gutter={8} align="middle">
                        <Col flex="auto">
                          <Space size={8} wrap>
                            <Form.Item
                              {...field}
                              name={[field.name, 'deptName']}
                              rules={[{ required: true, message: '请选择科室' }]}
                              style={{ marginBottom: 8 }}
                            >
                              <Select
                                placeholder="选择科室"
                                style={{ width: 140 }}
                                options={DEPT_OPTIONS}
                              />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, 'duration']}
                              rules={[{ required: true, message: '请输入' }]}
                              style={{ marginBottom: 8 }}
                            >
                              <InputNumber placeholder="月数" min={1} max={36} addonAfter="月" style={{ width: 120 }} />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, 'required']}
                              valuePropName="checked"
                              style={{ marginBottom: 8 }}
                            >
                              <Switch checkedChildren="必须" unCheckedChildren="可选" size="small" />
                            </Form.Item>
                          </Space>
                        </Col>
                        <Col>
                          <Space>
                            <Button
                              type="text"
                              size="small"
                              icon={<HolderOutlined />}
                              disabled={index === 0}
                              onClick={() => move(index, index - 1)}
                            />
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(field.name)}
                            />
                          </Space>
                        </Col>
                      </Row>
                      <Form.Item
                        {...field}
                        name={[field.name, 'exitAssessment']}
                        label="出科考核"
                        style={{ marginBottom: 8 }}
                      >
                        <Select
                          mode="multiple"
                          placeholder="选择出科考核项"
                          style={{ width: '100%' }}
                          options={ASSESSMENT_OPTIONS}
                          maxTagCount="responsive"
                        />
                      </Form.Item>
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({
                        key: `d${++deptKeyCounter}`,
                        deptName: undefined,
                        duration: 1,
                        exitAssessment: [],
                        required: true,
                      })
                    }
                  >
                    添加轮转科室
                  </Button>
                </>
              )}
            </Form.List>
          )}

          {/* 汇总信息（查看模式） */}
          {drawerMode === 'view' && editingRecord && (
            <>
              <Divider style={{ margin: '16px 0 12px' }} />
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: '#f6ffed', borderRadius: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{editingRecord.deptCount}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>轮转科室数</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: '#e6f7ff', borderRadius: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>{editingRecord.totalMonths}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>总时长(月)</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '8px 0', background: '#fff7e6', borderRadius: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fa8c16' }}>
                      {editingRecord.depts.filter((d) => d.required).length}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>必须科室</div>
                  </div>
                </Col>
              </Row>
            </>
          )}
        </Form>

        {drawerMode !== 'view' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 24px',
              borderTop: '1px solid #f0f0f0',
              background: '#fff',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              {drawerMode === 'add' ? '确定' : '保存'}
            </Button>
          </div>
        )}
      </Drawer>
    </Card>
  )
}

export default RotationRule
