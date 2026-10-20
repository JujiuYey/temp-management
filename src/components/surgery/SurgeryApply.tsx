import { useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Radio,
  Row,
  Col,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from 'antd'
import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  PrinterOutlined,
  RollbackOutlined,
  SearchOutlined,
  UploadOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { UploadFile } from 'antd'
import {
  ANESTHESIA_METHOD_OPTIONS,
  ANESTHESIA_RISK_OPTIONS,
  ANESTHESIOLOGIST_OPTIONS,
  APPLY_NATURE_OPTIONS,
  EXPERT_TITLE_OPTIONS,
  GENDER_OPTIONS,
  INFECTION_RISK_OPTIONS,
  STAFF_POOL,
  SURGEON_OPTIONS,
  SURGERY_CATALOG,
  SURGERY_DEPTS,
  SURGERY_PURPOSE_OPTIONS,
  SURGERY_STATUS_MAP,
  SURGERY_TYPE_OPTIONS,
  INITIAL_RECORDS,
  PATIENT_SURGERY_RECORDS,
} from './mockData'
import type { StaffOption, SurgeryApplyRecord, SurgeryApplyStatus } from './mockData'

const { RangePicker } = DatePicker
const { TextArea } = Input

// 分区标题：左侧蓝色小竖条 + 加粗文字（与全站风格一致）
const SectionTitle: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 16px', paddingLeft: 0 }}>
    <span style={{ display: 'inline-block', width: 4, height: 15, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{text}</span>
  </div>
)

// 当前登录用户（演示用，实际应取自登录态）
const CURRENT_USER = '管理员'

// 下拉按「姓名 / 工号」检索
const filterByStaff = (input: string, option?: { search?: string }) =>
  (option?.search ?? '').toLowerCase().includes(input.toLowerCase())

const toStaffOptions = (list: StaffOption[]) =>
  list.map(s => ({
    value: s.name,
    label: s.name,
    search: `${s.name} ${s.workNo} ${s.dept} ${s.title}`,
  }))

type DrawerMode = 'create' | 'edit' | 'view'

interface SurgeryFormValues {
  // 病人信息
  hospitalNo?: string
  patientName?: string
  gender?: string
  admissionCount?: number
  age?: string
  admissionTime?: dayjs.Dayjs
  admissionDept?: string
  diagnosis?: string
  conditionSummary?: string
  // 申请信息
  applyNature?: string
  surgeryName?: string[]
  surgeryDept?: string
  surgeryTime?: dayjs.Dayjs
  surgeryPurpose?: string
  surgeryType?: string
  anesthesiologist?: string
  anesthesiaMethod?: string
  anesthesiaRisk?: string
  infectionRisk?: string
  chiefSurgeon?: string
  firstAssistant?: string
  secondAssistant?: string
  hasExternalExpert?: '主刀' | '指导'
  externalExpertName?: string
  externalExpertHospital?: string
  externalExpertDept?: string
  externalExpertTitle?: string
  surgeryFirstCase?: string
  anesthesiaFirstCase?: string
  selfProvide?: string[]
  approveReason?: string
  preDiscussion?: string
  surgeryPlan?: string
  preparation?: string
  expertIntroduction?: string
  // 非计划再次手术
  againReason?: string
  lastSurgeryName?: string
  lastAnesthesiaMethod?: string
  lastChiefSurgeon?: string
  lastFirstAssistant?: string
  lastSecondAssistant?: string
  lastAnesthesiologist?: string
  lastCompleteTime?: dayjs.Dayjs
  lastSurgerySituation?: string
  lastRecordNo?: string
  // 知情同意书及附件
  consentSigned?: boolean
  consentFiles?: UploadFile[]
  attachFiles?: UploadFile[]
}

const colSpan = 6

const SurgeryApply: React.FC = () => {
  const [records, setRecords] = useState<SurgeryApplyRecord[]>(INITIAL_RECORDS)
  const [form] = Form.useForm<SurgeryFormValues>()
  const hasExternalExpert = Form.useWatch('hasExternalExpert', form)
  const applyNature = Form.useWatch('applyNature', form)

  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')
  const [currentRecord, setCurrentRecord] = useState<SurgeryApplyRecord | null>(null)
  const [currentApplyNo, setCurrentApplyNo] = useState('')

  // 筛选状态
  const [keyword, setKeyword] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [filterNature, setFilterNature] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<SurgeryApplyStatus | undefined>()
  const [filterDept, setFilterDept] = useState<string | undefined>()
  const [applied, setApplied] = useState<{
    keyword: string
    range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
    nature?: string
    status?: SurgeryApplyStatus
    dept?: string
  }>({ keyword: '', range: null })

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (applied.keyword) {
        const kw = applied.keyword.toLowerCase()
        const hit =
          (Array.isArray(r.surgeryName) ? r.surgeryName.join(' ') : (r.surgeryName || '')).toLowerCase().includes(kw) ||
          (r.patientName || '').toLowerCase().includes(kw) ||
          (r.hospitalNo || '').toLowerCase().includes(kw)
        if (!hit) return false
      }
      if (applied.range && applied.range[0] && applied.range[1] && r.surgeryTime) {
        const t = dayjs(r.surgeryTime)
        if (t.isBefore(applied.range[0].startOf('day')) || t.isAfter(applied.range[1].endOf('day'))) return false
      }
      if (applied.nature && r.applyNature !== applied.nature) return false
      if (applied.status && r.status !== applied.status) return false
      if (applied.dept && r.surgeryDept !== applied.dept) return false
      return true
    })
  }, [records, applied])

  const handleSearch = () => {
    setApplied({ keyword, range: dateRange, nature: filterNature, status: filterStatus, dept: filterDept })
  }

  const handleResetFilter = () => {
    setKeyword('')
    setDateRange(null)
    setFilterNature(undefined)
    setFilterStatus(undefined)
    setFilterDept(undefined)
    setApplied({ keyword: '', range: null })
  }

  // 生成申请单号：OPA + 日期 + 4 位序号
  const genApplyNo = () => {
    const dateStr = dayjs().format('YYYYMMDD')
    const seq = records.filter(r => r.applyNo.includes(dateStr)).length + 1
    return `OPA${dateStr}${String(seq).padStart(4, '0')}`
  }

  const openCreate = () => {
    setDrawerMode('create')
    setCurrentRecord(null)
    setCurrentApplyNo('')
    form.resetFields()
    form.setFieldsValue({ admissionCount: 1, applyNature: '重大手术', surgeryFirstCase: '否', anesthesiaFirstCase: '否' })
    setDrawerOpen(true)
  }

  const openEdit = (record: SurgeryApplyRecord) => {
    setDrawerMode('edit')
    setCurrentRecord(record)
    setCurrentApplyNo(record.applyNo)
    form.setFieldsValue({
      ...record,
      admissionTime: record.admissionTime ? dayjs(record.admissionTime) : undefined,
      surgeryTime: record.surgeryTime ? dayjs(record.surgeryTime) : undefined,
      lastCompleteTime: record.lastCompleteTime ? dayjs(record.lastCompleteTime) : undefined,
    } as Partial<SurgeryFormValues>)
    setDrawerOpen(true)
  }

  const openView = (record: SurgeryApplyRecord) => {
    setDrawerMode('view')
    setCurrentRecord(record)
    setCurrentApplyNo(record.applyNo)
    form.setFieldsValue({
      ...record,
      admissionTime: record.admissionTime ? dayjs(record.admissionTime) : undefined,
      surgeryTime: record.surgeryTime ? dayjs(record.surgeryTime) : undefined,
      lastCompleteTime: record.lastCompleteTime ? dayjs(record.lastCompleteTime) : undefined,
    } as Partial<SurgeryFormValues>)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setCurrentRecord(null)
  }

  // 表单值 → 记录
  const valuesToRecord = (values: SurgeryFormValues, base: SurgeryApplyRecord): SurgeryApplyRecord => ({
    ...base,
    applicant: base.applicant || CURRENT_USER,
    hospitalNo: values.hospitalNo,
    patientName: values.patientName,
    gender: values.gender,
    admissionCount: values.admissionCount,
    age: values.age,
    admissionTime: values.admissionTime ? values.admissionTime.format('YYYY-MM-DD') : undefined,
    admissionDept: values.admissionDept,
    diagnosis: values.diagnosis,
    conditionSummary: values.conditionSummary,
    applyNature: values.applyNature,
    surgeryName: values.surgeryName,
    surgeryDept: values.surgeryDept,
    surgeryTime: values.surgeryTime ? values.surgeryTime.format('YYYY-MM-DD HH:mm:ss') : undefined,
    surgeryPurpose: values.surgeryPurpose,
    surgeryType: values.surgeryType,
    anesthesiologist: values.anesthesiologist,
    anesthesiaMethod: values.anesthesiaMethod,
    anesthesiaRisk: values.anesthesiaRisk,
    infectionRisk: values.infectionRisk,
    chiefSurgeon: values.chiefSurgeon,
    firstAssistant: values.firstAssistant,
    secondAssistant: values.secondAssistant,
    hasExternalExpert: values.hasExternalExpert || undefined,
    externalExpertName: values.hasExternalExpert === '主刀' || values.hasExternalExpert === '指导' ? values.externalExpertName : undefined,
    externalExpertHospital: values.hasExternalExpert === '主刀' || values.hasExternalExpert === '指导' ? values.externalExpertHospital : undefined,
    externalExpertDept: values.hasExternalExpert === '主刀' || values.hasExternalExpert === '指导' ? values.externalExpertDept : undefined,
    externalExpertTitle: values.hasExternalExpert === '主刀' || values.hasExternalExpert === '指导' ? values.externalExpertTitle : undefined,
    surgeryFirstCase: values.applyNature === '外请专家手术' && (values.hasExternalExpert === '主刀' || values.hasExternalExpert === '指导') ? values.surgeryFirstCase : undefined,
    anesthesiaFirstCase: values.applyNature === '外请专家手术' && (values.hasExternalExpert === '主刀' || values.hasExternalExpert === '指导') ? values.anesthesiaFirstCase : undefined,
    selfProvide: values.applyNature === '外请专家手术' && (values.hasExternalExpert === '主刀' || values.hasExternalExpert === '指导') ? values.selfProvide : undefined,
    approveReason: values.approveReason,
    preDiscussion: values.preDiscussion,
    surgeryPlan: values.surgeryPlan,
    preparation: values.preparation,
    expertIntroduction: values.applyNature === '外请专家手术' ? values.expertIntroduction : undefined,
    againReason: values.againReason,
    lastSurgeryName: values.lastSurgeryName,
    lastAnesthesiaMethod: values.lastAnesthesiaMethod,
    lastChiefSurgeon: values.lastChiefSurgeon,
    lastFirstAssistant: values.lastFirstAssistant,
    lastSecondAssistant: values.lastSecondAssistant,
    lastAnesthesiologist: values.lastAnesthesiologist,
    lastCompleteTime: values.lastCompleteTime ? values.lastCompleteTime.format('YYYY-MM-DD HH:mm:ss') : undefined,
    lastSurgerySituation: values.lastSurgerySituation,
    lastRecordNo: values.lastRecordNo,
  })

  // 暂存：不做必填校验
  const handleSaveDraft = () => {
    const values = form.getFieldsValue()
    if (drawerMode === 'edit' && currentRecord) {
      setRecords(prev => prev.map(r => (r.id === currentRecord.id ? { ...valuesToRecord(values, currentRecord), status: 'draft' } : r)))
      message.success('已暂存')
    } else {
      const applyNo = currentApplyNo || genApplyNo()
      const record = valuesToRecord(values, { id: `r${Date.now()}`, applyNo, status: 'draft', applicant: CURRENT_USER })
      setRecords(prev => [record, ...prev])
      setCurrentApplyNo(applyNo)
      message.success(`已暂存，申请单号：${applyNo}`)
    }
    setDrawerOpen(false)
  }

  // 提交申请：必填校验
  const handleSubmit = () => {
    form
      .validateFields()
      .then(values => {
        if (drawerMode === 'edit' && currentRecord) {
          setRecords(prev => prev.map(r => (r.id === currentRecord.id ? { ...valuesToRecord(values, currentRecord), status: 'pending' } : r)))
          message.success('手术申请已提交')
        } else {
          const applyNo = currentApplyNo || genApplyNo()
          const record = valuesToRecord(values, { id: `r${Date.now()}`, applyNo, status: 'pending', applicant: CURRENT_USER })
          setRecords(prev => [record, ...prev])
          message.success(`手术申请已提交，申请单号：${applyNo}`)
        }
        setDrawerOpen(false)
      })
      .catch(() => {
        message.warning('请完善必填项后再提交')
      })
  }

  const handleWithdraw = (record: SurgeryApplyRecord) => {
    setRecords(prev => prev.map(r => (r.id === record.id ? { ...r, status: 'withdrawn' } : r)))
    message.success(`申请单 ${record.applyNo} 已撤回`)
  }

  const handleDelete = (record: SurgeryApplyRecord) => {
    setRecords(prev => prev.filter(r => r.id !== record.id))
    message.success(`申请单 ${record.applyNo} 已删除`)
  }

  const canEdit = (status: SurgeryApplyStatus) => status === 'draft' || status === 'pending' || status === 'withdrawn'

  const columns: ColumnsType<SurgeryApplyRecord> = [
    { title: '序号', width: 60, render: (_, __, i) => i + 1 },
    { title: '申请单号', dataIndex: 'applyNo', width: 160 },
    {
      title: '审批状态',
      dataIndex: 'status',
      width: 90,
      render: (s: SurgeryApplyStatus) => <Tag color={SURGERY_STATUS_MAP[s].color}>{SURGERY_STATUS_MAP[s].label}</Tag>,
    },
    { title: '执行手术', dataIndex: 'surgeryName', ellipsis: true, render: (v: string[]) => (Array.isArray(v) ? v.join('、') : v) },
    { title: '手术性质', dataIndex: 'applyNature', width: 90 },
    { title: '病人', dataIndex: 'patientName', width: 80 },
    { title: '住院号', dataIndex: 'hospitalNo', width: 110 },
    { title: '性别', dataIndex: 'gender', width: 60 },
    { title: '年龄', dataIndex: 'age', width: 60 },
    { title: '申请人', dataIndex: 'applicant', width: 90 },
    { title: '手术科室', dataIndex: 'surgeryDept', width: 100 },
    { title: '手术时间', dataIndex: 'surgeryTime', width: 150 },
    {
      title: '操作',
      width: 260,
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openView(record)}>查看</Button>
          {canEdit(record.status) && (
            <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          )}
          <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => message.info('打印功能演示')}>
            打印
          </Button>
          {record.status === 'pending' && (
            <Popconfirm title="确定撤回该申请吗？" onConfirm={() => handleWithdraw(record)}>
              <Button type="link" size="small" icon={<RollbackOutlined />}>撤回申请</Button>
            </Popconfirm>
          )}
          <Popconfirm title="确定删除该申请吗？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 顶部工具栏 */}
      <div style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginRight: 16 }}>
          手术申请
        </Button>
        <Space wrap>
          <Input
            allowClear
            style={{ width: 220 }}
            placeholder="手术名称/病人姓名/住院号"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <RangePicker
            style={{ width: 240 }}
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={v => setDateRange(v)}
          />
          <Select allowClear style={{ width: 130 }} placeholder="手术性质" options={APPLY_NATURE_OPTIONS} value={filterNature} onChange={setFilterNature} />
          <Select
            allowClear
            style={{ width: 120 }}
            placeholder="审批状态"
            value={filterStatus}
            onChange={setFilterStatus}
            options={Object.entries(SURGERY_STATUS_MAP).map(([k, v]) => ({ value: k as SurgeryApplyStatus, label: v.label }))}
          />
          <Select allowClear style={{ width: 130 }} placeholder="手术科室" options={SURGERY_DEPTS.map(d => ({ value: d, label: d }))} value={filterDept} onChange={setFilterDept} />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          <Button onClick={handleResetFilter}>重置</Button>
        </Space>
      </div>

      <Table<SurgeryApplyRecord>
        rowKey="id"
        columns={columns}
        dataSource={filteredRecords}
        pagination={{ showTotal: t => `共 ${t} 条`, showSizeChanger: true }}
        scroll={{ x: 1400 }}
      />

      {/* 新增 / 编辑 / 查看抽屉 */}
      <Drawer
        title={drawerMode === 'create' ? '新增手术申请' : drawerMode === 'edit' ? '编辑手术申请' : '查看手术申请'}
        open={drawerOpen}
        onClose={closeDrawer}
        width={1680}
        footer={
          drawerMode === 'view' ? (
            <div style={{ textAlign: 'right' }}>
              <Button onClick={closeDrawer}>关闭</Button>
            </div>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={closeDrawer}>取消</Button>
                <Button onClick={handleSaveDraft}>暂存</Button>
                <Button type="primary" onClick={handleSubmit}>提交申请</Button>
              </Space>
            </div>
          )
        }
      >
        <Form form={form} disabled={drawerMode === 'view'} initialValues={{ admissionCount: 1, applyNature: '重大手术', surgeryFirstCase: '否', anesthesiaFirstCase: '否', consentSigned: false }}>
          {/* 病人信息 */}
          <SectionTitle text="病人信息" />
          <Row gutter={16}>
            <Col span={colSpan}>
              <Form.Item label="住院号" name="hospitalNo">
                <Input placeholder="请输入住院号" />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="姓名" name="patientName" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="性别" name="gender">
                <Select allowClear placeholder="请选择性别" options={GENDER_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="住院次数" name="admissionCount">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={colSpan}>
              <Form.Item label="年龄" name="age">
                <Input placeholder="请输入年龄" />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="入院时间" name="admissionTime">
                <DatePicker style={{ width: '100%' }} placeholder="请选择入院时间" format="YYYY-MM-DD" suffixIcon={<CalendarOutlined />} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="入院科室" name="admissionDept">
                <Select showSearch allowClear placeholder="请选择入院科室" options={SURGERY_DEPTS.map(d => ({ value: d, label: d }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="入院诊断" name="diagnosis" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }}>
            <TextArea rows={3} maxLength={500} showCount placeholder="请输入入院诊断" />
          </Form.Item>
          <Form.Item label="病情摘要" name="conditionSummary" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }}>
            <TextArea rows={3} maxLength={2000} showCount placeholder="请输入病情摘要" />
          </Form.Item>

          {/* 申请信息 */}
          <SectionTitle text="申请信息" />
          <Row gutter={16}>
            <Col span={colSpan}>
              <Form.Item label="申请性质" name="applyNature" rules={[{ required: true, message: '请选择申请性质' }]}>
                <Select placeholder="请选择申请性质" options={APPLY_NATURE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={18}>
              <Form.Item label="本次手术" name="surgeryName" rules={[{ required: true, message: '请选择手术' }]}>
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="请选择手术（可多选）"
                  options={SURGERY_CATALOG.map(s => ({ value: s.name, label: `${s.name}（${s.level}）` }))}
                  filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={colSpan}>
              <Form.Item label="手术科室" name="surgeryDept" rules={[{ required: true, message: '请选择手术科室' }]}>
                <Select showSearch placeholder="请选择手术科室" options={SURGERY_DEPTS.map(d => ({ value: d, label: d }))} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="手术时间" name="surgeryTime" rules={[{ required: true, message: '请选择手术时间' }]}>
                <DatePicker
                  showTime={{ format: 'HH:mm:ss' }}
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择手术时间"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="手术目的" name="surgeryPurpose">
                <Select allowClear placeholder="请选择手术目的" options={SURGERY_PURPOSE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="手术类型" name="surgeryType">
                <Select allowClear placeholder="请选择手术类型" options={SURGERY_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={colSpan}>
              <Form.Item label="麻醉医生" name="anesthesiologist">
                <Select showSearch allowClear placeholder="输入姓名或工号检索" options={toStaffOptions(ANESTHESIOLOGIST_OPTIONS)} filterOption={filterByStaff} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="麻醉方式" name="anesthesiaMethod">
                <Select allowClear placeholder="请选择麻醉方式" options={ANESTHESIA_METHOD_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="麻醉风险" name="anesthesiaRisk">
                <Select allowClear placeholder="请选择麻醉风险" options={ANESTHESIA_RISK_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="感染风险" name="infectionRisk">
                <Select allowClear placeholder="请选择感染风险" options={INFECTION_RISK_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={colSpan}>
              <Form.Item label="主刀医生" name="chiefSurgeon">
                <Select showSearch allowClear placeholder="输入姓名或工号检索" options={toStaffOptions(SURGEON_OPTIONS)} filterOption={filterByStaff} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="手术一助" name="firstAssistant">
                <Select showSearch allowClear placeholder="输入姓名或工号检索" options={toStaffOptions(STAFF_POOL)} filterOption={filterByStaff} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="手术二助" name="secondAssistant">
                <Select showSearch allowClear placeholder="输入姓名或工号检索" options={toStaffOptions(STAFF_POOL)} filterOption={filterByStaff} />
              </Form.Item>
            </Col>
            <Col span={colSpan}>
              <Form.Item label="外院专家" name="hasExternalExpert" rules={applyNature === '外请专家手术' ? [{ required: true, message: '请选择外院专家' }] : []}>
                <Select
                  allowClear
                  placeholder="请选择外院专家类型"
                  options={[
                    { value: '主刀', label: '主刀' },
                    { value: '指导', label: '指导' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          {(hasExternalExpert === '主刀' || hasExternalExpert === '指导') && (
            <>
              <Row gutter={16}>
                <Col span={colSpan}>
                  <Form.Item label="专家姓名" name="externalExpertName" rules={[{ required: true, message: '请输入专家姓名' }]}>
                    <Input placeholder="请输入外院专家姓名" />
                  </Form.Item>
                </Col>
                <Col span={colSpan}>
                  <Form.Item label="专家医院" name="externalExpertHospital">
                    <Input placeholder="请输入专家医院" />
                  </Form.Item>
                </Col>
                <Col span={colSpan}>
                  <Form.Item label="专家科室" name="externalExpertDept">
                    <Input placeholder="请输入专家科室" />
                  </Form.Item>
                </Col>
                <Col span={colSpan}>
                  <Form.Item label="专家职称" name="externalExpertTitle">
                    <Select allowClear placeholder="请选择专家职称" options={EXPERT_TITLE_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
              {applyNature === '外请专家手术' && (
                <Row gutter={16}>
                  <Col span={colSpan}>
                    <Form.Item label="首例手术" name="surgeryFirstCase">
                      <Radio.Group optionType="button" buttonStyle="solid" defaultValue="否">
                        <Radio value="是">是</Radio>
                        <Radio value="否">否</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={colSpan}>
                    <Form.Item label="首例麻醉" name="anesthesiaFirstCase">
                      <Radio.Group optionType="button" buttonStyle="solid" defaultValue="否">
                        <Radio value="是">是</Radio>
                        <Radio value="否">否</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={colSpan}>
                    <Form.Item label="专家自备" name="selfProvide">
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="请选择自备项"
                        options={[ { value: '高值耗材', label: '高值耗材' }, { value: '医疗设备', label: '医疗设备' } ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </>
          )}

          {applyNature === '非计划再次手术' && (
            <>
              <Form.Item label="再次手术原因" name="againReason" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }} rules={[{ required: true, message: '请输入再次手术原因' }]}>
                <TextArea rows={4} maxLength={400} showCount placeholder="请输入再次手术原因" />
              </Form.Item>
              <Form.Item label="术前讨论" name="preDiscussion" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }}>
                <TextArea rows={4} maxLength={2000} showCount placeholder="请输入术前讨论" />
              </Form.Item>
              <Form.Item label="手术方案" name="surgeryPlan" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }} rules={[{ required: true, message: '请输入手术方案' }]}>
                <TextArea rows={4} maxLength={3000} showCount placeholder="请输入手术方案，没有可不填" />
              </Form.Item>
              <Form.Item label="准备情况" name="preparation" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }} rules={[{ required: true, message: '请输入准备情况' }]}>
                <TextArea rows={4} maxLength={3000} showCount placeholder="请输入准备情况" />
              </Form.Item>

              <SectionTitle text="上次手术情况" />
              <Row gutter={16}>
                <Col span={colSpan}>
                  <Form.Item label="选择记录" name="lastRecordNo">
                    <Select
                      showSearch
                      allowClear
                      placeholder="输入住院号选择患者手术记录"
                      optionFilterProp="label"
                      options={PATIENT_SURGERY_RECORDS.map(r => ({ value: r.hospitalNo, label: `${r.hospitalNo} ${r.patientName} ${r.surgeryName}` }))}
                      onSelect={(hospitalNo: string) => {
                        const rec = PATIENT_SURGERY_RECORDS.find(r => r.hospitalNo === hospitalNo)
                        if (rec) {
                          form.setFieldsValue({
                            lastSurgeryName: rec.surgeryName,
                            lastCompleteTime: rec.completeTime ? dayjs(rec.completeTime) : undefined,
                            lastAnesthesiologist: rec.anesthesiologist,
                            lastAnesthesiaMethod: rec.anesthesiaMethod,
                            lastChiefSurgeon: rec.chiefSurgeon,
                            lastFirstAssistant: rec.firstAssistant,
                            lastSecondAssistant: rec.secondAssistant,
                          })
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={colSpan}>
                  <Form.Item label="上次手术" name="lastSurgeryName">
                    <Select
                      showSearch
                      allowClear
                      placeholder="请选择上次手术"
                      options={SURGERY_CATALOG.map(s => ({ value: s.name, label: `${s.name}（${s.level}）` }))}
                      filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                    />
                  </Form.Item>
                </Col>
                <Col span={colSpan}>
                  <Form.Item label="手术时间" name="lastCompleteTime">
                    <DatePicker
                      showTime={{ format: 'HH:mm:ss' }}
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="请选择手术时间"
                      style={{ width: '100%' }}
                      suffixIcon={<CalendarOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={colSpan}>
                  <Form.Item label="麻醉医师" name="lastAnesthesiologist">
                    <Select showSearch allowClear placeholder="输入姓名或工号检索" options={toStaffOptions(ANESTHESIOLOGIST_OPTIONS)} filterOption={filterByStaff} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={colSpan}>
                  <Form.Item label="主刀医师" name="lastChiefSurgeon">
                    <Select showSearch allowClear placeholder="输入姓名或工号检索" options={toStaffOptions(SURGEON_OPTIONS)} filterOption={filterByStaff} />
                  </Form.Item>
                </Col>
                <Col span={colSpan}>
                  <Form.Item label="手术一助" name="lastFirstAssistant">
                    <Select showSearch allowClear placeholder="输入姓名或工号检索" options={toStaffOptions(STAFF_POOL)} filterOption={filterByStaff} />
                  </Form.Item>
                </Col>
                <Col span={colSpan}>
                  <Form.Item label="手术二助" name="lastSecondAssistant">
                    <Select showSearch allowClear placeholder="输入姓名或工号检索" options={toStaffOptions(STAFF_POOL)} filterOption={filterByStaff} />
                  </Form.Item>
                </Col>
                <Col span={colSpan}>
                  <Form.Item label="麻醉方式" name="lastAnesthesiaMethod">
                    <Select allowClear placeholder="请选择麻醉方式" options={ANESTHESIA_METHOD_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="上次手术情况" name="lastSurgerySituation" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }}>
                <TextArea rows={4} maxLength={2000} showCount placeholder="请输入上次手术情况" />
              </Form.Item>
            </>
          )}

          {applyNature !== '非计划再次手术' && (
            <>
              <Form.Item label="报批原因" name="approveReason" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }} rules={[{ required: true, message: '请输入报批原因' }]}>
                <TextArea rows={4} maxLength={2000} showCount placeholder="请输入报批原因" />
              </Form.Item>
              <Form.Item label="术前讨论" name="preDiscussion" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }}>
                <TextArea rows={4} maxLength={2000} showCount placeholder="请输入术前讨论" />
              </Form.Item>
              <Form.Item label="手术方案" name="surgeryPlan" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }} rules={[{ required: true, message: '请输入手术方案' }]}>
                <TextArea rows={4} maxLength={3000} showCount placeholder="请输入手术方案，没有可不填" />
              </Form.Item>
              <Form.Item label="准备情况" name="preparation" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }} rules={[{ required: true, message: '请输入准备情况' }]}>
                <TextArea rows={4} maxLength={3000} showCount placeholder="请输入准备情况" />
              </Form.Item>
              {applyNature === '外请专家手术' && (
                <Form.Item label="专家介绍" name="expertIntroduction" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: 'auto' }} rules={[{ required: true, message: '请输入专家介绍' }]}>
                  <TextArea rows={4} maxLength={2000} showCount placeholder="请输入专家介绍" />
                </Form.Item>
              )}
            </>
          )}

          {/* 知情同意书及附件 */}
          <SectionTitle text="知情同意书及附件" />
          <Form.Item label="是否签署" required style={{ marginBottom: 12 }}>
            <Form.Item name="consentSigned" valuePropName="checked" noStyle rules={[{ required: true, message: '请勾选是否签署' }]}>
              <Checkbox>是否签署</Checkbox>
            </Form.Item>
          </Form.Item>
          <Form.Item label="同意书附件" name="consentFiles" valuePropName="fileList" getValueFromEvent={e => (Array.isArray(e) ? e : e?.fileList)}>
            <Upload beforeUpload={() => false}>
              <Button type="primary" icon={<UploadOutlined />}>上传</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="附件" name="attachFiles" valuePropName="fileList" getValueFromEvent={e => (Array.isArray(e) ? e : e?.fileList)}>
            <Upload beforeUpload={() => false}>
              <Button type="primary" icon={<UploadOutlined />}>上传</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default SurgeryApply
