// 手术管理 - 模拟数据

// 本院医生池（姓名 + 工号 + 科室 + 职称）
export interface StaffOption {
  name: string
  workNo: string
  dept: string
  title: string
}

export const STAFF_POOL: StaffOption[] = [
  { name: '王建国', workNo: 'W1001', dept: '肝胆外科', title: '主任医师' },
  { name: '李国华', workNo: 'W1002', dept: '心胸外科', title: '主任医师' },
  { name: '赵明德', workNo: 'W1003', dept: '神经外科', title: '副主任医师' },
  { name: '陈志远', workNo: 'W1004', dept: '骨科', title: '主任医师' },
  { name: '刘德芳', workNo: 'W1005', dept: '泌尿外科', title: '副主任医师' },
  { name: '孙秀英', workNo: 'W1006', dept: '妇产科', title: '主任医师' },
  { name: '周健康', workNo: 'W1007', dept: '普外科', title: '主治医师' },
  { name: '吴明辉', workNo: 'W1008', dept: '耳鼻喉科', title: '副主任医师' },
  { name: '郑国强', workNo: 'W1009', dept: '眼科', title: '主治医师' },
  { name: '黄丽娟', workNo: 'W1010', dept: '口腔颌面外科', title: '副主任医师' },
  { name: '张明', workNo: 'W1011', dept: '呼吸内科', title: '主治医师' },
  { name: '马俊杰', workNo: 'W1012', dept: '麻醉科', title: '主任医师' },
  { name: '林晓燕', workNo: 'W1013', dept: '麻醉科', title: '副主任医师' },
  { name: '何志伟', workNo: 'W1014', dept: '麻醉科', title: '主治医师' },
  { name: '许文静', workNo: 'W1015', dept: '麻醉科', title: '主治医师' },
]

// 主刀医生候选（外科系医生）
export const SURGEON_OPTIONS = STAFF_POOL.filter(s => s.dept !== '麻醉科')
// 麻醉医生候选（麻醉科医生）
export const ANESTHESIOLOGIST_OPTIONS = STAFF_POOL.filter(s => s.dept === '麻醉科')

// 手术目录（「本次手术」选择弹窗数据源）
export interface SurgeryCatalogItem {
  code: string
  name: string
  dept: string
  level: string
}

export const SURGERY_CATALOG: SurgeryCatalogItem[] = [
  { code: 'S-3501', name: '腹腔镜下胰十二指肠切除术', dept: '肝胆外科', level: '四级手术' },
  { code: 'S-3502', name: '右上肺叶切除术', dept: '心胸外科', level: '四级手术' },
  { code: 'S-3503', name: '颅内动脉瘤夹闭术', dept: '神经外科', level: '四级手术' },
  { code: 'S-3504', name: '全髋关节置换术', dept: '骨科', level: '三级手术' },
  { code: 'S-3505', name: '腹腔镜下根治性肾切除术', dept: '泌尿外科', level: '三级手术' },
  { code: 'S-3506', name: '广泛全子宫切除术', dept: '妇产科', level: '三级手术' },
  { code: 'S-3507', name: '腹腔镜下胆囊切除术', dept: '肝胆外科', level: '一级手术' },
  { code: 'S-3508', name: '胸腔镜下肺大疱切除术', dept: '心胸外科', level: '二级手术' },
]

// 通用选项
export const APPLY_NATURE_OPTIONS = ['重大手术', '新技术新项目手术', '限制类医疗技术手术', '外请专家手术', '非计划再次手术'].map(v => ({ value: v, label: v }))

export const SURGERY_PURPOSE_OPTIONS = ['诊断性手术', '治疗性手术', '姑息性手术', '预防性手术'].map(v => ({ value: v, label: v }))

export const SURGERY_TYPE_OPTIONS = ['择期手术', '限期手术', '急诊手术'].map(v => ({ value: v, label: v }))

export const ANESTHESIA_METHOD_OPTIONS = ['全身麻醉', '椎管内麻醉', '神经阻滞麻醉', '局部麻醉', '复合麻醉'].map(v => ({ value: v, label: v }))

// 麻醉风险（ASA 分级）
export const ANESTHESIA_RISK_OPTIONS = ['Ⅰ级（正常健康患者）', 'Ⅱ级（合并轻度系统疾病）', 'Ⅲ级（合并重度系统疾病）', 'Ⅳ级（重度系统疾病且经常威胁生命）', 'Ⅴ级（濒危患者）'].map(v => ({ value: v, label: v }))

// 感染风险（切口分类）
export const INFECTION_RISK_OPTIONS = ['Ⅰ类切口（清洁）', 'Ⅱ类切口（清洁-污染）', 'Ⅲ类切口（污染）', 'Ⅳ类切口（污染-感染）'].map(v => ({ value: v, label: v }))

export const SURGERY_DEPTS = ['肝胆外科', '心胸外科', '神经外科', '骨科', '泌尿外科', '妇产科', '普外科', '耳鼻喉科', '眼科', '口腔颌面外科']

export const EXPERT_TITLE_OPTIONS = ['主任医师', '副主任医师', '主治医师', '教授', '副教授'].map(v => ({ value: v, label: v }))

// 性别选项
export const GENDER_OPTIONS = ['男', '女'].map(v => ({ value: v, label: v }))

// 审批状态
export type SurgeryApplyStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn'

export const SURGERY_STATUS_MAP: Record<SurgeryApplyStatus, { label: string; color: string }> = {
  draft: { label: '暂存', color: 'default' },
  pending: { label: '待审批', color: 'warning' },
  approved: { label: '已审批', color: 'success' },
  rejected: { label: '已拒绝', color: 'error' },
  withdrawn: { label: '已撤回', color: 'default' },
}

// 手术申请记录
export interface SurgeryApplyRecord {
  id: string
  applyNo: string
  status: SurgeryApplyStatus
  applicant: string
  // 病人信息
  hospitalNo?: string
  patientName?: string
  gender?: string
  admissionCount?: number
  age?: string
  admissionTime?: string
  admissionDept?: string
  diagnosis?: string
  conditionSummary?: string
  // 申请信息
  applyNature?: string
  surgeryName?: string[]
  surgeryDept?: string
  surgeryTime?: string
  surgeryPurpose?: string
  surgeryType?: string
  anesthesiologist?: string
  anesthesiaMethod?: string
  anesthesiaRisk?: string
  infectionRisk?: string
  chiefSurgeon?: string
  firstAssistant?: string
  secondAssistant?: string
  hasExternalExpert?: '主刀' | '指导'
  externalExpertName?: string
  externalExpertHospital?: string
  externalExpertDept?: string
  externalExpertTitle?: string
  surgeryFirstCase?: string
  anesthesiaFirstCase?: string
  selfProvide?: string[]
  approveReason?: string
  preDiscussion?: string
  surgeryPlan?: string
  preparation?: string
  expertIntroduction?: string
  // 非计划再次手术
  againReason?: string
  lastSurgeryName?: string
  lastAnesthesiaMethod?: string
  lastChiefSurgeon?: string
  lastFirstAssistant?: string
  lastSecondAssistant?: string
  lastAnesthesiologist?: string
  lastCompleteTime?: string
  lastSurgerySituation?: string
  lastRecordNo?: string
}

// 初始列表（演示数据）
export const INITIAL_RECORDS: SurgeryApplyRecord[] = [
  {
    id: 'r1', applyNo: 'OPA202609100020', status: 'approved', applicant: '贺倩',
    hospitalNo: '202616140', patientName: '测试', gender: '男', admissionCount: 2, age: '42',
    admissionTime: '2026-09-08', admissionDept: '神经外科',
    diagnosis: '左额叶占位性病变', conditionSummary: '头痛半年加重一周，影像学检查提示左额叶占位。',
    applyNature: '重大手术', surgeryName: ['CT导航计划辅助脑外科手术'], surgeryDept: '神经外科',
    surgeryTime: '2026-09-10 09:30:00', surgeryPurpose: '治疗性手术', surgeryType: '择期手术',
    anesthesiologist: '马俊杰', anesthesiaMethod: '全身麻醉', anesthesiaRisk: 'Ⅱ级（合并轻度系统疾病）', infectionRisk: 'Ⅰ类切口（清洁）',
    chiefSurgeon: '赵明德', firstAssistant: '周健康', secondAssistant: '郑国强',
    approveReason: '手术难度大、风险高，属四级重大手术，按管理要求报批。', preDiscussion: '',
    surgeryPlan: 'CT 导航辅助下左额叶占位切除术，术中冰冻病理。', preparation: '术前检查已完成，备血、知情同意已签署。',
  },
  {
    id: 'r2', applyNo: 'OPA202609110033', status: 'pending', applicant: '管理员',
    hospitalNo: '202616155', patientName: '李文静', gender: '女', admissionCount: 1, age: '35',
    admissionTime: '2026-09-09', admissionDept: '妇产科',
    diagnosis: '子宫肌瘤（多发）', conditionSummary: '月经量增多两年，超声提示多发子宫肌瘤。',
    applyNature: '重大手术', surgeryName: ['广泛全子宫切除术'], surgeryDept: '妇产科',
    surgeryTime: '2026-09-12 14:00:00', surgeryPurpose: '治疗性手术', surgeryType: '择期手术',
    anesthesiologist: '林晓燕', anesthesiaMethod: '椎管内麻醉',
    chiefSurgeon: '孙秀英',
    approveReason: '手术范围大，涉及生育能力丧失，需医务科审批。', preDiscussion: '',
    surgeryPlan: '全麻下行广泛全子宫切除 + 双附件切除。', preparation: '肠道准备已开始，交叉配血完成。',
  },
  {
    id: 'r3', applyNo: 'OPA202609120001', status: 'draft', applicant: '管理员',
    hospitalNo: '202616162', patientName: '王大山', gender: '男', admissionCount: 1, age: '58',
    admissionDept: '心胸外科',
    applyNature: '重大手术', surgeryName: ['右上肺叶切除术'], surgeryDept: '心胸外科',
    surgeryTime: '2026-09-15 09:00:00',
    approveReason: '',
  },
  {
    id: 'r4', applyNo: 'OPA202609090018', status: 'withdrawn', applicant: '贺倩',
    hospitalNo: '202616131', patientName: '陈晨', gender: '女', admissionCount: 3, age: '29',
    admissionDept: '骨科',
    applyNature: '新技术新项目手术', surgeryName: ['全髋关节置换术'], surgeryDept: '骨科',
    surgeryTime: '2026-09-09 10:00:00', chiefSurgeon: '陈志远',
    approveReason: '患者暂缓手术，先撤回申请。',
  },
  {
    id: 'r5', applyNo: 'OPA202609080011', status: 'rejected', applicant: '管理员',
    hospitalNo: '202616120', patientName: '刘振国', gender: '男', admissionCount: 1, age: '66',
    admissionDept: '肝胆外科',
    applyNature: '外请专家手术', surgeryName: ['腹腔镜下胰十二指肠切除术'], surgeryDept: '肝胆外科',
    surgeryTime: '2026-09-08 08:30:00', chiefSurgeon: '王建国',
    hasExternalExpert: '主刀', externalExpertName: '李国华', externalExpertHospital: '北京协和医院',
    externalExpertDept: '肝胆外科', externalExpertTitle: '主任医师',
    surgeryFirstCase: '否', anesthesiaFirstCase: '否', selfProvide: ['高值耗材'],
    approveReason: '拟邀请外院专家主刀，按外请专家手术报批。',
    expertIntroduction: '李国华，北京协和医院肝胆外科主任医师，擅长复杂胰腺手术。',
  },
]

// 患者既往手术记录（用于「非计划再次手术 - 选择记录」按住院号检索回填）
export interface PatientSurgeryRecord {
  hospitalNo: string
  patientName: string
  surgeryName: string
  completeTime: string
  anesthesiaMethod: string
  anesthesiologist: string
  chiefSurgeon: string
  firstAssistant: string
  secondAssistant: string
}

export const PATIENT_SURGERY_RECORDS: PatientSurgeryRecord[] = [
  { hospitalNo: '202514088', patientName: '张伟', surgeryName: '腹腔镜胆囊切除术', completeTime: '2026-03-12 10:20:00', anesthesiaMethod: '全身麻醉', anesthesiologist: '马俊杰', chiefSurgeon: '赵明德', firstAssistant: '周健康', secondAssistant: '郑国强' },
  { hospitalNo: '202515233', patientName: '李娜', surgeryName: '甲状腺部分切除术', completeTime: '2026-05-08 09:00:00', anesthesiaMethod: '全身麻醉', anesthesiologist: '林晓燕', chiefSurgeon: '孙秀英', firstAssistant: '钱多多', secondAssistant: '孙立' },
  { hospitalNo: '202516001', patientName: '王强', surgeryName: '腹股沟疝修补术', completeTime: '2026-06-21 14:30:00', anesthesiaMethod: '椎管内麻醉', anesthesiologist: '马俊杰', chiefSurgeon: '陈志远', firstAssistant: '周健康', secondAssistant: '' },
  { hospitalNo: '202516402', patientName: '赵敏', surgeryName: '阑尾切除术', completeTime: '2026-07-03 11:10:00', anesthesiaMethod: '全身麻醉', anesthesiologist: '林晓燕', chiefSurgeon: '王建国', firstAssistant: '郑国强', secondAssistant: '孙立' },
]

