import React, { useState } from 'react'
import {
  Button,
  Table,
  Input,
  Select,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Radio,
  Switch,
  TimePicker,
  InputNumber,
  Tree,
  Drawer,
  Popconfirm,
  Checkbox,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

// 各机构科室数据
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

// 班次类型
interface ShiftClass {
  id: string
  code: string
  name: string
  category: string
  color: string
  personType: string
  personCategory: string
  timeSlot1: string
  timeSlot2: string
  timeSlot3: string
  status: 'enabled' | 'disabled'
}

// 模拟班次数据
const mockShiftList: ShiftClass[] = [
  {
    id: '1',
    code: 'SS202602050002',
    name: '值班',
    category: '夜班',
    color: '#ff6600',
    personType: '卫生技术人员',
    personCategory: '医师',
    timeSlot1: '-',
    timeSlot2: '-',
    timeSlot3: '-',
    status: 'enabled',
  },
  {
    id: '2',
    code: 'SS202602050001',
    name: '白班',
    category: '白班',
    color: '#1677ff',
    personType: '卫生技术人员',
    personCategory: '医师',
    timeSlot1: '-',
    timeSlot2: '-',
    timeSlot3: '-',
    status: 'enabled',
  },
]

// 机构选项
const orgOptions = [
  { label: '贵阳市XX医院总院区', value: 'org1' },
  { label: '贵阳市XX医院南院区', value: 'org2' },
  { label: '贵阳市XX医院北院区', value: 'org3' },
]

const ShiftClassPage: React.FC = () => {
  const [shiftList, setShiftList] = useState<ShiftClass[]>(mockShiftList)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftClass | null>(null)
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 左侧树相关状态
  const [selectedOrg, setSelectedOrg] = useState<string>('org1')
  const [selectedDeptKey, setSelectedDeptKey] = useState<string>('dept1')
  const [treeSearchText, setTreeSearchText] = useState('')

  // 筛选状态
  const [nameFilter, setNameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // 获取当前机构的科室数据
  const getCurrentDeptData = () => {
    return deptDataByOrg[selectedOrg as keyof typeof deptDataByOrg] || []
  }

  // 获取状态标签
  const getStatusTag = (status: string) => {
    if (status === 'enabled') {
      return <Tag color="success">启用</Tag>
    }
    return <Tag color="default">停用</Tag>
  }

  // 获取颜色块
  const getColorBlock = (color: string) => (
    <div
      className="w-5 h-5 rounded border"
      style={{ backgroundColor: color }}
    />
  )

  // 处理新增
  const handleAdd = () => {
    setEditingShift(null)
    form.resetFields()
    form.setFieldsValue({
      status: 'enabled',
      color: '#1677ff',
      timeSlotsEnabled: false,
    })
    setDrawerVisible(true)
  }

  // 处理编辑
  const handleEdit = (record: ShiftClass) => {
    setEditingShift(record)
    form.setFieldsValue({
      name: record.name,
      category: record.category,
      status: record.status,
      color: record.color,
      personType: record.personType,
      personCategory: record.personCategory,
      timeSlotsEnabled: false,
    })
    setDrawerVisible(true)
  }

  // 处理禁用
  const handleDisable = (record: ShiftClass) => {
    Modal.confirm({
      title: '确认禁用',
      content: `确定要禁用班次「${record.name}」吗？`,
      onOk: () => {
        setShiftList(prev =>
          prev.map(item =>
            item.id === record.id ? { ...item, status: 'disabled' as const } : item
          )
        )
        message.success('已禁用')
      },
    })
  }

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的班次')
      return
    }
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条班次吗？`,
      onOk: () => {
        setShiftList(prev => prev.filter(item => !selectedRowKeys.includes(item.id)))
        setSelectedRowKeys([])
        message.success('批量删除成功')
      },
    })
  }

  // 处理提交
  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (editingShift) {
        setShiftList(prev =>
          prev.map(item =>
            item.id === editingShift.id
              ? {
                  ...item,
                  name: values.name,
                  category: values.category,
                  status: values.status,
                  color: values.color,
                  personType: values.personType,
                  personCategory: values.personCategory,
                }
              : item
          )
        )
        message.success('修改成功')
      } else {
        const newShift: ShiftClass = {
          id: Date.now().toString(),
          code: `SS${dayjs().format('YYYYMMDD')}${String(shiftList.length + 1).padStart(3, '0')}`,
          name: values.name,
          category: values.category,
          color: values.color,
          personType: values.personType,
          personCategory: values.personCategory || '医师',
          timeSlot1: '-',
          timeSlot2: '-',
          timeSlot3: '-',
          status: values.status,
        }
        setShiftList(prev => [...prev, newShift])
        message.success('新增成功')
      }
      setDrawerVisible(false)
    })
  }

  // 表格选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  // 表格列
  const columns = [
    {
      title: '班次编码',
      dataIndex: 'code',
      key: 'code',
      width: 140,
    },
    {
      title: '班次名称',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '班次类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '颜色代码',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      render: (color: string) => getColorBlock(color),
    },
    {
      title: '人员性质',
      dataIndex: 'personType',
      key: 'personType',
      width: 120,
    },
    {
      title: '人员类别',
      dataIndex: 'personCategory',
      key: 'personCategory',
      width: 100,
    },
    {
      title: '时段1',
      dataIndex: 'timeSlot1',
      key: 'timeSlot1',
      width: 80,
    },
    {
      title: '时段2',
      dataIndex: 'timeSlot2',
      key: 'timeSlot2',
      width: 80,
    },
    {
      title: '时段3',
      dataIndex: 'timeSlot3',
      key: 'timeSlot3',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: ShiftClass) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ backgroundColor: '#1677ff', color: '#fff', border: 'none' }}
          >
            修改
          </Button>
          {record.status === 'enabled' ? (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleDisable(record)}
              style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none' }}
            >
              禁用
            </Button>
          ) : (
            <Button
              size="small"
              disabled
              icon={<StopOutlined />}
              style={{ backgroundColor: '#d9d9d9', color: '#fff', border: 'none' }}
            >
              已禁用
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="flex gap-4">
      {/* 左侧科室树 */}
      <div className="w-56 flex flex-col bg-white overflow-hidden shadow-sm h-[calc(100vh-180px)]">
        {/* 机构下拉框 */}
        <div className="p-2 border-b">
          <Select
            value={selectedOrg}
            onChange={(value) => {
              setSelectedOrg(value)
              const newDepts = deptDataByOrg[value as keyof typeof deptDataByOrg]
              if (newDepts && newDepts.length > 0) {
                setSelectedDeptKey(newDepts[0].id)
              }
            }}
            style={{ width: '100%' }}
            options={orgOptions}
            placeholder="请选择机构"
          />
        </div>

        {/* 搜索框 */}
        <div className="p-2">
          <Input
            placeholder="请输入考勤单元名称"
            value={treeSearchText}
            onChange={e => setTreeSearchText(e.target.value)}
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
          />
        </div>
        <div className="flex-1 overflow-auto p-2">
          <Tree
            treeData={getCurrentDeptData().map(dept => ({
              key: dept.id,
              title: dept.name,
            }))}
            selectedKeys={[selectedDeptKey]}
            onSelect={(keys) => {
              if (keys.length > 0) {
                setSelectedDeptKey(keys[0] as string)
              }
            }}
            blockNode
          />
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1">
        {/* 筛选栏 + 操作栏 */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* 左侧新增按钮 + 批量删除按钮 */}
            <Space size="middle">
              <Button type="primary" icon={<PlusOutlined />} className="!bg-blue-600" onClick={handleAdd}>
                新增
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
                批量删除
              </Button>
            </Space>

            {/* 右侧筛选条件 */}
            <Space size="middle" wrap>
              <Input
                placeholder="请输入班次名称"
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="请选择状态"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 140 }}
                options={[
                  { label: '启用', value: 'enabled' },
                  { label: '停用', value: 'disabled' },
                ]}
              />
              <Button type="primary" icon={<SearchOutlined />} className="!bg-blue-600">
                搜索
              </Button>
              <Button icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </div>
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-lg border">
          <Table
            columns={columns}
            dataSource={shiftList}
            rowKey="id"
            rowSelection={rowSelection}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total: number) => `共 ${total} 条`,
              position: ['bottomLeft'],
            }}
            size="middle"
          />
        </div>
      </div>

      {/* 新增/编辑抽屉 */}
      <Drawer
        title={editingShift ? '编辑班次' : '新增班次'}
        placement="right"
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <div className="flex justify-end gap-2 py-2">
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" className="!bg-blue-600" onClick={handleSubmit}>
              确定
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          {/* 班次名称和考勤项目在一行 */}
          <div className="flex gap-4 mb-4">
            <Form.Item
              label="班次名称"
              name="name"
              rules={[{ required: true, message: '班次名称必须！' }]}
              className="flex-1 mb-0"
            >
              <Input placeholder="请输入班次名称" />
            </Form.Item>

            <Form.Item
              label="考勤项目"
              name="category"
              rules={[{ required: true, message: '请选择考勤项目' }]}
              className="flex-1 mb-0"
            >
              <Select placeholder="请选择考勤项目">
                <Select.Option value="白班">白班</Select.Option>
                <Select.Option value="夜班">夜班</Select.Option>
                <Select.Option value="中班">中班</Select.Option>
                <Select.Option value="早班">早班</Select.Option>
                <Select.Option value="晚班">晚班</Select.Option>
              </Select>
            </Form.Item>
          </div>

          {/* 颜色代码和序号在一行 */}
          <div className="flex gap-4 mb-4">
            <Form.Item
              label="颜色代码"
              name="color"
              rules={[{ required: true, message: '请选择颜色' }]}
              className="flex-1 mb-0"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  style={{ width: 60, height: 32, padding: 2 }}
                  value={form.getFieldValue('color') || '#1677ff'}
                  onChange={e => form.setFieldValue('color', e.target.value)}
                />
                <span className="text-gray-500">{form.getFieldValue('color') || '#1677ff'}</span>
              </div>
            </Form.Item>

            <Form.Item label="序号" name="sortOrder" className="flex-1 mb-0">
              <Input placeholder="请输入序号" />
            </Form.Item>
          </div>

          {/* 人员性质和人员类别在一行 */}
          <div className="flex gap-4 mb-4">
            <Form.Item
              label="人员性质"
              name="personType"
              rules={[{ required: true, message: '请选择人员性质' }]}
              className="flex-1 mb-0"
            >
              <Select placeholder="请选择人员性质">
                <Select.Option value="卫生技术人员">卫生技术人员</Select.Option>
                <Select.Option value="行政人员">行政人员</Select.Option>
                <Select.Option value="工勤人员">工勤人员</Select.Option>
              </Select>
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
                    className="flex-1 mb-0"
                  >
                    <Select placeholder="请选择人员类别">
                      <Select.Option value="医师">医师</Select.Option>
                      <Select.Option value="护士">护士</Select.Option>
                      <Select.Option value="药师">药师</Select.Option>
                      <Select.Option value="技师">技师</Select.Option>
                    </Select>
                  </Form.Item>
                ) : (
                  <div className="flex-1" />
                )
              }
            </Form.Item>
          </div>

          {/* 指定时间段和状态在一行，状态右移 */}
          <div className="flex gap-4 mb-4 items-center">
            <Form.Item label="指定时间段" name="timeSlotsEnabled" valuePropName="checked" className="mb-0">
              <Switch />
            </Form.Item>

            <Form.Item label="状态" name="status" rules={[{ required: true }]} className="mb-0" style={{ marginLeft: 140 }}>
              <Radio.Group>
                <Radio value="enabled">启用</Radio>
                <Radio value="disabled">停用</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* 时间段1 */}
          <Form.Item noStyle shouldUpdate={(prevValues, currValues) => prevValues.timeSlotsEnabled !== currValues.timeSlotsEnabled}>
            {({ getFieldValue }) =>
              getFieldValue('timeSlotsEnabled') ? (
                <Form.Item label="时间段1" className="mb-2">
                  <Space size="middle">
                    <TimePicker placeholder="开始时间" format="HH:mm" className="!border" style={{ width: 200 }} />
                    <span>至</span>
                    <TimePicker placeholder="结束时间" format="HH:mm" className="!border" style={{ width: 200 }} />
                  </Space>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {/* 时间段2 */}
          <Form.Item noStyle shouldUpdate={(prevValues, currValues) => prevValues.timeSlotsEnabled !== currValues.timeSlotsEnabled}>
            {({ getFieldValue }) =>
              getFieldValue('timeSlotsEnabled') ? (
                <Form.Item label="时间段2" className="mb-2">
                  <Space size="middle">
                    <TimePicker placeholder="开始时间" format="HH:mm" className="!border" style={{ width: 200 }} />
                    <span>至</span>
                    <TimePicker placeholder="结束时间" format="HH:mm" className="!border" style={{ width: 200 }} />
                  </Space>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {/* 时间段3 */}
          <Form.Item noStyle shouldUpdate={(prevValues, currValues) => prevValues.timeSlotsEnabled !== currValues.timeSlotsEnabled}>
            {({ getFieldValue }) =>
              getFieldValue('timeSlotsEnabled') ? (
                <Form.Item label="时间段3" className="mb-2">
                  <Space size="middle">
                    <TimePicker placeholder="开始时间" format="HH:mm" className="!border" style={{ width: 200 }} />
                    <span>至</span>
                    <TimePicker placeholder="结束时间" format="HH:mm" className="!border" style={{ width: 200 }} />
                  </Space>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default ShiftClassPage
