import React, { useState, useMemo } from 'react'
import {
  Button,
  Drawer,
  Form,
  Input,
  Radio,
  Table,
  InputNumber,
  Switch,
  message,
  Space,
  Popconfirm,
  Tag,
  Select,
  Popover,
  Divider,
  Tabs,
} from 'antd'
const { TabPane } = Tabs
import type { AttendanceProject, AttendanceCategory } from '../../types'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'

// 预设符号
const PRESET_SYMBOLS = ['√', '×', '△', '▽', '○', '◇', '□', '☆', '★', '◎', '●', '◉', '■', '▲', '▼', '◐', '◑', '◒', '◓', '⊕', '⊗', '⊙', '◘', '◙']

// 预设颜色
const PRESET_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
  '#1AB394', '#E6A23C', '#F56C6C', '#409EFF', '#909399',
]

// 考勤分类配置
const CATEGORY_CONFIG: Record<AttendanceCategory, { label: string; color: string }> = {
  leave: { label: '休假', color: '#1890ff' },
  overtime: { label: '加班', color: '#52c41a' },
  normal: { label: '正常', color: '#faad14' },
  abnormal: { label: '异常', color: '#f5222d' },
}

// 模拟考勤项目数据
const mockProjects: AttendanceProject[] = [
  {
    id: 'p1', code: 'AL', name: '年假', shortName: '年', symbol: '√', color: '#1890ff',
    category: 'leave', managementCycle: 'year', controlBalance: true, calculateAbsence: false,
    skipHoliday: true, skipWeekend: true, balanceManagement: 'clear', attachmentRequired: false, status: true, used: true,
  },
  {
    id: 'p2', code: 'SL', name: '病假', shortName: '病', symbol: '◇', color: '#faad14',
    category: 'leave', managementCycle: 'month', controlBalance: true, calculateAbsence: true,
    skipHoliday: false, skipWeekend: false, balanceManagement: 'extend', extendDays: 30, attachmentRequired: true, status: true, used: true,
  },
  {
    id: 'p3', code: 'ML', name: '婚假', shortName: '婚', symbol: '○', color: '#eb2f96',
    category: 'leave', managementCycle: 'once', controlBalance: false, calculateAbsence: false,
    skipHoliday: true, skipWeekend: true, balanceManagement: 'forever', attachmentRequired: true, status: true, used: false,
  },
  {
    id: 'p4', code: 'OT', name: '加班', shortName: '加', symbol: '★', color: '#52c41a',
    category: 'overtime', managementCycle: 'month', controlBalance: true, calculateAbsence: false,
    skipHoliday: false, skipWeekend: true, balanceManagement: 'extend', extendDays: 60, attachmentRequired: false, status: true, used: true,
  },
  {
    id: 'p5', code: 'WK', name: '上班', shortName: '上', symbol: '√', color: '#13c2c2',
    category: 'normal', managementCycle: 'year', controlBalance: false, calculateAbsence: false,
    skipHoliday: false, skipWeekend: false, balanceManagement: 'forever', attachmentRequired: false, status: true, used: true,
  },
  {
    id: 'p6', code: 'LATE', name: '迟到', shortName: '迟', symbol: '×', color: '#f5222d',
    category: 'abnormal', managementCycle: 'month', controlBalance: false, calculateAbsence: true,
    skipHoliday: false, skipWeekend: false, balanceManagement: 'clear', attachmentRequired: false, status: true, used: true,
  },
  {
    id: 'p7', code: 'EARLY', name: '早退', shortName: '退', symbol: '×', color: '#f5222d',
    category: 'abnormal', managementCycle: 'month', controlBalance: false, calculateAbsence: true,
    skipHoliday: false, skipWeekend: false, balanceManagement: 'clear', attachmentRequired: false, status: false, used: true,
  },
  {
    id: 'p8', code: 'ABSENT', name: '缺勤', shortName: '缺', symbol: '×', color: '#722ed1',
    category: 'abnormal', managementCycle: 'month', controlBalance: false, calculateAbsence: true,
    skipHoliday: false, skipWeekend: false, balanceManagement: 'clear', attachmentRequired: false, status: true, used: false,
  },
]

const AttendanceProjectPage: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [form] = Form.useForm()
  const [projects, setProjects] = useState<AttendanceProject[]>(mockProjects)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<AttendanceCategory | 'all'>('all')
  const [editProject, setEditProject] = useState<AttendanceProject | null>(null)
  const [symbolPopoverVisible, setSymbolPopoverVisible] = useState(false)
  const [colorPopoverVisible, setColorPopoverVisible] = useState(false)

  // 筛选后的数据
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = !searchText || p.name.includes(searchText) || p.code.includes(searchText)
      const matchStatus = statusFilter === null || p.status === statusFilter
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
  }, [projects, searchText, statusFilter, categoryFilter])

  // 打开新增抽屉
  const handleCreate = () => {
    setDrawerMode('create')
    setEditProject(null)
    form.resetFields()
    form.setFieldsValue({
      category: 'leave',
      managementCycle: 'month',
      controlBalance: false,
      calculateAbsence: false,
      skipHoliday: false,
      skipWeekend: false,
      attachmentRequired: false,
      status: true,
      minLeaveUnit: 'halfDay',
      grantConfirmType: 'manual',
      validPeriodType: 'attendanceCycle',
      expiryType: 'immediate',
    })
    setDrawerVisible(true)
  }

  // 打开修改抽屉
  const handleEdit = (project: AttendanceProject) => {
    setDrawerMode('edit')
    setEditProject(project)
    form.setFieldsValue({
      category: project.category,
      code: project.code,
      name: project.name,
      shortName: project.shortName,
      symbol: project.symbol,
      color: project.color,
      managementCycle: project.managementCycle,
      controlBalance: project.controlBalance,
      calculateAbsence: project.calculateAbsence,
      grantRule: project.grantRule,
      skipHoliday: project.skipHoliday,
      skipWeekend: project.skipWeekend,
      balanceManagement: project.balanceManagement,
      extendDays: project.extendDays,
      minLeaveUnit: project.minLeaveUnit,
      grantConfirmType: project.grantConfirmType,
      validPeriodType: project.validPeriodType,
      expiryType: project.expiryType,
      attachmentRequired: project.attachmentRequired,
      status: project.status,
    })
    setDrawerVisible(true)
  }

  // 删除项目
  const handleDelete = (project: AttendanceProject) => {
    if (project.used) {
      message.warning('该项目已被使用，无法删除')
      return
    }
    setProjects(projects.filter(p => p.id !== project.id))
    message.success('删除成功')
  }

  // 切换启停用
  const handleToggleStatus = (project: AttendanceProject) => {
    setProjects(projects.map(p =>
      p.id === project.id ? { ...p, status: !p.status } : p
    ))
    message.success(project.status ? '已停用' : '已启用')
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      if (drawerMode === 'create') {
        const newProject: AttendanceProject = {
          id: `p${Date.now()}`,
          code: values.code,
          name: values.name,
          shortName: values.shortName,
          symbol: values.symbol,
          color: values.color,
          category: values.category,
          managementCycle: values.managementCycle,
          controlBalance: values.controlBalance,
          calculateAbsence: values.calculateAbsence,
          grantRule: values.grantRule,
          skipHoliday: values.skipHoliday,
          skipWeekend: values.skipWeekend,
          balanceManagement: values.balanceManagement,
          extendDays: values.extendDays,
          attachmentRequired: values.attachmentRequired,
          status: values.status,
        }
        setProjects([...projects, newProject])
        message.success('新增成功')
      } else {
        setProjects(projects.map(p =>
          p.id === editProject?.id
            ? {
                ...p,
                code: values.code,
                name: values.name,
                shortName: values.shortName,
                symbol: values.symbol,
                color: values.color,
                category: values.category,
                managementCycle: values.managementCycle,
                controlBalance: values.controlBalance,
                calculateAbsence: values.calculateAbsence,
                grantRule: values.grantRule,
                skipHoliday: values.skipHoliday,
                skipWeekend: values.skipWeekend,
                balanceManagement: values.balanceManagement,
                extendDays: values.extendDays,
                attachmentRequired: values.attachmentRequired,
                status: values.status,
              }
            : p
        ))
        message.success('修改成功')
      }

      setDrawerVisible(false)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error('表单验证失败', error)
    }
  }

  // 表格列定义
  const columns: ColumnsType<AttendanceProject> = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '简称',
      dataIndex: 'shortName',
      key: 'shortName',
      width: 60,
    },
    {
      title: '符号',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 60,
      render: (symbol: string) => (
        <span style={{ fontSize: 16 }}>{symbol || '-'}</span>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      render: (color: string) => (
        color ? (
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        ) : '-'
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (category: AttendanceCategory) => (
        <Tag color={CATEGORY_CONFIG[category].color}>
          {CATEGORY_CONFIG[category].label}
        </Tag>
      ),
    },
    {
      title: '周期',
      dataIndex: 'managementCycle',
      key: 'managementCycle',
      width: 80,
      render: (cycle: string) => {
        const map: Record<string, string> = { year: '年', month: '月', once: '次' }
        return map[cycle] || cycle
      },
    },
    {
      title: '余额',
      dataIndex: 'controlBalance',
      key: 'controlBalance',
      width: 60,
      render: (val: boolean) => val ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: '#f5222d' }} />,
    },
    {
      title: '缺勤',
      dataIndex: 'calculateAbsence',
      key: 'calculateAbsence',
      width: 60,
      render: (val: boolean) => val ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: '#f5222d' }} />,
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
      width: 120,
      fixed: 'right',
      render: (_: unknown, record: AttendanceProject) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="!text-blue-600 !border-blue-300 hover:!bg-blue-50"
          >
            修改
          </Button>
          <Popconfirm
            title="确定删除该项目？"
            onConfirm={() => handleDelete(record)}
            disabled={record.used}
          >
            <Button
              size="small"
              danger
              disabled={record.used}
              title={record.used ? '该项目已被使用，无法删除' : '删除'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-3 px-2">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          style={{ height: 32 }}
          className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600"
        >
          新增项目
        </Button>
        <Space size="small">
          <Select
            placeholder="考勤分类"
            value={categoryFilter}
            onChange={setCategoryFilter}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '全部分类', value: 'all' },
              { label: '休假', value: 'leave' },
              { label: '加班', value: 'overtime' },
              { label: '正常', value: 'normal' },
              { label: '异常', value: 'abnormal' },
            ]}
          />
          <Input
            placeholder="搜索项目名称"
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
        </Space>
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto px-2">
        <Table
          columns={columns}
          dataSource={filteredProjects}
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
          locale={{ emptyText: '暂无数据' }}
        />
      </div>

      {/* 新增/修改抽屉 */}
      <Drawer
        title={drawerMode === 'create' ? '新增考勤项目' : '修改考勤项目'}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              保存
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="basic">
            {/* Tab1: 基础信息 */}
            <TabPane tab="基础信息" key="basic">
              <Form.Item
                name="category"
                label={<span className="font-bold">考勤分类</span>}
                rules={[{ required: true, message: '请选择考勤分类' }]}
              >
                <Radio.Group>
                  {(['leave', 'overtime', 'normal', 'abnormal'] as AttendanceCategory[]).map(cat => (
                    <Radio key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].label}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>

              {/* 名称独占一行 */}
              <Form.Item
                name="name"
                label={<span className="font-bold">名称</span>}
                rules={[{ required: true, message: '请输入考勤项目名称' }]}
              >
                <Input placeholder="如年假、婚假、迟到" style={{ height: 32 }} />
              </Form.Item>

              {/* 编码和简称在一行 */}
              <div className="flex gap-4">
                <Form.Item
                  name="code"
                  label={<span className="font-bold">编码</span>}
                  rules={[{ required: true, message: '请输入考勤项目编码' }]}
                  className="flex-1"
                >
                  <Input placeholder="请输入考勤项目编码" style={{ height: 32 }} />
                </Form.Item>

                <Form.Item
                  name="shortName"
                  label={<span className="font-bold">简称</span>}
                  className="flex-1"
                >
                  <Input placeholder="简短" maxLength={2} style={{ height: 32 }} />
                </Form.Item>
              </div>

              {/* 符号和颜色在一行 */}
              <div className="flex gap-4">
                <Form.Item
                  name="symbol"
                  label={<span className="font-bold">符号</span>}
                  className="flex-1"
                >
                  <Popover
                    content={
                      <div className="grid grid-cols-7 gap-1 w-[252px]">
                        {PRESET_SYMBOLS.map(s => (
                          <div
                            key={s}
                            onClick={() => {
                              form.setFieldValue('symbol', s)
                              setSymbolPopoverVisible(false)
                            }}
                            className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-blue-50 rounded text-lg"
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    }
                    trigger="click"
                    open={symbolPopoverVisible}
                    onOpenChange={setSymbolPopoverVisible}
                  >
                    <Input
                      placeholder="点击选择符号"
                      readOnly
                      style={{ height: 32, cursor: 'pointer' }}
                      suffix={<span className="text-gray-400">▼</span>}
                    />
                  </Popover>
                </Form.Item>

                <Form.Item
                  name="color"
                  label={<span className="font-bold">颜色</span>}
                  className="flex-1"
                >
                  <Popover
                    content={
                      <div className="flex flex-wrap gap-2 w-[280px]">
                        {PRESET_COLORS.map(c => (
                          <div
                            key={c}
                            onClick={() => {
                              form.setFieldValue('color', c)
                              setColorPopoverVisible(false)
                            }}
                            className="w-8 h-8 rounded cursor-pointer hover:ring-2 ring-blue-500"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <Form.Item name="color" noStyle>
                          <Input
                            placeholder="#000000"
                            style={{ height: 32 }}
                            maxLength={7}
                            onChange={(e) => {
                              const val = e.target.value
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                form.setFieldValue('color', val)
                              }
                            }}
                          />
                        </Form.Item>
                      </div>
                    }
                    trigger="click"
                    open={colorPopoverVisible}
                    onOpenChange={setColorPopoverVisible}
                  >
                    <Input
                      placeholder="点击选择颜色"
                      readOnly
                      style={{ height: 32, width: 120, cursor: 'pointer' }}
                      suffix={
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: form.getFieldValue('color') || '#fff' }}
                        />
                      }
                    />
                  </Popover>
                </Form.Item>
              </div>

              {/* 限额与是否算缺勤在一行 */}
              <div className="flex gap-4">
                <Form.Item
                  name="hasLimit"
                  label={<span className="font-bold">限额</span>}
                  valuePropName="checked"
                  className="!mb-0 flex-1"
                >
                  <Switch checkedChildren="有" unCheckedChildren="无" />
                </Form.Item>

                <Form.Item
                  name="calculateAbsence"
                  label={<span className="font-bold">是否算缺勤</span>}
                  valuePropName="checked"
                  className="!mb-0 flex-1"
                >
                  <Switch />
                </Form.Item>
              </div>

              {/* 最小请假单位 */}
              <Form.Item
                name="minLeaveUnit"
                label={<span className="font-bold">最小请假单位</span>}
                className="!mt-4"
              >
                <Radio.Group>
                  <Radio value="day">天</Radio>
                  <Radio value="halfDay">半天</Radio>
                </Radio.Group>
              </Form.Item>

              {/* 请假时跳过节假日、请假时跳过周末在一行 */}
              <div className="flex gap-4">
                <Form.Item
                  name="skipHoliday"
                  label={<span className="font-bold">请假时跳过节假日</span>}
                  valuePropName="checked"
                  className="!mb-0 flex-1"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="skipWeekend"
                  label={<span className="font-bold">请假时跳过周末</span>}
                  valuePropName="checked"
                  className="!mb-0 flex-1"
                >
                  <Switch />
                </Form.Item>
              </div>

              {/* 系统预设与状态在一行 */}
              <div className="flex gap-4 !mt-4">
                <Form.Item
                  name="isSystem"
                  label={<span className="font-bold">系统预设</span>}
                  valuePropName="checked"
                  className="!mb-0 flex-1"
                >
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>

                <Form.Item name="status" label={<span className="font-bold">状态</span>} className="!mb-0 flex-1">
                  <Radio.Group>
                    <Radio value={true}>启用</Radio>
                    <Radio value={false}>停用</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>
            </TabPane>

            {/* Tab2: 规则配置 */}
            <TabPane tab="规则配置" key="rules">
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.hasLimit !== curr.hasLimit}>
                {({ getFieldValue }) =>
                  getFieldValue('hasLimit') === false ? (
                    <div className="text-gray-400 text-center py-8">
                      该考勤项目未进行限额，无需配置规则
                    </div>
                  ) : (
                    <>
                      {/* 关联发放规则 */}
                      <Form.Item
                        name="grantRule"
                        label={<span className="font-bold">关联发放规则</span>}
                        className="flex-1"
                      >
                        <Select
                          placeholder="请选择发放规则"
                          allowClear
                          style={{ width: '100%', height: 32 }}
                          options={[
                            { label: '年假发放规则', value: 'annual_leave' },
                            { label: '婚假发放规则', value: 'marriage_leave' },
                            { label: '产假发放规则', value: 'maternity_leave' },
                            { label: '放射假发放规则', value: 'radiation_leave' },
                          ]}
                        />
                      </Form.Item>

                      {/* 发放方式 */}
                      <Form.Item
                        name="grantConfirmType"
                        label={<span className="font-bold">发放方式</span>}
                        className="!mt-4"
                      >
                          <Radio.Group>
                            <Radio value="auto">免确认</Radio>
                            <Radio value="manual">需确认</Radio>
                          </Radio.Group>
                      </Form.Item>

                      {/* 余额有效期 */}
                      <Form.Item
                        name="validPeriodType"
                        label={<span className="font-bold">余额有效期</span>}
                      >
                        <Radio.Group>
                          <Radio value="attendanceCycle">考勤周期内有效</Radio>
                          <Radio value="fixedCycle">发放后指定天数内有效</Radio>
                          <Radio value="permanent">永久有效</Radio>
                        </Radio.Group>
                      </Form.Item>

                      {/* 固定周期天数（条件显示） */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.validPeriodType !== curr.validPeriodType}
                      >
                        {({ getFieldValue }) =>
                          getFieldValue('validPeriodType') === 'fixedCycle' ? (
                            <Form.Item
                              name="validPeriodDays"
                              label={<span className="font-bold">有效天数</span>}
                            >
                              <InputNumber
                                min={1}
                                placeholder="请输入有效天数"
                                style={{ width: 200, height: 32 }}
                                addonAfter="天内有效"
                              />
                            </Form.Item>
                          ) : null
                        }
                      </Form.Item>

                      {/* 余额失效 */}
                      <Form.Item
                        name="expiryType"
                        label={<span className="font-bold">余额失效</span>}
                      >
                        <Radio.Group>
                          <Radio value="immediate">到期后立即失效</Radio>
                          <Radio value="delayed">到期后指定天数失效</Radio>
                        </Radio.Group>
                      </Form.Item>

                      {/* 失效天数（条件显示） */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.expiryType !== curr.expiryType}
                      >
                        {({ getFieldValue }) =>
                          getFieldValue('expiryType') === 'delayed' ? (
                            <Form.Item
                              name="expiryDays"
                              label={<span className="font-bold">失效天数</span>}
                            >
                              <InputNumber
                                min={1}
                                placeholder="请输入失效天数"
                                style={{ width: 200, height: 32 }}
                                addonAfter="天失效"
                              />
                            </Form.Item>
                          ) : null
                        }
                      </Form.Item>
                    </>
                  )
                }
              </Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </Drawer>
    </div>
  )
}

export default AttendanceProjectPage
