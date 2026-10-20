import React, { useState, useMemo } from 'react'
import {
  Drawer,
  Button,
  Tag,
  Avatar,
  Badge,
  Empty,
  Descriptions,
  message,
} from 'antd'
import {
  WarningOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
  ExportOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileProtectOutlined,
  DesktopOutlined,
} from '@ant-design/icons'

// ==================== 类型定义 ====================

/** 四类预警类型 */
type WarningType = 'overflow' | 'mismatch' | 'expiring' | 'missing'

/** 人员预警记录 */
interface PersonnelWarning {
  id: string
  type: WarningType
  employeeId: string
  name: string
  department: string
  title: string
  institution: string
  phone: string
  workPhone: string
  managementPosition: string
  /** 聘任日期 */
  appointmentDate: string
  /** 异常涉及权限名称 */
  permissionName: string
  /** 涉及系统（如 HIS / LIS 等） */
  systemName?: string
  /** 到期日期（仅临期类） */
  expireDate?: string
  /** 剩余天数（仅临期类） */
  daysToExpire?: number
  /** 异常原因 */
  abnormalReason: string
}

// ==================== 预警类型配置 ====================

const warningConfigs: Record<WarningType, {
  title: string
  desc: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  severity: 1 | 2 | 3
}> = {
  overflow: {
    title: '权限溢出',
    desc: '医务系统中无该权限，但对方系统中存在',
    color: '#fa8c16',
    bgColor: '#fff7e6',
    borderColor: '#ffd591',
    icon: <ExclamationCircleOutlined />,
    severity: 2,
  },
  mismatch: {
    title: '资质不匹配',
    desc: '人员权限与资质不匹配，且无破格标识',
    color: '#ff4d4f',
    bgColor: '#fff2f0',
    borderColor: '#ffccc7',
    icon: <WarningOutlined />,
    severity: 3,
  },
  expiring: {
    title: '权限临期',
    desc: '人员权限即将到期，请及时续期',
    color: '#faad14',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
    icon: <ClockCircleOutlined />,
    severity: 2,
  },
  missing: {
    title: '权限遗漏',
    desc: '医务系统中有该权限，但对方系统中不存在',
    color: '#1890ff',
    bgColor: '#e6f4ff',
    borderColor: '#91d5ff',
    icon: <MinusCircleOutlined />,
    severity: 1,
  },
}

// ==================== Mock 数据 ====================

const mockData: PersonnelWarning[] = [
  // ===== 权限溢出 (overflow) =====
  {
    id: 'ov-1',
    type: 'overflow',
    employeeId: 'GH20240015',
    name: '李建国',
    department: '心内科',
    title: '主治医师',
    institution: '本院(主院区)',
    phone: '13900100015',
    workPhone: '880015',
    managementPosition: '-',
    appointmentDate: '2023-08-15',
    permissionName: '心血管造影报告签发',
    systemName: 'PACS影像系统',
    abnormalReason: 'PACS影像系统中拥有「心血管造影报告签发」权限，但医务系统中无对应「报告签发权限」记录',
  },
  {
    id: 'ov-2',
    type: 'overflow',
    employeeId: 'GH20250008',
    name: '赵雅芝',
    department: '检验科',
    title: '主管技师',
    institution: '分院(东院区)',
    phone: '13900100008',
    workPhone: '880108',
    managementPosition: '-',
    appointmentDate: '2022-06-01',
    permissionName: '危急值报告',
    systemName: 'LIS检验系统',
    abnormalReason: 'LIS检验系统中拥有「危急值报告」权限，但医务系统中无对应权限记录',
  },
  {
    id: 'ov-3',
    type: 'overflow',
    employeeId: 'GH20250020',
    name: '黄志远',
    department: '普外科',
    title: '住院医师',
    institution: '本院(主院区)',
    phone: '13900100020',
    workPhone: '880020',
    managementPosition: '-',
    appointmentDate: '2025-07-10',
    permissionName: '全血使用申请',
    systemName: '用血管理系统',
    abnormalReason: '用血管理系统中拥有「全血使用申请」权限，但医务系统中无对应「临床用血权限」',
  },
  {
    id: 'ov-4',
    type: 'overflow',
    employeeId: 'GH20240033',
    name: '林晓燕',
    department: '心内科',
    title: '副主任医师',
    institution: '分院(东院区)',
    phone: '13900100033',
    workPhone: '880033',
    managementPosition: '科室副主任',
    appointmentDate: '2018-03-20',
    permissionName: '心血管造影报告签发',
    systemName: 'PACS影像系统',
    abnormalReason: 'PACS影像系统中拥有「心血管造影报告签发」权限，但医务系统中无对应「报告签发权限」记录',
  },

  // ===== 资质不匹配 (mismatch) =====
  {
    id: 'mm-1',
    type: 'mismatch',
    employeeId: 'GH20250010',
    name: '王小红',
    department: '骨科',
    title: '住院医师',
    institution: '本院(主院区)',
    phone: '13900100010',
    workPhone: '880010',
    managementPosition: '-',
    appointmentDate: '2025-06-01',
    permissionName: '三级手术主刀',
    systemName: '手术麻醉系统',
    abnormalReason: '职称「住院医师」不具备「三级手术主刀」资格要求（需主治医师及以上），且无破格审批标识',
  },
  {
    id: 'mm-2',
    type: 'mismatch',
    employeeId: 'GH20250012',
    name: '刘德华',
    department: '神经外科',
    title: '主治医师',
    institution: '本院(主院区)',
    phone: '13900100012',
    workPhone: '880012',
    managementPosition: '-',
    appointmentDate: '2022-09-15',
    permissionName: '四级手术主刀',
    systemName: '手术麻醉系统',
    abnormalReason: '职称「主治医师」不具备「四级手术主刀」资格要求（需副主任医师及以上），且无破格审批标识',
  },
  {
    id: 'mm-3',
    type: 'mismatch',
    employeeId: 'GH20250016',
    name: '马文涛',
    department: '妇产科',
    title: '住院医师',
    institution: '本院(主院区)',
    phone: '13900100016',
    workPhone: '880016',
    managementPosition: '-',
    appointmentDate: '2025-05-20',
    permissionName: '二级手术主刀',
    systemName: '手术麻醉系统',
    abnormalReason: '职称「住院医师」不具备「二级手术主刀」资格要求（需主治医师及以上），且无破格审批标识',
  },
  {
    id: 'mm-4',
    type: 'mismatch',
    employeeId: 'GH20240018',
    name: '钱小芳',
    department: '急诊科',
    title: '住院医师',
    institution: '本院(主院区)',
    phone: '13900100018',
    workPhone: '880018',
    managementPosition: '-',
    appointmentDate: '2024-11-10',
    permissionName: '麻醉药物处方权',
    systemName: 'HIS医院信息系统',
    abnormalReason: '职称「住院医师」不具备「麻醉药物处方权」资格要求（需主治医师及以上），且无破格审批标识',
  },
  {
    id: 'mm-5',
    type: 'mismatch',
    employeeId: 'GH20250022',
    name: '孙建斌',
    department: '骨科',
    title: '住院医师',
    institution: '分院(西院区)',
    phone: '13900100022',
    workPhone: '880022',
    managementPosition: '-',
    appointmentDate: '2025-03-01',
    permissionName: '三级手术主刀',
    systemName: '手术麻醉系统',
    abnormalReason: '职称「住院医师」不具备「三级手术主刀」资格要求（需主治医师及以上），且无破格审批标识',
  },

  // ===== 权限临期 (expiring) =====
  {
    id: 'ex-1',
    type: 'expiring',
    employeeId: 'GH20240001',
    name: '张明远',
    department: '普外科',
    title: '主任医师',
    institution: '本院(主院区)',
    phone: '13900100001',
    workPhone: '880001',
    managementPosition: '科室主任',
    appointmentDate: '2010-08-01',
    permissionName: '手术操作权限（四级）',
    systemName: '医务系统',
    expireDate: '2026-08-25',
    daysToExpire: 12,
    abnormalReason: '权限「手术操作权限（四级）」将于 2026-08-25 到期，距今 12 天，建议尽快办理续期',
  },
  {
    id: 'ex-2',
    type: 'expiring',
    employeeId: 'GH20240004',
    name: '陈志强',
    department: '麻醉科',
    title: '副主任医师',
    institution: '分院(东院区)',
    phone: '13900100004',
    workPhone: '880004',
    managementPosition: '科室副主任',
    appointmentDate: '2015-06-15',
    permissionName: '全身麻醉权限',
    systemName: '医务系统',
    expireDate: '2026-08-30',
    daysToExpire: 17,
    abnormalReason: '权限「全身麻醉权限」将于 2026-08-30 到期，距今 17 天，建议尽快办理续期',
  },
  {
    id: 'ex-3',
    type: 'expiring',
    employeeId: 'GH20240006',
    name: '周杰',
    department: '放射科',
    title: '主治医师',
    institution: '分院(西院区)',
    phone: '13900100006',
    workPhone: '880006',
    managementPosition: '-',
    appointmentDate: '2019-04-10',
    permissionName: 'MRI报告签发权限',
    systemName: '医务系统',
    expireDate: '2026-08-28',
    daysToExpire: 15,
    abnormalReason: '权限「MRI报告签发权限」将于 2026-08-28 到期，距今 15 天，建议尽快办理续期',
  },
  {
    id: 'ex-4',
    type: 'expiring',
    employeeId: 'GH20240009',
    name: '吴婷婷',
    department: '妇产科',
    title: '副主任医师',
    institution: '本院(主院区)',
    phone: '13900100009',
    workPhone: '880009',
    managementPosition: '科室副主任',
    appointmentDate: '2014-09-01',
    permissionName: '三级手术主刀权限',
    systemName: '医务系统',
    expireDate: '2026-09-05',
    daysToExpire: 23,
    abnormalReason: '权限「三级手术主刀权限」将于 2026-09-05 到期，距今 23 天，建议尽快办理续期',
  },
  {
    id: 'ex-5',
    type: 'expiring',
    employeeId: 'GH20240011',
    name: '郑伟',
    department: 'ICU',
    title: '主治医师',
    institution: '本院(主院区)',
    phone: '13900100011',
    workPhone: '880011',
    managementPosition: '-',
    appointmentDate: '2020-05-18',
    permissionName: '有创呼吸机操作权限',
    systemName: '医务系统',
    expireDate: '2026-08-20',
    daysToExpire: 7,
    abnormalReason: '权限「有创呼吸机操作权限」将于 2026-08-20 到期，距今仅 7 天，需立即办理续期',
  },
  {
    id: 'ex-6',
    type: 'expiring',
    employeeId: 'GH20240014',
    name: '徐丽华',
    department: '骨科',
    title: '副主任医师',
    institution: '本院(主院区)',
    phone: '13900100014',
    workPhone: '880014',
    managementPosition: '-',
    appointmentDate: '2016-11-20',
    permissionName: '抗菌药物处方权（限制级）',
    systemName: '医务系统',
    expireDate: '2026-08-27',
    daysToExpire: 14,
    abnormalReason: '权限「抗菌药物处方权（限制级）」将于 2026-08-27 到期，距今 14 天，建议尽快办理续期',
  },

  // ===== 权限遗漏 (missing) =====
  {
    id: 'mg-1',
    type: 'missing',
    employeeId: 'GH20240002',
    name: '黄海涛',
    department: '心内科',
    title: '主任医师',
    institution: '本院(主院区)',
    phone: '13900100002',
    workPhone: '880002',
    managementPosition: '科室主任',
    appointmentDate: '2008-07-01',
    permissionName: '心血管造影报告签发',
    systemName: 'PACS影像系统',
    abnormalReason: '医务系统中已授权「心血管造影报告签发」权限，但 PACS影像系统中未同步该权限',
  },
  {
    id: 'mg-2',
    type: 'missing',
    employeeId: 'GH20240005',
    name: '王立军',
    department: '急诊科',
    title: '副主任医师',
    institution: '本院(主院区)',
    phone: '13900100005',
    workPhone: '880005',
    managementPosition: '-',
    appointmentDate: '2013-02-25',
    permissionName: '紧急用血申请',
    systemName: '用血管理系统',
    abnormalReason: '医务系统中已授权「紧急用血申请」权限，但用血管理系统中未同步该权限',
  },
  {
    id: 'mg-3',
    type: 'missing',
    employeeId: 'GH20240007',
    name: '何小燕',
    department: '检验科',
    title: '技师',
    institution: '分院(东院区)',
    phone: '13900100007',
    workPhone: '880007',
    managementPosition: '-',
    appointmentDate: '2021-10-15',
    permissionName: '检验报告审核权限',
    systemName: 'LIS检验系统',
    abnormalReason: '医务系统中已授权「检验报告审核权限」，但 LIS检验系统中未同步该权限',
  },
  {
    id: 'mg-4',
    type: 'missing',
    employeeId: 'GH20240013',
    name: '罗志强',
    department: '普外科',
    title: '副主任医师',
    institution: '本院(主院区)',
    phone: '13900100013',
    workPhone: '880013',
    managementPosition: '-',
    appointmentDate: '2017-08-08',
    permissionName: '手术排班权限',
    systemName: '手术麻醉系统',
    abnormalReason: '医务系统中已授权「手术排班权限」，但手术麻醉系统中未同步该权限',
  },
]

// ==================== 工具函数 ====================

/** 获取姓名首字符作为头像 */
const getNameInitial = (name: string): string => {
  if (!name) return '?'
  return name.charAt(0)
}

// ==================== 人员网格组件 ====================

interface PersonGridProps {
  type: WarningType
  data: PersonnelWarning[]
  onItemClick: (record: PersonnelWarning) => void
}

const PersonGrid: React.FC<PersonGridProps> = ({
  type,
  data,
  onItemClick,
}) => {
  const config = warningConfigs[type]
  const count = data.length

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingTop: 12 }}>
        {count > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
          }}>
            {data.map((record) => (
              <div
                key={record.id}
                onClick={() => onItemClick(record)}
                style={{
                  background: '#fff',
                  border: `1px solid ${config.borderColor}`,
                  borderRadius: 8,
                  padding: '12px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = config.color
                  el.style.boxShadow = `0 2px 8px ${config.color}22`
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = config.borderColor
                  el.style.boxShadow = 'none'
                }}
              >
                {/* 头像 + 姓名 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar
                    size={32}
                    style={{
                      background: config.color,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {getNameInitial(record.name)}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {record.name}
                      <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400 }}>
                        [{record.employeeId}]
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {record.department}
                    </div>
                  </div>
                </div>
                {/* 权限名称 */}
                <div style={{
                  fontSize: 12,
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  overflow: 'hidden',
                }}>
                  <FileProtectOutlined style={{ color: config.color, fontSize: 11, flexShrink: 0 }} />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {record.permissionName}
                  </span>
                </div>
                {/* 临期天数 */}
                {record.type === 'expiring' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tag color="gold" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                      剩余 {record.daysToExpire} 天
                    </Tag>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '48px 0' }}>
            <Empty
              description={`暂无${config.title}预警`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>
  )
}

// ==================== 人员详情组件 ====================

interface DetailDrawerProps {
  record: PersonnelWarning | null
  open: boolean
  onClose: () => void
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ record, open, onClose }) => {
  if (!record) return null
  const config = warningConfigs[record.type]

  return (
    <Drawer
      title="人员预警详情"
      open={open}
      onClose={onClose}
      width={520}
      destroyOnClose
    >
      {/* 人员信息：一行两列 */}
      <div style={{
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        <Descriptions
          column={2}
          size="small"
          labelStyle={{ width: 80, color: '#666', fontSize: 13 }}
          contentStyle={{ fontSize: 14, color: '#222', fontWeight: 500 }}
          style={{ padding: '0 4px' }}
        >
          <Descriptions.Item label="所属机构">{record.institution || '-'}</Descriptions.Item>
          <Descriptions.Item label="所属科室">{record.department || '-'}</Descriptions.Item>
          <Descriptions.Item label="姓名">{record.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="工号">{record.employeeId || '-'}</Descriptions.Item>
          <Descriptions.Item label="职务">{record.managementPosition || '-'}</Descriptions.Item>
          <Descriptions.Item label="职称">{record.title || '-'}</Descriptions.Item>
        </Descriptions>
      </div>

      {/* 异常信息（含预警类型标签） */}
      <div style={{
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: config.color,
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {config.icon} 异常信息
          <Tag
            color={record.type === 'mismatch' ? 'red' : record.type === 'overflow' ? 'orange' : record.type === 'expiring' ? 'gold' : 'blue'}
            style={{ marginLeft: 8, margin: 0 }}
          >
            {config.title}
          </Tag>
        </div>
        <InfoRowSimple label="异常权限" value={record.permissionName} />
        {record.systemName && <InfoRowSimple label="涉及系统" value={record.systemName} />}
        {record.type === 'expiring' && record.expireDate && (
          <>
            <InfoRowSimple label="到期日期" value={record.expireDate} />
            <InfoRowSimple label="剩余天数" value={`${record.daysToExpire} 天`} highlight />
          </>
        )}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>异常原因：</div>
          <div style={{
            fontSize: 13,
            color: config.color,
            lineHeight: 1.6,
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: 4,
            border: `1px dashed ${config.borderColor}`,
          }}>
            {record.abnormalReason}
          </div>
        </div>
      </div>

    </Drawer>
  )
}

/** 信息行组件（参考截图样式：左侧标签，右侧值） */
const InfoRow: React.FC<{
  label: string
  value: string
  icon?: React.ReactNode
  last?: boolean
}> = ({ label, value, icon, last }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    borderBottom: last ? 'none' : '1px solid #f5f5f5',
    minHeight: 44,
  }}>
    <div style={{
      width: 100,
      fontSize: 13,
      color: '#666',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      {icon && <span style={{ color: '#999' }}>{icon}</span>}
      {label}：
    </div>
    <div style={{ flex: 1, fontSize: 14, color: '#222', fontWeight: 500 }}>
      {value || '-'}
    </div>
  </div>
)

/** 简化版信息行（用于异常信息区） */
const InfoRowSimple: React.FC<{
  label: string
  value: string
  highlight?: boolean
}> = ({ label, value, highlight }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    padding: '4px 0',
  }}>
    <div style={{ width: 80, fontSize: 12, color: '#666' }}>{label}：</div>
    <div style={{
      flex: 1,
      fontSize: 13,
      color: highlight ? '#fa8c16' : '#222',
      fontWeight: highlight ? 600 : 500,
    }}>
      {value || '-'}
    </div>
  </div>
)

// ==================== 主组件 ====================

const PermissionMonitor: React.FC = () => {
  // 临期天数参数（固定30天，可后续改为配置项）
  const expiringDays = 30

  // 当前激活页签
  const [activeTab, setActiveTab] = useState<WarningType>('overflow')

  // 当前查看的人员
  const [detailRecord, setDetailRecord] = useState<PersonnelWarning | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // 按类型分组数据
  const groupedData = useMemo(() => {
    const result: Record<WarningType, PersonnelWarning[]> = {
      overflow: [],
      mismatch: [],
      expiring: [],
      missing: [],
    }
    mockData.forEach(item => {
      // 临期类按参数过滤
      if (item.type === 'expiring') {
        if ((item.daysToExpire ?? 0) <= expiringDays) {
          result.expiring.push(item)
        }
      } else {
        result[item.type].push(item)
      }
    })
    return result
  }, [expiringDays])

  // 排序：临期类按剩余天数升序
  const sortedData = useMemo(() => {
    return {
      ...groupedData,
      expiring: [...groupedData.expiring].sort((a, b) =>
        (a.daysToExpire ?? 0) - (b.daysToExpire ?? 0)
      ),
    }
  }, [groupedData])

  const handleItemClick = (record: PersonnelWarning) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }

  const handleExport = (type: WarningType, count: number) => {
    if (count === 0) {
      message.warning('当前无数据可导出')
      return
    }
    message.success(`已导出 ${warningConfigs[type].title} 列表（${count} 条）`)
  }

  // 页签配置
  const tabItems: { key: WarningType; label: React.ReactNode }[] = [
    {
      key: 'overflow',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: warningConfigs.overflow.color,
          }} />
          权限溢出
          <span style={{ fontSize: 12, color: '#999' }}>({sortedData.overflow.length})</span>
        </span>
      ),
    },
    {
      key: 'mismatch',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: warningConfigs.mismatch.color,
          }} />
          资质不匹配
          <span style={{ fontSize: 12, color: '#999' }}>({sortedData.mismatch.length})</span>
        </span>
      ),
    },
    {
      key: 'expiring',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: warningConfigs.expiring.color,
          }} />
          权限临期
          <span style={{ fontSize: 12, color: '#999' }}>({sortedData.expiring.length})</span>
        </span>
      ),
    },
    {
      key: 'missing',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: warningConfigs.missing.color,
          }} />
          权限遗漏
          <span style={{ fontSize: 12, color: '#999' }}>({sortedData.missing.length})</span>
        </span>
      ),
    },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: 12,
    }}>
      {/* 顶部信息条 */}
      <div style={{
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DesktopOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontSize: 13, color: '#666' }}>
            当前监测三方系统：
          </span>
          <Tag color="blue" style={{ margin: 0 }}>HIS</Tag>
          <Tag color="blue" style={{ margin: 0 }}>LIS</Tag>
          <Tag color="blue" style={{ margin: 0 }}>PACS</Tag>
          <Tag color="blue" style={{ margin: 0 }}>EMR</Tag>
          <Tag color="blue" style={{ margin: 0 }}>手术麻醉系统</Tag>
          <Tag color="blue" style={{ margin: 0 }}>用血管理系统</Tag>
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>
          数据更新于：2026-08-13 18:00
        </div>
      </div>

      {/* 分类切换 + 导出 + 卡片区（合并） */}
      <div style={{
        flex: 1,
        minHeight: 0,
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 分类切换 + 导出按钮 */}
        <div style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {tabItems.map((item) => {
              const isActive = activeTab === item.key
              const config = warningConfigs[item.key]
              const count = sortedData[item.key].length
              return (
                <div
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: isActive ? config.bgColor : 'transparent',
                    border: isActive ? `1px solid ${config.borderColor}` : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: config.color,
                  }} />
                  <span style={{ fontSize: 13, color: '#333', fontWeight: isActive ? 600 : 400 }}>
                    {config.title}
                  </span>
                  <Badge count={count} style={{ backgroundColor: config.color }} />
                </div>
              )
            })}
          </div>
          <Button
            type="text"
            icon={<ExportOutlined />}
            onClick={() => handleExport(activeTab, sortedData[activeTab].length)}
            disabled={sortedData[activeTab].length === 0}
            style={{ color: '#666' }}
          >
            导出
          </Button>
        </div>

        {/* 人员卡片区 */}
        <div style={{ flex: 1, minHeight: 0, padding: '0 16px 12px 16px' }}>
          <PersonGrid
            type={activeTab}
            data={sortedData[activeTab]}
            onItemClick={handleItemClick}
          />
        </div>
      </div>

      {/* 人员详情抽屉 */}
      <DetailDrawer
        record={detailRecord}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  )
}

export default PermissionMonitor