import React, { useState, useRef } from 'react'
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
  Popconfirm,
  Empty,
} from 'antd'
import { PlusOutlined, EyeOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { DEPARTMENTS } from './mockData'
import { outgoingMock } from './ConsultationOutgoing'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input

// 已审批（审批通过且未取消/未退回）的院外会诊邀请状态
const APPROVED_INVITE_STATUSES = ['to_confirm', 'confirmed']

// 当前登录人（与「发起会诊申请」一致，用于自动填充申请科室与申请人，仍允许手动修改）
const CURRENT_USER = { dept: '呼吸内科', name: '张明' }

// ==================== 数据模型 ====================
interface OutgoingRegisterRecord {
  id: string            // 登记编号
  applyDept: string     // 申请科室
  applicant: string     // 申请人
  applyTime: string     // 申请时间
  outgoingType: string  // 外出类型（外出会诊）
  inviteRef?: string    // 关联院外会诊邀请（已审批且未被使用）
  destination: string   // 前往地点
  targetUnit: string    // 前往单位
  departDate?: string   // 出发日期
  returnDate?: string   // 返回日期
  patientName: string   // 患者姓名
  patientAge: number    // 年龄
  patientGender: string // 性别
  diagnosis: string     // 诊断
  briefHistory: string  // 病情摘要
  opinion: string       // 会诊意见
  attachmentName?: string // 附件名
}

// ==================== 分区标题 ====================
const SectionTitle: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 16px', paddingLeft: 0 }}>
    <span style={{ display: 'inline-block', width: 4, height: 15, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{text}</span>
  </div>
)

// ==================== Mock 数据 ====================
const registerMock: OutgoingRegisterRecord[] = [
  {
    id: 'OUT-REG-2026-0001',
    applyDept: '呼吸内科', applicant: '刘德海', applyTime: '2026-09-06 10:20',
    outgoingType: '外出会诊', inviteRef: 'CONS-OUT-2026-0004',
    destination: '贵阳市第一人民医院', targetUnit: '贵阳市第一人民医院呼吸内科',
    departDate: '2026-09-08', returnDate: '2026-09-08',
    patientName: '陈国强', patientAge: 58, patientGender: '男',
    diagnosis: '重症肺炎合并呼吸衰竭',
    briefHistory: '患者高热咳嗽 1 周，氧合指数进行性下降，CT 提示双肺多发实变。',
    opinion: '建议调整抗感染方案并评估俯卧位通气指征。',
    attachmentName: '会诊邀请函-市一医.pdf',
  },
  {
    id: 'OUT-REG-2026-0002',
    applyDept: '神经外科', applicant: '胡文莉', applyTime: '2026-09-05 15:40',
    outgoingType: '外出会诊',
    destination: '遵义医科大学附属医院', targetUnit: '遵医附院神经外科',
    departDate: '2026-09-10', returnDate: '2026-09-11',
    patientName: '王秀兰', patientAge: 46, patientGender: '女',
    diagnosis: '颅内动脉瘤破裂出血',
    briefHistory: '突发头痛伴意识障碍 6 小时，CTA 提示后交通动脉瘤。',
    opinion: '建议尽快行介入栓塞治疗，术中注意脑血管痉挛防护。',
  },
  {
    id: 'OUT-REG-2026-0003',
    applyDept: '心血管内科', applicant: '陈志强', applyTime: '2026-09-04 09:15',
    outgoingType: '外出会诊',
    destination: '贵州省人民医院', targetUnit: '省医心血管内科',
    departDate: '2026-09-12', returnDate: '2026-09-12',
    patientName: '李建国', patientAge: 67, patientGender: '男',
    diagnosis: '急性心肌梗死（下壁）',
    briefHistory: '胸痛 3 小时入院，心电图提示 II、III、aVF 导联 ST 段抬高。',
    opinion: '建议急诊 PCI，术前双联抗血小板负荷剂量。',
    attachmentName: '病情资料.pdf',
  },
]

const ConsultationOutgoingRegister: React.FC = () => {
  const [data, setData] = useState<OutgoingRegisterRecord[]>(registerMock)
  const [viewRecord, setViewRecord] = useState<OutgoingRegisterRecord | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerForm] = Form.useForm()
  const [attachList, setAttachList] = useState<any[]>([])
  // 已被外出会诊登记使用的邀请函 id（初始由已登记记录占用）
  const [usedInviteIds, setUsedInviteIds] = useState<string[]>(
    () => registerMock.map(r => r.inviteRef).filter((x): x is string => !!x),
  )
  const seq = useRef(3)

  // 可选择的邀请函：审批通过（待确认/已确认）且未被使用的记录
  const availableInvites = outgoingMock.filter(
    r => APPROVED_INVITE_STATUSES.includes(r.status) && !usedInviteIds.includes(r.id),
  )
  const inviteLabel = (id?: string) => {
    const it = outgoingMock.find(x => x.id === id)
    if (!it) return id || '-'
    return `${it.id} · ${it.inviteHospital}（${it.inviteDept}）${it.inviteExpectTime ? ` ${it.inviteExpectTime}` : ''}`
  }

  // ===== 选择邀请函后自动带出患者信息与前往单位 =====
  const handleInviteChange = (value?: string) => {
    const it = value ? outgoingMock.find(x => x.id === value) : undefined
    registerForm.setFieldsValue({
      targetUnit: it ? `${it.inviteHospital}${it.inviteDept || ''}` : undefined,
      patientName: it?.patientName,
      patientAge: it?.patientAge,
      patientGender: it?.patientGender,
      diagnosis: it?.diagnosis,
      briefHistory: it?.inviteReason,
    })
  }

  // ===== 登记抽屉：自动填充第一行 =====
  const handleOpenRegister = () => {
    setRegisterOpen(true)
    registerForm.resetFields()
    registerForm.setFieldsValue({
      applyDept: CURRENT_USER.dept,
      applicant: CURRENT_USER.name,
      applyTime: dayjs().format('YYYY-MM-DD HH:mm'),
      outgoingType: '外出会诊',
      patientGender: '男',
    })
    setAttachList([])
  }

  const handleRegisterSubmit = async () => {
    try {
      const values = await registerForm.validateFields()
      seq.current += 1
      const record: OutgoingRegisterRecord = {
        ...values,
        id: `OUT-REG-2026-${String(seq.current).padStart(4, '0')}`,
        departDate: values.departDate ? dayjs(values.departDate).format('YYYY-MM-DD') : undefined,
        returnDate: values.returnDate ? dayjs(values.returnDate).format('YYYY-MM-DD') : undefined,
        attachmentName: attachList[0]?.name,
      }
      if (values.inviteRef) setUsedInviteIds(prev => [...prev, values.inviteRef])
      setData(prev => [record, ...prev])
      setRegisterOpen(false)
      message.success('外出会诊登记已保存')
    } catch {
      // 校验未通过
    }
  }

  const columns: ColumnsType<OutgoingRegisterRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: unknown, __: OutgoingRegisterRecord, index: number) => (index ?? 0) + 1,
    },
    {
      title: '登记编号',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (v: string) => <Text strong style={{ fontSize: 13, color: '#1677ff' }}>{v}</Text>,
    },
    {
      title: '外出类型',
      dataIndex: 'outgoingType',
      key: 'outgoingType',
      width: 100,
      render: (v: string) => <Tag color="orange">{v}</Tag>,
    },
    { title: '前往单位', dataIndex: 'targetUnit', key: 'targetUnit', width: 200 },
    { title: '前往地点', dataIndex: 'destination', key: 'destination', width: 180 },
    { title: '出发日期', dataIndex: 'departDate', key: 'departDate', width: 110, render: (v?: string) => v || <Text type="secondary">-</Text> },
    { title: '返回日期', dataIndex: 'returnDate', key: 'returnDate', width: 110, render: (v?: string) => v || <Text type="secondary">-</Text> },
    { title: '患者姓名', dataIndex: 'patientName', key: 'patientName', width: 90 },
    { title: '性别', dataIndex: 'patientGender', key: 'patientGender', width: 70 },
    {
      title: '年龄',
      dataIndex: 'patientAge',
      key: 'patientAge',
      width: 70,
      render: (v: number) => `${v}岁`,
    },
    { title: '诊断', dataIndex: 'diagnosis', key: 'diagnosis', width: 180, ellipsis: true },
    { title: '申请科室', dataIndex: 'applyDept', key: 'applyDept', width: 110 },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
    { title: '申请时间', dataIndex: 'applyTime', key: 'applyTime', width: 150 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: unknown, r: OutgoingRegisterRecord) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewRecord(r)}>查看</Button>
          <Popconfirm title="确认删除该条登记？" onConfirm={() => { setData(prev => prev.filter(d => d.id !== r.id)); message.success('已删除') }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card size="small">
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenRegister}>登记</Button>
        </div>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 1900, y: 520 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* ===== 查看（只读详情） ===== */}
      <Drawer
        title="外出会诊登记详情"
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        width={720}
        footer={<div style={{ textAlign: 'right' }}><Button onClick={() => setViewRecord(null)}>关闭</Button></div>}
      >
        {viewRecord ? (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="登记编号">{viewRecord.id}</Descriptions.Item>
            <Descriptions.Item label="外出类型"><Tag color="orange">{viewRecord.outgoingType}</Tag></Descriptions.Item>
            <Descriptions.Item label="申请科室">{viewRecord.applyDept}</Descriptions.Item>
            <Descriptions.Item label="申请人">{viewRecord.applicant}</Descriptions.Item>
            <Descriptions.Item label="申请时间" span={2}>{viewRecord.applyTime}</Descriptions.Item>
            <Descriptions.Item label="邀请函" span={2}>{viewRecord.inviteRef ? inviteLabel(viewRecord.inviteRef) : '-'}</Descriptions.Item>
            <Descriptions.Item label="前往地点">{viewRecord.destination}</Descriptions.Item>
            <Descriptions.Item label="前往单位">{viewRecord.targetUnit}</Descriptions.Item>
            <Descriptions.Item label="出发日期">{viewRecord.departDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="返回日期">{viewRecord.returnDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="患者姓名">{viewRecord.patientName}</Descriptions.Item>
            <Descriptions.Item label="性别 / 年龄">{viewRecord.patientGender} / {viewRecord.patientAge}岁</Descriptions.Item>
            <Descriptions.Item label="诊断" span={2}>{viewRecord.diagnosis || '-'}</Descriptions.Item>
            <Descriptions.Item label="病情摘要" span={2}>{viewRecord.briefHistory || '-'}</Descriptions.Item>
            <Descriptions.Item label="会诊意见" span={2}>{viewRecord.opinion || '-'}</Descriptions.Item>
            <Descriptions.Item label="附件" span={2}>{viewRecord.attachmentName || '-'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty />
        )}
      </Drawer>

      {/* ===== 登记抽屉 ===== */}
      <Drawer
        title="外出会诊登记"
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        width={1000}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRegisterOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleRegisterSubmit}>保存</Button>
            </Space>
          </div>
        }
      >
        <Form form={registerForm} layout="horizontal" labelAlign="left" labelCol={{ flex: '0 0 92px' }} wrapperCol={{ flex: '1 1 auto' }}>
          <SectionTitle text="申请信息" />
          {/* 第一行：申请科室、申请人、申请时间（自动填充） */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="申请科室" name="applyDept" rules={[{ required: true, message: '请选择申请科室' }]}>
                <Select showSearch options={DEPARTMENTS.map(d => ({ value: d, label: d }))} placeholder="当前登录人科室，可修改" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="申请人" name="applicant" rules={[{ required: true, message: '请输入申请人' }]}>
                <Input placeholder="当前登录人，可修改" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="申请时间" name="applyTime">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          {/* 第二行：外出类型 + 邀请函（选择已审批且未被使用的院外会诊邀请） */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="外出类型" name="outgoingType" rules={[{ required: true }]}>
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  options={[{ value: '外出会诊', label: '外出会诊' }]}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="邀请函" name="inviteRef" rules={[{ required: true, message: '请选择邀请函' }]}>
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="选择已审批且未被使用的院外会诊邀请"
                  onChange={handleInviteChange}
                  options={availableInvites.map(r => ({ value: r.id, label: `${r.id} · ${r.inviteHospital}（${r.inviteDept}）${r.inviteExpectTime ? ` ${r.inviteExpectTime}` : ''}` }))}
                />
              </Form.Item>
            </Col>
          </Row>
          {/* 第三行：前往地点占 1 格、前往单位占 2 格（一行共 3 格） */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="前往地点" name="destination" rules={[{ required: true, message: '请输入前往地点' }]}>
                <Input placeholder="如：贵阳市第一人民医院" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="前往单位" name="targetUnit" rules={[{ required: true, message: '请输入前往单位' }]}>
                <Input placeholder="如：市一医呼吸内科" />
              </Form.Item>
            </Col>
          </Row>
          {/* 第四行：出发日期、返回日期（各占 1/3） */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="出发日期" name="departDate" rules={[{ required: true, message: '请选择出发日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="选择出发日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="返回日期" name="returnDate" rules={[{ required: true, message: '请选择返回日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="选择返回日期" />
              </Form.Item>
            </Col>
          </Row>

          <SectionTitle text="患者信息" />
          {/* 患者姓名、年龄、性别 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="患者姓名" name="patientName" rules={[{ required: true, message: '请输入患者姓名' }]}>
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="年龄" name="patientAge" rules={[{ required: true, message: '请输入年龄' }]}>
                <Input type="number" placeholder="岁" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="性别" name="patientGender" rules={[{ required: true }]}>
                <Select options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} />
              </Form.Item>
            </Col>
          </Row>
          {/* 诊断 */}
          <Form.Item label="诊断" name="diagnosis" rules={[{ required: true, message: '请输入诊断' }]}>
            <Input placeholder="请输入临床诊断" />
          </Form.Item>
          {/* 病情摘要 */}
          <Form.Item label="病情摘要" name="briefHistory" rules={[{ required: true, message: '请填写病情摘要' }]}>
            <TextArea rows={3} placeholder="请描述患者主诉、现病史、重要检查结果等" />
          </Form.Item>
          {/* 会诊意见 */}
          <Form.Item label="会诊意见" name="opinion">
            <TextArea rows={3} placeholder="请填写会诊意见（选填）" />
          </Form.Item>
          {/* 附件 */}
          <Form.Item label="附件">
            <Upload maxCount={3} fileList={attachList} beforeUpload={() => false} onChange={({ fileList }) => setAttachList(fileList)}>
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default ConsultationOutgoingRegister
