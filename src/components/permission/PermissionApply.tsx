import React, { useState } from 'react'
import dayjs from 'dayjs'
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
  message,
  Popconfirm,
  Row,
  Col,
  Descriptions,
  Checkbox,
  Divider,
  Popover,
  DatePicker,
  Pagination,
  Switch,
  Segmented,
} from 'antd'
import {
  UserOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  UndoOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface PermissionApplyRecord {
  id: string
  applyNo: string
  applyType: string // 个人申请 | 临时申请 | 代理申请
  applyStatus: string // 未提交 | 申请中 | 已通过 | 已拒绝 | 已撤销
  applicant: string
  employeeId: string
  exception: boolean    // 破格
  checkCycle: number    // 检查周期（月），0 表示无
  authStartDate?: string // 授权开始日期（临时申请）
  authEndDate?: string   // 授权结束日期（临时申请）
  department: string
  permissionName: string
  applyReason: string
  applyDate: string
  validPeriod: string
}

interface QualificationCondition {
  conditionName: string    // 准入条件，如"聘用职称要求：医师，年限2年"
  currentValue: string     // 当前值，如"职称：副主任医师，年限：3年"
  result: string           // 评估结果，如"通过"/"不通过"
  isRequired: boolean      // 必须条件（是否）
}

interface PermissionOption {
  id: string
  category: string
  name: string
  description: string
  qualification: '通过' | '不通过' | '未知'
  qualificationDetails: QualificationCondition[]
}

interface PermissionGroupOption {
  id: string
  groupName: string
  groupCode: string
  memberCount: number
  permissionIds: string[]
  description: string
}

// 权限分类配置
const permissionCategories = [
  { label: '处方权', value: '处方权' },
  { label: '手术等级', value: '手术等级' },
  { label: '输血', value: '输血' },
  { label: '麻醉', value: '麻醉' },
  { label: '特殊检查', value: '特殊检查' },
  { label: '特殊治疗', value: '特殊治疗' },
  { label: '设备', value: '设备' },
]

// 全部权限池
const allPermissions: PermissionOption[] = [
  {
    id: 'p1', category: '处方权', name: '普通处方权', description: '开具常规药品处方', qualification: '通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：医师及以上', currentValue: '职称：医师，年限：3年', result: '通过', isRequired: true },
      { conditionName: '执业注册：已注册', currentValue: '状态：已注册', result: '通过', isRequired: true },
    ],
  },
  {
    id: 'p2', category: '处方权', name: '麻醉处方权', description: '开具麻醉药品处方', qualification: '不通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：主任技师', currentValue: '职称：医师', result: '不通过', isRequired: true },
      { conditionName: '麻醉培训证明：需完成培训', currentValue: '培训状态：未提供', result: '不通过', isRequired: true },
    ],
  },
  {
    id: 'p3', category: '处方权', name: '精神类处方权', description: '开具精神类药品处方', qualification: '未知',
    qualificationDetails: [
      { conditionName: '精神卫生培训：需专项培训', currentValue: '培训状态：不确认', result: '不确认', isRequired: true },
    ],
  },
  {
    id: 'p4', category: '处方权', name: '抗菌药物处方权', description: '开具抗菌药物处方', qualification: '通过',
    qualificationDetails: [
      { conditionName: '职称要求：医师及以上', currentValue: '职称：医师，年限：3年', result: '通过', isRequired: true },
      { conditionName: '培训考核：抗菌药物培训合格', currentValue: '考核：合格', result: '通过', isRequired: true },
    ],
  },
  {
    id: 'p5', category: '处方权', name: '抗肿瘤药物处方权', description: '开具抗肿瘤药物处方', qualification: '未知',
    qualificationDetails: [
      { conditionName: '肿瘤专科培训：需专科培训证明', currentValue: '培训状态：不确认', result: '不确认', isRequired: true },
    ],
  },
  {
    id: 'p6', category: '手术等级', name: '一级手术权限', description: '普通小手术操作权限', qualification: '通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：住院医师及以上', currentValue: '职称：主治医师，年限：5年', result: '通过', isRequired: true },
      { conditionName: '年资要求：≥1年', currentValue: '年限：5年', result: '通过', isRequired: false },
    ],
  },
  {
    id: 'p7', category: '手术等级', name: '二级手术权限', description: '中等难度手术操作权限', qualification: '通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：主治医师及以上', currentValue: '职称：主治医师，年限：5年', result: '通过', isRequired: true },
      { conditionName: '年资要求：≥3年', currentValue: '年限：5年', result: '通过', isRequired: false },
    ],
  },
  {
    id: 'p8', category: '手术等级', name: '三级手术权限', description: '高难度手术操作权限', qualification: '未知',
    qualificationDetails: [
      { conditionName: '聘用职称要求：副主任医师及以上', currentValue: '职称：主治医师，年限：5年', result: '不确认', isRequired: true },
    ],
  },
  {
    id: 'p9', category: '手术等级', name: '四级手术权限', description: '特级手术操作权限', qualification: '不通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：主任医师', currentValue: '职称：主治医师，年限：5年', result: '不通过', isRequired: true },
      { conditionName: '年资要求：≥12年', currentValue: '年限：5年', result: '不通过', isRequired: false },
    ],
  },
  {
    id: 'p10', category: '输血', name: '常规输血权限', description: '常规输血操作权限', qualification: '通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：医师及以上', currentValue: '职称：医师，年限：3年', result: '通过', isRequired: true },
      { conditionName: '输血培训：完成培训', currentValue: '培训：已完成', result: '通过', isRequired: true },
    ],
  },
  {
    id: 'p11', category: '输血', name: '紧急输血权限', description: '紧急情况输血操作权限', qualification: '未知',
    qualificationDetails: [
      { conditionName: '紧急救治授权：需紧急授权备案', currentValue: '备案状态：不确认', result: '不确认', isRequired: true },
    ],
  },
  {
    id: 'p12', category: '输血', name: '成分输血权限', description: '成分血输注操作权限', qualification: '通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：医师及以上', currentValue: '职称：医师，年限：3年', result: '通过', isRequired: true },
    ],
  },
  {
    id: 'p13', category: '麻醉', name: '局部麻醉权限', description: '局部麻醉操作权限', qualification: '通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：医师及以上', currentValue: '职称：医师，年限：3年', result: '通过', isRequired: true },
      { conditionName: '麻醉科轮转：≥3个月', currentValue: '轮转：6个月', result: '通过', isRequired: false },
    ],
  },
  {
    id: 'p14', category: '麻醉', name: '全身麻醉权限', description: '全身麻醉操作权限', qualification: '不通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：主治医师及以上', currentValue: '职称：住院医师，年限：2年', result: '不通过', isRequired: true },
      { conditionName: '麻醉培训年限：≥5年', currentValue: '年限：2年', result: '不通过', isRequired: false },
    ],
  },
  {
    id: 'p15', category: '麻醉', name: '椎管内麻醉权限', description: '椎管内麻醉操作权限', qualification: '未知',
    qualificationDetails: [
      { conditionName: '专项麻醉培训：需椎管内麻醉专项培训', currentValue: '培训状态：不确认', result: '不确认', isRequired: true },
    ],
  },
  {
    id: 'p16', category: '特殊检查', name: '内镜检查权限', description: '内镜检查操作权限', qualification: '通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：医师及以上', currentValue: '职称：医师，年限：3年', result: '通过', isRequired: true },
      { conditionName: '内镜培训：≥50例操作经验', currentValue: '操作：80例', result: '通过', isRequired: false },
    ],
  },
  {
    id: 'p17', category: '特殊检查', name: '介入检查权限', description: '介入放射检查权限', qualification: '未知',
    qualificationDetails: [
      { conditionName: '介入培训证明：需介入放射培训证明', currentValue: '培训状态：不确认', result: '不确认', isRequired: true },
    ],
  },
  {
    id: 'p18', category: '特殊检查', name: '核医学检查权限', description: '核医学检查操作权限', qualification: '不通过',
    qualificationDetails: [
      { conditionName: '核医学培训：需核医学专科培训', currentValue: '培训状态：未提供', result: '不通过', isRequired: true },
      { conditionName: '辐射安全证：需持有辐射安全证', currentValue: '持证：无', result: '不通过', isRequired: true },
    ],
  },
  {
    id: 'p19', category: '特殊治疗', name: '放疗操作权限', description: '放射治疗操作权限', qualification: '未知',
    qualificationDetails: [
      { conditionName: '放疗培训：需放疗专项培训', currentValue: '培训状态：不确认', result: '不确认', isRequired: true },
    ],
  },
  {
    id: 'p20', category: '特殊治疗', name: '透析操作权限', description: '血液透析操作权限', qualification: '通过',
    qualificationDetails: [
      { conditionName: '聘用职称要求：医师及以上', currentValue: '职称：医师，年限：3年', result: '通过', isRequired: true },
      { conditionName: '透析培训：≥30例操作经验', currentValue: '操作：50例', result: '通过', isRequired: false },
    ],
  },
  {
    id: 'p21', category: '特殊治疗', name: '高压氧治疗权限', description: '高压氧治疗操作权限', qualification: '未知',
    qualificationDetails: [
      { conditionName: '高压氧培训：需高压氧治疗培训证明', currentValue: '培训状态：不确认', result: '不确认', isRequired: true },
    ],
  },
  {
    id: 'p22', category: '设备', name: '呼吸机操作权限', description: '呼吸机设备操作权限', qualification: '通过',
    qualificationDetails: [
      { conditionName: '设备培训：呼吸机专项培训', currentValue: '培训状态：已完成', result: '通过', isRequired: true },
    ],
  },
  {
    id: 'p23', category: '设备', name: '除颤仪操作权限', description: '除颤仪设备操作权限', qualification: '通过',
    qualificationDetails: [
      { conditionName: '设备培训：除颤仪专项培训', currentValue: '培训状态：已完成', result: '通过', isRequired: true },
    ],
  },
]

const statusColorMap: Record<string, string> = {
  '未提交': 'default',
  '申请中': 'processing',
  '已通过': 'success',
  '已拒绝': 'error',
  '已撤销': 'warning',
}

const applyTypeMap: Record<string, { color: string; icon: React.ReactNode }> = {
  '个人申请': { color: 'blue', icon: <UserOutlined /> },
  '临时申请': { color: 'orange', icon: <ClockCircleOutlined /> },
  '代理申请': { color: 'purple', icon: <SwapOutlined /> },
}

const qualificationMap: Record<string, { color: string; icon: React.ReactNode }> = {
  '通过': { color: 'success', icon: <CheckCircleOutlined /> },
  '不通过': { color: 'error', icon: <CloseCircleOutlined /> },
  '未知': { color: 'warning', icon: <QuestionCircleOutlined /> },
}

const permissionConfigOptions: Record<string, string[]> = {
  '处方权': ['门诊', '住院'],
  '手术目录': ['开单', '主刀', '一助'],
  '手术等级': ['开单', '主刀', '一助'],
  '设备': ['操作', '维修'],
}

const PermissionApply: React.FC = () => {

  const [applyOpen, setApplyOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewingRecord, setViewingRecord] = useState<PermissionApplyRecord | null>(null)
  const [editingRecord, setEditingRecord] = useState<PermissionApplyRecord | null>(null)
  const [currentApplyType, setCurrentApplyType] = useState<string>('个人申请')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  // 个人申请抽屉状态
  const [selectionMode, setSelectionMode] = useState<'permission' | 'group'>('permission') // 权限/权限组切换
  const [permissionCategory, setPermissionCategory] = useState<string>('处方权')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('') // 权限组搜索
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]) // 已选权限组ID
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionOption[]>([])
  const [exceptionMap, setExceptionMap] = useState<Record<string, boolean>>({}) // 破格勾选状态
  const [checkCycleMap, setCheckCycleMap] = useState<Record<string, number>>({}) // 检查周期（月）
  const [permissionConfigMap, setPermissionConfigMap] = useState<Record<string, string[]>>({}) // 权限配置勾选状态
  const [reportOpen, setReportOpen] = useState(false)
  const [permissionPage, setPermissionPage] = useState(1)
  const [permissionPageSize, setPermissionPageSize] = useState(10)

  // 代理申请 - 人员选择状态
  const [personnelSearch, setPersonnelSearch] = useState('')
  const [selectedPersonnel, setSelectedPersonnel] = useState<{ name: string; employeeId: string; department: string; title: string } | null>(null)

// 模拟权限组数据（与权限组管理页面保持一致）
const mockPermissionGroups: PermissionGroupOption[] = [
  { id: 'G001', groupName: '外科医生组', groupCode: 'SURG_GRP', memberCount: 45, permissionIds: ['p6', 'p7', 'p16', 'p20'], description: '外科全体医生' },
  { id: 'G002', groupName: '内科医生组', groupCode: 'MED_GRP', memberCount: 38, permissionIds: ['p1', 'p4', 'p10', 'p12'], description: '内科全体医生' },
  { id: 'G003', groupName: '护理组', groupCode: 'NUR_GRP', memberCount: 120, permissionIds: ['p10', 'p12'], description: '全体护理人员' },
  { id: 'G004', groupName: '药剂科组', groupCode: 'PHR_GRP', memberCount: 25, permissionIds: ['p1', 'p3', 'p4'], description: '药剂科人员' },
  { id: 'G005', groupName: '医技组', groupCode: 'TEC_GRP', memberCount: 30, permissionIds: ['p16', 'p17'], description: '检验/影像人员' },
  { id: 'G006', groupName: '急诊科组', groupCode: 'ER_GRP', memberCount: 32, permissionIds: ['p1', 'p3', 'p13'], description: '急诊科人员' },
  { id: 'G007', groupName: '麻醉组', groupCode: 'ANE_GRP', memberCount: 18, permissionIds: ['p13', 'p14', 'p15'], description: '麻醉科人员' },
]

  // 模拟人员数据
  const mockPersonnel = [
    { name: '张医生', employeeId: 'GH20240001', department: '外科', title: '主治医师' },
    { name: '李护士', employeeId: 'GH20240002', department: '内科', title: '主管护师' },
    { name: '王医生', employeeId: 'GH20240003', department: '急诊科', title: '副主任医师' },
    { name: '赵技师', employeeId: 'GH20240004', department: '检验科', title: '主管技师' },
    { name: '陈医生', employeeId: 'GH20240005', department: '外科', title: '主任医师' },
    { name: '刘医生', employeeId: 'GH20240006', department: '急诊科', title: '主治医师' },
    { name: '吴医生', employeeId: 'GH20240007', department: '内科', title: '住院医师' },
    { name: '周医生', employeeId: 'GH20240008', department: '外科', title: '主治医师' },
    { name: '孙护士', employeeId: 'GH20240009', department: '内科', title: '护师' },
    { name: '钱医生', employeeId: 'GH20240010', department: '急诊科', title: '住院医师' },
  ]

  const [data, setData] = useState<PermissionApplyRecord[]>([
    { id: '1', applyNo: 'PA-2026-0001', applyType: '个人申请', applyStatus: '申请中', applicant: '张医生', employeeId: 'GH20240001', exception: false, checkCycle: 6, department: '外科', permissionName: '手术操作权限',
      applyReason: '晋升主治医师，需开展独立手术', applyDate: '2026-06-01', validPeriod: '长期' },
    { id: '2', applyNo: 'PA-2026-0002', applyType: '个人申请', applyStatus: '申请中', applicant: '李护士', employeeId: 'GH20240002', exception: false, checkCycle: 12, department: '内科', permissionName: '药品调配权限',
      applyReason: '调入内科病房', applyDate: '2026-06-03', validPeriod: '2年' },
    { id: '3', applyNo: 'PA-2026-0003', applyType: '临时申请', applyStatus: '已通过', applicant: '王医生', employeeId: 'GH20240003', exception: false, checkCycle: 6, department: '急诊科', permissionName: '处方开具权限',
      applyReason: '新入职医生', applyDate: '2026-06-05', validPeriod: '1年' },
    { id: '4', applyNo: 'PA-2026-0004', applyType: '个人申请', applyStatus: '已拒绝', applicant: '赵技师', employeeId: 'GH20240004', exception: false, checkCycle: 0, department: '检验科', permissionName: '检验报告审核权限',
      applyReason: '岗位调动', applyDate: '2026-06-08', validPeriod: '长期' },
    { id: '5', applyNo: 'PA-2026-0005', applyType: '代理申请', applyStatus: '申请中', applicant: '陈医生', employeeId: 'GH20240005', exception: false, checkCycle: 12, department: '外科', permissionName: '会诊申请权限',
      applyReason: '参加多学科会诊', applyDate: '2026-06-09', validPeriod: '6个月' },
    { id: '6', applyNo: 'PA-2026-0006', applyType: '个人申请', applyStatus: '未提交', applicant: '刘医生', employeeId: 'GH20240006', exception: false, checkCycle: 6, department: '急诊科', permissionName: '手术操作权限',
      applyReason: '急诊手术需要', applyDate: '2026-06-10', validPeriod: '1年' },
    { id: '7', applyNo: 'PA-2026-0007', applyType: '临时申请', applyStatus: '未提交', applicant: '吴医生', employeeId: 'GH20240007', exception: true, checkCycle: 0, department: '内科', permissionName: '病历查阅权限',
      applyReason: '临时借调', applyDate: '2026-06-11', validPeriod: '6个月' },
  ])

  const columns: ColumnsType<PermissionApplyRecord> = [
    { 
      title: '序号', key: 'index', width: 60, align: 'center',
      render: (_: unknown, __: PermissionApplyRecord, index: number) => index + 1,
    },
    {
      title: '申请状态', dataIndex: 'applyStatus', key: 'applyStatus', width: 100,
      render: (status: string) => <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>,
    },
    {
      title: '申请类型', dataIndex: 'applyType', key: 'applyType', width: 100,
      render: (type: string) => {
        const cfg = applyTypeMap[type] || { color: 'default', icon: null }
        return <Tag color={cfg.color} icon={cfg.icon}>{type}</Tag>
      },
    },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 90 },
    { title: '工号', dataIndex: 'employeeId', key: 'employeeId', width: 110 },
    { title: '申请科室', dataIndex: 'department', key: 'department', width: 90, render: (dept: string) => <Tag color="blue">{dept}</Tag> },
    { title: '申请权限', dataIndex: 'permissionName', key: 'permissionName', width: 140, render: (name: string) => <Tag color="purple">{name}</Tag> },
    { title: '破格', dataIndex: 'exception', key: 'exception', width: 60, align: 'center',
      render: (v: boolean) => v ? <span style={{ color: '#1677ff', fontWeight: 'bold' }}>√</span> : null },
    { title: '申请原因', dataIndex: 'applyReason', key: 'applyReason', width: 180, ellipsis: true },
    { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate', width: 110 },
    { title: '有效期', dataIndex: 'validPeriod', key: 'validPeriod', width: 80 },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right',
      render: (_: unknown, record: PermissionApplyRecord) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />}
            onClick={() => {
              // 打开个人申请抽屉查看（所有类型都使用同一个抽屉）
              setCurrentApplyType(record.applyType)
              setViewingRecord(record)
              form.resetFields()
              form.setFieldsValue({
                applyReason: record.applyReason,
                authStartDate: record.authStartDate ? dayjs(record.authStartDate) : null,
                authEndDate: record.authEndDate ? dayjs(record.authEndDate) : null,
              })
              setPermissionCategory('处方权')
              setPermissionSearch('')
              // 从 permissionName 中解析已选权限
              const names = record.permissionName.split('、')
              const matched = allPermissions.filter((p) => names.includes(p.name))
              setSelectedPermissions(matched)
              // 根据 record.exception 设置破格状态
              if (record.exception) {
                const em: Record<string, boolean> = {}
                matched.forEach((p) => { em[p.id] = true })
                setExceptionMap(em)
              } else {
                setExceptionMap({})
              }
              setApplyOpen(true)
            }}>
            查看
          </Button>
          {record.applyStatus === '未提交' && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />}
                onClick={() => {
                  setEditingRecord(record)
                  if (record.applyType === '个人申请') {
                    // 打开个人申请抽屉编辑
                    setCurrentApplyType(record.applyType)
                    form.resetFields()
                    form.setFieldsValue({
                      applyReason: record.applyReason,
                      authStartDate: record.authStartDate ? dayjs(record.authStartDate) : null,
                      authEndDate: record.authEndDate ? dayjs(record.authEndDate) : null,
                    })
                    setPermissionCategory('处方权')
                    setPermissionSearch('')
                    const names = record.permissionName.split('、')
                    const matched = allPermissions.filter((p) => names.includes(p.name))
                    setSelectedPermissions(matched)
                    if (record.exception) {
                      const em: Record<string, boolean> = {}
                      matched.forEach((p) => { em[p.id] = true })
                      setExceptionMap(em)
                    } else {
                      setExceptionMap({})
                    }
                    setApplyOpen(true)
                  } else {
                    editForm.resetFields()
                    editForm.setFieldsValue({
                      applicant: record.applicant,
                      employeeId: record.employeeId,
                      department: record.department,
                      permissionName: record.permissionName,
                      applyReason: record.applyReason,
                      validPeriod: record.validPeriod,
                    })
                    setEditOpen(true)
                  }
                }}>
                编辑
              </Button>
              <Popconfirm title="确定提交该申请？" onConfirm={() => {
                setData(data.map((item) => item.id === record.id ? { ...item, applyStatus: '申请中' } : item))
                message.success('申请已提交')
              }}>
                <Button type="link" size="small" icon={<SendOutlined />}>提交</Button>
              </Popconfirm>
              <Popconfirm title="确定删除该申请？" onConfirm={() => {
                setData(data.filter((item) => item.id !== record.id))
                message.success('删除成功')
              }}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
          {record.applyStatus === '申请中' && (
            <Popconfirm title="确定撤销该申请？" onConfirm={() => {
              setData(data.map((item) => item.id === record.id ? { ...item, applyStatus: '已撤销' } : item))
              message.success('申请已撤销')
            }}>
              <Button type="link" size="small" danger icon={<UndoOutlined />}>撤销</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const handleSearch = () => { message.info('搜索功能待接入后端接口') }

  const handleOpenApply = (type: string) => {
    setCurrentApplyType(type)
    form.resetFields()
    setSelectionMode('permission')
    setPermissionCategory('处方权')
    setPermissionSearch('')
    setGroupSearch('')
    setSelectedGroupIds([])
    setSelectedPermissions([])
    setExceptionMap({})
    setCheckCycleMap({})
    setEditingRecord(null)
    setViewingRecord(null)
    setPersonnelSearch('')
    setSelectedPersonnel(null)
    setApplyOpen(true)
  }

  // 筛选出的权限列表
  const filteredPermissions = allPermissions.filter((p) => {
    if (permissionCategory && p.category !== permissionCategory) return false
    if (permissionSearch && !p.name.includes(permissionSearch) && !p.description.includes(permissionSearch)) return false
    return true
  })

  // 筛选出的权限组列表
  const filteredGroups = mockPermissionGroups.filter((g) => {
    if (groupSearch) {
      const kw = groupSearch.trim()
      return g.groupName.includes(kw) || g.groupCode.toLowerCase().includes(kw.toLowerCase()) || g.description.includes(kw)
    }
    return true
  })

  // 权限选择/取消
  const togglePermission = (perm: PermissionOption, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, perm])
    } else {
      setSelectedPermissions(selectedPermissions.filter((p) => p.id !== perm.id))
    }
  }

  // 权限组选择/取消（展开为具体权限并入 selectedPermissions）
  const toggleGroup = (group: PermissionGroupOption, checked: boolean) => {
    if (checked) {
      // 加入已选组ID
      setSelectedGroupIds([...selectedGroupIds, group.id])
      // 展开组内权限并入已选权限列表（去重）
      const groupPerms = allPermissions.filter((p) => group.permissionIds.includes(p.id))
      const merged = [...selectedPermissions]
      groupPerms.forEach((p) => {
        if (!merged.some((m) => m.id === p.id)) merged.push(p)
      })
      setSelectedPermissions(merged)
    } else {
      // 移除已选组ID
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== group.id))
      // 仅保留不在该组内的权限（保留用户从其他组或个人选择加入的）
      const groupPermIds = new Set(group.permissionIds)
      setSelectedPermissions(selectedPermissions.filter((p) => !groupPermIds.has(p.id)))
    }
  }

  // 删除已选权限
  const removeSelectedPermission = (permId: string) => {
    setSelectedPermissions(selectedPermissions.filter((p) => p.id !== permId))
    // 同步清理已无对应权限的权限组ID
    const removedGroupIds = mockPermissionGroups
      .filter((g) => selectedGroupIds.includes(g.id) && g.permissionIds.includes(permId))
      .map((g) => g.id)
    if (removedGroupIds.length > 0) {
      const remainingPermIds = new Set(selectedPermissions.filter((p) => p.id !== permId).map((p) => p.id))
      const stillSelectedGroupIds = selectedGroupIds.filter((gid) => {
        if (!removedGroupIds.includes(gid)) return true
        const grp = mockPermissionGroups.find((g) => g.id === gid)
        if (!grp) return false
        return grp.permissionIds.some((pid) => remainingPermIds.has(pid))
      })
      setSelectedGroupIds(stillSelectedGroupIds)
    }
  }

  const handleApply = async () => {
    try {
      if (selectedPermissions.length === 0) {
        message.warning('请至少选择一项权限')
        return
      }
      const values = await form.validateFields()
      const permissionNames = selectedPermissions.map((p) => p.name).join('、')
      const now = new Date().toISOString().slice(0, 10)

      if (editingRecord) {
        // 编辑模式：更新已有记录
        setData(data.map((item) => {
          if (item.id === editingRecord.id) {
            return {
              ...item,
              permissionName: permissionNames,
              applyReason: values.applyReason || '',
              exception: Object.values(exceptionMap).some((v) => v),
              authStartDate: values.authStartDate ? values.authStartDate.format('YYYY-MM-DD') : undefined,
              authEndDate: values.authEndDate ? values.authEndDate.format('YYYY-MM-DD') : undefined,
            }
          }
          return item
        }))
        message.success('申请已更新')
      } else {
        // 新增模式
        const newRecord: PermissionApplyRecord = {
          id: String(Date.now()),
          applyNo: `PA-2026-${String(data.length + 1).padStart(4, '0')}`,
          applyType: currentApplyType,
          applyStatus: '未提交',
          applicant: '当前用户',
          employeeId: 'GH20240001',
          exception: Object.values(exceptionMap).some((v) => v),
          checkCycle: 0,
          authStartDate: values.authStartDate ? values.authStartDate.format('YYYY-MM-DD') : undefined,
          authEndDate: values.authEndDate ? values.authEndDate.format('YYYY-MM-DD') : undefined,
          department: '外科',
          permissionName: permissionNames,
          applyReason: values.applyReason || '',
          applyDate: now,
          validPeriod: '1年',
        }
        setData([newRecord, ...data])
        message.success(`${currentApplyType}已保存（未提交状态），共申请 ${selectedPermissions.length} 项权限`)
      }
      setApplyOpen(false)
      setEditingRecord(null)
    } catch { /* 表单验证失败 */ }
  }

  const handleEdit = async () => {
    try {
      const values = await editForm.validateFields()
      setData(data.map((item) => {
        if (item.id === editingRecord?.id) {
          return {
            ...item,
            ...values,
            applyDate: values.applyDate?.format?.('YYYY-MM-DD') || item.applyDate,
            validPeriod: values.validPeriod || item.validPeriod,
          }
        }
        return item
      }))
      message.success('申请已更新')
      setEditOpen(false)
      setEditingRecord(null)
    } catch { /* 表单验证失败 */ }
  }

  // 根据已选权限生成个人情况描述
  const generatePersonProfile = (): string[] => {
    if (selectedPermissions.length === 0) return []
    const cats = [...new Set(selectedPermissions.map((p) => p.category))]
    const lines: string[] = []
    lines.push('姓名：张医生 | 工号：GH20240001 | 科室：外科 | 职称：主治医师 | 从业年限：8年')
    if (cats.includes('手术等级')) {
      lines.push('该人员近3年参与三级手术12台、四级手术5台（其中主刀2台），手术并发症发生率0%，术后平均住院天数6.8天。')
    }
    if (cats.includes('处方权')) {
      lines.push('该人员持有抗菌药物处方权（已考核合格），近1年开具处方1,280张，其中抗菌药物处方占比18.2%，处方合格率97.6%。')
    }
    if (cats.includes('输血')) {
      lines.push('该人员近2年参与临床输血处置36例，其中紧急输血8例，无输血不良反应记录。')
    }
    if (cats.includes('麻醉')) {
      lines.push('该人员已完成麻醉科轮转6个月，累计参与麻醉操作220例，其中全身麻醉85例，椎管内麻醉60例。')
    }
    if (cats.includes('特殊检查')) {
      lines.push('该人员近2年完成内镜检查180例、介入检查45例，检查报告合格率98.5%。')
    }
    if (cats.includes('特殊治疗')) {
      lines.push('该人员参与透析治疗120例次，高压氧治疗30例次，无不良事件记录。')
    }
    return lines
  }

  // A4 样式申请表内容
  const renderReportContent = () => (
    <div style={{
      width: 794, // A4 width
      minHeight: 1123,
      margin: '0 auto',
      background: '#fff',
      padding: '48px 64px',
      fontFamily: 'SimSun, serif',
      fontSize: 14,
      lineHeight: 2,
      color: '#000',
      border: '1px solid #d9d9d9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', marginBottom: 32, letterSpacing: 4 }}>
        权限申请表
      </h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 10px', width: '18%', fontWeight: 'bold', background: '#f5f5f5' }}>申请人</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', width: '32%' }}>张医生</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', width: '18%', fontWeight: 'bold', background: '#f5f5f5' }}>工号</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', width: '32%' }}>GH20240001</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 10px', fontWeight: 'bold', background: '#f5f5f5' }}>科室</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px' }}>外科</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', fontWeight: 'bold', background: '#f5f5f5' }}>职称</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px' }}>主治医师</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 10px', fontWeight: 'bold', background: '#f5f5f5' }}>申请类型</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px' }}>{currentApplyType}</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px', fontWeight: 'bold', background: '#f5f5f5' }}>申请日期</td>
            <td style={{ border: '1px solid #000', padding: '6px 10px' }}>{new Date().toISOString().slice(0, 10)}</td>
          </tr>
        </tbody>
      </table>

      <h4 style={{ fontWeight: 'bold', marginBottom: 8 }}>申请权限列表</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #000', padding: '6px 10px', width: '10%' }}>序号</th>
            <th style={{ border: '1px solid #000', padding: '6px 10px', width: '30%' }}>权限分类</th>
            <th style={{ border: '1px solid #000', padding: '6px 10px', width: '35%' }}>权限名称</th>
            <th style={{ border: '1px solid #000', padding: '6px 10px', width: '25%' }}>资格审查</th>
          </tr>
        </thead>
        <tbody>
          {selectedPermissions.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'center', color: '#999' }}>暂未选择权限</td>
            </tr>
          ) : selectedPermissions.map((perm, idx) => (
            <tr key={perm.id}>
              <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #000', padding: '6px 10px' }}>{perm.category}</td>
              <td style={{ border: '1px solid #000', padding: '6px 10px' }}>{perm.name}</td>
              <td style={{ border: '1px solid #000', padding: '6px 10px', textAlign: 'center' }}>{perm.qualification}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 style={{ fontWeight: 'bold', marginBottom: 8 }}>人员情况</h4>
      <div style={{ border: '1px solid #000', padding: '10px 14px', marginBottom: 24, minHeight: 80 }}>
        {generatePersonProfile().map((line, i) => (
          <p key={i} style={{ textIndent: '2em', margin: '4px 0' }}>{line}</p>
        ))}
        {generatePersonProfile().length === 0 && (
          <p style={{ color: '#999', textAlign: 'center', margin: '16px 0' }}>请先选择权限后生成</p>
        )}
      </div>

      <h4 style={{ fontWeight: 'bold', marginBottom: 8 }}>申请说明</h4>
      <div style={{ border: '1px solid #000', padding: '10px 14px', marginBottom: 24, minHeight: 60 }}>
        <p style={{ textIndent: '2em', margin: '4px 0' }}>{form.getFieldValue('applyReason') || '（待填写）'}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
        <span>申请人签名：______________</span>
        <span>日期：______________</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <span>科室负责人：______________</span>
        <span>日期：______________</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <span>医务科审批：______________</span>
        <span>日期：______________</span>
      </div>
    </div>
  )

  // 已选权限表格列
  const selectedColumns: ColumnsType<PermissionOption> = [
    {
      title: '序号', key: 'index', width: 60, align: 'center',
      render: (_: unknown, __: PermissionOption, index: number) => index + 1,
    },
    { title: '权限分类', dataIndex: 'category', key: 'category', width: 100, render: (cat: string) => <Tag>{cat}</Tag> },
    { title: '权限名称', dataIndex: 'name', key: 'name', width: 100, ellipsis: true },
    {
      title: '权限配置', key: 'config', width: 140, align: 'center' as const,
      render: (_: unknown, record: PermissionOption) => {
        const options = permissionConfigOptions[record.category]
        if (!options) {
          return <span style={{ color: '#999' }}>--</span>
        }
        const currentConfig = permissionConfigMap[record.id] || []
        const handleChange = (option: string, checked: boolean) => {
          const newConfig = checked
            ? [...currentConfig, option]
            : currentConfig.filter(opt => opt !== option)
          setPermissionConfigMap({ ...permissionConfigMap, [record.id]: newConfig })
        }
        const column1 = options.filter((_, idx) => idx % 2 === 0)
        const column2 = options.filter((_, idx) => idx % 2 === 1)
        return (
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {column1.map((opt) => (
                <Checkbox
                  key={opt}
                  checked={currentConfig.includes(opt)}
                  onChange={(e) => handleChange(opt, e.target.checked)}
                >
                  {opt}
                </Checkbox>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {column2.map((opt) => (
                <Checkbox
                  key={opt}
                  checked={currentConfig.includes(opt)}
                  onChange={(e) => handleChange(opt, e.target.checked)}
                >
                  {opt}
                </Checkbox>
              ))}
            </div>
          </div>
        )
      },
    },
    {
      title: '资格审查', dataIndex: 'qualification', key: 'qualification', width: 110, align: 'center',
      render: (qual: string, record: PermissionOption) => {
        const cfg = qualificationMap[qual] || { color: 'default', icon: null }
        const detailTable = (
          <Table<QualificationCondition>
            columns={[
              { title: '准入条件', dataIndex: 'conditionName', key: 'conditionName', width: 200 },
              { title: '当前值', dataIndex: 'currentValue', key: 'currentValue', width: 180 },
              { title: '评估结果', dataIndex: 'result', key: 'result', width: 100, align: 'center',
                render: (text: string) => {
                  const c = text === '通过' ? 'green' : text === '不通过' ? 'red' : 'orange'
                  return (
                    <Tag color={text === '通过' ? 'success' : text === '不通过' ? 'error' : 'warning'} style={{ margin: 0 }}>
                      {text}
                    </Tag>
                  )
                },
              },
              {
                title: '必须条件', dataIndex: 'isRequired', key: 'isRequired', width: 90, align: 'center',
                render: (v: boolean) => v
                  ? <Tag color="red" style={{ fontSize: 11 }}>是</Tag>
                  : <Tag color="default" style={{ fontSize: 11 }}>否</Tag>,
              },
            ]}
            dataSource={record.qualificationDetails || []}
            rowKey={(_, idx) => String(idx)}
            size="small"
            pagination={false}
            bordered
            style={{ minWidth: 560 }}
          />
        )
        return (
          <Popover content={detailTable} title="资格审查详情" trigger="hover" placement="left" overlayStyle={{ maxWidth: 720 }}>
            <Tag color={cfg.color} icon={cfg.icon} style={{ cursor: 'pointer' }}>{qual}</Tag>
          </Popover>
        )
      },
    },
    ...((currentApplyType === '临时申请' || viewingRecord?.applyType === '临时申请' || editingRecord?.applyType === '临时申请') ? [{
      title: '破格', key: 'exception', width: 60, align: 'center' as const,
      render: (_: unknown, record: PermissionOption) => (
        <Checkbox
          checked={exceptionMap[record.id] || false}
          onChange={(e) => setExceptionMap({ ...exceptionMap, [record.id]: e.target.checked })}
        />
      ),
    }] : []),
    {
      title: '操作', key: 'action', width: 70, align: 'center' as const,
      render: (_: unknown, record: PermissionOption) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />}
          onClick={() => removeSelectedPermission(record.id)} />
      ),
    },
  ]

  return (
    <div>
      {/* 操作栏：左侧申请按钮 + 右侧搜索 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button type="primary" icon={<UserOutlined />} onClick={() => handleOpenApply('个人申请')}>个人申请</Button>
              <Button icon={<ClockCircleOutlined />} onClick={() => handleOpenApply('临时申请')}>临时申请</Button>
              <Button icon={<SwapOutlined />} onClick={() => handleOpenApply('代理申请')}>代理申请</Button>
            </Space>
          </Col>
          <Col>
            <Space wrap>
              <Input placeholder="搜索申请编号/申请人" prefix={<SearchOutlined />} value={searchText}
                onChange={(e) => setSearchText(e.target.value)} onPressEnter={handleSearch} style={{ width: 220 }} allowClear />
              <Select placeholder="状态" value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} allowClear
                options={[
                  { label: '未提交', value: '未提交' }, { label: '申请中', value: '申请中' },
                  { label: '已通过', value: '已通过' }, { label: '已拒绝', value: '已拒绝' }, { label: '已撤销', value: '已撤销' },
                ]} />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button onClick={() => { setSearchText(''); setStatusFilter(undefined) }}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table columns={columns} dataSource={data} rowKey="id" scroll={{ x: 1380 }} size="middle"
        pagination={{ total: data.length, pageSize: 10, showTotal: (total) => `共 ${total} 条记录`, showSizeChanger: true, showQuickJumper: true }} />

      {/* 申请抽屉（新增/编辑/查看共用） */}
      <Drawer title={editingRecord ? `编辑${currentApplyType}` : viewingRecord ? `查看${currentApplyType}` : currentApplyType}
        open={applyOpen}
        onClose={() => { setApplyOpen(false); setEditingRecord(null); setViewingRecord(null); setExceptionMap({}); setSelectedPersonnel(null) }}
        width={1100} footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setApplyOpen(false); setEditingRecord(null); setViewingRecord(null); setExceptionMap({}); setSelectedPersonnel(null) }}>取消</Button>
            {!viewingRecord && (
              <>
                <Button onClick={handleApply}>
                  暂存
                </Button>
                <Button type="primary" icon={<SendOutlined />} onClick={handleApply}>
                  提交申请
                </Button>
              </>
            )}
          </div>
        }>
        <Row gutter={24} wrap={false} align="top">
          {/* 左侧：权限选择区域 */}
          <Col style={{ width: '240px', flexShrink: 0 }}>
            {/* 权限选择区域 */}
            <div style={{ borderLeft: '3px solid #1677ff', paddingLeft: 8, marginBottom: 12, fontWeight: 600 }}>
              权限选择
            </div>

            {/* 权限/权限组 切换 */}
            <Segmented<'permission' | 'group'>
              block
              value={selectionMode}
              onChange={(val) => {
                setSelectionMode(val)
                setPermissionPage(1)
              }}
              options={[
                { label: '权限', value: 'permission' },
                { label: '权限组', value: 'group' },
              ]}
              style={{ marginBottom: 12 }}
            />

            {/* 权限模式：分类 + 搜索 */}
            {selectionMode === 'permission' && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Select
                  placeholder="请选择权限分类"
                  value={permissionCategory}
                  onChange={(val) => { setPermissionCategory(val); setPermissionPage(1) }}
                  style={{ width: '100%' }}
                  options={permissionCategories}
                  allowClear
                />
                <Input
                  placeholder="搜索权限名称"
                  prefix={<SearchOutlined />}
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  allowClear
                />
              </div>
            )}

            {/* 权限组模式：搜索框 */}
            {selectionMode === 'group' && (
              <div style={{ marginBottom: 16 }}>
                <Input
                  placeholder="搜索权限组名称/编码"
                  prefix={<SearchOutlined />}
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  allowClear
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* 权限列表（权限模式） */}
            {selectionMode === 'permission' && (
              <>
              <div style={{
                maxHeight: 420,
                overflowY: 'auto',
                marginBottom: 12,
                padding: 8,
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                background: '#fff',
              }}>
                {filteredPermissions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 14 }}>暂无匹配的权限</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filteredPermissions
                      .slice((permissionPage - 1) * permissionPageSize, permissionPage * permissionPageSize)
                      .map((perm) => {
                      const isSelected = selectedPermissions.some((p) => p.id === perm.id)
                      return (
                        <div
                          key={perm.id}
                          style={{
                            borderRadius: 6,
                            padding: '8px 12px',
                            background: isSelected ? '#e6f7ff' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                          }}
                        onClick={() => togglePermission(perm, !isSelected)}
                      >
                        <Row align="middle" wrap={false}>
                          <Col flex="none">
                            <Checkbox checked={isSelected} style={{ marginRight: 0 }} />
                          </Col>
                          <Col flex="auto" style={{ marginLeft: 12 }}>
                            <div style={{ fontSize: 14, color: '#333', fontWeight: isSelected ? 500 : 400 }}>{perm.name}</div>
                          </Col>
                        </Row>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

              {/* 分页 */}
              {filteredPermissions.length > permissionPageSize && (
                <Pagination
                  current={permissionPage}
                  pageSize={permissionPageSize}
                  total={filteredPermissions.length}
                  onChange={(page, pageSize) => {
                    setPermissionPage(page)
                    setPermissionPageSize(pageSize)
                  }}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 条`}
                  size="small"
                />
              )}
            </>
            )}

            {/* 权限组列表（权限组模式） */}
            {selectionMode === 'group' && (
              <div style={{
                maxHeight: 420,
                overflowY: 'auto',
                marginBottom: 12,
                padding: 8,
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                background: '#fff',
              }}>
                {filteredGroups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 14 }}>暂无匹配的权限组</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filteredGroups.map((grp) => {
                      const isSelected = selectedGroupIds.includes(grp.id)
                      const permCount = grp.permissionIds.length
                      return (
                        <div
                          key={grp.id}
                          style={{
                            borderRadius: 6,
                            padding: '8px 12px',
                            background: isSelected ? '#f9f0ff' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            borderLeft: isSelected ? '3px solid #722ed1' : '3px solid transparent',
                          }}
                          onClick={() => toggleGroup(grp, !isSelected)}
                        >
                          <Row align="middle" wrap={false}>
                            <Col flex="none">
                              <Checkbox checked={isSelected} style={{ marginRight: 0 }} />
                            </Col>
                            <Col flex="auto" style={{ marginLeft: 12 }}>
                              <div style={{ fontSize: 14, color: '#333', fontWeight: isSelected ? 500 : 400 }}>
                                {grp.groupName}
                                <Tag color="purple" style={{ marginLeft: 8, marginRight: 0, fontSize: 12 }}>{permCount} 项</Tag>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </Col>

          {/* 右侧：已选择权限 + 个人情况 + 申请说明 + 附件 */}
          <Col style={{ flex: 1 }}>
            {/* 代理申请 - 人员选择 */}
            {(currentApplyType === '代理申请' || editingRecord?.applyType === '代理申请' || viewingRecord?.applyType === '代理申请') && (
              <>
                <div style={{ borderLeft: '3px solid #722ed1', paddingLeft: 8, marginBottom: 12, fontWeight: 600 }}>人员选择</div>
                <Form.Item style={{ marginBottom: 16 }} required={!viewingRecord}>
                  <Select
                    showSearch
                    placeholder="输入姓名或工号查询人员"
                    value={selectedPersonnel ? `${selectedPersonnel.name} (${selectedPersonnel.employeeId})` : undefined}
                    onChange={(val: string) => {
                      const person = mockPersonnel.find((p) => `${p.name} (${p.employeeId})` === val)
                      if (person) setSelectedPersonnel(person)
                    }}
                    onSearch={(val) => setPersonnelSearch(val)}
                    filterOption={(input, option) => {
                      if (!input) return true
                      const kw = input.trim()
                      const person = mockPersonnel.find((p) => `${p.name} (${p.employeeId})` === option?.value)
                      return person ? person.name.includes(kw) || person.employeeId.includes(kw) : false
                    }}
                    notFoundContent={personnelSearch ? <span style={{ color: '#cf1322' }}>未找到匹配的人员</span> : '请输入姓名或工号'}
                    style={{ width: '100%' }}
                    allowClear
                    disabled={!!viewingRecord}
                    onClear={() => setSelectedPersonnel(null)}
                    options={mockPersonnel.map((p) => ({
                      label: (
                        <Row align="middle" justify="space-between" style={{ width: '100%' }}>
                          <Col>
                            <Space size={8}>
                              <UserOutlined style={{ color: '#722ed1' }} />
                              <span style={{ fontWeight: 500 }}>{p.name}</span>
                              <span style={{ color: '#999' }}>{p.employeeId}</span>
                            </Space>
                          </Col>
                          <Col>
                            <Space size={6}>
                              <Tag color="blue" style={{ margin: 0 }}>{p.department}</Tag>
                              <Tag style={{ margin: 0 }}>{p.title}</Tag>
                            </Space>
                          </Col>
                        </Row>
                      ),
                      value: `${p.name} (${p.employeeId})`,
                    }))}
                  />
                </Form.Item>
                {/* 已选人员信息卡片 */}
                {selectedPersonnel && (
                  <div style={{
                    marginBottom: 16,
                    padding: '12px 16px',
                    border: '1px solid #d3adf7',
                    borderRadius: 6,
                    background: '#f9f0ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <Space size={12}>
                      <UserOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedPersonnel.name}</span>
                      <span style={{ color: '#666' }}>工号：{selectedPersonnel.employeeId}</span>
                      <Tag color="blue">{selectedPersonnel.department}</Tag>
                      <Tag>{selectedPersonnel.title}</Tag>
                    </Space>
                    {!viewingRecord && (
                      <Button type="link" size="small" danger icon={<CloseCircleOutlined />}
                        onClick={() => setSelectedPersonnel(null)}>
                        移除
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* 已选择权限表格 */}
            <div style={{ borderLeft: '3px solid #52c41a', paddingLeft: 8, marginBottom: 12, fontWeight: 600 }}>
              已选择权限 {selectedPermissions.length > 0 && <span style={{ color: '#1677ff', fontWeight: 'normal' }}>({selectedPermissions.length} 项)</span>}
            </div>
            <Table
              columns={selectedColumns}
              dataSource={selectedPermissions}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 200 }}
              locale={{ emptyText: '暂未选择权限，请在左侧点击选择' }}
              style={{ marginBottom: 16, width: '100%', tableLayout: 'fixed' }}
            />

            {/* 授权日期范围 */}
            {(currentApplyType === '临时申请' || viewingRecord?.applyType === '临时申请' || editingRecord?.applyType === '临时申请') && (
              <>
                <div style={{ borderLeft: '3px solid #fa8c16', paddingLeft: 8, marginBottom: 12, fontWeight: 600 }}>授权日期范围</div>
                <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="authStartDate" label="授权开始日期" rules={[{ required: true, message: '请选择授权开始日期' }]}>
                        <DatePicker style={{ width: '100%' }} placeholder="请选择开始日期" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="authEndDate" label="授权结束日期" rules={[{ required: true, message: '请选择授权结束日期' }]}>
                        <DatePicker style={{ width: '100%' }} placeholder="请选择结束日期" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </>
            )}

            <Divider style={{ margin: '12px 0' }} />

            {/* 个人情况 */}
            <div style={{ borderLeft: '3px solid #1677ff', paddingLeft: 8, marginBottom: 12, fontWeight: 600 }}>个人情况</div>
            <div style={{
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              padding: '14px 16px',
              background: '#fafafa',
              marginBottom: 16,
              minHeight: 60,
              fontSize: 13,
              lineHeight: 2,
              color: '#555',
            }}>
              {selectedPermissions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '12px 0' }}>选择权限后将自动生成人员情况说明</div>
              ) : (
                generatePersonProfile().map((line, i) => (
                  <div key={i} style={{ marginBottom: i < generatePersonProfile().length - 1 ? 4 : 0 }}>
                    {line}
                  </div>
                ))
              )}
            </div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Button icon={<FileTextOutlined />} onClick={() => setReportOpen(true)} disabled={selectedPermissions.length === 0}>
                报告预览
              </Button>
            </div>

            {/* 申请说明（富文本区域，此处用 TextArea 模拟） */}
            <div style={{ borderLeft: '3px solid #1677ff', paddingLeft: 8, marginBottom: 12, fontWeight: 600 }}>申请说明</div>
            <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
              <Form.Item name="applyReason" rules={[{ required: true, message: '请输入申请说明' }]}>
                <Input.TextArea rows={5} placeholder="请输入申请说明（支持富文本）" />
              </Form.Item>
            </Form>

            {/* 附件上传 */}
            <div style={{ borderLeft: '3px solid #1677ff', paddingLeft: 8, marginBottom: 12, fontWeight: 600 }}>附件</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  border: '1px dashed #d9d9d9',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#999',
                  background: '#fafafa',
                }}
              >
                <PlusOutlined style={{ fontSize: 24 }} />
                <div style={{ fontSize: 11, marginTop: 4 }}>上传</div>
              </div>
            </div>
          </Col>
        </Row>
      </Drawer>

      {/* 报告预览抽屉 - A4 样式申请表 */}
      <Drawer title="申请表预览" open={reportOpen} onClose={() => setReportOpen(false)}
        width={1100} footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setReportOpen(false)}>关闭</Button>
            <Button type="primary" icon={<FileTextOutlined />} onClick={() => message.success('申请表已生成（打印功能待接入）')}>
              打印
            </Button>
          </div>
        }>
        {renderReportContent()}
      </Drawer>

      {/* 编辑申请抽屉 */}
      <Drawer title="编辑申请" open={editOpen} onClose={() => { setEditOpen(false); setEditingRecord(null) }}
        width={1100} footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setEditOpen(false); setEditingRecord(null) }}>取消</Button>
            <Button type="primary" onClick={handleEdit}>保存</Button>
          </div>
        }>
        {editingRecord && (
          <Form form={editForm} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="申请编号">{editingRecord.applyNo}</Descriptions.Item>
              <Descriptions.Item label="申请类型">
                {(() => { const cfg = applyTypeMap[editingRecord.applyType] || { color: 'default', icon: null }; return <Tag color={cfg.color} icon={cfg.icon}>{editingRecord.applyType}</Tag> })()}
              </Descriptions.Item>
            </Descriptions>
            <Form.Item label="申请人" name="applicant" rules={[{ required: true, message: '请输入申请人' }]}>
              <Input placeholder="请输入申请人姓名" />
            </Form.Item>
            <Form.Item label="工号" name="employeeId" rules={[{ required: true, message: '请输入工号' }]}>
              <Input placeholder="请输入工号" />
            </Form.Item>
            <Form.Item label="申请科室" name="department" rules={[{ required: true, message: '请选择申请科室' }]}>
              <Select placeholder="请选择申请科室" options={[
                { label: '外科', value: '外科' }, { label: '内科', value: '内科' },
                { label: '急诊科', value: '急诊科' }, { label: '检验科', value: '检验科' },
              ]} />
            </Form.Item>
            <Form.Item label="申请权限" name="permissionName" rules={[{ required: true, message: '请选择权限' }]}>
              <Select placeholder="请选择权限" options={allPermissions.map((p) => ({ label: p.name, value: p.name }))} />
            </Form.Item>
            <Form.Item label="申请原因" name="applyReason" rules={[{ required: true, message: '请输入申请原因' }]}>
              <Input.TextArea rows={3} placeholder="请输入申请原因" />
            </Form.Item>
            <Form.Item label="有效期" name="validPeriod">
              <Select placeholder="请选择有效期" options={[
                { label: '6个月', value: '6个月' }, { label: '1年', value: '1年' },
                { label: '2年', value: '2年' }, { label: '3年', value: '3年' },
                { label: '长期', value: '长期' },
              ]} />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  )
}

export default PermissionApply
