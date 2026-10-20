import React, { useState } from 'react'
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface AlertRuleRecord {
  id: string
  name: string
  code: string
  description: string
  sql: string
  status: '启用' | '停用'
  createdAt: string
  updatedAt: string
}

const INITIAL_RULES: AlertRuleRecord[] = [
  {
    id: '1', name: '查询生日人员', code: 'A001', status: '启用',
    description: '筛选当月过生日的在职人员名单',
    sql: "SELECT name, gender, age, dept\nFROM t_staff\nWHERE status = '在职'\n  AND MONTH(birth_date) = MONTH(CURDATE())",
    createdAt: '2026-08-12 10:20:00', updatedAt: '2026-09-01 09:15:00',
  },
  {
    id: '2', name: '查询合同到期人员名单', code: 'A002', status: '启用',
    description: '筛选 60 天内劳动合同即将到期的人员',
    sql: "SELECT name, gender, dept, contract_end_date\nFROM t_staff\nWHERE status = '在职'\n  AND DATEDIFF(contract_end_date, CURDATE()) <= 60",
    createdAt: '2026-08-12 10:25:00', updatedAt: '2026-09-02 14:30:00',
  },
  {
    id: '3', name: '查询即将退休人员名单', code: 'A003', status: '启用',
    description: '筛选年龄达到 55 岁即将退休的人员',
    sql: "SELECT name, gender, age, dept, title\nFROM t_staff\nWHERE status = '在职'\n  AND age >= 55",
    createdAt: '2026-08-15 11:00:00', updatedAt: '2026-08-20 16:40:00',
  },
  {
    id: '4', name: '查询即将转正人员', code: 'A004', status: '启用',
    description: '筛选入职 30～45 天、即将转正的试用期人员',
    sql: "SELECT name, gender, age, dept, hire_date\nFROM t_staff\nWHERE staff_type = '试用期'\n  AND DATEDIFF(CURDATE(), hire_date) BETWEEN 30 AND 45",
    createdAt: '2026-08-18 15:30:00', updatedAt: '',
  },
]

const AlertRule: React.FC = () => {
  const [data, setData] = useState<AlertRuleRecord[]>(INITIAL_RULES)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AlertRuleRecord | null>(null)
  const [form] = Form.useForm()
  const [sqlText, setSqlText] = useState('')

  const filtered = data.filter((r) =>
    (!keyword || r.name.includes(keyword)) &&
    (!statusFilter || r.status === statusFilter),
  )

  const openDrawer = (record?: AlertRuleRecord) => {
    setEditing(record ?? null)
    if (record) {
      form.setFieldsValue({ name: record.name, description: record.description, status: record.status })
      setSqlText(record.sql)
    } else {
      form.resetFields()
      form.setFieldsValue({ status: '启用' })
      setSqlText('')
    }
    setOpen(true)
  }

  // SQL 校验（前端规则模拟）
  const handleValidate = () => {
    const sql = sqlText.trim()
    if (!sql) {
      message.warning('请输入 SQL 语句后再校验')
      return
    }
    const upper = sql.toUpperCase()
    if (!upper.startsWith('SELECT')) {
      message.error('校验失败：仅支持 SELECT 查询语句')
      return
    }
    if (/\b(DELETE|UPDATE|INSERT|DROP|ALTER|TRUNCATE|CREATE)\b/.test(upper)) {
      message.error('校验失败：不允许包含增删改等非查询操作')
      return
    }
    if (!/\bFROM\b/.test(upper)) {
      message.error('校验失败：缺少 FROM 子句')
      return
    }
    message.success('SQL 校验通过')
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (!sqlText.trim()) {
        message.warning('请输入 SQL 语句')
        return
      }
      const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      if (editing) {
        setData(data.map((r) => r.id === editing.id
          ? { ...r, ...values, sql: sqlText, updatedAt: now }
          : r))
        message.success('修改成功')
      } else {
        setData([
          ...data,
          {
            id: `${Date.now()}`,
            sql: sqlText,
            status: '启用',
            createdAt: now,
            updatedAt: '',
            ...values,
          } as AlertRuleRecord,
        ])
        message.success('新增预警规则成功')
      }
      setOpen(false)
    })
  }

  const columns = [
    { title: '序号', width: 60, render: (_: unknown, __: AlertRuleRecord, i: number) => i + 1 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (s: string) => <Tag color={s === '启用' ? 'success' : 'default'}>{s}</Tag>,
    },
    { title: '预警规则', dataIndex: 'name' },
    { title: '预警编码', dataIndex: 'code', width: 120 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
    { title: '修改时间', dataIndex: 'updatedAt', width: 170, render: (v: string) => v || <Text type="secondary">-</Text> },
    {
      title: '操作', width: 140,
      render: (_: unknown, record: AlertRuleRecord) => (
        <Space size={4}>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openDrawer(record)}>修改</Button>
          <Popconfirm title="确定删除该预警规则？" onConfirm={() => { setData(data.filter((r) => r.id !== record.id)); message.success('已删除') }}>
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
            placeholder="请输入预警规则名称"
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
          <Select
            style={{ width: 140 }}
            placeholder="启用"
            allowClear
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            options={[{ value: '启用', label: '启用' }, { value: '停用', label: '停用' }]}
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
        scroll={{ x: 1100 }}
      />

      {/* 新增 / 修改抽屉 */}
      <Drawer
        title={editing ? '修改预警规则' : '新增预警规则'}
        open={open}
        onClose={() => setOpen(false)}
        width={860}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSave}>保存</Button>
            </Space>
          </div>
        }
      >
        <Form form={form} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 80px' }} wrapperCol={{ flex: '1 1 auto' }}>
          {/* 一行三格：预警规则占两格、状态占一格 */}
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item label="预警规则" name="name" rules={[{ required: true, message: '请输入预警规则名称' }]}>
                <Input placeholder="请输入预警规则" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
                <Select
                  options={[{ value: '启用', label: '启用' }, { value: '停用', label: '停用' }]}
                  placeholder="请选择状态"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="描述" name="description">
            <Input placeholder="请输入规则描述（选填）" maxLength={100} />
          </Form.Item>
        </Form>

        {/* 字段命名注意说明 */}
        <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, fontSize: 13, color: '#ad6800' }}>
          注意：科室 id 字段必须为 <Text code>xxxxid</Text>、职员 id 必须为 <Text code>xxxuserid</Text>，用于时间判断的字段必须为 <Text code>xxxtimes</Text>，该字段将用于匹配提醒节点；SQL语句数据为“离生日还差xx天、离转正到期还差xx天”等内容输出
        </div>

        {/* SQL 编辑区 */}
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              SQL
              <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>
            </span>
            <Button size="small" type="primary" ghost icon={<CheckCircleOutlined />} onClick={handleValidate}>校验</Button>
          </div>
          <Input.TextArea
            rows={14}
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            placeholder={'请输入查询 SQL，例如：\nSELECT name, dept FROM t_staff WHERE status = \'在职\''}
            style={{ border: 'none', boxShadow: 'none', fontFamily: 'Consolas, Monaco, monospace', fontSize: 13, resize: 'vertical' }}
          />
        </div>
      </Drawer>
    </div>
  )
}

export default AlertRule
