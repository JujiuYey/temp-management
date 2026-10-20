// 机构类型
export interface Organization {
  id: string
  name: string
  parentId?: string
  children?: Organization[]
}

// 科室类型
export interface Department {
  id: string
  code: string
  name: string
  organizationId: string
  status: 'enabled' | 'disabled'
}

// 员工类型
export interface Employee {
  id: string
  name: string
  code: string
  organizationId: string
}

// 考勤单元类型
export interface AttendanceUnit {
  id: string
  organizationId: string
  departmentId: string
  departmentCode: string
  departmentName: string
  attendanceOfficerId: string
  attendanceOfficerName: string
  attendanceOfficerCode: string
}

// 考勤年度
export interface AttendanceYear {
  id: string
  year: number
  monthLimit: number
  generateMode: 'natural' | 'manual'
  startDate: string
  endDate: string
  children?: AttendancePeriod[]
}

// 考勤期间
export interface AttendancePeriod {
  id: string
  attendanceYearId: string
  year: number
  month: number
  startDate: string
  endDate: string
  status: 'unarchived' | 'archived'
}

// 考勤人员属性
export interface AttendancePerson {
  id: string
  employeeId: string        // 员工ID
  employeeCode: string      // 工号
  employeeName: string      // 姓名
  adminOrgId: string        // 行政单位ID
  adminOrgName: string     // 行政单位名称
  adminDeptId: string       // 行政科室ID
  adminDeptName: string     // 行政科室名称
  attendanceUnitId: string  // 考勤单位ID
  attendanceUnitName: string // 考勤单位名称
  attendanceDeptId: string  // 考勤科室ID
  attendanceDeptName: string // 考勤科室名称
  checkIn: boolean          // 打卡
  scheduling: boolean       // 排班
  attendanceGroup?: 'flexible' | 'fixed'  // 考勤组
  status: boolean           // 状态 true=启用 false=停用
}

// 机构树节点
export interface OrgTreeNode {
  id: string
  name: string
  type: 'org' | 'dept'
  employeeCount: number
  children?: OrgTreeNode[]
}

// 菜单项
export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  children?: MenuItem[]
}

// 用户信息
export interface UserInfo {
  id: string
  name: string
  avatar?: string
  role: string
}

// 考勤组类型
export interface AttendanceGroup {
  id: string
  name: string
  checkIn: boolean
  attendanceMethod: 'fixed' | 'scheduling'  // 固定打卡/排班表打卡
  checkInMethod: string[]  // 地点打卡/WIFI打卡
  workDayStartTime?: string
  workDayEndTime?: string
  restDayStartTime?: string
  restDayEndTime?: string
  holidayStartTime?: string
  holidayEndTime?: string
  allowEarlyCheckIn?: number
  allowEarlyCheckOut?: number
  allowLateCheckOut?: number
  lateThreshold?: number
  seriousLateThreshold?: number
  absentThreshold?: number          // 上班迟到→半天缺卡阈值（分钟）
  fullDayAbsentThreshold?: number  // 上班迟到→一天缺卡阈值（分钟）
  earlyLeaveThreshold?: number          // 早退阈值（分钟）
  seriousEarlyLeaveThreshold?: number   // 严重早退阈值（分钟）
  earlyAbsentThreshold?: number        // 早退→半天缺卡阈值（分钟）
  earlyFullDayAbsentThreshold?: number // 早退→一天缺卡阈值（分钟）
  allowReplacementCount?: number
  allowReplacementTypes?: string[]  // 缺卡/迟到/早退
  replacementTimeLimit?: number  // 天
  memberCount: number
}

// 考勤分类
export type AttendanceCategory = 'leave' | 'overtime' | 'normal' | 'abnormal'

// 管理周期
export type ManagementCycle = 'year' | 'month' | 'once'

// 余额管理方式
export type BalanceManagement = 'clear' | 'extend' | 'forever'

// 有效期类型
export type ValidPeriodType = 'attendanceCycle' | 'fixedCycle' | 'permanent'

// 失效类型
export type ExpiryType = 'immediate' | 'delayed'

// 发放确认方式
export type GrantConfirmType = 'auto' | 'manual'

// 考勤项目
export interface AttendanceProject {
  id: string
  code: string              // 考勤项目编码
  name: string              // 考勤项目名称
  shortName?: string         // 简称
  symbol?: string            // 符号
  color?: string             // 颜色（十六进制）
  category: AttendanceCategory  // 考勤分类
  managementCycle: ManagementCycle  // 管理周期
  hasLimit?: boolean         // 限额（有/无）
  minLeaveUnit?: 'day' | 'halfDay'  // 最小请假单位
  controlBalance: boolean    // 是否控制余额
  calculateAbsence: boolean  // 是否算缺勤
  grantRule?: string         // 发放规则
  grantConfirmType?: GrantConfirmType  // 发放方式
  validPeriodType?: ValidPeriodType  // 有效期
  validPeriodDays?: number   // 固定周期有效天数
  expiryType?: ExpiryType    // 失效类型
  expiryDays?: number        // 失效天数
  skipHoliday: boolean      // 是否跳过节假日
  skipWeekend: boolean       // 是否跳过周末
  balanceManagement: BalanceManagement  // 余额管理方式
  extendDays?: number        // 延期天数
  attachmentRequired: boolean // 附件要求
  isSystem?: boolean        // 系统预设
  status: boolean            // 状态 true=启用 false=停用
  used?: boolean             // 是否已被使用（用于控制删除按钮）
}
