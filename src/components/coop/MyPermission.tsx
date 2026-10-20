import React, { useState } from 'react'
import {
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Input,
  Popconfirm,
  Radio,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Upload,
  message,
} from 'antd'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'
import {
  SearchOutlined,
  RedoOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons'

// ===== 当前登录人 =====
const CURRENT_USER = { dept: '呼吸内科', name: '张明', employeeNo: 'M0721', title: '主治医师' }

// ===== 权限分类对应的权限配置（可勾选项） =====
const CATEGORY_CONFIG: Record<string, string[]> = {
  '手术目录': ['开单', '主刀'],
  '手术等级': ['开单', '主刀', '一助'],
  '输血': ['开单', '审核'],
  '操作目录': ['操作', '维护'],
  '处方权': ['门诊', '住院'],
  '设备': ['操作', '维护'],
}

interface PermRecord {
  id: string
  employeeNo: string
  name: string
  dept: string
  title: string
  category: string       // 权限分类
  permName: string       // 权限名称
  config: string[]       // 权限配置（勾选值）
  checkStatus: '通过' | '不通过'
  grantDate: string      // 授权日期
  expireDate: string     // 到期日期（长期 / 具体日期）
  applyDate: string      // 申请时间
}

// ===== 个人资质授权 mock =====
const MOCK_DATA: PermRecord[] = [
  { id: '1', employeeNo: CURRENT_USER.employeeNo, name: CURRENT_USER.name, dept: CURRENT_USER.dept, title: CURRENT_USER.title, category: '手术目录', permName: '阑尾切除术', config: ['开单', '主刀'], checkStatus: '通过', grantDate: '2026-03-12', expireDate: '长期', applyDate: '2026-03-10 09:32:11' },
  { id: '2', employeeNo: CURRENT_USER.employeeNo, name: CURRENT_USER.name, dept: CURRENT_USER.dept, title: CURRENT_USER.title, category: '手术等级', permName: '三级手术', config: ['开单', '主刀'], checkStatus: '通过', grantDate: '2026-03-12', expireDate: '长期', applyDate: '2026-03-10 09:32:11' },
  { id: '3', employeeNo: CURRENT_USER.employeeNo, name: CURRENT_USER.name, dept: CURRENT_USER.dept, title: CURRENT_USER.title, category: '输血', permName: '普通输血', config: ['开单'], checkStatus: '通过', grantDate: '2025-11-05', expireDate: '长期', applyDate: '2025-11-02 14:05:40' },
  { id: '4', employeeNo: CURRENT_USER.employeeNo, name: CURRENT_USER.name, dept: CURRENT_USER.dept, title: CURRENT_USER.title, category: '操作目录', permName: '中心静脉穿刺置管术', config: ['操作'], checkStatus: '通过', grantDate: '2026-01-20', expireDate: '2027-06-30', applyDate: '2026-01-18 10:11:25' },
  { id: '5', employeeNo: CURRENT_USER.employeeNo, name: CURRENT_USER.name, dept: CURRENT_USER.dept, title: CURRENT_USER.title, category: '处方权', permName: '处方权1', config: ['住院'], checkStatus: '不通过', grantDate: '2026-08-14', expireDate: '长期', applyDate: '2026-08-12 16:47:03' },
  { id: '6', employeeNo: CURRENT_USER.employeeNo, name: CURRENT_USER.name, dept: CURRENT_USER.dept, title: CURRENT_USER.title, category: '设备', permName: '呼吸机', config: ['操作'], checkStatus: '通过', grantDate: '2026-06-01', expireDate: '长期', applyDate: '2026-05-28 11:20:56' },
]

// ===== 可申请的权限池（「选择权限」弹窗数据源） =====
const AVAILABLE_PERMS: { category: string; permName: string }[] = [
  { category: '手术目录', permName: '腹腔镜胆囊切除术' },
  { category: '手术目录', permName: '胸腔镜肺叶切除术' },
  { category: '手术等级', permName: '四级手术' },
  { category: '输血', permName: '紧急输血' },
  { category: '操作目录', permName: '胸腔闭式引流术' },
  { category: '处方权', permName: '处方权2' },
  { category: '设备', permName: '监护仪' },
]

interface SelectedPerm {
  key: string
  category: string
  permName: string
  config: string[]
  exception: boolean    // 破格（不可修改）
  checkStatus: '通过' | '不通过'
}

const SectionTitle: React.FC<{ text: string; extra?: React.ReactNode }> = ({ text, extra }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
      <span style={{ width: 3, height: 14, background: '#1890ff', marginRight: 8, borderRadius: 1 }} />
      {text}
    </span>
    {extra}
  </div>
)

const MyPermission: React.FC = () => {
  const [data, setData] = useState<PermRecord[]>(MOCK_DATA)
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [expireRange, setExpireRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // ===== 个人申请抽屉 =====
  const [applyOpen, setApplyOpen] = useState(false)
  const [selectedPerms, setSelectedPerms] = useState<SelectedPerm[]>([])
  const [applyRemark, setApplyRemark] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])

  // 申请时限：date 指定到期日 / days 延长周期
  const [deferMode, setDeferMode] = useState<'date' | 'days'>('date')
  const [newExpireDate, setNewExpireDate] = useState<dayjs.Dayjs | null>(null)
  const [extendDays, setExtendDays] = useState<number>(0)

  // ===== 选择权限弹窗 =====
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerChecked, setPickerChecked] = useState<string[]>([])
  const [pickerKeyword, setPickerKeyword] = useState('')

  const filtered = data.filter((r) => {
    const kw = keyword.trim()
    const hitKw = !kw || r.permName.includes(kw) || r.name.includes(kw) || r.employeeNo.includes(kw)
    const hitCategory = !categoryFilter || r.category === categoryFilter
    let hitExpire = true
    if (expireRange && (expireRange[0] || expireRange[1])) {
      if (r.expireDate === '长期') {
        hitExpire = false
      } else {
        const d = dayjs(r.expireDate)
        if (expireRange[0] && d.isBefore(expireRange[0], 'day')) hitExpire = false
        if (expireRange[1] && d.isAfter(expireRange[1], 'day')) hitExpire = false
      }
    }
    return hitKw && hitCategory && hitExpire
  })

  const toSelectedPerm = (r: PermRecord): SelectedPerm => ({
    key: r.id,
    category: r.category,
    permName: r.permName,
    config: [...r.config],
    exception: false,
    checkStatus: r.checkStatus,
  })

  // 再申请（单条） / 批量再申请
  const openApply = (records: PermRecord[]) => {
    setSelectedPerms(records.map(toSelectedPerm))
    setApplyRemark('')
    setFileList([])
    setDeferMode('date')
    setNewExpireDate(null)
    setExtendDays(0)
    setApplyOpen(true)
  }

  const removeFromApply = (key: string) => {
    setSelectedPerms((list) => list.filter((p) => p.key !== key))
  }

  const openPicker = () => {
    setPickerChecked([])
    setPickerKeyword('')
    setPickerOpen(true)
  }

  const confirmPicker = () => {
    setSelectedPerms((list) => {
      const existKeys = new Set(list.map((p) => p.key))
      const added = AVAILABLE_PERMS.filter(
        (a) => pickerChecked.includes(`${a.category}/${a.permName}`) && !existKeys.has(`pool-${a.category}/${a.permName}`),
      ).map((a) => ({
        key: `pool-${a.category}/${a.permName}`,
        category: a.category,
        permName: a.permName,
        config: [],
        exception: false,
        checkStatus: '不通过' as const,
      }))
      return [...list, ...added]
    })
    setPickerOpen(false)
    message.success('已添加所选权限')
  }

  const handleSubmit = (draft: boolean) => {
    if (selectedPerms.length === 0) {
      message.warning('请至少选择一条权限')
      return
    }
    if (deferMode === 'date' && !newExpireDate) {
      message.warning('请选择新到期日期')
      return
    }
    if (deferMode === 'days' && (!extendDays || extendDays <= 0)) {
      message.warning('请输入延长周期天数')
      return
    }
    if (draft) {
      message.success('已暂存')
    } else {
      message.success('已提交审批')
    }
    setApplyOpen(false)
  }

  const columns = [
    { title: '序号', width: 60, render: (_: unknown, __: PermRecord, i: number) => i + 1 },
    { title: '工号', dataIndex: 'employeeNo', width: 90 },
    { title: '姓名', dataIndex: 'name', width: 90 },
    { title: '科室', dataIndex: 'dept', width: 110 },
    { title: '职称', dataIndex: 'title', width: 100 },
    { title: '权限分类', dataIndex: 'category', width: 100 },
    { title: '权限名称', dataIndex: 'permName', width: 170 },
    { title: '授权日期', dataIndex: 'grantDate', width: 110 },
    {
      title: '到期日期', dataIndex: 'expireDate', width: 110,
      render: (v: string) => (v === '长期' ? <span style={{ color: '#999' }}>长期</span> : v),
    },
    { title: '申请时间', dataIndex: 'applyDate', width: 170 },
    {
      title: '操作', width: 90, fixed: 'right' as const,
      render: (_: unknown, record: PermRecord) => (
        <Tooltip title={record.expireDate === '长期' ? '长期权限无需再申请' : ''}>
          <Button
            type="link"
            size="small"
            icon={<RedoOutlined />}
            disabled={record.expireDate === '长期'}
            onClick={() => openApply([record])}
          >
            再申请
          </Button>
        </Tooltip>
      ),
    },
  ]

  return (
    <div>
      {/* 工具栏：左侧批量再申请，右侧搜索 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={selectedRowKeys.length === 0}
          onClick={() => openApply(data.filter((r) => selectedRowKeys.includes(r.id)))}
        >
          批量再申请{selectedRowKeys.length > 0 ? `（已选 ${selectedRowKeys.length} 项）` : ''}
        </Button>
        <Space>
          <DatePicker.RangePicker
            value={expireRange}
            onChange={(v) => setExpireRange(v)}
            placeholder={['到期开始日期', '到期结束日期']}
            allowEmpty={[true, true]}
          />
          <Input
            placeholder="请输入权限名称"
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            style={{ width: 200 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
          <Select
            placeholder="权限分类"
            style={{ width: 140 }}
            allowClear
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v)}
            options={Object.keys(CATEGORY_CONFIG).map((c) => ({ value: c, label: c }))}
          />
          <Button type="primary">搜索</Button>
          <Button onClick={() => { setKeyword(''); setCategoryFilter(undefined); setExpireRange(null) }}>重置</Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        scroll={{ x: 1280 }}
        pagination={{ showTotal: (t) => `共 ${t} 条`, showSizeChanger: false }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          // 到期日期为长期的不可勾选
          getCheckboxProps: (record: PermRecord) => ({ disabled: record.expireDate === '长期' }),
        }}
      />

      {/* 个人再申请抽屉 */}
      <Drawer
        title="个人再申请"
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        width={960}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setApplyOpen(false)}>取 消</Button>
              <Button onClick={() => handleSubmit(true)}>暂 存</Button>
              <Button type="primary" onClick={() => handleSubmit(false)}>提交审批</Button>
            </Space>
          </div>
        }
      >
        <SectionTitle
          text="已选择权限"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={openPicker}>选择权限</Button>}
        />
        <Table
          rowKey="key"
          size="middle"
          pagination={false}
          dataSource={selectedPerms}
          style={{ marginBottom: 24 }}
          columns={[
            { title: '权限分类', dataIndex: 'category', width: 110 },
            { title: '权限名称', dataIndex: 'permName', width: 180 },
            {
              title: '权限配置',
              dataIndex: 'config',
              // 权限配置不允许修改，仅展示
              render: (_: unknown, record: SelectedPerm) => (
                <Checkbox.Group
                  disabled
                  options={(CATEGORY_CONFIG[record.category] || []).map((o) => ({ value: o, label: o }))}
                  value={record.config}
                />
              ),
            },
            {
              title: '破格',
              dataIndex: 'exception',
              width: 70,
              align: 'center' as const,
              // 破格勾选同样不允许修改
              render: (v: boolean) => <Checkbox disabled checked={v} />,
            },
            {
              title: '资格审查', dataIndex: 'checkStatus', width: 100,
              render: (v: SelectedPerm['checkStatus']) =>
                v === '通过' ? <Tag color="green">通过</Tag> : <Tag color="orange">不通过</Tag>,
            },
            {
              title: '操作', width: 70,
              render: (_: unknown, record: SelectedPerm) => (
                <Popconfirm title="确定移除该权限？" onConfirm={() => removeFromApply(record.key)}>
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />

        <SectionTitle text="申请时限" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
          <Radio.Group
            value={deferMode}
            onChange={(e) => setDeferMode(e.target.value as 'date' | 'days')}
            options={[
              { value: 'date', label: '指定到期日' },
              { value: 'days', label: '延长周期' },
            ]}
          />
          {deferMode === 'date' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span>新到期日期：</span>
              <DatePicker
                value={newExpireDate}
                onChange={(v) => setNewExpireDate(v)}
                placeholder="请选择日期"
                style={{ width: 180 }}
              />
            </div>
          )}
          {deferMode === 'days' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span>延长周期（天）</span>
              <InputNumber min={1} max={3650} value={extendDays} onChange={(v) => setExtendDays(v ?? 0)} style={{ width: 140 }} />
            </div>
          )}
        </div>

        <SectionTitle text="再申请原因" />
        <Input.TextArea
          rows={4}
          value={applyRemark}
          onChange={(e) => setApplyRemark(e.target.value)}
          placeholder="请输入再申请原因（选填）"
          maxLength={500}
          showCount
          style={{ marginBottom: 24 }}
        />

        <SectionTitle text="附件" />
        <Upload
          multiple
          maxCount={10}
          fileList={fileList}
          onChange={({ fileList: fl }) => setFileList(fl)}
          beforeUpload={() => false}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        >
          <Button type="primary" icon={<UploadOutlined />}>上传附件</Button>
        </Upload>
      </Drawer>

      {/* 选择权限抽屉（叠于个人再申请抽屉上层） */}
      <Drawer
        title="选择权限"
        placement="right"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        width={480}
        zIndex={1010}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPickerOpen(false)}>取 消</Button>
              <Button type="primary" onClick={confirmPicker}>确 定</Button>
            </Space>
          </div>
        }
      >
        <div style={{ background: '#f6f8fa', border: '1px solid #e8ecef', borderRadius: 4, padding: '6px 12px', marginBottom: 12, color: '#666', fontSize: 13 }}>
          仅显示本人已有的权限列表
        </div>
        <Input
          placeholder="请输入权限名称"
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          style={{ width: '100%', marginBottom: 12 }}
          value={pickerKeyword}
          onChange={(e) => setPickerKeyword(e.target.value)}
          allowClear
        />
        <div style={{ overflowY: 'auto' }}>
          {AVAILABLE_PERMS.filter((a) => !pickerKeyword.trim() || a.permName.includes(pickerKeyword.trim())).map((a) => {
            const pair = `${a.category}/${a.permName}`
            const already = selectedPerms.some((p) => p.key === `pool-${pair}` || (p.category === a.category && p.permName === a.permName))
            return (
              <div key={pair} style={{ display: 'flex', alignItems: 'center', padding: '8px 4px', borderBottom: '1px solid #f5f5f5' }}>
                <Checkbox
                  disabled={already}
                  checked={already || pickerChecked.includes(pair)}
                  onChange={(e) =>
                    setPickerChecked((list) => (e.target.checked ? [...list, pair] : list.filter((k) => k !== pair)))
                  }
                >
                  <Tag style={{ marginRight: 8 }}>{a.category}</Tag>
                  {a.permName}
                  {already && <span style={{ color: '#999', marginLeft: 8 }}>（已添加）</span>}
                </Checkbox>
              </div>
            )
          })}
        </div>
      </Drawer>
    </div>
  )
}

export default MyPermission
