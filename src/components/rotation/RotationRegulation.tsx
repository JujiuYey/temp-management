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
  message,
  Popconfirm,
  Typography,
  Timeline,
  Upload,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography

// ==================== 类型定义 ====================

interface RegulationRecord {
  id: string
  title: string
  applicableDept: string
  category: string
  content: string
  publishDate: string
  publisher: string
  status: 'draft' | 'published' | 'revoked'
  version: string
  effectiveDate: string
  link?: string
  attachment?: string
  targetDepts?: string[]
  targetRoles?: string[]
  targetUsers?: string[]
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
  { label: 'ICU', value: 'ICU' },
  { label: '全科', value: '全科' },
]

const SCOPE_OPTIONS = [
  { label: '全员', value: '全员' },
  { label: '指定部门', value: '指定部门' },
  { label: '指定角色', value: '指定角色' },
  { label: '指定用户', value: '指定用户' },
]

const ROLE_OPTIONS = [
  { label: '管理员', value: '管理员' },
  { label: '基地管理员', value: '基地管理员' },
  { label: '带教老师', value: '带教老师' },
  { label: '轮转学员', value: '轮转学员' },
]

const USER_OPTIONS = [
  { label: '张明', value: '张明' },
  { label: '王强', value: '王强' },
  { label: '李芳', value: '李芳' },
  { label: '赵敏', value: '赵敏' },
  { label: '刘洋', value: '刘洋' },
]

const CATEGORY_OPTIONS = [
  { label: '入科管理', value: '入科管理' },
  { label: '出科考核', value: '出科考核' },
  { label: '日常管理', value: '日常管理' },
  { label: '纪律要求', value: '纪律要求' },
  { label: '学习要求', value: '学习要求' },
  { label: '安全规范', value: '安全规范' },
]

const statusConfig: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  published: { color: 'success', text: '已发布' },
  revoked: { color: 'error', text: '已撤回' },
}

const mockData: RegulationRecord[] = [
  {
    id: '1',
    title: '内科轮转管理细则（2026版）',
    applicableDept: '指定部门',
    targetDepts: ['内科'],
    category: '日常管理',
    content: '一、入科要求\n1. 按时报到，不得迟到早退\n2. 穿戴整洁工作服，佩戴胸卡\n3. 熟悉科室布局及规章制度\n\n二、学习要求\n1. 每日参加早交班\n2. 管理床位不少于5张\n3. 完成入院病历不少于10份\n\n三、考核标准\n1. 理论考核：80分以上\n2. 技能操作：心肺复苏、四大穿刺\n3. 出科小结：需带教老师签字确认',
    publishDate: '2026-01-15',
    publisher: '王主任',
    status: 'published',
    version: 'V2.0',
    effectiveDate: '2026-02-01',
  },
  {
    id: '2',
    title: '外科轮转入科管理规范',
    applicableDept: '指定部门',
    targetDepts: ['外科'],
    category: '入科管理',
    content: '一、入科报到\n1. 报到时间：轮转首日上午8:00\n2. 报到地点：外科护士站\n3. 携带物品：工作服、胸卡、轮转手册\n\n二、科室介绍\n1. 科室概况及人员介绍\n2. 无菌操作规范培训\n3. 手术室参观及注意事项',
    publishDate: '2026-01-20',
    publisher: '李主任',
    status: 'published',
    version: 'V1.5',
    effectiveDate: '2026-02-01',
  },
  {
    id: '3',
    title: '急诊科出科考核标准',
    applicableDept: '指定角色',
    targetRoles: ['带教老师'],
    category: '出科考核',
    content: '一、考核内容\n1. 理论考核：急救理论知识\n2. 技能考核：心肺复苏、气管插管、电除颤\n3. 病例分析：至少完成2份急诊病例分析\n\n二、考核标准\n1. 理论考核：85分以上合格\n2. 技能考核：每项均需通过\n3. 带教评价：良好以上',
    publishDate: '2026-02-01',
    publisher: '赵主任',
    status: 'published',
    version: 'V1.0',
    effectiveDate: '2026-02-15',
  },
  {
    id: '4',
    title: 'ICU轮转安全操作规范',
    applicableDept: '全员',
    category: '安全规范',
    content: '一、院感防控\n1. 严格执行手卫生\n2. 正确使用个人防护装备\n3. 医疗废物分类处置\n\n二、设备操作\n1. 呼吸机基本操作\n2. 监护仪使用与报警处理\n3. 输液泵、注射泵操作规范',
    publishDate: '2026-03-10',
    publisher: '周主任',
    status: 'published',
    version: 'V1.2',
    effectiveDate: '2026-03-15',
  },
  {
    id: '5',
    title: '儿科轮转纪律要求（草案）',
    applicableDept: '指定部门',
    targetDepts: ['儿科'],
    category: '纪律要求',
    content: '一、考勤制度\n1. 不得迟到早退\n2. 请假需提前1天报备\n\n二、医患沟通\n1. 与家长沟通需耐心\n2. 不得单独与患儿家属进行诊疗操作',
    publishDate: '',
    publisher: '刘主任',
    status: 'draft',
    version: 'V0.9',
    effectiveDate: '',
  },
]

const RegulationList: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | 'view'>('add')
  const [editingRecord, setEditingRecord] = useState<RegulationRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [deptFilter, setDeptFilter] = useState<string | undefined>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [data, setData] = useState<RegulationRecord[]>(mockData)
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const scope = Form.useWatch('applicableDept', form)

  const filteredData = useMemo(() => {
    let result = data
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase()
      result = result.filter((r) => r.title.toLowerCase().includes(kw) || r.content.toLowerCase().includes(kw))
    }
    if (deptFilter) result = result.filter((r) => r.applicableDept === deptFilter)
    if (categoryFilter) result = result.filter((r) => r.category === categoryFilter)
    if (statusFilter) result = result.filter((r) => r.status === statusFilter)
    return result
  }, [data, searchText, deptFilter, categoryFilter, statusFilter])

  const handleAdd = () => {
    setDrawerMode('add')
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ category: '日常管理', applicableDept: '全员' })
    setFileList([])
    setDrawerOpen(true)
  }

  const handleEdit = (record: RegulationRecord) => {
    setDrawerMode('edit')
    setEditingRecord(record)
    form.setFieldsValue({
      title: record.title,
      category: record.category,
      applicableDept: record.applicableDept,
      targetDepts: record.targetDepts,
      targetRoles: record.targetRoles,
      targetUsers: record.targetUsers,
      content: record.content,
      link: record.link,
    })
    setFileList(record.attachment ? [{ uid: '-1', name: record.attachment, status: 'done' }] : [])
    setDrawerOpen(true)
  }

  const handleView = (record: RegulationRecord) => {
    setDrawerMode('view')
    setEditingRecord(record)
    setDrawerOpen(true)
  }

  const handleDelete = (record: RegulationRecord) => {
    setData(data.filter((r) => r.id !== record.id))
    message.success('删除成功')
  }

  const handlePublish = (record: RegulationRecord) => {
    const today = dayjs().format('YYYY-MM-DD')
    setData(data.map((r) => (r.id === record.id ? { ...r, status: 'published', publishDate: today, effectiveDate: today } : r)))
    message.success('发布成功')
  }

  const handleRevoke = (record: RegulationRecord) => {
    setData(data.map((r) => (r.id === record.id ? { ...r, status: 'revoked' } : r)))
    message.success('撤回成功')
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const attachment = fileList.length > 0 ? fileList[0].name : undefined
      if (drawerMode === 'add') {
        const newRecord: RegulationRecord = {
          id: String(Date.now()),
          ...values,
          attachment,
          version: 'V1.0',
          publisher: '张明',
          status: 'draft',
          publishDate: '',
          effectiveDate: '',
        }
        setData([newRecord, ...data])
        message.success('保存成功')
      } else if (drawerMode === 'edit') {
        setData(data.map((r) => (r.id === editingRecord?.id ? { ...r, ...values, attachment } : r)))
        message.success('修改成功')
      }
      setDrawerOpen(false)
    })
  }

  const columns: ColumnsType<RegulationRecord> = [
    { title: '序号', width: 60, render: (_, __, i) => i + 1 },
    {
      title: '标题',
      dataIndex: 'title',
      width: 280,
      render: (v: string, record) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <a onClick={() => handleView(record)} style={{ fontWeight: 500 }}>{v}</a>
        </Space>
      ),
    },
    { title: '接收范围', dataIndex: 'applicableDept', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '分类', dataIndex: 'category', width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: '发布日期', dataIndex: 'publishDate', width: 110, render: (v: string) => v || '--' },
    { title: '发布人', dataIndex: 'publisher', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: string) => {
        const cfg = statusConfig[s]
        return <Tag color={cfg.color} icon={s === 'published' ? <CheckCircleOutlined /> : s === 'revoked' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}>{cfg.text}</Tag>
      },
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size={0}>
          {record.status !== 'draft' && (
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          )}
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          )}
          {record.status === 'draft' && (
            <Popconfirm title="确认发布？" onConfirm={() => handlePublish(record)}>
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>发布</Button>
            </Popconfirm>
          )}
          {record.status === 'published' && (
            <Popconfirm title="确认撤回？" onConfirm={() => handleRevoke(record)}>
              <Button type="link" size="small" danger>撤回</Button>
            </Popconfirm>
          )}
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>发布管理细则</Button>
        </Col>
        <Col>
          <Space>
            <Input placeholder="搜索标题/内容" prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear style={{ width: 200 }} />
            <Select placeholder="接收范围" allowClear value={deptFilter} onChange={setDeptFilter} style={{ width: 120 }} options={SCOPE_OPTIONS} />
            <Select placeholder="分类" allowClear value={categoryFilter} onChange={setCategoryFilter} style={{ width: 120 }} options={CATEGORY_OPTIONS} />
            <Select placeholder="状态" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 100 }} options={[{ label: '草稿', value: 'draft' }, { label: '已发布', value: 'published' }, { label: '已撤回', value: 'revoked' }]} />
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        size="small"
        scroll={{ x: 1080 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      {/* 抽屉 */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>{drawerMode === 'add' ? '发布管理细则' : drawerMode === 'edit' ? '编辑管理细则' : '查看管理细则'}</span>}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={680}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {drawerMode === 'view' && editingRecord ? (
          // 查看模式
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>基本信息</div>
            <Row gutter={[16, 12]}>
              <Col span={24}><Text type="secondary" style={{ fontSize: 13 }}>标题：</Text><Text strong style={{ fontSize: 15 }}>{editingRecord.title}</Text></Col>
              <Col span={8}><Text type="secondary" style={{ fontSize: 13 }}>接收范围：</Text><Tag color="blue">{editingRecord.applicableDept}</Tag>{editingRecord.targetDepts?.length ? <Tag color="blue">{editingRecord.targetDepts.join('、')}</Tag> : null}{editingRecord.targetRoles?.length ? <Tag color="purple">{editingRecord.targetRoles.join('、')}</Tag> : null}{editingRecord.targetUsers?.length ? <Tag color="cyan">{editingRecord.targetUsers.join('、')}</Tag> : null}</Col>
              <Col span={8}><Text type="secondary" style={{ fontSize: 13 }}>分类：</Text><Tag>{editingRecord.category}</Tag></Col>
              <Col span={8}><Text type="secondary" style={{ fontSize: 13 }}>版本：</Text>{editingRecord.version}</Col>
              <Col span={8}><Text type="secondary" style={{ fontSize: 13 }}>发布人：</Text>{editingRecord.publisher}</Col>
              <Col span={8}><Text type="secondary" style={{ fontSize: 13 }}>发布日期：</Text>{editingRecord.publishDate || '--'}</Col>
              <Col span={8}><Text type="secondary" style={{ fontSize: 13 }}>生效日期：</Text>{editingRecord.effectiveDate || '--'}</Col>
              <Col span={24}><Text type="secondary" style={{ fontSize: 13 }}>状态：</Text><Tag color={statusConfig[editingRecord.status].color}>{statusConfig[editingRecord.status].text}</Tag></Col>
              {editingRecord.link && <Col span={24}><Text type="secondary" style={{ fontSize: 13 }}>跳转链接：</Text><a href={editingRecord.link} target="_blank" rel="noreferrer">{editingRecord.link}</a></Col>}
              {editingRecord.attachment && <Col span={24}><Text type="secondary" style={{ fontSize: 13 }}>附件：</Text><FileTextOutlined style={{ color: '#1890ff', marginRight: 4 }} />{editingRecord.attachment}</Col>}
            </Row>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '20px 0 12px', paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>细则内容</div>
            <div style={{ background: '#fafafa', borderRadius: 8, padding: '16px 20px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: '#333' }}>
              {editingRecord.content}
            </div>
          </div>
        ) : (
          // 新增/编辑模式
          <Form form={form} layout="horizontal" labelAlign="right" labelCol={{ flex: '0 0 90px' }} wrapperCol={{ flex: '1' }}>
            <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
              <Input placeholder="请输入标题" />
            </Form.Item>
            <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="请选择" options={CATEGORY_OPTIONS} style={{ width: 240 }} />
            </Form.Item>
            <Form.Item label="接收范围" required>
              <Row gutter={8}>
                <Col flex="160px">
                  <Form.Item name="applicableDept" noStyle>
                    <Select placeholder="请选择" options={SCOPE_OPTIONS} />
                  </Form.Item>
                </Col>
                {scope === '指定部门' && (
                  <Col flex="auto">
                    <Form.Item name="targetDepts" noStyle>
                      <Select mode="multiple" allowClear placeholder="请选择部门" options={DEPT_OPTIONS} maxTagCount="responsive" />
                    </Form.Item>
                  </Col>
                )}
                {scope === '指定角色' && (
                  <Col flex="auto">
                    <Form.Item name="targetRoles" noStyle>
                      <Select mode="multiple" allowClear placeholder="请选择角色" options={ROLE_OPTIONS} maxTagCount="responsive" />
                    </Form.Item>
                  </Col>
                )}
                {scope === '指定用户' && (
                  <Col flex="auto">
                    <Form.Item name="targetUsers" noStyle>
                      <Select mode="multiple" allowClear placeholder="请选择用户" options={USER_OPTIONS} maxTagCount="responsive" />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </Form.Item>
            <Form.Item name="link" label="跳转链接">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item label="附件">
              <Upload
                maxCount={1}
                fileList={fileList}
                beforeUpload={() => false}
                onRemove={() => setFileList([])}
                onChange={({ fileList: fl }) => setFileList(fl)}
              >
                <Button type="primary" icon={<UploadOutlined />}>上传</Button>
              </Upload>
            </Form.Item>
            <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
              <Input.TextArea rows={6} placeholder="请输入" style={{ fontSize: 14, lineHeight: 1.8 }} />
            </Form.Item>
          </Form>
        )}

        {drawerMode !== 'view' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>{drawerMode === 'add' ? '保存草稿' : '保存'}</Button>
          </div>
        )}
      </Drawer>
    </Card>
  )
}

export default RegulationList
