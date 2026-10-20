import React, { useState, useMemo, useCallback } from 'react'
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Table,
  Space,
  Tree,
  Switch,
  Tag,
  Modal,
  message,
  Badge,
} from 'antd'
import type { AttendancePerson } from '../../types'

const mockOrgs = [
  {
    id: 'org1',
    name: '贵阳市xx医院总院区',
    children: [
      { id: 'dept1', name: '内科', employeeCount: 45 },
      { id: 'dept2', name: '外科', employeeCount: 38 },
      { id: 'dept3', name: '儿科', employeeCount: 28 },
      { id: 'dept4', name: '急诊科', employeeCount: 22 },
    ],
  },
  {
    id: 'org2',
    name: '贵阳市xx医院南院区',
    children: [
      { id: 'dept5', name: 'ICU', employeeCount: 15 },
      { id: 'dept6', name: '手术室', employeeCount: 20 },
    ],
  },
  {
    id: 'org3',
    name: '贵阳市xx医院北院区',
    children: [
      { id: 'dept7', name: '康复科', employeeCount: 18 },
      { id: 'dept8', name: '体检中心', employeeCount: 12 },
    ],
  },
]

// 模拟考勤单元数据
const mockAttendanceUnits = [
  { id: 'unit1', orgId: 'org1', deptId: 'dept1', deptName: '内科' },
  { id: 'unit2', orgId: 'org1', deptId: 'dept4', deptName: '急诊科' },
  { id: 'unit3', orgId: 'org2', deptId: 'dept5', deptName: 'ICU' },
  { id: 'unit4', orgId: 'org2', deptId: 'dept6', deptName: '手术室' },
  { id: 'unit5', orgId: 'org3', deptId: 'dept7', deptName: '康复科' },
]

// 模拟考勤人员数据
const mockAttendancePersons: AttendancePerson[] = [
  { id: 'p1', employeeId: 'e1', employeeCode: 'E001', employeeName: '张三', adminOrgId: 'org1', adminOrgName: '贵阳市xx医院总院区', adminDeptId: 'dept1', adminDeptName: '内科', attendanceUnitId: 'unit1', attendanceUnitName: '总院区-内科', attendanceDeptId: 'dept1', attendanceDeptName: '内科', checkIn: true, scheduling: true, status: true },
  { id: 'p2', employeeId: 'e2', employeeCode: 'E002', employeeName: '李四', adminOrgId: 'org1', adminOrgName: '贵阳市xx医院总院区', adminDeptId: 'dept1', adminDeptName: '内科', attendanceUnitId: 'unit1', attendanceUnitName: '总院区-内科', attendanceDeptId: 'dept1', attendanceDeptName: '内科', checkIn: true, scheduling: false, status: true },
  { id: 'p3', employeeId: 'e3', employeeCode: 'E003', employeeName: '王五', adminOrgId: 'org1', adminOrgName: '贵阳市xx医院总院区', adminDeptId: 'dept2', adminDeptName: '外科', attendanceUnitId: '', attendanceUnitName: '', attendanceDeptId: '', attendanceDeptName: '', checkIn: false, scheduling: false, status: false },
  { id: 'p4', employeeId: 'e4', employeeCode: 'E004', employeeName: '赵六', adminOrgId: 'org1', adminOrgName: '贵阳市xx医院总院区', adminDeptId: 'dept4', adminDeptName: '急诊科', attendanceUnitId: 'unit2', attendanceUnitName: '总院区-急诊科', attendanceDeptId: 'dept4', attendanceDeptName: '急诊科', checkIn: true, scheduling: true, status: true },
  { id: 'p5', employeeId: 'e5', employeeCode: 'E005', employeeName: '钱七', adminOrgId: 'org2', adminOrgName: '贵阳市xx医院南院区', adminDeptId: 'dept5', adminDeptName: 'ICU', attendanceUnitId: 'unit3', attendanceUnitName: '南院区-ICU', attendanceDeptId: 'dept5', attendanceDeptName: 'ICU', checkIn: true, scheduling: true, status: true },
  { id: 'p6', employeeId: 'e6', employeeCode: 'E006', employeeName: '孙八', adminOrgId: 'org2', adminOrgName: '贵阳市xx医院南院区', adminDeptId: 'dept6', adminDeptName: '手术室', attendanceUnitId: 'unit4', attendanceUnitName: '南院区-手术室', attendanceDeptId: 'dept6', attendanceDeptName: '手术室', checkIn: true, scheduling: false, status: true },
  { id: 'p7', employeeId: 'e7', employeeCode: 'E007', employeeName: '周九', adminOrgId: 'org3', adminOrgName: '贵阳市xx医院北院区', adminDeptId: 'dept7', adminDeptName: '康复科', attendanceUnitId: 'unit5', attendanceUnitName: '北院区-康复科', attendanceDeptId: 'dept7', attendanceDeptName: '康复科', checkIn: false, scheduling: true, status: false },
]

const AttendancePersonPage: React.FC = () => {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>('org1') // 默认选择总院区
  const [searchText, setSearchText] = useState('')
  const [filterCode, setFilterCode] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterStatus, setFilterStatus] = useState<boolean | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editPerson, setEditPerson] = useState<AttendancePerson | null>(null)
  const [editForm] = Form.useForm()
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['org1'])
  const [loadingSwitch, setLoadingSwitch] = useState<string | null>(null)

  // 筛选后的人员列表
  const filteredPersons = useMemo(() => {
    let result = [...mockAttendancePersons]

    // 按科室筛选
    if (selectedDeptId) {
      result = result.filter(p => p.adminDeptId === selectedDeptId)
    }

    // 按工号筛选
    if (filterCode) {
      result = result.filter(p => p.employeeCode.toLowerCase().includes(filterCode.toLowerCase()))
    }

    // 按姓名筛选
    if (filterName) {
      result = result.filter(p => p.employeeName.toLowerCase().includes(filterName.toLowerCase()))
    }

    // 按状态筛选
    if (filterStatus !== null) {
      result = result.filter(p => p.status === filterStatus)
    }

    return result
  }, [selectedDeptId, filterCode, filterName, filterStatus])

  // 根据选择的考勤单位获取可选的考勤科室
  const getAttendanceDeptOptions = useCallback((orgId: string) => {
    const org = mockOrgs.find(o => o.id === orgId)
    if (!org) return []
    return org.children?.map(dept => ({
      label: dept.name,
      value: dept.id,
    })) || []
  }, [])

  // 树节点点击处理
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string
      if (key.startsWith('dept')) {
        setSelectedDeptId(key)
        // 找到对应的机构ID
        for (const org of mockOrgs) {
          if (org.children?.some(d => d.id === key)) {
            setSelectedOrgId(org.id)
            break
          }
        }
      }
    } else {
      setSelectedDeptId(null)
      setSelectedOrgId(null)
    }
  }

  // 机构切换处理
  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId || null)
    setSelectedDeptId(null)
    if (orgId) {
      setExpandedKeys([orgId])
    } else {
      setExpandedKeys([])
    }
  }

  // 获取当前机构下的科室树数据
  const getCurrentOrgTreeData = useCallback(() => {
    if (!selectedOrgId) return []
    const org = mockOrgs.find(o => o.id === selectedOrgId)
    if (!org) return []
    return [{
      key: org.id,
      title: org.name,
      selectable: false,
      children: org.children?.map(dept => ({
        key: dept.id,
        title: (
          <span className="flex items-center gap-2">
            {dept.name}
            <Badge count={dept.employeeCount} size="small" style={{ backgroundColor: '#9ca3af' }} />
          </span>
        ),
      })) || [],
    }]
  }, [selectedOrgId])

  // 获取考勤单位选项（使用机构名称）
  const getAttendanceUnitOptions = useMemo(() => {
    return mockOrgs.map(org => ({
      label: org.name,
      value: org.id,
    }))
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '工号',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
    },
    {
      title: '行政单位',
      dataIndex: 'adminOrgName',
      key: 'adminOrgName',
      width: 160,
    },
    {
      title: '行政科室',
      dataIndex: 'adminDeptName',
      key: 'adminDeptName',
      width: 120,
    },
    {
      title: '考勤单位',
      dataIndex: 'attendanceUnitName',
      key: 'attendanceUnitName',
      width: 140,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: '考勤单元',
      dataIndex: 'attendanceDeptName',
      key: 'attendanceDeptName',
      width: 120,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: '打卡',
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 80,
      render: (checked: boolean, record: AttendancePerson) => (
        <Switch
          checked={checked}
          disabled={!record.status}
          loading={loadingSwitch === `${record.id}-checkIn`}
          onChange={(value) => handleSwitchChange(record.id, 'checkIn', value)}
          size="small"
        />
      ),
    },
    {
      title: '排班',
      dataIndex: 'scheduling',
      key: 'scheduling',
      width: 80,
      render: (checked: boolean, record: AttendancePerson) => (
        <Switch
          checked={checked}
          disabled={!record.status}
          loading={loadingSwitch === `${record.id}-scheduling`}
          onChange={(value) => handleSwitchChange(record.id, 'scheduling', value)}
          size="small"
        />
      ),
    },
    {
      title: '考勤组',
      key: 'attendanceGroup',
      width: 120,
      render: () => '灵活打卡组',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: boolean) => (
        <Tag
          style={{
            backgroundColor: status ? '#E8F5E9' : '#FFF7E6',
            borderColor: status ? '#4CAF50' : '#FF9800',
            color: status ? '#2E7D32' : '#E65100',
          }}
        >
          {status ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: AttendancePerson) => (
        <Button
          size="small"
          onClick={() => handleEdit(record)}
          className="!bg-blue-100 !border-blue-300 !text-blue-600 !font-medium hover:!bg-blue-200 !text-xs"
        >
          修改
        </Button>
      ),
    },
  ]

  // 开关切换处理
  const handleSwitchChange = async (personId: string, field: 'checkIn' | 'scheduling', value: boolean) => {
    setLoadingSwitch(`${personId}-${field}`)
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = mockAttendancePersons.findIndex(p => p.id === personId)
    if (index !== -1) {
      mockAttendancePersons[index] = {
        ...mockAttendancePersons[index],
        [field]: value,
      }
    }
    setLoadingSwitch(null)
    message.success('保存成功')
  }

  // 修改考勤属性
  const handleEdit = (person: AttendancePerson) => {
    setEditPerson(person)
    // 找到考勤单位对应的机构并设置
    for (const org of mockOrgs) {
      const dept = org.children?.find(d => d.id === person.attendanceDeptId)
      if (dept) {
        setSelectedOrgId(org.id)
        break
      }
    }
    editForm.setFieldsValue({
      employeeCode: person.employeeCode,
      employeeName: person.employeeName,
      adminOrgName: person.adminOrgName,
      adminDeptName: person.adminDeptName,
      attendanceUnitId: person.attendanceUnitId || 'org1', // 默认选择第一个
      attendanceDeptId: person.attendanceDeptId,
      checkIn: person.checkIn,
      scheduling: person.scheduling,
      attendanceGroup: person.attendanceGroup || undefined,
      status: person.status,
    })
    setDrawerVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      
      const index = mockAttendancePersons.findIndex(p => p.id === editPerson?.id)
      if (index !== -1) {
        const unit = mockAttendanceUnits.find(u => u.id === values.attendanceUnitId)
        const dept = mockOrgs
          .flatMap(org => org.children?.map(d => ({ ...d, orgId: org.id })) || [])
          .find(d => d.id === values.attendanceDeptId)
        
        const checkIn = values.status ? (values.checkIn || false) : false
        const scheduling = values.status ? (values.scheduling || false) : false
        
        mockAttendancePersons[index] = {
          ...mockAttendancePersons[index],
          attendanceUnitId: values.attendanceUnitId || '',
          attendanceUnitName: unit?.deptName || '',
          attendanceDeptId: values.attendanceDeptId || '',
          attendanceDeptName: dept?.name || '',
          checkIn,
          scheduling,
          attendanceGroup: checkIn ? (values.attendanceGroup || undefined) : undefined,
          status: values.status,
        }
      }
      message.success('修改成功')
      setDrawerVisible(false)
    } catch (error) {
      console.error('表单验证失败', error)
    }
  }

  // 状态切换二次确认
  const handleStatusChange = (value: boolean) => {
    if (!value) {
      Modal.confirm({
        title: '确认停用',
        content: '停用后将关闭打卡和排班，确认继续？',
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          editForm.setFieldsValue({ status: false })
          handleSubmit()
        },
      })
    } else {
      editForm.setFieldsValue({ status: true })
    }
  }

  // 重置筛选
  const handleReset = () => {
    setFilterCode('')
    setFilterName('')
    setFilterStatus(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* 左右分栏布局 */}
      <div className="flex gap-3 flex-1 p-2" style={{ minHeight: 0 }}>
        {/* 左侧面板——机构科室树 */}
        <div className="w-60 border border-gray-200 rounded-lg flex flex-col bg-white overflow-hidden shadow-sm h-[calc(100%-16px)]">
          {/* 机构切换 */}
          <div className="p-2">
            <Select
              placeholder="请选择机构"
              value={selectedOrgId}
              onChange={handleOrgChange}
              style={{ width: '100%', height: 32 }}
              size="small"
              allowClear
              options={mockOrgs.map(org => ({
                label: org.name,
                value: org.id,
              }))}
            />
          </div>
          {/* 搜索框 */}
          <div className="p-2">
            <Input
              placeholder="搜索科室"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              size="small"
              style={{ height: 32 }}
              disabled={!selectedOrgId}
            />
          </div>
          {/* 树形结构 - 只在选择了机构后显示 */}
          {selectedOrgId && (
            <div className="flex-1 overflow-auto p-2">
              <Tree
                treeData={getCurrentOrgTreeData()}
                selectedKeys={selectedDeptId ? [selectedDeptId] : []}
                expandedKeys={expandedKeys}
                onSelect={handleTreeSelect}
                onExpand={setExpandedKeys}
                blockNode
                className="attendance-tree"
              />
            </div>
          )}
          {!selectedOrgId && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              请先选择机构
            </div>
          )}
        </div>

        {/* 右侧面板——人员列表 */}
        <div className="flex-1 border border-gray-200 rounded-lg flex flex-col overflow-hidden bg-white shadow-sm h-[calc(100%-16px)]">
          {/* 筛选栏 */}
          <div className="p-3 flex items-center justify-end flex-wrap gap-2">
            <Space size="small" wrap>
              <Input
                placeholder="工号"
                value={filterCode}
                onChange={e => setFilterCode(e.target.value)}
                style={{ width: 100, height: 32 }}
                allowClear
                size="small"
              />
              <Input
                placeholder="姓名"
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                style={{ width: 80, height: 32 }}
                allowClear
                size="small"
              />
              <Select
                placeholder="状态"
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 90, height: 32 }}
                allowClear
                size="small"
                options={[
                  { label: '启用', value: true },
                  { label: '停用', value: false },
                ]}
              />
              <Button size="small" type="primary" onClick={() => {}} style={{ height: 32 }}>
                查询
              </Button>
              <Button size="small" onClick={handleReset} style={{ height: 32 }}>
                重置
              </Button>
            </Space>
          </div>

          {/* 表格 */}
          <div className="flex-1 overflow-auto p-3">
            <Table
              columns={columns}
              dataSource={filteredPersons}
              rowKey="id"
              pagination={{
                pageSize: 20,
                defaultCurrent: 1,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                position: ['bottomLeft'],
              }}
              size="middle"
              locale={{ emptyText: selectedDeptId ? '暂无数据' : '请先选择科室' }}
            />
          </div>
        </div>
      </div>

      {/* 修改抽屉 */}
      <Drawer
        title={editPerson ? `修改考勤属性 - ${editPerson.employeeName}` : '修改考勤属性'}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={480}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              确认
            </Button>
          </div>
        }
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          {/* 所属单位 - 置灰只读 */}
          <Form.Item label="所属单位">
            <Input value={editPerson?.adminOrgName} readOnly className="!bg-gray-50" />
          </Form.Item>

          {/* 行政科室 - 置灰只读 */}
          <Form.Item label="行政科室">
            <Input value={editPerson?.adminDeptName} readOnly className="!bg-gray-50" />
          </Form.Item>

          {/* 工号 - 置灰只读 */}
          <Form.Item label="工号">
            <Input value={editPerson?.employeeCode} readOnly className="!bg-gray-50" />
          </Form.Item>

          {/* 姓名 - 置灰只读 */}
          <Form.Item label="姓名">
            <Input value={editPerson?.employeeName} readOnly className="!bg-gray-50" />
          </Form.Item>

          {/* 考勤单位 */}
          <Form.Item
            name="attendanceUnitId"
            label="考勤单位"
          >
            <Select
              placeholder="请选择考勤单位"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={getAttendanceUnitOptions}
              onChange={() => editForm.setFieldsValue({ attendanceDeptId: undefined })}
            />
          </Form.Item>

          {/* 考勤单元 */}
          <Form.Item
            name="attendanceDeptId"
            label="考勤单元"
          >
            <Select
              placeholder="请选择考勤单元"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={getAttendanceDeptOptions(selectedOrgId || '')}
            />
          </Form.Item>

          {/* 打卡 + 考勤组 一行布局 */}
          <div className="flex gap-4 items-end">
            {/* 打卡 */}
            <Form.Item
              name="checkIn"
              label="打卡"
              valuePropName="checked"
              className="!mb-0"
            >
              <Switch
                size="small"
                onChange={(checked) => {
                  if (!checked) {
                    editForm.setFieldsValue({ attendanceGroup: undefined })
                  }
                }}
              />
            </Form.Item>

            {/* 考勤组 - 开启打卡后才显示 */}
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.checkIn !== curr.checkIn}
            >
              {({ getFieldValue }) =>
                getFieldValue('checkIn') ? (
                  <Form.Item
                    name="attendanceGroup"
                    label="考勤组"
                    className="!mb-0"
                  >
                    <Select
                      placeholder="请选择考勤组"
                      style={{ width: 140 }}
                      options={[
                        { label: '灵活打卡组', value: 'flexible' },
                        { label: '固定打卡组', value: 'fixed' },
                      ]}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </div>

          {/* 排班 */}
          <Form.Item
            name="scheduling"
            label="排班"
            valuePropName="checked"
          >
            <Switch size="small" />
          </Form.Item>

          {/* 状态 */}
          <Form.Item label="状态">
            <div>
              <span className="mr-4">
                <input
                  type="radio"
                  id="status-enable"
                  checked={editForm.getFieldValue('status') === true}
                  onChange={() => handleStatusChange(true)}
                  className="mr-1"
                />
                <label htmlFor="status-enable">启用</label>
              </span>
              <span>
                <input
                  type="radio"
                  id="status-disable"
                  checked={editForm.getFieldValue('status') === false}
                  onChange={() => handleStatusChange(false)}
                  className="mr-1"
                />
                <label htmlFor="status-disable">停用</label>
              </span>
            </div>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default AttendancePersonPage
