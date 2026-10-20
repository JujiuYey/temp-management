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
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

// ==================== 类型定义 ====================

interface ExtensionRecord {
  id: string
  staffName: string
  employeeNo: string
  deptName: string
  applyDeptName: string
  originalEndDate: string
  extendMonths: number
  extendToDate: string
  reason: string
  applyDate: string
  applicant: string
  approvalStatus: '待审批' | '已通过' | '已驳回'
  approver: string
  approveDate: string
  approveComment: string
  attachments?: string[]
}

// ==================== 常量 ====================

const DEPT_OPTIONS = [
  { label: '内科', value: '内科' },
  { label: '外科', value: '外科' },
  { label: '妇产科', value: '妇产科' },
  { label: '儿科', value: '儿科' },
  { label: '急诊科', value: '急诊科' },
  { label: '麻醉科', value: '麻醉科' },
  { label: '检验科', value: '检验科' },
  { label: 'ICU', value: 'ICU' },
  { label: '心电图室', value: '心电图室' },
]

const STAFF_OPTIONS = [
  { id: 's1', name: '张明', employeeNo: 'EMP001', dept: 'ICU', plannedEndDate: '2026-09-30' },
  { id: 's2', name: '李华', employeeNo: 'EMP002', dept: '儿科', plannedEndDate: '2026-10-31' },
  { id: 's3', name: '王芳', employeeNo: 'EMP003', dept: '内科', plannedEndDate: '2026-11-30' },
  { id: 's4', name: '刘强', employeeNo: 'EMP004', dept: '内科', plannedEndDate: '2026-12-15' },
  { id: 's5', name: '孙莉', employeeNo: 'EMP007', dept: 'ICU', plannedEndDate: '2026-09-15' },
]

// 当前登录用户（本人）：新增延期申请时自动选定为申请人，并据此拉取其轮转计划
const CURRENT_USER = STAFF_OPTIONS.find((s) => s.id === 's1')!

const statusConfig: Record<string, { color: string; text: string }> = {
  '待审批': { color: 'processing', text: '待审批' },
  '已通过': { color: 'success', text: '已通过' },
  '已驳回': { color: 'error', text: '已驳回' },
}

const mockData: ExtensionRecord[] = [
  {
    id: '1', staffName: '张明', employeeNo: 'EMP001', deptName: 'ICU', applyDeptName: 'ICU',
    originalEndDate: '2026-07-31', extendMonths: 1, extendToDate: '2026-08-31',
    reason: '因ICU轮转期间接触呼吸机操作机会不足，需延长1个月以充分掌握呼吸机使用及参数调节技能',
    applyDate: '2026-07-20', applicant: '张明',
    approvalStatus: '已通过', approver: '王主任', approveDate: '2026-07-22',
    approveComment: '情况属实，同意延期1个月',
  },
  {
    id: '2', staffName: '李华', employeeNo: 'EMP002', deptName: '儿科', applyDeptName: '儿科',
    originalEndDate: '2026-08-31', extendMonths: 2, extendToDate: '2026-10-31',
    reason: '儿科轮转期间病假2周，需补充轮转时间以完成学习任务',
    applyDate: '2026-08-15', applicant: '李华',
    approvalStatus: '待审批', approver: '', approveDate: '', approveComment: '',
  },
  {
    id: '3', staffName: '孙莉', employeeNo: 'EMP007', deptName: 'ICU', applyDeptName: 'ICU',
    originalEndDate: '2026-08-31', extendMonths: 1, extendToDate: '2026-09-30',
    reason: '进修学习需深入掌握血流动力学监测技术，申请延长1个月',
    applyDate: '2026-08-10', applicant: '孙莉',
    approvalStatus: '已通过', approver: '周主任', approveDate: '2026-08-12',
    approveComment: '同意，需在延期期间完成血流动力学监测专项培训',
  },
  {
    id: '4', staffName: '王芳', employeeNo: 'EMP003', deptName: '内科', applyDeptName: '内科',
    originalEndDate: '2026-11-30', extendMonths: 1, extendToDate: '2026-12-31',
    reason: '内科轮转期间理论考核成绩未达标（75分），需延长以加强学习',
    applyDate: '2026-11-15', applicant: '王芳',
    approvalStatus: '已驳回', approver: '王主任', approveDate: '2026-11-17',
    approveComment: '考核未达标建议参加补考，不建议延长轮转时间',
  },
]

const RotationExtend: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'apply' | 'view'>('apply')
  const [editingRecord, setEditingRecord] = useState<ExtensionRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [data, setData] = useState<ExtensionRecord[]>(mockData)
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
    // 申请人自动选定为本人，并拉取本人轮转计划（拟结束科室 / 拟结束日期）与当前申请时间
    form.setFieldsValue({
      staffId: CURRENT_USER.id,
      deptName: CURRENT_USER.dept,
      applyDeptName: CURRENT_USER.dept,
      originalEndDate: dayjs(CURRENT_USER.plannedEndDate),
      applyDate: dayjs(),
    })
    setDrawerOpen(true)
  }

  // 撤回：仅待审批状态的申请可由申请人撤回（从列表中移除）
  const handleWithdraw = (record: ExtensionRecord) => {
    setData(data.filter((r) => r.id !== record.id))
    message.success('已撤回延期申请')
  }

  const handleView = (record: ExtensionRecord) => {
    setDrawerMode('view')
    setEditingRecord(record)
    setDrawerOpen(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (drawerMode === 'apply') {
        const staff = STAFF_OPTIONS.find((s) => s.id === values.staffId)
        if (!staff) return
        const extendToDate = (values.extendToDate as dayjs.Dayjs).format('YYYY-MM-DD')
        const originalEnd = (values.originalEndDate as dayjs.Dayjs).format('YYYY-MM-DD')
        const applyTime = (values.applyDate as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss')
        const extendMonths = values.extendToDate.diff(values.originalEndDate, 'month')
        const attachments = (values.attachments || []).map((f: UploadFile) => f.name)
        const newRecord: ExtensionRecord = {
          id: String(Date.now()),
          staffName: staff.name,
          employeeNo: staff.employeeNo,
          deptName: staff.dept,
          applyDeptName: values.applyDeptName || staff.dept,
          originalEndDate: originalEnd,
          extendMonths,
          extendToDate,
          reason: values.reason,
          applyDate: applyTime,
          applicant: staff.name,
          approvalStatus: '待审批',
          approver: '', approveDate: '', approveComment: '',
          attachments,
        }
        setData([newRecord, ...data])
        message.success('延期申请已提交')
      }
      setDrawerOpen(false)
    })
  }

  const columns: ColumnsType<ExtensionRecord> = [
    { title: '序号', width: 60, render: (_, __, i) => i + 1 },
    { title: '申请人', dataIndex: 'staffName', width: 80 },
    { title: '工号', dataIndex: 'employeeNo', width: 90 },
    { title: '科室', dataIndex: 'deptName', width: 90, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '原结束日期', dataIndex: 'originalEndDate', width: 110 },
    {
      title: '延期时长', dataIndex: 'extendMonths', width: 90, align: 'center' as const,
      render: (v: number) => <Tag color="orange">{v}个月</Tag>,
    },
    { title: '延期至', dataIndex: 'extendToDate', width: 110 },
    { title: '申请日期', dataIndex: 'applyDate', width: 110 },
    { title: '申请人', dataIndex: 'applicant', width: 80 },
    {
      title: '审批状态', dataIndex: 'approvalStatus', width: 90,
      render: (s: string) => <Tag color={statusConfig[s].color} icon={<ClockCircleOutlined />}>{statusConfig[s].text}</Tag>,
    },
    {
      title: '操作', width: 150, fixed: 'right' as const,
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          {record.approvalStatus === '待审批' && (
            <Popconfirm title="确认撤回该延期申请？" onConfirm={() => handleWithdraw(record)} okText="撤回" cancelText="取消">
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleApply}>申请</Button>
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
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>{drawerMode === 'apply' ? '新增延期申请' : '查看延期申请'}</span>}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={drawerMode === 'view' ? 640 : 560}
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
              <Descriptions.Item label="申请轮转科室">{editingRecord.applyDeptName}</Descriptions.Item>
              <Descriptions.Item label="原结束日期">{editingRecord.originalEndDate}</Descriptions.Item>
              <Descriptions.Item label="延期时长"><Tag color="orange">{editingRecord.extendMonths}个月</Tag></Descriptions.Item>
              <Descriptions.Item label="延期至">{editingRecord.extendToDate}</Descriptions.Item>
              <Descriptions.Item label="申请日期">{editingRecord.applyDate}</Descriptions.Item>
              <Descriptions.Item label="审批状态"><Tag color={statusConfig[editingRecord.approvalStatus].color}>{statusConfig[editingRecord.approvalStatus].text}</Tag></Descriptions.Item>
            </Descriptions>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>延期原因</div>
            <div style={{ background: '#fafafa', borderRadius: 8, padding: '16px 20px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: '#333', marginBottom: 20 }}>
              {editingRecord.reason}
            </div>

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
          // 申请模式
          <Form form={form} layout="horizontal" size="small" labelAlign="left" labelCol={{ flex: '0 0 100px' }} wrapperCol={{ flex: '1' }}>
            <>
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
                    <Form.Item name="deptName" label="拟结束科室">
                      <Select placeholder="自动拉取" options={DEPT_OPTIONS} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="originalEndDate" label="拟结束日期">
                      <DatePicker style={{ width: '100%' }} disabled />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="applyDeptName" label="申请轮转科室" rules={[{ required: true, message: '请选择' }]}>
                      <Select placeholder="请选择轮转科室" options={DEPT_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="extendToDate"
                      label="申请延期至"
                      rules={[
                        { required: true, message: '请选择延期日期' },
                        {
                          validator: (_, value) => {
                            const orig = form.getFieldValue('originalEndDate')
                            if (value && orig && value.isBefore(orig, 'day')) {
                              return Promise.reject(new Error('申请延期至不能早于拟结束日期'))
                            }
                            return Promise.resolve()
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        placeholder="选择延期后的结束日期"
                        disabledDate={(current) => {
                          const orig = form.getFieldValue('originalEndDate')
                          return !!current && !!orig && current.isBefore(orig, 'day')
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item name="reason" label="申请原因" rules={[{ required: true, message: '请填写延期原因' }]}>
                      <Input.TextArea rows={5} placeholder="请详细说明延期原因" />
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
              </>
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

export default RotationExtend
