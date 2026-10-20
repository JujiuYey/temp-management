import React, { useState, useMemo } from 'react'
import {
  Button,
  Table,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Drawer,
  Form,
  Radio,
  Tabs,
  InputNumber,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'

const { TabPane } = Tabs

// 类型定义
interface LeaveGrantRule {
  id: string
  code: string
  name: string
  projectCode: string
  projectName: string
  grantCycle: 'year' | 'month' | 'once'
  fixedDate: string
  unit: 'day' | 'hour'
  gender: 'male' | 'female' | 'all'
  employeeStatus: string[]
  employmentType: string[]
  departments: string[]
  positions: string[]
  valueType: 'total' | 'unitContinuous' | 'unitCumulative' | 'childAge'
  balanceType: 'cumulative' | 'clear'
  status: boolean
  remark?: string
}

interface WorkAgeRule {
  id: string
  minYears: number
  maxYears: number | null
  leaveDays: number
}

interface WorkAgeDeductRule {
  id: string
  minYears: number
  maxYears: number | null
  minAbsenceDays: number
  maxAbsenceDays: number | null
  deductDays: number
}

interface ChildAgeRule {
  id: string
  minAge: number
  maxAge: number | null
  leaveDays: number
}

// 模拟数据
const mockRules: LeaveGrantRule[] = [
  {
    id: 'r1',
    code: 'AL001',
    name: '年假发放规则-按工龄',
    projectCode: 'AL',
    projectName: '年假',
    grantCycle: 'year',
    fixedDate: '01-01',
    unit: 'day',
    gender: 'all',
    employeeStatus: ['active'],
    employmentType: ['formal', 'contract'],
    departments: [],
    positions: [],
    valueType: 'unitCumulative',
    balanceType: 'cumulative',
    status: true,
    remark: '按本单位累计工龄计算年假天数',
  },
  {
    id: 'r2',
    code: 'ML001',
    name: '婚假发放规则',
    projectCode: 'ML',
    projectName: '婚假',
    grantCycle: 'once',
    fixedDate: '',
    unit: 'day',
    gender: 'all',
    employeeStatus: ['active'],
    employmentType: ['formal', 'contract'],
    departments: [],
    positions: [],
    valueType: 'total',
    balanceType: 'clear',
    status: true,
  },
]

const mockWorkAgeRules: Record<string, WorkAgeRule[]> = {
  r1: [
    { id: 'w1', minYears: 0, maxYears: 1, leaveDays: 0 },
    { id: 'w2', minYears: 1, maxYears: 10, leaveDays: 5 },
    { id: 'w3', minYears: 10, maxYears: 20, leaveDays: 10 },
    { id: 'w4', minYears: 20, maxYears: null, leaveDays: 15 },
  ],
}

const mockWorkAgeDeductRules: Record<string, WorkAgeDeductRule[]> = {
  r1: [
    { id: 'd1', minYears: 0, maxYears: 10, minAbsenceDays: 0, maxAbsenceDays: 3, deductDays: 0 },
    { id: 'd2', minYears: 0, maxYears: 10, minAbsenceDays: 3, maxAbsenceDays: 5, deductDays: 1 },
    { id: 'd3', minYears: 0, maxYears: 10, minAbsenceDays: 5, maxAbsenceDays: null, deductDays: 2 },
  ],
}

const mockChildAgeRules: Record<string, ChildAgeRule[]> = {}

const LeaveRulesPage: React.FC = () => {
  const [rules, setRules] = useState<LeaveGrantRule[]>(mockRules)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null)
  const [selectedRule, setSelectedRule] = useState<LeaveGrantRule | null>(null)
  const [isNewRule, setIsNewRule] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('basic')

  // 工龄发放规则数据
  const [workAgeRules, setWorkAgeRules] = useState<WorkAgeRule[]>([])
  const [workAgeDeductRules, setWorkAgeDeductRules] = useState<WorkAgeDeductRule[]>([])
  const [childAgeRules, setChildAgeRules] = useState<ChildAgeRule[]>([])

  // 各规则标签页独立假期单位
  const [workAgeUnit, setWorkAgeUnit] = useState<'day' | 'hour'>('day')
  const [workAgeDeductUnit, setWorkAgeDeductUnit] = useState<'day' | 'hour'>('day')
  const [childAgeUnit, setChildAgeUnit] = useState<'day' | 'hour'>('day')

  // 筛选数据
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchSearch = !searchText || r.name.includes(searchText) || r.code.includes(searchText)
      const matchStatus = statusFilter === null || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [rules, searchText, statusFilter])

  // 打开新增抽屉
  const handleAddNew = () => {
    setSelectedRule(null)
    setIsNewRule(true)
    setActiveTab('basic')
    form.resetFields()
    form.setFieldsValue({
      unit: 'day',
      grantCycle: 'year',
      balanceType: 'cumulative',
      status: true,
    })
    setWorkAgeRules([])
    setWorkAgeDeductRules([])
    setChildAgeRules([])
    setWorkAgeUnit('day')
    setWorkAgeDeductUnit('day')
    setChildAgeUnit('day')
    setDrawerVisible(true)
  }

  // 打开修改抽屉
  const handleEdit = (rule: LeaveGrantRule) => {
    setSelectedRule(rule)
    setIsNewRule(false)
    setActiveTab('basic')
    setWorkAgeRules(mockWorkAgeRules[rule.id] || [])
    setWorkAgeDeductRules(mockWorkAgeDeductRules[rule.id] || [])
    setChildAgeRules(mockChildAgeRules[rule.id] || [])
    setWorkAgeUnit(rule.unit || 'day')
    setWorkAgeDeductUnit(rule.unit || 'day')
    setChildAgeUnit(rule.unit || 'day')
    form.setFieldsValue({
      ...rule,
      departments: rule.departments,
      positions: rule.positions,
    })
    setDrawerVisible(true)
  }

  // 保存规则
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (isNewRule) {
        // 新增规则
        const newRule: LeaveGrantRule = {
          id: `r${Date.now()}`,
          code: values.code || `R${Date.now()}`,
          name: values.name,
          projectCode: '',
          projectName: '',
          grantCycle: values.grantCycle || 'year',
          fixedDate: values.fixedDate || '',
          unit: values.unit || 'day',
          gender: values.gender || 'all',
          employeeStatus: values.employeeStatus || [],
          employmentType: values.employmentType || [],
          departments: values.departments || [],
          positions: values.positions || [],
          valueType: values.valueType || 'total',
          balanceType: values.balanceType || 'cumulative',
          status: values.status !== undefined ? values.status : true,
          remark: values.remark,
        }
        setRules([newRule, ...rules])
        message.success('新增成功')
      } else if (selectedRule) {
        // 修改规则
        const updatedRule: LeaveGrantRule = {
          ...selectedRule,
          code: values.code,
          name: values.name,
          grantCycle: values.grantCycle,
          fixedDate: values.fixedDate || '',
          unit: values.unit,
          gender: values.gender,
          employeeStatus: values.employeeStatus || [],
          employmentType: values.employmentType || [],
          departments: values.departments || [],
          positions: values.positions || [],
          valueType: values.valueType,
          balanceType: values.balanceType,
          status: values.status !== undefined ? values.status : true,
          remark: values.remark,
        }
        setRules(rules.map(r => r.id === updatedRule.id ? updatedRule : r))
        setSelectedRule(updatedRule)
        message.success('保存成功')
      }
      setDrawerVisible(false)
    } catch (error) {
      console.error('验证失败', error)
    }
  }

  // 删除规则
  const handleDelete = (rule: LeaveGrantRule) => {
    if (rule.status) {
      message.warning('已启用的规则无法删除')
      return
    }
    setRules(rules.filter(r => r.id !== rule.id))
    message.success('删除成功')
  }

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false)
    setSelectedRule(null)
  }

  // 列表页
  const renderListPage = () => (
    <div>
      {/* 第一行：新增按钮 + 右侧查询条件 */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddNew}
          style={{ height: 32 }}
          className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600"
        >
          新增规则
        </Button>
        <Space size="middle" wrap>
          <Input
            placeholder="规则名称/编码"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 180, height: 32 }}
          />
          <Select
            placeholder="状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 100 }}
            options={[
              { label: '启用', value: true },
              { label: '停用', value: false },
            ]}
          />
          <Button type="primary" style={{ height: 32 }}>查询</Button>
          <Button style={{ height: 32 }} onClick={() => {
            setSearchText('')
            setStatusFilter(null)
          }}>重置</Button>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={[
          { title: '规则编码', dataIndex: 'code', key: 'code', width: 120 },
          { title: '规则名称', dataIndex: 'name', key: 'name', width: 180 },
          {
            title: '发放周期',
            dataIndex: 'grantCycle',
            key: 'grantCycle',
            width: 80,
            render: (v: string) => ({ year: '年', month: '月', once: '次' }[v]),
          },
          {
            title: '适用性别',
            dataIndex: 'gender',
            key: 'gender',
            width: 80,
            render: (v: string) => ({ male: '男', female: '女', all: '不限' }[v]),
          },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (status: boolean) => (
              <Tag color={status ? 'success' : 'default'}>
                {status ? '启用' : '停用'}
              </Tag>
            ),
          },
          {
            title: '操作',
            key: 'action',
            width: 200,
            fixed: 'right',
            render: (_: unknown, record: LeaveGrantRule) => (
              <Space size="middle">
                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  className="!bg-blue-600"
                >
                  修改
                </Button>
                <Popconfirm
                  title="确定删除该规则？"
                  onConfirm={() => handleDelete(record)}
                  disabled={record.status}
                >
                  <Button
                    size="small"
                    danger
                    disabled={record.status}
                    icon={<DeleteOutlined />}
                    title={record.status ? '已启用的规则无法删除' : '删除'}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        dataSource={filteredRules}
        rowKey="id"
        pagination={{
          pageSize: 20,
          defaultCurrent: 1,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
          position: ['bottomLeft'],
        }}
        size="middle"
        locale={{ emptyText: '暂无规则' }}
      />
    </div>
  )

  return (
    <div>
      {renderListPage()}

      {/* 新增/修改规则抽屉 */}
      <Drawer
        title={isNewRule ? '新增规则' : '修改规则'}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        width={720}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseDrawer}>取消</Button>
            <Button type="primary" onClick={handleSave} className="!bg-blue-600">
              保存
            </Button>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本信息" key="basic">
            <Form
              form={form}
              layout="vertical"
            >
              {/* 第1行：编码、规则名称 */}
              <div className="grid grid-cols-2 gap-x-6">
                <Form.Item
                  name="code"
                  label={<span className="font-bold">规则编码</span>}
                >
                  <Input placeholder="请输入规则编码" style={{ height: 32 }} />
                </Form.Item>
                <Form.Item
                  name="name"
                  label={<span className="font-bold">规则名称</span>}
                >
                  <Input placeholder="请输入规则名称" style={{ height: 32 }} />
                </Form.Item>
              </div>

              {/* 第2行：规则依据、余额处理 */}
              <div className="grid grid-cols-2 gap-x-6">
                <Form.Item
                  name="valueType"
                  label={<span className="font-bold">规则依据</span>}
                >
                  <Select
                    placeholder="请选择规则依据"
                    options={[
                      { label: '按累计总工龄', value: 'total' },
                      { label: '按本单位连续工龄', value: 'unitContinuous' },
                      { label: '按本单位累计工龄', value: 'unitCumulative' },
                      { label: '按子女年龄', value: 'childAge' },
                    ]}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item
                  name="balanceType"
                  label={<span className="font-bold">余额处理</span>}
                >
                  <Select
                    placeholder="请选择余额处理方式"
                    options={[
                      { label: '余额累计', value: 'cumulative' },
                      { label: '余额清零', value: 'clear' },
                    ]}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>

              {/* 第3行：发放周期、固定发放日期 */}
              <div className="grid grid-cols-2 gap-x-6">
                <Form.Item
                  name="grantCycle"
                  label={<span className="font-bold">发放周期</span>}
                >
                  <Select
                    placeholder="请选择发放周期"
                    options={[
                      { label: '年', value: 'year' },
                      { label: '月', value: 'month' },
                      { label: '次', value: 'once' },
                    ]}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item
                  name="fixedDate"
                  label={<span className="font-bold">指定发放日期</span>}
                >
                  <Input placeholder="如：01-01" style={{ height: 32 }} />
                </Form.Item>
              </div>

              {/* 第4行：备注独占 */}
              <Form.Item name="remark" label={<span className="font-bold">备注</span>}>
                <Input.TextArea rows={3} placeholder="请输入备注信息" />
              </Form.Item>

              {/* 第5行：状态独占 */}
              <Form.Item
                name="status"
                label={<span className="font-bold">状态</span>}
                valuePropName="checked"
              >
                <Radio.Group>
                  <Radio value={true}>启用</Radio>
                  <Radio value={false}>停用</Radio>
                </Radio.Group>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="适用范围" key="scope">
            <Form form={form} layout="vertical">
              <Form.Item
                name="gender"
                label={<span className="font-bold">适用性别</span>}
              >
                <Select
                  placeholder="请选择适用性别"
                  options={[
                    { label: '男', value: 'male' },
                    { label: '女', value: 'female' },
                    { label: '不限', value: 'all' },
                  ]}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="employeeStatus"
                label={<span className="font-bold">适用人员状态</span>}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择人员状态"
                  options={[
                    { label: '在职', value: 'active' },
                    { label: '离职', value: 'leave' },
                    { label: '退休', value: 'retire' },
                    { label: '停薪留职', value: 'suspend' },
                    { label: '待岗', value: 'waiting' },
                  ]}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="employmentType"
                label={<span className="font-bold">适用在职类型</span>}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择在职类型"
                  options={[
                    { label: '正式', value: 'formal' },
                    { label: '合同', value: 'contract' },
                    { label: '临聘', value: 'temp' },
                    { label: '返聘', value: 'rehire' },
                    { label: '实习', value: 'intern' },
                    { label: '派遣', value: 'dispatch' },
                  ]}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="departments"
                label={<span className="font-bold">适用科室</span>}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择科室"
                  style={{ width: '100%' }}
                  options={[
                    { label: '内科', value: 'dept1' },
                    { label: '外科', value: 'dept2' },
                    { label: '儿科', value: 'dept3' },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="positions"
                label={<span className="font-bold">适用岗位</span>}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择岗位"
                  style={{ width: '100%' }}
                  options={[
                    { label: '医生', value: 'pos1' },
                    { label: '护士', value: 'pos2' },
                    { label: '行政', value: 'pos3' },
                  ]}
                />
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="工龄发放规则" key="workAge">
              <div className="mb-3 flex items-center justify-between">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setWorkAgeRules([
                      ...workAgeRules,
                      { id: `w${Date.now()}`, minYears: 0, maxYears: null, leaveDays: 0 },
                    ])
                  }}
                  style={{ height: 32 }}
                >
                  新增行
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">单位</span>
                  <Select
                    value={workAgeUnit}
                    onChange={(val) => setWorkAgeUnit(val)}
                    options={[
                      { label: '天', value: 'day' },
                      { label: '时', value: 'hour' },
                    ]}
                    style={{ width: 80 }}
                  />
                </div>
              </div>
              <Table
                size="small"
                dataSource={workAgeRules}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '工龄下限（年）',
                    dataIndex: 'minYears',
                    key: 'minYears',
                    width: 150,
                    render: (v: number, record: WorkAgeRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v}
                        onChange={(val) => {
                          const newData = workAgeRules.map(item =>
                            item.id === record.id ? { ...item, minYears: val ?? 0 } : item
                          )
                          setWorkAgeRules(newData)
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '工龄上限（年）',
                    dataIndex: 'maxYears',
                    key: 'maxYears',
                    width: 150,
                    render: (v: number | null, record: WorkAgeRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v ?? undefined}
                        placeholder="不限"
                        onChange={(val) => {
                          const newData = workAgeRules.map(item =>
                            item.id === record.id ? { ...item, maxYears: val ?? null } : item
                          )
                          setWorkAgeRules(newData)
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '假期发放天数',
                    dataIndex: 'leaveDays',
                    key: 'leaveDays',
                    width: 150,
                    render: (v: number, record: WorkAgeRule) => (
                      <InputNumber
                        min={0}
                        max={365}
                        precision={1}
                        value={v}
                        onChange={(val) => {
                          const newData = workAgeRules.map(item =>
                            item.id === record.id ? { ...item, leaveDays: val ?? 0 } : item
                          )
                          setWorkAgeRules(newData)
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 80,
                    render: (_: unknown, record: WorkAgeRule) => (
                      <Button
                        size="small"
                        danger
                        onClick={() => {
                          setWorkAgeRules(workAgeRules.filter(item => item.id !== record.id))
                        }}
                      >
                        删除
                      </Button>
                    ),
                  },
                ]}
              />
            </TabPane>

          <TabPane tab="工龄扣除规则" key="workAgeDeduct">
              <div className="mb-3 flex items-center justify-between">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setWorkAgeDeductRules([
                      ...workAgeDeductRules,
                      { id: `d${Date.now()}`, minYears: 0, maxYears: null, minAbsenceDays: 0, maxAbsenceDays: null, deductDays: 0 },
                    ])
                  }}
                  style={{ height: 32 }}
                >
                  新增行
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">单位</span>
                  <Select
                    value={workAgeDeductUnit}
                    onChange={(val) => setWorkAgeDeductUnit(val)}
                    options={[
                      { label: '天', value: 'day' },
                      { label: '时', value: 'hour' },
                    ]}
                    style={{ width: 80 }}
                  />
                </div>
              </div>
              <div className="text-gray-400 text-sm mb-3">
                取上一年缺勤天数计算本年度应扣数量
              </div>
              <Table
                size="small"
                dataSource={workAgeDeductRules}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '工龄下限（年）',
                    dataIndex: 'minYears',
                    key: 'minYears',
                    width: 120,
                    render: (v: number, record: WorkAgeDeductRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v}
                        onChange={(val) => {
                          setWorkAgeDeductRules(workAgeDeductRules.map(item =>
                            item.id === record.id ? { ...item, minYears: val ?? 0 } : item
                          ))
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '工龄上限（年）',
                    dataIndex: 'maxYears',
                    key: 'maxYears',
                    width: 120,
                    render: (v: number | null, record: WorkAgeDeductRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v ?? undefined}
                        placeholder="不限"
                        onChange={(val) => {
                          setWorkAgeDeductRules(workAgeDeductRules.map(item =>
                            item.id === record.id ? { ...item, maxYears: val ?? null } : item
                          ))
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '缺勤天数下限',
                    dataIndex: 'minAbsenceDays',
                    key: 'minAbsenceDays',
                    width: 130,
                    render: (v: number, record: WorkAgeDeductRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v}
                        onChange={(val) => {
                          setWorkAgeDeductRules(workAgeDeductRules.map(item =>
                            item.id === record.id ? { ...item, minAbsenceDays: val ?? 0 } : item
                          ))
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '缺勤天数上限',
                    dataIndex: 'maxAbsenceDays',
                    key: 'maxAbsenceDays',
                    width: 130,
                    render: (v: number | null, record: WorkAgeDeductRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v ?? undefined}
                        placeholder="不限"
                        onChange={(val) => {
                          setWorkAgeDeductRules(workAgeDeductRules.map(item =>
                            item.id === record.id ? { ...item, maxAbsenceDays: val ?? null } : item
                          ))
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '假期扣除天数',
                    dataIndex: 'deductDays',
                    key: 'deductDays',
                    width: 130,
                    render: (v: number, record: WorkAgeDeductRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v}
                        onChange={(val) => {
                          setWorkAgeDeductRules(workAgeDeductRules.map(item =>
                            item.id === record.id ? { ...item, deductDays: val ?? 0 } : item
                          ))
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 80,
                    render: (_: unknown, record: WorkAgeDeductRule) => (
                      <Button
                        size="small"
                        danger
                        onClick={() => {
                          setWorkAgeDeductRules(workAgeDeductRules.filter(item => item.id !== record.id))
                        }}
                      >
                        删除
                      </Button>
                    ),
                  },
                ]}
              />
            </TabPane>

          <TabPane tab="子女年龄规则" key="childAge">
              <div className="mb-3 flex items-center justify-between">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setChildAgeRules([
                      ...childAgeRules,
                      { id: `c${Date.now()}`, minAge: 0, maxAge: null, leaveDays: 0 },
                    ])
                  }}
                  style={{ height: 32 }}
                >
                  新增行
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">单位</span>
                  <Select
                    value={childAgeUnit}
                    onChange={(val) => setChildAgeUnit(val)}
                    options={[
                      { label: '天', value: 'day' },
                      { label: '时', value: 'hour' },
                    ]}
                    style={{ width: 80 }}
                  />
                </div>
              </div>
              <div className="text-gray-400 text-sm mb-3">
                子女年龄按周岁计算，3岁以下子女数量从人事档案获取
              </div>
              <Table
                size="small"
                dataSource={childAgeRules}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '子女年龄下限（周岁）',
                    dataIndex: 'minAge',
                    key: 'minAge',
                    width: 160,
                    render: (v: number, record: ChildAgeRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v}
                        onChange={(val) => {
                          setChildAgeRules(childAgeRules.map(item =>
                            item.id === record.id ? { ...item, minAge: val ?? 0 } : item
                          ))
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '子女年龄上限（周岁）',
                    dataIndex: 'maxAge',
                    key: 'maxAge',
                    width: 160,
                    render: (v: number | null, record: ChildAgeRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v ?? undefined}
                        placeholder="不限"
                        onChange={(val) => {
                          setChildAgeRules(childAgeRules.map(item =>
                            item.id === record.id ? { ...item, maxAge: val ?? null } : item
                          ))
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '假期发放天数',
                    dataIndex: 'leaveDays',
                    key: 'leaveDays',
                    width: 150,
                    render: (v: number, record: ChildAgeRule) => (
                      <InputNumber
                        min={0}
                        precision={1}
                        value={v}
                        onChange={(val) => {
                          setChildAgeRules(childAgeRules.map(item =>
                            item.id === record.id ? { ...item, leaveDays: val ?? 0 } : item
                          ))
                        }}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 80,
                    render: (_: unknown, record: ChildAgeRule) => (
                      <Button
                        size="small"
                        danger
                        onClick={() => {
                          setChildAgeRules(childAgeRules.filter(item => item.id !== record.id))
                        }}
                      >
                        删除
                      </Button>
                    ),
                  },
                ]}
                locale={{ emptyText: '暂无数据' }}
              />
            </TabPane>
        </Tabs>
      </Drawer>
    </div>
  )
}

export default LeaveRulesPage
