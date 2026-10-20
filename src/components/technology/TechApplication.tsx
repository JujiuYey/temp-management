import React, { useState, useRef, useMemo } from 'react'
import dayjs from 'dayjs'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Drawer,
  Form,
  DatePicker,
  InputNumber,
  Radio,
  Upload,
  Switch,
  message,
  Row,
  Col,
  Tabs,
  Empty,
  Typography,
  Pagination,
  Tooltip,
  Menu,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  PrinterOutlined,
  FileSearchOutlined,
  DeleteOutlined,
  RollbackOutlined,
  HourglassFilled,
} from '@ant-design/icons'

const { RangePicker } = DatePicker

const { Text } = Typography

interface TechApplicationRecord {
  id: string
  techName: string
  englishName?: string   // 英文名称
  techCode: string
  category: string       // 分类
  level: string          // 技术类别：限制类/一般类
  grade: string          // 等级：院级/县级/州级/省级/国家级/国际级
  techType: string       // 技术类型
  techClass?: string     // 技术类别（与TechCatalog一致）：非限制类/限制类/禁止类
  riskLevel: string      // 风险等级
  techNature: string     // 技术定性
  source: string         // 来源：引进/改进/自研
  scope: string          // 开展范围
  status: string
  currentTask: string
  startDate: string      // 拟开始日期
  endDate: string        // 拟结束日期
  applyDate?: string
  approvalDate?: string
  pauseDate?: string     // 实际暂停日期（被暂停状态下显示在暂停节点圆圈内）
  stopDate?: string      // 实际终止日期（被终止状态下显示在终止节点圆圈内）
  resumeDate?: string    // 重启申请日期（被终止/被暂停状态下显示在终止/暂停节点圆圈内）
  department?: string
  applicant?: string
}

// ────────────────────────────────────────────────────────────────
// 右侧标签内容组件（与 TechCatalog 保持一致）
// ────────────────────────────────────────────────────────────────

const _ApplicationRecord: React.FC = () => (
  <Table
    dataSource={[]}
    columns={[
      { title: '申请编号', dataIndex: 'applyNo', key: 'applyNo', width: 140 },
      { title: '申请类型', dataIndex: 'type', key: 'type', width: 100 },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
      { title: '申请科室', dataIndex: 'applyDept', key: 'applyDept', width: 120 },
      { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
      { title: '申请日期', dataIndex: 'date', key: 'date', width: 120 },
      {
        title: '操作', key: 'action', width: 140, fixed: 'right' as const,
        render: () => (
          <Space>
            <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
            <Button type="link" size="small" icon={<PrinterOutlined />}>打印</Button>
          </Space>
        ),
      },
    ]}
    pagination={{ pageSize: 5 }}
    size="small"
    locale={{ emptyText: <Empty description="暂无申请记录" /> }}
  />
)

const CaseInfoTab: React.FC<{ status: string; techName: string; onOpenCaseDrawer: (mode: 'add' | 'edit' | 'view', record?: Record<string, unknown>) => void }> = ({ status, techName, onOpenCaseDrawer }) => {
  // 未开展/申请中状态不显示虚拟数据
  // 腹腔镜下胰十二指肠切除术补充6条，共9条；其他技术3条
  const baseCaseData = [
    {
      key: '1', approvalStatus: '未提交', applyDate: '2026-05-20', name: '张三',
      visitNo: 'ZY202605001', visitType: '住院', hasConsent: true, effectEval: '治愈',
      hasComplication: false, hasAdverseReaction: false,
      experience: '手术过程顺利，患者恢复良好，术后第三天可下床活动',
      creator: '李医生', createTime: '2026-05-20 09:30:15',
      gender: '男', age: 45, phone: '13800138001', address: '北京市朝阳区',
      admissionDate: '2026-05-15', department: '肝胆外科', doctor: '张医生',
      diagnosis: '胆囊结石', complicationDetail: '', adverseReactionDetail: '',
      followUp: '术后恢复良好',
    },
    {
      key: '2', approvalStatus: '申请中', applyDate: '2026-05-18', name: '李四',
      visitNo: 'ZY202605002', visitType: '住院', hasConsent: true, effectEval: '好转',
      hasComplication: true, hasAdverseReaction: false,
      experience: '术中出现轻度心律失常，经处理后恢复正常，术后需密切观察心电变化',
      creator: '王医生', createTime: '2026-05-18 14:22:08',
      gender: '女', age: 52, phone: '13800138002', address: '北京市海淀区',
      admissionDate: '2026-05-10', department: '心血管内科', doctor: '李医生',
      diagnosis: '冠心病', complicationDetail: '术中心律失常', adverseReactionDetail: '',
      followUp: '需定期复查心电图',
    },
    {
      key: '3', approvalStatus: '已完成', applyDate: '2026-05-15', name: '王五',
      visitNo: 'ZY202605003', visitType: '门诊', hasConsent: false, effectEval: '治愈',
      hasComplication: false, hasAdverseReaction: true,
      experience: '术后出现轻微穿刺部位血肿，经压迫止血后好转',
      creator: '赵医生', createTime: '2026-05-15 10:15:33',
      gender: '男', age: 38, phone: '13800138003', address: '北京市西城区',
      admissionDate: '2026-05-12', department: '骨科', doctor: '王医生',
      diagnosis: '膝关节损伤', complicationDetail: '', adverseReactionDetail: '穿刺部位血肿',
      followUp: '已康复',
    },
  ]

  // 腹腔镜下胰十二指肠切除术补充6条数据
  const extraCaseData = techName === '腹腔镜下胰十二指肠切除术' ? [
    {
      key: '4', approvalStatus: '已完成', applyDate: '2025-09-12', name: '陈建国',
      visitNo: 'ZY202509004', visitType: '住院', hasConsent: true, effectEval: '好转',
      hasComplication: true, hasAdverseReaction: false,
      experience: '胰十二指肠切除术后出现胰瘘，经保守治疗2周后愈合',
      creator: '刘主任', createTime: '2025-09-12 08:45:20',
      gender: '男', age: 58, phone: '13900139004', address: '上海市浦东新区',
      admissionDate: '2025-09-05', department: '肝胆外科', doctor: '刘主任',
      diagnosis: '胰头癌', complicationDetail: '术后胰瘘', adverseReactionDetail: '',
      followUp: '术后2周胰瘘愈合，3个月复查CT未见复发',
    },
    {
      key: '5', approvalStatus: '已完成', applyDate: '2025-11-08', name: '赵美华',
      visitNo: 'ZY202511005', visitType: '住院', hasConsent: true, effectEval: '治愈',
      hasComplication: false, hasAdverseReaction: false,
      experience: '腹腔镜下胰十二指肠切除术顺利完成，术中出血量约200ml，手术时间4.5小时',
      creator: '陈医生', createTime: '2025-11-08 11:20:15',
      gender: '女', age: 47, phone: '13900139005', address: '广州市天河区',
      admissionDate: '2025-11-01', department: '肝胆外科', doctor: '陈医生',
      diagnosis: '胆管下端癌', complicationDetail: '', adverseReactionDetail: '',
      followUp: '术后恢复良好，6个月复查未见异常',
    },
    {
      key: '6', approvalStatus: '申请中', applyDate: '2026-01-22', name: '孙志强',
      visitNo: 'ZY202601006', visitType: '住院', hasConsent: true, effectEval: '好转',
      hasComplication: true, hasAdverseReaction: true,
      experience: '术中因肿瘤侵犯门静脉行部分切除重建，术后出现胃排空延迟',
      creator: '刘主任', createTime: '2026-01-22 15:30:42',
      gender: '男', age: 63, phone: '13900139006', address: '南京市鼓楼区',
      admissionDate: '2026-01-15', department: '肝胆外科', doctor: '刘主任',
      diagnosis: '十二指肠乳头癌', complicationDetail: '胃排空延迟', adverseReactionDetail: '术后恶心呕吐',
      followUp: '胃排空延迟治疗中',
    },
    {
      key: '7', approvalStatus: '已完成', applyDate: '2026-03-10', name: '周丽萍',
      visitNo: 'ZY202603007', visitType: '住院', hasConsent: true, effectEval: '治愈',
      hasComplication: false, hasAdverseReaction: false,
      experience: '全腹腔镜下完成胰十二指肠切除，术中未转开腹，手术时间5小时',
      creator: '陈医生', createTime: '2026-03-10 09:15:30',
      gender: '女', age: 55, phone: '13900139007', address: '杭州市西湖区',
      admissionDate: '2026-03-03', department: '肝胆外科', doctor: '陈医生',
      diagnosis: '壶腹周围癌', complicationDetail: '', adverseReactionDetail: '',
      followUp: '术后恢复良好，已出院',
    },
    {
      key: '8', approvalStatus: '未提交', applyDate: '2026-04-28', name: '吴明远',
      visitNo: 'ZY202604008', visitType: '住院', hasConsent: false, effectEval: '',
      hasComplication: false, hasAdverseReaction: false,
      experience: '腹腔镜胰十二指肠切除术待提交审批',
      creator: '陈医生', createTime: '2026-04-28 16:40:10',
      gender: '男', age: 51, phone: '13900139008', address: '武汉市武昌区',
      admissionDate: '2026-04-20', department: '肝胆外科', doctor: '陈医生',
      diagnosis: '胰头部囊腺瘤', complicationDetail: '', adverseReactionDetail: '',
      followUp: '',
    },
    {
      key: '9', approvalStatus: '已完成', applyDate: '2025-12-18', name: '黄芳',
      visitNo: 'ZY202512009', visitType: '住院', hasConsent: true, effectEval: '好转',
      hasComplication: true, hasAdverseReaction: false,
      experience: '腹腔镜下完成Whipple术，术后出现胆瘘，经引流保守治疗3周后愈合',
      creator: '刘主任', createTime: '2025-12-18 13:50:25',
      gender: '女', age: 44, phone: '13900139009', address: '成都市武侯区',
      admissionDate: '2025-12-10', department: '肝胆外科', doctor: '刘主任',
      diagnosis: '胆管中段癌', complicationDetail: '术后胆瘘', adverseReactionDetail: '',
      followUp: '胆瘘已愈合，定期随访中',
    },
  ] : []

  const caseDataSource = (status === '未开展' || status === '申请中') ? [] : [...baseCaseData, ...extraCaseData]

  const columns = [
    {
      title: '审批状态', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 90,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '未提交': 'default', '申请中': 'processing', '已完成': 'success',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    { title: '应用日期', dataIndex: 'applyDate', key: 'applyDate', width: 110 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
    { title: '诊疗号', dataIndex: 'visitNo', key: 'visitNo', width: 140 },
    {
      title: '知情同意书', dataIndex: 'hasConsent', key: 'hasConsent', width: 90, align: 'center' as const,
      render: (v: boolean) => v ? <span style={{ color: '#52c41a', fontWeight: 'bold' }}>√</span> : '',
    },
    { title: '效果评价', dataIndex: 'effectEval', key: 'effectEval', width: 80 },
    {
      title: '并发症或合并症', dataIndex: 'hasComplication', key: 'hasComplication', width: 110, align: 'center' as const,
      render: (v: boolean) => v ? <span style={{ color: '#faad14', fontWeight: 'bold' }}>√</span> : '',
    },
    {
      title: '不良反应', dataIndex: 'hasAdverseReaction', key: 'hasAdverseReaction', width: 90, align: 'center' as const,
      render: (v: boolean) => v ? <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>√</span> : '',
    },
    {
      title: '经验总结', dataIndex: 'experience', key: 'experience', width: 180, ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          {text.length > 15 ? text.slice(0, 15) + '…' : text}
        </Tooltip>
      ),
    },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 80 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right' as const,
      render: (_: unknown, record: typeof caseDataSource[0]) => {
        const status = record.approvalStatus
        if (status === '未提交') {
          return (
            <Space size={0}>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onOpenCaseDrawer('edit', record as unknown as Record<string, unknown>)}>编辑</Button>
              <Button type="link" size="small" style={{ color: '#52c41a' }}>提交</Button>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Space>
          )
        }
        if (status === '申请中') {
          return (
            <Space size={0}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenCaseDrawer('view', record as unknown as Record<string, unknown>)}>查看</Button>
              <Button type="link" size="small" style={{ color: '#fa8c16' }} icon={<RollbackOutlined />}>撤回</Button>
            </Space>
          )
        }
        // 已完成
        return (
          <Space size={0}>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenCaseDrawer('view', record as unknown as Record<string, unknown>)}>查看</Button>
          </Space>
        )
      },
    },
  ]

  return (
    <Table
      dataSource={caseDataSource}
      columns={columns}
      pagination={{ pageSize: 10 }}
      size="small"
      scroll={{ x: 1400, y: 760 }}
      locale={{ emptyText: <Empty description="暂无开展病例数据" /> }}
    />
  )
}

const StageEvaluation: React.FC<{ status: string; onOpenDrawer: (mode: 'add' | 'edit' | 'view') => void }> = ({ status, onOpenDrawer }) => {
  // ── 虚拟数据 ── 未开展/申请中状态不显示
  const stageData = (status === '未开展' || status === '申请中') ? [] : [
    {
      key: 'se-1', status: '已完成', evalNo: '第1次',
      safetyLevel: 'B级', qualityLevel: '良好',
      summary: '术后3个月随访，12例患者中9例恢复良好，3例存在轻微并发症',
      problems: '3例出现轻度穿刺部位感染，1例术后出血需二次处理',
      measures: '加强术前皮肤消毒规范，完善术后引流管管理流程',
    },
    {
      key: 'se-2', status: '申请中', evalNo: '第2次',
      safetyLevel: 'A级', qualityLevel: '优秀',
      summary: '累计完成20例手术，整体疗效优于传统开放手术，住院天数缩短30%',
      problems: '1例术中出现轻度心律失常，经处理后恢复正常',
      measures: '术前增加心功能评估，术中加强心电监护',
    },
    {
      key: 'se-3', status: '未提交', evalNo: '第3次',
      safetyLevel: '', qualityLevel: '',
      summary: '', problems: '', measures: '',
    },
  ]

  const columns = [
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => {
        const colorMap: Record<string, string> = {
          '已完成': 'success', '申请中': 'processing', '未提交': 'default',
        }
        return <Tag color={colorMap[s] || 'default'}>{s}</Tag>
      },
    },
    { title: '评估次数', dataIndex: 'evalNo', key: 'evalNo', width: 90 },
    { title: '安全等级', dataIndex: 'safetyLevel', key: 'safetyLevel', width: 90 },
    { title: '质量等级', dataIndex: 'qualityLevel', key: 'qualityLevel', width: 90 },
    {
      title: '阶段总结', dataIndex: 'summary', key: 'summary', width: 200, ellipsis: { showTitle: false },
      render: (text: string) => text ? (
        <Tooltip placement="topLeft" title={text}>{text.length > 25 ? text.slice(0, 25) + '…' : text}</Tooltip>
      ) : '-',
    },
    {
      title: '存在问题', dataIndex: 'problems', key: 'problems', width: 180, ellipsis: { showTitle: false },
      render: (text: string) => text ? (
        <Tooltip placement="topLeft" title={text}>{text.length > 20 ? text.slice(0, 20) + '…' : text}</Tooltip>
      ) : '-',
    },
    {
      title: '改进措施', dataIndex: 'measures', key: 'measures', width: 180, ellipsis: { showTitle: false },
      render: (text: string) => text ? (
        <Tooltip placement="topLeft" title={text}>{text.length > 20 ? text.slice(0, 20) + '…' : text}</Tooltip>
      ) : '-',
    },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right' as const,
      render: (_: unknown, record: typeof stageData[0]) => {
        const s = record.status
        if (s === '已完成') {
          return (
            <Space size={0}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenDrawer('view')}>查看</Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onOpenDrawer('edit')}>编辑</Button>
            </Space>
          )
        }
        if (s === '申请中') {
          return (
            <Space size={0}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenDrawer('view')}>查看</Button>
              <Button type="link" size="small" style={{ color: '#fa8c16' }} icon={<RollbackOutlined />}>撤回</Button>
            </Space>
          )
        }
        // 未提交
        return (
          <Space size={0}>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onOpenDrawer('edit')}>编辑</Button>
            <Button type="link" size="small" style={{ color: '#52c41a' }}>提交</Button>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Space>
        )
      },
    },
  ]

  return (
    <Table
      dataSource={stageData}
      columns={columns}
      pagination={{ pageSize: 5 }}
      size="small"
      scroll={{ x: 1100, y: 760 }}
      locale={{ emptyText: <Empty description="暂无阶段评估数据" /> }}
    />
  )
}

const ConvertApply: React.FC<{ status: string; onOpenDrawer: (mode: 'add' | 'edit' | 'view') => void }> = ({ status, onOpenDrawer }) => {
  // ── 虚拟数据（仅一条） ── 未开展/申请中状态不显示
  const convertData = (status === '未开展' || status === '申请中') ? [] : [
    {
      key: 'cv-1', status: '申请中', orderNo: 'CV-2026-001',
      applyDate: '2026-05-10', applicant: '李明',
      summary: '已完成第一阶段评估，累计病例18例，整体安全性和有效性达标',
      conclusion: '申请转常规开展，持续监测远期疗效',
    },
  ]

  const columns = [
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => {
        const colorMap: Record<string, string> = {
          '已完成': 'success', '申请中': 'processing', '未提交': 'default',
        }
        return <Tag color={colorMap[s] || 'default'}>{s}</Tag>
      },
    },
    { title: '单号', dataIndex: 'orderNo', key: 'orderNo', width: 140 },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 90 },
    { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate', width: 110 },
    {
      title: '转常规总结', dataIndex: 'summary', key: 'summary', width: 200, ellipsis: { showTitle: false },
      render: (text: string) => text ? (
        <Tooltip placement="topLeft" title={text}>{text.length > 25 ? text.slice(0, 25) + '…' : text}</Tooltip>
      ) : '-',
    },
    {
      title: '转常规结论', dataIndex: 'conclusion', key: 'conclusion', width: 180, ellipsis: { showTitle: false },
      render: (text: string) => text ? (
        <Tooltip placement="topLeft" title={text}>{text.length > 20 ? text.slice(0, 20) + '…' : text}</Tooltip>
      ) : '-',
    },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right' as const,
      render: (_: unknown, record: typeof convertData[0]) => {
        const s = record.status
        if (s === '已完成') {
          return (
            <Space size={0}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenDrawer('view')}>查看</Button>
            </Space>
          )
        }
        if (s === '申请中') {
          return (
            <Space size={0}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenDrawer('view')}>查看</Button>
              <Button type="link" size="small" style={{ color: '#fa8c16' }} icon={<RollbackOutlined />}>撤回</Button>
            </Space>
          )
        }
        // 未提交
        return (
          <Space size={0}>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onOpenDrawer('edit')}>编辑</Button>
            <Button type="link" size="small" style={{ color: '#52c41a' }}>提交</Button>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Space>
        )
      },
    },
  ]

  return (
    <Table
      dataSource={convertData}
      columns={columns}
      pagination={{ pageSize: 5 }}
      size="small"
      scroll={{ x: 1100, y: 760 }}
      locale={{ emptyText: <Empty description="暂无转常规申请记录" /> }}
    />
  )
}

const EffectEvaluation: React.FC<{ status: string; onOpenDrawer: (mode: 'add' | 'edit' | 'view') => void }> = ({ status, onOpenDrawer }) => (
  <div>
    <Table
      dataSource={[]}
      columns={[
        { title: '单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
        { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
        { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100 },
        { title: '申请日期', dataIndex: 'date', key: 'date', width: 120 },
        {
          title: '操作', key: 'action', width: 180, fixed: 'right' as const,
          render: () => (
            <Space>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenDrawer('view')}>查看</Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onOpenDrawer('edit')}>修改</Button>
              <Button type="link" size="small" icon={<FileSearchOutlined />}>预览</Button>
            </Space>
          ),
        },
      ]}
      pagination={{ pageSize: 5 }}
      size="small"
      scroll={{ y: 760 }}
      locale={{ emptyText: <Empty description="暂无效果评价数据" /> }}
    />
  </div>
)

// ── 中止记录标签页组件 ──
const PauseStopRecord: React.FC<{
  status: string
  onOpenDrawer: (mode: 'add' | 'edit' | 'view') => void
}> = ({ status, onOpenDrawer }) => {
  // 只有被暂停、被终止状态下才显示虚拟数据，其他状态不显示
  const suspendData = status === '被暂停'
    ? [
        {
          key: 'psr-1', status: '已完成', type: '暂停',
          reason: '安全隐患', applyDate: '2026-04-01', applicant: '张伟',
        },
        {
          key: 'psr-2', status: '申请中', type: '重启',
          reason: '条件已恢复', applyDate: '2026-05-20', applicant: '张伟',
        },
      ]
    : status === '被终止'
      ? [
        {
          key: 'psr-3', status: '已完成', type: '暂停',
          reason: '安全隐患', applyDate: '2026-04-01', applicant: '张伟',
        },
        {
          key: 'psr-4', status: '已完成', type: '终止',
          reason: '效果不达预期', applyDate: '2026-01-20', applicant: '孙伟',
        },
      ]
      : []

  const columns = [
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => {
        const colorMap: Record<string, string> = { '已完成': 'success', '申请中': 'processing', '未提交': 'default' }
        return <Tag color={colorMap[s] || 'default'}>{s}</Tag>
      },
    },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 80,
      render: (t: string) => {
        const colorMap: Record<string, string> = { '暂停': '#ff4d4f', '终止': '#cf1322', '重启': '#52c41a' }
        return <Tag color={colorMap[t] || 'default'}>{t}</Tag>
      },
    },
    { title: '原因', dataIndex: 'reason', key: 'reason', width: 120 },
    { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate', width: 110 },
    { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 80 },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right' as const,
      render: (_: unknown, record: typeof suspendData[0]) => {
        const s = record.status
        if (s === '已完成') {
          return (
            <Space size={0}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenDrawer('view')}>查看</Button>
            </Space>
          )
        }
        if (s === '申请中') {
          return (
            <Space size={0}>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onOpenDrawer('view')}>查看</Button>
              <Button type="link" size="small" style={{ color: '#fa8c16' }} icon={<RollbackOutlined />}>撤回</Button>
            </Space>
          )
        }
        // 未提交
        return (
          <Space size={0}>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onOpenDrawer('edit')}>编辑</Button>
            <Button type="link" size="small" style={{ color: '#52c41a' }}>提交</Button>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Space>
        )
      },
    },
  ]

  return (
    <Table
      dataSource={suspendData}
      columns={columns}
      pagination={{ pageSize: 5 }}
      size="small"
      scroll={{ x: 900, y: 760 }}
      locale={{ emptyText: <Empty description="暂无中止记录" /> }}
    />
  )
}

// ────────────────────────────────────────────────────────────────
// 主组件
// ────────────────────────────────────────────────────────────────

const TechApplication: React.FC = () => {
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [addDrawerType, setAddDrawerType] = useState<'tech' | 'project'>('tech')
  const [addDrawerMode, setAddDrawerMode] = useState<'add' | 'edit' | 'view'>('add')
  const [searchText, setSearchText] = useState('')
  const [deptFilter, setDeptFilter] = useState<string | undefined>(undefined)
  const [applicantFilter, setApplicantFilter] = useState('')
  const [techStatusFilter, setTechStatusFilter] = useState<string | undefined>(undefined)
  const [techNameFilter, setTechNameFilter] = useState('')
  const [applyDateRange, setApplyDateRange] = useState<[string, string] | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<TechApplicationRecord | null>(null)
  const [activeSection, setActiveSection] = useState('0')

  // 各表单区域的 ref，用于点击左侧导航后快速定位
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  const scrollToSection = (key: string) => {
    const index = parseInt(key, 10)
    const el = sectionRefs.current[index]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setActiveSection(key)
  }
  const [activeRightTab, setActiveRightTab] = useState('case')
  const [caseDrawerOpen, setCaseDrawerOpen] = useState(false)
  const [caseDrawerMode, setCaseDrawerMode] = useState<'add' | 'edit' | 'view'>('add')
  const [caseForm] = Form.useForm()
  const [caseActiveSection, setCaseActiveSection] = useState('0')
  const caseSectionRefs = useRef<(HTMLDivElement | null)[]>([])

  const caseScrollToSection = (key: string) => {
    const index = parseInt(key, 10)
    const el = caseSectionRefs.current[index]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setCaseActiveSection(key)
  }

  // 阶段评估抽屉状态
  const [stageDrawerOpen, setStageDrawerOpen] = useState(false)
  const [stageDrawerMode, setStageDrawerMode] = useState<'add' | 'edit' | 'view'>('add')
  const [stageForm] = Form.useForm()

  // 转常规申请抽屉状态
  const [convertDrawerOpen, setConvertDrawerOpen] = useState(false)
  const [convertDrawerMode, setConvertDrawerMode] = useState<'add' | 'edit' | 'view'>('add')
  const [convertForm] = Form.useForm()

  // 效果评价抽屉状态
  const [effectDrawerOpen, setEffectDrawerOpen] = useState(false)
  const [effectDrawerMode, setEffectDrawerMode] = useState<'add' | 'edit' | 'view'>('add')
  const [effectForm] = Form.useForm()

  // 暂停/终止/重启申请抽屉状态
  const [pauseStopDrawerOpen, setPauseStopDrawerOpen] = useState(false)
  const [pauseStopDrawerMode, setPauseStopDrawerMode] = useState<'add' | 'edit' | 'view'>('add')
  const [pauseStopDrawerType, setPauseStopDrawerType] = useState<'暂停' | '终止' | '重启'>('暂停')
  const [pauseStopForm] = Form.useForm()

  const scrollToCaseSection = (key: string) => {
    const index = parseInt(key, 10)
    const el = caseSectionRefs.current[index]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setCaseActiveSection(key)
  }

  // 开展病例各区域字段映射
  const caseSectionFieldMap = [
    { all: ['visitType', 'visitNo', 'patientName', 'gender', 'age', 'phone', 'address', 'admissionDate', 'department', 'doctor', 'diagnosis'], required: ['visitType', 'visitNo', 'patientName', 'gender', 'age', 'admissionDate', 'department', 'doctor', 'diagnosis'] },
    { all: ['applyDate', 'effectEval', 'patientInformed', 'consentFile', 'hasComplication', 'complicationDetail', 'hasAdverseReaction', 'adverseReactionDetail', 'experienceSummary', 'followUp'], required: ['applyDate'] },
  ]

  const caseSectionTitles = ['病例信息', '应用信息']
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const [form] = Form.useForm()

  // ── 完成情况数据（mock，组件级，供流程图与抽屉共用）──
  const evalCount = 3

  // 监听表单所有字段值
  const formValues = Form.useWatch([], form)

  // 每个区域对应的字段名 & 必填字段名
  const sectionFieldMap = [
    { all: ['techName', 'techCode', 'department', 'applicant', 'phone'], required: ['techName', 'department', 'applicant'] },
    { all: ['category', 'level', 'description'], required: ['category', 'level'] },
    { all: ['leader', 'teamSize', 'members'], required: ['leader'] },
    { all: ['needNewEquipment', 'equipment', 'equipmentBudget'], required: ['needNewEquipment'] },
    { all: ['startDate', 'plannedCases', 'plan'], required: ['startDate'] },
    { all: ['riskLevel', 'risks', 'riskMeasures'], required: ['riskLevel'] },
    { all: ['expectedEffect', 'expectedSuccessRate', 'advantages'], required: [] },
    { all: ['costPerCase', 'annualBudget', 'budgetNote'], required: [] },
    { all: ['qualification', 'techDoc', 'otherDoc', 'remark'], required: [] },
  ]

  // 计算每个区域的完成状态：'empty' | 'partial' | 'complete'
  const sectionStates = useMemo(() => {
    const vals = formValues || {}
    return sectionFieldMap.map((sec) => {
      const hasAny = sec.all.some((f) => vals[f] !== undefined && vals[f] !== null && vals[f] !== '')
      const allRequired = sec.required.every((f) => vals[f] !== undefined && vals[f] !== null && vals[f] !== '')
      if (allRequired && sec.required.length > 0) return 'complete' as const
      if (hasAny) return 'partial' as const
      return 'empty' as const
    })
  }, [formValues])

  // 开展病例表单值监听（用于替代 shouldUpdate）
  const watchVisitType = Form.useWatch('visitType', caseForm)
  const watchHasComplication = Form.useWatch('hasComplication', caseForm)
  const watchHasAdverseReaction = Form.useWatch('hasAdverseReaction', caseForm)
  const caseSectionStates = useMemo(() => {
    const vals = caseForm.getFieldsValue(true)
    return caseSectionFieldMap.map((sec) => {
      const hasAny = sec.all.some((f) => vals[f] !== undefined && vals[f] !== null && vals[f] !== '')
      const allRequired = sec.required.every((f) => vals[f] !== undefined && vals[f] !== null && vals[f] !== '')
      if (allRequired && sec.required.length > 0) return 'complete' as const
      if (hasAny) return 'partial' as const
      return 'empty' as const
    })
  }, [watchVisitType, watchHasComplication, watchHasAdverseReaction, caseDrawerOpen])

  // 粗勾号 SVG 组件
  const ThickCheck: React.FC<{ color: string }> = ({ color }) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,12 10,18 20,6" />
    </svg>
  )

  // 开展病例左侧导航菜单项
  const caseSectionMenuItems = caseSectionTitles.map((title, idx) => {
    const state = caseSectionStates[idx]
    let icon: React.ReactNode = null
    if (state === 'complete') {
      icon = <ThickCheck color="#52c41a" />
    } else if (state === 'partial') {
      icon = <ThickCheck color="#bfbfbf" />
    }
    return {
      key: String(idx),
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 4 }}>
          <span>{title}</span>
          {icon}
        </div>
      ),
    }
  })

  // 模拟数据
  const mockData: TechApplicationRecord[] = [
    {
      id: '1',
      techName: '腹腔镜下胰十二指肠切除术',
      englishName: 'Laparoscopic Pancreaticoduodenectomy',
      techCode: 'TECH-2026-001',
      category: '外科技术',
      level: '限制类',
      techClass: '限制类',
      grade: '院级',
      techType: '手术',
      riskLevel: '高风险',
      techNature: '常规（开放）手术',
      source: '引进',
      scope: '限临床研究',
      currentTask: '阶段评估',
      status: '常规',
      startDate: '2025-06-15',
      endDate: '',
      applyDate: '2025-05-20',
      approvalDate: '2025-06-10',
      department: '肝胆外科',
      applicant: '张伟',
    },
    {
      id: '2',
      techName: '经皮冠状动脉介入治疗',
      englishName: 'Percutaneous Coronary Intervention',
      techCode: 'TECH-2026-002',
      category: '内科技术',
      level: '限制类',
      techClass: '限制类',
      grade: '省级',
      techType: '诊疗',
      riskLevel: '高风险',
      techNature: '介入手术',
      source: '改进',
      scope: '限指定科室',
      currentTask: '效果评价',
      status: '试运行',
      startDate: '2026-02-15',
      endDate: '2026-07-15',
      applyDate: '2026-01-10',
      approvalDate: '2026-02-01',
      department: '心血管内科',
      applicant: '李明',
    },
    {
      id: '3',
      techName: '机器人辅助膝关节置换术',
      englishName: 'Robot-assisted Knee Replacement',
      techCode: 'TECH-2026-003',
      category: '骨科技术',
      level: '限制类',
      techClass: '限制类',
      grade: '州级',
      techType: '手术',
      riskLevel: '中风险',
      techNature: '常规（开放）手术',
      source: '引进',
      scope: '限指定科室',
      currentTask: '项目异常',
      status: '被暂停',
      startDate: '2026-03-05',
      endDate: '',
      applyDate: '2026-02-01',
      approvalDate: '2026-02-28',
      pauseDate: '2026-05-20',   // 实际暂停日期
      department: '骨科',
      applicant: '王强',
    },
    {
      id: '4',
      techName: '脑深部电刺激术',
      englishName: 'Deep Brain Stimulation',
      techCode: 'TECH-2026-004',
      category: '神经外科技术',
      level: '限制类',
      techClass: '限制类',
      grade: '国家级',
      techType: '手术',
      riskLevel: '高风险',
      techNature: '介入手术',
      source: '自研',
      scope: '限临床研究',
      currentTask: '项目申请',
      status: '申请中',
      startDate: '',
      endDate: '2026-06-20',
      applyDate: '2026-04-15',
      approvalDate: '',
      department: '神经外科',
      applicant: '陈红',
    },
    {
      id: '5',
      techName: '人工智能辅助影像诊断',
      englishName: 'AI-assisted Imaging Diagnosis',
      techCode: 'TECH-2026-006',
      category: '医技技术',
      level: '一般类',
      techClass: '非限制类',
      grade: '院级',
      techType: '诊断',
      riskLevel: '低风险',
      techNature: '常规（开放）手术',
      source: '引进',
      scope: '全院',
      currentTask: '项目申请',
      status: '未开展',
      startDate: '',
      endDate: '',
      applyDate: '2026-05-01',
      approvalDate: '',
      department: '放射科',
      applicant: '刘芳',
    },
    {
      id: '6',
      techName: '光动力治疗消化道肿瘤',
      englishName: 'Photodynamic Therapy for GI Tumors',
      techCode: 'TECH-2026-007',
      category: '内科技术',
      level: '限制类',
      techClass: '限制类',
      grade: '省级',
      techType: '治疗',
      riskLevel: '中风险',
      techNature: '介入手术',
      source: '改进',
      scope: '限指定科室',
      currentTask: '项目异常',
      status: '被终止',
      startDate: '2025-08-01',
      endDate: '2026-01-20',
      applyDate: '2025-07-10',
      approvalDate: '2025-07-30',
      pauseDate: '2026-03-15',   // 实际暂停日期
      stopDate: '2026-04-08',   // 实际终止日期
      department: '消化内科',
      applicant: '孙伟',
    },
    {
      id: '7',
      techName: '三维标测下射频消融术',
      englishName: '3D Mapping-guided RF Ablation',
      techCode: 'TECH-2026-008',
      category: '内科技术',
      level: '限制类',
      techClass: '限制类',
      grade: '院级',
      techType: '手术',
      riskLevel: '中风险',
      techNature: '介入手术',
      source: '自研',
      scope: '限指定科室',
      currentTask: '项目异常',
      status: '被终止',
      startDate: '2024-12-10',
      endDate: '2025-09-30',
      applyDate: '2024-11-15',
      approvalDate: '2024-12-01',
      pauseDate: '2025-07-10',         // 实际暂停日期
      stopDate: '2025-08-15',        // 实际终止日期
      resumeDate: '2025-09-20',      // 已申请重启日期
      department: '心血管内科',
      applicant: '赵磊',
    },
  ]

  const STATUS_COLOR_MAP: Record<string, string> = {
    '临时': 'orange',
    '未开展': 'default',
    '申请中': 'blue',
    '试运行': 'cyan',
    '被暂停': 'volcano',
    '被终止': 'red',
    '常规': 'green',
  }

  // 等级颜色：级别越高越鲜艳，背景色重的用白色文字
  const GRADE_COLOR_MAP: Record<string, string> = {
    '院级': '#bfbfbf',
    '县级': '#73d13d',
    '州级': '#ffc53d',
    '省级': '#4096ff',
    '国家级': '#722ed1',
    '国际级': '#f5222d',
  }

  const GRADE_TEXT_COLOR_MAP: Record<string, string> = {
    '院级': '#fff',
    '县级': '#fff',
    '州级': '#fff',
    '省级': '#fff',
    '国家级': '#fff',
    '国际级': '#fff',
  }

  // 技术类别（level）
  const LEVEL_COLOR_MAP: Record<string, string> = {
    '限制类': '#ff7875',
    '一般类': '#91caff',
  }

  const LEVEL_TEXT_COLOR_MAP: Record<string, string> = {
    '限制类': '#fff',
    '一般类': '#fff',
  }

  // 来源
  const SOURCE_COLOR_MAP: Record<string, string> = {
    '引进': '#69b1ff',
    '改进': '#95de64',
    '自研': '#ffc069',
  }

  const SOURCE_TEXT_COLOR_MAP: Record<string, string> = {
    '引进': '#fff',
    '改进': '#fff',
    '自研': '#fff',
  }

  // 技术类型
  const TECH_TYPE_COLOR_MAP: Record<string, string> = {
    '手术': '#ff9c6e',
    '诊疗': '#b37feb',
    '治疗': '#5cdbd3',
    '诊断': '#ffc53d',
  }

  const TECH_TYPE_TEXT_COLOR_MAP: Record<string, string> = {
    '手术': '#fff',
    '诊疗': '#fff',
    '治疗': '#fff',
    '诊断': '#fff',
  }

  // 风险等级
  const RISK_COLOR_MAP: Record<string, string> = {
    '高风险': '#ff4d4f',
    '中风险': '#faad14',
    '低风险': '#52c41a',
  }

  const RISK_TEXT_COLOR_MAP: Record<string, string> = {
    '高风险': '#fff',
    '中风险': '#fff',
    '低风险': '#fff',
  }

  // 过滤后数据（searchText 保留用于顶部搜索框，后续可联调后端）
  const filteredData = mockData.filter((item) => {
    const matchText = searchText
      ? item.techName.includes(searchText) || item.techCode.includes(searchText)
      : true
    const matchTechName = techNameFilter ? item.techName.includes(techNameFilter) : true
    const matchTechStatus = techStatusFilter ? item.status === techStatusFilter : true
    const matchDept = deptFilter ? item.department === deptFilter : true
    const matchApplicant = applicantFilter
      ? (item.applicant || '').includes(applicantFilter)
      : true
    return matchText && matchTechName && matchTechStatus && matchDept && matchApplicant
  })

  // 当前页数据
  const pagedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleAdd = (type: 'tech' | 'project') => {
    form.resetFields()
    setAddDrawerType(type)
    setAddDrawerMode('add')
    setAddDrawerOpen(true)
  }

  const handleOpenAppDrawer = (mode: 'add' | 'edit' | 'view') => {
    setAddDrawerMode(mode)
    setAddDrawerType('tech')
    setAddDrawerOpen(true)
  }

  const _handleSubmit = async () => {
    try {
      await form.validateFields()
      message.success('申请提交成功！')
      setAddDrawerOpen(false)
    } catch {
      message.warning('请完善必填项')
    }
  }

  const sectionTitles = [
    '基本信息', '技术分类', '团队成员', '设备需求', '开展计划',
    '风险评估', '效果预期', '费用预算', '附件材料',
  ]

  // 左侧纵向导航的菜单项（带√状态图标）
  const sectionMenuItems = sectionTitles.map((title, idx) => {
    const state = sectionStates[idx]
    let icon: React.ReactNode = null
    if (state === 'complete') {
      icon = <ThickCheck color="#52c41a" />
    } else if (state === 'partial') {
      icon = <ThickCheck color="#bfbfbf" />
    }
    return {
      key: String(idx),
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 4 }}>
          <span>{title}</span>
          {icon}
        </div>
      ),
    }
  })

  // 抽屉内右侧：所有表单区域全部渲染，每个区域一个 ref 用于滚动定位
  const renderAllSections = () => (
    <Form form={form} layout="vertical" disabled={addDrawerMode === 'view'}>
      {/* 基本信息 */}
      <div
        ref={(el) => { sectionRefs.current[0] = el }}
        style={{ marginBottom: 24, scrollMarginTop: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>基本信息</div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="技术名称" name="techName" rules={[{ required: true, message: '请输入技术名称' }]}>
              <Input placeholder="请输入技术名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="技术编码" name="techCode">
              <Input placeholder="系统自动生成或手动输入" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="申请科室" name="department" rules={[{ required: true, message: '请选择申请科室' }]}>
              <Select placeholder="请选择科室" options={[
                { label: '肝胆外科', value: '肝胆外科' },
                { label: '心血管内科', value: '心血管内科' },
                { label: '骨科', value: '骨科' },
                { label: '神经外科', value: '神经外科' },
                { label: '放射科', value: '放射科' },
              ]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="申请人" name="applicant" rules={[{ required: true, message: '请输入申请人' }]}>
              <Input placeholder="请输入申请人姓名" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="联系电话" name="phone">
          <Input placeholder="请输入联系电话" />
        </Form.Item>
      </div>

      {/* 技术分类 */}
      <div
        ref={(el) => { sectionRefs.current[1] = el }}
        style={{ marginBottom: 24, scrollMarginTop: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>技术分类</div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="技术分类" name="category" rules={[{ required: true, message: '请选择技术分类' }]}>
              <Select placeholder="请选择技术分类" options={[
                { label: '外科技术', value: '外科技术' },
                { label: '内科技术', value: '内科技术' },
                { label: '骨科技术', value: '骨科技术' },
                { label: '神经外科技术', value: '神经外科技术' },
                { label: '放疗技术', value: '放疗技术' },
                { label: '医技技术', value: '医技技术' },
                { label: '其他', value: '其他' },
              ]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="技术级别" name="level" rules={[{ required: true, message: '请选择技术级别' }]}>
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="国家级限制类">国家级限制类</Radio>
                  <Radio value="省级限制类">省级限制类</Radio>
                  <Radio value="院级新技术">院级新技术</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="技术简介" name="description">
          <Input.TextArea rows={4} placeholder="请输入技术简介" />
        </Form.Item>
      </div>

      {/* 团队成员 */}
      <div
        ref={(el) => { sectionRefs.current[2] = el }}
        style={{ marginBottom: 24, scrollMarginTop: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>团队成员</div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="团队负责人" name="leader" rules={[{ required: true, message: '请输入团队负责人' }]}>
              <Input placeholder="请输入团队负责人" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="团队人数" name="teamSize">
              <InputNumber min={1} max={100} placeholder="请输入团队人数" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="核心成员" name="members">
          <Input.TextArea rows={4} placeholder="请列出核心成员信息（姓名、科室、职称）" />
        </Form.Item>
      </div>

      {/* 设备需求 */}
      <div
        ref={(el) => { sectionRefs.current[3] = el }}
        style={{ marginBottom: 24, scrollMarginTop: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>设备需求</div>
        <Form.Item label="是否需要新设备" name="needNewEquipment" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value="yes">是</Radio>
            <Radio value="no">否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="所需设备" name="equipment">
          <Input.TextArea rows={4} placeholder="请描述所需设备信息" />
        </Form.Item>
        <Form.Item label="设备预算（万元）" name="equipmentBudget">
          <InputNumber min={0} placeholder="请输入设备预算" style={{ width: '100%' }} />
        </Form.Item>
      </div>

      {/* 开展计划 */}
      <div
        ref={(el) => { sectionRefs.current[4] = el }}
        style={{ marginBottom: 24, scrollMarginTop: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>开展计划</div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="计划开展日期" name="startDate" rules={[{ required: true, message: '请选择计划开展日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="计划年度开展例数" name="plannedCases">
              <InputNumber min={1} placeholder="请输入计划例数" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="开展方案" name="plan">
          <Input.TextArea rows={4} placeholder="请输入技术开展方案" />
        </Form.Item>
      </div>

      {/* 风险评估 */}
      <div
        ref={(el) => { sectionRefs.current[5] = el }}
        style={{ marginBottom: 24, scrollMarginTop: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>风险评估</div>
        <Form.Item label="风险等级" name="riskLevel" rules={[{ required: true, message: '请选择风险等级' }]}>
          <Radio.Group>
            <Radio value="high">高风险</Radio>
            <Radio value="medium">中风险</Radio>
            <Radio value="low">低风险</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="主要风险点" name="risks">
          <Input.TextArea rows={4} placeholder="请描述主要风险点" />
        </Form.Item>
        <Form.Item label="风险应对措施" name="riskMeasures">
          <Input.TextArea rows={4} placeholder="请描述风险应对措施" />
        </Form.Item>
      </div>

      {/* 效果预期 */}
      <div
        ref={(el) => { sectionRefs.current[6] = el }}
        style={{ marginBottom: 24, scrollMarginTop: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>效果预期</div>
        <Form.Item label="预期临床效果" name="expectedEffect">
          <Input.TextArea rows={4} placeholder="请描述预期临床效果" />
        </Form.Item>
        <Form.Item label="预期成功率（%）" name="expectedSuccessRate">
          <InputNumber min={0} max={100} placeholder="请输入预期成功率" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="与现有技术对比优势" name="advantages">
          <Input.TextArea rows={4} placeholder="请描述与现有技术相比的优势" />
        </Form.Item>
      </div>

      {/* 费用预算 */}
      <div
        ref={(el) => { sectionRefs.current[7] = el }}
        style={{ marginBottom: 24, scrollMarginTop: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>费用预算</div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="单例预估费用（元）" name="costPerCase">
              <InputNumber min={0} placeholder="请输入单例费用" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="年度总预算（万元）" name="annualBudget">
              <InputNumber min={0} placeholder="请输入年度总预算" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="费用说明" name="budgetNote">
          <Input.TextArea rows={4} placeholder="请补充说明费用明细" />
        </Form.Item>
      </div>

      {/* 附件材料 */}
      <div
        ref={(el) => { sectionRefs.current[8] = el }}
        style={{ marginBottom: 24, scrollMarginTop: 16 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>附件材料</div>
        <Form.Item label="相关资质证明" name="qualification">
          <Upload><Button icon={<UploadOutlined />}>上传文件</Button></Upload>
        </Form.Item>
        <Form.Item label="技术方案文档" name="techDoc">
          <Upload><Button icon={<UploadOutlined />}>上传文件</Button></Upload>
        </Form.Item>
        <Form.Item label="其他补充材料" name="otherDoc">
          <Upload><Button icon={<UploadOutlined />}>上传文件</Button></Upload>
        </Form.Item>
        <Form.Item label="备注说明" name="remark">
          <Input.TextArea rows={3} placeholder="其他需要补充说明的内容" />
        </Form.Item>
      </div>
    </Form>
  )

  // ── 左侧卡片列表 ──────────────────────────────────────────────

  const renderListCard = (item: TechApplicationRecord) => {
    const isSelected = selectedRecord?.id === item.id
    return (
      <div
        key={item.id}
        onClick={() => setSelectedRecord(item)}
        style={{
          padding: '10px 14px',
          marginBottom: 8,
          borderRadius: 6,
          cursor: 'pointer',
          border: isSelected ? '1px solid #1890ff' : '1px solid #f0f0f0',
          background: isSelected ? '#e6f4ff' : '#fff',
          transition: 'all 0.2s',
        }}
      >
        {/* 第一行：技术名称 + 状态 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 6 }}>
          <Col flex={1} style={{ marginRight: 8, minWidth: 0 }}>
            <Text strong style={{ fontSize: 13, color: '#262626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
              {item.techName}
            </Text>
          </Col>
          <Col style={{ flexShrink: 0 }}>
            <Space size={4}>
              {(item.status === '试运行' || item.status === '申请中') && item.endDate && (() => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const end = new Date(item.endDate)
                end.setHours(0, 0, 0, 0)
                const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                const isExpired = diffDays <= 0
                return (
                  <Tooltip title={isExpired ? '已超过拟结束日期' : `距拟结束日期还有 ${diffDays} 天`}>
                    <span style={{ color: '#f5222d', fontSize: 11, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <HourglassFilled style={{ fontSize: 12 }} />
                      {isExpired ? '已到期' : `${diffDays}天`}
                    </span>
                  </Tooltip>
                )
              })()}
              <Tag color={STATUS_COLOR_MAP[item.status] || 'default'} style={{ marginRight: 0, fontSize: 11 }}>
                {item.status}
              </Tag>
            </Space>
          </Col>
        </Row>
        {/* 第二行：等级 + 类别 + 来源 + 技术类型 + 风险等级（全部 Tag） */}
        <div style={{ marginBottom: 4 }}>
          <Space size={4} wrap>
            <Tag
              color={GRADE_COLOR_MAP[item.grade] || '#bfbfbf'}
              style={{ marginRight: 0, fontSize: 11, color: GRADE_TEXT_COLOR_MAP[item.grade] || '#fff', borderColor: GRADE_COLOR_MAP[item.grade] || '#bfbfbf' }}
            >
              {item.grade}
            </Tag>
            <Tag
              color={LEVEL_COLOR_MAP[item.level] || '#91caff'}
              style={{ marginRight: 0, fontSize: 11, color: LEVEL_TEXT_COLOR_MAP[item.level] || '#fff', borderColor: LEVEL_COLOR_MAP[item.level] || '#91caff' }}
            >
              {item.level}
            </Tag>
            <Tag
              color={SOURCE_COLOR_MAP[item.source] || '#69b1ff'}
              style={{ marginRight: 0, fontSize: 11, color: SOURCE_TEXT_COLOR_MAP[item.source] || '#fff', borderColor: SOURCE_COLOR_MAP[item.source] || '#69b1ff' }}
            >
              {item.source}
            </Tag>
            <Tag
              color={TECH_TYPE_COLOR_MAP[item.techType] || '#8c8c8c'}
              style={{ marginRight: 0, fontSize: 11, color: TECH_TYPE_TEXT_COLOR_MAP[item.techType] || '#fff', borderColor: TECH_TYPE_COLOR_MAP[item.techType] || '#8c8c8c' }}
            >
              {item.techType}
            </Tag>
            <Tag
              color={RISK_COLOR_MAP[item.riskLevel] || '#8c8c8c'}
              style={{ marginRight: 0, fontSize: 11, color: RISK_TEXT_COLOR_MAP[item.riskLevel] || '#fff', borderColor: RISK_COLOR_MAP[item.riskLevel] || '#8c8c8c' }}
            >
              {item.riskLevel}
            </Tag>
          </Space>
        </div>
        {/* 第三行：申请人 + 申请科室 + 申请时间 */}
        <Row gutter={[4, 2]}>
          <Col span={8}>
            <Text type="secondary" style={{ fontSize: 11 }}>申请人：{item.applicant || '-'}</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary" style={{ fontSize: 11 }}>科室：{item.department || '-'}</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary" style={{ fontSize: 11 }}>申请：{item.applyDate || '-'}</Text>
          </Col>
        </Row>
      </div>
    )
  }

  // 右侧下方标签
  const rightTabs = [
    { key: 'case', label: '开展病例', children: <CaseInfoTab status={selectedRecord?.status || ''} techName={selectedRecord?.techName || ''} onOpenCaseDrawer={(mode, record) => {
      if (mode === 'add') {
        caseForm.resetFields()
      } else if (record) {
        // 编辑或查看模式下，设置表单值
        const admissionDate = record.admissionDate ? dayjs(record.admissionDate as string) : undefined
        const applyDate = record.applyDate ? dayjs(record.applyDate as string) : undefined
        
        caseForm.setFieldsValue({
          visitType: record.visitType,
          visitNo: record.visitNo,
          patientName: record.name, // 数据中的 name 映射到表单的 patientName
          gender: record.gender,
          age: record.age,
          phone: record.phone,
          address: record.address,
          admissionDate: admissionDate && admissionDate.isValid() ? admissionDate : undefined,
          department: record.department,
          doctor: record.doctor,
          diagnosis: record.diagnosis,
          patientInformed: record.hasConsent, // 数据中的 hasConsent 映射到表单的 patientInformed
          consentFile: [], // 默认为空文件列表
          applyDate: applyDate && applyDate.isValid() ? applyDate : undefined,
          effectEval: record.effectEval,
          hasComplication: record.hasComplication,
          complicationDetail: record.complicationDetail,
          hasAdverseReaction: record.hasAdverseReaction,
          adverseReactionDetail: record.adverseReactionDetail,
          experienceSummary: record.experience, // 数据中的 experience 映射到表单的 experienceSummary
          followUp: record.followUp,
        })
      }
      setCaseDrawerMode(mode)
      setCaseDrawerOpen(true)
    }} /> },
    { key: 'stage', label: '阶段评估', children: <StageEvaluation 
      status={selectedRecord?.status || ''} 
      onOpenDrawer={(mode) => {
        if (mode === 'add') stageForm.resetFields()
        setStageDrawerMode(mode)
        setStageDrawerOpen(true)
      }}
    /> },
    { key: 'convert', label: '转常规申请', children: <ConvertApply 
      status={selectedRecord?.status || ''}
      onOpenDrawer={(mode) => {
        if (mode === 'add') convertForm.resetFields()
        setConvertDrawerMode(mode)
        setConvertDrawerOpen(true)
      }}
    /> },
    { key: 'effect', label: '效果评价', children: <EffectEvaluation 
      status={selectedRecord?.status || ''}
      onOpenDrawer={(mode) => {
        if (mode === 'add') effectForm.resetFields()
        setEffectDrawerMode(mode)
        setEffectDrawerOpen(true)
      }}
    /> },
    { key: 'suspend', label: '中止记录', children: <PauseStopRecord
      status={selectedRecord?.status || ''}
      onOpenDrawer={(mode) => {
        if (mode === 'add') pauseStopForm.resetFields()
        setPauseStopDrawerMode(mode)
        setPauseStopDrawerOpen(true)
      }}
    /> },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 查询条件栏 */}
      <Card size="small" style={{ marginBottom: 12, flexShrink: 0 }}>
        <Row align="middle" justify="space-between" gutter={12}>
          <Col flex="none">
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('tech')}>
                新技术申请
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => handleAdd('project')}
                style={{ background: '#95de64', borderColor: '#95de64', color: '#fff' }}
              >
                新项目申请
              </Button>
            </Space>
          </Col>
          <Col flex="auto">
            <Row align="middle" gutter={12} justify="end">
              <Col>
                <Select
                  placeholder="申请科室"
                  value={deptFilter}
                  onChange={(v) => { setDeptFilter(v); setCurrentPage(1) }}
                  style={{ width: 130 }}
                  allowClear
                  options={[
                    { label: '肝胆外科', value: '肝胆外科' },
                    { label: '心血管内科', value: '心血管内科' },
                    { label: '骨科', value: '骨科' },
                    { label: '神经外科', value: '神经外科' },
                    { label: '放射科', value: '放射科' },
                    { label: '消化内科', value: '消化内科' },
                  ]}
                />
              </Col>
              <Col>
                <Input
                  placeholder="申请人"
                  value={applicantFilter}
                  onChange={(e) => { setApplicantFilter(e.target.value); setCurrentPage(1) }}
                  allowClear
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  style={{ width: 120 }}
                />
              </Col>
              <Col>
                <Input
                  placeholder="技术名称"
                  value={techNameFilter}
                  onChange={(e) => { setTechNameFilter(e.target.value); setCurrentPage(1) }}
                  allowClear
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  style={{ width: 120 }}
                />
              </Col>
              <Col>
                <Select
                  placeholder="技术状态"
                  value={techStatusFilter}
                  onChange={(v) => { setTechStatusFilter(v); setCurrentPage(1) }}
                  style={{ width: 110 }}
                  allowClear
                  options={[
                    { label: '临时', value: '临时' },
                    { label: '未开展', value: '未开展' },
                    { label: '申请中', value: '申请中' },
                    { label: '试运行', value: '试运行' },
                    { label: '被暂停', value: '被暂停' },
                    { label: '被终止', value: '被终止' },
                    { label: '常规', value: '常规' },
                  ]}
                />
              </Col>
              <Col>
                <RangePicker
                  placeholder={['申请开始', '申请结束']}
                  style={{ width: 220 }}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setApplyDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')])
                    } else {
                      setApplyDateRange(null)
                    }
                    setCurrentPage(1)
                  }}
                />
              </Col>
              <Col>
                <Space size={8}>
                  <Button type="primary" icon={<SearchOutlined />} onClick={() => setCurrentPage(1)}>查询</Button>
                  <Button onClick={() => {
                    setDeptFilter(undefined)
                    setApplicantFilter('')
                    setTechNameFilter('')
                    setTechStatusFilter(undefined)
                    setApplyDateRange(null)
                    setCurrentPage(1)
                  }}>重置</Button>
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 左右主体布局 - flex 填充剩余高度，左右各自独立滚动 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 12, overflow: 'hidden' }}>
        {/* 左侧：技术列表 */}
        <div style={{ width: '25%', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Card
            size="small"
            styles={{ body: { padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            style={{ flex: 1, minHeight: 0 }}
          >
            {/* 卡片列表（独立滚动） */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {pagedData.length > 0
                ? pagedData.map(renderListCard)
                : <Empty description="暂无数据" style={{ marginTop: 40 }} />
              }
            </div>
            {/* 分页（固定底部） */}
            {filteredData.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 8, flexShrink: 0, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={filteredData.length}
                  onChange={(page) => setCurrentPage(page)}
                  size="small"
                  showTotal={(total) => `共 ${total} 条`}
                  showSizeChanger={false}
                />
              </div>
            )}
          </Card>
        </div>

        {/* 右侧（时间轴固定 + 标签页独立滚动） */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* ── 技术信息 + 时间轴合并容器（固定不滚动） ── */}
          <Card
            size="small"
            style={{ marginBottom: 12, border: 'none', flexShrink: 0 }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            {/* 技术名称（居中，无边框） */}
            {selectedRecord ? (
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <Space size={8} align="center">
                  <Text strong style={{ fontSize: 15 }}>{selectedRecord.techName}</Text>
                  <Tag
                    color={STATUS_COLOR_MAP[selectedRecord.status] || 'default'}
                    style={{ fontSize: 11 }}
                  >
                    {selectedRecord.status}
                  </Tag>
                </Space>
              </div>
            ) : (
              <Empty description="请从左侧选择一条技术记录" style={{ marginTop: 20 }} />
            )}

          {/* ── 技术发展时间轴 v9（并行分支上下分行 + 直线连接） ── */}
          {selectedRecord && (() => {
            const r = selectedRecord
            const s = r.status

            // ── 日期格式化 ──
            const fmtDate = (d?: string) => d ? d.slice(0, 10) : ''  // YYYY-MM-DD

            // ── 阶段定义 ──
            // 主流程: 草稿(0)→申请(1)→试运行(2)→开展病例(3)/阶段评估(4)→转常规(5)→效果评价(6)
            // 末位环节: 暂停(7)/终止(8)
            // 显示规则：
            //   试运行/常规（未发生暂停/终止）→ 只渲染 idx=7，标签"暂停/终止"，一个入口按钮
            //   被暂停 → 渲染 idx=7(暂停) + idx=8(终止)，已申请暂停后补充终止环节
            //   被终止 → 渲染 idx=7(暂停，带日期无按钮) + idx=8(终止)，终止环节前补充暂停环节
            // idx 索引始终为 0-8，但末位环节的渲染和 allX 位置按需调整
            const phases = [
              { key: 'draft',   label: '草稿',     color: '#8c8c8c', date: fmtDate(r.applyDate) },
              { key: 'apply',   label: '申请',     color: '#1677ff', date: fmtDate(r.applyDate) },
              { key: 'trial',   label: '试运行',   color: '#13c2c2', date: fmtDate(r.startDate) },
              { key: 'case',    label: '开展病例', color: '#0958d9', date: fmtDate(r.startDate) },
              { key: 'eval',    label: '阶段评估', color: '#389e0d', date: fmtDate(r.startDate) },
              { key: 'convert', label: '转常规',   color: '#722ed1', date: fmtDate(r.endDate) },
              { key: 'effect',  label: '效果评价', color: '#531dab', date: fmtDate(r.endDate) },
              // 末位环节 — 标签根据状态动态决定
              { key: 'pause',   label: s === '被暂停' || s === '被终止' ? '暂停' : '暂停/终止', color: '#ff4d4f', date: fmtDate(r.pauseDate) },
              { key: 'stop',    label: '终止',     color: '#cf1322', date: fmtDate(r.stopDate) },
            ]

            // ── 是否需要渲染 idx=8（终止）节点 ──
            // 被暂停/被终止 → 渲染终止(8)；试运行/常规 → 不渲染终止(8)
            const showStopNode = s === '被暂停' || s === '被终止'
            // ── 是否需要渲染 idx=7 节点 ── 始终渲染，但标签/按钮不同
            const showPauseStopNode = true

            // ── allX 根据是否渲染终止节点调整 ──
            // 不渲染终止(8)时：末位环节 idx=7 占据 97% 位置，更靠右
            // 渲染终止(8)时：idx=7 在 85%，idx=8 在 97%
            const allX = showStopNode
              ? [3, 13, 23, 36, 48, 60, 73, 85, 97]   // 9节点：暂停(85) + 终止(97)
              : [3, 13, 23, 36, 48, 60, 73, 97, 97]    // 8节点效果：末位合并到97，idx=8占位同位置但不渲染

            // ── 当前阶段索引 ──
            // 被暂停 → idx=7(暂停节点激活)；被终止 → idx=8(终止节点激活)
            // 试运行/常规 → 暂停/终止合并为idx=7的一个入口
            const currentIdx =
              s === '未开展'  ? 0 :
              s === '申请中'  ? 1 :
              s === '被暂停'  ? 7 :
              s === '被终止'  ? 8 :  // 被终止时 idx=8 是终止节点
              s === '试运行'  ? 2 :
              s === '常规'    ? 6 :
              0

            const isDone = (idx: number) => idx < currentIdx
            const isActive = (idx: number) => idx === currentIdx
            // 试运行状态下，开展病例(3)、阶段评估(4)、转常规(5) 三个并行环节都视为"可操作"
            const isTrialPhase = currentIdx === 2
            const isRegularPhase = currentIdx === 6  // 常规
            const isAfterTrial = isTrialPhase || isRegularPhase
            const isPaused = s === '被暂停'
            const isStopped = s === '被终止'
            // 申请暂停/终止的可操作条件
            const canApplyPauseStop = isAfterTrial && !isPaused && !isStopped  // 试运行/常规 → 合并入口
            const canApplyStop = isPaused  // 被暂停 → 可申请终止(idx=8)
            const canApplyResume = isPaused || isStopped  // 被暂停/被终止 → 可申请重启
            // 综合可操作判断
            const isOperable = (idx: number) => {
              if (idx === 7) {
                // 试运行/常规：合并入口 → 可操作
                // 被暂停：暂停节点 → 可操作（申请重启）
                // 被终止：暂停节点 → 不可操作（只显示日期）
                return canApplyPauseStop || (isPaused && canApplyResume)
              }
              if (idx === 8) {
                // 被暂停 → 可申请终止(idx=8)；被终止 → 可申请重启(idx=8)
                return canApplyStop || canApplyResume
              }
              return isActive(idx) || (isTrialPhase && (idx === 3 || idx === 4 || idx === 5))
            }
            // ── 节点视觉状态 ──
            // idx=7:
            //   试运行/常规（合并入口）→ 'future'(灰) 或 'active'(可操作)
            //   被暂停 → 'pause-occurred'(红色已发生)
            //   被终止 → 'pause-occurred'(红色已发生，暂停环节)
            // idx=8:
            //   被暂停 → 'future'(灰) 或 'active'(可操作-可申请终止)
            //   被终止 → 'stop-occurred'(深红已发生)
            //   其他 → 'future'
            const nodeState = (idx: number): 'done' | 'pause-occurred' | 'stop-occurred' | 'active' | 'future' => {
              if (idx === 7) {
                if (isPaused) return 'pause-occurred'       // 被暂停 → 红色已发生
                if (isStopped) return 'pause-occurred'      // 被终止 → 暂停环节也显示红色已发生
                if (isOperable(7)) return 'active'          // 合并入口可操作 → 本色
                return 'future'                              // 未发生 → 灰
              }
              if (idx === 8) {
                if (isStopped) return 'stop-occurred'         // 被终止 → 深红已发生
                if (isOperable(8)) return 'active'            // 被暂停下终止可申请 → 本色
                return 'future'                                // 其他 → 灰
              }
              if (isActive(idx) || isOperable(idx)) return 'active'
              if (isDone(idx)) return 'done'
              return 'future'
            }
            const dotBg = (idx: number, color: string) => {
              const st = nodeState(idx)
              if (st === 'done') return '#1677ff'
              if (st === 'pause-occurred') return '#ff4d4f'            // 红色"已发生"
              if (st === 'stop-occurred') return '#cf1322'             // 深红"已发生"
              if (st === 'active') return color                        // 节点本色
              return '#d9d9d9'                                          // 未发生：灰
            }
            const labelClr = (idx: number, color: string) => {
              const st = nodeState(idx)
              if (st === 'done') return '#1677ff'
              if (st === 'pause-occurred') return '#ff4d4f'
              if (st === 'stop-occurred') return '#cf1322'
              if (st === 'active') return color
              return '#bfbfbf'
            }

            // ── 完成情况数据（mock）──
            const caseCount = { current: 12, total: 20 }
            const effectCount = 2

            // ── 操作按钮 + 完成情况 ──
            // 权限矩阵：
            //  未开展状态:  草稿(0)=编辑+删除, 申请(1)=提交
            // 申请中状态:  申请(1)=撤回
            //  试运行状态:  开展病例(3)=新增, 阶段评估(4)=新增, 转常规(5)=申请, 暂停/终止(7)=暂停+终止两个按钮
            //  常规状态:    效果评价(6)=新增, 暂停/终止(7)=暂停+终止两个按钮
            //  被暂停状态:  暂停(7)="技术已暂停"+申请重启, 终止(8)=申请
            //  被终止状态:  暂停(7)只显示日期无按钮, 终止(8)="技术已终止"+重启按钮
            const renderExtra = (idx: number) => {
              const btnStyle = { fontSize: 9, padding: '0 4px', height: 18, borderRadius: 3 }
              // 已完成/非可操作节点：
              //  - 普通节点(idx 3/4/6) 显示完成情况
              //  - 已完成状态的草稿(0) 节点 → 查看（被终止/申请中/被暂停/试运行/常规）
              //  - 被终止状态下暂停(7) → 不可操作，返回null（暂停节点只显示日期）
              if (!isOperable(idx)) {
                if (idx === 3 && isDone(3)) return <span style={{ fontSize: 9, color: '#999' }}>已完成{caseCount.current}/{caseCount.total}份</span>
                if (idx === 4 && isDone(4)) return <span style={{ fontSize: 9, color: '#999' }}>已完成{evalCount}次</span>
                if (idx === 6 && isDone(6)) return <span style={{ fontSize: 9, color: '#999' }}>已完成{effectCount}次</span>
                // 已完成状态的草稿(0) 节点 → 查看（打开申请抽屉）
                if (idx === 0 && isDone(0)) {
                  return <Button size="small" icon={<EyeOutlined />} style={btnStyle} onClick={() => handleOpenAppDrawer('view')}>查看</Button>
                }
                return null
              }

              // 未开展状态（currentIdx===0）
              if (s === '未开展') {
                if (idx === 0) return (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'nowrap' }}>
                    <Button size="small" icon={<EditOutlined />} style={btnStyle} onClick={() => handleOpenAppDrawer('edit')}>编辑</Button>
                    <Button size="small" danger icon={<DeleteOutlined />} style={btnStyle}>删除</Button>
                  </div>
                )
                if (idx === 1) return (
                  <Button size="small" type="primary" style={{ ...btnStyle, background: '#1677ff', borderColor: '#1677ff' }}>提交</Button>
                )
              }

              // 申请中状态（currentIdx===1）：申请节点 → 撤回
              if (s === '申请中' && idx === 1) {
                return (
                  <Button size="small" icon={<RollbackOutlined />} style={btnStyle}>撤回</Button>
                )
              }

              // 试运行状态（currentIdx===2，isOperable 已让 3/4/5/7/8 五个节点都进入此分支）
              if (s === '试运行') {
                if (idx === 3) return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Button size="small" type="primary" icon={<PlusOutlined />}
                      onClick={() => {
                        caseForm.resetFields()
                        setCaseDrawerMode('add')
                        setCaseDrawerOpen(true)
                      }}
                      style={btnStyle}>新增</Button>
                    <span style={{ fontSize: 9, color: '#999' }}>已完成{caseCount.current}/{caseCount.total}份</span>
                  </div>
                )
                if (idx === 4) return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Button size="small" type="primary" icon={<PlusOutlined />}
                      onClick={() => {
                        stageForm.resetFields()
                        setStageDrawerMode('add')
                        setStageDrawerOpen(true)
                      }}
                      style={{ ...btnStyle, background: '#52c41a', borderColor: '#52c41a' }}>新增</Button>
                    <span style={{ fontSize: 9, color: '#999' }}>已完成{evalCount}次</span>
                  </div>
                )
                if (idx === 5) return (
                  <Button size="small" type="primary" icon={<PlusOutlined />}
                    onClick={() => {
                      convertForm.resetFields()
                      setConvertDrawerMode('add')
                      setConvertDrawerOpen(true)
                    }}
                    style={{ ...btnStyle, background: '#722ed1', borderColor: '#722ed1' }}>申请</Button>
                )
              }

              // 常规状态（currentIdx===6）：效果评价节点 → 新增
              if (s === '常规' && idx === 6) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Button size="small" type="primary" icon={<PlusOutlined />}
                      onClick={() => {
                        effectForm.resetFields()
                        setEffectDrawerMode('add')
                        setEffectDrawerOpen(true)
                      }}
                      style={{ ...btnStyle, background: '#531dab', borderColor: '#531dab' }}>新增</Button>
                    <span style={{ fontSize: 9, color: '#999' }}>已完成{effectCount}次</span>
                  </div>
                )
              }

              // 试运行/常规状态下：暂停/终止(7) 合并入口 → 两个按钮并排
              if (isAfterTrial && idx === 7) {
                return (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'nowrap' }}>
                    <Button size="small" type="primary" style={{ ...btnStyle, background: '#ff4d4f', borderColor: '#ff4d4f' }}
                      onClick={() => {
                        pauseStopForm.resetFields()
                        setPauseStopDrawerType('暂停')
                        setPauseStopDrawerMode('add')
                        setPauseStopDrawerOpen(true)
                      }}
                    >暂停</Button>
                    <Button size="small" type="primary" style={{ ...btnStyle, background: '#cf1322', borderColor: '#cf1322' }}
                      onClick={() => {
                        pauseStopForm.resetFields()
                        setPauseStopDrawerType('终止')
                        setPauseStopDrawerMode('add')
                        setPauseStopDrawerOpen(true)
                      }}
                    >终止</Button>
                  </div>
                )
              }

              // 被暂停状态：暂停(7) → "技术已暂停"+申请重启，终止(8) → 申请
              if (s === '被暂停') {
                if (idx === 7) return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 9, color: '#ff4d4f' }}>技术已暂停</span>
                    <Button size="small" style={btnStyle}
                      onClick={() => {
                        pauseStopForm.resetFields()
                        setPauseStopDrawerType('重启')
                        setPauseStopDrawerMode('add')
                        setPauseStopDrawerOpen(true)
                      }}
                    >申请重启</Button>
                    {r.resumeDate && <span style={{ fontSize: 9, color: '#999' }}>已申请 {fmtDate(r.resumeDate)}</span>}
                  </div>
                )
                if (idx === 8) {
                  return (
                    <Button size="small" type="primary" style={{ ...btnStyle, background: '#cf1322', borderColor: '#cf1322' }}
                      onClick={() => {
                        pauseStopForm.resetFields()
                        setPauseStopDrawerType('终止')
                        setPauseStopDrawerMode('add')
                        setPauseStopDrawerOpen(true)
                      }}
                    >申请</Button>
                  )
                }
              }

              // 被终止状态：终止(8) → "技术已终止"+重启按钮
              if (s === '被终止' && idx === 8) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 9, color: '#cf1322' }}>技术已终止</span>
                    <Tag
                      color="#52c41a"
                      style={{ cursor: 'pointer', fontSize: 10, margin: 0, borderRadius: 3, padding: '0 4px', lineHeight: '18px' }}
                      onClick={() => {
                        pauseStopForm.resetFields()
                        setPauseStopDrawerType('重启')
                        setPauseStopDrawerMode('add')
                        setPauseStopDrawerOpen(true)
                      }}
                    >重启</Tag>
                    {r.resumeDate && <span style={{ fontSize: 9, color: '#999' }}>已申请 {fmtDate(r.resumeDate)}</span>}
                  </div>
                )
              }

              // 其他所有可操作节点 → 查看
              return (
                <Button size="small" icon={<EyeOutlined />} style={btnStyle}>查看</Button>
              )
            }

            // ── 节点渲染 ──
            // 节点 div 用 v9 方式：absolute 定位（left: X%, top: Y - dotSize/2）+ translateX(-50%)
            // renderNode 返回 fragment：圆圈（绝对居中）+ 文字/按钮
            // 文字/按钮位置：仅 idx===3（开展病例）放圆圈右侧，其他 idx 放圆圈正下方
            const dotSize = 48  // 圆圈尺寸加大以容纳 YYYY-MM-DD 完整日期
            const renderNode = (idx: number, label: string, color: string, date: string) => {
              const operable = isOperable(idx)
              const extra = renderExtra(idx)
              const sideRight = idx === 3  // 仅开展病例的文字/按钮放到圆圈右侧
              return (
                <>
                  {/* 圆圈：绝对居中于父容器，flex 三轴居中 + textAlign 兜底 */}
                  <div style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: dotSize, height: dotSize, borderRadius: '50%',
                    background: dotBg(idx, color), color: '#fff',
                    fontSize: 8.5, fontWeight: 600, lineHeight: 1,
                    textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                    boxShadow: operable ? `0 0 0 3px ${color}33` : 'none',
                    zIndex: 2,
                  }}>
                    {date || '-'}
                  </div>
                  {/* 文字 + 按钮：仅开展病例(3)放右侧，其他放正下方 */}
                  <div style={sideRight ? {
                    // 右侧：圆圈右边缘 + 8px，垂直居中
                    position: 'absolute',
                    left: `calc(50% + ${dotSize / 2 + 8}px)`,
                    top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                    whiteSpace: 'nowrap', zIndex: 3, pointerEvents: 'auto',
                  } : {
                    // 正下方：圆圈底边 + 2px，水平居中
                    position: 'absolute',
                    left: '50%', top: `calc(50% + ${dotSize / 2 + 2}px)`,
                    transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    whiteSpace: 'nowrap', zIndex: 3, pointerEvents: 'auto',
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: operable ? 700 : 400,
                      color: labelClr(idx, color),
                    }}>
                      {label}
                    </div>
                    {extra}
                  </div>
                </>
              )
            }

            // ── 布局参数 ──
            // 开展病例(3) 在上行 caseY，阶段评估(4) 在下行 evalY，主线节点统一 centerY
            // 节点顺序: 草稿(0)→申请(1)→试运行(2)→开展病例(3)/阶段评估(4)→转常规(5)→效果评价(6)→暂停/终止(7)[终止(8)]
            const centerY = 60   // 主线统一Y坐标（容器中部）
            const caseY = 24     // 开展病例(3) 节点Y（上行）
            const evalY = 96     // 阶段评估(4) 节点Y（下行）

            // ── 连接线颜色 ──
            const lineColor = (done: boolean) => done ? '#1677ff' : '#e8e8e8'

            // v9 + v11：SVG 高度 140，容纳上行/下行的分叉节点及圆圈下方的文字/按钮
            const svgHeight = 140

            return (
              <div style={{ padding: '4px 0' }}>
                <div style={{ position: 'relative', width: '100%', height: svgHeight }}>
                  {/* ── SVG 连接线层（折线/直线段） ── */}
                  <svg width="100%" height={svgHeight} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
                    {/* 直线段：草稿→申请→试运行 */}
                    {[1, 2].map(i => (
                      <line key={`main-${i}`}
                        x1={`${allX[i - 1]}%`} y1={centerY} x2={`${allX[i]}%`} y2={centerY}
                        stroke={lineColor(isDone(i))} strokeWidth="2" />
                    ))}

                    {/* 分叉直线 —— 试运行(2) → 开展病例(3) 斜上 */}
                    <line
                      x1={`${allX[2]}%`} y1={centerY}
                      x2={`${allX[3]}%`} y2={caseY}
                      stroke={lineColor(isDone(3) || isOperable(3))} strokeWidth="2" />
                    {/* 分叉直线 —— 试运行(2) → 阶段评估(4) 斜下 */}
                    <line
                      x1={`${allX[2]}%`} y1={centerY}
                      x2={`${allX[4]}%`} y2={evalY}
                      stroke={lineColor(isDone(4) || isOperable(4))} strokeWidth="2" />

                    {/* 合并直线 —— 开展病例(3) → 转常规(5) 斜下 */}
                    <line
                      x1={`${allX[3]}%`} y1={caseY}
                      x2={`${allX[5]}%`} y2={centerY}
                      stroke={lineColor(isDone(5) || isOperable(5))} strokeWidth="2" />
                    {/* 合并直线 —— 阶段评估(4) → 转常规(5) 斜上 */}
                    <line
                      x1={`${allX[4]}%`} y1={evalY}
                      x2={`${allX[5]}%`} y2={centerY}
                      stroke={lineColor(isDone(5) || isOperable(5))} strokeWidth="2" />

                    {/* 直线段：转常规→效果评价 */}
                    <line x1={`${allX[5]}%`} y1={centerY} x2={`${allX[6]}%`} y2={centerY}
                      stroke={lineColor(isDone(6))} strokeWidth="2" />

                    {/* 末位环节 —— 效果评价(6) → 暂停/终止(7)
                        所有状态都有一条线到 idx=7 */}
                    <line x1={`${allX[6]}%`} y1={centerY} x2={`${allX[7]}%`} y2={centerY}
                      stroke={
                        nodeState(7) === 'pause-occurred' || nodeState(7) === 'active' || isOperable(7) ? '#ff4d4f' :
                        nodeState(7) === 'stop-occurred' ? '#cf1322' :
                        lineColor(isDone(7))
                      }
                      strokeWidth="2" />
                    {/* 被暂停/被终止状态下：暂停(7) → 终止(8) 额外连线 */}
                    {showStopNode && (
                      <line x1={`${allX[7]}%`} y1={centerY} x2={`${allX[8]}%`} y2={centerY}
                        stroke={
                          nodeState(8) === 'active' || isOperable(8) ? '#cf1322' :
                          lineColor(isDone(8))
                        }
                        strokeWidth="2" />
                    )}
                  </svg>

                  {/* ── 节点层（节点 div 提供 dotSize×dotSize 的尺寸上下文） ── */}
                  {/* 节点 div: absolute 定位 + width/height=dotSize，圆圈在 div 内绝对居中
                      文字/按钮：仅开展病例(3)放圆圈右侧，其他 idx 放正下方 */}
                  {/* 主线节点: 草稿(0) 申请(1) 试运行(2) 转常规(5) 效果评价(6) */}
                  {[0, 1, 2, 5, 6].map(idx => (
                    <div key={phases[idx].key} style={{
                      position: 'absolute', left: `${allX[idx]}%`, top: centerY - dotSize / 2,
                      width: dotSize, height: dotSize,
                      transform: 'translateX(-50%)', zIndex: 2,
                    }}>
                      {renderNode(idx, phases[idx].label, phases[idx].color, phases[idx].date)}
                    </div>
                  ))}

                  {/* 末位环节节点 —— 暂停/终止(7)，与主线同 Y */}
                  {showPauseStopNode && (
                    <div key={phases[7].key} style={{
                      position: 'absolute', left: `${allX[7]}%`, top: centerY - dotSize / 2,
                      width: dotSize, height: dotSize,
                      transform: 'translateX(-50%)', zIndex: 2,
                    }}>
                      {renderNode(7, phases[7].label, phases[7].color, phases[7].date)}
                    </div>
                  )}
                  {/* 被暂停状态下的终止(8) 节点 */}
                  {showStopNode && (
                    <div key={phases[8].key} style={{
                      position: 'absolute', left: `${allX[8]}%`, top: centerY - dotSize / 2,
                      width: dotSize, height: dotSize,
                      transform: 'translateX(-50%)', zIndex: 2,
                    }}>
                      {renderNode(8, phases[8].label, phases[8].color, phases[8].date)}
                    </div>
                  )}

                  {/* 并行分支节点 —— 开展病例(3) 上行 caseY / 阶段评估(4) 下行 evalY */}
                  <div key={phases[3].key} style={{
                    position: 'absolute', left: `${allX[3]}%`, top: caseY - dotSize / 2,
                    width: dotSize, height: dotSize,
                    transform: 'translateX(-50%)', zIndex: 2,
                  }}>
                    {renderNode(3, phases[3].label, phases[3].color, phases[3].date)}
                  </div>
                  <div key={phases[4].key} style={{
                    position: 'absolute', left: `${allX[4]}%`, top: evalY - dotSize / 2,
                    width: dotSize, height: dotSize,
                    transform: 'translateX(-50%)', zIndex: 2,
                  }}>
                    {renderNode(4, phases[4].label, phases[4].color, phases[4].date)}
                  </div>
                </div>
              </div>
            )
          })()}
          </Card>



          {/* 右下：标签页（滚动由表格内部 scroll 控制） */}
          <Card size="small" style={{ flex: 1, minHeight: 0 }} styles={{ body: { padding: '0 12px 0' } }}>
            <Tabs
              activeKey={activeRightTab}
              onChange={(key) => setActiveRightTab(key)}
              items={rightTabs}
              size="small"
              tabBarStyle={{ marginBottom: 12 }}
            />
          </Card>
        </div>
      </div>

      {/* 开展病例 - 新增/编辑/查看抽屉 */}
      <Drawer
        title={
          <span>
            {caseDrawerMode === 'add' ? '新增' : caseDrawerMode === 'edit' ? '编辑' : '查看'}开展病例
            {selectedRecord?.techName && (
              <>
                {' — '}
                <Text strong style={{ fontSize: 16, color: '#fa8c16' }}>{selectedRecord.techName}</Text>
              </>
            )}
          </span>
        }
        open={caseDrawerOpen}
        onClose={() => setCaseDrawerOpen(false)}
        width={960}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
        footer={
          caseDrawerMode === 'view' ? null : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setCaseDrawerOpen(false)}>取消</Button>
              <Button onClick={() => {
                caseForm.validateFields().then(() => {
                  message.success('开展病例已暂存')
                  setCaseDrawerOpen(false)
                  caseForm.resetFields()
                })
              }}>暂存</Button>
              <Button type="primary" onClick={() => {
                caseForm.validateFields().then(() => {
                  message.success(caseDrawerMode === 'add' ? '开展病例已新增' : '开展病例已保存')
                  setCaseDrawerOpen(false)
                  caseForm.resetFields()
                })
              }}>
                提交申请
              </Button>
            </div>
          )
        }
      >
        <div style={{ display: 'flex', height: '100%' }}>
          {/* 左侧纵向导航 */}
          <div style={{ width: 160, borderRight: '1px solid #f0f0f0', padding: '8px 0', flexShrink: 0 }}>
            <Menu
              mode="inline"
              selectedKeys={[caseActiveSection]}
              onClick={({ key }) => caseScrollToSection(key)}
              items={caseSectionMenuItems}
              style={{ borderInlineEnd: 'none' }}
            />
          </div>
          {/* 右侧表单内容区，上下滚动 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', maxHeight: 'calc(100vh - 120px)' }}>
          <Form form={caseForm} layout="horizontal" size="small" labelAlign="left" labelCol={{ flex: '0 0 88px' }} wrapperCol={{ flex: '1' }} initialValues={{ visitType: '住院', patientInformed: false, hasComplication: false, hasAdverseReaction: false }} disabled={caseDrawerMode === 'view'}>
            {/* 病例信息 */}
            <div ref={(el) => { caseSectionRefs.current[0] = el }} style={{ marginBottom: 24, scrollMarginTop: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>病例信息</div>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="visitType" label="诊疗类别" rules={[{ required: true, message: '请选择' }]} style={{ marginBottom: 8 }}>
                    <Select placeholder="请选择" options={[
                      { label: '门诊', value: '门诊' },
                      { label: '住院', value: '住院' },
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="visitNo" label={watchVisitType === '门诊' ? '门诊号' : '住院号'} rules={[{ required: true, message: '请输入' }]} style={{ marginBottom: 8 }}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="patientName" label="患者姓名" rules={[{ required: true, message: '请输入' }]} style={{ marginBottom: 8 }}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                </Col>
              </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择' }]} style={{ marginBottom: 8 }}>
                  <Select placeholder="请选择" options={[
                    { label: '男', value: '男' },
                    { label: '女', value: '女' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="age" label="年龄" rules={[{ required: true, message: '请输入' }]} style={{ marginBottom: 8 }}>
                  <InputNumber placeholder="请输入" min={0} max={150} style={{ width: '100%' }} addonAfter="岁" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="phone" label="联系电话" style={{ marginBottom: 8 }}>
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="address" label="联系地址" style={{ marginBottom: 8 }}>
                  <Input placeholder="请输入" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="admissionDate" label={watchVisitType === '门诊' ? '就诊日期' : '入院日期'} rules={[{ required: true, message: '请选择' }]} style={{ marginBottom: 8 }}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="department" label={watchVisitType === '门诊' ? '就诊科室' : '在院科室'} rules={[{ required: true, message: '请输入' }]} style={{ marginBottom: 8 }}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="doctor" label={watchVisitType === '门诊' ? '就诊医师' : '主治医师'} rules={[{ required: true, message: '请输入' }]} style={{ marginBottom: 8 }}>
                    <Input placeholder="请输入" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="diagnosis" label="临床诊断" rules={[{ required: true, message: '请输入' }]} style={{ marginBottom: 8 }}>
                    <Input.TextArea rows={2} placeholder="请输入临床诊断" />
                  </Form.Item>
                </Col>
              </Row>

            </div>

            {/* 应用信息 */}
            <div ref={(el) => { caseSectionRefs.current[1] = el }} style={{ marginBottom: 24, scrollMarginTop: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>应用信息</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="applyDate" label="应用日期" rules={[{ required: true, message: '请选择' }]} style={{ marginBottom: 8 }}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="effectEval" label="效果评价" style={{ marginBottom: 8 }}>
                    <Select placeholder="请选择" allowClear options={[
                      { label: '治愈', value: '治愈' },
                      { label: '好转', value: '好转' },
                      { label: '无效', value: '无效' },
                      { label: '恶化', value: '恶化' },
                      { label: '死亡', value: '死亡' },
                    ]} />
                  </Form.Item>
                </Col>
              </Row>

            <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="patientInformed" label="患者知情" valuePropName="checked" style={{ marginBottom: 8 }}>
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="知情同意书" style={{ marginBottom: 8 }}>
                    <Space>
                      <Upload beforeUpload={() => false} maxCount={1} fileList={caseForm.getFieldValue('consentFile') || []} onChange={(info) => {
                        caseForm.setFieldValue('consentFile', info.fileList)
                      }}>
                        <Button icon={<UploadOutlined />}>上传文件</Button>
                      </Upload>
                      {(() => {
                        const fileList = caseForm.getFieldValue('consentFile')
                        if (!fileList || fileList.length === 0) return null
                        return (
                          <a style={{ color: '#1890ff' }} onClick={() => {
                            const file = fileList[0]?.originFileObj || fileList[0]
                            if (file) {
                              const url = URL.createObjectURL(file)
                              window.open(url)
                            }
                          }}>预览：{fileList[0]?.name || '文件'}</a>
                        )
                      })()}
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

            <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="hasComplication" label="并发症" valuePropName="checked" style={{ marginBottom: 8 }}>
                    <Switch checkedChildren="是" unCheckedChildren="否" onChange={(v) => { if (!v) caseForm.setFieldValue('complicationDetail', '') }} />
                  </Form.Item>
                </Col>
                <Col span={18}>
                  <Form.Item name="complicationDetail" label="详情" rules={watchHasComplication ? [{ required: true, message: '请输入' }] : []} style={{ marginBottom: 8, display: watchHasComplication ? undefined : 'none' }}>
                    <Input.TextArea rows={1} placeholder="请输入并发症或合并症详情" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="hasAdverseReaction" label="不良反应" valuePropName="checked" style={{ marginBottom: 8 }}>
                    <Switch checkedChildren="是" unCheckedChildren="否" onChange={(v) => { if (!v) caseForm.setFieldValue('adverseReactionDetail', '') }} />
                  </Form.Item>
                </Col>
                <Col span={18}>
                  <Form.Item name="adverseReactionDetail" label="详情" rules={watchHasAdverseReaction ? [{ required: true, message: '请输入' }] : []} style={{ marginBottom: 8, display: watchHasAdverseReaction ? undefined : 'none' }}>
                    <Input.TextArea rows={1} placeholder="请输入不良反应详情" />
                  </Form.Item>
                </Col>
              </Row>
            <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="experienceSummary" label="经验总结" style={{ marginBottom: 8 }}>
                    <Input.TextArea rows={3} placeholder="请输入经验总结" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="followUp" label="随访情况" style={{ marginBottom: 8 }}>
                    <Input.TextArea rows={2} placeholder="请输入随访情况" />
                  </Form.Item>
                </Col>
              </Row>
          </div>
</Form>
          </div>
        </div>
      </Drawer>

      {/* 阶段评估抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {stageDrawerMode === 'add' ? '新增' : stageDrawerMode === 'edit' ? '编辑' : '查看'}阶段评估
            </span>
            {/* 自动识别当前第几次自评 — 橙色Tab标签 */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fa8c16',
                color: '#fff',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                padding: '2px 10px',
                lineHeight: '22px',
              }}
            >
              第{stageDrawerMode === 'add' ? (evalCount + 1) : 1}次自评
            </span>
          </div>
        }
        open={stageDrawerOpen}
        onClose={() => setStageDrawerOpen(false)}
        width={960}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
        footer={
          stageDrawerMode === 'view' ? null : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setStageDrawerOpen(false)}>取消</Button>
              <Button onClick={() => {
                stageForm.validateFields().then(() => {
                  message.success('阶段评估已暂存')
                  setStageDrawerOpen(false)
                  stageForm.resetFields()
                })
              }}>暂存</Button>
              <Button type="primary" onClick={() => {
                stageForm.validateFields().then(() => {
                  message.success(stageDrawerMode === 'add' ? '阶段评估已新增' : '阶段评估已保存')
                  setStageDrawerOpen(false)
                  stageForm.resetFields()
                })
              }}>提交</Button>
            </div>
          )
        }
      >
        <div style={{ padding: '24px 24px' }}>
          <Form form={stageForm} layout="horizontal" disabled={stageDrawerMode === 'view'}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="safetyLevel" label="安全性评价等级" style={{ marginBottom: 8 }}>
                  <Select placeholder="请选择" allowClear options={[
                    { label: 'A级', value: 'A' },
                    { label: 'B级', value: 'B' },
                    { label: 'C级', value: 'C' },
                    { label: 'D级', value: 'D' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="qualityLevel" label="医疗质量评价等级" style={{ marginBottom: 8 }}>
                  <Select placeholder="请选择" allowClear options={[
                    { label: '优秀', value: '优秀' },
                    { label: '良好', value: '良好' },
                    { label: '合格', value: '合格' },
                    { label: '不合格', value: '不合格' },
                  ]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="socialBenefit" label="社会效益" style={{ marginBottom: 8 }}>
              <Input.TextArea rows={4} placeholder="请输入社会效益" maxLength={2000} showCount />
            </Form.Item>
            <Form.Item name="economicBenefit" label="经济效益" style={{ marginBottom: 8 }}>
              <Input.TextArea rows={4} placeholder="请输入经济效益" maxLength={2000} showCount />
            </Form.Item>
            <Form.Item name="stageSummary" label="阶段总结" style={{ marginBottom: 8 }}>
              <Input.TextArea rows={4} placeholder="请输入阶段总结" maxLength={2000} showCount />
            </Form.Item>
            <Form.Item name="existingProblems" label="存在问题" style={{ marginBottom: 8 }}>
              <Input.TextArea rows={4} placeholder="请输入存在问题" maxLength={2000} showCount />
            </Form.Item>
            <Form.Item name="improvementMeasures" label="改进措施" style={{ marginBottom: 8 }}>
              <Input.TextArea rows={4} placeholder="请输入改进措施" maxLength={2000} showCount />
            </Form.Item>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>附件</div>
            <Form.Item name="attachments" style={{ marginBottom: 8 }}>
              <Upload.Dragger beforeUpload={() => false} multiple
                style={{ width: '20%' }}
              >
                <p className="ant-upload-drag-icon" style={{ fontSize: 8, margin: '4px 0' }}>
                  <UploadOutlined style={{ fontSize: 8 }} />
                </p>
                <p style={{ fontSize: 11, margin: '2px 0' }}>点击或拖拽上传</p>
                <p style={{ color: '#999', fontSize: 10, margin: '2px 0' }}>不超过 500 兆</p>
              </Upload.Dragger>
            </Form.Item>
          </Form>
        </div>
      </Drawer>

      {/* 转常规申请抽屉 */}
      <Drawer
        title={
          <span>
            {convertDrawerMode === 'add' ? '新增' : convertDrawerMode === 'edit' ? '编辑' : '查看'}转常规申请
            {selectedRecord?.techName && (
              <>
                {' — '}
                <Text strong style={{ fontSize: 16, color: '#722ed1' }}>{selectedRecord.techName}</Text>
              </>
            )}
          </span>
        }
        open={convertDrawerOpen}
        onClose={() => setConvertDrawerOpen(false)}
        width={960}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
        footer={
          convertDrawerMode === 'view' ? null : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setConvertDrawerOpen(false)}>取消</Button>
              <Button onClick={() => {
                convertForm.validateFields().then(() => {
                  message.success('转常规申请已暂存')
                  setConvertDrawerOpen(false)
                  convertForm.resetFields()
                })
              }}>暂存</Button>
              <Button type="primary" onClick={() => {
                convertForm.validateFields().then(() => {
                  message.success(convertDrawerMode === 'add' ? '转常规申请已提交' : '转常规申请已保存')
                  setConvertDrawerOpen(false)
                  convertForm.resetFields()
                })
              }}>提交</Button>
            </div>
          )
        }
      >
        <div style={{ padding: '24px 24px' }}>
          <Form form={convertForm} layout="horizontal" disabled={convertDrawerMode === 'view'}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>转常规自评(试运行总结)</div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="trialEndDate" label="试用结束日期" rules={[{ required: true, message: '请选择' }]} style={{ marginBottom: 8 }}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="clinicalEffect" label="临床应用效果" style={{ marginBottom: 8 }}>
                  <Select placeholder="请选择" allowClear options={[
                    { label: '显著', value: '显著' },
                    { label: '良好', value: '良好' },
                    { label: '一般', value: '一般' },
                    { label: '不佳', value: '不佳' },
                  ]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="safety" label="安全性" rules={[{ required: true, message: '请输入' }]} style={{ marginBottom: 8 }}>
              <Input.TextArea rows={4} placeholder="请输入安全性评估" maxLength={2000} showCount />
            </Form.Item>
            <Form.Item name="adaptability" label="适应性" rules={[{ required: true, message: '请输入' }]} style={{ marginBottom: 8 }}>
              <Input.TextArea rows={4} placeholder="请输入适应性评估" maxLength={2000} showCount />
            </Form.Item>
            <Form.Item name="contraindication" label="禁忌症" rules={[{ required: true, message: '请输入' }]} style={{ marginBottom: 8 }}>
              <Input.TextArea rows={4} placeholder="请输入禁忌症说明" maxLength={2000} showCount />
            </Form.Item>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>附件</div>
            <Form.Item name="attachments" style={{ marginBottom: 8 }}>
              <Upload.Dragger beforeUpload={() => false} multiple>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p>点击或拖拽文件到此处上传</p>
                <p style={{ color: '#999', fontSize: 12 }}>上传文件不要超过 500 兆</p>
              </Upload.Dragger>
            </Form.Item>
          </Form>
        </div>
      </Drawer>

      {/* 效果评价抽屉 */}
      <Drawer
        title={
          <span>
            {effectDrawerMode === 'add' ? '新增' : effectDrawerMode === 'edit' ? '编辑' : '查看'}效果评价
            {selectedRecord?.techName && (
              <>
                {' — '}
                <Text strong style={{ fontSize: 16, color: '#531dab' }}>{selectedRecord.techName}</Text>
              </>
            )}
          </span>
        }
        open={effectDrawerOpen}
        onClose={() => setEffectDrawerOpen(false)}
        width={960}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
        footer={
          effectDrawerMode === 'view' ? null : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setEffectDrawerOpen(false)}>取消</Button>
              <Button onClick={() => {
                effectForm.validateFields().then(() => {
                  message.success('效果评价已暂存')
                  setEffectDrawerOpen(false)
                  effectForm.resetFields()
                })
              }}>暂存</Button>
              <Button type="primary" onClick={() => {
                effectForm.validateFields().then(() => {
                  message.success(effectDrawerMode === 'add' ? '效果评价已新增' : '效果评价已保存')
                  setEffectDrawerOpen(false)
                  effectForm.resetFields()
                })
              }}>提交</Button>
            </div>
          )
        }
      >
        <div style={{ padding: '24px 24px' }}>
          <Form form={effectForm} layout="horizontal" disabled={effectDrawerMode === 'view'}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>效果评价</div>
            <Form.Item name="content" label="评价内容" rules={[{ required: true, message: '请输入评价内容' }]} style={{ marginBottom: 8 }}>
              <Input.TextArea rows={12} placeholder="请输入效果评价内容" />
            </Form.Item>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>附件</div>
            <Form.Item name="attachments" style={{ marginBottom: 8 }}>
              <Upload.Dragger beforeUpload={() => false} multiple>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p>点击或拖拽文件到此处上传</p>
                <p style={{ color: '#999', fontSize: 12 }}>上传文件不要超过 500 兆</p>
              </Upload.Dragger>
            </Form.Item>
          </Form>
        </div>
      </Drawer>

      {/* 暂停/终止/重启申请抽屉 */}
      <Drawer
        title={`${pauseStopDrawerType}申请`}
        open={pauseStopDrawerOpen}
        onClose={() => setPauseStopDrawerOpen(false)}
        width={680}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
        footer={
          pauseStopDrawerMode === 'view' ? null : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setPauseStopDrawerOpen(false)}>取消</Button>
              <Button type="primary" onClick={() => {
                pauseStopForm.validateFields().then(() => {
                  message.success(pauseStopDrawerType === '重启' ? '重启申请已提交' : `${pauseStopDrawerType}申请已提交`)
                  setPauseStopDrawerOpen(false)
                  pauseStopForm.resetFields()
                })
              }}>
                提交
              </Button>
            </div>
          )
        }
      >
        <div style={{ padding: '20px 24px' }}>
          {/* ── 申请表单 ── */}
          <Form form={pauseStopForm} layout="horizontal" disabled={pauseStopDrawerMode === 'view'}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="reason" label={`${pauseStopDrawerType}原因`} rules={[{ required: true, message: '请选择原因' }]}>
                  <Select placeholder="请选择" allowClear options={
                    pauseStopDrawerType === '暂停' ? [
                      { label: '设备损坏', value: '设备损坏' },
                      { label: '上级部门要求', value: '上级部门要求' },
                      { label: '人员变动', value: '人员变动' },
                      { label: '安全隐患', value: '安全隐患' },
                      { label: '经费不足', value: '经费不足' },
                      { label: '其他', value: '其他' },
                    ] : pauseStopDrawerType === '终止' ? [
                      { label: '效果不达预期', value: '效果不达预期' },
                      { label: '上级部门要求', value: '上级部门要求' },
                      { label: '严重不良事件', value: '严重不良事件' },
                      { label: '伦理问题', value: '伦理问题' },
                      { label: '经费终止', value: '经费终止' },
                      { label: '其他', value: '其他' },
                    ] : [
                      { label: '条件已恢复', value: '条件已恢复' },
                      { label: '上级部门批准', value: '上级部门批准' },
                      { label: '设备已修复', value: '设备已修复' },
                      { label: '人员到位', value: '人员到位' },
                      { label: '其他', value: '其他' },
                    ]
                  } />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="说明" rules={[{ required: true, message: '请填写说明' }]}>
              <Input.TextArea rows={6} placeholder="请输入详细说明" maxLength={2000} showCount />
            </Form.Item>
            <Form.Item name="attachments" label="附件">
              <Upload.Dragger beforeUpload={() => false} multiple style={{ width: '40%' }}>
                <p className="ant-upload-drag-icon" style={{ fontSize: 12, margin: '4px 0' }}>
                  <UploadOutlined style={{ fontSize: 12 }} />
                </p>
                <p style={{ fontSize: 11, margin: '2px 0' }}>点击或拖拽上传</p>
                <p style={{ color: '#999', fontSize: 10, margin: '2px 0' }}>不超过 500 兆</p>
              </Upload.Dragger>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
      <Drawer
        title={
          addDrawerMode === 'view' ? (addDrawerType === 'tech' ? '查看技术申请' : '查看项目申请')
            : addDrawerMode === 'edit' ? (addDrawerType === 'tech' ? '编辑技术申请' : '编辑项目申请')
            : (addDrawerType === 'tech' ? '新建技术申请' : '新建项目申请')
        }
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        width={960}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
        footer={
          addDrawerMode === 'view' ? null : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setAddDrawerOpen(false)}>取消</Button>
              <Button onClick={() => {
                form.validateFields().then(() => {
                  message.success('申请已暂存')
                  setAddDrawerOpen(false)
                }).catch(() => message.warning('请完善必填项'))
              }}>暂存</Button>
              <Button
                type="primary"
                onClick={() => {
                  form.validateFields().then(() => {
                    message.success(addDrawerMode === 'edit' ? '保存成功！' : '申请提交成功！')
                    setAddDrawerOpen(false)
                  }).catch(() => message.warning('请完善必填项'))
                }}
              >
                提交
              </Button>
            </div>
          )
        }
      >
        <div style={{ display: 'flex', height: '100%' }}>
          {/* 左侧纵向导航 */}
          <div style={{ width: 160, borderRight: '1px solid #f0f0f0', padding: '8px 0', flexShrink: 0 }}>
            <Menu
              mode="inline"
              selectedKeys={[activeSection]}
              onClick={({ key }) => scrollToSection(key)}
              items={sectionMenuItems}
              style={{ borderInlineEnd: 'none' }}
            />
          </div>
          {/* 右侧表单内容区 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', maxHeight: 'calc(100vh - 120px)' }}>
            {renderAllSections()}
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default TechApplication
