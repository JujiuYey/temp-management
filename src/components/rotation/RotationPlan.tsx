import React, { useState } from 'react'
import {
  Card,
  Button,
  Input,
  InputNumber,
  Select,
  Tag,
  Form,
  Switch,
  Drawer,
  Table,
  Empty,
  message,
  Popconfirm,
  Descriptions,
  Alert,
  Row,
  Col,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import {
  INITIAL_BASES,
  calcDurationText,
  type BaseRecord,
  type RotationDeptEntry,
} from './rotationShared'

// ==================== 类型定义 ====================

// 计划内每个「实际科室」条目
interface ActualDept {
  institution: string // 机构名称
  deptName: string // 科室名称
  minCapacity: number // 容量下限
  maxCapacity: number // 容量上限
  period: number // 轮转周期数值
  periodUnit: 'month' | 'week' // 轮转周期单位：月 / 周
}

// 计划内每个标准科室的配置（从基地模板初始化，可在计划内单独修改）
interface PlanDeptConfig {
  standardName: string // 标准名称（来自基地）
  basePeriodText: string // 标准周期（来自基地，只读）
  baseRotationType: 'required' | 'optional' // 轮转类型（来自基地，只读）
  actualDepts: ActualDept[] // 实际科室（计划内配置，一行一个）
  year2?: number // 第2年轮转月数
  year3?: number // 第3年轮转月数
  optionalCount?: number // 可选数量（轮转类型为「可选」时必填）
  assignMode?: 'auto' | 'manual' | 'employee' // 分配方式：自动分配 / 手工分配 / 员工选择
  designatedPeriod?: 'none' | 'early' | 'mid' | 'late' // 指定时期：不指定 / 初期 / 中期 / 后期
}

interface RotationPlan {
  id: string
  planName: string
  baseId: string
  baseName: string
  durationText: string
  planYears: 1 | 2 | 3 // 计划年限：决定右侧显示 1/2/3 年轮转列
  status: boolean
  deptConfigs: PlanDeptConfig[]
}

// ==================== 常量 ====================

const BASE_OPTIONS = INITIAL_BASES.map((b) => ({ label: b.baseName, value: b.id }))

const PLAN_YEAR_OPTIONS = [
  { label: '1年', value: 1 },
  { label: '2年', value: 2 },
  { label: '3年', value: 3 },
]

// 机构名称 / 科室名称 下拉选项
const INSTITUTION_OPTIONS = [
  { label: '市第一人民医院', value: '市第一人民医院' },
  { label: '市中心医院', value: '市中心医院' },
  { label: '市中医院', value: '市中医院' },
  { label: '市妇幼保健院', value: '市妇幼保健院' },
  { label: '市人民医院', value: '市人民医院' },
]
const DEPT_NAME_OPTIONS = [
  { label: '心血管内科', value: '心血管内科' },
  { label: '急诊科', value: '急诊科' },
  { label: '重症监护室', value: '重症监护室' },
  { label: '心电图室', value: '心电图室' },
  { label: '普外科', value: '普外科' },
  { label: '普外科一病区', value: '普外科一病区' },
  { label: '麻醉科', value: '麻醉科' },
  { label: '骨科', value: '骨科' },
  { label: '术后恢复室', value: '术后恢复室' },
  { label: '呼吸内科', value: '呼吸内科' },
  { label: '消化内科', value: '消化内科' },
  { label: '神经内科', value: '神经内科' },
]
const PERIOD_UNIT_OPTIONS = [
  { label: '月', value: 'month' },
  { label: '周', value: 'week' },
]
const ASSIGN_MODE_OPTIONS = [
  { label: '自动分配', value: 'auto' },
  { label: '手工分配', value: 'manual' },
  { label: '员工选择', value: 'employee' },
]
const assignModeLabel = (v?: string) =>
  ASSIGN_MODE_OPTIONS.find((o) => o.value === v)?.label || '—'
const DESIGNATED_PERIOD_OPTIONS = [
  { label: '不指定', value: 'none' },
  { label: '初期', value: 'early' },
  { label: '中期', value: 'mid' },
  { label: '后期', value: 'late' },
]
const designatedPeriodLabel = (v?: string) =>
  DESIGNATED_PERIOD_OPTIONS.find((o) => o.value === v)?.label || '—'

// 由基地模板初始化计划内科室配置
const buildConfigsFromBase = (base: BaseRecord): PlanDeptConfig[] =>
  base.depts.map((d: RotationDeptEntry) => ({
    standardName: d.standardName,
    basePeriodText: `${d.period} ${d.periodUnit === 'week' ? '周' : '月'}`,
    baseRotationType: d.rotationType,
    actualDepts: [],
    year2: undefined,
    year3: undefined,
    optionalCount: 1,
    assignMode: 'auto',
    designatedPeriod: 'none',
  }))

// 由基地总周期推断默认计划年限
const planYearsFromBase = (base: BaseRecord): 1 | 2 | 3 => {
  const totalWeeks = base.depts.reduce(
    (s, d) => s + (d.periodUnit === 'week' ? d.period : d.period * 4),
    0,
  )
  const y = Math.max(1, Math.min(3, Math.round(totalWeeks / 48)))
  return y as 1 | 2 | 3
}

// 演示用：预置实际科室数据，便于预览右侧表格「实际科室」多行展示样式
// 各标准科室的实际科室轮转周期累计 = 标准周期（3 月），满足配置校验
const DEMO_ACTUAL_DEPTS: Record<string, ActualDept[]> = {
  心血管内科: [
    { institution: '市第一人民医院', deptName: '心血管内科', minCapacity: 2, maxCapacity: 4, period: 2, periodUnit: 'month' },
    { institution: '市中心医院', deptName: '心内科二病区', minCapacity: 1, maxCapacity: 3, period: 1, periodUnit: 'month' },
  ],
  呼吸内科: [
    { institution: '市第一人民医院', deptName: '呼吸与危重症医学科', minCapacity: 2, maxCapacity: 4, period: 3, periodUnit: 'month' },
  ],
  消化内科: [
    { institution: '市第一人民医院', deptName: '消化内科', minCapacity: 2, maxCapacity: 3, period: 2, periodUnit: 'month' },
  ],
  内分泌科: [
    { institution: '市第一人民医院', deptName: '内分泌科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
  血液内科: [
    { institution: '市第一人民医院', deptName: '血液内科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
  肾脏内科: [
    { institution: '市第一人民医院', deptName: '肾内科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
  风湿免疫科: [
    { institution: '市第一人民医院', deptName: '风湿免疫科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
    { institution: '市中心医院', deptName: '风湿免疫科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
    { institution: '市中医院', deptName: '风湿免疫科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
  感染科: [
    { institution: '市第一人民医院', deptName: '感染科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
    { institution: '市中心医院', deptName: '感染科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
  神经内科: [
    { institution: '市第一人民医院', deptName: '神经内科', minCapacity: 2, maxCapacity: 3, period: 2, periodUnit: 'month' },
  ],
  心电图室: [
    { institution: '市第一人民医院', deptName: '心电图室', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
  普通外科: [
    { institution: '市第一人民医院', deptName: '普外科一病区', minCapacity: 2, maxCapacity: 4, period: 3, periodUnit: 'month' },
    { institution: '市中医院', deptName: '普外科', minCapacity: 1, maxCapacity: 2, period: 3, periodUnit: 'month' },
  ],
  骨科: [
    { institution: '市第一人民医院', deptName: '骨科病区', minCapacity: 1, maxCapacity: 3, period: 2, periodUnit: 'month' },
  ],
  泌尿外科: [
    { institution: '市第一人民医院', deptName: '泌尿外科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
  神经外科: [
    { institution: '市第一人民医院', deptName: '神经外科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
  胸心外科: [
    { institution: '市第一人民医院', deptName: '胸心外科', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
  麻醉科: [
    { institution: '市第一人民医院', deptName: '麻醉科', minCapacity: 2, maxCapacity: 3, period: 1, periodUnit: 'month' },
  ],
  外科重症监护: [
    { institution: '市第一人民医院', deptName: '外科ICU', minCapacity: 1, maxCapacity: 2, period: 1, periodUnit: 'month' },
  ],
}

const initialPlans: RotationPlan[] = [
  {
    id: 'p1',
    planName: '2026年度内科规培轮转计划',
    baseId: '1',
    baseName: '内科专业基地',
    durationText: calcDurationText(INITIAL_BASES[0].depts),
    planYears: 1,
    status: true,
    deptConfigs: buildConfigsFromBase(INITIAL_BASES[0]).map((c) => ({
      ...c,
      actualDepts: DEMO_ACTUAL_DEPTS[c.standardName] || [],
    })),
  },
  {
    id: 'p2',
    planName: '2026年度外科规培轮转计划',
    baseId: '2',
    baseName: '外科专业基地',
    durationText: calcDurationText(INITIAL_BASES[1].depts),
    planYears: 2,
    status: true,
    deptConfigs: buildConfigsFromBase(INITIAL_BASES[1]).map((c) => ({
      ...c,
      actualDepts: DEMO_ACTUAL_DEPTS[c.standardName] || [],
      year2: 3,
    })),
  },
]

// ==================== 右侧科室配置表格列（按标准名称合并行） ====================

// 合并单元格：组内首行跨 groupSize 行，其余行 rowSpan=0（隐藏）
const mergeCell = (record: any) => ({ rowSpan: record.isFirst ? record.groupSize : 0 })

const buildColumns = (
  onConfig: (standardName: string) => void,
): ColumnsType<any> => [
  {
    title: '序号',
    width: 56,
    align: 'center',
    onCell: mergeCell,
    render: (_, record) => record.seq,
  },
  {
    title: '标准名称',
    width: 130,
    onCell: mergeCell,
    dataIndex: 'standardName',
  },
  {
    title: '标准周期',
    width: 90,
    align: 'center',
    onCell: mergeCell,
    dataIndex: 'basePeriodText',
  },
  {
    title: '轮转类型',
    width: 90,
    align: 'center',
    onCell: mergeCell,
    dataIndex: 'baseRotationType',
    render: (t: string) => (
      <Tag color={t === 'optional' ? 'purple' : 'blue'}>{t === 'optional' ? '可选' : '必选'}</Tag>
    ),
  },
  {
    title: '选择数量',
    width: 90,
    align: 'center',
    onCell: mergeCell,
    dataIndex: 'optionalCount',
    render: (v: number, record) =>
      record.empty ? '' : record.baseRotationType === 'optional' ? (v ?? '—') : '',
  },
  {
    title: '分配方式',
    width: 100,
    align: 'center',
    onCell: mergeCell,
    dataIndex: 'assignMode',
    render: (v: string, record) => (record.empty ? '' : assignModeLabel(v)),
  },
  {
    title: '单位名称',
    width: 140,
    dataIndex: 'unitName',
    render: (v: string, record) =>
      record.empty ? <span style={{ color: '#bbb' }}>未配置</span> : v || '—',
  },
  {
    title: '实际科室',
    width: 160,
    dataIndex: 'deptName',
    render: (v: string, record) => (record.empty ? '' : v || '—'),
  },
  {
    title: '容量',
    width: 110,
    align: 'center',
    dataIndex: 'capacityText',
    render: (v: string, record) => (record.empty ? '' : v),
  },
  {
    title: '周期',
    width: 80,
    align: 'center',
    dataIndex: 'periodText',
    render: (v: string, record) => (record.empty ? '' : v),
  },
  {
    title: '操作',
    width: 90,
    fixed: 'right',
    onCell: mergeCell,
    render: (_, record) => (
      <Button
        type="link"
        size="small"
        icon={<SettingOutlined />}
        onClick={() => onConfig(record.configStd)}
      >
        配置
      </Button>
    ),
  },
]

const RotationPlan: React.FC = () => {
  const [plans, setPlans] = useState<RotationPlan[]>(initialPlans)
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined)
  const [hoverPlanId, setHoverPlanId] = useState<string | null>(null)
  // 新建 / 编辑计划抽屉
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planForm] = Form.useForm()
  // 科室配置抽屉
  const [configOpen, setConfigOpen] = useState(false)
  const [configStd, setConfigStd] = useState<string | null>(null)
  const [configPlanId, setConfigPlanId] = useState<string | null>(null)
  const [configForm] = Form.useForm()
  // 实际科室数量（响应式）：用于限制「选择数量」不可超过已添加的实际科室行数
  const actualDeptsCount = Form.useWatch('actualDepts', configForm)
  const actualCount = Array.isArray(actualDeptsCount) ? actualDeptsCount.length : 0

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || null
  const selectedBase: BaseRecord | null = selectedPlan
    ? INITIAL_BASES.find((b) => b.id === selectedPlan.baseId) || null
    : null

  // 右侧表格数据：按「标准名称」分组，组内按实际科室展开多行；序号/标准名称/标准周期/轮转类型/操作 跨行合并
  const deptRows: any[] = []
  if (selectedPlan) {
    selectedPlan.deptConfigs.forEach((cfg, gi) => {
      const actuals = cfg.actualDepts || []
      const groupSize = actuals.length > 0 ? actuals.length : 1
      const groupBase = {
        seq: gi + 1,
        standardName: cfg.standardName,
        basePeriodText: cfg.basePeriodText,
        baseRotationType: cfg.baseRotationType,
        optionalCount: cfg.optionalCount,
        assignMode: cfg.assignMode,
        configStd: cfg.standardName,
        groupSize,
      }
      if (actuals.length === 0) {
        deptRows.push({
          ...groupBase,
          key: `${cfg.standardName}#empty`,
          isFirst: true,
          empty: true,
          unitName: '',
          deptName: '',
          capacityText: '',
          periodText: '',
        })
        return
      }
      actuals.forEach((d, di) => {
        deptRows.push({
          ...groupBase,
          key: `${cfg.standardName}#${di}`,
          isFirst: di === 0,
          empty: false,
          unitName: d.institution || '',
          deptName: d.deptName || '',
          capacityText:
            d.minCapacity === d.maxCapacity
              ? `${d.minCapacity ?? 0}`
              : `${d.minCapacity ?? 0}~${d.maxCapacity ?? 0}`,
          periodText: `${d.period ?? 0}${d.periodUnit === 'week' ? '周' : '月'}`,
        })
      })
    })
  }

  // —— 计划抽屉 ——
  const openAddPlan = () => {
    setEditingPlanId(null)
    planForm.resetFields()
    planForm.setFieldsValue({ status: true })
    setDrawerOpen(true)
  }
  const openEditPlan = (plan: RotationPlan) => {
    setEditingPlanId(plan.id)
    planForm.setFieldsValue({
      planName: plan.planName,
      baseId: plan.baseId,
      planYears: plan.planYears,
      status: plan.status,
    })
    setDrawerOpen(true)
  }
  const handlePlanDrawerOk = () => {
    planForm.validateFields().then((values: any) => {
      const base = INITIAL_BASES.find((b) => b.id === values.baseId)
      if (!base) return
      const existing = plans.find((p) => p.id === editingPlanId)
      const baseChanged = !existing || existing.baseId !== values.baseId
      const plan: RotationPlan = {
        id: editingPlanId || String(Date.now()),
        planName: values.planName,
        baseId: values.baseId,
        baseName: base.baseName,
        durationText: calcDurationText(base.depts),
        planYears: (values.planYears ?? (existing?.planYears || planYearsFromBase(base))) as 1 | 2 | 3,
        status: values.status ?? true,
        // 切换关联基地时，按新基地模板重新初始化科室配置；否则沿用已有配置
        deptConfigs: baseChanged ? buildConfigsFromBase(base) : existing!.deptConfigs,
      }
      if (editingPlanId) {
        setPlans((prev) => prev.map((p) => (p.id === editingPlanId ? plan : p)))
      } else {
        setPlans((prev) => [plan, ...prev])
      }
      setDrawerOpen(false)
      message.success(editingPlanId ? '修改成功' : '新建成功')
    })
  }
  const handleDeletePlan = (plan: RotationPlan) => {
    setPlans((prev) => prev.filter((p) => p.id !== plan.id))
    if (selectedPlanId === plan.id) setSelectedPlanId(undefined)
    message.success('删除成功')
  }

  // —— 科室配置抽屉 ——
  const openConfig = (standardName: string) => {
    const plan = plans.find((p) => p.id === selectedPlanId)
    if (!plan || !selectedBase) return
    setConfigPlanId(plan.id)
    setConfigStd(standardName)
    const cfg = plan.deptConfigs.find((c) => c.standardName === standardName)
    const stdUnit = selectedBase.depts.find((d) => d.standardName === standardName)?.periodUnit || 'month'
    configForm.setFieldsValue({
      actualDepts: (cfg?.actualDepts || []).map((d: ActualDept) => ({
        ...d,
        periodUnit: stdUnit,
      })),
      optionalCount: cfg?.optionalCount ?? 1,
      assignMode: cfg?.assignMode,
      designatedPeriod: cfg?.designatedPeriod,
      year2: cfg?.year2,
      year3: cfg?.year3,
    })
    setConfigOpen(true)
  }
  const handleConfigOk = () => {
    configForm.validateFields().then((values: any) => {
      if (!configPlanId || !configStd) return
      setPlans((prev) =>
        prev.map((p) =>
          p.id !== configPlanId
            ? p
            : {
                ...p,
                deptConfigs: p.deptConfigs.map((c) =>
                  c.standardName === configStd
                    ? {
                        ...c,
                        actualDepts: (values.actualDepts || []).map((d: ActualDept, i: number) => ({
                          ...d,
                          // 机构名称已从配置抽屉移除，按行序保留原值以维持概览「单位名称」显示
                          institution: c.actualDepts?.[i]?.institution || '',
                        })),
                        optionalCount: values.optionalCount,
                        assignMode: values.assignMode,
                        designatedPeriod: values.designatedPeriod,
                        year2: values.year2,
                        year3: values.year3,
                      }
                    : c,
                ),
              },
        ),
      )
      setConfigOpen(false)
      message.success('配置已保存')
    })
  }

  const configPlan = plans.find((p) => p.id === configPlanId) || null
  const configDept = selectedBase?.depts.find((d) => d.standardName === configStd) || null

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>轮转计划管理</span>
      </div>

      <div style={{ display: 'flex', gap: 16, minHeight: 560, alignItems: 'stretch' }}>
        {/* ============ 左侧：轮转计划列表 ============ */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            background: '#fafafa',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
              <CalendarOutlined style={{ marginRight: 6, color: '#1677ff' }} />
              轮转计划
            </span>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAddPlan}>
              新建
            </Button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 8px' }}>
            {plans.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', fontSize: 13, paddingTop: 40 }}>暂无计划，点击右上角新建</div>
            ) : (
              plans.map((p) => {
                const selected = p.id === selectedPlanId
                const showIcons = selected || hoverPlanId === p.id
                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoverPlanId(p.id)}
                    onMouseLeave={() => setHoverPlanId(null)}
                    onClick={() => setSelectedPlanId(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '10px 10px',
                      marginBottom: 6,
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: selected ? '#e6f4ff' : '#fff',
                      borderLeft: `3px solid ${selected ? '#1677ff' : 'transparent'}`,
                      boxShadow: selected ? '0 1px 4px rgba(22,119,255,0.15)' : 'none',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: selected ? 600 : 500, color: '#1a1a1a' }}>
                        {p.planName}
                      </div>
                    </div>
                    <div style={{ visibility: showIcons ? 'visible' : 'hidden', display: 'flex', gap: 2, marginTop: 2 }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditPlan(p)
                        }}
                      />
                      <Popconfirm
                        title="确认删除该轮转计划？"
                        onConfirm={() => handleDeletePlan(p)}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                      </Popconfirm>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ============ 右侧：所选计划的轮转科室配置 ============ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {!selectedPlan || !selectedBase ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #d9d9d9',
                borderRadius: 8,
                background: '#fafafa',
              }}
            >
              <Empty description="请选择左侧轮转计划查看配置" />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 12px' }}>
                <span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
                    <ApartmentOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                    {selectedBase.baseName}
                  </span>
                  <span style={{ marginLeft: 8, fontSize: 13, color: '#1677ff' }}>
                    标准科室数：{selectedBase.depts.length}个，标准周期{calcDurationText(selectedBase.depts)}
                  </span>
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                <Table
                  columns={buildColumns(openConfig)}
                  dataSource={deptRows}
                  rowKey="key"
                  size="small"
                  pagination={false}
                  scroll={{ x: 1000 }}
                  locale={{ emptyText: <Empty description="该基地暂无轮转科室" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============ 新建 / 编辑轮转计划抽屉 ============ */}
      <Drawer
        title={editingPlanId ? '编辑轮转计划' : '新建轮转计划'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handlePlanDrawerOk}>确定</Button>
          </div>
        }
      >
        <Form form={planForm} layout="vertical" size="small" style={{ marginTop: 12 }} initialValues={{ status: true }}>
          <Form.Item name="planName" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
            <Input placeholder="如：2026年度内科规培轮转计划" maxLength={40} />
          </Form.Item>
          <Form.Item name="baseId" label="关联基地" rules={[{ required: true, message: '请选择关联基地' }]}>
            <Select placeholder="请选择基地" options={BASE_OPTIONS} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.baseId !== cur.baseId}>
            {({ getFieldValue }) => {
              const base = INITIAL_BASES.find((b) => b.id === getFieldValue('baseId'))
              return (
                <Form.Item label="轮转时长">
                  <Input
                    disabled
                    value={base ? calcDurationText(base.depts) : ''}
                    placeholder="选择关联基地后自动带出"
                  />
                </Form.Item>
              )
            }}
          </Form.Item>
          <Form.Item name="planYears" label="计划年限" rules={[{ required: true, message: '请选择计划年限' }]}>
            <Select placeholder="请选择计划年限" options={PLAN_YEAR_OPTIONS} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ============ 科室配置抽屉 ============ */}
      <Drawer
        title="配置轮转科室"
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        width="50%"
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setConfigOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleConfigOk}>保存</Button>
          </div>
        }
      >
        <Descriptions
          size="small"
          column={1}
          style={{ marginBottom: 8 }}
          bordered
          labelStyle={{ whiteSpace: 'nowrap', width: 88 }}
        >
          <Descriptions.Item label="标准名称">{configStd}</Descriptions.Item>
        </Descriptions>
        <Form form={configForm} layout="vertical" size="small" style={{ marginTop: 0 }}>
          {configDept && (
            <Descriptions
              size="small"
              column={3}
              bordered
              style={{ marginTop: -1, marginBottom: 12 }}
              labelStyle={{ whiteSpace: 'nowrap', width: 88 }}
            >
              <Descriptions.Item label="轮转类型">
                {configDept ? (configDept.rotationType === 'optional' ? '可选' : '必选') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="标准周期">
                {configDept ? configDept.period : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="标准单位">
                {configDept ? (configDept.periodUnit === 'week' ? '周' : '月') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={<span><span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span>选择数量</span>}>
                <Form.Item
                  name="optionalCount"
                  rules={[
                    { required: true, message: '请输入选择数量' },
                    {
                      validator: (_, value: number) => {
                        if (actualCount > 0 && Number(value) > actualCount) {
                          return Promise.reject(
                            new Error(`选择数量不可超过实际科室数量（当前 ${actualCount} 个）`),
                          )
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                  noStyle
                >
                  <InputNumber
                    min={1}
                    max={actualCount > 0 ? actualCount : 20}
                    style={{ width: 120 }}
                    placeholder={actualCount > 0 ? `不超过 ${actualCount} 个` : '请先添加实际科室'}
                  />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label={<span><span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span>分配方式</span>}>
                <Form.Item
                  name="assignMode"
                  rules={[{ required: true, message: '请选择分配方式' }]}
                  noStyle
                >
                  <Select options={ASSIGN_MODE_OPTIONS} placeholder="请选择分配方式" style={{ width: '100%' }} />
                </Form.Item>
              </Descriptions.Item>
              <Descriptions.Item label={<span><span style={{ color: '#ff4d4f', marginRight: 2 }}>*</span>指定时期</span>}>
                <Form.Item
                  name="designatedPeriod"
                  rules={[{ required: true, message: '请选择指定时期' }]}
                  noStyle
                >
                  <Select options={DESIGNATED_PERIOD_OPTIONS} placeholder="请选择指定时期" style={{ width: '100%' }} />
                </Form.Item>
              </Descriptions.Item>
            </Descriptions>
          )}
          <Form.List
            name="actualDepts"
            rules={[
              {
                validator: async (_, depts: ActualDept[]) => {
                  const list = depts || []
                  if (list.length === 0) {
                    return Promise.reject(new Error('请至少添加一个实际科室'))
                  }
                  const stdUnit = configDept?.periodUnit || 'month'
                  const unitLabel = stdUnit === 'week' ? '周' : '月'
                  // 按标准科室的原生单位累计：同单位直接加，跨单位需折算（实际科室单位被锁定为标准单位，正常不会跨单位）
                  const toNative = (d: ActualDept) => {
                    const p = Number(d?.period) || 0
                    return stdUnit === 'week'
                      ? (d?.periodUnit === 'week' ? p : p * 4)
                      : (d?.periodUnit === 'month' ? p : p / 4)
                  }
                  const stdNative = configDept?.period || 0
                  if (configDept?.rotationType === 'optional') {
                    // 可选：学员从中自选 optionalCount 个科室，需存在一种选法使其周期累计等于标准周期
                    const optCount = Number(configForm.getFieldValue('optionalCount')) || 1
                    if (list.length < optCount) {
                      return Promise.reject(
                        new Error(`实际科室数量（${list.length}）不能少于选择数量（${optCount}）`),
                      )
                    }
                    const periods = list.map(toNative).sort((a, b) => a - b)
                    const sumSmallest = periods.slice(0, optCount).reduce((s, v) => s + v, 0)
                    const sumLargest = periods.slice(-optCount).reduce((s, v) => s + v, 0)
                    if (sumSmallest > stdNative + 0.01 || sumLargest < stdNative - 0.01) {
                      return Promise.reject(
                        new Error(
                          `可选科室中无法选出 ${optCount} 个，使其轮转周期累计等于标准周期 ${stdNative} ${unitLabel}`,
                        ),
                      )
                    }
                    return Promise.resolve()
                  }
                  const sumNative = list.reduce((s, d) => s + toNative(d), 0)
                  if (Math.abs(sumNative - stdNative) > 0.01) {
                    return Promise.reject(
                      new Error(
                        `实际科室轮转周期累计 ${sumNative} ${unitLabel}，必须等于标准周期 ${stdNative} ${unitLabel}`,
                      ),
                    )
                  }
                  return Promise.resolve()
                },
              },
            ]}
          >
            {(fields, { add, remove }) => {
              const actualDeptColumns: ColumnsType<any> = [
                {
                  title: '序号',
                  width: 56,
                  align: 'center',
                  render: (_: any, __: any, index: number) => index + 1,
                },
                {
                  title: '科室名称',
                  width: 150,
                  render: (_: any, field: any) => (
                    <Form.Item
                      name={[field.name, 'deptName']}
                      rules={[{ required: true, message: '请选择科室名称' }]}
                      noStyle
                    >
                      <Select
                        placeholder="请选择科室"
                        options={DEPT_NAME_OPTIONS}
                        showSearch
                        optionFilterProp="label"
                      />
                    </Form.Item>
                  ),
                },
                {
                  title: '容量下限',
                  width: 100,
                  render: (_: any, field: any) => (
                    <Form.Item name={[field.name, 'minCapacity']} noStyle>
                      <InputNumber min={0} max={999} style={{ width: '100%' }} placeholder="下限" />
                    </Form.Item>
                  ),
                },
                {
                  title: '容量上限',
                  width: 100,
                  render: (_: any, field: any) => (
                    <Form.Item name={[field.name, 'maxCapacity']} noStyle>
                      <InputNumber min={0} max={999} style={{ width: '100%' }} placeholder="上限" />
                    </Form.Item>
                  ),
                },
                {
                  title: '轮转周期',
                  width: 110,
                  render: (_: any, field: any) => (
                    <Form.Item
                      name={[field.name, 'period']}
                      rules={[{ required: true, message: '必填' }]}
                      noStyle
                    >
                      <InputNumber min={1} max={104} style={{ width: '100%' }} placeholder="数值" />
                    </Form.Item>
                  ),
                },
                {
                  title: '操作',
                  width: 64,
                  align: 'center',
                  render: (_: any, field: any) => (
                    <Button danger size="small" onClick={() => remove(field.name)}>
                      删除
                    </Button>
                  ),
                },
              ]
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>实际科室</span>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => add({ period: 1, periodUnit: configDept?.periodUnit || 'month' })}
                    >
                      新增一行
                    </Button>
                  </div>
                  <Table
                    dataSource={fields}
                    columns={actualDeptColumns}
                    pagination={false}
                    size="small"
                    rowKey="key"
                    bordered
                    scroll={{ x: 580 }}
                    locale={{ emptyText: '暂无实际科室，请点击“新增一行”添加' }}
                  />
                </>
              )
            }}
          </Form.List>
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 18, marginBottom: 4 }}
            message="注意说明"
            description={
              <div style={{ fontSize: 12, lineHeight: '20px' }}>
                结合选择数量的各科室轮转周期累计必须等于标准周期。
              </div>
            }
          />
          {configPlan && configPlan.planYears >= 2 && (
            <Form.Item name="year2" label="2年轮转（月）">
              <InputNumber min={0} max={52} style={{ width: '100%' }} placeholder="请输入第2年轮转月数" />
            </Form.Item>
          )}
          {configPlan && configPlan.planYears >= 3 && (
            <Form.Item name="year3" label="3年轮转周期（月）">
              <InputNumber min={0} max={52} style={{ width: '100%' }} placeholder="请输入第3年轮转月数" />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </Card>
  )
}

export default RotationPlan
