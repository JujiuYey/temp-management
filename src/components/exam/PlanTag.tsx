import React, { useEffect, useMemo, useState } from 'react'
import { Button, Drawer, Form, Input, Popconfirm, Select, Space, Table, Tag, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { loadPlanTags, savePlanTags, type PlanTagItem } from './planTagStore'

/**
 * 计划标记管理页（考试系统 / 基础设置 / 计划标记）
 * 支持新增、编辑、删除标记内容；含状态（启用/停用）与名称筛选；数据持久化到 localStorage，供编辑考试抽屉复用。
 */
const PlanTag: React.FC = () => {
  const [data, setData] = useState<PlanTagItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<PlanTagItem | null>(null)
  const [nameKeyword, setNameKeyword] = useState('')
  const [form] = Form.useForm<{ name: string; status: '启用' | '停用' }>()

  useEffect(() => {
    setData(loadPlanTags())
  }, [])

  const persist = (items: PlanTagItem[]) => {
    setData(items)
    savePlanTags(items)
  }

  // 按名称筛选
  const filtered = useMemo(() => {
    const kw = nameKeyword.trim()
    if (!kw) return data
    return data.filter((d) => d.name.includes(kw))
  }, [data, nameKeyword])

  const openAdd = () => {
    setEditing(null)
    form.setFieldsValue({ name: '', status: '启用' })
    setDrawerOpen(true)
  }

  const openEdit = (record: PlanTagItem) => {
    setEditing(record)
    form.setFieldsValue({ name: record.name, status: record.status })
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    const { name, status } = await form.validateFields()
    const trimmed = name.trim()
    const exists = data.some((d) => d.name === trimmed && d.id !== editing?.id)
    if (exists) {
      message.warning('已存在相同名称的标记')
      return
    }
    if (editing) {
      persist(data.map((d) => (d.id === editing.id ? { ...d, name: trimmed, status } : d)))
      message.success('标记已更新')
    } else {
      const id = `pt-${Date.now()}`
      persist([...data, { id, name: trimmed, status }])
      message.success('标记已添加')
    }
    setDrawerOpen(false)
  }

  const handleDelete = (record: PlanTagItem) => {
    persist(data.filter((d) => d.id !== record.id))
    message.success('标记已删除')
  }

  const columns: ColumnsType<PlanTagItem> = [
    {
      title: '序号',
      width: 80,
      align: 'center',
      render: (_: unknown, __: PlanTagItem, i: number) => i + 1,
    },
    {
      title: '标记内容',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span style={{ color: 'rgba(0,0,0,0.85)' }}>{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (v: PlanTagItem['status']) =>
        v === '启用' ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: PlanTagItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该标记？"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 0 }}>
      {/* 顶部：左侧新增、右侧名称筛选 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          新增标记
        </Button>
        <Input.Search
          allowClear
          placeholder="标记名称"
          style={{ width: 220 }}
          value={nameKeyword}
          onChange={(e) => setNameKeyword(e.target.value)}
          onSearch={(v) => setNameKeyword(v)}
        />
      </div>
      <Table<PlanTagItem>
        rowKey="id"
        size="middle"
        pagination={false}
        dataSource={filtered}
        columns={columns}
      />

      <Drawer
        title={editing ? '编辑标记' : '新增标记'}
        placement="right"
        width={420}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" onClick={handleSubmit}>
            {editing ? '保存' : '确定'}
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标记内容"
            rules={[{ required: true, message: '请输入标记内容' }]}
          >
            <Input placeholder="如：三基三严" maxLength={30} showCount />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { value: '启用', label: '启用' },
                { value: '停用', label: '停用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default PlanTag
