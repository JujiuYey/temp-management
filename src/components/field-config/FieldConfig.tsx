import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Switch,
  message,
} from 'antd'
import {
  SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

// 环节类型选项
const MODULE_OPTIONS = [
  { label: '项目立项', value: '项目立项' },
  { label: '阶段评估', value: '阶段评估' },
  { label: '转常规', value: '转常规' },
  { label: '效果评价', value: '效果评价' },
]

// 页签选项
const TAB_OPTIONS = [
  { label: '基本信息', value: '基本信息' },
  { label: '技术分类', value: '技术分类' },
  { label: '团队成员', value: '团队成员' },
  { label: '设备需求', value: '设备需求' },
  { label: '开展计划', value: '开展计划' },
  { label: '风险评估', value: '风险评估' },
  { label: '效果预期', value: '效果预期' },
  { label: '费用预算', value: '费用预算' },
  { label: '附件材料', value: '附件材料' },
]

interface FieldConfigRecord {
  id: string
  labelName: string       // 标签名称
  field: string           // 字段
  fieldType: string       // 字段类型（保留数据，不在表格中显示）
  moduleType: string      // 环节类型
  tabName: string         // 页签
  techVisible: boolean    // 技术中显示
  projectVisible: boolean // 项目中显示
  required: boolean       // 必填
  fillInstruction: string  // 填写说明
  status: string          // 状态（保留数据，不在表格中显示）
}

const FieldConfig: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string | undefined>('项目立项')

  // 模拟数据
  const [data, setData] = useState<FieldConfigRecord[]>([
    {
      id: '1', labelName: '技术名称', field: 'tech_name', fieldType: '文本', moduleType: '项目立项', tabName: '基本信息',
      techVisible: true, projectVisible: true, required: true, fillInstruction: '请填写技术的标准全称', status: '启用',
    },
    {
      id: '2', labelName: '技术编码', field: 'tech_code', fieldType: '文本', moduleType: '项目立项', tabName: '基本信息',
      techVisible: true, projectVisible: true, required: true, fillInstruction: '系统自动生成，无需手动填写', status: '启用',
    },
    {
      id: '3', labelName: '技术分类', field: 'category', fieldType: '下拉选择', moduleType: '项目立项', tabName: '技术分类',
      techVisible: true, projectVisible: true, required: true, fillInstruction: '从下拉列表中选择技术所属分类', status: '启用',
    },
    {
      id: '4', labelName: '技术级别', field: 'level', fieldType: '单选', moduleType: '项目立项', tabName: '基本信息',
      techVisible: true, projectVisible: false, required: true, fillInstruction: '选择限制类或备案类', status: '启用',
    },
    {
      id: '5', labelName: '负责人', field: 'leader', fieldType: '文本', moduleType: '项目立项', tabName: '团队成员',
      techVisible: true, projectVisible: true, required: false, fillInstruction: '填写技术主要负责人姓名', status: '启用',
    },
    {
      id: '6', labelName: '科室', field: 'department', fieldType: '下拉选择', moduleType: '项目立项', tabName: '基本信息',
      techVisible: true, projectVisible: true, required: true, fillInstruction: '选择技术所属科室', status: '启用',
    },
    {
      id: '7', labelName: '安全等级', field: 'safety_level', fieldType: '单选', moduleType: '阶段评估', tabName: '风险评估',
      techVisible: true, projectVisible: false, required: true, fillInstruction: '评估技术安全等级', status: '启用',
    },
    {
      id: '8', labelName: '质量等级', field: 'quality_level', fieldType: '单选', moduleType: '阶段评估', tabName: '效果预期',
      techVisible: true, projectVisible: false, required: true, fillInstruction: '评估技术质量等级', status: '启用',
    },
    {
      id: '9', labelName: '阶段总结', field: 'stage_summary', fieldType: '多行文本', moduleType: '阶段评估', tabName: '效果预期',
      techVisible: true, projectVisible: true, required: false, fillInstruction: '填写本阶段技术开展总结', status: '启用',
    },
    {
      id: '10', labelName: '转常规总结', field: 'convert_summary', fieldType: '多行文本', moduleType: '转常规', tabName: '基本信息',
      techVisible: true, projectVisible: true, required: true, fillInstruction: '填写转常规申请总结', status: '启用',
    },
    {
      id: '11', labelName: '转常规结论', field: 'convert_conclusion', fieldType: '单选', moduleType: '转常规', tabName: '基本信息',
      techVisible: true, projectVisible: true, required: true, fillInstruction: '选择转常规结论（通过/不通过）', status: '启用',
    },
    {
      id: '12', labelName: '效果评价结论', field: 'effect_conclusion', fieldType: '单选', moduleType: '效果评价', tabName: '效果预期',
      techVisible: true, projectVisible: true, required: true, fillInstruction: '选择效果评价结论', status: '启用',
    },
    {
      id: '13', labelName: '存在问题', field: 'existing_problems', fieldType: '多行文本', moduleType: '效果评价', tabName: '风险评估',
      techVisible: true, projectVisible: false, required: false, fillInstruction: '填写技术开展中发现的问题', status: '启用',
    },
    {
      id: '14', labelName: '改进措施', field: 'improvement_measures', fieldType: '多行文本', moduleType: '效果评价', tabName: '风险评估',
      techVisible: true, projectVisible: false, required: false, fillInstruction: '填写问题对应的改进措施', status: '启用',
    },
  ])

  // 切换布尔字段
  const toggleField = (id: string, field: 'required' | 'techVisible' | 'projectVisible') => {
    setData(data.map(item =>
      item.id === id ? { ...item, [field]: !item[field] } : item
    ))
  }

  // 更新文本字段
  const updateTextField = (id: string, field: 'labelName' | 'fillInstruction', value: string) => {
    setData(data.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // 更新页签字段
  const updateTabName = (id: string, value: string) => {
    setData(data.map(item =>
      item.id === id ? { ...item, tabName: value } : item
    ))
  }

  const columns: ColumnsType<FieldConfigRecord> = [
    {
      title: '字段',
      dataIndex: 'field',
      key: 'field',
      width: 160,
    },
    {
      title: '标签名称',
      dataIndex: 'labelName',
      key: 'labelName',
      width: 160,
      render: (text: string, record: FieldConfigRecord) => (
        <Input
          value={text}
          variant="outlined"
          size="small"
          onChange={(e) => updateTextField(record.id, 'labelName', e.target.value)}
          onBlur={() => message.success('标签名称已更新')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '环节类型',
      dataIndex: 'moduleType',
      key: 'moduleType',
      width: 110,
      render: (moduleType: string) => <Tag color="blue">{moduleType}</Tag>,
    },
    {
      title: '页签',
      dataIndex: 'tabName',
      key: 'tabName',
      width: 130,
      render: (text: string, record: FieldConfigRecord) => (
        <Select
          value={text}
          size="small"
          variant="outlined"
          onChange={(value) => updateTabName(record.id, value)}
          onBlur={() => message.success('页签已更新')}
          options={TAB_OPTIONS}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '技术中显示',
      dataIndex: 'techVisible',
      key: 'techVisible',
      width: 110,
      align: 'center' as const,
      render: (val: boolean, record: FieldConfigRecord) => (
        <Switch
          size="small"
          checked={val}
          onChange={() => toggleField(record.id, 'techVisible')}
        />
      ),
    },
    {
      title: '项目中显示',
      dataIndex: 'projectVisible',
      key: 'projectVisible',
      width: 110,
      align: 'center' as const,
      render: (val: boolean, record: FieldConfigRecord) => (
        <Switch
          size="small"
          checked={val}
          onChange={() => toggleField(record.id, 'projectVisible')}
        />
      ),
    },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
      width: 70,
      align: 'center' as const,
      render: (val: boolean, record: FieldConfigRecord) => (
        <Switch
          size="small"
          checked={val}
          onChange={() => toggleField(record.id, 'required')}
        />
      ),
    },
    {
      title: '填写说明',
      dataIndex: 'fillInstruction',
      key: 'fillInstruction',
      width: 240,
      render: (text: string, record: FieldConfigRecord) => (
        <Input
          value={text}
          variant="outlined"
          size="small"
          onChange={(e) => updateTextField(record.id, 'fillInstruction', e.target.value)}
          onBlur={() => message.success('填写说明已更新')}
          style={{ width: '100%', color: '#8c8c8c', fontSize: 12 }}
        />
      ),
    },
  ]

  const handleSearch = () => {
    message.info('搜索功能待接入后端接口')
  }

  // 筛选数据
  const filteredData = data.filter(item => {
    if (moduleFilter && item.moduleType !== moduleFilter) return false
    if (searchText && !item.labelName.includes(searchText) && !item.field.includes(searchText)) return false
    return true
  })

  return (
    <div>
      {/* 搜索筛选区（靠右） */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space wrap>
            <Input
              placeholder="搜索标签名称/字段"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="环节类型"
              value={moduleFilter}
              onChange={setModuleFilter}
              style={{ width: 140 }}
              allowClear
              options={MODULE_OPTIONS}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={() => { setSearchText(''); setModuleFilter('项目立项') }}>
              重置
            </Button>
            <Button
              type="primary"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => message.success('全部保存成功')}
            >
              全部保存
            </Button>
          </Space>
        </div>
      </Card>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        scroll={{ x: 1050 }}
        pagination={{
          total: filteredData.length,
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条记录`,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        size="middle"
      />
    </div>
  )
}

export default FieldConfig
