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
  Tabs,
  Typography,
  Row,
  Col,
  Empty,
  message,
  Modal,
  DatePicker,
  Form,
  Timeline,
  Dropdown,
  Radio,
  Upload,
} from 'antd'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PrinterOutlined,
  FileSearchOutlined,
  MoreOutlined,
  CheckOutlined,
  ReloadOutlined,
  UploadOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

// 状态定义
const STATUS_LIST = ['临时', '未开展', '申请中', '试运行', '被暂停', '被终止', '常规'] as const

const STATUS_COLOR_MAP: Record<string, string> = {
  '临时': '#8c8c8c',
  '未开展': '#d97706',
  '申请中': '#1677ff',
  '试运行': '#13c2c2',
  '被暂停': '#fa8c16',
  '被终止': '#ff4d4f',
  '常规': '#52c41a',
}

interface TeamMember {
  role: string       // 负责人 / 参与人
  name: string       // 姓名
  dept: string       // 科室
  title: string      // 聘任职称
  phone: string      // 联系电话
  expertise: string  // 专业性说明
}

interface DeptItem {
  deptName: string    // 科室名称
  leader: string      // 负责人
  startDate: string   // 开展日期
}

interface EquipmentItem {
  type: string        // 类型：设施/设备
  productName: string // 产品名称
  productCode: string // 产品编号
  quantity: number    // 数量
  unit: string        // 单位
  dept: string        // 所属科室
  origin: string      // 产地
  manufacturer: string // 生产商
  runStatus: string   // 运行状态
}

interface RelatedTechItem {
  code: string          // 编码
  projectName: string   // 项目名称
  techType: string      // 技术类型
  startDate: string     // 开展时间
  caseCount: number     // 例数
  successRate: number   // 手术成功率(%)
  survivalRate: number  // 存活率(%)
}

interface CaseItem {
  name: string            // 姓名
  gender: string          // 性别
  birthDate: string       // 出生日期
  outpatientNo?: string   // 门诊号
  admissionNo?: string    // 住院号
  applyDate: string       // 应用日期
  effectEval: string      // 效果评价
  complication: string    // 并发症与合并症
  adverseReaction: string // 不良反应
  experience: string      // 经验总结
  followUp: string        // 随访情况
  consentFileName?: string // 知情同意书文件名
}

interface ExceptionItem {
  exceptionType: string  // 暂停/终止/重启
  occurDate: string     // 发生日期
  reason: string        // 原因说明
  restartStatus?: string // 重启后状态（仅重启类型）
}

interface TechCatalogRecord {
  id: string
  techName: string
  techCode: string
  category: string
  level: string
  department: string
  status: string
  leader: string
  startDate: string
  endDate?: string      // 结束日期
  techType?: string     // 技术类型
  riskLevel?: string    // 风险等级
  techNature?: string   // 技术定性
  scope?: string        // 开展范围
  scopeInstitutions?: string[] // 使用范围（机构勾选）
  externalId?: string   // 外部标识
  icdCode?: string      // ICD编码（技术类型为"手术"时必填）
  // 详情字段：用于时间轴展示
  approvalDate?: string // 审核通过时间
  stageEvaluations?: Array<{ date: string; conclusion: string }> // 阶段评估记录
  convertToRegularDate?: string // 转常规时间
  terminationDate?: string // 终止时间
  terminationReason?: string // 终止原因
  teamMembers?: TeamMember[] // 团队成员
  deptList?: DeptItem[] // 开展科室
  equipmentList?: EquipmentItem[] // 设备
  relatedTechList?: RelatedTechItem[] // 相关技术
  caseList?: CaseItem[] // 开展病例
  exceptionList?: ExceptionItem[] // 项目异常
}

// 详情子面板组件
const TeamInfo: React.FC<{ record?: TechCatalogRecord }> = ({ record }) => {
  const teamData = record?.teamMembers || []

  // 编辑专业性说明
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number>(-1)
  const [editExpertise, setEditExpertise] = useState('')

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setEditExpertise(teamData[index]?.expertise || '')
    setEditDrawerOpen(true)
  }

  const handleEditSave = () => {
    // 实际项目中应调用接口更新数据
    if (editIndex >= 0 && teamData[editIndex]) {
      teamData[editIndex].expertise = editExpertise
    }
    message.success('专业性说明已更新')
    setEditDrawerOpen(false)
  }

  const handleDelete = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除成员「${teamData[index]?.name}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.success('删除成功')
      },
    })
  }

  return (
    <div>
      <Table
        dataSource={teamData}
        columns={[
          {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            render: (role: string) => (
              <Tag color={role === '负责人' ? 'blue' : 'default'}>{role}</Tag>
            ),
          },
          { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
          { title: '科室', dataIndex: 'dept', key: 'dept', width: 120 },
          { title: '聘任职称', dataIndex: 'title', key: 'title', width: 120 },
          { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 130 },
          { title: '专业性说明', dataIndex: 'expertise', key: 'expertise' },
          {
            title: '操作',
            key: 'action',
            width: 140,
            render: (_: unknown, __: unknown, index: number) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(index)}>
                  编辑
                </Button>
                <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(index)}>
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
        pagination={false}
        size="small"
        locale={{ emptyText: <Empty description="暂无团队数据" /> }}
        rowKey="name"
      />
      <Drawer
        title="编辑专业性说明"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        width={420}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleEditSave}>保存</Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">成员：{editIndex >= 0 ? teamData[editIndex]?.name : ''}</Text>
        </div>
        <Input.TextArea
          rows={4}
          value={editExpertise}
          onChange={(e) => setEditExpertise(e.target.value)}
          placeholder="请输入专业性说明"
        />
      </Drawer>
    </div>
  )
}

const CaseInfo: React.FC<{ record?: TechCatalogRecord; onEdit?: () => void; onDelete?: () => void }> = ({ record, onEdit, onDelete }) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewName, setPreviewName] = useState('')

  const handlePreviewConsent = (fileName: string) => {
    setPreviewName(fileName)
    setPreviewOpen(true)
  }

  return (
  <div>
    <Modal
      title={`知情同意书 - ${previewName}`}
      open={previewOpen}
      onCancel={() => setPreviewOpen(false)}
      footer={null}
      width={700}
    >
      <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>
        <FilePdfOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }} />
        <div style={{ fontSize: 16, marginBottom: 8 }}>{previewName}</div>
        <div>（文件预览区域，实际项目中接入文件预览服务）</div>
      </div>
    </Modal>
    <Table
      dataSource={record?.caseList || []}
      columns={[
        { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
        { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
        { title: '出生日期', dataIndex: 'birthDate', key: 'birthDate', width: 110 },
        { title: '门诊号', dataIndex: 'outpatientNo', key: 'outpatientNo', width: 110 },
        { title: '住院号', dataIndex: 'admissionNo', key: 'admissionNo', width: 110 },
        {
          title: '知情同意书', dataIndex: 'consentFileName', key: 'consentFileName', width: 100,
          render: (fileName: string | undefined) =>
            fileName ? <a onClick={() => handlePreviewConsent(fileName)} style={{ color: '#1890ff' }}>预览</a> : null,
        },
        { title: '应用日期', dataIndex: 'applyDate', key: 'applyDate', width: 110 },
        { title: '效果评价', dataIndex: 'effectEval', key: 'effectEval', width: 100 },
        { title: '并发症与合并症', dataIndex: 'complication', key: 'complication', width: 140 },
        { title: '不良反应', dataIndex: 'adverseReaction', key: 'adverseReaction', width: 100 },
        { title: '经验总结', dataIndex: 'experience', key: 'experience', width: 120 },
        { title: '随访情况', dataIndex: 'followUp', key: 'followUp', width: 120 },
        {
          title: '操作', key: 'action', width: 120, fixed: 'right' as const,
          render: () => (
            <Space>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={onEdit}>编辑</Button>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={onDelete}>删除</Button>
            </Space>
          ),
        },
      ]}
      pagination={{ pageSize: 5 }}
      size="small"
      locale={{ emptyText: <Empty description="暂无病例数据" /> }}
    />
  </div>
  )
}

const DeptInfo: React.FC<{ record?: TechCatalogRecord }> = ({ record }) => {
  const deptData = record?.deptList || []

  // 编辑开展日期
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number>(-1)
  const [editDate, setEditDate] = useState<dayjs.Dayjs | null>(null)

  const handleEdit = (index: number) => {
    setEditIndex(index)
    const currentDate = deptData[index]?.startDate
    setEditDate(currentDate ? dayjs(currentDate) : null)
    setEditDrawerOpen(true)
  }

  const handleEditSave = () => {
    // 实际项目中应调用接口更新数据
    if (editIndex >= 0 && deptData[editIndex]) {
      deptData[editIndex].startDate = editDate ? editDate.format('YYYY-MM-DD') : ''
    }
    message.success('开展日期已更新')
    setEditDrawerOpen(false)
  }

  const handleDelete = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除科室「${deptData[index]?.deptName}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.success('删除成功')
      },
    })
  }

  return (
    <div>
      <Table
        dataSource={deptData}
        columns={[
          { title: '科室名称', dataIndex: 'deptName', key: 'deptName' },
          { title: '负责人', dataIndex: 'leader', key: 'leader' },
          { title: '开展日期', dataIndex: 'startDate', key: 'startDate' },
          {
            title: '操作',
            key: 'action',
            width: 140,
            render: (_: unknown, __: unknown, index: number) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(index)}>
                  编辑
                </Button>
                <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(index)}>
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
        pagination={false}
        size="small"
        locale={{ emptyText: <Empty description="暂无开展科室数据" /> }}
        rowKey={(_, index) => String(index)}
      />
      <Drawer
        title="编辑开展日期"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        width={420}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleEditSave}>保存</Button>
            </Space>
          </div>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">科室：{editIndex >= 0 ? deptData[editIndex]?.deptName : ''}</Text>
        </div>
        <DatePicker
          style={{ width: '100%' }}
          value={editDate}
          onChange={(date) => setEditDate(date)}
          placeholder="请选择开展日期"
        />
      </Drawer>
    </div>
  )
}

const AuthInfo: React.FC = () => (
  <div>
    <Table
      dataSource={[]}
      columns={[
        { title: '被授权人', dataIndex: 'authPerson', key: 'authPerson' },
        { title: '科室', dataIndex: 'dept', key: 'dept' },
        { title: '授权日期', dataIndex: 'date', key: 'date' },
        { title: '有效期至', dataIndex: 'expireDate', key: 'expireDate' },
      ]}
      pagination={false}
      size="small"
      locale={{ emptyText: <Empty description="暂无授权数据" /> }}
    />
  </div>
)

const EffectEvaluation: React.FC = () => (
  <div>
    <Table
      dataSource={[]}
      columns={[
        { title: '单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
        { title: '申请日期', dataIndex: 'date', key: 'date', width: 120 },
        {
          title: '操作', key: 'action', width: 180, fixed: 'right' as const,
          render: () => (
            <Space>
              <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
              <Button type="link" size="small" icon={<EditOutlined />}>修改</Button>
              <Button type="link" size="small" icon={<FileSearchOutlined />}>预览</Button>
            </Space>
          ),
        },
      ]}
      pagination={{ pageSize: 5 }}
      size="small"
      locale={{ emptyText: <Empty description="暂无效果评价数据" /> }}
    />
  </div>
)

const ApplicationRecord: React.FC = () => (
  <div>
    <Table
      dataSource={[]}
      columns={[
        { title: '申请编号', dataIndex: 'applyNo', key: 'applyNo', width: 140 },
        { title: '申请类型', dataIndex: 'type', key: 'type', width: 100 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '申请科室', dataIndex: 'applyDept', key: 'applyDept', width: 120 },
        { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
        { title: '申请日期', dataIndex: 'date', key: 'date', width: 120 },
        {
          title: '操作', key: 'action', width: 140, fixed: 'right' as const,
          render: () => (
            <Space>
              <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
              <Button type="link" size="small" icon={<PrinterOutlined />}>打印</Button>
            </Space>
          ),
        },
      ]}
      pagination={{ pageSize: 5 }}
      size="small"
      locale={{ emptyText: <Empty description="暂无申请记录" /> }}
    />
  </div>
)

const RelatedTech: React.FC<{ record?: TechCatalogRecord; allRecords?: TechCatalogRecord[] }> = ({ record, allRecords }) => {
  const relatedData = record?.relatedTechList || []

  // 获取上方表格中"常规"状态的技术，用于下拉选择
  const regularTechOptions = (allRecords || [])
    .filter(r => r.status === '常规')
    .map(r => ({ label: r.techName, value: r.techName, techType: r.category }))

  // 编辑
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number>(-1)
  const [editForm, setEditForm] = useState<RelatedTechItem>({
    code: '', projectName: '', techType: '', startDate: '', caseCount: 0, successRate: 0, survivalRate: 0,
  })

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setEditForm({ ...relatedData[index] })
    setEditDrawerOpen(true)
  }

  const handleEditSave = () => {
    if (editIndex >= 0 && relatedData[editIndex]) {
      Object.assign(relatedData[editIndex], editForm)
    }
    message.success('相关技术已更新')
    setEditDrawerOpen(false)
  }

  const handleDelete = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除相关技术「${relatedData[index]?.projectName}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.success('删除成功')
      },
    })
  }

  // 选择项目名称时，自动填充编码和技术类型
  const handleProjectNameSelect = (value: string) => {
    const found = regularTechOptions.find(o => o.value === value)
    const techType = found?.techType || ''
    const techCode = (allRecords || []).find(r => r.techName === value)?.techCode || ''
    setEditForm({ ...editForm, projectName: value, techType, code: techCode })
  }

  return (
    <div>
      <Table
        dataSource={relatedData}
        columns={[
          { title: '编码', dataIndex: 'code', key: 'code', width: 150 },
          { title: '项目名称', dataIndex: 'projectName', key: 'projectName', width: 200 },
          { title: '技术类型', dataIndex: 'techType', key: 'techType', width: 120 },
          { title: '开展时间', dataIndex: 'startDate', key: 'startDate', width: 120 },
          { title: '例数', dataIndex: 'caseCount', key: 'caseCount', width: 80 },
          {
            title: '手术成功率',
            dataIndex: 'successRate',
            key: 'successRate',
            width: 110,
            render: (val: number) => `${val}%`,
          },
          {
            title: '存活率',
            dataIndex: 'survivalRate',
            key: 'survivalRate',
            width: 90,
            render: (val: number) => `${val}%`,
          },
          {
            title: '操作',
            key: 'action',
            width: 140,
            render: (_: unknown, __: unknown, index: number) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(index)}>
                  编辑
                </Button>
                <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(index)}>
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
        pagination={{ pageSize: 5 }}
        size="small"
        scroll={{ x: 1100 }}
        locale={{ emptyText: <Empty description="暂无相关技术" /> }}
        rowKey={(_, index) => String(index)}
      />
      <Drawer
        title="编辑相关技术"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        width={480}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleEditSave}>保存</Button>
            </Space>
          </div>
        }
      >
        <Form layout="vertical">
          <Form.Item label="编码">
            <Input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} placeholder="自动填充或手动输入" />
          </Form.Item>
          <Form.Item label={<span>项目名称 <span style={{ color: 'red' }}>*</span></span>}>
            <Select
              value={editForm.projectName || undefined}
              onChange={handleProjectNameSelect}
              placeholder="请选择项目名称（常规技术）"
              showSearch
              optionFilterProp="label"
              options={regularTechOptions}
            />
          </Form.Item>
          <Form.Item label="技术类型">
            <Input value={editForm.techType} onChange={(e) => setEditForm({ ...editForm, techType: e.target.value })} placeholder="自动填充或手动输入" />
          </Form.Item>
          <Form.Item label="开展时间">
            <DatePicker
              style={{ width: '100%' }}
              value={editForm.startDate ? dayjs(editForm.startDate) : null}
              onChange={(date) => setEditForm({ ...editForm, startDate: date ? date.format('YYYY-MM-DD') : '' })}
              placeholder="请选择开展时间"
            />
          </Form.Item>
          <Form.Item label="例数">
            <Input type="number" value={editForm.caseCount} onChange={(e) => setEditForm({ ...editForm, caseCount: Number(e.target.value) })} placeholder="请输入例数" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="手术成功率(%)">
                <Input type="number" value={editForm.successRate} onChange={(e) => setEditForm({ ...editForm, successRate: Number(e.target.value) })} placeholder="0-100" min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="存活率(%)">
                <Input type="number" value={editForm.survivalRate} onChange={(e) => setEditForm({ ...editForm, survivalRate: Number(e.target.value) })} placeholder="0-100" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  )
}

const EquipmentInfo: React.FC<{ record?: TechCatalogRecord }> = ({ record }) => {
  const equipData = record?.equipmentList || []

  // 编辑
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number>(-1)
  const [editForm, setEditForm] = useState<EquipmentItem>({
    type: '', productName: '', productCode: '', quantity: 1,
    unit: '', dept: '', origin: '', manufacturer: '', runStatus: '',
  })

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setEditForm({ ...equipData[index] })
    setEditDrawerOpen(true)
  }

  const handleEditSave = () => {
    // 实际项目中应调用接口更新数据
    if (editIndex >= 0 && equipData[editIndex]) {
      Object.assign(equipData[editIndex], editForm)
    }
    message.success('设备信息已更新')
    setEditDrawerOpen(false)
  }

  const handleDelete = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除设备「${equipData[index]?.productName}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.success('删除成功')
      },
    })
  }

  const runStatusColor: Record<string, string> = {
    '正常运行': 'green',
    '维修中': 'orange',
    '已报废': 'red',
    '待检修': 'gold',
    '停用': 'default',
  }

  return (
    <div>
      <Table
        dataSource={equipData}
        columns={[
          {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 80,
            render: (type: string) => (
              <Tag color={type === '设施' ? 'purple' : 'blue'}>{type}</Tag>
            ),
          },
          { title: '产品名称', dataIndex: 'productName', key: 'productName', width: 140 },
          { title: '产品编号', dataIndex: 'productCode', key: 'productCode', width: 120 },
          { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 70 },
          { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
          { title: '所属科室', dataIndex: 'dept', key: 'dept', width: 110 },
          { title: '产地', dataIndex: 'origin', key: 'origin', width: 80 },
          { title: '生产商', dataIndex: 'manufacturer', key: 'manufacturer', width: 140 },
          {
            title: '运行状态',
            dataIndex: 'runStatus',
            key: 'runStatus',
            width: 90,
            render: (status: string) => (
              <Tag color={runStatusColor[status] || 'default'}>{status}</Tag>
            ),
          },
          {
            title: '操作',
            key: 'action',
            width: 140,
            fixed: 'right' as const,
            render: (_: unknown, __: unknown, index: number) => (
              <Space size="small">
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(index)}>
                  编辑
                </Button>
                <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(index)}>
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
        pagination={{ pageSize: 5 }}
        size="small"
        scroll={{ x: 1200 }}
        locale={{ emptyText: <Empty description="暂无设备数据" /> }}
        rowKey={(_, index) => String(index)}
      />
      <Drawer
        title="编辑设备"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        width={480}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleEditSave}>保存</Button>
            </Space>
          </div>
        }
      >
        <Form layout="vertical">
          <Form.Item label="类型">
            <Radio.Group value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
              <Radio value="设施">设施</Radio>
              <Radio value="设备">设备</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="产品名称">
            <Input value={editForm.productName} onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })} placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item label="产品编号">
            <Input value={editForm.productCode} onChange={(e) => setEditForm({ ...editForm, productCode: e.target.value })} placeholder="请输入产品编号" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="数量">
                <Input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })} placeholder="数量" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="单位">
                <Input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} placeholder="单位" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="所属科室">
            <Input value={editForm.dept} onChange={(e) => setEditForm({ ...editForm, dept: e.target.value })} placeholder="请输入所属科室" />
          </Form.Item>
          <Form.Item label="产地">
            <Input value={editForm.origin} onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })} placeholder="请输入产地" />
          </Form.Item>
          <Form.Item label="生产商">
            <Input value={editForm.manufacturer} onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })} placeholder="请输入生产商" />
          </Form.Item>
          <Form.Item label="运行状态">
            <Select value={editForm.runStatus || undefined} onChange={(val) => setEditForm({ ...editForm, runStatus: val })} placeholder="请选择运行状态" options={[
              { label: '正常运行', value: '正常运行' },
              { label: '维修中', value: '维修中' },
              { label: '待检修', value: '待检修' },
              { label: '停用', value: '停用' },
              { label: '已报废', value: '已报废' },
            ]} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

const ConvertApply: React.FC = () => (
  <div>
    <Table
      dataSource={[]}
      columns={[
        { title: '单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
        { title: '申请日期', dataIndex: 'date', key: 'date', width: 120 },
        {
          title: '操作', key: 'action', width: 140, fixed: 'right' as const,
          render: () => (
            <Space>
              <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
              <Button type="link" size="small" icon={<FileSearchOutlined />}>预览</Button>
            </Space>
          ),
        },
      ]}
      pagination={{ pageSize: 5 }}
      size="small"
      locale={{ emptyText: <Empty description="暂无转常规申请记录" /> }}
    />
  </div>
)

const OperationMetrics: React.FC = () => (
  <div>
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card size="small">
          <Text type="secondary">累计开展例数</Text>
          <Title level={3} style={{ margin: '8px 0 0' }}>--</Title>
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Text type="secondary">年度开展例数</Text>
          <Title level={3} style={{ margin: '8px 0 0' }}>--</Title>
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Text type="secondary">成功率</Text>
          <Title level={3} style={{ margin: '8px 0 0' }}>--</Title>
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Text type="secondary">并发症率</Text>
          <Title level={3} style={{ margin: '8px 0 0' }}>--</Title>
        </Card>
      </Col>
    </Row>
    <Empty description="暂无运营指标数据" />
  </div>
)

const ProjectException: React.FC<{ record?: TechCatalogRecord }> = ({ record }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit'>('view')
  const [currentItem, setCurrentItem] = useState<ExceptionItem | null>(null)
  const [editForm] = Form.useForm()

  const handleView = (item: ExceptionItem) => {
    setCurrentItem(item)
    setDrawerMode('view')
    setDrawerOpen(true)
  }

  const handleEdit = (item: ExceptionItem) => {
    setCurrentItem(item)
    setDrawerMode('edit')
    editForm.setFieldsValue({
      occurDate: item.occurDate ? dayjs(item.occurDate) : undefined,
      reason: item.reason,
      restartStatus: (item as ExceptionItem & { restartStatus?: string }).restartStatus,
    })
    setDrawerOpen(true)
  }

  const handleSave = () => {
    editForm.validateFields().then(() => {
      message.success('保存成功')
      setDrawerOpen(false)
    })
  }

  const isRestart = currentItem?.exceptionType === '重启'

  return (
  <div>
    <Drawer
      title={drawerMode === 'view' ? '查看项目异常' : '编辑项目异常'}
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      width={600}
      footer={drawerMode === 'edit' ? (
        <div style={{ textAlign: 'right' }}>
          <Button onClick={() => setDrawerOpen(false)} style={{ marginRight: 8 }}>取消</Button>
          <Button type="primary" onClick={handleSave}>保存</Button>
        </div>
      ) : null}
    >
      {isRestart ? (
        drawerMode === 'view' ? (
          <div>
            <Row style={{ marginBottom: 16 }}>
              <Col span={6} style={{ textAlign: 'right', color: '#666' }}>发生日期：</Col>
              <Col span={18}>{currentItem?.occurDate}</Col>
            </Row>
            <Row style={{ marginBottom: 16 }}>
              <Col span={6} style={{ textAlign: 'right', color: '#666' }}>重启后状态：</Col>
              <Col span={18}>{(currentItem as ExceptionItem & { restartStatus?: string })?.restartStatus || '--'}</Col>
            </Row>
            <Row style={{ marginBottom: 16 }}>
              <Col span={6} style={{ textAlign: 'right', color: '#666' }}>重启原因：</Col>
              <Col span={18}>{currentItem?.reason}</Col>
            </Row>
          </div>
        ) : (
          <Form form={editForm} layout="vertical">
            <Form.Item name="occurDate" label="发生日期" rules={[{ required: true, message: '请选择发生日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择发生日期" />
            </Form.Item>
            <Form.Item name="restartStatus" label="重启后状态" rules={[{ required: true, message: '请选择重启后状态' }]}>
              <Select placeholder="请选择重启后状态" options={[
                { label: '试运行', value: '试运行' },
                { label: '常规', value: '常规' },
              ]} />
            </Form.Item>
            <Form.Item name="reason" label="重启原因" rules={[{ required: true, message: '请输入重启原因' }]}>
              <Input.TextArea rows={3} maxLength={300} showCount placeholder="请输入重启原因" />
            </Form.Item>
          </Form>
        )
      ) : (
        drawerMode === 'view' ? (
          <div>
            <Row style={{ marginBottom: 16 }}>
              <Col span={6} style={{ textAlign: 'right', color: '#666' }}>发生日期：</Col>
              <Col span={18}>{currentItem?.occurDate}</Col>
            </Row>
            <Row style={{ marginBottom: 16 }}>
              <Col span={6} style={{ textAlign: 'right', color: '#666' }}>原因说明：</Col>
              <Col span={18}>{currentItem?.reason}</Col>
            </Row>
          </div>
        ) : (
          <Form form={editForm} layout="vertical">
            <Form.Item name="occurDate" label="发生日期" rules={[{ required: true, message: '请选择发生日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择发生日期" />
            </Form.Item>
            <Form.Item name="reason" label="原因说明" rules={[{ required: true, message: '请输入原因说明' }]}>
              <Input.TextArea rows={3} maxLength={300} showCount placeholder="请输入原因说明" />
            </Form.Item>
          </Form>
        )
      )}
    </Drawer>
    <Table
      dataSource={record?.exceptionList || []}
      columns={[
        { title: '类型', dataIndex: 'exceptionType', key: 'exceptionType', width: 100 },
        { title: '发生日期', dataIndex: 'occurDate', key: 'occurDate', width: 120 },
        { title: '原因说明', dataIndex: 'reason', key: 'reason' },
        {
          title: '操作', key: 'action', width: 140, fixed: 'right' as const,
          render: (_: unknown, record: ExceptionItem) => (
            <Space>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
            </Space>
          ),
        },
      ]}
      pagination={false}
      size="small"
      locale={{ emptyText: <Empty description="暂无项目异常数据" /> }}
    />
  </div>
  )
}

const StageEvaluation: React.FC = () => (
  <div>
    <Table
      dataSource={[]}
      columns={[
        { title: '单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
        { title: '申请日期', dataIndex: 'date', key: 'date', width: 120 },
        {
          title: '操作', key: 'action', width: 140, fixed: 'right' as const,
          render: () => (
            <Space>
              <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
              <Button type="link" size="small" icon={<FileSearchOutlined />}>预览</Button>
            </Space>
          ),
        },
      ]}
      pagination={{ pageSize: 5 }}
      size="small"
      locale={{ emptyText: <Empty description="暂无阶段评估数据" /> }}
    />
  </div>
)

// 技术发展时间轴组件（与 TechApplication 保持一致）
const TechDevelopment: React.FC<{ record?: TechCatalogRecord }> = ({ record }) => {
  if (!record) {
    return <Empty description="请从左侧选择一条技术记录" style={{ marginTop: 20 }} />
  }

  const r = record
  const s = r.status

  // ── 日期格式化 ──
  const fmtDate = (d?: string) => d ? d.slice(0, 10) : ''

  // ── 阶段定义 ──
  // 主流程: 草稿(0)→申请(1)→试运行(2)→开展病例(3)/阶段评估(4)→转常规(5)→效果评价(6)
  // 末位环节: 暂停(7)/终止(8)
  const phases = [
    { key: 'draft',   label: '草稿',     color: '#8c8c8c', date: fmtDate(r.approvalDate) },
    { key: 'apply',   label: '申请',     color: '#1677ff', date: fmtDate(r.startDate) },
    { key: 'trial',   label: '试运行',   color: '#13c2c2', date: fmtDate(r.startDate) },
    { key: 'case',    label: '开展病例', color: '#0958d9', date: fmtDate(r.startDate) },
    { key: 'eval',    label: '阶段评估', color: '#389e0d', date: fmtDate(r.startDate) },
    { key: 'convert', label: '转常规',   color: '#722ed1', date: fmtDate(r.endDate) },
    { key: 'effect',  label: '效果评价', color: '#531dab', date: fmtDate(r.endDate) },
    { key: 'pause',   label: s === '被暂停' || s === '被终止' ? '暂停' : '暂停/终止', color: '#ff4d4f', date: fmtDate(r.terminationDate) },
    { key: 'stop',    label: '终止',     color: '#cf1322', date: fmtDate(r.terminationDate) },
  ]

  // ── 是否需要渲染 idx=8（终止）节点 ──
  const showStopNode = s === '被暂停' || s === '被终止'
  // ── 是否需要渲染 idx=7 节点 ──
  const showPauseStopNode = true

  // ── allX 根据是否渲染终止节点调整 ──
  const allX = showStopNode
    ? [3, 13, 23, 36, 48, 60, 73, 85, 97]   // 9节点
    : [3, 13, 23, 36, 48, 60, 73, 97, 97]    // 8节点效果

  // ── 当前阶段索引 ──
  const currentIdx =
    s === '未开展'  ? 0 :
    s === '申请中'  ? 1 :
    s === '被暂停'  ? 7 :
    s === '被终止'  ? 8 :
    s === '试运行'  ? 2 :
    s === '常规'    ? 6 :
    0

  const isDone = (idx: number) => idx < currentIdx
  const isActive = (idx: number) => idx === currentIdx
  const isTrialPhase = currentIdx === 2
  const isRegularPhase = currentIdx === 6
  const isAfterTrial = isTrialPhase || isRegularPhase
  const isPaused = s === '被暂停'
  const isStopped = s === '被终止'

  // ── 节点视觉状态 ──
  const nodeState = (idx: number): 'done' | 'pause-occurred' | 'stop-occurred' | 'active' | 'future' => {
    if (idx === 7) {
      if (isPaused) return 'pause-occurred'
      if (isStopped) return 'pause-occurred'
      if (isAfterTrial) return 'active'
      return 'future'
    }
    if (idx === 8) {
      if (isStopped) return 'stop-occurred'
      if (isPaused) return 'active'
      return 'future'
    }
    if (isActive(idx)) return 'active'
    if (isDone(idx)) return 'done'
    return 'future'
  }

  const dotBg = (idx: number, color: string) => {
    const st = nodeState(idx)
    if (st === 'done') return '#1677ff'
    if (st === 'pause-occurred') return '#ff4d4f'
    if (st === 'stop-occurred') return '#cf1322'
    if (st === 'active') return color
    return '#d9d9d9'
  }

  const labelClr = (idx: number, color: string) => {
    const st = nodeState(idx)
    if (st === 'done') return '#1677ff'
    if (st === 'pause-occurred') return '#ff4d4f'
    if (st === 'stop-occurred') return '#cf1322'
    if (st === 'active') return color
    return '#bfbfbf'
  }

  // ── 布局参数 ──
  const dotSize = 48
  const centerY = 60
  const caseY = 24
  const evalY = 96
  const svgHeight = 140

  // ── 连接线颜色 ──
  const lineColor = (done: boolean) => done ? '#1677ff' : '#e8e8e8'

  // ── 节点渲染 ──
  const renderNode = (idx: number, label: string, color: string, date: string) => {
    const st = nodeState(idx)
    const operable = st === 'active'
    return (
      <>
        {/* 圆圈 */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: dotBg(idx, color), color: '#fff',
          fontSize: 8.5, fontWeight: 600, lineHeight: 1,
          textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
          boxShadow: operable ? `0 0 0 3px ${color}33` : 'none',
          zIndex: 2,
        }}>
          {date || '-'}
        </div>
        {/* 文字 */}
        <div style={{
          position: 'absolute',
          left: '50%', top: `calc(50% + ${dotSize / 2 + 2}px)`,
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          whiteSpace: 'nowrap', zIndex: 3, pointerEvents: 'auto',
        }}>
          <div style={{
            fontSize: 10, fontWeight: operable ? 700 : 400,
            color: labelClr(idx, color),
          }}>
            {label}
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ position: 'relative', width: '100%', height: svgHeight }}>
        {/* ── SVG 连接线层 ── */}
        <svg width="100%" height={svgHeight} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
          {/* 直线段：草稿→申请→试运行 */}
          {[1, 2].map(i => (
            <line key={`main-${i}`}
              x1={`${allX[i - 1]}%`} y1={centerY} x2={`${allX[i]}%`} y2={centerY}
              stroke={lineColor(isDone(i))} strokeWidth="2" />
          ))}

          {/* 分叉直线 —— 试运行(2) → 开展病例(3) 斜上 */}
          <line
            x1={`${allX[2]}%`} y1={centerY}
            x2={`${allX[3]}%`} y2={caseY}
            stroke={lineColor(isDone(3))} strokeWidth="2" />
          {/* 分叉直线 —— 试运行(2) → 阶段评估(4) 斜下 */}
          <line
            x1={`${allX[2]}%`} y1={centerY}
            x2={`${allX[4]}%`} y2={evalY}
            stroke={lineColor(isDone(4))} strokeWidth="2" />

          {/* 合并直线 —— 开展病例(3) → 转常规(5) 斜下 */}
          <line
            x1={`${allX[3]}%`} y1={caseY}
            x2={`${allX[5]}%`} y2={centerY}
            stroke={lineColor(isDone(5))} strokeWidth="2" />
          {/* 合并直线 —— 阶段评估(4) → 转常规(5) 斜上 */}
          <line
            x1={`${allX[4]}%`} y1={evalY}
            x2={`${allX[5]}%`} y2={centerY}
            stroke={lineColor(isDone(5))} strokeWidth="2" />

          {/* 直线段：转常规→效果评价 */}
          <line x1={`${allX[5]}%`} y1={centerY} x2={`${allX[6]}%`} y2={centerY}
            stroke={lineColor(isDone(6))} strokeWidth="2" />

          {/* 末位环节 —— 效果评价(6) → 暂停/终止(7) */}
          <line x1={`${allX[6]}%`} y1={centerY} x2={`${allX[7]}%`} y2={centerY}
            stroke={
              nodeState(7) === 'pause-occurred' || nodeState(7) === 'active' ? '#ff4d4f' :
              nodeState(7) === 'stop-occurred' ? '#cf1322' :
              lineColor(isDone(7))
            }
            strokeWidth="2" />
          {/* 被暂停/被终止状态下：暂停(7) → 终止(8) */}
          {showStopNode && (
            <line x1={`${allX[7]}%`} y1={centerY} x2={`${allX[8]}%`} y2={centerY}
              stroke={
                nodeState(8) === 'active' ? '#cf1322' :
                lineColor(isDone(8))
              }
              strokeWidth="2" />
          )}
        </svg>

        {/* ── 节点层 ── */}
        {/* 主线节点: 草稿(0) 申请(1) 试运行(2) 转常规(5) 效果评价(6) */}
        {[0, 1, 2, 5, 6].map(idx => (
          <div key={phases[idx].key} style={{
            position: 'absolute', left: `${allX[idx]}%`, top: centerY - dotSize / 2,
            width: dotSize, height: dotSize,
            transform: 'translateX(-50%)', zIndex: 2,
          }}>
            {renderNode(idx, phases[idx].label, phases[idx].color, phases[idx].date)}
          </div>
        ))}

        {/* 末位环节节点 —— 暂停/终止(7) */}
        {showPauseStopNode && (
          <div key={phases[7].key} style={{
            position: 'absolute', left: `${allX[7]}%`, top: centerY - dotSize / 2,
            width: dotSize, height: dotSize,
            transform: 'translateX(-50%)', zIndex: 2,
          }}>
            {renderNode(7, phases[7].label, phases[7].color, phases[7].date)}
          </div>
        )}
        {/* 被暂停状态下的终止(8) 节点 */}
        {showStopNode && (
          <div key={phases[8].key} style={{
            position: 'absolute', left: `${allX[8]}%`, top: centerY - dotSize / 2,
            width: dotSize, height: dotSize,
            transform: 'translateX(-50%)', zIndex: 2,
          }}>
            {renderNode(8, phases[8].label, phases[8].color, phases[8].date)}
          </div>
        )}

        {/* 并行分支节点 —— 开展病例(3) 上行 caseY / 阶段评估(4) 下行 evalY */}
        <div key={phases[3].key} style={{
          position: 'absolute', left: `${allX[3]}%`, top: caseY - dotSize / 2,
          width: dotSize, height: dotSize,
          transform: 'translateX(-50%)', zIndex: 2,
        }}>
          {renderNode(3, phases[3].label, phases[3].color, phases[3].date)}
        </div>
        <div key={phases[4].key} style={{
          position: 'absolute', left: `${allX[4]}%`, top: evalY - dotSize / 2,
          width: dotSize, height: dotSize,
          transform: 'translateX(-50%)', zIndex: 2,
        }}>
          {renderNode(4, phases[4].label, phases[4].color, phases[4].date)}
        </div>
      </div>
    </div>
  )
}

const TechCatalog: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TechCatalogRecord | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState<string | undefined>(undefined)
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit'>('view')
  const [moreActionDrawerOpen, setMoreActionDrawerOpen] = useState(false)
  const [moreActionType, setMoreActionType] = useState<'pause' | 'terminate' | 'restart'>('pause')
  const [moreActionForm] = Form.useForm()
  const [caseForm] = Form.useForm()
  const [activeTabKey, setActiveTabKey] = useState<string>('development')
  const [addDetailDrawerOpen, setAddDetailDrawerOpen] = useState(false)
  const [addDetailType, setAddDetailType] = useState<string>('')

  // 模拟数据（必须在 useMemo 之前定义）
  const mockData: TechCatalogRecord[] = [
    // ========== 常规 (12) ==========
    {
      id: '1', techName: '腹腔镜下胰十二指肠切除术', techCode: 'TECH-2026-001', category: '外科技术', level: '国家级限制类', department: '肝胆外科', status: '常规', leader: '张医生', startDate: '2025-01-15',
      techType: '手术', riskLevel: '高风险', techNature: '常规（开放）手术', scope: '限定科室',
      approvalDate: '2025-01-20',
      stageEvaluations: [
        { date: '2025-04-15', conclusion: '良好' },
        { date: '2025-07-15', conclusion: '优秀' },
        { date: '2025-10-15', conclusion: '优秀' }
      ],
      convertToRegularDate: '2026-01-01',
      teamMembers: [
        { role: '负责人', name: '张医生', dept: '肝胆外科', title: '主任医师', phone: '13800001001', expertise: '擅长腹腔镜肝胆手术，主刀完成同类手术200余例' },
        { role: '参与人', name: '钱医生', dept: '肝胆外科', title: '副主任医师', phone: '13800001002', expertise: '腹腔镜手术一助，熟练掌握器械操作' },
        { role: '参与人', name: '孙医生', dept: '麻醉科', title: '主治医师', phone: '13800001003', expertise: '复杂肝胆手术麻醉管理' },
        { role: '参与人', name: '李护士', dept: '肝胆外科', title: '主管护师', phone: '13800001004', expertise: '腹腔镜器械准备及术中配合' },
      ],
      deptList: [
        { deptName: '肝胆外科', leader: '张医生', startDate: '2025-01-15' },
        { deptName: 'ICU', leader: '蒋医生', startDate: '2025-02-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '高清腹腔镜系统', productCode: 'EQ-LC-001', quantity: 2, unit: '套', dept: '肝胆外科', origin: '德国', manufacturer: 'KARL STORZ', runStatus: '正常运行' },
        { type: '设备', productName: '超声刀', productCode: 'EQ-US-002', quantity: 3, unit: '台', dept: '肝胆外科', origin: '美国', manufacturer: 'Ethicon', runStatus: '正常运行' },
      ],
      relatedTechList: [
        { code: 'TECH-2026-011', projectName: '腹腔镜下胆囊切除术', techType: '外科技术', startDate: '2025-03-01', caseCount: 85, successRate: 96.5, survivalRate: 98.8 },
        { code: 'TECH-2026-008', projectName: '胸腔镜下肺叶切除术', techType: '外科技术', startDate: '2025-06-15', caseCount: 32, successRate: 93.8, survivalRate: 96.9 },
      ],
    },
    {
      id: '2', techName: '经皮冠状动脉介入治疗', techCode: 'TECH-2026-002', category: '内科技术', level: '省级限制类', department: '心血管内科', status: '常规', leader: '李医生', startDate: '2024-06-10',
      techType: '操作', riskLevel: '高风险', techNature: '介入手术', scope: '限定专业',
      approvalDate: '2024-06-15',
      stageEvaluations: [
        { date: '2024-09-10', conclusion: '良好' },
        { date: '2024-12-10', conclusion: '良好' }
      ],
      convertToRegularDate: '2025-06-01',
      teamMembers: [
        { role: '负责人', name: '李医生', dept: '心血管内科', title: '主任医师', phone: '13800002001', expertise: '冠脉介入治疗专家，完成PCI手术500余例' },
        { role: '参与人', name: '周医生', dept: '心血管内科', title: '副主任医师', phone: '13800002002', expertise: '冠脉造影及支架植入' },
        { role: '参与人', name: '吴医生', dept: '心血管内科', title: '主治医师', phone: '13800002003', expertise: '介入术后监护及并发症处理' },
      ],
      deptList: [
        { deptName: '心血管内科', leader: '李医生', startDate: '2024-06-10' },
        { deptName: '心血管外科', leader: '金医生', startDate: '2024-08-15' },
        { deptName: 'ICU', leader: '蒋医生', startDate: '2024-07-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '数字减影血管造影机', productCode: 'EQ-DSA-001', quantity: 1, unit: '台', dept: '心血管内科', origin: '荷兰', manufacturer: 'Philips', runStatus: '正常运行' },
        { type: '设备', productName: '冠脉内超声仪', productCode: 'EQ-IVUS-002', quantity: 1, unit: '台', dept: '心血管内科', origin: '美国', manufacturer: 'Boston Scientific', runStatus: '正常运行' },
      ],
      relatedTechList: [
        { code: 'TECH-2026-007', projectName: '经导管主动脉瓣置换术', techType: '心血管技术', startDate: '2024-08-20', caseCount: 120, successRate: 94.2, survivalRate: 97.5 },
      ],
    },
    { id: '8', techName: '胸腔镜下肺叶切除术', techCode: 'TECH-2026-008', category: '外科技术', level: '国家级限制类', department: '胸外科', status: '常规', leader: '吴医生', startDate: '2025-03-20',
      techType: '手术', riskLevel: '高风险', techNature: '常规（开放）手术', scope: '限定科室',
      teamMembers: [
        { role: '负责人', name: '吴医生', dept: '胸外科', title: '主任医师', phone: '13800008001', expertise: '胸腔镜微创手术，VATS肺叶切除经验丰富' },
        { role: '参与人', name: '郑医生', dept: '胸外科', title: '副主任医师', phone: '13800008002', expertise: '胸腔镜手术辅助及单孔操作' },
        { role: '参与人', name: '王护士', dept: '胸外科', title: '护师', phone: '13800008003', expertise: '胸腔镜器械管理' },
        { role: '参与人', name: '赵医生', dept: '麻醉科', title: '主治医师', phone: '13800008004', expertise: '单肺通气麻醉管理' },
      ],
      deptList: [
        { deptName: '胸外科', leader: '吴医生', startDate: '2025-03-20' },
        { deptName: 'ICU', leader: '蒋医生', startDate: '2025-04-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '胸腔镜系统', productCode: 'EQ-VATS-001', quantity: 2, unit: '套', dept: '胸外科', origin: '德国', manufacturer: 'KARL STORZ', runStatus: '正常运行' },
        { type: '设施', productName: '手术无影灯', productCode: 'EQ-LT-002', quantity: 4, unit: '台', dept: '胸外科', origin: '德国', manufacturer: 'MAQUET', runStatus: '正常运行' },
      ],
      relatedTechList: [
        { code: 'TECH-2026-001', projectName: '腹腔镜下胰十二指肠切除术', techType: '外科技术', startDate: '2025-05-10', caseCount: 45, successRate: 91.1, survivalRate: 95.6 },
        { code: 'TECH-2026-013', projectName: '支气管镜下介入治疗', techType: '内科技术', startDate: '2025-04-01', caseCount: 28, successRate: 89.3, survivalRate: 96.4 },
      ],
    },
    { id: '9', techName: '关节镜下前交叉韧带重建术', techCode: 'TECH-2026-009', category: '外科技术', level: '省级限制类', department: '骨科', status: '常规', leader: '郑医生', startDate: '2024-09-15',
      techType: '手术', riskLevel: '中风险', techNature: '常规（开放）手术', scope: '限定科室',
      teamMembers: [
        { role: '负责人', name: '郑医生', dept: '骨科', title: '主任医师', phone: '13800009001', expertise: '关节镜微创手术，运动损伤治疗' },
        { role: '参与人', name: '严护士', dept: '骨科', title: '主管护师', phone: '13800009005', expertise: '计算机辅助设备管理' },
      ],
      deptList: [
        { deptName: '骨科', leader: '郑医生', startDate: '2024-09-15' },
        { deptName: '关节外科', leader: '何医生', startDate: '2024-10-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '关节镜系统', productCode: 'EQ-AR-001', quantity: 2, unit: '套', dept: '骨科', origin: '美国', manufacturer: 'Stryker', runStatus: '正常运行' },
        { type: '设备', productName: 'C型臂X光机', productCode: 'EQ-CM-002', quantity: 1, unit: '台', dept: '骨科', origin: '德国', manufacturer: 'Siemens', runStatus: '维修中' },
      ],
      relatedTechList: [
        { code: 'TECH-2026-023', projectName: '三维打印辅助骨科手术', techType: '外科技术', startDate: '2024-10-15', caseCount: 56, successRate: 94.6, survivalRate: 98.2 },
      ],
    },
    { id: '10', techName: '神经内镜下垂体瘤切除术', techCode: 'TECH-2026-010', category: '外科技术', level: '国家级限制类', department: '神经外科', status: '常规', leader: '王医生', startDate: '2024-03-01',
      techType: '手术', riskLevel: '高风险', techNature: '常规（开放）手术', scope: '限定科室',
      teamMembers: [
        { role: '负责人', name: '王医生', dept: '神经外科', title: '主任医师', phone: '13800010001', expertise: '神经内镜手术，垂体瘤微创治疗' },
        { role: '参与人', name: '冯医生', dept: '神经外科', title: '副主任医师', phone: '13800010002', expertise: '内镜下垂体瘤操作' },
        { role: '参与人', name: '陈医生', dept: '神经外科', title: '主治医师', phone: '13800010003', expertise: '术中神经监测' },
      ],
      deptList: [
        { deptName: '神经外科', leader: '王医生', startDate: '2024-03-01' },
        { deptName: 'ICU', leader: '蒋医生', startDate: '2024-03-15' },
      ],
      equipmentList: [
        { type: '设备', productName: '手术显微镜', productCode: 'EQ-MC-001', quantity: 1, unit: '台', dept: '神经外科', origin: '德国', manufacturer: 'ZEISS', runStatus: '正常运行' },
        { type: '设备', productName: '神经导航系统', productCode: 'EQ-NN-002', quantity: 1, unit: '套', dept: '神经外科', origin: '美国', manufacturer: 'Medtronic', runStatus: '正常运行' },
      ],
      relatedTechList: [
        { code: 'TECH-2026-026', projectName: '脑深部电刺激术', techType: '外科技术', startDate: '2024-06-01', caseCount: 18, successRate: 88.9, survivalRate: 94.4 },
      ],
    },
    { id: '11', techName: '腹腔镜下胆囊切除术', techCode: 'TECH-2026-011', category: '外科技术', level: '院级新技术', department: '普外科', status: '常规', leader: '赵医生', startDate: '2023-06-01',
      techType: '手术', riskLevel: '低风险', techNature: '常规（开放）手术', scope: '不限制',
      teamMembers: [
        { role: '负责人', name: '赵医生', dept: '普外科', title: '副主任医师', phone: '13800011001', expertise: '腹腔镜胆囊手术' },
      ],
      deptList: [
        { deptName: '普外科', leader: '赵医生', startDate: '2023-06-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '高频电刀', productCode: 'EQ-ES-001', quantity: 5, unit: '台', dept: '普外科', origin: '美国', manufacturer: 'Valleylab', runStatus: '正常运行' },
        { type: '设备', productName: '腹腔镜系统', productCode: 'EQ-LC-002', quantity: 3, unit: '套', dept: '普外科', origin: '日本', manufacturer: 'Olympus', runStatus: '正常运行' },
      ],
    },
    { id: '12', techName: '消化内镜下黏膜剥离术', techCode: 'TECH-2026-012', category: '内科技术', level: '省级限制类', department: '消化内科', status: '常规', leader: '陈医生', startDate: '2024-01-10',
      techType: '操作', riskLevel: '中风险', techNature: '介入手术', scope: '限定专业',
      teamMembers: [
        { role: '负责人', name: '陈医生', dept: '消化内科', title: '主任医师', phone: '13800012001', expertise: 'ESD手术，早期消化道肿瘤内镜下切除' },
        { role: '参与人', name: '何护士', dept: '普外科', title: '护师', phone: '13800012004', expertise: '荧光成像设备操作' },
      ],
      deptList: [
        { deptName: '消化内科', leader: '陈医生', startDate: '2024-01-10' },
        { deptName: '消化内镜中心', leader: '杨医生', startDate: '2024-02-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '电子胃镜', productCode: 'EQ-GS-001', quantity: 4, unit: '台', dept: '消化内科', origin: '日本', manufacturer: 'Olympus', runStatus: '正常运行' },
        { type: '设备', productName: '超声内镜', productCode: 'EQ-EUS-002', quantity: 1, unit: '台', dept: '消化内科', origin: '日本', manufacturer: 'Pentax', runStatus: '待检修' },
      ],
      relatedTechList: [
        { code: 'TECH-2026-011', projectName: '腹腔镜下胆囊切除术', techType: '外科技术', startDate: '2024-03-10', caseCount: 67, successRate: 95.5, survivalRate: 99.1 },
        { code: 'TECH-2026-013', projectName: '支气管镜下介入治疗', techType: '内科技术', startDate: '2024-05-20', caseCount: 43, successRate: 90.7, survivalRate: 97.7 },
      ],
    },
    { id: '13', techName: '支气管镜下介入治疗', techCode: 'TECH-2026-013', category: '内科技术', level: '院级新技术', department: '呼吸内科', status: '常规', leader: '周医生', startDate: '2024-07-01',
      techType: '操作', riskLevel: '中风险', techNature: '介入手术', scope: '限定专业',
      teamMembers: [
        { role: '负责人', name: '周医生', dept: '呼吸内科', title: '主任医师', phone: '13800013001', expertise: '支气管镜介入诊疗' },
        { role: '参与人', name: '吴医生', dept: '呼吸内科', title: '主治医师', phone: '13800013002', expertise: '支气管镜操作配合' },
      ],
      deptList: [
        { deptName: '呼吸内科', leader: '周医生', startDate: '2024-07-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '支气管镜', productCode: 'EQ-BR-001', quantity: 2, unit: '台', dept: '呼吸内科', origin: '日本', manufacturer: 'Olympus', runStatus: '正常运行' },
      ],
    },
    { id: '14', techName: 'ICU连续性肾脏替代治疗', techCode: 'TECH-2026-014', category: '内科技术', level: '省级限制类', department: 'ICU', status: '常规', leader: '蒋医生', startDate: '2024-04-01',
      techType: '操作', riskLevel: '高风险', techNature: '介入手术', scope: '限定科室',
      teamMembers: [
        { role: '负责人', name: '蒋医生', dept: 'ICU', title: '主任医师', phone: '13800014001', expertise: '危重症血液净化治疗' },
        { role: '参与人', name: '沈医生', dept: 'ICU', title: '副主任医师', phone: '13800014002', expertise: 'CRRT机器操作' },
        { role: '参与人', name: '韩护士', dept: 'ICU', title: '主管护师', phone: '13800014003', expertise: 'CRRT管路管理' },
      ],
      deptList: [
        { deptName: 'ICU', leader: '蒋医生', startDate: '2024-04-01' },
        { deptName: '肾内科', leader: '田医生', startDate: '2024-05-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '呼吸机', productCode: 'EQ-VM-001', quantity: 10, unit: '台', dept: 'ICU', origin: '德国', manufacturer: 'Drager', runStatus: '正常运行' },
        { type: '设备', productName: '监护仪', productCode: 'EQ-MN-002', quantity: 15, unit: '台', dept: 'ICU', origin: '美国', manufacturer: 'Philips', runStatus: '正常运行' },
        { type: '设备', productName: '除颤仪', productCode: 'EQ-DF-003', quantity: 3, unit: '台', dept: 'ICU', origin: '美国', manufacturer: 'ZOLL', runStatus: '正常运行' },
      ],
      relatedTechList: [
        { code: 'TECH-2026-002', projectName: '经皮冠状动脉介入治疗', techType: '内科技术', startDate: '2024-07-10', caseCount: 92, successRate: 93.5, survivalRate: 96.7 },
      ],
    },
    { id: '15', techName: '三维适形放射治疗', techCode: 'TECH-2026-015', category: '肿瘤技术', level: '省级限制类', department: '放疗科', status: '常规', leader: '冯医生', startDate: '2024-08-01',
      techType: '项目', riskLevel: '中风险', techNature: '介入手术', scope: '限定专业',
      teamMembers: [
        { role: '负责人', name: '冯医生', dept: '放疗科', title: '主任医师', phone: '13800015001', expertise: '精确放射治疗计划制定' },
        { role: '参与人', name: '褚医生', dept: '放疗科', title: '主治医师', phone: '13800015002', expertise: '放疗计划执行及质量控制' },
      ],
      deptList: [
        { deptName: '放疗科', leader: '冯医生', startDate: '2024-08-01' },
        { deptName: '肿瘤科', leader: '彭医生', startDate: '2024-09-01' },
      ],
      equipmentList: [
        { type: '设施', productName: '直线加速器', productCode: 'EQ-LA-001', quantity: 1, unit: '台', dept: '放疗科', origin: '美国', manufacturer: 'Varian', runStatus: '正常运行' },
        { type: '设备', productName: '治疗计划系统', productCode: 'EQ-TPS-002', quantity: 1, unit: '套', dept: '放疗科', origin: '美国', manufacturer: 'Varian', runStatus: '正常运行' },
      ],
      relatedTechList: [
        { code: 'TECH-2026-001', projectName: '腹腔镜下胰十二指肠切除术', techType: '外科技术', startDate: '2025-02-15', caseCount: 24, successRate: 87.5, survivalRate: 91.7 },
        { code: 'TECH-2026-012', projectName: '消化内镜下黏膜剥离术', techType: '内科技术', startDate: '2025-01-10', caseCount: 38, successRate: 92.1, survivalRate: 97.4 },
      ],
    },
    { id: '16', techName: '超声引导下神经阻滞术', techCode: 'TECH-2026-016', category: '麻醉技术', level: '院级新技术', department: '麻醉科', status: '常规', leader: '孙医生', startDate: '2024-05-01',
      techType: '操作', riskLevel: '低风险', techNature: '介入手术', scope: '不限制',
      teamMembers: [
        { role: '负责人', name: '孙医生', dept: '麻醉科', title: '主任医师', phone: '13800016001', expertise: '超声引导区域麻醉' },
        { role: '参与人', name: '顾医生', dept: '麻醉科', title: '护师', phone: '13800016004', expertise: '超声设备维护及术中监护' },
      ],
      deptList: [
        { deptName: '麻醉科', leader: '孙医生', startDate: '2024-05-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '麻醉机', productCode: 'EQ-AM-001', quantity: 8, unit: '台', dept: '麻醉科', origin: '德国', manufacturer: 'Drager', runStatus: '正常运行' },
        { type: '设备', productName: '超声引导仪', productCode: 'EQ-UG-002', quantity: 3, unit: '台', dept: '麻醉科', origin: '美国', manufacturer: 'GE', runStatus: '正常运行' },
      ],
    },
    { id: '17', techName: '输尿管软镜下碎石术', techCode: 'TECH-2026-017', category: '外科技术', level: '省级限制类', department: '泌尿外科', status: '常规', leader: '杨医生', startDate: '2024-11-01',
      techType: '手术', riskLevel: '中风险', techNature: '常规（开放）手术', scope: '限定科室',
      teamMembers: [
        { role: '负责人', name: '杨医生', dept: '泌尿外科', title: '主任医师', phone: '13800017001', expertise: '输尿管软镜操作及激光碎石' },
        { role: '参与人', name: '朱医生', dept: '泌尿外科', title: '主治医师', phone: '13800017002', expertise: '软镜辅助操作' },
      ],
      deptList: [
        { deptName: '泌尿外科', leader: '杨医生', startDate: '2024-11-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '输尿管软镜', productCode: 'EQ-URS-001', quantity: 2, unit: '台', dept: '泌尿外科', origin: '日本', manufacturer: 'Olympus', runStatus: '正常运行' },
        { type: '设备', productName: '钬激光', productCode: 'EQ-HL-002', quantity: 1, unit: '台', dept: '泌尿外科', origin: '美国', manufacturer: 'Lumenis', runStatus: '维修中' },
      ],
      relatedTechList: [
        { code: 'TECH-2026-009', projectName: '关节镜下前交叉韧带重建术', techType: '外科技术', startDate: '2024-12-01', caseCount: 72, successRate: 95.8, survivalRate: 98.6 },
      ],
    },
    // ========== 申请中 (5) ==========
    { id: '18', techName: '机器人辅助腹腔镜手术', techCode: 'TECH-2026-018', category: '外科技术', level: '国家级限制类', department: '普外科', status: '申请中', leader: '赵医生', startDate: '2026-05-01', techType: '手术', riskLevel: '高风险', techNature: '常规（开放）手术', scope: '限定科室' },
    { id: '19', techName: '经导管二尖瓣修复术', techCode: 'TECH-2026-019', category: '心血管技术', level: '国家级限制类', department: '心血管外科', status: '申请中', leader: '金医生', startDate: '2026-04-15', techType: '手术', riskLevel: '高风险', techNature: '介入手术', scope: '限定科室' },
    { id: '20', techName: '脊柱内镜下椎间盘摘除术', techCode: 'TECH-2026-020', category: '外科技术', level: '省级限制类', department: '脊柱外科', status: '申请中', leader: '刘医生', startDate: '2026-04-01',
      techType: '手术', riskLevel: '中风险', techNature: '常规（开放）手术', scope: '限定科室',
      teamMembers: [
        { role: '负责人', name: '刘医生', dept: '脊柱外科', title: '主任医师', phone: '13800038001', expertise: '脊柱微创手术，椎间孔镜操作' },
        { role: '参与人', name: '黄医生', dept: '脊柱外科', title: '副主任医师', phone: '13800038002', expertise: '椎间孔镜术中导航' },
      ],
      deptList: [
        { deptName: '脊柱外科', leader: '刘医生', startDate: '2026-04-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '脊柱导航系统', productCode: 'EQ-SN-001', quantity: 1, unit: '套', dept: '脊柱外科', origin: '美国', manufacturer: 'Medtronic', runStatus: '正常运行' },
      ],
    },
    { id: '21', techName: '关节镜下肩袖修补术', techCode: 'TECH-2026-021', category: '外科技术', level: '院级新技术', department: '关节外科', status: '申请中', leader: '何医生', startDate: '2026-05-10', techType: '手术', riskLevel: '中风险', techNature: '常规（开放）手术', scope: '限定科室' },
    { id: '22', techName: '超声引导下甲状腺消融术', techCode: 'TECH-2026-022', category: '内科技术', level: '院级新技术', department: '介入超声科', status: '申请中', leader: '朱医生', startDate: '2026-03-20', techType: '操作', riskLevel: '中风险', techNature: '介入手术', scope: '限定专业' },
    // ========== 试运行 (5) ==========
    { id: '23', techName: '三维打印辅助骨科手术', techCode: 'TECH-2026-023', category: '外科技术', level: '省级限制类', department: '骨科', status: '试运行', leader: '郑医生', startDate: '2026-01-15',
      techType: '项目', riskLevel: '中风险', techNature: '常规（开放）手术', scope: '限定专业',
      approvalDate: '2026-01-20',
      teamMembers: [
        { role: '负责人', name: '郑医生', dept: '骨科', title: '主任医师', phone: '13800009001', expertise: '3D打印辅助手术规划' },
        { role: '参与人', name: '严护士', dept: '骨科', title: '主管护师', phone: '13800009005', expertise: '3D打印模型管理' },
        { role: '参与人', name: '林医生', dept: '骨科', title: '主治医师', phone: '13800009006', expertise: '导航辅助手术' },
      ],
      deptList: [
        { deptName: '骨科', leader: '郑医生', startDate: '2026-01-15' },
        { deptName: '脊柱外科', leader: '刘医生', startDate: '2026-02-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '关节镜系统', productCode: 'EQ-AR-001', quantity: 2, unit: '套', dept: '骨科', origin: '美国', manufacturer: 'Stryker', runStatus: '正常运行' },
        { type: '设备', productName: 'C型臂X光机', productCode: 'EQ-CM-002', quantity: 1, unit: '台', dept: '骨科', origin: '德国', manufacturer: 'Siemens', runStatus: '维修中' },
      ],
    },
    { id: '24', techName: '超声引导下肝脏消融术', techCode: 'TECH-2026-024', category: '内科技术', level: '院级新技术', department: '超声科', status: '试运行', leader: '秦医生', startDate: '2026-02-01',
      techType: '操作', riskLevel: '中风险', techNature: '介入手术', scope: '限定专业',
      approvalDate: '2026-02-05',
      teamMembers: [
        { role: '负责人', name: '秦医生', dept: '超声科', title: '主任医师', phone: '13800024001', expertise: '超声引导消融治疗' },
        { role: '参与人', name: '许医生', dept: '超声科', title: '主治医师', phone: '13800024002', expertise: '超声设备操作' },
      ],
      deptList: [
        { deptName: '超声科', leader: '秦医生', startDate: '2026-02-01' },
        { deptName: '肝胆外科', leader: '张医生', startDate: '2026-03-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '彩色多普勒超声', productCode: 'EQ-CD-001', quantity: 6, unit: '台', dept: '超声科', origin: '美国', manufacturer: 'GE', runStatus: '正常运行' },
        { type: '设备', productName: '便携式超声', productCode: 'EQ-PU-002', quantity: 3, unit: '台', dept: '超声科', origin: '日本', manufacturer: 'Fukuda', runStatus: '正常运行' },
      ],
    },
    { id: '25', techName: '宫腔镜下子宫肌瘤剔除术', techCode: 'TECH-2026-025', category: '外科技术', level: '院级新技术', department: '妇产科', status: '试运行', leader: '吕医生', startDate: '2026-01-20',
      techType: '手术', riskLevel: '中风险', techNature: '常规（开放）手术', scope: '限定科室',
      approvalDate: '2026-01-25',
      teamMembers: [
        { role: '负责人', name: '吕医生', dept: '妇产科', title: '主任医师', phone: '13800025001', expertise: '宫腔镜微创手术' },
        { role: '参与人', name: '施医生', dept: '妇产科', title: '副主任医师', phone: '13800025002', expertise: '宫腔镜辅助' },
      ],
      deptList: [
        { deptName: '妇产科', leader: '吕医生', startDate: '2026-01-20' },
      ],
      equipmentList: [
        { type: '设备', productName: '宫腔镜', productCode: 'EQ-HS-001', quantity: 2, unit: '台', dept: '妇产科', origin: '日本', manufacturer: 'Olympus', runStatus: '正常运行' },
        { type: '设备', productName: '胎儿监护仪', productCode: 'EQ-FM-002', quantity: 5, unit: '台', dept: '妇产科', origin: '美国', manufacturer: 'GE', runStatus: '正常运行' },
      ],
      caseList: [
        { name: '王丽华', gender: '女', birthDate: '1985-03-12', admissionNo: 'ZY20260215001', applyDate: '2026-02-15', effectEval: '手术顺利，肌瘤完整剔除', complication: '无', adverseReaction: '无', experience: '术中出血少，恢复良好', followUp: '术后1月复查，恢复良好', consentFileName: '知情同意书_王丽华.pdf' },
        { name: '李秀英', gender: '女', birthDate: '1978-07-25', admissionNo: 'ZY20260301002', applyDate: '2026-03-01', effectEval: '手术成功，术后恢复可', complication: '轻度腹痛', adverseReaction: '无', experience: '肌瘤较大，操作时间偏长', followUp: '术后2周复查，腹痛缓解', consentFileName: '知情同意书_李秀英.pdf' },
      ],
    },
    { id: '26', techName: '脑深部电刺激术', techCode: 'TECH-2026-026', category: '外科技术', level: '国家级限制类', department: '功能神经外科', status: '试运行', leader: '张医生', startDate: '2026-02-10',
      techType: '手术', riskLevel: '高风险', techNature: '介入手术', scope: '限定科室',
      approvalDate: '2026-02-15',
      teamMembers: [
        { role: '负责人', name: '张医生', dept: '功能神经外科', title: '主任医师', phone: '13800026001', expertise: 'DBS手术，帕金森病外科治疗' },
        { role: '参与人', name: '孔医生', dept: '功能神经外科', title: '副主任医师', phone: '13800026002', expertise: '术中电生理监测' },
        { role: '参与人', name: '曹医生', dept: '功能神经外科', title: '主治医师', phone: '13800026003', expertise: 'DBS术后程控' },
      ],
      deptList: [
        { deptName: '功能神经外科', leader: '张医生', startDate: '2026-02-10' },
      ],
      equipmentList: [
        { type: '设备', productName: '脑电图仪', productCode: 'EQ-EEG-001', quantity: 2, unit: '台', dept: '功能神经外科', origin: '日本', manufacturer: 'Nihon Kohden', runStatus: '正常运行' },
        { type: '设备', productName: '立体定向仪', productCode: 'EQ-ST-002', quantity: 1, unit: '套', dept: '功能神经外科', origin: '德国', manufacturer: 'Brainlab', runStatus: '待检修' },
      ],
      caseList: [
        { name: '赵建国', gender: '男', birthDate: '1958-11-03', admissionNo: 'ZY20260220003', applyDate: '2026-02-20', effectEval: '震颤明显改善', complication: '无', adverseReaction: '术后短暂头痛', experience: '电极植入位置精准，术后程控效果好', followUp: '术后3月随访，症状持续改善', consentFileName: '知情同意书_赵建国.pdf' },
      ],
    },
    { id: '27', techName: '体外膜肺氧合技术', techCode: 'TECH-2026-027', category: '急救技术', level: '省级限制类', department: '心血管外科', status: '试运行', leader: '金医生', startDate: '2026-03-01',
      techType: '操作', riskLevel: '高风险', techNature: '介入手术', scope: '限定科室',
      approvalDate: '2026-03-05',
      teamMembers: [
        { role: '负责人', name: '金医生', dept: '心血管外科', title: '主任医师', phone: '13800027001', expertise: 'ECMO植入及管理' },
        { role: '参与人', name: '魏医生', dept: '心血管外科', title: '副主任医师', phone: '13800027002', expertise: 'ECMO辅助管理' },
        { role: '参与人', name: '陶医生', dept: 'ICU', title: '主治医师', phone: '13800027003', expertise: 'ECMO患者监护' },
      ],
      deptList: [
        { deptName: '心血管外科', leader: '金医生', startDate: '2026-03-01' },
        { deptName: 'ICU', leader: '蒋医生', startDate: '2026-03-10' },
      ],
      equipmentList: [
        { type: '设备', productName: '体外循环机', productCode: 'EQ-CPB-001', quantity: 2, unit: '台', dept: '心血管外科', origin: '美国', manufacturer: 'Medtronic', runStatus: '正常运行' },
      ],
      caseList: [
        { name: '孙伟明', gender: '男', birthDate: '1972-05-18', admissionNo: 'ZY20260305004', applyDate: '2026-03-05', effectEval: 'ECMO辅助有效，心功能恢复', complication: '穿刺部位血肿', adverseReaction: '无', experience: '早期启动ECMO效果佳，需注意抗凝管理', followUp: '脱机后1周复查，心功能稳定', consentFileName: '知情同意书_孙伟明.pdf' },
        { name: '周芳', gender: '女', birthDate: '1965-09-22', admissionNo: 'ZY20260312005', applyDate: '2026-03-12', effectEval: 'VA-ECMO支持后顺利脱机', complication: '下肢缺血', adverseReaction: '无', experience: '需加强远端灌注管管理', followUp: '术后2周转出ICU', consentFileName: '知情同意书_周芳.pdf' },
        { name: '刘志强', gender: '男', birthDate: '1980-12-07', admissionNo: 'ZY20260320006', applyDate: '2026-03-20', effectEval: 'VV-ECMO支持下氧合改善', complication: '无', adverseReaction: '无', experience: 'VV-ECMO对ARDS效果显著', followUp: '持续ECMO支持中' },
      ],
    },
    // ========== 被暂停 (4) ==========
    { id: '28', techName: '光动力治疗消化道肿瘤', techCode: 'TECH-2026-028', category: '肿瘤技术', level: '院级新技术', department: '消化内镜中心', status: '被暂停', leader: '杨医生', startDate: '2025-08-01',
      techType: '项目', riskLevel: '中风险', techNature: '介入手术', scope: '限定专业',
      endDate: '2026-01-20',
      approvalDate: '2025-08-05',
      terminationDate: '2026-01-20',
      terminationReason: '设备维护期间暂停',
      exceptionList: [
        { exceptionType: '暂停', occurDate: '2026-01-20', reason: '光动力治疗仪设备故障，需返厂维修，期间暂停全部光动力治疗' },
        { exceptionType: '重启', occurDate: '2026-03-01', reason: '设备维修完成并完成校准，恢复光动力治疗', restartStatus: '试运行' },
      ],
      teamMembers: [
        { role: '负责人', name: '杨医生', dept: '消化内镜中心', title: '主任医师', phone: '13800028001', expertise: '光动力治疗消化道早癌' },
        { role: '参与人', name: '谢护士', dept: '消化内镜中心', title: '护师', phone: '13800028004', expertise: '光动力设备操作与患者避光护理' },
      ],
      deptList: [
        { deptName: '消化内镜中心', leader: '杨医生', startDate: '2025-08-01' },
        { deptName: '消化内科', leader: '陈医生', startDate: '2025-09-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '电子肠镜', productCode: 'EQ-CO-001', quantity: 4, unit: '台', dept: '消化内镜中心', origin: '日本', manufacturer: 'Olympus', runStatus: '正常运行' },
        { type: '设备', productName: '光动力治疗仪', productCode: 'EQ-PDT-002', quantity: 1, unit: '台', dept: '消化内镜中心', origin: '中国', manufacturer: '科颐康', runStatus: '正常运行' },
      ],
    },
    { id: '29', techName: '经皮肾镜碎石术', techCode: 'TECH-2026-029', category: '外科技术', level: '省级限制类', department: '泌尿外科', status: '被暂停', leader: '朱医生', startDate: '2025-05-10',
      techType: '手术', riskLevel: '中风险', techNature: '介入手术', scope: '限定科室',
      endDate: '2026-02-10',
      approvalDate: '2025-05-15',
      terminationDate: '2026-02-10',
      terminationReason: '转常规后评估不达标',
      exceptionList: [
        { exceptionType: '暂停', occurDate: '2026-02-10', reason: '阶段评估发现碎石成功率低于行业标准，暂停开展以待整改' },
      ],
      teamMembers: [
        { role: '负责人', name: '朱医生', dept: '泌尿外科', title: '副主任医师', phone: '13800029001', expertise: '经皮肾镜操作' },
        { role: '参与人', name: '尤医生', dept: '泌尿外科', title: '主治医师', phone: '13800029002', expertise: '肾镜辅助操作' },
      ],
      deptList: [
        { deptName: '泌尿外科', leader: '朱医生', startDate: '2025-05-10' },
      ],
      equipmentList: [
        { type: '设备', productName: '输尿管软镜', productCode: 'EQ-URS-001', quantity: 2, unit: '台', dept: '泌尿外科', origin: '日本', manufacturer: 'Olympus', runStatus: '正常运行' },
        { type: '设备', productName: '钬激光', productCode: 'EQ-HL-002', quantity: 1, unit: '台', dept: '泌尿外科', origin: '美国', manufacturer: 'Lumenis', runStatus: '维修中' },
      ],
    },
    { id: '30', techName: '超声引导下疼痛介入治疗', techCode: 'TECH-2026-030', category: '麻醉技术', level: '院级新技术', department: '麻醉科', status: '被暂停', leader: '孙医生', startDate: '2025-10-01',
      techType: '操作', riskLevel: '低风险', techNature: '介入手术', scope: '不限制',
      endDate: '2026-03-15',
      approvalDate: '2025-10-05',
      terminationDate: '2026-03-15',
      terminationReason: '人员培训期间暂停',
      exceptionList: [
        { exceptionType: '暂停', occurDate: '2026-03-15', reason: '科室人员调整，新到岗人员需完成超声引导操作培训方可继续' },
      ],
      teamMembers: [
        { role: '负责人', name: '孙医生', dept: '麻醉科', title: '主任医师', phone: '13800016001', expertise: '超声引导疼痛治疗' },
      ],
      deptList: [
        { deptName: '麻醉科', leader: '孙医生', startDate: '2025-10-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '麻醉机', productCode: 'EQ-AM-001', quantity: 8, unit: '台', dept: '麻醉科', origin: '德国', manufacturer: 'Drager', runStatus: '正常运行' },
        { type: '设备', productName: '超声引导仪', productCode: 'EQ-UG-002', quantity: 3, unit: '台', dept: '麻醉科', origin: '美国', manufacturer: 'GE', runStatus: '正常运行' },
      ],
    },
    { id: '31', techName: '血液透析滤过技术', techCode: 'TECH-2026-031', category: '内科技术', level: '省级限制类', department: '肾内科', status: '被暂停', leader: '田医生', startDate: '2025-06-01',
      techType: '操作', riskLevel: '中风险', techNature: '介入手术', scope: '限定专业',
      endDate: '2026-02-28',
      approvalDate: '2025-06-05',
      terminationDate: '2026-02-28',
      terminationReason: '水处理系统升级期间暂停',
      exceptionList: [
        { exceptionType: '暂停', occurDate: '2026-02-28', reason: '水处理系统需全面升级改造，期间无法保证透析用水质量' },
        { exceptionType: '重启', occurDate: '2026-04-15', reason: '水处理系统升级完成，水质检测合格，恢复透析治疗', restartStatus: '试运行' },
      ],
      teamMembers: [
        { role: '负责人', name: '田医生', dept: '肾内科', title: '主任医师', phone: '13800031001', expertise: '血液净化技术' },
        { role: '参与人', name: '范护士', dept: '肾内科', title: '主管护师', phone: '13800031002', expertise: '透析机操作及管路维护' },
      ],
      deptList: [
        { deptName: '肾内科', leader: '田医生', startDate: '2025-06-01' },
        { deptName: 'ICU', leader: '蒋医生', startDate: '2025-07-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '血液透析机', productCode: 'EQ-HD-001', quantity: 12, unit: '台', dept: '肾内科', origin: '德国', manufacturer: 'Fresenius', runStatus: '正常运行' },
        { type: '设备', productName: '水处理系统', productCode: 'EQ-WP-002', quantity: 1, unit: '套', dept: '肾内科', origin: '德国', manufacturer: 'Fresenius', runStatus: '正常运行' },
      ],
    },
    // ========== 被终止 (3) ==========
    { id: '32', techName: '经颈静脉肝内门体分流术', techCode: 'TECH-2026-032', category: '内科技术', level: '国家级限制类', department: '消化内科', status: '被终止', leader: '陈医生', startDate: '2025-03-01',
      techType: '手术', riskLevel: '高风险', techNature: '介入手术', scope: '限定科室',
      endDate: '2025-12-30',
      approvalDate: '2025-03-05',
      terminationDate: '2025-12-30',
      terminationReason: '并发症发生率过高',
      exceptionList: [
        { exceptionType: '暂停', occurDate: '2025-09-15', reason: '近期并发症发生率显著上升，暂停以待专家论证' },
        { exceptionType: '终止', occurDate: '2025-12-30', reason: '专家论证认为当前条件下难以保证手术安全性，予以终止' },
      ],
      teamMembers: [
        { role: '负责人', name: '陈医生', dept: '消化内科', title: '主任医师', phone: '13800012001', expertise: 'TIPS手术操作' },
      ],
      deptList: [
        { deptName: '消化内科', leader: '陈医生', startDate: '2025-03-01' },
      ],
      equipmentList: [
        { type: '设备', productName: '电子胃镜', productCode: 'EQ-GS-001', quantity: 4, unit: '台', dept: '消化内科', origin: '日本', manufacturer: 'Olympus', runStatus: '正常运行' },
        { type: '设备', productName: '超声内镜', productCode: 'EQ-EUS-002', quantity: 1, unit: '台', dept: '消化内科', origin: '日本', manufacturer: 'Pentax', runStatus: '待检修' },
      ],
    },
    { id: '33', techName: '细胞免疫治疗技术', techCode: 'TECH-2026-033', category: '肿瘤技术', level: '国家级限制类', department: '肿瘤科', status: '被终止', leader: '彭医生', startDate: '2025-04-01',
      techType: '项目', riskLevel: '高风险', techNature: '介入手术', scope: '限定专业',
      endDate: '2025-11-30',
      approvalDate: '2025-04-05',
      terminationDate: '2025-11-30',
      terminationReason: '疗效未达预期',
      exceptionList: [
        { exceptionType: '暂停', occurDate: '2025-09-01', reason: '中期评估显示疗效未达预期，暂停入组新病例' },
        { exceptionType: '终止', occurDate: '2025-11-30', reason: '终期评估确认疗效无法达到研究终点标准，终止项目' },
      ],
      teamMembers: [
        { role: '负责人', name: '彭医生', dept: '肿瘤科', title: '副主任医师', phone: '13800035001', expertise: '肿瘤免疫治疗' },
        { role: '参与人', name: '马医生', dept: '肿瘤科', title: '主治医师', phone: '13800035002', expertise: '免疫细胞培养' },
        { role: '参与人', name: '顾医生', dept: '肿瘤科', title: '住院医师', phone: '13800035003', expertise: '治疗随访管理' },
      ],
      deptList: [
        { deptName: '肿瘤科', leader: '彭医生', startDate: '2025-04-01' },
      ],
      equipmentList: [
        { type: '设施', productName: 'CT模拟定位机', productCode: 'EQ-CT-001', quantity: 1, unit: '台', dept: '肿瘤科', origin: '美国', manufacturer: 'GE', runStatus: '正常运行' },
      ],
    },
    { id: '36', techName: '高强度聚焦超声治疗', techCode: 'TECH-2026-036', category: '肿瘤技术', level: '院级新技术', department: '肿瘤科', status: '被终止', leader: '马医生', startDate: '2025-06-20',
      techType: '项目', riskLevel: '中风险', techNature: '介入手术', scope: '限定专业',
      endDate: '2025-12-15',
      approvalDate: '2025-06-25',
      terminationDate: '2025-12-15',
      terminationReason: '申请阶段即发现重大缺陷',
      exceptionList: [
        { exceptionType: '终止', occurDate: '2025-12-15', reason: '可行性评估发现该技术存在重大安全隐患，不具备开展条件' },
      ],
    },
    // ========== 未开展 (4) ==========
    { id: '3', techName: '达芬奇机器人辅助手术', techCode: 'TECH-2026-003', category: '外科技术', level: '国家级限制类', department: '普外科', status: '未开展', leader: '赵医生', startDate: '2026-06-01', techType: '手术', riskLevel: '高风险', techNature: '常规（开放）手术', scope: '限定科室' },
    { id: '4', techName: '质子治疗技术', techCode: 'TECH-2026-004', category: '肿瘤技术', level: '国家级限制类', department: '放疗科', status: '未开展', leader: '冯医生', startDate: '2027-01-01', techType: '项目', riskLevel: '高风险', techNature: '介入手术', scope: '限定专业' },
    { id: '5', techName: '基因编辑辅助诊断技术', techCode: 'TECH-2026-005', category: '检验技术', level: '院级新技术', department: '遗传科', status: '未开展', leader: '卫医生', startDate: '2026-08-01', techType: '检验', riskLevel: '低风险', techNature: '常规（开放）手术', scope: '限定专业' },
    { id: '6', techName: '数字病理远程会诊', techCode: 'TECH-2026-006', category: '检验技术', level: '院级新技术', department: '病理科', status: '未开展', leader: '蒋医生', startDate: '2026-07-01', techType: '病理', riskLevel: '低风险', techNature: '常规（开放）手术', scope: '不限制' },
    // ========== 临时 (2) ==========
    { id: '7', techName: '经导管主动脉瓣置换术', techCode: 'TECH-2026-007', category: '心血管技术', level: '国家级限制类', department: '心血管外科', status: '临时', leader: '周医生', startDate: '2026-05-10', techType: '手术', riskLevel: '高风险', techNature: '介入手术', scope: '限定科室' },
    { id: '37', techName: '左心耳封堵术', techCode: 'TECH-2026-037', category: '心血管技术', level: '省级限制类', department: '心血管内科', status: '临时', leader: '顾医生', startDate: '2026-05-18', techType: '手术', riskLevel: '高风险', techNature: '介入手术', scope: '限定科室' }
  ]

  // 机构选项
  const INSTITUTION_OPTIONS = [
    { label: '全部机构', value: '__all__' },
    { label: 'xxxx医院总院区', value: '总院区' },
    { label: 'xx医院新院区', value: '新院区' },
  ]

  // 使用范围机构选项（抽屉中勾选用）
  const SCOPE_INSTITUTION_OPTIONS = [
    { label: 'xxxx医院总院区', value: '总院区' },
    { label: 'xx医院新院区', value: '新院区' },
  ]

  // 根据机构筛选数据
  const filteredData = useMemo(() => {
    // 给没有 scopeInstitutions 的记录补充默认值
    const dataWithScope = mockData.map((item) => ({
      ...item,
      scopeInstitutions: item.scopeInstitutions || ['总院区', '新院区'],
    }))
    if (selectedInstitution && selectedInstitution !== '__all__') {
      return dataWithScope.filter((item) => item.scopeInstitutions?.includes(selectedInstitution))
    }
    return dataWithScope
  }, [selectedInstitution])

  const columns: ColumnsType<TechCatalogRecord> = [
    {
      title: '技术名称',
      dataIndex: 'techName',
      key: 'techName',
      width: 260,
      fixed: 'left',
    },
    {
      title: '技术编码',
      dataIndex: 'techCode',
      key: 'techCode',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: '技术类别',
      dataIndex: 'level',
      key: 'level',
      width: 140,
    },
    {
      title: '技术类型',
      dataIndex: 'techType',
      key: 'techType',
      width: 100,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
    },
    {
      title: '技术定性',
      dataIndex: 'techNature',
      key: 'techNature',
      width: 140,
    },
    {
      title: '开展范围',
      dataIndex: 'scope',
      key: 'scope',
      width: 100,
    },
    {
      title: '外部标识',
      dataIndex: 'externalId',
      key: 'externalId',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLOR_MAP[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: '开展日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: TechCatalogRecord) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedRecord(record)
              setDrawerMode('edit')
              setDrawerOpen(true)
            }}
          >
            编辑
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除技术「${record.techName}」吗？`,
                okText: '确定',
                cancelText: '取消',
                onOk: () => {
                  message.success('删除成功')
                },
              })
            }}
          >
            删除
          </Button>
          <Dropdown
            menu={{
              items: [
                ...(record.status === '临时' || record.status === '未开展' || record.status === '申请中' || record.status === '试运行' || record.status === '常规'
                  ? [
                      {
                        key: 'pause',
                        label: '暂停',
                        icon: <span>⏸️</span>,
                        onClick: () => {
                          setSelectedRecord(record)
                          setMoreActionType('pause')
                          moreActionForm.resetFields()
                          setMoreActionDrawerOpen(true)
                        },
                      },
                      {
                        key: 'terminate',
                        label: '终止',
                        icon: <span>🛑</span>,
                        onClick: () => {
                          setSelectedRecord(record)
                          setMoreActionType('terminate')
                          moreActionForm.resetFields()
                          setMoreActionDrawerOpen(true)
                        },
                      },
                    ]
                  : []),
                ...(record.status === '被暂停' || record.status === '被终止'
                  ? [
                      {
                        key: 'restart',
                        label: '重启',
                        icon: <span>🔄</span>,
                        onClick: () => {
                          setSelectedRecord(record)
                          setMoreActionType('restart')
                          moreActionForm.resetFields()
                          setMoreActionDrawerOpen(true)
                        },
                      },
                    ]
                  : []),
              ],
            }}
          >
            <Button size="small" icon={<MoreOutlined />}>
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ]

  const handleSearch = () => {
    message.info('搜索功能待接入后端接口')
  }

  const handleAdd = () => {
    setSelectedRecord(null)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  const detailTabs = [
    { key: 'development', label: '技术发展', children: <TechDevelopment record={selectedRecord || undefined} /> },
    { key: 'apply-record', label: '项目申请', children: <ApplicationRecord /> },
    { key: 'team', label: '团队情况', children: <TeamInfo record={selectedRecord || undefined} /> },
    { key: 'related', label: '相关技术', children: <RelatedTech record={selectedRecord || undefined} allRecords={mockData} /> },
    { key: 'equipment', label: '设备设施', children: <EquipmentInfo record={selectedRecord || undefined} /> },
    { key: 'case', label: '开展病例', children: <CaseInfo record={selectedRecord || undefined} onEdit={() => { setAddDetailType('case'); setAddDetailDrawerOpen(true) }} onDelete={() => message.warning('确认删除？')} /> },
    { key: 'effect', label: '效果评价', children: <EffectEvaluation /> },
    { key: 'stage', label: '阶段评估', children: <StageEvaluation /> },
    { key: 'convert', label: '转常规申请', children: <ConvertApply /> },
    { key: 'dept', label: '开展科室', children: <DeptInfo record={selectedRecord || undefined} /> },
    { key: 'auth', label: '人员授权', children: <AuthInfo /> },
    { key: 'metrics', label: '运营指标', children: <OperationMetrics /> },
    { key: 'exception', label: '项目异常', children: <ProjectException record={selectedRecord || undefined} /> },
  ]

  return (
    <div style={{ padding: '15px' }}>
      {/* 搜索筛选区 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建技术
          </Button>
          <Space wrap>
            <Input
              placeholder="搜索技术名称/编码"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              value={selectedInstitution}
              onChange={setSelectedInstitution}
              options={INSTITUTION_OPTIONS}
              style={{ width: 180 }}
              placeholder="切换机构"
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={() => { setSearchText(''); setSelectedInstitution(undefined) }}>
              重置
            </Button>
          </Space>
        </div>
      </Card>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 2100 }}
          pagination={{
            total: filteredData.length,
            pageSize: 5,
            showTotal: (total) => `共 ${total} 条记录`,
            showSizeChanger: true,
            position: ['bottomLeft'],
            locale: { items_per_page: '条/页' },
          }}
          size="middle"
          onRow={(record) => ({
            onClick: () => {
              setSelectedRecord(record)
            },
            style: {
              cursor: 'pointer',
              backgroundColor: selectedRecord?.id === record.id ? '#e6f7ff' : undefined,
            },
          })}
        />

        {/* 详情面板容器 */}
        <Card 
          size="small" 
          style={{ marginTop: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          {selectedRecord ? (
            <Tabs 
              items={detailTabs} 
              defaultActiveKey="development"
              activeKey={activeTabKey}
              onChange={(key) => setActiveTabKey(key)}
              tabBarExtraContent={
                (activeTabKey === 'team' || activeTabKey === 'case' || activeTabKey === 'dept' || 
                 activeTabKey === 'effect' || activeTabKey === 'related' || activeTabKey === 'equipment') && (
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setAddDetailType(activeTabKey)
                      setAddDetailDrawerOpen(true)
                    }}
                  >
                    {activeTabKey === 'team' ? '团队情况' : 
                      activeTabKey === 'case' ? '开展病例' : 
                      activeTabKey === 'dept' ? '开展科室' : 
                      activeTabKey === 'effect' ? '效果评价' : 
                      activeTabKey === 'related' ? '相关技术' : '设备'}
                  </Button>
                )
              }
            />
          ) : (
            <Empty description="请选择一条技术记录查看详情" style={{ marginTop: 40 }} />
          )}
        </Card>

      {/* 详情抽屉 - 显示基本信息 */}
      <Drawer
        title={selectedRecord ? `${drawerMode === 'view' ? '查看' : '编辑'} - ${selectedRecord.techName}` : (drawerMode === 'edit' ? '新增技术' : '技术详情')}
        width={800}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        footer={
          drawerMode !== 'view' ? (
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setDrawerOpen(false)}>重置</Button>
                <Button type="primary" onClick={() => {
                  message.success('保存成功')
                  setDrawerOpen(false)
                }}>
                  提交
                </Button>
              </Space>
            </div>
          ) : undefined
        }
      >
        {(selectedRecord || drawerMode === 'edit') && (
          <div style={{ backgroundColor: drawerMode === 'edit' ? '#e6f7ff' : 'transparent', padding: 16, borderRadius: 4 }}>
            <Form layout="vertical" initialValues={{
            category: selectedRecord?.category,
            techName: selectedRecord?.techName,
            status: selectedRecord?.status,
            techType: '',
            techClass: '非限制类',
            riskLevel: '',
            techNature: '',
            scope: '不限制',
            startDate: selectedRecord?.startDate ? dayjs(selectedRecord.startDate) : undefined,
            endDate: selectedRecord?.approvalDate ? dayjs(selectedRecord.approvalDate) : undefined,
          }}>
            {/* 第一行：名称 */}
            <Form.Item label={<span>名称 <span style={{ color: 'red' }}>*</span></span>} name="techName" rules={[{ required: true }]}>
              <Input placeholder="请输入名称" disabled={drawerMode === 'view'} />
            </Form.Item>

            {/* 第二行：英文名称（占两个位置）、拼音简码、别名 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="英文名称" name="englishName">
                  <Input placeholder="请输入英文名称" disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="拼音简码" name="pinyinCode">
                  <Input placeholder="请输入拼音简码" disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="别名" name="alias">
                  <Input placeholder="请输入别名" disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
            </Row>

            {/* 第三行：技术类型、技术类别、风险等级、技术定性 */}
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label={<span>技术类型 <span style={{ color: 'red' }}>*</span></span>} name="techType" rules={[{ required: true }]}>
                  <Select placeholder="请选择技术类型" options={[
                    { label: '手术', value: '手术' },
                    { label: '操作', value: '操作' },
                    { label: '检查', value: '检查' },
                    { label: '检验', value: '检验' },
                    { label: '病理', value: '病理' },
                    { label: '项目', value: '项目' },
                    { label: '其他', value: '其他' },
                  ]} disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={<span>技术类别 <span style={{ color: 'red' }}>*</span></span>} name="techClass" rules={[{ required: true }]}>
                  <Select placeholder="非限制类" options={[
                    { label: '非限制类', value: '非限制类' },
                    { label: '限制类', value: '限制类' },
                    { label: '禁止类', value: '禁止类' },
                  ]} disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={<span>风险等级 <span style={{ color: 'red' }}>*</span></span>} name="riskLevel" rules={[{ required: true }]}>
                  <Select placeholder="请选择风险等级" options={[
                    { label: '低风险', value: '低风险' },
                    { label: '中风险', value: '中风险' },
                    { label: '高风险', value: '高风险' },
                  ]} disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={<span>技术定性 <span style={{ color: 'red' }}>*</span></span>} name="techNature" rules={[{ required: true }]}>
                  <Select placeholder="请选择技术定性" options={[
                    { label: '常规（开放）手术', value: '常规（开放）手术' },
                    { label: '介入手术', value: '介入手术' },
                  ]} disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
            </Row>

            {/* 第四行：分类、开展范围、外部标识、ICD编码 */}
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label={<span>分类 <span style={{ color: 'red' }}>*</span></span>} name="category" rules={[{ required: true }]}>
                  <Select placeholder="所有分类" options={[
                    { label: '外科技术', value: '外科技术' },
                    { label: '内科技术', value: '内科技术' },
                    { label: '骨科技术', value: '骨科技术' },
                    { label: '神经外科技术', value: '神经外科技术' },
                    { label: '放疗技术', value: '放疗技术' },
                    { label: '医技技术', value: '医技技术' },
                  ]} disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label={<span>开展范围 <span style={{ color: 'red' }}>*</span></span>} name="scope" rules={[{ required: true }]}>
                  <Select placeholder="不限制" options={[
                    { label: '不限制', value: '不限制' },
                    { label: '限定专业', value: '限定专业' },
                    { label: '限定科室', value: '限定科室' },
                  ]} disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="外部标识" name="externalId">
                  <Input placeholder="第三方系统绑定标识" disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) => prev.techType !== cur.techType}
                >
                  {({ getFieldValue }) => {
                    const isSurgery = getFieldValue('techType') === '手术'
                    return (
                      <Form.Item
                        label={
                          <span>
                            ICD编码{isSurgery && <span style={{ color: 'red' }}> *</span>}
                          </span>
                        }
                        name="icdCode"
                        rules={[{ required: isSurgery, message: '技术类型为手术时，ICD编码必填' }]}
                      >
                        <Input placeholder={isSurgery ? '手术类型必填' : '可选填写'} disabled={drawerMode === 'view'} />
                      </Form.Item>
                    )
                  }}
                </Form.Item>
              </Col>
            </Row>

            {/* 第五行：开展日期、结束日期、状态 */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="开展日期" name="startDate">
                  <DatePicker style={{ width: '100%' }} disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="结束日期" name="endDate">
                  <DatePicker style={{ width: '100%' }} disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span>状态 <span style={{ color: 'red' }}>*</span></span>} name="status" rules={[{ required: true }]}>
                  <Select placeholder="请选择状态" options={[
                    { label: '临时', value: '临时' },
                    { label: '未开展', value: '未开展' },
                    { label: '申请中', value: '申请中' },
                    { label: '试运行', value: '试运行' },
                    { label: '被暂停', value: '被暂停' },
                    { label: '被终止', value: '被终止' },
                    { label: '常规', value: '常规' },
                  ]} disabled={drawerMode === 'view'} />
                </Form.Item>
              </Col>
            </Row>

            {/* 第六行：使用范围 + 描述 */}
            <Form.Item label={<span>使用范围 <span style={{ color: 'red' }}>*</span></span>} name="scopeInstitutions" rules={[{ required: true, message: '请选择使用范围' }]}>
              <Select
                mode="multiple"
                placeholder="请选择机构"
                options={SCOPE_INSTITUTION_OPTIONS}
                disabled={drawerMode === 'view'}
              />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={4} placeholder="请输入描述" disabled={drawerMode === 'view'} />
            </Form.Item>
          </Form>
          </div>
        )}
      </Drawer>

      {/* 更多操作抽屉 */}
      <Drawer
        title={
          moreActionType === 'pause' ? '暂停技术' :
          moreActionType === 'terminate' ? '终止技术' :
          '重启技术'
        }
        width={500}
        open={moreActionDrawerOpen}
        onClose={() => setMoreActionDrawerOpen(false)}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setMoreActionDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={() => {
                moreActionForm.validateFields().then((_values) => {
                  message.success('操作成功')
                  setMoreActionDrawerOpen(false)
                })
              }}>
                确定
              </Button>
            </Space>
          </div>
        }
      >
        {selectedRecord && (
          <Form form={moreActionForm} layout="vertical">
            {moreActionType === 'restart' && (
              <Form.Item label={<span>重启后状态 <span style={{ color: 'red' }}>*</span></span>} name="restartStatus" rules={[{ required: true }]}>
                <Select placeholder="请选择重启后的状态" options={[
                  { label: '临时', value: '临时' },
                  { label: '试运行', value: '试运行' },
                  { label: '常规', value: '常规' },
                ]} />
              </Form.Item>
            )}
            <Form.Item 
              label={<span>{moreActionType === 'pause' ? '暂停原因' : moreActionType === 'terminate' ? '终止原因' : '重启原因'} <span style={{ color: 'red' }}>*</span></span>} 
              name="reason" 
              rules={[{ required: true, message: '请输入原因' }]}
            >
              <Input.TextArea rows={4} placeholder={`请输入${moreActionType === 'pause' ? '暂停' : moreActionType === 'terminate' ? '终止' : '重启'}原因`} />
            </Form.Item>
          </Form>
        )}
      </Drawer>

      {/* 新增详情抽屉 */}
      <Drawer
        title={
          addDetailType === 'team' ? '新增团队情况' :
          addDetailType === 'case' ? '新增开展病例' :
          addDetailType === 'dept' ? '新增开展科室' :
          addDetailType === 'effect' ? '新增效果评价' :
          addDetailType === 'related' ? '新增相关技术' :
          '新增设备'
        }
        width={800}
        open={addDetailDrawerOpen}
        onClose={() => setAddDetailDrawerOpen(false)}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              {addDetailType === 'case' ? (
                <>
                  <Button type="primary" icon={<CheckOutlined />} onClick={() => {
                    message.success('提交成功')
                    setAddDetailDrawerOpen(false)
                  }}>
                    提交
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={() => {
                    caseForm.resetFields()
                    message.info('表单已重置')
                  }}>
                    重置
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setAddDetailDrawerOpen(false)}>取消</Button>
                  <Button type="primary" onClick={() => {
                    message.success('新增成功')
                    setAddDetailDrawerOpen(false)
                  }}>
                    确定
                  </Button>
                </>
              )}
            </Space>
          </div>
        }
      >
        {addDetailType === 'team' && (
          <Form layout="vertical">
            <Form.Item label={<span>选择成员 <span style={{ color: 'red' }}>*</span></span>} name="member" rules={[{ required: true }]}>
              <Select placeholder="请选择成员" options={[
                { label: '张医生 - 肝胆外科', value: 'zhang' },
                { label: '李医生 - 心血管内科', value: 'li' },
                { label: '王医生 - 骨科', value: 'wang' },
                { label: '赵医生 - 神经外科', value: 'zhao' },
                { label: '陈医生 - 放疗科', value: 'chen' },
              ]} />
            </Form.Item>
            <Form.Item label={<span>角色 <span style={{ color: 'red' }}>*</span></span>} name="isLeader" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio value={false}>参与人</Radio>
                <Radio value={true}>负责人</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="专业性说明" name="expertise">
              <Input.TextArea rows={4} placeholder="请输入专业性说明" />
            </Form.Item>
          </Form>
        )}
        {addDetailType === 'dept' && (
          <Form layout="vertical">
            <Form.Item label={<span>科室 <span style={{ color: 'red' }}>*</span></span>} name="deptName" rules={[{ required: true, message: '请选择科室' }]}>
              <Select placeholder="请选择科室" showSearch optionFilterProp="label" options={[
                { label: '肝胆外科', value: '肝胆外科' },
                { label: '心血管内科', value: '心血管内科' },
                { label: '骨科', value: '骨科' },
                { label: '神经外科', value: '神经外科' },
                { label: '胸外科', value: '胸外科' },
                { label: '普外科', value: '普外科' },
                { label: '消化内科', value: '消化内科' },
                { label: '呼吸内科', value: '呼吸内科' },
                { label: 'ICU', value: 'ICU' },
                { label: '放疗科', value: '放疗科' },
                { label: '麻醉科', value: '麻醉科' },
                { label: '泌尿外科', value: '泌尿外科' },
                { label: '脊柱外科', value: '脊柱外科' },
                { label: '关节外科', value: '关节外科' },
                { label: '介入超声科', value: '介入超声科' },
                { label: '超声科', value: '超声科' },
                { label: '妇产科', value: '妇产科' },
                { label: '功能神经外科', value: '功能神经外科' },
                { label: '心血管外科', value: '心血管外科' },
                { label: '消化内镜中心', value: '消化内镜中心' },
                { label: '肾内科', value: '肾内科' },
                { label: '肿瘤科', value: '肿瘤科' },
                { label: '病理科', value: '病理科' },
                { label: '放射科', value: '放射科' },
                { label: '遗传科', value: '遗传科' },
              ]} />
            </Form.Item>
            <Form.Item label={<span>开展日期 <span style={{ color: 'red' }}>*</span></span>} name="startDate" rules={[{ required: true, message: '请选择开展日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择开展日期" />
            </Form.Item>
          </Form>
        )}
        {addDetailType === 'equipment' && (
          <Form layout="vertical">
            <Form.Item label={<span>类型 <span style={{ color: 'red' }}>*</span></span>} name="type" rules={[{ required: true, message: '请选择类型' }]}>
              <Radio.Group>
                <Radio value="设施">设施</Radio>
                <Radio value="设备">设备</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={<span>产品名称 <span style={{ color: 'red' }}>*</span></span>} name="productName" rules={[{ required: true, message: '请输入产品名称' }]}>
              <Input placeholder="请输入产品名称" />
            </Form.Item>
            <Form.Item label={<span>产品编号 <span style={{ color: 'red' }}>*</span></span>} name="productCode" rules={[{ required: true, message: '请输入产品编号' }]}>
              <Input placeholder="请输入产品编号" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<span>数量 <span style={{ color: 'red' }}>*</span></span>} name="quantity" rules={[{ required: true, message: '请输入数量' }]}>
                  <Input type="number" placeholder="数量" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span>单位 <span style={{ color: 'red' }}>*</span></span>} name="unit" rules={[{ required: true, message: '请输入单位' }]}>
                  <Input placeholder="单位" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="所属科室" name="dept">
              <Select placeholder="请选择所属科室" showSearch optionFilterProp="label" options={[
                { label: '肝胆外科', value: '肝胆外科' },
                { label: '心血管内科', value: '心血管内科' },
                { label: '骨科', value: '骨科' },
                { label: '神经外科', value: '神经外科' },
                { label: '胸外科', value: '胸外科' },
                { label: '普外科', value: '普外科' },
                { label: '消化内科', value: '消化内科' },
                { label: '呼吸内科', value: '呼吸内科' },
                { label: 'ICU', value: 'ICU' },
                { label: '放疗科', value: '放疗科' },
                { label: '麻醉科', value: '麻醉科' },
                { label: '泌尿外科', value: '泌尿外科' },
                { label: '脊柱外科', value: '脊柱外科' },
                { label: '关节外科', value: '关节外科' },
                { label: '介入超声科', value: '介入超声科' },
                { label: '超声科', value: '超声科' },
                { label: '妇产科', value: '妇产科' },
                { label: '功能神经外科', value: '功能神经外科' },
                { label: '心血管外科', value: '心血管外科' },
                { label: '消化内镜中心', value: '消化内镜中心' },
                { label: '肾内科', value: '肾内科' },
                { label: '肿瘤科', value: '肿瘤科' },
                { label: '病理科', value: '病理科' },
                { label: '放射科', value: '放射科' },
                { label: '遗传科', value: '遗传科' },
              ]} />
            </Form.Item>
            <Form.Item label="产地" name="origin">
              <Input placeholder="请输入产地" />
            </Form.Item>
            <Form.Item label="生产商" name="manufacturer">
              <Input placeholder="请输入生产商" />
            </Form.Item>
            <Form.Item label="运行状态" name="runStatus">
              <Select placeholder="请选择运行状态" options={[
                { label: '正常运行', value: '正常运行' },
                { label: '维修中', value: '维修中' },
                { label: '待检修', value: '待检修' },
                { label: '停用', value: '停用' },
                { label: '已报废', value: '已报废' },
              ]} />
            </Form.Item>
          </Form>
        )}
        {addDetailType === 'related' && (
          <Form layout="vertical">
            <Form.Item label="编码" name="code">
              <Input placeholder="自动填充或手动输入" />
            </Form.Item>
            <Form.Item label={<span>项目名称 <span style={{ color: 'red' }}>*</span></span>} name="projectName" rules={[{ required: true, message: '请选择项目名称' }]}>
              <Select
                placeholder="请选择项目名称（常规技术）"
                showSearch
                optionFilterProp="label"
                options={mockData.filter(r => r.status === '常规').map(r => ({ label: r.techName, value: r.techName }))}
              />
            </Form.Item>
            <Form.Item label="技术类型" name="techType">
              <Input placeholder="自动填充或手动输入" />
            </Form.Item>
            <Form.Item label="开展时间" name="startDate">
              <DatePicker style={{ width: '100%' }} placeholder="请选择开展时间" />
            </Form.Item>
            <Form.Item label="例数" name="caseCount">
              <Input type="number" placeholder="请输入例数" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="手术成功率(%)" name="successRate">
                  <Input type="number" placeholder="0-100" min={0} max={100} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="存活率(%)" name="survivalRate">
                  <Input type="number" placeholder="0-100" min={0} max={100} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
        {addDetailType === 'case' && (
          <Form layout="vertical" form={caseForm}>
            {/* 病人信息 */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16 }}>病人信息</Title>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}><Text>诊疗类别 <span style={{ color: 'red' }}>*</span></Text></Col>
                <Col span={8}>
                  <Form.Item name="visitType" initialValue="住院" rules={[{ required: true, message: '请选择诊疗类别' }]} noStyle>
                    <Select 
                      placeholder="请选择" 
                      onChange={(value) => {
                        // 切换诊疗类别时清空相关字段
                        setTimeout(() => {
                          caseForm.setFieldsValue({
                            patientNo: undefined,
                            patientName: undefined,
                            gender: undefined,
                            birthDate: undefined,
                            visitDate: undefined,
                            visitDept: undefined,
                            diagnosis: undefined
                          })
                        }, 0)
                      }} 
                      options={[
                        { label: '门诊', value: '门诊' },
                        { label: '住院', value: '住院' },
                      ]} 
                    />
                  </Form.Item>
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.visitType !== cur.visitType}>
                    {({ getFieldValue }) => {
                      const visitType = getFieldValue('visitType')
                      return visitType === '住院' ? <Text>住院号</Text> : visitType === '门诊' ? <Text>门诊号</Text> : null
                    }}
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    name="patientNo"
                    noStyle
                    shouldUpdate={(prev: Record<string, unknown>, cur: Record<string, unknown>) => prev.visitType !== cur.visitType}
                  >
                    {({ getFieldValue }) => {
                      const visitType = getFieldValue('visitType')
                      const isHospital = visitType === '住院'
                      const isOutpatient = visitType === '门诊'
                      
                      if (!isHospital && !isOutpatient) return null
                      
                      return (
                        <Input.Search 
                          placeholder={isHospital ? '输入住院号，回车检索病人' : '输入门诊号，回车检索病人'} 
                          enterButton 
                        />
                      )
                    }}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}><Text>患者姓名</Text></Col>
                <Col span={8}>
                  <Form.Item name="patientName" noStyle>
                    <Input disabled placeholder="-" />
                  </Form.Item>
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}><Text>性别</Text></Col>
                <Col span={8}>
                  <Form.Item name="gender" noStyle>
                    <Input disabled placeholder="-" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}><Text>出生日期</Text></Col>
                <Col span={8}>
                  <Form.Item name="birthDate" noStyle>
                    <Input disabled placeholder="-" />
                  </Form.Item>
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.visitType !== cur.visitType}>
                    {({ getFieldValue }) => {
                      const visitType = getFieldValue('visitType')
                      return visitType === '住院' ? <Text>入院日期</Text> : visitType === '门诊' ? <Text>就诊日期</Text> : null
                    }}
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    name="visitDate" 
                    noStyle
                    shouldUpdate={(prev: Record<string, unknown>, cur: Record<string, unknown>) => prev.visitType !== cur.visitType}
                  >
                    {({ getFieldValue }) => {
                      const visitType = getFieldValue('visitType')
                      return (
                        <Input disabled placeholder="-" />
                      )
                    }}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.visitType !== cur.visitType}>
                    {({ getFieldValue }) => {
                      const visitType = getFieldValue('visitType')
                      return visitType === '住院' ? <Text>入院科室</Text> : visitType === '门诊' ? <Text>就诊科室</Text> : null
                    }}
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    name="visitDept" 
                    noStyle
                    shouldUpdate={(prev: Record<string, unknown>, cur: Record<string, unknown>) => prev.visitType !== cur.visitType}
                  >
                    {({ getFieldValue }) => {
                      return (
                        <Input disabled placeholder="-" />
                      )
                    }}
                  </Form.Item>
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}><Text>知情同意书 <span style={{ color: 'red' }}>*</span></Text></Col>
                <Col span={8}>
                  <Form.Item name="consentForm" noStyle rules={[{ required: true, message: '请上传知情同意书' }]}>
                    <Upload beforeUpload={() => false} maxCount={1}>
                      <Button icon={<UploadOutlined />}>上传文件</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.visitType !== cur.visitType}>
                    {({ getFieldValue }) => {
                      const visitType = getFieldValue('visitType')
                      return visitType === '住院' ? <Text>入院诊断</Text> : visitType === '门诊' ? <Text>门诊诊断</Text> : null
                    }}
                  </Form.Item>
                </Col>
                <Col span={20}>
                  <Form.Item 
                    name="diagnosis" 
                    noStyle
                    shouldUpdate={(prev: Record<string, unknown>, cur: Record<string, unknown>) => prev.visitType !== cur.visitType}
                  >
                    {({ getFieldValue }) => {
                      return (
                        <Input disabled placeholder="-" />
                      )
                    }}
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 应用情况 */}
            <div>
              <Title level={5} style={{ marginBottom: 16 }}>应用情况</Title>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}><Text>应用日期 <span style={{ color: 'red' }}>*</span></Text></Col>
                <Col span={20}>
                  <Form.Item name="applyDate" rules={[{ required: true, message: '请选择应用日期' }]} noStyle>
                    <DatePicker style={{ width: '100%' }} placeholder="请选择应用日期" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}><Text>效果评价</Text></Col>
                <Col span={20}>
                  <Form.Item name="effectEval" noStyle>
                    <Input.TextArea rows={3} maxLength={300} showCount placeholder="请输入效果评价" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}><Text>并发症与合并症</Text></Col>
                <Col span={20}>
                  <Form.Item name="complication" noStyle>
                    <Input.TextArea rows={3} maxLength={300} showCount placeholder="请输入并发症与合并症" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}><Text>不良反应</Text></Col>
                <Col span={20}>
                  <Form.Item name="adverseReaction" noStyle>
                    <Input.TextArea rows={3} maxLength={300} showCount placeholder="请输入不良反应" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}><Text>经验总结</Text></Col>
                <Col span={20}>
                  <Form.Item name="experience" noStyle>
                    <Input.TextArea rows={3} maxLength={300} showCount placeholder="请输入经验总结" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                <Col span={4} style={{ textAlign: 'right' }}><Text>随访情况</Text></Col>
                <Col span={20}>
                  <Form.Item name="followUp" noStyle>
                    <Input.TextArea rows={3} maxLength={300} showCount placeholder="请输入随访情况" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form>
        )}
        {addDetailType !== 'team' && addDetailType !== 'dept' && addDetailType !== 'equipment' && addDetailType !== 'related' && addDetailType !== 'case' && (
          <Form layout="vertical">
            <Empty description={`请在${addDetailType === 'effect' ? '效果评价' : '相关技术'}标签页中填写详细信息`} />
          </Form>
        )}
      </Drawer>
    </div>
  )
}

export default TechCatalog
