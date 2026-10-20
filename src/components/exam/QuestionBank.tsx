import React, { useState } from 'react'
import {
  AutoComplete,
  Button,
  Checkbox,
  Form,
  Input,
  Row,
  Col,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Rate,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
  message,
} from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ArrowLeftOutlined,
  PlusSquareOutlined,
  CloseCircleFilled,
} from '@ant-design/icons'

// ===== 题型 =====
export type QuestionType = '单选题' | '多选题' | '判断题' | '填空题' | '简答题' | '实操题'

/** 题目范围：理论题目（不含实操题）/ 实操题目（仅实操题） */
export type QuestionScope = 'theory' | 'practice'

/** 理论题目可用题型（不含实操题） */
const THEORY_TYPES: QuestionType[] = ['单选题', '多选题', '判断题', '填空题', '简答题']
/** 实操题目可用题型：仅「实操题」 */
const PRACTICE_TYPES: QuestionType[] = ['实操题']

const DEFAULT_TYPE: Record<QuestionScope, QuestionType> = {
  theory: '单选题',
  practice: '实操题',
}

export interface QuestionOption {
  label: string
  text: string
  image?: string            // 选项配图（仅单选/多选支持）
}

/** 实操题评分细则子项（评分标准 / 评分要点 / 分值） */
export interface ScoringSubRule {
  standard: string        // 评分标准
  keyPoint: string        // 评分要点
  score: string           // 分值
}

/** 实操题评分项目（含项目分类、分值与多条评分细则，两级结构） */
export interface PracticalProject {
  category: string        // 项目分类
  score: string           // 分值
  rules: ScoringSubRule[] // 评分细则
}

export interface QuestionRecord {
  id: string
  category: string
  type: QuestionType
  belongTo: QuestionScope   // 归属模块：theory=理论题目；practice=实操题目
  content: string
  options: QuestionOption[]
  answers: string[]          // 正确答案（选项 label）
  points?: string[]          // 答案要点（填空题/简答题）
  projects?: PracticalProject[]  // 评分项目与评分细则（实操题，两级）
  images?: string[]          // 题目配图（可多张）
  coreLevel: string          // 核心难度
  knowledge?: string         // 知识点
  difficulty: number         // 难度 1-5
  score: number              // 分数
  major?: string             // 指定专业（不选择为不限制）
  analysis?: string          // 解析
  enabled: boolean           // 是否启用
  createdAt: string
}

export interface QuestionCategory {
  id: string
  name: string
  sort: number
}

// ===== 题目分类 mock =====
const INITIAL_CATEGORIES: QuestionCategory[] = [
  { id: 'c1', name: '急救技能', sort: 1 },
  { id: 'c2', name: '院前急救', sort: 2 },
  { id: 'c3', name: '基层护理', sort: 3 },
  { id: 'c4', name: '专科护理', sort: 4 },
  { id: 'c5', name: '内科诊疗', sort: 5 },
  { id: 'c6', name: '外科诊疗', sort: 6 },
  { id: 'c7', name: '护理安全', sort: 7 },
  { id: 'c8', name: '核心能力', sort: 8 },
]

// ===== 题目 mock =====
const INITIAL_QUESTIONS: QuestionRecord[] = [
  { id: 'q1', category: '核心能力', type: '单选题', belongTo: 'theory', content: '医疗质量安全核心制度中，患者入院后由谁/在哪个环节对其进行医疗交接？', options: [], answers: [], coreLevel: '核心', difficulty: 2, score: 2, enabled: true, createdAt: '2026-09-20 21:17:50' },
  { id: 'q2', category: '核心能力', type: '单选题', belongTo: 'theory', content: '三级医师查房制度中，住院医师一般要求每日查房几次？', options: [], answers: [], coreLevel: '核心', difficulty: 2, score: 2, enabled: true, createdAt: '2026-09-20 21:17:50' },
  { id: 'q3', category: '核心能力', type: '单选题', belongTo: 'theory', content: '接获危急值报告后，临床科室应如何处理？', options: [], answers: [], coreLevel: '核心', difficulty: 2, score: 2, enabled: true, createdAt: '2026-09-20 21:17:50' },
  { id: 'q4', category: '核心能力', type: '单选题', belongTo: 'theory', content: '手术安全核查制度的"三方核查"包括哪些？', options: [], answers: [], coreLevel: '核心', difficulty: 2, score: 2, enabled: true, createdAt: '2026-09-20 21:17:50' },
  { id: 'q5', category: '核心能力', type: '多选题', belongTo: 'theory', content: '关于会诊制度，下列说法正确的是？', options: [], answers: [], coreLevel: '核心', difficulty: 3, score: 3, enabled: true, createdAt: '2026-09-20 21:17:50' },
  { id: 'q6', category: '核心能力', type: '判断题', belongTo: 'theory', content: '交接班时，危重患者应床边交接。', options: [], answers: [], coreLevel: '核心', difficulty: 1, score: 1, enabled: true, createdAt: '2026-09-20 21:17:50' },
  { id: 'q7', category: '核心能力', type: '填空题', belongTo: 'theory', content: '三级查房制度中三级医师分别指主任（副主任）医师、主治医师和___医师。', options: [], answers: [], coreLevel: '核心', difficulty: 2, score: 2, enabled: true, createdAt: '2026-09-20 21:17:50' },
  { id: 'q8', category: '核心能力', type: '简答题', belongTo: 'theory', content: '值班交接与交班制度规范对医护人员的基本要求。', options: [], answers: [], coreLevel: '核心', difficulty: 2, score: 4, enabled: true, createdAt: '2026-09-20 21:17:50' },
  {
    id: 'q9', category: '急救技能', type: '实操题', belongTo: 'practice', content: '单人成人心肺复苏（CPR）操作考核。',
    options: [], answers: [], coreLevel: '核心', difficulty: 4, score: 20, enabled: true, createdAt: '2026-09-22 10:05:12',
    projects: [
      { category: '操作准备', score: '4', rules: [{ standard: '判断意识与呼吸', keyPoint: '拍肩呼唤、观察胸廓起伏', score: '2' }, { standard: '呼救并启动应急反应', keyPoint: '呼叫他人、拨打120', score: '2' }] },
      { category: '胸外按压', score: '10', rules: [{ standard: '按压部位与手法', keyPoint: '两乳头连线中点、掌根着力', score: '4' }, { standard: '按压深度与频率', keyPoint: '深度5-6cm、频率100-120次/分', score: '6' }] },
      { category: '开放气道与人工呼吸', score: '6', rules: [{ standard: '仰头抬颏法开放气道', keyPoint: '清除异物、气道通畅', score: '2' }, { standard: '口对口人工呼吸', keyPoint: '每次吹气1秒、见胸廓抬起', score: '4' }] },
    ],
  },
  {
    id: 'q10', category: '基层护理', type: '实操题', belongTo: 'practice', content: '静脉留置针穿刺与固定操作考核。',
    options: [], answers: [], coreLevel: '基础', difficulty: 3, score: 15, enabled: true, createdAt: '2026-09-23 14:32:08',
    projects: [
      { category: '操作前准备', score: '3', rules: [{ standard: '核对医嘱与患者信息', keyPoint: '双人核对、腕带确认', score: '3' }] },
      { category: '穿刺操作', score: '8', rules: [{ standard: '消毒与进针角度', keyPoint: '以15-30°进针、见回血后退针芯', score: '4' }, { standard: '送管与回血观察', keyPoint: '送软管、确认回血通畅', score: '4' }] },
      { category: '固定与宣教', score: '4', rules: [{ standard: '透明敷贴固定', keyPoint: '标注日期时间、注明穿刺者', score: '2' }, { standard: '患者宣教', keyPoint: '告知注意事项与异常处理', score: '2' }] },
    ],
  },
]

/**
 * 题目被试卷引用的次数（mock）
 * 真实场景由「试卷维护 - 组卷与试题」的引用统计得出：每被一份试卷选用计 1 次。
 * 仅作展示参考，不影响题目是否可编辑。
 */
const QUOTE_COUNT_MAP: Record<string, number> = {
  q1: 3,
  q2: 1,
  q3: 2,
  q5: 1,
  q6: 2,
  q9: 2,
  q10: 1,
}

/** 取某题的引用次数，未统计到则为 0 */
const quoteCountOf = (id: string): number => QUOTE_COUNT_MAP[id] ?? 0

interface QuestionBankProps {
  /** 题目范围：theory=理论题目（不含实操题）；practice=实操题目（仅实操题） */
  scope?: QuestionScope
}

const QuestionBank: React.FC<QuestionBankProps> = ({ scope = 'theory' }) => {
  const allowedTypes = scope === 'practice' ? PRACTICE_TYPES : THEORY_TYPES
  const defaultType = DEFAULT_TYPE[scope]

  const [categories, setCategories] = useState<QuestionCategory[]>(INITIAL_CATEGORIES)
  const [activeCategoryId, setActiveCategoryId] = useState<string>(() => {
    const inScope = INITIAL_QUESTIONS.filter((q) =>
      scope === 'practice' ? q.belongTo === 'practice' : q.belongTo === 'theory',
    )
    const first = INITIAL_CATEGORIES.find((c) => c.name === inScope[0]?.category)
    return first?.id ?? INITIAL_CATEGORIES[0]?.id ?? ''
  })
  const [questions, setQuestions] = useState<QuestionRecord[]>(INITIAL_QUESTIONS)

  // ===== 筛选 =====
  const [typeInput, setTypeInput] = useState<QuestionType | undefined>(undefined)
  const [kwInput, setKwInput] = useState('')
  const [typeFilter, setTypeFilter] = useState<QuestionType | undefined>(undefined)
  const [kwFilter, setKwFilter] = useState('')

  // ===== 新建分类弹窗 =====
  const [cateOpen, setCateOpen] = useState(false)
  const [cateForm] = Form.useForm()

  // ===== 新建/编辑题目（整页表单） =====
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<QuestionRecord | null>(null)
  // 复制来源：打开新建表单并预填原题内容
  const [copying, setCopying] = useState<QuestionRecord | null>(null)

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

  // 按范围过滤：理论题目仅显示归属理论模块的题，实操题目仅显示归属实操模块的题
  const scopedQuestions = questions.filter((q) =>
    scope === 'practice' ? q.belongTo === 'practice' : q.belongTo === 'theory',
  )

  const filtered = scopedQuestions.filter((q) => {
    if (activeCategory && q.category !== activeCategory.name) return false
    if (typeFilter && q.type !== typeFilter) return false
    if (kwFilter.trim() && !q.content.includes(kwFilter.trim())) return false
    return true
  })

  const handleSearch = () => {
    setTypeFilter(typeInput)
    setKwFilter(kwInput)
  }

  const handleReset = () => {
    setTypeInput(undefined)
    setKwInput('')
    setTypeFilter(undefined)
    setKwFilter('')
  }

  // ===== 新建分类 =====
  const openCateModal = () => {
    cateForm.resetFields()
    cateForm.setFieldsValue({ sort: 0 })
    setCateOpen(true)
  }

  const handleCateOk = async () => {
    const values = await cateForm.validateFields()
    const id = `c-${Date.now()}`
    setCategories((list) => [...list, { id, name: values.name, sort: values.sort ?? 0 }])
    setActiveCategoryId(id)
    setCateOpen(false)
    message.success('分类已创建')
  }

  // ===== 删除题目 =====
  const handleDelete = (id: string) => {
    setQuestions((list) => list.filter((q) => q.id !== id))
    message.success('已删除')
  }

  // ===== 编辑/新建/复制题目 =====
  const openCreate = () => {
    setEditing(null)
    setCopying(null)
    setEditOpen(true)
  }

  const openEdit = (record: QuestionRecord) => {
    setEditing(record)
    setCopying(null)
    setEditOpen(true)
  }

  /** 复制题目：以原题内容预填新建表单，保存后生成一道新题 */
  const openCopy = (record: QuestionRecord) => {
    setEditing(null)
    setCopying(record)
    setEditOpen(true)
  }

  const handleSaved = (record: QuestionRecord, keepAdding: boolean) => {
    setQuestions((list) => {
      const exist = list.some((q) => q.id === record.id)
      return exist ? list.map((q) => (q.id === record.id ? record : q)) : [record, ...list]
    })
    if (keepAdding) {
      message.success('已保存，可继续录入下一题')
    } else {
      message.success('已保存')
      setEditOpen(false)
    }
  }

  // ===== 列表列 =====
  const columns = [
    { title: '序号', width: 60, render: (_: unknown, __: QuestionRecord, i: number) => i + 1 },
    {
      title: '题目内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (v: string) => <span title={v}>{v}</span>,
    },
    { title: '类型', dataIndex: 'type', width: 90 },
    { title: '分数', dataIndex: 'score', width: 70 },
    { title: '难度', dataIndex: 'difficulty', width: 70 },
    {
      title: '引用次数', width: 100, align: 'center' as const,
      render: (_: unknown, record: QuestionRecord) => {
        const n = quoteCountOf(record.id)
        return n > 0 ? <Tag color="blue">{n} 次</Tag> : <span style={{ color: 'rgba(0,0,0,0.45)' }}>0</span>
      },
    },
    {
      title: '状态', dataIndex: 'enabled', width: 80,
      render: (v: boolean) => (v ? <Tag color="green">启用</Tag> : <Tag color="orange">停用</Tag>),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作', width: 190, fixed: 'right' as const,
      render: (_: unknown, record: QuestionRecord) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => openCopy(record)}>复制</Button>
          <Popconfirm title="确定删除该题目？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ position: 'relative', display: 'flex', background: '#fff', borderRadius: 6, minHeight: '100%' }}>
      {/* 左侧：题目分类 */}
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid #f0f0f0', padding: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px 12px' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>题目分类</span>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCateModal}>新建</Button>
        </div>
        <div>
          {categories.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveCategoryId(c.id)}
              style={{
                padding: '9px 16px',
                cursor: 'pointer',
                fontSize: 13,
                color: c.id === activeCategoryId ? '#1677ff' : 'rgba(0,0,0,0.65)',
                background: c.id === activeCategoryId ? '#e6f4ff' : 'transparent',
                fontWeight: c.id === activeCategoryId ? 600 : 400,
              }}
            >
              {c.name}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：题库列表 */}
      <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建题目</Button>
            <Button icon={<UploadOutlined />} onClick={() => message.info('在线导入功能建设中')}>在线导入</Button>
          </Space>
          <Space>
            {scope === 'theory' && (
              <Select
                placeholder="类型"
                style={{ width: 120 }}
                allowClear
                value={typeInput}
                onChange={(v) => setTypeInput(v)}
                options={allowedTypes.map((t) => ({ value: t, label: t }))}
              />
            )}
            <Input
              placeholder="题目内容"
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              style={{ width: 200 }}
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>

      {/* 新建题目分类弹窗 */}
      <Modal
        title="新增题目分类"
        open={cateOpen}
        onOk={handleCateOk}
        onCancel={() => setCateOpen(false)}
        okText="确 定"
        cancelText="取 消"
        width={420}
      >
        <Form form={cateForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="sort" label="排序号" rules={[{ required: true, message: '请输入排序号' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建/编辑题目（整页表单） */}
      {editOpen && (
        <QuestionEdit
          mode={copying ? 'copy' : editing ? 'edit' : 'create'}
          initial={copying || editing}
          categoryName={activeCategory?.name || ''}
          allowedTypes={allowedTypes}
          defaultType={defaultType}
          onBack={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

// ===== 内置：整页式题目编辑表单 =====

const OPTION_LETTERS = 'ABCDEFGHIJ'.split('')

const CORE_LEVEL_OPTIONS = ['基础', '核心', '综合'].map((v) => ({ value: v, label: v }))
const KNOWLEDGE_OPTIONS = ['核心制度', '三级查房', '交接班', '危急值', '手术安全核查', '会诊制度'].map((v) => ({ value: v, label: v }))
const MAJOR_OPTIONS = ['内科', '外科', '妇产科', '儿科', '急诊科', '麻醉科', '影像科', '护理', '全科'].map((v) => ({ value: v, label: v }))
/** 实操题站点（作为考试「站点」选项的唯一来源，供题库与考试抽屉共用） */
export const STATION_NAMES = ['病史采集站', '体格检查站', '辅助检查判读站', '临床技能操作站', '诊断与治疗站', '沟通告知站', '团队协作站']
export const STATION_OPTIONS = STATION_NAMES.map((v) => ({ value: v, label: v }))

/** 评分细则库：新建/编辑实操题时，可由搜索下拉选择后加入评分项目（standard=评分标准, keyPoint=评分要点, score=分值） */
export const SCORE_RULE_POOL: ScoringSubRule[] = [
  { standard: '操作前评估与准备', keyPoint: '核对患者信息、评估环境与物品准备', score: '5' },
  { standard: '无菌观念与手卫生', keyPoint: '操作前后洗手/手消毒、无菌物品取用规范', score: '5' },
  { standard: '操作流程规范性', keyPoint: '步骤完整、顺序正确、动作熟练', score: '10' },
  { standard: '定位与手法准确', keyPoint: '部位准确、手法正确、力度适当', score: '10' },
  { standard: '沟通交流与人文关怀', keyPoint: '告知操作目的、取得配合、注意保暖与隐私', score: '5' },
  { standard: '生命体征监测', keyPoint: '操作中观察意识、呼吸、循环变化', score: '5' },
  { standard: '并发症识别与处理', keyPoint: '及时发现并处理异常情况', score: '5' },
  { standard: '记录与宣教', keyPoint: '完成后记录、向患者及家属宣教注意事项', score: '5' },
  { standard: '急救反应启动', keyPoint: '呼叫支援、启动应急流程及时', score: '5' },
  { standard: '团队协作配合', keyPoint: '角色分工明确、配合默契', score: '5' },
  { standard: '设备使用熟练', keyPoint: '仪器连接、参数设置、故障判断正确', score: '5' },
  { standard: '时间控制合理', keyPoint: '在规定时间内完成操作', score: '5' },
]

/** 实操题项目分类库：新建/编辑实操题时「项目分类」下拉选择 */
export const PROJECT_CATEGORY_POOL = [
  '操作准备',
  '操作前准备',
  '操作流程',
  '无菌操作',
  '部位与手法',
  '沟通与人文关怀',
  '生命体征监测',
  '应急处置',
  '用物整理',
  '记录与宣教',
  '综合评价',
  '胸外按压',
  '开放气道与人工呼吸',
  '穿刺操作',
  '固定与宣教',
]

const QuestionEdit: React.FC<{
  /** create=新建；edit=编辑；copy=复制（以原题内容预填，保存后生成新题） */
  mode: 'create' | 'edit' | 'copy'
  initial: QuestionRecord | null
  categoryName: string
  /** 当前范围允许的题型（理论题目不含实操题；实操题目仅实操题） */
  allowedTypes: QuestionType[]
  /** 新建时的默认题型 */
  defaultType: QuestionType
  onBack: () => void
  onSaved: (record: QuestionRecord, keepAdding: boolean) => void
}> = ({ mode, initial, categoryName, allowedTypes, defaultType, onBack, onSaved }) => {
  const [form] = Form.useForm()
  const qType = Form.useWatch('type', form) as QuestionType | undefined
  const isPractice = allowedTypes.includes('实操题')
  const scope: QuestionScope = isPractice ? 'practice' : 'theory'
  const [options, setOptions] = useState<QuestionOption[]>(
    initial?.options?.length
      ? initial.options
      : [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
  )
  const [answers, setAnswers] = useState<string[]>(initial?.answers || [])
  // 答案要点（填空题/简答题）
  const [points, setPoints] = useState<string[]>(initial?.points?.length ? initial.points : [''])
  // 评分项目 + 评分细则（实操题，两级结构）
  const [projects, setProjects] = useState<PracticalProject[]>(
    initial?.projects?.length
      ? initial.projects
      : [{ category: '', score: '', rules: [] }],
  )
  // 题目配图（可多张）
  const [questionImages, setQuestionImages] = useState<string[]>(initial?.images || [])

  const isChoice = qType === '单选题' || qType === '多选题' || qType === undefined
  const isJudge = qType === '判断题'

  const addQuestionImage = (file: File) => {
    setQuestionImages((list) => [...list, URL.createObjectURL(file)])
  }

  const buildRecord = (values: {
    type: QuestionType
    content: string
    coreLevel: string
    knowledge?: string
    difficulty: number
    score: number
    major?: string
    analysis?: string
    enabled: boolean
  }): QuestionRecord | null => {
    let finalAnswers = answers
    if (values.type === '判断题') finalAnswers = answers.length ? answers : []
    if (values.type === '填空题' || values.type === '简答题') {
      finalAnswers = []
      if (points.every((p) => !p.trim())) {
        message.warning('请至少输入一个答案要点')
        return null
      }
    }
    if (values.type === '实操题') {
      finalAnswers = []
      const hasValid = projects.some(
        (p) => p.category.trim() && p.rules.some((r) => r.standard.trim() || r.keyPoint.trim() || String(r.score).trim()),
      )
      if (!hasValid) {
        message.warning('请至少填写一个评分项目及其评分细则')
        return null
      }
    }
    if ((values.type === '单选题' || values.type === '多选题') && finalAnswers.length === 0) {
      message.warning(values.type === '单选题' ? '请选择正确答案' : '请至少勾选一个正确答案')
      return null
    }
    if (values.type === '单选题' && finalAnswers.length > 1) finalAnswers = finalAnswers.slice(0, 1)
    // 复制/新建：生成新 id 与新创建时间；编辑：沿用原值
    const reuseOriginal = mode === 'edit'
    return {
      id: reuseOriginal && initial?.id ? initial.id : `q-${Date.now()}`,
      category: initial?.category || categoryName,
      type: values.type,
      belongTo: initial?.belongTo || scope,
      content: values.content,
      options: values.type === '单选题' || values.type === '多选题' ? options : [],
      answers: finalAnswers,
      points: values.type === '填空题' || values.type === '简答题' ? points.filter((p) => p.trim()) : [],
      projects: values.type === '实操题'
        ? projects.map((p) => {
            const sum = p.rules.reduce((s, r) => s + (Number(r.score) || 0), 0)
            return {
              category: p.category.trim(),
              score: String(sum),
              rules: p.rules.map((r) => ({ ...r, score: String(r.score).trim() })),
            }
          })
        : [],
      images: questionImages,
      coreLevel: values.coreLevel,
      knowledge: values.knowledge,
      difficulty: values.difficulty,
      score: values.score,
      major: values.major,
      analysis: values.analysis,
      enabled: values.enabled,
      createdAt: reuseOriginal && initial?.createdAt
        ? initial.createdAt
        : new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
  }

  const handleSave = async (keepAdding: boolean) => {
    const values = await form.validateFields()
    const record = buildRecord(values)
    if (!record) return
    onSaved(record, keepAdding)
    if (keepAdding) {
      form.resetFields()
      setOptions([{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }])
      setAnswers([])
      setPoints([''])
      setProjects([{ category: '', score: '', rules: [] }])
      setQuestionImages([])
    }
  }

  const addOption = () => {
    if (options.length >= OPTION_LETTERS.length) return
    setOptions((list) => [...list, { label: OPTION_LETTERS[list.length], text: '' }])
  }

  const removeOption = (label: string) => {
    if (options.length <= 2) {
      message.warning('至少保留两个选项')
      return
    }
    const rest = options.filter((o) => o.label !== label).map((o, i) => ({ ...o, label: OPTION_LETTERS[i] }))
    setOptions(rest)
    setAnswers((list) => list.filter((a) => a !== label))
  }

  // ===== 实操题：评分项目 / 评分细则（两级） =====
  const addProject = () => {
    setProjects((list) => [...list, { category: '', score: '', rules: [] }])
  }

  const addRule = (pi: number) => {
    setProjects((list) => list.map((p, i) => (i === pi ? { ...p, rules: [...p.rules, { standard: '', keyPoint: '', score: '' }] } : p)))
  }

  const removeProject = (idx: number) => {
    if (projects.length <= 1) {
      message.warning('至少保留一个评分项目')
      return
    }
    setProjects((list) => list.filter((_, i) => i !== idx))
  }

  const removeRule = (pi: number, ri: number) => {
    setProjects((list) =>
      list.map((p, i) => (i === pi ? { ...p, rules: p.rules.filter((_, k) => k !== ri) } : p)),
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: '#f5f5f5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 顶栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          borderRadius: '6px 6px 0 0',
        }}
      >
        <Space size={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>
          <span style={{ fontSize: 15, fontWeight: 600 }}>
            {mode === 'edit' ? '编辑题目' : mode === 'copy' ? '复制题目' : '新建题目'}
          </span>
        </Space>
        <Space>
          {mode === 'create' && <Button onClick={() => handleSave(true)}>保存并新增下一个</Button>}
          <Button type="primary" onClick={() => handleSave(false)}>保存</Button>
        </Space>
      </div>

      {/* 主体：左表单 + 右选项 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 16, padding: 16, overflowY: 'auto' }}>
        {/* 左侧表单 */}
        <div style={{ flex: 1, minWidth: 320, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 6, padding: 24 }}>
          <Form
            form={form}
            layout="horizontal"
            labelCol={{ flex: '0 0 96px' }}
            wrapperCol={{ flex: 1 }}
            initialValues={
              initial
                ? {
                    type: initial.type,
                    content: initial.content,
                    coreLevel: initial.coreLevel,
                    knowledge: initial.knowledge,
                    difficulty: initial.difficulty,
                    score: initial.score,
                    major: initial.major,
                    analysis: initial.analysis,
                    enabled: initial.enabled,
                  }
                : { type: defaultType, difficulty: 1, score: 1.0, enabled: true }
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="type" label="题型" rules={[{ required: true, message: '请选择题型' }]}>
                  <Select
                    disabled={allowedTypes.length === 1}
                    options={allowedTypes.map((t) => ({ value: t, label: t }))}
                    onChange={(v) => {
                      setAnswers([])
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="coreLevel" label="题目分类" rules={[{ required: true, message: '请选择题目分类' }]}>
                  <Select placeholder="题目分类" options={CORE_LEVEL_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="content" label="题目内容" rules={[{ required: true, message: '请输入题目内容' }]}>
              <Input.TextArea rows={5} placeholder="请输入题目内容（填空题请用三个下划线表示空格）" />
            </Form.Item>
            {/* 题目配图：加号方框图标，支持多张 */}
            <Form.Item label="题目配图">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space size={12}>
                  <Upload
                    multiple
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      addQuestionImage(file)
                      return false
                    }}
                  >
                    <PlusSquareOutlined style={{ fontSize: 22, color: '#999', cursor: 'pointer' }} title="添加图片" />
                  </Upload>
                </Space>
                {questionImages.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {questionImages.map((src, i) => (
                      <div
                        key={i}
                        style={{ position: 'relative', width: 64, height: 64, border: '1px solid #f0f0f0', borderRadius: 4, overflow: 'hidden' }}
                      >
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <CloseCircleFilled
                          onClick={() => setQuestionImages((list) => list.filter((_, j) => j !== i))}
                          style={{ position: 'absolute', top: 2, right: 2, color: 'rgba(0,0,0,0.45)', fontSize: 14, cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Space>
            </Form.Item>
            {/* 分数（前）+ 难度（后），同一行 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="score" label="分数" rules={[{ required: true, message: '请输入分数' }]}>
                  <InputNumber min={0.5} step={0.5} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="difficulty" label="难度" rules={[{ required: true, message: '请选择难度' }]}>
                  <Rate />
                </Form.Item>
              </Col>
            </Row>
            {/* 指定专业（不选择为不限制） */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="major" label="指定专业">
                  <Select placeholder="不限制" allowClear options={MAJOR_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="knowledge" label="知识点">
              <Select placeholder="请选择知识点或搜索，仅用于题库分类检索" showSearch optionFilterProp="label" options={KNOWLEDGE_OPTIONS} allowClear />
            </Form.Item>
            <Form.Item name="analysis" label="解析">
              <Input.TextArea rows={3} placeholder="请输入解析" />
            </Form.Item>
            <Form.Item name="enabled" label="是否启用" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
          </Form>
        </div>

        {/* 右侧选项区（加宽：题目部分容器相应缩小） */}
        <div style={{ width: 880, flexShrink: 0, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 6, padding: 24 }}>
          {isChoice && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>选项</span>
                <Button type="text" icon={<PlusOutlined />} onClick={addOption} />
              </div>
              {options.map((o) => (
                <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 16, fontWeight: 600 }}>{o.label}</span>
                  <Input
                    value={o.text}
                    placeholder="请输入选项内容"
                    style={{ height: 40 }}
                    onChange={(e) =>
                      setOptions((list) => list.map((x) => (x.label === o.label ? { ...x, text: e.target.value } : x)))
                    }
                  />
                  {qType === '多选题' ? (
                    <Checkbox
                      checked={answers.includes(o.label)}
                      onChange={(e) =>
                        setAnswers((list) => (e.target.checked ? [...list, o.label] : list.filter((a) => a !== o.label)))
                      }
                    />
                  ) : (
                    <Radio
                      checked={answers.includes(o.label)}
                      onChange={() => setAnswers([o.label])}
                    />
                  )}
                  {/* 选项配图（仅单选/多选支持，每项一张） */}
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      setOptions((list) => list.map((x) => (x.label === o.label ? { ...x, image: URL.createObjectURL(file) } : x)))
                      return false
                    }}
                  >
                    {o.image ? (
                      <span style={{ position: 'relative', display: 'inline-block', width: 32, height: 32 }}>
                        <img
                          src={o.image}
                          alt=""
                          style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0', cursor: 'pointer' }}
                        />
                        <CloseCircleFilled
                          onClick={(e) => {
                            e.stopPropagation()
                            setOptions((list) => list.map((x) => (x.label === o.label ? { ...x, image: undefined } : x)))
                          }}
                          style={{ position: 'absolute', top: -6, right: -6, color: 'rgba(0,0,0,0.45)', fontSize: 14, cursor: 'pointer' }}
                        />
                      </span>
                    ) : (
                      <span
                        title="上传选项图片"
                        style={{
                          width: 32,
                          height: 32,
                          border: '1px dashed #d9d9d9',
                          borderRadius: 4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          cursor: 'pointer',
                        }}
                      >
                        <PlusOutlined />
                      </span>
                    )}
                  </Upload>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeOption(o.label)} />
                </div>
              ))}
              <div style={{ color: '#999', fontSize: 12 }}>
                {qType === '多选题' ? '勾选复选框标记正确答案（可多选），选项可上传一张配图' : '点选圆形单选框标记正确答案，选项可上传一张配图'}
              </div>
            </>
          )}
          {isJudge && (
            <>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>答案</div>
              <Space direction="vertical" size={12}>
                {['对', '错'].map((t) => (
                  <Radio
                    key={t}
                    checked={answers.includes(t)}
                    onChange={() => setAnswers([t])}
                  >
                    {t}
                  </Radio>
                ))}
              </Space>
            </>
          )}
          {(qType === '填空题' || qType === '简答题') && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>答案要点</span>
                <Button type="text" icon={<PlusOutlined />} onClick={() => setPoints((list) => [...list, ''])} />
              </div>
              {points.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Input
                    value={p}
                    placeholder="请输入答案要点"
                    style={{ height: 40 }}
                    onChange={(e) => setPoints((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                  {points.length > 1 && (
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setPoints((list) => list.filter((_, j) => j !== i))} />
                  )}
                </div>
              ))}
              <div style={{ color: '#999', fontSize: 12 }}>可添加多个答案要点，评卷时按要点给分</div>
            </>
          )}
          {qType === '实操题' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>评分标准</span>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addProject}>添加项目</Button>
              </div>
              {projects.map((p, pi) => (
                <div
                  key={pi}
                  style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 16, marginBottom: 16, background: '#fafafa' }}
                >
                  {/* 项目行：项目分类 + 分值 + 添加明细(+) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ width: 70, color: '#666', fontSize: 13, flexShrink: 0 }}>项目分类</span>
                    <Select
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      size="large"
                      placeholder="请选择项目分类"
                      style={{ width: 260, flexShrink: 0 }}
                      value={p.category || undefined}
                      options={PROJECT_CATEGORY_POOL.map((v) => ({ value: v, label: v }))}
                      onChange={(val) => setProjects((list) => list.map((x, j) => (j === pi ? { ...x, category: val ?? '' } : x)))}
                    />
                    <InputNumber
                      value={p.rules.reduce((s, r) => s + (Number(r.score) || 0), 0)}
                      disabled
                      min={0}
                      placeholder="分值"
                      style={{ width: 110 }}
                    />
                    <Button type="text" icon={<PlusOutlined />} title="添加评分细则" onClick={() => addRule(pi)} />
                    {projects.length > 1 && (
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeProject(pi)}>删除项目</Button>
                    )}
                  </div>
                  {/* 子级：评分细则（缩进 + 左侧色条体现上下级，无标题/无列头，仅保留输入框占位文字） */}
                  <div style={{ marginLeft: 24, borderLeft: '3px solid #e6f4ff', paddingLeft: 16 }}>
                    {p.rules.length === 0 && (
                      <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>暂无评分细则，请点击项目行右侧的 + 添加</div>
                    )}
                    {p.rules.map((r, ri) => (
                      <div key={ri} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        {/* 评分标准：可直接输入，也可从评分细则库联想选择（选中后自动带出要点/分值） */}
                        <AutoComplete
                          size="large"
                          value={r.standard}
                          placeholder="评分标准（输入后选择）"
                          style={{ flex: 1.5 }}
                          options={SCORE_RULE_POOL.map((rule) => ({
                            value: rule.standard,
                            label: `${rule.standard} · ${rule.keyPoint} · ${rule.score}分`,
                            keyPoint: rule.keyPoint,
                            score: rule.score,
                          }))}
                          filterOption={(input, option) =>
                            String(option?.value ?? '').includes(input) || String(option?.label ?? '').includes(input)
                          }
                          onChange={(val) => setProjects((list) => list.map((x, j) => (j === pi ? { ...x, rules: x.rules.map((y, k) => (k === ri ? { ...y, standard: val } : y)) } : x)))}
                          onSelect={(_val, option) => {
                            const opt = option as { keyPoint?: string; score?: string }
                            setProjects((list) => list.map((x, j) => (j === pi ? { ...x, rules: x.rules.map((y, k) => (k === ri ? { ...y, keyPoint: opt.keyPoint ?? y.keyPoint, score: opt.score ?? y.score } : y)) } : x)))
                          }}
                        />
                        <Input
                          value={r.keyPoint}
                          placeholder="要点"
                          style={{ flex: 1.125, height: 40 }}
                          onChange={(e) => setProjects((list) => list.map((x, j) => (j === pi ? { ...x, rules: x.rules.map((y, k) => (k === ri ? { ...y, keyPoint: e.target.value } : y)) } : x)))}
                        />
                        <InputNumber
                          value={r.score === '' ? undefined : Number(r.score)}
                          min={0}
                          placeholder="分值"
                          style={{ width: 80 }}
                          onChange={(v) => setProjects((list) => list.map((x, j) => (j === pi ? { ...x, rules: x.rules.map((y, k) => (k === ri ? { ...y, score: v === null || v === undefined ? '' : String(v) } : y)) } : x)))}
                        />
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeRule(pi, ri)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ color: '#999', fontSize: 12 }}>可添加多个评分项目，每个项目下点击 + 后于下方新增一行，在「评分标准」中输入并从下拉选择细则（自动带出得分/扣分要点与分值），也可直接手工填写，选定后仍可编辑或删除，评卷时按项目逐项给分</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionBank
