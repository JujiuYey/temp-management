import React, { useMemo, useState } from 'react'
import { Button, Card, Drawer, Empty, Form, Input, InputNumber, Popconfirm, Select, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'

// ===== 评分项目数据模型 =====
// 一个评分项目仅包含：一个项目分类 + 一条评分细则 + 一条要点
interface ScoreItemRecord {
  id: string
  category: string // 项目分类
  standard: string // 评分细则
  points: string   // 要点
  score: number    // 得分
}

// 项目分类预设选项
const CATEGORY_OPTIONS = ['用物准备', '操作流程', '无菌操作', '沟通人文', '应急处置', '综合评价']

// 演示数据
const SEED_ITEMS: ScoreItemRecord[] = [
  { id: 'si1', category: '用物准备', standard: '按操作要求备齐器械、敷料与药品，摆放规范有序', points: '备物齐全得 3 分；缺一项扣 1 分，扣完为止', score: 3 },
  { id: 'si2', category: '用物准备', standard: '检查用物包装完整性、有效期与灭菌标识', points: '逐项检查完整得 2 分；漏检一项扣 1 分', score: 2 },
  { id: 'si3', category: '操作流程', standard: '核对患者身份与操作部位，向患者说明操作目的', points: '核对完整并说明得 4 分；未核对身份扣 4 分', score: 4 },
  { id: 'si4', category: '操作流程', standard: '操作步骤连贯、手法规范，顺序符合规范要求', points: '步骤正确得 8 分；顺序颠倒每处扣 2 分', score: 8 },
  { id: 'si5', category: '无菌操作', standard: '全程保持无菌操作，无跨越无菌区动作', points: '无污染得 5 分；一次污染扣 5 分', score: 5 },
  { id: 'si6', category: '沟通人文', standard: '尊重患者隐私，注意保暖与遮挡', points: '隐私保护到位得 2 分；暴露隐私部位扣 2 分', score: 2 },
]

// ===== 评分项目页面 =====
const ScoreItem: React.FC = () => {
  const [items, setItems] = useState<ScoreItemRecord[]>(SEED_ITEMS)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [keyword, setKeyword] = useState('')

  // 抽屉：编辑 / 新增
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<ScoreItemRecord | null>(null)
  const [form] = Form.useForm()

  // 过滤
  const filtered = useMemo(
    () =>
      items.filter((it) => {
        if (categoryFilter !== 'all' && it.category !== categoryFilter) return false
        const kw = keyword.trim()
        if (kw && !(it.category + it.standard + it.points).includes(kw)) return false
        return true
      }),
    [items, categoryFilter, keyword],
  )

  const openAdd = () => {
    setEditing(null)
    form.resetFields()
    setDrawerOpen(true)
  }

  const openEdit = (record: ScoreItemRecord) => {
    setEditing(record)
    form.setFieldsValue({ category: record.category, standard: record.standard, points: record.points, score: record.score })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditing(null)
    form.resetFields()
  }

  // 保存（新增 / 更新）核心逻辑；返回本次保存的 payload
  const persist = (values: { category: string; standard: string; points: string; score: number }) => {
    const payload = {
      category: values.category as string,
      standard: (values.standard as string).trim(),
      points: (values.points as string).trim(),
      score: Number(values.score),
    }
    if (editing) {
      setItems((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...payload } : x)))
      message.success('评分项目已更新')
    } else {
      setItems((prev) => [
        { id: `si-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...payload },
        ...prev,
      ])
      message.success('评分项目已新增')
    }
  }

  // 保存并关闭抽屉
  const handleSubmit = async () => {
    const values = await form.validateFields()
    persist(values)
    closeDrawer()
  }

  // 保存后不关闭抽屉，清空内容继续录入下一条（保留项目分类，便于连续录入同类项目）
  const handleSaveAndNext = async () => {
    const values = await form.validateFields()
    persist(values)
    setEditing(null)
    form.setFieldsValue({ category: values.category, standard: '', points: '', score: undefined })
  }

  const handleDelete = (record: ScoreItemRecord) => {
    setItems((prev) => prev.filter((x) => x.id !== record.id))
    message.success('评分项目已删除')
  }

  const columns: ColumnsType<ScoreItemRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_: unknown, __: ScoreItemRecord, idx: number) => idx + 1,
    },
    {
      title: '项目分类',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '评分细则',
      dataIndex: 'standard',
      key: 'standard',
      render: (v: string) => <span style={{ color: 'rgba(0,0,0,0.85)' }}>{v}</span>,
    },
    {
      title: '要点',
      dataIndex: 'points',
      key: 'points',
      width: 360,
      render: (v: string) => <span style={{ color: 'rgba(0,0,0,0.65)' }}>{v}</span>,
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      align: 'center',
      render: (v: number) => <Tag color="volcano">{v} 分</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 160, // 加宽 1/3，保证「编辑 / 删除」文字单行显示
      align: 'center',
      render: (_: unknown, r: ScoreItemRecord) => (
        <Space size={12} style={{ whiteSpace: 'nowrap' }}>
          <a onClick={() => openEdit(r)}>
            <EditOutlined style={{ marginRight: 4 }} />
            编辑
          </a>
          <Popconfirm
            title="删除评分项目"
            description={`确定删除「${r.category}」下的这条评分项目吗？`}
            okText="确定"
            cancelText="再想想"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(r)}
          >
            <a style={{ color: '#ff4d4f' }}>
              <DeleteOutlined style={{ marginRight: 4 }} />
              删除
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card bordered={false} styles={{ body: { padding: '8px 24px 24px' } }}>
      {/* 标题栏：左侧蓝色小竖条 + 评分项目 + 新增按钮，右侧过滤条件 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              width: 4,
              height: 16,
              background: '#1677ff',
              borderRadius: 2,
              marginRight: 8,
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginRight: 16 }}>评分项目</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            新增评分项目
          </Button>
        </div>
        <Space>
          <Select
            value={categoryFilter}
            style={{ width: 160 }}
            onChange={(v) => setCategoryFilter(v)}
            options={[{ value: 'all', label: '全部项目分类' }, ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))]}
          />
          <Input.Search
            allowClear
            placeholder="评分细则 / 要点关键词"
            style={{ width: 220 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(v) => setKeyword(v)}
          />
        </Space>
      </div>

      <Table<ScoreItemRecord>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        scroll={{ x: 900 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
          position: ['bottomLeft'],
        }}
        locale={{ emptyText: <Empty description="暂无评分项目" /> }}
      />

      {/* 新增 / 编辑评分项目抽屉 */}
      <Drawer
        title={editing ? '编辑评分项目' : '新增评分项目'}
        placement="right"
        width={560}
        open={drawerOpen}
        onClose={closeDrawer}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={closeDrawer}>取消</Button>
            {!editing && (
              <Button icon={<PlusOutlined />} onClick={handleSaveAndNext}>
                保存并新增下一个
              </Button>
            )}
            <Button type="primary" onClick={handleSubmit}>
              保存
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="category"
            label="项目分类"
            rules={[{ required: true, message: '请选择项目分类' }]}
          >
            <Select
              placeholder="请选择项目分类"
              options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
            />
          </Form.Item>

          <Form.Item
            name="standard"
            label="评分细则"
            rules={[{ required: true, message: '请输入评分细则' }]}
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="如：核对患者身份与操作部位，向患者说明操作目的"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="points"
            label="要点"
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="如：核对完整并说明得 4 分；未核对身份扣 4 分"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="score"
            label="得分"
            rules={[{ required: true, message: '请输入得分' }]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={0}
              style={{ width: '100%' }}
              placeholder="请输入该项得分"
              addonAfter="分"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}

export default ScoreItem
