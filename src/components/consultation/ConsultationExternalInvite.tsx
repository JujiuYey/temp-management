import React, { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Drawer,
  Form,
  Input,
  DatePicker,
  Descriptions,
  Space,
  Select,
  message,
  Typography,
  Upload,
  Row,
  Col,
  Radio,
} from 'antd'
import { PrinterOutlined, EyeOutlined, FileTextOutlined, SearchOutlined, PlusOutlined, FormOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { consultationData, DEPARTMENTS, TITLES } from './mockData'
import type { ConsultationRecord, UrgencyLevel } from './types'
import {
  CONSULTATION_METHOD_MAP,
  CONSULTATION_TYPE_MAP,
  URGENCY_MAP,
  APPROVAL_STATUS_MAP,
} from './types'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// 邀请函打印记录（本地，按记录 id 维护是否已发函）
interface InvitationInfo {
  invitationNo: string
  printTime: string
}

const ConsultationExternalInvite: React.FC = () => {
  const [data, setData] = useState<ConsultationRecord[]>(consultationData)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewRecord, setViewRecord] = useState<ConsultationRecord | null>(null)
  const [previewRecord, setPreviewRecord] = useState<ConsultationRecord | null>(null)
  const [opinionRecord, setOpinionRecord] = useState<ConsultationRecord | null>(null)
  const [opinionForm] = Form.useForm()
  const [printedMap, setPrintedMap] = useState<Record<string, InvitationInfo>>({})
  // 会诊意见（专家意见）本地维护：记录 id → 意见与附件数
  const [opinionMap, setOpinionMap] = useState<Record<string, {
    consultUnit?: string
    consultExpert?: string
    participants?: string
    opinion: string
    fileCount: number
    time: string
    startTime?: string
    endTime?: string
  }>>({})
  // 仅展示「会诊申请」中类型为院外会诊的记录（参考会诊申请表格，按类型筛选）
  const filtered = useMemo(
    () =>
      data.filter(item => {
        const isExternal = item.consultationType === 'external'
        const matchSearch =
          !searchText ||
          item.id.toLowerCase().includes(searchText.toLowerCase()) ||
          item.patientName.includes(searchText) ||
          item.applicant.includes(searchText) ||
          item.applyDept.includes(searchText)
        const matchStatus = statusFilter === 'all' || item.approvalStatus === statusFilter
        return isExternal && matchSearch && matchStatus
      }),
    [data, searchText, statusFilter],
  )

  // ===== 邀请函内容（A4 预览 / 打印共用，由记录直接生成） =====
  const buildLetterBody = (r: ConsultationRecord) => {
    const patientNo = r.patientType === 'outpatient' ? (r.outpatientNo || '-') : (r.admissionNo || '-')
    const inviteExpert = r.experts?.map(e => (e.title ? `${e.name}（${e.title}）` : e.name)).join('、') || '-'
    return `
      <div style="text-align:center;font-size:22px;font-weight:700;letter-spacing:4px;margin-bottom:8px;">院外会诊邀请函</div>
      <div style="text-align:center;color:#888;font-size:13px;margin-bottom:28px;">邀请函编号：${escapeHtml(`YF-${r.id}`)}</div>
      <div style="text-indent:2em;line-height:2;">致 <b>${escapeHtml(r.experts?.[0]?.unit || '受邀单位')}</b> ${escapeHtml(inviteExpert)} 专家：</div>
      <div style="text-indent:2em;line-height:2;margin-top:12px;">
        我院 <b>${escapeHtml(r.applyDept)}</b> 患者 <b>${escapeHtml(r.patientName)}</b>（${escapeHtml(r.patientGender)}，${escapeHtml(String(r.patientAge))}岁，${escapeHtml(r.patientType === 'outpatient' ? '门诊号' : '住院号')} ${escapeHtml(patientNo)}）因"${escapeHtml(r.diagnosis || '相关疾病')}"需进行院外会诊。鉴于您在相关领域的专业造诣，特邀请您于 <b>${escapeHtml(r.plannedConsultTime || '另行商定')}</b> 莅临 <b>本院会诊中心</b> 参加会诊。
      </div>
      <div style="text-indent:2em;line-height:2;margin-top:12px;">患者简要病情：${escapeHtml(r.briefHistory || '-')}</div>
      <div style="text-indent:2em;line-height:2;margin-top:12px;">会诊目的：${escapeHtml(r.purpose || '-')}</div>
      <div style="text-indent:2em;line-height:2;margin-top:12px;">届时我院将安排专人接待，相关病例资料已准备就绪。恳请拨冗出席，不吝赐教。</div>
      <div style="margin-top:36px;line-height:2;">
        <div>邀请方：${escapeHtml(r.applyDept)}（本院）</div>
        <div>联系人：${escapeHtml(r.applicant)}　电话：-</div>
        <div style="text-align:right;margin-top:18px;">${escapeHtml(dayjs().format('YYYY-MM-DD'))}</div>
      </div>
    `
  }

  // ===== 调起浏览器打印（A4） =====
  const handlePrint = () => {
    const r = previewRecord
    if (!r) return
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>院外会诊邀请函</title>
      <style>
        @page{size:A4;margin:0;}
        body{font-family:'Microsoft YaHei','PingFang SC',serif;width:210mm;min-height:297mm;box-sizing:border-box;padding:24mm 20mm;color:#222;font-size:14px;box-shadow:none;}
        @media print{body{margin:0;}}
      </style></head><body>${buildLetterBody(r)}</body></html>`
    const w = window.open('', '_blank', 'width=820,height=640')
    if (!w) {
      message.warning('打印窗口被浏览器拦截，请允许弹窗后重试')
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 350)
    setPrintedMap(prev => ({
      ...prev,
      [r.id]: { invitationNo: `YF-${r.id}`, printTime: dayjs().format('YYYY-MM-DD HH:mm:ss') },
    }))
    message.success('邀请函已调起打印')
  }

  // ===== 会诊意见（会诊单位/专家可编辑 + 会诊时间 + 参与人 + 专家意见 + 附件） =====
  const handleOpenOpinion = (record: ConsultationRecord) => {
    setOpinionRecord(record)
    opinionForm.resetFields()
    const existed = opinionMap[record.id]
    const defaultUnit = record.experts?.[0]?.unit || ''
    const defaultExpert = record.experts?.map(e => `${e.name}${e.title ? `（${e.title}）` : ''}`).join('、') || ''
    opinionForm.setFieldsValue({
      consultUnit: existed?.consultUnit ?? defaultUnit,
      consultExpert: existed?.consultExpert ?? defaultExpert,
      participants: existed?.participants,
      opinion: existed?.opinion,
      consultRange:
        existed?.startTime && existed?.endTime
          ? [dayjs(existed.startTime, 'YYYY-MM-DD HH:mm:ss'), dayjs(existed.endTime, 'YYYY-MM-DD HH:mm:ss')]
          : undefined,
    })
  }

  const handleOpinionSubmit = async () => {
    try {
      const values = await opinionForm.validateFields()
      const r = opinionRecord
      if (!r) return
      const fileCount = (values.attachments || []).length
      setOpinionMap(prev => ({
        ...prev,
        [r.id]: {
          consultUnit: values.consultUnit,
          consultExpert: values.consultExpert,
          participants: values.participants,
          opinion: values.opinion,
          fileCount,
          time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          startTime: values.consultRange?.[0] ? dayjs(values.consultRange[0]).format('YYYY-MM-DD HH:mm:ss') : undefined,
          endTime: values.consultRange?.[1] ? dayjs(values.consultRange[1]).format('YYYY-MM-DD HH:mm:ss') : undefined,
        },
      }))
      setOpinionRecord(null)
      message.success('会诊意见已保存')
    } catch {
      // 校验未通过
    }
  }

  const columns: ColumnsType<ConsultationRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left',
      render: (_: unknown, __: ConsultationRecord, index: number) => (index ?? 0) + 1,
    },
    {
      title: '编码',
      dataIndex: 'id',
      key: 'id',
      width: 130,
      fixed: 'left',
      render: (v: string) => <Text strong style={{ fontSize: 13, color: '#1677ff' }}>{v}</Text>,
    },
    {
      title: '会诊类型',
      dataIndex: 'consultationType',
      key: 'consultationType',
      width: 110,
      render: (v: ConsultationRecord['consultationType']) => (
        <Tag color={CONSULTATION_TYPE_MAP[v].color}>{CONSULTATION_TYPE_MAP[v].label}</Tag>
      ),
    },
    {
      title: '紧急程度',
      dataIndex: 'urgencyLevel',
      key: 'urgencyLevel',
      width: 100,
      render: (v: ConsultationRecord['urgencyLevel']) => (
        <Tag color={URGENCY_MAP[v].color}>{URGENCY_MAP[v].label}</Tag>
      ),
    },
    {
      title: '邀请机构',
      key: 'inviteUnit',
      width: 160,
      render: (_: unknown, r: ConsultationRecord) => {
        const units = Array.from(new Set(r.experts?.map(e => e.unit) || []))
        return units.length
          ? units.map(u => <Tag key={u} color="geekblue">{u}</Tag>)
          : <Text type="secondary">-</Text>
      },
    },
    {
      title: '受邀专家',
      key: 'experts',
      width: 200,
      render: (_: unknown, r: ConsultationRecord) =>
        r.experts?.length
          ? r.experts.map(e => (
              <Tag key={e.name} color="blue">{e.unit} {e.name}{e.title ? `（${e.title}）` : ''}</Tag>
            ))
          : <Text type="secondary">-</Text>,
    },
    {
      title: '审批状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 90,
      render: (v: ConsultationRecord['approvalStatus']) => (
        <Tag color={APPROVAL_STATUS_MAP[v || 'draft'].color}>{APPROVAL_STATUS_MAP[v || 'draft'].label}</Tag>
      ),
    },
    {
      title: '住院/门诊号',
      key: 'patientNo',
      width: 130,
      render: (_: unknown, r: ConsultationRecord) =>
        r.patientType === 'outpatient' ? (r.outpatientNo || '-') : (r.admissionNo || '-'),
    },
    {
      title: '姓名',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 90,
    },
    {
      title: '性别',
      dataIndex: 'patientGender',
      key: 'patientGender',
      width: 70,
    },
    {
      title: '年龄',
      dataIndex: 'patientAge',
      key: 'patientAge',
      width: 70,
      render: (v: number) => `${v}岁`,
    },
    {
      title: '申请科室',
      dataIndex: 'applyDept',
      key: 'applyDept',
      width: 110,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 100,
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_: unknown, r: ConsultationRecord) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewRecord(r)}>查看</Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => setPreviewRecord(r)}>预览</Button>
          <Button type="link" size="small" icon={<FormOutlined />} onClick={() => handleOpenOpinion(r)}>会诊意见</Button>
          {printedMap[r.id] && <Tag color="green">已发函</Tag>}
          {opinionMap[r.id] && <Tag color="cyan">已填意见</Tag>}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card size="small">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Space>
            <Input
              placeholder="搜索编号/患者/申请人/科室"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="审批状态"
              style={{ width: 110 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: '全部状态' },
                ...Object.entries(APPROVAL_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
          </Space>
        </div>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 1860, y: 520 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* ===== 查看（只读详情） ===== */}
      <Drawer
        title="外请会诊申请详情"
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        width={720}
        footer={<div style={{ textAlign: 'right' }}><Button onClick={() => setViewRecord(null)}>关闭</Button></div>}
      >
        {viewRecord && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="会诊编号">{viewRecord.id}</Descriptions.Item>
            <Descriptions.Item label="会诊类型">
              <Tag color={CONSULTATION_TYPE_MAP[viewRecord.consultationType].color}>{CONSULTATION_TYPE_MAP[viewRecord.consultationType].label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="患者姓名">{viewRecord.patientName}</Descriptions.Item>
            <Descriptions.Item label="性别/年龄">{viewRecord.patientGender} / {viewRecord.patientAge}岁</Descriptions.Item>
            <Descriptions.Item label="住院/门诊号">{viewRecord.patientType === 'outpatient' ? (viewRecord.outpatientNo || '-') : (viewRecord.admissionNo || '-')}</Descriptions.Item>
            <Descriptions.Item label="申请科室">{viewRecord.applyDept}</Descriptions.Item>
            <Descriptions.Item label="申请人">{viewRecord.applicant}{viewRecord.applicantTitle ? `（${viewRecord.applicantTitle}）` : ''}</Descriptions.Item>
            <Descriptions.Item label="申请时间">{viewRecord.applyTime}</Descriptions.Item>
            <Descriptions.Item label="拟会诊时间">{viewRecord.plannedConsultTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="会诊方式">
              <Tag color={CONSULTATION_METHOD_MAP[viewRecord.consultationMethod].color}>{CONSULTATION_METHOD_MAP[viewRecord.consultationMethod].label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="受邀专家" span={2}>
              {viewRecord.experts?.length ? viewRecord.experts.map(e => `${e.unit} ${e.name}（${e.title}）`).join('、') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="会诊目的" span={2}>{viewRecord.purpose}</Descriptions.Item>
            <Descriptions.Item label="入院诊断" span={2}>{viewRecord.diagnosis || '-'}</Descriptions.Item>
            <Descriptions.Item label="病情摘要" span={2}>{viewRecord.briefHistory}</Descriptions.Item>
            <Descriptions.Item label="治疗过程" span={2}>{viewRecord.treatmentProcess || '-'}</Descriptions.Item>
            {opinionMap[viewRecord.id] && (
              <Descriptions.Item label="会诊意见" span={2}>
                {(opinionMap[viewRecord.id].consultUnit || opinionMap[viewRecord.id].consultExpert) && (
                  <div style={{ fontSize: 13 }}>
                    会诊单位：{opinionMap[viewRecord.id].consultUnit || '-'}　会诊专家：{opinionMap[viewRecord.id].consultExpert || '-'}
                  </div>
                )}
                {opinionMap[viewRecord.id].startTime && opinionMap[viewRecord.id].endTime && (
                  <div style={{ fontSize: 13 }}>会诊时间：{opinionMap[viewRecord.id].startTime} - {opinionMap[viewRecord.id].endTime}</div>
                )}
                {opinionMap[viewRecord.id].participants && (
                  <div style={{ fontSize: 13 }}>参与人：{opinionMap[viewRecord.id].participants}</div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{opinionMap[viewRecord.id].opinion}</div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                  {opinionMap[viewRecord.id].fileCount > 0 && `附件 ${opinionMap[viewRecord.id].fileCount} 个；`}
                  填写时间：{opinionMap[viewRecord.id].time}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>

      {/* ===== 邀请函 A4 预览 / 打印 ===== */}
      <Drawer
        title="邀请函预览（A4）"
        open={!!previewRecord}
        onClose={() => setPreviewRecord(null)}
        width={760}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPreviewRecord(null)}>关闭</Button>
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>打印</Button>
            </Space>
          </div>
        }
      >
        {previewRecord && (
          <div style={{ background: '#e8e8e8', padding: '24px 0', margin: '-24px' }}>
            <div
              style={{
                width: 620,
                minHeight: 877,
                background: '#fff',
                margin: '0 auto',
                padding: '56px 64px',
                boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                fontFamily: "'Microsoft YaHei','PingFang SC',serif",
                fontSize: 14,
                lineHeight: 2,
                color: '#222',
              }}
              dangerouslySetInnerHTML={{ __html: buildLetterBody(previewRecord) }}
            />
          </div>
        )}
      </Drawer>

      {/* ===== 会诊意见（会诊单位/专家可编辑 + 会诊时间 + 参与人 + 专家意见 + 附件上传） ===== */}
      <Drawer
        title="会诊意见"
        open={!!opinionRecord}
        onClose={() => setOpinionRecord(null)}
        width={750}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setOpinionRecord(null)}>取消</Button>
              <Button type="primary" onClick={handleOpinionSubmit}>保存</Button>
            </Space>
          </div>
        }
      >
        {opinionRecord && (
          <>
            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="申请科室">{opinionRecord.applyDept}</Descriptions.Item>
              <Descriptions.Item label="申请人">{opinionRecord.applicant}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{opinionRecord.applyTime}</Descriptions.Item>
              <Descriptions.Item label="住院号">{opinionRecord.patientType === 'outpatient' ? (opinionRecord.outpatientNo || '-') : (opinionRecord.admissionNo || '-')}</Descriptions.Item>
              <Descriptions.Item label="姓名">{opinionRecord.patientName}</Descriptions.Item>
              <Descriptions.Item label="性别">{opinionRecord.patientGender}</Descriptions.Item>
            </Descriptions>
            <Form form={opinionForm} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 92px' }} wrapperCol={{ flex: '1 1 auto' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="会诊单位" name="consultUnit" rules={[{ required: true, message: '请输入会诊单位' }]}>
                    <Input placeholder="自动带出，可编辑" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="会诊专家" name="consultExpert" rules={[{ required: true, message: '请输入会诊专家' }]}>
                    <Input placeholder="自动带出，可编辑" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="会诊时间" name="consultRange" rules={[{ required: true, message: '请选择会诊时间' }]}>
                <DatePicker.RangePicker
                  showTime={{ format: 'HH:mm:ss' }}
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
              <Form.Item label="参与人" name="participants">
                <TextArea rows={2} placeholder="请输入参与人员，多人以顿号或逗号分隔" />
              </Form.Item>
              <Form.Item label="专家意见" name="opinion" rules={[{ required: true, message: '请填写专家意见' }]}>
                <TextArea rows={6} placeholder="请填写专家会诊意见（诊断建议、治疗方案等）" />
              </Form.Item>
              <Form.Item label="附件" name="attachments" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                <Upload maxCount={5} beforeUpload={() => false}>
                  <Button icon={<UploadOutlined />}>上传附件</Button>
                </Upload>
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>

    </div>
  )
}

export default ConsultationExternalInvite
