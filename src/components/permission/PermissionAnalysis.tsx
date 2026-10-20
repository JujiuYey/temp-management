import React, { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Space,
  Select,
  Input,
  Button,
  message,
} from 'antd'
import {
  SearchOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  AuditOutlined,
  RollbackOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import { Pie, Column } from '@ant-design/charts'
import type { ColumnsType } from 'antd/es/table'

// ==================== 权限分类与权限映射 ====================
const CATEGORY_OPTIONS = [
  { label: '处方权', value: '处方权' },
  { label: '手术等级', value: '手术等级' },
  { label: '手术目录', value: '手术目录' },
  { label: '新技术目录', value: '新技术目录' },
  { label: '临床用血', value: '临床用血' },
  { label: '麻醉等级', value: '麻醉等级' },
  { label: '操作', value: '操作' },
  { label: '报告', value: '报告' },
  { label: '设备', value: '设备' },
  { label: '病理', value: '病理' },
]

/** 每个分类下的具体权限选项 */
const PERMISSION_MAP: Record<string, { label: string; value: string }[]> = {
  '处方权': [
    { label: '普通处方权', value: '普通处方权' },
    { label: '抗菌药物处方权（非限制级）', value: '抗菌药物处方权（非限制级）' },
    { label: '抗菌药物处方权（限制级）', value: '抗菌药物处方权（限制级）' },
    { label: '精神药物处方权（一类）', value: '精神药物处方权（一类）' },
    { label: '精神药物处方权（二类）', value: '精神药物处方权（二类）' },
    { label: '麻醉药物处方权', value: '麻醉药物处方权' },
    { label: '毒性药物处方权', value: '毒性药物处方权' },
  ],
  '手术等级': [
    { label: '一级手术权限', value: '一级手术权限' },
    { label: '二级手术权限', value: '二级手术权限' },
    { label: '三级手术权限', value: '三级手术权限' },
    { label: '四级手术权限', value: '四级手术权限' },
  ],
  '临床用血': [
    { label: '全血使用权限', value: '全血使用权限' },
    { label: '成分血使用权限', value: '成分血使用权限' },
    { label: '自体输血权限', value: '自体输血权限' },
  ],
  '麻醉等级': [
    { label: '局部麻醉权限', value: '局部麻醉权限' },
    { label: '椎管内麻醉权限', value: '椎管内麻醉权限' },
    { label: '全身麻醉权限', value: '全身麻醉权限' },
    { label: '复合麻醉权限', value: '复合麻醉权限' },
  ],
  '操作': [
    { label: '心导管操作权限', value: '心导管操作权限' },
    { label: '内镜操作权限', value: '内镜操作权限' },
    { label: '介入治疗操作权限', value: '介入治疗操作权限' },
  ],
  '报告': [
    { label: '超声报告签发权限', value: '超声报告签发权限' },
    { label: '放射报告签发权限', value: '放射报告签发权限' },
    { label: '病理报告签发权限', value: '病理报告签发权限' },
  ],
  '设备': [
    { label: '关节镜操作权限', value: '关节镜操作权限' },
    { label: '腹腔镜操作权限', value: '腹腔镜操作权限' },
    { label: '呼吸机操作权限', value: '呼吸机操作权限' },
  ],
  '病理': [
    { label: '冰冻切片诊断权限', value: '冰冻切片诊断权限' },
    { label: '细胞学诊断权限', value: '细胞学诊断权限' },
  ],
}

// ==================== 统计卡片数据 ====================
interface StatCard {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  bgColor: string
}

const statCards: StatCard[] = [
  {
    title: '已获取权限人员数',
    value: 386,
    icon: <UserOutlined style={{ fontSize: 28 }} />,
    color: '#1890ff',
    bgColor: '#e6f7ff',
  },
  {
    title: '申请授权次数',
    value: 1247,
    icon: <SafetyCertificateOutlined style={{ fontSize: 28 }} />,
    color: '#52c41a',
    bgColor: '#f6ffed',
  },
  {
    title: '批量授权次数',
    value: 58,
    icon: <AuditOutlined style={{ fontSize: 28 }} />,
    color: '#fa8c16',
    bgColor: '#fff7e6',
  },
  {
    title: '回收权限人员数',
    value: 42,
    icon: <RollbackOutlined style={{ fontSize: 28 }} />,
    color: '#ff4d4f',
    bgColor: '#fff2f0',
  },
]

// ==================== 人员职称构成数据 ====================
const titleCompositionData = [
  { type: '主任医师', value: 45 },
  { type: '副主任医师', value: 78 },
  { type: '主治医师', value: 126 },
  { type: '住院医师', value: 97 },
  { type: '医技人员', value: 40 },
]

// ==================== 权限科室分布数据 ====================
const deptDistributionData = [
  { dept: '心内科', count: 52 },
  { dept: '普外科', count: 48 },
  { dept: '骨科', count: 43 },
  { dept: '神经外科', count: 38 },
  { dept: '妇产科', count: 35 },
  { dept: '儿科', count: 32 },
  { dept: '麻醉科', count: 28 },
  { dept: '急诊科', count: 25 },
  { dept: 'ICU', count: 22 },
  { dept: '呼吸科', count: 18 },
]

// ==================== 已授权人员表格数据 ====================
interface AuthPersonnel {
  id: string
  name: string
  department: string
  title: string
  permissionCategory: string
  permissionName: string
  authDate: string
  expireDate: string
  status: string
}

const personnelData: AuthPersonnel[] = [
  { id: '1', name: '张三', department: '心内科', title: '主任医师', permissionCategory: '处方权', permissionName: '抗菌药物处方权（限制级）', authDate: '2025-03-15', expireDate: '2026-03-15', status: '有效' },
  { id: '2', name: '李四', department: '普外科', title: '副主任医师', permissionCategory: '手术等级', permissionName: '三级手术权限', authDate: '2025-02-20', expireDate: '2026-02-20', status: '有效' },
  { id: '3', name: '王五', department: '骨科', title: '主治医师', permissionCategory: '手术等级', permissionName: '二级手术权限', authDate: '2025-04-10', expireDate: '2026-04-10', status: '有效' },
  { id: '4', name: '赵六', department: '麻醉科', title: '副主任医师', permissionCategory: '麻醉等级', permissionName: '全身麻醉权限', authDate: '2025-01-05', expireDate: '2026-01-05', status: '即将到期' },
  { id: '5', name: '孙七', department: '急诊科', title: '主治医师', permissionCategory: '处方权', permissionName: '精神药物处方权（二类）', authDate: '2025-05-18', expireDate: '2026-05-18', status: '有效' },
  { id: '6', name: '周八', department: 'ICU', title: '主任医师', permissionCategory: '临床用血', permissionName: '全血使用权限', authDate: '2025-06-01', expireDate: '2026-06-01', status: '有效' },
  { id: '7', name: '吴九', department: '心内科', title: '住院医师', permissionCategory: '操作', permissionName: '心导管操作权限', authDate: '2024-12-10', expireDate: '2025-12-10', status: '已过期' },
  { id: '8', name: '郑十', department: '神经外科', title: '主任医师', permissionCategory: '手术等级', permissionName: '四级手术权限', authDate: '2025-07-22', expireDate: '2026-07-22', status: '有效' },
  { id: '9', name: '陈十一', department: '妇产科', title: '副主任医师', permissionCategory: '报告', permissionName: '超声报告签发权限', authDate: '2025-03-28', expireDate: '2026-03-28', status: '有效' },
  { id: '10', name: '林十二', department: '儿科', title: '主治医师', permissionCategory: '处方权', permissionName: '普通处方权', authDate: '2025-08-15', expireDate: '2026-08-15', status: '有效' },
  { id: '11', name: '何明', department: '骨科', title: '主治医师', permissionCategory: '设备', permissionName: '关节镜操作权限', authDate: '2025-09-01', expireDate: '2026-09-01', status: '有效' },
  { id: '12', name: '方芳', department: '呼吸科', title: '主任医师', permissionCategory: '处方权', permissionName: '抗菌药物处方权（非限制级）', authDate: '2025-04-22', expireDate: '2026-04-22', status: '有效' },
]

// ==================== 组件 ====================
const PermissionAnalysis: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedPermission, setSelectedPermission] = useState<string | undefined>(undefined)
  const [searchText, setSearchText] = useState('')

  // 当前分类下的权限选项
  const permissionOptions = useMemo(() => {
    if (!selectedCategory) return []
    return PERMISSION_MAP[selectedCategory] || []
  }, [selectedCategory])

  // 按分类+权限+搜索过滤
  const filteredData = useMemo(() => {
    return personnelData.filter(item => {
      if (selectedCategory && item.permissionCategory !== selectedCategory) return false
      if (selectedPermission && item.permissionName !== selectedPermission) return false
      if (searchText && !item.name.includes(searchText) && !item.department.includes(searchText) && !item.permissionName.includes(searchText)) return false
      return true
    })
  }, [selectedCategory, selectedPermission, searchText])

  // 切换分类时清空权限选择
  const handleCategoryChange = (value: string | undefined) => {
    setSelectedCategory(value)
    setSelectedPermission(undefined)
  }

  // 表格列定义
  const columns: ColumnsType<AuthPersonnel> = [
    {
      title: '序号', key: 'index', width: 60, align: 'center',
      render: (_: unknown, __: AuthPersonnel, index: number) => index + 1,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 80,
    },
    {
      title: '科室',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
      width: 110,
    },
    {
      title: '权限分类',
      dataIndex: 'permissionCategory',
      key: 'permissionCategory',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '权限名称',
      dataIndex: 'permissionName',
      key: 'permissionName',
      width: 220,
    },
    {
      title: '授权日期',
      dataIndex: 'authDate',
      key: 'authDate',
      width: 110,
    },
    {
      title: '到期日期',
      dataIndex: 'expireDate',
      key: 'expireDate',
      width: 110,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '有效': 'green',
          '即将到期': 'orange',
          '已过期': 'red',
          '已回收': 'default',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
  ]

  // 饼图配置
  const pieConfig = {
    data: titleCompositionData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      text: 'type',
      position: 'outside' as const,
    },
    legend: {
      position: 'right' as const,
      layout: 'vertical' as const,
    },
    height: 280,
  }

  // 柱状图配置
  const columnConfig = {
    data: deptDistributionData,
    xField: 'dept',
    yField: 'count',
    colorField: 'dept',
    label: {
      text: (d: { count: number }) => d.count,
      textBaseline: 'bottom' as const,
    },
    axis: {
      x: {
        labelAutoRotate: true,
      },
    },
    height: 280,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      {/* 筛选条件区 */}
      <Card size="small" bodyStyle={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Select
            placeholder="请选择权限分类"
            value={selectedCategory}
            onChange={handleCategoryChange}
            options={CATEGORY_OPTIONS}
            style={{ width: 180 }}
            allowClear
          />
          <Select
            placeholder="请选择具体权限"
            value={selectedPermission}
            onChange={setSelectedPermission}
            options={permissionOptions}
            style={{ width: 240 }}
            allowClear
            disabled={!selectedCategory}
          />
          <Input
            placeholder="搜索权限名称"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => message.info('查询功能待接入后端')}>
            查询
          </Button>
          <Button onClick={() => { setSelectedCategory(undefined); setSelectedPermission(undefined); setSearchText('') }}>
            重置
          </Button>
        </div>
      </Card>

      {/* 图表行 */}
      <Row gutter={16}>
        <Col span={10}>
          <Card title="人员职称构成" size="small" bodyStyle={{ padding: '12px 16px' }}>
            <Pie {...pieConfig} />
          </Card>
        </Col>
        <Col span={14}>
          <Card title="权限科室分布" size="small" bodyStyle={{ padding: '12px 16px' }}>
            <Column {...columnConfig} />
          </Card>
        </Col>
      </Row>

      {/* 人员表格 */}
      <Card
        size="small"
        title="已授权人员"
        extra={<Button icon={<ExportOutlined />} onClick={() => message.success('导出成功')}>导出</Button>}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, padding: '0 16px 16px', display: 'flex', flexDirection: 'column' }}
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          size="small"
          scroll={{ x: 920, y: 260 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
            size: 'small',
          }}
          style={{ flex: 1 }}
        />
      </Card>
    </div>
  )
}

export default PermissionAnalysis
