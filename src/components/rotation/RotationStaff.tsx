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
  Popconfirm,
  Tooltip,
  message,
  Empty,
  Descriptions,
  Segmented,
  Alert,
  Steps,
  DatePicker,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserAddOutlined,
  EyeOutlined,
  TeamOutlined,
  ApartmentOutlined,
  TableOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  UserOutlined,
  CaretRightOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { INITIAL_BASES, ROTATION_PLANS, getPlanLabel, type BaseRecord } from './rotationShared'

// ==================== 类型定义 ====================

interface RotationStaffRecord {
  id: string
  name: string
  employeeNo: string
  unit: string
  department: string
  gender: '男' | '女'
  phone: string
  title: string
  base: string
  school?: string
  major?: string
  // 第一学历 / 最高学历（只读）
  firstEducation?: string
  highestEducation?: string
  // 人员维度状态：未安排 / 轮转中 / 结束
  personStatus: '未安排' | '轮转中' | '结束'
  // 所属分组（可加入多个，为空数组表示未分组）
  groupIds: string[]
  // 轮转周期：2年 / 3年（可选）
  rotationPeriod?: '2年' | '3年'
  // 该人员使用的轮转计划名称
  planName?: string
  rotationStatus: '未开始' | '轮转中' | '已完成' | '已暂停'
  // 执行轮转安排后写入的拟开始 / 拟结束日期
  planStart?: string
  planEnd?: string
  cycleStart: string
  cycleEnd: string
  totalMonths: number
  currentDept: string
  currentMonth: number
}

interface StaffGroup {
  id: string
  name: string
  description: string
}

interface RotationDetail {
  key: string
  index: number
  rotationDept: string
  planStart: string
  planEnd: string
  duration: number
  status: '未开始' | '轮转中' | '轮转结束'
  actualStart: string
  actualEnd: string
  checkInDate: string
  checkOutDate: string
  teacherName: string // 带教老师
  summary: string // 出科小结
}

// ==================== 选项 ====================

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
]

const UNIT_OPTIONS = [
  { label: '市中心医院', value: '市中心医院' },
  { label: '人民医院', value: '人民医院' },
  { label: '第一附属医院', value: '第一附属医院' },
]

const TITLE_OPTIONS = [
  { label: '住院医师', value: '住院医师' },
  { label: '主治医师', value: '主治医师' },
  { label: '副主任医师', value: '副主任医师' },
  { label: '主任医师', value: '主任医师' },
  { label: '规培生', value: '规培生' },
  { label: '进修生', value: '进修生' },
]

const BASE_OPTIONS = [
  { label: '内科基地', value: '内科基地' },
  { label: '外科基地', value: '外科基地' },
  { label: '全科基地', value: '全科基地' },
  { label: '妇产科基地', value: '妇产科基地' },
  { label: '儿科基地', value: '儿科基地' },
]

const SCHOOL_OPTIONS = [
  { label: '北京协和医学院', value: '北京协和医学院' },
  { label: '复旦大学上海医学院', value: '复旦大学上海医学院' },
  { label: '中山大学中山医学院', value: '中山大学中山医学院' },
  { label: '四川大学华西医学中心', value: '四川大学华西医学中心' },
  { label: '华中科技大学同济医学院', value: '华中科技大学同济医学院' },
  { label: '浙江大学医学院', value: '浙江大学医学院' },
  { label: '首都医科大学', value: '首都医科大学' },
  { label: '中国医科大学', value: '中国医科大学' },
]

const MAJOR_OPTIONS = [
  { label: '临床医学', value: '临床医学' },
  { label: '医学影像学', value: '医学影像学' },
  { label: '麻醉学', value: '麻醉学' },
  { label: '儿科学', value: '儿科学' },
  { label: '妇产科学', value: '妇产科学' },
  { label: '急诊医学', value: '急诊医学' },
  { label: '检验医学', value: '检验医学' },
  { label: '全科医学', value: '全科医学' },
]

const PERSON_STATUS_OPTIONS = [
  { label: '未安排', value: '未安排' },
  { label: '轮转中', value: '轮转中' },
  { label: '结束', value: '结束' },
]

const ROTATION_STATUS_OPTIONS = [
  { label: '未开始', value: '未开始' },
  { label: '轮转中', value: '轮转中' },
  { label: '已完成', value: '已完成' },
  { label: '已暂停', value: '已暂停' },
]

const ROTATION_PERIOD_OPTIONS = [
  { label: '2年', value: '2年' },
  { label: '3年', value: '3年' },
]

const personStatusColorMap: Record<string, string> = {
  '未安排': 'default',
  '轮转中': 'processing',
  '结束': 'success',
}

const statusColorMap: Record<string, string> = {
  '未开始': 'default',
  '轮转中': 'processing',
  '已完成': 'success',
  '已暂停': 'warning',
  '轮转结束': 'success',
}

// ==================== 轮转计划（执行轮转安排用，派生自专业基地） ====================

const PLAN_OPTIONS = ROTATION_PLANS.map((p) => ({ label: p.label, value: p.id }))

// 专业名称 → 专业方向（用于推荐轮转计划）
const MAJOR_DIRECTION_MAP: Record<string, string> = {
  '临床医学': '内科专业',
  '全科医学': '全科专业',
  '妇产科学': '妇产科专业',
  '儿科学': '儿科专业',
  '急诊医学': '急诊科专业',
  '医学影像学': '医学影像科专业',
  '麻醉学': '麻醉科专业',
  '检验医学': '检验医学科专业',
}

// 按开始日期 + 月数计算结束日期（首尾含当天：结束日 = 开始日 + 月数 - 1 天）
function calcEndDate(startStr: string, months: number): string {
  return dayjs(startStr).add(months, 'month').subtract(1, 'day').format('YYYY-MM-DD')
}

// ==================== 初始化数据 ====================

const initialGroups: StaffGroup[] = [
  { id: 'g1', name: 'A组', description: '内科及外科方向轮转小组' },
  { id: 'g2', name: 'B组', description: '急诊与影像方向轮转小组' },
  { id: 'g3', name: 'C组', description: '儿科及检验方向轮转小组' },
  { id: 'g4', name: 'D组', description: '妇产科及综合方向轮转小组' },
]

const mockData: RotationStaffRecord[] = [
  { id: '1', name: '张明', employeeNo: 'EMP001', unit: '市中心医院', department: '内科', gender: '男', phone: '13800000001', title: '住院医师', base: '内科基地', school: '首都医科大学', major: '临床医学', firstEducation: '本科', highestEducation: '硕士', personStatus: '轮转中', groupIds: ['g1'], rotationPeriod: '3年', planName: '内科住院医师规培轮转计划（3年）', rotationStatus: '轮转中', cycleStart: '2026-01-01', cycleEnd: '2026-12-31', totalMonths: 12, currentDept: '外科', currentMonth: 3 },
  { id: '2', name: '李华', employeeNo: 'EMP002', unit: '市中心医院', department: '外科', gender: '男', phone: '13800000002', title: '规培生', base: '外科基地', school: '复旦大学上海医学院', major: '临床医学', firstEducation: '本科', highestEducation: '本科', personStatus: '轮转中', groupIds: ['g2'], rotationPeriod: '2年', planName: '外科住院医师规培轮转计划（2年）', rotationStatus: '轮转中', cycleStart: '2026-03-01', cycleEnd: '2027-02-28', totalMonths: 12, currentDept: '急诊科', currentMonth: 5 },
  { id: '3', name: '王芳', employeeNo: 'EMP003', unit: '人民医院', department: '妇产科', gender: '女', phone: '13800000003', title: '住院医师', base: '妇产科基地', school: '中山大学中山医学院', major: '妇产科学', firstEducation: '本科', highestEducation: '硕士', personStatus: '未安排', groupIds: ['g1'], rotationPeriod: '2年', planName: '妇产科住院医师规培轮转计划（2年）', rotationStatus: '未开始', cycleStart: '2026-09-01', cycleEnd: '2027-08-31', totalMonths: 12, currentDept: '-', currentMonth: 0 },
  { id: '4', name: '刘强', employeeNo: 'EMP004', unit: '人民医院', department: '儿科', gender: '男', phone: '13800000004', title: '主治医师', base: '儿科基地', school: '华中科技大学同济医学院', major: '儿科学', firstEducation: '本科', highestEducation: '博士', personStatus: '结束', groupIds: ['g3'], rotationPeriod: '3年', planName: '儿科住院医师规培轮转计划（3年）', rotationStatus: '已完成', cycleStart: '2025-01-01', cycleEnd: '2025-12-31', totalMonths: 12, currentDept: '-', currentMonth: 12 },
  { id: '5', name: '陈静', employeeNo: 'EMP005', unit: '第一附属医院', department: '急诊科', gender: '女', phone: '13800000005', title: '规培生', base: '内科基地', school: '浙江大学医学院', major: '急诊医学', firstEducation: '本科', highestEducation: '硕士', personStatus: '结束', groupIds: ['g4'], rotationPeriod: '2年', planName: '内科住院医师规培轮转计划（2年）', rotationStatus: '已暂停', cycleStart: '2026-02-01', cycleEnd: '2027-01-31', totalMonths: 12, currentDept: '麻醉科', currentMonth: 4 },
  { id: '6', name: '赵伟', employeeNo: 'EMP006', unit: '市中心医院', department: '内科', gender: '男', phone: '13800000006', title: '住院医师', base: '内科基地', school: '中国医科大学', major: '临床医学', firstEducation: '本科', highestEducation: '硕士', personStatus: '轮转中', groupIds: ['g2'], rotationPeriod: '3年', planName: '内科住院医师规培轮转计划（3年）', rotationStatus: '轮转中', cycleStart: '2026-04-01', cycleEnd: '2027-03-31', totalMonths: 12, currentDept: '影像科', currentMonth: 2 },
  { id: '7', name: '孙莉', employeeNo: 'EMP007', unit: '人民医院', department: '外科', gender: '女', phone: '13800000007', title: '进修生', base: '外科基地', school: '四川大学华西医学中心', major: '麻醉学', firstEducation: '大专', highestEducation: '本科', personStatus: '轮转中', groupIds: ['g1'], rotationPeriod: '2年', planName: '外科住院医师规培轮转计划（2年）', rotationStatus: '轮转中', cycleStart: '2026-05-01', cycleEnd: '2026-11-30', totalMonths: 6, currentDept: '病理科', currentMonth: 1 },
  { id: '8', name: '周涛', employeeNo: 'EMP008', unit: '第一附属医院', department: '检验科', gender: '男', phone: '13800000008', title: '住院医师', base: '内科基地', school: '北京协和医学院', major: '检验医学', firstEducation: '本科', highestEducation: '硕士', personStatus: '未安排', groupIds: ['g3'], rotationPeriod: '3年', planName: '内科住院医师规培轮转计划（3年）', rotationStatus: '未开始', cycleStart: '2026-10-01', cycleEnd: '2027-09-30', totalMonths: 12, currentDept: '-', currentMonth: 0 },
  // —— 以下为全院未分组人员 ——
  { id: '9', name: '吴磊', employeeNo: 'EMP009', unit: '市中心医院', department: '内科', gender: '男', phone: '13800000009', title: '规培生', base: '内科基地', school: '首都医科大学', major: '临床医学', firstEducation: '本科', highestEducation: '本科', personStatus: '未安排', groupIds: [], rotationPeriod: '2年', rotationStatus: '未开始', cycleStart: '-', cycleEnd: '-', totalMonths: 0, currentDept: '-', currentMonth: 0 },
  { id: '10', name: '郑梅', employeeNo: 'EMP010', unit: '人民医院', department: '外科', gender: '女', phone: '13800000010', title: '进修生', base: '外科基地', school: '复旦大学上海医学院', major: '麻醉学', firstEducation: '本科', highestEducation: '硕士', personStatus: '未安排', groupIds: [], rotationPeriod: '2年', rotationStatus: '未开始', cycleStart: '-', cycleEnd: '-', totalMonths: 0, currentDept: '-', currentMonth: 0 },
  { id: '11', name: '冯雪', employeeNo: 'EMP011', unit: '第一附属医院', department: '妇产科', gender: '女', phone: '13800000011', title: '住院医师', base: '妇产科基地', school: '中山大学中山医学院', major: '妇产科学', firstEducation: '本科', highestEducation: '硕士', personStatus: '未安排', groupIds: [], rotationPeriod: '2年', rotationStatus: '未开始', cycleStart: '-', cycleEnd: '-', totalMonths: 0, currentDept: '-', currentMonth: 0 },
  { id: '12', name: '何军', employeeNo: 'EMP012', unit: '市中心医院', department: '儿科', gender: '男', phone: '13800000012', title: '规培生', base: '儿科基地', school: '华中科技大学同济医学院', major: '儿科学', firstEducation: '本科', highestEducation: '本科', personStatus: '未安排', groupIds: [], rotationPeriod: '3年', rotationStatus: '未开始', cycleStart: '-', cycleEnd: '-', totalMonths: 0, currentDept: '-', currentMonth: 0 },
  { id: '13', name: '许文', employeeNo: 'EMP013', unit: '人民医院', department: '急诊科', gender: '男', phone: '13800000013', title: '主治医师', base: '内科基地', school: '浙江大学医学院', major: '急诊医学', firstEducation: '本科', highestEducation: '博士', personStatus: '未安排', groupIds: [], rotationPeriod: '2年', rotationStatus: '未开始', cycleStart: '-', cycleEnd: '-', totalMonths: 0, currentDept: '-', currentMonth: 0 },
  { id: '14', name: '邓超', employeeNo: 'EMP014', unit: '第一附属医院', department: '麻醉科', gender: '男', phone: '13800000014', title: '住院医师', base: '外科基地', school: '中国医科大学', major: '医学影像学', firstEducation: '本科', highestEducation: '硕士', personStatus: '未安排', groupIds: [], rotationPeriod: '2年', rotationStatus: '未开始', cycleStart: '-', cycleEnd: '-', totalMonths: 0, currentDept: '-', currentMonth: 0 },
]

// 生成轮转详情模拟数据
function getRotationDetails(record: RotationStaffRecord): RotationDetail[] {
  const details: RotationDetail[] = []
  const deptList = [
    { dept: '内科', months: 3, teacher: '王建国' },
    { dept: '外科', months: 3, teacher: '李国强' },
    { dept: '急诊科', months: 2, teacher: '赵明德' },
    { dept: '麻醉科', months: 2, teacher: '陈志远' },
    { dept: '影像科', months: 2, teacher: '黄丽娟' },
  ]
  let cumMonth = 0
  deptList.forEach((d, i) => {
    const startMonth = cumMonth + 1
    const endMonth = cumMonth + d.months
    cumMonth = endMonth
    const planStart = addMonths(record.cycleStart, startMonth - 1)
    const planEnd = addMonths(record.cycleStart, endMonth - 1)
    let status: '未开始' | '轮转中' | '轮转结束' = '未开始'
    let actualStart = '--'
    let actualEnd = '--'
    let checkInDate = '--'
    let checkOutDate = '--'
    let summary = ''
    if (record.currentMonth >= endMonth) {
      status = '轮转结束'
      actualStart = planStart
      actualEnd = planEnd
      checkInDate = planStart
      checkOutDate = planEnd
      if (d.dept === '内科') summary = '内科轮转期间表现优秀，掌握了心血管、呼吸、消化系统常见病的诊断与治疗，理论考核85分，技能操作合格。'
      else if (d.dept === '急诊科') summary = '急诊科轮转期间学习态度积极，掌握了急危重症识别与处理，心肺复苏技术熟练。'
      else summary = `${d.dept}轮转完成，考核合格。`
    } else if (record.currentMonth >= startMonth) {
      status = '轮转中'
      actualStart = planStart
      checkInDate = planStart
    }
    details.push({
      key: String(i + 1),
      index: i + 1,
      rotationDept: d.dept,
      planStart,
      planEnd,
      duration: d.months,
      status,
      actualStart,
      actualEnd,
      checkInDate,
      checkOutDate,
      teacherName: d.teacher,
      summary,
    })
  })
  return details
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const genId = () => `g${Date.now()}${Math.floor(Math.random() * 1000)}`

// 左侧人员分组的两级 scope key（已分组整体 / 未分组整体）
export const GROUPED_SCOPE_KEY = '__scope_grouped__'
export const UNGROUPED_SCOPE_KEY = '__scope_ungrouped__'

// ==================== 组件 ====================

const RotationStaff: React.FC = () => {
  const [data, setData] = useState<RotationStaffRecord[]>(mockData)
  const [groups, setGroups] = useState<StaffGroup[]>(initialGroups)
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined)
  // 已分组 scope 的子节点展开状态
  const [groupedExpanded, setGroupedExpanded] = useState<boolean>(true)

  // 当前选中是否为真实分组 id（不是虚拟 scope）
  const isRealGroupId = (id: string | undefined): boolean =>
    !!id && id !== GROUPED_SCOPE_KEY && id !== UNGROUPED_SCOPE_KEY

  // 当前 scope 显示名（用于标题、message）
  const selectedScopeName: string | null =
    selectedGroupId === UNGROUPED_SCOPE_KEY
      ? '未分组'
      : selectedGroupId === GROUPED_SCOPE_KEY
      ? '已分组'
      : isRealGroupId(selectedGroupId)
      ? groups.find((g) => g.id === selectedGroupId)?.name || ''
      : null
  const [hoverGroupId, setHoverGroupId] = useState<string | null>(null)

  // 分组 新建/编辑
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [groupModalMode, setGroupModalMode] = useState<'create' | 'edit'>('create')
  const [editingGroup, setEditingGroup] = useState<StaffGroup | null>(null)
  const [groupForm] = Form.useForm()

  // 添加人员
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addFilters, setAddFilters] = useState<{ unit?: string; dept?: string; keyword?: string; status?: string }>({})
  const [addSelectedKeys, setAddSelectedKeys] = useState<React.Key[]>([])

  // 查看详情
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RotationStaffRecord | null>(null)
  const [detailViewMode, setDetailViewMode] = useState<'table' | 'flow'>('table')
  const [selectedDetailKey, setSelectedDetailKey] = useState<string | null>(null)

  // 调整成员分组
  const [memberEditOpen, setMemberEditOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<RotationStaffRecord | null>(null)
  const [memberEditForm] = Form.useForm()

  // 主表格行多选 + 批量调整
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [batchEditOpen, setBatchEditOpen] = useState(false)
  const [batchEditForm] = Form.useForm()

  // 人员列表筛选条件
  const [memberFilters, setMemberFilters] = useState<{ keyword?: string; status?: string }>({})

  // 执行轮转安排（向导）
  const [executeOpen, setExecuteOpen] = useState(false)
  const [execStep, setExecStep] = useState(0)
  const [execStaffIds, setExecStaffIds] = useState<string[]>([])
  const [execPlanId, setExecPlanId] = useState<string | undefined>(undefined)
  const [execStart, setExecStart] = useState<dayjs.Dayjs | null>(null)
  const [execKeyword, setExecKeyword] = useState('')
  const [execSchool, setExecSchool] = useState<string | undefined>(undefined)
  const [execMajor, setExecMajor] = useState<string | undefined>(undefined)

  // 分组列表（含成员计数）
  const groupsWithCount = useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        count: data.filter((d) => d.groupIds.includes(g.id)).length,
      })),
    [groups, data],
  )

  const groupNameOf = (id: string) => groups.find((g) => g.id === id)?.name || '未知分组'

  // 当前 scope 下的成员（scope：全部 / 已分组整体 / 未分组整体 / 某个具体分组）
  const members = useMemo(() => {
    if (!selectedGroupId) return data
    if (selectedGroupId === GROUPED_SCOPE_KEY) return data.filter((d) => d.groupIds.length > 0)
    if (selectedGroupId === UNGROUPED_SCOPE_KEY) return data.filter((d) => d.groupIds.length === 0)
    return data.filter((d) => d.groupIds.includes(selectedGroupId))
  }, [data, selectedGroupId])

  // 成员列表（按关键词 / 状态筛选；任何 scope 选中时都走 members）
  const filteredMembers = useMemo(() => {
    const hasScope = !!selectedGroupId
    const base = hasScope ? members : data
    let list = base
    if (memberFilters.status) list = list.filter((d) => d.rotationStatus === memberFilters.status)
    if (memberFilters.keyword && memberFilters.keyword.trim()) {
      const kw = memberFilters.keyword.trim().toLowerCase()
      list = list.filter((d) => d.name.toLowerCase().includes(kw) || d.employeeNo.toLowerCase().includes(kw))
    }
    return list
  }, [selectedGroupId, members, data, memberFilters])

  // 全院未分组人员（按筛选条件过滤）
  const ungroupedFiltered = useMemo(() => {
    let list = data.filter((d) => d.groupIds.length === 0)
    if (addFilters.unit) list = list.filter((d) => d.unit === addFilters.unit)
    if (addFilters.dept) list = list.filter((d) => d.department === addFilters.dept)
    if (addFilters.status) list = list.filter((d) => d.rotationStatus === addFilters.status)
    if (addFilters.keyword && addFilters.keyword.trim()) {
      const kw = addFilters.keyword.trim().toLowerCase()
      list = list.filter((d) => d.name.toLowerCase().includes(kw) || d.employeeNo.toLowerCase().includes(kw))
    }
    return list
  }, [data, addFilters])

  // —— 分组操作 ——
  const openCreateGroup = () => {
    setGroupModalMode('create')
    setEditingGroup(null)
    groupForm.resetFields()
    setGroupModalOpen(true)
  }

  const openEditGroup = (g: StaffGroup) => {
    setGroupModalMode('edit')
    setEditingGroup(g)
    groupForm.setFieldsValue(g)
    setGroupModalOpen(true)
  }

  const handleGroupSubmit = () => {
    groupForm.validateFields().then((values: { name: string; description?: string }) => {
      if (groupModalMode === 'create') {
        const newGroup: StaffGroup = { id: genId(), name: values.name.trim(), description: values.description?.trim() || '' }
        setGroups([...groups, newGroup])
        message.success(`已新建分组「${newGroup.name}」`)
      } else if (editingGroup) {
        setGroups(groups.map((g) => (g.id === editingGroup.id ? { ...g, name: values.name.trim(), description: values.description?.trim() || '' } : g)))
        message.success('分组已更新')
      }
      setGroupModalOpen(false)
    })
  }

  const handleDeleteGroup = (g: StaffGroup) => {
    setGroups(groups.filter((x) => x.id !== g.id))
    // 同步从所有人员的分组中移除
    setData(data.map((d) => ({ ...d, groupIds: d.groupIds.filter((id) => id !== g.id) })))
    if (selectedGroupId === g.id) setSelectedGroupId(undefined)
    message.success(`已删除分组「${g.name}」`)
  }

  // —— 添加人员 ——
  const openAddModal = () => {
    setAddFilters({})
    setAddSelectedKeys([])
    setAddModalOpen(true)
  }

  const handleAddConfirm = () => {
    if (addSelectedKeys.length === 0) {
      message.warning('请先勾选要添加的人员')
      return
    }
    if (!isRealGroupId(selectedGroupId)) {
      message.warning('请先在左侧选择具体分组再添加人员')
      return
    }
    setData(
      data.map((d) =>
        addSelectedKeys.includes(d.id) && !d.groupIds.includes(selectedGroupId!)
          ? { ...d, groupIds: [...d.groupIds, selectedGroupId!] }
          : d,
      ),
    )
    message.success(`已添加 ${addSelectedKeys.length} 人到「${selectedScopeName}」`)
    setAddModalOpen(false)
    setAddSelectedKeys([])
  }

  // —— 调整成员分组 ——
  const openEditMember = (record: RotationStaffRecord) => {
    setEditingMember(record)
    memberEditForm.setFieldsValue({
      groupId: record.groupIds[0] || selectedGroupId || undefined,
      rotationPeriod: record.rotationPeriod,
    })
    setMemberEditOpen(true)
  }

  const handleMemberEditSubmit = () => {
    memberEditForm.validateFields().then((values: { groupId?: string; rotationPeriod?: '2年' | '3年' }) => {
      const nextGroupIds = values.groupId ? [values.groupId] : []
      setData(
        data.map((d) =>
          d.id === editingMember?.id ? { ...d, groupIds: nextGroupIds, rotationPeriod: values.rotationPeriod } : d,
        ),
      )
      message.success('已更新人员分组与轮转周期')
      setMemberEditOpen(false)
    })
  }

  // —— 批量调整（所属分组 + 轮转周期）——
  const openBatchEdit = () => {
    if (selectedRowKeys.length === 0) return
    batchEditForm.resetFields()
    setBatchEditOpen(true)
  }

  const handleBatchEditSubmit = () => {
    batchEditForm.validateFields().then((values: { groupIds?: string[]; rotationPeriod?: '2年' | '3年' }) => {
      const ids = selectedRowKeys
      const hasGroup = !!values.groupIds && values.groupIds.length > 0
      const hasPeriod = !!values.rotationPeriod
      if (!hasGroup && !hasPeriod) {
        message.warning('请至少设置一项内容（为空则不修改）')
        return
      }
      setData(
        data.map((d) => {
          if (!ids.includes(d.id)) return d
          return {
            ...d,
            groupIds: hasGroup ? values.groupIds! : d.groupIds,
            rotationPeriod: hasPeriod ? values.rotationPeriod : d.rotationPeriod,
          }
        }),
      )
      message.success(`已批量调整 ${ids.length} 名人员`)
      setBatchEditOpen(false)
      setSelectedRowKeys([])
    })
  }

  // —— 执行轮转安排 ——
  // 仅展示「未安排」状态的人员记录
  const execCandidates = useMemo(() => {
    const kw = execKeyword.trim().toLowerCase()
    return data.filter((d) => {
      if (d.personStatus !== '未安排') return false
      if (execSchool && d.school !== execSchool) return false
      if (execMajor && d.major !== execMajor) return false
      if (kw && !(d.name.toLowerCase().includes(kw) || d.employeeNo.toLowerCase().includes(kw))) return false
      return true
    })
  }, [data, execKeyword, execSchool, execMajor])

  // 推荐计划：依据所选人员的基地 / 专业方向匹配计划的专业方向
  const execRecommendedPlans = useMemo(() => {
    if (execStaffIds.length === 0) return []
    const dirs = new Set<string>()
    execStaffIds.forEach((id) => {
      const staff = data.find((d) => d.id === id)
      if (!staff) return
      if (staff.base) dirs.add(`${staff.base.replace('基地', '专业')}`)
      const md = MAJOR_DIRECTION_MAP[staff.major || '']
      if (md) dirs.add(md)
    })
    return ROTATION_PLANS.filter((p) => dirs.has(p.baseType))
  }, [execStaffIds, data])

  const openExecute = () => {
    setExecStep(0)
    setExecKeyword('')
    setExecSchool(undefined)
    setExecMajor(undefined)
    setExecPlanId(undefined)
    setExecStart(null)
    // 默认选中当前 scope 内的「未安排」成员；scope 是已分组整体或未分组或全部时，取所有未安排
    const inScope = (d: RotationStaffRecord) => {
      if (!selectedGroupId) return true
      if (selectedGroupId === GROUPED_SCOPE_KEY) return d.groupIds.length > 0
      if (selectedGroupId === UNGROUPED_SCOPE_KEY) return d.groupIds.length === 0
      return d.groupIds.includes(selectedGroupId)
    }
    const defaultIds = data
      .filter((d) => d.personStatus === '未安排' && inScope(d))
      .map((d) => d.id)
    setExecStaffIds(defaultIds)
    setExecuteOpen(true)
  }

  const handleExecNext = () => {
    if (execStep === 0) {
      if (execStaffIds.length === 0) {
        message.warning('请至少选择一名人员')
        return
      }
      setExecStep(1)
    }
  }

  const handleExecConfirm = () => {
    if (execStaffIds.length === 0) {
      message.warning('请选择人员')
      return
    }
    if (!execPlanId) {
      message.warning('请选择轮转计划')
      return
    }
    if (!execStart) {
      message.warning('请选择轮转开始日期')
      return
    }
    const plan = ROTATION_PLANS.find((p) => p.id === execPlanId)
    if (!plan) return
    const startStr = execStart.format('YYYY-MM-DD')
    const endStr = calcEndDate(startStr, plan.totalMonths)
    setData(
      data.map((d) =>
        execStaffIds.includes(d.id)
          ? { ...d, planStart: startStr, planEnd: endStr, personStatus: '轮转中' as const }
          : d,
      ),
    )
    message.success(`已为 ${execStaffIds.length} 名人员执行轮转安排（${startStr} ~ ${endStr}）`)
    setExecuteOpen(false)
  }

  const execSteps = [
    { title: '选择人员', icon: <UserOutlined /> },
    { title: '选择轮转计划', icon: <ApartmentOutlined /> },
  ]

  // —— 查看详情 ——
  const handleView = (record: RotationStaffRecord) => {
    setEditingRecord(record)
    setSelectedDetailKey(null)
    setDrawerOpen(true)
  }

  const groupColumns: ColumnsType<RotationStaffRecord> = [
    {
      title: '序号',
      width: 60,
      align: 'center' as const,
      render: (_, __, index) => (index ?? 0) + 1,
    },
    { title: '姓名', dataIndex: 'name', width: 80 },
    {
      title: '轮转状态',
      dataIndex: 'rotationStatus',
      width: 100,
      align: 'center' as const,
      render: (v?: string) =>
        v ? <Tag color={statusColorMap[v] || 'default'}>{v}</Tag> : <span style={{ color: '#999' }}>—</span>,
    },
    { title: '工号', dataIndex: 'employeeNo', width: 100 },
    {
      title: '所属分组',
      width: 150,
      render: (_, record) =>
        record.groupIds.length > 0 ? (
          <Space size={[2, 2]} wrap>
            {record.groupIds.map((id) => (
              <Tag key={id} color="blue" style={{ margin: 0 }}>
                {groupNameOf(id)}
              </Tag>
            ))}
          </Space>
        ) : (
          <span style={{ color: '#999' }}>未分组</span>
        ),
    },
    {
      title: '轮转周期',
      dataIndex: 'rotationPeriod',
      width: 100,
      align: 'center' as const,
      render: (v?: string) =>
        v ? (
          <Tag color={v === '3年' ? 'gold' : 'blue'}>{v}</Tag>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: '轮转计划',
      dataIndex: 'planName',
      width: 240,
      ellipsis: true,
      render: (v?: string) => (v ? v : <span style={{ color: '#999' }}>—</span>),
    },
    {
      title: '拟开始日期',
      dataIndex: 'planStart',
      width: 110,
      render: (_: unknown, record: RotationStaffRecord) => {
        const v = record.planStart || (record.cycleStart !== '-' ? record.cycleStart : '')
        return v ? v : <span style={{ color: '#999' }}>—</span>
      },
    },
    {
      title: '拟结束日期',
      dataIndex: 'planEnd',
      width: 110,
      render: (_: unknown, record: RotationStaffRecord) => {
        const v = record.planEnd || (record.cycleEnd !== '-' ? record.cycleEnd : '')
        return v ? v : <span style={{ color: '#999' }}>—</span>
      },
    },
    {
      title: '轮转进度',
      width: 100,
      align: 'center' as const,
      render: (_, record: RotationStaffRecord) => (
        <span style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: record.currentMonth === record.totalMonths ? '#52c41a' : '#1890ff' }}>
            {record.currentMonth}
          </span>
          /{record.totalMonths}
        </span>
      ),
    },
    {
      title: '当前科室',
      dataIndex: 'currentDept',
      width: 90,
      render: (v: string) => (v && v !== '-' ? v : <span style={{ color: '#999' }}>--</span>),
    },
    { title: '机构', dataIndex: 'unit', width: 130 },
    { title: '科室', dataIndex: 'department', width: 90 },
    { title: '学校名称', dataIndex: 'school', width: 140 },
    { title: '专业方向', dataIndex: 'major', width: 140 },
    {
      title: '第一学历',
      dataIndex: 'firstEducation',
      width: 90,
      render: (v?: string) => (v ? v : <span style={{ color: '#999' }}>—</span>),
    },
    {
      title: '最高学历',
      dataIndex: 'highestEducation',
      width: 90,
      render: (v?: string) => (v ? v : <span style={{ color: '#999' }}>—</span>),
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditMember(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  const addColumns: ColumnsType<RotationStaffRecord> = [
    { title: '姓名', dataIndex: 'name', width: 80 },
    { title: '工号', dataIndex: 'employeeNo', width: 100 },
    { title: '机构', dataIndex: 'unit', width: 130 },
    { title: '科室', dataIndex: 'department', width: 90 },
    { title: '职称', dataIndex: 'title', width: 90 },
    {
      title: '轮转计划',
      dataIndex: 'planName',
      width: 200,
      ellipsis: true,
      render: (v?: string) => (v ? v : <span style={{ color: '#999' }}>—</span>),
    },
  ]

  // 轮转状态为「未安排 / 未开始」时，各科室轮转情况为空
  const viewNotArranged = !!editingRecord && (editingRecord.rotationStatus === '未开始' || editingRecord.personStatus === '未安排')

  const rotationDetails = editingRecord ? getRotationDetails(editingRecord) : []
  const detailColumns: ColumnsType<RotationDetail> = [
    { title: '序号', dataIndex: 'index', width: 60, align: 'center' as const },
    { title: '轮转科室', dataIndex: 'rotationDept', width: 100 },
    { title: '拟开始日期', dataIndex: 'planStart', width: 120 },
    { title: '拟结束日期', dataIndex: 'planEnd', width: 120 },
    { title: '轮转时长', dataIndex: 'duration', width: 90, align: 'center' as const, render: (v: number) => `${v}月` },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center' as const,
      render: (status: string) => <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>,
    },
    { title: '带教老师', dataIndex: 'teacherName', width: 100 },
    { title: '实际开始日期', dataIndex: 'actualStart', width: 120 },
    { title: '实际结束日期', dataIndex: 'actualEnd', width: 120 },
    { title: '入科签到日期', dataIndex: 'checkInDate', width: 120 },
    { title: '出科签到日期', dataIndex: 'checkOutDate', width: 120 },
    {
      title: '出科小结',
      dataIndex: 'summary',
      ellipsis: true,
      render: (v: string) =>
        v ? (
          <Tooltip title={v} color="#1890ff" styles={{ body: { color: '#fff', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' } }}>
            <span style={{ fontSize: 12, color: '#1890ff', cursor: 'default' }}>{v}</span>
          </Tooltip>
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        ),
    },
  ]

  const renderDetailPanel = () => {
    if (!editingRecord) return null
    const d = selectedDetailKey ? rotationDetails.find((x) => x.key === selectedDetailKey) : null
    return (
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, minHeight: 220, background: '#fafafa' }}>
        {d ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FileTextOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{d.rotationDept} 轮转详情</span>
            </div>
            <div style={{ background: '#fff', borderRadius: 6, padding: '12px 14px', fontSize: 13, lineHeight: 1.8, color: '#333', minHeight: 140 }}>
              <div>序号：{d.index}</div>
              <div>轮转科室：{d.rotationDept}</div>
              <div>轮转时长：{d.duration}月</div>
              <div>拟开始：{d.planStart}</div>
              <div>拟结束：{d.planEnd}</div>
              <div>状态：{d.status}</div>
              <div>带教老师：{d.teacherName}</div>
              <div>实际开始：{d.actualStart}</div>
              <div>实际结束：{d.actualEnd}</div>
              <div>入科签到：{d.checkInDate}</div>
              <div>出科签到：{d.checkOutDate}</div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e6e6e6' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>出科小结</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {d.summary || <span style={{ color: '#bbb' }}>该科室暂无出科小结</span>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: '#bbb', fontSize: 13, textAlign: 'center', marginTop: 80 }}>点击左侧卡片查看轮转详情</div>
        )}
      </div>
    )
  }

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      <div style={{ display: 'flex', gap: 16, minHeight: 560, alignItems: 'stretch' }}>
        {/* ============ 左侧：人员分组 ============ */}
        <div
          style={{
            width: 260,
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
              <TeamOutlined style={{ marginRight: 6, color: '#1677ff' }} />
              人员分组
            </span>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreateGroup}>
              新建
            </Button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {/* 一级节点 1：已分组（可展开） */}
            <div
              onClick={() => {
                setSelectedGroupId(GROUPED_SCOPE_KEY)
                setMemberFilters({})
                setSelectedRowKeys([])
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 10px',
                marginBottom: 4,
                borderRadius: 6,
                cursor: 'pointer',
                background: selectedGroupId === GROUPED_SCOPE_KEY ? '#e6f4ff' : '#fff',
                borderLeft: `3px solid ${selectedGroupId === GROUPED_SCOPE_KEY ? '#1677ff' : 'transparent'}`,
                boxShadow: selectedGroupId === GROUPED_SCOPE_KEY ? '0 1px 4px rgba(22,119,255,0.15)' : 'none',
              }}
            >
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setGroupedExpanded((v) => !v)
                }}
                style={{ width: 18, display: 'inline-flex', justifyContent: 'center', color: '#666' }}
              >
                <CaretRightOutlined
                  style={{
                    fontSize: 11,
                    transition: 'transform 0.2s',
                    transform: groupedExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                />
              </span>
              <FolderOutlined style={{ color: '#1677ff', marginRight: 6 }} />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: selectedGroupId === GROUPED_SCOPE_KEY ? 600 : 500,
                  color: '#1a1a1a',
                }}
              >
                已分组
              </span>
              <span style={{ marginLeft: 6, fontSize: 12, color: '#999', fontWeight: 400 }}>
                ({groupsWithCount.reduce((s, g) => s + g.count, 0)} 人)
              </span>
            </div>
            {/* 已分组展开后：分组项 */}
            {groupedExpanded && (
              <div style={{ paddingLeft: 18, marginBottom: 4 }}>
                {groupsWithCount.length === 0 ? (
                  <div style={{ padding: '10px 6px', fontSize: 12, color: '#999' }}>
                    暂无自定义分组，点击右上角「新建」创建
                  </div>
                ) : (
                  groupsWithCount.map((g) => {
                    const selected = g.id === selectedGroupId
                    const showIcons = selected || hoverGroupId === g.id
                    return (
                      <div
                        key={g.id}
                        onMouseEnter={() => setHoverGroupId(g.id)}
                        onMouseLeave={() => setHoverGroupId(null)}
                        onClick={() => {
                          setSelectedGroupId(g.id)
                          setMemberFilters({})
                          setSelectedRowKeys([])
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          marginBottom: 4,
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: selected ? '#e6f4ff' : '#fff',
                          borderLeft: `3px solid ${selected ? '#1677ff' : 'transparent'}`,
                          boxShadow: selected ? '0 1px 4px rgba(22,119,255,0.15)' : 'none',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: selected ? 600 : 500,
                              color: '#1a1a1a',
                            }}
                          >
                            {g.name}
                            <span style={{ marginLeft: 6, fontSize: 12, color: '#999', fontWeight: 400 }}>
                              ({g.count}人)
                            </span>
                          </div>
                          {g.description && (
                            <div
                              style={{
                                fontSize: 12,
                                color: '#999',
                                marginTop: 2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 150,
                              }}
                            >
                              {g.description}
                            </div>
                          )}
                        </div>
                        <div style={{ visibility: showIcons ? 'visible' : 'hidden', display: 'flex', gap: 4 }}>
                          <Tooltip title="编辑分组">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditGroup(g)
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="删除分组">
                            <Popconfirm
                              title="确认删除该分组？"
                              description="分组下的成员将自动变为未分组状态"
                              onConfirm={() => handleDeleteGroup(g)}
                              okText="确认"
                              cancelText="取消"
                            >
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                            </Popconfirm>
                          </Tooltip>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
            {/* 一级节点 2：未分组 */}
            <div
              onClick={() => {
                setSelectedGroupId(UNGROUPED_SCOPE_KEY)
                setMemberFilters({})
                setSelectedRowKeys([])
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 10px',
                marginTop: 6,
                borderRadius: 6,
                cursor: 'pointer',
                background: selectedGroupId === UNGROUPED_SCOPE_KEY ? '#e6f4ff' : '#fff',
                borderLeft: `3px solid ${selectedGroupId === UNGROUPED_SCOPE_KEY ? '#1677ff' : 'transparent'}`,
                boxShadow: selectedGroupId === UNGROUPED_SCOPE_KEY ? '0 1px 4px rgba(22,119,255,0.15)' : 'none',
              }}
            >
              <span style={{ width: 18, display: 'inline-block' }} />
              <UserOutlined style={{ color: '#fa8c16', marginRight: 6 }} />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: selectedGroupId === UNGROUPED_SCOPE_KEY ? 600 : 500,
                  color: '#1a1a1a',
                }}
              >
                未分组
              </span>
              <span style={{ marginLeft: 6, fontSize: 12, color: '#999', fontWeight: 400 }}>
                ({data.filter((d) => d.groupIds.length === 0).length} 人)
              </span>
            </div>
          </div>
        </div>

        {/* ============ 右侧：人员列表 ============ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '4px 4px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>人员列表</span>
              <Button type="primary" size="small" icon={<ThunderboltOutlined />} onClick={openExecute}>
                执行轮转
              </Button>
              {selectedRowKeys.length > 0 && (
                <Button size="small" icon={<EditOutlined />} onClick={openBatchEdit}>
                  批量调整（{selectedRowKeys.length}）
                </Button>
              )}
            </div>
            <Space size={8} wrap>
              <Input
                placeholder="姓名/工号"
                prefix={<SearchOutlined />}
                allowClear
                value={memberFilters.keyword}
                onChange={(e) => setMemberFilters({ ...memberFilters, keyword: e.target.value })}
                style={{ width: 180 }}
              />
              <Select
                placeholder="状态"
                allowClear
                value={memberFilters.status}
                onChange={(v) => setMemberFilters({ ...memberFilters, status: v })}
                style={{ width: 140 }}
                options={ROTATION_STATUS_OPTIONS}
              />
            </Space>
          </div>
          <Table
            columns={groupColumns}
            dataSource={filteredMembers}
            rowKey="id"
            size="small"
            scroll={{ x: 1800 }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
              fixed: true,
            }}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
      </div>

      {/* ============ 新建/编辑分组抽屉 ============ */}
      <Drawer
        title={groupModalMode === 'create' ? '新建人员分组' : '编辑人员分组'}
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        width={480}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setGroupModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleGroupSubmit}>
              保存
            </Button>
          </div>
        }
      >
        <Form form={groupForm} layout="vertical" size="small" style={{ marginTop: 4 }}>
          <Form.Item
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }, { max: 20, message: '不超过20个字符' }]}
          >
            <Input placeholder="如：A组 / 内科轮转组" maxLength={20} />
          </Form.Item>
          <Form.Item name="description" label="分组描述">
            <Input.TextArea placeholder="请输入分组说明（可选）" rows={3} maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ============ 添加人员抽屉 ============ */}
      <Drawer
        title={isRealGroupId(selectedGroupId) ? `添加人员到「${selectedScopeName}」` : '添加人员（请先在左侧选择具体分组）'}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        width={800}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setAddModalOpen(false)}>取消</Button>
            <Button type="primary" disabled={addSelectedKeys.length === 0} onClick={handleAddConfirm}>
              确认添加（{addSelectedKeys.length}）
            </Button>
          </div>
        }
      >
        <div style={{ marginBottom: 12 }}>
          <Space wrap>
            <Select
              placeholder="机构"
              allowClear
              value={addFilters.unit}
              onChange={(v) => setAddFilters({ ...addFilters, unit: v })}
              style={{ width: 150 }}
              options={UNIT_OPTIONS}
            />
            <Select
              placeholder="科室"
              allowClear
              value={addFilters.dept}
              onChange={(v) => setAddFilters({ ...addFilters, dept: v })}
              style={{ width: 130 }}
              options={DEPT_OPTIONS}
            />
            <Input
              placeholder="姓名/工号"
              prefix={<SearchOutlined />}
              allowClear
              value={addFilters.keyword}
              onChange={(e) => setAddFilters({ ...addFilters, keyword: e.target.value })}
              style={{ width: 160 }}
            />
            <Select
              placeholder="筛选条件（状态）"
              allowClear
              value={addFilters.status}
              onChange={(v) => setAddFilters({ ...addFilters, status: v })}
              style={{ width: 150 }}
              options={ROTATION_STATUS_OPTIONS}
            />
          </Space>
        </div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
          全院未进行分组的人员（{ungroupedFiltered.length}）
        </div>
        <Table
          columns={addColumns}
          dataSource={ungroupedFiltered}
          rowKey="id"
          size="small"
          scroll={{ x: 580, y: 360 }}
          rowSelection={{
            selectedRowKeys: addSelectedKeys,
            onChange: (keys) => setAddSelectedKeys(keys),
            fixed: true,
          }}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条` }}
        />
      </Drawer>

      {/* ============ 调整成员分组抽屉 ============ */}
      <Drawer
        title="调整人员分组"
        open={memberEditOpen}
        onClose={() => setMemberEditOpen(false)}
        width={720}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setMemberEditOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleMemberEditSubmit}>
              保存
            </Button>
          </div>
        }
      >
        {editingMember && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="姓名">{editingMember.name}</Descriptions.Item>
              <Descriptions.Item label="工号">{editingMember.employeeNo}</Descriptions.Item>
              <Descriptions.Item label="机构">{editingMember.unit}</Descriptions.Item>
              <Descriptions.Item label="科室">{editingMember.department}</Descriptions.Item>
              <Descriptions.Item label="职称">{editingMember.title}</Descriptions.Item>
              <Descriptions.Item label="轮转计划" span={2}>
                {editingMember.planName || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="学校名称">{editingMember.school || '—'}</Descriptions.Item>
              <Descriptions.Item label="第一学历">{editingMember.firstEducation || '—'}</Descriptions.Item>
              <Descriptions.Item label="最高学历">{editingMember.highestEducation || '—'}</Descriptions.Item>
              <Descriptions.Item label="第一专业">{editingMember.major || '—'}</Descriptions.Item>
            </Descriptions>
            <Form
              form={memberEditForm}
              layout="horizontal"
              size="small"
              labelAlign="left"
              labelCol={{ flex: '0 0 72px' }}
              wrapperCol={{ flex: '1' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="groupId" label="所属分组" rules={[{ required: true, message: '请选择分组' }]}>
                    <Select placeholder="请选择分组" options={groups.map((g) => ({ label: g.name, value: g.id }))} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="rotationPeriod" label="轮转周期">
                    <Select placeholder="请选择" allowClear options={ROTATION_PERIOD_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </>
        )}
      </Drawer>

      {/* ============ 批量调整抽屉 ============ */}
      <Drawer
        title="批量调整人员"
        open={batchEditOpen}
        onClose={() => setBatchEditOpen(false)}
        width={480}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setBatchEditOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleBatchEditSubmit}>
              保存
            </Button>
          </div>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`已选中 ${selectedRowKeys.length} 名人员，将统一设置以下信息，为空则不修改`}
        />
        <Form form={batchEditForm} layout="vertical" size="small">
          <Form.Item name="groupIds" label="所属分组">
            <Select
              mode="multiple"
              placeholder="请选择分组"
              options={groups.map((g) => ({ label: g.name, value: g.id }))}
            />
          </Form.Item>
          <Form.Item name="rotationPeriod" label="轮转周期">
            <Select placeholder="请选择" options={ROTATION_PERIOD_OPTIONS} />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ============ 执行轮转安排抽屉 ============ */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>执行轮转安排</span>}
        open={executeOpen}
        onClose={() => setExecuteOpen(false)}
        width="50%"
        destroyOnClose
        styles={{ body: { paddingBottom: 80 } }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Steps current={execStep} items={execSteps} size="small" />
        </div>

        {execStep === 0 && (
          <div>
            <Space wrap style={{ marginBottom: 12 }}>
              <Select
                placeholder="学校名称"
                allowClear
                value={execSchool}
                onChange={setExecSchool}
                style={{ width: 180 }}
                options={SCHOOL_OPTIONS}
              />
              <Select
                placeholder="专业方向"
                allowClear
                value={execMajor}
                onChange={setExecMajor}
                style={{ width: 150 }}
                options={MAJOR_OPTIONS}
              />
              <Input
                placeholder="姓名/工号"
                prefix={<SearchOutlined />}
                allowClear
                value={execKeyword}
                onChange={(e) => setExecKeyword(e.target.value)}
                style={{ width: 160 }}
              />
            </Space>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              仅展示「未安排」状态的人员，已选 <span style={{ fontWeight: 600 }}>{execStaffIds.length}</span> 人
            </div>
            <Table
              rowKey="id"
              rowSelection={{ selectedRowKeys: execStaffIds, onChange: (keys) => setExecStaffIds(keys as string[]) }}
              columns={[
                { title: '姓名', dataIndex: 'name', width: 90 },
                { title: '工号', dataIndex: 'employeeNo', width: 100 },
                { title: '机构', dataIndex: 'unit', width: 130 },
                { title: '科室', dataIndex: 'department', width: 90 },
                {
                  title: '所属分组',
                  width: 140,
                  render: (_: unknown, record: RotationStaffRecord) =>
                    record.groupIds.length > 0 ? (
                      <Space size={[2, 2]} wrap>
                        {record.groupIds.map((gid) => (
                          <Tag key={gid} color="blue" style={{ margin: 0 }}>{groupNameOf(gid)}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <span style={{ color: '#999' }}>未分组</span>
                    ),
                },
                { title: '学校名称', dataIndex: 'school', width: 150, ellipsis: true },
                { title: '专业方向', dataIndex: 'major', width: 120 },
                {
                  title: '轮转周期',
                  dataIndex: 'rotationPeriod',
                  width: 90,
                  align: 'center' as const,
                  render: (v?: string) => (v ? <Tag color={v === '3年' ? 'gold' : 'blue'}>{v}</Tag> : <span style={{ color: '#999' }}>—</span>),
                },
              ]}
              dataSource={execCandidates}
              size="small"
              pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条` }}
              scroll={{ x: 900 }}
            />
          </div>
        )}

        {execStep === 1 && (
          <div>
            <Form layout="vertical" size="small">
              <Form.Item label="轮转计划" required tooltip="仅为所选人员统一指定一个轮转计划">
                <Select
                  placeholder="请选择轮转计划"
                  value={execPlanId}
                  onChange={setExecPlanId}
                  options={PLAN_OPTIONS}
                  showSearch
                  optionFilterProp="label"
                  allowClear
                  style={{ maxWidth: 520 }}
                />
              </Form.Item>
              <Form.Item label="轮转开始日期" required>
                <DatePicker
                  style={{ width: 240 }}
                  value={execStart}
                  onChange={(d) => setExecStart(d)}
                  placeholder="请选择开始日期"
                />
              </Form.Item>
            </Form>

            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 14px', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ width: 4, height: 14, borderRadius: 2, background: '#1890ff', display: 'inline-block' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>推荐</span>
                <span style={{ fontSize: 12, color: '#999' }}>（依据所选人员的专业基地与专业方向，匹配计划专业方向）</span>
              </div>
              {execStaffIds.length === 0 ? (
                <div style={{ fontSize: 13, color: '#999' }}>请先在「选择人员」步骤中勾选人员</div>
              ) : execRecommendedPlans.length === 0 ? (
                <div style={{ fontSize: 13, color: '#999' }}>暂无与所选人员方向匹配的轮转计划</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {execRecommendedPlans.map((p) => {
                    const joined = execPlanId === p.id
                    return (
                      <div
                        key={p.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 12px', borderRadius: 6, background: '#fff', border: '1px solid #f0f0f0' }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{p.label}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>关联基地：{p.baseName}（{p.deptCount}个科室 / {p.totalMonths}个月）</div>
                        </div>
                        <Button type="primary" size="small" disabled={joined} onClick={() => setExecPlanId(p.id)}>
                          {joined ? '已选择' : '选择'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => (execStep > 0 ? setExecStep(execStep - 1) : setExecuteOpen(false))}>
            {execStep > 0 ? '上一步' : '取消'}
          </Button>
          {execStep < 1 ? (
            <Button type="primary" onClick={handleExecNext}>下一步</Button>
          ) : (
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleExecConfirm}>确认执行</Button>
          )}
        </div>
      </Drawer>

      {/* ============ 查看详情抽屉 ============ */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>轮转人员 - {editingRecord?.name}</span>}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={1333}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {editingRecord && (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
              基本信息
            </div>
            <Descriptions column={3} size="small" bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="所属单位">{editingRecord.unit}</Descriptions.Item>
              <Descriptions.Item label="所属科室">{editingRecord.department}</Descriptions.Item>
              <Descriptions.Item label="姓名">{editingRecord.name}</Descriptions.Item>
              <Descriptions.Item label="工号">{editingRecord.employeeNo}</Descriptions.Item>
              <Descriptions.Item label="性别">{editingRecord.gender}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{editingRecord.phone}</Descriptions.Item>
              <Descriptions.Item label="职称">{editingRecord.title}</Descriptions.Item>
              <Descriptions.Item label="轮转状态">{editingRecord.rotationStatus}</Descriptions.Item>
              <Descriptions.Item label="轮转计划" span={2}>
                {editingRecord.planName || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="当前科室">{editingRecord.currentDept || '--'}</Descriptions.Item>
              <Descriptions.Item label="轮转进度">{editingRecord.currentMonth}/{editingRecord.totalMonths}</Descriptions.Item>
              <Descriptions.Item label="轮转周期">
                {editingRecord.cycleStart !== '-' ? `${editingRecord.cycleStart} ~ ${editingRecord.cycleEnd}` : '--'}
              </Descriptions.Item>
            </Descriptions>

            <Row justify="space-between" align="middle" style={{ marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
              <Col style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>各科室轮转情况</Col>
              {!viewNotArranged && (
                <Col>
                  <Segmented
                    size="small"
                    value={detailViewMode}
                    onChange={(v) => setDetailViewMode(v as 'table' | 'flow')}
                    options={[
                      { label: '表格', value: 'table', icon: <TableOutlined /> },
                      { label: '视图', value: 'flow', icon: <ApartmentOutlined /> },
                    ]}
                  />
                </Col>
              )}
            </Row>
            {viewNotArranged ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="该人员未安排轮转"
                style={{ margin: '28px 0' }}
              />
            ) : detailViewMode === 'table' ? (
              <Table columns={detailColumns} dataSource={rotationDetails} rowKey="key" size="small" pagination={false} scroll={{ x: 1100 }} />
            ) : (
              <Row gutter={16}>
                <Col flex="1" style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {rotationDetails.map((d) => {
                      const colorConfig: Record<string, { border: string; bg: string; tagColor: string }> = {
                        '未开始': { border: '#d9d9d9', bg: '#fafafa', tagColor: 'default' },
                        '轮转中': { border: '#1890ff', bg: '#e6f4ff', tagColor: 'processing' },
                        '轮转结束': { border: '#52c41a', bg: '#f6ffed', tagColor: 'success' },
                      }
                      const cfg = colorConfig[d.status] || colorConfig['未开始']
                      const selected = selectedDetailKey === d.key
                      return (
                        <div
                          key={d.key}
                          onClick={() => setSelectedDetailKey(d.key)}
                          style={{
                            width: 'calc(25% - 9px)',
                            borderRadius: 8,
                            border: `2px solid ${selected ? '#1890ff' : cfg.border}`,
                            background: cfg.bg,
                            padding: '14px 12px 10px',
                            cursor: 'pointer',
                            position: 'relative',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ position: 'absolute', top: -10, left: -10, width: 22, height: 22, borderRadius: '50%', background: '#1890ff', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, boxShadow: '0 0 0 2px #fff' }}>{d.index}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{d.rotationDept}</span>
                            <Tag color={cfg.tagColor} style={{ margin: 0, fontSize: 11 }}>{d.status}</Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#666', lineHeight: '20px' }}>
                            <div>时长：{d.duration}月</div>
                            <div>拟开始：{d.planStart}</div>
                            <div>拟结束：{d.planEnd}</div>
                            <div>带教：{d.teacherName}</div>
                            {d.summary && <div style={{ marginTop: 4, fontSize: 11, color: '#1890ff' }}>点击查看出科小结</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Col>
                <Col flex="0 0 320px">
                  {renderDetailPanel()}
                </Col>
              </Row>
            )}
          </>
        )}
      </Drawer>
    </Card>
  )
}

export default RotationStaff
