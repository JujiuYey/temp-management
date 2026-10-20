import React, { useState, useMemo } from 'react'
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
  Row,
  Col,
  DatePicker,
  message,
  Typography,
  Descriptions,
  Upload,
  Timeline,
  Empty,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  FileSearchOutlined,
  UploadOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

// ==================== 类型定义 ====================

/** 随访方式 / 疗效评估 */
type FollowMethod = '门诊复诊' | '电话随访' | '住院复查' | '线上随访'
type FollowEffect = '显效' | '有效' | '部分有效' | '无效' | '失访'

/** 一次随访记录 */
interface FollowItem {
  id: string
  followDate: string
  method: FollowMethod
  treatment: string        // 按专家意见治疗后的情况
  outcome: string          // 病情变化/检查结果
  effect: FollowEffect
  recorder: string         // 随访人
  attachments?: string[]
}

/** 已完成会诊（随访对象） */
interface CompletedConsult {
  id: string
  code: string
  consultationType: string // mdt / remote / regular
  patientName: string
  patientGender: '男' | '女'
  patientAge: number
  diagnosis: string
  applyDept: string
  applicant: string
  consultDate: string      // 完成时间
  consultOpinion: string   // 会诊意见 / 专家意见（综合方案）
  followItems: FollowItem[]
}

// ==================== 数据准备 ====================

const INITIAL_COMPLETED: CompletedConsult[] = [
  {
    id: 'CONS-2026-REMOTE-05', code: 'CONS-2026-REMOTE-05', consultationType: 'remote',
    patientName: '刘洋', patientGender: '男', patientAge: 58,
    diagnosis: '膜性肾病（Ⅱ期）', applyDept: '肾内科', applicant: '周建国',
    consultDate: '2026-08-28 16:20:00',
    consultOpinion: '远程专家会诊意见：建议予利妥昔单抗（375mg/m²，每周1次）联合糖皮质激素规范治疗；每4周复查24h尿蛋白定量与血清白蛋白，监测血常规及肝肾功能；治疗3个月后复评疗效决定后续方案。',
    followItems: [
      {
        id: 'F-1', followDate: '2026-09-08 09:40:00', method: '门诊复诊',
        treatment: '已遵会诊意见于8月30日启动利妥昔单抗治疗，同时口服泼尼松30mg/d。',
        outcome: '24h尿蛋白由8.2g降至4.6g，血清白蛋白回升至31g/L，双下肢水肿明显消退。',
        effect: '有效', recorder: '张明',
        attachments: ['尿蛋白复查报告.png'],
      },
    ],
  },
  {
    id: 'CONS-2026-MDT-102', code: 'CONS-2026-MDT-102', consultationType: 'mdt',
    patientName: '张明', patientGender: '男', patientAge: 63,
    diagnosis: '右肺上叶腺癌（cT2N1M0 ⅢA期）', applyDept: '胸外科', applicant: '王建国',
    consultDate: '2026-08-20 11:00:00',
    consultOpinion: 'MDT综合意见：先行新辅助免疫联合化疗（帕博利珠单抗+紫杉醇+卡铂）2周期，4周后复查CT评估肿瘤退缩情况，达PR及以上后限期行胸腔镜右肺上叶切除术。',
    followItems: [],
  },
  {
    id: 'CONS-2026-REG-88', code: 'CONS-2026-REG-88', consultationType: 'regular',
    patientName: '李华', patientGender: '男', patientAge: 50,
    diagnosis: '冠心病三支病变（左主干可疑）', applyDept: '心血管内科', applicant: '陈志强',
    consultDate: '2026-08-15 15:30:00',
    consultOpinion: '会诊意见：左主干开口狭窄约60%，建议完善IVUS评估后择期行PCI术，术前双联抗血小板（阿司匹林+氯吡格雷）强化1周；同时强化他汀降脂治疗。',
    followItems: [
      {
        id: 'F-2', followDate: '2026-08-22 10:10:00', method: '电话随访',
        treatment: '已按意见口服双抗及强化他汀，暂未出现胸闷发作，拟下周住院行IVUS+PCI。',
        outcome: '一般情况平稳，血压血脂控制可。',
        effect: '有效', recorder: '张明',
      },
      {
        id: 'F-3', followDate: '2026-09-05 14:20:00', method: '住院复查',
        treatment: '已完成IVUS指导下行LAD-LCX双支架植入术，术后规律双抗、他汀治疗。',
        outcome: '术后复查心电图较前改善，活动耐量明显提高，无胸痛发作。',
        effect: '显效', recorder: '张明',
        attachments: ['出院小结.pdf'],
      },
    ],
  },
]

const CONSULT_TYPE_COLOR: Record<string, string> = {
  mdt: '#722ed1', remote: '#13c2c2', regular: '#1677ff',
}
const CONSULT_TYPE_LABEL: Record<string, string> = {
  mdt: 'MDT会诊', remote: '远程会诊', regular: '单科会诊',
}

const METHOD_OPTIONS: { label: string; value: FollowMethod }[] = [
  { label: '门诊复诊', value: '门诊复诊' },
  { label: '电话随访', value: '电话随访' },
  { label: '住院复查', value: '住院复查' },
  { label: '线上随访', value: '线上随访' },
]
const EFFECT_OPTIONS: { label: string; value: FollowEffect }[] = [
  { label: '显效', value: '显效' },
  { label: '有效', value: '有效' },
  { label: '部分有效', value: '部分有效' },
  { label: '无效', value: '无效' },
  { label: '失访', value: '失访' },
]

const EFFECT_COLOR: Record<FollowEffect, string> = {
  '显效': 'red', '有效': 'volcano', '部分有效': 'gold', '无效': 'default', '失访': 'default',
}

// ==================== 页面 ====================

const ConsultationFollowup: React.FC = () => {
  const [data, setData] = useState<CompletedConsult[]>(INITIAL_COMPLETED)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'none' | 'done'>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'view' | 'register'>('view')
  const [active, setActive] = useState<CompletedConsult | null>(null)
  const [form] = Form.useForm()

  const filtered = useMemo(() => {
    let list = data
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.patientName.toLowerCase().includes(kw) ||
          r.code.toLowerCase().includes(kw) ||
          r.diagnosis.includes(searchText.trim()),
      )
    }
    if (statusFilter === 'none') list = list.filter((r) => r.followItems.length === 0)
    if (statusFilter === 'done') list = list.filter((r) => r.followItems.length > 0)
    return list
  }, [data, searchText, statusFilter])

  /** 查看：展示会诊信息 + 全部随访记录，不新增 */
  const openView = (r: CompletedConsult) => {
    setActive(r)
    setDrawerMode('view')
    setDrawerOpen(true)
  }

  /** 随访登记：仅显示新增随访记录表单 */
  const openRegister = (r: CompletedConsult) => {
    setActive(r)
    setDrawerMode('register')
    form.resetFields()
    setDrawerOpen(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (!active) return
      const item: FollowItem = {
        id: `F-${Date.now()}`,
        followDate: (values.followDate as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss'),
        method: values.method,
        treatment: values.treatment,
        outcome: values.outcome || '',
        effect: values.effect,
        recorder: values.recorder,
        attachments: (values.attachments || []).map((f: UploadFile) => f.name),
      }
      setData((prev) =>
        prev.map((c) => (c.id === active.id ? { ...c, followItems: [item, ...c.followItems] } : c)),
      )
      setActive((cur) => (cur ? { ...cur, followItems: [item, ...cur.followItems] } : cur))
      message.success('随访记录已保存')
      form.resetFields()
    })
  }

  const columns: ColumnsType<CompletedConsult> = [
    { title: '序号', width: 56, align: 'center', render: (_, __, i) => i + 1 },
    {
      title: '会诊编码', dataIndex: 'code', width: 160,
      render: (v: string) => <Text strong style={{ color: '#1677ff', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '会诊类型', dataIndex: 'consultationType', width: 90,
      render: (v: string) => <Tag color={CONSULT_TYPE_COLOR[v]}>{CONSULT_TYPE_LABEL[v]}</Tag>,
    },
    {
      title: '患者', key: 'patient', width: 120,
      render: (_, r) => `${r.patientName}（${r.patientGender}，${r.patientAge}岁）`,
    },
    { title: '诊断', dataIndex: 'diagnosis', width: 150, render: (v: string) => <Text ellipsis={{ tooltip: v }}>{v}</Text> },
    { title: '申请科室', dataIndex: 'applyDept', width: 100 },
    { title: '会诊完成时间', dataIndex: 'consultDate', width: 160 },
    {
      title: '随访状态', key: 'followStatus', width: 130,
      render: (_, r) =>
        r.followItems.length > 0
          ? <Tag color="processing" icon={<PhoneOutlined />}>已随访 {r.followItems.length} 次</Tag>
          : <Tag>未随访</Tag>,
    },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openView(r)}>查看</Button>
          <Button type="link" size="small" icon={<FileSearchOutlined />} onClick={() => openRegister(r)}>
            {r.followItems.length > 0 ? '记录随访' : '首次随访'}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: 4, height: 16, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>随访管理</span>
          </div>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="搜索患者/编码/诊断"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 210 }}
            />
            <Select
              placeholder="随访状态"
              allowClear
              value={statusFilter === 'all' ? undefined : statusFilter}
              onChange={(v) => setStatusFilter(v ?? 'all')}
              style={{ width: 130 }}
              options={[
                { label: '未随访', value: 'none' },
                { label: '已随访', value: 'done' },
              ]}
            />
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        size="small"
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      {/* 随访抽屉 */}
      <Drawer
        title={drawerMode === 'register'
          ? `随访登记 · ${active?.patientName || ''}`
          : `随访记录 · ${active?.patientName || ''}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={760}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {active && drawerMode === 'view' && (
          <>
            {/* 会诊与专家意见 */}
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>会诊信息</div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 12 }}>
              <Descriptions.Item label="会诊编码" span={2}>{active.code}</Descriptions.Item>
              <Descriptions.Item label="会诊类型">
                <Tag color={CONSULT_TYPE_COLOR[active.consultationType]}>{CONSULT_TYPE_LABEL[active.consultationType]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="会诊完成时间">{active.consultDate}</Descriptions.Item>
              <Descriptions.Item label="患者">
                {active.patientName}（{active.patientGender}，{active.patientAge}岁）
              </Descriptions.Item>
              <Descriptions.Item label="诊断">{active.diagnosis}</Descriptions.Item>
              <Descriptions.Item label="申请科室">{active.applyDept}</Descriptions.Item>
              <Descriptions.Item label="申请人">{active.applicant}</Descriptions.Item>
            </Descriptions>
            <div style={{ background: '#f0f5ff', borderRadius: 8, padding: '12px 16px', marginBottom: 20, border: '1px solid #d6e4ff' }}>
              <div style={{ color: '#1677ff', fontWeight: 600, marginBottom: 6 }}>
                <FileSearchOutlined style={{ marginRight: 6 }} />会诊意见（专家意见）
              </div>
              <div style={{ fontSize: 13, color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{active.consultOpinion}</div>
            </div>

            {/* 历史随访 */}
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>随访记录</div>
            {active.followItems.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无随访记录" style={{ margin: '8px 0 16px' }} />
            ) : (
              <Timeline
                style={{ marginBottom: 20, marginTop: 8 }}
                items={active.followItems.map((f) => ({
                  color: 'blue',
                  children: (
                    <div style={{ background: '#fafafa', borderRadius: 8, padding: '10px 14px', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <Text strong>{f.followDate}</Text>
                        <Tag color="geekblue">{f.method}</Tag>
                        <Tag color={EFFECT_COLOR[f.effect]}>{f.effect}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>随访人：{f.recorder}</Text>
                      </div>
                      <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7 }}>
                        <div><Text type="secondary">按专家意见治疗情况：</Text>{f.treatment}</div>
                        {f.outcome && <div style={{ marginTop: 4 }}><Text type="secondary">病情变化/检查：</Text>{f.outcome}</div>}
                        {f.attachments && f.attachments.length > 0 && (
                          <div style={{ marginTop: 4, color: '#1677ff', fontSize: 12 }}>
                            <UploadOutlined style={{ marginRight: 4 }} />{f.attachments.join('、')}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </>
        )}

        {/* 新增随访记录：登记模式仅显示表单，不含历史记录 */}
        {active && drawerMode === 'register' && (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>新增随访记录</div>
            <Form form={form} layout="vertical" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="followDate" label="随访时间" rules={[{ required: true, message: '请选择随访时间' }]}>
                    <DatePicker
                      style={{ width: '100%' }}
                      showTime={{ format: 'HH:mm:ss' }}
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="选择随访时间"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="method" label="随访方式" rules={[{ required: true, message: '请选择随访方式' }]}>
                    <Select placeholder="请选择随访方式" options={METHOD_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="treatment"
                label="按专家意见治疗后的情况"
                rules={[{ required: true, message: '请填写治疗后情况' }]}
                extra="记录患者是否按会诊/专家意见执行了相应治疗，以及治疗后的身体反应与变化。"
              >
                <Input.TextArea rows={3} placeholder="如：已遵意见于XX开始行XX治疗，目前…" />
              </Form.Item>
              <Form.Item name="outcome" label="病情变化 / 检查结果">
                <Input.TextArea rows={2} placeholder="症状、体征及复查指标变化（可留空）" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="effect" label="疗效评估" rules={[{ required: true, message: '请选择疗效评估' }]}>
                    <Select placeholder="请选择疗效评估" options={EFFECT_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="recorder" label="随访人" rules={[{ required: true, message: '请填写随访人' }]}>
                    <Input placeholder="随访人姓名" defaultValue="张明" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="attachments"
                label="附件上传"
                valuePropName="fileList"
                getValueFromEvent={(e: any) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload beforeUpload={() => false} listType="text" maxCount={5}>
                  <Button icon={<UploadOutlined />}>上传附件（检查报告等）</Button>
                </Upload>
              </Form.Item>
            </Form>
          </>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setDrawerOpen(false)}>关闭</Button>
          {drawerMode === 'register' && (
            <Button type="primary" onClick={handleSubmit}>保存随访记录</Button>
          )}
        </div>
      </Drawer>
    </Card>
  )
}

export default ConsultationFollowup
