import React, { useMemo, useState, useEffect } from 'react'
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
  Empty,
  Popover,
  Tooltip,
  Checkbox,
} from 'antd'
import {
  SearchOutlined,
  UndoOutlined,
  UserOutlined,
  PlusOutlined,
  ImportOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { ExtendRecord } from './PermissionExtend'

/** 权限配置选项（与集中授权、个人申请一致） */
const permissionConfigOptions: Record<string, string[]> = {
  '处方权': ['门诊', '住院'],
  '手术目录': ['开单', '主刀', '一助'],
  '手术等级': ['开单', '主刀', '一助'],
  '设备': ['操作', '维修'],
}

interface ApplyRecord {
  id: string
  type: 'single' | 'batch' // 单人回收 / 批量回收
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

/** 模拟权限数据（用于选择） */
const MOCK_PERMISSIONS = [
  { id: 'P001', category: '处方权', permissionName: '普通处方权', config: '普通处方' },
  { id: 'P002', category: '处方权', permissionName: '抗菌药物处方权', config: '抗菌药物处方' },
  { id: 'P003', category: '手术等级', permissionName: '一级手术权限', config: '一级' },
  { id: 'P004', category: '手术等级', permissionName: '二级手术权限', config: '二级' },
  { id: 'P005', category: '手术目录', permissionName: '腹腔镜胆囊切除术', config: '三级 / 限制型' },
  { id: 'P006', category: '临床用血', permissionName: '红细胞输注权限', config: '红细胞 / 2U' },
  { id: 'P007', category: '麻醉等级', permissionName: '一级麻醉权限', config: '一级' },
  { id: 'P008', category: '操作', permissionName: '经皮穿刺活检术', config: '二级 / 限制型' },
  { id: 'P009', category: '报告', permissionName: '检验报告签发权', config: '检验报告 / 签发' },
  { id: 'P010', category: '设备', permissionName: '大型设备操作权', config: '大型设备' },
]

/** 模拟人员数据（含工号 + 拥有的权限列表） */
const MOCK_STAFF = [
  { id: 'S001', name: '张医生', department: '外科', title: '主治医师', employeeNo: 'G20001', gender: '男',
    permissions: ['普通处方权', '抗菌药物处方权', '一级手术权限', '二级手术权限', '腹腔镜胆囊切除术'] },
  { id: 'S002', name: '李医生', department: '内科', title: '副主任医师', employeeNo: 'G20002', gender: '男',
    permissions: ['普通处方权', '抗菌药物处方权', '检验报告签发权'] },
  { id: 'S003', name: '王护士', department: '内科', title: '主管护师', employeeNo: 'G20003', gender: '女',
    permissions: ['普通处方权', '药品调配权限'] },
  { id: 'S004', name: '赵技师', department: '检验科', title: '技师', employeeNo: 'G20004', gender: '男',
    permissions: ['检验报告签发权', '大型设备操作权'] },
  { id: 'S005', name: '陈医生', department: '外科', title: '主任医师', employeeNo: 'G20005', gender: '男',
    permissions: ['普通处方权', '抗菌药物处方权', '一级手术权限', '二级手术权限', '腹腔镜胆囊切除术', '一级麻醉权限'] },
  { id: 'S006', name: '刘医生', department: '急诊科', title: '主治医师', employeeNo: 'G20006', gender: '男',
    permissions: ['普通处方权', '红细胞输注权限'] },
  { id: 'S007', name: '周护士', department: '外科', title: '护士', employeeNo: 'G20007', gender: '女',
    permissions: ['普通处方权'] },
  { id: 'S008', name: '吴医生', department: '内科', title: '住院医师', employeeNo: 'G20008', gender: '男',
    permissions: ['普通处方权', '经皮穿刺活检术'] },
]

interface SelectedPermission {
  id: string
  category: string
  permissionName: string
  config: string
  selectedConfig?: string[]  // 已选配置项（用于只读展示）
}

interface SelectedStaff {
  id: string
  name: string
  department: string
  title: string
}

interface BatchRevokeProps {
  initialData?: ExtendRecord[]
  onInitialDataConsumed?: () => void
}

const BatchRevoke: React.FC<BatchRevokeProps> = ({ initialData, onInitialDataConsumed }) => {
  // ==================== 通用状态 ====================
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  // ==================== 批量回收抽屉 ====================
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [batchForm] = Form.useForm()

  // 抽屉模式：新增 / 查看 / 修改
  const [drawerMode, setDrawerMode] = useState<'add' | 'view' | 'edit'>('add')
  const [editingRecord, setEditingRecord] = useState<ApplyRecord | null>(null)
  const isReadOnly = drawerMode === 'view'

  // 步骤1：权限选择
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [selectedPermissions, setSelectedPermissions] = useState<SelectedPermission[]>([])
  const [permissionSearchText, setPermissionSearchText] = useState('')
  const [permissionSelectOpen, setPermissionSelectOpen] = useState(false)

  // 批量回收 - 权限选择抽屉状态
  const [permissionPickerOpen, setPermissionPickerOpen] = useState(false)
  const [permPickerSelectedIds, setPermPickerSelectedIds] = useState<string[]>([])
  const [permPickerPage, setPermPickerPage] = useState(1)
  const [permPickerPageSize, setPermPickerPageSize] = useState(20)

  // 调整抽屉状态
  const [adjustDrawerOpen, setAdjustDrawerOpen] = useState(false)
  const [currentAdjustStaff, setCurrentAdjustStaff] = useState<SelectedStaff | null>(null)
  const [adjustSelectedPermissionIds, setAdjustSelectedPermissionIds] = useState<string[]>([])

  // 可选权限（根据分类筛选 + 名称搜索）
  const availablePermissions = useMemo(() => {
    return MOCK_PERMISSIONS.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false
      if (permissionSearchText.trim()) {
        const keyword = permissionSearchText.trim().toLowerCase()
        return p.permissionName.toLowerCase().includes(keyword)
      }
      return true
    })
  }, [categoryFilter, permissionSearchText])

  // 添加单个权限
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

  // 步骤2：人员选择
  const [selectedStaffList, setSelectedStaffList] = useState<SelectedStaff[]>([])
  const [staffSearchText, setStaffSearchText] = useState('')
  const [staffSelectOpen, setStaffSelectOpen] = useState(false)

  // 批量回收 - 人员选择抽屉状态
  const [batchStaffPickerOpen, setBatchStaffPickerOpen] = useState(false)
  const [batchPickerSearchText, setBatchPickerSearchText] = useState('')
  const [batchPickerDeptFilter, setBatchPickerDeptFilter] = useState<string | undefined>(undefined)
  const [batchPickerSelectedIds, setBatchPickerSelectedIds] = useState<string[]>([])
  const [batchPickerPage, setBatchPickerPage] = useState(1)
  const [batchPickerPageSize, setBatchPickerPageSize] = useState(20)

  // ==================== 单人回收抽屉 ====================
  const [singleDrawerOpen, setSingleDrawerOpen] = useState(false)
  const [singleForm] = Form.useForm()
  const [singleStep, setSingleStep] = useState(0)
  const [singleDrawerMode, setSingleDrawerMode] = useState<'add' | 'view' | 'edit'>('add')
  const [singleEditingRecord, setSingleEditingRecord] = useState<ApplyRecord | null>(null)
  const singleIsReadOnly = singleDrawerMode === 'view'
  const [singleStaffSearchText, setSingleStaffSearchText] = useState('')
  const [singleStaffSelectOpen, setSingleStaffSelectOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<SelectedStaff | null>(null)
  const [staffPermissions, setStaffPermissions] = useState<SelectedPermission[]>([])
  const [checkedPermIds, setCheckedPermIds] = useState<string[]>([])
  const [singleCategoryFilter, setSingleCategoryFilter] = useState<string | undefined>(undefined)

  // 单人回收 - 人员选择抽屉状态
  const [singleStaffPickerOpen, setSingleStaffPickerOpen] = useState(false)
  const [singlePickerSearchText, setSinglePickerSearchText] = useState('')
  const [singlePickerDeptFilter, setSinglePickerDeptFilter] = useState<string | undefined>(undefined)
  const [singlePickerPage, setSinglePickerPage] = useState(1)
  const [singlePickerPageSize, setSinglePickerPageSize] = useState(20)

  // ==================== 申请记录数据 ====================
  const [data, setData] = useState<ApplyRecord[]>([
    { id: '1', type: 'batch', approvalStatus: '已完成', authPermissions: ['普通处方权', '抗菌药物处方权'], staffName: '张医生等', staffNames: ['张医生', '李医生', '王护士', '赵技师', '陈医生'], staffCount: 5, applicant: '李主任', applicantDept: '医务科', applyDate: '2026-06-01', applyDescription: '离职人员权限回收' },
    { id: '2', type: 'batch', approvalStatus: '审批中', authPermissions: ['二级手术权限', '腹腔镜胆囊切除术'], staffName: '王医生等', staffNames: ['王医生', '赵医生', '刘医生'], staffCount: 3, applicant: '赵主任', applicantDept: '外科', applyDate: '2026-06-05', applyDescription: '手术权限回收' },
    { id: '3', type: 'single', approvalStatus: '未提交', authPermissions: ['红细胞输注权限'], staffName: '刘医生', staffNames: ['刘医生'], staffCount: 1, applicant: '陈科长', applicantDept: '输血科', applyDate: '2026-06-10', applyDescription: '用血权限回收' },
    { id: '4', type: 'single', approvalStatus: '已撤回', authPermissions: ['一级麻醉权限'], staffName: '周医生等', staffNames: ['周医生', '吴医生'], staffCount: 2, applicant: '吴主任', applicantDept: '麻醉科', applyDate: '2026-06-08', applyDescription: '麻醉权限回收' },
  ])

  // ==================== 批量回收 - 人员搜索 ====================
  const staffSearchResults = useMemo(() => {
    if (!staffSearchText.trim()) return []
    const keyword = staffSearchText.trim().toLowerCase()
    return MOCK_STAFF.filter(
      (s) => s.name.toLowerCase().includes(keyword) || s.employeeNo.toLowerCase().includes(keyword)
    ).filter((s) => !selectedStaffList.some((ss) => ss.id === s.id))
  }, [staffSearchText, selectedStaffList])

  // ==================== 单人回收 - 人员搜索 ====================
  const singleStaffSearchResults = useMemo(() => {
    if (!singleStaffSearchText.trim()) return []
    const keyword = singleStaffSearchText.trim().toLowerCase()
    return MOCK_STAFF.filter(
      (s) => s.name.toLowerCase().includes(keyword) || s.employeeNo.toLowerCase().includes(keyword)
    )
  }, [singleStaffSearchText])

  // 单人回收 - 根据分类筛选该人员权限
  const filteredStaffPermissions = staffPermissions.filter((p) => {
    if (singleCategoryFilter && p.category !== singleCategoryFilter) return false
    return true
  })

  // ==================== 前端过滤 ====================
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

  // ==================== 外层表格列 ====================
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
      title: '回收类型', dataIndex: 'type', key: 'type', width: 90, align: 'center',
      render: (type: string) => <Tag color={type === 'single' ? 'orange' : 'red'}>{type === 'single' ? '单人' : '批量'}</Tag>,
    },
    {
      title: '回收权限', dataIndex: 'authPermissions', key: 'authPermissions', width: 200,
      render: (perms: string[]) => (
        <Space size={[4, 4]} wrap>
          {perms.map((p) => <Tag key={p} color="red">{p}</Tag>)}
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
    { title: '回收人数', dataIndex: 'staffCount', key: 'staffCount', width: 90, align: 'center' },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 90 },
    { title: '申请部门', dataIndex: 'applicantDept', key: 'applicantDept', width: 100 },
    { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate', width: 110 },
    { title: '申请说明', dataIndex: 'applyDescription', key: 'applyDescription', width: 150, ellipsis: true },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: (_: unknown, record: ApplyRecord) => {
        const openViewOrEdit = (mode: 'view' | 'edit') => {
          if (record.type === 'single') {
            handleOpenSingleDrawer(record, mode)
          } else {
            handleOpenDrawer(record, mode)
          }
        }
        return (
          <Space size="small">
            {record.approvalStatus === '未提交' && (
              <>
                <Button type="link" size="small" onClick={() => message.info('提交审批')}>提交</Button>
                <Button type="link" size="small" onClick={() => openViewOrEdit('edit')}>修改</Button>
                <Button type="link" size="small" danger onClick={() => { setData(data.filter((r) => r.id !== record.id)); message.success('删除成功') }}>删除</Button>
              </>
            )}
            {record.approvalStatus === '审批中' && (
              <Button type="link" size="small" onClick={() => message.info('撤回申请')}>撤回</Button>
            )}
            {record.approvalStatus === '已完成' && (
              <Button type="link" size="small" onClick={() => openViewOrEdit('view')}>查看</Button>
            )}
            {record.approvalStatus === '已撤回' && (
              <>
                <Button type="link" size="small" onClick={() => openViewOrEdit('edit')}>修改</Button>
                <Button type="link" size="small" danger onClick={() => { setData(data.filter((r) => r.id !== record.id)); message.success('删除成功') }}>删除</Button>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  // ==================== 从权限查询跳转过来时，自动预填并打开抽屉 ====================
  useEffect(() => {
    if (!initialData || initialData.length === 0) return

    // 1. 预填权限：从 initialData 提取权限名称，在 MOCK_PERMISSIONS 里查找
    const targetPermissionNames = new Set(initialData.map((r) => r.permissionName))
    const matchedPermissions: SelectedPermission[] = []
    const seenIds = new Set<string>()

    targetPermissionNames.forEach((name) => {
      const found = MOCK_PERMISSIONS.find((p) => p.permissionName === name)
      if (found && !seenIds.has(found.id)) {
        seenIds.add(found.id)
        matchedPermissions.push({
          id: found.id,
          category: found.category,
          permissionName: found.permissionName,
          config: found.config,
        })
      }
    })
    setSelectedPermissions(matchedPermissions)

    // 2. 预填人员：从 initialData 提取人员（去重）
    const staffMap = new Map<string, typeof MOCK_STAFF[number]>()
    initialData.forEach((r) => {
      const found = MOCK_STAFF.find(
        (s) =>
          s.employeeNo === r.employeeId ||
          (s.name === r.name && s.department === r.department)
      )
      if (found && !staffMap.has(found.id)) {
        staffMap.set(found.id, found)
      }
    })

    const matchedStaff: SelectedStaff[] = Array.from(staffMap.values()).map((s) => ({
      id: s.id,
      name: s.name,
      department: s.department,
      title: s.title,
    }))
    setSelectedStaffList(matchedStaff)

    // 3. 打开抽屉，跳到步骤1（人员确认步骤）
    setDrawerMode('add')
    setCurrentStep(1)
    batchForm.resetFields()
    setBatchDrawerOpen(true)

    // 4. 通知父组件清空 initialData，避免重复触发
    onInitialDataConsumed?.()
  }, [initialData])

  // ==================== 批量回收 - 打开/操作 ====================
  const handleOpenBatch = () => {
    setDrawerMode('add')
    setEditingRecord(null)
    setCurrentStep(0)
    setCategoryFilter('处方权')
    setSelectedPermissions([])
    setSelectedStaffList([])
    setStaffSearchText('')
    setStaffSelectOpen(false)
    batchForm.resetFields()
    setBatchDrawerOpen(true)
  }

  const handleOpenDrawer = (record: ApplyRecord, mode: 'view' | 'edit') => {
    setDrawerMode(mode)
    setEditingRecord(record)
    setCurrentStep(0)
    setCategoryFilter(undefined)
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
    batchForm.setFieldsValue({ description: record.applyDescription })
    setStaffSearchText('')
    setStaffSelectOpen(false)
    setBatchDrawerOpen(true)
  }

  const handleBatchSave = async () => {
    try {
      await batchForm.validateFields()
      if (selectedPermissions.length === 0) {
        message.warning('请至少选择一个权限')
        return
      }
      if (selectedStaffList.length === 0) {
        message.warning('请至少选择一个人员')
        return
      }
      message.success(`成功为 ${selectedStaffList.length} 名人员回收 ${selectedPermissions.length} 项权限`)
      setBatchDrawerOpen(false)
    } catch { /* 表单验证失败 */ }
  }

  // 步骤1：权限选择表格列（与批量授权一致）
  const permissionColumns: ColumnsType<SelectedPermission> = [
    {
      title: '序号', key: 'index', width: 60, align: 'center',
      render: (_: unknown, __: SelectedPermission, index: number) => index + 1,
    },
    { title: '权限分类', dataIndex: 'category', key: 'category', width: 100, render: (cat: string) => <Tag>{cat}</Tag> },
    { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 160 },
    ...(!isReadOnly ? [{
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, record: SelectedPermission) => (
        <Button type="link" size="small" danger
          onClick={() => setSelectedPermissions(selectedPermissions.filter((p) => p.id !== record.id))}>
          删除
        </Button>
      ),
    }] : []),
  ]

  // 步骤2：人员选择表格列
  const staffColumns: ColumnsType<SelectedStaff> = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '科室', dataIndex: 'department', key: 'department', width: 100,
      render: (dept: string) => <Tag color="blue">{dept}</Tag> },
    {
      title: '回收数量', key: 'matchCount', width: 120,
      render: (_: unknown, record: SelectedStaff) => {
        const staff = MOCK_STAFF.find((s) => s.id === record.id)
        if (!staff) return '0'
        const matchedPermissions = selectedPermissions.filter((p) => 
          staff.permissions.includes(p.permissionName)
        )
        const tooltipContent = matchedPermissions.length > 0 ? (
          <div style={{ maxWidth: 300 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>回收权限详情</div>
            {matchedPermissions.map((p, index) => (
              <div key={p.id} style={{ marginBottom: 4, fontSize: 12 }}>
                <span style={{ marginRight: 8 }}>{index + 1}.</span>
                <Tag color="blue" style={{ marginRight: 8 }}>{p.category}</Tag>
                <span>{p.permissionName}</span>
              </div>
            ))}
          </div>
        ) : null
        return (
          <Tooltip 
            title={tooltipContent}
            styles={{
              body: {
                backgroundColor: '#fff',
                color: '#000',
                padding: '8px 12px',
              },
              // @ts-ignore
              arrow: {
                color: '#fff',
              },
            }}
          >
            <span style={{ cursor: 'pointer', color: '#1890ff', fontWeight: 600 }}>
              {matchedPermissions.length}
            </span>
          </Tooltip>
        )
      },
    },
    ...(!isReadOnly ? [{
      title: '调整', key: 'adjust', width: 80,
      render: (_: unknown, record: SelectedStaff) => (
        <Button type="link" size="small" onClick={() => handleOpenAdjustDrawer(record)}>
          <PlusOutlined />
        </Button>
      ),
    }] : []),
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

  // 步骤1内容（选择权限，现为第2步）
  const renderBatchStep1 = () => (
    <div>
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
      <div style={{ borderLeft: '3px solid #ff4d4f', paddingLeft: 8, marginBottom: 12, fontWeight: 600 }}>
        已选择权限 {selectedPermissions.length > 0 && <span style={{ color: '#1677ff', fontWeight: 'normal' }}>({selectedPermissions.length} 项)</span>}
      </div>

      <Table
        columns={permissionColumns}
        dataSource={selectedPermissions}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: 200 }}
        locale={{ emptyText: '暂未选择权限，请点击"选择权限"按钮添加' }}
        style={{ marginBottom: 16 }}
      />
    </div>
  )

  // 添加单个人员（批量回收步骤2）
  const handleAddStaff = (staff: typeof MOCK_STAFF[number]) => {
    setSelectedStaffList([...selectedStaffList, {
      id: staff.id,
      name: staff.name,
      department: staff.department,
      title: staff.title,
    }])
    setStaffSearchText('')
    setStaffSelectOpen(false)
  }

  // 批量回收 - 人员选择抽屉相关函数
  const handleOpenBatchStaffPicker = () => {
    const existingIds = new Set(selectedStaffList.map((s) => s.id))
    setBatchPickerSelectedIds([])
    setBatchPickerSearchText('')
    setBatchPickerDeptFilter(undefined)
    setBatchPickerPage(1)
    setBatchStaffPickerOpen(true)
  }

  const handleCloseBatchStaffPicker = () => {
    setBatchStaffPickerOpen(false)
  }

  const handleConfirmBatchStaffPicker = () => {
    if (batchPickerSelectedIds.length === 0) {
      message.warning('请至少选择一名人员')
      return
    }
    const existingIds = new Set(selectedStaffList.map((s) => s.id))
    const newStaff = batchPickerSelectedIds
      .filter((id) => !existingIds.has(id))
      .map((id) => {
        const staff = MOCK_STAFF.find((s) => s.id === id)
        if (!staff) return null
        return {
          id: staff.id,
          name: staff.name,
          department: staff.department,
          title: staff.title,
        }
      })
      .filter((s): s is SelectedStaff => s !== null)
    
    setSelectedStaffList([...selectedStaffList, ...newStaff])
    message.success(`已选择 ${newStaff.length} 名人员`)
    setBatchStaffPickerOpen(false)
    setBatchPickerSelectedIds([])
  }

  // 批量回收 - 人员选择抽屉过滤后的数据
  const filteredBatchStaff = useMemo(() => {
    return MOCK_STAFF.filter((s) => {
      if (batchPickerSearchText.trim()) {
        const kw = batchPickerSearchText.trim().toLowerCase()
        return s.name.toLowerCase().includes(kw) || s.employeeNo.toLowerCase().includes(kw)
      }
      if (batchPickerDeptFilter && s.department !== batchPickerDeptFilter) return false
      return true
    })
  }, [batchPickerSearchText, batchPickerDeptFilter])

  // 批量回收 - 人员选择抽屉表格列
  const batchStaffPickerColumns: ColumnsType<typeof MOCK_STAFF[number]> = [
    {
      title: '',
      key: 'select',
      width: 50,
      render: (_: unknown, record: typeof MOCK_STAFF[number]) => (
        <Checkbox
          checked={batchPickerSelectedIds.includes(record.id)}
          onChange={(checked) => {
            if (checked) {
              setBatchPickerSelectedIds([...batchPickerSelectedIds, record.id])
            } else {
              setBatchPickerSelectedIds(batchPickerSelectedIds.filter((id) => id !== record.id))
            }
          }}
        />
      ),
    },
    { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
    { title: '所属科室', dataIndex: 'department', key: 'department', width: 100 },
    { title: '职称', dataIndex: 'title', key: 'title', width: 100 },
  ]

  // 批量回收 - 权限选择抽屉相关函数
  const handleOpenPermissionPicker = () => {
    setPermissionSearchText('')
    setPermPickerPage(1)
    setPermPickerSelectedIds(selectedPermissions.map((p) => p.id))
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
    const newPermissions = permPickerSelectedIds.map((id) => {
      const permission = MOCK_PERMISSIONS.find((p) => p.id === id)
      if (!permission) return null
      return {
        id: permission.id,
        category: permission.category,
        permissionName: permission.permissionName,
        config: permission.config,
      }
    }).filter((p): p is SelectedPermission => p !== null)
    
    const existingIds = new Set(selectedPermissions.map((p) => p.id))
    const filteredNew = newPermissions.filter((p) => !existingIds.has(p.id))
    
    setSelectedPermissions([...selectedPermissions, ...filteredNew])
    message.success(`已添加 ${filteredNew.length} 项权限`)
    setPermissionPickerOpen(false)
    setPermPickerSelectedIds([])
  }

  // 调整抽屉相关函数
  const handleOpenAdjustDrawer = (staff: SelectedStaff) => {
    setCurrentAdjustStaff(staff)
    setAdjustSelectedPermissionIds(selectedPermissions.map((p) => p.id))
    setAdjustDrawerOpen(true)
  }

  const handleCloseAdjustDrawer = () => {
    setAdjustDrawerOpen(false)
    setCurrentAdjustStaff(null)
    setAdjustSelectedPermissionIds([])
  }

  const handleConfirmAdjustDrawer = () => {
    if (adjustSelectedPermissionIds.length === 0) {
      message.warning('请至少选择一项权限')
      return
    }
    const newPermissions = adjustSelectedPermissionIds.map((id) => {
      const permission = MOCK_PERMISSIONS.find((p) => p.id === id)
      if (!permission) return null
      return {
        id: permission.id,
        category: permission.category,
        permissionName: permission.permissionName,
        config: permission.config,
      }
    }).filter((p): p is SelectedPermission => p !== null)
    
    const existingIds = new Set(selectedPermissions.map((p) => p.id))
    const filteredNew = newPermissions.filter((p) => !existingIds.has(p.id))
    
    setSelectedPermissions([...selectedPermissions, ...filteredNew])
    message.success(`已添加 ${filteredNew.length} 项权限`)
    handleCloseAdjustDrawer()
  }

  // 批量回收 - 权限选择抽屉表格列
  const permissionPickerColumns: ColumnsType<typeof MOCK_PERMISSIONS[number]> = [
    {
      title: '',
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

  // 步骤2内容（选择人员，现为第1步）
  const renderBatchStep2 = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          人员选择 <span style={{ color: '#ff4d4f', fontWeight: 400, fontSize: 13 }}>已选择{selectedStaffList.length}人</span>
        </div>
        {!isReadOnly && (
          <Space size={12}>
            <Button icon={<ImportOutlined />}
              onClick={() => message.info('导入功能待接入')}>
              导入
            </Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={handleOpenBatchStaffPicker}>
              手动选择人员
            </Button>
          </Space>
        )}
      </div>

      <Table
        columns={staffColumns}
        dataSource={selectedStaffList}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: (
          <Empty
            description={
              <div>
                <div>暂无选择人员</div>
                <div style={{ color: '#999', fontSize: 12 }}>请通过上方筛选添加需要回收权限的人员</div>
              </div>
            }
          />
        ) }}
        scroll={{ y: 400 }}
      />

      <div style={{ marginTop: 24 }}>
        <div style={{ borderLeft: '3px solid #ff4d4f', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
          回收说明
        </div>
        <Form.Item name="description" noStyle>
          <Input.TextArea
            rows={4}
            disabled={isReadOnly}
            placeholder="请填写回收原因及说明"
          />
        </Form.Item>
      </div>

      {!isReadOnly && (
        <div style={{ marginTop: 16 }}>
          <div style={{ borderLeft: '3px solid #ff4d4f', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
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

  // ==================== 单人回收 - 操作 ====================
  const handleOpenSingle = () => {
    setSingleDrawerMode('add')
    setSingleEditingRecord(null)
    setSingleStep(0)
    setSelectedStaff(null)
    setStaffPermissions([])
    setCheckedPermIds([])
    setSingleStaffSearchText('')
    setSingleCategoryFilter(undefined)
    singleForm.resetFields()
    setSingleDrawerOpen(true)
  }

  const handleOpenSingleDrawer = (record: ApplyRecord, mode: 'view' | 'edit') => {
    setSingleDrawerMode(mode)
    setSingleEditingRecord(record)
    setSingleStep(0)
    setSingleCategoryFilter(undefined)
    // 回填人员（取第一条记录的第一个人员）
    const firstStaffName = record.staffNames[0]
    const foundStaff = MOCK_STAFF.find((s) => s.name === firstStaffName)
    if (foundStaff) {
      setSelectedStaff({
        id: foundStaff.id,
        name: foundStaff.name,
        department: foundStaff.department,
        title: foundStaff.title,
      })
      // 加载该人员权限
      const perms = foundStaff.permissions.map((name, idx) => {
        const found = MOCK_PERMISSIONS.find((p) => p.permissionName === name)
        return {
          id: found?.id || `staff-${idx}`,
          category: found?.category || '',
          permissionName: name,
          config: found?.config || '',
        }
      })
      setStaffPermissions(perms)
      // 回填勾选的权限
      const checkedIds = record.authPermissions
        .map((name) => perms.find((p) => p.permissionName === name)?.id)
        .filter((id): id is string => !!id)
      setCheckedPermIds(checkedIds)
    } else {
      setSelectedStaff(null)
      setStaffPermissions([])
      setCheckedPermIds([])
    }
    singleForm.setFieldsValue({ description: record.applyDescription })
    setSingleStaffSearchText('')
    setSingleDrawerOpen(true)
  }

  /** 选择人员后，加载该人员全部权限 */
  const handleSelectStaff = (staff: typeof MOCK_STAFF[number]) => {
    setSelectedStaff({
      id: staff.id,
      name: staff.name,
      department: staff.department,
      title: staff.title,
    })
    // 将该人员的权限列表转换为 SelectedPermission
    const perms = staff.permissions.map((name, idx) => {
      const found = MOCK_PERMISSIONS.find((p) => p.permissionName === name)
      return {
        id: found?.id || `staff-${idx}`,
        category: found?.category || '',
        permissionName: name,
        config: found?.config || '',
      }
    })
    setStaffPermissions(perms)
    setCheckedPermIds([]) // 默认全不选
    setSingleStaffSearchText('')
    setSingleStaffSelectOpen(false)
  }

  // 单人回收 - 人员选择抽屉相关函数
  const handleOpenSingleStaffPicker = () => {
    setSinglePickerSearchText('')
    setSinglePickerDeptFilter(undefined)
    setSinglePickerPage(1)
    setSingleStaffPickerOpen(true)
  }

  const handleCloseSingleStaffPicker = () => {
    setSingleStaffPickerOpen(false)
  }

  const handleConfirmSingleStaffPicker = (staff: typeof MOCK_STAFF[number]) => {
    setSelectedStaff({
      id: staff.id,
      name: staff.name,
      department: staff.department,
      title: staff.title,
    })
    // 将该人员的权限列表转换为 SelectedPermission
    const perms = staff.permissions.map((name, idx) => {
      const found = MOCK_PERMISSIONS.find((p) => p.permissionName === name)
      const cat = found?.category || ''
      const options = permissionConfigOptions[cat] || []
      return {
        id: found?.id || `staff-${idx}`,
        category: cat,
        permissionName: name,
        config: found?.config || '',
        selectedConfig: options.length > 0 ? [...options] : undefined,
      }
    })
    setStaffPermissions(perms)
    setCheckedPermIds([])
    setSingleStaffPickerOpen(false)
    message.success(`已选择人员：${staff.name}`)
  }

  // 单人回收 - 人员选择抽屉过滤后的数据
  const filteredSingleStaff = useMemo(() => {
    return MOCK_STAFF.filter((s) => {
      if (singlePickerSearchText.trim()) {
        const kw = singlePickerSearchText.trim().toLowerCase()
        return s.name.toLowerCase().includes(kw) || s.employeeNo.toLowerCase().includes(kw)
      }
      if (singlePickerDeptFilter && s.department !== singlePickerDeptFilter) return false
      return true
    })
  }, [singlePickerSearchText, singlePickerDeptFilter])

  // 单人回收 - 人员选择抽屉表格列
  const singleStaffPickerColumns: ColumnsType<typeof MOCK_STAFF[number]> = [
    {
      title: '选择', key: 'action', width: 60,
      render: (_: unknown, record: typeof MOCK_STAFF[number]) => (
        <Button type="link" size="small" onClick={() => handleConfirmSingleStaffPicker(record)}>选择</Button>
      ),
    },
    { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
    { title: '所属科室', dataIndex: 'department', key: 'department', width: 100 },
    { title: '职称', dataIndex: 'title', key: 'title', width: 100 },
  ]

  // 单人回收步骤1：选择人员 + 回收说明 + 附件（与批量回收布局一致，无导入按钮）
  const renderSingleStep1 = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          人员选择
        </div>
        {!singleIsReadOnly && (
          <Button type="primary" icon={<SearchOutlined />} onClick={handleOpenSingleStaffPicker}>
            选择人员
          </Button>
        )}
      </div>

      <Table
        columns={[
          { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
          { title: '科室', dataIndex: 'department', key: 'department', width: 100,
            render: (dept: string) => <Tag color="blue">{dept}</Tag> },
          { title: '职称', dataIndex: 'title', key: 'title', width: 120 },
          ...(!singleIsReadOnly ? [{
            title: '操作', key: 'action', width: 80,
            render: () => (
              <Button type="link" size="small" danger
                onClick={() => { setSelectedStaff(null); setStaffPermissions([]); setCheckedPermIds([]) }}>
                删除
              </Button>
            ),
          }] : []),
        ]}
        dataSource={selectedStaff ? [selectedStaff] : []}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: (
          <Empty
            description={
              <div>
                <div>暂无选择人员</div>
                <div style={{ color: '#999', fontSize: 12 }}>请通过上方筛选添加需要回收权限的人员</div>
              </div>
            }
          />
        ) }}
        scroll={{ y: 400 }}
      />

      {/* 回收说明 */}
      <div style={{ marginTop: 24 }}>
        <div style={{ borderLeft: '3px solid #ff4d4f', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
          回收说明
        </div>
        <Form.Item name="description" noStyle>
          <Input.TextArea
            rows={3}
            disabled={singleIsReadOnly}
            placeholder="请填写回收原因及说明"
          />
        </Form.Item>
      </div>

      {/* 附件 */}
      {!singleIsReadOnly && (
        <div style={{ marginTop: 16 }}>
          <div style={{ borderLeft: '3px solid #ff4d4f', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
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

  // 单人回收步骤2：权限列表
  const renderSingleStep2 = () => (
    <div>
      {/* 已选人员信息 */}
      {selectedStaff && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0',
          marginBottom: 16,
        }}>
          <UserOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedStaff.name}</span>
          <Tag color="blue">{selectedStaff.department}</Tag>
          <span style={{ color: '#999', fontSize: 12 }}>{selectedStaff.title}</span>
        </div>
      )}

      {/* 权限列表 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            该人员权限 <span style={{ color: '#ff4d4f', fontWeight: 400, fontSize: 13 }}>已选{checkedPermIds.length}项</span>
          </div>
          <Space size={8}>
            <Select
              placeholder="权限分类筛选"
              value={singleCategoryFilter}
              onChange={setSingleCategoryFilter}
              style={{ width: 140 }}
              allowClear
              options={CATEGORY_OPTIONS}
            />
            {!singleIsReadOnly && staffPermissions.length > 0 && (
              <>
                <Button type="link" size="small" onClick={() => setCheckedPermIds(staffPermissions.map((p) => p.id))}>全选</Button>
                <Button type="link" size="small" onClick={() => setCheckedPermIds([])}>清空</Button>
              </>
            )}
          </Space>
        </div>

        <Table
          columns={[
            {
              title: '选择', key: 'check', width: 60,
              render: (_: unknown, record: SelectedPermission) => (
                <Checkbox
                  checked={checkedPermIds.includes(record.id)}
                  disabled={singleIsReadOnly}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCheckedPermIds([...checkedPermIds, record.id])
                    } else {
                      setCheckedPermIds(checkedPermIds.filter((id) => id !== record.id))
                    }
                  }}
                />
              ),
            },
            { title: '权限分类', dataIndex: 'category', key: 'category', width: 120,
              render: (cat: string) => <Tag>{cat}</Tag> },
            { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 180 },
            {
              title: '权限配置', key: 'config', width: 160,
              render: (_: unknown, record: SelectedPermission) => {
                const options = permissionConfigOptions[record.category]
                if (!options) {
                  return <span style={{ color: '#999' }}>{record.config || '--'}</span>
                }
                const selected = (record as any).selectedConfig || []
                return (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {options.filter((_: any, idx: number) => idx % 2 === 0).map((opt: string) => (
                        <Tag key={opt} color={selected.includes(opt) ? 'blue' : 'default'} style={{ fontSize: 12, minWidth: 48, textAlign: 'center' }}>
                          {opt}
                        </Tag>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {options.filter((_: any, idx: number) => idx % 2 === 1).map((opt: string) => (
                        <Tag key={opt} color={selected.includes(opt) ? 'blue' : 'default'} style={{ fontSize: 12, minWidth: 48, textAlign: 'center' }}>
                          {opt}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )
              },
            },
          ]}
          dataSource={filteredStaffPermissions}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: <Empty description="该人员暂无权限" /> }}
          scroll={{ y: 320 }}
        />
      </div>
    </div>
  )

  const handleSingleSave = async () => {
    try {
      await singleForm.validateFields()
      if (!selectedStaff) {
        message.warning('请先选择人员')
        return
      }
      if (checkedPermIds.length === 0) {
        message.warning('请至少选择一个需要回收的权限')
        return
      }
      const permNames = staffPermissions
        .filter((p) => checkedPermIds.includes(p.id))
        .map((p) => p.permissionName)
      message.success(`成功回收 ${selectedStaff.name} 的 ${permNames.length} 项权限`)
      setSingleDrawerOpen(false)
    } catch { /* 表单验证失败 */ }
  }

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size={12}>
              <Button icon={<UserOutlined />} onClick={handleOpenSingle}>
                单人回收
              </Button>
              <Button type="primary" icon={<UndoOutlined />} onClick={handleOpenBatch}>
                批量回收
              </Button>
            </Space>
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

      {/* ==================== 批量回收抽屉 ==================== */}
      <Drawer
        title={drawerMode === 'add' ? '新增批量回收' : drawerMode === 'view' ? '查看批量回收' : '修改批量回收'}
        open={batchDrawerOpen}
        onClose={() => setBatchDrawerOpen(false)}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setBatchDrawerOpen(false)}>{isReadOnly ? '关闭' : '取消'}</Button>
              {!isReadOnly && currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>上一步</Button>
              )}
              {!isReadOnly && currentStep < 1 ? (
                <Button danger type="primary" onClick={() => {
                  if (selectedPermissions.length === 0) {
                    message.warning('请至少选择一个权限')
                    return
                  }
                  setCurrentStep(1)
                }}>下一步</Button>
              ) : !isReadOnly ? (
                <>
                  <Button onClick={handleBatchSave}>保存</Button>
                  <Button type="primary" onClick={handleBatchSave}>提交</Button>
                </>
              ) : null}
            </Space>
          </div>
        }
      >
        {/* 步骤指示器 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span
              onClick={() => isReadOnly && setCurrentStep(0)}
              style={{ display: 'inline-flex', alignItems: 'center', cursor: isReadOnly ? 'pointer' : 'default', userSelect: 'none' }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, borderRadius: '50%', fontSize: 13, fontWeight: 600,
                color: currentStep === 0 ? '#fff' : '#999', background: currentStep === 0 ? '#ff4d4f' : '#f0f0f0', marginRight: 6,
              }}>1</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: currentStep === 0 ? '#ff4d4f' : '#999' }}>选择权限</span>
            </span>
            <span style={{ margin: '0 2.5em', color: '#d9d9d9' }}>— —</span>
            <span
              onClick={() => isReadOnly && setCurrentStep(1)}
              style={{ display: 'inline-flex', alignItems: 'center', cursor: isReadOnly ? 'pointer' : 'default', userSelect: 'none' }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, borderRadius: '50%', fontSize: 13, fontWeight: 600,
                color: currentStep === 1 ? '#fff' : '#999', background: currentStep === 1 ? '#ff4d4f' : '#f0f0f0', marginLeft: 6, marginRight: 6,
              }}>2</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: currentStep === 1 ? '#ff4d4f' : '#999' }}>选择人员</span>
            </span>
          </div>
        </div>

        <Form form={batchForm} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          {currentStep === 0 ? renderBatchStep1() : renderBatchStep2()}
        </Form>
      </Drawer>

      {/* ==================== 单人回收抽屉 ==================== */}
      <Drawer
        title={singleDrawerMode === 'add' ? '单人回收' : singleDrawerMode === 'view' ? '查看单人回收' : '修改单人回收'}
        open={singleDrawerOpen}
        onClose={() => setSingleDrawerOpen(false)}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSingleDrawerOpen(false)}>{singleIsReadOnly ? '关闭' : '取消'}</Button>
              {!singleIsReadOnly && (
                <>
                  <Button onClick={handleSingleSave}>保存</Button>
                  <Button type="primary" onClick={handleSingleSave}>提交</Button>
                </>
              )}
            </Space>
          </div>
        }
      >
        <Form form={singleForm} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <div>
            {/* 人员选择 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                人员选择
              </div>
              {!singleIsReadOnly && (
                <Button type="primary" icon={<SearchOutlined />} onClick={handleOpenSingleStaffPicker}>
                  选择人员
                </Button>
              )}
            </div>

            <Table
              columns={[
                { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
                { title: '科室', dataIndex: 'department', key: 'department', width: 100,
                  render: (dept: string) => <Tag color="blue">{dept}</Tag> },
                { title: '职称', dataIndex: 'title', key: 'title', width: 120 },
                ...(!singleIsReadOnly ? [{
                  title: '操作', key: 'action', width: 80,
                  render: () => (
                    <Button type="link" size="small" danger
                      onClick={() => { setSelectedStaff(null); setStaffPermissions([]); setCheckedPermIds([]) }}>
                      删除
                    </Button>
                  ),
                }] : []),
              ]}
              dataSource={selectedStaff ? [selectedStaff] : []}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: (
                <Empty
                  description={
                    <div>
                      <div>暂无选择人员</div>
                      <div style={{ color: '#999', fontSize: 12 }}>请通过上方筛选添加需要回收权限的人员</div>
                    </div>
                  }
                />
              ) }}
              scroll={{ y: 150 }}
              style={{ marginBottom: 24 }}
            />

            {selectedStaff && (
              <>
                {/* 权限列表 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      该人员权限 <span style={{ color: '#ff4d4f', fontWeight: 400, fontSize: 13 }}>已选{checkedPermIds.length}项</span>
                    </div>
                    <Space size={8}>
                      <Select
                        placeholder="权限分类筛选"
                        value={singleCategoryFilter}
                        onChange={setSingleCategoryFilter}
                        style={{ width: 140 }}
                        allowClear
                        options={CATEGORY_OPTIONS}
                      />
                      {!singleIsReadOnly && staffPermissions.length > 0 && (
                        <>
                          <Button type="link" size="small" onClick={() => setCheckedPermIds(staffPermissions.map((p) => p.id))}>全选</Button>
                          <Button type="link" size="small" onClick={() => setCheckedPermIds([])}>清空</Button>
                        </>
                      )}
                    </Space>
                  </div>

                  <Table
                    columns={[
                      {
                        title: '选择', key: 'check', width: 60,
                        render: (_: unknown, record: SelectedPermission) => (
                          <Checkbox
                            checked={checkedPermIds.includes(record.id)}
                            disabled={singleIsReadOnly}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCheckedPermIds([...checkedPermIds, record.id])
                              } else {
                                setCheckedPermIds(checkedPermIds.filter((id) => id !== record.id))
                              }
                            }}
                          />
                        ),
                      },
                      { title: '权限分类', dataIndex: 'category', key: 'category', width: 120,
                        render: (cat: string) => <Tag>{cat}</Tag> },
                      { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 180 },
                      {
                        title: '权限配置', key: 'config', width: 160,
                        render: (_: unknown, record: SelectedPermission) => {
                          const options = permissionConfigOptions[record.category]
                          if (!options) {
                            return <span style={{ color: '#999' }}>{record.config || '--'}</span>
                          }
                          const selected = (record as any).selectedConfig || []
                          return (
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {options.filter((_: any, idx: number) => idx % 2 === 0).map((opt: string) => (
                                  <Tag key={opt} color={selected.includes(opt) ? 'blue' : 'default'} style={{ fontSize: 12, minWidth: 48, textAlign: 'center' }}>
                                    {opt}
                                  </Tag>
                                ))}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {options.filter((_: any, idx: number) => idx % 2 === 1).map((opt: string) => (
                                  <Tag key={opt} color={selected.includes(opt) ? 'blue' : 'default'} style={{ fontSize: 12, minWidth: 48, textAlign: 'center' }}>
                                    {opt}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          )
                        },
                      }
                    ]}
                    dataSource={filteredStaffPermissions}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    locale={{ emptyText: <Empty description="该人员暂无权限" /> }}
                    scroll={{ y: 280 }}
                    style={{ marginBottom: 24 }}
                  />
                </div>

                {/* 回收说明 */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ borderLeft: '3px solid #ff4d4f', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
                    回收说明
                  </div>
                  <Form.Item name="description" noStyle>
                    <Input.TextArea
                      rows={3}
                      disabled={singleIsReadOnly}
                      placeholder="请填写回收原因及说明"
                    />
                  </Form.Item>
                </div>

                {/* 附件 */}
                {!singleIsReadOnly && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ borderLeft: '3px solid #ff4d4f', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
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
              </>
            )}
          </div>
        </Form>
      </Drawer>

      {/* 单人回收 - 人员选择抽屉 */}
      <Drawer
        title="人员列表"
        open={singleStaffPickerOpen}
        onClose={handleCloseSingleStaffPicker}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>共计 {filteredSingleStaff.length} 条数据</span>
            <Space>
              <Button onClick={handleCloseSingleStaffPicker}>取消</Button>
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
              value={singlePickerSearchText}
              onChange={(e) => { setSinglePickerSearchText(e.target.value); setSinglePickerPage(1) }}
              style={{ width: 140 }}
              allowClear
            />
          </div>
          <Select
            placeholder="请选择所属科室"
            value={singlePickerDeptFilter || undefined}
            onChange={(val) => { setSinglePickerDeptFilter(val || undefined); setSinglePickerPage(1) }}
            style={{ width: 160 }}
            allowClear
            options={DEPARTMENT_OPTIONS}
          />
          <Button icon={<SearchOutlined />} onClick={() => { setSinglePickerPage(1) }}>搜索</Button>
          <Button onClick={() => { 
            setSinglePickerSearchText(''); 
            setSinglePickerDeptFilter(undefined); 
            setSinglePickerPage(1);
          }}>重置</Button>
        </div>

        {/* 人员表格 */}
        <Table
          columns={singleStaffPickerColumns}
          dataSource={filteredSingleStaff}
          rowKey="id"
          size="small"
          scroll={{ x: 600, y: 500 }}
          pagination={{
            current: singlePickerPage,
            pageSize: singlePickerPageSize,
            total: filteredSingleStaff.length,
            onChange: (page, pageSize) => {
              setSinglePickerPage(page)
              setSinglePickerPageSize(pageSize)
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Drawer>

      {/* 批量回收 - 权限选择抽屉 */}
      <Drawer
        title="选择权限"
        open={permissionPickerOpen}
        onClose={handleClosePermissionPicker}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>共计 {availablePermissions.length} 条数据</span>
            <Space>
              <Button onClick={handleClosePermissionPicker}>取消</Button>
              <Button type="primary" onClick={handleConfirmPermissionPicker}>确定</Button>
            </Space>
          </div>
        }
      >
        {/* 筛选区域 */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500 }}>名称</span>
            <Input
              placeholder="请输入名称"
              value={permissionSearchText}
              onChange={(e) => { setPermissionSearchText(e.target.value); setPermPickerPage(1) }}
              style={{ width: 140 }}
              allowClear
            />
          </div>
          <Button icon={<SearchOutlined />} onClick={() => { setPermPickerPage(1) }}>搜索</Button>
          <Button onClick={() => { setPermissionSearchText(''); setPermPickerPage(1); }}>重置</Button>
        </div>

        {/* 权限表格 */}
        <Table
          columns={permissionPickerColumns}
          dataSource={availablePermissions}
          rowKey="id"
          size="small"
          scroll={{ x: 400, y: 500 }}
          pagination={{
            current: permPickerPage,
            pageSize: permPickerPageSize,
            total: availablePermissions.length,
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

      {/* 调整抽屉 - 选择当前人员的已有权限 */}
      <Drawer
        title="选择权限"
        open={adjustDrawerOpen}
        onClose={handleCloseAdjustDrawer}
        width={667}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>共计 {currentAdjustStaff ? currentAdjustStaff.name : ''} 的权限列表</span>
            <Space>
              <Button onClick={handleCloseAdjustDrawer}>取消</Button>
              <Button type="primary" onClick={handleConfirmAdjustDrawer}>确定</Button>
            </Space>
          </div>
        }
      >
        {currentAdjustStaff && (
          <>
            {/* 人员信息 */}
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ fontWeight: 600 }}>{currentAdjustStaff.name}</div>
              <div style={{ color: '#999', fontSize: 12 }}>工号：{currentAdjustStaff.id}</div>
            </div>

            {/* 权限分类标签 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <Tag
                color={categoryFilter === undefined ? 'blue' : undefined}
                onClick={() => setCategoryFilter(undefined)}
                style={{ cursor: 'pointer' }}
              >
                全部 ({adjustSelectedPermissionIds.length}/{MOCK_PERMISSIONS.length})
              </Tag>
              {CATEGORY_OPTIONS.map((option) => {
                const categoryPermissions = MOCK_PERMISSIONS.filter((p) => p.category === option.label)
                const selectedInCategory = adjustSelectedPermissionIds.filter((id) => {
                  const p = MOCK_PERMISSIONS.find((perm) => perm.id === id)
                  return p && p.category === option.label
                }).length
                return (
                  <Tag
                    key={option.value}
                    color={categoryFilter === option.value ? 'blue' : undefined}
                    onClick={() => setCategoryFilter(categoryFilter === option.value ? undefined : option.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    {option.label} ({selectedInCategory}/{categoryPermissions.length})
                  </Tag>
                )
              })}
            </div>

            {/* 搜索区域 */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500 }}>名称</span>
                <Input
                  placeholder="请输入名称"
                  value={permissionSearchText}
                  onChange={(e) => { setPermissionSearchText(e.target.value); }}
                  style={{ width: 140 }}
                  allowClear
                />
              </div>
              <Button icon={<SearchOutlined />}>搜索</Button>
              <Button onClick={() => { setPermissionSearchText(''); setCategoryFilter(undefined); }}>重置</Button>
            </div>

            {/* 权限表格 */}
            <Table
              columns={[
                {
                  title: '',
                  key: 'select',
                  width: 50,
                  render: (_: unknown, record: typeof MOCK_PERMISSIONS[number]) => (
                    <Checkbox
                      checked={adjustSelectedPermissionIds.includes(record.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAdjustSelectedPermissionIds([...adjustSelectedPermissionIds, record.id])
                        } else {
                          setAdjustSelectedPermissionIds(adjustSelectedPermissionIds.filter((id) => id !== record.id))
                        }
                      }}
                    />
                  ),
                },
                { title: '权限类型', dataIndex: 'category', key: 'category', width: 100 },
                { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 200 },
              ]}
              dataSource={(() => {
                const staffPermissions = MOCK_STAFF.find((s) => s.id === currentAdjustStaff.id)?.permissions || []
                return staffPermissions
                  .filter((name) => {
                    const permission = MOCK_PERMISSIONS.find((p) => p.permissionName === name)
                    if (!permission) return true
                    if (categoryFilter && permission.category !== categoryFilter) return false
                    if (permissionSearchText.trim()) {
                      const keyword = permissionSearchText.trim().toLowerCase()
                      return permission.permissionName.toLowerCase().includes(keyword)
                    }
                    return true
                  })
                  .map((name, index) => {
                    const permission = MOCK_PERMISSIONS.find((p) => p.permissionName === name)
                    return {
                      id: permission?.id || `temp-${index}`,
                      category: permission?.category || '-',
                      permissionName: name,
                      config: permission?.config || '',
                    }
                  })
              })()}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 400 }}
            />
          </>
        )}
      </Drawer>

      {/* 批量回收 - 人员选择抽屉 */}
      <Drawer
        title="人员列表"
        open={batchStaffPickerOpen}
        onClose={handleCloseBatchStaffPicker}
        width={700}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>共计 {filteredBatchStaff.length} 条数据</span>
            <Space>
              <Button onClick={handleCloseBatchStaffPicker}>取消</Button>
              <Button type="primary" onClick={handleConfirmBatchStaffPicker}>确定</Button>
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
              value={batchPickerSearchText}
              onChange={(e) => { setBatchPickerSearchText(e.target.value); setBatchPickerPage(1) }}
              style={{ width: 140 }}
              allowClear
            />
          </div>
          <Select
            placeholder="请选择所属科室"
            value={batchPickerDeptFilter || undefined}
            onChange={(val) => { setBatchPickerDeptFilter(val || undefined); setBatchPickerPage(1) }}
            style={{ width: 160 }}
            allowClear
            options={DEPARTMENT_OPTIONS}
          />
          <Button icon={<SearchOutlined />} onClick={() => { setBatchPickerPage(1) }}>搜索</Button>
          <Button onClick={() => { 
            setBatchPickerSearchText(''); 
            setBatchPickerDeptFilter(undefined); 
            setBatchPickerPage(1);
          }}>重置</Button>
        </div>

        {/* 人员表格 */}
        <Table
          columns={batchStaffPickerColumns}
          dataSource={filteredBatchStaff}
          rowKey="id"
          size="small"
          scroll={{ x: 600, y: 500 }}
          pagination={{
            current: batchPickerPage,
            pageSize: batchPickerPageSize,
            total: filteredBatchStaff.length,
            onChange: (page, pageSize) => {
              setBatchPickerPage(page)
              setBatchPickerPageSize(pageSize)
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

export default BatchRevoke
