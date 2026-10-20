import React, { useState } from 'react'
import dayjs from 'dayjs'
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd'
import {
  PlusOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  UndoOutlined,
  RedoOutlined,
  PictureOutlined,
} from '@ant-design/icons'

interface AlertTaskRecord {
  id: string
  status: '未发布' | '发布' | '停用'
  taskName: string
  methods: string[]
  methodLabel: string      // 列表「预警方式」列：预警列表 / 通知公告
  template?: string
  ruleName: string
  execType: '重复' | '一次性'
  cron: string             // 重复：Cron 表达式；一次性：具体时间字符串
  receiveType: '按部门' | '按角色' | '指定人员'
  receiveTarget: string
  notifySelf: string       // 是否通知本人：是 / 否
  needAttachment: string   // 发送附件：是 / 否
  enabledStatus: '启用' | '停用'  // 状态：启用 / 停用
  advanceOp: string        // 提前天数比较符：等于 / 小于 / 小于等于
  advanceDays: number
  lastExecTime: string
  nextExecTime: string
  content: string
}

const RULE_OPTIONS = ['查询生日人员', '查询合同到期人员名单', '查询即将退休人员名单', '查询即将转正人员']
const RECEIVE_TARGETS: Record<AlertTaskRecord['receiveType'], string[]> = {
  '按部门': ['人事科', '医务科', '护理部', '档案室', '退休办'],
  '按角色': ['档案专员', '人事专员', '退休办专员', '科室秘书'],
  '指定人员': ['张明', '王建国', '李国华'],
}

const DEFAULT_CONTENT = '尊敬的【姓名】：\n今天是您的生日，祝您生日快乐！\n\n全部人员名单：\n【详情点击】'

const INITIAL_TASKS: AlertTaskRecord[] = [
  { id: '1', status: '未发布', taskName: '下个月生日人员名单', methods: ['系统消息'], methodLabel: '预警列表', ruleName: '查询生日人员', execType: '重复', cron: '0 0 11 * ?', receiveType: '按角色', receiveTarget: '档案专员', advanceDays: 28, notifySelf: '否', needAttachment: '否', enabledStatus: '启用', advanceOp: '≤', lastExecTime: '', nextExecTime: '', content: DEFAULT_CONTENT },
  { id: '2', status: '发布', taskName: '近60内合同到期人员名单', methods: ['系统消息'], methodLabel: '预警列表', ruleName: '查询合同到期人员名单', execType: '重复', cron: '0 0 11 * ?', receiveType: '按角色', receiveTarget: '档案专员', advanceDays: 60, notifySelf: '否', needAttachment: '否', enabledStatus: '启用', advanceOp: '≤', lastExecTime: '2026-09-10 11:00:00', nextExecTime: '2026-09-11 11:00:00', content: DEFAULT_CONTENT },
  { id: '3', status: '停用', taskName: '近60天退休人员名单', methods: ['系统消息'], methodLabel: '预警列表', ruleName: '查询即将退休人员名单', execType: '重复', cron: '0 0 11 * ?', receiveType: '按角色', receiveTarget: '退休办', advanceDays: 60, notifySelf: '否', needAttachment: '否', enabledStatus: '启用', advanceOp: '≤', lastExecTime: '2026-09-01 11:00:00', nextExecTime: '', content: DEFAULT_CONTENT },
  { id: '4', status: '发布', taskName: '当天生日人员（生日祝福）', methods: ['系统消息'], methodLabel: '通知公告', ruleName: '查询生日人员', execType: '重复', cron: '0 0 11 * ?', receiveType: '指定人员', receiveTarget: '张明', advanceDays: 0, notifySelf: '否', needAttachment: '否', enabledStatus: '启用', advanceOp: '≤', lastExecTime: '2026-09-10 11:00:00', nextExecTime: '2026-09-11 11:00:00', content: DEFAULT_CONTENT },
  { id: '5', status: '发布', taskName: '当日生日人员名单', methods: ['系统消息'], methodLabel: '预警列表', ruleName: '查询生日人员', execType: '重复', cron: '0 0 11 * ?', receiveType: '按部门', receiveTarget: '人事科', advanceDays: 0, notifySelf: '否', needAttachment: '否', enabledStatus: '启用', advanceOp: '≤', lastExecTime: '2026-09-10 11:00:00', nextExecTime: '2026-09-11 11:00:00', content: DEFAULT_CONTENT },
  { id: '6', status: '停用', taskName: '近7天入职人员名单', methods: ['系统消息'], methodLabel: '预警列表', ruleName: '查询即将转正人员', execType: '重复', cron: '0 0 11 * ?', receiveType: '按角色', receiveTarget: '档案专员', advanceDays: 7, notifySelf: '否', needAttachment: '否', enabledStatus: '启用', advanceOp: '≤', lastExecTime: '2026-09-03 11:00:00', nextExecTime: '', content: DEFAULT_CONTENT },
  { id: '7', status: '发布', taskName: '入职满3年人员（周年祝福）', methods: ['系统消息'], methodLabel: '通知公告', ruleName: '查询即将转正人员', execType: '重复', cron: '0 0 11 * ?', receiveType: '按角色', receiveTarget: '档案专员', advanceDays: 0, notifySelf: '否', needAttachment: '否', enabledStatus: '启用', advanceOp: '≤', lastExecTime: '2026-09-10 11:00:00', nextExecTime: '2026-09-11 11:00:00', content: DEFAULT_CONTENT },
]

const STATUS_TAG: Record<string, { color: string }> = {
  '未发布': { color: 'warning' },
  '发布': { color: 'success' },
  '停用': { color: 'default' },
}

const AlertCenter: React.FC = () => {
  const [data, setData] = useState<AlertTaskRecord[]>(INITIAL_TASKS)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AlertTaskRecord | null>(null)
  const [form] = Form.useForm()
  const [receiveType, setReceiveType] = useState<AlertTaskRecord['receiveType']>('按部门')
  const [content, setContent] = useState(DEFAULT_CONTENT)
  // 监听执行类型：一次性 → 执行时间为时间选择器
  const execTypeWatch = Form.useWatch('execType', form)

  const filtered = data.filter((r) =>
    (!keyword || r.taskName.includes(keyword)) &&
    (!statusFilter || r.status === statusFilter),
  )

  const openDrawer = (record?: AlertTaskRecord) => {
    setEditing(record ?? null)
    if (record) {
      form.setFieldsValue({
        taskName: record.taskName,
        ruleName: record.ruleName,
        methods: record.methods,
        execType: record.execType,
        // 一次性执行时控件为时间选择器，需回填 dayjs 对象
        cron: record.execType === '一次性' ? dayjs(record.cron) : record.cron,
        advanceDays: record.advanceDays,
        receiveType: record.receiveType,
        receiveTarget: record.receiveTarget,
        notifySelf: record.notifySelf || '否',
        needAttachment: record.needAttachment || '否',
        enabledStatus: record.enabledStatus || '启用',
        advanceOp: record.advanceOp || '≤',
      })
      setReceiveType(record.receiveType)
      setContent(record.content)
    } else {
      form.resetFields()
      form.setFieldsValue({
        execType: '重复',
        methods: ['系统消息'],
        notifySelf: '否',
        needAttachment: '否',
        enabledStatus: '启用',
        advanceOp: '≤',
      })
      setReceiveType('按部门')
      setContent(DEFAULT_CONTENT)
    }
    setOpen(true)
  }

  const handleSave = () => {
    form.validateFields().then((raw) => {
      const values = { ...raw } as Record<string, unknown>
      // 一次性执行：把时间选择器的 dayjs 值转为字符串存储
      if (values.execType === '一次性' && dayjs.isDayjs(values.cron)) {
        values.cron = (values.cron as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss')
      }
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      if (editing) {
        setData(data.map((r) => r.id === editing.id ? { ...r, ...values, content } as AlertTaskRecord : r))
        message.success('修改成功')
      } else {
        setData([
          {
            id: `${Date.now()}`,
            status: '未发布',
            methodLabel: '预警列表',
            lastExecTime: '',
            nextExecTime: '',
            content,
            ...values,
          } as AlertTaskRecord,
          ...data,
        ])
        message.success('新增预警任务成功')
      }
      setOpen(false)
    })
  }

  const columns = [
    { title: '序号', width: 55, render: (_: unknown, __: AlertTaskRecord, i: number) => i + 1 },
    {
      title: '状态', dataIndex: 'status', width: 75,
      render: (s: string) => <Tag color={STATUS_TAG[s]?.color}>{s}</Tag>,
    },
    { title: '预警任务', dataIndex: 'taskName', width: 190, ellipsis: true },
    { title: '预警方式', dataIndex: 'methodLabel', width: 90 },
    { title: '预警规则', dataIndex: 'ruleName', width: 150, ellipsis: true },
    { title: '执行类型', dataIndex: 'execType', width: 95 },
    { title: '执行时间', dataIndex: 'cron', width: 95 },
    { title: '接收类型', dataIndex: 'receiveType', width: 90 },
    { title: '预警对象', dataIndex: 'receiveTarget', width: 95 },
    { title: '提前天数', dataIndex: 'advanceDays', width: 80, render: (v: number) => `${v}天` },
    { title: '上次执行时间', dataIndex: 'lastExecTime', width: 165, render: (v: string) => v || '-' },
    { title: '下次执行', dataIndex: 'nextExecTime', width: 165, render: (v: string) => v || '-' },
    {
      title: '操作', width: 130, fixed: 'right' as const,
      render: (_: unknown, record: AlertTaskRecord) => (
        <Space size={4}>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawer(record)}>修改</Button>
          <Popconfirm title="确定删除该预警任务？" onConfirm={() => { setData(data.filter((r) => r.id !== record.id)); message.success('已删除') }}>
            <Button size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
      {/* 工具栏：新增在左，查看框与查询按钮在右上角 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#fa8c16', borderColor: '#fa8c16' }} onClick={() => openDrawer()}>
          新增
        </Button>
        <Space>
          <Input
            placeholder="请输入任务名称"
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
          <Select
            style={{ width: 140 }}
            placeholder="发布"
            allowClear
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            options={[{ value: '未发布', label: '未发布' }, { value: '发布', label: '发布' }, { value: '停用', label: '停用' }]}
          />
          <Button type="primary" onClick={() => message.info('查询完成')}>查询</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns as never}
        dataSource={filtered}
        pagination={false}
        bordered
        size="middle"
        scroll={{ x: 1560 }}
      />

      {/* 新增 / 修改预警任务抽屉 */}
      <Drawer
        title="预警任务"
        open={open}
        onClose={() => setOpen(false)}
        width={1080}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => message.success('已触发执行一次，执行结果请查看任务执行记录')}
              >立即执行一次</Button>
              <Button onClick={() => setOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSave}>保存</Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 90px' }} wrapperCol={{ flex: '1 1 auto' }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item label="预警任务" name="taskName" rules={[{ required: true, message: '请输入预警任务名称' }]}>
                <Input placeholder="请输入预警任务名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="预警规则" name="ruleName" labelCol={{ flex: '0 0 90px' }} rules={[{ required: true, message: '请选择预警规则' }]}>
                <Select placeholder="请选择预警规则" options={RULE_OPTIONS.map((r) => ({ value: r, label: r }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="预警方式" name="methods" labelCol={{ flex: '0 0 90px' }}>
                <Checkbox.Group options={['系统消息', '短信']} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="执行频率" name="execType" labelCol={{ flex: '0 0 90px' }} rules={[{ required: true, message: '请选择执行频率' }]}>
                <Select options={[{ value: '重复', label: '重复' }, { value: '一次性', label: '一次性' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="执行时间" name="cron" labelCol={{ flex: '0 0 90px' }} rules={[{ required: true, message: '请选择执行时间' }]}>
                {execTypeWatch === '一次性' ? (
                  <DatePicker
                    showTime={{ format: 'HH:mm:ss' }}
                    format="YYYY-MM-DD HH:mm:ss"
                    style={{ width: '100%' }}
                    placeholder="选择年月日时分秒"
                  />
                ) : (
                  <Input placeholder="如：0 0 11 * ?" />
                )}
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="提前天数" labelCol={{ flex: '0 0 90px' }} required>
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* 比较符：＜ / = / ≤ */}
                  <Form.Item name="advanceOp" noStyle>
                    <Select
                      style={{ width: 72 }}
                      options={[
                        { value: '＜', label: '＜' },
                        { value: '=', label: '=' },
                        { value: '≤', label: '≤' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="advanceDays" noStyle rules={[{ required: true, message: '请输入提前天数' }]}>
                    <InputNumber min={0} max={365} style={{ flex: 1 }} placeholder="请输入提前天数" />
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="接收类型" name="receiveType" labelCol={{ flex: '0 0 90px' }} rules={[{ required: true, message: '请选择接收类型' }]}>
                <Select
                  onChange={(v) => { setReceiveType(v); form.setFieldValue('receiveTarget', undefined) }}
                  options={(Object.keys(RECEIVE_TARGETS) as AlertTaskRecord['receiveType'][]).map((k) => ({ value: k, label: k }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="接收对象" name="receiveTarget" labelCol={{ flex: '0 0 90px' }} rules={[{ required: true, message: '请选择接收对象' }]}>
                <Select placeholder="请选择接收对象" options={RECEIVE_TARGETS[receiveType].map((t) => ({ value: t, label: t }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="是否通知本人" name="notifySelf" labelCol={{ flex: '0 0 90px' }}>
                <Radio.Group options={[{ value: '是', label: '是' }, { value: '否', label: '否' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="接收内容" labelCol={{ flex: '0 0 90px' }} required>
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
              {/* 工具栏（样式示意） */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderBottom: '1px solid #f0f0f0', color: '#595959' }}>
                <BoldOutlined /><ItalicOutlined /><UnderlineOutlined /><StrikethroughOutlined />
                <span style={{ color: '#e8e8e8' }}>|</span>
                <OrderedListOutlined /><UnorderedListOutlined />
                <span style={{ color: '#e8e8e8' }}>|</span>
                <LinkOutlined /><PictureOutlined />
                <span style={{ color: '#e8e8e8' }}>|</span>
                <UndoOutlined /><RedoOutlined />
              </div>
              <Input.TextArea
                rows={7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ border: 'none', boxShadow: 'none', padding: 12 }}
                placeholder="请输入接收内容，可用【姓名】【名单】等占位符"
              />
            </div>
          </Form.Item>
          {/* 最下方：发送附件（带说明） */}
          <Form.Item
            label={<span>发送附件<Tooltip title="指将表格数据同通知进行发送，注意：通知到本人时，默认无附件。"><QuestionCircleOutlined style={{ marginLeft: 4, color: '#999' }} /></Tooltip></span>}
            name="needAttachment"
            labelCol={{ flex: '0 0 90px' }}
          >
            <Radio.Group options={[{ value: '是', label: '是' }, { value: '否', label: '否' }]} />
          </Form.Item>
          {/* 发送附件下方：状态 */}
          <Form.Item label="状态" name="enabledStatus" labelCol={{ flex: '0 0 90px' }} rules={[{ required: true, message: '请选择状态' }]}>
            <Select style={{ width: 200 }} options={[{ value: '启用', label: '启用' }, { value: '停用', label: '停用' }]} placeholder="请选择状态" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default AlertCenter
