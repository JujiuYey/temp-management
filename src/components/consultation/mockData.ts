import type {
  ConsultationRecord,
  ConsultationType,
  ConsultationStatus,
  UrgencyLevel,
  ConsultationMethod,
  ConsultationScope,
  MDTTeam,
  ExpertInfo,
  FollowupRecord,
  QCMetric,
  ExpertTeamGroup,
  ExpertTeamMember,
  ExpertStaff,
  DiseaseCode,
  ApprovalStatus,
  ConsultationStage,
  MeetingRoom,
} from './types'
import {
  APPROVAL_STATUS_FROM,
  CONSULTATION_STAGE_FROM,
} from './types'

// ==================== 科室列表 ====================
export const DEPARTMENTS = [
  '心血管内科', '呼吸内科', '消化内科', '神经内科', '内分泌科',
  '血液内科', '肾内科', '风湿免疫科', '感染科', '肿瘤科',
  '普外科', '胸外科', '神经外科', '泌尿外科', '骨科',
  '肝胆外科', '血管外科', '整形外科', '妇产科', '儿科',
  '眼科', '耳鼻喉科', '口腔科', '皮肤科', '急诊科',
  'ICU', '麻醉科', '放射科', '超声科', '病理科',
  '检验科', '药剂科', '康复科', '中医科', '介入科',
]

export const TITLES = ['住院医师', '主治医师', '副主任医师', '主任医师', '教授']

// ==================== 会诊申请 Mock 数据 ====================
const typeList: ConsultationType[] = ['emergency', 'regular', 'mdt', 'remote', 'external']
const urgencyList: UrgencyLevel[] = ['emergency', 'normal']
const scopeList: ConsultationScope[] = ['intra_dept', 'inter_dept', 'hospital_wide', 'external', 'remote']
const statusList: ConsultationStatus[] = [
  'pending_approval', 'approved', 'scheduled', 'in_progress', 'completed', 'archived', 'rejected'
]

const patientNames = ['张明', '李华', '王芳', '赵强', '刘洋', '陈静', '杨光', '黄丽', '周伟', '吴婷',
  '徐磊', '孙红', '马超', '朱琳', '胡斌', '郭敏', '何鑫', '高燕', '林杰', '罗萍']
const expertNames = ['王建国', '李秀兰', '张明远', '陈志强', '刘德海', '杨文斌', '赵慧敏', '黄国华',
  '周凤英', '吴志伟', '徐丽华', '孙建国', '马兰花', '朱明辉', '胡文莉']

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysBack: number): string {
  const now = new Date()
  const past = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000)
  const y = past.getFullYear()
  const m = String(past.getMonth() + 1).padStart(2, '0')
  const d = String(past.getDate()).padStart(2, '0')
  const h = String(past.getHours()).padStart(2, '0')
  const min = String(past.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

function randomFutureDate(hoursAhead: number): string {
  const now = new Date()
  const future = new Date(now.getTime() + Math.random() * hoursAhead * 60 * 60 * 1000)
  const y = future.getFullYear()
  const m = String(future.getMonth() + 1).padStart(2, '0')
  const d = String(future.getDate()).padStart(2, '0')
  const h = String(future.getHours()).padStart(2, '0')
  const min = String(future.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

const purposes = [
  '协助明确诊断，制定治疗方案',
  '评估手术指征，制定围手术期管理方案',
  '疑难病例讨论，明确下一步诊疗计划',
  '多学科联合诊疗，制定综合治疗方案',
  '评估病情严重程度，协助转科治疗',
  '术后并发症处理方案制定',
  '化疗方案调整及毒副反应管理',
  '终末期患者安宁疗护评估',
]

const histories = [
  '患者因反复胸闷气促3月余入院，冠脉造影提示三支病变，既往糖尿病史10年，高血压史15年。',
  '患者因腹痛腹胀1周入院，CT提示腹腔占位性病变，肿瘤标志物升高，既往慢性胃炎史。',
  '患者因头痛伴视物模糊2周入院，MRI提示鞍区占位，考虑垂体瘤，需多学科评估手术方案。',
  '患者因间断发热1月余入院，多次血培养阴性，广谱抗生素效果不佳，需感染科协助诊治。',
  '患者因外伤后右下肢活动障碍入院，X线提示股骨颈骨折，既往冠心病史，需评估手术风险。',
  '患者因进行性吞咽困难2月入院，胃镜提示食管中段狭窄，病理提示鳞癌，需MDT制定方案。',
  '患者因妊娠32周合并重度子痫前期入院，血压控制不佳，需产科、心内科、ICU联合会诊。',
  '患者因肝硬化失代偿期合并消化道出血入院，既往乙肝肝硬化史10年，需多学科评估肝移植指征。',
]

// ==================== 专家人员库（下拉选择用） ====================
export const expertStaffPool: ExpertStaff[] = expertNames.map((name, i) => ({
  id: `STF-${String(i + 1).padStart(3, '0')}`,
  name,
  workNo: `G${String(10001 + i)}`,
  dept: randomFrom(DEPARTMENTS),
  title: randomFrom(TITLES.slice(1)),
  phone: `138${String(10000000 + i * 137)}`,
}))

// 拟邀团队下拉列表（团队列表，而非专家个人列表），供会诊申请 MDT 选择
export const CONSULT_TEAMS = [
  { id: 'MDT-001', name: '肺癌多学科诊疗团队', leadDept: '胸外科', leader: '王建国' },
  { id: 'MDT-002', name: '肝癌多学科诊疗团队', leadDept: '肝胆外科', leader: '杨文斌' },
  { id: 'MDT-003', name: '结直肠癌MDT团队', leadDept: '普外科', leader: '徐丽华' },
  { id: 'MDT-004', name: '脑血管病MDT团队', leadDept: '神经外科', leader: '胡文莉' },
  { id: 'MDT-005', name: '心脏病MDT团队', leadDept: '心血管内科', leader: '陈志强' },
]

const generatedConsultationData: ConsultationRecord[] = Array.from({ length: 48 }, (_, i) => {
  const cType = randomFrom(typeList)
  const urgency: UrgencyLevel = cType === 'emergency' ? 'emergency' : 'normal'
  const status = randomFrom(statusList)
  const applyDept = randomFrom(DEPARTMENTS)
  let targetDepts: string[] = []
  if (cType === 'mdt') {
    targetDepts = [
      randomFrom(DEPARTMENTS.filter(d => d !== applyDept)),
      randomFrom(DEPARTMENTS.filter(d => d !== applyDept)),
      randomFrom(DEPARTMENTS.filter(d => d !== applyDept)),
    ]
  } else if (cType === 'emergency' || cType === 'regular') {
    targetDepts = [randomFrom(DEPARTMENTS.filter(d => d !== applyDept))]
  }
  // 远程会诊 / 院外会诊 不设置受邀科室（表单中隐藏，院外改用邀请专家信息）

  const invitedExperts: string[] =
    cType === 'remote'
      ? [randomFrom(expertNames), randomFrom(expertNames)].filter((v, idx, arr) => arr.indexOf(v) === idx)
      : []

  const proposedTeam: string[] =
    cType === 'mdt'
      ? [randomFrom(CONSULT_TEAMS).id, randomFrom(CONSULT_TEAMS).id].filter((v, idx, arr) => arr.indexOf(v) === idx)
      : [] // 仅 MDT 选择拟邀团队；单科/远程/院外不设置
  const isCompleted = status === 'completed' || status === 'archived'

  return {
    id: `CONS-2026-${String(i + 1).padStart(4, '0')}`,
    patientName: randomFrom(patientNames),
    patientGender: randomFrom(['男', '女']) as '男' | '女',
    patientAge: Math.floor(Math.random() * 70) + 18,
    contact: ['13800138000', '13912345678', '13700137000', '13601101100'][i % 4],
    patientType: (i % 3 === 0 ? 'outpatient' : 'inpatient') as 'outpatient' | 'inpatient',
    admissionNo: `ZY${String(100000 + i).padStart(6, '0')}`,
    outpatientNo: i % 3 === 0 ? `MZ${String(200000 + i).padStart(6, '0')}` : undefined,
    bedNo: i % 4 === 0 ? `${Math.floor(Math.random() * 30) + 1}床` : undefined,
    applyDept,
    applicant: randomFrom(expertNames),
    applicantTitle: randomFrom(TITLES),
    applyTime: randomDate(30),
    plannedConsultTime: randomDate(20),
    consultationType: cType,
    urgencyLevel: urgency,
    consultationMethod: randomFrom(['onsite', 'online'] as ConsultationMethod[]),
    scope: cType === 'remote' ? 'remote' : cType === 'external' ? 'external' : cType === 'mdt' ? 'hospital_wide' : randomFrom(scopeList),
    ...(cType === 'external'
      ? { experts: [{ unit: randomFrom(['协和医院', '华西医院', '瑞金医院', '中山医院', '湘雅医院']), name: randomFrom(expertNames), title: randomFrom(TITLES) }] }
      : {}),
    targetDepts,
    invitedExperts,
    proposedTeam,
    purpose: randomFrom(purposes),
    briefHistory: randomFrom(histories),
    diagnosis: i % 2 === 0 ? '入院诊断待查' : `考虑${randomFrom(['冠心病', '肺部感染', '消化道肿瘤', '脑梗死', '肝硬化'])}`,
    treatmentProcess: randomFrom(['已予抗感染、对症支持治疗', '已行介入及术后辅助治疗', '目前维持性治疗，病情相对平稳', '已完善相关检查，等待结果']),
    status,
    approvalStatus: APPROVAL_STATUS_FROM[status],
    consultationStatus: CONSULTATION_STAGE_FROM[status],
    approvalTime: status !== 'draft' && status !== 'pending_approval' ? randomDate(28) : undefined,
    approver: status !== 'draft' && status !== 'pending_approval' ? '医务科' : undefined,
    approvalNote: status === 'rejected' ? '申请信息不完整，请补充影像资料后重新提交' : status === 'approved' ? '同意会诊' : undefined,
    scheduledTime: ['scheduled', 'in_progress', 'completed', 'archived'].includes(status) ? randomFutureDate(72) : undefined,
    scheduledLocation: ['scheduled', 'in_progress', 'completed', 'archived'].includes(status) ? randomFrom(['会诊中心1号室', '会诊中心2号室', 'MDT会议室', '远程会诊室', '病区示教室']) : undefined,
    assignedExperts: ['scheduled', 'in_progress', 'completed', 'archived'].includes(status)
      ? [randomFrom(expertNames), randomFrom(expertNames), ...(cType === 'mdt' ? [randomFrom(expertNames)] : [])]
      : undefined,
    completionTime: isCompleted ? randomDate(20) : undefined,
    consultOpinion: isCompleted ? '经多学科讨论，建议行进一步检查明确诊断后制定个体化治疗方案。各科意见已记录详见会诊报告。' : undefined,
    followupStatus: isCompleted ? randomFrom(['pending', 'completed', 'overdue'] as const) : undefined,
  }
})

// ==================== 置顶：可安排的远程会诊记录 ====================
// 远程会诊（线上），审批已通过、待安排，用于演示「安排」按钮可点击场景
const remoteToArrangeRecord: ConsultationRecord = {
  id: 'CONS-2026-REMOTE-01',
  patientName: '赵建国',
  patientGender: '男',
  patientAge: 56,
  contact: '13800138000',
  patientType: 'inpatient',
  admissionNo: 'ZY300001',
  bedNo: '12床',
  applyDept: '呼吸内科',
  applicant: '孙明华',
  applicantTitle: '主任医师',
  applyTime: '2026-08-28 09:00',
  plannedConsultTime: '2026-08-30 09:00:00',
  consultationType: 'remote',
  urgencyLevel: 'normal',
  consultationMethod: 'online',
  scope: 'remote',
  targetDepts: [],
  invitedExperts: ['王远程', '李秀英'],
  proposedTeam: [],
  purpose: '肺部占位性病变，需远程联合上级医院专家明确诊疗方案',
  briefHistory: '患者咳嗽伴咯血 2 周，外院 CT 提示右肺上叶占位。',
  diagnosis: '考虑右肺上叶占位性病变',
  treatmentProcess: '已完善胸部 CT 及肿瘤标志物检查，等待远程会诊意见',
  status: 'approved',
  approvalStatus: 'approved',
  consultationStatus: 'to_arrange',
  approvalTime: '2026-08-28 09:30',
  approver: '医务科',
  approvalNote: '同意远程会诊',
}

// ==================== 置顶：远程会诊虚拟数据（用于「会诊安排」列表展示） ====================
const remoteMockRecords: ConsultationRecord[] = [
  {
    id: 'CONS-2026-REMOTE-02',
    patientName: '吴桂芳',
    patientGender: '女',
    patientAge: 63,
    contact: '13700137000',
    patientType: 'inpatient',
    admissionNo: 'ZY300002',
    bedNo: '21床',
    applyDept: '神经内科',
    applicant: '周建国',
    applicantTitle: '主任医师',
    applyTime: '2026-08-29 14:20',
    plannedConsultTime: '2026-09-01 15:00:00',
    consultationType: 'remote',
    urgencyLevel: 'normal',
    consultationMethod: 'online',
    scope: 'remote',
    targetDepts: [],
    invitedExperts: ['王远程'],
    proposedTeam: [],
    purpose: '疑难脑血管病（脑血管畸形），需远程联合上级医院神经外科专家评估介入治疗方案',
    briefHistory: '患者反复头痛头晕 3 月，DSA 提示右侧颞叶脑血管畸形。',
    diagnosis: '脑血管畸形',
    treatmentProcess: '已完善 DSA 及头颅 MRI 检查，等待远程会诊意见',
    status: 'approved',
    approvalStatus: 'approved',
    consultationStatus: 'to_arrange',
    approvalTime: '2026-08-29 16:00',
    approver: '医务科',
    approvalNote: '同意远程会诊',
  },
  {
    id: 'CONS-2026-REMOTE-03',
    patientName: '郑天佑',
    patientGender: '男',
    patientAge: 71,
    contact: '13601101100',
    patientType: 'inpatient',
    admissionNo: 'ZY300003',
    bedNo: '6床',
    applyDept: '心血管内科',
    applicant: '刘德海',
    applicantTitle: '副主任医师',
    applyTime: '2026-08-27 10:05',
    plannedConsultTime: '2026-09-05 15:00:00',
    consultationType: 'remote',
    urgencyLevel: 'normal',
    consultationMethod: 'online',
    scope: 'remote',
    targetDepts: ['心血管内科'],
    arrangeDepts: ['心血管内科'],
    invitedExperts: ['李秀英', '王远程'],
    proposedTeam: [],
    purpose: '难治性心力衰竭合并肾功能不全，需远程联合上级医院心衰中心调整治疗方案',
    briefHistory: '患者反复胸闷气促 1 年加重 1 周，NT-proBNP 明显升高，eGFR 下降。',
    diagnosis: '难治性心力衰竭 慢性肾脏病 3 期',
    treatmentProcess: '已予利尿、扩血管及抗心衰优化治疗，症状缓解不明显',
    status: 'scheduled',
    approvalStatus: 'approved',
    consultationStatus: 'to_notify',
    approvalTime: '2026-08-27 11:00',
    approver: '医务科',
    approvalNote: '同意远程会诊',
    scheduledTime: '2026-09-05 14:30',
    scheduledLocation: '远程会诊室',
    meetingRoom: '远程会诊室',
    meetingNo: 'HY-2026-091',
    arrivalTime: '2026-09-05 14:50',
  },
  {
    id: 'CONS-2026-REMOTE-04',
    patientName: '孙丽华',
    patientGender: '女',
    patientAge: 47,
    contact: '13800138000',
    patientType: 'inpatient',
    admissionNo: 'ZY300004',
    bedNo: '18床',
    applyDept: '血液内科',
    applicant: '胡文莉',
    applicantTitle: '副主任医师',
    applyTime: '2026-08-26 09:40',
    plannedConsultTime: '2026-09-04 10:00:00',
    consultationType: 'remote',
    urgencyLevel: 'emergency',
    consultationMethod: 'online',
    scope: 'remote',
    targetDepts: ['血液内科'],
    arrangeDepts: ['血液内科'],
    invitedExperts: ['王远程', '陈志强'],
    proposedTeam: [],
    purpose: '复发难治性淋巴瘤，需远程联合上级医院血液科专家制定挽救化疗方案',
    briefHistory: '患者弥漫大 B 细胞淋巴瘤 R-CHOP 方案 6 疗程后复发，累及骨髓。',
    diagnosis: '弥漫大B细胞淋巴瘤（复发）',
    treatmentProcess: '复发后已行二线方案 1 疗程，评估疗效 PR，骨髓仍受累',
    status: 'in_progress',
    approvalStatus: 'approved',
    consultationStatus: 'in_progress',
    approvalTime: '2026-08-26 10:30',
    approver: '医务科',
    approvalNote: '同意远程会诊，请血液科做好资料准备',
    scheduledTime: '2026-09-04 09:40',
    scheduledLocation: '远程会诊室',
    meetingRoom: '远程会诊室',
    meetingNo: 'HY-2026-088',
    arrivalTime: '2026-09-04 09:55',
  },
  {
    id: 'CONS-2026-REMOTE-05',
    patientName: '何志强',
    patientGender: '男',
    patientAge: 58,
    contact: '13912345678',
    patientType: 'inpatient',
    admissionNo: 'ZY300005',
    bedNo: '9床',
    applyDept: '肾内科',
    applicant: '陈志强',
    applicantTitle: '主任医师',
    applyTime: '2026-08-20 15:10',
    plannedConsultTime: '2026-08-25 09:30:00',
    consultationType: 'remote',
    urgencyLevel: 'normal',
    consultationMethod: 'online',
    scope: 'remote',
    targetDepts: ['肾内科'],
    arrangeDepts: ['肾内科'],
    invitedExperts: ['李秀英'],
    proposedTeam: [],
    purpose: '疑难肾病综合征（膜性肾病Ⅱ期），需远程联合上级医院肾内科专家明确免疫抑制治疗方案',
    briefHistory: '患者大量蛋白尿 4 月，肾穿刺活检提示膜性肾病Ⅱ期，激素治疗效果欠佳。',
    diagnosis: '膜性肾病Ⅱ期',
    treatmentProcess: '已予激素联合环磷酰胺治疗 8 周，24h 尿蛋白仍 4.2g',
    status: 'completed',
    approvalStatus: 'approved',
    consultationStatus: 'completed',
    approvalTime: '2026-08-20 16:00',
    approver: '医务科',
    approvalNote: '同意远程会诊',
    scheduledTime: '2026-08-25 09:00',
    scheduledLocation: '远程会诊室',
    meetingRoom: '远程会诊室',
    meetingNo: 'HY-2026-076',
    arrivalTime: '2026-08-25 09:20',
    completionTime: '2026-08-25 10:40',
    consultOpinion: '建议调整为利妥昔单抗联合小剂量激素方案，注意监测肾功能及感染风险，2 周后复查 24h 尿蛋白。',
  },
]

// ==================== 置顶：已审批的院外会诊（用于「外院会诊邀请」菜单） ====================
const externalApprovedRecords: ConsultationRecord[] = [
  {
    id: 'CONS-2026-EXT-01',
    patientName: '陈卫东',
    patientGender: '男',
    patientAge: 64,
    contact: '13800138000',
    patientType: 'inpatient',
    admissionNo: 'ZY400001',
    bedNo: '8床',
    applyDept: '心血管内科',
    applicant: '刘德海',
    applicantTitle: '副主任医师',
    applyTime: '2026-08-25 10:20',
    plannedConsultTime: '2026-09-08 10:00:00',
    consultationType: 'external',
    urgencyLevel: 'normal',
    consultationMethod: 'onsite',
    scope: 'external',
    targetDepts: [],
    experts: [{ unit: '阜外医院', name: '高长青', title: '主任医师' }],
    purpose: '复杂冠心病合并PCI术后管理，需院外心血管专家现场会诊评估再次介入或外科搭桥指征',
    briefHistory: '患者冠脉三支病变，既往PCI术后，近期活动后胸闷加重，需评估再次介入或外科搭桥指征。',
    diagnosis: '冠状动脉粥样硬化性心脏病',
    treatmentProcess: '已完善冠脉CTA及心功能评估，等待院外专家会诊意见',
    status: 'approved',
    approvalStatus: 'approved',
    consultationStatus: 'to_arrange',
    approvalTime: '2026-08-25 15:00',
    approver: '医务科',
    approvalNote: '同意邀请院外专家会诊',
  },
  {
    id: 'CONS-2026-EXT-02',
    patientName: '林小梅',
    patientGender: '女',
    patientAge: 52,
    contact: '13912345678',
    patientType: 'inpatient',
    admissionNo: 'ZY400002',
    bedNo: '15床',
    applyDept: '肿瘤科',
    applicant: '李秀兰',
    applicantTitle: '主任医师',
    applyTime: '2026-08-26 09:10',
    plannedConsultTime: '2026-09-10 14:00:00',
    consultationType: 'external',
    urgencyLevel: 'normal',
    consultationMethod: 'online',
    scope: 'external',
    targetDepts: [],
    experts: [{ unit: '中国医学科学院肿瘤医院', name: '徐兵河', title: '主任医师' }],
    purpose: '晚期胃癌多线治疗后进展，需院外肿瘤专家远程会诊制定后续靶向及免疫治疗方案',
    briefHistory: '患者胃窦腺癌术后化疗复发，现有肝转移，一般情况欠佳，需评估靶向及免疫治疗可行性。',
    diagnosis: '胃恶性肿瘤 肝转移',
    treatmentProcess: '已行两线化疗，疾病进展，等待院外专家远程会诊',
    status: 'approved',
    approvalStatus: 'approved',
    consultationStatus: 'to_arrange',
    approvalTime: '2026-08-26 14:30',
    approver: '医务科',
    approvalNote: '同意邀请院外专家远程会诊',
  },
]

// ==================== 外请会诊虚拟数据（用于「会诊安排」列表展示） ====================
const externalScheduleRecords: ConsultationRecord[] = [
  {
    id: 'CONS-2026-EXT-S01',
    patientName: '马国栋',
    patientGender: '男',
    patientAge: 61,
    contact: '13500135000',
    patientType: 'inpatient',
    admissionNo: 'ZY400003',
    bedNo: '11床',
    applyDept: '肝胆外科',
    applicant: '孙建国',
    applicantTitle: '主任医师',
    applyTime: '2026-09-08 09:30',
    plannedConsultTime: '2026-09-18 14:00:00',
    consultationType: 'external',
    urgencyLevel: 'normal',
    consultationMethod: 'onsite',
    scope: 'external',
    targetDepts: [],
    experts: [{ unit: '上海东方肝胆外科医院', name: '周伟平', title: '主任医师' }],
    purpose: '肝门部胆管癌，需院外肝胆专家现场会诊评估手术切除可行性及手术方式',
    briefHistory: '患者皮肤巩膜黄染 1 月，MRCP 提示肝门部胆管占位，胆红素进行性升高。',
    diagnosis: '肝门部胆管癌（Bismuth Ⅲ型）',
    treatmentProcess: '已行 PTCD 减黄，完善增强 MRI 及肝功能评估，等待院外专家会诊',
    status: 'approved',
    approvalStatus: 'approved',
    consultationStatus: 'to_arrange',
    approvalTime: '2026-09-08 11:00',
    approver: '医务科',
    approvalNote: '同意邀请院外专家现场会诊',
  },
  {
    id: 'CONS-2026-EXT-S02',
    patientName: '秦淑芬',
    patientGender: '女',
    patientAge: 55,
    contact: '13600136000',
    patientType: 'inpatient',
    admissionNo: 'ZY400004',
    bedNo: '22床',
    applyDept: '神经内科',
    applicant: '周建国',
    applicantTitle: '主任医师',
    applyTime: '2026-09-09 15:20',
    plannedConsultTime: '2026-09-16 09:30:00',
    consultationType: 'external',
    urgencyLevel: 'normal',
    consultationMethod: 'onsite',
    scope: 'external',
    targetDepts: ['神经内科'],
    arrangeDepts: ['神经内科'],
    experts: [{ unit: '北京协和医院', name: '崔丽英', title: '主任医师' }],
    purpose: '疑难周围神经病（进行性肌萎缩），需院外神经专家现场会诊明确诊断及治疗方案',
    briefHistory: '患者进行性四肢无力萎缩 8 月，肌电图提示周围神经损害， multiple 治疗效果不佳。',
    diagnosis: '疑难周围神经病',
    treatmentProcess: '已完善肌电图、腰穿及神经抗体检测，诊断未明，等待院外专家会诊',
    status: 'scheduled',
    approvalStatus: 'approved',
    consultationStatus: 'to_notify',
    approvalTime: '2026-09-09 16:30',
    approver: '医务科',
    approvalNote: '同意邀请院外专家会诊',
    scheduledTime: '2026-09-16 09:00',
    scheduledLocation: '会诊中心1号室',
    meetingRoom: '会诊中心1号室',
  },
  {
    id: 'CONS-2026-EXT-S03',
    patientName: '许志远',
    patientGender: '男',
    patientAge: 48,
    contact: '13700137000',
    patientType: 'inpatient',
    admissionNo: 'ZY400005',
    bedNo: '5床',
    applyDept: '骨科',
    applicant: '杨文斌',
    applicantTitle: '副主任医师',
    applyTime: '2026-08-30 10:40',
    plannedConsultTime: '2026-09-03 15:00:00',
    consultationType: 'external',
    urgencyLevel: 'emergency',
    consultationMethod: 'onsite',
    scope: 'external',
    targetDepts: ['骨科'],
    arrangeDepts: ['骨科'],
    experts: [{ unit: '北京积水潭医院', name: '田伟', title: '主任医师' }],
    purpose: '复杂脊柱畸形矫形手术方案评估，需院外脊柱外科专家现场会诊制定手术计划',
    briefHistory: '患者脊柱侧弯畸形 20 余年，近期神经受压症状加重，行走困难。',
    diagnosis: '成人脊柱侧弯畸形 神经根受压',
    treatmentProcess: '已完善全脊柱 X 线及 CT 三维重建，拟行矫形手术，等待院外专家评估',
    status: 'completed',
    approvalStatus: 'approved',
    consultationStatus: 'completed',
    approvalTime: '2026-08-30 11:30',
    approver: '医务科',
    approvalNote: '同意邀请院外专家紧急会诊',
    scheduledTime: '2026-09-03 14:30',
    scheduledLocation: '会诊中心2号室',
    meetingRoom: '会诊中心2号室',
    arrivalTime: '2026-09-03 14:50',
    completionTime: '2026-09-03 16:40',
    consultOpinion: '建议分期手术：先行前后路联合松解，二期行矫形内固定，术中注意脊髓监测，围手术期予抗凝预防血栓。',
  },
]

export const consultationData: ConsultationRecord[] = [remoteToArrangeRecord, ...remoteMockRecords, ...externalApprovedRecords, ...externalScheduleRecords, ...generatedConsultationData]

// ==================== MDT 团队 Mock 数据 ====================
export const mdtTeams: MDTTeam[] = [
  {
    id: 'MDT-001',
    teamName: '肺癌多学科诊疗团队',
    diseaseCategory: '胸部肿瘤',
    leadDept: '胸外科',
    leader: '王建国',
    members: [
      { name: '王建国', dept: '胸外科', title: '主任医师', role: 'leader', expertise: '胸部肿瘤外科' },
      { name: '李秀兰', dept: '肿瘤科', title: '主任医师', role: 'member', expertise: '肿瘤化疗' },
      { name: '张明远', dept: '放射科', title: '副主任医师', role: 'member', expertise: '胸部影像诊断' },
      { name: '陈志强', dept: '病理科', title: '主任医师', role: 'member', expertise: '肺部病理' },
      { name: '刘德海', dept: '呼吸内科', title: '副主任医师', role: 'secretary', expertise: '呼吸系统疾病' },
    ],
    scheduleDay: '每周二 14:00',
    scheduleLocation: '会诊中心1号室',
    status: 'active',
    createdAt: '2025-01-15',
    totalCases: 156,
  },
  {
    id: 'MDT-002',
    teamName: '肝癌多学科诊疗团队',
    diseaseCategory: '消化系统肿瘤',
    leadDept: '肝胆外科',
    leader: '杨文斌',
    members: [
      { name: '杨文斌', dept: '肝胆外科', title: '主任医师', role: 'leader', expertise: '肝胆外科' },
      { name: '赵慧敏', dept: '消化内科', title: '主任医师', role: 'member', expertise: '消化系统疾病' },
      { name: '黄国华', dept: '介入科', title: '副主任医师', role: 'member', expertise: '介入治疗' },
      { name: '周凤英', dept: '肿瘤科', title: '副主任医师', role: 'member', expertise: '肿瘤介入' },
      { name: '吴志伟', dept: '放射科', title: '主治医师', role: 'secretary', expertise: '腹部影像' },
    ],
    scheduleDay: '每周三 14:00',
    scheduleLocation: '会诊中心2号室',
    status: 'active',
    createdAt: '2025-02-20',
    totalCases: 98,
  },
  {
    id: 'MDT-003',
    teamName: '结直肠癌MDT团队',
    diseaseCategory: '消化系统肿瘤',
    leadDept: '普外科',
    leader: '徐丽华',
    members: [
      { name: '徐丽华', dept: '普外科', title: '主任医师', role: 'leader', expertise: '结直肠外科' },
      { name: '孙建国', dept: '肿瘤科', title: '主任医师', role: 'member', expertise: '消化道肿瘤化疗' },
      { name: '马兰花', dept: '放射科', title: '副主任医师', role: 'member', expertise: '盆腔影像' },
      { name: '朱明辉', dept: '病理科', title: '主治医师', role: 'member', expertise: '消化道病理' },
    ],
    scheduleDay: '每周四 15:00',
    scheduleLocation: 'MDT会议室',
    status: 'active',
    createdAt: '2025-03-10',
    totalCases: 72,
  },
  {
    id: 'MDT-004',
    teamName: '脑血管病MDT团队',
    diseaseCategory: '脑血管疾病',
    leadDept: '神经外科',
    leader: '胡文莉',
    members: [
      { name: '胡文莉', dept: '神经外科', title: '主任医师', role: 'leader', expertise: '脑血管外科' },
      { name: '王建国', dept: '神经内科', title: '副主任医师', role: 'member', expertise: '脑血管病' },
      { name: '李秀兰', dept: '介入科', title: '主治医师', role: 'member', expertise: '神经介入' },
      { name: '张明远', dept: '放射科', title: '主任医师', role: 'member', expertise: '神经影像' },
    ],
    scheduleDay: '每周一 14:00',
    scheduleLocation: '会诊中心1号室',
    status: 'active',
    createdAt: '2025-04-05',
    totalCases: 45,
  },
  {
    id: 'MDT-005',
    teamName: '心脏病MDT团队',
    diseaseCategory: '心血管疾病',
    leadDept: '心血管内科',
    leader: '陈志强',
    members: [
      { name: '陈志强', dept: '心血管内科', title: '主任医师', role: 'leader', expertise: '冠心病介入' },
      { name: '刘德海', dept: '胸外科', title: '副主任医师', role: 'member', expertise: '心脏外科' },
      { name: '杨文斌', dept: '放射科', title: '主治医师', role: 'member', expertise: '心脏影像' },
      { name: '赵慧敏', dept: '麻醉科', title: '主任医师', role: 'member', expertise: '心血管麻醉' },
    ],
    scheduleDay: '每周五 14:00',
    scheduleLocation: '会诊中心2号室',
    status: 'inactive',
    createdAt: '2025-05-12',
    totalCases: 23,
  },
]

// ==================== 专家库 Mock 数据 ====================
export const expertData: ExpertInfo[] = expertNames.map((name, i) => ({
  id: `EXP-${String(i + 1).padStart(3, '0')}`,
  name,
  dept: randomFrom(DEPARTMENTS),
  title: randomFrom(TITLES.slice(1)),
  expertise: [
    randomFrom(['冠脉介入', '心律失常', '心力衰竭', '呼吸危重症', '消化内镜', '肝病', '脑血管病', '癫痫', '糖尿病', '甲状腺疾病']),
    randomFrom(['微创手术', '腹腔镜', '介入治疗', '放化疗', '靶向治疗', '免疫治疗']),
  ],
  phone: `138${String(10000000 + Math.floor(Math.random() * 89999999))}`,
  availability: randomFrom(['available', 'busy', 'off'] as const),
  consultationCount: Math.floor(Math.random() * 200) + 20,
  responseRate: Math.floor(Math.random() * 20) + 80,
  satisfaction: Math.floor(Math.random() * 15) + 85,
}))

// ==================== 随访记录 Mock 数据 ====================
const completedConsultations = consultationData.filter(c => c.status === 'completed' || c.status === 'archived')
export const followupData: FollowupRecord[] = completedConsultations.slice(0, 20).map((c, i) => ({
  id: `FUP-${String(i + 1).padStart(4, '0')}`,
  consultationId: c.id,
  patientName: c.patientName,
  dept: c.applyDept,
  consultDate: c.completionTime || randomDate(20),
  planDate: randomFutureDate(24 * 30),
  actualDate: i % 3 === 0 ? randomDate(10) : undefined,
  status: i % 3 === 0 ? 'completed' : i % 5 === 0 ? 'overdue' : 'pending',
  outcome: i % 3 === 0 ? randomFrom(['症状明显改善', '病情稳定', '部分缓解', '需进一步治疗']) : undefined,
  note: i % 3 === 0 ? '患者恢复良好，遵医嘱服药，定期复查' : undefined,
}))

// ==================== 质控指标 Mock 数据 ====================
export const qcMetrics: QCMetric[] = [
  { key: 'emergency_response', name: '急会诊及时到位率', value: 95.2, target: 95, unit: '%', trend: 'up', urgent: true },
  { key: 'emergency_effective', name: '急会诊有效率', value: 88.5, target: 85, unit: '%', trend: 'up', urgent: true },
  { key: 'regular_completion', name: '普通会诊及时完成率', value: 92.8, target: 90, unit: '%', trend: 'up', urgent: false },
  { key: 'regular_effective', name: '普通会诊有效率', value: 86.3, target: 85, unit: '%', trend: 'flat', urgent: false },
  { key: 'mdt_completion', name: 'MDT会诊完成率', value: 98.5, target: 95, unit: '%', trend: 'up', urgent: false },
  { key: 'opinion_adoption', name: '会诊意见采纳率', value: 91.7, target: 90, unit: '%', trend: 'up', urgent: false },
  { key: 'followup_rate', name: '随访完成率', value: 78.4, target: 80, unit: '%', trend: 'down', urgent: false },
  { key: 'patient_satisfaction', name: '患者满意度', value: 94.6, target: 92, unit: '%', trend: 'up', urgent: false },
]

// ==================== 会诊模板 Mock 数据 ====================
export const consultationTemplates = [
  { id: 'TPL-001', name: '急会诊申请模板', type: 'emergency' as ConsultationType, fields: ['患者信息', '简要病情', '会诊目的', '紧急联系方式'], updatedAt: '2026-07-15' },
  { id: 'TPL-002', name: '普通科间会诊模板', type: 'regular' as ConsultationType, fields: ['患者信息', '病情摘要', '诊疗经过', '会诊目的', '拟邀科室'], updatedAt: '2026-07-10' },
  { id: 'TPL-003', name: 'MDT多学科会诊模板', type: 'mdt' as ConsultationType, fields: ['患者信息', '病情摘要', '检查结果', 'MDT团队', '会诊议题'], updatedAt: '2026-07-20' },
  { id: 'TPL-004', name: '远程会诊申请模板', type: 'remote' as ConsultationType, fields: ['患者信息', '病情摘要', '影像资料', '远程专家', '会诊方式'], updatedAt: '2026-07-05' },
  { id: 'TPL-005', name: '院外会诊申请模板', type: 'external' as ConsultationType, fields: ['患者信息', '病情摘要', '会诊目的', '邀请机构', '费用确认'], updatedAt: '2026-06-28' },
]

// ==================== 疾病分类代码（国家临床版2.0 子集） ====================
export const diseaseCodes: DiseaseCode[] = [
  // 循环系统
  { code: 'I20.000', name: '不稳定型心绞痛', category: '循环系统疾病' },
  { code: 'I21.400', name: '急性心肌梗死', category: '循环系统疾病' },
  { code: 'I21.900', name: '急性心肌梗死,透壁性', category: '循环系统疾病' },
  { code: 'I25.100', name: '冠状动脉粥样硬化性心脏病', category: '循环系统疾病' },
  { code: 'I42.500', name: '扩张型心肌病', category: '循环系统疾病' },
  { code: 'I48.000', name: '心房颤动', category: '循环系统疾病' },
  { code: 'I50.000', name: '心力衰竭', category: '循环系统疾病' },
  { code: 'I50.900', name: '心力衰竭,未特指', category: '循环系统疾病' },
  { code: 'I63.900', name: '脑梗死', category: '循环系统疾病' },
  { code: 'I67.100', name: '脑缺血(短暂性脑缺血发作)', category: '循环系统疾病' },
  { code: 'I70.000', name: '动脉粥样硬化', category: '循环系统疾病' },
  { code: 'I71.200', name: '胸主动脉瘤', category: '循环系统疾病' },
  // 呼吸系统
  { code: 'J44.100', name: '慢性阻塞性肺疾病伴急性加重', category: '呼吸系统疾病' },
  { code: 'J44.900', name: '慢性阻塞性肺疾病', category: '呼吸系统疾病' },
  { code: 'J45.000', name: '支气管哮喘', category: '呼吸系统疾病' },
  { code: 'J81.000', name: '肺水肿', category: '呼吸系统疾病' },
  { code: 'J93.000', name: '气胸', category: '呼吸系统疾病' },
  { code: 'J96.000', name: '呼吸衰竭', category: '呼吸系统疾病' },
  { code: 'J98.400', name: '肺部感染', category: '呼吸系统疾病' },
  // 消化系统
  { code: 'K21.000', name: '胃食管反流病', category: '消化系统疾病' },
  { code: 'K29.000', name: '慢性胃炎', category: '消化系统疾病' },
  { code: 'K35.000', name: '急性阑尾炎', category: '消化系统疾病' },
  { code: 'K50.000', name: '克罗恩病', category: '消化系统疾病' },
  { code: 'K51.000', name: '溃疡性结肠炎', category: '消化系统疾病' },
  { code: 'K56.000', name: '肠梗阻', category: '消化系统疾病' },
  { code: 'K70.000', name: '酒精性肝病', category: '消化系统疾病' },
  { code: 'K74.000', name: '肝纤维化', category: '消化系统疾病' },
  { code: 'K80.000', name: '胆石症', category: '消化系统疾病' },
  { code: 'K85.000', name: '急性胰腺炎', category: '消化系统疾病' },
  // 肿瘤
  { code: 'C15.300', name: '食管上段恶性肿瘤', category: '肿瘤' },
  { code: 'C16.000', name: '贲门恶性肿瘤', category: '肿瘤' },
  { code: 'C16.200', name: '胃体恶性肿瘤', category: '肿瘤' },
  { code: 'C16.900', name: '胃恶性肿瘤,未特指', category: '肿瘤' },
  { code: 'C18.900', name: '结肠恶性肿瘤', category: '肿瘤' },
  { code: 'C20.000', name: '直肠恶性肿瘤', category: '肿瘤' },
  { code: 'C22.000', name: '肝细胞癌', category: '肿瘤' },
  { code: 'C22.100', name: '肝内胆管癌', category: '肿瘤' },
  { code: 'C24.000', name: '肝外胆管恶性肿瘤', category: '肿瘤' },
  { code: 'C25.000', name: '胰头恶性肿瘤', category: '肿瘤' },
  { code: 'C34.100', name: '肺上叶恶性肿瘤', category: '肿瘤' },
  { code: 'C34.300', name: '肺下叶恶性肿瘤', category: '肿瘤' },
  { code: 'C34.900', name: '肺恶性肿瘤,未特指', category: '肿瘤' },
  { code: 'C50.000', name: '乳头和乳晕恶性肿瘤', category: '肿瘤' },
  { code: 'C61.000', name: '前列腺恶性肿瘤', category: '肿瘤' },
  { code: 'C64.000', name: '肾恶性肿瘤', category: '肿瘤' },
  { code: 'C67.000', name: '膀胱三角区恶性肿瘤', category: '肿瘤' },
  { code: 'C73.000', name: '甲状腺恶性肿瘤', category: '肿瘤' },
  { code: 'D05.000', name: '乳腺原位癌', category: '肿瘤' },
  // 神经系统
  { code: 'G40.000', name: '癫痫', category: '神经系统疾病' },
  { code: 'G45.000', name: '短暂性脑缺血发作', category: '神经系统疾病' },
  { code: 'G45.900', name: '短暂性脑缺血发作,未特指', category: '神经系统疾病' },
  { code: 'G20.000', name: '帕金森病', category: '神经系统疾病' },
  { code: 'G35.000', name: '多发性硬化', category: '神经系统疾病' },
  // 内分泌
  { code: 'E03.000', name: '甲状腺功能减退症', category: '内分泌疾病' },
  { code: 'E05.000', name: '甲状腺功能亢进症', category: '内分泌疾病' },
  { code: 'E11.000', name: '2型糖尿病', category: '内分泌疾病' },
  { code: 'E14.000', name: '糖尿病,未特指', category: '内分泌疾病' },
  { code: 'E22.000', name: '垂体功能亢进', category: '内分泌疾病' },
  { code: 'E27.000', name: '肾上腺功能不全', category: '内分泌疾病' },
  // 泌尿系统
  { code: 'N17.000', name: '急性肾功能衰竭', category: '泌尿系统疾病' },
  { code: 'N18.000', name: '慢性肾脏病', category: '泌尿系统疾病' },
  { code: 'N28.000', name: '肾其他疾患', category: '泌尿系统疾病' },
  { code: 'N39.000', name: '尿路感染', category: '泌尿系统疾病' },
  // 血液
  { code: 'D46.000', name: '骨髓增生异常综合征', category: '血液系统疾病' },
  { code: 'D50.000', name: '缺铁性贫血', category: '血液系统疾病' },
  { code: 'D61.000', name: '再生障碍性贫血', category: '血液系统疾病' },
  // 损伤
  { code: 'S72.000', name: '股骨颈骨折', category: '损伤与中毒' },
  { code: 'S82.000', name: '胫腓骨骨折', category: '损伤与中毒' },
  { code: 'S06.000', name: '脑震荡', category: '损伤与中毒' },
]

// ==================== 专家团队 Mock 数据 ====================
export const expertTeamGroups: ExpertTeamGroup[] = [
  {
    id: 'ET-001',
    teamName: '胸部肿瘤诊疗专家组',
    specialtyArea: '胸外科/肿瘤科',
    teamLevel: 'L1',
    leadDept: '胸外科',
    establishDate: '2024-03-15',
    diseaseCodes: ['C34.100', 'C34.300', 'C34.900', 'C15.300'],
    leader: 'STF-001',
    consultLocation: '门诊楼3楼 MDT会诊室',
    consultWeekday: '每周三',
    consultTime: '14:30',
    status: 'active',
    createdAt: '2025-06-10',
  },
  {
    id: 'ET-002',
    teamName: '肝病诊疗专家组',
    specialtyArea: '消化内科/肝胆外科',
    teamLevel: 'L2',
    leadDept: '肝胆外科',
    establishDate: '2024-05-20',
    diseaseCodes: ['K70.000', 'K74.000', 'C22.000', 'C22.100'],
    leader: 'STF-006',
    consultLocation: '肝胆外科示教室',
    consultWeekday: '每周二',
    consultTime: '09:00',
    status: 'active',
    createdAt: '2025-06-15',
  },
  {
    id: 'ET-003',
    teamName: '心血管疾病专家组',
    specialtyArea: '心血管内科/胸外科',
    teamLevel: 'L2',
    leadDept: '心血管内科',
    establishDate: '2024-02-10',
    diseaseCodes: ['I21.400', 'I25.100', 'I50.000', 'I48.000'],
    leader: 'STF-004',
    consultLocation: '心血管内科会诊中心',
    consultWeekday: '每周四',
    consultTime: '15:00',
    status: 'active',
    createdAt: '2025-07-01',
  },
  {
    id: 'ET-004',
    teamName: '脑血管病专家组',
    specialtyArea: '神经内科/神经外科',
    teamLevel: 'L3',
    leadDept: '神经内科',
    establishDate: '2023-11-08',
    diseaseCodes: ['I63.900', 'I67.100', 'G45.000', 'G40.000'],
    leader: 'STF-015',
    consultLocation: '神经科会议室',
    consultWeekday: '每周一',
    consultTime: '10:30',
    status: 'active',
    createdAt: '2025-07-10',
  },
  {
    id: 'ET-005',
    teamName: '消化系统肿瘤专家组',
    specialtyArea: '普外科/消化内科',
    teamLevel: 'L4',
    leadDept: '普外科',
    establishDate: '2023-09-01',
    diseaseCodes: ['C16.000', 'C18.900', 'C20.000', 'K85.000'],
    leader: 'STF-011',
    consultLocation: '普外科学习室',
    consultWeekday: '每周五',
    consultTime: '16:00',
    status: 'inactive',
    createdAt: '2025-08-01',
  },
]

// 专家团队成员（含跨团队重复）
export const expertTeamMembers: ExpertTeamMember[] = [
  // ET-001 胸部肿瘤
  { id: 'ETM-001', teamId: 'ET-001', expertId: 'STF-001', name: '王建国', dept: '胸外科', title: '主任医师', phone: '13810000000', role: 'leader', specialtyTags: ['微创手术', '腔镜外科', '胸部肿瘤外科'], academicBackground: '从事胸外科临床工作20年，擅长肺癌、食管癌微创手术，主刀胸腔镜手术超2000例。' },
  { id: 'ETM-002', teamId: 'ET-001', expertId: 'STF-002', name: '李秀兰', dept: '肿瘤科', title: '主任医师', phone: '13810000137', role: 'core', specialtyTags: ['肿瘤化疗', '靶向治疗'], academicBackground: '肿瘤学博士，专注胸部肿瘤化疗与靶向治疗。' },
  { id: 'ETM-003', teamId: 'ET-001', expertId: 'STF-003', name: '张明远', dept: '放射科', title: '副主任医师', phone: '13810000274', role: 'core', specialtyTags: ['CT/MR诊断', '胸部影像诊断'], academicBackground: '影像诊断专业，胸部病变影像评估经验丰富。' },
  { id: 'ETM-004', teamId: 'ET-001', expertId: 'STF-004', name: '陈志强', dept: '病理科', title: '主任医师', phone: '13810000411', role: 'regular', specialtyTags: ['分子病理', '外科病理'], academicBackground: '病理诊断专家，擅长肺部病变病理诊断。' },
  { id: 'ETM-005', teamId: 'ET-001', expertId: 'STF-005', name: '刘德海', dept: '呼吸内科', title: '副主任医师', phone: '13810000548', role: 'secretary', specialtyTags: ['呼吸危重症', '肺部感染'], academicBackground: '呼吸与危重症医学科，负责团队日常协调。' },
  // ET-002 肝病
  { id: 'ETM-006', teamId: 'ET-002', expertId: 'STF-006', name: '杨文斌', dept: '肝胆外科', title: '主任医师', phone: '13810000685', role: 'leader', specialtyTags: ['微创手术', '肝胆外科'], academicBackground: '肝胆外科专家，擅长复杂肝胆管手术及肝移植。' },
  { id: 'ETM-007', teamId: 'ET-002', expertId: 'STF-007', name: '赵慧敏', dept: '消化内科', title: '主任医师', phone: '13810000822', role: 'core', specialtyTags: ['消化内镜', '肝病'], academicBackground: '消化内科主任，擅长肝胆胰疾病内镜诊治。' },
  { id: 'ETM-008', teamId: 'ET-002', expertId: 'STF-008', name: '黄国华', dept: '介入科', title: '副主任医师', phone: '13810000959', role: 'core', specialtyTags: ['介入治疗', '肿瘤介入'], academicBackground: '介入放射学专家，擅长肝癌TACE及消融治疗。' },
  { id: 'ETM-009', teamId: 'ET-002', expertId: 'STF-002', name: '李秀兰', dept: '肿瘤科', title: '主任医师', phone: '13810000137', role: 'regular', specialtyTags: ['肿瘤化疗', '靶向治疗'], academicBackground: '兼跨胸部肿瘤与肝病团队。' },
  // ET-003 心血管
  { id: 'ETM-010', teamId: 'ET-003', expertId: 'STF-004', name: '陈志强', dept: '心血管内科', title: '主任医师', phone: '13810000411', role: 'leader', specialtyTags: ['冠脉介入', '高血压'], academicBackground: '心内科主任，PCI手术量累计3000+例。' },
  { id: 'ETM-011', teamId: 'ET-003', expertId: 'STF-005', name: '刘德海', dept: '胸外科', title: '副主任医师', phone: '13810000548', role: 'core', specialtyTags: ['心脏外科', '瓣膜病'], academicBackground: '心脏外科专家，瓣膜置换及搭桥手术经验丰富。' },
  { id: 'ETM-012', teamId: 'ET-003', expertId: 'STF-010', name: '吴志伟', dept: '放射科', title: '主治医师', phone: '13810001096', role: 'core', specialtyTags: ['CT/MR诊断', '心脏影像'], academicBackground: '心脏影像诊断专家。' },
  { id: 'ETM-013', teamId: 'ET-003', expertId: 'STF-007', name: '赵慧敏', dept: '麻醉科', title: '主任医师', phone: '13810000822', role: 'regular', specialtyTags: ['心血管麻醉', '疼痛诊疗'], academicBackground: '麻醉科专家，心血管麻醉经验丰富。' },
  // ET-004 脑血管
  { id: 'ETM-014', teamId: 'ET-004', expertId: 'STF-015', name: '胡文莉', dept: '神经外科', title: '主任医师', phone: '13810001505', role: 'leader', specialtyTags: ['神经外科', '脑血管病'], academicBackground: '神经外科主任，脑血管病手术经验丰富。' },
  { id: 'ETM-015', teamId: 'ET-004', expertId: 'STF-001', name: '王建国', dept: '神经内科', title: '副主任医师', phone: '13810000000', role: 'core', specialtyTags: ['脑血管病', '癫痫'], academicBackground: '神经内科专家，脑血管病诊治经验丰富。' },
  { id: 'ETM-016', teamId: 'ET-004', expertId: 'STF-003', name: '张明远', dept: '放射科', title: '主任医师', phone: '13810000274', role: 'core', specialtyTags: ['CT/MR诊断', '神经影像'], academicBackground: '神经影像诊断专家。' },
  // ET-005 消化系统肿瘤（停用）
  { id: 'ETM-017', teamId: 'ET-005', expertId: 'STF-011', name: '徐丽华', dept: '普外科', title: '主任医师', phone: '13810001133', role: 'leader', specialtyTags: ['腔镜外科', '胃肠外科'], academicBackground: '胃肠外科专家。' },
  { id: 'ETM-018', teamId: 'ET-005', expertId: 'STF-012', name: '孙建国', dept: '肿瘤科', title: '主任医师', phone: '13810001270', role: 'core', specialtyTags: ['肿瘤化疗', '免疫治疗'], academicBackground: '消化道肿瘤化疗专家。' },
]

// ==================== 会议室 Mock 数据 ====================
export const meetingRooms: MeetingRoom[] = [
  {
    id: 'MR-001',
    name: '门诊楼3楼 MDT会诊室',
    location: '门诊楼 3F 东区',
    type: 'multimedia',
    status: 'enabled',
    capacity: 20,
    equipment: ['投影仪', '电子白板', '视频会议终端', '扩音系统'],
    remark: '主要用于多学科联合会诊，可容纳 20 人。',
    createdAt: '2024-05-12',
  },
  {
    id: 'MR-002',
    name: '会诊中心1号室',
    location: '内科楼 5F',
    type: 'multimedia',
    status: 'enabled',
    capacity: 12,
    equipment: ['投影仪', '电子白板'],
    remark: '常规会诊使用。',
    createdAt: '2024-06-08',
  },
  {
    id: 'MR-003',
    name: '会诊中心2号室',
    location: '内科楼 5F',
    type: 'standard',
    status: 'enabled',
    capacity: 8,
    equipment: ['电视屏'],
    remark: '小型会诊及病例讨论。',
    createdAt: '2024-06-08',
  },
  {
    id: 'MR-004',
    name: 'MDT会议室',
    location: '医技楼 4F',
    type: 'multimedia',
    status: 'enabled',
    capacity: 15,
    equipment: ['投影仪', '电子白板', '视频会议终端', '扩音系统', '录播系统'],
    remark: 'MDT 专用会议室，配备录播系统。',
    createdAt: '2024-08-20',
  },
  {
    id: 'MR-005',
    name: '远程会诊室',
    location: '医技楼 4F 西区',
    type: 'remote',
    status: 'enabled',
    capacity: 6,
    equipment: ['远程会诊终端', '高清摄像头', '全向麦克风', '大屏显示'],
    remark: '与上级医院远程会诊专用。',
    createdAt: '2024-09-15',
  },
  {
    id: 'MR-006',
    name: '病区示教室',
    location: '住院部 2F',
    type: 'standard',
    status: 'enabled',
    capacity: 30,
    equipment: ['投影仪'],
    remark: '科室内部示教及小范围讨论。',
    createdAt: '2024-10-22',
  },
  {
    id: 'MR-007',
    name: '学术报告厅',
    location: '行政楼 1F',
    type: 'multimedia',
    status: 'disabled',
    capacity: 120,
    equipment: ['投影仪', '电子白板', '扩音系统', '录播系统', '同声传译'],
    remark: '大型学术会议及院级会诊使用，目前设备维护中暂停预约。',
    createdAt: '2024-11-05',
  },
]
