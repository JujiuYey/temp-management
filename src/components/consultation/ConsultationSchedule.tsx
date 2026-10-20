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
  DatePicker,
  Descriptions,
  Timeline,
  Empty,
} from 'antd'
import {
  SearchOutlined,
  CalendarOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { consultationData, DEPARTMENTS, TITLES, CONSULT_TEAMS } from './mockData'
import type { ConsultationRecord, ConsultationType, ConsultationStage } from './types'
import { CONSULTATION_TYPE_MAP, URGENCY_MAP, CONSULTATION_STAGE_MAP, CONSULTATION_METHOD_MAP } from './types'
import dayjs from 'dayjs'

const { Text } = Typography

// 分区标题：左侧蓝色小竖条 + 加粗文字
const SectionTitle: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 16px', paddingLeft: 0 }}>
    <span style={{ display: 'inline-block', width: 4, height: 15, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{text}</span>
  </div>
)

// 会议室预设选项
const MEETING_ROOMS = ['会诊中心1号室', '会诊中心2号室', 'MDT会议室', '远程会诊室', '病区示教室']

// 医师姓名预设选项（MDT 邀请科室中选择）
const DOCTOR_OPTIONS = ['王建国', '李国华', '赵明德', '陈志远', '刘德芳', '孙秀英', '周健康', '吴明辉', '郑国强', '黄丽娟', '张明']
  .map(n => ({ value: n, label: n }))

const ConsultationSchedule: React.FC = () => {
  const [data, setData] = useState(consultationData)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [arrangeOpen, setArrangeOpen] = useState(false)
  const [arrangeRecord, setArrangeRecord] = useState<ConsultationRecord | null>(null)
  const [arrangeForm] = Form.useForm()
  const [viewRecord, setViewRecord] = useState<ConsultationRecord | null>(null)
  const [viewTab, setViewTab] = useState<'apply' | 'arrange' | 'exec'>('apply')

  // ===== 取消会诊（填写取消原因） =====
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelRecord, setCancelRecord] = useState<ConsultationRecord | null>(null)
  const [cancelForm] = Form.useForm()

  // 构建执行记录时间轴
  const buildExecTimeline = (r: ConsultationRecord) => {
    type Node = { color: string; label: string; time?: string; desc: string }
    const nodes: Node[] = []
    if (r.applyTime) {
      nodes.push({ color: '#1677ff', label: '发起申请', time: r.applyTime, desc: `${r.applicant} 发起会诊申请（${r.applyDept}）` })
    }
    if (r.approvalTime) {
      nodes.push({ color: '#52c41a', label: '审批通过', time: r.approvalTime, desc: `${r.approver || '审批人'}：${r.approvalNote || '同意'}（审批状态：${r.approvalStatus === 'approved' ? '已审批' : r.approvalStatus}）` })
    }
    if (r.scheduledTime) {
      nodes.push({ color: '#13c2c2', label: '会诊安排', time: r.scheduledTime, desc: `会议室：${r.meetingRoom || '-'}　会议号：${r.meetingNo || '-'}　邀请科室：${(r.arrangeDepts || r.targetDepts || []).join('、') || '-'}` })
    }
    if (r.arrivalTime) {
      nodes.push({ color: '#fa8c16', label: '人员到达', time: r.arrivalTime, desc: `受邀专家/科室人员已到达（${r.meetingRoom || '-'}）` })
    }
    if (r.completionTime) {
      nodes.push({ color: '#8c8c8c', label: '会诊结束', time: r.completionTime, desc: r.consultOpinion ? `会诊意见：${r.consultOpinion.substring(0, 60)}${r.consultOpinion.length > 60 ? '…' : ''}` : '会诊已完成' })
    }
    if (nodes.length === 0) {
      nodes.push({ color: 'gray', label: '暂无记录', desc: '该会诊尚未产生可记录的时间节点' })
    }
    return nodes.map(n => ({
      color: n.color,
      children: (
        <div>
          <Text strong>{n.label}</Text>
          {n.time && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{n.time}</div>}
          <div style={{ fontSize: 13 }}>{n.desc}</div>
        </div>
      ),
    }))
  }

  const filteredData = useMemo(() => {
    let list = data.filter(d =>
      ['approved', 'scheduled', 'in_progress', 'completed', 'archived', 'cancelled'].includes(d.status)
    )
    // 本界面显示 MDT 会诊、远程会诊与外请会诊
    list = list.filter(d => d.consultationType === 'mdt' || d.consultationType === 'remote' || d.consultationType === 'external')
    if (statusFilter !== 'all') list = list.filter(d => d.status === statusFilter)
    if (searchText) {
      list = list.filter(item =>
        item.id.toLowerCase().includes(searchText.toLowerCase()) ||
        item.patientName.includes(searchText) ||
        item.applyDept.includes(searchText)
      )
    }
    return list.sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''))
  }, [data, statusFilter, searchText])

  // ===== 安排（安排/调整） =====
  const handleOpenArrange = (record: ConsultationRecord) => {
    setArrangeRecord(record)
    arrangeForm.resetFields()
    arrangeForm.setFieldsValue({
      applyDept: record.applyDept,
      applyTime: record.applyTime,
      applicant: record.applicant,
      consultationType: record.consultationType,
      urgencyLevel: record.urgencyLevel,
      consultationMethod: record.consultationMethod,
      proposedTeam: record.proposedTeam || [],
      targetDepts: record.targetDepts || [],
      experts: record.experts || [],
      mdtInvites: record.mdtInvites || [],
      plannedConsultTime: record.plannedConsultTime ? dayjs(record.plannedConsultTime) : undefined,
      meetingRoom: record.meetingRoom,
      meetingNo: record.meetingNo,
      arrangeRemark: record.arrangeRemark,
      scheduledTime: record.scheduledTime ? dayjs(record.scheduledTime) : undefined,
      arrivalTime: record.arrivalTime ? dayjs(record.arrivalTime) : undefined,
    })
    setArrangeOpen(true)
  }

  const handleArrangeCancel = () => {
    setArrangeOpen(false)
    setArrangeRecord(null)
  }

  const applyArrangeValues = (notify: boolean) => {
    if (!arrangeRecord) return
    const base = arrangeRecord
    const raw = arrangeForm.getFieldsValue(true)
    const scheduledTime = raw.scheduledTime ? dayjs(raw.scheduledTime).format('YYYY-MM-DD HH:mm') : base.scheduledTime
    const updated: ConsultationRecord = {
      ...base,
      proposedTeam: raw.proposedTeam || [],
      mdtInvites: base.consultationType === 'mdt' ? (Array.isArray(raw.mdtInvites) ? raw.mdtInvites : []) : base.mdtInvites,
      targetDepts: raw.targetDepts || [],
      arrangeDepts: raw.targetDepts || [],
      experts: raw.experts || [],
      plannedConsultTime: raw.plannedConsultTime ? dayjs(raw.plannedConsultTime).format('YYYY-MM-DD HH:mm:ss') : base.plannedConsultTime,
      meetingRoom: raw.meetingRoom,
      meetingNo: raw.meetingNo || base.meetingNo,
      arrangeRemark: raw.arrangeRemark,
      scheduledTime,
      arrivalTime: raw.arrivalTime ? dayjs(raw.arrivalTime).format('YYYY-MM-DD HH:mm') : base.arrivalTime,
      scheduledLocation: raw.meetingRoom || base.scheduledLocation,
      status: notify ? 'scheduled' : base.status,
      approvalStatus: notify ? 'approved' : base.approvalStatus,
      consultationStatus: notify ? 'to_notify' : base.consultationStatus,
    }
    setData(prev => prev.map(d => (d.id === base.id ? updated : d)))
    setArrangeOpen(false)
    setArrangeRecord(null)
    message.success(notify ? '已提交并通知相关科室与专家' : '安排信息已暂存')
  }

  const handleArrangeSave = () => applyArrangeValues(false)

  const handleArrangeSubmit = async () => {
    try {
      await arrangeForm.validateFields()
      applyArrangeValues(true)
    } catch {
      // 校验未通过
    }
  }

  // ===== 查看（只读详情） =====
  const handleView = (record: ConsultationRecord) => {
    setViewRecord(record)
    setViewTab('apply')
  }

  // ===== 取消会诊 =====
  const handleOpenCancel = (record: ConsultationRecord) => {
    setCancelRecord(record)
    cancelForm.resetFields()
    setCancelOpen(true)
  }

  const handleCancelClose = () => {
    setCancelOpen(false)
    setCancelRecord(null)
  }

  const handleCancelConfirm = async () => {
    try {
      const values = await cancelForm.validateFields()
      if (!cancelRecord) return
      const cancelTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      setData(prev => prev.map(d =>
        d.id === cancelRecord.id
          ? { ...d, status: 'cancelled', consultationStatus: undefined, cancelReason: values.cancelReason, cancelTime }
          : d
      ))
      setCancelOpen(false)
      setCancelRecord(null)
      message.success('已取消该会诊安排')
    } catch {
      // 校验未通过
    }
  }

  const columns: ColumnsType<ConsultationRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => (index ?? 0) + 1,
    },
    {
      title: '编码',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (v: string) => <Text strong style={{ color: '#1677ff', fontSize: 13 }}>{v}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'consultationType',
      key: 'consultationType',
      width: 100,
      render: (v: ConsultationType) => <Tag color={CONSULTATION_TYPE_MAP[v].color}>{CONSULTATION_TYPE_MAP[v].label}</Tag>,
    },
    {
      title: '紧急程度',
      dataIndex: 'urgencyLevel',
      key: 'urgencyLevel',
      width: 90,
      render: (v: keyof typeof URGENCY_MAP) => <Tag color={URGENCY_MAP[v].color}>{URGENCY_MAP[v].label}</Tag>,
    },
    {
      title: '会诊状态',
      dataIndex: 'consultationStatus',
      key: 'consultationStatus',
      width: 100,
      render: (v: ConsultationStage) =>
        v ? <Tag color={CONSULTATION_STAGE_MAP[v].color}>{CONSULTATION_STAGE_MAP[v].label}</Tag> : <Text style={{ color: '#d9d9d9' }}>-</Text>,
    },
    {
      title: '会诊时间',
      dataIndex: 'plannedConsultTime',
      key: 'plannedConsultTime',
      width: 160,
      render: (v: string) => v || <Text style={{ color: '#d9d9d9' }}>-</Text>,
    },
    {
      title: '会议室',
      dataIndex: 'meetingRoom',
      key: 'meetingRoom',
      width: 130,
      render: (v: string) => v || <Text style={{ color: '#d9d9d9' }}>-</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 230,
      fixed: 'right',
      render: (_: unknown, r: ConsultationRecord) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>查看</Button>
          {(r.status === 'approved' || r.status === 'scheduled') && (
            <Button
              type={r.status === 'approved' ? 'primary' : 'link'}
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => handleOpenArrange(r)}
            >
              {r.status === 'approved' ? '安排' : '调整'}
            </Button>
          )}
          {(r.status === 'scheduled' || r.status === 'in_progress') && (
            <Button type="link" size="small" danger onClick={() => handleOpenCancel(r)}>取消</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <SectionTitle text="会诊安排" />
          <Space>
            <Input
              placeholder="搜索编号/患者/科室"
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="状态"
              style={{ width: 110 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: '全部' },
                { value: 'approved', label: '待安排' },
                { value: 'scheduled', label: '已安排' },
                { value: 'in_progress', label: '进行中' },
                { value: 'completed', label: '已完成' },
              ]}
            />
          </Space>
        </div>

        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Drawer
        title="会诊安排"
        open={arrangeOpen}
        onClose={handleArrangeCancel}
        width={1080}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleArrangeCancel}>取消</Button>
              <Button onClick={handleArrangeSave}>暂存</Button>
              <Button type="primary" onClick={handleArrangeSubmit}>提交并通知</Button>
            </Space>
          </div>
        }
      >
        <Form form={arrangeForm} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 92px' }} wrapperCol={{ flex: '1 1 auto' }}>
          {/* 申请信息（取自申请单，只读展示，一行三个） */}
          <SectionTitle text="申请信息" />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="申请科室" name="applyDept">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="申请时间" name="applyTime">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="申请人" name="applicant">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="会诊类型" name="consultationType">
                <Select
                  disabled
                  options={Object.entries(CONSULTATION_TYPE_MAP)
                    .map(([k, v]) => ({ value: k, label: v.label }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="紧急程度" name="urgencyLevel">
                <Select
                  disabled
                  options={Object.entries(URGENCY_MAP)
                    .map(([k, v]) => ({ value: k, label: v.label }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="会诊方式" name="consultationMethod">
                <Select
                  disabled
                  options={Object.entries(CONSULTATION_METHOD_MAP)
                    .map(([k, v]) => ({ value: k, label: v.label }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <SectionTitle text="邀请信息（取自申请单，可调整）" />
          {/* 会诊时间、会议室（各占 1/2，位于邀请信息第一行） */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="会诊时间" name="plannedConsultTime" rules={[{ required: true, message: '请选择会诊时间' }]}>
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm:ss"
                  showTime={{ format: 'HH:mm:ss' }}
                  placeholder="选择年月日时分秒"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="会议室" name="meetingRoom" rules={[{ required: arrangeRecord?.consultationMethod === 'onsite', message: '请选择会议室' }]}>
                <Select options={MEETING_ROOMS.map(m => ({ value: m, label: m }))} placeholder="请选择会议室" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="邀请团队"
            name="proposedTeam"
            hidden={arrangeRecord?.consultationType !== 'mdt'}
          >
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              options={CONSULT_TEAMS.map(t => ({ value: t.id, label: `${t.name}（牵头：${t.leadDept}·${t.leader}）` }))}
              placeholder="选择邀请团队（可多选）"
            />
          </Form.Item>
          {/* MDT 按科室邀请：展示申请单带入的科室/职称/医师条目，与邀请团队同时显示，非必填 */}
          {arrangeRecord?.consultationType === 'mdt' && (
            <Form.Item label="邀请科室">
              <Form.List name="mdtInvites">
                {(fields, { add, remove }) => (
                  <div>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row gutter={8} key={key} align="middle" style={{ marginBottom: 8 }}>
                        <Col span={7}>
                          <Form.Item {...restField} name={[name, 'dept']} style={{ marginBottom: 0 }}>
                            <Select showSearch options={DEPARTMENTS.map(d => ({ value: d, label: d }))} placeholder="选择科室" />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item {...restField} name={[name, 'title']} style={{ marginBottom: 0 }}>
                            <Select options={TITLES.map(t => ({ value: t, label: t }))} placeholder="选择职称" />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item {...restField} name={[name, 'doctor']} style={{ marginBottom: 0 }}>
                            <Select showSearch optionFilterProp="label" options={DOCTOR_OPTIONS} placeholder="选择医师姓名" />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>删除</Button>
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>添加</Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>
          )}
          <Form.Item
            label="邀请科室"
            name="targetDepts"
            hidden={arrangeRecord?.consultationType === 'external' || arrangeRecord?.consultationType === 'mdt' || arrangeRecord?.consultationType === 'remote'}
            rules={[{ required: arrangeRecord?.consultationType === 'regular', message: '请选择邀请科室' }]}
          >
            <Select
              showSearch
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
              placeholder="选择邀请科室"
            />
          </Form.Item>

          <Form.Item label="邀请专家" hidden={arrangeRecord?.consultationType !== 'external'}>
            <Form.List name="experts">
              {(fields, { add, remove }) => (
                <div>
                  <Row gutter={8} style={{ marginBottom: 8 }} hidden={fields.length === 0}>
                    <Col span={7}><Text type="secondary" style={{ fontSize: 12 }}>专家单位</Text></Col>
                    <Col span={6}><Text type="secondary" style={{ fontSize: 12 }}>专家姓名</Text></Col>
                    <Col span={6}><Text type="secondary" style={{ fontSize: 12 }}>专家职称</Text></Col>
                    <Col span={3}><Text type="secondary" style={{ fontSize: 12 }}>操作</Text></Col>
                  </Row>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row gutter={8} key={key} align="middle" style={{ marginBottom: 8 }}>
                      <Col span={7}>
                        <Form.Item {...restField} name={[name, 'unit']} rules={[{ required: true, message: '请输入单位' }]} style={{ marginBottom: 0 }}>
                          <Input placeholder="如：XX医院" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: '请输入姓名' }]} style={{ marginBottom: 0 }}>
                          <Input placeholder="专家姓名" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item {...restField} name={[name, 'title']} rules={[{ required: true, message: '请选择职称' }]} style={{ marginBottom: 0 }}>
                          <Select options={TITLES.map(t => ({ value: t, label: t }))} placeholder="请选择" />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)}>删除</Button>
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>添加专家</Button>
                </div>
              )}
            </Form.List>
          </Form.Item>

          {/* 备注（选填） */}
          <Form.Item label="备注" name="arrangeRemark">
            <Input.TextArea rows={3} placeholder="请输入备注（选填）" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ===== 查看（只读详情） ===== */}
      <Drawer
        title="会诊详情"
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        width={760}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setViewRecord(null)}>关闭</Button>
          </div>
        }
      >
        {viewRecord && (
          <>
            <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
              {([
                { key: 'apply', label: '申请单' },
                { key: 'arrange', label: '会诊安排' },
                { key: 'exec', label: '执行记录' },
              ] as const).map(p => (
                <div
                  key={p.key}
                  onClick={() => setViewTab(p.key)}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    marginBottom: -1,
                    borderBottom: viewTab === p.key ? '2px solid #1677ff' : '2px solid transparent',
                    color: viewTab === p.key ? '#1677ff' : 'rgba(0,0,0,0.88)',
                    fontWeight: viewTab === p.key ? 600 : 400,
                  }}
                >
                  {p.label}
                </div>
              ))}
            </div>

            {viewTab === 'apply' && (
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="会诊编号">{viewRecord.id}</Descriptions.Item>
                <Descriptions.Item label="会诊类型">
                  <Tag color={CONSULTATION_TYPE_MAP[viewRecord.consultationType].color}>{CONSULTATION_TYPE_MAP[viewRecord.consultationType].label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="紧急程度">
                  <Tag color={URGENCY_MAP[viewRecord.urgencyLevel].color}>{URGENCY_MAP[viewRecord.urgencyLevel].label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="会诊方式">
                  <Tag color={CONSULTATION_METHOD_MAP[viewRecord.consultationMethod].color}>{CONSULTATION_METHOD_MAP[viewRecord.consultationMethod].label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="申请科室">{viewRecord.applyDept}</Descriptions.Item>
                <Descriptions.Item label="申请人">{viewRecord.applicant}{viewRecord.applicantTitle ? `（${viewRecord.applicantTitle}）` : ''}</Descriptions.Item>
                <Descriptions.Item label="申请时间">{viewRecord.applyTime}</Descriptions.Item>
                <Descriptions.Item label="拟会诊时间">{viewRecord.plannedConsultTime || '-'}</Descriptions.Item>
                {viewRecord.consultationType === 'mdt' && (
                  <Descriptions.Item label={viewRecord.mdtInvites?.length ? '邀请科室/医师' : '邀请团队'} span={2}>
                    {viewRecord.mdtInvites?.length
                      ? viewRecord.mdtInvites.map(i => `${i.dept} ${i.title} ${i.doctor}`).join('；')
                      : (viewRecord.proposedTeam?.map(id => CONSULT_TEAMS.find(t => t.id === id)?.name).filter(Boolean).join('、') || '-')}
                  </Descriptions.Item>
                )}
                {viewRecord.consultationType !== 'external' && (
                  <Descriptions.Item label="邀请科室" span={2}>
                    {(viewRecord.arrangeDepts || viewRecord.targetDepts || []).join('、') || '-'}
                  </Descriptions.Item>
                )}
                {viewRecord.consultationType === 'external' && (
                  <Descriptions.Item label="邀请专家" span={2}>
                    {viewRecord.experts?.length ? viewRecord.experts.map(e => `${e.unit} ${e.name}（${e.title}）`).join('、') : '-'}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="会诊目的" span={2}>{viewRecord.purpose}</Descriptions.Item>
                <Descriptions.Item label="患者姓名">{viewRecord.patientName}</Descriptions.Item>
                <Descriptions.Item label="性别/年龄">{viewRecord.patientGender} / {viewRecord.patientAge}岁</Descriptions.Item>
                <Descriptions.Item label="住院/门诊号">{viewRecord.patientType === 'outpatient' ? (viewRecord.outpatientNo || '-') : (viewRecord.admissionNo || '-')}</Descriptions.Item>
                <Descriptions.Item label="床位号">{viewRecord.bedNo || '-'}</Descriptions.Item>
                <Descriptions.Item label="入院诊断" span={2}>{viewRecord.diagnosis || '-'}</Descriptions.Item>
                <Descriptions.Item label="病情摘要" span={2}>{viewRecord.briefHistory}</Descriptions.Item>
                <Descriptions.Item label="治疗过程" span={2}>{viewRecord.treatmentProcess || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {viewTab === 'arrange' && (
              <Descriptions bordered size="small" column={2}>
                {viewRecord.consultationType === 'mdt' && (
                  <Descriptions.Item label={viewRecord.mdtInvites?.length ? '邀请科室/医师' : '邀请团队'} span={2}>
                    {viewRecord.mdtInvites?.length
                      ? viewRecord.mdtInvites.map(i => `${i.dept} ${i.title} ${i.doctor}`).join('；')
                      : (viewRecord.proposedTeam?.map(id => CONSULT_TEAMS.find(t => t.id === id)?.name).filter(Boolean).join('、') || '-')}
                  </Descriptions.Item>
                )}
                {viewRecord.consultationType !== 'external' && (
                  <Descriptions.Item label="邀请科室" span={2}>
                    {(viewRecord.arrangeDepts || viewRecord.targetDepts || []).join('、') || '-'}
                  </Descriptions.Item>
                )}
                {viewRecord.consultationType === 'external' && (
                  <Descriptions.Item label="邀请专家" span={2}>
                    {viewRecord.experts?.length ? viewRecord.experts.map(e => `${e.unit} ${e.name}（${e.title}）`).join('、') : '-'}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="会诊时间">{viewRecord.plannedConsultTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="会议室">{viewRecord.meetingRoom || '-'}</Descriptions.Item>
                <Descriptions.Item label="会议号" span={2}>{viewRecord.meetingNo || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {viewTab === 'exec' && (
              <Timeline items={buildExecTimeline(viewRecord)} />
            )}
          </>
        )}
      </Drawer>

      {/* ===== 取消会诊（填写取消原因） ===== */}
      <Drawer
        title="取消会诊"
        open={cancelOpen}
        onClose={handleCancelClose}
        width={520}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancelClose}>关闭</Button>
              <Button type="primary" danger onClick={handleCancelConfirm}>确认取消</Button>
            </Space>
          </div>
        }
      >
        <Form form={cancelForm} layout="vertical" size="small">
          <Form.Item
            label="取消原因"
            name="cancelReason"
            rules={[{ required: true, message: '请填写取消原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请填写取消该会诊安排的原因" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default ConsultationSchedule
