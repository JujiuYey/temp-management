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
  Typography,
  DatePicker,
  Upload,
  Descriptions,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  RollbackOutlined,
  UploadOutlined,
  CalendarOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd'
import type { ConsultationMethod } from './types'
import { CONSULTATION_METHOD_MAP } from './types'
import { DEPARTMENTS, expertData, TITLES } from './mockData'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input

// ==================== 数据模型 ====================
// 外出会诊状态：待审批 → 已退回 / 待确认 → 已确认 / 已取消
type OutgoingStatus = 'pending' | 'rejected' | 'to_confirm' | 'confirmed' | 'cancelled'

interface OutgoingConsultRecord {
  id: string                 // 登记编号
  inviteHospital: string     // 邀请医院
  inviteDept: string         // 邀请科室
  inviteContact: string      // 外院联系人
  invitePhone: string        // 联系电话
  inviteNo: string           // 邀请函编号
  inviteMethod?: ConsultationMethod  // 外院期望方式
  inviteExpectTime?: string  // 外院期望时间
  requestedDept?: string     // 我方拟会诊科室
  requestedExpert?: string   // 我方拟会诊医师
  requestedTitle?: string    // 拟会诊医师职称
  purpose?: string           // 会诊目的
  inviteReason: string       // 病情摘要
  // 外院患者基本信息（登记外出会诊时选择该邀请自动带出）
  patientName?: string
  patientGender?: string
  patientAge?: number
  diagnosis?: string
  attachmentName?: string    // 邀请函附件名
  registerTime: string       // 登记时间
  registerBy: string         // 登记人
  status: OutgoingStatus
  // 审批信息
  approvalNote?: string
  approver?: string
  approvalTime?: string
  // 确认安排信息（审批通过后填写）
  confirmMethod?: ConsultationMethod
  confirmTime?: string
  dispatchDept?: string
  dispatchExperts?: string[]
  confirmLocation?: string
  confirmNote?: string
  confirmDoneTime?: string
}

const OUTGOING_STATUS_MAP: Record<OutgoingStatus, { label: string; color: string }> = {
  pending:   { label: '待审批', color: '#faad14' },
  rejected:  { label: '已退回', color: '#ff4d4f' },
  to_confirm:{ label: '待确认', color: '#1677ff' },
  confirmed: { label: '已确认', color: '#52c41a' },
  cancelled: { label: '已取消', color: '#bfbfbf' },
}

const nowStr = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

// ==================== 分区标题 ====================
const SectionTitle: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 16px', paddingLeft: 0 }}>
    <span style={{ display: 'inline-block', width: 4, height: 15, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{text}</span>
  </div>
)

// ==================== Mock 数据 ====================
export const outgoingMock: OutgoingConsultRecord[] = [
  {
    id: 'CONS-OUT-2026-0001',
    inviteHospital: '北京协和医院', inviteDept: '呼吸内科', inviteContact: '李慧', invitePhone: '010-88886666',
    inviteNo: 'HX-2026-0312', inviteMethod: 'online', inviteExpectTime: '2026-09-08 15:00',
    requestedDept: '呼吸内科', requestedExpert: '刘德海', inviteReason: '患者男性，56岁，右肺上叶占位，需我方呼吸危重症专家远程会诊明确诊疗方案。',
    attachmentName: '协和邀请函.pdf', registerTime: '2026-09-05 09:12', registerBy: '医务科', status: 'pending',
  },
  {
    id: 'CONS-OUT-2026-0002',
    inviteHospital: '四川大学华西医院', inviteDept: '神经外科', inviteContact: '王锐', invitePhone: '028-66667777',
    inviteNo: 'HX-2026-0288', inviteMethod: 'onsite', inviteExpectTime: '2026-09-10 09:30',
    requestedDept: '神经外科', requestedExpert: '胡文莉', inviteReason: '鞍区占位性病变，需我方脑血管病专家赴院现场会诊并参与手术方案讨论。',
    attachmentName: '华西邀请函.pdf', registerTime: '2026-09-04 14:20', registerBy: '医务科', status: 'pending',
  },
  {
    id: 'CONS-OUT-2026-0003',
    inviteHospital: '上海瑞金医院', inviteDept: '心血管内科', inviteContact: '陈静', invitePhone: '021-55556666',
    inviteNo: 'RJ-2026-0156', inviteMethod: 'online', inviteExpectTime: '2026-09-09 10:00',
    requestedDept: '心血管内科', requestedExpert: '陈志强', inviteReason: '复杂冠脉病变介入治疗，需我方冠心病介入专家远程指导。',
    registerTime: '2026-09-03 11:05', registerBy: '医务科', status: 'rejected',
    approvalNote: '我方近期该方向专家排班已满，暂无法派出，已回函说明。', approver: '医务科', approvalTime: '2026-09-03 16:40',
  },
  {
    id: 'CONS-OUT-2026-0004',
    inviteHospital: '中山大学附属第一医院', inviteDept: '肝胆外科', inviteContact: '赵敏', invitePhone: '020-33334444',
    inviteNo: 'ZS-2026-0201', inviteMethod: 'onsite', inviteExpectTime: '2026-09-12 14:00',
    requestedDept: '肝胆外科', requestedExpert: '杨文斌', inviteReason: '肝癌合并门静脉癌栓，需我方肝胆外科专家现场会诊评估手术指征。',
    patientName: '黄志明', patientGender: '男', patientAge: 59, diagnosis: '肝癌合并门静脉癌栓',
    attachmentName: '中山一院邀请函.pdf', registerTime: '2026-09-02 09:30', registerBy: '医务科', status: 'to_confirm',
    approvalNote: '同意派出，请确认具体方式与时间。', approver: '医务科', approvalTime: '2026-09-02 15:10',
  },
  {
    id: 'CONS-OUT-2026-0005',
    inviteHospital: '中南大学湘雅医院', inviteDept: '肿瘤科', inviteContact: '周婷', invitePhone: '0731-22223333',
    inviteNo: 'XY-2026-0098', inviteMethod: 'online', inviteExpectTime: '2026-09-07 16:00',
    requestedDept: '肿瘤科', requestedExpert: '李秀兰', inviteReason: '结直肠癌肝转移，需我方消化道肿瘤专家远程会诊制定综合治疗方案。',
    patientName: '杨桂兰', patientGender: '女', patientAge: 61, diagnosis: '结直肠癌肝转移',
    registerTime: '2026-09-01 10:00', registerBy: '医务科', status: 'confirmed',
    approvalNote: '同意派出。', approver: '医务科', approvalTime: '2026-09-01 14:25',
    confirmMethod: 'online', confirmTime: '2026-09-07 16:00:00', dispatchDept: '肿瘤科', dispatchExperts: ['李秀兰'],
    confirmLocation: '我院远程会诊室', confirmNote: '线上远程会诊，提前联调设备。', confirmDoneTime: '2026-09-01 14:30',
  },
  {
    id: 'CONS-OUT-2026-0006',
    inviteHospital: '浙江省人民医院', inviteDept: '骨科', inviteContact: '孙伟', invitePhone: '0571-88889999',
    inviteNo: 'ZJ-2026-0456', inviteMethod: 'onsite', inviteExpectTime: '2026-09-15 09:00',
    requestedDept: '骨科', requestedExpert: '刘德海', inviteReason: '复杂髋臼骨折，需我方关节外科专家现场会诊指导手术。',
    patientName: '沈国平', patientGender: '男', patientAge: 47, diagnosis: '复杂髋臼骨折',
    registerTime: '2026-08-31 16:40', registerBy: '医务科', status: 'to_confirm',
    approvalNote: '同意派出，请与对方确认行程。', approver: '医务科', approvalTime: '2026-09-01 09:15',
  },
  {
    id: 'CONS-OUT-2026-0007',
    inviteHospital: '江苏省人民医院', inviteDept: '妇产科', inviteContact: '吴芳', invitePhone: '025-66668888',
    inviteNo: 'JS-2026-0333', inviteMethod: 'online', inviteExpectTime: '2026-09-11 15:30',
    requestedDept: '妇产科', requestedExpert: '赵慧敏', inviteReason: '妊娠合并重度子痫前期，需我方产科专家远程会诊评估转诊指征。',
    patientName: '刘春燕', patientGender: '女', patientAge: 32, diagnosis: '妊娠合并重度子痫前期',
    registerTime: '2026-08-30 11:20', registerBy: '医务科', status: 'confirmed',
    approvalNote: '同意派出。', approver: '医务科', approvalTime: '2026-08-30 17:00',
    confirmMethod: 'online', confirmTime: '2026-09-11 15:30:00', dispatchDept: '妇产科', dispatchExperts: ['赵慧敏'],
    confirmLocation: '我院远程会诊室', confirmNote: '线上会诊，重点关注围手术期管理。', confirmDoneTime: '2026-08-30 17:10',
  },
  {
    id: 'CONS-OUT-2026-0008',
    inviteHospital: '武汉同济医院', inviteDept: '胸外科', inviteContact: '郑强', invitePhone: '027-77778888',
    inviteNo: 'WH-2026-0210', inviteMethod: 'onsite', inviteExpectTime: '2026-09-18 10:00',
    requestedDept: '胸外科', requestedExpert: '王建国', inviteReason: '局部晚期肺癌，需我方胸部肿瘤外科专家现场会诊评估新辅助治疗方案。',
    attachmentName: '同济邀请函.pdf', registerTime: '2026-08-29 09:50', registerBy: '医务科', status: 'pending',
  },
  {
    id: 'CONS-OUT-2026-0009',
    inviteHospital: '西京医院', inviteDept: '消化内科', inviteContact: '马丽', invitePhone: '029-99990000',
    inviteNo: 'XJ-2026-0188', inviteMethod: 'online', inviteExpectTime: '2026-09-13 14:30',
    requestedDept: '消化内科', requestedExpert: '赵慧敏', inviteReason: '疑难消化道出血，需我方消化内镜专家远程会诊。',
    registerTime: '2026-08-28 15:10', registerBy: '医务科', status: 'cancelled',
    approvalNote: '对方已改约其他专家，本邀请终止。', approver: '医务科', approvalTime: '2026-08-29 10:00',
  },
  {
    id: 'CONS-OUT-2026-0010',
    inviteHospital: '北京大学第一医院', inviteDept: '肾内科', inviteContact: '林涛', invitePhone: '010-66661111',
    inviteNo: 'BJ-2026-0277', inviteMethod: 'onsite', inviteExpectTime: '2026-09-20 09:30',
    requestedDept: '肾内科', requestedExpert: '黄国华', inviteReason: '疑难肾病综合征，需我方肾脏病理专家现场会诊读片。',
    patientName: '蒋丽娟', patientGender: '女', patientAge: 45, diagnosis: '难治性肾病综合征',
    registerTime: '2026-08-27 10:25', registerBy: '医务科', status: 'to_confirm',
    approvalNote: '同意派出，请确认会诊地点与交通安排。', approver: '医务科', approvalTime: '2026-08-27 16:30',
  },
  {
    id: 'CONS-OUT-2026-0011',
    inviteHospital: '复旦大学附属华山医院', inviteDept: '神经内科', inviteContact: '徐磊', invitePhone: '021-88882222',
    inviteNo: 'HS-2026-0133', inviteMethod: 'online', inviteExpectTime: '2026-09-14 11:00',
    requestedDept: '神经内科', requestedExpert: '王建国', inviteReason: '难治性癫痫，需我方神经内科专家远程会诊调整用药方案。',
    patientName: '陈晓东', patientGender: '男', patientAge: 28, diagnosis: '难治性癫痫',
    registerTime: '2026-08-26 14:00', registerBy: '医务科', status: 'confirmed',
    approvalNote: '同意派出。', approver: '医务科', approvalTime: '2026-08-26 18:20',
    confirmMethod: 'online', confirmTime: '2026-09-14 11:00:00', dispatchDept: '神经内科', dispatchExperts: ['王建国'],
    confirmLocation: '我院远程会诊室', confirmNote: '线上会诊。', confirmDoneTime: '2026-08-26 18:30',
  },
  {
    id: 'CONS-OUT-2026-0012',
    inviteHospital: '天津医科大学总医院', inviteDept: '普外科', inviteContact: '高扬', invitePhone: '022-55556666',
    inviteNo: 'TJ-2026-0244', inviteMethod: 'onsite', inviteExpectTime: '2026-09-22 09:00',
    requestedDept: '普外科', requestedExpert: '徐丽华', inviteReason: '直肠癌术后吻合口漏，需我方胃肠外科专家现场会诊指导处理。',
    attachmentName: '天津总院邀请函.pdf', registerTime: '2026-08-25 09:40', registerBy: '医务科', status: 'pending',
  },
]

const expertOptions = expertData.map(e => ({ value: e.name, label: `${e.name}（${e.dept}·${e.title}）` }))

// ==================== 主组件 ====================
const ConsultationOutgoing: React.FC = () => {
  const [data, setData] = useState<OutgoingConsultRecord[]>(outgoingMock)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 登记 / 编辑抽屉
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerType, setRegisterType] = useState<'create' | 'edit'>('create')
  const [registerRecord, setRegisterRecord] = useState<OutgoingConsultRecord | null>(null)
  const [registerForm] = Form.useForm()
  const [attachList, setAttachList] = useState<UploadFile[]>([])

  // 查看抽屉
  const [viewRecord, setViewRecord] = useState<OutgoingConsultRecord | null>(null)

  // 审批抽屉
  const [approveOpen, setApproveOpen] = useState(false)
  const [approveRecord, setApproveRecord] = useState<OutgoingConsultRecord | null>(null)
  const [approveForm] = Form.useForm()

  // 确认抽屉
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmRecord, setConfirmRecord] = useState<OutgoingConsultRecord | null>(null)
  const [confirmForm] = Form.useForm()

  const filteredData = useMemo(() => {
    let list = data
    if (statusFilter !== 'all') list = list.filter(d => d.status === statusFilter)
    if (searchText) {
      const kw = searchText.toLowerCase()
      list = list.filter(d =>
        d.id.toLowerCase().includes(kw) ||
        d.inviteHospital.includes(searchText) ||
        d.inviteDept.includes(searchText) ||
        (d.requestedExpert || '').includes(searchText) ||
        (d.requestedDept || '').includes(searchText),
      )
    }
    return list.sort((a, b) => b.registerTime.localeCompare(a.registerTime))
  }, [data, statusFilter, searchText])

  // ===== 登记 / 编辑 =====
  const handleOpenRegister = () => {
    setRegisterType('create')
    setRegisterRecord(null)
    registerForm.resetFields()
    registerForm.setFieldsValue({
      registerBy: '医务科',
      inviteMethod: 'onsite',
      applyDate: dayjs(),
      patientGender: '男',
    })
    setAttachList([])
    setRegisterOpen(true)
  }

  const handleOpenEdit = (record: OutgoingConsultRecord) => {
    setRegisterType('edit')
    setRegisterRecord(record)
    registerForm.setFieldsValue({
      ...record,
      inviteExpectTime: record.inviteExpectTime ? dayjs(record.inviteExpectTime) : undefined,
      applyDate: record.registerTime ? dayjs(record.registerTime) : dayjs(),
    })
    setAttachList(record.attachmentName ? [{ uid: record.attachmentName, name: record.attachmentName }] : [])
    setRegisterOpen(true)
  }

  const handleRegisterSubmit = async () => {
    try {
      const values = await registerForm.validateFields()
      // applyDate 仅为表单展示字段（申请日期），登记/编辑时间以 registerTime 为准，不写入记录
      const { applyDate: _applyDate, ...restValues } = values
      const attachmentName = attachList[0]?.name
      const inviteExpectTime = restValues.inviteExpectTime ? dayjs(restValues.inviteExpectTime).format('YYYY-MM-DD HH:mm') : undefined
      if (registerType === 'create') {
        const newRec: OutgoingConsultRecord = {
          ...restValues,
          inviteExpectTime,
          attachmentName,
          id: `CONS-OUT-2026-${String(data.length + 1).padStart(4, '0')}`,
          registerTime: nowStr(),
          status: 'pending',
        }
        setData([newRec, ...data])
        message.success('邀请函已登记，等待审批')
      } else {
        setData(prev => prev.map(d => d.id === registerRecord?.id
          ? { ...d, ...restValues, inviteExpectTime, attachmentName, registerTime: nowStr(), status: 'pending' }
          : d))
        message.success('登记已更新，重新进入待审批')
      }
      setRegisterOpen(false)
    } catch {
      // 校验未通过
    }
  }

  // ===== 查看 =====
  const handleView = (record: OutgoingConsultRecord) => {
    setViewRecord(record)
  }

  // ===== 审批 =====
  const handleOpenApprove = (record: OutgoingConsultRecord) => {
    setApproveRecord(record)
    approveForm.resetFields()
    approveForm.setFieldsValue({ approver: '医务科' })
    setApproveOpen(true)
  }

  const handleApprove = () => {
    const approvalNote = approveForm.getFieldValue('approvalNote')
    const approver = approveForm.getFieldValue('approver') || '医务科'
    setData(prev => prev.map(d => d.id === approveRecord?.id
      ? { ...d, status: 'to_confirm', approver, approvalNote, approvalTime: nowStr() }
      : d))
    message.success('审批通过，待确认会诊安排')
    setApproveOpen(false)
  }

  const handleReject = () => {
    const approvalNote = approveForm.getFieldValue('approvalNote')
    const approver = approveForm.getFieldValue('approver') || '医务科'
    setData(prev => prev.map(d => d.id === approveRecord?.id
      ? { ...d, status: 'rejected', approver, approvalNote, approvalTime: nowStr() }
      : d))
    message.success('已退回邀请函')
    setApproveOpen(false)
  }

  // ===== 确认安排 =====
  const handleOpenConfirm = (record: OutgoingConsultRecord) => {
    setConfirmRecord(record)
    confirmForm.resetFields()
    confirmForm.setFieldsValue({
      confirmMethod: record.inviteMethod,
      confirmTime: record.inviteExpectTime ? dayjs(record.inviteExpectTime) : undefined,
      dispatchDept: record.requestedDept,
      dispatchExperts: record.requestedExpert ? [record.requestedExpert] : [],
      confirmLocation: record.inviteMethod === 'online' ? '我院远程会诊室' : '外院现场',
    })
    setConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    try {
      const values = await confirmForm.validateFields()
      const confirmTime = values.confirmTime ? dayjs(values.confirmTime).format('YYYY-MM-DD HH:mm:ss') : undefined
      setData(prev => prev.map(d => d.id === confirmRecord?.id
        ? {
            ...d,
            confirmMethod: values.confirmMethod,
            confirmTime,
            dispatchDept: values.dispatchDept,
            dispatchExperts: values.dispatchExperts || [],
            confirmLocation: values.confirmLocation,
            confirmNote: values.confirmNote,
            confirmDoneTime: nowStr(),
            status: 'confirmed',
          }
        : d))
      message.success('已确认外出会诊安排')
      setConfirmOpen(false)
    } catch {
      // 校验未通过
    }
  }

  // ===== 撤回 / 删除 =====
  const handleWithdraw = (record: OutgoingConsultRecord) => {
    setData(prev => prev.map(d => d.id === record.id
      ? { ...d, status: 'cancelled', approvalNote: (d.approvalNote ? d.approvalNote + '；' : '') + '已撤回' }
      : d))
    message.success('已撤回外出会诊')
  }

  const handleDelete = (record: OutgoingConsultRecord) => {
    setData(prev => prev.filter(d => d.id !== record.id))
    message.success('已删除登记')
  }

  // ===== 审批状态 / 确认状态 标签 =====
  const approvalTag = (r: OutgoingConsultRecord) => {
    if (r.status === 'rejected') return <Tag color="#ff4d4f">已退回</Tag>
    if (r.status === 'pending') return <Tag color="#faad14">待审批</Tag>
    return <Tag color="#1677ff">已审批</Tag>
  }
  const confirmTag = (r: OutgoingConsultRecord) => {
    if (r.status === 'confirmed') return <Tag color="#52c41a">已确认</Tag>
    if (r.status === 'to_confirm') return <Tag color="#1677ff">待确认</Tag>
    return <Text style={{ color: '#d9d9d9' }}>—</Text>
  }

  const columns: ColumnsType<OutgoingConsultRecord> = [
    {
      title: '序号', key: 'index', width: 60, fixed: 'left', align: 'center',
      render: (_, __, index) => (index ?? 0) + 1,
    },
    {
      title: '登记编号', dataIndex: 'id', key: 'id', width: 140, fixed: 'left',
      render: (v: string) => <Text strong style={{ color: '#1677ff', fontSize: 13 }}>{v}</Text>,
    },
    {
      title: '邀请医院', dataIndex: 'inviteHospital', key: 'inviteHospital', width: 150,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: '邀请科室', dataIndex: 'inviteDept', key: 'inviteDept', width: 110,
    },
    {
      title: '拟会诊科室', dataIndex: 'requestedDept', key: 'requestedDept', width: 110,
      render: (v?: string) => v || <Text style={{ color: '#d9d9d9' }}>—</Text>,
    },
    {
      title: '拟会诊医师', dataIndex: 'requestedExpert', key: 'requestedExpert', width: 110,
      render: (v?: string) => v || <Text style={{ color: '#d9d9d9' }}>—</Text>,
    },
    {
      title: '登记时间', dataIndex: 'registerTime', key: 'registerTime', width: 150,
      sorter: (a, b) => a.registerTime.localeCompare(b.registerTime),
    },
    {
      title: '审批状态', key: 'approval', width: 90,
      render: (_, r) => approvalTag(r),
    },
    {
      title: '操作', key: 'action', width: 250, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>查看</Button>
          {r.status === 'pending' && (
            <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => handleOpenEdit(r)}>编辑</Button>
          )}
          {(r.status === 'to_confirm' || r.status === 'confirmed') && (
            <Popconfirm title="确认撤回该外出会诊？" okText="撤回" cancelText="取消" onConfirm={() => handleWithdraw(r)}>
              <Button type="link" size="small" danger icon={<RollbackOutlined />}>撤回</Button>
            </Popconfirm>
          )}
          {(r.status === 'pending' || r.status === 'rejected') && (
            <Popconfirm title="确认删除该登记？" okText="删除" cancelText="取消" onConfirm={() => handleDelete(r)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenRegister}>登记邀请函</Button>
          <Space>
            <Input
              placeholder="搜索编号/医院/科室/专家"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: '全部状态' },
                ...Object.entries(OUTGOING_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
          </Space>
        </div>

        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 1260 }}
          pagination={{ pageSize: 12, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* ===== 登记 / 编辑抽屉 ===== */}
      <Drawer
        title={registerType === 'create' ? '登记院外邀请函' : '编辑邀请函登记'}
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        width={920}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRegisterOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleRegisterSubmit}>提交</Button>
            </Space>
          </div>
        }
      >
        <Form form={registerForm} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 120px' }} wrapperCol={{ flex: '1 1 0', style: { minWidth: 0 } }}>
          <SectionTitle text="外院邀请信息" />
          {/* 第一行：院外单位、院外科室、收函日期 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="院外单位" name="inviteHospital" rules={[{ required: true, message: '请输入院外单位' }]}>
                <Input style={{ width: 130 }} placeholder="外院（邀请方）名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="院外科室" name="inviteDept" rules={[{ required: true, message: '请输入院外科室' }]}>
                <Input style={{ width: 130 }} placeholder="外院邀请科室" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="收函日期" name="applyDate">
                <DatePicker style={{ width: 130 }} format="YYYY-MM-DD" placeholder="选择收函日期" />
              </Form.Item>
            </Col>
          </Row>
          {/* 第二行：联系人、联系方式、会诊方式（默认现场会诊） */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="联系人" name="inviteContact" rules={[{ required: true, message: '请输入联系人' }]}>
                <Input style={{ width: 140 }} placeholder="外院联系人" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="联系方式" name="invitePhone" rules={[{ required: true, message: '请输入联系方式' }]}>
                <Input style={{ width: 140 }} placeholder="联系电话" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="会诊方式" name="inviteMethod" rules={[{ required: true, message: '请选择会诊方式' }]}>
                <Select
                  style={{ width: 140 }}
                  options={Object.entries(CONSULTATION_METHOD_MAP).map(([k, v]) => ({ value: k as ConsultationMethod, label: v.label }))}
                />
              </Form.Item>
            </Col>
          </Row>
          {/* 第三行：拟会诊日期（必填）、拟会诊科室（非必填）、拟会诊医师（非必填） */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="拟会诊日期" name="inviteExpectTime" rules={[{ required: true, message: '请选择拟会诊日期' }]}>
                <DatePicker style={{ width: 160 }} format="YYYY-MM-DD HH:mm" showTime={{ format: 'HH:mm' }} placeholder="选择拟会诊日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="拟会诊科室" name="requestedDept">
                <Select style={{ width: 140 }} showSearch allowClear options={DEPARTMENTS.map(d => ({ value: d, label: d }))} placeholder="我方拟会诊科室" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="拟会诊医师" name="requestedExpert">
                <Select style={{ width: 140 }} showSearch allowClear optionFilterProp="label" options={expertOptions} placeholder="我方拟会诊医师" />
              </Form.Item>
            </Col>
          </Row>
          {/* 第四行：拟会诊医师职称（非必填）、会诊目的（占两格，必填） */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="拟会诊医师职称" name="requestedTitle">
                <Select style={{ width: 140 }} showSearch allowClear options={TITLES.map(t => ({ value: t, label: t }))} placeholder="选择职称" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="会诊目的" name="purpose" rules={[{ required: true, message: '请填写会诊目的' }]}>
                <TextArea rows={2} placeholder="请明确本次会诊需要解决的核心问题" />
              </Form.Item>
            </Col>
          </Row>

          <SectionTitle text="病例信息" />
          {/* 姓名、性别、年龄 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="姓名" name="patientName" rules={[{ required: true, message: '请输入患者姓名' }]}>
                <Input style={{ width: 140 }} placeholder="患者姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="性别" name="patientGender" rules={[{ required: true, message: '请选择性别' }]}>
                <Select style={{ width: 140 }} options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="年龄" name="patientAge" rules={[{ required: true, message: '请输入年龄' }]}>
                <Input style={{ width: 140 }} type="number" placeholder="岁" />
              </Form.Item>
            </Col>
          </Row>
          {/* 诊断（单独一行） */}
          <Form.Item label="诊断" name="diagnosis" rules={[{ required: true, message: '请输入诊断' }]}>
            <Input placeholder="请输入临床诊断" />
          </Form.Item>
          {/* 病情摘要（单独一行） */}
          <Form.Item label="病情摘要" name="inviteReason" rules={[{ required: true, message: '请填写病情摘要' }]}>
            <TextArea rows={3} placeholder="请描述患者主诉、现病史、重要检查结果等" />
          </Form.Item>
          <Form.Item label="邀请函附件">
            <Upload maxCount={1} fileList={attachList} beforeUpload={() => false} onChange={({ fileList }) => setAttachList(fileList)}>
              <Button icon={<UploadOutlined />}>上传邀请函</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>

      {/* ===== 审批抽屉 ===== */}
      <Drawer
        title="审批外出会诊"
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        width={760}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setApproveOpen(false)}>取消</Button>
              <Button danger icon={<RollbackOutlined />} onClick={handleReject}>退回</Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={handleApprove}>审批通过</Button>
            </Space>
          </div>
        }
      >
        {approveRecord && (
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="登记编号">{approveRecord.id}</Descriptions.Item>
            <Descriptions.Item label="邀请医院">{approveRecord.inviteHospital}</Descriptions.Item>
            <Descriptions.Item label="邀请科室">{approveRecord.inviteDept}</Descriptions.Item>
            <Descriptions.Item label="邀请函编号">{approveRecord.inviteNo}</Descriptions.Item>
            <Descriptions.Item label="期望方式">
              {approveRecord.inviteMethod ? <Tag color={CONSULTATION_METHOD_MAP[approveRecord.inviteMethod].color}>{CONSULTATION_METHOD_MAP[approveRecord.inviteMethod].label}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="期望时间">{approveRecord.inviteExpectTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="拟派科室">{approveRecord.requestedDept || '-'}</Descriptions.Item>
            <Descriptions.Item label="拟派专家">{approveRecord.requestedExpert || '-'}</Descriptions.Item>
            <Descriptions.Item label="会诊目的" span={2}>{approveRecord.purpose || '-'}</Descriptions.Item>
            <Descriptions.Item label="病情摘要" span={2}>{approveRecord.inviteReason}</Descriptions.Item>
          </Descriptions>
        )}
        <SectionTitle text="审批意见" />
        <Form form={approveForm} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 96px' }} wrapperCol={{ flex: '1 1 auto' }}>
          <Form.Item label="审批人" name="approver" rules={[{ required: true, message: '请输入审批人' }]}>
            <Input placeholder="审批人" />
          </Form.Item>
          <Form.Item label="审批意见" name="approvalNote">
            <TextArea rows={3} placeholder="请填写审批意见（通过或退回原因）" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ===== 确认安排抽屉 ===== */}
      <Drawer
        title="确认外出会诊安排"
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        width={760}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setConfirmOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleConfirmSubmit}>确认提交</Button>
            </Space>
          </div>
        }
      >
        <Form form={confirmForm} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 96px' }} wrapperCol={{ flex: '1 1 auto' }}>
          <SectionTitle text="确认会诊安排" />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="会诊方式" name="confirmMethod" rules={[{ required: true, message: '请选择会诊方式' }]}>
                <Select
                  options={Object.entries(CONSULTATION_METHOD_MAP).map(([k, v]) => ({ value: k as ConsultationMethod, label: v.label }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="会诊时间" name="confirmTime" rules={[{ required: true, message: '请选择会诊时间' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" showTime={{ format: 'HH:mm:ss' }} placeholder="选择年月日时分秒" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="派出科室" name="dispatchDept" rules={[{ required: true, message: '请选择派出科室' }]}>
                <Select showSearch options={DEPARTMENTS.map(d => ({ value: d, label: d }))} placeholder="派出科室" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="派出专家" name="dispatchExperts" rules={[{ required: true, message: '请选择派出专家' }]}>
                <Select mode="multiple" showSearch optionFilterProp="label" options={expertOptions} placeholder="派出专家（可多选）" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="会诊地点" name="confirmLocation" rules={[{ required: true, message: '请输入会诊地点' }]}>
            <Input placeholder="如：我院远程会诊室 / 外院XX科室" />
          </Form.Item>
          <Form.Item label="备注" name="confirmNote">
            <TextArea rows={3} placeholder="其他安排说明（交通、设备联调等）" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ===== 查看（只读详情） ===== */}
      <Drawer
        title="外出会诊详情"
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        width={760}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setViewRecord(null)}>关闭</Button>
          </div>
        }
      >
        {viewRecord && (
          <>
            {/* 外院邀请信息：与登记/编辑抽屉字段顺序一致 */}
            <SectionTitle text="外院邀请信息" />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="登记编号">{viewRecord.id}</Descriptions.Item>
              <Descriptions.Item label="登记时间">{viewRecord.registerTime}</Descriptions.Item>
              <Descriptions.Item label="院外单位">{viewRecord.inviteHospital}</Descriptions.Item>
              <Descriptions.Item label="院外科室">{viewRecord.inviteDept}</Descriptions.Item>
              <Descriptions.Item label="联系人">{viewRecord.inviteContact}</Descriptions.Item>
              <Descriptions.Item label="联系方式">{viewRecord.invitePhone}</Descriptions.Item>
              <Descriptions.Item label="会诊方式">
                {viewRecord.inviteMethod ? <Tag color={CONSULTATION_METHOD_MAP[viewRecord.inviteMethod].color}>{CONSULTATION_METHOD_MAP[viewRecord.inviteMethod].label}</Tag> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="拟会诊日期">{viewRecord.inviteExpectTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="拟会诊科室">{viewRecord.requestedDept || '-'}</Descriptions.Item>
              <Descriptions.Item label="拟会诊医师">{viewRecord.requestedExpert || '-'}</Descriptions.Item>
              <Descriptions.Item label="拟会诊医师职称">{viewRecord.requestedTitle || '-'}</Descriptions.Item>
              <Descriptions.Item label="邀请函附件">{viewRecord.attachmentName || '-'}</Descriptions.Item>
              <Descriptions.Item label="会诊目的" span={2}>{viewRecord.purpose || '-'}</Descriptions.Item>
            </Descriptions>

            {/* 病例信息：与登记/编辑抽屉病例信息区一致 */}
            <SectionTitle text="病例信息" />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="姓名">{viewRecord.patientName || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别 / 年龄">
                {viewRecord.patientGender || '-'}{viewRecord.patientAge ? ` / ${viewRecord.patientAge}岁` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="诊断" span={2}>{viewRecord.diagnosis || '-'}</Descriptions.Item>
              <Descriptions.Item label="病情摘要" span={2}>{viewRecord.inviteReason}</Descriptions.Item>
            </Descriptions>

            {/* 审批记录：已审批/已退回/已取消等含审批信息的记录展示 */}
            {viewRecord.status !== 'pending' && (viewRecord.approver || viewRecord.approvalNote) && (
              <>
                <SectionTitle text="审批记录" />
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="审批状态">{approvalTag(viewRecord)}</Descriptions.Item>
                  <Descriptions.Item label="审批人">{viewRecord.approver || '-'}</Descriptions.Item>
                  <Descriptions.Item label="审批时间">{viewRecord.approvalTime || '-'}</Descriptions.Item>
                  <Descriptions.Item label="审批意见" span={2}>{viewRecord.approvalNote || '-'}</Descriptions.Item>
                </Descriptions>
              </>
            )}

            {/* 确认安排：已确认记录展示 */}
            {viewRecord.status === 'confirmed' && (
              <>
                <SectionTitle text="确认安排" />
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="会诊方式">
                    {viewRecord.confirmMethod ? <Tag color={CONSULTATION_METHOD_MAP[viewRecord.confirmMethod].color}>{CONSULTATION_METHOD_MAP[viewRecord.confirmMethod].label}</Tag> : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="会诊时间">{viewRecord.confirmTime || '-'}</Descriptions.Item>
                  <Descriptions.Item label="派出科室">{viewRecord.dispatchDept || '-'}</Descriptions.Item>
                  <Descriptions.Item label="派出专家">{viewRecord.dispatchExperts?.length ? viewRecord.dispatchExperts.join('、') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="会诊地点" span={2}>{viewRecord.confirmLocation || '-'}</Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>{viewRecord.confirmNote || '-'}</Descriptions.Item>
                  <Descriptions.Item label="确认完成时间" span={2}>{viewRecord.confirmDoneTime || '-'}</Descriptions.Item>
                </Descriptions>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}

export default ConsultationOutgoing
