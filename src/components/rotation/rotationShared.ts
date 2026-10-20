// ==================== 轮转基础共享数据（基地管理 / 轮转计划 共用） ====================
// 数据依据《住院医师规范化培训内容与标准（2022年版）》主要专业基地结构整理

// 一个「轮转科室」条目（基地模板：定义标准名称、周期、轮转类型、轮转要求）
export interface RotationDeptEntry {
  key: string
  standardName: string // 标准名称（手写）
  period: number // 轮转周期数值
  periodUnit: 'month' | 'week' // 轮转周期单位：月 / 周
  rotationType: 'required' | 'optional' // 轮转类型：必选 / 可选
  rotationGoal: string // 轮转目的
  basicRequirement: string // 基本要求
  improveRequirement: string // 提升要求
  otherRemark: string // 其他备注
}

export interface BaseRecord {
  id: string
  baseName: string
  baseCode: string
  baseType: string
  status: boolean
  description: string
  depts: RotationDeptEntry[]
}

// 标准科室条目构造辅助：自动生成与科室名称相符的轮转目的/基本要求/提升要求
let __autoKey = 1000
const mk = (
  standardName: string,
  period: number,
  rotationType: 'required' | 'optional' = 'required',
  periodUnit: 'month' | 'week' = 'month',
  extra?: Partial<
    Pick<RotationDeptEntry, 'rotationGoal' | 'basicRequirement' | 'improveRequirement' | 'otherRemark'>
  >,
): RotationDeptEntry => ({
  key: `k${__autoKey++}`,
  standardName,
  period,
  periodUnit,
  rotationType,
  rotationGoal:
    extra?.rotationGoal ||
    `系统掌握${standardName}常见疾病的病因、发病机制、临床表现、诊断与鉴别诊断及处理原则。`,
  basicRequirement:
    extra?.basicRequirement ||
    `掌握${standardName}常见病、多发病的病史采集、体格检查、辅助检查判读与初步处理。`,
  improveRequirement:
    extra?.improveRequirement ||
    `在上级医师指导下能独立处理${standardName}较复杂病例及常见急危重症，具备初步临床决策能力。`,
  otherRemark: extra?.otherRemark || '',
})

export const INITIAL_BASES: BaseRecord[] = [
  {
    id: '1',
    baseName: '内科专业基地',
    baseCode: 'BASE-IM-001',
    baseType: '内科专业',
    status: true,
    description: '内科住院医师规范化培训基地，覆盖心血管、呼吸、消化等核心亚专科',
    depts: [
      mk('心血管内科', 3, 'required'),
      mk('呼吸内科', 3, 'required'),
      mk('消化内科', 2, 'required'),
      mk('内分泌科', 1, 'required'),
      mk('血液内科', 1, 'required'),
      mk('肾脏内科', 1, 'required'),
      mk('风湿免疫科', 1, 'optional'),
      mk('感染科', 1, 'optional'),
      mk('神经内科', 2, 'required'),
      mk('心电图室', 1, 'required'),
    ],
  },
  {
    id: '2',
    baseName: '外科专业基地',
    baseCode: 'BASE-SG-002',
    baseType: '外科专业',
    status: true,
    description: '外科住院医师规范化培训基地，覆盖普通外科、骨科、泌尿外科等',
    depts: [
      mk('普通外科', 6, 'required'),
      mk('骨科', 2, 'required'),
      mk('泌尿外科', 1, 'required'),
      mk('神经外科', 1, 'required'),
      mk('胸心外科', 1, 'required'),
      mk('麻醉科', 1, 'required'),
      mk('外科重症监护', 1, 'required'),
    ],
  },
  {
    id: '3',
    baseName: '妇产科专业基地',
    baseCode: 'BASE-OB-003',
    baseType: '妇产科专业',
    status: true,
    description: '妇产科住院医师规范化培训基地，覆盖妇科、产科、计划生育等',
    depts: [
      mk('妇科', 4, 'required'),
      mk('产科', 4, 'required'),
      mk('计划生育', 1, 'required'),
      mk('生殖内分泌', 1, 'optional'),
    ],
  },
  {
    id: '4',
    baseName: '儿科专业基地',
    baseCode: 'BASE-PD-004',
    baseType: '儿科专业',
    status: true,
    description: '儿科住院医师规范化培训基地，覆盖儿科各亚专业',
    depts: [
      mk('儿科呼吸', 2, 'required'),
      mk('儿科消化', 1, 'required'),
      mk('儿科心血管', 1, 'required'),
      mk('新生儿科', 2, 'required'),
      mk('儿科急诊', 1, 'required'),
      mk('儿童保健', 1, 'optional'),
    ],
  },
  {
    id: '5',
    baseName: '急诊科专业基地',
    baseCode: 'BASE-EM-005',
    baseType: '急诊科专业',
    status: true,
    description: '急诊科住院医师规范化培训基地，覆盖内外急诊与监护',
    depts: [
      mk('急诊内科', 4, 'required'),
      mk('急诊外科', 2, 'required'),
      mk('急诊监护(EICU)', 2, 'required'),
      mk('院前急救', 1, 'optional'),
    ],
  },
  {
    id: '6',
    baseName: '神经内科专业基地',
    baseCode: 'BASE-NR-006',
    baseType: '神经内科专业',
    status: true,
    description: '神经内科住院医师规范化培训基地',
    depts: [
      mk('神经重症', 2, 'required'),
      mk('神经电生理', 2, 'required', 'week'),
      mk('神经影像', 1, 'required'),
      mk('卒中单元', 2, 'required'),
    ],
  },
  {
    id: '7',
    baseName: '麻醉科专业基地',
    baseCode: 'BASE-AN-007',
    baseType: '麻醉科专业',
    status: true,
    description: '麻醉科住院医师规范化培训基地',
    depts: [
      mk('临床麻醉', 8, 'required'),
      mk('麻醉复苏(PACU)', 1, 'required'),
      mk('疼痛门诊', 1, 'optional'),
      mk('重症监护', 2, 'required'),
    ],
  },
  {
    id: '8',
    baseName: '全科专业基地',
    baseCode: 'BASE-GP-008',
    baseType: '全科专业',
    status: true,
    description: '全科医师规范化培训基地，侧重基层常见病与健康管理',
    depts: [
      mk('全科门诊', 4, 'required'),
      mk('内科', 3, 'required'),
      mk('外科', 1, 'required'),
      mk('妇产科', 1, 'required'),
      mk('儿科', 1, 'required'),
      mk('急诊科', 1, 'required'),
      mk('社区实践', 2, 'required'),
    ],
  },
  {
    id: '9',
    baseName: '骨科专业基地',
    baseCode: 'BASE-OR-009',
    baseType: '骨科专业',
    status: true,
    description: '骨科住院医师规范化培训基地',
    depts: [
      mk('创伤骨科', 3, 'required'),
      mk('脊柱外科', 2, 'required'),
      mk('关节外科', 2, 'required'),
      mk('手外科', 1, 'required'),
      mk('骨肿瘤', 1, 'optional'),
    ],
  },
  {
    id: '10',
    baseName: '泌尿外科专业基地',
    baseCode: 'BASE-URO-010',
    baseType: '泌尿外科专业',
    status: true,
    description: '泌尿外科住院医师规范化培训基地',
    depts: [
      mk('泌尿外科病房', 4, 'required'),
      mk('泌尿外科门诊', 1, 'required'),
      mk('腔镜中心', 1, 'required'),
    ],
  },
  {
    id: '11',
    baseName: '神经外科专业基地',
    baseCode: 'BASE-NS-011',
    baseType: '神经外科专业',
    status: true,
    description: '神经外科住院医师规范化培训基地',
    depts: [
      mk('颅脑外伤', 2, 'required'),
      mk('脑肿瘤', 2, 'required'),
      mk('脊髓脊柱', 1, 'required'),
      mk('功能神经外科', 1, 'optional'),
    ],
  },
  {
    id: '12',
    baseName: '胸心外科专业基地',
    baseCode: 'BASE-TS-012',
    baseType: '胸心外科专业',
    status: true,
    description: '胸心外科住院医师规范化培训基地',
    depts: [
      mk('普胸外科', 3, 'required'),
      mk('心脏外科', 2, 'required'),
      mk('监护室', 1, 'required'),
    ],
  },
  {
    id: '13',
    baseName: '整形外科专业基地',
    baseCode: 'BASE-PS-013',
    baseType: '整形外科专业',
    status: true,
    description: '整形外科住院医师规范化培训基地',
    depts: [
      mk('整形病房', 3, 'required'),
      mk('烧伤外科', 1, 'required'),
      mk('美容门诊', 1, 'optional'),
    ],
  },
  {
    id: '14',
    baseName: '眼科专业基地',
    baseCode: 'BASE-OP-014',
    baseType: '眼科专业',
    status: true,
    description: '眼科住院医师规范化培训基地',
    depts: [
      mk('眼科门诊', 3, 'required'),
      mk('眼科病房', 2, 'required'),
      mk('眼科急诊', 1, 'required'),
    ],
  },
  {
    id: '15',
    baseName: '耳鼻咽喉科专业基地',
    baseCode: 'BASE-ENT-015',
    baseType: '耳鼻咽喉科专业',
    status: true,
    description: '耳鼻咽喉科住院医师规范化培训基地',
    depts: [
      mk('耳科', 2, 'required'),
      mk('鼻科', 1, 'required'),
      mk('咽喉头颈外科', 2, 'required'),
    ],
  },
  {
    id: '16',
    baseName: '皮肤科专业基地',
    baseCode: 'BASE-DM-016',
    baseType: '皮肤科专业',
    status: true,
    description: '皮肤科住院医师规范化培训基地',
    depts: [
      mk('皮肤科门诊', 3, 'required'),
      mk('皮肤外科', 1, 'required'),
      mk('皮肤性病', 1, 'required'),
    ],
  },
  {
    id: '17',
    baseName: '精神科专业基地',
    baseCode: 'BASE-PSY-017',
    baseType: '精神科专业',
    status: true,
    description: '精神科住院医师规范化培训基地',
    depts: [
      mk('精神科病房', 3, 'required'),
      mk('心理门诊', 2, 'required'),
      mk('睡眠医学', 1, 'optional'),
    ],
  },
  {
    id: '18',
    baseName: '康复医学科专业基地',
    baseCode: 'BASE-REH-018',
    baseType: '康复医学科专业',
    status: true,
    description: '康复医学科住院医师规范化培训基地',
    depts: [
      mk('神经康复', 2, 'required'),
      mk('骨科康复', 2, 'required'),
      mk('心肺康复', 4, 'required', 'week'),
    ],
  },
  {
    id: '19',
    baseName: '重症医学科专业基地',
    baseCode: 'BASE-ICU-019',
    baseType: '重症医学科专业',
    status: true,
    description: '重症医学科住院医师规范化培训基地',
    depts: [
      mk('综合ICU', 6, 'required'),
      mk('外科ICU', 2, 'required'),
      mk('呼吸治疗', 1, 'required'),
    ],
  },
  {
    id: '20',
    baseName: '医学影像科专业基地',
    baseCode: 'BASE-RI-020',
    baseType: '医学影像科专业',
    status: true,
    description: '医学影像科住院医师规范化培训基地',
    depts: [
      mk('放射诊断', 4, 'required'),
      mk('CT/MR', 3, 'required'),
      mk('介入放射', 1, 'optional'),
    ],
  },
  {
    id: '21',
    baseName: '放射科专业基地',
    baseCode: 'BASE-RAD-021',
    baseType: '放射科专业',
    status: true,
    description: '放射科住院医师规范化培训基地',
    depts: [
      mk('普放', 2, 'required'),
      mk('CT', 3, 'required'),
      mk('MR', 2, 'required'),
      mk('介入', 1, 'optional'),
    ],
  },
  {
    id: '22',
    baseName: '超声医学科专业基地',
    baseCode: 'BASE-US-022',
    baseType: '超声医学科专业',
    status: true,
    description: '超声医学科住院医师规范化培训基地',
    depts: [
      mk('腹部超声', 2, 'required'),
      mk('心脏超声', 2, 'required'),
      mk('浅表与小器官', 1, 'required'),
      mk('介入超声', 2, 'required', 'week'),
    ],
  },
  {
    id: '23',
    baseName: '核医学科专业基地',
    baseCode: 'BASE-NM-023',
    baseType: '核医学科专业',
    status: true,
    description: '核医学科住院医师规范化培训基地',
    depts: [
      mk('核医学显像', 2, 'required'),
      mk('核素治疗', 1, 'required'),
      mk('体外分析', 1, 'required'),
    ],
  },
  {
    id: '24',
    baseName: '临床病理科专业基地',
    baseCode: 'BASE-PATH-024',
    baseType: '临床病理科专业',
    status: true,
    description: '临床病理科住院医师规范化培训基地',
    depts: [
      mk('组织病理', 4, 'required'),
      mk('细胞病理', 2, 'required'),
      mk('分子病理', 1, 'optional'),
    ],
  },
  {
    id: '25',
    baseName: '检验医学科专业基地',
    baseCode: 'BASE-LAB-025',
    baseType: '检验医学科专业',
    status: true,
    description: '检验医学科住院医师规范化培训基地',
    depts: [
      mk('临床血液', 1, 'required'),
      mk('临床生化', 1, 'required'),
      mk('临床免疫', 1, 'required'),
      mk('临床微生物', 1, 'required'),
      mk('临床检验', 1, 'required'),
    ],
  },
  {
    id: '26',
    baseName: '放射肿瘤科专业基地',
    baseCode: 'BASE-RT-026',
    baseType: '放射肿瘤科专业',
    status: true,
    description: '放射肿瘤科住院医师规范化培训基地',
    depts: [
      mk('放疗机房', 3, 'required'),
      mk('放疗病房', 2, 'required'),
      mk('放疗计划', 1, 'required'),
    ],
  },
  {
    id: '27',
    baseName: '中医专业基地',
    baseCode: 'BASE-TCM-027',
    baseType: '中医专业',
    status: true,
    description: '中医住院医师规范化培训基地',
    depts: [
      mk('中医内科', 3, 'required'),
      mk('中医外科', 1, 'required'),
      mk('针灸推拿', 2, 'required'),
      mk('中医妇科', 1, 'optional'),
    ],
  },
  {
    id: '28',
    baseName: '中医全科专业基地',
    baseCode: 'BASE-TCMGP-028',
    baseType: '中医全科专业',
    status: true,
    description: '中医全科医师规范化培训基地',
    depts: [
      mk('中医全科门诊', 3, 'required'),
      mk('社区中医实践', 3, 'required'),
    ],
  },
]

// 轮转时长折算：1月=4周，1年=12月=48周（供轮转计划“轮转时长”展示使用）
export const calcDurationText = (depts: RotationDeptEntry[]): string => {
  const totalWeeks = depts.reduce(
    (s, d) => s + (d.periodUnit === 'week' ? d.period : d.period * 4),
    0,
  )
  const sumYears = Math.floor(totalWeeks / 48)
  const sumMonths = Math.floor((totalWeeks % 48) / 4)
  const sumWeeks = totalWeeks % 4
  const parts: string[] = []
  if (sumYears > 0) parts.push(`${sumYears}年`)
  if (sumMonths > 0) parts.push(`${sumMonths}个月`)
  if (sumWeeks > 0) parts.push(`${sumWeeks}周`)
  return parts.join('') || '0'
}

// ==================== 轮转计划（派生自专业基地，轮转申请 / 执行轮转共用） ====================

// 计划总月数：按基地各科室周期累计（周按 1 月 = 4 周折算）
export const calcPlanMonths = (base: BaseRecord) =>
  Math.max(1, Math.round(base.depts.reduce((s, d) => s + (d.periodUnit === 'week' ? d.period / 4 : d.period), 0)))

export const ROTATION_PLANS = INITIAL_BASES.map((b) => ({
  id: b.id,
  label: `2026年度${b.baseType}规培轮转计划（${calcPlanMonths(b)}个月）`,
  baseName: b.baseName,
  baseType: b.baseType,
  totalMonths: calcPlanMonths(b),
  deptCount: b.depts.length,
}))

// 按计划 id 取计划名称
export const getPlanLabel = (planId?: string): string =>
  ROTATION_PLANS.find((p) => p.id === planId)?.label || ''
