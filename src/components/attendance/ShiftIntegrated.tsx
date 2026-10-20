import React, { useState } from 'react'
import {
  Button,
  Table,
  Select,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Radio,
  DatePicker,
  Steps,
  Checkbox,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  CopyOutlined,
  EditOutlined,
  CheckOutlined,
  RollbackOutlined,
  SaveOutlined,
  CloseOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

// 排班记录数据类型
interface ShiftRecord {
  id: string
  code: string
  auditStatus: 'pending' | 'approved' | 'rejected'
  unit: string
  mode: 'by_person' | 'by_shift'
  personType: string
  personNature: string
  timeRange: string
  creator: string
  createTime: string
  applicant: string
  applyTime: string
}

// 模拟排班记录数据
const mockShiftRecords: ShiftRecord[] = [
  {
    id: '1',
    code: 'SR202602050',
    auditStatus: 'pending',
    unit: '信息科',
    mode: 'by_person',
    personType: '医师',
    personNature: '卫生技术人员',
    timeRange: '2026-01-01~2026-01-31',
    creator: '20502726741',
    createTime: '2026-02-05 13:21:20',
    applicant: '系统演示',
    applyTime: '2026-02-05 13:21:23',
  },
  {
    id: '2',
    code: 'SR202602050',
    auditStatus: 'approved',
    unit: '信息科',
    mode: 'by_shift',
    personType: '医师',
    personNature: '卫生技术人员',
    timeRange: '2026-02-01~2026-02-28',
    creator: '20502726741',
    createTime: '2026-02-05 13:16:09',
    applicant: '系统演示',
    applyTime: '2026-02-05 13:16:14',
  },
  {
    id: '3',
    code: 'SR202511020',
    auditStatus: 'approved',
    unit: '金测试排班...',
    mode: 'by_person',
    personType: '医师',
    personNature: '卫生技术人员',
    timeRange: '2025-10-20~2025-10-26',
    creator: '阿乐',
    createTime: '2025-10-22 17:07:09',
    applicant: '韦晓',
    applyTime: '2025-11-28 10:22:43',
  },
  {
    id: '4',
    code: 'SR202511030',
    auditStatus: 'approved',
    unit: '金测试排班...',
    mode: 'by_person',
    personType: '医师',
    personNature: '卫生技术人员',
    timeRange: '2025-10-13~2025-10-19',
    creator: '吴叶玲',
    createTime: '2025-10-13 16:54:38',
    applicant: '吴叶玲',
    applyTime: '2025-10-13 16:54:52',
  },
  {
    id: '5',
    code: 'SR202509180',
    auditStatus: 'pending',
    unit: '胸外科',
    mode: 'by_person',
    personType: '医师',
    personNature: '卫生技术人员',
    timeRange: '2025-09-15~2025-09-21',
    creator: '吴叶玲',
    createTime: '2025-09-18 16:24:11',
    applicant: '',
    applyTime: '',
  },
  {
    id: '6',
    code: 'SR202509080',
    auditStatus: 'rejected',
    unit: '金测试排班...',
    mode: 'by_person',
    personType: '护师',
    personNature: '卫生技术人员',
    timeRange: '2025-09-08~2025-09-14',
    creator: '胡强',
    createTime: '2025-09-08 15:56:24',
    applicant: '胡强',
    applyTime: '2025-09-08 15:56:40',
  },
]

// 人员数据
interface StaffMember {
  id: string
  name: string
  group: string
}

const mockStaffList: StaffMember[] = [
  { id: '1', name: '智多星', group: '全部' },
  { id: '2', name: '系统演示', group: '全部' },
]

const ShiftIntegratedPage: React.FC = () => {
  const [records, setRecords] = useState<ShiftRecord[]>(mockShiftRecords)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [scheduleForm] = Form.useForm()

  // 筛选状态
  const [unitFilter, setUnitFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [modeFilter, setModeFilter] = useState<string | null>(null)

  // 获取审核状态标签
  const getAuditStatusTag = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      pending: { color: 'processing', text: '待申请' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已驳回' },
    }
    const { color, text } = config[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  // 获取排班模式文本
  const getModeText = (mode: string) => {
    return mode === 'by_person' ? '按人排班' : '按班排人'
  }

  // 处理新增排班
  const handleCreate = () => {
    form.resetFields()
    form.setFieldsValue({
      unit: '信息科',
      personNature: '卫生技术人员',
      personType: '医师',
      mode: 'by_person',
      periodType: 'week',
    })
    setCreateModalVisible(true)
  }

  // 处理开始排班
  const handleStartSchedule = () => {
    form.validateFields().then(values => {
      setCreateModalVisible(false)
      setScheduleModalVisible(true)
      scheduleForm.setFieldsValue(values)
    })
  }

  // 处理查看
  const handleView = (record: ShiftRecord) => {
    message.info(`查看排班记录：${record.code}`)
  }

  // 处理复制
  const handleCopy = (record: ShiftRecord) => {
    Modal.confirm({
      title: '确认复制',
      content: `确定要复制排班记录「${record.code}」吗？`,
      onOk: () => {
        const newRecord: ShiftRecord = {
          ...record,
          id: Date.now().toString(),
          code: `SR${dayjs().format('YYYYMMDD')}${String(records.length + 1).padStart(3, '0')}`,
          auditStatus: 'pending',
          createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          applyTime: '',
        }
        setRecords(prev => [newRecord, ...prev])
        message.success('复制成功')
      },
    })
  }

  // 处理重排
  const handleReschedule = (record: ShiftRecord) => {
    message.info(`重排：${record.code}`)
  }

  // 处理修改
  const handleEdit = (record: ShiftRecord) => {
    message.info(`修改：${record.code}`)
  }

  // 处理提交
  const handleSubmit = (record: ShiftRecord) => {
    Modal.confirm({
      title: '确认提交',
      content: `确定要提交排班记录「${record.code}」吗？`,
      onOk: () => {
        setRecords(prev =>
          prev.map(item =>
            item.id === record.id ? { ...item, auditStatus: 'pending' as const } : item
          )
        )
        message.success('提交成功')
      },
    })
  }

  // 表格列
  const columns = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 100,
      render: (status: string) => getAuditStatusTag(status),
    },
    {
      title: '管理单元',
      dataIndex: 'unit',
      key: 'unit',
      width: 120,
    },
    {
      title: '排班模式',
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
      render: (mode: string) => getModeText(mode),
    },
    {
      title: '人员类型',
      dataIndex: 'personType',
      key: 'personType',
      width: 80,
    },
    {
      title: '人员性质',
      dataIndex: 'personNature',
      key: 'personNature',
      width: 100,
    },
    {
      title: '时间段',
      dataIndex: 'timeRange',
      key: 'timeRange',
      width: 160,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 160,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: ShiftRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {record.auditStatus === 'approved' && (
            <>
              <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record)}>
                复制
              </Button>
              <Button type="link" size="small" icon={<RollbackOutlined />} onClick={() => handleReschedule(record)}>
                重排
              </Button>
            </>
          )}
          {record.auditStatus === 'pending' && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                修改
              </Button>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleSubmit(record)}>
                提交
              </Button>
            </>
          )}
          {record.auditStatus === 'rejected' && (
            <>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
                查看
              </Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                修改
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  // 生成日期列（按人排班模式）
  const generateDateColumns = () => {
    const dates = []
    const startDate = dayjs('2026-05-01')
    for (let i = 0; i < 31; i++) {
      const date = startDate.add(i, 'day')
      const isWeekend = date.day() === 0 || date.day() === 6
      dates.push({
        title: (
          <div className={isWeekend ? 'text-orange-500' : ''}>
            <div>{date.format('YYYY-MM-DD')}</div>
            <div className="text-xs">
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.day()]}
            </div>
          </div>
        ),
        key: `date_${i}`,
        width: 100,
        render: () => (
          <div className="h-8 border border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-400">
            <PlusOutlined className="text-gray-400" />
          </div>
        ),
      })
    }
    return dates
  }

  return (
    <div>
      {/* 筛选栏 */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Space size="middle" wrap>
            <Select
              placeholder="请选择排班单元"
              value={unitFilter}
              onChange={setUnitFilter}
              allowClear
              style={{ width: 160 }}
              prefix={<span className="text-gray-400">排班单元</span>}
              options={[
                { label: '信息科', value: '信息科' },
                { label: '金测试排班管理单元', value: '金测试排班管理单元' },
                { label: '胸外科', value: '胸外科' },
              ]}
            />
            <Select
              placeholder="请选择状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 140 }}
              prefix={<span className="text-gray-400">状态</span>}
              options={[
                { label: '待申请', value: 'pending' },
                { label: '已通过', value: 'approved' },
                { label: '已驳回', value: 'rejected' },
              ]}
            />
            <Select
              placeholder="请选择排班模式"
              value={modeFilter}
              onChange={setModeFilter}
              allowClear
              style={{ width: 140 }}
              prefix={<span className="text-gray-400">排班模式</span>}
              options={[
                { label: '按人排班', value: 'by_person' },
                { label: '按班排人', value: 'by_shift' },
              ]}
            />
            <div className="flex items-center gap-2">
              <span className="text-gray-400">创建日期</span>
              <RangePicker
                placeholder={['开始日期时间', '结束日期时间']}
                style={{ width: 280 }}
              />
            </div>
          </Space>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} className="!bg-blue-600">
              搜索
            </Button>
            <Button icon={<ReloadOutlined />}>重置</Button>
            <Button icon={<CloseOutlined />}>收起</Button>
          </Space>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="bg-white p-4 rounded-lg mb-4 flex justify-end">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="!bg-blue-600"
          onClick={handleCreate}
        >
          排班
        </Button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg border">
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条数据`,
            position: ['bottomCenter'],
          }}
          size="middle"
          scroll={{ x: 1600 }}
        />
      </div>

      {/* 新建排班记录弹窗 - 步骤1 */}
      <Modal
        title="新建排班记录"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleStartSchedule}
        width={800}
        okText="开始排班"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
        >
          <div className="flex gap-4 mb-4">
            <Form.Item
              label="排班单元"
              name="unit"
              rules={[{ required: true }]}
              className="flex-1"
            >
              <Select placeholder="请选择排班单元">
                <Select.Option value="信息科">信息科</Select.Option>
                <Select.Option value="金测试排班管理单元">金测试排班管理单元</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="期间"
              name="periodType"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio.Button value="week">周</Radio.Button>
                <Radio.Button value="month">月</Radio.Button>
                <Radio.Button value="date">日期</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button size="small">上一周</Button>
                <span>2026-20周</span>
                <Button size="small">下一周</Button>
              </Space>
            </Form.Item>
          </div>

          <div className="flex gap-4 mb-4">
            <Form.Item
              label="人员性质"
              name="personNature"
              rules={[{ required: true }]}
              className="flex-1"
            >
              <Select placeholder="请选择人员性质">
                <Select.Option value="卫生技术人员">卫生技术人员</Select.Option>
                <Select.Option value="行政人员">行政人员</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="人员类别"
              name="personType"
              rules={[{ required: true }]}
              className="flex-1"
            >
              <Select placeholder="请选择人员类别">
                <Select.Option value="医师">医师</Select.Option>
                <Select.Option value="护士">护士</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="排班模式"
              name="mode"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="by_person">按人排班</Radio>
                <Radio value="by_shift">按班排人</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* 分组选择表格 */}
          <div className="border rounded-lg mt-4">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 w-12">
                    <Checkbox />
                  </th>
                  <th className="px-4 py-2 text-left">分组名称</th>
                  <th className="px-4 py-2 text-left">员工性质</th>
                  <th className="px-4 py-2 text-left">人员类别</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3">
                    <Checkbox />
                  </td>
                  <td className="px-4 py-3">全部</td>
                  <td className="px-4 py-3">
                    <Tag>卫生技术人员</Tag>
                  </td>
                  <td className="px-4 py-3">
                    <Tag>医师</Tag>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Form>
      </Modal>

      {/* 排班表弹窗 - 步骤2 */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>【新建】排班表</span>
            <Space>
              <span>排班单元: 信息科</span>
              <span>期间: 2026-05-01 ~ 2026-05-31</span>
              <span>带教情况:</span>
              <Checkbox />
              <Button size="small">排班说明</Button>
              <Button size="small" type="primary">添加人员</Button>
              <Button size="small" icon={<DownloadOutlined />}>导出Word</Button>
            </Space>
          </div>
        }
        open={scheduleModalVisible}
        onCancel={() => setScheduleModalVisible(false)}
        width={1200}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setScheduleModalVisible(false)}>关闭</Button>
            <Button type="primary" className="!bg-blue-600" icon={<SaveOutlined />}>
              保存
            </Button>
          </div>
        }
      >
        <Table
          columns={[
            {
              title: '序号',
              key: 'index',
              width: 60,
              render: (_: unknown, __: unknown, index: number) => index + 1,
            },
            {
              title: '人员',
              dataIndex: 'name',
              key: 'name',
              width: 100,
            },
            {
              title: '分组',
              dataIndex: 'group',
              key: 'group',
              width: 100,
            },
            ...generateDateColumns(),
          ]}
          dataSource={mockStaffList}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 3200 }}
        />
      </Modal>
    </div>
  )
}

export default ShiftIntegratedPage
