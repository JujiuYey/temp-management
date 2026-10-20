import React, { useState, useMemo, useRef } from 'react'
import {
  Card,
  Table,
  Button,
  Checkbox,
  Input,
  DatePicker,
  Select,
  Space,
  Tag,
  Drawer,
  Form,
  Radio,
  Row,
  Col,
  message,
  Typography,
  Upload,
  Descriptions,
  Timeline,
  Empty,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  UploadOutlined,
  RollbackOutlined,
  FundOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  ScanOutlined,
  ExperimentOutlined,
  ScissorOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { FormInstance } from 'antd'
import { consultationData, DEPARTMENTS, TITLES, CONSULT_TEAMS, expertStaffPool } from './mockData'
import type { ConsultationRecord, ConsultationType, ConsultationStatus, UrgencyLevel, ConsultationMethod, ApprovalStatus, ConsultationStage } from './types'
import {
  CONSULTATION_TYPE_MAP,
  CONSULTATION_METHOD_MAP,
  STATUS_MAP,
  APPROVAL_STATUS_MAP,
  CONSULTATION_STAGE_MAP,
  URGENCY_MAP,
  SCOPE_MAP,
} from './types'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography
const { TextArea } = Input

// 分区标题：左侧蓝色小竖条 + 加粗文字，左对齐与表单标签（申请科室）一致
const SectionTitle: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 16px', paddingLeft: 0 }}>
    <span style={{ display: 'inline-block', width: 4, height: 15, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{text}</span>
  </div>
)

// 当前登录用户（演示用，实际应取自登录态）
const CURRENT_USER = { dept: '呼吸内科', name: '张明' }

// 会议室预设选项
const MEETING_ROOMS = ['会诊中心1号室', '会诊中心2号室', 'MDT会议室', '远程会诊室', '病区示教室']

// 本院人员预设选项（会诊意见抽屉「主持人」下拉）
const HOSPITAL_STAFF_OPTIONS = ['王建国', '李国华', '赵明德', '陈志远', '刘德芳', '孙秀英', '周健康', '吴明辉', '郑国强', '黄丽娟', '张明']
  .map(n => ({ value: n, label: n }))

// 构建执行记录时间轴（全方位记录会诊各时间节点）
const buildExecTimeline = (r: ConsultationRecord) => {
  type Node = { color: string; label: string; time?: string; desc: string }
  const nodes: Node[] = []
  if (r.applyTime) {
    nodes.push({ color: '#1677ff', label: '发起申请', time: r.applyTime, desc: `${r.applicant} 发起会诊申请（${r.applyDept}）` })
  }
  if (r.approvalTime) {
    nodes.push({ color: '#52c41a', label: '审批通过', time: r.approvalTime, desc: `${r.approver || '审批人'}：${r.approvalNote || '同意'}（审批状态：${r.approvalStatus === 'approved' ? '已审批' : r.approvalStatus}）` })
  }
  if (r.scheduledTime) {
    nodes.push({ color: '#13c2c2', label: '会诊安排', time: r.scheduledTime, desc: `会议室：${r.meetingRoom || '-'}　会议号：${r.meetingNo || '-'}　邀请科室：${(r.arrangeDepts || r.targetDepts || []).join('、') || '-'}` })
  }
  if (r.arrivalTime) {
    nodes.push({ color: '#fa8c16', label: '人员到达', time: r.arrivalTime, desc: `受邀专家/科室人员已到达（${r.meetingRoom || '-'}）` })
  }
  if (r.completionTime) {
    nodes.push({ color: '#8c8c8c', label: '会诊结束', time: r.completionTime, desc: r.consultOpinion ? `诊疗方案：${r.consultOpinion.substring(0, 60)}${r.consultOpinion.length > 60 ? '…' : ''}` : '会诊已完成' })
  }
  if (nodes.length === 0) {
    nodes.push({ color: 'gray', label: '暂无记录', desc: '该会诊尚未产生可记录的时间节点' })
  }
  return nodes.map(n => ({
    color: n.color,
    children: (
      <div>
        <Text strong>{n.label}</Text>
        {n.time && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{n.time}</div>}
        <div style={{ fontSize: 13 }}>{n.desc}</div>
      </div>
    ),
  }))
}

// 抽屉内三标签切换：所有面板始终挂载（仅用 display 切换可见性），避免切换标签导致 Form.useWatch 钩子数量变化而崩溃
const DrawerTabs: React.FC<{
  activeKey: string
  onChange: (k: string) => void
  panels: { key: string; label: string; node: React.ReactNode }[]
}> = ({ activeKey, onChange, panels }) => (
  <>
    <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
      {panels.map(p => (
        <div
          key={p.key}
          onClick={() => onChange(p.key)}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            marginBottom: -1,
            borderBottom: activeKey === p.key ? '2px solid #1677ff' : '2px solid transparent',
            color: activeKey === p.key ? '#1677ff' : 'rgba(0,0,0,0.88)',
            fontWeight: activeKey === p.key ? 600 : 400,
          }}
        >
          {p.label}
        </div>
      ))}
    </div>
    {panels.map(p => (
      <div key={p.key} style={{ display: p.key === activeKey ? 'block' : 'none' }}>
        {p.node}
      </div>
    ))}
  </>
)

// 患者 360 视图左侧导航
const PATIENT_360_MENUS: { key: string; label: string; Icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
  { key: 'timeline', label: '住院时间轴', Icon: ClockCircleOutlined },
  { key: 'glucose', label: '血糖', Icon: DashboardOutlined },
  { key: 'documents', label: '文书', Icon: FileTextOutlined },
  { key: 'orders', label: '医嘱', Icon: MedicineBoxOutlined },
  { key: 'exams', label: '检查', Icon: ScanOutlined },
  { key: 'labs', label: '检验', Icon: ExperimentOutlined },
  { key: 'surgeries', label: '手术', Icon: ScissorOutlined },
  { key: 'consultations', label: '会诊记录', Icon: TeamOutlined },
]

const ConsultationApply: React.FC = () => {
  const [data, setData] = useState<ConsultationRecord[]>(consultationData)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<ConsultationRecord | null>(null)
  const [patient360Record, setPatient360Record] = useState<ConsultationRecord | null>(null)
  const [patient360Open, setPatient360Open] = useState(false)
  const [recordRecord, setRecordRecord] = useState<ConsultationRecord | null>(null)
  const [recordOpen, setRecordOpen] = useState(false)
  const [recordEditable, setRecordEditable] = useState(false)
  const [recordTab, setRecordTab] = useState('fill')
  const [form] = Form.useForm()
  const [viewForm] = Form.useForm()
  const [recordForm] = Form.useForm()
  const [formType, setFormType] = useState<'create' | 'edit'>('create')
  const editingIdRef = useRef<string | null>(null)
  const [viewActiveKey, setViewActiveKey] = useState('apply')
  const [patient360Tab, setPatient360Tab] = useState('timeline')
  const [page, setPage] = useState(1)
  const consultType = Form.useWatch('consultationType', form)

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = !searchText ||
        item.id.toLowerCase().includes(searchText.toLowerCase()) ||
        item.patientName.includes(searchText) ||
        item.applicant.includes(searchText) ||
        item.applyDept.includes(searchText)
      const matchType = typeFilter === 'all' || item.consultationType === typeFilter
      const matchStatus = statusFilter === 'all' || item.approvalStatus === statusFilter
      return matchSearch && matchType && matchStatus
    })
  }, [data, searchText, typeFilter, statusFilter])

  const handleOpenCreate = () => {
    setFormType('create')
    editingIdRef.current = null
    form.resetFields()
    form.setFieldsValue({
      consultationType: 'regular',
      urgencyLevel: 'normal',
      consultationMethod: 'onsite',
      scope: 'inter_dept',
      expertMode: 'expert',
      inviteModes: ['team'],
      patientType: 'inpatient',
      applyDept: CURRENT_USER.dept,
      applicant: CURRENT_USER.name,
      applyTime: dayjs().format('YYYY-MM-DD HH:mm'),
    })
    setDrawerOpen(true)
  }

  const handleOpenEdit = (record: ConsultationRecord) => {
    setFormType('edit')
    editingIdRef.current = record.id
    form.setFieldsValue(record)
    // MDT：按邀请数据反填邀请对象模式（有拟邀团队→按团队；仅有按科室条目→按科室）
    if (record.consultationType === 'mdt') {
      form.setFieldValue('inviteModes', record.proposedTeam?.length ? ['team'] : (record.mdtInvites?.length ? ['dept'] : ['team']))
    }
    if (record.plannedConsultTime) {
      form.setFieldValue('plannedConsultTime', dayjs(record.plannedConsultTime))
    }
    setDrawerOpen(true)
  }

  const handleView = (record: ConsultationRecord) => {
    setDetailRecord(record)
    viewForm.setFieldsValue({
      ...record,
      plannedConsultTime: record.plannedConsultTime ? dayjs(record.plannedConsultTime) : undefined,
    })
    if (record.consultationType === 'mdt') {
      viewForm.setFieldValue('inviteModes', record.proposedTeam?.length ? ['team'] : (record.mdtInvites?.length ? ['dept'] : ['team']))
    }
    setViewActiveKey('apply')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (values.plannedConsultTime) {
        values.plannedConsultTime = dayjs(values.plannedConsultTime).format('YYYY-MM-DD HH:mm:ss')
      }
      if (formType === 'create') {
        // 外请会诊：由拟邀请类型/单位/专家等字段组装受邀专家列表
        let experts: { unit: string; name: string; title: string }[] | undefined
        if (values.consultationType === 'external') {
          const unit = values.inviteUnit || ''
          experts = values.expertMode === 'title'
            ? [{ unit, name: values.expertSpecialty || '', title: values.expertTitle || '' }]
            : [{ unit, name: values.expertName || '', title: '' }]
        }
        // MDT 按科室邀请：写入科室/职称/医师条目；按团队模式不保留
        const mdtInviteList = values.consultationType === 'mdt' && Array.isArray(values.inviteModes) && values.inviteModes.includes('dept')
          ? (Array.isArray(values.mdtInvites) ? values.mdtInvites : [])
          : undefined
        // 剥离仅供表单交互使用的临时字段，避免写入记录
        const { expertMode, inviteUnit, expertName, expertSpecialty, expertTitle, inviteModes, mdtInvites, ...rest } = values
        const newRecord: ConsultationRecord = {
          ...rest,
          ...(experts ? { experts } : {}),
          ...(mdtInviteList ? { mdtInvites: mdtInviteList } : {}),
          id: `CONS-2026-${String(data.length + 1).padStart(4, '0')}`,
          status: 'pending_approval',
          approvalStatus: 'pending_approval',
          consultationStatus: 'applying',
          applyTime: dayjs().format('YYYY-MM-DD HH:mm'),
        }
        setData([newRecord, ...data])
        message.success('会诊申请已提交，等待审批')
      } else {
        const editId = editingIdRef.current
        if (editId) {
          const { inviteModes, mdtInvites, ...rest } = values
          const patch: Partial<ConsultationRecord> = { ...rest }
          if (values.consultationType === 'mdt') {
            patch.mdtInvites = Array.isArray(values.inviteModes) && values.inviteModes.includes('dept')
              ? (Array.isArray(values.mdtInvites) ? values.mdtInvites : [])
              : undefined
          }
          setData(prev => prev.map(d => d.id === editId ? { ...d, ...patch } : d))
        }
        message.success('会诊申请已更新')
      }
      setDrawerOpen(false)
    } catch {
      // validation error
    }
  }

  const handleDelete = (record: ConsultationRecord) => {
    setData(data.filter(d => d.id !== record.id))
    message.success('已删除')
  }

  const handleWithdraw = (record: ConsultationRecord) => {
    setData(prev => prev.map(d => d.id === record.id ? { ...d, approvalStatus: 'revoked' } : d))
    message.success('已撤回申请')
  }

  // 患者唯一标识：姓名 + 住院号/门诊号
  const patientKey = (r: ConsultationRecord) =>
    `${r.patientName}__${r.patientType === 'outpatient' ? (r.outpatientNo || '') : (r.admissionNo || '')}`

  // ===== 患者 360 视图 =====
  const handleOpenPatient360 = (record: ConsultationRecord) => {
    setPatient360Record(record)
    setPatient360Tab('timeline')
    setPatient360Open(true)
  }

  // ===== 会诊意见（会诊结束后填写） =====
  const handleOpenRecord = (record: ConsultationRecord) => {
    setRecordRecord(record)
    setRecordTab('fill')
    const editable = record.status === 'completed' || record.status === 'archived'
    setRecordEditable(editable)
    recordForm.resetFields()
    recordForm.setFieldsValue({
      ...record,
      consultStartTime: (record.consultStartTime || record.completionTime) ? dayjs(record.consultStartTime || record.completionTime) : undefined,
      consultEndTime: (record.consultEndTime || record.completionTime) ? dayjs(record.consultEndTime || record.completionTime) : undefined,
      arrivalTime: record.arrivalTime ? dayjs(record.arrivalTime) : undefined,
    })
    setRecordOpen(true)
  }

  const handleSubmitRecord = async () => {
    try {
      const values = await recordForm.validateFields()
      if (values.consultStartTime) values.consultStartTime = dayjs(values.consultStartTime).format('YYYY-MM-DD HH:mm:ss')
      if (values.consultEndTime) {
        values.consultEndTime = dayjs(values.consultEndTime).format('YYYY-MM-DD HH:mm:ss')
        values.completionTime = values.consultEndTime  // 兼容时间轴等处的完成时间
      }
      if (values.arrivalTime) values.arrivalTime = dayjs(values.arrivalTime).format('YYYY-MM-DD HH:mm:ss')
      setData(prev => prev.map(d => d.id === recordRecord!.id ? { ...d, ...values } : d))
      message.success('会诊记录已保存')
      setRecordOpen(false)
    } catch {
      // validation error
    }
  }

  const columns: ColumnsType<ConsultationRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left',
      render: (_: unknown, __: ConsultationRecord, index: number) => (page - 1) * 10 + index + 1,
    },
    {
      title: '编码',
      dataIndex: 'id',
      key: 'id',
      width: 130,
      fixed: 'left',
      render: (v: string) => <Text strong style={{ fontSize: 13, color: '#1677ff' }}>{v}</Text>,
    },
    {
      title: '会诊类型',
      dataIndex: 'consultationType',
      key: 'consultationType',
      width: 110,
      render: (v: ConsultationType) => (
        <Tag color={CONSULTATION_TYPE_MAP[v].color}>{CONSULTATION_TYPE_MAP[v].label}</Tag>
      ),
    },
    {
      title: '紧急程度',
      dataIndex: 'urgencyLevel',
      key: 'urgencyLevel',
      width: 100,
      render: (v: UrgencyLevel) => (
        <Tag color={URGENCY_MAP[v].color}>
          {URGENCY_MAP[v].label}
        </Tag>
      ),
    },
    {
      title: '拟会诊时间',
      dataIndex: 'plannedConsultTime',
      key: 'plannedConsultTime',
      width: 170,
      render: (v: string) => v || '-',
    },
    {
      title: '审批状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 90,
      render: (v: ApprovalStatus) => (
        <Tag color={APPROVAL_STATUS_MAP[v || 'draft'].color}>{APPROVAL_STATUS_MAP[v || 'draft'].label}</Tag>
      ),
    },
    {
      title: '会诊状态',
      dataIndex: 'consultationStatus',
      key: 'consultationStatus',
      width: 90,
      render: (v: ConsultationStage) => (
        <Tag color={CONSULTATION_STAGE_MAP[v || 'applying'].color}>{CONSULTATION_STAGE_MAP[v || 'applying'].label}</Tag>
      ),
    },
    {
      title: '住院/门诊号',
      key: 'patientNo',
      width: 130,
      render: (_: unknown, r: ConsultationRecord) =>
        r.patientType === 'outpatient' ? (r.outpatientNo || '-') : (r.admissionNo || '-'),
    },
    {
      title: '姓名',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 90,
    },
    {
      title: '性别',
      dataIndex: 'patientGender',
      key: 'patientGender',
      width: 70,
    },
    {
      title: '年龄',
      dataIndex: 'patientAge',
      key: 'patientAge',
      width: 70,
      render: (v: number) => `${v}岁`,
    },
    {
      title: '申请科室',
      dataIndex: 'applyDept',
      key: 'applyDept',
      width: 110,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 100,
      render: (v: string) => v,
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 150,
      sorter: (a: ConsultationRecord, b: ConsultationRecord) => a.applyTime.localeCompare(b.applyTime),
    },
    {
      title: '操作',
      key: 'action',
      width: 340,
      fixed: 'right',
      render: (_: unknown, r: ConsultationRecord) => {
        const a = r.approvalStatus
        const view360Btn = (
          <Button type="link" size="small" icon={<FundOutlined />} onClick={() => handleOpenPatient360(r)}>360视图</Button>
        )
        // 会诊未结束则置灰「诊疗方案」按钮
        const finished = r.status === 'completed' || r.status === 'archived'
        const recordBtn = (
          <Tooltip title={finished ? undefined : '会诊尚未结束，暂不可填写诊疗方案'}>
            <span>
              <Button type="link" size="small" icon={<FileDoneOutlined />} disabled={!finished} onClick={() => handleOpenRecord(r)}>诊疗方案</Button>
            </span>
          </Tooltip>
        )
        if (a === 'draft' || a === 'revoked') {
          return (
            <Space size={4}>
              {view360Btn}
              {recordBtn}
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(r)}>编辑</Button>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)}>删除</Button>
            </Space>
          )
        }
        if (a === 'pending_approval') {
          return (
            <Space size={4}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>查看</Button>
              {view360Btn}
              {recordBtn}
              <Button type="link" size="small" icon={<RollbackOutlined />} onClick={() => handleWithdraw(r)}>撤回</Button>
            </Space>
          )
        }
        if (a === 'rejected') {
          return (
            <Space size={4}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>查看</Button>
              {view360Btn}
              {recordBtn}
              <Button type="link" size="small" icon={<EditOutlined />} disabled onClick={() => handleOpenEdit(r)}>编辑</Button>
            </Space>
          )
        }
        // 已审批
        return (
          <Space size={4}>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>查看</Button>
            {view360Btn}
            {recordBtn}
          </Space>
        )
      },
    },
  ]

  const renderFormFields = (
    type: ConsultationType | undefined,
    disabled: boolean,
    formInst: FormInstance<ConsultationRecord>,
  ) => {
    const patientType = Form.useWatch('patientType', formInst)
    return (
    <>
      <SectionTitle text="申请信息" />
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="申请科室" name="applyDept" rules={[{ required: true }]}>
            <Select showSearch disabled={disabled} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="申请人" name="applicant" rules={[{ required: true, message: '请输入申请人' }]}>
            <Input disabled={disabled} placeholder="当前登录人，可修改" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="申请时间" name="applyTime">
            <Input disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="会诊类型" name="consultationType" rules={[{ required: true }]}>
            <Radio.Group
              disabled={disabled}
              optionType="button"
              buttonStyle="solid"
              size="small"
              options={Object.entries(CONSULTATION_TYPE_MAP)
                .filter(([k]) => k !== 'emergency')
                .map(([k, v]) => ({ value: k as ConsultationType, label: v.label }))}
              onChange={(e) => {
                if (disabled) return
                const v = e.target.value as ConsultationType
                if (v === 'mdt') formInst.setFieldValue('scope', 'hospital_wide')
                if (v === 'remote') {
                  formInst.setFieldValue('scope', 'remote')
                  formInst.setFieldValue('consultationMethod', 'online')
                }
                if (v === 'external') {
                  formInst.setFieldValue('scope', 'external')
                  formInst.setFieldValue('consultationMethod', 'onsite')
                  ;(formInst as unknown as { setFieldValue: (name: string, value: unknown) => void }).setFieldValue('expertMode', 'expert')
                }
                if (v === 'regular') formInst.setFieldValue('scope', 'inter_dept')
                // 联动清理：非 MDT 不保留拟邀团队与按科室邀请条目；远程/院外不保留拟邀科室
                if (v === 'mdt') {
                  ;(formInst as unknown as { setFieldValue: (name: string, value: unknown) => void }).setFieldValue('inviteModes', ['team'])
                } else {
                  formInst.setFieldValue('proposedTeam', [])
                  ;(formInst as unknown as { setFieldValue: (name: string, value: unknown) => void }).setFieldValue('mdtInvites', [])
                }
                if (v === 'remote' || v === 'external') formInst.setFieldValue('targetDepts', [])
                // 非 外请 会诊类型时，清理邀请专家临时字段（同为受限 key，统一放宽类型）
                if (v !== 'external') {
                  const extForm = formInst as unknown as { setFieldValue: (name: string, value: unknown) => void }
                  extForm.setFieldValue('inviteUnit', undefined)
                  extForm.setFieldValue('expertName', undefined)
                  extForm.setFieldValue('expertSpecialty', undefined)
                  extForm.setFieldValue('expertTitle', undefined)
                }
              }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="紧急程度" name="urgencyLevel" rules={[{ required: true }]}>
            <Radio.Group
              disabled={disabled}
              optionType="button"
              buttonStyle="solid"
              size="small"
              options={Object.entries(URGENCY_MAP)
                .filter(([k]) => k !== 'urgent')
                .map(([k, v]) => ({ value: k as UrgencyLevel, label: v.label }))}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="会诊方式" name="consultationMethod" rules={[{ required: true }]}>
            <Radio.Group
              disabled={disabled}
              optionType="button"
              buttonStyle="solid"
              size="small"
              options={Object.entries(CONSULTATION_METHOD_MAP)
                .map(([k, v]) => ({ value: k as ConsultationMethod, label: v.label }))}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* 拟会诊时间 + 会诊目的（所有类型 · 会诊类型下一行） */}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="拟会诊时间" name="plannedConsultTime" rules={[{ required: true, message: '请选择拟会诊时间' }]}>
            <DatePicker disabled={disabled} showTime={{ format: 'HH:mm:ss' }} format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} placeholder="请选择拟会诊时间" />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item label="会诊目的" name="purpose" rules={[{ required: true, message: '请填写会诊目的' }]}>
            <Input disabled={disabled} placeholder="请明确会诊需要解决的核心问题" />
          </Form.Item>
        </Col>
      </Row>

      {/* 单科会诊：拟邀科室 + 邀请医师 + 医师职称（同一行，选填） */}
      <Row gutter={16}>
        <Col span={8} hidden={type !== 'regular'}>
          <Form.Item
            label="拟邀科室"
            name="targetDepts"
            rules={[{ required: type === 'regular', message: '请选择拟邀科室' }]}
          >
            <Select
              disabled={disabled}
              showSearch
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
              placeholder="选择拟邀科室"
            />
          </Form.Item>
        </Col>
        <Col span={8} hidden={type !== 'regular'}>
          <Form.Item label="邀请医师" name="inviteDoctor">
            <Select
              disabled={disabled}
              showSearch
              allowClear
              placeholder="请选择邀请医师"
              options={expertStaffPool.map(s => ({ value: s.name, label: `${s.name}（${s.dept}）` }))}
            />
          </Form.Item>
        </Col>
        <Col span={8} hidden={type !== 'regular'}>
          <Form.Item label="医师职称" name="inviteDoctorTitle">
            <Select
              disabled={disabled}
              allowClear
              placeholder="请选择医师职称"
              options={TITLES.map(t => ({ value: t, label: t }))}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* MDT：邀请对象（按团队 / 按科室）切换（会诊目的下一行） */}
      {type === 'mdt' && (
        <Form.Item noStyle dependencies={['inviteModes']}>
          {({ getFieldValue }) => {
            const modes: string[] = getFieldValue('inviteModes') ?? ['team']
            const showTeam = modes.includes('team')
            const showDept = modes.includes('dept')
            return (
              <>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="邀请对象" name="inviteModes">
                      <Checkbox.Group
                        disabled={disabled}
                        options={[
                          { value: 'team', label: '按团队' },
                          { value: 'dept', label: '按科室' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item
                      label="拟邀团队"
                      name="proposedTeam"
                      hidden={!showTeam}
                      rules={showTeam ? [{ required: true, message: '请选择拟邀团队' }] : []}
                    >
                      <Select
                        disabled={disabled}
                        mode="multiple"
                        showSearch
                        optionFilterProp="label"
                        options={CONSULT_TEAMS.map(t => ({ value: t.id, label: `${t.name}（牵头：${t.leadDept}·${t.leader}）` }))}
                        placeholder="选择拟邀团队（可多选）"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                {showDept && (
                  <Form.List name="mdtInvites">
                    {(fields, { add, remove }) => (
                      <div>
                        {fields.map(({ key, name, ...restField }) => (
                          <Row gutter={8} key={key} align="middle" style={{ marginBottom: 8 }}>
                            <Col span={7}>
                              <Form.Item {...restField} name={[name, 'dept']} rules={[{ required: true, message: '请选择科室' }]} style={{ marginBottom: 0 }}>
                                <Select disabled={disabled} showSearch options={DEPARTMENTS.map(d => ({ value: d, label: d }))} placeholder="选择科室" />
                              </Form.Item>
                            </Col>
                            <Col span={7}>
                              <Form.Item {...restField} name={[name, 'title']} rules={[{ required: true, message: '请选择职称' }]} style={{ marginBottom: 0 }}>
                                <Select disabled={disabled} options={TITLES.map(t => ({ value: t, label: t }))} placeholder="选择职称" />
                              </Form.Item>
                            </Col>
                            <Col span={7}>
                              <Form.Item {...restField} name={[name, 'doctor']} rules={[{ required: true, message: '请输入医师' }]} style={{ marginBottom: 0 }}>
                                <Input disabled={disabled} placeholder="请输入医师姓名" />
                              </Form.Item>
                            </Col>
                            <Col span={3}>
                              <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} disabled={disabled}>删除</Button>
                            </Col>
                          </Row>
                        ))}
                        {!disabled && (
                          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>添加</Button>
                        )}
                      </div>
                    )}
                  </Form.List>
                )}
              </>
            )
          }}
        </Form.Item>
      )}

      {/* 远程会诊特有 · 远程平台 / 远程单位（拟会诊时间下一行） */}
      {type === 'remote' && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="远程平台" name="remotePlatform" rules={[{ required: true, message: '请输入远程平台' }]}>
              <Input disabled={disabled} placeholder="如：远程医疗协作网" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="远程单位" name="remoteUnit" rules={[{ required: true, message: '请输入远程单位' }]}>
              <Input disabled={disabled} placeholder="如：协和医院 远程会诊中心" />
            </Form.Item>
          </Col>
        </Row>
      )}

      {/* 邀请专家信息（外请会诊 · 查看/编辑既有记录时按专家列表展示） */}
      <Form.Item
        label="邀请专家信息"
        hidden={type !== 'external' || (formType === 'create' && !disabled)}
      >
        <Form.List name="experts">
          {(fields, { add, remove }) => (
            <div>
              <Row gutter={8} style={{ marginBottom: 8 }} hidden={fields.length === 0}>
                <Col span={7}><Text type="secondary" style={{ fontSize: 12 }}>专家单位</Text></Col>
                <Col span={6}><Text type="secondary" style={{ fontSize: 12 }}>专家姓名</Text></Col>
                <Col span={6}><Text type="secondary" style={{ fontSize: 12 }}>专家职称</Text></Col>
                <Col span={3}><Text type="secondary" style={{ fontSize: 12 }}>操作</Text></Col>
              </Row>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={8} key={key} align="middle" style={{ marginBottom: 8 }}>
                  <Col span={7}>
                    <Form.Item {...restField} name={[name, 'unit']} rules={[{ required: true, message: '请输入单位' }]} style={{ marginBottom: 0 }}>
                      <Input disabled={disabled} placeholder="如：XX医院" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: '请输入姓名' }]} style={{ marginBottom: 0 }}>
                      <Input disabled={disabled} placeholder="专家姓名" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item {...restField} name={[name, 'title']} rules={[{ required: true, message: '请选择职称' }]} style={{ marginBottom: 0 }}>
                      <Select disabled={disabled} options={TITLES.map(t => ({ value: t, label: t }))} placeholder="请选择" />
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} disabled={disabled}>删除</Button>
                  </Col>
                </Row>
              ))}
              {!disabled && (
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
                  添加专家
                </Button>
              )}
            </div>
          )}
        </Form.List>
      </Form.Item>

      {/* 邀请专家信息（外请会诊 · 新建时展示，会诊类型下一行） */}
      {type === 'external' && formType === 'create' && !disabled && (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="拟邀请类型" name="expertMode" rules={[{ required: true }]}>
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  onChange={(e) => {
                    // expertMode 等为外请会诊专用交互字段，不在 ConsultationRecord 类型中，这里放宽类型
                    const extForm = formInst as unknown as { setFieldValue: (name: string, value: unknown) => void }
                    if (e.target.value === 'expert') {
                      extForm.setFieldValue('expertSpecialty', undefined)
                      extForm.setFieldValue('expertTitle', undefined)
                    } else {
                      extForm.setFieldValue('expertName', undefined)
                    }
                  }}
                  options={[
                    { value: 'expert', label: '指定专家' },
                    { value: 'title', label: '指定专业职称' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="拟邀请单位" name="inviteUnit" rules={[{ required: true, message: '请输入拟邀请单位' }]}>
                <Input placeholder="受邀外院名称" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item noStyle dependencies={['expertMode']}>
            {({ getFieldValue }) => {
              const mode = getFieldValue('expertMode')
              return (
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="拟邀请专家" name="expertName" rules={mode === 'expert' ? [{ required: true, message: '请输入拟邀请专家' }] : []}>
                      <Input placeholder="专家姓名" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="专家专业" name="expertSpecialty" rules={mode === 'title' ? [{ required: true, message: '请输入专家专业' }] : []}>
                      <Input placeholder="如：心血管内科" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="专家职称" name="expertTitle" rules={mode === 'title' ? [{ required: true, message: '请选择专家职称' }] : []}>
                      <Select options={TITLES.map(t => ({ value: t, label: t }))} placeholder="请选择" />
                    </Form.Item>
                  </Col>
                </Row>
              )
            }}
          </Form.Item>
        </>
      )}

      <SectionTitle text="患者基本信息" />
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="患者类型" name="patientType" rules={[{ required: true, message: '请选择患者类型' }]}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              disabled={disabled}
              onChange={(e) => {
                if (disabled) return
                const v = e.target.value as 'inpatient' | 'outpatient'
                if (v === 'inpatient') formInst.setFieldValue('outpatientNo', undefined)
                else formInst.setFieldValue('admissionNo', undefined)
              }}
              options={[
                { value: 'inpatient', label: '住院' },
                { value: 'outpatient', label: '门诊' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={patientType === 'outpatient' ? '门诊号' : '住院号'}
            name={patientType === 'outpatient' ? 'outpatientNo' : 'admissionNo'}
            rules={[{ required: true, message: patientType === 'outpatient' ? '请输入门诊号' : '请输入住院号' }]}
          >
            <Input disabled={disabled} placeholder={patientType === 'outpatient' ? 'MZ开头门诊号' : 'ZY开头住院号'} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="姓名" name="patientName" rules={[{ required: true, message: '请输入患者姓名' }]}>
            <Input disabled={disabled} placeholder="请输入" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="性别" name="patientGender" rules={[{ required: true }]}>
            <Select disabled={disabled} options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="年龄" name="patientAge" rules={[{ required: true }]}>
            <Input type="number" disabled={disabled} placeholder="岁" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="联系方式" name="contact">
            <Input disabled={disabled} placeholder="请输入" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="诊断" name="diagnosis">
        <Input disabled={disabled} placeholder="如已知请填写" />
      </Form.Item>
      <Form.Item label="病情摘要" name="briefHistory" rules={[{ required: true, message: '请填写病情摘要' }]}>
        <TextArea rows={3} disabled={disabled} placeholder="请描述患者主诉、现病史、重要检查结果等" />
      </Form.Item>
      <Form.Item label="治疗过程" name="treatmentProcess">
        <TextArea rows={3} disabled={disabled} placeholder="请描述已进行的治疗过程" />
      </Form.Item>

      <Form.Item label="附件" name="attachments" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
        <Upload maxCount={5} beforeUpload={() => false} disabled={disabled}>
          <Button type="primary" icon={<UploadOutlined />}>上传附件</Button>
        </Upload>
      </Form.Item>
    </>
  )
  }

  const detailDrawer = () => {
    const r = detailRecord
    return (
      <Drawer
        title="会诊详情"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        width={1350}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDetailRecord(null)}>关闭</Button>
          </div>
        }
      >
        <DrawerTabs
          activeKey={viewActiveKey}
          onChange={setViewActiveKey}
          panels={[
            {
              key: 'apply',
              label: '申请单',
              node: (
                <Form
                  form={viewForm}
                  layout="horizontal"
                  labelAlign="left"
                  labelCol={{ flex: '0 0 92px' }}
                  wrapperCol={{ flex: '1 1 auto' }}
                  disabled
                >
                  {renderFormFields(r?.consultationType, true, viewForm)}
                </Form>
              ),
            },
            {
              key: 'arrange',
              label: '会诊安排',
              node: (
                <Descriptions bordered size="small" column={2}>
                  {r?.consultationType === 'mdt' && (
                    <Descriptions.Item label={r?.mdtInvites?.length ? '邀请科室/医师' : '邀请团队'}>
                      {r?.mdtInvites?.length
                        ? r.mdtInvites.map(i => `${i.dept} ${i.title} ${i.doctor}`).join('；')
                        : (r?.proposedTeam?.map(id => CONSULT_TEAMS.find(t => t.id === id)?.name).filter(Boolean).join('、') || '-')}
                    </Descriptions.Item>
                  )}
                  {r?.consultationType !== 'remote' && r?.consultationType !== 'external' && (
                    <Descriptions.Item label="邀请科室">
                      {(r?.arrangeDepts || r?.targetDepts || []).join('、') || '-'}
                    </Descriptions.Item>
                  )}
                  {r?.consultationType === 'external' && (
                    <Descriptions.Item label="邀请专家">
                      {r?.experts?.length ? r.experts.map(e => `${e.unit} ${e.name}（${e.title}）`).join('、') : '-'}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="会诊时间">{r?.plannedConsultTime || '-'}</Descriptions.Item>
                  <Descriptions.Item label="会议室">{r?.meetingRoom || '-'}</Descriptions.Item>
                  <Descriptions.Item label="会议号">{r?.meetingNo || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'exec',
              label: '执行记录',
              node: r ? <Timeline items={buildExecTimeline(r)} /> : <Empty description="暂无记录" />,
            },
          ]}
        />
      </Drawer>
    )
  }

  // ===== 会诊意见抽屉（标签一：填写；标签二：会诊意见明细） =====
  const recordDrawer = () => {
    const r = recordRecord
    if (!r) return null
    const disabled = !recordEditable
    const t = r.consultationType

    // 会诊意见明细（演示数据）：按特邀科室 / MDT邀请展开各会诊医师意见
    const seed = Array.from(r.id).reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const doctorPool = ['王建国', '李国华', '赵明德', '陈志远', '刘德芳', '孙秀英', '周健康', '吴明辉']
    const notePool = [
      '结合当前病史与检查结果，同意目前诊断与治疗方案，继续原方案执行。',
      '建议进一步完善相关检查，动态观察病情变化，必要时复查。',
      '同意会诊意见，转入我科继续治疗，密切随访观察。',
      '支持多学科协作诊疗，建议按综合会诊意见执行并加强营养支持。',
    ]
    const baseTime = r.scheduledTime || r.plannedConsultTime || r.applyTime
    const doctorSource: { dept: string; doctor: string }[] = r.consultationType === 'mdt' && r.mdtInvites?.length
      ? r.mdtInvites.map(inv => ({ dept: inv.dept, doctor: inv.doctor || doctorPool[(seed + inv.dept.length) % doctorPool.length] }))
      : (r.targetDepts?.length ? r.targetDepts : ['呼吸内科']).map(d => ({ dept: d, doctor: doctorPool[(seed + d.length) % doctorPool.length] }))
    const opinionRows = doctorSource.map((row, i) => ({
      key: `${i}`,
      index: i + 1,
      dept: row.dept,
      doctor: row.doctor,
      signTime: baseTime ? dayjs(baseTime).add(5 + i * 3, 'minute').format('YYYY-MM-DD HH:mm:ss') : '-',
      note: notePool[(seed + i) % notePool.length],
    }))

    const detailPanel = (
      <Table
        size="small"
        rowKey="key"
        pagination={false}
        dataSource={opinionRows}
        locale={{ emptyText: <Empty description="暂无会诊意见明细" /> }}
        columns={[
          { title: '序号', dataIndex: 'index', width: 60, align: 'center', render: (v: number) => v },
          { title: '科室', dataIndex: 'dept', width: 130 },
          { title: '医师', dataIndex: 'doctor', width: 110 },
          { title: '签到时间', dataIndex: 'signTime', width: 170 },
          { title: '会议记录', dataIndex: 'note', render: (v: string) => <span style={{ color: '#555' }}>{v}</span> },
        ]}
      />
    )

    return (
      <Drawer
        title="诊疗方案"
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        width={1200}
        footer={disabled || recordTab !== 'fill' ? null : (
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRecordOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSubmitRecord}>保存</Button>
            </Space>
          </div>
        )}
      >
        <DrawerTabs
          activeKey={recordTab}
          onChange={setRecordTab}
          panels={[
            {
              key: 'fill',
              label: '填写',
              node: (
                <>
        {disabled && (
          <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: '#ad6800' }}>
            该会诊尚未结束，诊疗方案为只读预览；会诊完成后可填写并保存。
          </div>
        )}
        <Form form={recordForm} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 120px' }} wrapperCol={{ flex: '1 1 0', style: { minWidth: 0 } }} disabled={disabled}>
          <SectionTitle text="会诊基本信息" />
          {/* 标签沿用全局 120px，与下方字段纵向对齐；控件撑满所在列，避免行尾大面积留白 */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="会诊类型" name="consultationType">
                <Select
                  disabled
                  style={{ width: '100%' }}
                  options={Object.entries(CONSULTATION_TYPE_MAP).map(([k, v]) => ({ value: k as ConsultationType, label: v.label }))}
                />
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item label="会诊开始时间" name="consultStartTime" rules={[{ required: true, message: '请选择会诊开始时间' }]}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} placeholder="选择时间" />
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item label="会诊结束时间" name="consultEndTime" rules={[{ required: true, message: '请选择会诊结束时间' }]}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} placeholder="选择时间" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="会诊地点" name="meetingRoom">
                <Input style={{ width: '100%' }} placeholder="会议室 / 地点" />
              </Form.Item>
            </Col>
            <Col span={9}>
              {/* 主持人（本院人员下拉，各类会诊均有；MDT 必填），与开始时间同列对齐 */}
              <Form.Item label="主持人" name="host" rules={[{ required: t === 'mdt', message: '请选择主持人' }]}>
                <Select showSearch optionFilterProp="label" options={HOSPITAL_STAFF_OPTIONS} placeholder="请选择主持人" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="参加人员" name="participants">
            <Input placeholder="各科室专家等，逗号分隔" />
          </Form.Item>

          {t === 'emergency' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="到场时间" name="arrivalTime" rules={[{ required: true, message: '请选择到场时间' }]}>
                  <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} placeholder="选择到场时间" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="紧急处理措施" name="emergencyMeasures" rules={[{ required: true, message: '请填写紧急处理措施' }]}>
                  <Input placeholder="现场处置、用药等" />
                </Form.Item>
              </Col>
            </Row>
          )}
          {t === 'regular' && (
            <Form.Item label="建议治疗方案" name="treatmentPlan" rules={[{ required: true, message: '请填写建议治疗方案' }]}>
              <TextArea rows={3} placeholder="请明确会诊建议的治疗方案" />
            </Form.Item>
          )}
          {t === 'remote' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="远程平台" name="remotePlatform" rules={[{ required: true, message: '请输入远程平台' }]}>
                  <Input placeholder="如：远程医疗协作网" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="上级专家/医院" name="remoteExpert" rules={[{ required: true, message: '请输入上级专家/医院' }]}>
                  <Input placeholder="如：协和医院 张教授" />
                </Form.Item>
              </Col>
            </Row>
          )}
          {t === 'external' && (
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="外院名称" name="externalHospital" rules={[{ required: true, message: '请输入外院名称' }]}>
                  <Input placeholder="如：华西医院" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="外院专家" name="externalExpert" rules={[{ required: true, message: '请输入外院专家' }]}>
                  <Input placeholder="专家姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="会诊费用" name="consultCost">
                  <Input placeholder="如：2000 元" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <SectionTitle text="综合诊疗方案" />
          <Form.Item label="综合诊疗方案" name="consultOpinion" rules={[{ required: true, message: '请填写综合诊疗方案' }]}>
            <TextArea rows={4} placeholder="请填写综合诊疗方案与结论" />
          </Form.Item>
          <Form.Item label="附件" name="recordAttachments" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
            <Upload maxCount={5} beforeUpload={() => false} disabled={disabled}>
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
        </Form>
                </>
              ),
            },
            {
              key: 'detail',
              label: '会诊意见明细',
              node: detailPanel,
            },
          ]}
        />
      </Drawer>
    )
  }

  // ===== 患者 360 视图抽屉 =====
  const patient360Drawer = () => {
    const r = patient360Record
    if (!r) return null
    const key = patientKey(r)
    const history = data
      .filter(d => patientKey(d) === key)
      .sort((a, b) => (b.applyTime || '').localeCompare(a.applyTime || ''))

    // 以患者标识生成稳定伪随机演示数据
    const seed = Array.from(key).reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const pick = <T,>(arr: T[], offset = 0): T => arr[(seed + offset) % arr.length]
    const count = (min: number, max: number, offset = 0): number => min + ((seed + offset) % (max - min + 1))
    const patientTypeText = r.patientType === 'outpatient' ? '门诊' : '住院'
    const patientNo = r.patientType === 'outpatient' ? (r.outpatientNo || '-') : (r.admissionNo || '-')

    // 医生姓名池（演示）
    const doctorPool = ['张建华', '李明辉', '王志强', '刘晓燕', '陈建国', '赵淑芬', '孙伟', '周丽娜']

    // 住院时间轴
    const admissionTime = dayjs(r.applyTime).subtract(count(1, 5, 1), 'day').format('YYYY-MM-DD HH:mm')
    const consultEvents = history.slice().reverse().map((h) => ({
      time: h.applyTime,
      label: '申请会诊',
      color: '#722ed1',
      desc: `${h.applyDept} 申请 ${CONSULTATION_TYPE_MAP[h.consultationType].label}，目的：${h.purpose}`,
    }))
    const orderEvents = Array.from({ length: count(1, 3, 2) }, (_, i) => {
      const t = dayjs(admissionTime).add((i + 1) * 2, 'day').format('YYYY-MM-DD 08:00')
      return { time: t, label: '医嘱执行', color: '#13c2c2', desc: '常规查房医嘱已执行' }
    })
    const examEvents = Array.from({ length: count(1, 2, 3) }, (_, i) => {
      const t = dayjs(admissionTime).add((i + 1) * 3, 'day').format('YYYY-MM-DD 09:30')
      return { time: t, label: '检查完成', color: '#fa8c16', desc: `完成${pick(['CT', 'MRI', '超声', 'X线'], i)}检查` }
    })
    const timelineEvents = [
      { time: admissionTime, label: patientTypeText === '门诊' ? '门诊就诊' : '入院登记', color: '#1677ff', desc: `${patientTypeText}登记，${r.bedNo ? `床位 ${r.bedNo}` : '床位待分配'}` },
      ...consultEvents,
      ...orderEvents,
      ...examEvents,
    ].sort((a, b) => a.time.localeCompare(b.time))

    // 各模块演示数据
    const glucoseList = Array.from({ length: count(3, 8, 5) }, (_, i) => {
      const t = dayjs().subtract(i * 4, 'hour').format('YYYY-MM-DD HH:mm')
      const v = (4 + ((seed + i * 7) % 80) / 10).toFixed(1)
      const s = (seed + i * 7) % 10
      const status = s > 6 ? '偏高' : s < 3 ? '偏低' : '正常'
      return { key: i, time: t, value: Number(v), type: i % 3 === 0 ? '空腹' : '餐后2h', status }
    })

    const docTypes = ['入院记录', '首次病程记录', '日常病程记录', '会诊记录', '出院记录', '知情同意书']
    const documents = Array.from({ length: count(2, 6, 6) }, (_, i) => {
      const t = dayjs(r.applyTime).subtract(i, 'day').format('YYYY-MM-DD HH:mm')
      const type = pick(docTypes, i)
      return { key: i, name: `${type}_${r.patientName}`, type, author: pick(doctorPool, i), time: t, status: '已完成' }
    })

    const orderTypes = ['长期医嘱', '临时医嘱']
    const orderContents = ['0.9%氯化钠注射液 250ml ivgtt qd', '头孢曲松钠 2g iv q12h', '心电监护', '血常规 q3d', '吸氧 prn', '胰岛素 6u 皮下注射']
    const orders = Array.from({ length: count(4, 10, 7) }, (_, i) => {
      const t = dayjs(r.applyTime).subtract(i % 5, 'day').format('YYYY-MM-DD HH:mm')
      return { key: i, startTime: t, type: pick(orderTypes, i), content: pick(orderContents, i), status: '执行中' }
    })

    const examItems = ['胸部CT平扫', '头颅MRI', '腹部超声', '心脏彩超', 'X线胸片', '心电图']
    const exams = Array.from({ length: count(1, 5, 8) }, (_, i) => {
      const t = dayjs(r.applyTime).subtract(i * 2 + 1, 'day').format('YYYY-MM-DD')
      return { key: i, time: t, item: pick(examItems, i), result: '检查完成，详见影像报告', status: '已归档' }
    })

    const labItems = ['血常规', '尿常规', '肝肾功能', '凝血功能', '电解质', '血气分析']
    const labUnits = ['10^9/L', 'mg/L', 'U/L', 'mmol/L', '%']
    const labs = Array.from({ length: count(2, 6, 9) }, (_, i) => {
      const t = dayjs(r.applyTime).subtract(i, 'day').format('YYYY-MM-DD HH:mm')
      const item = pick(labItems, i)
      const value = (seed + i * 3) % 100 + 10
      return { key: i, time: t, item, value: `${value}${pick(labUnits, i)}`, status: '正常' }
    })

    const surgeryNames = ['腹腔镜胆囊切除术', '骨折内固定术', '冠状动脉造影术', '剖宫产术', '扁桃体切除术']
    const surgeries = Array.from({ length: count(0, 3, 10) }, (_, i) => {
      const t = dayjs(r.applyTime).subtract(i + 2, 'day').format('YYYY-MM-DD HH:mm')
      return { key: i, time: t, name: pick(surgeryNames, i), surgeon: pick(doctorPool, i), status: '已完成' }
    })

    const block = (text?: string) => (
      <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 14px', whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.8, color: '#333', minHeight: 48 }}>
        {text || <Text type="secondary">暂无记录</Text>}
      </div>
    )

    const historyColumns: ColumnsType<ConsultationRecord> = [
      {
        title: '会诊编号',
        dataIndex: 'id',
        key: 'id',
        width: 140,
        render: (v: string) => <Text strong style={{ fontSize: 12, color: '#1677ff' }}>{v}</Text>,
      },
      {
        title: '会诊类型',
        dataIndex: 'consultationType',
        key: 'consultationType',
        width: 90,
        render: (v: ConsultationType) => <Tag color={CONSULTATION_TYPE_MAP[v].color}>{CONSULTATION_TYPE_MAP[v].label}</Tag>,
      },
      {
        title: '会诊状态',
        dataIndex: 'consultationStatus',
        key: 'consultationStatus',
        width: 90,
        render: (v: ConsultationStage) => <Tag color={CONSULTATION_STAGE_MAP[v || 'applying'].color}>{CONSULTATION_STAGE_MAP[v || 'applying'].label}</Tag>,
      },
      {
        title: '拟会诊时间',
        dataIndex: 'plannedConsultTime',
        key: 'plannedConsultTime',
        width: 120,
        render: (v: string) => v || <Text style={{ color: '#d9d9d9' }}>-</Text>,
      },
      {
        title: '邀请科室',
        dataIndex: 'targetDepts',
        key: 'targetDepts',
        render: (v: string[]) => (v && v.length ? v.map(d => <Tag key={d}>{d}</Tag>) : <Text style={{ color: '#d9d9d9' }}>-</Text>),
      },
      {
        title: '诊疗方案',
        dataIndex: 'consultOpinion',
        key: 'consultOpinion',
        ellipsis: true,
        render: (v: string) => v || <Text style={{ color: '#d9d9d9' }}>-</Text>,
      },
    ]

    const renderContent = () => {
      switch (patient360Tab) {
        case 'timeline':
          return (
            <>
              <SectionTitle text="患者概况" />
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="姓名">{r.patientName}</Descriptions.Item>
                <Descriptions.Item label="性别/年龄">{r.patientGender} / {r.patientAge}岁</Descriptions.Item>
                <Descriptions.Item label="患者类型">{patientTypeText}</Descriptions.Item>
                <Descriptions.Item label={r.patientType === 'outpatient' ? '门诊号' : '住院号'}>{patientNo}</Descriptions.Item>
                <Descriptions.Item label="联系方式">{r.contact || '-'}</Descriptions.Item>
                <Descriptions.Item label="床位号">{r.bedNo || '-'}</Descriptions.Item>
                <Descriptions.Item label="申请科室">{r.applyDept}</Descriptions.Item>
                <Descriptions.Item label="申请人">{r.applicant}{r.applicantTitle ? `（${r.applicantTitle}）` : ''}</Descriptions.Item>
              </Descriptions>

              <SectionTitle text="临床诊断" />
              {block(r.diagnosis)}

              <SectionTitle text="病情摘要" />
              {block(r.briefHistory)}

              <SectionTitle text="治疗过程" />
              {block(r.treatmentProcess)}

              <SectionTitle text="住院时间轴" />
              <Timeline items={timelineEvents.map(e => ({
                color: e.color,
                children: (
                  <div>
                    <Text strong>{e.label}</Text>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{e.time}</div>
                    <div style={{ fontSize: 13 }}>{e.desc}</div>
                  </div>
                ),
              }))} />
            </>
          )
        case 'glucose':
          return (
            <>
              <SectionTitle text="血糖监测" />
              <Table
                size="small"
                dataSource={glucoseList}
                pagination={false}
                columns={[
                  { title: '采集时间', dataIndex: 'time', key: 'time' },
                  { title: '类型', dataIndex: 'type', key: 'type' },
                  { title: '血糖值(mmol/L)', dataIndex: 'value', key: 'value' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === '正常' ? 'success' : 'error'}>{v}</Tag> },
                ]}
              />
            </>
          )
        case 'documents':
          return (
            <>
              <SectionTitle text="文书列表" />
              <Table
                size="small"
                dataSource={documents}
                pagination={false}
                columns={[
                  { title: '文书名称', dataIndex: 'name', key: 'name' },
                  { title: '类型', dataIndex: 'type', key: 'type' },
                  { title: '书写人', dataIndex: 'author', key: 'author' },
                  { title: '书写时间', dataIndex: 'time', key: 'time' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color="success">{v}</Tag> },
                ]}
              />
            </>
          )
        case 'orders':
          return (
            <>
              <SectionTitle text="医嘱记录" />
              <Table
                size="small"
                dataSource={orders}
                pagination={false}
                columns={[
                  { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
                  { title: '医嘱类型', dataIndex: 'type', key: 'type' },
                  { title: '医嘱内容', dataIndex: 'content', key: 'content' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color="processing">{v}</Tag> },
                ]}
              />
            </>
          )
        case 'exams':
          return (
            <>
              <SectionTitle text="检查报告" />
              <Table
                size="small"
                dataSource={exams}
                pagination={false}
                columns={[
                  { title: '检查日期', dataIndex: 'time', key: 'time' },
                  { title: '检查项目', dataIndex: 'item', key: 'item' },
                  { title: '结果摘要', dataIndex: 'result', key: 'result' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v}</Tag> },
                ]}
              />
            </>
          )
        case 'labs':
          return (
            <>
              <SectionTitle text="检验结果" />
              <Table
                size="small"
                dataSource={labs}
                pagination={false}
                columns={[
                  { title: '检验时间', dataIndex: 'time', key: 'time' },
                  { title: '检验项目', dataIndex: 'item', key: 'item' },
                  { title: '结果', dataIndex: 'value', key: 'value' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color="success">{v}</Tag> },
                ]}
              />
            </>
          )
        case 'surgeries':
          return surgeries.length ? (
            <>
              <SectionTitle text="手术记录" />
              <Table
                size="small"
                dataSource={surgeries}
                pagination={false}
                columns={[
                  { title: '手术时间', dataIndex: 'time', key: 'time' },
                  { title: '手术名称', dataIndex: 'name', key: 'name' },
                  { title: '主刀医生', dataIndex: 'surgeon', key: 'surgeon' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color="success">{v}</Tag> },
                ]}
              />
            </>
          ) : (
            <Empty description="暂无手术记录" />
          )
        case 'consultations':
          return (
            <>
              <SectionTitle text={`历次会诊记录（${history.length}）`} />
              <Table
                dataSource={history}
                columns={historyColumns}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 700 }}
              />
            </>
          )
        default:
          return null
      }
    }

    return (
      <Drawer
        title="患者 360 视图"
        open={patient360Open}
        onClose={() => setPatient360Open(false)}
        width={960}
        styles={{ body: { padding: 0 } }}
        footer={<div style={{ textAlign: 'right' }}><Button onClick={() => setPatient360Open(false)}>关闭</Button></div>}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{r.patientName}</span>
          <Tag>{r.patientGender}</Tag>
          <Tag>{r.patientAge}岁</Tag>
          <Tag color={r.patientType === 'outpatient' ? '#1677ff' : '#52c41a'}>{patientTypeText}</Tag>
          <Text type="secondary">{patientNo}</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>当前科室：{r.applyDept}</Text>
        </div>

        <div style={{ display: 'flex', height: 'calc(100% - 65px)' }}>
          <div style={{ width: 160, flexShrink: 0, borderRight: '1px solid #f0f0f0', padding: '12px 8px' }}>
            {PATIENT_360_MENUS.map(m => {
              const active = patient360Tab === m.key
              const Icon = m.Icon
              return (
                <div
                  key={m.key}
                  onClick={() => setPatient360Tab(m.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    marginBottom: 4,
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: active ? '#1677ff' : 'rgba(0,0,0,0.65)',
                    background: active ? '#e6f4ff' : 'transparent',
                    borderLeft: active ? '3px solid #1677ff' : '3px solid transparent',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon style={{ fontSize: 16 }} />
                  <span style={{ fontSize: 14 }}>{m.label}</span>
                </div>
              )
            })}
          </div>

          <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
            {renderContent()}
          </div>
        </div>
      </Drawer>
    )
  }

  return (
    <div>
      <Card size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            发起会诊
          </Button>
          <Space>
            <Input
              placeholder="搜索编号/患者/申请人/科室"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="会诊类型"
              style={{ width: 130 }}
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: 'all', label: '全部类型' },
                ...Object.entries(CONSULTATION_TYPE_MAP).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
            <Select
              placeholder="审批状态"
              style={{ width: 110 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: '全部状态' },
                ...Object.entries(APPROVAL_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
          </Space>
        </div>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 1810, y: 480 }}
          pagination={{
            pageSize: 10,
            current: page,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={(pagination) => setPage(pagination.current || 1)}
        />
      </Card>

      <Drawer
        title={formType === 'create' ? '发起会诊申请' : '编辑会诊申请'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={1350}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSubmit}>提交</Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 92px' }} wrapperCol={{ flex: '1 1 auto' }}>
          {renderFormFields(consultType, false, form)}
        </Form>
      </Drawer>

      {detailDrawer()}
      {patient360Drawer()}
      {recordDrawer()}
    </div>
  )
}

export default ConsultationApply
