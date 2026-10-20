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
  DatePicker,
  message,
  Popconfirm,
  Descriptions,
  Typography,
  Divider,
  Timeline,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  LoginOutlined,
  LogoutOutlined,
  TeamOutlined,
  EditOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Text } = Typography

// ==================== 类型定义 ====================

interface CheckInOutRecord {
  id: string
  staffName: string
  employeeNo: string
  institution: string
  deptName: string
  // 科室分配方式：auto 自动分配（按轮转计划直接落标准科室）/ manual 手工分配（待分配）/ self 员工自行选择（待选择）
  assignMode: 'auto' | 'manual' | 'self'
  // 实际分配科室（手工分配时选定）
  actualDept?: string
  deptAssignDate?: string
  deptOperator?: string
  order: number
  planCheckIn: string
  actualCheckIn: string
  planCheckOut: string
  actualCheckOut: string
  teacherName: string
  teacherTitle?: string
  teacherAssignDate?: string
  teacherOperator?: string
  status: '待入科' | '在科' | '已出科'
  checkInOperator: string
  checkOutOperator: string
  summary: string
}

// ==================== 模拟数据 ====================

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
  { label: '心电图室', value: '心电图室' },
]

// 手工分配时可选的细分科室
const MANUAL_DEPT_OPTIONS = [
  { label: '心血管内科', value: '心血管内科' },
  { label: '呼吸内科', value: '呼吸内科' },
  { label: '消化内科', value: '消化内科' },
  { label: '神经内科', value: '神经内科' },
  { label: '内分泌科', value: '内分泌科' },
  { label: '普外科', value: '普外科' },
  { label: '骨科', value: '骨科' },
  { label: '泌尿外科', value: '泌尿外科' },
  { label: '神经外科', value: '神经外科' },
  { label: '重症医学科', value: '重症医学科' },
]

const TEACHER_OPTIONS: TeacherOption[] = [
  { id: 'tc1', name: '王建国', department: '内科', title: '主任医师' },
  { id: 'tc2', name: '李国华', department: '外科', title: '主任医师' },
  { id: 'tc3', name: '赵明德', department: '急诊科', title: '主任医师' },
  { id: 'tc4', name: '陈志远', department: '麻醉科', title: '主任医师' },
  { id: 'tc5', name: '刘德芳', department: '儿科', title: '主任医师' },
  { id: 'tc6', name: '孙秀英', department: '妇产科', title: '主任医师' },
  { id: 'tc7', name: '周健康', department: 'ICU', title: '副主任医师' },
  { id: 'tc8', name: '吴明辉', department: '检验科', title: '副主任医师' },
  { id: 'tc9', name: '郑国强', department: '影像科', title: '副主任医师' },
  { id: 'tc10', name: '黄丽娟', department: '心电图室', title: '主治医师' },
]

interface TeacherOption {
  id: string
  name: string
  department: string
  title: string
}

const mockData: CheckInOutRecord[] = [
  { id: '1', staffName: '张明', employeeNo: 'EMP001', institution: '市中心医院', deptName: 'ICU', assignMode: 'manual', actualDept: '重症医学科', deptAssignDate: '2026-05-28', deptOperator: '管理员', order: 3, planCheckIn: '2026-06-01', actualCheckIn: '2026-06-01', planCheckOut: '2026-07-31', actualCheckOut: '', teacherName: '周健康', teacherTitle: '副主任医师', teacherAssignDate: '2026-05-28', teacherOperator: '管理员', status: '在科', checkInOperator: '周健康', checkOutOperator: '', summary: '' },
  { id: '2', staffName: '张明', employeeNo: 'EMP001', institution: '市中心医院', deptName: '内科', assignMode: 'auto', order: 1, planCheckIn: '2026-01-01', actualCheckIn: '2026-01-01', planCheckOut: '2026-03-31', actualCheckOut: '2026-03-30', teacherName: '王建国', teacherTitle: '主任医师', teacherAssignDate: '2025-12-20', teacherOperator: '管理员', status: '已出科', checkInOperator: '王建国', checkOutOperator: '王建国', summary: '该同志在内科轮转期间表现优秀，掌握了心血管、呼吸、消化系统常见病的诊断与治疗，理论考核85分，技能操作合格。' },
  { id: '3', staffName: '张明', employeeNo: 'EMP001', institution: '市中心医院', deptName: '急诊科', assignMode: 'auto', order: 2, planCheckIn: '2026-04-01', actualCheckIn: '2026-04-01', planCheckOut: '2026-05-31', actualCheckOut: '2026-05-31', teacherName: '赵明德', teacherTitle: '主任医师', teacherAssignDate: '2026-03-25', teacherOperator: '管理员', status: '已出科', checkInOperator: '赵明德', checkOutOperator: '赵明德', summary: '急诊科轮转期间学习态度积极，掌握了急危重症识别与处理，心肺复苏技术熟练。' },
  { id: '4', staffName: '李华', employeeNo: 'EMP002', institution: '市中心医院', deptName: '内科', assignMode: 'manual', actualDept: '呼吸内科', deptAssignDate: '2026-05-28', deptOperator: '管理员', order: 1, planCheckIn: '2026-03-01', actualCheckIn: '2026-03-01', planCheckOut: '2026-06-30', actualCheckOut: '2026-06-30', teacherName: '王建国', teacherTitle: '主任医师', teacherAssignDate: '2026-02-25', teacherOperator: '管理员', status: '已出科', checkInOperator: '王建国', checkOutOperator: '王建国', summary: '内科轮转期间表现良好，理论考核82分，技能操作合格，建议加强病历书写规范。' },
  { id: '5', staffName: '李华', employeeNo: 'EMP002', institution: '市中心医院', deptName: '儿科', assignMode: 'auto', order: 2, planCheckIn: '2026-07-01', actualCheckIn: '2026-07-01', planCheckOut: '2026-08-31', actualCheckOut: '', teacherName: '刘德芳', teacherTitle: '主任医师', teacherAssignDate: '2026-06-25', teacherOperator: '管理员', status: '在科', checkInOperator: '刘德芳', checkOutOperator: '', summary: '' },
  { id: '6', staffName: '王芳', employeeNo: 'EMP003', institution: '人民医院', deptName: '内科', assignMode: 'manual', order: 1, planCheckIn: '2026-09-01', actualCheckIn: '', planCheckOut: '2026-11-30', actualCheckOut: '', teacherName: '', teacherTitle: '', teacherAssignDate: '', teacherOperator: '', status: '待入科', checkInOperator: '', checkOutOperator: '', summary: '' },
  { id: '7', staffName: '孙莉', employeeNo: 'EMP007', institution: '市中心医院', deptName: 'ICU', assignMode: 'auto', order: 2, planCheckIn: '2026-07-01', actualCheckIn: '2026-07-01', planCheckOut: '2026-08-31', actualCheckOut: '', teacherName: '周健康', teacherTitle: '副主任医师', teacherAssignDate: '2026-06-28', teacherOperator: '管理员', status: '在科', checkInOperator: '周健康', checkOutOperator: '', summary: '' },
  { id: '8', staffName: '孙莉', employeeNo: 'EMP007', institution: '市中心医院', deptName: '外科', assignMode: 'manual', actualDept: '普外科', deptAssignDate: '2026-05-28', deptOperator: '管理员', order: 1, planCheckIn: '2026-05-01', actualCheckIn: '2026-05-01', planCheckOut: '2026-06-30', actualCheckOut: '2026-06-30', teacherName: '李国华', teacherTitle: '主任医师', teacherAssignDate: '2026-04-25', teacherOperator: '管理员', status: '已出科', checkInOperator: '李国华', checkOutOperator: '李国华', summary: '外科轮转期间表现优秀，掌握外科基本操作及围手术期管理，技能操作考核优秀。' },
  { id: '9', staffName: '赵伟', employeeNo: 'EMP006', institution: '市中心医院', deptName: '内科', assignMode: 'auto', order: 1, planCheckIn: '2026-04-01', actualCheckIn: '2026-04-01', planCheckOut: '2026-06-30', actualCheckOut: '', teacherName: '王建国', teacherTitle: '主任医师', teacherAssignDate: '2026-03-25', teacherOperator: '管理员', status: '在科', checkInOperator: '王建国', checkOutOperator: '', summary: '' },
  { id: '10', staffName: '陈晓', employeeNo: 'EMP010', institution: '市中心医院', deptName: '内科', assignMode: 'self', order: 1, planCheckIn: '2026-09-15', actualCheckIn: '', planCheckOut: '2026-12-14', actualCheckOut: '', teacherName: '', teacherTitle: '', teacherAssignDate: '', teacherOperator: '', status: '待入科', checkInOperator: '', checkOutOperator: '', summary: '' },
]

const statusConfig: Record<string, { color: string }> = {
  '待入科': { color: 'default' },
  '在科': { color: 'processing' },
  '已出科': { color: 'success' },
}

// 分配方式标签
const assignModeTag = (mode: CheckInOutRecord['assignMode']) =>
  mode === 'manual'
    ? <Tag color="orange">手工分配</Tag>
    : mode === 'self'
      ? <Tag color="purple">员工自行选择</Tag>
      : <Tag color="blue">自动分配</Tag>

// 日期统一显示为 年月日 时分秒
function fmtDateTime(v: string): React.ReactNode {
  return v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : <span style={{ color: '#ccc' }}>-</span>
}

const RotationCheckInOut: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'checkout' | 'view'>('view')
  const [editingRecord, setEditingRecord] = useState<CheckInOutRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [deptFilter, setDeptFilter] = useState<string | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [data, setData] = useState<CheckInOutRecord[]>(mockData)
  const [form] = Form.useForm()
  const [teacherDrawerOpen, setTeacherDrawerOpen] = useState(false)
  const [teacherDrawerMode, setTeacherDrawerMode] = useState<'assign' | 'change'>('assign')
  const [teacherEditingRecord, setTeacherEditingRecord] = useState<CheckInOutRecord | null>(null)
  const [teacherForm] = Form.useForm()

  // 入科确认抽屉：直接提交完成入科
  const [checkInDrawerOpen, setCheckInDrawerOpen] = useState(false)
  const [checkInRecord, setCheckInRecord] = useState<CheckInOutRecord | null>(null)
  const [checkInForm] = Form.useForm()

  // 二次分配抽屉：入科后为手工分配的轮科手动选择科室
  const [deptDrawerOpen, setDeptDrawerOpen] = useState(false)
  const [deptRecord, setDeptRecord] = useState<CheckInOutRecord | null>(null)
  const [deptForm] = Form.useForm()

  const filteredData = useMemo(() => {
    let result = data
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase()
      result = result.filter((r) => r.staffName.toLowerCase().includes(kw) || r.employeeNo.toLowerCase().includes(kw))
    }
    if (deptFilter) result = result.filter((r) => r.deptName === deptFilter)
    if (statusFilter) result = result.filter((r) => r.status === statusFilter)
    return result.sort((a, b) => {
      if (a.staffName !== b.staffName) return a.staffName.localeCompare(b.staffName)
      return a.order - b.order
    })
  }, [data, searchText, deptFilter, statusFilter])

  // 手工分配 / 员工自行选择且尚未分配科室的记录，需先完成科室分配
  const needDeptAssign = (r: CheckInOutRecord) => r.assignMode !== 'auto' && !r.actualDept

  // 带教老师候选项：优先同科室，无匹配时回退全部
  const teacherOptionsOf = (record: CheckInOutRecord) => {
    const byDept = TEACHER_OPTIONS.filter((t) => t.department === record.deptName)
    const list = byDept.length > 0 ? byDept : TEACHER_OPTIONS
    return list.map((t) => ({ label: `${t.name}（${t.department} · ${t.title}）`, value: t.id }))
  }

  // 点击「入科」→ 打开入科确认抽屉（直接提交）
  const handleCheckIn = (record: CheckInOutRecord) => {
    setCheckInRecord(record)
    checkInForm.resetFields()
    checkInForm.setFieldsValue({ actualCheckIn: dayjs() })
    setCheckInDrawerOpen(true)
  }

  const handleCheckInSubmit = () => {
    checkInForm.validateFields().then((values) => {
      const checkInDate = (values.actualCheckIn as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss')
      const teacher = TEACHER_OPTIONS.find((t) => t.id === values.teacherId)
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      setData(
        data.map((r) =>
          r.id === checkInRecord?.id
            ? {
                ...r,
                actualCheckIn: checkInDate,
                status: '在科',
                checkInOperator: '管理员',
                teacherName: teacher?.name ?? r.teacherName,
                teacherTitle: teacher?.title ?? r.teacherTitle,
                teacherAssignDate: teacher ? now : r.teacherAssignDate,
                teacherOperator: teacher ? '管理员' : r.teacherOperator,
              }
            : r,
        ),
      )
      message.success('入科确认成功')
      setCheckInDrawerOpen(false)
    })
  }

  // 入科后为手工分配的轮科「二次分配」科室
  const handleAssignDept = (record: CheckInOutRecord) => {
    setDeptRecord(record)
    deptForm.resetFields()
    deptForm.setFieldsValue({ actualDept: record.actualDept })
    setDeptDrawerOpen(true)
  }

  const handleDeptSubmit = () => {
    deptForm.validateFields().then((values) => {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      setData(
        data.map((r) =>
          r.id === deptRecord?.id
            ? {
                ...r,
                actualDept: values.actualDept,
                deptAssignDate: now,
                deptOperator: '管理员',
              }
            : r,
        ),
      )
      message.success('科室分配成功')
      setDeptDrawerOpen(false)
    })
  }

  const handleCheckOut = (record: CheckInOutRecord) => {
    setDrawerMode('checkout')
    setEditingRecord(record)
    form.resetFields()
    form.setFieldsValue({ actualCheckOut: dayjs() })
    setDrawerOpen(true)
  }

  const handleView = (record: CheckInOutRecord) => {
    setDrawerMode('view')
    setEditingRecord(record)
    setDrawerOpen(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const checkOutDate = (values.actualCheckOut as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss')
      setData(data.map((r) => (r.id === editingRecord?.id ? { ...r, actualCheckOut: checkOutDate, status: '已出科', checkOutOperator: '管理员', summary: values.summary || '' } : r)))
      message.success('出科确认成功')
      setDrawerOpen(false)
    })
  }

  const handleAssignTeacher = (record: CheckInOutRecord) => {
    setTeacherDrawerMode('assign')
    setTeacherEditingRecord(record)
    teacherForm.resetFields()
    teacherForm.setFieldsValue({ remark: '' })
    setTeacherDrawerOpen(true)
  }

  const handleChangeTeacher = (record: CheckInOutRecord) => {
    setTeacherDrawerMode('change')
    setTeacherEditingRecord(record)
    const current = TEACHER_OPTIONS.find((t) => t.name === record.teacherName)
    teacherForm.resetFields()
    teacherForm.setFieldsValue({ teacherId: current?.id, remark: '' })
    setTeacherDrawerOpen(true)
  }

  const handleTeacherSubmit = () => {
    teacherForm.validateFields().then((values) => {
      const teacher = TEACHER_OPTIONS.find((t) => t.id === values.teacherId)
      if (!teacher) return
      const today = dayjs().format('YYYY-MM-DD HH:mm:ss')
      setData(data.map((r) => (r.id === teacherEditingRecord?.id ? {
        ...r,
        teacherName: teacher.name,
        teacherTitle: teacher.title,
        teacherAssignDate: today,
        teacherOperator: '管理员',
      } : r)))
      message.success(teacherDrawerMode === 'assign' ? '带教分配成功' : '带教变更成功')
      setTeacherDrawerOpen(false)
    })
  }

  const columns: ColumnsType<CheckInOutRecord> = [
    { title: '序号', width: 50, fixed: 'left' as const, render: (_, __, i) => i + 1 },
    { title: '姓名', dataIndex: 'staffName', width: 70, fixed: 'left' as const },
    { title: '工号', dataIndex: 'employeeNo', width: 85, fixed: 'left' as const },
    { title: '机构名称', dataIndex: 'institution', width: 120 },
    { title: '标准名称', dataIndex: 'deptName', width: 90 },
    {
      title: '轮转科室', dataIndex: 'actualDept', width: 110,
      render: (_, r) => {
        if (r.actualDept) return <span style={{ fontWeight: 500 }}>{r.actualDept}</span>
        if (r.assignMode === 'manual') return <span style={{ color: '#fa8c16' }}>待分配</span>
        if (r.assignMode === 'self') return <span style={{ color: '#722ed1' }}>待选择</span>
        // 自动分配：直接落标准科室
        return <span style={{ fontWeight: 500 }}>{r.deptName}</span>
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (s: string) => <span>{s}</span>,
    },
    {
      title: '顺序', dataIndex: 'order', width: 70, align: 'center' as const,
      render: (v: number) => (
        <span style={{ display: 'inline-block', minWidth: 44, padding: '1px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13, color: '#555', background: '#fafafa' }}>
          第{v}站
        </span>
      ),
    },
    { title: '拟入科', dataIndex: 'planCheckIn', width: 160, render: (v: string) => fmtDateTime(v) },
    { title: '实际入科', dataIndex: 'actualCheckIn', width: 160, render: (v: string) => fmtDateTime(v) },
    { title: '拟出科', dataIndex: 'planCheckOut', width: 160, render: (v: string) => fmtDateTime(v) },
    { title: '实际出科', dataIndex: 'actualCheckOut', width: 160, render: (v: string) => fmtDateTime(v) },
    {
      title: '带教老师', dataIndex: 'teacherName', width: 130,
      render: (v: string, r) => v ? (
        <Space size={4}>
          <span style={{ fontWeight: 500 }}>{v}</span>
          {r.teacherTitle && <span style={{ color: '#999', fontSize: 12 }}>({r.teacherTitle})</span>}
        </Space>
      ) : <span style={{ color: '#ccc' }}>-</span>,
    },
    {
      title: '操作', width: 280, fixed: 'right' as const,
      render: (_, record) => {
        // 手工分配且尚未分配科室：入科后需「二次分配」
        const needDept = record.status === '在科' && needDeptAssign(record)
        // 科室已确定（自动分配直接落科，手工分配已二次分配）：可分配/变更带教
        const deptReady = record.status === '在科' && (record.assignMode === 'auto' || !!record.actualDept)
        return (
          <Space size={0}>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
            {record.status === '待入科' && (
              <Button type="link" size="small" icon={<LoginOutlined />} onClick={() => handleCheckIn(record)}>入科</Button>
            )}
            {record.status === '在科' && (
              <Button type="link" size="small" icon={<LogoutOutlined />} onClick={() => handleCheckOut(record)}>出科</Button>
            )}
            {/* 入科后：手工分配的轮科先二次分配科室 */}
            {needDept && (
              <Button type="link" size="small" icon={<ApartmentOutlined />} onClick={() => handleAssignDept(record)}>二次分配</Button>
            )}
            {/* 分配科室后：分配带教 / 已分配则变更带教 */}
            {deptReady && (
              record.teacherName
                ? <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleChangeTeacher(record)}>变更带教</Button>
                : <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => handleAssignTeacher(record)}>分配带教</Button>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 16, background: '#1890ff', borderRadius: 2 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>出入科管理</span>
          </div>
        </Col>
        <Col>
          <Space>
            <Input placeholder="搜索姓名/工号" prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear style={{ width: 200 }} />
            <Select placeholder="科室筛选" allowClear value={deptFilter} onChange={setDeptFilter} style={{ width: 120 }} options={DEPT_OPTIONS} />
            <Select placeholder="状态筛选" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} options={[{ label: '待入科', value: '待入科' }, { label: '在科', value: '在科' }, { label: '已出科', value: '已出科' }]} />
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        size="small"
        scroll={{ x: 1750 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      {/* 抽屉 */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>{drawerMode === 'checkout' ? '出科申请' : '查看出入科记录'}</span>}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={drawerMode === 'view' ? 640 : 560}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {editingRecord && (
          <>
            {/* 人员信息 */}
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>人员信息</div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="姓名">{editingRecord.staffName}</Descriptions.Item>
              <Descriptions.Item label="工号">{editingRecord.employeeNo}</Descriptions.Item>
              <Descriptions.Item label="机构名称">{editingRecord.institution}</Descriptions.Item>
              <Descriptions.Item label="标准名称">{editingRecord.deptName}</Descriptions.Item>
              <Descriptions.Item label="轮转科室">
                {editingRecord.actualDept || (editingRecord.assignMode === 'manual'
                  ? <span style={{ color: '#fa8c16' }}>待分配</span>
                  : editingRecord.assignMode === 'self'
                    ? <span style={{ color: '#722ed1' }}>待选择</span>
                    : editingRecord.deptName)}
              </Descriptions.Item>
              <Descriptions.Item label="轮转顺序">第{editingRecord.order}站</Descriptions.Item>
              <Descriptions.Item label="带教老师">{editingRecord.teacherName || '--'}</Descriptions.Item>
              <Descriptions.Item label="当前状态"><Tag color={statusConfig[editingRecord.status].color}>{editingRecord.status}</Tag></Descriptions.Item>
            </Descriptions>

            {drawerMode === 'view' ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>入科/出科记录</div>
                <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
                  <Descriptions.Item label="拟入科日期">{fmtDateTime(editingRecord.planCheckIn)}</Descriptions.Item>
                  <Descriptions.Item label="实际入科日期">{fmtDateTime(editingRecord.actualCheckIn)}</Descriptions.Item>
                  <Descriptions.Item label="拟出科日期">{fmtDateTime(editingRecord.planCheckOut)}</Descriptions.Item>
                  <Descriptions.Item label="实际出科日期">{fmtDateTime(editingRecord.actualCheckOut)}</Descriptions.Item>
                  <Descriptions.Item label="入科操作人">{editingRecord.checkInOperator || '--'}</Descriptions.Item>
                  <Descriptions.Item label="出科操作人">{editingRecord.checkOutOperator || '--'}</Descriptions.Item>
                </Descriptions>

                {editingRecord.summary && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>出科小结</div>
                    <div style={{ background: '#fafafa', borderRadius: 8, padding: '16px 20px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: '#333' }}>
                      {editingRecord.summary}
                    </div>
                  </>
                )}

                {/* 时间线 */}
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '20px 0 12px', paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>操作记录</div>
                <Timeline
                  items={[
                    editingRecord.actualCheckIn ? { color: 'green', children: <div><div style={{ fontWeight: 500 }}>入科确认</div><div style={{ fontSize: 12, color: '#999' }}>{editingRecord.actualCheckIn} · 操作人：{editingRecord.checkInOperator}</div></div> } : { color: 'gray', children: <div style={{ color: '#999' }}>待入科</div> },
                    editingRecord.actualCheckOut ? { color: 'green', children: <div><div style={{ fontWeight: 500 }}>出科确认</div><div style={{ fontSize: 12, color: '#999' }}>{editingRecord.actualCheckOut} · 操作人：{editingRecord.checkOutOperator}</div></div> } : { color: 'gray', children: <div style={{ color: '#999' }}>待出科</div> },
                  ]}
                />
              </>
            ) : (
              <Form form={form} layout="horizontal" size="small" labelAlign="left" labelCol={{ flex: '0 0 100px' }} wrapperCol={{ flex: '1' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
                  出科申请
                </div>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="actualCheckOut" label="出科日期" rules={[{ required: true, message: '请选择' }]}>
                      <DatePicker showTime={{ format: 'HH:mm:ss' }} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="summary" label="出科小结" rules={[{ required: true, message: '请填写出科小结' }]}>
                      <Input.TextArea rows={5} placeholder="请填写出科小结，包括学习表现、考核成绩、综合评价等" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            )}
          </>
        )}

        {drawerMode !== 'view' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>提交</Button>
          </div>
        )}
      </Drawer>

      {/* 入科确认抽屉：直接提交 */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>入科确认</span>}
        open={checkInDrawerOpen}
        onClose={() => setCheckInDrawerOpen(false)}
        width={560}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {checkInRecord && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="姓名">{checkInRecord.staffName}</Descriptions.Item>
              <Descriptions.Item label="工号">{checkInRecord.employeeNo}</Descriptions.Item>
              <Descriptions.Item label="机构名称">{checkInRecord.institution}</Descriptions.Item>
              <Descriptions.Item label="标准名称">{checkInRecord.deptName}</Descriptions.Item>
              <Descriptions.Item label="拟入科日期">{fmtDateTime(checkInRecord.planCheckIn)}</Descriptions.Item>
              <Descriptions.Item label="分配方式">{assignModeTag(checkInRecord.assignMode)}</Descriptions.Item>
            </Descriptions>

            <Form form={checkInForm} layout="horizontal" size="small" labelAlign="left" labelCol={{ flex: '0 0 100px' }} wrapperCol={{ flex: '1' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>入科信息</div>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="actualCheckIn" label="入科日期" rules={[{ required: true, message: '请选择' }]}>
                    <DatePicker showTime={{ format: 'HH:mm:ss' }} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="teacherId" label="带教老师">
                    <Select
                      placeholder="请选择带教老师（可稍后分配）"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={teacherOptionsOf(checkInRecord)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setCheckInDrawerOpen(false)}>取消</Button>
          <Button type="primary" onClick={handleCheckInSubmit}>提交</Button>
        </div>
      </Drawer>

      {/* 二次分配抽屉：入科后为手工分配的轮科手动选择科室 */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>二次分配</span>}
        open={deptDrawerOpen}
        onClose={() => setDeptDrawerOpen(false)}
        width={560}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {deptRecord && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="姓名">{deptRecord.staffName}</Descriptions.Item>
              <Descriptions.Item label="工号">{deptRecord.employeeNo}</Descriptions.Item>
              <Descriptions.Item label="标准名称">{deptRecord.deptName}</Descriptions.Item>
              <Descriptions.Item label="分配方式">{assignModeTag(deptRecord.assignMode)}</Descriptions.Item>
            </Descriptions>

            <Form form={deptForm} layout="horizontal" size="small" labelAlign="left" labelCol={{ flex: '0 0 100px' }} wrapperCol={{ flex: '1' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>分配科室</div>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="actualDept" label="分配科室" rules={[{ required: true, message: '请选择分配科室' }]}>
                    <Select placeholder="请选择具体科室" showSearch optionFilterProp="label" options={MANUAL_DEPT_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff7e6', borderRadius: 6, fontSize: 12, color: '#d46b08' }}>
                该轮科需人工确定科室，请为其指定具体科室，分配后可再分配带教老师。
              </div>
            </Form>
          </>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setDeptDrawerOpen(false)}>取消</Button>
          <Button type="primary" onClick={handleDeptSubmit}>确认分配</Button>
        </div>
      </Drawer>

      {/* 分配/变更带教抽屉 */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>{teacherDrawerMode === 'assign' ? '分配带教老师' : '变更带教老师'}</span>}
        open={teacherDrawerOpen}
        onClose={() => setTeacherDrawerOpen(false)}
        width={560}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {teacherEditingRecord && (
          <>
            {/* 人员信息（只读） */}
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>人员信息</div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="姓名">{teacherEditingRecord.staffName}</Descriptions.Item>
              <Descriptions.Item label="工号">{teacherEditingRecord.employeeNo}</Descriptions.Item>
              <Descriptions.Item label="机构名称">{teacherEditingRecord.institution}</Descriptions.Item>
              <Descriptions.Item label="标准名称">{teacherEditingRecord.deptName}</Descriptions.Item>
              <Descriptions.Item label="轮转科室">
                {teacherEditingRecord.actualDept || (teacherEditingRecord.assignMode === 'manual'
                  ? <span style={{ color: '#fa8c16' }}>待分配</span>
                  : teacherEditingRecord.assignMode === 'self'
                    ? <span style={{ color: '#722ed1' }}>待选择</span>
                    : teacherEditingRecord.deptName)}
              </Descriptions.Item>
              <Descriptions.Item label="当前带教">
                {teacherEditingRecord.teacherName ? `${teacherEditingRecord.teacherName}${teacherEditingRecord.teacherTitle ? `（${teacherEditingRecord.teacherTitle}）` : ''}` : <span style={{ color: '#999' }}>未分配</span>}
              </Descriptions.Item>
              <Descriptions.Item label="轮转状态"><Tag color={statusConfig[teacherEditingRecord.status].color}>{teacherEditingRecord.status}</Tag></Descriptions.Item>
            </Descriptions>

            <Form form={teacherForm} layout="horizontal" size="small" labelAlign="left" labelCol={{ flex: '0 0 100px' }} wrapperCol={{ flex: '1' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
                {teacherDrawerMode === 'assign' ? '分配带教' : '变更带教'}
              </div>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="teacherId" label="带教老师" rules={[{ required: true, message: '请选择' }]}>
                    <Select
                      placeholder="请选择带教老师"
                      showSearch
                      optionFilterProp="label"
                      options={teacherOptionsOf(teacherEditingRecord)}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#e6f7ff', borderRadius: 6, fontSize: 12, color: '#1890ff' }}>
                系统将自动记录操作人及当前时间，带教分配不限时间，可随时进行。
              </div>
            </Form>
          </>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setTeacherDrawerOpen(false)}>取消</Button>
          <Button type="primary" onClick={handleTeacherSubmit}>{teacherDrawerMode === 'assign' ? '确认分配' : '确认变更'}</Button>
        </div>
      </Drawer>
    </Card>
  )
}

export default RotationCheckInOut
