// ==================== 会诊系统共享类型 ====================

/** 会诊类型 */
export type ConsultationType = 'emergency' | 'regular' | 'mdt' | 'remote' | 'external'

/** 会诊紧急程度 */
export type UrgencyLevel = 'emergency' | 'normal'

/** 会诊方式 */
export type ConsultationMethod = 'onsite' | 'online'

/** 会诊范围 */
export type ConsultationScope = 'intra_dept' | 'inter_dept' | 'hospital_wide' | 'external' | 'remote'

/** 会诊状态 */
export type ConsultationStatus =
  | 'draft'          // 草稿
  | 'pending_approval' // 待审批
  | 'approved'       // 已审批
  | 'rejected'       // 已退回
  | 'scheduled'      // 已排班
  | 'in_progress'    // 进行中
  | 'completed'      // 已完成
  | 'archived'       // 已归档
  | 'cancelled'      // 已取消

/** 审批状态 */
export type ApprovalResult = 'approved' | 'rejected' | 'modify'

/** 签到状态 */
export type CheckInStatus = 'checked' | 'absent' | 'late'

/** 随访状态 */
export type FollowupStatus = 'pending' | 'completed' | 'overdue' | 'lost'

/** 会诊类型显示配置 */
export const CONSULTATION_TYPE_MAP: Record<ConsultationType, { label: string; color: string }> = {
  emergency: { label: '急会诊', color: '#ff4d4f' },
  regular:   { label: '单科会诊', color: '#1677ff' },
  mdt:       { label: 'MDT会诊', color: '#722ed1' },
  remote:    { label: '远程会诊', color: '#13c2c2' },
  external:  { label: '外请会诊', color: '#fa8c16' },
}

/** 会诊状态显示配置 */
export const STATUS_MAP: Record<ConsultationStatus, { label: string; color: string }> = {
  draft:            { label: '草稿', color: '#8c8c8c' },
  pending_approval: { label: '待审批', color: '#faad14' },
  approved:         { label: '已审批', color: '#1677ff' },
  rejected:         { label: '已退回', color: '#ff4d4f' },
  scheduled:        { label: '已排班', color: '#13c2c2' },
  in_progress:      { label: '进行中', color: '#722ed1' },
  completed:        { label: '已完成', color: '#52c41a' },
  archived:         { label: '已归档', color: '#8c8c8c' },
  cancelled:        { label: '已取消', color: '#bfbfbf' },
}

/** 审批状态（会诊申请/审批维度） */
export type ApprovalStatus =
  | 'draft'            // 草稿
  | 'pending_approval' // 申请中
  | 'rejected'         // 已驳回
  | 'revoked'          // 已撤销
  | 'approved'         // 已审批

export const APPROVAL_STATUS_MAP: Record<ApprovalStatus, { label: string; color: string }> = {
  draft:            { label: '草稿',   color: '#8c8c8c' },
  pending_approval: { label: '申请中', color: '#faad14' },
  rejected:         { label: '已驳回', color: '#ff4d4f' },
  revoked:          { label: '已撤销', color: '#bfbfbf' },
  approved:         { label: '已审批', color: '#1677ff' },
}

/** 会诊状态（会诊执行阶段维度） */
export type ConsultationStage =
  | 'applying'     // 申请中
  | 'to_arrange'   // 待安排
  | 'to_notify'    // 待通知
  | 'in_progress'  // 会诊中
  | 'completed'    // 会诊结束

export const CONSULTATION_STAGE_MAP: Record<ConsultationStage, { label: string; color: string }> = {
  applying:    { label: '申请中',   color: '#faad14' },
  to_arrange:  { label: '待安排',   color: '#1677ff' },
  to_notify:   { label: '待通知',   color: '#13c2c2' },
  in_progress: { label: '会诊中',   color: '#722ed1' },
  completed:   { label: '会诊结束', color: '#52c41a' },
}

/** 由旧 status 推导审批状态 */
export const APPROVAL_STATUS_FROM: Record<ConsultationStatus, ApprovalStatus> = {
  draft:            'draft',
  pending_approval: 'pending_approval',
  approved:         'approved',
  rejected:         'rejected',
  scheduled:        'approved',
  in_progress:      'approved',
  completed:        'approved',
  archived:         'approved',
  cancelled:        'revoked',
}

/** 由旧 status 推导会诊状态 */
export const CONSULTATION_STAGE_FROM: Record<ConsultationStatus, ConsultationStage> = {
  draft:            'applying',
  pending_approval: 'applying',
  approved:         'to_arrange',
  rejected:         'applying',
  scheduled:        'to_notify',
  in_progress:      'in_progress',
  completed:        'completed',
  archived:         'completed',
  cancelled:        'applying',
}

/** 紧急程度配置 */
export const URGENCY_MAP: Record<UrgencyLevel, { label: string; color: string; deadline: string }> = {
  emergency: { label: '急会诊', color: '#ff4d4f', deadline: '10分钟内到位' },
  normal:    { label: '普通会诊', color: '#1677ff', deadline: '24小时内完成' },
}

/** 会诊范围配置 */
export const SCOPE_MAP: Record<ConsultationScope, { label: string }> = {
  intra_dept:    { label: '科内会诊' },
  inter_dept:    { label: '科间会诊' },
  hospital_wide: { label: '全院会诊' },
  external:      { label: '外请会诊' },
  remote:        { label: '远程会诊' },
}

/** 会诊方式配置 */
export const CONSULTATION_METHOD_MAP: Record<ConsultationMethod, { label: string; color: string }> = {
  onsite: { label: '现场会诊', color: '#1677ff' },
  online: { label: '线上会诊',  color: '#13c2c2' },
}

// ==================== 核心数据模型 ====================

/** 会诊申请单 */
export interface ConsultationRecord {
  id: string
  /** 患者信息 */
  patientName: string
  patientGender: '男' | '女'
  patientAge: number
  contact?: string           // 联系方式
  patientType?: 'inpatient' | 'outpatient' // 患者类型：住院 / 门诊
  admissionNo: string        // 住院号
  outpatientNo?: string      // 门诊号
  bedNo?: string              // 床位号
  /** 申请信息 */
  applyDept: string           // 申请科室
  applicant: string           // 申请人
  applicantTitle?: string     // 申请人职称(选填)
  applyTime: string           // 申请时间(到分钟)
  /** 会诊信息 */
  consultationType: ConsultationType
  urgencyLevel: UrgencyLevel
  consultationMethod: ConsultationMethod
  scope: ConsultationScope
  targetDepts: string[]       // 受邀科室(现称特邀科室)
  inviteDoctor?: string       // 单科会诊：邀请医师（选填，下拉）
  inviteDoctorTitle?: string  // 单科会诊：邀请医师职称（选填，下拉）
  proposedTeam?: string[]     // 拟邀团队(团队专家姓名)
  mdtInvites?: { dept: string; title: string; doctor: string }[]  // MDT按科室邀请：科室/职称/医师（邀请对象=按科室时）
  invitedExperts?: string[]   // 受邀专家(姓名)
  experts?: { unit: string; name: string; title: string }[]  // 院外会诊：受邀专家列表
  purpose: string             // 会诊目的
  plannedConsultTime?: string // 拟会诊时间(YYYY-MM-DD)
  briefHistory: string        // 病情摘要
  diagnosis?: string          // 入院诊断
  treatmentProcess?: string   // 治疗过程
  attachments?: string[]      // 附件
  /** 流程状态 */
  status: ConsultationStatus
  approvalStatus?: ApprovalStatus   // 审批状态：草稿/申请中/已驳回/已撤销/已审批
  consultationStatus?: ConsultationStage // 会诊状态：申请中/待安排/待通知/会诊中/会诊结束
  approvalTime?: string       // 审批时间
  approver?: string           // 审批人
  approvalNote?: string       // 审批意见
  scheduledTime?: string      // 排班时间
  scheduledLocation?: string // 排班地点
  arrivalTime?: string       // 人员到达时间
  assignedExperts?: string[] // 分配专家
  /** 安排信息（已审批后由排班人填写） */
  arrangeDepts?: string[]     // 邀请科室
  meetingRoom?: string        // 会议室
  meetingNo?: string          // 会议号
  arrangeRemark?: string      // 备注（会诊安排时填写，选填）
  completionTime?: string    // 完成时间
  consultStartTime?: string  // 会诊开始时间
  consultEndTime?: string    // 会诊结束时间
  consultOpinion?: string    // 会诊意见
  participants?: string      // 参加人员（逗号分隔）
  emergencyMeasures?: string // 急会诊：紧急处理措施
  treatmentPlan?: string     // 单科会诊：建议治疗方案
  host?: string              // MDT：主持人
  deptOpinions?: string      // MDT：各科室意见
  consensusPlan?: string     // MDT：综合诊疗方案
  remotePlatform?: string    // 远程会诊：远程平台
  remoteUnit?: string       // 远程会诊：远程单位
  remoteExpert?: string      // 远程会诊：上级专家/医院
  externalHospital?: string  // 院外会诊：外院名称
  externalExpert?: string     // 院外会诊：外院专家
  consultCost?: string       // 院外会诊：会诊费用
  followupStatus?: FollowupStatus
  cancelReason?: string      // 取消原因
  cancelTime?: string        // 取消时间
}

/** MDT团队 */
export interface MDTTeam {
  id: string
  teamName: string            // 团队名称(病种)
  diseaseCategory: string    // 病种分类
  leadDept: string            // 牵头科室
  leader: string              // 团队负责人
  members: MDTMember[]        // 团队成员
  scheduleDay: string         // 固定时间
  scheduleLocation: string   // 固定地点
  status: 'active' | 'inactive'
  createdAt: string
  totalCases: number          // 累计会诊量
}

/** MDT团队成员 */
export interface MDTMember {
  name: string
  dept: string
  title: string              // 职称
  role: 'leader' | 'secretary' | 'member' // 角色
  expertise: string          // 专业领域
}

/** 专家信息 */
export interface ExpertInfo {
  id: string
  name: string
  dept: string
  title: string               // 职称
  expertise: string[]        // 专业领域
  phone: string
  availability: 'available' | 'busy' | 'off'
  consultationCount: number  // 累计会诊次数
  responseRate: number       // 及时响应率
  satisfaction: number       // 满意度
}

/** 随访记录 */
export interface FollowupRecord {
  id: string
  consultationId: string     // 关联会诊单
  patientName: string
  dept: string
  consultDate: string
  planDate: string            // 计划随访日期
  actualDate?: string         // 实际随访日期
  status: FollowupStatus
  outcome?: string            // 疗效评估
  note?: string
}

/** 质控指标 */
export interface QCMetric {
  key: string
  name: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'flat'
  urgent: boolean
}

// ==================== 专家团队管理 ====================

/** 专家角色 */
export type ExpertRole = 'leader' | 'core' | 'regular' | 'secretary' | 'consultant'

/** 专家角色显示配置 */
export const EXPERT_ROLE_MAP: Record<ExpertRole, { label: string; color: string }> = {
  leader:    { label: '负责人',   color: '#f5222d' },
  core:      { label: '核心专家', color: '#722ed1' },
  regular:   { label: '常规专家', color: '#1677ff' },
  secretary: { label: '秘书',     color: '#fa8c16' },
  consultant: { label: '特邀顾问', color: '#13c2c2' },
}

/** 团队级别 */
export const TEAM_LEVEL_MAP: Record<ExpertTeamGroup['teamLevel'], { label: string; color: string }> = {
  L1: { label: '一级', color: '#52c41a' },
  L2: { label: '二级', color: '#1677ff' },
  L3: { label: '三级', color: '#722ed1' },
  L4: { label: '四级', color: '#fa8c16' },
  L5: { label: '五级', color: '#f5222d' },
}

/** 专家团队成员 */
export interface ExpertTeamMember {
  id: string
  teamId: string
  expertId: string            // 关联专家库ID
  name: string
  dept: string               // 自动获取
  title: string              // 自动获取
  phone: string              // 自动获取
  role: ExpertRole           // 角色
  specialtyTags: string[]    // 专业方向（标签，可自动新增）
  academicBackground?: string // 学科背景
  memberStatus?: 'normal' | 'out' // 状态：正常 / 外出
}

/** 专家成员状态显示配置 */
export const MEMBER_STATUS_MAP: Record<'normal' | 'out', { label: string; color: string }> = {
  normal: { label: '正常', color: '#52c41a' },
  out:    { label: '外出', color: '#fa8c16' },
}

/** 专家团队 */
export interface ExpertTeamGroup {
  id: string
  teamName: string           // 团队名称
  teamLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' // 团队级别：一级~五级
  leadDept: string           // 牵头科室（必填，单选）
  establishDate?: string     // 成立日期（YYYY-MM-DD）
  specialtyArea: string      // 介绍（原专业领域）
  diseaseCodes: string[]     // 专攻病种（ICD-10 国家临床版2.0代码）
  leader: string             // 负责人（专家ID）
  consultLocation?: string   // 指定会诊地点
  consultWeekday?: string    // 指定会诊时间 - 每周几
  consultTime?: string       // 指定会诊时间 - 几点几分（HH:mm）
  status: 'active' | 'inactive' // 启用/停用
  createdAt: string
}

/** 疾病分类代码（国家临床版2.0 子集） */
export interface DiseaseCode {
  code: string
  name: string
  category: string           // 大类
}

/** 专家人员库（下拉选择用） */
export interface ExpertStaff {
  id: string
  name: string
  workNo: string             // 工号
  dept: string
  title: string
  phone: string
}

/** 专业方向标签预设（可自动新增） */
export const SPECIALTY_TAG_PRESETS: string[] = [
  '冠脉介入', '心律失常', '心力衰竭', '高血压', '结构性心脏病',
  '呼吸危重症', '哮喘', 'COPD', '肺部感染', '呼吸内镜',
  '消化内镜', '肝病', '炎症性肠病', '胰腺疾病', '消化道肿瘤',
  '脑血管病', '癫痫', '帕金森', '认知障碍', '神经免疫',
  '糖尿病', '甲状腺疾病', '骨代谢', '肾上腺疾病', '垂体疾病',
  '白血病', '淋巴瘤', '骨髓瘤', '贫血', '凝血障碍',
  '肾脏病理', '透析', '肾移植', '高血压肾损害', 'AKI',
  '类风湿关节炎', '系统性红斑狼疮', '强直性脊柱炎', '干燥综合征', '血管炎',
  '感染性疾病', '发热待查', '抗菌药物管理', '医院感染', '寄生虫病',
  '肿瘤化疗', '靶向治疗', '免疫治疗', '肿瘤放疗', '肿瘤介入',
  '微创手术', '腔镜外科', '肝胆外科', '胃肠外科', '乳腺外科',
  '神经外科', '脊柱外科', '关节外科', '创伤骨科', '运动医学',
  '泌尿外科', '肾脏移植', '前列腺疾病', '泌尿系肿瘤', '男科',
  '妇产科', '生殖医学', '妇科肿瘤', '产科', '胎儿医学',
  '白内障', '青光眼', '眼底病', '视光学', '眼外伤',
  '耳科学', '鼻科学', '头颈外科', '咽喉科学', '气管食管',
  '口腔种植', '口腔正畸', '牙体牙髓', '口腔颌面外科', '口腔修复',
  '皮肤病', '性病', '皮肤病理', '皮肤美容', '皮肤免疫',
  '危重症', '创伤急救', '中毒救治', '灾害医学', '急诊内科',
  '心血管麻醉', '胸科麻醉', '神经麻醉', '产科麻醉', '疼痛诊疗',
  'CT/MR诊断', '介入放射', '超声诊断', '超声介入', '核医学',
  '分子病理', '细胞病理', '外科病理', '血液病理', '肾脏病理',
  '临床生化', '微生物检验', '免疫学检验', '分子诊断', '输血',
  '康复治疗', '物理治疗', '作业治疗', '言语治疗', '康复工程',
  '针灸推拿', '中医内科', '中医外科', '中西医结合', '中医妇科',
]

// ==================== 会议室管理 ====================

/** 会议室类型 */
export type RoomType = 'multimedia' | 'standard' | 'remote'

/** 会议室类型显示配置 */
export const ROOM_TYPE_MAP: Record<RoomType, { label: string; color: string }> = {
  multimedia: { label: '多媒体', color: '#722ed1' },
  standard:   { label: '普通',   color: '#1677ff' },
  remote:     { label: '远程',   color: '#13c2c2' },
}

/** 会议室状态 */
export type RoomStatus = 'enabled' | 'disabled'

/** 会议室状态显示配置 */
export const ROOM_STATUS_MAP: Record<RoomStatus, { label: string; color: string }> = {
  enabled:  { label: '启用', color: '#52c41a' },
  disabled: { label: '禁用', color: '#bfbfbf' },
}

/** 会议室 */
export interface MeetingRoom {
  id: string
  name: string               // 会议室名称
  location: string           // 位置
  type: RoomType             // 类型
  status: RoomStatus         // 状态
  capacity?: number          // 容纳人数（选填）
  equipment?: string[]       // 设备（选填）
  remark?: string            // 备注
  createdAt: string
}
