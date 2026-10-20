import React, { useState, useMemo, useCallback } from 'react'
import {
  Button,
  Input,
  Select,
  Tag,
  Drawer,
  Form,
  Radio,
  Space,
  Table,
  Typography,
  Tooltip,
  Empty,
  message,
  Popconfirm,
  TimePicker,
  DatePicker,
  Row,
  Col,
} from 'antd'
import dayjs from 'dayjs'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  expertTeamGroups,
  expertTeamMembers,
  expertStaffPool,
  diseaseCodes,
  DEPARTMENTS,
} from './mockData'
import {
  EXPERT_ROLE_MAP,
  SPECIALTY_TAG_PRESETS,
  TEAM_LEVEL_MAP,
  MEMBER_STATUS_MAP,
} from './types'
import type {
  ExpertTeamGroup,
  ExpertTeamMember,
  ExpertRole,
  ExpertStaff,
} from './types'

const { Text } = Typography

// 标签颜色池 — 根据字符串 hash 取色
const TAG_COLORS = [
  'magenta', 'red', 'volcano', 'orange', 'gold',
  'lime', 'green', 'cyan', 'blue', 'geekblue',
  'purple', 'sound',
]
function tagColor(tag: string): string {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) | 0
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length]
}

// 指定会诊时间 - 每周几
const WEEKDAY_OPTIONS = [
  { label: '每周一', value: '每周一' },
  { label: '每周二', value: '每周二' },
  { label: '每周三', value: '每周三' },
  { label: '每周四', value: '每周四' },
  { label: '每周五', value: '每周五' },
  { label: '每周六', value: '每周六' },
  { label: '每周日', value: '每周日' },
]

// 指定会诊地点下拉选项
const CONSULT_LOCATION_OPTIONS = [
  '门诊楼3楼 MDT会诊室',
  '门诊楼5楼 多学科会诊中心',
  '住院部2楼 会诊室',
  '医技楼4楼 远程会诊中心',
  '行政楼1楼 学术报告厅',
  '科研楼2楼 病例讨论室',
].map((v) => ({ label: v, value: v }))

// 将 "HH:mm" 字符串转换为 dayjs（供 TimePicker 回显，避免依赖 customParseFormat 插件）
const toTimeDayjs = (s?: string) => {
  if (!s) return undefined
  const [h, m] = s.split(':')
  if (h === undefined || m === undefined) return undefined
  return dayjs().hour(Number(h)).minute(Number(m)).second(0)
}

// 统一将表单中的会诊时间转为 "HH:mm" 字符串（兼容 dayjs 对象与字符串两种形态）
const normalizeTime = (v: unknown): string | undefined => {
  if (!v) return undefined
  if (typeof v === 'string') return v
  if (dayjs.isDayjs(v)) return v.format('HH:mm')
  return undefined
}

const ExpertTeam: React.FC = () => {
  // ---- 数据状态 ----
  const [teams, setTeams] = useState<ExpertTeamGroup[]>(expertTeamGroups)
  const [members, setMembers] = useState<ExpertTeamMember[]>(expertTeamMembers)
  // '' = 未选择团队，右侧显示全部成员
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')

  // ---- 搜索（姓名/工号，两种视图通用） ----
  const [searchText, setSearchText] = useState('')

  // ---- 团队 Drawer ----
  const [teamDrawerOpen, setTeamDrawerOpen] = useState(false)
  const [teamEditMode, setTeamEditMode] = useState<'create' | 'edit'>('create')
  const [editingTeam, setEditingTeam] = useState<ExpertTeamGroup | null>(null)
  const [teamForm] = Form.useForm()

  // ---- 成员 Drawer ----
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false)
  const [memberEditMode, setMemberEditMode] = useState<'create' | 'edit'>('create')
  const [editingMember, setEditingMember] = useState<ExpertTeamMember | null>(null)
  const [memberForm] = Form.useForm()
  // 选中专家后自动填充的信息
  const [autoFilled, setAutoFilled] = useState<ExpertStaff | null>(null)

  // ---- 派生数据 ----
  const currentTeam = useMemo(
    () => teams.find(t => t.id === selectedTeamId) || null,
    [teams, selectedTeamId],
  )

  // 展示的成员列表：选中团队 → 该团队成员；未选中 → 全部（跨团队，同一专家在多团队显示多条）
  const displayMembers = useMemo(() => {
    const base = currentTeam ? members.filter(m => m.teamId === currentTeam.id) : members
    if (!searchText) return base
    const q = searchText.toLowerCase()
    return base.filter(m => {
      const staff = expertStaffPool.find(s => s.id === m.expertId)
      return m.name.toLowerCase().includes(q) || (staff?.workNo || '').toLowerCase().includes(q)
    })
  }, [members, currentTeam, searchText])

  // ---- 团队名称查找 ----
  const getTeamName = useCallback(
    (tid: string) => teams.find(t => t.id === tid)?.teamName || '—',
    [teams],
  )

  // ---- 团队 Drawer 操作 ----
  const openTeamCreate = () => {
    setTeamEditMode('create')
    setEditingTeam(null)
    teamForm.resetFields()
    teamForm.setFieldsValue({ status: 'active' })
    setTeamDrawerOpen(true)
  }

  const openTeamEdit = (team: ExpertTeamGroup) => {
    setTeamEditMode('edit')
    setEditingTeam(team)
    teamForm.setFieldsValue({
      teamName: team.teamName,
      teamLevel: team.teamLevel,
      leadDept: team.leadDept,
      establishDate: team.establishDate ? dayjs(team.establishDate) : undefined,
      consultLocation: team.consultLocation,
      consultWeekday: team.consultWeekday,
      consultTime: toTimeDayjs(team.consultTime),
      specialtyArea: team.specialtyArea,
      diseaseCodes: team.diseaseCodes,
      leader: team.leader,
      status: team.status,
    })
    setTeamDrawerOpen(true)
  }

  const handleTeamSubmit = async () => {
    try {
      const values = await teamForm.validateFields()
      if (teamEditMode === 'create') {
        const newTeam: ExpertTeamGroup = {
          id: `ET-${String(teams.length + 1).padStart(3, '0')}`,
          teamName: values.teamName,
          teamLevel: values.teamLevel || 'L3',
          leadDept: values.leadDept || '',
          establishDate: values.establishDate ? (dayjs.isDayjs(values.establishDate) ? values.establishDate.format('YYYY-MM-DD') : String(values.establishDate)) : '',
          specialtyArea: values.specialtyArea || '',
          diseaseCodes: values.diseaseCodes || [],
          leader: values.leader,
          consultLocation: values.consultLocation || '',
          consultWeekday: values.consultWeekday,
          consultTime: normalizeTime(values.consultTime),
          status: values.status,
          createdAt: new Date().toISOString().slice(0, 10),
        }
        setTeams([...teams, newTeam])
        message.success('团队已创建')
      } else if (editingTeam) {
        setTeams(teams.map(t => t.id === editingTeam.id ? {
          ...t,
          ...values,
          consultTime: normalizeTime(values.consultTime),
        } : t))
        message.success('团队信息已更新')
      }
      setTeamDrawerOpen(false)
    } catch {
      // validation error
    }
  }

  const handleDeleteTeam = (team: ExpertTeamGroup) => {
    setTeams(teams.filter(t => t.id !== team.id))
    setMembers(members.filter(m => m.teamId !== team.id))
    if (selectedTeamId === team.id) setSelectedTeamId('')
    message.success('团队已删除')
  }

  // ---- 成员 Drawer 操作 ----
  const openMemberCreate = () => {
    if (!currentTeam) return
    setMemberEditMode('create')
    setEditingMember(null)
    setAutoFilled(null)
    memberForm.resetFields()
    memberForm.setFieldsValue({ role: 'regular', memberStatus: 'normal' })
    setMemberDrawerOpen(true)
  }

  const openMemberEdit = (member: ExpertTeamMember) => {
    setMemberEditMode('edit')
    setEditingMember(member)
    const staff = expertStaffPool.find(s => s.id === member.expertId) || null
    setAutoFilled(staff)
    memberForm.setFieldsValue({
      expertId: member.expertId,
      role: member.role,
      specialtyTags: member.specialtyTags,
      academicBackground: member.academicBackground || '',
      memberStatus: member.memberStatus || 'normal',
    })
    setMemberDrawerOpen(true)
  }

  const handleExpertSelect = (staffId: string) => {
    const staff = expertStaffPool.find(s => s.id === staffId) || null
    setAutoFilled(staff)
  }

  const handleMemberSubmit = async () => {
    try {
      const values = await memberForm.validateFields()
      if (memberEditMode === 'create' && currentTeam) {
        // 检查同一团队是否已有该专家
        const exists = members.some(m => m.teamId === currentTeam.id && m.expertId === values.expertId)
        if (exists) {
          message.warning('该专家已在当前团队中')
          return
        }
        const staff = expertStaffPool.find(s => s.id === values.expertId)
        if (!staff) return
        const newMember: ExpertTeamMember = {
          id: `ETM-${String(members.length + 1).padStart(3, '0')}`,
          teamId: currentTeam.id,
          expertId: staff.id,
          name: staff.name,
          dept: staff.dept,
          title: staff.title,
          phone: staff.phone,
          role: values.role,
          specialtyTags: values.specialtyTags || [],
          academicBackground: values.academicBackground || '',
          memberStatus: values.memberStatus || 'normal',
        }
        setMembers([...members, newMember])
        message.success('成员已添加')
      } else if (editingMember) {
        setMembers(members.map(m => m.id === editingMember.id ? {
          ...m,
          role: values.role,
          specialtyTags: values.specialtyTags || [],
          academicBackground: values.academicBackground || '',
          memberStatus: values.memberStatus || 'normal',
        } : m))
        message.success('成员信息已更新')
      }
      setMemberDrawerOpen(false)
    } catch {
      // validation error
    }
  }

  const handleRemoveMember = (member: ExpertTeamMember) => {
    setMembers(members.filter(m => m.id !== member.id))
    message.success('已移除成员')
  }

  // ---- 全部团队视图的表格列 ----
  const allColumns: ColumnsType<ExpertTeamMember & { index: number }> = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (v: number) => <Text style={{ color: '#8c8c8c' }}>{v}</Text>,
    },
    {
      title: '团队名称',
      key: 'teamName',
      width: 180,
      render: (_, r) => <Text strong>{getTeamName(r.teamId)}</Text>,
    },
    {
      title: '专家名称',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '科室',
      dataIndex: 'dept',
      key: 'dept',
      width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (v: ExpertRole) => (
        <Tag color={EXPERT_ROLE_MAP[v].color} style={{ color: '#fff', border: 'none' }}>
          {EXPERT_ROLE_MAP[v].label}
        </Tag>
      ),
    },
    {
      title: '专业方向',
      dataIndex: 'specialtyTags',
      key: 'specialtyTags',
      render: (v: string[]) => (
        <Space size={[0, 4]} wrap>
          {v.map(t => <Tag key={t} color={tagColor(t)}>{t}</Tag>)}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'memberStatus',
      key: 'memberStatus',
      width: 80,
      render: (v: 'normal' | 'out' | undefined) => {
        const s = MEMBER_STATUS_MAP[v || 'normal']
        return <Tag color={s.color} style={{ color: '#fff', border: 'none' }}>{s.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: unknown, r: ExpertTeamMember) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openMemberEdit(r)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveMember(r)}>
            移除
          </Button>
        </Space>
      ),
    },
  ]

  // ---- 单个团队成员视图的表格列 ----
  const teamColumns: ColumnsType<ExpertTeamMember> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '科室',
      dataIndex: 'dept',
      key: 'dept',
      width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
      width: 100,
    },
    {
      title: '联系方式',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (v: ExpertRole) => (
        <Tag color={EXPERT_ROLE_MAP[v].color} style={{ color: '#fff', border: 'none' }}>
          {EXPERT_ROLE_MAP[v].label}
        </Tag>
      ),
    },
    {
      title: '专业方向',
      dataIndex: 'specialtyTags',
      key: 'specialtyTags',
      render: (v: string[]) => (
        <Space size={[0, 4]} wrap>
          {v.map(t => <Tag key={t} color={tagColor(t)}>{t}</Tag>)}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'memberStatus',
      key: 'memberStatus',
      width: 80,
      render: (v: 'normal' | 'out' | undefined) => {
        const s = MEMBER_STATUS_MAP[v || 'normal']
        return <Tag color={s.color} style={{ color: '#fff', border: 'none' }}>{s.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: unknown, r: ExpertTeamMember) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openMemberEdit(r)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveMember(r)}>
            移除
          </Button>
        </Space>
      ),
    },
  ]

  // ==================== 渲染 ====================
  return (
    <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 130px)' }}>
      {/* 团队卡片 hover 显示操作图标 */}
      <style>{`
        .team-card { padding: 10px 14px; cursor: pointer; border-left: 3px solid transparent; transition: background 0.2s; }
        .team-card:hover { background: #f5f8ff; }
        .team-card-active { background: #e6f4ff; border-left-color: #1677ff; }
        .team-card-active:hover { background: #e6f4ff; }
        .team-card-actions { opacity: 0; transition: opacity 0.2s; display: inline-flex; }
        .team-card:hover .team-card-actions { opacity: 1; }
      `}</style>

      {/* ========== 左侧团队列表 ========== */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 14 }}>
            <span style={{ display: 'inline-block', width: 3, height: 14, background: '#1677ff', borderRadius: 2, marginRight: 8, verticalAlign: '-2px' }} />
            专家团队
          </Text>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openTeamCreate}>
            团队
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {teams.map(team => {
            const isActive = selectedTeamId === team.id
            return (
              <div
                key={team.id}
                className={`team-card${isActive ? ' team-card-active' : ''}`}
                onClick={() => setSelectedTeamId(team.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tooltip title={team.teamName} placement="right">
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: TEAM_LEVEL_MAP[team.teamLevel].color,
                          display: 'inline-block',
                          flexShrink: 0,
                          marginRight: 8,
                        }}
                      />
                      <Text strong style={{ color: team.status === 'inactive' ? '#8c8c8c' : undefined, whiteSpace: 'nowrap' }}>
                        {team.teamName.length > 10 ? `${team.teamName.slice(0, 10)}…` : team.teamName}
                      </Text>
                    </span>
                  </Tooltip>
                  <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <span className="team-card-actions">
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openTeamEdit(team)} />
                      <Popconfirm
                        title="确定删除该团队及其成员？"
                        onConfirm={() => handleDeleteTeam(team)}
                        okText="删除"
                        cancelText="取消"
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </span>
                  </span>
                </div>
              </div>
            )
          })}
          {teams.length === 0 && (
            <div style={{ padding: 24 }}>
              <Empty description="暂无团队" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </div>
      </div>

      {/* ========== 右侧内容区 ========== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tooltip title={currentTeam ? undefined : '请先在左侧选择团队'}>
              <Button type="primary" icon={<PlusOutlined />} disabled={!currentTeam} onClick={openMemberCreate}>
                成员
              </Button>
            </Tooltip>
            <Input
              placeholder="搜索姓名 / 工号"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Table
            dataSource={currentTeam ? displayMembers : displayMembers.map((m, i) => ({ ...m, index: i + 1 }))}
            columns={(currentTeam ? teamColumns : allColumns) as ColumnsType<ExpertTeamMember>}
            rowKey="id"
            size="small"
            scroll={{ x: 'max-content', y: currentTeam ? 'calc(100vh - 310px)' : 'calc(100vh - 280px)' }}
            pagination={{ pageSize: 20, showTotal: t => `共 ${t} 条` }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    currentTeam
                      ? (searchText ? '未找到匹配的成员' : '暂无成员，点击「添加成员」添加')
                      : (searchText ? '未找到匹配的专家' : '暂无数据')
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </div>
      </div>

      {/* ========== 团队 Drawer ========== */}
      <Drawer
        title={teamEditMode === 'create' ? '新增团队' : '编辑团队'}
        open={teamDrawerOpen}
        onClose={() => setTeamDrawerOpen(false)}
        width={960}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setTeamDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleTeamSubmit}>保存</Button>
          </div>
        }
      >
        <Form form={teamForm} layout="vertical" size="small">
          <Row gutter={[16, 4]}>
            <Col span={16}>
              <Form.Item label="团队名称" name="teamName" rules={[{ required: true, message: '请输入团队名称' }]}>
                <Input placeholder="如：胸部肿瘤诊疗专家组" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="团队级别" name="teamLevel">
                <Select
                  placeholder="选择团队级别"
                  options={Object.entries(TEAM_LEVEL_MAP).map(([k, v]) => ({
                    value: k as ExpertTeamGroup['teamLevel'],
                    label: v.label,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 4]}>
            <Col span={8}>
              <Form.Item label="牵头科室" name="leadDept" rules={[{ required: true, message: '请选择牵头科室' }]}>
                <Select showSearch placeholder="选择牵头科室" options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="牵头人" name="leader" rules={[{ required: true, message: '请选择牵头人' }]}>
                <Select
                  showSearch
                  placeholder="选择牵头人"
                  filterOption={(input, option) => {
                    const label = (option?.label as string) || ''
                    return label.toLowerCase().includes(input.toLowerCase())
                  }}
                  options={expertStaffPool.map(s => ({ value: s.id, label: `${s.name}（${s.dept}）` }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="成立日期" name="establishDate">
                <DatePicker style={{ width: '100%' }} placeholder="请选择成立日期" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 4]}>
            <Col span={8}>
              <Form.Item label="指定会诊地点" name="consultLocation">
                <Select
                  showSearch
                  allowClear
                  placeholder="请选择会诊地点"
                  options={CONSULT_LOCATION_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="指定会诊时间">
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item name="consultWeekday" noStyle rules={[{ required: true, message: '请选择每周几' }]}>
                      <Select placeholder="每周几" options={WEEKDAY_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="consultTime"
                      noStyle
                      rules={[{ required: true, message: '请选择时间' }]}
                      getValueFromEvent={(v) => (v ? v.format('HH:mm') : undefined)}
                    >
                      <TimePicker
                        format="HH:mm"
                        style={{ width: '100%' }}
                        placeholder="几点几分"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="状态" name="status">
                <Radio.Group>
                  <Radio value="active">启用</Radio>
                  <Radio value="inactive">停用</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 4]}>
            <Col span={24}>
              <Form.Item
                label="专攻病种"
                name="diseaseCodes"
              >
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="搜索疾病代码或名称"
                  filterOption={(input, option) => {
                    const label = (option?.label as string) || ''
                    return label.toLowerCase().includes(input.toLowerCase())
                  }}
                  optionLabelProp="label"
                  options={diseaseCodes.map(d => ({
                    value: d.code,
                    label: `${d.code} ${d.name}`,
                  }))}
                  optionRender={(option) => {
                    const dc = diseaseCodes.find(d => d.code === option.value)
                    return (
                      <div>
                        <Text strong style={{ fontSize: 12 }}>{dc?.code}</Text>
                        <Text style={{ marginLeft: 8 }}>{dc?.name}</Text>
                        <Tag style={{ marginLeft: 8, fontSize: 11 }}>{dc?.category}</Tag>
                      </div>
                    )
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 4]}>
            <Col span={24}>
              <Form.Item label="团队介绍" name="specialtyArea">
                <Input.TextArea rows={3} placeholder="介绍这个团队的情况或优势等等" maxLength={100} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* ========== 成员 Drawer ========== */}
      <Drawer
        title={memberEditMode === 'create' ? '添加成员' : '编辑成员'}
        open={memberDrawerOpen}
        onClose={() => setMemberDrawerOpen(false)}
        width={560}
        forceRender
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setMemberDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleMemberSubmit}>保存</Button>
          </div>
        }
      >
        <Form form={memberForm} layout="horizontal" labelAlign="left" labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item
            label="专家姓名"
            name="expertId"
            rules={[{ required: true, message: '请选择专家' }]}
          >
            <Select
              showSearch
              placeholder="搜索姓名 / 工号"
              filterOption={false}
              onSearch={() => {}}
              onChange={handleExpertSelect}
              disabled={memberEditMode === 'edit'}
              options={expertStaffPool.map(s => ({
                value: s.id,
                label: `${s.name}（${s.workNo}）${s.dept} · ${s.title}`,
              }))}
            />
          </Form.Item>

          <Form.Item label="所属科室">
            <Input disabled value={autoFilled?.dept} placeholder="选择专家后自动获取" />
          </Form.Item>

          <Form.Item label="专家职称">
            <Input disabled value={autoFilled?.title} placeholder="选择专家后自动获取" />
          </Form.Item>

          <Form.Item label="联系方式">
            <Input disabled value={autoFilled?.phone} placeholder="选择专家后自动获取" />
          </Form.Item>

          <Form.Item label="状态" name="memberStatus" rules={[{ required: true, message: '请选择状态' }]}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={Object.entries(MEMBER_STATUS_MAP).map(([k, v]) => ({
                value: k as 'normal' | 'out',
                label: v.label,
              }))}
            />
          </Form.Item>

          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              placeholder="选择角色"
              options={Object.entries(EXPERT_ROLE_MAP).map(([k, v]) => ({
                value: k as ExpertRole,
                label: v.label,
              }))}
            />
          </Form.Item>

          <Form.Item label="专业方向" name="specialtyTags">
            <Select
              mode="multiple"
              placeholder="选择专业方向"
              options={SPECIALTY_TAG_PRESETS.map(t => ({ value: t, label: t }))}
            />
          </Form.Item>

          <Form.Item label="学科背景" name="academicBackground">
            <Input.TextArea
              rows={4}
              placeholder="描述专家学科背景、研究方向、临床特长等"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default ExpertTeam
