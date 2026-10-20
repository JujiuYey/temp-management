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
  message,
  Typography,
  Descriptions,
  Upload,
  Empty,
  Tabs,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  CheckSquareOutlined,
  EditOutlined,
  RollbackOutlined,
  UploadOutlined,
  UserOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'
import { mdtTeams } from './mockData'

const { Text } = Typography

// ==================== 类型定义 ====================

/** 签到明细行：一场会诊 × 一位参加医师 */
interface SignRow {
  key: string
  consultId: string
  consultCode: string
  consultationType: string      // mdt / remote / external
  patientName: string
  patientGender: '男' | '女'
  patientAge: number
  diagnosis: string
  applyDept: string
  consultTime: string
  meetingRoom: string
  doctorName: string
  doctorDept: string
  doctorTitle: string
  signed: boolean
  signTime?: string
  opinion?: { content: string; opinionTime: string; attachments: string[] }
}

/** 生成签到行的会诊源（含参加医师） */
interface SignSource {
  consultId: string
  consultationType: 'mdt' | 'remote'
  patientName: string
  patientGender: '男' | '女'
  patientAge: number
  diagnosis: string
  applyDept: string
  consultTime: string
  meetingRoom: string
  doctors: { name: string; dept: string; title: string }[]
}

// ==================== 数据准备 ====================

// 肺癌症MDT团队名 → mdtTeams 中实际成员（用于与团队数据保持一致）
const LUNG_TEAM = mdtTeams.find((t) => t.teamName.includes('肺癌'))
const lungDoctors = (LUNG_TEAM?.members || []).map((m) => ({
  name: m.name, dept: m.dept, title: m.title,
}))

// 已安排 / 进行中的会诊快照（演示签到场景），按参加医师展开为明细行
const SIGN_SOURCES: SignSource[] = [
  {
    consultId: 'CONS-2026-REMOTE-03',
    consultationType: 'remote',
    patientName: '赵建国', patientGender: '男', patientAge: 56,
    diagnosis: '难治性心力衰竭', applyDept: '心血管内科',
    consultTime: '2026-09-12 15:00:00', meetingRoom: '远程会诊室',
    doctors: [
      { name: '王远程', dept: '远程医学中心', title: '副主任医师' },
      { name: '李秀英', dept: '心血管内科', title: '主任医师' },
      { name: '陈志强', dept: '心血管内科', title: '主任医师' },
    ],
  },
  {
    consultId: 'CONS-2026-MDT-118',
    consultationType: 'mdt',
    patientName: '陈静', patientGender: '女', patientAge: 55,
    diagnosis: '右肺占位性质待查', applyDept: '肿瘤科',
    consultTime: '2026-09-13 09:30:00', meetingRoom: 'MDT会议室',
    doctors: lungDoctors.length ? lungDoctors : [
      { name: '王建国', dept: '胸外科', title: '主任医师' },
      { name: '李秀兰', dept: '肿瘤科', title: '主任医师' },
    ],
  },
  {
    consultId: 'CONS-2026-REMOTE-04',
    consultationType: 'remote',
    patientName: '孙丽', patientGender: '女', patientAge: 62,
    diagnosis: '复发难治性淋巴瘤', applyDept: '血液内科',
    consultTime: '2026-09-09 10:00:00', meetingRoom: '远程会诊室',
    doctors: [
      { name: '王远程', dept: '远程医学中心', title: '副主任医师' },
      { name: '陈志强', dept: '心血管内科', title: '主任医师' },
    ],
  },
]

// 生成初始明细行（默认未签到；REMOTE-04 的王远程已签到用于演示后续「会诊意见」入口）
function buildInitialRows(): SignRow[] {
  const rows: SignRow[] = []
  SIGN_SOURCES.forEach((s) => {
    s.doctors.forEach((d, di) => {
      rows.push({
        key: `${s.consultId}-${di}`,
        consultId: s.consultId,
        consultCode: s.consultId,
        consultationType: s.consultationType,
        patientName: s.patientName,
        patientGender: s.patientGender,
        patientAge: s.patientAge,
        diagnosis: s.diagnosis,
        applyDept: s.applyDept,
        consultTime: s.consultTime,
        meetingRoom: s.meetingRoom,
        doctorName: d.name,
        doctorDept: d.dept,
        doctorTitle: d.title,
        signed: s.consultId === 'CONS-2026-REMOTE-04' && d.name === '王远程',
        signTime: s.consultId === 'CONS-2026-REMOTE-04' && d.name === '王远程' ? '2026-09-09 09:58:12' : undefined,
        opinion: s.consultId === 'CONS-2026-REMOTE-04' && d.name === '王远程'
          ? {
              content: '结合患者既往化疗史，建议完善PET-CT评估肿瘤负荷后，考虑行CAR-T桥接异基因造血干细胞移植。',
              opinionTime: '2026-09-09 10:35:20',
              attachments: ['会诊意见记录.pdf'],
            }
          : undefined,
      })
    })
  })
  return rows
}

const CONSULT_TYPE_LABEL: Record<string, string> = {
  mdt: 'MDT会诊', remote: '远程会诊', external: '外请会诊',
}

// ==================== 待会诊（签到抽屉）类型与数据 ====================

/** 待会诊记录（签到抽屉三个 Tab 共用） */
interface PendingRow {
  id: string
  applyDept: string      // 申请科室
  patientName: string    // 姓名（患者）
  inpatientNo: string    // 住院号
  consultTime: string    // 会诊时间
  signed: boolean
}

/** 三种待会诊类型：个人 / 科室 / 团队 */
type PendingKind = 'personal' | 'dept' | 'team'

const PENDING_TAB_LABEL: Record<PendingKind, string> = {
  personal: '个人待会诊',
  dept: '科室待会诊',
  team: '团队待会诊',
}

/** 初始待会诊数据（点击左上「签到」弹出） */
const INITIAL_PENDING: Record<PendingKind, PendingRow[]> = {
  personal: [
    { id: 'P-1', applyDept: '神经内科', patientName: '刘洋', inpatientNo: 'ZY-2026-0318', consultTime: '2026-09-10 10:00:00', signed: false },
    { id: 'P-2', applyDept: '肾内科', patientName: '王芳', inpatientNo: 'ZY-2026-0452', consultTime: '2026-09-11 09:30:00', signed: false },
    { id: 'P-3', applyDept: '心血管内科', patientName: '李建国', inpatientNo: 'ZY-2026-0476', consultTime: '2026-09-12 15:00:00', signed: false },
  ],
  dept: [
    { id: 'D-1', applyDept: '呼吸内科', patientName: '陈刚', inpatientNo: 'ZY-2026-0521', consultTime: '2026-09-10 14:30:00', signed: false },
    { id: 'D-2', applyDept: '呼吸内科', patientName: '周敏', inpatientNo: 'ZY-2026-0577', consultTime: '2026-09-12 11:00:00', signed: false },
    { id: 'D-3', applyDept: '呼吸内科', patientName: '吴丽', inpatientNo: 'ZY-2026-0590', consultTime: '2026-09-13 09:00:00', signed: false },
  ],
  team: [
    { id: 'T-1', applyDept: '肿瘤科', patientName: '陈静', inpatientNo: 'ZY-2026-0601', consultTime: '2026-09-13 09:30:00', signed: false },
    { id: 'T-2', applyDept: '胸外科', patientName: '郑涛', inpatientNo: 'ZY-2026-0633', consultTime: '2026-09-14 10:00:00', signed: false },
    { id: 'T-3', applyDept: '血液内科', patientName: '孙丽', inpatientNo: 'ZY-2026-0648', consultTime: '2026-09-15 15:30:00', signed: false },
  ],
}

// ==================== 页面 ====================

const ConsultationCheckIn: React.FC = () => {
  const [rows, setRows] = useState<SignRow[]>(buildInitialRows)
  const [searchText, setSearchText] = useState('')
  const [signFilter, setSignFilter] = useState<'all' | 'unsigned' | 'signed'>('all')
  // 操作抽屉：action = sign-info(查看) / opinion(填写会诊意见)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeRow, setActiveRow] = useState<SignRow | null>(null)
  const [opinionMode, setOpinionMode] = useState(false)
  const [opinionForm] = Form.useForm()
  // 左上「签到」抽屉：个人/科室/团队待会诊
  const [signInOpen, setSignInOpen] = useState(false)
  const [pendingTabs, setPendingTabs] = useState<Record<PendingKind, PendingRow[]>>(INITIAL_PENDING)
  const [pendingActive, setPendingActive] = useState<PendingKind>('personal')

  const filtered = useMemo(() => {
    let list = rows
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.patientName.toLowerCase().includes(kw) ||
          r.doctorName.toLowerCase().includes(kw) ||
          r.consultCode.toLowerCase().includes(kw),
      )
    }
    if (signFilter === 'unsigned') list = list.filter((r) => !r.signed)
    if (signFilter === 'signed') list = list.filter((r) => r.signed)
    return list
  }, [rows, searchText, signFilter])

  // 点击签到：仅未签到行可签到
  const handleSign = (row: SignRow) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === row.key
          ? { ...r, signed: true, signTime: dayjs().format('YYYY-MM-DD HH:mm:ss') }
          : r,
      ),
    )
    message.success(`${row.doctorName} 签到成功`)
  }

  // 取消签到：已签到行可取消（清空签到时间，保留已填写的会诊意见）
  const handleCancelSign = (row: SignRow) => {
    setRows((prev) =>
      prev.map((r) => (r.key === row.key ? { ...r, signed: false, signTime: undefined } : r)),
    )
    message.success(`${row.doctorName} 已取消签到`)
  }

  // ===== 待会诊签到抽屉 =====

  /** 签到抽屉中执行签到 */
  const handlePendingSign = (kind: PendingKind, row: PendingRow) => {
    setPendingTabs((prev) => ({
      ...prev,
      [kind]: prev[kind].map((r) => (r.id === row.id ? { ...r, signed: true } : r)),
    }))
    message.success(`「${PENDING_TAB_LABEL[kind]}」患者 ${row.patientName} 签到成功`)
  }

  /** 待会诊列表列（三个 Tab 共用，按 kind 绑定签到） */
  const buildPendingColumns = (kind: PendingKind): ColumnsType<PendingRow> => [
    { title: '序号', width: 56, align: 'center', render: (_, __, i) => i + 1 },
    { title: '申请科室', dataIndex: 'applyDept', width: 120 },
    { title: '姓名', dataIndex: 'patientName', width: 100, render: (v: string) => <Text strong>{v}</Text> },
    { title: '住院号', dataIndex: 'inpatientNo', width: 140, render: (v: string) => <Text code>{v}</Text> },
    { title: '会诊时间', dataIndex: 'consultTime', width: 170 },
    {
      title: '操作', width: 110, fixed: 'right' as const,
      render: (_, r) =>
        r.signed ? (
          <Tag color="success" icon={<CheckSquareOutlined />}>已签到</Tag>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<CheckSquareOutlined />}
            onClick={() => handlePendingSign(kind, r)}
          >
            签到
          </Button>
        ),
    },
  ]

  /** 构建某个 Tab 的待会诊表格 */
  const renderPendingTable = (kind: PendingKind) => (
    <Table<PendingRow>
      columns={buildPendingColumns(kind)}
      dataSource={pendingTabs[kind]}
      rowKey="id"
      size="small"
      scroll={{ x: 700 }}
      pagination={false}
    />
  )

  const openView = (row: SignRow) => {
    setActiveRow(row)
    setOpinionMode(false)
    setDrawerOpen(true)
  }

  const openOpinion = (row: SignRow) => {
    setActiveRow(row)
    setOpinionMode(true)
    setDrawerOpen(true)
    opinionForm.resetFields()
    if (row.opinion) {
      opinionForm.setFieldsValue({
        opinion: row.opinion.content,
        attachments: row.opinion.attachments.map((n) => ({ name: n, uid: n, status: 'done' as const })),
      })
    }
  }

  const handleOpinionSave = () => {
    opinionForm.validateFields().then((values) => {
      if (!activeRow) return
      const attachments = (values.attachments || []).map((f: UploadFile) => f.name)
      const opinion = {
        content: values.opinion,
        opinionTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        attachments,
      }
      setRows((prev) =>
        prev.map((r) => (r.key === activeRow.key ? { ...r, opinion } : r)),
      )
      message.success('会诊意见已保存')
      setDrawerOpen(false)
    })
  }

  const columns: ColumnsType<SignRow> = [
    { title: '序号', width: 56, align: 'center', render: (_, __, i) => i + 1 },
    {
      title: '会诊编码', dataIndex: 'consultCode', width: 150,
      render: (v: string) => <Text strong style={{ color: '#1677ff', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '会诊类型', dataIndex: 'consultationType', width: 90,
      render: (v: string) => <Tag color={v === 'mdt' ? '#722ed1' : '#13c2c2'}>{CONSULT_TYPE_LABEL[v]}</Tag>,
    },
    { title: '患者', dataIndex: 'patientName', width: 80 },
    {
      title: '诊断', dataIndex: 'diagnosis', width: 140,
      render: (v: string, r) => (
        <Text ellipsis={{ tooltip: v }}>
          {v}{r.patientGender === '男' ? ' · 男' : ' · 女'}{r.patientAge}岁
        </Text>
      ),
    },
    { title: '会诊时间', dataIndex: 'consultTime', width: 150 },
    { title: '会议室', dataIndex: 'meetingRoom', width: 110 },
    {
      title: '参加医师', dataIndex: 'doctorName', width: 90,
      render: (v: string) => <Space size={4}><UserOutlined style={{ color: '#1677ff' }} /><Text strong>{v}</Text></Space>,
    },
    { title: '所属科室', dataIndex: 'doctorDept', width: 110 },
    { title: '职称', dataIndex: 'doctorTitle', width: 90 },
    {
      title: '签到状态', dataIndex: 'signed', width: 110,
      render: (v: boolean, r) => v
        ? <Tag color="success" icon={<CheckSquareOutlined />}>已签到</Tag>
        : <Tag color="default">待签到</Tag>,
    },
    {
      title: '签到时间', dataIndex: 'signTime', width: 150,
      render: (v?: string) => v || <Text style={{ color: '#d9d9d9' }}>-</Text>,
    },
    {
      title: '操作', width: 160, fixed: 'right' as const,
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openView(r)}>查看</Button>
          {!r.signed ? (
            <Button
              type="primary"
              size="small"
              icon={<CheckSquareOutlined />}
              onClick={() => handleSign(r)}
            >
              签到
            </Button>
          ) : (
            <>
              <Button
                type="primary"
                size="small"
                style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                icon={<EditOutlined />}
                onClick={() => openOpinion(r)}
              >
                会诊意见
              </Button>
              <Button
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => handleCancelSign(r)}
              >
                取消
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ display: 'inline-block', width: 4, height: 16, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
              <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>签到管理</span>
            </div>
            <Button type="primary" icon={<AuditOutlined />} onClick={() => setSignInOpen(true)}>
              签到
            </Button>
          </div>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="搜索患者/医师/编码"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 210 }}
            />
            <Select
              placeholder="签到状态"
              allowClear
              value={signFilter === 'all' ? undefined : signFilter}
              onChange={(v) => setSignFilter(v ?? 'all')}
              style={{ width: 120 }}
              options={[
                { label: '待签到', value: 'unsigned' },
                { label: '已签到', value: 'signed' },
              ]}
            />
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="key"
        size="small"
        scroll={{ x: 1500 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      {/* 待会诊签到抽屉（左上「签到」按钮） */}
      <Drawer
        title="待会诊签到"
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        width={760}
      >
        <Tabs
          activeKey={pendingActive}
          onChange={(k) => setPendingActive(k as PendingKind)}
          items={([
            'personal',
            'dept',
            'team',
          ] as PendingKind[]).map((kind) => ({
            key: kind,
            label: PENDING_TAB_LABEL[kind],
            children: renderPendingTable(kind),
          }))}
        />
      </Drawer>

      {/* 查看 / 会诊意见 抽屉 */}
      <Drawer
        title={opinionMode ? '会诊意见' : '签到明细'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={680}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {activeRow && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="会诊编码" span={2}>{activeRow.consultCode}</Descriptions.Item>
              <Descriptions.Item label="会诊类型">
                <Tag color={activeRow.consultationType === 'mdt' ? '#722ed1' : '#13c2c2'}>
                  {CONSULT_TYPE_LABEL[activeRow.consultationType]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="会诊时间">{activeRow.consultTime}</Descriptions.Item>
              <Descriptions.Item label="患者">
                {activeRow.patientName}（{activeRow.patientGender}，{activeRow.patientAge}岁）
              </Descriptions.Item>
              <Descriptions.Item label="诊断">{activeRow.diagnosis}</Descriptions.Item>
              <Descriptions.Item label="会议室">{activeRow.meetingRoom}</Descriptions.Item>
              <Descriptions.Item label="申请科室">{activeRow.applyDept}</Descriptions.Item>
              <Descriptions.Item label="参加医师">
                {activeRow.doctorName}（{activeRow.doctorDept} · {activeRow.doctorTitle}）
              </Descriptions.Item>
              <Descriptions.Item label="签到状态">
                {activeRow.signed
                  ? <Tag color="success" icon={<CheckSquareOutlined />}>{activeRow.signTime}</Tag>
                  : <Tag>待签到</Tag>}
              </Descriptions.Item>
            </Descriptions>

            {!opinionMode ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>会诊意见</div>
                {activeRow.opinion ? (
                  <>
                    <div style={{ background: '#fafafa', borderRadius: 8, padding: '14px 18px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: '#333' }}>
                      {activeRow.opinion.content}
                    </div>
                    <div style={{ marginTop: 10, color: '#999', fontSize: 12 }}>
                      填写时间：{activeRow.opinion.opinionTime}
                      {activeRow.opinion.attachments.length > 0 && (
                        <span style={{ marginLeft: 16 }}>
                          <UploadOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                          {activeRow.opinion.attachments.join('、')}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该医师尚未填写会诊意见" />
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>会诊意见</div>
                <Form form={opinionForm} layout="vertical" size="small">
                  <Form.Item
                    name="opinion"
                    label="意见内容"
                    rules={[{ required: true, message: '请填写会诊意见' }]}
                  >
                    <Input.TextArea rows={6} placeholder="请填写对该患者的会诊意见（诊断建议、治疗方案等）" />
                  </Form.Item>
                  <Form.Item
                    name="attachments"
                    label="附件上传"
                    valuePropName="fileList"
                    getValueFromEvent={(e: any) => (Array.isArray(e) ? e : e?.fileList)}
                  >
                    <Upload beforeUpload={() => false} listType="text" maxCount={5}>
                      <Button icon={<UploadOutlined />}>上传附件</Button>
                    </Upload>
                  </Form.Item>
                </Form>
              </>
            )}
          </>
        )}

        {opinionMode && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleOpinionSave}>保存会诊意见</Button>
          </div>
        )}
      </Drawer>
    </Card>
  )
}

export default ConsultationCheckIn
