import React, { useRef, useState, useEffect, useMemo } from 'react'
import {
  Button,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Drawer,
  Pagination,
  Radio,
  Checkbox,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Modal,
  Divider,
  Dropdown,
  Popconfirm,
  Upload,
  Alert,
  message,
} from 'antd'
import type { MenuProps, TableColumnsType } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  PlusCircleOutlined,
  QuestionCircleOutlined,
  CheckOutlined,
  FileTextOutlined,
  CopyOutlined,
  ThunderboltOutlined,
  EditOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  DownOutlined,
  UploadOutlined,
  DownloadOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { STATION_NAMES } from './QuestionBank'
import { getPlanTagNames } from './planTagStore'

// ===== 类型 =====
export type ExamPeriod = '统一时段' | '开放时段'
export type ExamStatus = '未发布' | '未开始' | '进行中' | '已结束' | '已归档' | '已中止'

/** 阅评方式（理论 / 实操通用）：当前仅保留随机平均分配 */
export type GradeMode = '随机平均分配'

/** 阅卷人的分配明细（按题型分配时记录该阅卷人负责的题型） */
export interface ExaminerAssign {
  /** 该阅卷人负责的题型（多选） */
  types?: string[]
}

/** 考试节点安排（考试安排下的多条记录） */
export interface ExamScheduleItem {
  id: string
  node: string                              // 节点名称
  paperId?: string                          // 选择试卷 id
  range: [dayjs.Dayjs, dayjs.Dayjs] | null  // 考试起止时间
  limitHours: number | null                 // 考试限时（小时）
  limitMinutes: number | null               // 考试限时（分钟）
}

export interface TheoryExamRecord {
  id: string
  name: string
  category: string
  description?: string      // 试卷说明（试卷维护中维护）
  // ===== 基本信息扩展 =====
  studyHours?: number      // 学时
  credits?: number         // 学分
  belongYear?: string      // 所属年度
  planTag?: string         // 关联考试科目（如三基三严）
  period: ExamPeriod
  status: ExamStatus
  enabled?: boolean        // 启用 / 停用（独立开关，默认启用；不影响生命周期状态）
  totalScore: number
  passScore: number
  timeMode: string        // 开始方式（不计时 / 计时 xx 分钟）
  runTime: string         // 进行时间 / 可考时段
  runTip?: string         // 提前 xx 分钟可进入
  enterTip?: string       // 最短进入 / 最长 xx 分钟
  attempts: number
  examType?: string       // 考试类型（理论考试 / 实操考试）
  pickerMode?: string     // 出题方式（统一考试 / AB组卷 / 千人千卷 / 手工出题）
  paperCount?: number     // 试卷数量（未指定时按出题方式推导：AB组卷=2 套，其余=1 套）
  byMajor?: boolean       // 按专业选题（理论 / 实操考试均支持）
  randomWhenInsufficient?: boolean // 题库不足随机抽题
  categories?: string[]     // 题目分类（必填，决定抽题配比可选的分类）
  finalScoreMode?: string   // 最终分数：取最高分 / 取最后一次得分
  closeAfterPass?: boolean  // 及格后关闭考试
  roundPassScore?: number   // 本轮考试合格分（各试卷合格分合计，可修改）
  passRule?: string         // 合格标识：各试卷均达到合格分 / 达到总合格分
  // ===== 考官设置 =====
  chiefExaminer?: string     // 主考官
  examiners?: string[]       // 阅卷人（多人）
  gradeMode?: GradeMode      // 阅评方式（当前仅「随机平均分配」）
  examinerAssigns?: Record<string, ExaminerAssign> // 阅卷人 → 分配明细（负责题型）
  // ===== 考官出分 =====
  anonymousReview?: boolean   // 匿名阅卷
  reviewDays?: number          // 出分后允许复核时长（天）
  scoreTime?: string          // 统一出分时间（YYYY-MM-DD HH:mm:ss）
  objectiveMode?: string      // 客观题出分：隐藏出分 / 显示出分
  subjectiveReviewers?: number // 主观题阅卷人数
  subjectiveAvg?: boolean     // 主观题取平均分
  subjectiveDropMax?: boolean // 主观题去除最高分
  subjectiveDropMin?: boolean // 主观题去除最低分
  subjectiveMaxDiff?: number  // 主观题最大分差（百分比）
  // ===== 预约设置 =====
  allowBooking?: boolean      // 允许预约
  bookingStart?: string       // 预约开始时间（YYYY-MM-DD）
  bookingEnd?: string         // 预约截止时间（YYYY-MM-DD）
  bookingLimit?: boolean      // 预约人数限制
  bookingMax?: number         // 最大预约人数
  bookingMin?: number         // 最低预约人数
  insufficientAction?: string // 预约人数不足时的处理：正常考试/取消考试/延期后正常考试/延期后不足取消考试
  deferDays?: number          // 延期天数（选择延期类处理时生效）
  allowCancelBooking?: boolean // 允许取消预约
  cancelMaxTimes?: number     // 最多取消次数
  // ----- 限制条件（均为多选，不选表示不限制） -----
  limitPersonStatus?: string[]   // 指定人员状态
  limitTitle?: string[]          // 指定聘任职称
  limitPersonCategory?: string[] // 指定人员类别
  limitDept?: string[]           // 指定科室
  limitMajor?: string[]          // 指定专业
  // ===== 录屏录像 =====
  screenRecord?: boolean      // 机考录屏
  practicalRecord?: boolean   // 实操录像
  // ===== 考试节点安排（多条） =====
  schedules?: ExamScheduleItem[] // 考试安排下的节点安排
  audioRetention?: number     // 音频文件保留时长（月）
  examTime?: string       // 考试时间
  duration?: string       // 考试时长
  enrollDeadline?: string // 报名截止
  enrolled?: number       // 总考生人数
  examined?: number       // 已考人数
}

/** 考试分类（侧栏） */
const EXAM_CATEGORIES = [
  '抢救技能',
  '常规理论',
  '基础护理',
  '专科护理',
  '内科诊疗',
  '外科诊疗',
  '护理安全',
  '核心制度',
]

/** 考官候选项（主考官 / 阅卷人）—— value 保留完整信息以兼容历史数据 */
const EXAMINER_OPTIONS = [
  '张伟（主任医师）',
  '李娜（副主任医师）',
  '王强（主治医师）',
  '赵敏（主治医师）',
  '刘洋（住院医师）',
  '陈静（护士长）',
  '杨帆（教学秘书）',
  '周磊（副主任医师）',
]

/** 考官工号：下拉标签显示「姓名（工号）」，不显示职称 */
const EXAMINER_NO: Record<string, string> = {
  '张伟（主任医师）': 'G1001',
  '李娜（副主任医师）': 'G1002',
  '王强（主治医师）': 'G1003',
  '赵敏（主治医师）': 'G1004',
  '刘洋（住院医师）': 'G1005',
  '陈静（护士长）': 'G1006',
  '杨帆（教学秘书）': 'G1007',
  '周磊（副主任医师）': 'G1008',
}

/** 考官下拉选项：value 不变，label 改为「姓名（工号）」 */
const EXAMINER_SELECT_OPTIONS = EXAMINER_OPTIONS.map((r) => ({
  value: r,
  label: `${r.split('（')[0]}（${EXAMINER_NO[r]}）`,
}))

// ===== 预约设置 · 限制条件选项（均为多选） =====
/** 指定人员状态 */
const LIMIT_PERSON_STATUS_OPTIONS = ['在职', '试用期', '进修', '返聘', '离职']
/** 指定聘任职称 */
const LIMIT_TITLE_OPTIONS = [
  '主任医师',
  '副主任医师',
  '主治医师',
  '住院医师',
  '主任护师',
  '副主任护师',
  '主管护师',
  '护师',
  '护士',
  '主任技师',
  '副主任技师',
  '主管技师',
  '技师',
  '主任药师',
  '副主任药师',
  '主管药师',
  '药师',
]
/** 指定人员类别 */
const LIMIT_PERSON_CATEGORY_OPTIONS = ['医师', '护士', '技师', '药师', '管理人员', '工勤人员']
/** 指定科室 */
const LIMIT_DEPT_OPTIONS = [
  '医务科',
  '护理部',
  '门诊部',
  '内科',
  '外科',
  '妇产科',
  '儿科',
  '急诊科',
  '麻醉科',
  '影像科',
  '检验科',
  '药学部',
  '手术室',
  '重症医学科',
]
/** 指定专业 */
const LIMIT_MAJOR_OPTIONS = [
  '临床医学',
  '医学影像学',
  '麻醉学',
  '儿科学',
  '妇产科学',
  '急诊医学',
  '检验医学',
  '全科医学',
  '护理学',
]

/** 所属年度选项：当前年度前后各 3 年 */
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => String(dayjs().year() - 3 + i))

// 计划标记内容选项：取自「计划标记」管理页（localStorage 持久化），与管理页保持一致

export const INITIAL_EXAMS: TheoryExamRecord[] = [
  {
    id: 'e1',
    name: 'test',
    description: '急救基础理论测试卷（单选 / 多选 / 判断）',
    studyHours: 2,
    credits: 0.5,
    belongYear: '2026',
    category: '急救技能',
    period: '统一时段',
    status: '未发布',
    totalScore: 100,
    passScore: 60,
    timeMode: '统一时段',
    runTime: '09-23 17:00 ~ 09-23 18:00',
    runTip: '提前 15 分钟可进入',
    attempts: 1,
    examType: '理论考试',
    pickerMode: '统一考试',
    examTime: '2026-09-23 17:00 ~ 18:00',
    duration: '1 小时 0 分钟',
    enrollDeadline: '2026-09-23 12:00',
    enrolled: 86,
    examined: 0,
  },
  {
    id: 'e2',
    name: '外科1231',
    description: '外科常见病诊疗理论与核心制度考核',
    studyHours: 1.5,
    credits: 0.5,
    belongYear: '2026',
    category: '常规理论',
    period: '统一时段',
    status: '未发布',
    totalScore: 100,
    passScore: 60,
    timeMode: '统一时段',
    runTime: '09-24 16:00 ~ 09-24 17:00',
    runTip: '提前 15 分钟可进入',
    attempts: 1,
    examType: '理论考试',
    pickerMode: 'AB组卷',
    examTime: '2026-09-24 16:00 ~ 17:00',
    duration: '1 小时 0 分钟',
    enrollDeadline: '2026-09-24 12:00',
    enrolled: 42,
  },
  {
    id: 'e3',
    name: '测试',
    description: '开放时段测试卷，用于流程验证',
    studyHours: 2,
    credits: 1,
    belongYear: '2026',
    category: '急救技能',
    period: '开放时段',
    status: '进行中',
    totalScore: 100,
    passScore: 60,
    timeMode: '开始：不计时',
    runTime: '可考时段：（随时可考、不限时）\n09-24 00:00 ~ 09-30 00:00',
    attempts: 1,
    examType: '理论考试',
    pickerMode: '统一考试',
    examTime: '2026-09-24 00:00 ~ 09-30 00:00',
    duration: '不限时',
    enrollDeadline: '2026-09-23 17:00',
    enrolled: 64,
    examined: 30,
  },
  {
    id: 'e4',
    name: '急救技能考试',
    description: '急救技能规范化培训结业考核',
    studyHours: 1,
    credits: 0.5,
    belongYear: '2026',
    category: '急救技能',
    period: '开放时段',
    status: '已结束',
    totalScore: 100,
    passScore: 60,
    timeMode: '开始：计时 60 分钟',
    runTime: '可考时段：（限时答题）\n09-21 00:00 ~ 09-22 00:00',
    enterTip: '最短进入：最长 60 分钟',
    attempts: 1,
    examType: '理论考试',
    pickerMode: '统一考试',
    examTime: '2026-09-21 00:00 ~ 09-22 00:00',
    duration: '60 分钟',
    enrollDeadline: '2026-09-20 17:00',
    enrolled: 50,
    examined: 50,
  },
  {
    id: 'e5',
    name: '急救技能专项考核',
    description: '急救技能专项手工组卷考核',
    studyHours: 2,
    credits: 1,
    belongYear: '2026',
    category: '急救技能',
    period: '开放时段',
    status: '进行中',
    totalScore: 100,
    passScore: 60,
    timeMode: '开始：不计时',
    runTime: '可考时段：（限时答题、不限时）\n09-15 08:00 ~ 10-20 23:59',
    attempts: 1,
    examType: '理论考试',
    pickerMode: '手工出题',
    examTime: '2026-09-15 08:00 ~ 10-20 23:59',
    duration: '2 小时 0 分钟',
    enrollDeadline: '2026-09-14 17:00',
    enrolled: 64,
    examined: 38,
  },
  {
    id: 'e6',
    name: '核心制度专项测试',
    description: '医疗核心制度专项测试卷',
    studyHours: 1,
    credits: 0.5,
    belongYear: '2026',
    category: '核心制度',
    period: '开放时段',
    status: '进行中',
    totalScore: 100,
    passScore: 60,
    timeMode: '开始：计时 60 分钟',
    runTime: '可考时段：（限时答题）\n09-28 08:00 ~ 10-10 18:00',
    attempts: 1,
    examType: '理论考试',
    pickerMode: 'AB组卷',
    examTime: '2026-09-28 08:00 ~ 10-10 18:00',
    duration: '60 分钟',
    enrollDeadline: '2026-09-27 17:00',
    enrolled: 120,
    examined: 76,
  },
  {
    id: 'e7',
    name: '护理安全知识测验',
    description: '护理安全与不良事件防范测验',
    studyHours: 2,
    credits: 1,
    belongYear: '2026',
    category: '护理安全',
    period: '统一时段',
    status: '未开始',
    totalScore: 100,
    passScore: 60,
    timeMode: '统一时段',
    runTime: '10-08 09:00 ~ 10-08 11:00',
    runTip: '提前 15 分钟可进入',
    attempts: 1,
    examType: '理论考试',
    pickerMode: '千人千卷',
    examTime: '2026-10-08 09:00 ~ 11:00',
    duration: '2 小时 0 分钟',
    enrollDeadline: '2026-10-07 17:00',
    enrolled: 78,
  },
  {
    id: 'e8',
    name: '2027 年度资质考核',
    description: '年度医师资质准入理论考核',
    studyHours: 4,
    credits: 2,
    belongYear: '2027',
    category: '核心制度',
    period: '统一时段',
    status: '未开始',
    totalScore: 100,
    passScore: 60,
    timeMode: '统一时段',
    runTime: '2027-01-01 09:00 ~ 11:00',
    runTip: '提前 15 分钟可进入',
    attempts: 1,
    examType: '理论考试',
    pickerMode: '统一考试',
    examTime: '2027-01-01 09:00 ~ 11:00',
    duration: '2 小时 0 分钟',
    enrollDeadline: '2026-12-31 17:00',
    enrolled: 120,
    examined: 0,
  },
  {
    id: 'e9',
    name: '临床技能实操考试',
    description: '临床技能 OSCE 站点式实操考核',
    studyHours: 3,
    credits: 1.5,
    belongYear: '2026',
    category: '临床技能',
    period: '统一时段',
    status: '未发布',
    totalScore: 100,
    passScore: 60,
    timeMode: '统一时段',
    runTime: '10-15 14:00 ~ 10-15 17:00',
    runTip: '提前 15 分钟可进入',
    attempts: 1,
    examType: '实操考试',
    pickerMode: '统一考试',
    examTime: '2026-10-15 14:00 ~ 17:00',
    duration: '3 小时 0 分钟',
    enrollDeadline: '2026-10-15 12:00',
    enrolled: 50,
    examined: 0,
    // 考官设置：阅评方式「随机平均分配」，并按题型分派阅卷人
    chiefExaminer: '张伟（主任医师）',
    examiners: ['李娜（副主任医师）', '王强（主治医师）', '赵敏（主治医师）'],
    gradeMode: '随机平均分配',
    examinerAssigns: {
      '李娜（副主任医师）': { types: ['填空题'] },
      '王强（主治医师）': { types: ['简答题'] },
      '赵敏（主治医师）': { types: ['实操题'] },
    },
  },
]

// ===== 状态样式 =====
const STATUS_STYLE: Record<ExamStatus, { color: string; bg: string; cardBg: string; border: string; tagBorder: string; ribbonBg: string; ribbonText: string }> = {
  未发布: { color: '#8c8c8c', bg: '#fafafa', cardBg: '#ffffff', border: '#e8e8e8', tagBorder: '#d9d9d9', ribbonBg: '#f0f0f0', ribbonText: 'rgba(0,0,0,0.65)' },
  未开始: { color: '#1677ff', bg: '#e6f4ff', cardBg: '#ffffff', border: '#e8e8e8', tagBorder: '#91caff', ribbonBg: '#e6f4ff', ribbonText: '#1677ff' },
  进行中: { color: '#722ed1', bg: '#f9f0ff', cardBg: '#f5f0ff', border: '#d3adf7', tagBorder: '#d3adf7', ribbonBg: '#1677ff', ribbonText: '#ffffff' },
  已结束: { color: '#8c8c8c', bg: '#f5f5f5', cardBg: '#f5f5f5', border: '#e0e0e0', tagBorder: '#d9d9d9', ribbonBg: '#8c8c8c', ribbonText: '#ffffff' },
  已归档: { color: '#8c8c8c', bg: '#f5f5f5', cardBg: '#f5f5f5', border: '#e0e0e0', tagBorder: '#d9d9d9', ribbonBg: '#8c8c8c', ribbonText: '#ffffff' },
  已中止: { color: '#fa541c', bg: '#fff2e8', cardBg: '#fffaf6', border: '#ffbb96', tagBorder: '#ffbb96', ribbonBg: '#fa541c', ribbonText: '#ffffff' },
}

/** 终态：不允许再延期 / 中止 */
export const TERMINAL_STATUS: ExamStatus[] = ['已结束', '已归档', '已中止']

/** 根据考试时间窗口动态计算展示状态：发布后未到时间=未开始，进行中，过了=已结束 */
export const computeExamStatus = (record: TheoryExamRecord): ExamStatus => {
  if (record.status === '未发布' || record.status === '已归档' || record.status === '已中止') return record.status
  if (!record.examTime || !record.examTime.includes('~')) return record.status
  const [a, b] = record.examTime.split('~').map((s) => s.trim())
  const start = dayjs(a)
  if (!start.isValid()) return record.status
  // 结束时间三种写法：HH:mm（同日）/ MM-DD HH:mm（跨天）/ YYYY-MM-DD HH:mm（完整日期）
  const dashCount = (b.match(/-/g) || []).length
  let end =
    dashCount >= 2
      ? dayjs(b)
      : dashCount === 1
        ? dayjs(`${start.format('YYYY')}-${b}`)
        : dayjs(`${start.format('YYYY-MM-DD')} ${b}`)
  if (!end.isValid()) return record.status
  // 跨年兜底：结束早于开始则视为下一年
  if (end.isBefore(start)) end = end.add(1, 'year')
  const now = dayjs()
  if (now.isBefore(start)) return '未开始'
  if (now.isAfter(end)) return '已结束'
  return '进行中'
}

/** 解析考试时间为起止 dayjs：支持 HH:mm（同日）/ MM-DD HH:mm（跨天）/ YYYY-MM-DD HH:mm（完整） */
const parseExamTime = (examTime?: string): [dayjs.Dayjs | null, dayjs.Dayjs | null] => {
  if (!examTime || !examTime.includes('~')) return [null, null]
  const [a, b] = examTime.split('~').map((s) => s.trim())
  const start = dayjs(a)
  if (!start.isValid()) return [null, null]
  const dashCount = (b.match(/-/g) || []).length
  let end =
    dashCount >= 2
      ? dayjs(b)
      : dashCount === 1
        ? dayjs(`${start.format('YYYY')}-${b}`)
        : dayjs(`${start.format('YYYY-MM-DD')} ${b}`)
  if (!end.isValid()) return [start, null]
  if (end.isBefore(start)) end = end.add(1, 'year')
  return [start, end]
}

/** 解析考试时长：'1 小时 30 分钟' → [1, 30]；'不限时' → [null, null] */
const parseDuration = (duration?: string): [number | null, number | null] => {
  if (!duration) return [null, null]
  const h = duration.match(/(\d+)\s*小时/)
  const m = duration.match(/(\d+)\s*分钟/)
  return [h ? Number(h[1]) : null, m ? Number(m[1]) : null]
}

// ===== 试卷维护列表页 =====
const TheoryExam: React.FC = () => {
  const [exams, setExams] = useState<TheoryExamRecord[]>(INITIAL_EXAMS)
  const [kw, setKw] = useState('')
  const [statusFilter, setStatusFilter] = useState<'全部' | '启用' | '停用'>('全部')

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<TheoryExamRecord | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickedCategory, setPickedCategory] = useState('理论考试')
  const [pickedMode, setPickedMode] = useState('统一考试')

  const filtered = exams.filter((e) => {
    if (kw && !e.name.includes(kw)) return false
    if (statusFilter === '启用') return e.enabled !== false
    if (statusFilter === '停用') return e.enabled === false
    return true
  })

  const openCreate = () => {
    setEditing(null)
    setPickedCategory('理论考试')
    setPickedMode('统一考试')
    setPickerOpen(true)
  }
  const handlePicked = (cat: string, mode: string) => {
    setPickedCategory(cat)
    setPickedMode(mode)
    setPickerOpen(false)
    setEditOpen(true)
  }
  const openEdit = (e: TheoryExamRecord) => {
    const cat = e.examType || '理论考试'
    const modes = PICKER_CATEGORIES.find((c) => c.key === cat)?.modes ?? []
    setEditing(e)
    setPickedCategory(cat)
    setPickedMode(modes.some((m) => m.value === e.pickerMode) ? (e.pickerMode as string) : (modes[0]?.value ?? '统一考试'))
    setEditOpen(true)
  }
  const handleSaved = (record: TheoryExamRecord) => {
    setExams((list) => {
      const exist = list.some((x) => x.id === record.id)
      return exist ? list.map((x) => (x.id === record.id ? record : x)) : [record, ...list]
    })
    setEditOpen(false)
    message.success('试卷已保存')
  }
  /** 启用 / 停用（试卷状态） */
  const handleToggleEnabled = (e: TheoryExamRecord) => {
    const next = e.enabled === false
    setExams((list) => list.map((x) => (x.id === e.id ? { ...x, enabled: next } : x)))
    message.success(next ? `已启用「${e.name}」` : `已停用「${e.name}」`)
  }
  const handleDelete = (e: TheoryExamRecord) => {
    setExams((list) => list.filter((x) => x.id !== e.id))
    message.success(`已删除「${e.name}」`)
  }

  // 按题型统计试卷题目数（拆分原“题目数量”列）
  const countByType = (r: TheoryExamRecord) => {
    const counts: Record<string, number> = { 单选题: 0, 多选题: 0, 判断题: 0, 填空题: 0, 简答题: 0, 实操题: 0 }
    buildPreviewPapers(r).forEach((p) => {
      p.items.forEach((q) => {
        if (q.type.includes('单选')) counts['单选题']++
        else if (q.type.includes('多选')) counts['多选题']++
        else if (q.type.includes('判断')) counts['判断题']++
        else if (q.type.includes('填空')) counts['填空题']++
        else if (q.type.includes('简答')) counts['简答题']++
        else counts['实操题']++
      })
    })
    return counts
  }
  // 试卷被引用次数（演示：基于 id 确定性派生）
  const quoteCountOf = (r: TheoryExamRecord) => {
    let h = 0
    for (const c of String(r.id)) h = (h * 31 + c.charCodeAt(0)) % 47
    return h
  }
  const TYPE_COLUMNS: TableColumnsType<TheoryExamRecord> = (['单选题', '多选题', '判断题', '填空题', '简答题', '实操题'] as const).map(
    (t) => ({
      title: t,
      key: `type-${t}`,
      width: 72,
      align: 'center' as const,
      render: (_: unknown, r: TheoryExamRecord) => countByType(r)[t] || 0,
    }),
  )

  const columns: TableColumnsType<TheoryExamRecord> = [
    {
      title: '序号', key: 'index', width: 64, align: 'center',
      render: (_: unknown, __: TheoryExamRecord, i: number) => i + 1,
    },
    {
      title: '试卷名称', dataIndex: 'name', width: 200, ellipsis: true,
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '试卷类型', dataIndex: 'examType', width: 110, align: 'center',
      render: (v?: string) =>
        v === '实操考试' ? <Tag color="geekblue">实操试卷</Tag> : <Tag color="blue">理论试卷</Tag>,
    },
    {
      title: '试卷说明', dataIndex: 'description', ellipsis: true,
      render: (v?: string) => v || <span style={{ color: 'rgba(0,0,0,0.3)' }}>—</span>,
    },
    {
      title: '总分', dataIndex: 'totalScore', key: 'totalScore', width: 80, align: 'center',
      render: (v: number) => (v == null ? '-' : v),
    },
    {
      title: '合格分', dataIndex: 'passScore', key: 'passScore', width: 90, align: 'center',
      render: (v: number) => (v == null ? '-' : v),
    },
    ...TYPE_COLUMNS,
    {
      title: '引用次数', key: 'quote', width: 90, align: 'center',
      render: (_: unknown, r: TheoryExamRecord) => quoteCountOf(r),
    },
    {
      title: '状态', dataIndex: 'enabled', width: 96, align: 'center',
      render: (v: boolean | undefined) => (v !== false ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>),
    },
    {
      title: '操作', key: 'action', width: 190, align: 'center', fixed: 'right' as const,
      render: (_: unknown, r: TheoryExamRecord) => (
        <Space size={4}>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openEdit(r)}>编辑</Button>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => handleToggleEnabled(r)}>
            {r.enabled !== false ? '停用' : '启用'}
          </Button>
          <Popconfirm title={`确定删除「${r.name}」？`} okText="确定删除" cancelText="再想想" onConfirm={() => handleDelete(r)}>
            <Button type="link" size="small" danger style={{ padding: 0 }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 16 }}>
      {/* 页头：标题 + 状态筛选 + 搜索 + 新建 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 16, background: '#1677ff', borderRadius: 2 }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>试卷维护</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ marginLeft: 8 }}>新建试卷</Button>
        </div>
        <Space>
          <Select
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '全部', label: '全部状态' },
              { value: '启用', label: '启用' },
              { value: '停用', label: '停用' },
            ]}
          />
          <Input
            placeholder="搜索试卷名称"
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            style={{ width: 200 }}
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            allowClear
          />
        </Space>
      </div>

      <Table<TheoryExamRecord>
        rowKey="id"
        size="small"
        dataSource={filtered}
        columns={columns}
        scroll={{ x: 1400 }}
        locale={{ emptyText: <Empty description="暂无试卷" /> }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          position: ['bottomLeft'],
        }}
      />

      {/* 新建 / 编辑试卷（整页表单，仅试卷相关区块） */}
      <Drawer
        title={null}
        closable={false}
        placement="right"
        width={1333}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        styles={{ body: { padding: 0 } }}
        destroyOnClose
      >
        <TheoryExamForm
          variant="paper"
          initial={editing}
          examType={pickedCategory}
          pickerMode={pickedMode}
          onBack={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      </Drawer>

      {/* 选择出题方式（新建考试 / 新建试卷第一步） */}
      <PickerModal
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        onConfirm={handlePicked}
      />

    </div>
  )
}

// ===== 考试卡片 =====
// ===== 考试卡片 =====
/** 卡片信息行：图标 + 标签 + 值 */
const InfoLine: React.FC<{ icon: React.ReactNode; label: string; value?: React.ReactNode }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: '22px' }}>
    <span style={{ color: '#b8bcc4', fontSize: 14, display: 'inline-flex', flexShrink: 0 }}>{icon}</span>
    <span style={{ width: 52, flexShrink: 0, fontSize: 12.5, color: 'rgba(0,0,0,0.45)' }}>{label}</span>
    <span style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.85)' }}>{value}</span>
  </div>
)

const HairLine: React.FC = () => <div style={{ height: 1, background: '#f0f0f0' }} />

/** 试卷数量：显式指定优先；否则按出题方式推导（AB组卷 = 2 套 A/B 卷，其余 = 1 套） */
const paperCountOf = (r: TheoryExamRecord): number => r.paperCount ?? (r.pickerMode === 'AB组卷' ? 2 : 1)

// ===== 考试卡片（开启考试） =====
/**
 * 考试卡片：展示考试生命周期状态（未发布 / 未开始 / 进行中 / 已结束 / 已中止）与运营操作。
 * 试卷本身（名称 / 说明 / 组卷与试题 / 录屏录像）在「试卷维护」中维护；
 * 编辑按钮用于维护考试安排、预约设置、考官出分等运营配置。
 */
export const ExamCard: React.FC<{
  record: TheoryExamRecord
  onEdit: () => void
  onCandidate: () => void
  onExaminer: () => void
  onNotice: () => void
  onReport: () => void   // 成绩单：查看该考试的考生答卷
  onCopy: () => void
  onDelay: () => void
  onAbort: () => void
  onPublish: () => void
  onCancelPublish: () => void
}> = ({ record, onEdit, onCandidate, onExaminer, onNotice, onReport, onCopy, onDelay, onAbort, onPublish, onCancelPublish }) => {
  const displayStatus = computeExamStatus(record)
  const st = STATUS_STYLE[displayStatus]
  const published = displayStatus !== '未发布'
  // 进行中 / 终态 不允许取消发布
  const cancelDisabled = displayStatus === '进行中' || TERMINAL_STATUS.includes(displayStatus)
  // 终态（已结束 / 已归档 / 已中止）不允许延期 / 中止
  const execDisabled = TERMINAL_STATUS.includes(displayStatus)

  const linkBtn = (label: string, onClick: () => void, opts?: { danger?: boolean; disabled?: boolean }) => (
    <Button
      type="link"
      size="small"
      disabled={opts?.disabled}
      onClick={onClick}
      style={{ padding: 0, height: 22, fontSize: 13, color: opts?.danger && !opts?.disabled ? '#ff4d4f' : undefined }}
    >
      {label}
    </Button>
  )

  // 「更多」下拉：考官管理 / 考试须知 / 成绩单 / 复制 / 延期 / 中止 / 发布 / 取消
  const moreItems: MenuProps['items'] = [
    { key: 'examiner', label: '考官管理' },
    { key: 'notice', label: '考试须知' },
    { key: 'report', label: '成绩单' },
    { type: 'divider' },
    { key: 'copy', label: '复制' },
    { type: 'divider' },
    { key: 'delay', label: '延期', disabled: execDisabled },
    { key: 'abort', label: '中止', danger: true, disabled: execDisabled },
    { key: 'publish', label: '发布', disabled: published },
    { key: 'cancel', label: '取消', danger: true, disabled: !published || cancelDisabled },
  ]

  const handleMoreClick = ({ key }: { key: string }) => {
    if (key === 'examiner') onExaminer()
    else if (key === 'notice') onNotice()
    else if (key === 'report') onReport()
    else if (key === 'copy') onCopy()
    else if (key === 'delay') onDelay()
    else if (key === 'abort') onAbort()
    else if (key === 'publish') onPublish()
    else if (key === 'cancel') onCancelPublish()
  }

  return (
    <div
      style={{
        position: 'relative',
        width: 340,
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        padding: 18,
        background: '#ffffff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 左上角状态角标（斜向三角） */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 57,
          height: 57,
          background: st.ribbonBg,
          clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 17,
            top: 17,
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            color: st.ribbonText,
            fontSize: 11,
            fontWeight: 500,
            lineHeight: '14px',
            letterSpacing: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {displayStatus}
        </span>
      </div>

      {/* 标题（右移避开角标） */}
      <div style={{ paddingLeft: 38 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(0,0,0,0.88)', lineHeight: '22px' }}>
          {record.name}
        </div>
        {/* 考试分类 */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Tag style={{ margin: 0, fontSize: 12, lineHeight: '20px', color: '#1677ff', background: '#f5faff', borderColor: '#91caff', borderRadius: 4 }}>
            {record.category}
          </Tag>
        </div>
      </div>

      <div style={{ margin: '14px 0' }}>
        <HairLine />
      </div>

      {/* 信息列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <InfoLine icon={<FileTextOutlined />} label="试卷数量" value={`${paperCountOf(record)} 套`} />
        <InfoLine icon={<CalendarOutlined />} label="考试时间" value={record.examTime ?? '—'} />
        <InfoLine icon={<FieldTimeOutlined />} label="考试时长" value={record.duration ?? '—'} />
        <InfoLine icon={<ClockCircleOutlined />} label="报名截止" value={record.enrollDeadline ?? '—'} />
        <InfoLine icon={<TeamOutlined />} label="考生数量" value={`${record.examined ?? 0}/${record.enrolled ?? 0}人`} />
      </div>

      {/* 操作按钮：编辑 / 考生管理 / 更多（靠卡片右侧显示） */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '4px 14px' }}>
        {linkBtn('编辑', onEdit)}
        {linkBtn('考生管理', onCandidate)}
        <Dropdown trigger={['click']} menu={{ items: moreItems, onClick: handleMoreClick }}>
          <Button type="link" size="small" style={{ padding: 0, height: 22, fontSize: 13 }}>
            更多 <DownOutlined style={{ fontSize: 10 }} />
          </Button>
        </Dropdown>
      </div>
    </div>
  )
}


// ===== 发布考试（右侧抽屉表单） =====
/** 表单锚点：paper=试卷维护（仅试卷相关）；exam=开启考试（其余运营配置） */
const FORM_ANCHORS: Record<'paper' | 'exam', string[]> = {
  paper: ['试卷信息', '组卷与试题', '录屏录像'],
  exam: ['基本信息', '考试安排', '考官出分', '预约设置'],
}

const QUESTION_TYPE_ROWS = [
  { type: '单选题', count: 24, per: 2 },
  { type: '多选题', count: 5, per: 4 },
  { type: '判断题', count: 8, per: 2 },
  { type: '填空题', count: 5, per: 2 },
  { type: '简答题', count: 2, per: 3 },
]

/** 各题型 1~5 星可选题量（null 表示该难度无题） */
const DIFFICULTY_POOL: Record<string, (number | null)[]> = {
  单选题: [2, 15, 7, null, null],
  多选题: [null, 5, 1, null, null],
  判断题: [1, 5, null, null, null],
  填空题: [null, 6, null, null, null],
  简答题: [null, 4, 2, null, null],
  实操题: [5, 10, 5, null, null],
}

/** 各分类在 1~5 星上的题目分布权重，用于把「题型-星级」的题量拆分到各分类 */
const CATEGORY_STAR_WEIGHT: Record<string, number[]> = {
  抢救技能: [0, 1, 3, 3, 2],
  常规理论: [2, 3, 2, 1, 0],
  基础护理: [3, 3, 1, 0, 0],
  专科护理: [0, 2, 3, 2, 1],
  内科诊疗: [0, 2, 3, 2, 1],
  外科诊疗: [0, 1, 3, 3, 2],
  护理安全: [2, 2, 1, 0, 0],
  核心制度: [1, 2, 1, 0, 0],
}

/** 把某星级的总题量按权重拆分到各分类（最大余数法，保证各分类之和 === total） */
const distributeToCategories = (total: number, level: number): Record<string, number> => {
  const weights = EXAM_CATEGORIES.map((c) => CATEGORY_STAR_WEIGHT[c]?.[level - 1] ?? 0)
  const sumW = weights.reduce((s, w) => s + w, 0)
  const result: Record<string, number> = {}
  if (sumW === 0) {
    EXAM_CATEGORIES.forEach((c, i) => { result[c] = i === 0 ? total : 0 })
    return result
  }
  const raw = weights.map((w) => (total * w) / sumW)
  const floors = raw.map((r) => Math.floor(r))
  EXAM_CATEGORIES.forEach((c, i) => { result[c] = floors[i] })
  let rest = total - floors.reduce((s, v) => s + v, 0)
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac)
  for (const { i } of order) {
    if (rest <= 0) break
    result[EXAM_CATEGORIES[i]] += 1
    rest -= 1
  }
  return result
}

/**
 * 「题型 → 星级 → 分类」可选题量：由 DIFFICULTY_POOL 拆分而来。
 * null 表示该难度无题；各分类之和恒等于该题型的难度题量。
 */
const CATEGORY_STAR_POOL: Record<string, Record<number, Record<string, number> | null>> = Object.keys(
  DIFFICULTY_POOL,
).reduce<Record<string, Record<number, Record<string, number> | null>>>((acc, t) => {
  const perLevel: Record<number, Record<string, number> | null> = {}
  for (let lv = 1; lv <= 5; lv++) {
    const total = DIFFICULTY_POOL[t][lv - 1]
    perLevel[lv] = total === null || total === undefined ? null : distributeToCategories(total, lv)
  }
  acc[t] = perLevel
  return acc
}, {})

/** 取「题型 × 分类 × 星级」的可选题量（null 表示该难度无题） */
const categoryStarAvail = (type: string, category: string, level: number): number | null => {
  const byCat = CATEGORY_STAR_POOL[type]?.[level]
  if (byCat === null || byCat === undefined) return null
  return byCat[category] ?? 0
}

// ===== 手工出题：可选题目池（按题型 / 站点 + 题目分类） =====
interface QuestionLite {
  id: string
  type: string // 理论：题型；实操：站点
  category: string // 题目分类
  content: string
  score: number
}

const MANUAL_POOL: QuestionLite[] = (() => {
  const list: QuestionLite[] = []
  // 理论题目（按题型 × 题目分类）
  ;(['单选题', '多选题', '判断题', '填空题', '简答题'] as const).forEach((t) => {
    EXAM_CATEGORIES.forEach((c, ci) => {
      for (let i = 0; i < 2; i++) {
        list.push({
          id: `T-${t}-${c}-${i}`,
          type: t,
          category: c,
          content: `[${c}]（${t}）示例考点 ${ci * 2 + i + 1}：关于${c}的相关内容，请按题目要求作答。`,
          score: t === '单选题' ? 5 : t === '多选题' ? 10 : t === '判断题' ? 5 : t === '填空题' ? 5 : 10,
        })
      }
    })
  })
  // 实操题目（按站点 × 题目分类）
  STATION_NAMES.forEach((s) => {
    EXAM_CATEGORIES.forEach((c, ci) => {
      for (let i = 0; i < 2; i++) {
        list.push({
          id: `P-${s}-${c}-${i}`,
          type: s,
          category: c,
          content: `[${s}]（${c}）实操考核项 ${ci * 2 + i + 1}：请现场完成${c}相关操作，由考官依评分细则评分。`,
          score: 10,
        })
      }
    })
  })
  return list
})()

// 实操题目池（D 列按站点录入，实操考试统一归为「实操题」时取全部）
const PRACTICE_POOL = MANUAL_POOL.filter((q) => STATION_NAMES.includes(q.type))
// 按 题型 / 站点 取可选题目池
const getManualPool = (rtype: string) =>
  rtype === '实操题' ? PRACTICE_POOL : MANUAL_POOL.filter((q) => q.type === rtype)

// ===== 试卷预览：根据出题方式确定性生成预览试卷（mock 演示数据） =====
export interface PreviewQuestion {
  no: number
  type: string // 题型 / 站点
  category: string // 题目分类
  content: string
  score: number
  answer: string // 参考答案（预览可切换隐藏）
  options?: string[] // 客观题选项（判断题为 正确 / 错误）
  myAnswer?: string // 考生作答（仅传入 answerSeed 时生成）
}
export interface PreviewPaper {
  label: string // 试卷 / A 卷 / B 卷 / 模拟试卷
  simulated: boolean // 千人千卷标记为模拟
  items: PreviewQuestion[]
}

// 客观题干扰项素材（mock 演示，按题号确定性轮换）
const DISTRACTOR_POOL = [
  '立即终止操作并上报主管医师',
  '按常规流程处理即可，无需特殊干预',
  '视患者具体情况由医师判断决定',
  '仅需密切观察，暂不作特殊处理',
  '以上说法均正确',
  '以上说法均不正确',
  '24 小时内完成书面记录并上报',
  '由科室负责人单独研究决定',
]
/** 客观题选项：单选 / 多选 4 个选项，判断题为 正确 / 错误 */
const buildOptions = (type: string, idx: number): string[] | null => {
  if (type === '判断题') return ['正确', '错误']
  if (type !== '单选题' && type !== '多选题') return null
  return [0, 1, 2, 3].map((i) => DISTRACTOR_POOL[(idx * 3 + i) % DISTRACTOR_POOL.length])
}
/** 考生作答（mock）：客观题按种子确定性作答，约两成答错；主观题给一段作答文本 */
const buildMyAnswer = (type: string, category: string, standard: string, no: number, seed: number): string => {
  const objective = OBJECTIVE_TYPES.includes(type)
  if (!objective) {
    return `针对${category}，本人认为核心要点为：① 严格按操作规程执行；② 做好过程记录与双人核对；③ 发现异常立即上报并及时处理。`
  }
  const wrong = (no * 7 + seed) % 5 === 0
  if (!wrong) return standard
  if (type === '判断题') return standard === '正确' ? '错误' : '正确'
  if (type === '单选题') return String.fromCharCode(65 + ((standard.charCodeAt(0) - 65 + 1) % 4))
  const letters = standard.split('、')
  return letters.slice(0, Math.max(1, letters.length - 1)).join('、')
}
// 依据题型 / 站点，确定性合成参考答案（mock 演示）
const buildAnswer = (type: string, category: string, idx: number): string => {
  switch (type) {
    // 客观题参考答案就是选项字母 / 选项内容，用于与选项对照
    case '单选题':
      return String.fromCharCode(65 + (idx % 4))
    case '多选题':
      return ['A', 'B', 'C', 'D'].slice(0, 2 + (idx % 3)).join('、')
    case '判断题':
      return idx % 2 === 0 ? '正确' : '错误'
    case '填空题':
      return `（${category}）关键要点填空`
    case '简答题':
      return `要点：${category}相关核心知识点（①②③…）`
    default:
      return `依评分细则现场评定（站点：${type}）`
  }
}
// 依据考试类型 / 出题方式，确定性地生成预览试卷
// answerSeed 非空时为「考生视角」：额外生成考生作答（客观题约两成答错）
export const buildPreviewPapers = (record: TheoryExamRecord, answerSeed?: string): PreviewPaper[] => {
  const isPractice = record.examType === '实操考试'
  const dims: string[] = isPractice ? STATION_NAMES : QUESTION_TYPE_ROWS.map((r) => r.type)
  const countOf = (dim: string) => (isPractice ? 5 : QUESTION_TYPE_ROWS.find((r) => r.type === dim)?.count ?? 3)
  const seed = answerSeed ? hashSeed(answerSeed) % 97 : 0
  // offsetBase 不同 → 不同试卷（AB 组卷 A/B 卷差异；千人千卷/统一用不同偏移避免雷同）
  const make = (offsetBase: number): PreviewQuestion[] => {
    const items: PreviewQuestion[] = []
    let globalNo = 0
    dims.forEach((dim, di) => {
      const pool = MANUAL_POOL.filter((q) => q.type === dim)
      const cnt = countOf(dim)
      const off = offsetBase + di * 5
      for (let i = 0; i < cnt; i++) {
        const q = pool.length ? pool[(i + off) % pool.length] : null
        const cat = q?.category ?? '—'
        globalNo += 1
        const answer = buildAnswer(dim, cat, globalNo)
        items.push({
          no: globalNo,
          type: dim,
          category: cat,
          content: q?.content ?? `${dim} 示例题目 ${i + 1}`,
          score: q?.score ?? 5,
          answer,
          options: buildOptions(dim, globalNo) ?? undefined,
          myAnswer: answerSeed ? buildMyAnswer(dim, cat, answer, globalNo, seed) : undefined,
        })
      }
    })
    return items
  }
  if (record.pickerMode === 'AB组卷') {
    return [
      { label: 'A 卷', simulated: false, items: make(0) },
      { label: 'B 卷', simulated: false, items: make(7) },
    ]
  }
  if (record.pickerMode === '千人千卷') {
    return [{ label: '模拟试卷', simulated: true, items: make(3) }]
  }
  // 统一考试 / 手工出题：均为单张试卷
  return [{ label: '试卷', simulated: false, items: make(0) }]
}

// ===== 试卷预览抽屉（试卷维护 / 开启考试共用） =====
export const PreviewDrawer: React.FC<{
  exam: TheoryExamRecord | null
  onClose: () => void
  /** 考生侧（如考试中心「查看答卷」）：强制不显示正确答案，且不再提供「不显示答案」开关 */
  hideAnswerAlways?: boolean
  /** 非空时为「考生视角」：生成考生作答（客观题约两成答错） */
  answerSeed?: string
}> = ({ exam, onClose, hideAnswerAlways = false, answerSeed }) => {
  const [hideAnswer, setHideAnswer] = useState(false)
  useEffect(() => {
    if (exam) setHideAnswer(hideAnswerAlways)
  }, [exam, hideAnswerAlways])

  const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  const renderPaper = (paper: PreviewPaper) => {
    // 按维度（题型 / 站点）分组
    const groups: { dim: string; items: PreviewQuestion[] }[] = []
    paper.items.forEach((q) => {
      const g = groups.find((x) => x.dim === q.type)
      if (g) g.items.push(q)
      else groups.push({ dim: q.type, items: [q] })
    })
    const isPractice = exam?.examType === '实操考试'
    const total = paper.items.length
    const totalScore = paper.items.reduce((s, q) => s + q.score, 0)
    return (
      <div>
        {paper.simulated && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, color: '#d46b08', fontSize: 13 }}>
            模拟试卷：千人千卷模式下每位考生实时随机抽取、一人一套，以下为模拟样例。
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
          <span>考试类型：{exam?.examType ?? '理论考试'}</span>
          <span>出题方式：{exam?.pickerMode ?? '统一考试'}</span>
          <span>题量：{total} 题</span>
          <span>总分：{totalScore} 分</span>
          <span>时长：{exam?.duration ?? '—'}</span>
        </div>
        <div style={{ maxHeight: 460, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
          {groups.map((g, gi) => {
            const gScore = g.items.reduce((s, q) => s + q.score, 0)
            return (
              <div key={g.dim} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>
                  {CN_NUM[gi] ?? gi + 1}、{isPractice ? '站点' : '题型'}：{g.dim}（共 {g.items.length} 题，计 {gScore} 分）
                </div>
                {g.items.map((q) => {
                  const objective = OBJECTIVE_TYPES.includes(q.type)
                  const mineLetters = (q.myAnswer ?? '').split('、')
                  const answered = q.myAnswer != null && q.myAnswer !== ''
                  const correct = answered && q.myAnswer === q.answer
                  return (
                    <div key={q.no} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px dashed #f0f0f0' }}>
                      <span style={{ flexShrink: 0, fontWeight: 600, color: '#1677ff', width: 22 }}>{q.no}.</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, lineHeight: '22px', color: '#1a1a1a' }}>{q.content}</div>

                        {/* 客观题：显示 4 个选项；标准答案（+考生所选）高亮 */}
                        {q.options && (
                          <div style={{ margin: '6px 0', fontSize: 12, lineHeight: 1.9, color: 'rgba(0,0,0,0.75)' }}>
                            {q.options.map((opt, oi) => {
                              const letter = String.fromCharCode(65 + oi)
                              const isMine = mineLetters.includes(letter)
                              const isStd = q.answer.split('、').includes(letter)
                              let color: string | undefined
                              let bg: string | undefined
                              if (isMine && isStd) {
                                color = '#389e0d'
                                bg = '#f6ffed'
                              } else if (isMine) {
                                color = '#cf1322'
                                bg = '#fff2f0'
                              } else if (!hideAnswer && isStd) {
                                color = '#389e0d'
                              }
                              return (
                                <div
                                  key={letter}
                                  style={{
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    marginBottom: 2,
                                    color,
                                    background: bg,
                                    fontWeight: isMine ? 600 : 400,
                                  }}
                                >
                                  {letter}. {opt}
                                  {isMine && (
                                    <Tag
                                      color="blue"
                                      style={{ marginInlineStart: 6, fontSize: 11, lineHeight: '16px' }}
                                    >
                                      考生选择
                                    </Tag>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <div style={{ marginTop: 2 }}>
                          <Tag style={{ marginInlineEnd: 6 }}>{q.category}</Tag>
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{q.score} 分</span>
                          {/* 管理侧预览才判对错；考生查看答卷不暴露答案正确性 */}
                          {!hideAnswer && answered && (
                            <Tag color={correct ? 'success' : 'error'} style={{ marginInlineStart: 6 }}>
                              {correct ? '回答正确' : '回答错误'}
                            </Tag>
                          )}
                        </div>

                        {!hideAnswer && (
                          <div style={{ marginTop: 4, fontSize: 12, color: '#389e0d' }}>参考答案：{q.answer}</div>
                        )}

                        {/* 考生作答：客观题显示所选选项，主观题显示作答文本 */}
                        {answered && (
                          objective ? (
                            <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>
                              考生作答：<b style={{ color: '#cf1322' }}>{q.myAnswer}</b>
                            </div>
                          ) : (
                            <div
                              style={{
                                marginTop: 4,
                                padding: '8px 10px',
                                background: '#fafafa',
                                border: '1px solid #f0f0f0',
                                borderRadius: 6,
                                fontSize: 12,
                                color: 'rgba(0,0,0,0.85)',
                                lineHeight: 1.8,
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              <div style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>考生作答：</div>
                              {q.myAnswer}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Drawer
      title={exam ? `试卷预览 - ${exam.name}` : '试卷预览'}
      placement="right"
      width={760}
      open={!!exam}
      onClose={onClose}
      destroyOnClose
    >
      {exam && (
        <div>
          {!hideAnswerAlways && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>不显示答案</span>
              <Switch checked={hideAnswer} onChange={(v) => setHideAnswer(v)} />
            </div>
          )}
          {(() => {
            const papers = buildPreviewPapers(exam, answerSeed)
            return papers.length > 1 ? (
              <Tabs items={papers.map((p) => ({ key: p.label, label: p.label, children: renderPaper(p) }))} />
            ) : (
              renderPaper(papers[0])
            )
          })()}
        </div>
      )}
    </Drawer>
  )
}

/** 出题方式选项（新建考试时先选择）：按考试类型分组 */
const PICKER_CATEGORIES: {
  key: string
  desc: string
  modes: {
    value: string
    features: string[]
    scene: string
    icon: React.ReactNode
    accent: string
    tint: string
  }[]
}[] = [
  {
    key: '理论考试',
    desc: '以客观题 / 主观题笔试形式组织的考试，支持统一卷、分组卷与个性化抽题。',
    modes: [
      {
        value: '统一考试',
        features: ['发布时即锁定试卷', '全体考生同卷同序'],
        scene: '年度资质考核、统一结业考试',
        icon: <FileTextOutlined />,
        accent: '#3b7cf6',
        tint: '#eef4ff',
      },
      {
        value: 'AB组卷',
        features: ['按 A/B 组随机组卷', '全体考生按组抽卷'],
        scene: '大规模正式考核、竞赛选拔',
        icon: <CopyOutlined />,
        accent: '#7b61ff',
        tint: '#f2f0ff',
      },
      {
        value: '千人千卷',
        features: ['考试时实时抽题，一人一套', '题库更新即时生效'],
        scene: '练习自测、随堂随考',
        icon: <ThunderboltOutlined />,
        accent: '#0fb5a6',
        tint: '#e9faf8',
      },
      {
        value: '手工出题',
        features: ['逐题手工指定', '全体考生同卷'],
        scene: '专题小测、指定范围考核',
        icon: <EditOutlined />,
        accent: '#f0912a',
        tint: '#fff5e8',
      },
    ],
  },
  {
    key: '实操考试',
    desc: '以技能操作形式组织的考核，支持统一流程、分组轮换与个性化抽题。',
    modes: [
      {
        value: '统一考试',
        features: ['统一评分标准', '全体考生同流程'],
        scene: '统一技能资质考核',
        icon: <FileTextOutlined />,
        accent: '#3b7cf6',
        tint: '#eef4ff',
      },
      {
        value: 'AB组卷',
        features: ['分组轮换考核', '全体考生按组抽卷'],
        scene: '大规模技能考核',
        icon: <CopyOutlined />,
        accent: '#7b61ff',
        tint: '#f2f0ff',
      },
      {
        value: '千人千卷',
        features: ['实时抽题，一人一套', '题库更新即时生效'],
        scene: '技能抽考、随堂考核',
        icon: <ThunderboltOutlined />,
        accent: '#0fb5a6',
        tint: '#e9faf8',
      },
      {
        value: '手工出题',
        features: ['逐题手工指定', '统一考核标准'],
        scene: '专题技能考核',
        icon: <EditOutlined />,
        accent: '#f0912a',
        tint: '#fff5e8',
      },
    ],
  },
]

/**
 * 选择出题方式弹窗（试卷维护「新建试卷」/ 开启考试「新建考试」共用）
 * 第一步选考试类型（理论考试 / 实操考试），第二步选出题方式（统一考试 / AB组卷 / 千人千卷 / 手工出题）。
 * 出题方式创建后不可更改。
 */
export const PickerModal: React.FC<{
  open: boolean
  onCancel: () => void
  onConfirm: (category: string, mode: string) => void
}> = ({ open, onCancel, onConfirm }) => {
  const firstMode = (cat: string) => PICKER_CATEGORIES.find((c) => c.key === cat)?.modes[0]?.value ?? '统一考试'
  const [pickedCategory, setPickedCategory] = useState('理论考试')
  const [pickedMode, setPickedMode] = useState(firstMode('理论考试'))
  const [hoverMode, setHoverMode] = useState<string | null>(null)

  // 每次打开重置为默认选项
  useEffect(() => {
    if (open) {
      setPickedCategory('理论考试')
      setPickedMode(firstMode('理论考试'))
      setHoverMode(null)
    }
  }, [open])

  return (
    <Modal
      title="选择出题方式"
      open={open}
      onCancel={onCancel}
      onOk={() => onConfirm(pickedCategory, pickedMode)}
      okText="下一步"
      cancelText="取消"
      width={1600}
      destroyOnClose
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8a9099', marginBottom: 18 }}>
        <InfoCircleOutlined style={{ color: '#b6bcc4' }} />
        出题方式在创建后不可更改，请先选择考试类型，再选择对应的出题方式。
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
        {/* 左侧：考试类型卡片 */}
        <div style={{ width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PICKER_CATEGORIES.map((c) => {
            const active = pickedCategory === c.key
            return (
              <div
                key={c.key}
                onClick={() => {
                  setPickedCategory(c.key)
                  setPickedMode(c.modes[0].value)
                }}
                style={{
                  cursor: 'pointer',
                  borderRadius: 14,
                  padding: '20px 18px',
                  background: active ? '#f8fbff' : '#fff',
                  border: active ? '1.5px solid #3b7cf6' : '1px solid #eef0f3',
                  boxShadow: active
                    ? '0 12px 28px rgba(59,124,246,0.16)'
                    : '0 1px 3px rgba(15,23,42,0.04)',
                  transition: 'all .22s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2329' }}>{c.key}</span>
                  {active && <CheckOutlined style={{ color: '#3b7cf6', fontSize: 15 }} />}
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: '#8a9099' }}>{c.desc}</div>
              </div>
            )
          })}
        </div>

        {/* 右侧：出题方式选项 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 12 }}>
            {pickedCategory} · 请选择出题方式
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${PICKER_CATEGORIES.find((c) => c.key === pickedCategory)?.modes.length ?? 4}, 1fr)`,
              gap: 18,
            }}
          >
            {PICKER_CATEGORIES.find((c) => c.key === pickedCategory)?.modes.map((m) => {
              const active = pickedMode === m.value
              const hovered = hoverMode === m.value && !active
              return (
                <div
                  key={m.value}
                  onClick={() => setPickedMode(m.value)}
                  onMouseEnter={() => setHoverMode(m.value)}
                  onMouseLeave={() => setHoverMode(null)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 344,
                    padding: '22px 18px 18px',
                    cursor: 'pointer',
                    borderRadius: 14,
                    background: active ? '#f8fbff' : '#fff',
                    border: active ? `1.5px solid ${m.accent}` : '1px solid #eef0f3',
                    boxShadow: active
                      ? `0 12px 28px ${m.accent}26, 0 2px 6px rgba(15,23,42,0.05)`
                      : hovered
                        ? '0 10px 22px rgba(15,23,42,0.09)'
                        : '0 1px 3px rgba(15,23,42,0.04)',
                    transition: 'all .22s ease',
                  }}
                >
                  {/* 顶部：图标 + 名称 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        flexShrink: 0,
                        borderRadius: 13,
                        background: m.tint,
                        color: m.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                      }}
                    >
                      {m.icon}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2329', letterSpacing: 0.2 }}>{m.value}</div>
                  </div>
                  {/* 特性 */}
                  <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {m.features.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#4e5561' }}>
                        <span
                          style={{
                            flexShrink: 0,
                            width: 15,
                            height: 15,
                            marginTop: 3,
                            borderRadius: '50%',
                            background: m.tint,
                            color: m.accent,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                          }}
                        >
                          <CheckOutlined />
                        </span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {/* 推荐场景 */}
                  <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                    <div style={{ borderRadius: 9, background: '#f8f9fb', border: '1px solid #f1f2f5', padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: '#a3a9b3', marginBottom: 4, letterSpacing: 0.5 }}>推荐场景</div>
                      <div style={{ fontSize: 12, color: '#5a616b', lineHeight: 1.6 }}>{m.scene}</div>
                    </div>
                  </div>
                  {/* 选中标记 */}
                  {active && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: 34,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: m.accent,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        boxShadow: `0 3px 8px ${m.accent}66`,
                      }}
                    >
                      <CheckOutlined />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export const TheoryExamForm: React.FC<{
  initial: TheoryExamRecord | null
  examType: string
  pickerMode: string
  /** paper=试卷维护（试卷信息 / 组卷与试题 / 录屏录像）；exam=开启考试（基本 / 安排 / 预约 / 考官出分） */
  variant?: 'paper' | 'exam'
  readOnly?: boolean
  onBack: () => void
  onSaved: (record: TheoryExamRecord) => void
}> = ({ initial, examType, pickerMode, variant = 'paper', readOnly = false, onBack, onSaved }) => {
  const isPaper = variant === 'paper'
  const ANCHORS = FORM_ANCHORS[variant]
  const [activeAnchor, setActiveAnchor] = useState(ANCHORS[0])
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? undefined)
  const [remark, setRemark] = useState(initial?.description ?? '')
  // 基本信息扩展：学时 / 学分 / 所属年度
  const [studyHours, setStudyHours] = useState<number | null>(initial?.studyHours ?? null)
  const [credits, setCredits] = useState<number | null>(initial?.credits ?? null)
  const [belongYear, setBelongYear] = useState<string>(initial?.belongYear ?? String(dayjs().year()))
  // 关联考试科目：直接选择标记内容（如三基三严）
  const [planTag, setPlanTag] = useState<string | undefined>(initial?.planTag)
  const [period, setPeriod] = useState<ExamPeriod>(initial?.period ?? '统一时段')
  const [allowQuit, setAllowQuit] = useState(false)
  const [lateBlockOn, setLateBlockOn] = useState(false)
  // 考试安排：节点安排（多条）；新建考试（无 initial）时默认自动添加一个节点
  const makeSchedule = (): ExamScheduleItem => ({
    id: `s${Date.now()}`,
    node: '',
    paperId: undefined,
    range: null,
    limitHours: null,
    limitMinutes: null,
  })
  const [examSchedules, setExamSchedules] = useState<ExamScheduleItem[]>(
    initial?.schedules ?? (isPaper ? [] : [makeSchedule()]),
  )
  const updateSchedule = (id: string, patch: Partial<ExamScheduleItem>) =>
    setExamSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const addSchedule = () => setExamSchedules((prev) => [...prev, makeSchedule()])
  const removeSchedule = (id: string) => setExamSchedules((prev) => prev.filter((s) => s.id !== id))

  // ===== 本轮考试总分 / 合格分 / 合格标识（开启考试-编辑） =====
  /** 本轮考试总分：自动合计上方各节点所选试卷的总分 */
  const roundTotalScore = useMemo(
    () =>
      examSchedules.reduce((s, item) => {
        const paper = INITIAL_EXAMS.find((e) => e.id === item.paperId)
        return s + (paper?.totalScore ?? 0)
      }, 0),
    [examSchedules],
  )
  /** 本轮合格分：各试卷合格分合计，可由用户手工修改；改动后不再随节点自动覆盖 */
  const [roundPassScore, setRoundPassScore] = useState<number | null>(
    initial?.roundPassScore ?? null,
  )
  const [roundPassTouched, setRoundPassTouched] = useState(initial?.roundPassScore != null)
  const roundPassSuggest = useMemo(
    () =>
      examSchedules.reduce((s, item) => {
        const paper = INITIAL_EXAMS.find((e) => e.id === item.paperId)
        return s + (paper?.passScore ?? 0)
      }, 0),
    [examSchedules],
  )
  useEffect(() => {
    if (!roundPassTouched) setRoundPassScore(roundPassSuggest)
  }, [roundPassSuggest, roundPassTouched])
  /** 合格标识：各试卷均达到合格分 / 达到总合格分（默认各试卷均达到合格分） */
  const [passRule, setPassRule] = useState<string>(initial?.passRule ?? '各试卷均达到合格分')
  const [groupCount, setGroupCount] = useState<number | null>(null)
  const [byMajor, setByMajor] = useState<boolean>(initial?.byMajor ?? false)
  const [randomWhenInsufficient, setRandomWhenInsufficient] = useState<boolean>(initial?.randomWhenInsufficient ?? false)
  const [closeAfterPass, setCloseAfterPass] = useState<boolean>(initial?.closeAfterPass ?? true)
  // 实操考试：配选维度统一为「题型 / 实操题」（仅一行）；理论考试：按题型分行
  const isPractice = examType === '实操考试'
  const ACTIVE_TYPE_ROWS: { type: string; count: number; per: number }[] = isPractice
    ? [{ type: '实操题', count: 5, per: 10 }]
    : QUESTION_TYPE_ROWS
  const [scoreRows, setScoreRows] = useState(ACTIVE_TYPE_ROWS)
  /** 题目分类（必填）：抽题配比弹窗仅展示此处已选分类 */
  const [paperCats, setPaperCats] = useState<string[]>(initial?.categories ?? [])
  /** 抽题配比矩阵：题型 → 分类 → [1星..5星] 各星级抽题数量 */
  const [matrixRatio, setMatrixRatio] = useState<Record<string, Record<string, number[]>>>({})
  const [ratioModal, setRatioModal] = useState<{ open: boolean; target: string | null }>({ open: false, target: null })
  const [diffTarget, setDiffTarget] = useState<string>(scoreRows[0]?.type ?? '')
  // 读取 / 写入「题型 × 分类 × 星级」单元格
  const cellValue = (type: string, category: string, level: number) =>
    matrixRatio[type]?.[category]?.[level - 1] ?? 0
  const setCell = (type: string, category: string, level: number, v: number) =>
    setMatrixRatio((p) => {
      const row = [...(p[type]?.[category] ?? [0, 0, 0, 0, 0])]
      row[level - 1] = v
      return { ...p, [type]: { ...(p[type] ?? {}), [category]: row } }
    })

  // 手工出题：手动选题（按题型 / 站点 → 已选题目 id 列表）
  const [manualSelected, setManualSelected] = useState<Record<string, string[]>>({})
  const [manualModal, setManualModal] = useState<{ open: boolean; target: string | null; keyword: string; checked: string[] }>({
    open: false,
    target: null,
    keyword: '',
    checked: [],
  })
  const [manualLeftPage, setManualLeftPage] = useState(1)   // 题目列表分页
  const [manualRightPage, setManualRightPage] = useState(1) // 已选择分页

  // ===== 考官出分 =====
  const [anonymousReview, setAnonymousReview] = useState<boolean>(initial?.anonymousReview ?? false)
  const [reviewDays, setReviewDays] = useState<number | null>(initial?.reviewDays ?? 7)
  const [scoreTime, setScoreTime] = useState<dayjs.Dayjs | null>(
    initial?.scoreTime ? dayjs(initial.scoreTime, 'YYYY-MM-DD HH:mm:ss') : null,
  )
  const [objectiveMode, setObjectiveMode] = useState<string>(initial?.objectiveMode ?? '隐藏出分')
  const [subjectiveReviewers, setSubjectiveReviewers] = useState<number | null>(initial?.subjectiveReviewers ?? 1)
  const [subjectiveAvg, setSubjectiveAvg] = useState<boolean>(initial?.subjectiveAvg ?? true)
  const [subjectiveDropMax, setSubjectiveDropMax] = useState<boolean>(initial?.subjectiveDropMax ?? false)
  const [subjectiveDropMin, setSubjectiveDropMin] = useState<boolean>(initial?.subjectiveDropMin ?? false)
  const [subjectiveMaxDiff, setSubjectiveMaxDiff] = useState<number | null>(initial?.subjectiveMaxDiff ?? 20)

  // ===== 预约设置 =====
  const [allowBooking, setAllowBooking] = useState<boolean>(initial?.allowBooking ?? false)
  const [bookingStart, setBookingStart] = useState<dayjs.Dayjs | null>(
    initial?.bookingStart ? dayjs(initial.bookingStart, 'YYYY-MM-DD') : null,
  )
  const [bookingEnd, setBookingEnd] = useState<dayjs.Dayjs | null>(
    initial?.bookingEnd ? dayjs(initial.bookingEnd, 'YYYY-MM-DD') : null,
  )
  const [bookingLimit, setBookingLimit] = useState<boolean>(initial?.bookingLimit ?? false)
  const [bookingMax, setBookingMax] = useState<number | null>(initial?.bookingMax ?? 0)
  const [bookingMin, setBookingMin] = useState<number | null>(initial?.bookingMin ?? 0)
  const [insufficientAction, setInsufficientAction] = useState<string>(initial?.insufficientAction ?? '正常考试')
  const [deferDays, setDeferDays] = useState<number | null>(initial?.deferDays ?? 1)
  const [allowCancelBooking, setAllowCancelBooking] = useState<boolean>(initial?.allowCancelBooking ?? false)
  const [cancelMaxTimes, setCancelMaxTimes] = useState<number | null>(initial?.cancelMaxTimes ?? 0)
  // ----- 限制条件（多选） -----
  const [limitPersonStatus, setLimitPersonStatus] = useState<string[]>(initial?.limitPersonStatus ?? [])
  const [limitTitle, setLimitTitle] = useState<string[]>(initial?.limitTitle ?? [])
  const [limitPersonCategory, setLimitPersonCategory] = useState<string[]>(initial?.limitPersonCategory ?? [])
  const [limitDept, setLimitDept] = useState<string[]>(initial?.limitDept ?? [])
  const [limitMajor, setLimitMajor] = useState<string[]>(initial?.limitMajor ?? [])

  // ===== 录屏录像 =====
  const [screenRecord, setScreenRecord] = useState<boolean>(initial?.screenRecord ?? false)
  const [practicalRecord, setPracticalRecord] = useState<boolean>(initial?.practicalRecord ?? false)
  const [audioRetention, setAudioRetention] = useState<number | null>(initial?.audioRetention ?? 6)

  const openRatio = (target: string | null) => {
    setDiffTarget(target ?? scoreRows[0]?.type ?? '')
    setRatioModal({ open: true, target })
  }
  const saveRatio = () => {
    message.success(`已保存「${diffTarget}」的抽题配比，共 ${sumMatrix(diffTarget)} 题`)
    setRatioModal((m) => ({ ...m, open: false }))
  }

  // 手工出题：打开「手动选题」弹窗（左侧查询 + 右侧已选）
  const openManual = (target: string) => {
    setManualLeftPage(1)
    setManualRightPage(1)
    setManualModal({ open: true, target, keyword: '', checked: [...(manualSelected[target] ?? [])] })
  }
  const toggleManual = (id: string) =>
    setManualModal((m) => ({ ...m, checked: m.checked.includes(id) ? m.checked.filter((x) => x !== id) : [...m.checked, id] }))
  const saveManual = () => {
    if (manualModal.target) {
      setManualSelected((p) => ({ ...p, [manualModal.target as string]: [...manualModal.checked] }))
      message.success(`已为「${manualModal.target}」选择 ${manualModal.checked.length} 题`)
    }
    setManualModal((m) => ({ ...m, open: false }))
  }

  // 某题型的抽题总量 = 配比矩阵（分类 × 星级）中「已选分类」所有单元格之和
  const sumMatrix = (type: string) => {
    const m = matrixRatio[type]
    if (!m) return 0
    return paperCats.reduce((s, c) => s + (m[c] ?? []).reduce((a, v) => a + (v ?? 0), 0), 0)
  }
  // 某分类的行小计
  const rowSubtotal = (type: string, category: string) =>
    (matrixRatio[type]?.[category] ?? [0, 0, 0, 0, 0]).reduce<number>((s, v) => s + (v ?? 0), 0)
  // 某星级列的合计（仅统计已选分类）
  const colTotal = (type: string, level: number) => paperCats.reduce<number>((s, c) => s + cellValue(type, c, level), 0)

  // 选题量：手工出题=已选题目数；其它=配比矩阵合计
  const isManualPick = pickerMode === '手工出题'
  const selectedOf = (type: string) => (isManualPick ? (manualSelected[type] ?? []).length : sumMatrix(type))

  const totalCount = scoreRows.reduce((s, r) => s + selectedOf(r.type), 0)
  const totalScore = scoreRows.reduce((s, r) => s + selectedOf(r.type) * r.per, 0)

  const scrollTo = (anchor: string) => {
    setActiveAnchor(anchor)
    const el = sectionRefs.current[anchor]
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' })
    }
  }

  const handleSave = (publish: boolean) => {
    if (!name.trim()) {
      message.warning(isPaper ? '请输入试卷名称' : '请输入考试名称')
      return
    }
    if (!isPaper && !category) {
      message.warning('请选择考试分类')
      return
    }
    // 考试时间 / 考试时长：统一由「考试节点安排」承载，保存时保留原展示值（或默认）
    const examTime = initial?.examTime ?? '—'
    const duration = initial?.duration ?? '不限时'
    const record: TheoryExamRecord = {
      id: initial?.id ?? `e${Date.now()}`,
      name: name.trim(),
      category: category ?? initial?.category ?? '未分类',
      description: remark.trim() || undefined,
      // 学时 / 学分 / 所属年度：仅在「开启考试-编辑」中维护；试卷维护保存时保留原值
      studyHours: isPaper ? (initial?.studyHours ?? 0) : (studyHours ?? 0),
      credits: isPaper ? (initial?.credits ?? 0) : (credits ?? 0),
      belongYear: isPaper ? (initial?.belongYear ?? belongYear) : belongYear,
      // 关联考试科目：仅「开启考试-编辑」维护，直接保存所选标记内容
      planTag: isPaper ? (initial?.planTag) : planTag,
      period,
      status: publish ? '进行中' : initial?.status ?? '未发布',
      // 总分 / 及格分由「组卷与试题」推导；开启考试编辑不含组卷区块，保留原值
      totalScore: isPaper ? totalScore : (initial?.totalScore ?? totalScore),
      passScore: isPaper ? Math.round(totalScore * 0.6) : (initial?.passScore ?? Math.round(totalScore * 0.6)),
      timeMode: period === '统一时段' ? '统一时段' : '开始：不计时',
      runTime: period === '统一时段' ? '09-25 09:00 ~ 09-25 10:30' : '可考时段：（随时可考、不限时）\n09-25 00:00 ~ 10-01 00:00',
      runTip: period === '统一时段' ? '提前 15 分钟可进入' : undefined,
      examType,
      pickerMode,
      byMajor,
      randomWhenInsufficient,
      // 题目分类：仅试卷维护中维护，开启考试保存时保留原值
      categories: isPaper ? paperCats : initial?.categories,
      // 可考次数 / 最终分数：已从表单移除，保存时保留原值
      attempts: initial?.attempts ?? 1,
      finalScoreMode: initial?.finalScoreMode ?? '取最高分',
      closeAfterPass,
      // 本轮合格分 / 合格标识：试卷维护不含该区块，保留原值
      roundPassScore: isPaper ? initial?.roundPassScore : (roundPassScore ?? roundPassSuggest),
      passRule: isPaper ? initial?.passRule : passRule,
      examTime,
      duration,
      // 考官出分
      scoreTime: scoreTime ? scoreTime.format('YYYY-MM-DD HH:mm:ss') : initial?.scoreTime ?? '',
      objectiveMode,
      subjectiveReviewers: subjectiveReviewers ?? 0,
      subjectiveAvg,
      subjectiveDropMax,
      subjectiveDropMin,
      subjectiveMaxDiff: subjectiveMaxDiff ?? 0,
      anonymousReview,
      reviewDays: reviewDays ?? 0,
      allowBooking,
      bookingStart: allowBooking && bookingStart ? bookingStart.format('YYYY-MM-DD') : initial?.bookingStart ?? '',
      bookingEnd: allowBooking && bookingEnd ? bookingEnd.format('YYYY-MM-DD') : initial?.bookingEnd ?? '',
      bookingLimit,
      bookingMax: bookingMax ?? 0,
      bookingMin: bookingMin ?? 0,
      insufficientAction,
      deferDays: deferDays ?? 0,
      allowCancelBooking,
      cancelMaxTimes: cancelMaxTimes ?? 0,
      // 录屏录像
      screenRecord,
      practicalRecord,
      audioRetention: audioRetention ?? 0,
      // 考试节点安排（多条）
      schedules: isPaper ? (initial?.schedules ?? []) : examSchedules,
      enrollDeadline: initial?.enrollDeadline ?? '—',
      enrolled: initial?.enrolled ?? 0,
      examined: initial?.examined ?? 0,
    }
    onSaved(record)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f5', overflow: 'hidden' }}>
      {/* 顶栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space size={8} style={{ fontSize: 14 }}>
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>试卷维护</span>
          <span style={{ color: 'rgba(0,0,0,0.25)' }}>/</span>
          <span style={{ fontWeight: 600 }}>{isPaper ? (initial ? '编辑试卷' : '新建试卷') : '编辑考试'}</span>
        </Space>
      </div>

      {/* 主体 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {/* 左锚点导航 */}
        <div style={{ width: 160, flexShrink: 0, padding: '20px 0', borderRight: '1px solid #f0f0f0', background: '#fff' }}>
          {ANCHORS.map((a) => (
            <div
              key={a}
              onClick={() => scrollTo(a)}
              style={{
                padding: '8px 20px',
                fontSize: 13,
                cursor: 'pointer',
                color: a === activeAnchor ? '#1677ff' : 'rgba(0,0,0,0.65)',
                fontWeight: a === activeAnchor ? 600 : 400,
                borderLeft: a === activeAnchor ? '3px solid #1677ff' : '3px solid transparent',
              }}
            >
              {a}
            </div>
          ))}
        </div>

        {/* 右表单 */}
        <div ref={scrollRef} style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: '8px 24px 24px' }}>
            {/* 基本信息 / 试卷信息 */}
            <Section refCb={(el) => (sectionRefs.current[isPaper ? '试卷信息' : '基本信息'] = el)} title={isPaper ? '试卷信息' : '基本信息'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 16 }}>
                <div style={{ flex: 2, minWidth: 0, display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>
                    <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>{isPaper ? '试卷名称' : '考试名称'}
                  </div>
                  <Input placeholder={isPaper ? '请输入试卷名称' : '请输入考试名称'} value={name} onChange={(e) => setName(e.target.value)} style={{ maxWidth: 525 }} />
                </div>
                {!isPaper && (
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', marginLeft: -50 }}>
                  <div style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>
                    <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>考试分类
                  </div>
                  <Select
                    placeholder="请选择考试分类"
                    style={{ width: 220 }}
                    value={category}
                    onChange={setCategory}
                    options={EXAM_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                )}
              </div>
              {/* 学时 / 学分 / 所属年度 */}
              {!isPaper && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>学时</span>
                  <InputNumber
                    min={0}
                    style={{ width: 160 }}
                    placeholder="请输入学时"
                    value={studyHours}
                    onChange={(v) => setStudyHours(v)}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>学分</span>
                  <InputNumber
                    min={0}
                    style={{ width: 160 }}
                    placeholder="请输入学分"
                    value={credits}
                    onChange={(v) => setCredits(v)}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>所属年度</span>
                  <Select
                    style={{ width: 160 }}
                    placeholder="请选择年度"
                    value={belongYear}
                    onChange={setBelongYear}
                    options={YEAR_OPTIONS.map((y) => ({ value: y, label: `${y} 年度` }))}
                  />
                </div>
              </div>
              )}
              {/* 关联考试科目（学时下一行）：直接显示科目下拉框 */}
              {!isPaper && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 8 }}>关联考试科目</span>
                  <Select
                    style={{ width: 180, marginLeft: 8 }}
                    placeholder="请选择关联考试科目"
                    value={planTag}
                    onChange={setPlanTag}
                    options={getPlanTagNames().map((t) => ({ value: t, label: t }))}
                  />
                </div>
              </div>
              )}
              <FormRow label={isPaper ? '试卷说明' : '考试说明'}>
                <Input.TextArea placeholder={isPaper ? '请输入试卷说明' : '请输入考试说明'} value={remark} onChange={(e) => setRemark(e.target.value)} rows={4} style={{ maxWidth: 940 }} />
              </FormRow>
            </Section>

            {/* 考试安排 */}
            {!isPaper && (
            <Section refCb={(el) => (sectionRefs.current['考试安排'] = el)} title="考试安排">
              {/* 考试节点安排：多条，序号 / 选择试卷 / 考试起止时间 / 考试限时 */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addSchedule}
                  style={{ color: '#fa8c16', borderColor: '#ffa940', background: '#fff7e6' }}
                >
                  添加试卷
                </Button>
              </div>
              <Table<ExamScheduleItem>
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={examSchedules}
                locale={{ emptyText: '暂无考试试卷，点击「添加试卷」新增' }}
                columns={[
                  {
                    title: '序号',
                    width: 56,
                    align: 'center',
                    render: (_: unknown, __: ExamScheduleItem, i: number) => i + 1,
                  },
                  {
                    title: '选择试卷',
                    width: 220,
                    render: (_: unknown, r: ExamScheduleItem) => (
                      <Select
                        placeholder="请选择试卷"
                        style={{ width: '100%' }}
                        value={r.paperId}
                        onChange={(v) => updateSchedule(r.id, { paperId: v })}
                        options={INITIAL_EXAMS.map((e) => ({ value: e.id, label: e.name }))}
                        showSearch
                        optionFilterProp="label"
                      />
                    ),
                  },
                  {
                    title: '考试起止时间',
                    width: 320,
                    render: (_: unknown, r: ExamScheduleItem) => (
                      <DatePicker.RangePicker
                        showTime
                        style={{ width: '100%' }}
                        value={r.range}
                        onChange={(dates) => updateSchedule(r.id, { range: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
                        placeholder={['开始时间', '结束时间']}
                      />
                    ),
                  },
                  {
                    title: '考试限时',
                    width: 200,
                    render: (_: unknown, r: ExamScheduleItem) => (
                      <Space size={4}>
                        <InputNumber min={0} style={{ width: 76 }} placeholder="时" value={r.limitHours} onChange={(v) => updateSchedule(r.id, { limitHours: v })} />
                        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>时</span>
                        <InputNumber min={0} style={{ width: 76 }} placeholder="分" value={r.limitMinutes} onChange={(v) => updateSchedule(r.id, { limitMinutes: v })} />
                        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>分</span>
                      </Space>
                    ),
                  },
                  {
                    title: '操作',
                    width: 80,
                    align: 'center',
                    render: (_: unknown, r: ExamScheduleItem) => (
                      <Popconfirm
                        title="确定删除该节点？"
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => removeSchedule(r.id)}
                      >
                        <Button type="link" danger size="small">删除</Button>
                      </Popconfirm>
                    ),
                  },
                ]}
              />
              {/* 总分 / 合格分 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>
                    总分
                  </span>
                  <InputNumber min={0} style={{ width: 160 }} value={roundTotalScore} disabled />
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginLeft: 5, lineHeight: '32px' }}>
                    分
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>
                    合格分
                  </span>
                  <InputNumber
                    min={0}
                    style={{ width: 160 }}
                    value={roundPassScore}
                    onChange={(v) => {
                      setRoundPassTouched(true)
                      setRoundPassScore(v)
                    }}
                  />
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginLeft: 5, lineHeight: '32px' }}>
                    分
                  </span>
                </div>
              </div>

              {/* 合格标识 + 迟到禁入（同一行） */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 40, marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', fontWeight: 500, lineHeight: '32px', marginRight: 8 }}>
                    合格标识
                  </span>
                  <Radio.Group value={passRule} onChange={(e) => setPassRule(e.target.value)}>
                    <Radio value="各试卷均达到合格分">各试卷均达到合格分</Radio>
                    <Radio value="达到总合格分">达到总合格分</Radio>
                  </Radio.Group>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'rgba(0,0,0,0.65)', fontWeight: 500, lineHeight: '32px', marginRight: 8 }}>
                    迟到禁入
                    <Tooltip title="开启后，超过设定时间数仍未进入的考生将无法再开始考试。">
                      <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
                    </Tooltip>
                  </span>
                  <Space size={5}>
                    <Switch checked={lateBlockOn} onChange={setLateBlockOn} />
                    {lateBlockOn && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 16 }}>
                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>开考后允许进入</span>
                        <InputNumber min={0} style={{ width: 100 }} defaultValue={15} />
                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>分钟</span>
                      </span>
                    )}
                  </Space>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 4, marginBottom: 8 }}>
                <div style={{ width: '33.33%', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0' }}>
                  <span style={{ width: 112, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>允许中途退出</span>
                  <Switch checked={allowQuit} onChange={setAllowQuit} />
                </div>
                <div style={{ width: '33.33%', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0' }}>
                  <span style={{ width: 112, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>题目顺序随机</span>
                  <Switch defaultChecked />
                </div>
                <div style={{ width: '33.33%', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0' }}>
                  <span style={{ width: 112, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>选项顺序随机</span>
                  <Switch />
                </div>
                <div style={{ width: '33.33%', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0' }}>
                  <span style={{ width: 112, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>允许查看成绩</span>
                  <Switch defaultChecked />
                </div>
                <div style={{ width: '33.33%', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0' }}>
                  <span style={{ width: 112, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>允许查看答卷</span>
                  <Switch defaultChecked />
                </div>
                <div style={{ width: '33.33%', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0' }}>
                  <span style={{ width: 112, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>允许查看正确答案</span>
                  <Switch />
                </div>
                <div style={{ width: '33.33%', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0' }}>
                  <span style={{ width: 112, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>应用于资质准入</span>
                  <Switch />
                </div>
                <div style={{ width: '33.33%', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0' }}>
                  <span style={{ width: 112, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>应用于培训考试</span>
                  <Switch />
                </div>
                <div style={{ width: '33.33%', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 0' }}>
                  <span style={{ width: 112, flexShrink: 0, whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>及格后关闭考试</span>
                  <Switch checked={closeAfterPass} onChange={setCloseAfterPass} />
                </div>
              </div>

            </Section>
            )}

            {/* 考官出分 */}
            {!isPaper && (
            <Section
              refCb={(el) => (sectionRefs.current['考官出分'] = el)}
              title="考官出分"
            >
              <FormRow label="匿名阅卷">
                <Switch checked={anonymousReview} onChange={setAnonymousReview} />
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 40 }}>
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>出分后允许复核时长</span>
                  <InputNumber min={0} precision={0} style={{ width: 160 }} value={reviewDays} onChange={(v) => setReviewDays(v)} />
                  <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 6 }}>天</span>
                </div>
              </FormRow>
              {/* 统一出分时间 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 40, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>
                    <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>统一出分时间
                  </span>
                  <DatePicker
                    showTime={{ format: 'HH:mm:ss' }}
                    format="YYYY-MM-DD HH:mm:ss"
                    style={{ width: 260 }}
                    placeholder="请选择统一出分时间"
                    value={scoreTime}
                    onChange={(v) => setScoreTime(v)}
                  />
                </div>
              </div>

              {/* 客观题出分 */}
              <FormRow label="客观题出分">
                <Radio.Group value={objectiveMode} onChange={(e) => setObjectiveMode(e.target.value)}>
                  <Radio value="隐藏出分">自动判题隐藏出分</Radio>
                  <Radio value="显示出分">自动判题显示出分</Radio>
                </Radio.Group>
              </FormRow>

              {/* 主观题出分 + 阅卷人数 + 最大分差 同一行 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 40, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', fontWeight: 500, lineHeight: '32px', marginRight: 8, flexShrink: 0 }}>主观题出分</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>阅卷人数</span>
                  <InputNumber min={1} precision={0} style={{ width: 160 }} value={subjectiveReviewers} onChange={(v) => setSubjectiveReviewers(v)} />
                  <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 6 }}>人</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>最大分差</span>
                  <InputNumber min={0} max={100} precision={0} style={{ width: 160 }} value={subjectiveMaxDiff} onChange={(v) => setSubjectiveMaxDiff(v)} />
                  <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 6 }}>%</span>
                </div>
              </div>

              <FormRow label="主观题分数处理">
                <Checkbox checked disabled style={{ marginRight: 24 }}>
                  <span style={{ color: 'rgba(0,0,0,0.88)' }}>取平均分</span>
                </Checkbox>
                <Checkbox checked={subjectiveDropMax} onChange={(e) => setSubjectiveDropMax(e.target.checked)} style={{ marginRight: 24 }}>去除最高分</Checkbox>
                <Checkbox checked={subjectiveDropMin} onChange={(e) => setSubjectiveDropMin(e.target.checked)}>去除最低分</Checkbox>
              </FormRow>
            </Section>
            )}

            {/* 组卷与试题 */}
            {isPaper && (
            <Section refCb={(el) => (sectionRefs.current['组卷与试题'] = el)} title="组卷与试题">
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>
                      <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>总分
                    </div>
                    <InputNumber min={0} style={{ width: 220 }} value={totalScore} disabled />
                    <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginLeft: 5, lineHeight: '32px' }}>分</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>
                      <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>及格分
                    </div>
                    <InputNumber min={0} style={{ width: 220 }} defaultValue={Math.round(totalScore * 0.6)} />
                    <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginLeft: 5, lineHeight: '32px' }}>分</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                {/* 列1：出题方式标签 */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>出题方式</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Tag style={{ marginInlineEnd: 0, lineHeight: '22px', color: '#fa8c16', background: '#fff7e6', borderColor: '#ffd591' }}>
                      {examType}
                    </Tag>
                    <Tag color="blue" style={{ marginInlineEnd: 0, lineHeight: '22px' }}>
                      {pickerMode}
                    </Tag>
                  </span>
                </div>
                {/* 列2：组数（与上一行「及格分」同列，垂直对齐） */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {pickerMode === 'AB组卷' && (
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <div style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>
                        <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>组数
                      </div>
                      <InputNumber
                        min={1}
                        precision={0}
                        step={1}
                        style={{ width: 120 }}
                        placeholder="请输入组数"
                        value={groupCount}
                        onChange={(v) => setGroupCount(v)}
                      />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }} />
              </div>
              <FormRow label="按专业选题">
                <Switch checked={byMajor} onChange={setByMajor} />
                <span style={{ marginLeft: 16, fontSize: 12.5, color: 'rgba(0,0,0,0.65)' }}>
                  题库不足随机抽题
                </span>
                <Switch checked={randomWhenInsufficient} onChange={setRandomWhenInsufficient} style={{ marginLeft: 8 }} />
              </FormRow>
              <FormRow label="题目分类" required>
                <Select
                  mode="multiple"
                  placeholder="请选择题目分类"
                  style={{ width: '100%' }}
                  value={paperCats}
                  onChange={(v: string[]) => setPaperCats(v)}
                  options={EXAM_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              </FormRow>
            </Section>
            )}

            {/* 题型配选 */}
            {isPaper && (
            <Section
              refCb={(el) => (sectionRefs.current['题型配选'] = el)}
              extra={
                <span style={{ color: '#1677ff', fontSize: 13 }}>
                  合计 总题量 {totalCount} 题 ／ 题型分 {totalScore} 分
                </span>
              }
            >
              <Table
                rowKey="type"
                size="small"
                pagination={false}
                dataSource={scoreRows}
                columns={[
                  { title: '题型', dataIndex: 'type', width: 140 },
                  { title: '选题量(个)', dataIndex: 'count', width: 120, render: (_: number, r: { type: string; count: number; per: number }) => selectedOf(r.type) },
                  {
                    title: isManualPick ? '选择' : '配比',
                    width: 120,
                    render: (_: unknown, r) =>
                      isManualPick ? (
                        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openManual(r.type)}>
                          选择
                        </Button>
                      ) : (
                        <Tooltip title={paperCats.length === 0 ? '请先选择题目分类' : ''}>
                          <span>
                            <Button
                              type="link"
                              size="small"
                              style={{ padding: 0 }}
                              disabled={paperCats.length === 0}
                              onClick={() => openRatio(r.type)}
                            >
                              设置
                            </Button>
                          </span>
                        </Tooltip>
                      ),
                  },
                  {
                    title: '单题分值(分)',
                    dataIndex: 'per',
                    width: 120,
                    render: (_: unknown, r: { type: string; count: number; per: number }) => (
                      <InputNumber
                        min={0}
                        value={r.per}
                        onChange={(v) =>
                          setScoreRows((prev) => prev.map((x) => (x.type === r.type ? { ...x, per: v ?? 0 } : x)))
                        }
                        style={{ width: 80 }}
                      />
                    ),
                  },
                  { title: '题型总分(分)', width: 120, render: (_: unknown, r: { type: string; count: number; per: number }) => selectedOf(r.type) * r.per },
                ]}
              />
            </Section>
            )}

            {/* 预约设置 */}
            {!isPaper && (
            <Section refCb={(el) => (sectionRefs.current['预约设置'] = el)} title="预约设置">
              {/* 允许预约 + 预约起止时间（三列对齐：190 / 300 / 自适应） */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 190, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>允许预约</span>
                  <Switch checked={allowBooking} onChange={setAllowBooking} />
                </div>
                {allowBooking && (
                  <>
                    <div style={{ width: 300, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>预约开始时间
                      </span>
                      <DatePicker
                        format="YYYY-MM-DD"
                        style={{ width: 150 }}
                        placeholder="请选择日期"
                        value={bookingStart}
                        onChange={(v) => setBookingStart(v)}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>预约截止时间
                      </span>
                      <DatePicker
                        format="YYYY-MM-DD"
                        style={{ width: 150 }}
                        placeholder="请选择日期"
                        value={bookingEnd}
                        onChange={(v) => setBookingEnd(v)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 预约人数限制 + 最大预约人数 + 最低预约人数（三列对齐：190 / 300 / 自适应） */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 190, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>预约人数限制</span>
                  <Switch checked={bookingLimit} onChange={setBookingLimit} />
                </div>
                {bookingLimit && (
                  <>
                    <div style={{ width: 300, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>最大预约人数
                      </span>
                      <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: 120 }}
                        value={bookingMax}
                        onChange={(v) => setBookingMax(v)}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
                        最低预约人数
                        <Tooltip title="达到最低预约人数，考试方可按时开考；否则考试将被取消或顺延">
                          <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginLeft: 4, marginRight: 4 }} />
                        </Tooltip>
                      </span>
                      <InputNumber
                        min={0}
                        precision={0}
                        style={{ width: 120 }}
                        value={bookingMin}
                        onChange={(v) => setBookingMin(v)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 预约人数不足时的处理方式（独立一行显示） */}
              {bookingLimit && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
                    预约人数不足
                    <Tooltip title="当实际预约人数低于最低预约人数时，按此方式处理本次考试">
                      <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginLeft: 4, marginRight: 4 }} />
                    </Tooltip>
                  </span>
                  <Radio.Group
                    value={insufficientAction}
                    onChange={(e) => setInsufficientAction(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                    options={[
                      { label: '正常考试', value: '正常考试' },
                      { label: '取消考试', value: '取消考试' },
                      { label: '延期后正常考试', value: '延期后正常考试' },
                      { label: '延期后不足取消考试', value: '延期后不足取消考试' },
                    ]}
                  />
                  {(insufficientAction === '延期后正常考试' || insufficientAction === '延期后不足取消考试') && (
                    <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap', marginRight: 8 }}>延期天数</span>
                      <InputNumber
                        min={1}
                        precision={0}
                        style={{ width: 100 }}
                        addonAfter="天"
                        value={deferDays}
                        onChange={(v) => setDeferDays(v)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 允许取消预约 + 最多取消次数（三列对齐：190 / 300 / 自适应） */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 190, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>允许取消预约</span>
                  <Switch checked={allowCancelBooking} onChange={setAllowCancelBooking} />
                </div>
                {allowCancelBooking && (
                  <div style={{ width: 300, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
                      最多取消次数
                      <Tooltip title="考生可取消预约的最大次数，超过后不可再取消">
                        <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginLeft: 4, marginRight: 4 }} />
                      </Tooltip>
                    </span>
                    <InputNumber
                      min={0}
                      precision={0}
                      style={{ width: 120 }}
                      value={cancelMaxTimes}
                      onChange={(v) => setCancelMaxTimes(v)}
                    />
                  </div>
                )}
              </div>

              {/* 限制条件：均为下拉多选，一行一个 */}
              <div style={{ height: 4 }} />
              <LimitRow
                label="指定人员状态"
                placeholder="请选择人员状态（可多选）"
                options={LIMIT_PERSON_STATUS_OPTIONS}
                value={limitPersonStatus}
                onChange={setLimitPersonStatus}
              />
              <LimitRow
                label="指定聘任职称"
                placeholder="请选择聘任职称（可多选）"
                options={LIMIT_TITLE_OPTIONS}
                value={limitTitle}
                onChange={setLimitTitle}
              />
              <LimitRow
                label="指定人员类别"
                placeholder="请选择人员类别（可多选）"
                options={LIMIT_PERSON_CATEGORY_OPTIONS}
                value={limitPersonCategory}
                onChange={setLimitPersonCategory}
              />
              <LimitRow
                label="指定科室"
                placeholder="请选择科室（可多选）"
                options={LIMIT_DEPT_OPTIONS}
                value={limitDept}
                onChange={setLimitDept}
              />
              <LimitRow
                label="指定专业"
                placeholder="请选择专业（可多选）"
                options={LIMIT_MAJOR_OPTIONS}
                value={limitMajor}
                onChange={setLimitMajor}
              />
            </Section>
            )}

            {/* 录屏录像 */}
            {isPaper && (
            <Section
              refCb={(el) => (sectionRefs.current['录屏录像'] = el)}
              title="录屏录像"
              last
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>机考录屏</span>
                  <Switch checked={screenRecord} onChange={setScreenRecord} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>实操录像</span>
                  <Switch checked={practicalRecord} onChange={setPracticalRecord} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>音频文件保留时长</span>
                  <InputNumber min={0} precision={0} style={{ width: 160 }} value={audioRetention} onChange={(v) => setAudioRetention(v)} />
                  <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 6 }}>月</span>
                </div>
              </div>
            </Section>
            )}
          </div>
        </div>
      </div>

      {/* 底部固定操作栏（不随内容滚动） */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 16px',
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <Button onClick={onBack}>取消</Button>
        {!readOnly && <Button type="primary" onClick={() => handleSave(false)}>保存</Button>}
      </div>

      {/* 配比设置弹窗：分类 × 星级 合并抽题配比 */}
      {ratioModal.open && (
        <Modal
          title={`配比设置-${diffTarget}`}
          open={ratioModal.open}
          onCancel={() => setRatioModal((m) => ({ ...m, open: false }))}
          onOk={saveRatio}
          width={900}
          destroyOnClose
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ width: 3, height: 14, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>抽题配比</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              合计：<b style={{ color: '#fa8c16' }}>{sumMatrix(diffTarget)}</b> 题
            </span>
          </div>
          <Table
            rowKey="category"
            size="small"
            bordered
            pagination={false}
            dataSource={paperCats.map((category) => ({ category }))}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}><b>合计</b></Table.Summary.Cell>
                {[1, 2, 3, 4, 5].map((level) => (
                  <Table.Summary.Cell key={level} index={level} align="center">
                    <b>{colTotal(diffTarget, level)}</b>
                  </Table.Summary.Cell>
                ))}
                <Table.Summary.Cell index={6} align="center">
                  <b style={{ color: '#fa8c16' }}>{sumMatrix(diffTarget)}</b>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
            columns={[
              { title: '分类', dataIndex: 'category', width: 120 },
              ...[1, 2, 3, 4, 5].map((level) => ({
                title: `${level}星`,
                key: `level-${level}`,
                align: 'center' as const,
                width: 112,
                render: (_: unknown, r: { category: string }) => {
                  const avail = categoryStarAvail(diffTarget, r.category, level)
                  // 该分类在此星级无可选题目：显示占位符，不提供输入
                  if (avail === null || avail === 0) return <span style={{ color: 'rgba(0,0,0,0.3)' }}>—</span>
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <InputNumber
                        min={0}
                        max={avail}
                        size="small"
                        value={cellValue(diffTarget, r.category, level)}
                        onChange={(v) => setCell(diffTarget, r.category, level, v ?? 0)}
                        style={{ width: 58 }}
                      />
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>/ {avail}</span>
                    </div>
                  )
                },
              })),
              {
                title: '小计',
                key: 'subtotal',
                align: 'center' as const,
                width: 76,
                render: (_: unknown, r: { category: string }) => (
                  <b style={{ color: '#1677ff' }}>{rowSubtotal(diffTarget, r.category)}</b>
                ),
              },
            ]}
          />
        </Modal>
      )}

      {/* 手工出题：手动选题弹窗（左：查询候选 / 右：已选择） */}
      {manualModal.open && (() => {
        const pool = getManualPool(manualModal.target ?? '')
        const kw = manualModal.keyword.trim()
        const selectedSet = new Set(manualModal.checked)
        const leftList = pool.filter((q) => !selectedSet.has(q.id) && (!kw || q.content.includes(kw)))
        const rightList = pool.filter((q) => selectedSet.has(q.id))
        const rowStyle = (picked: boolean): React.CSSProperties => ({
          padding: '10px 14px',
          cursor: 'pointer',
          borderBottom: '1px solid #f5f5f5',
          background: picked ? '#f0f7ff' : '#fff',
        })
        const PAGE_SIZE = 10
        const leftPageItems = leftList.slice((manualLeftPage - 1) * PAGE_SIZE, manualLeftPage * PAGE_SIZE)
        const rightPageItems = rightList.slice((manualRightPage - 1) * PAGE_SIZE, manualRightPage * PAGE_SIZE)
        return (
          <Modal
            title={`手动选题 - ${manualModal.target}`}
            open={manualModal.open}
            onCancel={() => setManualModal((m) => ({ ...m, open: false }))}
            onOk={saveManual}
            width={1080}
            destroyOnClose
          >
            <div style={{ display: 'flex', gap: 16 }}>
              {/* 左：题目名称查询 + 候选列表 */}
              <div style={{ flex: 1, minWidth: 0, border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>题目列表</span>
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{leftList.length} 题</span>
                </div>
                <Input.Search
                  allowClear
                  placeholder="输入题目名称查询"
                  style={{ marginBottom: 10 }}
                  value={manualModal.keyword}
                  onChange={(e) => { setManualLeftPage(1); setManualModal((m) => ({ ...m, keyword: e.target.value })) }}
                  onSearch={(v) => { setManualLeftPage(1); setManualModal((m) => ({ ...m, keyword: v })) }}
                />
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {leftList.length === 0 ? (
                    <Empty style={{ padding: 36 }} description="无匹配题目" />
                  ) : (
                    leftPageItems.map((q) => (
                      <div key={q.id} onClick={() => toggleManual(q.id)} style={rowStyle(false)}>
                        <div style={{ fontSize: 13, lineHeight: '20px', color: '#1a1a1a' }}>{q.content}</div>
                        <div style={{ marginTop: 4 }}>
                          <Tag style={{ marginInlineEnd: 6 }}>{q.category}</Tag>
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{q.score} 分</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {leftList.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <Pagination
                      size="small"
                      current={manualLeftPage}
                      pageSize={PAGE_SIZE}
                      total={leftList.length}
                      showSizeChanger={false}
                      onChange={(p) => setManualLeftPage(p)}
                    />
                  </div>
                )}
              </div>

              {/* 右：已选择区域 */}
              <div style={{ flex: 1, minWidth: 0, border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>已选择</span>
                  <span style={{ fontSize: 12, color: '#1677ff' }}>{rightList.length} 题</span>
                </div>
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {rightList.length === 0 ? (
                    <Empty style={{ padding: 36 }} description="尚未选择题目" />
                  ) : (
                    rightPageItems.map((q) => (
                      <div key={q.id} onClick={() => toggleManual(q.id)} style={rowStyle(true)}>
                        <div style={{ fontSize: 13, lineHeight: '20px', color: '#1a1a1a' }}>{q.content}</div>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue" style={{ marginInlineEnd: 6 }}>{q.category}</Tag>
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{q.score} 分</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {rightList.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <Pagination
                      size="small"
                      current={manualRightPage}
                      pageSize={PAGE_SIZE}
                      total={rightList.length}
                      showSizeChanger={false}
                      onChange={(p) => setManualRightPage(p)}
                    />
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}

// ===== 表单区块 =====
const Section: React.FC<{
  refCb: (el: HTMLDivElement | null) => void
  title?: string
  last?: boolean
  extra?: React.ReactNode
  children: React.ReactNode
}> = ({ refCb, title, last, extra, children }) => (
  <div
    ref={refCb}
    style={{ paddingTop: 20, paddingBottom: last ? 4 : 20, borderBottom: last ? 'none' : '1px solid #f0f0f0' }}
  >
    {(title || extra) && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        {title ? <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{title}</div> : <span />}
        {extra}
      </div>
    )}
    {children}
  </div>
)

const FormRow: React.FC<{ label: React.ReactNode; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
    <div style={{ flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: '32px', marginRight: 5 }}>
      {required && <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>}
      {label}
    </div>
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
  </div>
)

/** 预约设置-限制条件行：定宽标签 + 下拉多选（一行一个） */
const LimitRow: React.FC<{
  label: string
  placeholder: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}> = ({ label, placeholder, options, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
    <span style={{ width: 112, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
      {label}
    </span>
    <Select
      mode="multiple"
      allowClear
      maxTagCount="responsive"
      placeholder={placeholder}
      style={{ minWidth: 420, maxWidth: 620 }}
      value={value}
      onChange={(v: string[]) => onChange(v)}
      options={options.map((o) => ({ value: o, label: o }))}
    />
  </div>
)

// ===== 考生管理弹窗 =====
/** 考生考试状态（仅「未签到」可禁入 / 移除） */
type CandidateStatus = '未签到' | '考试中' | '已完成' | '缺考'

/** 复核状态（空 / 待复核 / 已复核） */
type ReviewStatus = '' | '待复核' | '已复核'
/** 复核类型：考生申请复核 / 题干复核 / 总分复核（成绩单原三列，现移至考生管理） */
type ReviewType = 'apply' | 'stem' | 'score'
const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  apply: '考生申请复核',
  stem: '题干复核',
  score: '总分复核',
}
const REVIEW_STATUS_COLOR: Record<'待复核' | '已复核', string> = { 待复核: 'orange', 已复核: 'green' }

interface CandidatePaper {
  status: CandidateStatus       // 考试状态
  attempts: number              // 考试次数
  score: number | string        // 最终成绩
  finishTimes: string[]         // 考试完成时间（多次考试分行显示）
  firstSignInTime: string       // 首次签到时间
  // ==== 复核（按套试卷记录）====
  reviewStatus?: ReviewStatus  // 考生申请复核状态
  reviewReason?: string        // 申请原因（考生填写）
  reviewContent?: string       // 复核内容（考官填写）
  stemReviewStatus?: ReviewStatus // 题干复核状态
  stemReviewContent?: string   // 题干复核内容
  scoreReviewStatus?: ReviewStatus // 总分复核状态
  scoreReviewContent?: string  // 总分复核内容
  questions?: ReviewQuestion[] // 单题作答明细（题干复核用）
}

/** 按复核类型读取 / 写入对应状态与内容（按套试卷） */
const reviewStatusOf = (p: CandidatePaper, t: ReviewType): ReviewStatus =>
  t === 'apply' ? (p.reviewStatus ?? '') : t === 'stem' ? (p.stemReviewStatus ?? '') : (p.scoreReviewStatus ?? '')
const reviewContentOf = (p: CandidatePaper, t: ReviewType): string =>
  (t === 'apply' ? p.reviewContent : t === 'stem' ? p.stemReviewContent : p.scoreReviewContent) ?? ''

// ===== 题干复核：单题作答明细（mock，按「考生 + 试卷」确定性生成） =====

/** 单题作答明细 */
interface ReviewQuestion {
  id: string
  no: number          // 题号
  type: string        // 题型：单选题 / 多选题 / 判断题 / 填空题 / 简答题 / 实操题
  category: string    // 题目分类
  content: string     // 题干
  options?: string[]  // 选项（仅客观题）
  standard: string    // 参考答案
  answer: string      // 考生作答
  score: number       // 本题满分
  got: number         // 考生本题得分
  status?: ReviewStatus // 本题复核状态（题干复核时逐题标记）
}

/** 客观题（自动判分、标记对错）；主观题（填空 / 简答 / 实操）支持重新打分 */
const OBJECTIVE_TYPES = ['单选题', '多选题', '判断题']
const isObjective = (type: string) => OBJECTIVE_TYPES.includes(type)

/** 将选项值转换为选项字母：若为字母（A/B/C/D 或逗号组合）原样返回；若为选项文本（如判断题「正确/错误」）反查其在选项中的序号转为字母 */
const optionLetter = (opts: string[] | undefined, v: string): string => {
  if (!opts || !opts.length) return v || '—'
  return (v || '')
    .split(',')
    .map((val) => {
      if (/^[A-Z](,[A-Z])*$/.test(val)) return val
      const idx = opts.indexOf(val)
      return idx >= 0 ? String.fromCharCode(65 + idx) : val
    })
    .join(',')
}

/** 字符串 → 稳定种子（FNV-1a），保证同一考生同一套试卷每次生成一致 */
const hashSeed = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** 各题型的题干 / 选项 / 参考答案（mock 演示数据） */
const REVIEW_BANK: Record<string, { content: string; options: string[]; standard: string; score: number }[]> = {
  单选题: [
    {
      content: '成人心肺复苏时，胸外按压的深度应达到多少？',
      options: ['至少 2cm', '至少 3cm', '5～6cm', '至少 7cm'],
      standard: 'C',
      score: 5,
    },
    {
      content: '过敏性休克首选的抢救药物是？',
      options: ['肾上腺素', '地塞米松', '异丙嗪', '多巴胺'],
      standard: 'A',
      score: 5,
    },
    {
      content: '住院医师接诊新入院患者后，首次病程记录应在多长时间内完成？',
      options: ['2 小时', '4 小时', '8 小时', '24 小时'],
      standard: 'C',
      score: 5,
    },
  ],
  多选题: [
    {
      content: '下列哪些属于医院感染的常见传播途径？',
      options: ['接触传播', '飞沫传播', '空气传播', '血液传播'],
      standard: 'A,B,C,D',
      score: 10,
    },
    {
      content: '关于手卫生五个重要时刻，下列正确的是？',
      options: ['接触患者前', '进行无菌操作前', '接触患者后', '接触患者周围环境后'],
      standard: 'A,B,C,D',
      score: 10,
    },
  ],
  判断题: [
    { content: '成人心肺复苏时，胸外按压与人工呼吸的比例为 30:2。', options: ['正确', '错误'], standard: '正确', score: 5 },
    { content: '一级护理患者，护士应每小时巡视一次。', options: ['正确', '错误'], standard: '正确', score: 5 },
  ],
  填空题: [
    { content: '正常成人静息心率范围是 ______ 次/分。', options: [], standard: '60～100', score: 5 },
    { content: '抢救记录应在抢救结束后 ______ 小时内据实补记。', options: [], standard: '6', score: 5 },
  ],
  简答题: [
    {
      content: '请简述医疗安全（不良）事件的分级及上报时限要求。',
      options: [],
      standard:
        '要点：① Ⅰ级（警告事件）立即上报；② Ⅱ级（不良后果事件）24 小时内；③ Ⅲ级（未造成后果事件）48 小时内；④ Ⅳ级（隐患事件）72 小时内。',
      score: 10,
    },
  ],
  实操题: [
    {
      content: '请在模拟人上完成成人心肺复苏全流程操作（含评估、按压、通气、除颤）。',
      options: [],
      standard: '依评分细则现场评定：按压位置 / 深度 / 频率、通气有效性、除颤时机与能量选择。',
      score: 10,
    },
    {
      content: '请完成经口气管插管操作并确认导管位置。',
      options: [],
      standard: '依评分细则现场评定：体位摆放、声门暴露、插管深度、双肺听诊确认。',
      score: 10,
    },
  ],
}

/** 按「考生 + 试卷」确定性生成单题作答明细 */
const buildReviewQuestions = (candidate: Candidate, paperIdx: number, isPractice: boolean): ReviewQuestion[] => {
  const seed = hashSeed(`${candidate.id}-${paperIdx}-${candidate.name}`)
  const layout: { type: string; count: number }[] = isPractice
    ? [{ type: '实操题', count: 2 }]
    : [
        { type: '单选题', count: 3 },
        { type: '多选题', count: 2 },
        { type: '判断题', count: 2 },
        { type: '填空题', count: 2 },
        { type: '简答题', count: 1 },
      ]
  const items: ReviewQuestion[] = []
  let no = 0
  layout.forEach((g, gi) => {
    const bank = REVIEW_BANK[g.type] ?? []
    for (let i = 0; i < g.count; i++) {
      no += 1
      const tpl = bank.length ? bank[(i + seed + gi) % bank.length] : null
      const score = tpl?.score ?? 5
      // 每 5 题里约 1 题作答错误，便于演示「正确 / 错误」两种标记
      const wrong = (seed + no * 7) % 5 === 0
      const standard = tpl?.standard ?? '—'
      let answer = standard
      let got = score
      if (tpl && isObjective(g.type)) {
        if (g.type === '判断题') {
          answer = wrong ? (standard === '正确' ? '错误' : '正确') : standard
          got = answer === standard ? score : 0
        } else {
          const letters = standard.split(',')
          // 单选题改选其它选项；多选题漏选一个
          answer =
            g.type === '单选题'
              ? letters[0] === 'A'
                ? 'B'
                : 'A'
              : letters.slice(0, Math.max(1, letters.length - 1)).join(',')
          got = wrong ? 0 : score
          if (!wrong) answer = standard
        }
      } else if (tpl) {
        // 主观题：初始分略低于满分，可在抽屉内重新打分
        got = Math.max(0, score - ((seed + no) % 4))
      }
      items.push({
        id: `${candidate.id}-${paperIdx}-${no}`,
        no,
        type: g.type,
        category: EXAM_CATEGORIES[(seed + no * 3) % EXAM_CATEGORIES.length],
        content: tpl?.content ?? `${g.type} 示例题目 ${i + 1}`,
        options: tpl && tpl.options.length ? tpl.options : undefined,
        standard,
        answer,
        score,
        got,
        status: '待复核',
      })
    }
  })
  return items
}

interface Candidate {
  id: string
  no: string              // 工号
  candidateNo: string     // 考生编号
  name: string
  gender: string
  dept: string
  duty: string
  title: string
  dutyType: string
  idCard: string          // 身份证号
  phone: string           // 手机号
  papers: CandidatePaper[]  // 各套试卷（第1套 / 第2套）的考试情况
}

/** 考生管理演示数据 */
const DEMO_CANDIDATES: Candidate[] = [
  { id: '1', no: 'G2001', candidateNo: 'KS20260001', name: '李明钊', gender: '男', dept: '信息科', duty: '工程师', title: '中级', dutyType: '技术', idCard: '520102199001010012', phone: '13800000001', papers: [
    { status: '未签到', attempts: 0, score: '-', finishTimes: [], firstSignInTime: '-' },
    { status: '未签到', attempts: 0, score: '-', finishTimes: [], firstSignInTime: '-' },
  ] },
  { id: '2', no: 'G2002', candidateNo: 'KS20260002', name: '王芳', gender: '女', dept: '呼吸内科', duty: '医师', title: '初级', dutyType: '医疗', idCard: '520103199203050023', phone: '13800000002', papers: [
    { status: '考试中', attempts: 1, score: '-', finishTimes: [], firstSignInTime: '2026-10-09 08:30:15' },
    { status: '未签到', attempts: 0, score: '-', finishTimes: [], firstSignInTime: '-' },
  ] },
  { id: '3', no: 'G2003', candidateNo: 'KS20260003', name: '张伟', gender: '男', dept: '外科', duty: '医师', title: '中级', dutyType: '医疗', idCard: '520104198805120034', phone: '13800000003', papers: [
    {
      status: '已完成', attempts: 2, score: 88, finishTimes: ['2026-10-08 09:30:00', '2026-10-08 14:20:10'], firstSignInTime: '2026-10-08 09:00:00',
      reviewStatus: '待复核', reviewReason: '对第 12 题多选题判分有疑问，认为正确选项应包含 C，申请复核。',
    },
    {
      status: '已完成', attempts: 1, score: 76, finishTimes: ['2026-10-08 15:00:00'], firstSignInTime: '2026-10-08 14:30:00',
      reviewStatus: '已复核', reviewContent: '经调取阅卷记录与评分细则复核：第 5 题判分依据成立，维持原得分。',
      stemReviewStatus: '已复核', stemReviewContent: '已逐题核对题干与参考答案，题干表述准确无歧义。',
      scoreReviewStatus: '待复核',
    },
  ] },
  { id: '4', no: 'G2004', candidateNo: 'KS20260004', name: '刘洋', gender: '男', dept: '急诊科', duty: '医师', title: '副高', dutyType: '医疗', idCard: '520105199009180045', phone: '13800000004', papers: [
    { status: '缺考', attempts: 0, score: '-', finishTimes: [], firstSignInTime: '-' },
    { status: '未签到', attempts: 0, score: '-', finishTimes: [], firstSignInTime: '-' },
  ] },
  { id: '5', no: 'G2005', candidateNo: 'KS20260005', name: '陈静', gender: '女', dept: '护理部', duty: '护士', title: '初级', dutyType: '护理', idCard: '520106199507220056', phone: '13800000005', papers: [
    { status: '未签到', attempts: 0, score: '-', finishTimes: [], firstSignInTime: '-' },
    { status: '未签到', attempts: 0, score: '-', finishTimes: [], firstSignInTime: '-' },
  ] },
  { id: '6', no: 'G2006', candidateNo: 'KS20260006', name: '赵磊', gender: '男', dept: '呼吸内科', duty: '医师', title: '中级', dutyType: '医疗', idCard: '520107199112300067', phone: '13800000006', papers: [
    {
      status: '已完成', attempts: 1, score: 92, finishTimes: ['2026-10-09 10:15:30'], firstSignInTime: '2026-10-09 09:45:00',
      reviewStatus: '已复核', reviewContent: '经复核，第 3 题简答题按评分要点给分准确，维持 92 分。',
      stemReviewStatus: '待复核',
      scoreReviewStatus: '已复核', scoreReviewContent: '已复核各题得分汇总与总分计算，累加无误，最终成绩有效。',
    },
    { status: '考试中', attempts: 1, score: '-', finishTimes: [], firstSignInTime: '2026-10-09 09:50:00' },
  ] },
]

/** 展开后的表格行：每位考生的每套试卷占一行（基本信息列纵向合并 2 行） */
// ===== 导入考生 =====

/** 导入模板表头（顺序即无表头文件时的取列顺序） */
const IMPORT_HEADERS = ['姓名', '工号', '性别', '部门', '身份证号', '手机号']

/** 表头别名 → 字段，兼容常见写法 */
const IMPORT_FIELD_ALIAS: Record<string, keyof ImportCandidateRow> = {
  姓名: 'name',
  工号: 'no',
  性别: 'gender',
  部门: 'dept',
  科室: 'dept',
  身份证号: 'idCard',
  身份证: 'idCard',
  手机号: 'phone',
  电话: 'phone',
  联系电话: 'phone',
}

/** 解析出的一行待导入考生 */
interface ImportCandidateRow {
  key: string
  name: string
  no: string
  gender: string
  dept: string
  idCard: string
  phone: string
  error?: string
}

/** 按 CSV 规则拆分一行：支持双引号包裹、字段内逗号与 "" 转义 */
const splitCsvLine = (line: string, delimiter: string): string[] => {
  const out: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuote = false
      } else cur += ch
    } else if (ch === '"') inQuote = true
    else if (ch === delimiter) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

/** 解析 CSV 文本为待导入行（自动识别逗号/制表符分隔，有无表头均可） */
const parseImportFile = (text: string): ImportCandidateRow[] => {
  const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return []
  const headCells = lines[0]
  const delimiter = (headCells.match(/\t/g) || []).length > (headCells.match(/,/g) || []).length ? '\t' : ','
  const cells = splitCsvLine(headCells, delimiter)
  const hasHeader = cells.some((c) => IMPORT_FIELD_ALIAS[c] !== undefined)
  const idxOf = (field: keyof ImportCandidateRow): number =>
    hasHeader
      ? cells.findIndex((c) => IMPORT_FIELD_ALIAS[c] === field)
      : IMPORT_HEADERS.findIndex((h) => IMPORT_FIELD_ALIAS[h] === field)
  return (hasHeader ? lines.slice(1) : lines).map((line, i) => {
    const v = splitCsvLine(line, delimiter)
    const get = (field: keyof ImportCandidateRow) => {
      const idx = idxOf(field)
      return idx >= 0 ? (v[idx] ?? '') : ''
    }
    return {
      key: `row-${i}`,
      name: get('name'),
      no: get('no'),
      gender: get('gender'),
      dept: get('dept'),
      idCard: get('idCard'),
      phone: get('phone'),
    }
  })
}

/** 校验：必填 / 格式 / 文件内重复 / 与现有名单重复 */
const validateImportRows = (rows: ImportCandidateRow[], existing: Candidate[]): ImportCandidateRow[] => {
  const seenNo = new Set<string>()
  const seenId = new Set<string>()
  const existNo = new Set(existing.map((c) => c.no))
  const existId = new Set(existing.filter((c) => c.idCard).map((c) => c.idCard))
  return rows.map((r) => {
    const errors: string[] = []
    if (!r.name) errors.push('姓名为空')
    if (!r.no) errors.push('工号为空')
    if (r.idCard && !/^\d{17}[\dXx]$/.test(r.idCard)) errors.push('身份证号格式不正确')
    if (r.phone && !/^1[3-9]\d{9}$/.test(r.phone)) errors.push('手机号格式不正确')
    if (r.no) {
      if (existNo.has(r.no)) errors.push('工号已存在')
      if (seenNo.has(r.no)) errors.push('文件内工号重复')
      seenNo.add(r.no)
    }
    if (r.idCard) {
      if (existId.has(r.idCard)) errors.push('身份证号已存在')
      if (seenId.has(r.idCard)) errors.push('文件内身份证号重复')
      seenId.add(r.idCard)
    }
    return errors.length ? { ...r, error: errors.join('；') } : { ...r, error: undefined }
  })
}

/** 下载导入模板（带 BOM，Excel 打开不乱码） */
const downloadImportTemplate = () => {
  const csv =
    '\ufeff' + [IMPORT_HEADERS.join(','), '张伟,G2003,男,外科,520104198805120034,13800000003'].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '考生导入模板.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** 导入考生弹窗：下载模板 → 上传文件 → 预览校验结果 → 导入 */
export const ImportCandidateModal: React.FC<{
  open: boolean
  existing: Candidate[]
  onCancel: () => void
  onConfirm: (rows: ImportCandidateRow[]) => void
}> = ({ open, existing, onCancel, onConfirm }) => {
  const [rows, setRows] = useState<ImportCandidateRow[]>([])
  const [fileName, setFileName] = useState('')

  const okCount = rows.filter((r) => !r.error).length
  const errCount = rows.length - okCount

  const handleCancel = () => {
    setRows([])
    setFileName('')
    onCancel()
  }
  const handleOk = () => {
    onConfirm(rows.filter((r) => !r.error))
    setRows([])
    setFileName('')
  }

  const beforeUpload = (file: File) => {
    if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
      message.error('仅支持 .csv / .txt 文件，Excel 请另存为 CSV 后再上传')
      return Upload.LIST_IGNORE
    }
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseImportFile(String(reader.result ?? ''))
      if (parsed.length === 0) {
        message.error('未解析到有效数据，请检查文件内容')
        return
      }
      setFileName(file.name)
      setRows(validateImportRows(parsed, existing))
    }
    reader.onerror = () => message.error('文件读取失败，请重试')
    reader.readAsText(file, 'UTF-8')
    return false // 阻止自动上传，本地解析即可
  }

  const columns: TableColumnsType<ImportCandidateRow> = [
    { title: '序号', width: 60, align: 'center', render: (_: unknown, __: ImportCandidateRow, i: number) => i + 1 },
    { title: '姓名', dataIndex: 'name', width: 90 },
    { title: '工号', dataIndex: 'no', width: 100 },
    { title: '性别', dataIndex: 'gender', width: 70, render: (v: string) => v || '—' },
    { title: '部门', dataIndex: 'dept', width: 120, render: (v: string) => v || '—' },
    { title: '身份证号', dataIndex: 'idCard', width: 180, render: (v: string) => v || '—' },
    { title: '手机号', dataIndex: 'phone', width: 120, render: (v: string) => v || '—' },
    {
      title: '校验结果',
      dataIndex: 'error',
      render: (v?: string) =>
        v ? <span style={{ color: '#cf1322' }}>{v}</span> : <Tag color="success">正常</Tag>,
    },
  ]

  return (
    <Modal
      title="导入考生"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okText={okCount ? `导入（${okCount} 条）` : '导入'}
      cancelText="取消"
      okButtonProps={{ disabled: okCount === 0 }}
      width={920}
      maskClosable={false}
      destroyOnClose
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Upload accept=".csv,.txt,.tsv" maxCount={1} showUploadList={false} beforeUpload={beforeUpload}>
          <Button type="primary" ghost icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={downloadImportTemplate}>下载模板</Button>
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
          支持 CSV 文件（Excel 请另存为 CSV），必填 姓名 / 工号
        </span>
      </div>

      {rows.length > 0 && (
        <Alert
          type={errCount ? 'warning' : 'success'}
          showIcon
          style={{ marginBottom: 12 }}
          message={`${fileName}：共解析 ${rows.length} 条，可导入 ${okCount} 条${errCount ? `，异常 ${errCount} 条（不会导入）` : ''}`}
        />
      )}

      <Table<ImportCandidateRow>
        rowKey="key"
        size="small"
        columns={columns}
        dataSource={rows}
        scroll={{ x: 800, y: 320 }}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="请先下载模板填写后上传，或选择已有的 CSV 文件"
            />
          ),
        }}
      />
    </Modal>
  )
}

interface CandidateRow {
  key: string
  candidate: Candidate
  paperIdx: number   // 0 = 第1套，1 = 第2套
  isFirst: boolean   // 该考生第一行（用于 rowSpan 合并基本信息）
}

/** 该考生是否已经签到过（任意一套有首次签到时间或已产生考试次数） */
const hasSignedIn = (c: Candidate): boolean =>
  c.papers.some((p) => p.firstSignInTime !== '-' || p.attempts > 0)

/** 考试状态 → Tag 颜色 */
const CANDIDATE_STATUS_COLOR: Record<CandidateStatus, string> = {
  未签到: 'default',
  考试中: 'processing',
  已完成: 'success',
  缺考: 'error',
}

export const CandidateModal: React.FC<{
  open: boolean
  exam: TheoryExamRecord | null
  onClose: () => void
}> = ({ open, exam, onClose }) => {
  const [candidates, setCandidates] = useState<Candidate[]>(DEMO_CANDIDATES)
  const [kw, setKw] = useState('')
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | undefined>(undefined)
  const [previewOpen, setPreviewOpen] = useState(false)
  // 预览某位考生的试卷时，带上该考生 / 试卷序号作为生成「考生作答」的种子
  const [previewSeed, setPreviewSeed] = useState<string | undefined>(undefined)
  const [importOpen, setImportOpen] = useState(false)

  // 复核抽屉：按复核类型（考生申请复核 / 题干复核）查看申请原因 + 填写复核内容
  const [reviewDrawer, setReviewDrawer] = useState<{ candidateId: string; paperIdx: number; type: ReviewType } | null>(null)
  const [reviewContent, setReviewContent] = useState('')
  // 题干复核：主观题（填空 / 简答 / 实操）重新打分的临时值（题 id → 新得分）
  const [reviewScores, setReviewScores] = useState<Record<string, number>>({})
  // 题干复核：逐题「是否被手动选择 / 重新打分」的标记（题 id → 是否触碰过），用于初始空白 + 自动标记已复核
  const [reviewTouched, setReviewTouched] = useState<Record<string, boolean>>({})
  // 总分复核：复核后总分（初值为该套试卷当前成绩）
  const [scoreAfter, setScoreAfter] = useState<number | null>(null)
  // 题干复核：实操题的评分表 / 视频录像预览浮动窗口（支持同时打开多个）
  const [mediaWindows, setMediaWindows] = useState<{ qid: string; kind: 'rubric' | 'video' }[]>([])
  const openMedia = (qid: string, kind: 'rubric' | 'video') =>
    setMediaWindows((prev) => (prev.some((w) => w.qid === qid && w.kind === kind) ? prev : [...prev, { qid, kind }]))
  const closeMedia = (qid: string, kind: 'rubric' | 'video') =>
    setMediaWindows((prev) => prev.filter((w) => !(w.qid === qid && w.kind === kind)))

  const filtered = candidates.filter((c) => {
    if (kw && !c.name.includes(kw) && !c.no.includes(kw)) return false
    if (statusFilter && !c.papers.some((p) => p.status === statusFilter)) return false
    return true
  })

  // 展开为「每套试卷一行」：基本信息列通过 rowSpan=2 纵向合并
  const rows: CandidateRow[] = filtered.flatMap((c) =>
    c.papers.map((_, idx) => ({
      key: `${c.id}-${idx}`,
      candidate: c,
      paperIdx: idx,
      isFirst: idx === 0,
    })),
  )

  // ===== 复核（考生管理：成绩列之后的「考生申请复核 / 题干复核 / 总分复核」三列）=====
  /** 当前复核抽屉对应的考生 / 试卷（从最新 state 读取，保存后自动同步） */
  const reviewTarget = reviewDrawer
    ? (() => {
        const c = candidates.find((x) => x.id === reviewDrawer.candidateId)
        const p = c?.papers[reviewDrawer.paperIdx]
        return c && p ? { candidate: c, paper: p } : null
      })()
    : null

  // 打开复核抽屉：按类型回显已填写的复核内容（若有）
  const openReview = (r: CandidateRow, type: ReviewType) => {
    const p = r.candidate.papers[r.paperIdx]
    setReviewContent(reviewContentOf(p, type))
    setReviewScores({})
    setReviewTouched({})
    setScoreAfter(typeof p.score === 'number' ? p.score : null)
    setReviewDrawer({ candidateId: r.candidate.id, paperIdx: r.paperIdx, type })
  }

  // 题干复核展示的题目明细：已保存过则沿用，否则按「考生 + 试卷」确定性生成
  const stemQuestions = useMemo(() => {
    if (!reviewDrawer || reviewDrawer.type !== 'stem' || !reviewTarget) return []
    const saved = reviewTarget.paper.questions
    if (saved && saved.length) return saved
    // 实操题出现在：① 实操考试（所有试卷）；② 理论考试的第 2 套（实操卷）
    const isPracticePaper = exam?.examType === '实操考试' || reviewDrawer.paperIdx >= 1
    return buildReviewQuestions(reviewTarget.candidate, reviewDrawer.paperIdx, isPracticePaper)
  }, [reviewDrawer, reviewTarget, exam])

  // 暂存 / 提交复核。题干复核按逐题状态判定；其余类型仍需填写复核内容
  const saveReview = (submit: boolean) => {
    if (!reviewDrawer) return
    const { candidateId, paperIdx, type } = reviewDrawer
    if (submit && type !== 'stem' && !reviewContent.trim()) {
      message.warning('请先填写复核内容')
      return
    }
    setCandidates((list) =>
      list.map((c) =>
        c.id !== candidateId
          ? c
          : {
              ...c,
              papers: c.papers.map((p, i) => {
                if (i !== paperIdx) return p
                const status: ReviewStatus = submit ? '已复核' : (reviewStatusOf(p, type) || '待复核')
                if (type === 'apply') return { ...p, reviewContent, reviewStatus: status }
                // 总分复核：只修正该套试卷的最终成绩，不重算逐题得分
                if (type === 'score') {
                  return {
                    ...p,
                    scoreReviewContent: reviewContent,
                    scoreReviewStatus: status,
                    score: scoreAfter ?? p.score,
                  }
                }
                // 题干复核：把重新打分 / 重新选择结果写回题目明细，并同步该套试卷的最终成绩
                // 复核状态不可手工修改：仅当该题被「重新选择」或「重新打分」（得分较原值变化）时自动标记为已复核
                const base = p.questions && p.questions.length ? p.questions : stemQuestions
                const nextQuestions = base.map((q) => {
                  const newGot = reviewScores[q.id] ?? q.got
                  const touched = reviewTouched[q.id] || newGot !== q.got
                  const status: ReviewStatus = touched || q.status === '已复核' ? '已复核' : (q.status ?? '待复核')
                  return { ...q, got: newGot, status }
                })
                const nextScore = nextQuestions.length
                  ? nextQuestions.reduce((s, q) => s + q.got, 0)
                  : p.score
                return {
                  ...p,
                  stemReviewStatus: status,
                  questions: nextQuestions,
                  score: nextScore,
                }
              }),
            },
      ),
    )
    message.success(
      submit
        ? '复核已提交'
        : reviewDrawer.type === 'stem'
          ? '复核进度已暂存'
          : '复核内容已暂存',
    )
    setReviewDrawer(null)
    setReviewContent('')
  }

  // 复核单元格：未收到复核申请则留空；「待复核」显示蓝色「复核」；已回复（已复核）显示灰色「查看」
  const renderReviewCell = (r: CandidateRow, type: ReviewType) => {
    const status = reviewStatusOf(r.candidate.papers[r.paperIdx], type)
    if (!status) return null
    const done = status === '已复核'
    return (
      <a
        onClick={() => openReview(r, type)}
        title={done ? '查看复核内容' : '进行复核'}
        style={done ? { color: '#8c8c8c' } : { color: '#1677ff' }}
      >
        <AuditOutlined style={{ marginRight: 4 }} />
        {done ? '查看' : '复核'}
      </a>
    )
  }

  // 导入：把校验通过的行追加进考生名单，考试状态一律从「未签到」开始
  const confirmImport = (rows: { name: string; no: string; gender: string; dept: string; idCard: string; phone: string }[]) => {
    if (rows.length === 0) return
    const paperCount = Math.max(1, exam ? paperCountOf(exam) : 2)
    setCandidates((list) => {
      // 考生编号沿用 KS + 年份 + 4 位序号，接着现有最大序号往后排
      const seq = list.reduce((max, c) => {
        const n = parseInt(c.candidateNo.replace(/\D/g, ''), 10)
        return Number.isNaN(n) ? max : Math.max(max, n)
      }, 0)
      const year = dayjs().format('YYYY')
      const added: Candidate[] = rows.map((r, i) => ({
        id: `imp-${Date.now()}-${i}`,
        no: r.no,
        candidateNo: `KS${year}${String(seq + i + 1).padStart(4, '0')}`,
        name: r.name,
        gender: r.gender || '—',
        dept: r.dept || '—',
        duty: '—',
        title: '—',
        dutyType: '—',
        idCard: r.idCard,
        phone: r.phone,
        papers: Array.from({ length: paperCount }, (): CandidatePaper => ({
          status: '未签到',
          attempts: 0,
          score: '-',
          finishTimes: [],
          firstSignInTime: '-',
        })),
      }))
      return [...list, ...added]
    })
    setImportOpen(false)
    message.success(`已导入 ${rows.length} 名考生`)
  }

  return (
    <Drawer
      title={`${exam?.name ?? ''} - 考生管理`}
      placement="right"
      width={1440}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ body: { padding: 16 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <Space>
          <Button type="primary" ghost icon={<PlusOutlined />}>添加考生</Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>导入考生</Button>
        </Space>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <Input
          placeholder="关键词"
          style={{ width: 180 }}
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          allowClear
        />
        <Select
          placeholder="考试状态"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          options={(['未签到', '考试中', '已完成', '缺考'] as CandidateStatus[]).map((s) => ({ value: s, label: s }))}
        />
      </div>

      <Table<CandidateRow>
        rowKey="key"
        size="small"
        scroll={{ x: 1260 }}
        dataSource={rows}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> }}
        pagination={false}
        columns={[
          // 移除：每人一个按钮，纵向合并；已签到过（有首次签到时间或已有考试次数）的置灰
          {
            title: '操作',
            width: 70,
            align: 'center' as const,
            render: (_: unknown, r: CandidateRow) => {
              if (!r.isFirst) return null
              const signed = hasSignedIn(r.candidate)
              return (
                <Popconfirm
                  title={`确认移除考生 ${r.candidate.name}？`}
                  okText="移除"
                  cancelText="再想想"
                  disabled={signed}
                  onConfirm={() => {
                    setCandidates((list) => list.filter((c) => c.id !== r.candidate.id))
                    message.success(`已移除考生 ${r.candidate.name}`)
                  }}
                >
                  <Button type="link" size="small" danger disabled={signed} title={signed ? '该考生已签到，不可移除' : undefined}>
                    移除
                  </Button>
                </Popconfirm>
              )
            },
            onCell: (r) => ({ rowSpan: r.isFirst ? r.candidate.papers.length : 0 }),
          },
          // 基本信息：同一考生两行纵向合并（rowSpan=2 / 0）
          {
            title: '序号',
            width: 60,
            render: (_: unknown, r: CandidateRow) => (r.isFirst ? filtered.indexOf(r.candidate) + 1 : ''),
            onCell: (r) => ({ rowSpan: r.isFirst ? r.candidate.papers.length : 0 }),
          },
          {
            title: '考生编号',
            width: 120,
            render: (_: unknown, r: CandidateRow) => r.candidate.candidateNo,
            onCell: (r) => ({ rowSpan: r.isFirst ? r.candidate.papers.length : 0 }),
          },
          {
            title: '工号',
            width: 100,
            render: (_: unknown, r: CandidateRow) => r.candidate.no,
            onCell: (r) => ({ rowSpan: r.isFirst ? r.candidate.papers.length : 0 }),
          },
          {
            title: '姓名',
            width: 90,
            render: (_: unknown, r: CandidateRow) => r.candidate.name,
            onCell: (r) => ({ rowSpan: r.isFirst ? r.candidate.papers.length : 0 }),
          },
          {
            title: '身份证号',
            width: 160,
            render: (_: unknown, r: CandidateRow) => r.candidate.idCard,
            onCell: (r) => ({ rowSpan: r.isFirst ? r.candidate.papers.length : 0 }),
          },
          {
            title: '手机号',
            width: 110,
            render: (_: unknown, r: CandidateRow) => r.candidate.phone,
            onCell: (r) => ({ rowSpan: r.isFirst ? r.candidate.papers.length : 0 }),
          },
          // 每套试卷一行：试卷 / 考试状态 / 次数 / 成绩 / 复核三列
          // 「已完成」的试卷可点击预览答卷，其余状态为普通文本
          {
            title: '试卷',
            width: 80,
            render: (_: unknown, r: CandidateRow) => {
              const paper = r.candidate.papers[r.paperIdx]
              const label = `第${r.paperIdx + 1}套`
              return paper.status === '已完成' ? (
                <a
                  onClick={() => {
                    setPreviewSeed(`${r.candidate.id}-${r.paperIdx}`)
                    setPreviewOpen(true)
                  }}
                  title="预览考试试卷"
                >
                  {label}
                </a>
              ) : (
                <span style={{ color: 'rgba(0,0,0,0.88)' }}>{label}</span>
              )
            },
          },
          {
            title: '考试状态',
            width: 100,
            render: (_: unknown, r: CandidateRow) => (
              <Tag color={CANDIDATE_STATUS_COLOR[r.candidate.papers[r.paperIdx].status]}>
                {r.candidate.papers[r.paperIdx].status}
              </Tag>
            ),
          },
          {
            title: '次数',
            width: 70,
            render: (_: unknown, r: CandidateRow) => `${r.candidate.papers[r.paperIdx].attempts} 次`,
          },
          {
            title: '成绩',
            width: 70,
            render: (_: unknown, r: CandidateRow) => {
              const v = r.candidate.papers[r.paperIdx].score
              return v === '-' ? '-' : `${v} 分`
            },
          },
          // 复核两列：考生申请复核 / 题干复核（总分复核已删除）
          {
            title: '考生申请',
            width: 110,
            align: 'center' as const,
            render: (_: unknown, r: CandidateRow) => renderReviewCell(r, 'apply'),
          },
          {
            title: '题干复核',
            width: 100,
            align: 'center' as const,
            render: (_: unknown, r: CandidateRow) => renderReviewCell(r, 'stem'),
          },
        ]}
      />

      {/* 试卷预览（预览操作入口） */}
      <PreviewDrawer
        exam={previewOpen ? exam : null}
        answerSeed={previewSeed}
        onClose={() => setPreviewOpen(false)}
      />

      {/* 导入考生 */}
      <ImportCandidateModal
        open={importOpen}
        existing={candidates}
        onCancel={() => setImportOpen(false)}
        onConfirm={confirmImport}
      />

      {/* 复核抽屉：考生申请复核=查看申请原因；题干复核=逐题明细 + 主观题重新打分 */}
      <Drawer
        title={
          reviewDrawer && reviewTarget
            ? `${REVIEW_TYPE_LABEL[reviewDrawer.type]} - ${reviewTarget.candidate.name}（第${reviewDrawer.paperIdx + 1}套）`
            : ''
        }
        placement="right"
        width={reviewDrawer?.type === 'stem' ? 960 : 480}
        open={!!reviewDrawer}
        onClose={() => setReviewDrawer(null)}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setReviewDrawer(null)}>取消</Button>
            <Button onClick={() => saveReview(false)}>暂存</Button>
            <Button type="primary" onClick={() => saveReview(true)}>提交</Button>
          </div>
        }
      >
        {reviewDrawer && reviewTarget && (
          <div>
            {reviewDrawer.type === 'apply' && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 6 }}>申请原因</div>
                <div
                  style={{
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    padding: '10px 12px',
                    fontSize: 14,
                    color: '#1a1a1a',
                    lineHeight: 1.7,
                    minHeight: 44,
                  }}
                >
                  {reviewTarget.paper.reviewReason || '（考生未填写申请原因）'}
                </div>
              </div>
            )}

            {reviewDrawer.type === 'stem' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 210px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ width: 3, height: 14, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>
                    题目明细（共 {stemQuestions.length} 题）
                  </span>
                </div>

                {stemQuestions.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该套试卷暂无作答明细" />
                ) : (
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 10 }}>
                    {stemQuestions.map((q) => {
                      const objective = isObjective(q.type)
                      const correct = objective && q.answer === q.standard
                      const val = reviewScores[q.id] ?? q.got
                      const changed = val !== q.got
                      const savedStatus: ReviewStatus = q.status ?? '待复核'
                      // 复核状态只读：被手动重新选择 / 重新打分后自动标记为已复核
                      const qStatus: ReviewStatus = reviewTouched[q.id] || savedStatus === '已复核' ? '已复核' : '待复核'
                      return (
                        <div key={q.id} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontWeight: 600 }}>第{q.no}题：</span>
                            <Tag color="blue">{q.type}</Tag>
                            <Tag color={qStatus === '已复核' ? 'success' : 'orange'} style={{ margin: 0, fontSize: 12, lineHeight: '20px' }}>
                              {qStatus}
                            </Tag>
                          </div>
                          {/* 题目：紧跟复核状态后直接显示（取原试卷中的题目序号 q.no，不做重新编号） */}
                          <div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>{q.content}</div>

                          <div style={{ display: 'flex', gap: 16 }}>
                            {/* 左栏：选项 / 参考答案 */}
                            <div style={{ flex: '1 1 0', minWidth: 0, fontSize: 13, lineHeight: 1.7 }}>
                              {q.options && (
                                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', lineHeight: 1.9, marginBottom: 8 }}>
                                  {q.options.map((o, oi) => (
                                    <div key={oi}>{String.fromCharCode(65 + oi)}. {o}</div>
                                  ))}
                                </div>
                              )}
                              <div style={{ fontSize: 12 }}>
                                参考答案：
                                {q.type === '实操题' ? (
                                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openMedia(q.id, 'rubric')}>
                                    评分表
                                  </Button>
                                ) : (
                                  <b>{objective ? (q.type === '判断题' ? optionLetter(q.options, q.standard) : (q.standard || '—')) : q.standard}</b>
                                )}
                              </div>
                            </div>

                            <div style={{ width: 1, background: '#f0f0f0', flex: '0 0 auto' }} />

                            {/* 右栏：考生作答 / 本题满分·考生得分 / 复核 */}
                            <div style={{ flex: '1 1 0', minWidth: 0, fontSize: 12, lineHeight: 1.9 }}>
                              <div>
                                考生作答：
                                {q.type === '实操题' ? (
                                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openMedia(q.id, 'video')}>
                                    视频录像预览
                                  </Button>
                                ) : (
                                  <b style={{ color: correct ? '#52c41a' : '#cf1322' }}>
                                    {objective
                                      ? (q.type === '判断题' ? optionLetter(q.options, q.answer) : (q.answer || '—'))
                                      : (q.answer || '—')}
                                  </b>
                                )}
                              </div>
                              <div style={{ marginTop: 4, color: 'rgba(0,0,0,0.65)' }}>
                                本题满分 {q.score} 分 · 考生得分：
                                <b style={{ color: val === q.score ? '#52c41a' : '#cf1322' }}>{val}</b> 分
                              </div>
                              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                复核：
                                {objective ? (
                                  <Radio.Group
                                    size="small"
                                    value={reviewTouched[q.id] ? (val === q.score ? 'correct' : 'error') : undefined}
                                    onChange={(e) => {
                                      setReviewScores((prev) => ({
                                        ...prev,
                                        [q.id]: e.target.value === 'correct' ? q.score : 0,
                                      }))
                                      setReviewTouched((prev) => ({ ...prev, [q.id]: true }))
                                    }}
                                  >
                                    <Radio value="error">考生答题错误</Radio>
                                    <Radio value="correct">考生答题正确</Radio>
                                  </Radio.Group>
                                ) : (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <InputNumber
                                      size="small"
                                      min={0}
                                      max={q.score}
                                      value={reviewTouched[q.id] ? val : undefined}
                                      onChange={(v) => {
                                        setReviewScores((prev) => ({ ...prev, [q.id]: v ?? 0 }))
                                        setReviewTouched((prev) => ({ ...prev, [q.id]: true }))
                                      }}
                                      style={{ width: 72 }}
                                    />
                                    <span>分</span>
                                    {changed && <Tag color="orange">已调整 {val - q.got > 0 ? '+' : ''}{val - q.got}</Tag>}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {reviewDrawer.type === 'score' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ width: 3, height: 14, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>总分复核</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                    fontSize: 13,
                    color: 'rgba(0,0,0,0.65)',
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    padding: '10px 12px',
                  }}
                >
                  <span>
                    当前成绩：
                    <b style={{ color: '#1a1a1a' }}>
                      {typeof reviewTarget.paper.score === 'number' ? `${reviewTarget.paper.score} 分` : '待出分'}
                    </b>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    复核后成绩：
                    <InputNumber
                      size="small"
                      min={0}
                      value={scoreAfter}
                      onChange={(v) => setScoreAfter(v ?? null)}
                      style={{ width: 90 }}
                    />
                    分
                  </span>
                  {typeof reviewTarget.paper.score === 'number' && scoreAfter != null && scoreAfter !== reviewTarget.paper.score && (
                    <Tag color="orange">
                      已调整 {scoreAfter - reviewTarget.paper.score > 0 ? '+' : ''}
                      {scoreAfter - reviewTarget.paper.score}
                    </Tag>
                  )}
                </div>
              </div>
            )}

            {/* 题干复核不做「复核内容」填写，复核状态已下放到每题；其余类型保留 */}
            {reviewDrawer.type !== 'stem' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#1a1a1a', marginBottom: 6 }}>
                    复核内容<span style={{ color: '#cf1322', marginLeft: 4 }}>*</span>
                  </div>
                  <Input.TextArea
                    rows={8}
                    maxLength={500}
                    showCount
                    placeholder="请填写复核意见与结论"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                  />
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  当前复核状态：
                  {reviewStatusOf(reviewTarget.paper, reviewDrawer.type) ? (
                    <Tag
                      color={
                        REVIEW_STATUS_COLOR[reviewStatusOf(reviewTarget.paper, reviewDrawer.type) as '待复核' | '已复核']
                      }
                    >
                      {reviewStatusOf(reviewTarget.paper, reviewDrawer.type)}
                    </Tag>
                  ) : (
                    '无'
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* 实操题：评分表 / 视频录像预览 —— 可拖动浮动窗口（非模态，支持同时打开多个） */}
        {mediaWindows.map((w, i) => (
          <FloatingMedia
            key={`${w.qid}-${w.kind}`}
            title={w.kind === 'rubric' ? '评分表' : '视频录像预览'}
            width={w.kind === 'video' ? 640 : 520}
            index={i}
            onClose={() => closeMedia(w.qid, w.kind)}
          >
            {w.kind === 'rubric' ? (() => {
              const rq = stemQuestions.find((q) => q.id === w.qid)
              const total = rq?.score ?? 0
              const a = Math.round(total * 0.4)
              const b = Math.round(total * 0.3)
              const c = total - a - b
              const items = [
                { name: '操作规范', score: a, got: a },
                { name: '流程完整', score: b, got: b },
                { name: '结果准确', score: c, got: c },
              ]
              const cell: React.CSSProperties = { border: '1px solid #f0f0f0', padding: '8px 10px' }
              return (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      <th style={cell}>评分项目</th>
                      <th style={cell}>标准分值</th>
                      <th style={cell}>考生得分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i}>
                        <td style={cell}>{it.name}</td>
                        <td style={cell}>{it.score}</td>
                        <td style={cell}><b style={{ color: '#1677ff' }}>{it.got}</b></td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, background: '#fafcff' }}>
                      <td style={cell}>合计</td>
                      <td style={cell}>{total}</td>
                      <td style={cell}>{items.reduce((s, it) => s + it.got, 0)}</td>
                    </tr>
                  </tbody>
                </table>
              )
            })() : (
              <div
                style={{
                  aspectRatio: '16 / 9',
                  background: '#000',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 44, lineHeight: 1 }}>▶</div>
                  <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>视频录像预览（虚拟）</div>
                </div>
              </div>
            )}
          </FloatingMedia>
        ))}
      </Drawer>
    </Drawer>
  )
}

// ===== 可拖动的浮动窗口（非模态）：标题栏可拖动，无遮罩，不拦截其它按钮点击，仅手动关闭 =====
const FloatingMedia: React.FC<{
  title: string
  width: number
  index: number
  onClose: () => void
  children: React.ReactNode
}> = ({ title, width, index, onClose, children }) => {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: Math.max(20, Math.round((window.innerWidth - width) / 2) + index * 32),
    y: Math.max(20, Math.round((window.innerHeight - 380) / 2) + index * 32),
  }))
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y }
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const nx = dragRef.current.ox + (ev.clientX - dragRef.current.sx)
      const ny = dragRef.current.oy + (ev.clientY - dragRef.current.sy)
      setPos({ x: Math.max(0, nx), y: Math.max(0, ny) })
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
        zIndex: 2000,
        overflow: 'hidden',
      }}
    >
      <div
        onMouseDown={onMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#1677ff',
          color: '#fff',
          cursor: 'move',
          fontSize: 14,
          fontWeight: 600,
          userSelect: 'none',
        }}
      >
        <span>{title}</span>
        <span
          onClick={onClose}
          style={{ cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
          title="关闭"
        >
          ×
        </span>
      </div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  )
}

// ===== 考官设置抽屉 =====
/** 阅评方式（理论 / 实操通用，全考试类型统一） */
// ===== 延期考试弹窗（试卷维护 / 开启考试共用） =====
export const DelayModal: React.FC<{
  exam: TheoryExamRecord | null
  onClose: () => void
  onConfirm: (patch: { examTime: string; duration: string; runTime: string }) => void
}> = ({ exam, onClose, onConfirm }) => {
  const [start, setStart] = useState<dayjs.Dayjs | null>(null)
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null)
  const [hours, setHours] = useState<number | null>(null)
  const [minutes, setMinutes] = useState<number | null>(null)

  // 打开时按当前考试记录回填考试时间 / 考试限时
  useEffect(() => {
    if (exam) {
      const [s, en] = parseExamTime(exam.examTime)
      const [h, m] = parseDuration(exam.duration)
      setStart(s)
      setEnd(en)
      setHours(h)
      setMinutes(m)
    }
  }, [exam])

  const handleOk = () => {
    if (!start || !end) {
      message.warning('请选择完整的考试起止时间')
      return
    }
    if (!end.isAfter(start)) {
      message.warning('结束时间需晚于开始时间')
      return
    }
    const h = hours ?? 0
    const m = minutes ?? 0
    const examTime = `${start.format('YYYY-MM-DD HH:mm')} ~ ${
      end.isSame(start, 'day') ? end.format('HH:mm') : end.format('MM-DD HH:mm')
    }`
    const duration = h > 0 || m > 0 ? `${h} 小时 ${m} 分钟` : '不限时'
    const runTime = `${start.format('MM-DD HH:mm')} ~ ${end.format('MM-DD HH:mm')}`
    onConfirm({ examTime, duration, runTime })
  }

  return (
    <Modal
      title="延期"
      open={!!exam}
      onOk={handleOk}
      onCancel={onClose}
      okText="确定"
      cancelText="取消"
      width={620}
      destroyOnClose
    >
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 16px' }}>
        <span style={{ width: 76, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>考试时间
        </span>
        <Space size={5}>
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: 208 }}
            placeholder="请选择开始时间"
            value={start}
            onChange={(v) => setStart(v)}
          />
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>至</span>
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: 208 }}
            placeholder="请选择结束时间"
            value={end}
            onChange={(v) => setEnd(v)}
          />
        </Space>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ width: 76, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', whiteSpace: 'nowrap' }}>
          考试限时
        </span>
        <Space size={5}>
          <InputNumber
            min={0}
            precision={0}
            style={{ width: 110 }}
            placeholder="0"
            value={hours}
            onChange={(v) => setHours(v)}
          />
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>小时</span>
          <InputNumber
            min={0}
            precision={0}
            style={{ width: 110 }}
            placeholder="0"
            value={minutes}
            onChange={(v) => setMinutes(v)}
          />
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>分钟</span>
          {(hours != null || minutes != null) && (
            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
              共{(hours ?? 0) * 60 + (minutes ?? 0)}分钟
            </span>
          )}
        </Space>
      </div>
    </Modal>
  )
}

// ===== 复制考试抽屉（试卷维护 / 开启考试共用） =====
export const CopyExamDrawer: React.FC<{
  source: TheoryExamRecord | null
  onClose: () => void
  onConfirm: (record: TheoryExamRecord) => void
}> = ({ source, onClose, onConfirm }) => {
  const [name, setName] = useState('')
  const [copyInfo, setCopyInfo] = useState(true)
  const [copyCandidates, setCopyCandidates] = useState(true)
  const [copyExaminers, setCopyExaminers] = useState(true)
  const [copyNotice, setCopyNotice] = useState(true)

  // 打开时重置为默认复制选项
  useEffect(() => {
    if (source) {
      setName(`${source.name}（副本）`)
      setCopyInfo(true)
      setCopyCandidates(true)
      setCopyExaminers(true)
      setCopyNotice(true)
    }
  }, [source])

  const handleSubmit = () => {
    if (!source) return
    const base: Pick<TheoryExamRecord, 'id' | 'name' | 'status' | 'examined' | 'enrolled'> = {
      id: `e${Date.now()}`,
      name: name.trim() || `${source.name}（副本）`,
      status: '未发布',
      examined: 0,
      enrolled: 0,
    }
    let newExam: TheoryExamRecord
    if (copyInfo) {
      // 复制考试信息：整条考试配置带入
      newExam = { ...source, ...base }
    } else {
      // 不复制考试信息：仅保留基础字段（必填项给默认值）
      newExam = {
        ...base,
        category: source.category,
        examType: source.examType,
        period: source.period,
        totalScore: 100,
        passScore: 60,
        timeMode: '不计时',
        runTime: '',
        attempts: 1,
      }
    }
    if (!copyExaminers) {
      // 不复制考官设置：剥离考官相关字段
      const { chiefExaminer, examiners, gradeMode, examinerAssigns, ...rest } = newExam
      newExam = rest
    }
    onConfirm(newExam)
    const parts = [copyInfo && '考试信息', copyCandidates && '考生列表', copyExaminers && '考官设置', copyNotice && '考生须知']
      .filter(Boolean)
      .join('、')
    message.success(`已复制「${source.name}」→「${newExam.name}」${parts ? `（含${parts}）` : '（仅基础信息）'}`)
  }

  return (
    <Drawer
      title="复制考试"
      placement="right"
      width={420}
      open={!!source}
      onClose={onClose}
      styles={{ body: { padding: 16 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>提交</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ marginBottom: 6, color: 'rgba(0,0,0,0.65)' }}>考试名称</div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入复制后的考试名称"
            maxLength={50}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8, color: 'rgba(0,0,0,0.65)' }}>复制内容</div>
          <Space direction="vertical">
            <Checkbox checked={copyInfo} onChange={(e) => setCopyInfo(e.target.checked)}>复制考试信息</Checkbox>
            <Checkbox checked={copyCandidates} onChange={(e) => setCopyCandidates(e.target.checked)}>复制考生列表</Checkbox>
            <Checkbox checked={copyExaminers} onChange={(e) => setCopyExaminers(e.target.checked)}>复制考官设置</Checkbox>
            <Checkbox checked={copyNotice} onChange={(e) => setCopyNotice(e.target.checked)}>复制考生须知</Checkbox>
          </Space>
        </div>
      </div>
    </Drawer>
  )
}

const GRADE_MODES: GradeMode[] = ['随机平均分配']

/** 「分配阅卷人」的可选题型（按题型逐个指定阅卷人） */
const GRADE_TYPE_OPTIONS = ['填空题', '简答题', '实操题'].map((v) => ({ value: v, label: v }))

export const ExaminerSettingsDrawer: React.FC<{
  open: boolean
  exam: TheoryExamRecord | null
  onClose: () => void
  onSave: (record: TheoryExamRecord) => void
}> = ({ open, exam, onClose, onSave }) => {
  const [chief, setChief] = useState<string | undefined>(undefined)
  const [gradeMode, setGradeMode] = useState<GradeMode>('随机平均分配')
  // 按题型分配阅卷人：题型 → 阅卷人（多人）
  const [typeAssigns, setTypeAssigns] = useState<Record<string, string[]>>({})

  // 每次打开时按当前考试记录初始化
  useEffect(() => {
    if (open && exam) {
      setChief(exam.chiefExaminer ?? undefined)
      const saveMode = exam.gradeMode
      setGradeMode(saveMode && GRADE_MODES.includes(saveMode) ? saveMode : '随机平均分配')
      // 由 examinerAssigns 反推「题型 → 阅卷人」
      const map: Record<string, string[]> = {}
      Object.entries(exam.examinerAssigns ?? {}).forEach(([name, a]) => {
        ;(a.types ?? []).forEach((t) => {
          if (!map[t]) map[t] = []
          if (!map[t].includes(name)) map[t].push(name)
        })
      })
      setTypeAssigns(map)
    }
  }, [open, exam])

  /** 由「题型 → 阅卷人」回写为 阅卷人 → 分配明细（阅卷人即由题型分配结果汇总） */
  const handleSave = () => {
    if (!exam) return
    const examinerAssigns: Record<string, ExaminerAssign> = {}
    GRADE_TYPE_OPTIONS.forEach(({ value: t }) => {
      ;(typeAssigns[t] ?? []).forEach((name) => {
        if (!examinerAssigns[name]) examinerAssigns[name] = { types: [] }
        examinerAssigns[name].types!.push(t)
      })
    })
    onSave({
      ...exam,
      chiefExaminer: chief,
      examiners: Object.keys(examinerAssigns),
      gradeMode,
      examinerAssigns,
    })
  }

  const toggleType = (t: string, v: string[]) => setTypeAssigns((p) => ({ ...p, [t]: v }))

  return (
    <Drawer
      title={`考官设置 - ${exam?.name ?? ''}`}
      placement="right"
      width={960}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ body: { padding: 16 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave}>保存</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginBottom: 6 }}>
            <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>主考官
          </div>
          <Select
            allowClear
            showSearch
            placeholder="请选择主考官"
            style={{ width: '100%' }}
            value={chief}
            onChange={(v) => setChief(v)}
            options={EXAMINER_SELECT_OPTIONS}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginBottom: 8 }}>阅评方式</div>
          <Radio.Group value={gradeMode} onChange={(e) => setGradeMode(e.target.value)}>
            {GRADE_MODES.map((m) => (
              <Radio key={m} value={m} style={{ marginRight: 24 }}>
                {m}
              </Radio>
            ))}
          </Radio.Group>
        </div>

        {/* 分配阅卷人：填空题 / 简答题 / 实操题逐个指定阅卷人（默认展示） */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', fontWeight: 500 }}>分配阅卷人</span>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              请为各题型指定阅卷人（可多选）
            </span>
          </div>
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {GRADE_TYPE_OPTIONS.map(({ value: t }, i) => (
              <div
                key={t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderTop: i === 0 ? 'none' : '1px solid #f0f0f0',
                  background: i % 2 === 1 ? '#fafafa' : '#fff',
                }}
              >
                <span style={{ width: 76, flexShrink: 0, fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
                  {t}
                </span>
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  maxTagCount="responsive"
                  placeholder={`请选择「${t}」的阅卷人（可多选）`}
                  style={{ flex: 1 }}
                  value={typeAssigns[t] ?? []}
                  onChange={(v: string[]) => toggleType(t, v)}
                  options={EXAMINER_SELECT_OPTIONS}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export default TheoryExam
