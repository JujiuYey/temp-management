import React, { useEffect, useState } from 'react'
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { getPlanTagNames } from './planTagStore'

// ===== 考试计划数据模型 =====
/** 计划内的考试节点 */
export interface PlanExamItem {
  id: string
  examId?: string          // 选择的考试
  examName?: string        // 考试名称
  finishMonth: number | null // 完成时间（第几个月）
  credit: number | null      // 学分
  studyHours: number | null  // 学时
  passCount?: number | null   // 合格次数（该科目要求的合格次数）
}

/** 计划学员 */
export interface PlanStudent {
  id: string
  name: string             // 学员姓名
  no: string               // 工号
  joinTime: string         // 加入时间 YYYY-MM-DD（自动生成）
  startDate: string        // 开始日期 YYYY-MM-DD（默认今天，可修改）
  completedExams?: number  // 已完成的考试项数（完成情况分子）；完成状态据此自动标识
  passedExams?: number     // 已合格的考试项数（合格情况分子；默认 0）
  examCount?: number       // 考试次数（参加考试的项数；缺省取 completedExams）
}

/** 学员完成状态：由「完成情况」（已完成项数 / 计划考试项数）自动推导 */
type StudentStatus = '未开始' | '进行中' | '已完成'
const studentStatus = (s: PlanStudent, total: number): StudentStatus => {
  const done = s.completedExams ?? 0
  if (total === 0) return done > 0 ? '已完成' : '未开始'
  if (done >= total) return '已完成'
  if (done === 0) return '未开始'
  return '进行中'
}
const STUDENT_STATUS_COLOR: Record<StudentStatus, string> = {
  未开始: 'default',
  进行中: 'processing',
  已完成: 'success',
}

export interface ExamPlanRecord {
  id: string
  name: string             // 计划名称
  cycle: number | null     // 计划周期（月）
  enabled: boolean         // 是否启用
  remark?: string          // 计划说明
  items: PlanExamItem[]    // 计划考试明细
  students: PlanStudent[]  // 计划学员
}

/** 开始日期格式（纯日期） */
const DATE_FORMAT = 'YYYY-MM-DD'

/**
 * 考试科目下拉选项：取自「基础设置 - 考试科目」（planTagStore，localStorage 持久化）。
 * 打开抽屉时重新读取，保证与考试科目管理页保持一致。
 */
const buildSubjectOptions = (): { value: string; label: string }[] =>
  getPlanTagNames().map((name) => ({ value: name, label: name }))

// 演示数据
const SEED_PLANS: ExamPlanRecord[] = [
  {
    id: 'p1',
    name: '2026年度护理人员继续教育计划',
    cycle: 12,
    enabled: true,
    remark: '护理岗位继续教育：必修不良事件管理，选修课程需累计完成 20 分钟学习时长（1200 秒）。',
    items: [
      { id: 'p1-1', examId: '三基三严', examName: '三基三严', finishMonth: 3, credit: 0.5, studyHours: 2 },
      { id: 'p1-2', examId: '继续教育', examName: '继续教育', finishMonth: 6, credit: 1, studyHours: 2 },
      { id: 'p1-3', examId: '专科培训', examName: '专科培训', finishMonth: 9, credit: 0.5, studyHours: 1 },
    ],
    students: [
      { id: 'p1-s1', name: '王芳', no: 'G3001', joinTime: '2026-02-01', startDate: '2026-02-01', completedExams: 3, passedExams: 3 },
      { id: 'p1-s2', name: '李静', no: 'G3002', joinTime: '2026-02-01', startDate: '2026-02-01', completedExams: 3, passedExams: 2 },
      { id: 'p1-s3', name: '张敏', no: 'G3003', joinTime: '2026-02-10', startDate: '2026-02-10', completedExams: 0, passedExams: 0 },
      { id: 'p1-s4', name: '刘婷', no: 'G3004', joinTime: '2026-03-01', startDate: '2026-03-01', completedExams: 0, passedExams: 0 },
      { id: 'p1-s5', name: '陈丽', no: 'G3005', joinTime: '2026-03-01', startDate: '2026-03-01', completedExams: 3, passedExams: 3 },
    ],
  },
  {
    id: 'p2',
    name: '2026年临床技能提升计划',
    cycle: 12,
    enabled: true,
    items: [
      { id: 'p2-1', examId: '院级培训', examName: '院级培训', finishMonth: 4, credit: 1.5, studyHours: 3 },
      { id: 'p2-2', examId: '新员工培训', examName: '新员工培训', finishMonth: 8, credit: 0.5, studyHours: 1.5 },
    ],
    students: [
      { id: 'p2-s1', name: '赵磊', no: 'G4001', joinTime: '2026-02-01', startDate: '2026-02-01', completedExams: 2, passedExams: 2 },
      { id: 'p2-s2', name: '孙浩', no: 'G4002', joinTime: '2026-03-15', startDate: '2026-03-15', completedExams: 0, passedExams: 0 },
      { id: 'p2-s3', name: '周琳', no: 'G4003', joinTime: '2026-04-01', startDate: '2026-04-01', completedExams: 2, passedExams: 2 },
    ],
  },
  {
    id: 'p3',
    name: '2026年度急救技能全员培训',
    cycle: 6,
    enabled: true,
    items: [
      { id: 'p3-1', examId: '考核认定', examName: '考核认定', finishMonth: 2, credit: 1, studyHours: 2 },
      { id: 'p3-2', examId: '继续教育', examName: '继续教育', finishMonth: 5, credit: 0.5, studyHours: 1 },
    ],
    students: [
      { id: 'p3-s1', name: '吴强', no: 'G5001', joinTime: '2026-05-01', startDate: '2026-05-01', completedExams: 2, passedExams: 2 },
      { id: 'p3-s2', name: '郑爽', no: 'G5002', joinTime: '2026-05-01', startDate: '2026-05-01', completedExams: 2, passedExams: 1 },
      { id: 'p3-s3', name: '马超', no: 'G5003', joinTime: '2026-05-06', startDate: '2026-05-06', completedExams: 0, passedExams: 0 },
      { id: 'p3-s4', name: '朱琳', no: 'G5004', joinTime: '2026-05-06', startDate: '2026-05-06', completedExams: 2, passedExams: 2 },
      { id: 'p3-s5', name: '胡兵', no: 'G5005', joinTime: '2026-06-01', startDate: '2026-06-01', completedExams: 0, passedExams: 0 },
      { id: 'p3-s6', name: '高鹏', no: 'G5006', joinTime: '2026-06-01', startDate: '2026-06-01', completedExams: 2, passedExams: 1 },
      { id: 'p3-s7', name: '林娜', no: 'G5007', joinTime: '2026-06-10', startDate: '2026-06-10', completedExams: 0, passedExams: 0 },
      { id: 'p3-s8', name: '何静', no: 'G5008', joinTime: '2026-07-01', startDate: '2026-07-01', completedExams: 2, passedExams: 2 },
    ],
  },
  {
    id: 'p4',
    name: '2026年度院感防控全员培训',
    cycle: 9,
    enabled: true,
    items: [
      { id: 'p4-1', examId: '三基三严', examName: '三基三严', finishMonth: 3, credit: 0.5, studyHours: 1 },
      { id: 'p4-2', examId: '专科培训', examName: '专科培训', finishMonth: 7, credit: 1, studyHours: 2 },
    ],
    students: [
      { id: 'p4-s1', name: '徐涛', no: 'G6001', joinTime: '2026-03-01', startDate: '2026-03-01', completedExams: 2, passedExams: 2 },
      { id: 'p4-s2', name: '曹颖', no: 'G6002', joinTime: '2026-03-01', startDate: '2026-03-01', completedExams: 2, passedExams: 1 },
      { id: 'p4-s3', name: '邓超', no: 'G6003', joinTime: '2026-04-01', startDate: '2026-04-01', completedExams: 2, passedExams: 2 },
      { id: 'p4-s4', name: '范冰', no: 'G6004', joinTime: '2026-04-01', startDate: '2026-04-01', completedExams: 2, passedExams: 2 },
    ],
  },
  {
    id: 'p5',
    name: '2026年新员工入职培训计划',
    cycle: 3,
    enabled: false,
    items: [{ id: 'p5-1', examId: '新员工培训', examName: '新员工培训', finishMonth: 1, credit: 1, studyHours: 2 }],
    students: [
      { id: 'p5-s1', name: '许诺', no: 'G7001', joinTime: '2026-01-05', startDate: '2026-01-05', completedExams: 1, passedExams: 1 },
      { id: 'p5-s2', name: '袁泉', no: 'G7002', joinTime: '2026-01-05', startDate: '2026-01-05', completedExams: 0, passedExams: 0 },
    ],
  },
]

/** 区块标题（蓝色小竖条 + 标题） */
const SectionTitle: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, ...style }}>
    <span style={{ display: 'inline-block', width: 4, height: 16, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
    <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{children}</span>
  </div>
)

// ===== 考试计划页面 =====
const ExamPlan: React.FC = () => {
  const [records, setRecords] = useState<ExamPlanRecord[]>(SEED_PLANS)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ExamPlanRecord | null>(null)
  const [items, setItems] = useState<PlanExamItem[]>([])
  const [form] = Form.useForm()
  /** 考试科目选项：取自「基础设置 - 考试科目」，打开抽屉时刷新 */
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>(() =>
    buildSubjectOptions(),
  )

  // 学员管理（抽屉 + 添加学员弹窗）
  const [studentPlanId, setStudentPlanId] = useState<string | null>(null)
  const [stuModalOpen, setStuModalOpen] = useState(false)
  const [stuForm] = Form.useForm()
  const [stuKw, setStuKw] = useState('')                       // 学员姓名筛选
  const [stuStatus, setStuStatus] = useState<StudentStatus | undefined>(undefined)  // 完成状态筛选
  const [detailStudent, setDetailStudent] = useState<PlanStudent | null>(null) // 学员科目详情抽屉
  /** 学员数据实时取自 records，增删改后抽屉与列表同步刷新 */
  const studentPlan = records.find((r) => r.id === studentPlanId) ?? null

  /**
   * 打开抽屉时回填表单。
   * 不用 Form 的 initialValues + key 方案：Drawer 内容不会每次重挂载，
   * initialValues 只在字段为 undefined 时填充，会残留上一次的值，故显式赋值。
   */
  useEffect(() => {
    if (!open) return
    // 每次打开重新读取「基础设置 - 考试科目」，保证新增/改名后立即可选
    setSubjectOptions(buildSubjectOptions())
    form.resetFields()
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        enabled: editing.enabled,
        remark: editing.remark,
      })
    } else {
      form.setFieldsValue({ enabled: true })
    }
  }, [open, editing, form])

  // 过滤条件：输入值 + 已应用值（点「搜索」才生效）
  const [nameInput, setNameInput] = useState('')
  const [cycleInput, setCycleInput] = useState('')
  const [nameKw, setNameKw] = useState('')
  const [cycleKw, setCycleKw] = useState('')

  const handleSearch = () => {
    setNameKw(nameInput.trim())
    setCycleKw(cycleInput.trim())
  }
  const handleReset = () => {
    setNameInput('')
    setCycleInput('')
    setNameKw('')
    setCycleKw('')
  }

  const filtered = records.filter((r) => {
    if (nameKw && !r.name.includes(nameKw)) return false
    if (cycleKw && !String(r.cycle ?? '').includes(cycleKw)) return false
    return true
  })

  // ===== 打开抽屉（新增 / 编辑） =====
  const openAdd = () => {
    setEditing(null)
    setItems([])
    setOpen(true)
  }
  const openEdit = (r: ExamPlanRecord) => {
    setEditing(r)
    setItems(r.items.map((x) => ({ ...x })))
    setOpen(true)
  }
  const closeDrawer = () => {
    setOpen(false)
    setEditing(null)
  }

  // ===== 学员管理 =====
  const patchStudents = (planId: string, fn: (list: PlanStudent[]) => PlanStudent[]) =>
    setRecords((prev) => prev.map((r) => (r.id === planId ? { ...r, students: fn(r.students) } : r)))

  const handleAddStudent = async () => {
    if (!studentPlan) return
    let values: Record<string, unknown>
    try {
      values = await stuForm.validateFields()
    } catch {
      return
    }
    const name = (values.name as string).trim()
    const no = ((values.no as string) ?? '').trim()
    if (studentPlan.students.some((s) => s.name === name)) {
      message.warning(`学员「${name}」已在本计划中`)
      return
    }
    if (no && studentPlan.students.some((s) => s.no === no)) {
      message.warning(`工号「${no}」已在本计划中`)
      return
    }
    const start = values.startDate as Dayjs | undefined
    patchStudents(studentPlan.id, (list) => [
      ...list,
      {
        id: `s-${Date.now()}`,
        name,
        no: no || `G${Date.now()}`,
        joinTime: dayjs().format(DATE_FORMAT), // 加入时间：自动生成为当前日期
        // 开始日期未填时默认取今天
        startDate: (start ?? dayjs()).format(DATE_FORMAT),
        completedExams: 0,
        passedExams: 0,
      },
    ])
    setStuModalOpen(false)
    stuForm.resetFields()
    message.success('学员已添加')
  }

  const removeStudent = (sid: string) => {
    if (!studentPlan) return
    patchStudents(studentPlan.id, (list) => list.filter((s) => s.id !== sid))
    message.success('学员已移除')
  }

  /** 打开「添加学员」弹窗：清空表单并默认开始日期为今天 */
  const openStuModal = () => {
    stuForm.resetFields()
    stuForm.setFieldsValue({ startDate: dayjs() })
    setStuModalOpen(true)
  }

  // ===== 计划考试明细操作 =====
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: `i-${Date.now()}-${prev.length}`, finishMonth: null, credit: null, studyHours: null, passCount: null },
    ])
  const removeItem = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id))
  const patchItem = (id: string, patch: Partial<PlanExamItem>) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  /** 选择考试科目：记录所选科目名称 */
  const handleExamChange = (rowId: string, subject: string) => {
    patchItem(rowId, {
      examId: subject,
      examName: subject,
    })
  }

  // ===== 保存 =====
  const handleSave = async () => {
    let values: Record<string, unknown>
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    const payload = {
      name: (values.name as string).trim(),
      // 计划周期已从表单移除，编辑时保留原值（新增计划为空）
      cycle: editing?.cycle ?? null,
      enabled: !!values.enabled,
      remark: (values.remark as string | undefined)?.trim(),
      items,
    }
    if (editing) {
      // students 不在表单内维护，编辑时保留原值
      setRecords((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...payload } : x)))
      message.success('考试计划已更新')
    } else {
      setRecords((prev) => [{ id: `p-${Date.now()}`, ...payload, students: [] }, ...prev])
      message.success('考试计划已新增')
    }
    closeDrawer()
  }

  const handleDelete = (r: ExamPlanRecord) => {
    setRecords((prev) => prev.filter((x) => x.id !== r.id))
    message.success('考试计划已删除')
  }

  // ===== 计划考试明细表格 =====
  const itemColumns: ColumnsType<PlanExamItem> = [
    {
      title: '节点',
      key: 'node',
      width: 64,
      align: 'center',
      render: (_: unknown, __: PlanExamItem, i: number) => i + 1,
    },
    {
      title: '考试科目',
      dataIndex: 'examId',
      key: 'examId',
      render: (v: string | undefined, r: PlanExamItem) => (
        <Select
          showSearch
          allowClear
          placeholder="请选择考试科目"
          optionFilterProp="label"
          style={{ width: '100%' }}
          value={v}
          options={subjectOptions.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(val: string) => handleExamChange(r.id, val)}
        />
      ),
    },
    {
      title: '合格次数',
      dataIndex: 'passCount',
      key: 'passCount',
      width: 120,
      render: (v: number | null, r: PlanExamItem) => (
        <InputNumber
          min={1}
          max={99}
          precision={0}
          placeholder="如 1"
          style={{ width: '100%' }}
          value={v}
          onChange={(val) => patchItem(r.id, { passCount: val ?? null })}
        />
      ),
    },
    {
      title: '限时（月）',
      dataIndex: 'finishMonth',
      key: 'finishMonth',
      width: 140,
      render: (v: number | null, r: PlanExamItem) => (
        <InputNumber
          min={1}
          max={120}
          precision={0}
          placeholder="如 3"
          style={{ width: '100%' }}
          value={v}
          onChange={(val) => patchItem(r.id, { finishMonth: val ?? null })}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      align: 'center',
      render: (_: unknown, r: PlanExamItem) => (
        <a style={{ color: '#ff4d4f' }} onClick={() => removeItem(r.id)}>
          <DeleteOutlined />
        </a>
      ),
    },
  ]

  // ===== 学员表格列 =====
  const studentColumns: ColumnsType<PlanStudent> = [
    {
      title: '序号',
      key: 'index',
      width: 64,
      align: 'center',
      render: (_: unknown, __: PlanStudent, i: number) => i + 1,
    },
    { title: '学员姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '工号', dataIndex: 'no', key: 'no', width: 100, align: 'center' },
    { title: '加入时间', dataIndex: 'joinTime', key: 'joinTime', width: 130, align: 'center' },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 130, align: 'center' },
    {
      title: '完成情况',
      key: 'completion',
      width: 110,
      align: 'center',
      render: (_: unknown, r: PlanStudent) => {
        const total = studentPlan?.items.length ?? 0
        const done = r.completedExams ?? 0
        return (
          <span style={{ fontWeight: 600, color: done >= total && total > 0 ? '#52c41a' : 'rgba(0,0,0,0.85)' }}>
            {done} / {total}
          </span>
        )
      },
    },
    {
      title: '完成状态',
      key: 'status',
      width: 100,
      align: 'center',
      // 根据「完成情况」自动标识：已完成=全部完成 / 进行中=部分完成 / 未开始=0 完成
      render: (_: unknown, r: PlanStudent) => {
        const st = studentStatus(r, studentPlan?.items.length ?? 0)
        return <Tag color={STUDENT_STATUS_COLOR[st]}>{st}</Tag>
      },
    },
    {
      title: '考试次数',
      key: 'examCount',
      width: 90,
      align: 'center',
      // 参加考试的项数（缺省取已完成项数）；与「完成情况」分子一致，但语义为参考次数
      render: (_: unknown, r: PlanStudent) => {
        const times = r.examCount ?? r.completedExams ?? 0
        return (
          <span style={{ fontWeight: 600, color: times > 0 ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.45)' }}>
            {times}
          </span>
        )
      },
    },
    {
      title: '合格次数',
      key: 'passCount',
      width: 90,
      align: 'center',
      // 仅显示已合格考试项数（合格次数）
      render: (_: unknown, r: PlanStudent) => {
        const passed = r.passedExams ?? 0
        return (
          <span style={{ fontWeight: 600, color: passed > 0 ? '#52c41a' : 'rgba(0,0,0,0.45)' }}>
            {passed}
          </span>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_: unknown, r: PlanStudent) => {
        // 仅「未开始」允许移除；进行中 / 已完成 不允许移除
        const removable = studentStatus(r, studentPlan?.items.length ?? 0) === '未开始'
        return (
          <Space size={4}>
            <Button type="link" size="small" onClick={() => setDetailStudent(r)}>
              详情
            </Button>
            <Popconfirm
              title="移除学员"
              description={`确定将「${r.name}」移出该计划吗？`}
              okText="确定"
              cancelText="再想想"
              disabled={!removable}
              okButtonProps={{ danger: true }}
              onConfirm={() => removeStudent(r.id)}
            >
              <Button type="link" size="small" danger disabled={!removable}>
                移除
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  // ===== 学员科目详情：根据聚合计数推导各考试科目完成 / 及格情况 =====
  const subjectDetail = (s: PlanStudent): { examName: string; completed: boolean; passed: boolean }[] => {
    const items = studentPlan?.items ?? []
    const done = s.completedExams ?? 0
    const passed = s.passedExams ?? 0
    return items.map((it, i) => ({
      examName: it.examName ?? it.examId ?? `科目 ${i + 1}`,
      completed: i < done,
      passed: i < passed,
    }))
  }
  const detailSubjects = detailStudent ? subjectDetail(detailStudent) : []

  // ===== 列表列定义 =====
  const columns: ColumnsType<ExamPlanRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_: unknown, __: ExamPlanRecord, i: number) => i + 1,
    },
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span style={{ color: 'rgba(0,0,0,0.85)' }}>{v}</span>,
    },
    {
      title: '计划周期（月）',
      dataIndex: 'cycle',
      key: 'cycle',
      width: 140,
      align: 'center',
      render: (v: number | null) => (v == null ? '-' : `${v} 个月`),
    },
    {
      title: '计划考试',
      key: 'itemCount',
      width: 110,
      align: 'center',
      render: (_: unknown, r: ExamPlanRecord) => `${r.items.length} 项`,
    },
    {
      title: '学员数量',
      key: 'studentCount',
      width: 100,
      align: 'center',
      render: (_: unknown, r: ExamPlanRecord) => `${r.students.length} 人`,
    },
    {
      title: '未完成数量',
      key: 'unfinishedCount',
      width: 110,
      align: 'center',
      render: (_: unknown, r: ExamPlanRecord) => {
        const n = r.students.filter((s) => (s.completedExams ?? 0) < r.items.length).length
        return n ? <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{n} 人</span> : <span style={{ color: 'rgba(0,0,0,0.45)' }}>0 人</span>
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      align: 'center',
      render: (v: boolean) => (v ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      width: 230,
      render: (_: unknown, r: ExamPlanRecord) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          <a onClick={() => openEdit(r)}>
            <EditOutlined style={{ marginRight: 4 }} />
            编辑
          </a>
          <a style={{ marginLeft: 16 }} onClick={() => setStudentPlanId(r.id)}>
            <TeamOutlined style={{ marginRight: 4 }} />
            学员
          </a>
          <Popconfirm
            title="删除考试计划"
            description={`确定删除「${r.name}」吗？`}
            okText="删除"
            cancelText="再想想"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(r)}
          >
            <a style={{ color: '#ff4d4f', marginLeft: 16 }}>
              <DeleteOutlined style={{ marginRight: 4 }} />
              删除
            </a>
          </Popconfirm>
        </span>
      ),
    },
  ]

  return (
    <>
      <Card bordered={false} styles={{ body: { padding: '8px 24px 24px' } }}>
        {/* 标题栏：左「新增计划」，右过滤条件 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            新增计划
          </Button>
          <span>
            <Input
              allowClear
              placeholder="计划名称"
              style={{ width: 180, marginRight: 8 }}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Input
              allowClear
              placeholder="计划周期（月）"
              style={{ width: 150, marginRight: 8 }}
              value={cycleInput}
              onChange={(e) => setCycleInput(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button type="primary" style={{ marginRight: 8 }} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </span>
        </div>

        <Table<ExamPlanRecord>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1150 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t: number) => `共 ${t} 条`,
            position: ['bottomLeft'],
          }}
          locale={{ emptyText: '暂无考试计划' }}
        />
      </Card>

      {/* 新增 / 编辑计划：右侧抽屉 */}
      <Drawer
        title={editing ? '编辑计划' : '新增计划'}
        placement="right"
        width={900}
        open={open}
        onClose={closeDrawer}
        forceRender
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={closeDrawer}>取消</Button>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </div>
        }
      >
        <Form form={form} layout="horizontal" labelCol={{ flex: '0 0 120px' }}>
          <SectionTitle>基础信息</SectionTitle>

          <Form.Item label="计划名称" name="name" rules={[{ required: true, message: '请输入计划名称' }]}>
            <Input placeholder="请输入计划名称" maxLength={60} />
          </Form.Item>

          <Form.Item
            label="状态"
            name="enabled"
            valuePropName="checked"
            style={{ marginBottom: 24 }}
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>

          <Form.Item label="计划说明" name="remark" rules={[{ max: 300, message: '计划说明不超过 300 字' }]}>
            <Input.TextArea
              rows={3}
              placeholder="请输入计划说明（如：护理岗位继续教育：必修不良事件管理，选修课程需累计完成 20 分钟学习时长）"
              maxLength={300}
              showCount
            />
          </Form.Item>

          <SectionTitle style={{ marginTop: 24 }}>添加计划考试科目</SectionTitle>

          <Table<PlanExamItem>
            rowKey="id"
            size="small"
            columns={itemColumns}
            dataSource={items}
            pagination={false}
            locale={{ emptyText: '暂无计划考试科目，点击下方按钮添加' }}
          />

          <Button type="dashed" block icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={addItem}>
            添加科目
          </Button>
        </Form>
      </Drawer>

      {/* 学员管理：右侧抽屉 */}
      <Drawer
        title="学员管理"
        placement="right"
        width={960}
        open={!!studentPlan}
        onClose={() => setStudentPlanId(null)}
        forceRender
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" onClick={() => setStudentPlanId(null)}>
              完成
            </Button>
          </div>
        }
      >
        {studentPlan && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'rgba(0,0,0,0.88)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {studentPlan.name}
                </div>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>
                  计划周期 {studentPlan.cycle ?? '-'} 个月 · 计划考试 {studentPlan.items.length} 项
                </span>
              </div>
            </div>

            {/* 筛选：姓名 + 完成状态；添加学员按钮移到本行左侧 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openStuModal}>
                添加学员
              </Button>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Input
                  allowClear
                  placeholder="学员姓名"
                  style={{ width: 160 }}
                  value={stuKw}
                  onChange={(e) => setStuKw(e.target.value)}
                />
                <Select
                  allowClear
                  placeholder="完成状态"
                  style={{ width: 140 }}
                  value={stuStatus}
                  onChange={setStuStatus}
                  options={(Object.keys(STUDENT_STATUS_COLOR) as StudentStatus[]).map((s) => ({ value: s, label: s }))}
                />
              </div>
            </div>

            <Table<PlanStudent>
              rowKey="id"
              size="small"
              columns={studentColumns}
              dataSource={studentPlan.students.filter((s) => {
                if (stuKw && !s.name.includes(stuKw.trim())) return false
                if (stuStatus && studentStatus(s, studentPlan.items.length) !== stuStatus) return false
                return true
              })}
              pagination={false}
              locale={{ emptyText: '暂无学员，点击「添加学员」添加' }}
            />
          </>
        )}
      </Drawer>

      {/* 学员科目详情：查看各考试科目完成情况与及格情况 */}
      <Drawer
        title="学员考试科目详情"
        placement="right"
        width={560}
        open={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        forceRender
      >
        {detailStudent && (
          <>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{detailStudent.name}</div>
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>
                工号 {detailStudent.no} · 考试 {detailStudent.examCount ?? detailStudent.completedExams ?? 0} 次 · 合格 {detailStudent.passedExams ?? 0} 科
              </span>
            </div>

            {detailSubjects.length === 0 ? (
              <div style={{ color: 'rgba(0,0,0,0.45)', padding: '24px 0', textAlign: 'center' }}>
                该计划暂无考试科目
              </div>
            ) : (
              <Table<{ examName: string; completed: boolean; passed: boolean }>
                rowKey="examName"
                size="middle"
                pagination={false}
                dataSource={detailSubjects}
                columns={[
                  {
                    title: '考试科目',
                    dataIndex: 'examName',
                    key: 'examName',
                    render: (v: string) => <span style={{ color: 'rgba(0,0,0,0.85)' }}>{v}</span>,
                  },
                  {
                    title: '完成情况',
                    key: 'completed',
                    width: 110,
                    align: 'center',
                    render: (_: unknown, r) =>
                      r.completed ? (
                        <Tag color="success">已完成</Tag>
                      ) : (
                        <Tag color="default">未完成</Tag>
                      ),
                  },
                  {
                    title: '及格情况',
                    key: 'passed',
                    width: 110,
                    align: 'center',
                    render: (_: unknown, r) =>
                      !r.completed ? (
                        <Tag color="default">未参考</Tag>
                      ) : r.passed ? (
                        <Tag color="success">合格</Tag>
                      ) : (
                        <Tag color="error">不合格</Tag>
                      ),
                  },
                ]}
              />
            )}
          </>
        )}
      </Drawer>

      {/* 添加学员 */}
      <Modal
        title="添加学员"
        open={stuModalOpen}
        onCancel={() => setStuModalOpen(false)}
        onOk={handleAddStudent}
        okText="确定"
        cancelText="再想想"
        forceRender
        width={480}
      >
        <Form form={stuForm} layout="horizontal" labelCol={{ flex: '0 0 90px' }} style={{ marginTop: 20 }}>
          <Form.Item label="学员姓名" name="name" rules={[{ required: true, message: '请输入学员姓名' }]}>
            <Input placeholder="请输入学员姓名" maxLength={20} />
          </Form.Item>
          <Form.Item label="工号" name="no">
            <Input placeholder="请输入工号" maxLength={20} />
          </Form.Item>
          <Form.Item label="开始日期" name="startDate">
            <DatePicker format={DATE_FORMAT} placeholder="默认今天，可不填" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ExamPlan
