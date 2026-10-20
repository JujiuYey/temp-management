import React, { useState, useMemo } from 'react'
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
  Radio,
  InputNumber,
  Tooltip,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  UndoOutlined,
  SyncOutlined,
  UploadOutlined,
  ExportOutlined,
  UserAddOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'

// 类型定义
interface LeaveGrantDocument {
  id: string
  documentNo: string
  year: string
  projectCode: string
  projectName: string
  personCount: number
  totalDays: number
  status: 'draft' | 'applying' | 'completed'
  createTime: string
  createBy: string
}

interface LeaveGrantDetail {
  id: string
  employeeNo: string
  employeeName: string
  unitName: string
  department: string
  gender: string
  employeeStatus: string
  employmentType: string
  position: string
  childUnder3Count: number
  firstWorkDate: string
  entryDate: string
  totalWorkYears: number
  totalHospitalYears: number
  continuousHospitalYears: number
  shouldGrantDays: number
  lastYearBalance: number
  shouldDeductDays: number
  actualGrantDays: number
  remark?: string
  isModified?: boolean
  originalValue?: number
}

// 模拟数据
const mockDocuments: LeaveGrantDocument[] = [
  {
    id: 'd1',
    documentNo: 'LG202605001',
    year: '2026',
    projectCode: 'AL',
    projectName: '年假',
    personCount: 25,
    totalDays: 156.5,
    status: 'draft',
    createTime: '2026-05-09 10:30',
    createBy: '张三',
  },
  {
    id: 'd2',
    documentNo: 'LG202604002',
    year: '2026',
    projectCode: 'SL',
    projectName: '病假',
    personCount: 10,
    totalDays: 45,
    status: 'applying',
    createTime: '2026-04-28 14:20',
    createBy: '李四',
  },
  {
    id: 'd3',
    documentNo: 'LG202603001',
    year: '2026',
    projectCode: 'ML',
    projectName: '婚假',
    personCount: 3,
    totalDays: 18,
    status: 'completed',
    createTime: '2026-03-15 09:00',
    createBy: '王五',
  },
]

// 发放项目选项（仅显示控制余额的项目）
const projectOptions = [
  { label: '年假', value: 'AL' },
  { label: '病假', value: 'SL' },
  { label: '婚假', value: 'ML' },
  { label: '产假', value: 'PL' },
  { label: '陪产假', value: 'PPL' },
  { label: '丧假', value: 'BL' },
  { label: '年假(工作日)', value: 'AL_WD' },
  { label: '年假(自然日)', value: 'AL_CD' },
]

const mockDetails: LeaveGrantDetail[] = [
  {
    id: '1',
    employeeNo: 'E001',
    employeeName: '张三分',
    unitName: '内科',
    department: '心内科',
    gender: '男',
    employeeStatus: '在职',
    employmentType: '正式',
    position: '主治医师',
    childUnder3Count: 0,
    firstWorkDate: '2016-03-15',
    entryDate: '2019-08-01',
    totalWorkYears: 8.5,
    totalHospitalYears: 6.2,
    continuousHospitalYears: 5.8,
    shouldGrantDays: 10,
    lastYearBalance: 3,
    shouldDeductDays: 0,
    actualGrantDays: 13,
    remark: '',
  },
  {
    id: '2',
    employeeNo: 'E002',
    employeeName: '李思思',
    unitName: '内科',
    department: '消化内科',
    gender: '女',
    employeeStatus: '在职',
    employmentType: '合同',
    position: '住院医师',
    childUnder3Count: 1,
    firstWorkDate: '2021-06-20',
    entryDate: '2023-01-15',
    totalWorkYears: 3.2,
    totalHospitalYears: 2.5,
    continuousHospitalYears: 2.5,
    shouldGrantDays: 5,
    lastYearBalance: 2,
    shouldDeductDays: 0,
    actualGrantDays: 7,
    remark: '',
  },
  {
    id: '3',
    employeeNo: 'E003',
    employeeName: '王武',
    unitName: '内科',
    department: '呼吸内科',
    gender: '男',
    employeeStatus: '在职',
    employmentType: '正式',
    position: '副主任医师',
    childUnder3Count: 0,
    firstWorkDate: '2009-07-01',
    entryDate: '2013-05-10',
    totalWorkYears: 15.8,
    totalHospitalYears: 12.3,
    continuousHospitalYears: 10.5,
    shouldGrantDays: 15,
    lastYearBalance: 0,
    shouldDeductDays: 1,
    actualGrantDays: 14,
    isModified: true,
    originalValue: 15,
    remark: '上年度缺勤3天',
  },
]

const LeaveGrantPage: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<LeaveGrantDocument | null>(null)
  const [documents, setDocuments] = useState<LeaveGrantDocument[]>(mockDocuments)
  const [details, setDetails] = useState<LeaveGrantDetail[]>(mockDetails)

  // 筛选
  const [yearFilter, setYearFilter] = useState<string | null>('2026')
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // 新建发放单抽屉
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<LeaveGrantDocument | null>(null)
  const [form] = Form.useForm()

  // 筛选后的数据
  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
      const matchYear = !yearFilter || d.year === yearFilter
      const matchProject = !projectFilter || d.projectCode === projectFilter
      const matchStatus = !statusFilter || d.status === statusFilter
      return matchYear && matchProject && matchStatus
    })
  }, [documents, yearFilter, projectFilter, statusFilter])

  // 查看详情（打开抽屉）
  const handleView = (doc: LeaveGrantDocument) => {
    setSelectedDocument(doc)
    setEditingRecord(doc)
    form.setFieldsValue({
      year: doc.year,
      project: doc.projectCode,
    })
    setDrawerVisible(true)
  }

  // 删除
  const handleDelete = (doc: LeaveGrantDocument) => {
    if (doc.status !== 'draft') {
      message.warning('只有草稿状态的单据可以删除')
      return
    }
    setDocuments(documents.filter(d => d.id !== doc.id))
    message.success('删除成功')
  }

  // 提交
  const handleSubmit = (doc: LeaveGrantDocument) => {
    if (doc.status !== 'draft') {
      message.warning('只有草稿状态的单据可以提交')
      return
    }
    setDocuments(documents.map(d =>
      d.id === doc.id ? { ...d, status: 'applying' as const } : d
    ))
    message.success('提交成功')
  }

  // 编辑（打开抽屉表单）
  const handleEdit = (doc: LeaveGrantDocument) => {
    setEditingRecord(doc)
    setSelectedDocument(doc)
    form.setFieldsValue({
      year: doc.year,
      project: doc.projectCode,
    })
    setDrawerVisible(true)
  }

  // 撤销
  const handleRevoke = (doc: LeaveGrantDocument) => {
    if (doc.status !== 'applying') {
      message.warning('只有申请中状态的单据可以撤销')
      return
    }
    setDocuments(documents.map(d =>
      d.id === doc.id ? { ...d, status: 'draft' as const } : d
    ))
    message.success('撤销成功')
  }

  // 规则同步
  const handleSync = () => {
    message.loading('正在同步规则...', 1.5).then(() => {
      message.success('规则同步完成')
    })
  }

  // 修改应发数量
  const handleShouldGrantDaysChange = (id: string, value: number) => {
    setDetails(details.map(d => {
      if (d.id === id) {
        return {
          ...d,
          shouldGrantDays: value,
          actualGrantDays: value + d.lastYearBalance - d.shouldDeductDays,
          isModified: value !== d.originalValue,
        }
      }
      return d
    }))
  }

  // 列表页
  const renderListPage = () => (
    <div>
      {/* 工具栏+筛选栏合并为一行 */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null)
            form.resetFields()
            setDrawerVisible(true)
          }}
          style={{ height: 32 }}
          className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600"
        >
          新建发放单
        </Button>
        <Space size="middle" wrap>
          <Select
            placeholder="发放年度"
            value={yearFilter}
            onChange={setYearFilter}
            style={{ width: 120 }}
            options={[
              { label: '2026年', value: '2026' },
              { label: '2025年', value: '2025' },
            ]}
          />
          <Select
            placeholder="发放项目"
            value={projectFilter}
            onChange={setProjectFilter}
            allowClear
            style={{ width: 140 }}
            options={projectOptions}
          />
          <Select
            placeholder="状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '草稿中', value: 'draft' },
              { label: '申请中', value: 'applying' },
              { label: '已完成', value: 'completed' },
            ]}
          />
          <Button type="primary" style={{ height: 32 }}>查询</Button>
          <Button style={{ height: 32 }}>重置</Button>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={[
          { title: '单据编号', dataIndex: 'documentNo', key: 'documentNo', width: 160 },
          { title: '发放年度', dataIndex: 'year', key: 'year', width: 100 },
          { title: '发放项目', dataIndex: 'projectName', key: 'projectName', width: 120 },
          { title: '发放人数', dataIndex: 'personCount', key: 'personCount', width: 100 },
          {
            title: '发放天数',
            dataIndex: 'totalDays',
            key: 'totalDays',
            width: 100,
            render: (v: number) => v.toFixed(1),
          },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
              const config: Record<string, { color: string; text: string }> = {
                draft: { color: 'orange', text: '草稿中' },
                applying: { color: 'blue', text: '申请中' },
                completed: { color: 'green', text: '已完成' },
              }
              const { color, text } = config[status] || { color: 'default', text: status }
              return <Tag color={color}>{text}</Tag>
            },
          },
          { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
          {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_: unknown, record: LeaveGrantDocument) => (
              <Space size="small">
                {record.status === 'draft' && (
                  <>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ fontSize: 13 }}>
                      编辑
                    </Button>
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleSubmit(record)} className="!bg-blue-600" style={{ fontSize: 13 }}>
                      提交
                    </Button>
                    <Popconfirm
                      title="确定删除该单据？"
                      onConfirm={() => handleDelete(record)}
                    >
                      <Button size="small" variant="outlined" danger icon={<DeleteOutlined />} style={{ fontSize: 13 }}>删除</Button>
                    </Popconfirm>
                  </>
                )}
                {record.status === 'applying' && (
                  <>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} style={{ fontSize: 13 }}>
                      查看
                    </Button>
                    <Button size="small" icon={<UndoOutlined />} onClick={() => handleRevoke(record)} style={{ fontSize: 13 }}>
                      撤销
                    </Button>
                  </>
                )}
                {record.status === 'completed' && (
                  <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} style={{ fontSize: 13 }}>
                    查看
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
        dataSource={filteredDocuments}
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
    </div>
  )

  return (
    <div>
      {renderListPage()}

      {/* 新建/编辑/详情抽屉 */}
      <Drawer
        title={editingRecord ? '编辑假期发放单' : '新建假期发放单'}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
        width={1650}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setDrawerVisible(false)
              setEditingRecord(null)
              form.resetFields()
            }}>取消</Button>
            <Button
              type="primary"
              onClick={() => {
                form.validateFields().then(values => {
                  if (editingRecord) {
                    // 编辑模式：更新现有记录
                    const updatedDoc = {
                      ...editingRecord,
                      year: values.year,
                      projectCode: values.project,
                      projectName: projectOptions.find(p => p.value === values.project)?.label || '',
                    }
                    setDocuments(documents.map(d =>
                      d.id === editingRecord.id ? updatedDoc : d
                    ))
                    setSelectedDocument(updatedDoc)
                    setEditingRecord(updatedDoc)
                    form.setFieldsValue({
                      year: updatedDoc.year,
                      project: updatedDoc.projectCode,
                    })
                    message.success('保存成功')
                  } else {
                    // 新建模式
                    const newDoc: LeaveGrantDocument = {
                      id: `d${Date.now()}`,
                      documentNo: `LG${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
                      year: values.year,
                      projectCode: values.project,
                      projectName: projectOptions.find(p => p.value === values.project)?.label || '',
                      personCount: 0,
                      totalDays: 0,
                      status: 'draft',
                      createTime: new Date().toLocaleString(),
                      createBy: '当前用户',
                    }
                    setDocuments([newDoc, ...documents])
                    setSelectedDocument(newDoc)
                    setEditingRecord(newDoc)
                    form.setFieldsValue({
                      year: newDoc.year,
                      project: newDoc.projectCode,
                    })
                    message.success('创建成功')
                  }
                })
              }}
              className="!bg-blue-600"
            >
              {editingRecord ? '保存' : '创建'}
            </Button>
          </div>
        }
      >
        {/* 表单区域 */}
        <Form form={form} layout="vertical" className="mb-4">
          <div className="flex items-end gap-4 flex-wrap">
            <Form.Item
              name="year"
              label={<span className="font-bold">发放年度</span>}
              rules={[{ required: true, message: '请选择发放年度' }]}
              className="!mb-0"
            >
              <Select
                placeholder="请选择"
                options={[
                  { label: '2026年', value: '2026' },
                  { label: '2025年', value: '2025' },
                ]}
                style={{ width: 120 }}
              />
            </Form.Item>
            <Form.Item
              name="project"
              label={<span className="font-bold">发放项目</span>}
              rules={[{ required: true, message: '请选择发放项目' }]}
              className="!mb-0"
            >
              <Select
                placeholder="请选择"
                options={projectOptions}
                style={{ width: 150 }}
                onChange={(value) => {
                  const projectName = projectOptions.find(p => p.value === value)?.label || ''
                  form.setFieldsValue({ rule: projectName + '规则' })
                }}
              />
            </Form.Item>
            <Form.Item
              name="rule"
              label={<span className="font-bold">发放规则</span>}
              className="!mb-0"
            >
              <Input
                disabled
                placeholder="请先选择发放项目"
                style={{ width: 150 }}
                suffix={
                  <Tooltip
                    title={
                      <div className="text-sm">
                        <p className="font-bold mb-2">年假发放和扣除规则：</p>
                        <p className="mb-1"><strong>发放规则：</strong></p>
                        <p>1. 工龄 &lt; 10年，年假天数 = 5天</p>
                        <p>2. 工龄 ≥ 10年，年假天数 = 10天</p>
                        <p className="mt-2"><strong>扣除规则：</strong></p>
                        <p>1. 婚假期间扣除相应天数</p>
                        <p>2. 产假期间扣除相应天数</p>
                        <p>3. 病假超过30天扣除半天</p>
                      </div>
                    }
                    placement="bottom"
                  >
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                }
              />
            </Form.Item>
          </div>
          <Form.Item name="remark" label={<span className="font-bold">备注</span>}>
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>

        {/* 明细表格区域 */}
        <div>
          {/* 操作按钮区 */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <Input
              placeholder="姓名/工号"
              prefix={<span className="text-gray-400">🔍</span>}
              style={{ width: 160, height: 32 }}
            />
            <Button type="primary" icon={<SyncOutlined />} style={{ height: 32 }} className="!bg-blue-600">
              规则同步
            </Button>
            <Button icon={<UserAddOutlined />} style={{ height: 32 }}>
              添加人员
            </Button>
            <Button icon={<UploadOutlined />} style={{ height: 32 }}>
              批量导入
            </Button>
            <Button icon={<ExportOutlined />} style={{ height: 32 }}>
              导出
            </Button>
            <span className="ml-4 text-red-500 font-bold">
              合计发放人数：{details.length}人，发放天数：{details.reduce((sum, d) => sum + d.actualGrantDays, 0).toFixed(1)}天
            </span>
          </div>

          {/* 明细表格 */}
          <Table
            scroll={{ x: 1800 }}
            columns={[
              { title: '序号', key: 'index', width: 60, fixed: 'left', render: (_: unknown, __: unknown, idx: number) => idx + 1 },
              { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100, fixed: 'left' },
              { title: '姓名', dataIndex: 'employeeName', key: 'employeeName', width: 100, fixed: 'left' },
              { title: '所属单位', dataIndex: 'unitName', key: 'unitName', width: 160, render: () => '贵阳市XX医院总院区' },
              { title: '所属科室', dataIndex: 'department', key: 'department', width: 100 },
              { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
              { title: '人员状态', dataIndex: 'employeeStatus', key: 'employeeStatus', width: 80 },
              { title: '用工形式', dataIndex: 'employmentType', key: 'employmentType', width: 80 },
              { title: '岗位', dataIndex: 'position', key: 'position', width: 100 },
              { title: '3岁以下子女数', dataIndex: 'childUnder3Count', key: 'childUnder3Count', width: 100 },
              { title: '首次参加工作日期', dataIndex: 'firstWorkDate', key: 'firstWorkDate', width: 130 },
              { title: '入职日期', dataIndex: 'entryDate', key: 'entryDate', width: 100 },
              { title: '累计总工龄', dataIndex: 'totalWorkYears', key: 'totalWorkYears', width: 100, render: (v: number) => `${v}年` },
              { title: '累计院龄', dataIndex: 'totalHospitalYears', key: 'totalHospitalYears', width: 100, render: (v: number) => `${v}年` },
              { title: '连续院龄', dataIndex: 'continuousHospitalYears', key: 'continuousHospitalYears', width: 100, render: (v: number) => `${v}年` },
              {
                title: '本年应发数量',
                dataIndex: 'shouldGrantDays',
                key: 'shouldGrantDays',
                width: 120,
                render: (v: number, record: LeaveGrantDetail) =>
                  editingRecord?.status !== 'completed' ? (
                    <InputNumber
                      min={0}
                      precision={1}
                      value={v}
                      onChange={(val) => handleShouldGrantDaysChange(record.id, val || 0)}
                      style={{
                        width: '100%',
                        backgroundColor: record.isModified ? '#fff1f0' : undefined,
                        color: record.isModified ? '#cf1322' : undefined,
                      }}
                    />
                  ) : v,
              },
              { title: '上年结余', dataIndex: 'lastYearBalance', key: 'lastYearBalance', width: 80 },
              { title: '应扣数量', dataIndex: 'shouldDeductDays', key: 'shouldDeductDays', width: 80 },
              {
                title: '本年实发数量',
                dataIndex: 'actualGrantDays',
                key: 'actualGrantDays',
                width: 120,
                render: (v: number) => (
                  <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{v}</span>
                ),
              },
              {
                title: '备注',
                dataIndex: 'remark',
                key: 'remark',
                width: 120,
                render: (v: string, record: LeaveGrantDetail) =>
                  record.isModified && editingRecord?.status !== 'completed' ? (
                    <Tooltip title={`已手动修改（原值：${record.originalValue}）`}>
                      <Input
                        value={v}
                        onChange={(e) => {
                          setDetails(details.map(d =>
                            d.id === record.id ? { ...d, remark: e.target.value } : d
                          ))
                        }}
                        style={{ backgroundColor: '#fff1f0' }}
                      />
                    </Tooltip>
                  ) : v,
              },
              {
                title: '操作',
                key: 'action',
                width: 80,
                fixed: 'right',
                render: (_: unknown, record: LeaveGrantDetail) =>
                  editingRecord?.status !== 'completed' ? (
                    <Popconfirm
                      title="确定移除该人员？"
                      onConfirm={() => {
                        setDetails(details.filter(d => d.id !== record.id))
                        message.success('移除成功')
                      }}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} style={{ fontSize: 13 }}>
                        移除
                      </Button>
                    </Popconfirm>
                  ) : null,
              },
            ]}
            dataSource={details}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total: number) => `共 ${total} 条`,
              position: ['bottomLeft'],
            }}
            size="middle"
          />
        </div>
      </Drawer>
    </div>
  )
}

export default LeaveGrantPage
