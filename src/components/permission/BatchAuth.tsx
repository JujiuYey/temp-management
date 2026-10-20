import React, { useMemo, useState } from 'react'
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
  Row,
  Col,
  Divider,
  Empty,
  InputNumber,
  Popover,
  Upload,
  Tooltip,
  Checkbox,
} from 'antd'
import {
  SearchOutlined,
  TeamOutlined,
  PlusOutlined,
  DeleteOutlined,
  ImportOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface ApplyRecord {
  id: string
  approvalStatus: string
  authPermissions: string[]
  staffName: string
  staffNames: string[]
  staffCount: number
  applicant: string
  applicantDept: string
  applyDate: string
  applyDescription: string
}

/** 权限分类 */
const CATEGORY_OPTIONS = [
  { label: '处方权', value: '处方权' },
  { label: '手术等级', value: '手术等级' },
  { label: '手术目录', value: '手术目录' },
  { label: '新技术目录', value: '新技术目录' },
  { label: '临床用血', value: '临床用血' },
  { label: '麻醉等级', value: '麻醉等级' },
  { label: '操作', value: '操作' },
  { label: '报告', value: '报告' },
  { label: '设备', value: '设备' },
  { label: '病理', value: '病理' },
]

/** 权限配置选项（与个人申请一致） */
const permissionConfigOptions: Record<string, string[]> = {
  '处方权': ['门诊', '住院'],
  '手术目录': ['开单', '主刀', '一助'],
  '手术等级': ['开单', '主刀', '一助'],
  '设备': ['操作', '维修'],
}

/** 模拟权限数据（用于选择） */
const MOCK_PERMISSIONS = [
  { id: 'PR202407030002', category: '处方权', permissionName: '基本处方权', config: '基本处方', fixed: true, level: '限制级', psychLevel: '', validityMonths: 2 },
  { id: 'PR202407040001', category: '处方权', permissionName: '抗菌药物处方权（特殊级）', config: '抗菌药物特殊级', fixed: false, level: '特殊级', psychLevel: '', validityMonths: 0 },
  { id: 'PR202407040001', category: '处方权', permissionName: '抗菌药物处方权（特殊级）', config: '抗菌药物特殊级', fixed: false, level: '特殊级', psychLevel: '', validityMonths: 0 },
  { id: 'PR202407040002', category: '处方权', permissionName: '抗菌药物处方权（限制级）', config: '抗菌药物限制级', fixed: false, level: '限制级', psychLevel: '', validityMonths: 0 },
  { id: 'PR202407040003', category: '处方权', permissionName: '抗菌药物处方权（非限制级）', config: '抗菌药物非限制级', fixed: false, level: '非限制级', psychLevel: '', validityMonths: 0 },
  { id: 'PR202407040003', category: '处方权', permissionName: '抗菌药物处方权（非限制级）', config: '抗菌药物非限制级', fixed: false, level: '非限制级', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504270001', category: '临床用血', permissionName: '临床用血权(<800ml)', config: '临床用血', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504270002', category: '临床用血', permissionName: '临床用血权(800ml-1600ml)', config: '临床用血', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504270002', category: '临床用血', permissionName: '临床用血权(800ml-1600ml)', config: '临床用血', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504270003', category: '临床用血', permissionName: '临床用血权(>1600ml)', config: '临床用血', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504280001', category: '处方权', permissionName: '毒麻、精神药品(处方调配权)', config: '毒麻药品', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504280001', category: '处方权', permissionName: '毒麻、精神药品(处方调配权)', config: '毒麻药品', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504280002', category: '处方权', permissionName: '毒麻、精神药品(处方调剂权)', config: '毒麻药品', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504280003', category: '处方权', permissionName: '毒放药物处方权(放射性药品)', config: '毒放药物', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504280003', category: '处方权', permissionName: '毒放药物处方权(放射性药品)', config: '毒放药物', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504280004', category: '处方权', permissionName: '麻精药物处方权(第一类精神药物)', config: '麻精药物', fixed: true, level: '', psychLevel: '第一类', validityMonths: 0 },
  { id: 'PR202504280005', category: '处方权', permissionName: '贵重药物', config: '贵重药物', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
  { id: 'PR202504280005', category: '处方权', permissionName: '贵重药物', config: '贵重药物', fixed: true, level: '', psychLevel: '', validityMonths: 0 },
]

/** 模拟人员数据（用于选择，含工号及完整信息） */
const MOCK_STAFF = [
  { id: 'S001', name: '张医生', department: '外科', title: '主治医师', employeeNo: 'G20001', gender: '男', accountStatus: '启用', practiceScope: '外科专业', hiredTitle: '主治医师', nationalCode: '110110199001011234', position: '临床医师', workingStatus: '在岗', joinDate: '2015-06-01', education: '硕士', politicalStatus: '中共党员' },
  { id: 'S002', name: '李医生', department: '内科', title: '副主任医师', employeeNo: 'G20002', gender: '男', accountStatus: '启用', practiceScope: '内科专业', hiredTitle: '副主任医师', nationalCode: '110110198505123456', position: '科副主任', workingStatus: '在岗', joinDate: '2010-08-15', education: '博士', politicalStatus: '群众' },
  { id: 'S003', name: '王护士', department: '内科', title: '主管护师', employeeNo: 'G20003', gender: '女', accountStatus: '启用', practiceScope: '护理学', hiredTitle: '主管护师', nationalCode: '210110198812012345', position: '护士长', workingStatus: '在岗', joinDate: '2012-03-20', education: '本科', politicalStatus: '中共党员' },
  { id: 'S004', name: '赵技师', department: '检验科', title: '技师', employeeNo: 'G20004', gender: '男', accountStatus: '启用', practiceScope: '医学检验', hiredTitle: '技师', nationalCode: '201110199203156789', position: '检验技师', workingStatus: '在岗', joinDate: '2016-07-01', education: '本科', politicalStatus: '群众' },
  { id: 'S005', name: '陈医生', department: '外科', title: '主任医师', employeeNo: 'G20005', gender: '男', accountStatus: '启用', practiceScope: '外科专业', hiredTitle: '主任医师', nationalCode: '110110197508201234', position: '科主任', workingStatus: '在岗', joinDate: '2000-09-01', education: '博士', politicalStatus: '中共党员' },
  { id: 'S006', name: '刘医生', department: '急诊科', title: '主治医师', employeeNo: 'G20006', gender: '男', accountStatus: '启用', practiceScope: '急诊医学', hiredTitle: '主治医师', nationalCode: '110110198704105678', position: '急诊医师', workingStatus: '在岗', joinDate: '2013-05-15', education: '硕士', politicalStatus: '共青团员' },
  { id: 'S007', name: '周护士', department: '外科', title: '护士', employeeNo: 'G20007', gender: '女', accountStatus: '启用', practiceScope: '护理学', hiredTitle: '护士', nationalCode: '210110199506209876', position: '护士', workingStatus: '在岗', joinDate: '2018-01-10', education: '大专', politicalStatus: '群众' },
  { id: 'S008', name: '吴医生', department: '内科', title: '住院医师', employeeNo: 'G20008', gender: '男', accountStatus: '启用', practiceScope: '内科专业', hiredTitle: '住院医师', nationalCode: '110110199311052345', position: '住院医师', workingStatus: '在岗', joinDate: '2019-08-01', education: '硕士', politicalStatus: '群众' },
  { id: 'S009', name: '郑医生', department: '妇产科', title: '副主任医师', employeeNo: 'G20009', gender: '女', accountStatus: '启用', practiceScope: '妇产科专业', hiredTitle: '副主任医师', nationalCode: '110110198209156789', position: '产科主任', workingStatus: '在岗', joinDate: '2008-03-20', education: '博士', politicalStatus: '中共党员' },
  { id: 'S010', name: '孙药师', department: '药剂科', title: '主管药师', employeeNo: 'G20010', gender: '男', accountStatus: '启用', practiceScope: '药学', hiredTitle: '主管药师', nationalCode: '201110198612253456', position: '药房主任', workingStatus: '在岗', joinDate: '2011-07-01', education: '本科', politicalStatus: '群众' },
  { id: 'S011', name: '钱医生', department: '儿科', title: '主治医师', employeeNo: 'G20011', gender: '女', accountStatus: '启用', practiceScope: '儿科专业', hiredTitle: '主治医师', nationalCode: '110110198903107890', position: '儿科医师', workingStatus: '在岗', joinDate: '2014-09-01', education: '硕士', politicalStatus: '共青团员' },
  { id: 'S012', name: '冯医生', department: '骨科', title: '副主任医师', employeeNo: 'G20012', gender: '男', accountStatus: '启用', practiceScope: '骨科专业', hiredTitle: '副主任医师', nationalCode: '110110198307202345', position: '骨科副主任', workingStatus: '在岗', joinDate: '2007-06-15', education: '博士', politicalStatus: '中共党员' },
]

/** 科室选项 */
const DEPARTMENT_OPTIONS = [
  { label: '全部科室', value: '' },
  { label: '外科', value: '外科' },
  { label: '内科', value: '内科' },
  { label: '检验科', value: '检验科' },
  { label: '急诊科', value: '急诊科' },
  { label: '妇产科', value: '妇产科' },
  { label: '药剂科', value: '药剂科' },
  { label: '儿科', value: '儿科' },
  { label: '骨科', value: '骨科' },
]

interface SelectedPermission {
  id: string
  category: string
  permissionName: string
  config: string
}

interface SelectedStaff {
  id: string
  name: string
  department: string
  title: string
  /** 该人员对所有已选权限的资格审查结果 */
  qualificationSummary?: {
    pass: number
    fail: number
    pending: number
  }
  /** 各权限的审查详情（用于 Popover） */
  qualificationDetails?: { permissionName: string; details: QualificationCondition[] }[]
}

/** 资格审查 — 单条准入条件 */
interface QualificationCondition {
  conditionName: string
  currentValue: string
  result: '通过' | '不通过' | '不确认'
  isRequired: boolean
}

const BatchAuth: React.FC = () => {
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [form] = Form.useForm()

  // 抽屉模式：新增 / 查看 / 修改
  const [drawerMode, setDrawerMode] = useState<'add' | 'view' | 'edit'>('add')
  const [editingRecord, setEditingRecord] = useState<ApplyRecord | null>(null)
  const isReadOnly = drawerMode === 'view'

  // 步骤1：权限选择
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>('处方权')
  const [selectedPermissions, setSelectedPermissions] = useState<SelectedPermission[]>([])
  const [permissionSearchText, setPermissionSearchText] = useState('')
  const [permissionSelectOpen, setPermissionSelectOpen] = useState(false)
  const [permissionConfigMap, setPermissionConfigMap] = useState<Record<string, string[]>>({}) // 权限配置勾选状态

  // 步骤2：人员选择
  const [selectedStaffList, setSelectedStaffList] = useState<SelectedStaff[]>([])
  const [staffSearchText, setStaffSearchText] = useState('')
  const [staffDeptFilter, setStaffDeptFilter] = useState<string | undefined>(undefined)
  const [staffSelectOpen, setStaffSelectOpen] = useState(false)
  // 人员选择抽屉状态
  const [staffPickerOpen, setStaffPickerOpen] = useState(false)
  const [pickerSearchText, setPickerSearchText] = useState('')
  const [pickerDeptFilter, setPickerDeptFilter] = useState<string | undefined>(undefined)
  const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([])
  const [pickerPage, setPickerPage] = useState(1)
  const [pickerPageSize, setPickerPageSize] = useState(20)

  // 权限选择抽屉状态
  const [permissionPickerOpen, setPermissionPickerOpen] = useState(false)
  const [permPickerSearchText, setPermPickerSearchText] = useState('')
  const [permPickerSelectedIds, setPermPickerSelectedIds] = useState<string[]>([])
  const [permPickerPage, setPermPickerPage] = useState(1)
  const [permPickerPageSize, setPermPickerPageSize] = useState(20)

  const [data, setData] = useState<ApplyRecord[]>([
    { id: '1', approvalStatus: '已完成', authPermissions: ['普通处方权', '抗菌药物处方权'], staffName: '张医生等', staffNames: ['张医生', '李医生', '王护士', '赵技师', '陈医生'], staffCount: 5, applicant: '李主任', applicantDept: '医务科', applyDate: '2026-06-01', applyDescription: '新入职医生授权' },
    { id: '2', approvalStatus: '审批中', authPermissions: ['二级手术权限', '腹腔镜胆囊切除术'], staffName: '王医生等', staffNames: ['王医生', '赵医生', '刘医生'], staffCount: 3, applicant: '赵主任', applicantDept: '外科', applyDate: '2026-06-05', applyDescription: '手术权限升级' },
    { id: '3', approvalStatus: '未提交', authPermissions: ['红细胞输注权限'], staffName: '刘医生', staffNames: ['刘医生'], staffCount: 1, applicant: '陈科长', applicantDept: '输血科', applyDate: '2026-06-10', applyDescription: '用血权限申请' },
    { id: '4', approvalStatus: '已撤回', authPermissions: ['一级麻醉权限'], staffName: '周医生等', staffNames: ['周医生', '吴医生'], staffCount: 2, applicant: '吴主任', applicantDept: '麻醉科', applyDate: '2026-06-08', applyDescription: '麻醉权限申请' },
  ])

  // 可选权限（根据分类筛选 + 名称搜索）
  const availablePermissions = MOCK_PERMISSIONS.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false
    if (permissionSearchText.trim()) {
      const keyword = permissionSearchText.trim().toLowerCase()
      return p.permissionName.toLowerCase().includes(keyword)
    }
    return true
  })

  // 可选人员（根据科室筛选 + 名称搜索）
  const availableStaff = MOCK_STAFF.filter((s) => {
    if (staffDeptFilter && s.department !== staffDeptFilter) return false
    if (staffSearchText.trim()) {
      const keyword = staffSearchText.trim().toLowerCase()
      return s.name.toLowerCase().includes(keyword) || s.department.toLowerCase().includes(keyword)
    }
    return true
  })

  // 前端过滤
  const filteredData = data.filter((r) => {
    if (statusFilter && r.approvalStatus !== statusFilter) return false
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase()
      return r.staffName.toLowerCase().includes(keyword) || r.applicant.toLowerCase().includes(keyword) || r.authPermissions.some((p) => p.toLowerCase().includes(keyword))
    }
    return true
  })

  const statusColorMap: Record<string, string> = {
    '已完成': 'green',
    '审批中': 'processing',
    '未提交': 'default',
    '已撤回': 'orange',
  }

  const columns: ColumnsType<ApplyRecord> = [
    {
      title: '序号', key: 'index', width: 60, align: 'center',
      render: (_: unknown, __: ApplyRecord, index: number) => index + 1,
    },
    {
      title: '审批状态', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 100,
      render: (status: string) => <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>,
    },
    {
      title: '授权权限', dataIndex: 'authPermissions', key: 'authPermissions', width: 200,
      render: (perms: string[]) => (
        <Space size={[4, 4]} wrap>
          {perms.map((p) => <Tag key={p} color="purple">{p}</Tag>)}
        </Space>
      ),
    },
    {
      title: '人员', dataIndex: 'staffNames', key: 'staffNames', width: 160,
      render: (names: string[]) => {
        if (!names || names.length === 0) return '-'
        const displayNames = names.slice(0, 3)
        const restCount = names.length - 3
        if (restCount <= 0) {
          return <span>{displayNames.join('、')}</span>
        }
        return (
          <Tooltip title={names.join('、')} placement="topLeft">
            <span>{displayNames.join('、')}...</span>
          </Tooltip>
        )
      },
    },
    { title: '授权人数', dataIndex: 'staffCount', key: 'staffCount', width: 90, align: 'center' },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 90 },
    { title: '申请部门', dataIndex: 'applicantDept', key: 'applicantDept', width: 100 },
    { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate', width: 110 },
    { title: '申请说明', dataIndex: 'applyDescription', key: 'applyDescription', width: 150, ellipsis: true },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: (_: unknown, record: ApplyRecord) => (
        <Space size="small">
          {record.approvalStatus === '未提交' && (
            <>
              <Button type="link" size="small" onClick={() => message.info('提交审批')}>提交</Button>
              <Button type="link" size="small" onClick={() => handleOpenDrawer(record, 'edit')}>修改</Button>
              <Button type="link" size="small" danger onClick={() => { setData(data.filter((r) => r.id !== record.id)); message.success('删除成功') }}>删除</Button>
            </>
          )}
          {record.approvalStatus === '审批中' && (
            <Button type="link" size="small" onClick={() => message.info('撤回申请')}>撤回</Button>
          )}
          {record.approvalStatus === '已完成' && (
            <Button type="link" size="small" onClick={() => handleOpenDrawer(record, 'view')}>查看</Button>
          )}
          {record.approvalStatus === '已撤回' && (
            <>
              <Button type="link" size="small" onClick={() => handleOpenDrawer(record, 'edit')}>修改</Button>
              <Button type="link" size="small" danger onClick={() => { setData(data.filter((r) => r.id !== record.id)); message.success('删除成功') }}>删除</Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const handleOpenAuth = () => {
    setDrawerMode('add')
    setEditingRecord(null)
    setCurrentStep(0)
    setCategoryFilter('处方权')
    setPermissionSearchText('')
    setSelectedPermissions([])
    setPermissionConfigMap({})
    setSelectedStaffList([])
    setStaffSearchText('')
    setStaffDeptFilter(undefined)
    form.resetFields()
    setAuthDrawerOpen(true)
  }

  /** 查看或修改：回填已有记录数据并打开抽屉 */
  const handleOpenDrawer = (record: ApplyRecord, mode: 'view' | 'edit') => {
    setDrawerMode(mode)
    setEditingRecord(record)
    setCurrentStep(0)
    setCategoryFilter(undefined)
    setPermissionSearchText('')
    // 回填权限
    const perms = record.authPermissions.map((name, idx) => {
      const found = MOCK_PERMISSIONS.find((p) => p.permissionName === name)
      return {
        id: found?.id || `exist-${idx}`,
        category: found?.category || '',
        permissionName: name,
        config: found?.config || '',
      }
    })
    setSelectedPermissions(perms)
    // 回填人员
    const staff = record.staffNames.map((name, idx) => {
      const found = MOCK_STAFF.find((s) => s.name === name)
      return {
        id: found?.id || `exist-${idx}`,
        name,
        department: found?.department || '',
        title: found?.title || '',
      }
    })
    setSelectedStaffList(staff)
    // 回填申请说明
    form.setFieldsValue({ description: record.applyDescription })
    setStaffSearchText('')
    setStaffDeptFilter(undefined)
    setAuthDrawerOpen(true)
  }

  const handleSave = async () => {
    try {
      await form.validateFields()
      if (selectedPermissions.length === 0) {
        message.warning('请至少选择一个权限')
        return
      }
      if (selectedStaffList.length === 0) {
        message.warning('请至少选择一个人员')
        return
      }
      message.success(`成功为 ${selectedStaffList.length} 名人员授权 ${selectedPermissions.length} 项权限`)
      setAuthDrawerOpen(false)
    } catch { /* 表单验证失败 */ }
  }

  // 步骤1：权限选择表格列（与个人申请抽屉一致）
  const permissionColumns: ColumnsType<SelectedPermission> = [
    {
      title: '序号', key: 'index', width: 60, align: 'center',
      render: (_: unknown, __: SelectedPermission, index: number) => index + 1,
    },
    { title: '权限分类', dataIndex: 'category', key: 'category', width: 100, render: (cat: string) => <Tag>{cat}</Tag> },
    { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 160 },
    {
      title: '权限配置', key: 'config', width: 140, align: 'center' as const,
      render: (_: unknown, record: SelectedPermission) => {
        const options = permissionConfigOptions[record.category]
        if (!options) {
          return <span style={{ color: '#999' }}>{record.config || '--'}</span>
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
                  disabled={isReadOnly}
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
                  disabled={isReadOnly}
                >
                  {opt}
                </Checkbox>
              ))}
            </div>
          </div>
        )
      },
    },
    ...(!isReadOnly ? [{
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, record: SelectedPermission) => (
        <Button type="link" size="small" danger
          onClick={() => {
            setSelectedPermissions(selectedPermissions.filter((p) => p.id !== record.id))
            // 同步清理配置
            const newConfigMap = { ...permissionConfigMap }
            delete newConfigMap[record.id]
            setPermissionConfigMap(newConfigMap)
          }}>
          删除
        </Button>
      ),
    }] : []),
  ]

  // 步骤2：人员选择表格列
  const staffColumns: ColumnsType<SelectedStaff> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_: unknown, __: SelectedStaff, index: number) => index + 1,
    },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '科室', dataIndex: 'department', key: 'department', width: 100,
      render: (dept: string) => <Tag color="blue">{dept}</Tag>,
    },
    {
      title: '资格审查',
      key: 'qualification',
      width: 140,
      align: 'center' as const,
      render: (_: unknown, record: SelectedStaff) => {
        const summary = record.qualificationSummary
        if (!summary) return <span style={{ color: '#999' }}>待审查</span>

        let overall: '全部通过' | '部分通过' | '全部不通过' = '部分通过'
        if (summary.pass > 0 && summary.fail === 0 && summary.pending === 0) {
          overall = '全部通过'
        } else if (summary.pass === 0 && summary.fail > 0 && summary.pending === 0) {
          overall = '全部不通过'
        }

        const cfg = {
          '全部通过':   { color: 'success' as const, icon: <CheckCircleOutlined /> },
          '部分通过':   { color: 'warning' as const, icon: <QuestionCircleOutlined /> },
          '全部不通过': { color: 'error' as const,   icon: <CloseCircleOutlined /> },
        }[overall]

        // 按权限名去重，同一权限只显示一行
        const seenNames = new Set<string>()
        const uniqueDetails = (record.qualificationDetails || []).filter(item => {
          if (seenNames.has(item.permissionName)) return false
          seenNames.add(item.permissionName)
          return true
        })

        const groupOrder = ['不通过', '不确认', '通过']
        type TableRowType = { _type: 'group'; label: string } | { _type: 'data'; permissionName: string; conditions: { conditionName: string; currentValue: string }[]; result: string; hasRequired: boolean }
        const tableRows: TableRowType[] = []

        const groups: Record<string, { permissionName: string; conditions: { conditionName: string; currentValue: string }[]; result: string; hasRequired: boolean }[]> = { '不通过': [], '不确认': [], '通过': [] }

        uniqueDetails.forEach(item => {
          const conditions = item.details.map(c => ({
            conditionName: c.conditionName,
            currentValue: c.currentValue,
          }))
          const hasRequired = item.details.some(c => c.isRequired)
          const result = item.details.every(c => c.result === '通过') ? '通过' :
                         item.details.some(c => c.result === '不通过') ? '不通过' : '不确认'
          groups[result]?.push({
            permissionName: item.permissionName,
            conditions,
            result,
            hasRequired,
          })
        })

        groupOrder.forEach(key => {
          const items = groups[key]
          if (!items || items.length === 0) return
          tableRows.push({ _type: 'group', label: `${key}（${items.length}条）` })
          items.forEach(item => {
            tableRows.push({ _type: 'data', permissionName: item.permissionName, conditions: item.conditions, result: item.result, hasRequired: item.hasRequired })
          })
        })

        const detailTable = tableRows.length > 0 ? (
          <div style={{ maxHeight: 480, overflow: 'auto' }}>
            <Table
              columns={[
                {
                  title: '权限名称',
                  key: 'permissionName',
                  width: 180,
                  render: (_: unknown, row: TableRowType) => {
                    if (row._type === 'group') return <span style={{ fontWeight: 600 }}>{row.label}</span>
                    return <span>{row.permissionName}</span>
                  },
                },
                {
                  title: '准入条件',
                  key: 'condition',
                  width: 240,
                  render: (_: unknown, row: TableRowType) => {
                    if (row._type === 'group') return null
                    return <div>{row.conditions.map((c, i) => <div key={i}>{c.conditionName}</div>)}</div>
                  },
                },
                {
                  title: '当前值',
                  key: 'currentValue',
                  width: 220,
                  render: (_: unknown, row: TableRowType) => {
                    if (row._type === 'group') return null
                    return <div>{row.conditions.map((c, i) => <div key={i}>{c.currentValue}</div>)}</div>
                  },
                },
                {
                  title: '评估结果',
                  key: 'result',
                  width: 90,
                  align: 'center',
                  render: (_: unknown, row: TableRowType) => {
                    if (row._type === 'group') return null
                    return (
                      <Tag color={row.result === '通过' ? 'success' : row.result === '不通过' ? 'error' : 'warning'} style={{ margin: 0 }}>
                        {row.result}
                      </Tag>
                    )
                  },
                },
                {
                  title: '必须',
                  key: 'isRequired',
                  width: 60,
                  align: 'center',
                  render: (_: unknown, row: TableRowType) => {
                    if (row._type === 'group') return null
                    return row.hasRequired
                      ? <span>是</span>
                      : <span style={{ color: '#999' }}>否</span>
                  },
                },
              ]}
              dataSource={tableRows}
              rowKey={(_, i) => String(i)}
              size="small"
              pagination={false}
              bordered
              onRow={(record) => {
                if (record._type === 'group') {
                  let bgColor = '#f5f5f5'
                  let color = '#333'
                  if ((record as any).label.includes('不通过')) {
                    bgColor = '#ffcccc'
                    color = '#d93026'
                  } else if ((record as any).label.includes('不确认')) {
                    bgColor = '#fffbe6'
                    color = '#ad8b00'
                  } else if ((record as any).label.includes('通过')) {
                    bgColor = '#d4edda'
                    color = '#155724'
                  }
                  return { style: { backgroundColor: bgColor, fontWeight: 600, color } }
                }
                return {}
              }}
            />
          </div>
        ) : null

        const displayText = overall === '全部通过' ? '全部通过' :
          overall === '全部不通过' ? '全部不通过' :
          '部分通过'

        return (
          <Popover content={detailTable} title="资格审查详情（所有权限）" trigger="hover" placement="left" overlayStyle={{ maxWidth: 720 }}>
            <Tag color={cfg.color} icon={cfg.icon} style={{ cursor: 'pointer' }}>
              {displayText}
            </Tag>
          </Popover>
        )
      },
    },
    ...(!isReadOnly ? [{
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, record: SelectedStaff) => (
        <Button type="link" size="small" danger
          onClick={() => setSelectedStaffList(selectedStaffList.filter((s) => s.id !== record.id))}>
          删除
        </Button>
      ),
    }] : []),
  ]

  const handleAddPermission = (permission: typeof MOCK_PERMISSIONS[number]) => {
    if (selectedPermissions.some((sp) => sp.id === permission.id)) {
      message.info('该权限已添加')
      return
    }
    setSelectedPermissions([...selectedPermissions, {
      id: permission.id,
      category: permission.category,
      permissionName: permission.permissionName,
      config: permission.config,
    }])
    setPermissionSearchText('')
    setPermissionSelectOpen(false)
  }

  // 权限选择抽屉相关函数
  const handleOpenPermissionPicker = () => {
    setPermPickerSelectedIds([])
    setPermPickerSearchText('')
    setPermPickerPage(1)
    setPermissionPickerOpen(true)
  }

  const handleClosePermissionPicker = () => {
    setPermissionPickerOpen(false)
  }

  const handleConfirmPermissionPicker = () => {
    if (permPickerSelectedIds.length === 0) {
      message.warning('请至少选择一项权限')
      return
    }
    const newPermissions = MOCK_PERMISSIONS
      .filter((p) => permPickerSelectedIds.includes(p.id))
      .filter((p) => !selectedPermissions.some((sp) => sp.id === p.id))
      .map((p) => ({
        id: p.id,
        category: p.category,
        permissionName: p.permissionName,
        config: p.config,
      }))
    setSelectedPermissions([...selectedPermissions, ...newPermissions])
    setPermissionPickerOpen(false)
    message.success(`已选择 ${newPermissions.length} 项权限`)
  }

  // 权限选择抽屉过滤后的数据
  const filteredPermissionsForPicker = useMemo(() => {
    return MOCK_PERMISSIONS.filter((p) => {
      if (selectedPermissions.some((sp) => sp.id === p.id)) return false
      if (permPickerSearchText.trim()) {
        const kw = permPickerSearchText.trim().toLowerCase()
        return p.permissionName.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw)
      }
      if (categoryFilter && p.category !== categoryFilter) return false
      return true
    })
  }, [permPickerSearchText, categoryFilter, selectedPermissions])

  // 权限选择抽屉表格列
  const permissionPickerColumns: ColumnsType<typeof MOCK_PERMISSIONS[number]> = [
    {
      title: <Checkbox
        checked={filteredPermissionsForPicker.length > 0 && filteredPermissionsForPicker.every((p) => permPickerSelectedIds.includes(p.id))}
        indeterminate={filteredPermissionsForPicker.some((p) => permPickerSelectedIds.includes(p.id)) && !filteredPermissionsForPicker.every((p) => permPickerSelectedIds.includes(p.id))}
        onChange={(checked) => {
          if (checked) {
            setPermPickerSelectedIds([...permPickerSelectedIds, ...filteredPermissionsForPicker.map((p) => p.id)])
          } else {
            setPermPickerSelectedIds(permPickerSelectedIds.filter((id) => !filteredPermissionsForPicker.some((p) => p.id === id)))
          }
        }}
      />,
      key: 'select',
      width: 50,
      render: (_: unknown, record: typeof MOCK_PERMISSIONS[number]) => (
        <Checkbox
          checked={permPickerSelectedIds.includes(record.id)}
          onChange={(checked) => {
            if (checked) {
              setPermPickerSelectedIds([...permPickerSelectedIds, record.id])
            } else {
              setPermPickerSelectedIds(permPickerSelectedIds.filter((id) => id !== record.id))
            }
          }}
        />
      ),
    },
    { title: '名称', dataIndex: 'permissionName', key: 'permissionName', width: 140 },
    { title: '有效期（月）', dataIndex: 'validityMonths', key: 'validityMonths', width: 100 },
  ]

  // 人员选择抽屉相关函数
  const handleOpenStaffPicker = () => {
    // 初始化已选ID（排除已在列表中的人员）
    const existingIds = new Set(selectedStaffList.map((s) => s.id))
    setPickerSelectedIds([])
    setPickerSearchText('')
    setPickerDeptFilter(undefined)
    setPickerPage(1)
    setStaffPickerOpen(true)
  }

  const handleCloseStaffPicker = () => {
    setStaffPickerOpen(false)
  }

  const handleConfirmStaffPicker = () => {
    if (pickerSelectedIds.length === 0) {
      message.warning('请至少选择一名人员')
      return
    }
    // 将选择的人员添加到已选列表（去重）
    const newStaff = MOCK_STAFF
      .filter((s) => pickerSelectedIds.includes(s.id))
      .filter((s) => !selectedStaffList.some((ss) => ss.id === s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        department: s.department,
        title: s.title,
      }))
    // 自动审查（如果有已选权限）
    if (selectedPermissions.length > 0) {
      computeAllQualifications([...selectedStaffList, ...newStaff])
    } else {
      setSelectedStaffList([...selectedStaffList, ...newStaff])
    }
    setStaffPickerOpen(false)
    message.success(`已选择 ${newStaff.length} 名人员`)
  }

  // 人员选择抽屉过滤后的数据
  const filteredStaffForPicker = useMemo(() => {
    return MOCK_STAFF.filter((s) => {
      // 排除已选择的人员
      if (selectedStaffList.some((ss) => ss.id === s.id)) return false
      // 关键词搜索
      if (pickerSearchText.trim()) {
        const kw = pickerSearchText.trim().toLowerCase()
        if (!s.name.toLowerCase().includes(kw) && 
            !s.employeeNo.toLowerCase().includes(kw) &&
            !s.department.toLowerCase().includes(kw)) {
          return false
        }
      }
      // 科室筛选
      if (pickerDeptFilter && s.department !== pickerDeptFilter) return false
      return true
    })
  }, [pickerSearchText, pickerDeptFilter, selectedStaffList])

  // 人员选择抽屉表格列
  const pickerColumns: ColumnsType<typeof MOCK_STAFF[number]> = [
    {
      title: <Checkbox
        checked={filteredStaffForPicker.length > 0 && filteredStaffForPicker.every((s) => pickerSelectedIds.includes(s.id))}
        indeterminate={filteredStaffForPicker.some((s) => pickerSelectedIds.includes(s.id)) && !filteredStaffForPicker.every((s) => pickerSelectedIds.includes(s.id))}
        onChange={(checked) => {
          if (checked) {
            setPickerSelectedIds([...pickerSelectedIds, ...filteredStaffForPicker.map((s) => s.id)])
          } else {
            setPickerSelectedIds(pickerSelectedIds.filter((id) => !filteredStaffForPicker.some((s) => s.id === id)))
          }
        }}
      />,
      key: 'select',
      width: 50,
      render: (_: unknown, record: typeof MOCK_STAFF[number]) => (
        <Checkbox
          checked={pickerSelectedIds.includes(record.id)}
          onChange={(checked) => {
            if (checked) {
              setPickerSelectedIds([...pickerSelectedIds, record.id])
            } else {
              setPickerSelectedIds(pickerSelectedIds.filter((id) => id !== record.id))
            }
          }}
        />
      ),
    },
    { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
    { title: '账号状态', dataIndex: 'accountStatus', key: 'accountStatus', width: 80,
      render: (status: string) => <Tag color={status === '启用' ? 'green' : 'red'}>{status}</Tag> },
    { title: '所属科室', dataIndex: 'department', key: 'department', width: 100 },
    { title: '执业范围', dataIndex: 'practiceScope', key: 'practiceScope', width: 120 },
    { title: '聘任职称', dataIndex: 'hiredTitle', key: 'hiredTitle', width: 100 },
    { title: '岗位', dataIndex: 'position', key: 'position', width: 100 },
  ]

  // ==================== 批量资格审查计算 ====================
  /** 根据人员职称 + 权限分类，生成模拟资格审查条件列表 */
  const getMockQualificationDetails = (
    staffTitle: string,
    permissionCategory: string,
    permissionName: string,
  ): QualificationCondition[] => {
    const isSenior = staffTitle.includes('主任')
    const isAssociate = staffTitle.includes('副主任')
    const isAttending = staffTitle.includes('主治')
    const isJunior = staffTitle.includes('住院') || staffTitle.includes('医师') && !isSenior && !isAssociate && !isAttending
    const isNurse = staffTitle.includes('护士') || staffTitle.includes('护师')
    const isTechnician = staffTitle.includes('技师') || staffTitle.includes('药师')

    // 基础条件模板（根据分类调整）
    const baseConditions: Omit<QualificationCondition, 'result' | 'currentValue'>[] = [
      { conditionName: `聘用职称要求（${permissionCategory}）`, isRequired: true },
      { conditionName: `年资要求（${permissionCategory}）`, isRequired: false },
    ]

    if (permissionCategory === '处方权') {
      baseConditions.push(
        { conditionName: '执业注册：已注册', isRequired: true },
        { conditionName: '抗菌药物培训：合格', isRequired: false },
      )
    }
    if (permissionCategory === '手术等级' || permissionCategory === '手术目录') {
      baseConditions.push(
        { conditionName: '手术培训：完成专项培训', isRequired: true },
        { conditionName: '操作例数：满足最低要求', isRequired: false },
      )
    }
    if (permissionCategory === '临床用血') {
      baseConditions.push(
        { conditionName: '输血培训：完成培训', isRequired: true },
      )
    }

    return baseConditions.map((c): QualificationCondition => {
      // 判断是否通过（简化模拟逻辑）
      let result: '通过' | '不通过' | '不确认' = '通过'
      let currentValue = ''

      if (c.conditionName.includes('聘用职称')) {
        if (isSenior || isAssociate) {
          result = '通过'
          currentValue = `职称：${staffTitle}，符合高级职称要求`
        } else if (isAttending) {
          result = permissionCategory === '手术等级' ? '不确认' : '通过'
          currentValue = `职称：${staffTitle}，符合中级职称要求`
        } else if (isJunior) {
          result = '不通过'
          currentValue = `职称：${staffTitle}，不符合要求`
        } else if (isNurse || isTechnician) {
          result = '不通过'
          currentValue = `职称：${staffTitle}，非医师系列`
        } else {
          result = '不确认'
          currentValue = `职称：${staffTitle}，需人工审核`
        }
      } else if (c.conditionName.includes('年资')) {
        if (isSenior || isAssociate) {
          result = '通过'
          currentValue = '年限：≥10年'
        } else if (isAttending) {
          result = '通过'
          currentValue = '年限：≥5年'
        } else {
          result = '不通过'
          currentValue = '年限：<3年'
        }
      } else if (c.conditionName.includes('培训') || c.conditionName.includes('考核')) {
        if (isSenior || isAssociate || isAttending) {
          result = '通过'
          currentValue = '培训：已完成'
        } else {
          result = '不确认'
          currentValue = '培训状态：不确认'
        }
      } else {
        result = '通过'
        currentValue = '状态：已满足'
      }

      return {
        ...c,
        currentValue,
        result,
      }
    })
  }

  /** 为所有已选人员计算所有已选权限的资格审查结果 */
  const computeAllQualifications = (staffList?: SelectedStaff[], permissions?: SelectedPermission[]) => {
    const staff = staffList || selectedStaffList
    const perms = permissions || selectedPermissions
    const updated = staff.map(s => {
      const details: { permissionName: string; details: QualificationCondition[] }[] = []
      let pass = 0, fail = 0, pending = 0

      // 按权限名去重，同一权限只计算一次
      const seenPerms = new Set<string>()
      perms.forEach(perm => {
        if (seenPerms.has(perm.permissionName)) return
        seenPerms.add(perm.permissionName)
        const cond = getMockQualificationDetails(s.title, perm.category, perm.permissionName)
        details.push({ permissionName: perm.permissionName, details: cond })
        cond.forEach(c => {
          if (c.result === '通过') pass++
          else if (c.result === '不通过') fail++
          else pending++
        })
      })

      return {
        ...s,
        qualificationSummary: { pass, fail, pending },
        qualificationDetails: details,
      }
    })
    setSelectedStaffList(updated)
  }

  // 步骤1内容
  const renderStep1 = () => (
    <div>
      {/* 权限选择头部 - 靠左（只读模式隐藏操作按钮） */}
      {!isReadOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <Select
            placeholder="选择权限分类"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 160 }}
            allowClear
            options={CATEGORY_OPTIONS}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleOpenPermissionPicker}>
            选择权限
          </Button>
        </div>
      )}

      {/* 已选择权限标题 */}
      <div style={{ borderLeft: '3px solid #52c41a', paddingLeft: 8, marginBottom: 12, fontWeight: 600 }}>
        已选择权限 {selectedPermissions.length > 0 && <span style={{ color: '#1677ff', fontWeight: 'normal' }}>({selectedPermissions.length} 项)</span>}
      </div>
      
      {/* 已选权限表格 */}
      <Table
        columns={permissionColumns}
        dataSource={selectedPermissions}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: 200 }}
        locale={{ emptyText: '暂未选择权限，请在上方搜索框输入权限名称选择' }}
        style={{ marginBottom: 16 }}
      />

      {/* 申请说明 */}
      <div style={{ marginTop: 24 }}>
        <div style={{ borderLeft: '3px solid #52c41a', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
          申请说明
        </div>
        <Form.Item name="description" noStyle>
          <Input.TextArea
            rows={4}
            disabled={isReadOnly}
            placeholder="（内容包括但不限于：医师现有职称、开展手术的年限、手术数量、手术效果、质量与安全指标完成情况、相关技术培训或进修情况等）&#10;初次授权模板："
          />
        </Form.Item>
      </div>

      {/* 附件（只读模式隐藏） */}
      {!isReadOnly && (
        <div style={{ marginTop: 16 }}>
          <div style={{ borderLeft: '3px solid #52c41a', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
            附件
          </div>
          <div
            style={{
              width: 80,
              height: 80,
              border: '1px dashed #d9d9d9',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#999',
            }}
          >
            <PlusOutlined style={{ fontSize: 24 }} />
          </div>
        </div>
      )}
    </div>
  )

  // 步骤2：人员搜索结果（模糊匹配姓名/工号）
  const staffSearchResults = useMemo(() => {
    if (!staffSearchText.trim()) return []
    const keyword = staffSearchText.trim().toLowerCase()
    return MOCK_STAFF.filter(
      (s) => s.name.toLowerCase().includes(keyword) || s.employeeNo.toLowerCase().includes(keyword)
    ).filter((s) => !selectedStaffList.some((ss) => ss.id === s.id))
  }, [staffSearchText, selectedStaffList])

  // 添加单个人员
  const handleAddStaff = (staff: typeof MOCK_STAFF[number]) => {
    const newList = [...selectedStaffList, {
      id: staff.id,
      name: staff.name,
      department: staff.department,
      title: staff.title,
    }]
    // 自动审查（如果有已选权限）
    if (selectedPermissions.length > 0) {
      computeAllQualifications(newList)
    } else {
      setSelectedStaffList(newList)
    }
    setStaffSearchText('')
    setStaffSelectOpen(false)
  }

  // 步骤2内容
  const renderStep2 = () => (
    <div>
      {/* 人员选择头部 - 左侧标题+统计，右侧导入+查询（只读模式隐藏操作按钮） */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          人员选择 <span style={{ color: '#1677ff', fontWeight: 400, fontSize: 13 }}>已选择{selectedStaffList.length}人</span>
        </div>
        {!isReadOnly && (
          <Space size={12}>
            <Button icon={<ImportOutlined />}
              onClick={() => message.info('导入功能待接入')}>
              导入
            </Button>
            <Button type="primary" icon={<UserAddOutlined />}
              onClick={handleOpenStaffPicker}>
              手动选择人员
            </Button>
          </Space>
        )}
      </div>

      {/* 已选人员表格 */}
      <Table
        columns={staffColumns}
        dataSource={selectedStaffList}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 人` }}
        locale={{ emptyText: (
          <Empty
            description={
              <div>
                <div>暂无选择人员</div>
                <div style={{ color: '#999', fontSize: 12 }}>请通过上方筛选添加需要授权的人员</div>
              </div>
            }
          />
        ) }}
        scroll={{ y: 400 }}
      />
    </div>
  )

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Button type="primary" icon={<TeamOutlined />} onClick={handleOpenAuth}>
              批量授权
            </Button>
          </Col>
          <Col>
            <Space wrap>
              <Input placeholder="搜索人员/权限" prefix={<SearchOutlined />} value={searchText}
                onChange={(e) => setSearchText(e.target.value)} style={{ width: 200 }} allowClear />
              <Select placeholder="审批状态" value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }} allowClear
                options={[
                  { label: '未提交', value: '未提交' },
                  { label: '审批中', value: '审批中' },
                  { label: '已完成', value: '已完成' },
                  { label: '已撤回', value: '已撤回' },
                ]} />
              <Button type="primary" icon={<SearchOutlined />} onClick={() => message.info('查询功能待接入')}>查询</Button>
              <Button onClick={() => { setSearchText(''); setStatusFilter(undefined) }}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table columns={columns} dataSource={filteredData} rowKey="id"
        scroll={{ x: 1200 }} size="middle"
        pagination={{ total: filteredData.length, pageSize: 10, showTotal: (total) => `共 ${total} 条记录`, showSizeChanger: true, showQuickJumper: true }} />

      {/* 批量授权抽屉 */}
      <Drawer
        title={drawerMode === 'add' ? '新增批量授权' : drawerMode === 'view' ? '查看批量授权' : '修改批量授权'}
        open={authDrawerOpen}
        onClose={() => setAuthDrawerOpen(false)}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAuthDrawerOpen(false)}>{isReadOnly ? '关闭' : '取消'}</Button>
              {!isReadOnly && currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>上一步</Button>
              )}
              {!isReadOnly && currentStep < 1 ? (
                <Button type="primary" onClick={() => {
                  if (selectedPermissions.length === 0) {
                    message.warning('请至少选择一个权限')
                    return
                  }
                  computeAllQualifications()
                  setCurrentStep(1)
                }}>下一步</Button>
              ) : !isReadOnly ? (
                <Button type="primary" onClick={handleSave}>保存</Button>
              ) : null}
            </Space>
          </div>
        }
      >
        {/* 步骤指示器 - 居中显示，间隔5个中文字符 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
            }}
          >
            <span
              onClick={() => isReadOnly && setCurrentStep(0)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                cursor: isReadOnly ? 'pointer' : 'default',
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  fontSize: 13,
                  fontWeight: 600,
                  color: currentStep === 0 ? '#fff' : '#999',
                  background: currentStep === 0 ? '#1677ff' : '#f0f0f0',
                  marginRight: 6,
                }}
              >
                1
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: currentStep === 0 ? '#1677ff' : '#999' }}>
                选择权限
              </span>
            </span>
            <span style={{ margin: '0 2.5em', color: '#d9d9d9' }}>— —</span>
            <span
              onClick={() => isReadOnly && setCurrentStep(1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                cursor: isReadOnly ? 'pointer' : 'default',
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  fontSize: 13,
                  fontWeight: 600,
                  color: currentStep === 1 ? '#fff' : '#999',
                  background: currentStep === 1 ? '#1677ff' : '#f0f0f0',
                  marginLeft: 6,
                  marginRight: 6,
                }}
              >
                2
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: currentStep === 1 ? '#1677ff' : '#999' }}>
                选择人员
              </span>
            </span>
          </div>
        </div>

        <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          {currentStep === 0 ? renderStep1() : renderStep2()}
        </Form>
      </Drawer>

      {/* 人员选择抽屉 */}
      <Drawer
        title="人员列表"
        open={staffPickerOpen}
        onClose={handleCloseStaffPicker}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>共计 {filteredStaffForPicker.length} 条数据</span>
            <Space>
              <Button onClick={handleCloseStaffPicker}>取消</Button>
              <Button type="primary" onClick={handleConfirmStaffPicker}>确定</Button>
            </Space>
          </div>
        }
      >
        {/* 筛选区域 */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500 }}>关键字</span>
            <Input
              placeholder="请输入姓名/工号检索"
              value={pickerSearchText}
              onChange={(e) => { setPickerSearchText(e.target.value); setPickerPage(1) }}
              style={{ width: 140 }}
              allowClear
            />
          </div>
          <Select
            placeholder="请选择所属科室"
            value={pickerDeptFilter || undefined}
            onChange={(val) => { setPickerDeptFilter(val || undefined); setPickerPage(1) }}
            style={{ width: 160 }}
            allowClear
            options={DEPARTMENT_OPTIONS}
          />
          <Button icon={<SearchOutlined />} onClick={() => { setPickerPage(1) }}>搜索</Button>
          <Button onClick={() => { 
            setPickerSearchText(''); 
            setPickerDeptFilter(undefined); 
            setPickerPage(1);
          }}>重置</Button>
        </div>

        {/* 人员表格 */}
        <Table
          columns={pickerColumns}
          dataSource={filteredStaffForPicker}
          rowKey="id"
          size="small"
          scroll={{ x: 1500, y: 500 }}
          pagination={{
            current: pickerPage,
            pageSize: pickerPageSize,
            total: filteredStaffForPicker.length,
            onChange: (page, pageSize) => {
              setPickerPage(page)
              setPickerPageSize(pageSize)
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Drawer>

      {/* 权限选择抽屉 */}
      <Drawer
        title="选择权限"
        open={permissionPickerOpen}
        onClose={handleClosePermissionPicker}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>共计 {filteredPermissionsForPicker.length} 条数据</span>
            <Space>
              <Button onClick={handleClosePermissionPicker}>取消</Button>
              <Button type="primary" onClick={handleConfirmPermissionPicker}>确定</Button>
            </Space>
          </div>
        }
      >
        {/* 筛选区域 */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500 }}>名称</span>
            <Input
              placeholder="请输入名称"
              value={permPickerSearchText}
              onChange={(e) => { setPermPickerSearchText(e.target.value); setPermPickerPage(1) }}
              style={{ width: 280 }}
              allowClear
            />
          </div>
          <Button icon={<SearchOutlined />} onClick={() => { setPermPickerPage(1) }}>搜索</Button>
          <Button onClick={() => { 
            setPermPickerSearchText(''); 
            setPermPickerPage(1);
          }}>重置</Button>
        </div>

        {/* 权限表格 */}
        <Table
          columns={permissionPickerColumns}
          dataSource={filteredPermissionsForPicker}
          rowKey="id"
          size="small"
          scroll={{ x: 800, y: 500 }}
          pagination={{
            current: permPickerPage,
            pageSize: permPickerPageSize,
            total: filteredPermissionsForPicker.length,
            onChange: (page, pageSize) => {
              setPermPickerPage(page)
              setPermPickerPageSize(pageSize)
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Drawer>
    </div>
  )
}

export default BatchAuth
