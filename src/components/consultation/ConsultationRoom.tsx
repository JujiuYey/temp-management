import React, { useState, useMemo } from 'react'
import {
  Button,
  Input,
  Select,
  Tag,
  Drawer,
  Form,
  Space,
  Table,
  Typography,
  Tooltip,
  Empty,
  message,
  Popconfirm,
  Row,
  Col,
  InputNumber,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { meetingRooms as meetingRoomsMock, consultationData } from './mockData'
import { ROOM_TYPE_MAP, ROOM_STATUS_MAP, CONSULTATION_TYPE_MAP } from './types'
import type { MeetingRoom, RoomType, RoomStatus, ConsultationRecord } from './types'

const { Text } = Typography

// 自建 DrawerTabs：规避 antd 5.29.3 移除 forceRender 后 Tab 内容不渲染的问题
const DrawerTabs: React.FC<{ tabs: { key: string; label: string; children: React.ReactNode }[]; activeKey: string }> = ({ tabs, activeKey }) => {
  return (
    <>
      {tabs.map(t => (
        <div key={t.key} style={{ display: t.key === activeKey ? 'block' : 'none' }}>
          {t.children}
        </div>
      ))}
    </>
  )
}

const ConsultationRoom: React.FC = () => {
  // ---- 数据状态 ----
  const [rooms, setRooms] = useState<MeetingRoom[]>(meetingRoomsMock)

  // ---- 筛选 ----
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  // ---- 编辑 Drawer ----
  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null)
  const [editForm] = Form.useForm()

  // ---- 查看 Drawer（自建 DrawerTabs 拆双 Tab） ----
  const [viewOpen, setViewOpen] = useState(false)
  const [viewingRoom, setViewingRoom] = useState<MeetingRoom | null>(null)
  const [viewTab, setViewTab] = useState<'base' | 'usage'>('base')

  // ---- 派生：过滤后的会议室列表 ----
  const displayRooms = useMemo(() => {
    let list = rooms
    if (typeFilter) list = list.filter(r => r.type === typeFilter)
    if (statusFilter) list = list.filter(r => r.status === statusFilter)
    if (searchText) {
      const q = searchText.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      )
    }
    return list
  }, [rooms, searchText, typeFilter, statusFilter])

  // ---- 派生：当前查看会议室的使用记录（按 meetingRoom 匹配） ----
  const usageRecords = useMemo(() => {
    if (!viewingRoom) return [] as ConsultationRecord[]
    return consultationData
      .filter(c => c.meetingRoom === viewingRoom.name)
      .sort((a, b) => (b.scheduledTime || '').localeCompare(a.scheduledTime || ''))
  }, [viewingRoom])

  // ---- 编辑：新增 ----
  const openCreate = () => {
    setEditMode('create')
    setEditingRoom(null)
    editForm.resetFields()
    editForm.setFieldsValue({
      type: 'multimedia',
      status: 'enabled',
    })
    setEditOpen(true)
  }

  // ---- 编辑：编辑既有 ----
  const openEdit = (room: MeetingRoom) => {
    setEditMode('edit')
    setEditingRoom(room)
    editForm.setFieldsValue({
      name: room.name,
      location: room.location,
      type: room.type,
      status: room.status,
      capacity: room.capacity,
      equipment: room.equipment,
      remark: room.remark,
    })
    setEditOpen(true)
  }

  // ---- 编辑：提交 ----
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      if (editMode === 'create') {
        const maxNum = rooms.reduce((max, r) => {
          const m = /MR-(\d+)/.exec(r.id)
          return m ? Math.max(max, Number(m[1])) : max
        }, 0)
        const newRoom: MeetingRoom = {
          id: `MR-${String(maxNum + 1).padStart(3, '0')}`,
          name: values.name,
          location: values.location,
          type: values.type,
          status: values.status,
          capacity: values.capacity,
          equipment: values.equipment,
          remark: values.remark,
          createdAt: new Date().toISOString().slice(0, 10),
        }
        setRooms([newRoom, ...rooms])
        message.success('会议室已创建')
      } else if (editingRoom) {
        setRooms(rooms.map(r =>
          r.id === editingRoom.id
            ? {
                ...r,
                ...values,
              }
            : r
        ))
        message.success('会议室信息已更新')
      }
      setEditOpen(false)
    } catch {
      // 校验失败
    }
  }

  // ---- 删除 ----
  const handleDelete = (room: MeetingRoom) => {
    setRooms(rooms.filter(r => r.id !== room.id))
    message.success('会议室已删除')
  }

  // ---- 查看 ----
  const openView = (room: MeetingRoom) => {
    setViewingRoom(room)
    setViewTab('base')
    setViewOpen(true)
  }

  // ---- 表格列 ----
  const columns: ColumnsType<MeetingRoom> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left',
      render: (_: unknown, __: MeetingRoom, idx: number) => idx + 1,
    },
    {
      title: '会议室名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      fixed: 'left',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 160,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: RoomType) => <Tag color={ROOM_TYPE_MAP[v].color}>{ROOM_TYPE_MAP[v].label}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: RoomStatus) => <Tag color={ROOM_STATUS_MAP[v].color}>{ROOM_STATUS_MAP[v].label}</Tag>,
    },
    {
      title: '容纳人数',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      render: (v?: number) => v ?? <Text style={{ color: '#d9d9d9' }}>-</Text>,
    },
    {
      title: '设备',
      dataIndex: 'equipment',
      key: 'equipment',
      width: 220,
      render: (v?: string[]) => {
        if (!v || v.length === 0) return <Text style={{ color: '#d9d9d9' }}>-</Text>
        const text = v.join('、')
        return (
          <Tooltip title={text}>
            <span style={{ color: '#666' }}>{text.length > 22 ? `${text.slice(0, 22)}…` : text}</span>
          </Tooltip>
        )
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, r: MeetingRoom) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openView(r)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该会议室？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(r)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 0 }}>
      {/* 顶部：新增（左）+ 筛选（右） */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增会议室
        </Button>
        <Space wrap>
          <Input
            placeholder="会议室名称 / 位置"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Select
            placeholder="类型"
            value={typeFilter}
            onChange={setTypeFilter}
            allowClear
            style={{ width: 120 }}
            options={Object.entries(ROOM_TYPE_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <Select
            placeholder="状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 120 }}
            options={Object.entries(ROOM_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
          />
        </Space>
      </div>

      {/* 主表 */}
      <Table<MeetingRoom>
        rowKey="id"
        columns={columns}
        dataSource={displayRooms}
        scroll={{ x: 1300 }}
        pagination={{ showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        size="middle"
        bordered
      />

      {/* 编辑 Drawer（新增/编辑） */}
      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editMode === 'create' ? '新增会议室' : '编辑会议室'}
        width={520}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleEditSubmit}>保存</Button>
            </Space>
          </div>
        }
      >
        <Form form={editForm} layout="horizontal" labelCol={{ style: { width: 90 } }}>
          <Form.Item
            label="会议室名称"
            name="name"
            rules={[{ required: true, message: '请输入会议室名称' }]}
          >
            <Input placeholder="请输入会议室名称" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="位置"
            name="location"
            rules={[{ required: true, message: '请输入位置' }]}
          >
            <Input placeholder="如：门诊楼 3F 东区" maxLength={60} />
          </Form.Item>
          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select
              placeholder="请选择类型"
              options={Object.entries(ROOM_TYPE_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select
              placeholder="请选择状态"
              options={Object.entries(ROOM_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          </Form.Item>
          <Form.Item label="容纳人数" name="capacity">
            <InputNumber min={1} max={500} placeholder="选填" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="设备" name="equipment">
            <Select
              mode="tags"
              placeholder="按回车添加设备"
              maxTagCount={5}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} maxLength={200} showCount placeholder="选填" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 查看 Drawer（自建 DrawerTabs 拆双 Tab） */}
      <Drawer
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={viewingRoom ? `会议室：${viewingRoom.name}` : '查看会议室'}
        width={720}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setViewOpen(false)}>关闭</Button>
          </div>
        }
      >
        {viewingRoom && (
          <>
            <div
              style={{
                display: 'flex',
                gap: 8,
                borderBottom: '1px solid #f0f0f0',
                marginBottom: 16,
              }}
            >
              {[
                { key: 'base', label: '基本信息' },
                { key: 'usage', label: `使用记录（${usageRecords.length}）` },
              ].map(t => (
                <div
                  key={t.key}
                  onClick={() => setViewTab(t.key as 'base' | 'usage')}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    color: viewTab === t.key ? '#1677ff' : '#666',
                    borderBottom: viewTab === t.key ? '2px solid #1677ff' : '2px solid transparent',
                    fontWeight: viewTab === t.key ? 500 : 400,
                  }}
                >
                  {t.label}
                </div>
              ))}
            </div>

            <DrawerTabs
              activeKey={viewTab}
              tabs={[
                {
                  key: 'base',
                  label: '基本信息',
                  children: (
                    <Row gutter={[16, 12]}>
                      <Col span={12}>
                        <Text type="secondary">会议室名称：</Text>
                        <div style={{ marginTop: 4 }}><Text strong>{viewingRoom.name}</Text></div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">位置：</Text>
                        <div style={{ marginTop: 4 }}>{viewingRoom.location}</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">类型：</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={ROOM_TYPE_MAP[viewingRoom.type].color}>{ROOM_TYPE_MAP[viewingRoom.type].label}</Tag>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">状态：</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={ROOM_STATUS_MAP[viewingRoom.status].color}>{ROOM_STATUS_MAP[viewingRoom.status].label}</Tag>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">容纳人数：</Text>
                        <div style={{ marginTop: 4 }}>{viewingRoom.capacity ?? '-'}</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">创建时间：</Text>
                        <div style={{ marginTop: 4 }}>{viewingRoom.createdAt}</div>
                      </Col>
                      <Col span={24}>
                        <Text type="secondary">设备：</Text>
                        <div style={{ marginTop: 4 }}>
                          {viewingRoom.equipment && viewingRoom.equipment.length > 0 ? (
                            viewingRoom.equipment.map(e => (
                              <Tag key={e} color="blue" style={{ marginBottom: 4 }}>{e}</Tag>
                            ))
                          ) : (
                            <Text style={{ color: '#d9d9d9' }}>-</Text>
                          )}
                        </div>
                      </Col>
                      {viewingRoom.remark && (
                        <Col span={24}>
                          <Text type="secondary">备注：</Text>
                          <div style={{ marginTop: 4 }}>{viewingRoom.remark}</div>
                        </Col>
                      )}
                    </Row>
                  ),
                },
                {
                  key: 'usage',
                  label: '使用记录',
                  children: usageRecords.length === 0 ? (
                    <Empty description="暂无使用记录" />
                  ) : (
                    <Table<ConsultationRecord>
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={usageRecords}
                      columns={[
                        {
                          title: '序号',
                          key: 'idx',
                          width: 50,
                          render: (_: unknown, __: ConsultationRecord, idx: number) => idx + 1,
                        },
                        {
                          title: '会诊时间',
                          dataIndex: 'scheduledTime',
                          key: 'scheduledTime',
                          width: 150,
                          render: (v?: string) => v || '-',
                        },
                        {
                          title: '类型',
                          dataIndex: 'consultationType',
                          key: 'consultationType',
                          width: 100,
                          render: (v: ConsultationRecord['consultationType']) => (
                            <Tag color={CONSULTATION_TYPE_MAP[v].color}>{CONSULTATION_TYPE_MAP[v].label}</Tag>
                          ),
                        },
                        {
                          title: '患者',
                          dataIndex: 'patientName',
                          key: 'patientName',
                          width: 90,
                        },
                        {
                          title: '申请科室',
                          dataIndex: 'applyDept',
                          key: 'applyDept',
                          width: 130,
                        },
                        {
                          title: '会议号',
                          dataIndex: 'meetingNo',
                          key: 'meetingNo',
                          width: 110,
                          render: (v?: string) => v || <Text style={{ color: '#d9d9d9' }}>-</Text>,
                        },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          key: 'status',
                          width: 90,
                          render: (v: ConsultationRecord['status']) => {
                            const map: Record<ConsultationRecord['status'], { label: string; color: string }> = {
                              draft: { label: '草稿', color: '#8c8c8c' },
                              pending_approval: { label: '待审批', color: '#faad14' },
                              approved: { label: '已审批', color: '#1677ff' },
                              rejected: { label: '已退回', color: '#ff4d4f' },
                              scheduled: { label: '已安排', color: '#13c2c2' },
                              in_progress: { label: '进行中', color: '#722ed1' },
                              completed: { label: '已完成', color: '#52c41a' },
                              archived: { label: '已归档', color: '#8c8c8c' },
                              cancelled: { label: '已取消', color: '#bfbfbf' },
                            }
                            const meta = map[v] || { label: v, color: '#8c8c8c' }
                            return <Tag color={meta.color}>{meta.label}</Tag>
                          },
                        },
                      ]}
                      scroll={{ x: 800 }}
                    />
                  ),
                },
              ]}
            />
          </>
        )}
      </Drawer>
    </div>
  )
}

export default ConsultationRoom
