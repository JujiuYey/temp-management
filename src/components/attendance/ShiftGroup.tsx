import React, { useState, useMemo } from 'react'
import {
  Button,
  Table,
  Input,
  Select,
  TreeSelect,
  Space,
  message,
  Modal,
  Form,
  Tree,
  Drawer,
  Empty,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserAddOutlined,
} from '@ant-design/icons'

// 人员数据类型
interface StaffItem {
  id: string
  name: string
  employeeNo: string
  department: string
  personType: string
  personCategory: string
  gender: string
}

// 排班分组数据类型
interface ShiftGroup {
  id: string
  attendanceUnit: string
  groupName: string
  personType: string
  personCategory: string
  memberCount: number
  description: string
  status: 'enabled' | 'disabled'
  sortOrder: number
}

// 模拟排班分组数据
const mockGroupList: ShiftGroup[] = [
  {
    id: '1',
    attendanceUnit: '信息科',
    groupName: '信息科A组',
    personType: '卫生技术人员',
    personCategory: '医师',
    memberCount: 4,
    description: '信息科日常值班分组',
    status: 'enabled',
    sortOrder: 1,
  },
  {
    id: '2',
    attendanceUnit: '信息科',
    groupName: '信息科B组',
    personType: '卫生技术人员',
    personCategory: '护士',
    memberCount: 3,
    description: '信息科护士排班分组',
    status: 'enabled',
    sortOrder: 2,
  },
  {
    id: '3',
    attendanceUnit: '肝胆科门诊',
    groupName: '肝胆科门诊组',
    personType: '卫生技术人员',
    personCategory: '技师',
    memberCount: 1,
    description: '',
    status: 'enabled',
    sortOrder: 3,
  },
  {
    id: '4',
    attendanceUnit: '眼科',
    groupName: '眼科组',
    personType: '卫生技术人员',
    personCategory: '医师',
    memberCount: 2,
    description: '眼科排班分组',
    status: 'disabled',
    sortOrder: 4,
  },
]

// 可分配人员数据
const mockAssignableStaff: StaffItem[] = [
  { id: '3', name: '李明钊', employeeNo: '0268', department: '信息科', personType: '卫生技术人员', personCategory: '医师', gender: '男' },
  { id: '4', name: '赵坤', employeeNo: '0956', department: '信息科', personType: '卫生技术人员', personCategory: '医师', gender: '男' },
  { id: '5', name: '朱虹', employeeNo: '0247', department: '肝胆科门诊', personType: '卫生技术人员', personCategory: '护士', gender: '女' },
  { id: '6', name: '杨艳', employeeNo: '1611', department: '眼科', personType: '卫生技术人员', personCategory: '护士', gender: '女' },
  { id: '7', name: '杨富竣', employeeNo: '2568', department: '胸外科', personType: '卫生技术人员', personCategory: '技师', gender: '男' },
  { id: '8', name: '叶舒红', employeeNo: '1891', department: '信息科', personType: '卫生技术人员', personCategory: '药师', gender: '女' },
  { id: '9', name: '蒋润润', employeeNo: '0965', department: '肝胆科门诊', personType: '行政人员', personCategory: '-', gender: '男' },
  { id: '10', name: '左乾涛', employeeNo: '2618', department: '眼科', personType: '卫生技术人员', personCategory: '医师', gender: '男' },
  { id: '11', name: '杜焯群', employeeNo: '0492', department: '信息科', personType: '卫生技术人员', personCategory: '护士', gender: '女' },
  { id: '12', name: '李根', employeeNo: '0067', department: '胸外科', personType: '卫生技术人员', personCategory: '医师', gender: '男' },
]

// 各分组已分配人员映射（初始值）
const initialMembersMap: Record<string, StaffItem[]> = {
  '1': [mockAssignableStaff[0], mockAssignableStaff[1], mockAssignableStaff[7], mockAssignableStaff[8]],
  '2': [mockAssignableStaff[2], mockAssignableStaff[3], mockAssignableStaff[8]],
  '3': [mockAssignableStaff[2]],
  '4': [mockAssignableStaff[3], mockAssignableStaff[9]],
}

const ShiftGroupPage: React.FC = () => {
  const [groupList, setGroupList] = useState<ShiftGroup[]>(mockGroupList)
  // 分组 → 已分配人员（改为 state，保证增删后实时刷新）
  const [membersMap, setMembersMap] = useState<Record<string, StaffItem[]>>(initialMembersMap)
  const [form] = Form.useForm()

  // 机构 / 考勤单元筛选
  const [selectedOrg, setSelectedOrg] = useState<string>('org1')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')

  // 左侧分组树
  const [selectedGroupId, setSelectedGroupId] = useState<string>('1')
  const [treeSearchText, setTreeSearchText] = useState('')

  // 右侧人员列表搜索
  const [memberKeyword, setMemberKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')

  // 新增/编辑分组抽屉
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ShiftGroup | null>(null)

  // 分配人员抽屉
  const [assignDrawerVisible, setAssignDrawerVisible] = useState(false)
  const [assigningGroup, setAssigningGroup] = useState<ShiftGroup | null>(null)
  const [selectedStaffKeys, setSelectedStaffKeys] = useState<React.Key[]>([])

  // 机构数据
  const orgOptions = [
    { label: '贵阳市XX医院总院区', value: 'org1' },
    { label: '贵阳市XX医院南院区', value: 'org2' },
    { label: '贵阳市XX医院北院区', value: 'org3' },
  ]

  // 各机构考勤单元（科室）数据
  const deptDataByOrg = {
    org1: [
      { id: 'dept1', name: '信息科' },
      { id: 'dept2', name: '金测试排班管理单元' },
      { id: 'dept3', name: '肝胆科门诊' },
      { id: 'dept4', name: '眼科' },
      { id: 'dept5', name: '胸外科' },
    ],
    org2: [
      { id: 'dept6', name: '南院区急诊科' },
      { id: 'dept7', name: '南院区门诊部' },
      { id: 'dept8', name: '南院区住院部' },
    ],
    org3: [
      { id: 'dept9', name: '北院区内科' },
      { id: 'dept10', name: '北院区外科' },
    ],
  }

  // 当前机构下的考勤单元列表
  const currentUnits = (deptDataByOrg[selectedOrg as keyof typeof deptDataByOrg] || []).map(d => d.name)

  // 考勤单元下拉选项
  const unitOptions = [
    { label: '全部考勤单元', value: 'all' },
    ...currentUnits.map(name => ({ label: name, value: name })),
  ]

  // 机构 / 考勤单元树形选项（一个框内树状展开：机构为上级、单元为下级）
  const treeSelectData = orgOptions.map(org => ({
    title: org.label,
    value: org.value,
    key: org.value,
    children: (deptDataByOrg[org.value as keyof typeof deptDataByOrg] || []).map(d => ({
      title: d.name,
      value: d.name,
      key: d.name,
    })),
  }))

  // 按机构 / 考勤单元 + 分组名称关键字过滤后的分组（左侧树数据源）
  const filteredGroups = useMemo(() => {
    const orgUnitNames = (deptDataByOrg[selectedOrg as keyof typeof deptDataByOrg] || []).map(d => d.name)
    return groupList
      .filter(g => {
        if (selectedUnit !== 'all') return g.attendanceUnit === selectedUnit
        return orgUnitNames.includes(g.attendanceUnit)
      })
      .filter(g => (treeSearchText ? g.groupName.includes(treeSearchText) : true))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [groupList, selectedOrg, selectedUnit, treeSearchText])

  // 当前选中的分组
  const currentGroup = filteredGroups.find(g => g.id === selectedGroupId)
    || groupList.find(g => g.id === selectedGroupId)
    || null

  // 当前分组人数（以实际成员为准）
  const getMemberCount = (groupId: string) => (membersMap[groupId] || []).length

  // 当前分组人员列表（按姓名/工号过滤）
  const currentMembers = useMemo(() => {
    const list = currentGroup ? (membersMap[currentGroup.id] || []) : []
    if (!appliedKeyword) return list
    return list.filter(
      m => m.name.includes(appliedKeyword) || m.employeeNo.includes(appliedKeyword)
    )
  }, [currentGroup, membersMap, appliedKeyword])

  // 树形选择机构 / 考勤单元：选中机构=该机构下全部单元，选中单元=精确筛选；自动选中范围内第一个分组
  const handleTreeSelectChange = (value: string | undefined) => {
    if (!value) {
      setSelectedOrg('org1')
      setSelectedUnit('all')
      setSelectedGroupId(groupList.length > 0 ? groupList[0].id : '')
      setAppliedKeyword('')
      setMemberKeyword('')
      return
    }
    const isOrg = orgOptions.some(o => o.value === value)
    let org: string
    let unit: string
    if (isOrg) {
      org = value
      unit = 'all'
    } else {
      org =
        (Object.keys(deptDataByOrg) as string[]).find(k =>
          (deptDataByOrg[k as keyof typeof deptDataByOrg] || []).some(d => d.name === value)
        ) || selectedOrg
      unit = value
    }
    setSelectedOrg(org)
    setSelectedUnit(unit)
    const scope = groupList.filter(g => {
      if (unit !== 'all') return g.attendanceUnit === unit
      const orgUnits = (deptDataByOrg[org as keyof typeof deptDataByOrg] || []).map(d => d.name)
      return orgUnits.includes(g.attendanceUnit)
    })
    setSelectedGroupId(scope.length > 0 ? scope[0].id : '')
    setAppliedKeyword('')
    setMemberKeyword('')
  }

  // 处理新增
  const handleAdd = () => {
    setEditingGroup(null)
    form.resetFields()
    form.setFieldsValue({
      status: 'enabled',
      sortOrder: groupList.length + 1,
      attendanceUnit: selectedUnit === 'all' ? currentUnits[0] : selectedUnit,
    })
    setDrawerVisible(true)
  }

  // 处理编辑（可传入指定分组，默认当前选中分组）
  const handleEdit = (group?: ShiftGroup) => {
    const g = group || currentGroup
    if (!g) return
    setEditingGroup(g)
    form.setFieldsValue({
      attendanceUnit: g.attendanceUnit,
      groupName: g.groupName,
      personType: g.personType,
      personCategory: g.personCategory,
      description: g.description,
      status: g.status,
      sortOrder: g.sortOrder,
    })
    setDrawerVisible(true)
  }

  // 处理删除（可传入指定分组，默认当前选中分组）
  const handleDelete = (group?: ShiftGroup) => {
    const g = group || currentGroup
    if (!g) return
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除分组「${g.groupName}」吗？`,
      onOk: () => {
        setGroupList(prev => prev.filter(item => item.id !== g.id))
        setMembersMap(prev => {
          const next = { ...prev }
          delete next[g.id]
          return next
        })
        const rest = groupList.filter(item => item.id !== g.id)
        if (g.id === selectedGroupId) {
          setSelectedGroupId(rest.length > 0 ? rest[0].id : '')
        }
        message.success('删除成功')
      },
    })
  }

  // 处理分配人员
  const handleAssignStaff = () => {
    if (!currentGroup) return
    setAssigningGroup(currentGroup)
    setSelectedStaffKeys([])
    setAssignDrawerVisible(true)
  }

  // 提交分配：写入成员映射
  const handleSubmitAssign = () => {
    if (selectedStaffKeys.length === 0) {
      message.warning('请选择要分配的人员')
      return
    }
    if (assigningGroup) {
      setMembersMap(prev => {
        const exist = prev[assigningGroup.id] || []
        const existIds = exist.map(m => m.id)
        const toAdd = mockAssignableStaff.filter(
          s => selectedStaffKeys.includes(s.id) && !existIds.includes(s.id)
        )
        return { ...prev, [assigningGroup.id]: [...exist, ...toAdd] }
      })
    }
    setAssignDrawerVisible(false)
    message.success(`成功分配 ${selectedStaffKeys.length} 人`)
  }

  // 移除成员
  const handleRemoveMember = (record: StaffItem) => {
    if (!currentGroup) return
    const gid = currentGroup.id
    const updated = (membersMap[gid] || []).filter(m => m.id !== record.id)
    setMembersMap(prev => ({ ...prev, [gid]: updated }))
    message.success(`已移除成员「${record.name}」`)
  }

  // 提交新增/编辑
  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (editingGroup) {
        setGroupList(prev =>
          prev.map(item =>
            item.id === editingGroup.id
              ? {
                  ...item,
                  attendanceUnit: values.attendanceUnit,
                  groupName: values.groupName,
                  personType: values.personType,
                  personCategory: values.personCategory,
                  description: values.description || '',
                  status: values.status,
                  sortOrder: values.sortOrder,
                }
              : item
          )
        )
        message.success('修改成功')
      } else {
        const newGroup: ShiftGroup = {
          id: Date.now().toString(),
          attendanceUnit: values.attendanceUnit,
          groupName: values.groupName,
          personType: values.personType,
          personCategory: values.personCategory,
          memberCount: 0,
          description: values.description || '',
          status: values.status,
          sortOrder: values.sortOrder,
        }
        setGroupList(prev => [...prev, newGroup])
        setMembersMap(prev => ({ ...prev, [newGroup.id]: [] }))
        setSelectedUnit('all')
        setSelectedGroupId(newGroup.id)
        message.success('新增成功')
      }
      setDrawerVisible(false)
    })
  }

  // 人员列表列
  const memberColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, idx: number) => idx + 1,
    },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
    { title: '考勤单元', dataIndex: 'department', key: 'department', width: 140 },
    {
      title: '人员性质',
      dataIndex: 'personType',
      key: 'personType',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: '人员类别',
      dataIndex: 'personCategory',
      key: 'personCategory',
      width: 100,
      render: (v: string) => v || '-',
    },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 70 },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: unknown, record: StaffItem) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          style={{ backgroundColor: '#fff', borderColor: '#ff4d4f' }}
          onClick={() => handleRemoveMember(record)}
        >
          移除
        </Button>
      ),
    },
  ]

  // 左侧分组树数据（分组名称后放修改 / 删除图标，不再显示人数）
  const treeData = filteredGroups.map(g => ({
    key: g.id,
    title: (
      <div className="flex items-center justify-between w-full gap-1 pr-1">
        <span
          className={`truncate ${g.status === 'disabled' ? 'text-gray-400' : ''}`}
          title={g.groupName}
        >
          {g.groupName}
        </span>
        <span className="flex items-center gap-0.5 shrink-0">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            title="修改分组"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              handleEdit(g)
            }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            title="删除分组"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              handleDelete(g)
            }}
          />
        </span>
      </div>
    ),
  }))

  return (
    <div className="flex gap-4">
      {/* 左侧分组名称树 */}
      <div className="w-56 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-180px)]">
        <div className="px-3 py-2 border-b font-medium text-gray-700 flex items-center justify-between">
          <span>分组名称</span>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            title="添加排班分组"
            onClick={handleAdd}
          />
        </div>
        <div className="p-2">
          <Input
            placeholder="请输入分组名称"
            value={treeSearchText}
            onChange={e => setTreeSearchText(e.target.value)}
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
          />
        </div>
        <div className="flex-1 overflow-auto px-2 pb-2">
          {treeData.length > 0 ? (
            <Tree
              treeData={treeData}
              selectedKeys={currentGroup ? [currentGroup.id] : []}
              onSelect={(keys) => {
                if (keys.length > 0) {
                  setSelectedGroupId(keys[0] as string)
                  setAppliedKeyword('')
                  setMemberKeyword('')
                }
              }}
              blockNode
            />
          ) : (
            <div className="text-center text-gray-400 text-xs py-6">暂无分组</div>
          )}
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 min-w-0">
        {/* 顶部操作栏：分配人员 + 机构/单元筛选 + 姓名查询 + 搜索/重置 统一一行 */}
        <div className="bg-white p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Button type="primary" icon={<UserAddOutlined />} disabled={!currentGroup} onClick={handleAssignStaff}>
              分配人员
            </Button>
            <div className="flex items-center gap-3 flex-wrap">
              <TreeSelect
                treeData={treeSelectData}
                value={selectedUnit === 'all' ? selectedOrg : selectedUnit}
                onChange={handleTreeSelectChange}
                style={{ width: 300 }}
                placeholder="请选择机构 / 考勤单元"
                allowClear
                showSearch
                treeNodeFilterProp="title"
                treeDefaultExpandAll={false}
              />
              <Input
                placeholder="姓名 / 工号"
                style={{ width: 160 }}
                value={memberKeyword}
                onChange={e => setMemberKeyword(e.target.value)}
                allowClear
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={() => setAppliedKeyword(memberKeyword)}>
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setMemberKeyword('')
                  setAppliedKeyword('')
                }}
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        {/* 人员列表 */}
        <div className="bg-white rounded-lg border">
          {currentGroup ? (
            <Table
              columns={memberColumns}
              dataSource={currentMembers}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total: number) => `共 ${total} 条`,
                position: ['bottomLeft'],
              }}
              size="middle"
              locale={{ emptyText: '该分组暂无人员，可通过「分配人员」添加' }}
            />
          ) : (
            <Empty description="请在左侧选择一个分组" style={{ padding: '60px 0' }} />
          )}
        </div>
      </div>

      {/* 新增/编辑分组抽屉 */}
      <Drawer
        title={editingGroup ? '编辑分组' : '新增分组'}
        placement="right"
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <div className="flex justify-end gap-2 py-2">
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              确定
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            label="考勤单元"
            name="attendanceUnit"
            rules={[{ required: true, message: '请选择考勤单元' }]}
          >
            <Select placeholder="请选择考勤单元" options={currentUnits.map(n => ({ label: n, value: n }))} />
          </Form.Item>

          <Form.Item
            label="分组名称"
            name="groupName"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" />
          </Form.Item>

          <Form.Item
            label="人员性质"
            name="personType"
            rules={[{ required: true, message: '请选择人员性质' }]}
          >
            <Select placeholder="请选择人员性质" options={[
              { label: '卫生技术人员', value: '卫生技术人员' },
              { label: '行政人员', value: '行政人员' },
              { label: '工勤人员', value: '工勤人员' },
            ]} />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currValues) => prevValues.personType !== currValues.personType}
          >
            {({ getFieldValue }) =>
              getFieldValue('personType') === '卫生技术人员' ? (
                <Form.Item
                  label="人员类别"
                  name="personCategory"
                  rules={[{ required: true, message: '请选择人员类别' }]}
                >
                  <Select placeholder="请选择人员类别" options={[
                    { label: '医师', value: '医师' },
                    { label: '护士', value: '护士' },
                    { label: '技师', value: '技师' },
                    { label: '药师', value: '药师' },
                  ]} />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态" options={[
              { label: '启用', value: 'enabled' },
              { label: '停用', value: 'disabled' },
            ]} />
          </Form.Item>

          <Form.Item
            label="排序"
            name="sortOrder"
            rules={[{ required: true, message: '请输入排序号' }]}
          >
            <Input type="number" placeholder="请输入排序号" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 分配人员抽屉 */}
      <Drawer
        title={`分配人员 - ${assigningGroup?.groupName || ''}`}
        placement="right"
        width={900}
        open={assignDrawerVisible}
        onClose={() => setAssignDrawerVisible(false)}
        footer={
          <div className="flex justify-end gap-2 py-2">
            <Button onClick={() => setAssignDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmitAssign}>
              确定
            </Button>
          </div>
        }
      >
        {/* 筛选栏 */}
        <div className="mb-4 bg-gray-50 p-3 rounded">
          <Space size="middle" wrap>
            <Select
              placeholder="请选择考勤单元"
              style={{ width: 160 }}
              allowClear
              options={currentUnits.map(n => ({ label: n, value: n }))}
            />
            <Input placeholder="请输入姓名" style={{ width: 120 }} allowClear />
            <Select placeholder="请选择人员性质" style={{ width: 140 }} allowClear options={[
              { label: '卫生技术人员', value: '卫生技术人员' },
              { label: '行政人员', value: '行政人员' },
            ]} />
            <Select placeholder="请选择人员类别" style={{ width: 120 }} allowClear options={[
              { label: '医师', value: '医师' },
              { label: '护士', value: '护士' },
            ]} />
            <Button type="primary" icon={<SearchOutlined />}>搜索</Button>
            <Button icon={<ReloadOutlined />}>重置</Button>
          </Space>
        </div>

        {/* 人员表格 */}
        <Table
          columns={[
            { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
            { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
            { title: '考勤单元', dataIndex: 'department', key: 'department', width: 140 },
            { title: '人员性质', dataIndex: 'personType', key: 'personType', width: 130, render: (v: string) => v || '-' },
            { title: '人员类别', dataIndex: 'personCategory', key: 'personCategory', width: 100, render: (v: string) => v || '-' },
            { title: '性别', dataIndex: 'gender', key: 'gender', width: 70 },
          ]}
          dataSource={mockAssignableStaff}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedStaffKeys,
            onChange: (keys) => setSelectedStaffKeys(keys),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条`,
          }}
          size="middle"
          scroll={{ y: 400 }}
        />
      </Drawer>
    </div>
  )
}

export default ShiftGroupPage
