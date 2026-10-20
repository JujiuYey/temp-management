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
  Checkbox,
} from 'antd'
import {
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { ExtendRecord } from './PermissionExtend'

interface ApplyRecord {
  id: string
  type: 'adjust' // 权限调整
  approvalStatus: string
  adjustPermissions: string[]
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

/** 模拟权限数据（含完整配置项） */
const MOCK_PERMISSIONS = [
  { id: 'P001', category: '处方权', permissionName: '普通处方权', config: '普通处方', prescriptionType: '门诊', qualification: '' },
  { id: 'P002', category: '处方权', permissionName: '抗菌药物处方权', config: '抗菌药物处方', prescriptionType: '门诊', qualification: '' },
  { id: 'P003', category: '手术等级', permissionName: '一级手术权限', config: '一级', roleType: '主刀' },
  { id: 'P004', category: '手术等级', permissionName: '二级手术权限', config: '二级', roleType: '主刀' },
  { id: 'P005', category: '手术目录', permissionName: '腹腔镜胆囊切除术', config: '三级 / 限制型', roleType: '一助' },
  { id: 'P006', category: '临床用血', permissionName: '红细胞输注权限', config: '红细胞 / 2U' },
  { id: 'P007', category: '麻醉等级', permissionName: '一级麻醉权限', config: '一级' },
  { id: 'P008', category: '操作', permissionName: '经皮穿刺活检术', config: '二级 / 限制型' },
  { id: 'P009', category: '报告', permissionName: '检验报告签发权', config: '检验报告 / 签发' },
  { id: 'P010', category: '设备', permissionName: '大型设备操作权', config: '大型设备' },
  { id: 'P011', category: '病理', permissionName: '病理诊断权限', config: '病理诊断' },
]

/** 模拟人员数据（含工号 + 拥有的权限列表） */
const MOCK_STAFF = [
  { id: 'S001', name: '张医生', department: '外科', title: '主治医师', employeeNo: 'G20001', gender: '男',
    permissions: ['P001', 'P002', 'P003', 'P004', 'P005'] },
  { id: 'S002', name: '李医生', department: '内科', title: '副主任医师', employeeNo: 'G20002', gender: '男',
    permissions: ['P001', 'P002', 'P009'] },
  { id: 'S003', name: '王护士', department: '内科', title: '主管护师', employeeNo: 'G20003', gender: '女',
    permissions: ['P001'] },
  { id: 'S004', name: '赵技师', department: '检验科', title: '技师', employeeNo: 'G20004', gender: '男',
    permissions: ['P009', 'P010'] },
  { id: 'S005', name: '陈医生', department: '外科', title: '主任医师', employeeNo: 'G20005', gender: '男',
    permissions: ['P001', 'P002', 'P003', 'P004', 'P005', 'P007'] },
  { id: 'S006', name: '刘医生', department: '急诊科', title: '主治医师', employeeNo: 'G20006', gender: '男',
    permissions: ['P001', 'P006'] },
  { id: 'S007', name: '周护士', department: '外科', title: '护士', employeeNo: 'G20007', gender: '女',
    permissions: ['P001'] },
  { id: 'S008', name: '吴医生', department: '内科', title: '住院医师', employeeNo: 'G20008', gender: '男',
    permissions: ['P001', 'P008'] },
]

interface SelectedPermission {
  id: string
  category: string
  permissionName: string
  config: string
  // 可编辑的配置项（支持多选）
  prescriptionTypes?: string[] // 处方权：住院/门诊（可多选）
  roleTypes?: string[] // 手术/设备：主刀/一助/开单 或 操作/维修（可多选）
  qualification?: string // 准入资质
  validPeriod?: number // 有效期（月）
  isLimited?: boolean // 是否限制有效期
}

interface SelectedStaff {
  id: string
  name: string
  department: string
  title: string
}

interface BatchAdjustProps {
  initialData?: ExtendRecord[]
  onInitialDataConsumed?: () => void
  /** 是否隐藏"选择人员"按钮（从权限查询跳转过来时设为 true） */
  hideStaffPicker?: boolean
}

const BatchAdjust: React.FC<BatchAdjustProps> = ({ initialData, onInitialDataConsumed, hideStaffPicker: hideStaffPickerProp }) => {
  // ==================== 通用状态 ====================
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  // ==================== 权限调整抽屉 ====================
  const [adjustDrawerOpen, setAdjustDrawerOpen] = useState(false)
  const [adjustForm] = Form.useForm()
  const [drawerMode, setDrawerMode] = useState<'add' | 'view' | 'edit'>('add')
  const [editingRecord, setEditingRecord] = useState<ApplyRecord | null>(null)
  const isReadOnly = drawerMode === 'view'

  // 步骤1：人员选择
  const [selectedStaff, setSelectedStaff] = useState<SelectedStaff | null>(null)
  const [staffSearchText, setStaffSearchText] = useState('')
  const [hideStaffPicker, setHideStaffPicker] = useState(false)

  // 步骤2：权限列表
  const [staffPermissions, setStaffPermissions] = useState<SelectedPermission[]>([])
  const [checkedPermIds, setCheckedPermIds] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)

  // 人员选择抽屉状态
  const [staffPickerOpen, setStaffPickerOpen] = useState(false)
  const [pickerSearchText, setPickerSearchText] = useState('')
  const [pickerDeptFilter, setPickerDeptFilter] = useState<string | undefined>(undefined)
  const [pickerPage, setPickerPage] = useState(1)
  const [pickerPageSize, setPickerPageSize] = useState(20)

  // ==================== 申请记录数据 ====================
  const [data, setData] = useState<ApplyRecord[]>([
    { id: '1', type: 'adjust', approvalStatus: '已完成', adjustPermissions: ['普通处方权', '抗菌药物处方权'], staffName: '张医生', staffNames: ['张医生'], staffCount: 1, applicant: '李主任', applicantDept: '医务科', applyDate: '2026-06-01', applyDescription: '权限调整' },
    { id: '2', type: 'adjust', approvalStatus: '审批中', adjustPermissions: ['二级手术权限', '腹腔镜胆囊切除术'], staffName: '陈医生', staffNames: ['陈医生'], staffCount: 1, applicant: '赵主任', applicantDept: '外科', applyDate: '2026-06-05', applyDescription: '手术权限调整' },
    { id: '3', type: 'adjust', approvalStatus: '未提交', adjustPermissions: ['红细胞输注权限'], staffName: '刘医生', staffNames: ['刘医生'], staffCount: 1, applicant: '陈科长', applicantDept: '输血科', applyDate: '2026-06-10', applyDescription: '用血权限调整' },
  ])

  // 人员搜索结果
  const staffSearchResults = useMemo(() => {
    if (!staffSearchText.trim()) return []
    const keyword = staffSearchText.trim().toLowerCase()
    return MOCK_STAFF.filter(
      (s) => s.name.toLowerCase().includes(keyword) || s.employeeNo.toLowerCase().includes(keyword)
    )
  }, [staffSearchText])

  // 人员选择抽屉过滤后的数据
  const filteredStaff = useMemo(() => {
    return MOCK_STAFF.filter((s) => {
      if (pickerSearchText.trim()) {
        const kw = pickerSearchText.trim().toLowerCase()
        if (!s.name.toLowerCase().includes(kw) && !s.employeeNo.toLowerCase().includes(kw)) {
          return false
        }
      }
      if (pickerDeptFilter && s.department !== pickerDeptFilter) return false
      return true
    })
  }, [pickerSearchText, pickerDeptFilter])

  // 根据分类筛选该人员权限
  const filteredStaffPermissions = staffPermissions.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false
    return true
  })

  // ==================== 前端过滤 ====================
  const filteredData = data.filter((r) => {
    if (statusFilter && r.approvalStatus !== statusFilter) return false
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase()
      return r.staffName.toLowerCase().includes(keyword) || r.applicant.toLowerCase().includes(keyword) || r.adjustPermissions.some((p) => p.toLowerCase().includes(keyword))
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
      title: '调整权限', dataIndex: 'adjustPermissions', key: 'adjustPermissions', width: 200,
      render: (perms: string[]) => (
        <Space size={[4, 4]} wrap>
          {perms.map((p) => <Tag key={p} color="blue">{p}</Tag>)}
        </Space>
      ),
    },
    {
      title: '人员', dataIndex: 'staffNames', key: 'staffNames', width: 120,
      render: (names: string[]) => {
        if (!names || names.length === 0) return '-'
        return <span>{names[0]}</span>
      },
    },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 90 },
    { title: '申请部门', dataIndex: 'applicantDept', key: 'applicantDept', width: 100 },
    { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate', width: 110 },
    { title: '申请说明', dataIndex: 'applyDescription', key: 'applyDescription', width: 150, ellipsis: true },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: unknown, record: ApplyRecord) => (
        <Space size="small">
          {record.approvalStatus === '未提交' && (
            <>
              <Button type="link" size="small" onClick={() => handleOpenDrawer(record, 'edit')}>修改</Button>
              <Button type="link" size="small" danger onClick={() => { setData(data.filter((r) => r.id !== record.id)); message.success('删除成功') }}>删除</Button>
            </>
          )}
          {record.approvalStatus === '已完成' && (
            <Button type="link" size="small" onClick={() => handleOpenDrawer(record, 'view')}>查看</Button>
          )}
        </Space>
      ),
    },
  ]

  // ==================== 从权限查询跳转过来时，自动预填并打开抽屉 ====================
  // 同步 hideStaffPickerProp 到本地状态
  useEffect(() => {
    if (hideStaffPickerProp) {
      setHideStaffPicker(true)
    }
  }, [hideStaffPickerProp])

  useEffect(() => {
    if (!initialData || initialData.length === 0) return

    // 取所有涉及的人员（去重）
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

    if (staffMap.size === 0) {
      message.warning('未找到匹配的人员信息')
      onInitialDataConsumed?.()
      return
    }

    // 取第一个人员预填（BatchAdjust 当前只支持单人）
    const staffList = Array.from(staffMap.values());
    const firstStaff = staffList[0];
    if (!firstStaff) {
      message.warning('未找到可预填的人员');
      onInitialDataConsumed?.();
      return;
    }
    setSelectedStaff({
      id: firstStaff.id,
      name: firstStaff.name,
      department: firstStaff.department,
      title: firstStaff.title,
    })

    // 加载该人员的权限列表
    const perms: SelectedPermission[] = firstStaff.permissions.map(
      (permId: string, idx: number) => {
        const found = MOCK_PERMISSIONS.find((p) => p.id === permId)
        return {
          id: found?.id || `staff-${idx}`,
          category: found?.category || '',
          permissionName: found?.permissionName || '',
          config: found?.config || '',
          prescriptionTypes: [],
          roleTypes: [],
          isLimited: false,
          validPeriod: undefined,
        }
      }
    )
    setStaffPermissions(perms)

    // 根据 initialData 里的 permissionName 勾选对应权限
    const targetNames = new Set(initialData.map((r) => r.permissionName))
    const checkedIds = perms
      .filter((p) => targetNames.has(p.permissionName))
      .map((p) => p.id)
    setCheckedPermIds(checkedIds)

    // 隐藏"选择人员"按钮（从权限查询跳转过来时）
    setHideStaffPicker(true)

    // 打开抽屉
    setDrawerMode('add')
    adjustForm.resetFields()
    setAdjustDrawerOpen(true)

    // 通知父组件清空 initialData，避免重复触发
    onInitialDataConsumed?.()
  }, [initialData])

  // ==================== 权限调整抽屉 - 打开/操作 ====================
  const handleOpenAdjust = () => {
    setHideStaffPicker(false) // 主动打开时显示"选择人员"按钮
    setDrawerMode('add')
    setEditingRecord(null)
    setSelectedStaff(null)
    setStaffPermissions([])
    setCheckedPermIds([])
    setStaffSearchText('')
    setCategoryFilter(undefined)
    adjustForm.resetFields()
    setAdjustDrawerOpen(true)
  }

  const handleOpenDrawer = (record: ApplyRecord, mode: 'view' | 'edit') => {
    setDrawerMode(mode)
    setEditingRecord(record)
    setCategoryFilter(undefined)
    // 回填人员
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
      const perms = foundStaff.permissions.map((permId, idx) => {
        const found = MOCK_PERMISSIONS.find((p) => p.id === permId)
        return {
          id: found?.id || `staff-${idx}`,
          category: found?.category || '',
          permissionName: found?.permissionName || '',
          config: found?.config || '',
          prescriptionType: found?.prescriptionType,
          roleType: found?.roleType,
        }
      })
      setStaffPermissions(perms)
      // 回填勾选的权限
      const checkedIds = record.adjustPermissions
        .map((name) => perms.find((p) => p.permissionName === name)?.id)
        .filter((id): id is string => !!id)
      setCheckedPermIds(checkedIds)
    } else {
      setSelectedStaff(null)
      setStaffPermissions([])
      setCheckedPermIds([])
    }
    adjustForm.setFieldsValue({ description: record.applyDescription })
    setStaffSearchText('')
    setAdjustDrawerOpen(true)
  }

  const handleSave = async () => {
    try {
      await adjustForm.validateFields()
      if (!selectedStaff) {
        message.warning('请先选择人员')
        return
      }
      if (checkedPermIds.length === 0) {
        message.warning('请至少选择一个需要调整的权限')
        return
      }
      const permNames = staffPermissions
        .filter((p) => checkedPermIds.includes(p.id))
        .map((p) => p.permissionName)
      message.success(`成功提交 ${selectedStaff.name} 的 ${permNames.length} 项权限调整`)
      setAdjustDrawerOpen(false)
    } catch { /* 表单验证失败 */ }
  }

  // 人员选择抽屉相关函数
  const handleOpenStaffPicker = () => {
    setPickerSearchText('')
    setPickerDeptFilter(undefined)
    setPickerPage(1)
    setStaffPickerOpen(true)
  }

  const handleCloseStaffPicker = () => {
    setStaffPickerOpen(false)
  }

  const handleConfirmStaffPicker = (staff: typeof MOCK_STAFF[number]) => {
    setSelectedStaff({
      id: staff.id,
      name: staff.name,
      department: staff.department,
      title: staff.title,
    })
    // 将该人员的权限列表转换为 SelectedPermission
    const perms = staff.permissions.map((permId, idx) => {
      const found = MOCK_PERMISSIONS.find((p) => p.id === permId)
      return {
        id: found?.id || `staff-${idx}`,
        category: found?.category || '',
        permissionName: found?.permissionName || '',
        config: found?.config || '',
        prescriptionTypes: [], // 处方权配置（可多选）
        roleTypes: [], // 手术/设备配置（可多选）
        isLimited: false,
        validPeriod: undefined,
      }
    })
    setStaffPermissions(perms)
    setCheckedPermIds([]) // 默认不选中
    setStaffPickerOpen(false)
    message.success(`已选择人员：${staff.name}`)
  }

  // 人员选择抽屉表格列
  const staffPickerColumns: ColumnsType<typeof MOCK_STAFF[number]> = [
    {
      title: '选择',
      key: 'action',
      width: 60,
      render: (_: unknown, record: typeof MOCK_STAFF[number]) => (
        <Button type="link" size="small" onClick={() => handleConfirmStaffPicker(record)}>选择</Button>
      ),
    },
    { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
    { title: '所属科室', dataIndex: 'department', key: 'department', width: 100 },
    { title: '职称', dataIndex: 'title', key: 'title', width: 100 },
  ]

  // 渲染权限配置列 - 多选框形式，支持多选，只有勾选后才允许修改
  const renderPermissionConfig = (record: SelectedPermission) => {
    const category = record.category
    const isChecked = checkedPermIds.includes(record.id)
    const disabled = isReadOnly || !isChecked // 只有勾选后才允许修改

    // 处方权：住院、门诊（可多选）
    if (category === '处方权') {
      const prescriptionTypes = record.prescriptionTypes || []
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <Checkbox
            checked={prescriptionTypes.includes('住院')}
            disabled={disabled}
            onChange={(e) => {
              const newTypes = e.target.checked
                ? [...prescriptionTypes, '住院']
                : prescriptionTypes.filter((t) => t !== '住院')
              const updated = staffPermissions.map((p) =>
                p.id === record.id ? { ...p, prescriptionTypes: newTypes } : p
              )
              setStaffPermissions(updated)
            }}
          >
            住院
          </Checkbox>
          <Checkbox
            checked={prescriptionTypes.includes('门诊')}
            disabled={disabled}
            onChange={(e) => {
              const newTypes = e.target.checked
                ? [...prescriptionTypes, '门诊']
                : prescriptionTypes.filter((t) => t !== '门诊')
              const updated = staffPermissions.map((p) =>
                p.id === record.id ? { ...p, prescriptionTypes: newTypes } : p
              )
              setStaffPermissions(updated)
            }}
          >
            门诊
          </Checkbox>
        </div>
      )
    }

    // 手术等级/手术目录：主刀、一助、开单（可多选）
    if (category === '手术等级' || category === '手术目录') {
      const roleTypes = record.roleTypes || []
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <Checkbox
            checked={roleTypes.includes('主刀')}
            disabled={disabled}
            onChange={(e) => {
              const newTypes = e.target.checked
                ? [...roleTypes, '主刀']
                : roleTypes.filter((t) => t !== '主刀')
              const updated = staffPermissions.map((p) =>
                p.id === record.id ? { ...p, roleTypes: newTypes } : p
              )
              setStaffPermissions(updated)
            }}
          >
            主刀
          </Checkbox>
          <Checkbox
            checked={roleTypes.includes('一助')}
            disabled={disabled}
            onChange={(e) => {
              const newTypes = e.target.checked
                ? [...roleTypes, '一助']
                : roleTypes.filter((t) => t !== '一助')
              const updated = staffPermissions.map((p) =>
                p.id === record.id ? { ...p, roleTypes: newTypes } : p
              )
              setStaffPermissions(updated)
            }}
          >
            一助
          </Checkbox>
          <Checkbox
            checked={roleTypes.includes('开单')}
            disabled={disabled}
            onChange={(e) => {
              const newTypes = e.target.checked
                ? [...roleTypes, '开单']
                : roleTypes.filter((t) => t !== '开单')
              const updated = staffPermissions.map((p) =>
                p.id === record.id ? { ...p, roleTypes: newTypes } : p
              )
              setStaffPermissions(updated)
            }}
          >
            开单
          </Checkbox>
        </div>
      )
    }

    // 设备：操作、维修（可多选）
    if (category === '设备') {
      const roleTypes = record.roleTypes || []
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <Checkbox
            checked={roleTypes.includes('操作')}
            disabled={disabled}
            onChange={(e) => {
              const newTypes = e.target.checked
                ? [...roleTypes, '操作']
                : roleTypes.filter((t) => t !== '操作')
              const updated = staffPermissions.map((p) =>
                p.id === record.id ? { ...p, roleTypes: newTypes } : p
              )
              setStaffPermissions(updated)
            }}
          >
            操作
          </Checkbox>
          <Checkbox
            checked={roleTypes.includes('维修')}
            disabled={disabled}
            onChange={(e) => {
              const newTypes = e.target.checked
                ? [...roleTypes, '维修']
                : roleTypes.filter((t) => t !== '维修')
              const updated = staffPermissions.map((p) =>
                p.id === record.id ? { ...p, roleTypes: newTypes } : p
              )
              setStaffPermissions(updated)
            }}
          >
            维修
          </Checkbox>
        </div>
      )
    }

    // 其他类型都显示 "--"
    return <span>--</span>
  }

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Button type="primary" icon={<EditOutlined />} onClick={handleOpenAdjust}>
              权限调整
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
        scroll={{ x: 1000 }} size="middle"
        pagination={{ total: filteredData.length, pageSize: 10, showTotal: (total) => `共 ${total} 条记录`, showSizeChanger: true, showQuickJumper: true }} />

      {/* ==================== 权限调整抽屉 ==================== */}
      <Drawer
        title={drawerMode === 'add' ? '权限调整' : drawerMode === 'view' ? '查看权限调整' : '修改权限调整'}
        open={adjustDrawerOpen}
        onClose={() => setAdjustDrawerOpen(false)}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAdjustDrawerOpen(false)}>{isReadOnly ? '关闭' : '取消'}</Button>
              {!isReadOnly && (
                <>
                  <Button onClick={handleSave}>保存</Button>
                  <Button type="primary" onClick={handleSave}>提交</Button>
                </>
              )}
            </Space>
          </div>
        }
      >
        <Form form={adjustForm} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <div>
            {/* 人员选择 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                人员选择
              </div>
              {!isReadOnly && !hideStaffPicker && (
                <Button type="primary" icon={<SearchOutlined />} onClick={handleOpenStaffPicker}>
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
                ...(!isReadOnly ? [{
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
                      <div style={{ color: '#999', fontSize: 12 }}>请通过上方按钮选择需要调整权限的人员</div>
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
                      该人员权限 <span style={{ color: '#1677ff', fontWeight: 400, fontSize: 13 }}>已选{checkedPermIds.length}项</span>
                    </div>
                    <Space size={8}>
                      <Select
                        placeholder="权限分类筛选"
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        style={{ width: 140 }}
                        allowClear
                        options={CATEGORY_OPTIONS}
                      />
                      {!isReadOnly && staffPermissions.length > 0 && (
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
                            disabled={isReadOnly}
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
                      { title: '权限分类', dataIndex: 'category', key: 'category', width: 100,
                        render: (cat: string) => <Tag>{cat}</Tag> },
                      { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 140 },
                      { 
                        title: '等级/分类', 
                        key: 'level', 
                        width: 120,
                        render: (_: unknown, record: SelectedPermission) => {
                          const isChecked = checkedPermIds.includes(record.id)
                          const disabled = isReadOnly || !isChecked
                          
                          if (record.permissionName.includes('抗菌药物')) {
                            return (
                              <Select defaultValue="" style={{ width: 100 }} disabled={disabled}>
                                <Select.Option value="非限制级">非限制级</Select.Option>
                                <Select.Option value="限制级">限制级</Select.Option>
                                <Select.Option value="特殊级">特殊级</Select.Option>
                              </Select>
                            )
                          }
                          if (record.permissionName.includes('精神药物')) {
                            return (
                              <Select defaultValue="" style={{ width: 100 }} disabled={disabled}>
                                <Select.Option value="Ⅰ类">Ⅰ类</Select.Option>
                                <Select.Option value="Ⅱ类">Ⅱ类</Select.Option>
                              </Select>
                            )
                          }
                          if (record.permissionName.includes('授权等级') || record.permissionName.includes('级')) {
                            return (
                              <Select defaultValue="" style={{ width: 100 }} disabled={disabled}>
                                <Select.Option value="一级">一级</Select.Option>
                                <Select.Option value="二级">二级</Select.Option>
                                <Select.Option value="三级">三级</Select.Option>
                                <Select.Option value="四级">四级</Select.Option>
                              </Select>
                            )
                          }
                          return null
                        },
                      },
                      { title: '权限配置', key: 'config', width: 220, render: (_: unknown, record: SelectedPermission) => renderPermissionConfig(record) },
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

                {/* 调整说明 */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ borderLeft: '3px solid #1677ff', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
                    调整说明
                  </div>
                  <Form.Item name="description" noStyle>
                    <Input.TextArea
                      rows={3}
                      disabled={isReadOnly}
                      placeholder="请填写权限调整原因及说明"
                    />
                  </Form.Item>
                </div>

                {/* 附件 */}
                {!isReadOnly && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ borderLeft: '3px solid #1677ff', paddingLeft: 8, marginBottom: 8, fontWeight: 600 }}>
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

      {/* 人员选择抽屉 */}
      <Drawer
        title="人员列表"
        open={staffPickerOpen}
        onClose={handleCloseStaffPicker}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>共计 {filteredStaff.length} 条数据</span>
            <Space>
              <Button onClick={handleCloseStaffPicker}>取消</Button>
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
          columns={staffPickerColumns}
          dataSource={filteredStaff}
          rowKey="id"
          size="small"
          scroll={{ x: 600, y: 500 }}
          pagination={{
            current: pickerPage,
            pageSize: pickerPageSize,
            total: filteredStaff.length,
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
    </div>
  )
}

export default BatchAdjust
