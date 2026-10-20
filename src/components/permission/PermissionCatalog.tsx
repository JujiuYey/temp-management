import React, { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Drawer,
  Form,
  Select,
  Radio,
  Switch,
  InputNumber,
  Row,
  Col,
  Tabs,
  Modal,
  message,
  Popconfirm,
  Checkbox,
  Popover,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

// ==================== 类型定义 ====================

/** 通用权限记录基础字段 */
interface PermissionDetailRecord {
  id: string
  code: string
  permissionName: string
  fixedPermission: boolean
  allowException: boolean      // 允许破格
  monitoringCycle?: number     // 检查周期（月）
  regularMonitoring: boolean
  level: string
  validityPeriod: string
  status: boolean
  category: string
  // 处方权
  prescriptionType?: string
  // 手术目录
  techCategory?: string
  icdCode?: string
  techStatus?: string
  // 临床用血
  bloodType?: string
  bloodVolumeLimit?: number
  // 麻醉等级（level 复用）
  // 报告
  reportType?: string
  issuePermission?: string
  // 设备
  deviceType?: string
  // 病理
  pathologyType?: string
  diagnosisPermission?: string
}

// ==================== 分类配置 ====================

const categoryItems = [
  { key: '处方权', label: '处方权' },
  { key: '手术等级', label: '手术等级' },
  { key: '手术目录', label: '手术目录' },
  { key: '新技术目录', label: '新技术目录' },
  { key: '临床用血', label: '临床用血' },
  { key: '麻醉等级', label: '麻醉等级' },
  { key: '操作', label: '操作' },
  { key: '报告', label: '报告' },
  { key: '设备', label: '设备' },
  { key: '病理', label: '病理' },
]

// ==================== 通用表单字段组件 ====================

/** 三方ID */
const CodeField: React.FC = () => (
  <Form.Item label="三方ID" name="code">
    <Input placeholder="请输入三方ID" />
  </Form.Item>
)

/** 权限名称 */
const PermissionNameField: React.FC = () => (
  <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]} labelAlign="left">
    <Input placeholder="请输入权限名称" />
  </Form.Item>
)

/** 等级（通用） */
const LevelField: React.FC<{ options?: { label: string; value: string }[] }> = ({
  options = [
    { label: '一级', value: '一级' },
    { label: '二级', value: '二级' },
    { label: '三级', value: '三级' },
    { label: '四级', value: '四级' },
  ],
}) => (
  <Form.Item label="等级" name="level" rules={[{ required: true, message: '请选择等级' }]}>
    <Select placeholder="请选择等级" options={options} />
  </Form.Item>
)

/** 状态 */
const StatusField: React.FC = () => (
  <Form.Item label="状态" name="status" rules={[{ required: true }]}>
    <Radio.Group>
      <Radio value="启用">启用</Radio>
      <Radio value="停用">停用</Radio>
    </Radio.Group>
  </Form.Item>
)

// ==================== 人员资质 - 类型联动常量 ====================

const QUALIFICATION_TYPE_OPTIONS = [
  { label: '职称', value: '职称' },
  { label: '职务', value: '职务' },
  { label: '学位', value: '学位' },
  { label: '资质证书', value: '资质证书' },
]

const QUALIFICATION_VALUE_MAP: Record<string, string[]> = {
  '职称': ['医师', '药师', '技师', '护师', '药士', '主管药师', '副主任药师', '主任药师'],
  '职务': ['党委书记', '党委副书记', '院（所、站）长', '副院（所、站）长', '科室主任', '科室副主任', '科长'],
  '学位': ['学士', '硕士', '博士'],
  '资质证书': ['护士执业证书', '医师执业证书', '公共营养师资格证书', '中国心理卫生协会心理咨询培训合格证书', '中国心理学会心理咨询专业技能证书', '放射工作人员个人剂量计', '护士资格证书'],
}

const RELATION_OPTIONS = [
  { label: '而且', value: 'and' },
  { label: '或者', value: 'or' },
]

const COMPARISON_OPTIONS = [
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'lte' },
  { label: '等于', value: 'eq' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'gte' },
]

/** 根据类型获取值的下拉选项 */
const getValueOptions = (type: string | undefined) => {
  if (!type || !QUALIFICATION_VALUE_MAP[type]) return []
  return QUALIFICATION_VALUE_MAP[type].map((v) => ({ label: v, value: v }))
}

// ==================== 人员资质动态表格（双层 Form.List） ====================

/** 人员资质表格主组件 */
const QualificationTable: React.FC<{ qualificationType?: string }> = ({ qualificationType = 'inpatient' }) => {
  const getFormListName = () => {
    switch (qualificationType) {
      case 'inpatient':
        return 'inpatientQualificationGroups'
      case 'outpatient':
        return 'outpatientQualificationGroups'
      case 'surgeon':
        return 'surgeonQualificationGroups'
      case 'firstAssistant':
        return 'firstAssistantQualificationGroups'
      case 'order':
        return 'orderQualificationGroups'
      case 'operation':
        return 'operationQualificationGroups'
      case 'maintenance':
        return 'maintenanceQualificationGroups'
      default:
        return 'inpatientQualificationGroups'
    }
  }
  const formListName = getFormListName()

  return (
    <Form.List name={formListName}>
      {(groups, { add: addGroup, remove: removeGroup }) => (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
          {/* 表头 */}
          <div style={{
            display: 'flex', background: '#fafafa', borderBottom: '1px solid #f0f0f0',
            padding: '8px 12px', fontSize: 13, fontWeight: 500,
          }}>
            <div style={{ width: 80, flexShrink: 0 }}>关系</div>
            <div style={{ width: 110, flexShrink: 0 }}>类型</div>
            <div style={{ width: 160, flexShrink: 0 }}>值</div>
            <div style={{ width: 90, flexShrink: 0 }}>比较</div>
            <div style={{ width: 70, flexShrink: 0 }}>年限</div>
            <div style={{ width: 50, flexShrink: 0 }}>必须</div>
            <div style={{ flex: 1 }}>
              <span>操作</span>
              <Button type="link" size="small" icon={<PlusOutlined />}
                onClick={() => addGroup({
                  relation: groups.length === 0 ? undefined : 'and',
                  isGroup: false,
                  items: [{ type: undefined, value: undefined, comparison: undefined, years: undefined, required: false }],
                })}
                style={{ padding: '0 0 0 4px', lineHeight: 1 }}>
                资质
              </Button>
              <Button type="link" size="small" icon={<PlusOutlined />}
                onClick={() => addGroup({
                  relation: groups.length === 0 ? undefined : 'and',
                  isGroup: true,
                  groupItemRelation: 'and',
                  items: [],
                })}
                style={{ padding: '0 0 0 2px', lineHeight: 1, color: '#fa8c16' }}>
                资质组
              </Button>
            </div>
          </div>
          {/* 数据行 */}
          {groups.length === 0 && (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: '#999', fontSize: 13 }}>
              暂无要求，点击上方 + 添加
            </div>
          )}
          {groups.map((group) => (
            <GroupRow
              key={group.key}
              groupIndex={group.name}
              isFirst={group.name === 0}
              formListName={formListName}
              groupsCount={groups.length}
              removeGroup={removeGroup}
            />
          ))}
        </div>
      )}
    </Form.List>
  )
}

/** 组行 / 单个要求行 - 根据 isGroup 决定渲染哪种 */
const GroupRow: React.FC<{
  groupIndex: number
  isFirst: boolean
  groupsCount: number
  removeGroup: (index: number) => void
  formListName: string
}> = ({ groupIndex, isFirst, groupsCount, removeGroup, formListName }) => {
  const form = Form.useFormInstance()
  const isGroup = Form.useWatch([formListName, groupIndex, 'isGroup'], form)

  if (!isGroup) {
    // 单个要求
    return (
      <SingleRequirementRow
        groupIndex={groupIndex}
        isFirst={isFirst}
        groupsCount={groupsCount}
        removeGroup={removeGroup}
        formListName={formListName}
      />
    )
  }

  // 要求组
  return (
    <GroupRequirementRows
      groupIndex={groupIndex}
      isFirst={isFirst}
      groupsCount={groupsCount}
      removeGroup={removeGroup}
      formListName={formListName}
    />
  )
}

/** 单个要求行 */
const SingleRequirementRow: React.FC<{
  groupIndex: number
  isFirst: boolean
  groupsCount: number
  removeGroup: (index: number) => void
  formListName: string
}> = ({ groupIndex, isFirst, groupsCount, removeGroup, formListName }) => {
  const form = Form.useFormInstance()
  const typeValue = Form.useWatch([formListName, groupIndex, 'items', 0, 'type'], form)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '6px 12px',
      borderBottom: '1px solid #f0f0f0', fontSize: 13,
    }}>
      {/* 关系 */}
      <div style={{ width: 80, flexShrink: 0 }}>
        {!isFirst && (
          <Form.Item name={[formListName, groupIndex, 'relation']} noStyle>
            <Select placeholder="关系" options={RELATION_OPTIONS} size="small" style={{ width: '100%' }} />
          </Form.Item>
        )}
      </div>
      {/* 类型 */}
      <div style={{ width: 110, flexShrink: 0, paddingRight: 8 }}>
        <Form.Item name={[formListName, groupIndex, 'items', 0, 'type']} noStyle rules={[{ required: true, message: '请选择' }]}>
          <Select placeholder="请选择" options={QUALIFICATION_TYPE_OPTIONS} size="small" style={{ width: '100%' }} />
        </Form.Item>
      </div>
      {/* 值（联动） */}
      <div style={{ width: 160, flexShrink: 0, paddingRight: 8 }}>
        <Form.Item name={[formListName, groupIndex, 'items', 0, 'value']} noStyle rules={[{ required: true, message: '请选择' }]}>
          <Select placeholder="请选择" size="small" style={{ width: '100%' }} options={getValueOptions(typeValue)} />
        </Form.Item>
      </div>
      {/* 比较 */}
      <div style={{ width: 90, flexShrink: 0, paddingRight: 8 }}>
        <Form.Item name={[formListName, groupIndex, 'items', 0, 'comparison']} noStyle>
          <Select placeholder="比较" options={COMPARISON_OPTIONS} size="small" style={{ width: '100%' }} />
        </Form.Item>
      </div>
      {/* 年限 */}
      <div style={{ width: 70, flexShrink: 0, paddingRight: 8 }}>
        <Form.Item name={[formListName, groupIndex, 'items', 0, 'years']} noStyle>
          <InputNumber placeholder="年" min={0} size="small" style={{ width: '100%' }} />
        </Form.Item>
      </div>
      {/* 必须 */}
      <div style={{ width: 50, flexShrink: 0, textAlign: 'center' }}>
        <Form.Item name={[formListName, groupIndex, 'items', 0, 'required']} noStyle valuePropName="checked">
          <Checkbox />
        </Form.Item>
      </div>
      {/* 操作 */}
      <div style={{ flex: 1 }}>
        {groupsCount > 1 && (
          <Button type="link" size="small" danger icon={<DeleteOutlined />}
            onClick={() => removeGroup(groupIndex)} />
        )}
      </div>
    </div>
  )
}

/** 要求组（标题行 + 组内行列表） */
const GroupRequirementRows: React.FC<{
  groupIndex: number
  isFirst: boolean
  groupsCount: number
  removeGroup: (index: number) => void
  formListName: string
}> = ({ groupIndex, isFirst, groupsCount, removeGroup, formListName }) => {
  const form = Form.useFormInstance()
  const groupItemRelation = Form.useWatch([formListName, groupIndex, 'groupItemRelation'], form)

  return (
    <Form.List name={[formListName, groupIndex, 'items']}>
      {(items, { add: addItem, remove: removeItem }) => (
        <div style={{ background: '#fffbe6', borderBottom: '1px solid #f0f0f0' }}>
          {/* 组标题行 */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '6px 12px',
            borderBottom: '1px dashed #ffe58f', fontSize: 13,
          }}>
            <div style={{ width: 80, flexShrink: 0 }}>
              {!isFirst && (
                <Form.Item name={[formListName, groupIndex, 'relation']} noStyle>
                  <Select placeholder="关系" options={RELATION_OPTIONS} size="small" style={{ width: '100%' }} />
                </Form.Item>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Space size="small">
                <Tag color="orange" style={{ margin: 0 }}>要求组</Tag>
                <span style={{ fontSize: 12, color: '#999' }}>组内关系：</span>
                <Form.Item name={[formListName, groupIndex, 'groupItemRelation']} noStyle>
                  <Select options={RELATION_OPTIONS} size="small" style={{ width: 80 }} />
                </Form.Item>
              </Space>
            </div>
            <div>
              <Space size="small">
                <Button type="link" size="small" icon={<PlusOutlined />}
                  onClick={() => addItem({ type: undefined, value: undefined, comparison: undefined, years: undefined, required: false })}
                  style={{ padding: 0 }}>
                  添加
                </Button>
                {groupsCount > 1 && (
                  <Button type="link" size="small" danger onClick={() => removeGroup(groupIndex)}>
                    删除组
                  </Button>
                )}
              </Space>
            </div>
          </div>
          {/* 组内要求行 */}
          {items.length === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: 12 }}>
              组内暂无要求，点击"添加"按钮
            </div>
          )}
          {items.map((item) => (
            <GroupItemRow
              key={item.key}
              itemIndex={item.name}
              groupIndex={groupIndex}
              groupItemRelation={groupItemRelation}
              onRemove={() => removeItem(item.name)}
            />
          ))}
        </div>
      )}
    </Form.List>
  )
}

/** 组内单行要求（独立组件，支持 Form.useWatch 类型联动） */
const GroupItemRow: React.FC<{
  itemIndex: number
  groupIndex: number
  groupItemRelation: 'and' | 'or' | undefined
  onRemove: () => void
}> = ({ itemIndex, groupIndex, groupItemRelation, onRemove }) => {
  const form = Form.useFormInstance()
  const typeValue = Form.useWatch(['inpatientQualificationGroups', groupIndex, 'items', itemIndex, 'type'], form)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '6px 12px 6px 24px',
      fontSize: 13,
    }}>
      {/* 关系列：显示组内关系标识 */}
      <div style={{ width: 80, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: '#d48806' }}>
          {groupItemRelation === 'and' ? '而且' : '或者'}
        </span>
      </div>
      {/* 类型 */}
      <div style={{ width: 110, flexShrink: 0, paddingRight: 8 }}>
        <Form.Item name={['items', itemIndex, 'type']} noStyle rules={[{ required: true, message: '请选择' }]}>
          <Select placeholder="请选择" options={QUALIFICATION_TYPE_OPTIONS} size="small" style={{ width: '100%' }} />
        </Form.Item>
      </div>
      {/* 值（联动） */}
      <div style={{ width: 160, flexShrink: 0, paddingRight: 8 }}>
        <Form.Item name={['items', itemIndex, 'value']} noStyle rules={[{ required: true, message: '请选择' }]}>
          <Select
            placeholder="请选择"
            size="small"
            style={{ width: '100%' }}
            options={getValueOptions(typeValue)}
          />
        </Form.Item>
      </div>
      {/* 比较 */}
      <div style={{ width: 90, flexShrink: 0, paddingRight: 8 }}>
        <Form.Item name={['items', itemIndex, 'comparison']} noStyle>
          <Select placeholder="比较" options={COMPARISON_OPTIONS} size="small" style={{ width: '100%' }} />
        </Form.Item>
      </div>
      {/* 年限 */}
      <div style={{ width: 70, flexShrink: 0, paddingRight: 8 }}>
        <Form.Item name={['items', itemIndex, 'years']} noStyle>
          <InputNumber placeholder="年" min={0} size="small" style={{ width: '100%' }} />
        </Form.Item>
      </div>
      {/* 必须 */}
      <div style={{ width: 50, flexShrink: 0, textAlign: 'center' }}>
        <Form.Item name={['items', itemIndex, 'required']} noStyle valuePropName="checked">
          <Checkbox />
        </Form.Item>
      </div>
      {/* 操作 */}
      <div style={{ flex: 1 }}>
        <Button type="link" size="small" danger icon={<DeleteOutlined />}
          onClick={onRemove} />
      </div>
    </div>
  )
}

// ==================== 准入条件 + 有效期（共享组件） ====================

const SimpleQualificationSection: React.FC = () => {
  const labelCol = { span: 6 }
  const wrapperCol = { span: 18 }

  return (
    <>
      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.validityType !== cur.validityType}>
        {({ getFieldValue }) => {
          const validityType = getFieldValue('validityType')
          return (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="复核周期" name="monitoringCycle" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
                      <InputNumber placeholder="请输入月数" min={1} style={{ width: 'calc(100% - 32px)' }} />
                      <span>月</span>
                    </span>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="有效期" name="validityType" rules={[{ required: true, message: '请选择有效期' }]} labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Radio.Group>
                        <Radio value="permanent">永久</Radio>
                        <Radio value="limited">限制</Radio>
                      </Radio.Group>
                      {validityType === 'limited' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Form.Item name="validityMonths" rules={[{ required: true, message: '请输入月份' }]} style={{ marginBottom: 0, width: 110 }}>
                            <InputNumber placeholder="请输入月份" min={1} style={{ width: 100 }} />
                          </Form.Item>
                          <span>月</span>
                        </span>
                      )}
                    </span>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="默认权限" name="fixedPermission" valuePropName="checked" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <Switch style={{ marginLeft: 0 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="允许破格" name="allowException" valuePropName="checked" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <Switch style={{ marginLeft: 0 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="状态" name="status" valuePropName="checked" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <Switch checkedChildren="启用" unCheckedChildren="停用" style={{ marginLeft: 0 }} />
                  </Form.Item>
                </Col>
                <Col span={12} />
              </Row>
            </>
          )
        }}
      </Form.Item>

      <Tabs
        items={[
          {
            key: 'qualification',
            label: '准入条件',
            children: <QualificationTable qualificationType="default" />,
          },
        ]}
      />

      <div style={{
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: 4,
        padding: '10px 16px',
        marginBottom: 16,
        fontSize: 12,
        lineHeight: '22px',
        color: '#096dd9',
      }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>说明：</div>
        <div>1、非必须条件满足时，在弹窗提醒后可继续提交申请；</div>
        <div>2、职称、职务使用聘用日期计算年限；</div>
        <div>3、资质证书、学位使用获得日期计算年限。</div>
      </div>
    </>
  )
}

const QualificationSection: React.FC = () => {
  const [qualificationType, setQualificationType] = useState('inpatient')
  const labelCol = { span: 6 }
  const wrapperCol = { span: 18 }

  return (
    <>
      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.validityType !== cur.validityType}>
        {({ getFieldValue }) => {
          const validityType = getFieldValue('validityType')
          return (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="复核周期" name="monitoringCycle" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
                      <InputNumber placeholder="请输入月数" min={1} style={{ width: 'calc(100% - 32px)' }} />
                      <span>月</span>
                    </span>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="有效期" name="validityType" rules={[{ required: true, message: '请选择有效期' }]} labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Radio.Group>
                        <Radio value="permanent">永久</Radio>
                        <Radio value="limited">限制</Radio>
                      </Radio.Group>
                      {validityType === 'limited' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Form.Item name="validityMonths" rules={[{ required: true, message: '请输入月份' }]} style={{ marginBottom: 0, width: 110 }}>
                            <InputNumber placeholder="请输入月份" min={1} style={{ width: 100 }} />
                          </Form.Item>
                          <span>月</span>
                        </span>
                      )}
                    </span>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="默认权限" name="fixedPermission" valuePropName="checked" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <Switch style={{ marginLeft: 0 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="允许破格" name="allowException" valuePropName="checked" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <Switch style={{ marginLeft: 0 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="状态" name="status" valuePropName="checked" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
                    <Switch checkedChildren="启用" unCheckedChildren="停用" style={{ marginLeft: 0 }} />
                  </Form.Item>
                </Col>
                <Col span={12} />
              </Row>
            </>
          )
        }}
      </Form.Item>

      <Tabs
        items={[
          {
            key: 'qualification',
            label: '准入条件',
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Radio.Group
                    value={qualificationType}
                    onChange={(e) => setQualificationType(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="inpatient">住院</Radio.Button>
                    <Radio.Button value="outpatient">门诊</Radio.Button>
                  </Radio.Group>
                </div>
                <QualificationTable qualificationType={qualificationType} />
              </>
            ),
          },
        ]}
      />

      {/* 说明 */}
      <div style={{
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: 4,
        padding: '10px 16px',
        marginBottom: 16,
        fontSize: 12,
        lineHeight: '22px',
        color: '#096dd9',
      }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>说明：</div>
        <div>1、非必须条件满足时，在弹窗提醒后可继续提交申请；</div>
        <div>2、职称、职务使用聘用日期计算年限；</div>
        <div>3、资质证书、学位使用获得日期计算年限。</div>
      </div>
    </>
  )
}

/** 手术等级 */
const SurgeryLevelForm: React.FC = () => {
  const [surgeryRole, setSurgeryRole] = useState('surgeon')
  const validityType = Form.useWatch('validityType')
  const labelCol = { span: 6 }
  const wrapperCol = { span: 18 }

  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]} labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
            <Input placeholder="请输入权限名称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="三方ID" name="code" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
            <Input placeholder="请输入三方ID" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="等级" name="level" rules={[{ required: true, message: '请选择等级' }]} labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
            <Select placeholder="请选择等级" options={[
              { label: '一级', value: '一级' },
              { label: '二级', value: '二级' },
              { label: '三级', value: '三级' },
              { label: '四级', value: '四级' },
            ]} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="复核周期" name="monitoringCycle" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
              <InputNumber placeholder="请输入月数" min={1} style={{ width: 'calc(100% - 32px)' }} />
              <span>月</span>
            </span>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="有效期" name="validityType" rules={[{ required: true, message: '请选择有效期' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio.Group>
                <Radio value="permanent">永久</Radio>
                <Radio value="limited">限制</Radio>
              </Radio.Group>
              {validityType === 'limited' && (
                <>
                  <Form.Item name="validityMonths" rules={[{ required: true, message: '请输入月份' }]} style={{ marginBottom: 0, width: 110 }}>
                    <InputNumber placeholder="请输入月份" min={1} style={{ width: 100 }} />
                  </Form.Item>
                  <span>月</span>
                </>
              )}
            </span>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="默认权限" name="fixedPermission" valuePropName="checked" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Switch style={{ marginLeft: 0 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="允许破格" name="allowException" valuePropName="checked" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Switch style={{ marginLeft: 0 }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="状态" name="status" valuePropName="checked" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Switch checkedChildren="启用" unCheckedChildren="停用" style={{ marginLeft: 0 }} />
          </Form.Item>
        </Col>
        <Col span={12} />
      </Row>

      <Tabs
        items={[
          {
            key: 'qualification',
            label: '准入条件',
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Radio.Group
                    value={surgeryRole}
                    onChange={(e) => setSurgeryRole(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="surgeon">主刀</Radio.Button>
                    <Radio.Button value="firstAssistant">一助</Radio.Button>
                    <Radio.Button value="order">开单</Radio.Button>
                  </Radio.Group>
                </div>
                <QualificationTable qualificationType={surgeryRole} />
              </>
            ),
          },
        ]}
      />

      <div style={{
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: 4,
        padding: '10px 16px',
        marginBottom: 16,
        fontSize: 12,
        lineHeight: '22px',
        color: '#096dd9',
      }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>说明：</div>
        <div>1、非必须条件满足时，在弹窗提醒后可继续提交申请；</div>
        <div>2、职称、职务使用聘用日期计算年限；</div>
        <div>3、资质证书、学位使用获得日期计算年限。</div>
      </div>
    </>
  )
}

/** 手术目录 - 技术目录模拟数据（用于权限名称模糊查询） */
const MOCK_SURGERY_CATALOG = [
  { code: 'SS001', techName: '腹腔镜胆囊切除术', surgeryLevel: '三级', techCategory: '限制型' },
  { code: 'SS002', techName: '阑尾切除术', surgeryLevel: '二级', techCategory: '非限制型' },
  { code: 'SS003', techName: '甲状腺次全切除术', surgeryLevel: '三级', techCategory: '限制型' },
  { code: 'SS004', techName: '经皮冠状动脉介入术', surgeryLevel: '四级', techCategory: '限制型' },
  { code: 'SS005', techName: '胃镜下息肉摘除术', surgeryLevel: '二级', techCategory: '非限制型' },
  { code: 'SS006', techName: '腹腔镜阑尾切除术', surgeryLevel: '二级', techCategory: '非限制型' },
  { code: 'SS007', techName: '肝脏部分切除术', surgeryLevel: '四级', techCategory: '限制型' },
  { code: 'SS008', techName: '膝关节镜手术', surgeryLevel: '三级', techCategory: '限制型' },
  { code: 'SS009', techName: '冠状动脉旁路移植术', surgeryLevel: '四级', techCategory: '限制型' },
  { code: 'SS010', techName: '胆囊造瘘术', surgeryLevel: '一级', techCategory: '非限制型' },
]

interface SurgeryCatalogFormProps {
  permissionName: string
  code: string
  onPermissionNameChange: (value: string) => void
  onCodeChange: (value: string) => void
  onOpenTechPicker: () => void
}

/** 手术目录 */
const SurgeryCatalogForm: React.FC<SurgeryCatalogFormProps> = ({
  permissionName,
  code,
  onPermissionNameChange,
  onCodeChange,
  onOpenTechPicker,
}) => {
  const validityType = Form.useWatch('validityType')
  const [surgeryRole, setSurgeryRole] = useState('surgeon')

  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="权限名称" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <span style={{ display: 'flex', gap: 8 }}>
              <Input 
                placeholder="请输入权限名称" 
                style={{ flex: 1 }} 
                value={permissionName}
                onChange={(e) => onPermissionNameChange(e.target.value)}
              />
              <Button type="primary" onClick={onOpenTechPicker}>选择</Button>
            </span>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="三方ID" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Input 
              placeholder="请输入三方ID" 
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="复核周期" name="monitoringCycle" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
              <InputNumber placeholder="请输入月数" min={1} style={{ width: 'calc(100% - 32px)' }} />
              <span>月</span>
            </span>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="有效期" name="validityType" rules={[{ required: true, message: '请选择有效期' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio.Group>
                <Radio value="permanent">永久</Radio>
                <Radio value="limited">限制</Radio>
              </Radio.Group>
              {validityType === 'limited' && (
                <>
                  <Form.Item name="validityMonths" rules={[{ required: true, message: '请输入月份' }]} style={{ marginBottom: 0, width: 110 }}>
                    <InputNumber placeholder="请输入月份" min={1} style={{ width: 100 }} />
                  </Form.Item>
                  <span>月</span>
                </>
              )}
            </span>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="默认权限" name="fixedPermission" valuePropName="checked" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Switch style={{ marginLeft: 0 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="允许破格" name="allowException" valuePropName="checked" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Switch style={{ marginLeft: 0 }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="状态" name="status" valuePropName="checked" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Switch checkedChildren="启用" unCheckedChildren="停用" style={{ marginLeft: 0 }} />
          </Form.Item>
        </Col>
        <Col span={12} />
      </Row>

      <Tabs
        items={[
          {
            key: 'qualification',
            label: '准入条件',
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Radio.Group
                    value={surgeryRole}
                    onChange={(e) => setSurgeryRole(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="surgeon">主刀</Radio.Button>
                    <Radio.Button value="firstAssistant">一助</Radio.Button>
                    <Radio.Button value="order">开单</Radio.Button>
                  </Radio.Group>
                </div>
                <QualificationTable qualificationType={surgeryRole} />
              </>
            ),
          },
        ]}
      />

      <div style={{
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: 4,
        padding: '10px 16px',
        marginBottom: 16,
        fontSize: 12,
        lineHeight: '22px',
        color: '#096dd9',
      }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>说明：</div>
        <div>1、非必须条件满足时，在弹窗提醒后可继续提交申请；</div>
        <div>2、职称、职务使用聘用日期计算年限；</div>
        <div>3、资质证书、学位使用获得日期计算年限。</div>
      </div>
    </>
  )
}

/** 临床用血 */
const BloodForm: React.FC = () => (
  <>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Input placeholder="请输入权限名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="三方ID" name="code" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Input placeholder="请输入三方ID" />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="血液品种" name="bloodType" rules={[{ required: true, message: '请选择血液品种' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Select
            placeholder="请选择血液品种"
            options={[
              { label: '红细胞', value: '红细胞' },
              { label: '全血', value: '全血' },
              { label: '血浆', value: '血浆' },
              { label: '血小板', value: '血小板' },
            ]}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="用血量上限(ml)" name="maxBloodVolume" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <InputNumber placeholder="请输入用血量上限" min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Col>
    </Row>
    <SimpleQualificationSection />
  </>
)

/** 麻醉等级 */
const AnesthesiaForm: React.FC = () => (
  <>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Input placeholder="请输入权限名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="三方ID" name="code" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Input placeholder="请输入三方ID" />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="麻醉等级" name="level" rules={[{ required: true, message: '请选择麻醉等级' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Select
            placeholder="请选择麻醉等级"
            options={[
              { label: '一级', value: '一级' },
              { label: '二级', value: '二级' },
              { label: '三级', value: '三级' },
              { label: '四级', value: '四级' },
              { label: '五级', value: '五级' },
              { label: '六级', value: '六级' },
            ]}
          />
        </Form.Item>
      </Col>
    </Row>
    <SimpleQualificationSection />
  </>
)

/** 操作 - 操作目录模拟数据（用于权限名称模糊查询） */
const MOCK_OPERATION_CATALOG = [
  { code: 'CZ001', techName: '经皮穿刺活检术', operationLevel: '二级', techCategory: '限制型' },
  { code: 'CZ002', techName: '胃镜检查术', operationLevel: '一级', techCategory: '非限制型' },
  { code: 'CZ003', techName: '结肠镜检查术', operationLevel: '二级', techCategory: '非限制型' },
  { code: 'CZ004', techName: '经皮肾穿刺造瘘术', operationLevel: '三级', techCategory: '限制型' },
  { code: 'CZ005', techName: '支气管镜检查术', operationLevel: '二级', techCategory: '非限制型' },
  { code: 'CZ006', techName: '心导管检查术', operationLevel: '三级', techCategory: '限制型' },
  { code: 'CZ007', techName: '经皮椎体成形术', operationLevel: '三级', techCategory: '限制型' },
  { code: 'CZ008', techName: '胸腔穿刺术', operationLevel: '一级', techCategory: '非限制型' },
  { code: 'CZ009', techName: '腹腔穿刺术', operationLevel: '一级', techCategory: '非限制型' },
  { code: 'CZ010', techName: '经皮冠状动脉介入术', operationLevel: '四级', techCategory: '限制型' },
]

/** 操作 */
const OperationForm: React.FC = () => {
  const form = Form.useFormInstance()
  const [searchText, setSearchText] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)

  // 模糊查询
  const filteredResults = useMemo(() => {
    if (!searchText.trim()) return []
    const keyword = searchText.trim().toLowerCase()
    return MOCK_OPERATION_CATALOG.filter(
      (item) => item.techName.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword)
    )
  }, [searchText])

  // 选中某行后回填表单
  const handleSelect = (record: typeof MOCK_OPERATION_CATALOG[number]) => {
    form.setFieldsValue({
      permissionName: record.techName,
      code: record.code,
      level: record.operationLevel,
      techCategory: record.techCategory,
    })
    setPopoverOpen(false)
    setSearchText(record.techName)
  }

  const searchColumns: ColumnsType<typeof MOCK_OPERATION_CATALOG[number]> = [
    { title: '编码', dataIndex: 'code', width: 80 },
    { title: '技术名称', dataIndex: 'techName', width: 160 },
    { title: '操作级别', dataIndex: 'operationLevel', width: 80 },
    { title: '技术类别', dataIndex: 'techCategory', width: 90 },
  ]

  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]}>
            <Popover
              open={popoverOpen && filteredResults.length > 0}
              onOpenChange={setPopoverOpen}
              placement="bottomLeft"
              trigger="focus"
              content={
                <div style={{ width: 460 }}>
                  <Table
                    dataSource={filteredResults}
                    columns={searchColumns}
                    pagination={false}
                    size="small"
                    rowKey="code"
                    onRow={(record) => ({
                      onClick: () => handleSelect(record),
                      style: { cursor: 'pointer' },
                    })}
                  />
                </div>
              }
              overlayStyle={{ maxWidth: 520 }}
            >
              <Input
                placeholder="输入名称查询操作目录"
                allowClear
                suffix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  form.setFieldValue('permissionName', e.target.value)
                  setPopoverOpen(true)
                }}
              />
            </Popover>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="三方ID" name="code" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Input placeholder="请输入三方ID" />
          </Form.Item>
        </Col>
      </Row>
      <SimpleQualificationSection />
    </>
  )
}

/** 报告 */
const ReportForm: React.FC = () => (
  <>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Input placeholder="请输入权限名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="三方ID" name="code" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Input placeholder="请输入三方ID" />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="报告类型" name="reportType" rules={[{ required: true, message: '请选择报告类型' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Select
            placeholder="请选择报告类型"
            options={[
              { label: '检验报告', value: '检验报告' },
              { label: '影像报告', value: '影像报告' },
              { label: '病理报告', value: '病理报告' },
              { label: '心电报告', value: '心电报告' },
              { label: '司法鉴定报告', value: '司法鉴定报告' },
            ]}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="签发权限" name="issuePermission" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Select
            placeholder="请选择签发权限"
            options={[
              { label: '报告签发', value: '报告签发' },
              { label: '报告审核', value: '报告审核' },
              { label: '报告复核', value: '报告复核' },
            ]}
          />
        </Form.Item>
      </Col>
    </Row>
    <SimpleQualificationSection />
  </>
)

/** 设备 */
const DeviceForm: React.FC = () => {
  const [deviceRole, setDeviceRole] = useState('operation')
  const validityType = Form.useWatch('validityType')

  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Input placeholder="请输入权限名称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="三方ID" name="code" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Input placeholder="请输入三方ID" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="设备类型" name="deviceType" rules={[{ required: true, message: '请选择设备类型' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Select
              placeholder="请选择设备类型"
              options={[
                { label: '大型设备', value: '大型设备' },
                { label: '特种设备', value: '特种设备' },
                { label: '常规设备', value: '常规设备' },
                { label: '急救设备', value: '急救设备' },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="复核周期" name="monitoringCycle" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}>
              <InputNumber placeholder="请输入月数" min={1} style={{ width: 'calc(100% - 32px)' }} />
              <span>月</span>
            </span>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="有效期" name="validityType" rules={[{ required: true, message: '请选择有效期' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio.Group>
                <Radio value="permanent">永久</Radio>
                <Radio value="limited">限制</Radio>
              </Radio.Group>
              {validityType === 'limited' && (
                <>
                  <Form.Item name="validityMonths" rules={[{ required: true, message: '请输入月份' }]} style={{ marginBottom: 0, width: 110 }}>
                    <InputNumber placeholder="请输入月份" min={1} style={{ width: 100 }} />
                  </Form.Item>
                  <span>月</span>
                </>
              )}
            </span>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="默认权限" name="fixedPermission" valuePropName="checked" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Switch style={{ marginLeft: 0 }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="允许破格" name="allowException" valuePropName="checked" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Switch style={{ marginLeft: 0 }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="状态" name="status" valuePropName="checked" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Switch checkedChildren="启用" unCheckedChildren="停用" style={{ marginLeft: 0 }} />
          </Form.Item>
        </Col>
        <Col span={12} />
      </Row>

      <Tabs
        items={[
          {
            key: 'qualification',
            label: '准入条件',
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Radio.Group
                    value={deviceRole}
                    onChange={(e) => setDeviceRole(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="operation">操作</Radio.Button>
                    <Radio.Button value="maintenance">维修</Radio.Button>
                  </Radio.Group>
                </div>
                <QualificationTable qualificationType={deviceRole} />
              </>
            ),
          },
        ]}
      />

      <div style={{
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: 4,
        padding: '10px 16px',
        marginBottom: 16,
        fontSize: 12,
        lineHeight: '22px',
        color: '#096dd9',
      }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>说明：</div>
        <div>1、非必须条件满足时，在弹窗提醒后可继续提交申请；</div>
        <div>2、职称、职务使用聘用日期计算年限；</div>
        <div>3、资质证书、学位使用获得日期计算年限。</div>
      </div>
    </>
  )
}

/** 病理 */
const PathologyForm: React.FC = () => (
  <>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Input placeholder="请输入权限名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="三方ID" name="code" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Input placeholder="请输入三方ID" />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="病理类型" name="pathologyType" rules={[{ required: true, message: '请选择病理类型' }]} labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Select
            placeholder="请选择病理类型"
            options={[
              { label: '组织病理', value: '组织病理' },
              { label: '细胞病理', value: '细胞病理' },
              { label: '术中冰冻', value: '术中冰冻' },
              { label: '免疫组化', value: '免疫组化' },
            ]}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="诊断权限" name="diagnosisPermission" labelAlign="left" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Select
            placeholder="请选择诊断权限"
            options={[
              { label: '初诊', value: '初诊' },
              { label: '审核', value: '审核' },
              { label: '签发', value: '签发' },
            ]}
          />
        </Form.Item>
      </Col>
    </Row>
    <SimpleQualificationSection />
  </>
)

// ==================== 各分类差异化表单（两列布局） ====================

/** 处方权 */
const PrescriptionForm: React.FC = () => {
  const prescriptionType = Form.useWatch('prescriptionType', { preserve: true })
  const labelCol = { span: 6 }
  const wrapperCol = { span: 18 }

  return (
    <>
      {/* 第一行：权限名称 + 编码（非必填） */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="权限名称" name="permissionName" rules={[{ required: true, message: '请输入权限名称' }]} labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
            <Input placeholder="请输入权限名称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="三方ID" name="code" labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
            <Input placeholder="请输入三方ID" />
          </Form.Item>
        </Col>
      </Row>

      {/* 第二行：处方类型 + 条件子选项 */}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="处方类型" name="prescriptionType" rules={[{ required: true, message: '请选择处方类型' }]} labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
            <Select
              placeholder="请选择处方类型"
              options={[
                { label: '普通处方', value: '普通处方' },
                { label: '抗菌药物', value: '抗菌药物' },
                { label: '精神药物', value: '精神药物' },
                { label: '麻醉药物', value: '麻醉药物' },
                { label: '毒性药物', value: '毒性药物' },
                { label: '放射性药物', value: '放射性药物' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          {prescriptionType === '抗菌药物' && (
            <Form.Item label="抗菌药物等级" name="antibioticLevel" rules={[{ required: true, message: '请选择抗菌药物等级' }]} labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
              <Select
                placeholder="请选择等级"
                options={[
                  { label: '限制级', value: '限制级' },
                  { label: '非限制级', value: '非限制级' },
                  { label: '特殊级', value: '特殊级' },
                ]}
              />
            </Form.Item>
          )}
          {prescriptionType === '精神药物' && (
            <Form.Item label="精神药物等级" name="psychotropicLevel" rules={[{ required: true, message: '请选择精神药物等级' }]} labelAlign="left" labelCol={labelCol} wrapperCol={wrapperCol}>
              <Select
                placeholder="请选择等级"
                options={[
                  { label: '一类', value: '一类' },
                  { label: '二类', value: '二类' },
                ]}
              />
            </Form.Item>
          )}
        </Col>
      </Row>

      {/* 准入条件 + 有效期 + 默认权限 + 监测周期 */}
      <QualificationSection />
    </>
  )
}

// ==================== 分类→表单 映射 ====================

const categoryFormMap: Record<string, React.FC> = {
  '处方权': PrescriptionForm,
  '手术等级': SurgeryLevelForm,
  '临床用血': BloodForm,
  '麻醉等级': AnesthesiaForm,
  '操作': OperationForm,
  '报告': ReportForm,
  '设备': DeviceForm,
  '病理': PathologyForm,
}

// ==================== 详情渲染 ====================

const renderDetailContent = (record: PermissionDetailRecord) => {
  const fields: { label: string; value: React.ReactNode }[] = [
    { label: '权限分类', value: <Tag color="blue">{record.category}</Tag> },
    { label: '三方ID', value: record.code },
    { label: '权限名称', value: record.permissionName },
  ]

  // 根据分类添加特有字段
  switch (record.category) {
    case '处方权':
      if (record.prescriptionType) fields.push({ label: '处方类型', value: record.prescriptionType })
      break
    case '手术等级':
      if (record.level) fields.push({ label: '等级', value: record.level })
      break
    case '手术目录':
      if (record.level) fields.push({ label: '等级', value: record.level })
      if (record.techCategory) fields.push({ label: '技术类别', value: record.techCategory })
      if (record.icdCode) fields.push({ label: 'ICD编码', value: record.icdCode })
      if (record.techStatus) fields.push({ label: '技术状态', value: record.techStatus })
      break
    case '新技术目录':
      if (record.level) fields.push({ label: '等级', value: record.level })
      if (record.techCategory) fields.push({ label: '技术类别', value: record.techCategory })
      if (record.icdCode) fields.push({ label: 'ICD编码', value: record.icdCode })
      if (record.techStatus) fields.push({ label: '技术状态', value: record.techStatus })
      break
    case '临床用血':
      if (record.bloodType) fields.push({ label: '血液品种', value: record.bloodType })
      if (record.bloodVolumeLimit) fields.push({ label: '用血量上限', value: `${record.bloodVolumeLimit}U` })
      break
    case '麻醉等级':
      if (record.level) fields.push({ label: '麻醉等级', value: record.level })
      break
    case '报告':
      if (record.reportType) fields.push({ label: '报告类型', value: record.reportType })
      if (record.issuePermission) fields.push({ label: '签发权限', value: record.issuePermission })
      break
    case '设备':
      if (record.deviceType) fields.push({ label: '设备类型', value: record.deviceType })
      break
    case '病理':
      if (record.pathologyType) fields.push({ label: '病理类型', value: record.pathologyType })
      if (record.diagnosisPermission) fields.push({ label: '诊断权限', value: record.diagnosisPermission })
      break
  }

  // 通用尾部字段
  fields.push(
    { label: '默认权限', value: <Tag color={record.fixedPermission ? 'green' : 'default'}>{record.fixedPermission ? '是' : '否'}</Tag> },
    { label: '允许破格', value: <Tag color={record.allowException ? 'green' : 'default'}>{record.allowException ? '是' : '否'}</Tag> },
    { label: '复核周期', value: record.monitoringCycle ? `${record.monitoringCycle}月` : '' },
    { label: '复核周期', value: record.monitoringCycle ? `${record.monitoringCycle}月` : '' },
    { label: '有效期', value: record.validityPeriod },
    { label: '状态', value: <Tag color={record.status ? 'green' : 'red'}>{record.status ? '启用' : '停用'}</Tag> },
  )

  return (
    <div style={{ padding: '8px 0' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {fields.map((f) => (
          <div key={f.label}><strong>{f.label}：</strong>{f.value}</div>
        ))}
      </Space>
    </div>
  )
}

// ==================== 主组件 ====================

const PermissionCatalog: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('处方权')
  const [searchText, setSearchText] = useState('')
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PermissionDetailRecord | null>(null)
  const [viewingRecord, setViewingRecord] = useState<PermissionDetailRecord | null>(null)
  const [form] = Form.useForm()

  // 选择技术抽屉状态
  const [techPickerOpen, setTechPickerOpen] = useState(false)
  const [techSearchText, setTechSearchText] = useState('')
  const [selectedTechName, setSelectedTechName] = useState('')
  const [selectedTechCode, setSelectedTechCode] = useState('')

  const [data, setData] = useState<PermissionDetailRecord[]>([
    // 处方权
    { id: '1', code: 'CFQ-001', permissionName: '普通处方权', fixedPermission: true, allowException: false, monitoringCycle: 12, regularMonitoring: true, level: '', validityPeriod: '长期', status: true, category: '处方权', prescriptionType: '普通处方' },
    { id: '2', code: 'CFQ-002', permissionName: '抗菌药物处方权', fixedPermission: false, allowException: true, monitoringCycle: 6, regularMonitoring: true, level: '', validityPeriod: '2年', status: true, category: '处方权', prescriptionType: '抗菌药物处方' },
    { id: '3', code: 'CFQ-003', permissionName: '麻醉处方权', fixedPermission: true, allowException: false, monitoringCycle: 6, regularMonitoring: true, level: '', validityPeriod: '1年', status: true, category: '处方权', prescriptionType: '麻醉处方' },
    // 手术等级
    { id: '4', code: 'SSDJ-001', permissionName: '一级手术权限', fixedPermission: true, allowException: false, monitoringCycle: 12, regularMonitoring: true, level: '一级', validityPeriod: '长期', status: true, category: '手术等级' },
    { id: '5', code: 'SSDJ-002', permissionName: '二级手术权限', fixedPermission: true, allowException: true, monitoringCycle: 12, regularMonitoring: true, level: '二级', validityPeriod: '3年', status: true, category: '手术等级' },
    { id: '6', code: 'SSDJ-003', permissionName: '三级手术权限', fixedPermission: true, allowException: true, monitoringCycle: 6, regularMonitoring: true, level: '三级', validityPeriod: '2年', status: true, category: '手术等级' },
    { id: '7', code: 'SSDJ-004', permissionName: '四级手术权限', fixedPermission: true, allowException: false, monitoringCycle: 6, regularMonitoring: true, level: '四级', validityPeriod: '1年', status: true, category: '手术等级' },
    // 手术目录
    { id: '8', code: 'SSML-001', permissionName: '腹腔镜胆囊切除术', fixedPermission: false, allowException: true, monitoringCycle: undefined, regularMonitoring: false, level: '三级', validityPeriod: '长期', status: true, category: '手术目录', techCategory: '限制型', icdCode: '51.21', techStatus: '常规' },
    { id: '9', code: 'SSML-002', permissionName: '阑尾切除术', fixedPermission: false, allowException: false, monitoringCycle: 12, regularMonitoring: true, level: '二级', validityPeriod: '2年', status: true, category: '手术目录', techCategory: '非限制型', icdCode: '47.09', techStatus: '常规' },
    // 新技术目录
    { id: '21', code: 'XSJ-001', permissionName: '机器人辅助手术', fixedPermission: false, allowException: true, monitoringCycle: 6, regularMonitoring: true, level: '四级', validityPeriod: '1年', status: true, category: '新技术目录', techCategory: '限制型', icdCode: '17.41', techStatus: '试运行' },
    { id: '22', code: 'XSJ-002', permissionName: '基因检测诊断', fixedPermission: false, allowException: true, monitoringCycle: undefined, regularMonitoring: false, level: '三级', validityPeriod: '2年', status: true, category: '新技术目录', techCategory: '限制型', icdCode: '86.0', techStatus: '常规' },
    // 临床用血
    { id: '10', code: 'LCYX-001', permissionName: '红细胞输注权限', fixedPermission: true, allowException: false, monitoringCycle: 6, regularMonitoring: true, level: '', validityPeriod: '1年', status: true, category: '临床用血', bloodType: '红细胞', bloodVolumeLimit: 2 },
    { id: '11', code: 'LCYX-002', permissionName: '血浆输注权限', fixedPermission: true, allowException: true, monitoringCycle: 6, regularMonitoring: true, level: '', validityPeriod: '1年', status: true, category: '临床用血', bloodType: '血浆', bloodVolumeLimit: 4 },
    // 麻醉等级
    { id: '12', code: 'MZDJ-001', permissionName: '一级麻醉权限', fixedPermission: true, allowException: false, monitoringCycle: 12, regularMonitoring: true, level: '一级', validityPeriod: '长期', status: true, category: '麻醉等级' },
    { id: '13', code: 'MZDJ-002', permissionName: '三级麻醉权限', fixedPermission: true, allowException: true, monitoringCycle: 6, regularMonitoring: true, level: '三级', validityPeriod: '2年', status: true, category: '麻醉等级' },
    // 操作
    { id: '14', code: 'CZ-001', permissionName: '经皮穿刺活检术', fixedPermission: false, allowException: true, monitoringCycle: undefined, regularMonitoring: false, level: '二级', validityPeriod: '2年', status: true, category: '操作' },
    { id: '15', code: 'CZ-002', permissionName: '胃镜检查术', fixedPermission: true, allowException: false, monitoringCycle: 12, regularMonitoring: true, level: '一级', validityPeriod: '1年', status: true, category: '操作' },
    // 报告
    { id: '16', code: 'BG-001', permissionName: '检验报告签发权', fixedPermission: true, allowException: false, monitoringCycle: 12, regularMonitoring: true, level: '', validityPeriod: '长期', status: true, category: '报告', reportType: '检验报告', issuePermission: '报告签发' },
    { id: '17', code: 'BG-002', permissionName: '影像报告审核权', fixedPermission: true, allowException: true, monitoringCycle: 12, regularMonitoring: true, level: '', validityPeriod: '2年', status: true, category: '报告', reportType: '影像报告', issuePermission: '报告审核' },
    // 设备
    { id: '18', code: 'SB-001', permissionName: '大型设备操作权', fixedPermission: true, allowException: true, monitoringCycle: 12, regularMonitoring: true, level: '', validityPeriod: '2年', status: true, category: '设备', deviceType: '大型设备' },
    { id: '19', code: 'SB-002', permissionName: '特种设备操作权', fixedPermission: true, allowException: false, monitoringCycle: 6, regularMonitoring: true, level: '', validityPeriod: '1年', status: false, category: '设备', deviceType: '特种设备' },
    // 病理
    { id: '20', code: 'BL-001', permissionName: '病理诊断报告权', fixedPermission: true, allowException: false, monitoringCycle: 12, regularMonitoring: true, level: '', validityPeriod: '长期', status: true, category: '病理', pathologyType: '组织病理', diagnosisPermission: '签发' },
  ])

  const filteredData = useMemo(() => {
    let result = data.filter((item) => item.category === activeCategory)
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase()
      result = result.filter(
        (item) =>
          item.code.toLowerCase().includes(keyword) ||
          item.permissionName.toLowerCase().includes(keyword)
      )
    }
    return result
  }, [data, activeCategory, searchText])

  /** 根据当前分类动态生成表格列 */
  const columns: ColumnsType<PermissionDetailRecord> = useMemo(() => {
    // 通用列
    const baseColumns: ColumnsType<PermissionDetailRecord> = [
      { 
        title: '序号', 
        key: 'index', 
        width: 60, 
        align: 'center',
        render: (_: unknown, __: PermissionDetailRecord, index: number) => index + 1,
      },
      { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', width: 180 },
    ]

    // 各分类特有列
    const categorySpecificColumns: Record<string, ColumnsType<PermissionDetailRecord>> = {
      '处方权': [
        {
          title: '处方类型', dataIndex: 'prescriptionType', key: 'prescriptionType', width: 120,
        },
      ],
      '手术等级': [
        {
          title: '等级', dataIndex: 'level', key: 'level', width: 80,
        },
      ],
      '手术目录': [
        {
          title: '等级', dataIndex: 'level', key: 'level', width: 80,
        },
        {
          title: '技术类别', dataIndex: 'techCategory', key: 'techCategory', width: 100,
        },
        {
          title: 'ICD编码', dataIndex: 'icdCode', key: 'icdCode', width: 100,
        },
        {
          title: '技术状态', dataIndex: 'techStatus', key: 'techStatus', width: 100,
        },
      ],
      '新技术目录': [
        {
          title: '等级', dataIndex: 'level', key: 'level', width: 80,
        },
        {
          title: '技术类别', dataIndex: 'techCategory', key: 'techCategory', width: 100,
        },
        {
          title: 'ICD编码', dataIndex: 'icdCode', key: 'icdCode', width: 100,
        },
        {
          title: '技术状态', dataIndex: 'techStatus', key: 'techStatus', width: 100,
        },
      ],
      '临床用血': [
        {
          title: '血液品种', dataIndex: 'bloodType', key: 'bloodType', width: 100,
        },
        {
          title: '用血量上限', dataIndex: 'bloodVolumeLimit', key: 'bloodVolumeLimit', width: 110,
          render: (val: number) => val ? `${val}U` : '',
        },
      ],
      '麻醉等级': [
        {
          title: '麻醉等级', dataIndex: 'level', key: 'level', width: 100,
        },
      ],
      '操作': [],
      '报告': [
        {
          title: '报告类型', dataIndex: 'reportType', key: 'reportType', width: 110,
        },
        {
          title: '签发权限', dataIndex: 'issuePermission', key: 'issuePermission', width: 110,
        },
      ],
      '设备': [
        {
          title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', width: 110,
        },
      ],
      '病理': [
        {
          title: '病理类型', dataIndex: 'pathologyType', key: 'pathologyType', width: 110,
        },
        {
          title: '诊断权限', dataIndex: 'diagnosisPermission', key: 'diagnosisPermission', width: 110,
        },
      ],
    }

    // 通用尾部列
    const tailColumns: ColumnsType<PermissionDetailRecord> = [
      {
        title: '默认权限', dataIndex: 'fixedPermission', key: 'fixedPermission', width: 100,
        render: (val: boolean) => (
          <Tag color={val ? 'green' : 'default'}>{val ? '是' : '否'}</Tag>
        ),
      },
      {
        title: '允许破格', dataIndex: 'allowException', key: 'allowException', width: 100,
        render: (val: boolean) => (
          <Tag color={val ? 'green' : 'default'}>{val ? '是' : '否'}</Tag>
        ),
      },
      {
        title: '复核周期', dataIndex: 'monitoringCycle', key: 'monitoringCycle', width: 100,
        render: (val: number | undefined) => val ? `${val}月` : '',
      },
      { title: '有效期', dataIndex: 'validityPeriod', key: 'validityPeriod', width: 100 },
      {
        title: '状态', dataIndex: 'status', key: 'status', width: 90,
        render: (status: boolean) => (
          <Tag color={status ? 'green' : 'red'}>{status ? '启用' : '停用'}</Tag>
        ),
      },
      {
        title: '操作', key: 'action', width: 200, fixed: 'right',
        render: (_: unknown, record: PermissionDetailRecord) => (
          <Space size="small">
            <Button type="link" size="small" icon={<EditOutlined />}
              onClick={() => { setEditingRecord(record); form.setFieldsValue(record); setEditDrawerOpen(true) }}>
              修改
            </Button>
            <Popconfirm title="确定删除该权限？" onConfirm={() => { setData(data.filter((item) => item.id !== record.id)); message.success('删除成功') }}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ]

    return [
      ...baseColumns,
      ...(categorySpecificColumns[activeCategory] || []),
      ...tailColumns,
    ]
  }, [activeCategory, data])

  const handleSearch = () => { /* 已在 useMemo 中实时过滤 */ }
  const handleReset = () => { setSearchText('') }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setEditDrawerOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        setData(data.map((item) =>
          item.id === editingRecord.id ? { ...item, ...values } : item
        ))
        message.success('修改成功')
      } else {
        setData([...data, { ...values, id: String(Date.now()), category: activeCategory }])
        message.success('新增成功')
      }
      setEditDrawerOpen(false)
    } catch { /* 表单验证失败 */ }
  }

  /** 处理打开选择技术抽屉 */
  const handleOpenTechPicker = () => {
    setTechPickerOpen(true)
  }

  /** 处理关闭选择技术抽屉 */
  const handleCloseTechPicker = () => {
    setTechPickerOpen(false)
  }

  /** 处理选择技术 */
  const handleSelectTech = (record: typeof MOCK_SURGERY_CATALOG[number]) => {
    setSelectedTechName(record.techName)
    setSelectedTechCode(record.code)
    form.setFieldsValue({
      permissionName: record.techName,
      code: record.code,
    })
    setTechPickerOpen(false)
  }

  /** 选择技术抽屉表格列 */
  const techPickerColumns: ColumnsType<typeof MOCK_SURGERY_CATALOG[number]> = [
    {
      title: '',
      key: 'select',
      width: 50,
      render: (_: unknown, record: typeof MOCK_SURGERY_CATALOG[number]) => (
        <Button type="link" size="small" onClick={() => handleSelectTech(record)}>选择</Button>
      ),
    },
    { title: '序号', key: 'index', width: 60, align: 'center', render: (_: unknown, __: typeof MOCK_SURGERY_CATALOG[number], index: number) => index + 1 },
    { title: '名称', dataIndex: 'techName', key: 'techName', width: 200 },
    { title: '手术级别', dataIndex: 'surgeryLevel', key: 'surgeryLevel', width: 100 },
  ]

  /** 根据当前激活分类渲染对应表单 */
  const renderCategoryForm = () => {
    const category = editingRecord ? editingRecord.category : activeCategory
    
    // 手术目录和新技术目录需要特殊处理
    if (category === '手术目录' || category === '新技术目录') {
      return (
        <SurgeryCatalogForm
          permissionName={selectedTechName}
          code={selectedTechCode}
          onPermissionNameChange={(value) => setSelectedTechName(value)}
          onCodeChange={(value) => setSelectedTechCode(value)}
          onOpenTechPicker={handleOpenTechPicker}
        />
      )
    }
    
    const FormComponent = categoryFormMap[category]
    if (FormComponent) {
      return <FormComponent />
    }
    // 兜底：通用表单（两列）
    return (
      <>
        <Row gutter={16}>
          <Col span={12}><CodeField /></Col>
          <Col span={12}><PermissionNameField /></Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}><LevelField /></Col>
        </Row>
        <QualificationSection />
        <Row gutter={16}>
          <Col span={12}><StatusField /></Col>
        </Row>
      </>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%', background: '#f5f5f5', padding: 16 }}>
      {/* ===== 左侧：分类卡片标签（白色容器） ===== */}
      <div
        style={{
          width: 210,
          flexShrink: 0,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            fontWeight: 600,
            fontSize: 14,
            color: '#1a1a1a',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          权限分类
        </div>
        {categoryItems.map((item) => (
          <div
            key={item.key}
            onClick={() => { setActiveCategory(item.key); setSearchText('') }}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: 13,
              color: activeCategory === item.key ? '#1677ff' : '#333',
              fontWeight: activeCategory === item.key ? 600 : 400,
              background: activeCategory === item.key ? '#e6f4ff' : '#fff',
              borderLeft: activeCategory === item.key ? '3px solid #1677ff' : '3px solid transparent',
              borderBottom: '1px solid #f5f5f5',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== item.key) {
                (e.currentTarget as HTMLElement).style.background = '#fafafa'
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== item.key) {
                (e.currentTarget as HTMLElement).style.background = '#fff'
              }
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* ===== 右侧：查询区 + 权限明细表格（白色容器） ===== */}
      <div
        style={{
          flex: 1,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          padding: 16,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 上方：新增分组按钮（左） + 查询框和按钮（右） */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增
          </Button>
          <Space>
            <Input
              placeholder="名称查询"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 220 }}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        {/* 下方：权限明细表格 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            scroll={{ x: 1070 }}
            size="middle"
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条记录`,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
          />
        </div>
      </div>

      {/* ===== 新增/编辑 Drawer（右侧滑出） ===== */}
      <Drawer
        title={editingRecord ? `修改权限 - ${editingRecord.category}` : `新增权限 - ${activeCategory}`}
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        width={1100}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSave}>
                保存
              </Button>
            </Space>
          </div>
        }
      >
        <div className="catalog-form-wrapper">
          <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            {renderCategoryForm()}
          </Form>
        </div>
      </Drawer>

      {/* ===== 查看详情 Drawer ===== */}
      <Drawer
        title={`权限详情${viewingRecord ? ` - ${viewingRecord.category}` : ''}`}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={1100}
      >
        {viewingRecord && renderDetailContent(viewingRecord)}
      </Drawer>

      {/* ===== 选择技术 Drawer（右侧滑出，作为二级抽屉） ===== */}
      <Drawer
        title="选择技术"
        open={techPickerOpen}
        onClose={handleCloseTechPicker}
        width={500}
        placement="right"
        destroyOnClose
        getContainer={false}
        zIndex={1001}
      >
        <Input
          placeholder="请输入名称"
          style={{ marginBottom: 16 }}
          value={techSearchText}
          onChange={(e) => setTechSearchText(e.target.value)}
          allowClear
        />
        <Table
          dataSource={MOCK_SURGERY_CATALOG.filter((item) => 
            item.techName.toLowerCase().includes(techSearchText.toLowerCase())
          )}
          columns={techPickerColumns}
          pagination={{ pageSize: 10 }}
          rowKey="code"
          size="small"
        />
      </Drawer>
    </div>
  )
}

export default PermissionCatalog
