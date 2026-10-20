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
  Popconfirm,
  Typography,
  Descriptions,
  InputNumber,
  Upload,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  AimOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

// ==================== 类型定义 ====================

interface FinalizeRecord {
  id: string
  staffName: string
  employeeNo: string
  deptName: string            // 轮转科室（当前轮转所在科室）
  rotationEndDate: string     // 轮转结束日期
  targetDept: string          // 定科科室（最终科室）
  theoryScore: number | null  // 理论考核成绩
  skillScore: number | null   // 技能考核成绩
  dailyRating: string         // 日常考核评价
  teacherRating: string       // 带教老师评价
  deptOpinion: string         // 科室考核意见
  applyDate: string
  approvalStatus: '待审批' | '已通过' | '已驳回'
  approver: string
  approveDate: string
  approveComment: string
  attachments?: string[]
}

// ==================== 常量 ====================

const DEPT_OPTIONS = [
  '内科', '外科', '妇产科', '儿科', '急诊科', '麻醉科',
  '检验科', 'ICU', '心电图室', '神经内科', '骨科',
].map((d) => ({ label: d, value: d }))

const RATING_OPTIONS = ['优秀', '良好', '合格', '不合格'].map((v) => ({ label: v, value: v }))

const STAFF_OPTIONS = [
  { id: 's1', name: '张明', employeeNo: 'EMP001', dept: 'ICU', plannedEndDate: '2026-09-30' },
  { id: 's2', name: '李华', employeeNo: 'EMP002', dept: '儿科', plannedEndDate: '2026-10-31' },
  { id: 's3', name: '王芳', employeeNo: 'EMP003', dept: '内科', plannedEndDate: '2026-11-30' },
  { id: 's4', name: '刘强', employeeNo: 'EMP004', dept: '内科', plannedEndDate: '2026-12-15' },
  { id: 's5', name: '孙莉', employeeNo: 'EMP007', dept: 'ICU', plannedEndDate: '2026-09-15' },
]

// 当前登录用户（本人）：新增定科申请时自动选定为申请人
const CURRENT_USER = STAFF_OPTIONS.find((s) => s.id === 's1')!

const statusConfig: Record<string, { color: string; text: string }> = {
  '待审批': { color: 'processing', text: '待审批' },
  '已通过': { color: 'success', text: '已通过' },
  '已驳回': { color: 'error', text: '已驳回' },
}

const mockData: FinalizeRecord[] = [
  {
    id: '1', staffName: '张明', employeeNo: 'EMP001', deptName: 'ICU', rotationEndDate: '2026-09-30',
    targetDept: '急诊科', theoryScore: 92, skillScore: 88, dailyRating: '优秀', teacherRating: '优秀',
    deptOpinion: '轮转期间掌握危重症患者救治流程，独立完成气管插管配合及呼吸机管理，同意定科急诊科。',
    applyDate: '2026-09-05 10:20:00', approvalStatus: '已通过', approver: '王主任', approveDate: '2026-09-06',
    approveComment: '考核成绩合格，同意定科急诊科',
  },
  {
    id: '2', staffName: '李华', employeeNo: 'EMP002', deptName: '儿科', rotationEndDate: '2026-10-31',
    targetDept: '儿科', theoryScore: 85, skillScore: 90, dailyRating: '良好', teacherRating: '优秀',
    deptOpinion: '儿科常见病诊疗规范掌握良好，医患沟通能力突出，建议定科儿科。',
    applyDate: '2026-09-03 15:40:00', approvalStatus: '待审批', approver: '', approveDate: '', approveComment: '',
  },
  {
    id: '3', staffName: '孙莉', employeeNo: 'EMP007', deptName: 'ICU', rotationEndDate: '2026-09-15',
    targetDept: 'ICU', theoryScore: 88, skillScore: 94, dailyRating: '优秀', teacherRating: '优秀',
    deptOpinion: '血流动力学监测技术扎实，应急处置能力强，同意定科ICU。',
    applyDate: '2026-09-01 09:10:00', approvalStatus: '已通过', approver: '周主任', approveDate: '2026-09-02',
    approveComment: '同意定科ICU，后续重点培养重症专科方向',
  },
  {
    id: '4', staffName: '王芳', employeeNo: 'EMP003', deptName: '内科', rotationEndDate: '2026-11-30',
    targetDept: '神经内科', theoryScore: 72, skillScore: 78, dailyRating: '合格', teacherRating: '良好',
    deptOpinion: '基本掌握内科常见病诊疗，但病历书写规范性有待加强。',
    applyDate: '2026-09-04 14:30:00', approvalStatus: '已驳回', approver: '王主任', approveDate: '2026-09-05',
    approveComment: '理论成绩偏低，建议加强学习后重新提交定科申请',
  },
]

const RotationFinalize: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'apply' | 'view'>('apply')
  const [editingRecord, setEditingRecord] = useState<FinalizeRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [data, setData] = useState<FinalizeRecord[]>(mockData)
  const [form] = Form.useForm()

  const filteredData = useMemo(() => {
    let result = data
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase()
      result = result.filter((r) => r.staffName.toLowerCase().includes(kw) || r.employeeNo.toLowerCase().includes(kw))
    }
    if (statusFilter) result = result.filter((r) => r.approvalStatus === statusFilter)
    return result
  }, [data, searchText, statusFilter])

  const handleApply = () => {
    setDrawerMode('apply')
    setEditingRecord(null)
    form.resetFields()
    // 申请人自动选定为本人，并拉取本人轮转科室 / 拟结束日期与当前申请时间
    form.setFieldsValue({
      staffId: CURRENT_USER.id,
      deptName: CURRENT_USER.dept,
      rotationEndDate: dayjs(CURRENT_USER.plannedEndDate),
      applyDate: dayjs(),
    })
    setDrawerOpen(true)
  }

  // 撤回：仅待审批状态的申请可由申请人撤回（从列表中移除）
  const handleWithdraw = (record: FinalizeRecord) => {
    setData(data.filter((r) => r.id !== record.id))
    message.success('已撤回定科申请')
  }

  const handleView = (record: FinalizeRecord) => {
    setDrawerMode('view')
    setEditingRecord(record)
    setDrawerOpen(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const staff = STAFF_OPTIONS.find((s) => s.id === values.staffId)
      if (!staff) return
      const attachments = (values.attachments || []).map((f: UploadFile) => f.name)
      const newRecord: FinalizeRecord = {
        id: String(Date.now()),
        staffName: staff.name,
        employeeNo: staff.employeeNo,
        deptName: values.deptName || staff.dept,
        rotationEndDate: (values.rotationEndDate as dayjs.Dayjs).format('YYYY-MM-DD'),
        targetDept: values.targetDept,
        theoryScore: values.theoryScore ?? null,
        skillScore: values.skillScore ?? null,
        dailyRating: values.dailyRating,
        teacherRating: values.teacherRating,
        deptOpinion: values.deptOpinion,
        applyDate: (values.applyDate as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss'),
        approvalStatus: '待审批',
        approver: '', approveDate: '', approveComment: '',
        attachments,
      }
      setData([newRecord, ...data])
      message.success('定科申请已提交')
      setDrawerOpen(false)
    })
  }

  const columns: ColumnsType<FinalizeRecord> = [
    { title: '序号', width: 60, render: (_, __, i) => i + 1 },
    { title: '申请人', dataIndex: 'staffName', width: 80 },
    { title: '工号', dataIndex: 'employeeNo', width: 90 },
    { title: '轮转科室', dataIndex: 'deptName', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '轮转结束日期', dataIndex: 'rotationEndDate', width: 115 },
    {
      title: '定科科室', dataIndex: 'targetDept', width: 100,
      render: (v: string) => <Tag color="purple" icon={<AimOutlined />}>{v}</Tag>,
    },
    {
      title: '理论/技能成绩', key: 'scores', width: 110, align: 'center' as const,
      render: (_, r) => <Text>{r.theoryScore ?? '-'} / {r.skillScore ?? '-'}</Text>,
    },
    { title: '申请时间', dataIndex: 'applyDate', width: 160 },
    {
      title: '审批状态', dataIndex: 'approvalStatus', width: 95,
      render: (s: string) => <Tag color={statusConfig[s].color} icon={<ClockCircleOutlined />}>{statusConfig[s].text}</Tag>,
    },
    {
      title: '操作', width: 140, fixed: 'right' as const,
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          {record.approvalStatus === '待审批' && (
            <Popconfirm title="确认撤回该定科申请？" onConfirm={() => handleWithdraw(record)} okText="撤回" cancelText="取消">
              <Button type="link" size="small" danger>撤回</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleApply}>新增定科申请</Button>
          </Space>
        </Col>
        <Col>
          <Space>
            <Input placeholder="搜索姓名/工号" prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear style={{ width: 200 }} />
            <Select placeholder="状态筛选" allowClear value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} options={[{ label: '待审批', value: '待审批' }, { label: '已通过', value: '已通过' }, { label: '已驳回', value: '已驳回' }]} />
          </Space>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        size="small"
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      {/* 抽屉 */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>{drawerMode === 'apply' ? '新增定科申请' : '查看定科申请'}</span>}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={drawerMode === 'view' ? 680 : 600}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {drawerMode === 'view' && editingRecord ? (
          // 查看模式
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>申请信息</div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="申请人">{editingRecord.staffName}</Descriptions.Item>
              <Descriptions.Item label="工号">{editingRecord.employeeNo}</Descriptions.Item>
              <Descriptions.Item label="轮转科室">{editingRecord.deptName}</Descriptions.Item>
              <Descriptions.Item label="轮转结束日期">{editingRecord.rotationEndDate}</Descriptions.Item>
              <Descriptions.Item label="定科科室">
                <Tag color="purple" icon={<AimOutlined />}>{editingRecord.targetDept}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">{editingRecord.applyDate}</Descriptions.Item>
              <Descriptions.Item label="审批状态">
                <Tag color={statusConfig[editingRecord.approvalStatus].color}>{statusConfig[editingRecord.approvalStatus].text}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>定科考核表</div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 12 }}>
              <Descriptions.Item label="理论考核成绩">{editingRecord.theoryScore ?? '--'}</Descriptions.Item>
              <Descriptions.Item label="技能考核成绩">{editingRecord.skillScore ?? '--'}</Descriptions.Item>
              <Descriptions.Item label="日常考核评价">{editingRecord.dailyRating || '--'}</Descriptions.Item>
              <Descriptions.Item label="带教老师评价">{editingRecord.teacherRating || '--'}</Descriptions.Item>
              <Descriptions.Item label="科室考核意见" span={2}>{editingRecord.deptOpinion || '--'}</Descriptions.Item>
            </Descriptions>

            {editingRecord.attachments && editingRecord.attachments.length > 0 && (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>附件</div>
                <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                  {editingRecord.attachments.map((name, i) => (
                    <div key={i} style={{ fontSize: 14, color: '#333', lineHeight: 2 }}>
                      <UploadOutlined style={{ marginRight: 6, color: '#1890ff' }} />{name}
                    </div>
                  ))}
                </div>
              </>
            )}

            {editingRecord.approvalStatus !== '待审批' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>审批意见</div>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="审批人">{editingRecord.approver}</Descriptions.Item>
                  <Descriptions.Item label="审批日期">{editingRecord.approveDate}</Descriptions.Item>
                  <Descriptions.Item label="审批意见" span={2}>{editingRecord.approveComment || '--'}</Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        ) : (
          // 申请模式：定科考核表
          <Form form={form} layout="horizontal" size="small" labelAlign="left" labelCol={{ flex: '0 0 100px' }} wrapperCol={{ flex: '1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>申请信息</div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="staffId" label="申请人">
                  <Select
                    placeholder="本人（自动）"
                    showSearch
                    disabled
                    optionFilterProp="label"
                    options={STAFF_OPTIONS.map((s) => ({ label: `${s.name}（${s.employeeNo}）`, value: s.id }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="applyDate" label="申请时间">
                  <DatePicker style={{ width: '100%' }} showTime={{ format: 'HH:mm:ss' }} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="deptName" label="轮转科室">
                  <Select placeholder="自动拉取" options={DEPT_OPTIONS} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="rotationEndDate" label="轮转结束日期">
                  <DatePicker style={{ width: '100%' }} disabled />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>定科考核表</div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="theoryScore" label="理论考核成绩" rules={[{ required: true, message: '请输入理论考核成绩' }]}>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100 分" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="skillScore" label="技能考核成绩" rules={[{ required: true, message: '请输入技能考核成绩' }]}>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100 分" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="dailyRating" label="日常考核评价" rules={[{ required: true, message: '请选择日常考核评价' }]}>
                  <Select placeholder="请选择" options={RATING_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="teacherRating" label="带教老师评价" rules={[{ required: true, message: '请选择带教老师评价' }]}>
                  <Select placeholder="请选择" options={RATING_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="deptOpinion" label="科室考核意见" rules={[{ required: true, message: '请填写科室考核意见' }]}>
                  <Input.TextArea rows={4} placeholder="请填写科室考核意见" />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>定科意向</div>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="targetDept" label="定科科室" rules={[{ required: true, message: '请选择定科科室（最终科室）' }]}>
                  <Select placeholder="请选择最终定科科室" options={DEPT_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="attachments"
                  label="附件上传"
                  valuePropName="fileList"
                  getValueFromEvent={(e: any) => (Array.isArray(e) ? e : e?.fileList)}
                >
                  <Upload beforeUpload={() => false} listType="text" maxCount={5}>
                    <div style={{ width: 64, height: 56, background: '#1890ff', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                      <UploadOutlined style={{ fontSize: 22 }} />
                      <span style={{ fontSize: 11, marginTop: 2 }}>上传附件</span>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}

        {drawerMode !== 'view' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>提交申请</Button>
          </div>
        )}
      </Drawer>
    </Card>
  )
}

export default RotationFinalize
