import React, { useState } from 'react'
import {
  Card,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Form,
  Radio,
  Switch,
  message,
  Popconfirm,
  Empty,
  Drawer,
  Table,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  SearchOutlined,
} from '@ant-design/icons'

// ==================== 常量 ====================

import { INITIAL_BASES } from './rotationShared'
import type { BaseRecord, RotationDeptEntry } from './rotationShared'

const BASE_TYPE_OPTIONS = [
  { label: '内科专业', value: '内科专业' },
  { label: '外科专业', value: '外科专业' },
  { label: '妇产科专业', value: '妇产科专业' },
  { label: '儿科专业', value: '儿科专业' },
  { label: '急诊科专业', value: '急诊科专业' },
  { label: '神经内科专业', value: '神经内科专业' },
  { label: '麻醉科专业', value: '麻醉科专业' },
  { label: '全科专业', value: '全科专业' },
  { label: '骨科专业', value: '骨科专业' },
  { label: '泌尿外科专业', value: '泌尿外科专业' },
  { label: '神经外科专业', value: '神经外科专业' },
  { label: '胸心外科专业', value: '胸心外科专业' },
  { label: '整形外科专业', value: '整形外科专业' },
  { label: '眼科专业', value: '眼科专业' },
  { label: '耳鼻咽喉科专业', value: '耳鼻咽喉科专业' },
  { label: '皮肤科专业', value: '皮肤科专业' },
  { label: '精神科专业', value: '精神科专业' },
  { label: '康复医学科专业', value: '康复医学科专业' },
  { label: '重症医学科专业', value: '重症医学科专业' },
  { label: '医学影像科专业', value: '医学影像科专业' },
  { label: '放射科专业', value: '放射科专业' },
  { label: '超声医学科专业', value: '超声医学科专业' },
  { label: '核医学科专业', value: '核医学科专业' },
  { label: '临床病理科专业', value: '临床病理科专业' },
  { label: '检验医学科专业', value: '检验医学科专业' },
  { label: '放射肿瘤科专业', value: '放射肿瘤科专业' },
  { label: '中医专业', value: '中医专业' },
  { label: '中医全科专业', value: '中医全科专业' },
  { label: '医技专业', value: '医技专业' },
]

const ROTATION_TYPE_OPTIONS = [
  { label: '必选', value: 'required' },
  { label: '可选', value: 'optional' },
]

const PERIOD_UNIT_OPTIONS = [
  { label: '月', value: 'month' },
  { label: '周', value: 'week' },
]

const mockData: BaseRecord[] = INITIAL_BASES

let entryKeyCounter = 200

const RotationBase: React.FC = () => {
  const [data, setData] = useState<BaseRecord[]>(mockData)
  const [baseKeyword, setBaseKeyword] = useState('')
  const [selectedBaseId, setSelectedBaseId] = useState<string | undefined>(undefined)
  const [hoverBaseId, setHoverBaseId] = useState<string | null>(null)
  // 新建/编辑基地抽屉
  const [createOpen, setCreateOpen] = useState(false)
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null)
  const [createForm] = Form.useForm()
  // 轮转科室录入抽屉
  const [deptDrawerOpen, setDeptDrawerOpen] = useState(false)
  const [editingDeptKey, setEditingDeptKey] = useState<string | null>(null)
  const [deptForm] = Form.useForm()

  const selectedBase = data.find((r) => r.id === selectedBaseId) || null

  const filteredBases = data.filter((b) =>
    b.baseName.toLowerCase().includes(baseKeyword.trim().toLowerCase()),
  )

  // 实时汇总：直接累计（月、周分别累加，不做年/周/月换算）
  const totalMonths = (selectedBase?.depts ?? [])
    .filter((d) => d.periodUnit === 'month')
    .reduce((s, d) => s + (Number(d.period) || 0), 0)
  const totalWeeks = (selectedBase?.depts ?? [])
    .filter((d) => d.periodUnit === 'week')
    .reduce((s, d) => s + (Number(d.period) || 0), 0)
  const periodParts: string[] = []
  if (totalMonths > 0) periodParts.push(`${totalMonths}个月`)
  if (totalWeeks > 0) periodParts.push(`${totalWeeks}个周`)
  const periodText = periodParts.join('') || '0'

  // 直接更新当前选中基地的科室列表（去掉底部保存，改动即时生效）
  const updateSelectedDepts = (updater: (depts: RotationDeptEntry[]) => RotationDeptEntry[]) => {
    if (!selectedBaseId) return
    setData((prev) =>
      prev.map((r) => (r.id === selectedBaseId ? { ...r, depts: updater(r.depts) } : r)),
    )
  }

  // —— 轮转科室录入抽屉 ——
  const openAddDept = () => {
    setEditingDeptKey(null)
    deptForm.resetFields()
    deptForm.setFieldsValue({
      period: 1,
      periodUnit: 'month',
      rotationType: 'required',
    })
    setDeptDrawerOpen(true)
  }
  const openEditDept = (record: RotationDeptEntry) => {
    setEditingDeptKey(record.key)
    deptForm.setFieldsValue({
      standardName: record.standardName,
      period: record.period,
      periodUnit: record.periodUnit,
      rotationGoal: record.rotationGoal,
      basicRequirement: record.basicRequirement,
      improveRequirement: record.improveRequirement,
      otherRemark: record.otherRemark,
      rotationType: record.rotationType,
    })
    setDeptDrawerOpen(true)
  }
  const handleDeptDrawerOk = () => {
    deptForm.validateFields().then((values: any) => {
      const entry: RotationDeptEntry = {
        key: editingDeptKey || `e${++entryKeyCounter}`,
        standardName: values.standardName,
        period: values.period || 0,
        periodUnit: values.periodUnit || 'month',
        rotationGoal: values.rotationGoal || '',
        basicRequirement: values.basicRequirement || '',
        improveRequirement: values.improveRequirement || '',
        otherRemark: values.otherRemark || '',
        rotationType: values.rotationType || 'required',
      }
      if (editingDeptKey) {
        updateSelectedDepts((list) => list.map((d) => (d.key === editingDeptKey ? entry : d)))
      } else {
        updateSelectedDepts((list) => [...list, entry])
      }
      setDeptDrawerOpen(false)
      message.success(editingDeptKey ? '修改成功' : '添加成功')
    })
  }
  const removeDeptEntry = (key: string) =>
    updateSelectedDepts((list) => list.filter((d) => d.key !== key))

  const handleSelectBase = (id: string) => setSelectedBaseId(id)

  const handleDelete = (record: BaseRecord) => {
    setData(data.filter((r) => r.id !== record.id))
    if (selectedBaseId === record.id) setSelectedBaseId(undefined)
    message.success('删除成功')
  }

  const openEditBase = (record: BaseRecord) => {
    setEditingBaseId(record.id)
    setSelectedBaseId(record.id)
    createForm.setFieldsValue({
      baseName: record.baseName,
      baseCode: record.baseCode,
      baseType: record.baseType,
      status: record.status,
      description: record.description,
    })
    setCreateOpen(true)
  }

  const handleCreateOk = () => {
    createForm.validateFields().then((values: any) => {
      if (editingBaseId) {
        setData((prev) =>
          prev.map((r) =>
            r.id === editingBaseId
              ? {
                  ...r,
                  baseName: values.baseName,
                  baseCode: values.baseCode || '',
                  baseType: values.baseType || '',
                  status: values.status ?? true,
                  description: values.description || '',
                }
              : r,
          ),
        )
        setCreateOpen(false)
        setEditingBaseId(null)
        createForm.resetFields()
        message.success('修改成功')
      } else {
        const newId = String(Date.now())
        const newBase: BaseRecord = {
          id: newId,
          baseName: values.baseName,
          baseCode: values.baseCode || '',
          baseType: values.baseType || '',
          status: values.status ?? true,
          description: values.description || '',
          depts: [],
        }
        setData([newBase, ...data])
        setCreateOpen(false)
        createForm.resetFields()
        setSelectedBaseId(newId)
        message.success('新建成功')
      }
    })
  }

  // —— 科室配置表格列 ——
  const deptColumns: ColumnsType<RotationDeptEntry> = [
    {
      title: '序号',
      width: 60,
      align: 'center',
      render: (_, __, index) => (index ?? 0) + 1,
    },
    {
      title: '标准科室名称',
      width: 160,
      dataIndex: 'standardName',
    },
    {
      title: '标准周期',
      width: 90,
      align: 'center',
      dataIndex: 'period',
    },
    {
      title: '标准单位',
      width: 90,
      align: 'center',
      render: (_, record) => (record.periodUnit === 'week' ? '周' : '月'),
    },
    {
      title: '轮转类型',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tag color={record.rotationType === 'optional' ? 'purple' : 'blue'}>
          {record.rotationType === 'optional' ? '可选' : '必选'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditDept(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该标准科室？" onConfirm={() => removeDeptEntry(record.key)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card style={{ height: '100%' }} styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 16px' } }}>
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>专业基地管理</span>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, alignItems: 'stretch' }}>
        {/* ============ 左侧：基地列表 ============ */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            background: '#fafafa',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
              <ApartmentOutlined style={{ marginRight: 6, color: '#1677ff' }} />
              专业基地
            </span>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setEditingBaseId(null); createForm.resetFields(); setCreateOpen(true) }}>
              新建
            </Button>
          </div>
          <div style={{ padding: '8px 8px 4px', flexShrink: 0 }}>
            <Input
              allowClear
              size="small"
              placeholder="查询基地名称"
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={baseKeyword}
              onChange={(e) => setBaseKeyword(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px' }}>
            {filteredBases.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', fontSize: 13, paddingTop: 40 }}>暂无基地，点击右上角新建</div>
            ) : (
              filteredBases.map((b) => {
                const selected = b.id === selectedBaseId
                const showIcons = selected || hoverBaseId === b.id
                return (
                  <div
                    key={b.id}
                    onMouseEnter={() => setHoverBaseId(b.id)}
                    onMouseLeave={() => setHoverBaseId(null)}
                    onClick={() => handleSelectBase(b.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '10px 10px',
                      marginBottom: 6,
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: selected ? '#e6f4ff' : '#fff',
                      borderLeft: `3px solid ${selected ? '#1677ff' : 'transparent'}`,
                      boxShadow: selected ? '0 1px 4px rgba(22,119,255,0.15)' : 'none',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: selected ? 600 : 500, color: b.status ? '#1a1a1a' : '#cf1322' }}>
                        {b.baseName}
                      </div>
                    </div>
                    <div style={{ visibility: showIcons ? 'visible' : 'hidden', display: 'flex', gap: 2, marginTop: 2 }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditBase(b)
                        }}
                      />
                      <Popconfirm
                        title="确认删除该基地？"
                        description="删除后该基地的科室配置将一并清除"
                        onConfirm={() => handleDelete(b)}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                      </Popconfirm>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ============ 右侧：轮转科室配置（表格） ============ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {!selectedBase ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #d9d9d9',
                borderRadius: 8,
                background: '#fafafa',
              }}
            >
              <Empty description="请选择左侧基地查看配置，或点击「新建」创建基地" />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 12px' }}>
                <span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{selectedBase.baseName}</span>
                  <span style={{ marginLeft: 8, fontSize: 13, color: '#1677ff' }}>
                    标准科室数：{selectedBase.depts.length}个，标准周期{periodText}
                  </span>
                </span>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddDept}>
                  添加标准科室
                </Button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                <Table
                  columns={deptColumns}
                  dataSource={selectedBase.depts}
                  rowKey="key"
                  size="small"
                  pagination={false}
                  scroll={{ x: 900 }}
                  locale={{ emptyText: <Empty description="暂无轮转科室，点击右上角添加" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============ 新建基地抽屉 ============ */}
      <Drawer
        title={editingBaseId ? '编辑专业基地' : '新建专业基地'}
        open={createOpen}
        onClose={() => { setCreateOpen(false); setEditingBaseId(null) }}
        width={480}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setCreateOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleCreateOk}>确定</Button>
          </div>
        }
      >
        <Form form={createForm} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} size="small" style={{ marginTop: 12 }} initialValues={{ status: true }}>
          <Form.Item name="baseName" label="基地名称" rules={[{ required: true, message: '请输入基地名称' }]}>
            <Input placeholder="如：内科专业基地" maxLength={30} />
          </Form.Item>
          <Form.Item name="baseCode" label="基地编码">
            <Input placeholder="如 BASE-IM-001" maxLength={30} />
          </Form.Item>
          <Form.Item name="baseType" label="专业方向">
            <Select placeholder="请选择" allowClear options={BASE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述（可选）" maxLength={100} showCount />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ============ 轮转科室录入抽屉 ============ */}
      <Drawer
        title={editingDeptKey ? '编辑标准科室' : '添加标准科室'}
        open={deptDrawerOpen}
        onClose={() => setDeptDrawerOpen(false)}
        width={560}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDeptDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleDeptDrawerOk}>确定</Button>
          </div>
        }
      >
        <Form form={deptForm} layout="horizontal" labelCol={{ span: 5 }} wrapperCol={{ span: 17 }} size="small" style={{ marginTop: 12 }}>
          <Form.Item name="standardName" label="标准名称" rules={[{ required: true, message: '请输入标准名称' }]}>
            <Input placeholder="如：心血管内科（手写）" maxLength={30} />
          </Form.Item>

          <Form.Item name="period" label="标准周期" rules={[{ required: true, message: '请输入标准周期' }]}>
            <InputNumber min={1} max={52} style={{ width: '100%' }} placeholder="请输入标准周期" />
          </Form.Item>

          <Form.Item name="periodUnit" label="标准单位" rules={[{ required: true, message: '请选择标准单位' }]}>
            <Select style={{ width: '100%' }} options={PERIOD_UNIT_OPTIONS} />
          </Form.Item>

          <Form.Item name="rotationType" label="轮转类型" rules={[{ required: true, message: '请选择轮转类型' }]}>
            <Radio.Group options={ROTATION_TYPE_OPTIONS} optionType="button" buttonStyle="solid" />
          </Form.Item>

          <Form.Item name="rotationGoal" label="轮转目的">
            <Input.TextArea rows={4} placeholder="请输入轮转目的" maxLength={1000} showCount style={{ resize: 'both' }} />
          </Form.Item>
          <Form.Item name="basicRequirement" label="基本要求">
            <Input.TextArea rows={4} placeholder="请输入基本要求" maxLength={1000} showCount style={{ resize: 'both' }} />
          </Form.Item>
          <Form.Item name="improveRequirement" label="提升要求">
            <Input.TextArea rows={4} placeholder="请输入提升要求" maxLength={1000} showCount style={{ resize: 'both' }} />
          </Form.Item>
          <Form.Item name="otherRemark" label="其他备注">
            <Input.TextArea rows={4} placeholder="请输入其他备注（可选）" maxLength={1000} showCount style={{ resize: 'both' }} />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}

export default RotationBase
