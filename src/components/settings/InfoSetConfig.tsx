import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Switch,
  Tag,
  Drawer,
  Form,
  Select,
  InputNumber,
  message,
  Typography,
  Descriptions,
} from 'antd'
import { SearchOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

// ==================== 类型定义 ====================

/** 信息集字段 */
interface FieldItem {
  id: string
  label: string      // 字段名称
  code: string       // 字段标识
  type: string       // 数据类型
  visible: boolean   // 是否显示
  required: boolean  // 是否必填
}

/** 档案信息集（子集） */
interface InfoSet {
  id: string
  systemName: string                       // 系统名称
  name: string                             // 子集名称
  tableName: string                        // 表名
  setType: '系统预设' | '自定义'           // 类型
  sort: number                             // 排序
  visible: boolean                         // 档案信息是否显示
  required: boolean                        // 档案信息是否必填
  enabled: boolean                         // 状态（启用/停用）
  remark: string                           // 说明
  fields: FieldItem[]                      // 子集字段
}

// ==================== 模拟数据 ====================

const INITIAL_INFOSETS: InfoSet[] = [
  {
    id: 'IS-1', systemName: '人员档案管理', name: '基本信息', tableName: 'ARCHIVE_BASE',
    setType: '系统预设', sort: 1, visible: true, required: true, enabled: true, remark: '记录人员基本信息',
    fields: [
      { id: 'F-101', label: '姓名', code: 'name', type: '文本', visible: true, required: true },
      { id: 'F-102', label: '性别', code: 'gender', type: '单选', visible: true, required: true },
      { id: 'F-103', label: '出生日期', code: 'birthDate', type: '日期', visible: true, required: false },
      { id: 'F-104', label: '证件号码', code: 'idCard', type: '文本', visible: true, required: true },
      { id: 'F-105', label: '联系电话', code: 'phone', type: '文本', visible: true, required: false },
      { id: 'F-106', label: '工号', code: 'staffNo', type: '文本', visible: true, required: true },
      { id: 'F-107', label: '所属科室', code: 'dept', type: '单选', visible: true, required: true },
      { id: 'F-108', label: '照片', code: 'photo', type: '附件', visible: false, required: false },
    ],
  },
  {
    id: 'IS-2', systemName: '人员档案管理', name: '教育经历', tableName: 'ARCHIVE_EDU',
    setType: '系统预设', sort: 2, visible: true, required: false, enabled: true, remark: '记录教育背景信息',
    fields: [
      { id: 'F-201', label: '学校名称', code: 'school', type: '文本', visible: true, required: true },
      { id: 'F-202', label: '专业', code: 'major', type: '文本', visible: true, required: true },
      { id: 'F-203', label: '学历', code: 'degree', type: '单选', visible: true, required: true },
      { id: 'F-204', label: '学位', code: 'academicDegree', type: '单选', visible: true, required: false },
      { id: 'F-205', label: '起止时间', code: 'eduRange', type: '日期区间', visible: true, required: false },
      { id: 'F-206', label: '学历证书', code: 'diploma', type: '附件', visible: false, required: false },
    ],
  },
  {
    id: 'IS-3', systemName: '人员档案管理', name: '工作经历', tableName: 'ARCHIVE_WORK',
    setType: '系统预设', sort: 3, visible: true, required: false, enabled: true, remark: '',
    fields: [
      { id: 'F-301', label: '工作单位', code: 'workUnit', type: '文本', visible: true, required: true },
      { id: 'F-302', label: '职务', code: 'position', type: '文本', visible: true, required: false },
      { id: 'F-303', label: '起止时间', code: 'workRange', type: '日期区间', visible: true, required: true },
      { id: 'F-304', label: '工作描述', code: 'workDesc', type: '多行文本', visible: false, required: false },
    ],
  },
  {
    id: 'IS-4', systemName: '人员档案管理', name: '培训经历', tableName: 'ARCHIVE_TRAIN',
    setType: '系统预设', sort: 4, visible: true, required: false, enabled: true, remark: '记录规培及继续教育经历',
    fields: [
      { id: 'F-401', label: '培训项目', code: 'trainName', type: '文本', visible: true, required: true },
      { id: 'F-402', label: '培训机构', code: 'trainOrg', type: '文本', visible: true, required: true },
      { id: 'F-403', label: '培训时间', code: 'trainDate', type: '日期', visible: true, required: false },
      { id: 'F-404', label: '培训学时', code: 'trainHours', type: '数字', visible: true, required: false },
      { id: 'F-405', label: '结业证书', code: 'trainCert', type: '附件', visible: false, required: false },
    ],
  },
  {
    id: 'IS-5', systemName: '人员档案管理', name: '考核记录', tableName: 'ARCHIVE_EXAM',
    setType: '系统预设', sort: 5, visible: true, required: false, enabled: true, remark: '记录日常/出科/年度考核信息',
    fields: [
      { id: 'F-501', label: '考核类型', code: 'examType', type: '单选', visible: true, required: true },
      { id: 'F-502', label: '考核日期', code: 'examDate', type: '日期', visible: true, required: true },
      { id: 'F-503', label: '考核成绩', code: 'examScore', type: '数字', visible: true, required: true },
      { id: 'F-504', label: '考核结论', code: 'examResult', type: '单选', visible: true, required: false },
      { id: 'F-505', label: '考核附件', code: 'examFile', type: '附件', visible: false, required: false },
    ],
  },
  {
    id: 'IS-6', systemName: '人员档案管理', name: '轮转记录', tableName: 'ARCHIVE_ROTATION',
    setType: '系统预设', sort: 6, visible: true, required: false, enabled: true, remark: '记录科室轮转完成情况',
    fields: [
      { id: 'F-601', label: '轮转科室', code: 'rotationDept', type: '单选', visible: true, required: true },
      { id: 'F-602', label: '轮转周期', code: 'rotationCycle', type: '文本', visible: true, required: true },
      { id: 'F-603', label: '入科日期', code: 'inDate', type: '日期', visible: true, required: false },
      { id: 'F-604', label: '出科日期', code: 'outDate', type: '日期', visible: true, required: false },
    ],
  },
  {
    id: 'IS-7', systemName: '人员档案管理', name: '奖惩记录', tableName: 'ARCHIVE_AWARD',
    setType: '自定义', sort: 7, visible: false, required: false, enabled: true, remark: '记录奖励与处分信息',
    fields: [
      { id: 'F-701', label: '奖惩类型', code: 'awardType', type: '单选', visible: true, required: true },
      { id: 'F-702', label: '奖惩名称', code: 'awardName', type: '文本', visible: true, required: true },
      { id: 'F-703', label: '奖惩日期', code: 'awardDate', type: '日期', visible: true, required: false },
      { id: 'F-704', label: '备注说明', code: 'awardRemark', type: '多行文本', visible: false, required: false },
    ],
  },
  {
    id: 'IS-8', systemName: '人员档案管理', name: '家庭成员', tableName: 'ARCHIVE_FAMILY',
    setType: '自定义', sort: 8, visible: false, required: false, enabled: false, remark: '记录紧急联系人等家庭信息',
    fields: [
      { id: 'F-801', label: '成员姓名', code: 'memberName', type: '文本', visible: true, required: true },
      { id: 'F-802', label: '与本人关系', code: 'relation', type: '单选', visible: true, required: true },
      { id: 'F-803', label: '联系电话', code: 'memberPhone', type: '文本', visible: true, required: false },
      { id: 'F-804', label: '工作单位', code: 'memberUnit', type: '文本', visible: false, required: false },
    ],
  },
]

const SET_TYPE_COLOR: Record<string, string> = { '系统预设': 'blue', '自定义': 'gold' }

// ==================== 页面 ====================

const InfoSetConfig: React.FC = () => {
  const [data, setData] = useState<InfoSet[]>(INITIAL_INFOSETS)
  const [searchText, setSearchText] = useState('')
  const [selectedId, setSelectedId] = useState<string>(INITIAL_INFOSETS[0].id)
  const [maintainOpen, setMaintainOpen] = useState(false)
  const [form] = Form.useForm()

  const selected = data.find((r) => r.id === selectedId) || null

  const filtered = searchText.trim()
    ? data.filter((r) => r.name.toLowerCase().includes(searchText.trim().toLowerCase()) || r.tableName.toLowerCase().includes(searchText.trim().toLowerCase()))
    : data

  /** 更新信息集行（开关等） */
  const patchSet = (id: string, patch: Partial<InfoSet>) => {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  /** 更新子集内某字段的显示/必填 */
  const patchField = (setId: string, fieldId: string, patch: Partial<FieldItem>) => {
    setData((prev) =>
      prev.map((r) =>
        r.id === setId
          ? { ...r, fields: r.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) }
          : r,
      ),
    )
  }

  /** 打开维护抽屉（仅编辑既有信息集） */
  const openMaintain = (record: InfoSet) => {
    form.resetFields()
    form.setFieldsValue({
      name: record.name,
      tableName: record.tableName,
      setType: record.setType,
      visible: record.visible,
      required: record.required,
      sort: record.sort,
      remark: record.remark,
      enabled: record.enabled,
    })
    setMaintainOpen(true)
  }

  const handleSave = () => {
    if (!selected) return
    form.validateFields().then((values) => {
      patchSet(selected.id, values)
      message.success('信息集已保存')
      setMaintainOpen(false)
    })
  }

  /** 字段表列（按信息集 id 绑定开关更新） */
  const fieldColumns: ColumnsType<FieldItem> = [
    { title: '序号', width: 56, align: 'center', render: (_, __, i) => i + 1 },
    { title: '字段名称', dataIndex: 'label', width: 140, render: (v: string) => <Text strong>{v}</Text> },
    { title: '字段标识', dataIndex: 'code', width: 170, render: (v: string) => <Text code>{v}</Text> },
    { title: '数据类型', dataIndex: 'type', width: 110, align: 'center' },
    {
      title: '是否显示', dataIndex: 'visible', width: 100, align: 'center',
      render: (v: boolean, f) => (
        <Switch size="small" checked={v} onChange={(c) => selectedId && patchField(selectedId, f.id, { visible: c })} />
      ),
    },
    {
      title: '是否必填', dataIndex: 'required', width: 100, align: 'center',
      render: (v: boolean, f) => (
        <Switch size="small" checked={v} onChange={(c) => selectedId && patchField(selectedId, f.id, { required: c })} />
      ),
    },
  ]

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      {/* 顶部标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', width: 4, height: 16, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>信息集配置</span>
        </div>
        <Input
          placeholder="搜索集合名称/表名"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 220 }}
        />
      </div>

      {/* 左右布局：左=集合列表，右=详情 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* 左侧：信息集名称列表 */}
        <div
          style={{
            width: 250,
            flexShrink: 0,
            background: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 8,
            maxHeight: 'calc(100vh - 230px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.88)', padding: '6px 10px 10px' }}>档案信息集</div>
          {filtered.map((r) => {
            const active = r.id === selectedId
            return (
              <div
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 2,
                  background: active ? '#e6f4ff' : 'transparent',
                  border: active ? '1px solid #91caff' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text strong style={{ color: active ? '#0958d9' : 'rgba(0,0,0,0.88)' }}>{r.name}</Text>
                  <Tag color={SET_TYPE_COLOR[r.setType]} style={{ marginRight: 0 }}>{r.setType}</Tag>
                </div>
                <div style={{ fontSize: 12, color: active ? '#4096ff' : '#999', marginTop: 2 }}>
                  {r.tableName}
                </div>
              </div>
            )
          })}
        </div>

        {/* 右侧：选中信息集详情 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              {/* 详情头部 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{selected.name}</span>
                  <Tag color={SET_TYPE_COLOR[selected.setType]}>{selected.setType}</Tag>
                  {!selected.enabled && <Tag>停用</Tag>}
                </div>
                <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => openMaintain(selected)}>
                  维护
                </Button>
              </div>

              {/* 信息集基本信息 */}
              <Descriptions column={3} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="系统名称">{selected.systemName}</Descriptions.Item>
                <Descriptions.Item label="表名">{selected.tableName}</Descriptions.Item>
                <Descriptions.Item label="排序">{selected.sort}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  {selected.enabled ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="档案信息是否显示">
                  <Switch
                    size="small"
                    checked={selected.visible}
                    onChange={(c) => patchSet(selected.id, { visible: c })}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="档案信息是否必填">
                  <Switch
                    size="small"
                    checked={selected.required}
                    onChange={(c) => patchSet(selected.id, { required: c })}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="说明" span={3}>
                  {selected.remark || <Text style={{ color: '#d9d9d9' }}>-</Text>}
                </Descriptions.Item>
              </Descriptions>

              {/* 子集字段 */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ display: 'inline-block', width: 4, height: 15, background: '#1677ff', borderRadius: 2, marginRight: 8 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>子集字段</span>
                <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                  共 {selected.fields.length} 项，控制字段在档案中是否显示、是否必填
                </span>
              </div>
              <Table<FieldItem>
                columns={fieldColumns}
                dataSource={selected.fields}
                rowKey="id"
                size="small"
                scroll={{ x: 700 }}
                pagination={false}
              />
            </>
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: 80 }}>请从左侧选择一个信息集查看详情</div>
          )}
        </div>
      </div>

      {/* 维护抽屉 */}
      <Drawer
        title={selected ? `维护信息集 · ${selected.name}` : '维护信息集'}
        open={maintainOpen}
        onClose={() => setMaintainOpen(false)}
        width={520}
        styles={{ body: { paddingBottom: 80 } }}
      >
        <Form form={form} layout="horizontal" labelAlign="right" labelCol={{ flex: '0 0 140px' }} wrapperCol={{ flex: '1 1 auto' }}>
          <Form.Item label="子集名称" name="name" rules={[{ required: true, message: '请输入子集名称' }]}>
            <Input placeholder="请输入子集名称" />
          </Form.Item>
          <Form.Item label="表名" name="tableName" rules={[{ required: true, message: '请输入表名' }]}>
            <Input placeholder="如：ARCHIVE_BASE" />
          </Form.Item>
          <Form.Item label="类型" name="setType" rules={[{ required: true }]}>
            <Select
              disabled={!!selected && selected.setType === '系统预设'}
              options={[
                { value: '系统预设', label: '系统预设' },
                { value: '自定义', label: '自定义' },
              ]}
            />
          </Form.Item>
          <Form.Item label="档案信息是否显示" name="visible" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="档案信息是否必填" name="required" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="排序" name="sort" rules={[{ required: true, message: '请输入排序号' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入排序号" />
          </Form.Item>
          <Form.Item label="说明" name="remark">
            <Input.TextArea rows={2} placeholder="请输入说明（可留空）" />
          </Form.Item>
          <Form.Item label="状态" name="enabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', borderTop: '1px solid #f0f0f0', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setMaintainOpen(false)}>取消</Button>
          <Button type="primary" onClick={handleSave}>保存</Button>
        </div>
      </Drawer>
    </Card>
  )
}

export default InfoSetConfig
