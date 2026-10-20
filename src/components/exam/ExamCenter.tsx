import React, { useEffect, useMemo, useState } from 'react'
import { Button, Drawer, Dropdown, Empty, Input, Modal, Select, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  IdcardOutlined,
  MessageOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  PrinterOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import ExamPaper from './ExamPaper'
import { PreviewDrawer } from './TheoryExam'
import type { TheoryExamRecord } from './TheoryExam'
import dayjs from 'dayjs'

// ===== 本人考试记录数据模型 =====
type MyExamStatus = '未开始' | '进行中' | '已结束'

interface AttemptRecord {
  no: number           // 第几次考试
  time: string         // 交卷时间
  duration: string     // 考试用时
  score: number | null // 成绩（null = 未完成本次作答）
}

interface MyExamRecord {
  id: string
  name: string           // 考试名称
  category: string       // 考试分类
  totalScore: number     // 总分
  passScore: number      // 及格分
  timeStart: string      // 可考时段-开始
  timeEnd: string        // 可考时段-结束
  attempts: number       // 已考次数
  maxAttempts: number    // 可考次数
  duration: string       // 考试时长文案
  status: MyExamStatus   // 我的考试状态
  myScore?: number       // 我的成绩（已结束时有值）
  questionCount?: number // 该试卷题目总数（用于「申请复核题目」下拉）
  room?: string          // 考场（准考证用）
  seatNo?: string        // 座位号（准考证用）
  history: AttemptRecord[] // 作答记录
}

// 当前考生信息（准考证用，演示数据）
const MY_INFO = { name: '韦饶饶', jobNo: '100231', department: '医务科' }

// 进入考试前的「考试须知」条款（弹出后需阅读，倒计时结束方可进入）
const EXAM_NOTICE: string[] = [
  '请确保在安静、网络稳定的环境中参加考试，考试过程中保持本页面为当前活动窗口；',
  '考试全程系统将记录切屏次数，频繁切换窗口将影响诚信考试记录；',
  '请在规定的考试时限内完成作答并在时限到达前交卷，超时系统将自动收卷；',
  '作答过程中请勿刷新或关闭页面，以免已作答记录丢失；',
  '如遇到设备故障、页面异常等情况，请立即举手联系监考人员处理。',
]

// 状态标签（右上角胶囊）配色
const STATUS_PILL: Record<MyExamStatus, { bg: string; color: string }> = {
  未开始: { bg: '#fff7e6', color: '#fa8c16' },
  进行中: { bg: '#e6f4ff', color: '#1677ff' },
  已结束: { bg: '#f5f5f5', color: 'rgba(0,0,0,0.45)' },
}

const FILTER_TABS: ('全部' | MyExamStatus)[] = ['全部', '未开始', '进行中', '已结束']

// ===== 本人考试记录 mock 数据 =====
const MY_EXAMS: MyExamRecord[] = [
  {
    id: 'm1', name: '急救技能专项考核', category: '急救技能', totalScore: 100, passScore: 60,
    timeStart: '2026-09-15 08:00', timeEnd: '2026-10-20 23:59',
    attempts: 1, maxAttempts: 1, duration: '不限时', status: '进行中',
    room: '实训楼 1 楼急救实训室', seatNo: 'A-08',
    history: [],
  },
  {
    id: 'm2', name: '2026 年第四季度三基理论考核', category: '三基考核', totalScore: 100, passScore: 60,
    timeStart: '2027-01-01 09:00', timeEnd: '2027-01-01 11:00',
    attempts: 0, maxAttempts: 1, duration: '2 小时 0 分钟', status: '未开始',
    room: '门诊楼 3 楼机房 A', seatNo: 'B-12',
    history: [],
  },
  {
    id: 'm3', name: '医疗核心制度应知应会考试', category: '核心制度', totalScore: 100, passScore: 60,
    timeStart: '2026-09-01 08:00', timeEnd: '2026-09-10 23:59',
    attempts: 2, maxAttempts: 2, duration: '60 分钟', status: '已结束', myScore: 88,
    room: '门诊楼 3 楼机房 B', seatNo: 'C-05', questionCount: 25,
    history: [
      { no: 1, time: '2026-09-03 10:21:36', duration: '42 分 18 秒', score: 82 },
      { no: 2, time: '2026-09-08 15:02:47', duration: '38 分 05 秒', score: 88 },
    ],
  },
  {
    id: 'm4', name: '抗菌药物临床应用知识考试', category: '药事管理', totalScore: 100, passScore: 60,
    timeStart: '2026-09-05 08:00', timeEnd: '2026-09-12 23:59',
    attempts: 1, maxAttempts: 1, duration: '45 分钟', status: '已结束', myScore: 55,
    room: '门诊楼 3 楼机房 A', seatNo: 'A-21', questionCount: 30,
    history: [{ no: 1, time: '2026-09-11 16:40:12', duration: '40 分 33 秒', score: 55 }],
  },
  {
    id: 'm5', name: '住院医师规范化培训出科考核（内科）', category: '出科考核', totalScore: 100, passScore: 60,
    timeStart: '2026-10-01 08:00', timeEnd: '2026-10-25 23:59',
    attempts: 1, maxAttempts: 3, duration: '不限时', status: '进行中',
    room: '住院楼 5 楼技能中心', seatNo: 'D-03',
    history: [],
  },
]

// 「我的成绩」取值文案与颜色
const myScoreView = (e: MyExamRecord): { text: string; color: string } => {
  if (e.status === '未开始') return { text: '未开始', color: 'rgba(0,0,0,0.45)' }
  if (e.status === '进行中') return { text: '进行中', color: '#1677ff' }
  if (e.myScore == null) return { text: '未出分', color: 'rgba(0,0,0,0.45)' }
  return { text: `${e.myScore} 分`, color: e.myScore >= e.passScore ? '#389e0d' : '#cf1322' }
}

/** 该试卷的全部题号：演示数据无真实试卷结构，按题目总数生成 1..N */
const questionNosOf = (e: MyExamRecord): number[] =>
  Array.from({ length: e.questionCount ?? 20 }, (_, i) => i + 1)

// ===== 成绩复核 =====
// none 未申请 / pending 已申请待回复（可取消）/ replied 考官已回复（可查看）
type ReviewState = 'none' | 'pending' | 'replied'

interface ReviewApplication {
  examId: string
  questionNos?: number[] // 申请复核的题目（题号）
  desc: string       // 申请内容
  appliedAt: string  // 申请时间
  reply?: string     // 考官回复
  replyBy?: string   // 回复人
  repliedAt?: string // 回复时间
}

// 演示数据：m4 考官已回复（按钮显示「查看复核」）；m3 未申请（按钮显示「申请复核」，提交后可取消）
const INITIAL_REVIEWS: Record<string, ReviewApplication> = {
  m4: {
    examId: 'm4',
    questionNos: [18],
    desc: '第 18 题考查的用药剂量在最新指南中已更新，本人作答依据新版指南，请复核判分是否准确。',
    appliedAt: '2026-09-13 14:20:00',
    reply: '经复核，第 18 题参考答案与判分标准无误；2026 版指南尚未在本院执行，本题仍按现行标准评判，本次成绩维持 55 分。如仍有异议，可申请线下复核。',
    replyBy: '李明钊（考务）',
    repliedAt: '2026-09-14 10:05:00',
  },
}

/** 考试中心记录 → 复用 PreviewDrawer 所需的最小 TheoryExamRecord 形状 */
const toPreviewExam = (e: MyExamRecord): TheoryExamRecord => ({
  id: e.id,
  name: e.name,
  category: e.category,
  period: '开放时段',
  status: e.status === '已结束' ? '已结束' : '进行中',
  totalScore: e.totalScore,
  passScore: e.passScore,
  timeMode: '不计时',
  runTime: `${e.timeStart} ~ ${e.timeEnd}`,
  attempts: e.maxAttempts,
  examType: '理论考试',
  pickerMode: '统一考试',
  duration: e.duration,
})

// 信息行：图标 + 标签 + 值
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0' }}>
    <span style={{ color: 'rgba(0,0,0,0.35)', fontSize: 14, flexShrink: 0 }}>{icon}</span>
    <span style={{ width: 70, flexShrink: 0, fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>{label}</span>
    <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#1a1a1a' }}>{children}</span>
  </div>
)

// 准考证信息行：标签 + 值（用于网格布局）
const TicketRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <>
    <div style={{ color: 'rgba(0,0,0,0.45)' }}>{label}</div>
    <div style={{ color: '#1a1a1a', fontWeight: 500 }}>{value}</div>
  </>
)

// ===== 准考证导出（下载 / 打印共用同一份 HTML） =====
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const ticketDocRow = (label: string, value: string, valueClass = '') =>
  `<div class="row"><div class="k">${esc(label)}</div><div class="v${valueClass ? ' ' + valueClass : ''}">${esc(value)}</div></div>`

const buildTicketHtml = (exam: MyExamRecord): string => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>准考证 - ${esc(exam.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px 16px; background: #f5f7fa; font-family: -apple-system, "Microsoft YaHei", "PingFang SC", sans-serif; }
  .ticket { width: 460px; margin: 0 auto; background: #fff; border: 1px solid #e8e8e8; border-radius: 10px; padding: 24px 26px; }
  .title { text-align: center; font-size: 20px; font-weight: 700; letter-spacing: 5px; color: #1a1a1a; }
  .sub { text-align: center; font-size: 12px; color: #999; margin-top: 5px; }
  .dash { border-top: 1px dashed #d9d9d9; margin: 16px 0; }
  .row { display: flex; font-size: 13px; padding: 6px 0; }
  .row .k { width: 76px; flex-shrink: 0; color: #8c8c8c; }
  .row .v { flex: 1; color: #1a1a1a; font-weight: 500; word-break: break-all; }
  .row .v.seat { color: #1677ff; font-weight: 700; font-size: 15px; letter-spacing: 1px; }
  .notice { font-size: 12px; color: #8c8c8c; line-height: 1.9; }
  @media print {
    body { background: #fff; padding: 0; }
    .ticket { width: 100%; border: none; border-radius: 0; }
  }
</style>
</head>
<body>
  <div class="ticket">
    <div class="title">准 考 证</div>
    <div class="sub">医学教育培训考试系统</div>
    <div class="dash"></div>
    ${ticketDocRow('考生姓名', MY_INFO.name)}
    ${ticketDocRow('工号', MY_INFO.jobNo)}
    ${ticketDocRow('所属科室', MY_INFO.department)}
    ${ticketDocRow('考试名称', exam.name)}
    ${ticketDocRow('考试分类', exam.category)}
    ${ticketDocRow('考试时间', `${exam.timeStart} ~ ${exam.timeEnd}`)}
    ${ticketDocRow('考试时长', exam.duration)}
    ${ticketDocRow('考场', exam.room ?? '待安排')}
    ${ticketDocRow('座位号', exam.seatNo ?? '待安排', 'seat')}
    <div class="dash"></div>
    <div class="notice">
      注意事项：<br />
      1. 请提前 15 分钟到达考场，凭本准考证及工牌入场；<br />
      2. 考试期间不得携带手机等通讯工具，违者按违规处理；<br />
      3. 开考 30 分钟后不得入场，交卷后不得返回考场；<br />
      4. 如遇设备故障，请举手联系监考人员。
    </div>
  </div>
</body>
</html>
`

// ===== 考试记录卡片（精简版） =====
const ExamCard: React.FC<{
  record: MyExamRecord
  onViewRecord: () => void
  onViewPaper: () => void
  onStart: () => void
  onApplyReview: () => void
  onCancelReview: () => void
  onViewReview: () => void
  onTicket: () => void
  reviewState: ReviewState
}> = ({
  record,
  onViewRecord,
  onViewPaper,
  onStart,
  onApplyReview,
  onCancelReview,
  onViewReview,
  onTicket,
  reviewState,
}) => {
  const pill = STATUS_PILL[record.status]
  const score = myScoreView(record)

  const primaryAction =
    record.status === '未开始'
      ? { text: '开始考试', icon: <PlayCircleOutlined />, disabled: true }
      : { text: '继续考试', icon: <PlayCircleOutlined />, disabled: false }

  // 「更多」菜单：准考证 + （已结束）复核相关操作（按复核状态三选一）
  const moreItems: NonNullable<MenuProps['items']> = [
    { key: 'ticket', icon: <IdcardOutlined />, label: '准考证' },
    { key: 'record', icon: <ClockCircleOutlined />, label: '作答记录' },
  ]
  if (record.status === '已结束') {
    moreItems.push(
      { type: 'divider' },
      reviewState === 'replied'
        ? { key: 'viewReview', icon: <MessageOutlined />, label: '复核详情' }
        : reviewState === 'pending'
          ? { key: 'cancelReview', icon: <CloseCircleOutlined />, label: '取消复核' }
          : { key: 'applyReview', icon: <FileSearchOutlined />, label: '申请复核' },
    )
  }
  const onMoreClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'ticket') onTicket()
    else if (key === 'record') onViewRecord()
    else if (key === 'applyReview') onApplyReview()
    else if (key === 'cancelReview') onCancelReview()
    else if (key === 'viewReview') onViewReview()
  }

  return (
    <div
      style={{
        width: 360,
        border: '1px solid #eef0f3',
        borderRadius: 12,
        padding: '18px 18px 16px',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 标题 + 状态胶囊 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: '#1a1a1a', lineHeight: '22px' }}>{record.name}</div>
        <span
          style={{
            flexShrink: 0,
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: 12,
            background: pill.bg,
            color: pill.color,
          }}
        >
          {record.status}
        </span>
      </div>

      {/* 考试分类 */}
      <div style={{ marginTop: 10 }}>
        <Tag style={{ margin: 0, fontSize: 12, lineHeight: '20px', color: '#1677ff', background: '#f5faff', borderColor: '#91caff', borderRadius: 4 }}>
          {record.category}
        </Tag>
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', margin: '14px 0 4px' }} />

      <InfoRow icon={<CalendarOutlined />} label="考试时间">
        {record.timeStart} ~ {record.timeEnd}
      </InfoRow>
      <InfoRow icon={<ClockCircleOutlined />} label="考试时长">
        {record.duration}
      </InfoRow>
      <InfoRow icon={<CrownOutlined />} label="我的成绩">
        <span style={{ color: score.color, fontWeight: 600 }}>{score.text}</span>
      </InfoRow>
      <InfoRow icon={<SyncOutlined />} label="可考次数">
        {record.attempts} / {record.maxAttempts}
      </InfoRow>

      {/* 操作：查看答卷 / 开始考试·继续考试 / 更多 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
        <Button icon={<FileTextOutlined />} onClick={onViewPaper}>
          查看答卷
        </Button>
        {record.status !== '已结束' && (
          <Button
            type="primary"
            icon={primaryAction.icon}
            disabled={primaryAction.disabled}
            onClick={() => {
              if (record.status === '进行中') onStart()
              else message.info(`「${record.name}」演示环境，暂不支持${primaryAction.text}`)
            }}
          >
            {primaryAction.text}
          </Button>
        )}
        <Dropdown menu={{ items: moreItems, onClick: onMoreClick }} placement="bottomRight" trigger={['click']}>
          <Button icon={<MoreOutlined />}>更多</Button>
        </Dropdown>
      </div>
    </div>
  )
}

// ===== 考试中心 =====
const ExamCenter: React.FC = () => {
  const [tab, setTab] = useState<'全部' | MyExamStatus>('全部')
  const [recordExam, setRecordExam] = useState<MyExamRecord | null>(null)
  // 「查看答卷」直接预览试卷（不显示正确答案）
  const [previewExam, setPreviewExam] = useState<MyExamRecord | null>(null)
  const [paperExam, setPaperExam] = useState<MyExamRecord | null>(null)
  const [ticketExam, setTicketExam] = useState<MyExamRecord | null>(null)
  const [reviewExam, setReviewExam] = useState<MyExamRecord | null>(null)
  const [reviewMode, setReviewMode] = useState<'apply' | 'view'>('apply')
  const [reviewDesc, setReviewDesc] = useState('')
  // 申请复核的题目（题号，多选）
  const [reviewNos, setReviewNos] = useState<number[]>([])
  const [reviews, setReviews] = useState<Record<string, ReviewApplication>>(INITIAL_REVIEWS)

  // 考试须知：点击「开始考试 / 继续考试」先弹须知，5 秒倒计时结束后才可确认进入考试
  // 考试名称查询：inputValue 为输入框实时值，keyword 为点击「查询」后生效的筛选值
  const [inputValue, setInputValue] = useState('')
  const [keyword, setKeyword] = useState('')

  const [noticeExam, setNoticeExam] = useState<MyExamRecord | null>(null)
  const [noticeLeft, setNoticeLeft] = useState(0)
  useEffect(() => {
    if (!noticeExam) return
    setNoticeLeft(5)
    const id = window.setInterval(() => setNoticeLeft((n) => (n <= 1 ? 0 : n - 1)), 1000)
    return () => window.clearInterval(id)
  }, [noticeExam])

  const openNotice = (e: MyExamRecord) => setNoticeExam(e)
  const handleConfirmNotice = () => {
    const e = noticeExam
    setNoticeExam(null)
    if (e) setPaperExam(e)
  }
  const handleCancelNotice = () => setNoticeExam(null)

  // 某场考试的复核状态：未申请 / 待回复 / 已回复
  const reviewStateOf = (id: string): ReviewState => {
    const r = reviews[id]
    if (!r) return 'none'
    return r.reply ? 'replied' : 'pending'
  }
  const currentReview = reviewExam ? reviews[reviewExam.id] : undefined
  // 预览试卷入参：用 useMemo 稳住对象引用，避免 PreviewDrawer 的 useEffect 反复重跑
  const previewRecord = useMemo<TheoryExamRecord | null>(
    () => (previewExam ? toPreviewExam(previewExam) : null),
    [previewExam],
  )

  const list = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return MY_EXAMS.filter(
      (e) =>
        (tab === '全部' || e.status === tab) &&
        (!kw || e.name.toLowerCase().includes(kw)),
    )
  }, [tab, keyword])

  const handleSearch = () => setKeyword(inputValue)
  const handleResetSearch = () => {
    setInputValue('')
    setKeyword('')
  }

  const recordColumns: ColumnsType<AttemptRecord> = [
    { title: '考试次数', key: 'no', width: 100, align: 'center', render: (_: unknown, r: AttemptRecord) => `第 ${r.no} 次` },
    { title: '交卷时间', dataIndex: 'time', key: 'time', width: 180 },
    { title: '考试用时', dataIndex: 'duration', key: 'duration', width: 140 },
    {
      title: '成绩',
      key: 'score',
      width: 120,
      align: 'center',
      render: (_: unknown, r: AttemptRecord) =>
        r.score == null ? (
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>未完成</span>
        ) : (
          <span style={{ color: r.score >= (recordExam?.passScore ?? 60) ? '#389e0d' : '#cf1322', fontWeight: 600 }}>
            {r.score}
            <span style={{ color: '#999', fontWeight: 400, fontSize: 12 }}> / {recordExam?.totalScore ?? 100}</span>
          </span>
        ),
    },
    {
      title: '状态',
      key: 'state',
      width: 100,
      align: 'center',
      render: (_: unknown, r: AttemptRecord) =>
        r.score == null ? <Tag color="orange">进行中</Tag> : <Tag color="green">已完成</Tag>,
    },
  ]

  const handleSubmitReview = () => {
    if (reviewNos.length === 0) {
      message.warning('请选择申请复核的题目')
      return
    }
    if (!reviewDesc.trim()) {
      message.warning('请填写复核说明')
      return
    }
    if (reviewExam) {
      const app: ReviewApplication = {
        examId: reviewExam.id,
        questionNos: [...reviewNos].sort((a, b) => a - b),
        desc: reviewDesc.trim(),
        appliedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }
      setReviews((p) => ({ ...p, [reviewExam.id]: app }))
    }
    message.success('复核申请已提交')
    setReviewExam(null)
    setReviewDesc('')
    setReviewNos([])
  }

  // 取消复核申请（已回复的不可取消，按钮此时为「查看复核」）
  const handleCancelReview = (e: MyExamRecord) => {
    Modal.confirm({
      title: '取消复核申请',
      content: `确定取消「${e.name}」的成绩复核申请吗？取消后如需复核需重新提交。`,
      okText: '确定取消',
      cancelText: '再想想',
      okButtonProps: { danger: true },
      onOk: () => {
        setReviews((p) => {
          const next = { ...p }
          delete next[e.id]
          return next
        })
        message.success('已取消复核申请')
      },
    })
  }

  const openApplyReview = (e: MyExamRecord) => {
    setReviewDesc('')
    setReviewNos([])
    setReviewMode('apply')
    setReviewExam(e)
  }
  const openViewReview = (e: MyExamRecord) => {
    setReviewMode('view')
    setReviewExam(e)
  }

  // 下载准考证（HTML 文件，可直接打开或另存为 PDF）
  const handleDownloadTicket = () => {
    if (!ticketExam) return
    const blob = new Blob([buildTicketHtml(ticketExam)], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `准考证-${ticketExam.name}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('准考证已下载')
  }

  // 打印准考证（新窗口打开准考证页面并唤起打印对话框）
  const handlePrintTicket = () => {
    if (!ticketExam) return
    const win = window.open('', '_blank', 'width=760,height=900')
    if (!win) {
      message.warning('浏览器拦截了打印窗口，请允许弹出窗口后重试')
      return
    }
    win.document.open()
    win.document.write(buildTicketHtml(ticketExam))
    win.document.close()
    win.focus()
    // 等待新窗口样式渲染完成后再唤起打印
    setTimeout(() => win.print(), 300)
  }

  return (
    <div>
      {/* 页面标题 + 考试名称查询 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>考试中心</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            allowClear
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSearch}
            placeholder="请输入考试名称"
            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
            style={{ width: 220 }}
          />
          <Button type="primary" onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleResetSearch}>重置</Button>
        </div>
      </div>

      {/* 状态筛选：全部 / 未开始 / 进行中 / 已结束（左上方） */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
        {FILTER_TABS.map((t) => (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 13,
              borderRadius: 999,
              color: t === tab ? '#1677ff' : 'rgba(0,0,0,0.65)',
              background: t === tab ? '#e6f4ff' : 'transparent',
              fontWeight: t === tab ? 600 : 400,
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* 考试卡片 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {list.map((e) => (
          <ExamCard
            key={e.id}
            record={e}
            onViewRecord={() => setRecordExam(e)}
            onViewPaper={() => setPreviewExam(e)}
            onStart={() => openNotice(e)}
            onApplyReview={() => openApplyReview(e)}
            onCancelReview={() => handleCancelReview(e)}
            onViewReview={() => openViewReview(e)}
            onTicket={() => setTicketExam(e)}
            reviewState={reviewStateOf(e.id)}
          />
        ))}
      </div>
      {list.length === 0 && <Empty description="暂无考试记录" style={{ marginTop: 80 }} />}

      {/* 准考证抽屉 */}
      <Drawer
        title="准考证"
        placement="right"
        width={480}
        open={!!ticketExam}
        onClose={() => setTicketExam(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setTicketExam(null)}>关闭</Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTicket}>
              下载
            </Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrintTicket}>
              打印
            </Button>
          </div>
        }
      >
        {ticketExam && (
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, padding: '20px 22px', background: '#fff' }}>
            <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, letterSpacing: 4, color: '#1a1a1a' }}>
              准 考 证
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
              医学教育培训考试系统
            </div>
            <div style={{ borderTop: '1px dashed #d9d9d9', margin: '16px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', rowGap: 12, columnGap: 10, fontSize: 13 }}>
              <TicketRow label="考生姓名" value={MY_INFO.name} />
              <TicketRow label="工号" value={MY_INFO.jobNo} />
              <TicketRow label="所属科室" value={MY_INFO.department} />
              <TicketRow label="考试名称" value={ticketExam.name} />
              <TicketRow label="考试分类" value={ticketExam.category} />
              <TicketRow label="考试时间" value={`${ticketExam.timeStart} ~ ${ticketExam.timeEnd}`} />
              <TicketRow label="考试时长" value={ticketExam.duration} />
              <TicketRow label="考场" value={ticketExam.room ?? '待安排'} />
              <TicketRow
                label="座位号"
                value={
                  <span style={{ color: '#1677ff', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>
                    {ticketExam.seatNo ?? '待安排'}
                  </span>
                }
              />
            </div>

            <div style={{ borderTop: '1px dashed #d9d9d9', margin: '16px 0 12px' }} />
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 1.9 }}>
              注意事项：
              <br />
              1. 请提前 15 分钟到达考场，凭本准考证及工牌入场；
              <br />
              2. 考试期间不得携带手机等通讯工具，违者按违规处理；
              <br />
              3. 开考 30 分钟后不得入场，交卷后不得返回考场；
              <br />
              4. 如遇设备故障，请举手联系监考人员。
            </div>
          </div>
        )}
      </Drawer>

      {/* 查看答卷：直接预览试卷（考生视角，不显示正确答案） */}
      <PreviewDrawer
        exam={previewRecord}
        onClose={() => setPreviewExam(null)}
        hideAnswerAlways
        answerSeed={previewExam ? `${previewExam.id}-${MY_INFO.jobNo}` : undefined}
      />

      {/* 考试记录抽屉 */}
      <Drawer
        title={`答卷记录 - ${recordExam?.name ?? ''}`}
        placement="right"
        width={720}
        open={!!recordExam}
        onClose={() => setRecordExam(null)}
      >
        {recordExam && (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
              <span>总分：{recordExam.totalScore} 分</span>
              <span>及格分：{recordExam.passScore} 分</span>
              <span>
                可考时段：{recordExam.timeStart} 至 {recordExam.timeEnd}
              </span>
              <span>
                可考次数：{recordExam.attempts}/{recordExam.maxAttempts}
              </span>
            </div>
            <Table<AttemptRecord>
              columns={recordColumns}
              dataSource={recordExam.history}
              rowKey="no"
              pagination={false}
              size="middle"
              locale={{ emptyText: <Empty description="暂无作答记录" /> }}
            />
          </>
        )}
      </Drawer>

      {/* 成绩复核抽屉：申请（填写说明）/ 查看（申请内容 + 考官回复） */}
      <Drawer
        title={
          reviewMode === 'view'
            ? `复核详情 - ${reviewExam?.name ?? ''}`
            : `成绩复核申请 - ${reviewExam?.name ?? ''}`
        }
        placement="right"
        width={520}
        open={!!reviewExam}
        onClose={() => {
          setReviewExam(null)
          setReviewDesc('')
        }}
        footer={
          reviewMode === 'view' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setReviewExam(null)
                  setReviewDesc('')
                }}
              >
                关闭
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                onClick={() => {
                  setReviewExam(null)
                  setReviewDesc('')
                  setReviewNos([])
                }}
              >
                取消
              </Button>
              <Button type="primary" onClick={handleSubmitReview}>
                提交申请
              </Button>
            </div>
          )
        }
      >
        {reviewExam && (
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '12px 16px',
                background: '#fafafa',
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 13,
                color: 'rgba(0,0,0,0.65)',
              }}
            >
              <span>考试名称：{reviewExam.name}</span>
              <span>
                我的成绩：{reviewExam.myScore ?? '—'} 分（及格分 {reviewExam.passScore} 分）
              </span>
              <span>
                可考次数：{reviewExam.attempts}/{reviewExam.maxAttempts}
              </span>
            </div>

            {reviewMode === 'view' && currentReview ? (
              <>
                {/* 申请内容 */}
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>申请复核题目</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {(currentReview.questionNos ?? []).length ? (
                    [...(currentReview.questionNos ?? [])]
                      .sort((a, b) => a - b)
                      .map((n) => (
                        <Tag key={n} color="blue" style={{ margin: 0 }}>
                          第 {n} 题
                        </Tag>
                      ))
                  ) : (
                    <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>未指定题目</span>
                  )}
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>申请内容</div>
                <div
                  style={{
                    padding: '12px 14px',
                    background: '#f5faff',
                    border: '1px solid #d6e4ff',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'rgba(0,0,0,0.85)',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {currentReview.desc}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', margin: '8px 0 20px' }}>
                  申请时间：{currentReview.appliedAt}
                </div>

                {/* 考官回复 */}
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>考官回复</div>
                {currentReview.reply ? (
                  <>
                    <div
                      style={{
                        padding: '12px 14px',
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: 8,
                        fontSize: 13,
                        color: 'rgba(0,0,0,0.85)',
                        lineHeight: 1.8,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {currentReview.reply}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 8, textAlign: 'right' }}>
                      {currentReview.replyBy} · {currentReview.repliedAt}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>考官暂未回复</div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.85)', marginBottom: 6 }}>
                  <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>申请复核题目
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  value={reviewNos}
                  onChange={(v) => setReviewNos(v)}
                  placeholder="请选择需要复核的题目（可多选）"
                  style={{ width: '100%', marginBottom: 20 }}
                  maxTagCount="responsive"
                  options={reviewExam ? questionNosOf(reviewExam).map((n) => ({ label: `第 ${n} 题`, value: n })) : []}
                />
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.85)', marginBottom: 6 }}>
                  <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>复核说明
                </div>
                <Input.TextArea
                  rows={6}
                  placeholder="请填写成绩复核说明（如：对第 X 题判分有异议，认为标准答案理解有误…）"
                  value={reviewDesc}
                  onChange={(e) => setReviewDesc(e.target.value)}
                  maxLength={500}
                  showCount
                />
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* 考试须知弹窗：进入考试前必读，5 秒倒计时结束后方可确认进入考试 */}
      <Modal
        title="考试须知"
        open={!!noticeExam}
        onCancel={handleCancelNotice}
        maskClosable={false}
        closable={false}
        width={520}
        footer={[
          <Button key="cancel" onClick={handleCancelNotice}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            disabled={noticeLeft > 0}
            onClick={handleConfirmNotice}
          >
            {noticeLeft > 0 ? `我已阅读（${noticeLeft}s）` : '我已阅读，开始考试'}
          </Button>,
        ]}
      >
        {noticeExam && (
          <div>
            <div
              style={{
                padding: '10px 14px',
                background: '#f5faff',
                border: '1px solid #d6e4ff',
                borderRadius: 8,
                fontSize: 13,
                color: 'rgba(0,0,0,0.65)',
                marginBottom: 14,
              }}
            >
              考试名称：{noticeExam.name}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.85)', marginBottom: 8, fontWeight: 600 }}>
              请认真阅读以下考试须知，并在阅读完毕后确认进入考试：
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'rgba(0,0,0,0.85)', lineHeight: 2 }}>
              {EXAM_NOTICE.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </div>
        )}
      </Modal>

      {/* 在线试卷（全屏弹出） */}
      <ExamPaper open={!!paperExam} examName={paperExam?.name} onClose={() => setPaperExam(null)} />
    </div>
  )
}

export default ExamCenter
