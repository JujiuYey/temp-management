import React, { useMemo, useState } from 'react'
import { Button, Card, Checkbox, Empty, Input, Modal, Select, Tag, message } from 'antd'
import {
  AuditOutlined,
  CheckCircleFilled,
  FileSearchOutlined,
  IdcardOutlined,
  LockOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

// ===== 辅助类型 =====
type AssistKind = 'practice' | 'exam' | 'ticket' | 'draw'

const KIND_ORDER: AssistKind[] = ['practice', 'exam', 'ticket', 'draw']

const KIND_META: Record<AssistKind, { title: string; desc: string; icon: React.ReactNode; color: string; bg: string }> = {
  practice: {
    title: '实训练习签到',
    desc: '实训练习到场签到确认',
    icon: <AuditOutlined />,
    color: '#722ed1',
    bg: '#f9f0ff',
  },
  exam: {
    title: '实操考试签到',
    desc: '实操考试到场签到确认',
    icon: <CheckCircleFilled />,
    color: '#13c2c2',
    bg: '#e6fffb',
  },
  ticket: {
    title: '准考证打印',
    desc: '现场打印考生准考证',
    icon: <IdcardOutlined />,
    color: '#1677ff',
    bg: '#e6f4ff',
  },
  draw: {
    title: '实操抽题',
    desc: '现场抽题并打印试题单',
    icon: <FileSearchOutlined />,
    color: '#fa8c16',
    bg: '#fff7e6',
  },
}

// ===== 演示数据：人员 =====
interface Staff {
  idCard: string      // 身份证号（检索键）
  name: string
  jobNo: string
  department: string
}

const STAFF: Staff[] = [
  { idCard: '520102199001011234', name: '韦饶饶', jobNo: '100231', department: '医务科' },
  { idCard: '520102199203155678', name: '李明轩', jobNo: '100302', department: '内科' },
  { idCard: '520102199507220012', name: '王雨欣', jobNo: '100418', department: '外科' },
  { idCard: '520102198811034455', name: '张启明', jobNo: '100526', department: '急诊科' },
  { idCard: '520102199612278899', name: '刘思远', jobNo: '100637', department: '儿科' },
]

// ===== 演示数据：试卷 =====
interface PaperDef {
  name: string                 // 试卷名称（应用范围筛选键）
  examNo: string               // 考试编号
  examName: string             // 关联考试
  type: '理论' | '实操'
  scenes: AssistKind[]         // 适用的辅助类型
  room: string
  timeStart: string
  timeEnd: string
  questionCount: number
  totalScore: number
}

const PAPERS: PaperDef[] = [
  {
    name: '心肺复苏（CPR）操作技能考核·A 卷', examNo: 'EX20260901', examName: '心肺复苏（CPR）操作技能考核',
    type: '实操', scenes: ['exam', 'ticket', 'draw'],
    room: '实训楼 1 楼急救实训室', timeStart: '2026-10-13 08:30', timeEnd: '2026-10-13 12:00',
    questionCount: 8, totalScore: 100,
  },
  {
    name: '成人单人徒手心肺复苏操作考核·A 卷', examNo: 'EX20260902', examName: '成人单人徒手心肺复苏操作考核',
    type: '实操', scenes: ['practice', 'exam', 'ticket', 'draw'],
    room: '实训楼 1 楼急救实训室', timeStart: '2026-10-13 13:30', timeEnd: '2026-10-13 17:30',
    questionCount: 10, totalScore: 100,
  },
  {
    name: '临床技能操作考核·A 卷', examNo: 'EX20260903', examName: '临床技能操作考核',
    type: '实操', scenes: ['practice', 'exam', 'ticket', 'draw'],
    room: '实训楼 2 楼技能中心', timeStart: '2026-10-14 08:30', timeEnd: '2026-10-14 17:00',
    questionCount: 12, totalScore: 100,
  },
  {
    name: '2026 年第四季度三基理论考核·A 卷', examNo: 'EX20261001', examName: '2026 年第四季度三基理论考核',
    type: '理论', scenes: ['ticket'],
    room: '门诊楼 3 楼机房 A', timeStart: '2026-10-12 09:00', timeEnd: '2026-10-12 11:00',
    questionCount: 60, totalScore: 100,
  },
  {
    name: '抗菌药物临床应用知识考试·A 卷', examNo: 'EX20261003', examName: '抗菌药物临床应用知识考试',
    type: '理论', scenes: ['ticket'],
    room: '门诊楼 3 楼机房 B', timeStart: '2026-10-15 14:00', timeEnd: '2026-10-15 15:00',
    questionCount: 50, totalScore: 100,
  },
  {
    name: '住院医师规范化培训出科考核（内科）·A 卷', examNo: 'EX20261004', examName: '住院医师规范化培训出科考核（内科）',
    type: '理论', scenes: ['ticket'],
    room: '住院楼 5 楼技能中心', timeStart: '2026-10-16 09:00', timeEnd: '2026-10-16 11:00',
    questionCount: 80, totalScore: 100,
  },
]

// ===== 演示数据：实操抽题库 =====
interface DrawQuestion {
  title: string
  points: string[]
  duration: string
}

const DRAW_POOL: DrawQuestion[] = [
  {
    title: '成人单人徒手心肺复苏术',
    duration: '8 分钟',
    points: ['判断意识与呼吸', '启动应急反应系统', '胸外按压（位置 / 深度 / 频率）', '开放气道与人工呼吸', '复苏效果评估'],
  },
  {
    title: '电除颤操作',
    duration: '6 分钟',
    points: ['确认适应证与禁忌证', '开机与电极片粘贴位置', '选择能量并充电', '清场与放电', '复律后评估与记录'],
  },
  {
    title: '气管插管术',
    duration: '8 分钟',
    points: ['体位与预给氧', '喉镜置入与声门暴露', '导管置入与深度确认', '气囊充气与固定', '确认位置并记录'],
  },
  {
    title: '无菌换药术',
    duration: '6 分钟',
    points: ['核对与解释', '揭除敷料与创面评估', '消毒范围与顺序', '覆盖无菌敷料', '用物处理与记录'],
  },
  {
    title: '静脉输液技术',
    duration: '6 分钟',
    points: ['核对与解释', '选择血管与扎止血带', '消毒与穿刺', '固定与调速', '观察与记录'],
  },
  {
    title: '体格检查（腹部）',
    duration: '8 分钟',
    points: ['体位与暴露', '视诊', '听诊', '叩诊', '触诊'],
  },
]

// ===== 可操作记录 =====
interface AssistRecord {
  key: string
  kind: AssistKind
  staff: Staff
  paper: PaperDef
  seatNo: string
}

/** 生成某考生在某辅助类型下、按应用范围过滤后的记录 */
const buildRecords = (kind: AssistKind, staff: Staff, scope: string[]): AssistRecord[] => {
  const inScope = (p: PaperDef) => scope.length === 0 || scope.includes(p.name)
  return PAPERS.filter((p) => p.scenes.includes(kind) && inScope(p)).map((p, i) => ({
    key: `${kind}-${p.examNo}-${staff.idCard}`,
    kind,
    staff,
    paper: p,
    seatNo: `${String.fromCharCode(65 + Math.floor(i / 2))}-${String(i + 1).padStart(2, '0')}`,
  }))
}

// ===== 打印样式与工具 =====
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const docRow = (label: string, value: string, valueClass = '') =>
  `<div class="row"><div class="k">${esc(label)}</div><div class="v${valueClass ? ' ' + valueClass : ''}">${esc(value)}</div></div>`

const PRINT_STYLE = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px 16px; background: #f5f7fa; font-family: -apple-system, "Microsoft YaHei", "PingFang SC", sans-serif; }
  .doc { width: 460px; margin: 0 auto 20px; background: #fff; border: 1px solid #e8e8e8; border-radius: 10px; padding: 24px 26px; page-break-after: always; }
  .doc:last-child { page-break-after: auto; }
  .title { text-align: center; font-size: 20px; font-weight: 700; letter-spacing: 5px; color: #1a1a1a; }
  .sub { text-align: center; font-size: 12px; color: #999; margin-top: 5px; }
  .dash { border-top: 1px dashed #d9d9d9; margin: 16px 0; }
  .row { display: flex; font-size: 13px; padding: 6px 0; }
  .row .k { width: 82px; flex-shrink: 0; color: #8c8c8c; }
  .row .v { flex: 1; color: #1a1a1a; font-weight: 500; word-break: break-all; }
  .row .v.seat { color: #1677ff; font-weight: 700; font-size: 15px; letter-spacing: 1px; }
  .notice { font-size: 12px; color: #8c8c8c; line-height: 1.9; }
  .h2 { font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 18px 0 10px; }
  .pt { font-size: 13px; color: #1a1a1a; line-height: 2; }
  @media print {
    body { background: #fff; padding: 0; }
    .doc { width: 100%; border: none; border-radius: 0; margin: 0; }
  }
`

/** 准考证打印文档 */
const buildTicketDoc = (r: AssistRecord) => `
  <div class="doc">
    <div class="title">准 考 证</div>
    <div class="sub">医学教育培训考试系统</div>
    <div class="dash"></div>
    ${docRow('考试编号', r.paper.examNo)}
    ${docRow('考生姓名', r.staff.name)}
    ${docRow('考生编号', r.staff.jobNo)}
    ${docRow('身份证号', r.staff.idCard)}
    ${docRow('所属科室', r.staff.department)}
    ${docRow('考试名称', r.paper.examName)}
    ${docRow('试卷名称', r.paper.name)}
    ${docRow('考试时间', `${r.paper.timeStart} ~ ${r.paper.timeEnd}`)}
    ${docRow('考场', r.paper.room)}
    ${docRow('座位号', r.seatNo, 'seat')}
    <div class="dash"></div>
    <div class="notice">
      注意事项：<br />
      1. 请提前 15 分钟到达考场，凭本准考证及身份证入场；<br />
      2. 考试期间不得携带手机等通讯工具，违者按违规处理；<br />
      3. 开考 30 分钟后不得入场，交卷后不得返回考场；<br />
      4. 如遇设备故障，请举手联系监考人员。
    </div>
  </div>
`

/** 实操抽题打印文档 */
const buildDrawDoc = (r: AssistRecord, q: DrawQuestion, drawnAt: string) => `
  <div class="doc">
    <div class="title">实 操 试 题 单</div>
    <div class="sub">${esc(r.paper.examName)}</div>
    <div class="dash"></div>
    ${docRow('考试编号', r.paper.examNo)}
    ${docRow('考生姓名', r.staff.name)}
    ${docRow('考生编号', r.staff.jobNo)}
    ${docRow('身份证号', r.staff.idCard)}
    ${docRow('所属科室', r.staff.department)}
    ${docRow('考场', r.paper.room)}
    ${docRow('座位号', r.seatNo, 'seat')}
    ${docRow('抽题时间', drawnAt)}
    <div class="dash"></div>
    <div class="h2">抽中题目：${esc(q.title)}</div>
    ${docRow('考核时长', q.duration)}
    <div class="h2">考核要点</div>
    ${q.points.map((p, i) => `<div class="pt">${i + 1}. ${esc(p)}</div>`).join('')}
    <div class="dash"></div>
    <div class="notice">考评员签字：____________　　得分：__________</div>
  </div>
`

/** 打开新窗口并唤起打印 */
const printHtml = (html: string, title: string) => {
  const win = window.open('', '_blank', 'width=760,height=900')
  if (!win) {
    message.warning('浏览器拦截了打印窗口，请允许弹出窗口后重试')
    return
  }
  win.document.open()
  win.document.write(
    `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8" /><title>${esc(title)}</title><style>${PRINT_STYLE}</style></head><body>${html}</body></html>`,
  )
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

// ===== 当前登录账号（设置密码校验用） =====
const ADMIN = { name: '管理员', account: 'admin', password: '123456' }

// ===== 圆形操作按钮（签到 / 抽题） =====
const CircleAction: React.FC<{
  color: string
  bg: string
  label: string
  done: boolean
  doneLabel: string
  icon: React.ReactNode
  doneIcon: React.ReactNode
  onClick: () => void
}> = ({ color, bg, label, done, doneLabel, icon, doneIcon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={done}
    style={{
      width: 190,
      height: 190,
      borderRadius: '50%',
      border: `3px solid ${color}`,
      background: done ? bg : '#fff',
      color,
      cursor: done ? 'default' : 'pointer',
      fontSize: 17,
      fontWeight: 600,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      transition: 'transform .15s, box-shadow .15s',
      boxShadow: `0 8px 24px ${color}22`,
    }}
  >
    <span style={{ fontSize: 36, display: 'flex' }}>{done ? doneIcon : icon}</span>
    <span>{done ? doneLabel : label}</span>
  </button>
)

// ===== 准考证预览（右侧） =====
const TicketPreview: React.FC<{ r: AssistRecord }> = ({ r }) => {
  const row = (label: string, value: React.ReactNode) => (
    <>
      <div style={{ color: 'rgba(0,0,0,0.45)' }}>{label}</div>
      <div style={{ color: '#1a1a1a', fontWeight: 500 }}>{value}</div>
    </>
  )
  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, padding: '20px 24px', background: '#fff', width: 430, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, letterSpacing: 4, color: '#1a1a1a' }}>准 考 证</div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>医学教育培训考试系统</div>
      <div style={{ borderTop: '1px dashed #d9d9d9', margin: '16px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '78px 1fr', rowGap: 11, columnGap: 10, fontSize: 13 }}>
        {row('考试编号', r.paper.examNo)}
        {row('考生姓名', r.staff.name)}
        {row('考生编号', r.staff.jobNo)}
        {row('身份证号', r.staff.idCard)}
        {row('所属科室', r.staff.department)}
        {row('考试名称', r.paper.examName)}
        {row('试卷名称', r.paper.name)}
        {row('考试时间', `${r.paper.timeStart} ~ ${r.paper.timeEnd}`)}
        {row('考场', r.paper.room)}
        {row('座位号', <span style={{ color: '#1677ff', fontWeight: 700, fontSize: 15 }}>{r.seatNo}</span>)}
      </div>
      <div style={{ borderTop: '1px dashed #d9d9d9', margin: '16px 0 12px' }} />
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 1.9 }}>
        注意事项：
        <br />
        1. 请提前 15 分钟到达考场，凭本准考证及身份证入场；
        <br />
        2. 考试期间不得携带手机等通讯工具，违者按违规处理；
        <br />
        3. 开考 30 分钟后不得入场，交卷后不得返回考场；
        <br />
        4. 如遇设备故障，请举手联系监考人员。
      </div>
    </div>
  )
}

// ===== 实操题目预览（右侧） =====
const DrawPreview: React.FC<{ r: AssistRecord; q: DrawQuestion; drawnAt: string }> = ({ r, q, drawnAt }) => (
  <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, padding: '20px 24px', background: '#fff', width: 480, margin: '0 auto' }}>
    <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, letterSpacing: 4, color: '#1a1a1a' }}>实 操 试 题 单</div>
    <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>{r.paper.examName}</div>
    <div style={{ borderTop: '1px dashed #d9d9d9', margin: '16px 0' }} />
    <div style={{ display: 'grid', gridTemplateColumns: '78px 1fr', rowGap: 10, columnGap: 10, fontSize: 13 }}>
      <div style={{ color: 'rgba(0,0,0,0.45)' }}>考生姓名</div>
      <div style={{ color: '#1a1a1a', fontWeight: 500 }}>{r.staff.name}</div>
      <div style={{ color: 'rgba(0,0,0,0.45)' }}>考生编号</div>
      <div style={{ color: '#1a1a1a', fontWeight: 500 }}>{r.staff.jobNo}</div>
      <div style={{ color: 'rgba(0,0,0,0.45)' }}>考场/座位</div>
      <div style={{ color: '#1a1a1a', fontWeight: 500 }}>
        {r.paper.room}　<span style={{ color: '#1677ff', fontWeight: 700 }}>{r.seatNo}</span>
      </div>
      <div style={{ color: 'rgba(0,0,0,0.45)' }}>抽题时间</div>
      <div style={{ color: '#1a1a1a', fontWeight: 500 }}>{drawnAt}</div>
    </div>
    <div style={{ borderTop: '1px dashed #d9d9d9', margin: '16px 0' }} />
    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>抽中题目：{q.title}</div>
    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 12 }}>考核时长：{q.duration}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>考核要点</div>
    {q.points.map((p, i) => (
      <div key={i} style={{ fontSize: 13, color: 'rgba(0,0,0,0.75)', lineHeight: 2, paddingLeft: 4 }}>
        {i + 1}. {p}
      </div>
    ))}
  </div>
)

// ===== 辅助中心 =====
const AssistCenter: React.FC = () => {
  // 设置
  const [settingOpen, setSettingOpen] = useState(false)
  const [authStep, setAuthStep] = useState<'auth' | 'setting'>('auth')
  const [pwd, setPwd] = useState('')
  const [enabledKinds, setEnabledKinds] = useState<AssistKind[]>([...KIND_ORDER])
  const [scope, setScope] = useState<string[]>(PAPERS.map((p) => p.name))
  const [draftKinds, setDraftKinds] = useState<AssistKind[]>([...KIND_ORDER])
  const [draftScope, setDraftScope] = useState<string[]>(PAPERS.map((p) => p.name))

  // 工作区
  const [kind, setKind] = useState<AssistKind | null>(null)
  const [idInput, setIdInput] = useState('')
  const [queryId, setQueryId] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [signMap, setSignMap] = useState<Record<string, string>>({})
  const [drawMap, setDrawMap] = useState<Record<string, { title: string; drawnAt: string }>>({})

  /** 当前身份证匹配到的人员 */
  const staff = useMemo(
    () => (queryId ? STAFF.find((s) => s.idCard.toLowerCase() === queryId.toLowerCase()) ?? null : null),
    [queryId],
  )

  /** 左侧记录列表 */
  const records = useMemo(
    () => (kind && staff ? buildRecords(kind, staff, scope) : []),
    [kind, staff, scope],
  )

  /** 右侧当前记录（默认取第一条） */
  const current = useMemo(
    () => records.find((r) => r.key === selectedKey) ?? records[0] ?? null,
    [records, selectedKey],
  )

  // ===== 设置弹窗 =====
  const openSetting = () => {
    setAuthStep('auth')
    setPwd('')
    setDraftKinds([...enabledKinds])
    setDraftScope([...scope])
    setSettingOpen(true)
  }

  const handleVerify = () => {
    if (!pwd) {
      message.warning('请输入当前账号密码')
      return
    }
    if (pwd !== ADMIN.password) {
      message.error('密码错误，请重新输入')
      setPwd('')
      return
    }
    message.success('身份验证通过')
    setAuthStep('setting')
  }

  const handleSaveSetting = () => {
    if (draftKinds.length === 0) {
      message.warning('请至少选择一种辅助类型')
      return
    }
    if (draftScope.length === 0) {
      message.warning('请至少选择一项应用范围')
      return
    }
    setEnabledKinds(draftKinds)
    setScope(draftScope)
    setSettingOpen(false)
    // 当前工作区类型被取消勾选 → 退回中心
    if (kind && !draftKinds.includes(kind)) {
      handleBackHome()
    }
    message.success('设置已保存')
  }

  // ===== 工作区操作 =====
  const handlePickKind = (k: AssistKind) => {
    setKind(k)
    setIdInput('')
    setQueryId('')
    setSelectedKey(null)
  }

  const handleBackHome = () => {
    setKind(null)
    setIdInput('')
    setQueryId('')
    setSelectedKey(null)
  }

  const handleQuery = (id?: string) => {
    const v = (id ?? idInput).trim()
    if (!v) {
      message.warning('请输入身份证号')
      return
    }
    const hit = STAFF.find((s) => s.idCard.toLowerCase() === v.toLowerCase())
    if (!hit) {
      setQueryId('')
      setSelectedKey(null)
      message.error(`未查询到身份证号「${v}」对应的考生`)
      return
    }
    setQueryId(hit.idCard)
    setSelectedKey(null)
    message.success(`已识别考生：${hit.name}（${hit.department}）`)
  }

  /** 刷身份证（演示：依次读取人员库） */
  const handleSwipe = () => {
    const idx = STAFF.findIndex((s) => s.idCard === queryId)
    const next = STAFF[(idx + 1) % STAFF.length]
    setIdInput(next.idCard)
    handleQuery(next.idCard)
  }

  const handleReset = () => {
    setIdInput('')
    setQueryId('')
    setSelectedKey(null)
  }

  /** 签到 */
  const handleSign = (r: AssistRecord) => {
    const t = dayjs().format('YYYY-MM-DD HH:mm:ss')
    setSignMap((p) => ({ ...p, [r.key]: t }))
    message.success(`${r.staff.name} 签到成功（${t}）`)
  }

  /** 抽题 */
  const handleDraw = (r: AssistRecord) => {
    const q = DRAW_POOL[Math.floor(Math.random() * DRAW_POOL.length)]
    const t = dayjs().format('YYYY-MM-DD HH:mm:ss')
    setDrawMap((p) => ({ ...p, [r.key]: { title: q.title, drawnAt: t } }))
    message.success(`已抽取题目：${q.title}`)
  }

  /** 重新抽题 */
  const handleRedraw = (r: AssistRecord) => {
    handleDraw(r)
  }

  /** 打印 */
  const handlePrint = (r: AssistRecord) => {
    if (r.kind === 'ticket') {
      printHtml(buildTicketDoc(r), `准考证-${r.staff.name}`)
      return
    }
    const drawn = drawMap[r.key]
    if (!drawn) {
      message.warning('请先抽题后再打印')
      return
    }
    const q = DRAW_POOL.find((x) => x.title === drawn.title)
    if (!q) return
    printHtml(buildDrawDoc(r, q, drawn.drawnAt), `实操试题单-${r.staff.name}`)
  }

  /** 左侧记录状态标签 */
  const statusOf = (r: AssistRecord): { text: string; color: string } => {
    if (r.kind === 'ticket') return { text: '待打印', color: 'blue' }
    if (r.kind === 'draw') return drawMap[r.key] ? { text: '已抽题', color: 'green' } : { text: '待抽题', color: 'orange' }
    return signMap[r.key] ? { text: '已签到', color: 'green' } : { text: '待签到', color: 'orange' }
  }

  const meta = kind ? KIND_META[kind] : null

  return (
    <div>
      {/* 页头：标题 + 右上角设置 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              width: 4,
              height: 18,
              background: '#1677ff',
              borderRadius: 2,
              marginRight: 8,
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>辅助中心</span>
        </div>
        <Button
          type="text"
          icon={<SettingOutlined style={{ fontSize: 18 }} />}
          onClick={openSetting}
          title="设置"
        />
      </div>

      {/* ===== 中心：辅助类型卡片 ===== */}
      {!kind && (
        <>
          {enabledKinds.length === 0 ? (
            <Empty description="尚未启用任何辅助类型，请点击右上角设置" style={{ marginTop: 80 }} />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 32 }}>
              {KIND_ORDER.filter((k) => enabledKinds.includes(k)).map((k) => {
                const m = KIND_META[k]
                return (
                  <Card key={k} hoverable onClick={() => handlePickKind(k)} style={{ width: 260 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                      <span
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          background: m.bg,
                          color: m.color,
                          fontSize: 26,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {m.icon}
                      </span>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textAlign: 'center' }}>{m.desc}</div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ===== 工作区 ===== */}
      {kind && meta && (
        <>
          {/* 类型提示条 + 返回 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              background: meta.bg,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ color: meta.color, fontSize: 16, display: 'flex' }}>{meta.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{meta.title}</span>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              应用范围：{scope.length === PAPERS.length ? '全部试卷' : `${scope.length} 项`}
            </span>
            <Button type="link" size="small" style={{ marginLeft: 'auto' }} onClick={handleBackHome}>
              返回
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* ---- 左侧：身份证 + 记录 ---- */}
            <div style={{ width: 380, flexShrink: 0 }}>
              <div
                style={{
                  border: '1px solid #eef0f3',
                  borderRadius: 10,
                  padding: 16,
                  background: '#fff',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>考生身份识别</div>
                <Input
                  allowClear
                  size="large"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  onPressEnter={() => handleQuery()}
                  placeholder="请输入身份证号"
                  prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                  style={{ marginBottom: 10 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="primary" onClick={() => handleQuery()} style={{ flex: 1 }}>
                    查询
                  </Button>
                  <Button icon={<IdcardOutlined />} onClick={handleSwipe}>
                    刷身份证
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset} />
                </div>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 10 }}>
                  演示身份证号：{STAFF[0].idCard}
                </div>
              </div>

              {/* 记录列表 */}
              <div style={{ border: '1px solid #eef0f3', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  对应记录
                  {staff && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.45)' }}>
                      {staff.name} · {records.length} 条
                    </span>
                  )}
                </div>

                {!staff && <Empty description="请先输入身份证号查询" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '28px 0' }} />}

                {staff && records.length === 0 && (
                  <Empty description="该考生在应用范围内暂无可操作记录" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '28px 0' }} />
                )}

                {records.map((r) => {
                  const st = statusOf(r)
                  const active = current?.key === r.key
                  return (
                    <div
                      key={r.key}
                      onClick={() => setSelectedKey(r.key)}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid #f5f5f5',
                        cursor: 'pointer',
                        background: active ? '#f0f7ff' : '#fff',
                        borderLeft: `3px solid ${active ? '#1677ff' : 'transparent'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', flex: 1, minWidth: 0 }}>{r.paper.name}</span>
                        <Tag color={st.color} style={{ margin: 0, flexShrink: 0 }}>
                          {st.text}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 6 }}>
                        {r.paper.timeStart} ~ {r.paper.timeEnd}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                        {r.paper.room}　座位号 {r.seatNo}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ---- 右侧：按类型展示 ---- */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                border: '1px solid #eef0f3',
                borderRadius: 10,
                background: '#fafbfc',
                minHeight: 520,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {!current ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="请输入身份证号以加载对应记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
                    {/* 准考证打印：预览 */}
                    {kind === 'ticket' && <TicketPreview r={current} />}

                    {/* 签到：圆圈 */}
                    {(kind === 'practice' || kind === 'exam') && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 440, gap: 18 }}>
                        <CircleAction
                          color={meta.color}
                          bg={meta.bg}
                          label="点击签到"
                          done={!!signMap[current.key]}
                          doneLabel="已完成签到"
                          icon={<AuditOutlined />}
                          doneIcon={<CheckCircleFilled />}
                          onClick={() => handleSign(current)}
                        />
                        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', textAlign: 'center' }}>
                          {signMap[current.key]
                            ? `签到时间：${signMap[current.key]}`
                            : `${current.staff.name} · ${current.paper.name}`}
                        </div>
                      </div>
                    )}

                    {/* 实操抽题：圆圈 + 抽题后预览 */}
                    {kind === 'draw' && (
                      <div>
                        {!drawMap[current.key] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 440, gap: 18 }}>
                            <CircleAction
                              color={meta.color}
                              bg={meta.bg}
                              label="点击抽题"
                              done={false}
                              doneLabel=""
                              icon={<FileSearchOutlined />}
                              doneIcon={<CheckCircleFilled />}
                              onClick={() => handleDraw(current)}
                            />
                            <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                              {current.staff.name} · {current.paper.name}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                              <CheckCircleFilled style={{ color: '#52c41a' }} />
                              <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
                                抽题完成（{drawMap[current.key].drawnAt}）
                              </span>
                              <Button size="small" icon={<ReloadOutlined />} onClick={() => handleRedraw(current)} style={{ marginLeft: 'auto' }}>
                                重新抽题
                              </Button>
                            </div>
                            {(() => {
                              const q = DRAW_POOL.find((x) => x.title === drawMap[current.key].title)
                              return q ? <DrawPreview r={current} q={q} drawnAt={drawMap[current.key].drawnAt} /> : null
                            })()}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 右下角操作区 */}
                  {((kind === 'ticket') || (kind === 'draw' && drawMap[current.key])) && (
                    <div
                      style={{
                        padding: '12px 20px',
                        borderTop: '1px solid #eef0f3',
                        background: '#fff',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        borderRadius: '0 0 10px 10px',
                      }}
                    >
                      <Button type="primary" size="large" icon={<PrinterOutlined />} onClick={() => handlePrint(current)}>
                        打印
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== 设置弹窗 ===== */}
      <Modal
        title={
          authStep === 'auth' ? (
            <span>
              <LockOutlined style={{ marginRight: 8 }} />
              身份验证
            </span>
          ) : (
            <span>
              <SettingOutlined style={{ marginRight: 8 }} />
              辅助中心设置
            </span>
          )
        }
        open={settingOpen}
        onCancel={() => setSettingOpen(false)}
        width={authStep === 'auth' ? 420 : 560}
        footer={null}
        destroyOnClose
      >
        {authStep === 'auth' ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: '#fafafa',
                borderRadius: 8,
                margin: '8px 0 20px',
                fontSize: 13,
                color: 'rgba(0,0,0,0.65)',
              }}
            >
              <UserOutlined />
              <span>
                当前账号：{ADMIN.name}（{ADMIN.account}）
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.85)', marginBottom: 8 }}>
              <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>请输入当前账号密码
            </div>
            <Input.Password
              size="large"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              onPressEnter={handleVerify}
              placeholder="请输入密码"
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
              autoFocus
            />
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 8 }}>演示密码：123456</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button onClick={() => setSettingOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleVerify}>
                验证
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: '8px 0 10px' }}>辅助类型</div>
            <Checkbox.Group
              value={draftKinds}
              onChange={(v) => setDraftKinds(v as AssistKind[])}
              options={KIND_ORDER.map((k) => ({ label: KIND_META[k].title, value: k }))}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px' }}
            />

            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: '22px 0 10px' }}>应用范围</div>
            <Select
              mode="multiple"
              allowClear
              value={draftScope}
              onChange={(v) => setDraftScope(v)}
              placeholder="请选择试卷名称"
              style={{ width: '100%' }}
              maxTagCount="responsive"
              options={PAPERS.map((p) => ({ label: p.name, value: p.name }))}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button onClick={() => setSettingOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSaveSetting}>
                确认
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AssistCenter
