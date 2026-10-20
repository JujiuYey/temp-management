import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Table, Drawer, Tag, Input, Empty, Button, InputNumber, Divider, message, Modal, Space, Select, Radio, Tabs } from 'antd'
import {
  SearchOutlined,
  FileTextOutlined,
  ProfileOutlined,
  EditOutlined,
  AuditOutlined,
  VideoCameraOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

// ===== 阅卷记录数据模型 =====
type MarkStatus = '已出分' | '阅卷中'   // 阅卷状态（已取消"待阅卷"）
type SignStatus = '未签到' | '已签到'   // 签到状态（实操考试专用：签到后方可点评）

// 阅卷人（考官）单题评分
interface ExaminerScore {
  name: string       // 考官姓名
  score: number      // 该考官给出的总分
  items?: number[]   // 各评分项得分（实操题，按 rubric 顺序）
}
const CURRENT_EXAMINER = '陈静'   // 当前登录考官（演示用）

// 实操题评分项（评分表）
interface RubricItem {
  item: string       // 评分项名称
  max: number        // 满分
  keyPoint?: string  // 评分要点
}

interface SubmitRecord {
  id: string
  candidateNo: string    // 考生编号
  candidate: string      // 考生
  jobNo: string          // 工号
  gender: '男' | '女'    // 性别
  department: string     // 科室
  examType?: '理论考试' | '实操考试' // 考试类型（对应试卷类型）；缺省视为理论考试
  signStatus?: SignStatus // 签到状态（实操考试专用；缺省视为未签到）
  signTime?: string      // 签到时间（YYYY-MM-DD HH:mm:ss，未签到为空）
  anonymous?: boolean    // 是否匿名（隐藏 姓名 / 工号，仅保留考生编号）
  paperName: string      // 试卷名称
  paperSets?: number     // 试卷套数（如 第1套/第2套 记为 2）；缺省按 2 处理
  submitTime: string     // 交卷时间（YYYY-MM-DD HH:mm:ss）
  durationSec: number    // 考试用时（秒）
  attempt: number        // 当前考试次数
  totalAttempts: number  // 总考试次数
  score: number          // 得分
  totalScore: number     // 总分
  correctCount: number   // 正确题数
  questionCount: number  // 总题数
  marked: boolean        // 是否已阅卷
  markStatus: MarkStatus // 阅卷状态：已出分 / 阅卷中
  markCount: number      // 已完成阅卷人数
  markTotal: number      // 需阅卷人数（如 3 人阅卷）
  reviewers?: string[]   // 分配的阅卷人（「我的阅卷」按当前考官过滤）
  questions: ExamQuestion[]  // 试卷详情（题目 + 考生作答 + 正确答案）—— 等同「当前考试次数」的快照
  attempts: AttemptSnapshot[] // 各次考试快照（用于抽屉内「考试次数」切换查看）
  // 多套试卷：每套独立的名称、题目与得分（第1套=理论卷：选择/判断/填空/简答；第2套=实操卷）
  sets?: { name: string; questions: ExamQuestion[]; score: number; correctCount: number; totalScore: number }[]
}

// 单次考试的作答快照：不同次数对应不同的作答与得分
interface AttemptSnapshot {
  attempt: number            // 第几次（1 起）
  submitTime: string         // 该次交卷时间
  durationSec: number        // 该次考试用时
  score: number              // 该次得分
  correctCount: number       // 该次正确题数
  questions: ExamQuestion[]  // 该次试卷详情
}

// 试卷题目（含考生作答与正确答案）
type QuestionType = 'single' | 'multiple' | 'judge' | 'fill' | 'short' | 'practice'

interface ExamQuestion {
  no: number
  type: QuestionType
  stem: string
  options: { key: string; text: string }[]
  candidateAnswer: string
  correctAnswer: string
  correct: boolean
  score: number
  examiners?: ExaminerScore[]  // 多名考官评分（仅填空题 / 简答题 / 实操题 手工阅卷有）
  rubric?: RubricItem[]        // 实操题评分表（评分项）
}

// 题型中文名
const TYPE_LABEL: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  fill: '填空题',
  short: '简答题',
  practice: '实操题',
}
const TYPE_ORDER: QuestionType[] = ['single', 'multiple', 'judge', 'fill', 'short', 'practice']
// 需要手工阅卷的题型：填空题 / 简答题 / 实操题
const MANUAL_TYPES: QuestionType[] = ['fill', 'short', 'practice']

// 以当前时间为基准生成交卷时间，保证演示数据始终为近期
const at = (dayOffset: number, time: string) =>
  `${dayjs().add(dayOffset, 'day').format('YYYY-MM-DD')} ${time}:00`

// ===== 所有人考试提交记录 mock 数据 =====
const MOCK_RECORDS: Omit<SubmitRecord, 'questions' | 'candidateNo' | 'attempts'>[] = [
  {
    // 虚拟记录：实操考试，待阅卷 → 可进入「阅评」抽屉逐项打分
    id: '13', candidate: '周子墨', jobNo: '100620', gender: '男', department: '急诊科',
    examType: '实操考试',
    paperName: '成人单人徒手心肺复苏操作考核', submitTime: at(0, '14:05'),
    durationSec: 1320, attempt: 1, totalAttempts: 1, score: 0, totalScore: 100,
    correctCount: 8, questionCount: 8, marked: false,
    markStatus: '阅卷中', markCount: 0, markTotal: 3,
    reviewers: ['张伟', '李娜', '陈静'],
    signStatus: '已签到', signTime: at(0, '13:48'),
  },
  {
    // 虚拟记录：实操考试，已签到 → 可点评
    id: '14', candidate: '林清和', jobNo: '100733', gender: '男', department: '麻醉科',
    examType: '实操考试',
    paperName: '成人单人徒手心肺复苏操作考核', submitTime: at(0, '15:10'),
    durationSec: 1080, attempt: 1, totalAttempts: 1, score: 0, totalScore: 100,
    correctCount: 7, questionCount: 8, marked: false,
    markStatus: '阅卷中', markCount: 0, markTotal: 3,
    reviewers: ['张伟', '李娜', '陈静'],
    signStatus: '已签到', signTime: at(0, '14:52'),
  },
  {
    // 虚拟记录：实操考试，未签到 → 不可点评
    id: '15', candidate: '何嘉宁', jobNo: '100804', gender: '女', department: '重症医学科',
    examType: '实操考试',
    paperName: '气管插管操作技能考核', submitTime: at(0, '16:20'),
    durationSec: 960, attempt: 1, totalAttempts: 1, score: 0, totalScore: 100,
    correctCount: 6, questionCount: 8, marked: false,
    markStatus: '阅卷中', markCount: 0, markTotal: 3,
    reviewers: ['张伟', '李娜', '陈静'],
    signStatus: '未签到',
  },
  {
    id: '1', candidate: '李明钊', jobNo: '100231', gender: '男', department: '信息科',
    paperName: '2026年第三季度医师三基理论考核', submitTime: at(-1, '10:25'),
    durationSec: 2730, attempt: 1, totalAttempts: 1, score: 92, totalScore: 100,
    correctCount: 46, questionCount: 50, marked: true,
    markStatus: '已出分', markCount: 3, markTotal: 3,
  },
  {
    id: '2', candidate: '朱虹', jobNo: '100188', gender: '女', department: '肝胆科门诊',
    paperName: '抗菌药物临床应用知识考试', submitTime: at(-1, '15:40'),
    durationSec: 1980, attempt: 1, totalAttempts: 1, score: 85, totalScore: 100,
    correctCount: 42, questionCount: 50, marked: true,
    markStatus: '已出分', markCount: 3, markTotal: 3,
  },
  {
    id: '3', candidate: '赵坤', jobNo: '100305', gender: '男', department: '信息科',
    paperName: '医疗核心制度应知应会考试', submitTime: at(-2, '09:12'),
    durationSec: 3240, attempt: 2, totalAttempts: 3, score: 78, totalScore: 100,
    correctCount: 39, questionCount: 50, marked: false,
    markStatus: '阅卷中', markCount: 0, markTotal: 3,
    reviewers: ['张伟', '李娜', '陈静'],
  },
  {
    id: '4', candidate: '杨艳', jobNo: '100412', gender: '女', department: '眼科',
    paperName: '住院医师规范化培训出科理论考核', submitTime: at(-2, '11:05'),
    durationSec: 4110, attempt: 1, totalAttempts: 1, score: 88, totalScore: 100,
    correctCount: 44, questionCount: 50, marked: true,
    markStatus: '已出分', markCount: 3, markTotal: 3,
  },
  {
    id: '5', candidate: '左乾涛', jobNo: '100198', gender: '男', department: '眼科',
    paperName: '病历书写规范专项考试', submitTime: at(-3, '16:30'),
    durationSec: 2520, attempt: 1, totalAttempts: 2, score: 95, totalScore: 100,
    correctCount: 48, questionCount: 50, marked: true,
    markStatus: '已出分', markCount: 3, markTotal: 3,
  },
  {
    id: '6', candidate: '蒋润润', jobNo: '100277', gender: '男', department: '肝胆科门诊',
    paperName: '抗菌药物临床应用知识考试', submitTime: at(-3, '14:18'),
    durationSec: 1860, attempt: 3, totalAttempts: 3, score: 60, totalScore: 100,
    correctCount: 30, questionCount: 50, marked: false,
    markStatus: '阅卷中', markCount: 1, markTotal: 3,
    reviewers: ['张伟', '王强', '陈静'],
  },
  {
    id: '7', candidate: '叶舒红', jobNo: '100364', gender: '女', department: '信息科',
    paperName: '医疗核心制度应知应会考试', submitTime: at(-4, '10:50'),
    durationSec: 3360, attempt: 1, totalAttempts: 1, score: 81, totalScore: 100,
    correctCount: 40, questionCount: 50, marked: false,
    markStatus: '阅卷中', markCount: 2, markTotal: 3,
    reviewers: ['李娜', '王强', '陈静'],
  },
  {
    id: '8', candidate: '杜焯群', jobNo: '100155', gender: '女', department: '胸外科',
    examType: '实操考试',
    paperName: '心肺复苏（CPR）操作技能考核', submitTime: at(-5, '13:42'),
    durationSec: 1200, attempt: 1, totalAttempts: 1, score: 90, totalScore: 100,
    correctCount: 18, questionCount: 20, marked: true,
    markStatus: '已出分', markCount: 3, markTotal: 3,
    signStatus: '已签到', signTime: at(-5, '13:15'),
  },
  {
    id: '9', candidate: '李根', jobNo: '100289', gender: '男', department: '胸外科',
    paperName: '2026年第三季度医师三基理论考核', submitTime: at(-5, '09:33'),
    durationSec: 2880, attempt: 2, totalAttempts: 2, score: 72, totalScore: 100,
    correctCount: 36, questionCount: 50, marked: false,
    markStatus: '阅卷中', markCount: 0, markTotal: 3,
    reviewers: ['张伟', '李娜', '王强'],
  },
  {
    id: '10', candidate: '杨富竣', jobNo: '100342', gender: '男', department: '胸外科',
    paperName: '住院医师规范化培训出科理论考核', submitTime: at(-6, '15:20'),
    durationSec: 3990, attempt: 1, totalAttempts: 1, score: 86, totalScore: 100,
    correctCount: 43, questionCount: 50, marked: true,
    markStatus: '已出分', markCount: 3, markTotal: 3,
  },
  {
    id: '11', candidate: '王思齐', jobNo: '100511', gender: '女', department: '急诊科',
    paperName: '突发公共卫生事件应急处置知识测验', submitTime: at(0, '08:15'),
    durationSec: 1740, attempt: 1, totalAttempts: 1, score: 93, totalScore: 100,
    correctCount: 47, questionCount: 50, marked: false,
    markStatus: '阅卷中', markCount: 1, markTotal: 3,
    reviewers: ['张伟', '李娜', '陈静'],
  },
  {
    id: '12', candidate: '陈嘉怡', jobNo: '100478', gender: '女', department: '内科',
    paperName: '病历书写规范专项考试', submitTime: at(0, '17:48'),
    durationSec: 2310, attempt: 1, totalAttempts: 1, score: 89, totalScore: 100,
    correctCount: 45, questionCount: 50, marked: false,
    markStatus: '阅卷中', markCount: 0, markTotal: 3,
    reviewers: ['张伟', '李娜', '陈静'],
  },
  {
    // 虚拟记录：已出分且低于及格线（60%）→ 演示「不合格」标签
    id: '16', candidate: '孙博文', jobNo: '100915', gender: '男', department: '骨科',
    paperName: '医疗核心制度应知应会考试', submitTime: at(-6, '10:20'),
    durationSec: 2460, attempt: 1, totalAttempts: 1, score: 52, totalScore: 100,
    correctCount: 26, questionCount: 50, marked: true,
    markStatus: '已出分', markCount: 3, markTotal: 3,
  },
]

// 通用题干与选项文本（演示用）
const OPTION_TEXTS = [
  '符合相关诊疗规范与制度要求',
  '需经上级医师审核后方可执行',
  '应在规定时限内完成记录与上报',
  '不属于本科室职责范围，应转介处理',
]
const LETTERS = ['A', 'B', 'C', 'D']

// 填空题 / 简答题：参考答案与考生作答文本（演示用）
const FILL_REF_ANSWERS = [
  '三级查房制度',
  '首诊负责制度',
  '24 小时',
  '危急值报告制度',
]
const FILL_WRONG_ANSWERS = [
  '二级查房制度',
  '主诊医师负责制',
  '12 小时',
  '检验结果报告制度',
]
const SHORT_REF_ANSWERS = [
  '答：1）严格执行查对制度，至少使用两种身份识别方式核对患者信息；2）操作前告知目的、方法与配合要点，取得知情同意；3）过程中密切观察病情变化，发现异常立即上报并配合处理；4）操作后准确记录并在规定时限内完成文书书写。',
  '答：1）评估患者生命体征与周围环境安全；2）保持呼吸道通畅，按操作规范逐项完成处置；3）处置后监测症状变化并做好交接；4）向患者及家属做好解释沟通，安抚情绪。',
]
const SHORT_CAND_ANSWERS = [
  '答：先核对患者身份，再告知操作目的并取得同意，操作中注意观察病情，完成后及时书写记录。',
  '答：先评估环境和患者生命体征，保持气道通畅后按规范操作，最后与下一班做好交接并安抚患者。',
]

// 依据试卷信息与对错数量，生成一份"试卷详情"（含多种题型）
const buildPaper = (
  paperName: string,
  qCount: number,
  correctCount: number,
  totalScore: number,
): ExamQuestion[] => {
  const perScore = Math.round((totalScore / qCount) * 10) / 10
  const isPractical = /操作|技能|CPR|实操/.test(paperName)   // 实操考核类试卷
  return Array.from({ length: qCount }, (_, i) => {
    const isCorrect = i < correctCount
    // 实操考核类试卷：全部为实操题
    if (isPractical) {
      // 评分表：四项评分项，满分按比例分配，末项吸收四舍五入误差确保合计=perScore
      const parts = [0.2, 0.5, 0.2, 0.1]
      const itemMaxes = parts.map((p) => +(perScore * p).toFixed(1))
      const sumOthers = +(itemMaxes.slice(0, -1).reduce((s, v) => s + v, 0)).toFixed(1)
      itemMaxes[itemMaxes.length - 1] = +(perScore - sumOthers).toFixed(1)
      const rubric: RubricItem[] = [
        { item: '操作前准备与评估', max: itemMaxes[0], keyPoint: '核对患者信息、评估环境与适应证' },
        { item: '操作流程规范性', max: itemMaxes[1], keyPoint: '步骤完整、手法正确、顺序无误' },
        { item: '无菌观念与安全意识', max: itemMaxes[2], keyPoint: '无菌操作、职业防护到位' },
        { item: '沟通表达与人文关怀', max: itemMaxes[3], keyPoint: '告知到位、安抚患者、表达清晰' },
      ]
      return {
        no: i + 1,
        type: 'practice' as QuestionType,
        stem: `实操项目 ${i + 1}：${paperName.replace(/（.*?）/g, '').trim()} 操作考核要点`,
        options: [] as { key: string; text: string }[],
        candidateAnswer: '（现场操作，详见评分表）',
        correctAnswer: '（按评分标准逐项给分）',
        correct: isCorrect,
        score: perScore,
        rubric,
      }
    }
    // 题型分段：单选 1-30、多选 31-38、判断 39-44、填空 45-48、简答 49+
    let type: QuestionType
    let options: { key: string; text: string }[]
    let correctLetter = ''
    if (i < 30) {
      type = 'single'
      options = LETTERS.map((k, idx) => ({ key: k, text: OPTION_TEXTS[idx % OPTION_TEXTS.length] }))
      correctLetter = LETTERS[i % 4]
    } else if (i < 38) {
      type = 'multiple'
      options = LETTERS.map((k, idx) => ({ key: k, text: OPTION_TEXTS[idx % OPTION_TEXTS.length] }))
      correctLetter = LETTERS[i % 4]
    } else if (i < 44) {
      type = 'judge'
      options = [
        { key: 'A', text: '正确' },
        { key: 'B', text: '错误' },
      ]
      correctLetter = i % 2 === 0 ? 'A' : 'B'
    } else if (i < 48) {
      type = 'fill'
      options = []
      correctLetter = ''
    } else {
      type = 'short'
      options = []
      correctLetter = ''
    }
    const candidateLetter =
      isCorrect
        ? correctLetter
        : correctLetter === 'A'
          ? 'B'
          : correctLetter === 'B'
            ? 'A'
            : LETTERS[(i + 1) % 4]
    const stem =
      type === 'fill'
        ? `填空题：请根据《${paperName}》相关要求，在横线处填写正确答案。`
        : type === 'short'
          ? `简答题：请简述《${paperName}》中的核心要点。`
          : `关于《${paperName}》的相关要求，下列说法正确的是：`
    const hasOptions = options.length > 0
    const fillIdx = i - 44    // 填空题序（i=44..47）
    const shortIdx = i - 48   // 简答题序（i=48..49）
    return {
      no: i + 1,
      type,
      stem,
      options,
      candidateAnswer: hasOptions
        ? candidateLetter
        : type === 'fill'
          ? (isCorrect ? FILL_REF_ANSWERS[fillIdx] : FILL_WRONG_ANSWERS[fillIdx % FILL_WRONG_ANSWERS.length])
          : type === 'short'
            ? (isCorrect ? SHORT_CAND_ANSWERS[shortIdx % SHORT_CAND_ANSWERS.length] : '（未作答）')
            : '（略）',
      correctAnswer: hasOptions
        ? correctLetter
        : type === 'fill'
          ? FILL_REF_ANSWERS[fillIdx % FILL_REF_ANSWERS.length]
          : type === 'short'
            ? SHORT_REF_ANSWERS[shortIdx % SHORT_REF_ANSWERS.length]
            : '（略）',
      correct: isCorrect,
      score: perScore,
    }
  })
}

// 为手工阅卷题（填空/简答/实操）生成多名考官的初始评分（演示用）
const seedExaminers = (q: ExamQuestion): ExaminerScore[] => {
  if (!MANUAL_TYPES.includes(q.type)) return []
  const names = ['张伟', '李娜', '王强']
  const n = q.type === 'practice' ? 3 : 2 + (q.no % 2) // 实操 3 人，填空/简答 2-3 人
  // 实操题：按评分表每项给分，合计为该考官总分
  if (q.type === 'practice' && q.rubric) {
    return names.slice(0, n).map((name, idx) => {
      const items = q.rubric!.map((r) => +(r.max * (0.7 + ((idx + q.no) % 3) * 0.1)).toFixed(1))
      const score = +(items.reduce((s, v) => s + v, 0)).toFixed(1)
      return { name, score, items }
    })
  }
  // 填空 / 简答题：单一总分
  const base = q.score
  return names.slice(0, n).map((name, idx) => {
    const offset = (idx - 1) * 0.5 + ((q.no + idx) % 3 === 0 ? 0.3 : -0.2)
    const v = Math.min(base, Math.max(0, +(base + offset).toFixed(1)))
    return { name, score: v }
  })
}

// 需匿名处理的考试提交记录（隐藏 姓名 / 工号，仅保留 考生编号）
const ANON_IDS = new Set(['3', '6', '9', '11', '12'])

/**
 * 生成某条记录「各次考试」的作答快照（演示数据）
 * - 第 attempt 次 = 记录当前的真实作答与得分
 * - 更早的次数 = 按确定性规则生成差异化作答（得分更低、用时更短/更长、交卷时间更早）
 */
const buildAttempts = (
  r: Omit<SubmitRecord, 'questions' | 'candidateNo' | 'attempts'>,
  current: ExamQuestion[],
): AttemptSnapshot[] => {
  const done = Math.max(1, Math.min(r.attempt, r.totalAttempts)) // 已完成的次数（1..done）
  return Array.from({ length: done }, (_, i) => {
    const attempt = i + 1
    // 当前次数：直接沿用真实数据
    if (attempt === r.attempt) {
      return {
        attempt,
        submitTime: r.submitTime,
        durationSec: r.durationSec,
        score: r.score,
        correctCount: r.correctCount,
        questions: current,
      }
    }
    // 历史次数：越早的作答正确率越低、得分越低
    const back = r.attempt - attempt
    const correctCount = Math.max(0, Math.min(r.questionCount, r.correctCount - back * 3 - (i % 2)))
    const score = Math.max(0, Math.round(r.score - back * 4 - (i % 3)))
    const durationSec = Math.max(600, r.durationSec + back * 120 + (i % 2) * 60)
    const questions = buildPaper(r.paperName, r.questionCount, correctCount, r.totalScore).map((q) => ({
      ...q,
      examiners: seedExaminers(q),
    }))
    const submitTime = dayjs(r.submitTime)
      .subtract(back * 5, 'day')
      .format('YYYY-MM-DD HH:mm:ss')
    return { attempt, submitTime, durationSec, score, correctCount, questions }
  })
}

// 为每条提交记录挂载试卷详情
const RECORDS_WITH_PAPER: SubmitRecord[] = MOCK_RECORDS.map((r) => {
  const questions = buildPaper(r.paperName, r.questionCount, r.correctCount, r.totalScore)
  const all = questions.map((q) => ({ ...q, examiners: seedExaminers(q) }))
  // 多套试卷：第 1 套 = 主卷（理论卷：选择/判断/填空/简答）；第 2 套 = 实操卷（仅实操题）
  const paperSets = r.paperSets ?? 2
  const isPracticalPaper = /操作|技能|CPR|实操/.test(r.paperName)
  const practiceName = `${r.paperName.replace(/(理论)?(考核|考试|测验)$/, '')}实操技能考核`
  const buildPracticeSet = (): { name: string; questions: ExamQuestion[]; score: number; correctCount: number; totalScore: number } => {
    const qCount = 6
    const perScore = 10
    const correct = Math.max(0, Math.min(qCount, Math.round((r.score / r.totalScore) * qCount)))
    const questions = buildPaper(practiceName, qCount, correct, qCount * perScore).map((q) => ({
      ...q,
      examiners: seedExaminers(q),
    }))
    return { name: practiceName, questions, score: correct * perScore, correctCount: correct, totalScore: qCount * perScore }
  }
  const sets: { name: string; questions: ExamQuestion[]; score: number; correctCount: number; totalScore: number }[] = [
    { name: r.paperName, questions: all, score: r.score, correctCount: r.correctCount, totalScore: r.totalScore },
  ]
  for (let k = 1; k < paperSets; k++) {
    // 理论考试的第 2 套固定为实操卷；实操类试卷保持差异化派生卷
    if (!isPracticalPaper && k === 1) {
      sets.push(buildPracticeSet())
      continue
    }
    const variantCorrect = Math.max(0, Math.min(r.questionCount, r.correctCount + ((k * 3) % 7) - 3))
    const variantScore = Math.max(0, Math.round(r.score + ((k * 5) % 11) - 5))
    const variantQuestions = buildPaper(r.paperName, r.questionCount, variantCorrect, r.totalScore).map((q) => ({
      ...q,
      examiners: seedExaminers(q),
    }))
    sets.push({ name: r.paperName, questions: variantQuestions, score: variantScore, correctCount: variantCorrect, totalScore: r.totalScore })
  }
  return {
    ...r,
    candidateNo: 'K' + String(Number(r.id)).padStart(5, '0'),
    anonymous: ANON_IDS.has(r.id),
    paperSets,
    questions: all,
    sets,
    attempts: buildAttempts(r, all),
  }
})


// 阅卷状态标签配色
const MARK_STATUS_COLOR: Record<MarkStatus, string> = { 已出分: 'green', 阅卷中: 'blue' }
// 签到状态标签配色（实操考试）
const SIGN_STATUS_COLOR: Record<SignStatus, string> = { 未签到: 'default', 已签到: 'green' }
// 签到状态读取：未标注一律视为「未签到」（实操考试须签到后方可点评）
const signStatusOf = (r: SubmitRecord): SignStatus => r.signStatus ?? '未签到'
// 是否合格：按总分 60% 计及格线（满分 100 即 60 分）；未出分（score<=0）视为待定
const PASS_RATIO = 0.6
const isPassed = (r: SubmitRecord) => r.score > 0 && r.score >= r.totalScore * PASS_RATIO


// 实操评分表单元格样式
const RUBRIC_CELL: React.CSSProperties = { padding: '6px 8px', border: '1px solid #e8e8e8', fontSize: 13, verticalAlign: 'top' }

// 抽屉三种模式：试卷（只看得分）/ 详情（全部题型 + 各考官评分）/ 阅评（仅手工阅卷题）
type DrawerMode = 'paper' | 'detail' | 'grade'
const DRAWER_MODE_LABEL: Record<DrawerMode, string> = { paper: '试卷', detail: '试卷', grade: '阅评' }

const formatDuration = (sec: number) => {
  if (sec < 60) return `${sec} 秒`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return s === 0 ? `${m} 分钟` : `${m} 分 ${s} 秒`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm === 0 ? `${h} 小时` : `${h} 小时 ${mm} 分`
}

/**
 * 考生答卷 / 我的阅卷
 * scope = 'all'  考生答卷：全部提交记录，操作 = 试卷 / 评分
 * scope = 'mine' 我的阅卷：仅分配给当前考官、且尚未出分的记录，操作 = 阅评
 */
const MarkingHall: React.FC<{ scope?: 'all' | 'mine'; examName?: string }> = ({ scope = 'all', examName }) => {
  const isMine = scope === 'mine'
  const pageTitle = isMine ? '我的阅卷' : '考生答卷'
  /**
   * 是否显示考生身份（姓名 / 工号）：
   * 匿名阅卷只在「我的阅卷」阅评场景生效；成绩单是查看结果，一律显示真实信息。
   */
  const showIdentity = (r: SubmitRecord) => !isMine || !r.anonymous
  // 我的阅卷：左上角按考试类型切换（理论考试 / 实操考试）
  const [examTypeTab, setExamTypeTab] = useState<'理论考试' | '实操考试'>('理论考试')
  const isPracticeTab = examTypeTab === '实操考试'
  // 记录归属的考试类型（未标注的一律视为理论考试）
  const examTypeOf = (r: SubmitRecord) => r.examType ?? '理论考试'
  const [keyword, setKeyword] = useState('')
  const [paperFilter, setPaperFilter] = useState<string>('all')   // 试卷名称筛选
  const [statusFilter, setStatusFilter] = useState<string>('all') // 阅卷状态筛选：all / 阅卷中 / 已出分
  const [drawer, setDrawer] = useState<{ record: SubmitRecord; mode: DrawerMode; attempt: number; setIndex?: number } | null>(null)
  const [setIndex, setSetIndex] = useState(0) // 当前查看的试卷套（第1套 / 第2套 ……）
  const [scoreInputs, setScoreInputs] = useState<Record<number, number | null>>({})
  const [rubricInputs, setRubricInputs] = useState<Record<number, (number | null)[]>>({})
  const [allRecords, setAllRecords] = useState<SubmitRecord[]>(RECORDS_WITH_PAPER)

  // ===== 实操题现场录像（阅评：开启录像 / 查看回放）=====
  const DRAWER_WIDTH = 1440 // 阅卷抽屉宽度，用于计算录像框停靠位置
  const [recordingKey, setRecordingKey] = useState<string | null>(null) // 正在录制的题目 key
  const [recording, setRecording] = useState(false) // 是否处于录制中（显示实时录像框）
  const [recordingTime, setRecordingTime] = useState(0) // 录制计时（秒）
  const [videoSize, setVideoSize] = useState<'normal' | 'large'>('normal') // 录像框尺寸：普通 / 放大
  const [videoBlobs, setVideoBlobs] = useState<Record<string, string>>({}) // 题目 key -> 录像地址（blob: 真实录像 / '__sim__' 模拟）
  const [replayKey, setReplayKey] = useState<string | null>(null) // 正在回放的题目 key
  const liveVideoRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 录像 key：考生记录 + 考试次数 + 题号
  const videoKeyOf = (rec: SubmitRecord, attempt: number, no: number) => `${rec.id}|${attempt}|${no}`

  // 录制计时
  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [recording])

  // 将实时摄像头流挂到 video 元素
  useEffect(() => {
    if (recording && streamRef.current && liveVideoRef.current) {
      liveVideoRef.current.srcObject = streamRef.current
    }
  }, [recording])

  // 开启录像（实操题）：优先调用摄像头，失败则模拟演示
  const startRecording = async (key: string) => {
    setRecordingKey(key)
    setRecordingTime(0)
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        streamRef.current = stream
        const recorder = new MediaRecorder(stream)
        const chunks: Blob[] = []
        recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data) }
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          const url = URL.createObjectURL(blob)
          setVideoBlobs((p) => ({ ...p, [key]: url }))
          stream.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        recorder.start()
        recorderRef.current = recorder
        setRecording(true)
      } else {
        throw new Error('no-media')
      }
    } catch {
      // 无摄像头权限或环境不支持：标记为模拟录像，回放时展示演示画面
      setVideoBlobs((p) => ({ ...p, [key]: '__sim__' }))
      setRecording(true)
    }
  }

  // 完成录制：停止录制并保存（真实录像在 onstop 中写入；模拟录像已写入）
  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      recorderRef.current = null
    }
    setRecording(false)
  }

  // 关闭抽屉时释放摄像头与录制
  const closeMarkingDrawer = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop() } catch { /* noop */ }
      recorderRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setRecording(false)
    setRecordingKey(null)
    setReplayKey(null)
    setDrawer(null)
  }

  // 格式化录制计时
  const formatRecTime = (s: number) => {
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  // 录像框停靠在抽屉左下角（抽屉宽 DRAWER_WIDTH，靠右放置）
  const videoBoxLeft = Math.max(16, (typeof window !== 'undefined' ? window.innerWidth : 1600) - DRAWER_WIDTH + 16)

  // 试卷详情：题号 -> DOM 节点，用于答题卡点击跳转
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const handleJump = (no: number) => {
    questionRefs.current[no]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openDrawer = (r: SubmitRecord, mode: DrawerMode) => {
    setScoreInputs({})
    setRubricInputs({})
    setSetIndex(0)
    // 默认展示「当前考试次数」，可在抽屉内切换到其它历史次数
    setDrawer({ record: r, mode, attempt: Math.max(1, Math.min(r.attempt, r.totalAttempts)), setIndex: 0 })
  }
  // 成绩单：合并「试卷」与「评分」，统一点击「试卷」即展示考生试卷（选择答案 / 正确答案 / 评分表 等）
  const openPaper = (r: SubmitRecord) => openDrawer(r, 'detail')    // 试卷（含评分表）
  const openDetail = (r: SubmitRecord) => openDrawer(r, 'detail')   // 详情：全部题型 + 各考官评分
  const openGrade = (r: SubmitRecord) => openDrawer(r, 'grade')     // 阅评：仅手工阅卷题 + 评分录入

  // 写入当前考官对某题的评分（存在则覆盖，否则追加），并同步回列表数据
  const applyExaminer = (no: number, newScore: ExaminerScore) => {
    setDrawer((prev) => {
      if (!prev) return prev
      const record = prev.record
      // 仅更新当前查看的那一次考试快照
      const attempts = record.attempts.map((a) => {
        if (a.attempt !== prev.attempt) return a
        const questions = a.questions.map((q) => {
          if (q.no !== no) return q
          const examiners = [...(q.examiners ?? [])]
          const idx = examiners.findIndex((e) => e.name === newScore.name)
          if (idx >= 0) examiners[idx] = newScore
          else examiners.push(newScore)
          return { ...q, examiners }
        })
        return { ...a, questions }
      })
      const current = attempts.find((a) => a.attempt === prev.attempt)
      const newRecord = { ...record, attempts, questions: current ? current.questions : record.questions }
      setAllRecords((list) => list.map((r) => (r.id === newRecord.id ? newRecord : r)))
      return { ...prev, record: newRecord }
    })
  }

  // 统一保存当前考官本次录入的所有评分（实操题按评分表逐项求和，填空/简答为单分）
  const saveAll = (list: ExamQuestion[]) => {
    const results: { no: number; item: ExaminerScore }[] = []
    const invalid: string[] = []
    list.forEach((q) => {
      if (q.type === 'practice' && q.rubric) {
        const items = rubricInputs[q.no]
        if (!items || !items.some((v) => v != null)) return // 未录入则跳过
        if (items.length !== q.rubric.length || items.some((v) => v == null)) {
          invalid.push(`第 ${q.no} 题（评分项未填完）`); return
        }
        if (items.some((v, idx) => (v as number) > q.rubric![idx].max)) {
          invalid.push(`第 ${q.no} 题（单项超过满分）`); return
        }
        const total = +(items.reduce<number>((s, v) => s + (v as number), 0)).toFixed(1)
        results.push({ no: q.no, item: { name: CURRENT_EXAMINER, score: total, items: [...items] as number[] } })
        return
      }
      if (q.type === 'fill' || q.type === 'short') {
        const val = scoreInputs[q.no]
        if (val == null) return // 未录入则跳过
        if (val > q.score) { invalid.push(`第 ${q.no} 题（超过本题满分）`); return }
        results.push({ no: q.no, item: { name: CURRENT_EXAMINER, score: val } })
      }
    })
    if (invalid.length) { message.warning(`请检查：${invalid.join('、')}`); return }
    if (!results.length) { message.warning('请先录入至少一道题的评分'); return }
    results.forEach((r) => applyExaminer(r.no, r.item))
    setScoreInputs({})
    setRubricInputs({})
    message.success(`已保存 ${results.length} 道题的评分`)
  }

  // 右上角「试卷名称」下拉的可选项（按当前数据去重）
  const paperOptions = useMemo(() => {
    const set = new Set(allRecords.map((r) => r.paperName))
    return Array.from(set).map((name) => ({ value: name, label: name }))
  }, [allRecords])

  const records = useMemo(() => {
    // 我的阅卷：只取分配给我的、且尚未出分的记录
    const base = isMine
      ? allRecords.filter(
          (r) => r.markStatus !== '已出分' && (r.reviewers ?? []).includes(CURRENT_EXAMINER),
        )
      : allRecords
    return base.filter((r) => {
      // 我的阅卷：按左上角所选考试类型过滤
      if (isMine && examTypeOf(r) !== examTypeTab) return false
      const matchKeyword = !keyword || r.candidate.includes(keyword) || r.paperName.includes(keyword)
      const matchPaper = paperFilter === 'all' || r.paperName === paperFilter
      const matchStatus = statusFilter === 'all' || r.markStatus === statusFilter
      return matchKeyword && matchPaper && matchStatus
    })
  }, [keyword, paperFilter, statusFilter, allRecords, isMine, examTypeTab])

  const columns: ColumnsType<SubmitRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 64,
      align: 'center',
      render: (_: unknown, __: unknown, idx: number) => idx + 1,
    },
    { title: '考生编号', dataIndex: 'candidateNo', key: 'candidateNo', width: 110 },
    {
      title: '工号',
      dataIndex: 'jobNo',
      key: 'jobNo',
      width: 100,
      render: (_: unknown, r: SubmitRecord) => (showIdentity(r) ? r.jobNo : '****'),
    },
    {
      title: '考生',
      dataIndex: 'candidate',
      key: 'candidate',
      width: 100,
      render: (_: unknown, r: SubmitRecord) => (showIdentity(r) ? r.candidate : '****'),
    },
    { title: '试卷名称', dataIndex: 'paperName', key: 'paperName', ellipsis: true },
    // 我的阅卷 - 实操考试：考试名称后展示 签到状态 / 签到时间（仅已签到可点评）
    ...(isMine && isPracticeTab
      ? ([
          {
            title: '签到状态',
            key: 'signStatus',
            width: 100,
            align: 'center',
            render: (_: unknown, r: SubmitRecord) => {
              const st = signStatusOf(r)
              return <Tag color={SIGN_STATUS_COLOR[st]}>{st}</Tag>
            },
          },
          {
            title: '签到时间',
            key: 'signTime',
            width: 170,
            render: (_: unknown, r: SubmitRecord) =>
              r.signTime ?? <span style={{ color: '#bfbfbf' }}>—</span>,
          },
        ] as ColumnsType<SubmitRecord>)
      : []),
    {
      title: '阅卷状态',
      dataIndex: 'markStatus',
      key: 'markStatus',
      width: 100,
      align: 'center',
      render: (v: MarkStatus) => <Tag color={MARK_STATUS_COLOR[v]}>{v}</Tag>,
    },
    // 试卷套数：仅「考生答卷（成绩单）」展示
    ...(isMine
      ? []
      : ([
          {
            title: '试卷',
            key: 'paperSets',
            width: 90,
            align: 'center',
            render: (_: unknown, r: SubmitRecord) => `${r.paperSets ?? 2} 套`,
          },
        ] as ColumnsType<SubmitRecord>)),
    // 交卷时间：仅「我的阅卷」展示（实操考试显示「点评时间」）；成绩单按需求移除
    ...(isMine
      ? ([
          {
            title: isMine && isPracticeTab ? '点评时间' : '交卷时间',
            dataIndex: 'submitTime',
            key: 'submitTime',
            width: 170,
          },
        ] as ColumnsType<SubmitRecord>)
      : []),
    // 累计用时 / 考试次数 / 最终成绩 / 是否合格：仅「考生答卷」展示；「我的阅卷」按需求移除
    ...(isMine
      ? []
      : ([
          {
            title: '累计用时',
            key: 'durationSec',
            width: 120,
            render: (_: unknown, r: SubmitRecord) => formatDuration(r.durationSec),
          },
          {
            title: '考试次数',
            key: 'attempt',
            width: 90,
            align: 'center',
            // 仅显示已考次数，不展示总次数
            render: (_: unknown, r: SubmitRecord) => `${r.attempt} 次`,
          },
          {
            title: '最终成绩',
            key: 'score',
            width: 110,
            align: 'center',
            render: (_: unknown, r: SubmitRecord) =>
              r.score > 0 ? (
                <span style={{ color: isPassed(r) ? '#389e0d' : '#cf1322', fontWeight: 600 }}>
                  {r.score}
                  <span style={{ color: '#999', fontWeight: 400, fontSize: 12 }}> / {r.totalScore}</span>
                </span>
              ) : (
                <span style={{ color: '#8c8c8c' }}>待出分</span>
              ),
          },
          {
            title: '是否合格',
            key: 'passed',
            width: 100,
            align: 'center',
            render: (_: unknown, r: SubmitRecord) =>
              r.score > 0 ? (
                <Tag color={isPassed(r) ? 'green' : 'red'}>{isPassed(r) ? '合格' : '不合格'}</Tag>
              ) : (
                <span style={{ color: '#8c8c8c' }}>—</span>
              ),
          },
        ] as ColumnsType<SubmitRecord>)),
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, r: SubmitRecord) => {
        const graded = r.markStatus === '已出分'
        // 我的阅卷：理论考试 = 阅卷；实操考试 = 点评
        if (isMine) {
          const actionText = isPracticeTab ? '点评' : '阅卷'
          // 实操考试：考生未签到不可点评（已出分同样不可操作）
          const signed = !isPracticeTab || signStatusOf(r) === '已签到'
          const disabled = graded || !signed
          return (
            <a
              style={disabled ? { color: '#bbb', cursor: 'not-allowed' } : { color: '#1677ff' }}
              onClick={() => { if (!disabled) openGrade(r) }}
              title={
                graded
                  ? '该记录已出分，不可再操作'
                  : !signed
                    ? '考生尚未签到，暂不可点评'
                    : isPracticeTab
                      ? '查看实操录像并逐项点评打分'
                      : '对填空 / 简答题进行打分'
              }
            >
              <EditOutlined style={{ marginRight: 4 }} />
              {actionText}
            </a>
          )
        }
        return (
          <a onClick={() => openPaper(r)} title="查看考生试卷（含选择答案、正确答案、评分表等）">
            <FileTextOutlined style={{ marginRight: 4 }} />
            试卷
          </a>
        )
      },
    },
  ]

  // 当前查看的那一次考试快照（默认 = 当前考试次数）
  const viewSnap = drawer
    ? drawer.record.attempts.find((a) => a.attempt === drawer.attempt) ??
      drawer.record.attempts[drawer.record.attempts.length - 1]
    : null
  // 视图记录：以当前次数快照覆盖卷面/得分相关字段
  const rawView =
    drawer && viewSnap ? { ...drawer.record, ...viewSnap } : null
  // 多套试卷：第 1 套沿用当前次数快照；其余套切换为对应套的题目与得分
  const setList = rawView?.sets ?? []
  const view = rawView
    ? setList.length > 1 && (drawer?.setIndex ?? 0) > 0
      ? {
          ...rawView,
          questions: setList[drawer!.setIndex!].questions,
          score: setList[drawer!.setIndex!].score,
          correctCount: setList[drawer!.setIndex!].correctCount,
          totalScore: setList[drawer!.setIndex!].totalScore,
        }
      : rawView
    : null

  // 阅评模式：仅展示需手工阅卷的题型（填空 / 简答 / 实操），客观题由系统自动判分不再列出
  const listQuestions = view
    ? drawer!.mode === 'grade'
      ? view.questions.filter((q) => MANUAL_TYPES.includes(q.type))
      : view.questions
    : []
  // 当前考官已评分的题目数（阅评模式图例用）
  const gradedCount = listQuestions.filter((q) =>
    (q.examiners ?? []).some((e) => e.name === CURRENT_EXAMINER),
  ).length
  // 本次已录入（待保存）的题目数：实操题填了任一评分项、填空/简答填了得分
  const pendingCount = listQuestions.filter((q) => {
    if (q.type === 'practice') return (rubricInputs[q.no] ?? []).some((v) => v != null)
    if (q.type === 'fill' || q.type === 'short') return scoreInputs[q.no] != null
    return false
  }).length

  // ===== 导出成绩（按当前筛选条件导出；BOM 保证 Excel 打开中文不乱码）=====
  const handleExportScore = () => {
    if (!records.length) {
      message.warning('当前无数据可导出')
      return
    }
    const header = isMine
      ? ['序号', '考生编号', '工号', '考生', '试卷名称', '阅卷状态', '交卷时间']
      : ['序号', '考生编号', '工号', '考生', '试卷名称', '阅卷状态', '试卷', '累计用时', '考试次数', '最终成绩', '是否合格']
    const cell = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
    const rows = records.map((r, i) => {
      const base = [
        i + 1,
        r.candidateNo,
        showIdentity(r) ? r.jobNo : '****',
        showIdentity(r) ? r.candidate : '****',
        r.paperName,
        r.markStatus,
      ]
      if (isMine) return [...base, r.submitTime]
      return [
        ...base,
        `${r.paperSets ?? 2} 套`,
        formatDuration(r.durationSec),
        `${r.attempt} 次`,
        r.score > 0 ? `${r.score} / ${r.totalScore}` : '待出分',
        r.score > 0 ? (isPassed(r) ? '合格' : '不合格') : '—',
      ]
    })
    const csv = '\ufeff' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const safeName = (examName ?? '').replace(/[\\/:*?"<>|]/g, '_')
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeName ? `${safeName}-` : ''}成绩单.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success(`已导出 ${records.length} 条成绩`)
  }

  return (
    <div>
      {/* 页面标题 + 搜索 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              width: 4,
              height: 18,
              background: '#eb2f96',
              borderRadius: 2,
              marginRight: 8,
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>{pageTitle}</span>
          {/* 我的阅卷：左上角考试类型切换（理论考试 / 实操考试） */}
          {isMine && (
            <Radio.Group
              value={examTypeTab}
              onChange={(e) => setExamTypeTab(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
              style={{ marginLeft: 16 }}
              options={[
                { label: '理论考试', value: '理论考试' },
                { label: '实操考试', value: '实操考试' },
              ]}
            />
          )}
        </div>
        <Space size={12} wrap>
          {!isMine && (
            <Button icon={<DownloadOutlined />} onClick={handleExportScore}>
              导出成绩
            </Button>
          )}
          <Select
            allowClear
            placeholder="试卷名称"
            style={{ width: 200 }}
            value={paperFilter === 'all' ? undefined : paperFilter}
            onChange={(v) => setPaperFilter(v ?? 'all')}
            options={paperOptions}
            showSearch
            optionFilterProp="label"
          />
          <Select
            value={statusFilter}
            style={{ width: 140 }}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { value: 'all', label: '全部状态' },
              { value: '阅卷中', label: '阅卷中' },
              { value: '已出分', label: '已出分' },
            ]}
          />
          <Input
            placeholder="考生 / 试卷名称"
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            style={{ width: 220 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
        </Space>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
        <Table<SubmitRecord>
          columns={columns}
          dataSource={records}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条`,
            position: ['bottomLeft'],
          }}
          size="middle"
          locale={{ emptyText: <Empty description={isMine ? '暂无分配给我的阅卷任务' : '暂无提交记录'} /> }}
        />
      </div>

      {/* 阅卷详情 / 阅卷评分 抽屉 */}
      <Drawer
        title={
          drawer
            ? `${DRAWER_MODE_LABEL[drawer.mode]} - ${showIdentity(drawer.record) ? drawer.record.candidate : '****'}`
            : ''
        }
        placement="right"
        width={1440}
        open={!!drawer}
        onClose={closeMarkingDrawer}
        footer={
          drawer && drawer.mode === 'grade' ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                本次已录入 {pendingCount} 道题，共 {gradedCount} 题已评分
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={closeMarkingDrawer}>取消</Button>
                <Button type="primary" onClick={() => saveAll(listQuestions)}>
                  保存
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {drawer && view && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* 左侧答题卡 */}
            <aside
              style={{
                width: 188,
                flexShrink: 0,
                position: 'sticky',
                top: 0,
                alignSelf: 'flex-start',
                borderRight: '1px solid #f0f0f0',
                paddingRight: 14,
              }}
            >
              {(drawer.mode === 'paper' || drawer.mode === 'detail') && (
                <div style={{ marginBottom: 12, padding: '8px 10px', background: '#f5faff', border: '1px solid #d6e4ff', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>考生编号</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1677ff', letterSpacing: 1, marginTop: 2 }}>
                    {view.candidateNo}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>答题卡</div>
              <div style={{ fontSize: 12, color: '#8c8c8c', margin: '4px 0 12px', lineHeight: 1.5 }}>
                {view.paperName}
              </div>
              <div>
                {(drawer.mode === 'grade' ? MANUAL_TYPES : TYPE_ORDER).map((t) => {
                  const list = view.questions.filter((q) => q.type === t)
                  if (list.length === 0) return null
                  // 阅评模式下，实操题以「站点」呈现（OSCE 多站点考核）
                  const isStationGroup = drawer.mode === 'grade' && t === 'practice'
                  return (
                    <div key={t} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: '#595959', marginBottom: 6 }}>
                        {isStationGroup ? `站点（${list.length}）` : `${TYPE_LABEL[t]}（${list.length}）`}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                        {list.map((q) => {
                          const isGrade = drawer.mode === 'grade'
                          const graded = (q.examiners ?? []).some((e) => e.name === CURRENT_EXAMINER)
                          const border = isGrade
                            ? graded ? '#91caff' : '#d9d9d9'
                            : q.correct ? '#b7eb8f' : '#ffccc7'
                          const bg = isGrade
                            ? graded ? '#e6f4ff' : '#fff'
                            : q.correct ? '#f6ffed' : '#fff1f0'
                          const color = isGrade
                            ? graded ? '#1677ff' : '#8c8c8c'
                            : q.correct ? '#389e0d' : '#cf1322'
                          const tip = isGrade
                            ? isStationGroup
                              ? `第 ${q.no} 站 · ${TYPE_LABEL[t]} · ${graded ? '已评分' : '未评分'}`
                              : `第 ${q.no} 题 · ${TYPE_LABEL[t]} · ${graded ? '已评分' : '未评分'}`
                            : `第 ${q.no} 题 · ${TYPE_LABEL[t]} · ${q.correct ? '正确' : '错误'}`
                          return (
                            <button
                              key={q.no}
                              type="button"
                              onClick={() => handleJump(q.no)}
                              title={tip}
                              style={{
                                height: 28,
                                borderRadius: 4,
                                border: `1px solid ${border}`,
                                background: bg,
                                color,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {q.no}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: '#8c8c8c', lineHeight: 1.8 }}>
                {drawer.mode === 'grade' ? (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: '#e6f4ff',
                        border: '1px solid #91caff',
                        marginRight: 6,
                        verticalAlign: 'middle',
                      }}
                    />
                    已评分 {gradedCount}
                    <br />
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: '#fff',
                        border: '1px solid #d9d9d9',
                        marginRight: 6,
                        verticalAlign: 'middle',
                      }}
                    />
                    未评分 {listQuestions.length - gradedCount}
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: '#b7eb8f',
                        border: '1px solid #95de64',
                        marginRight: 6,
                        verticalAlign: 'middle',
                      }}
                    />
                    正确 {view.correctCount}
                    <br />
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: '#ffccc7',
                        border: '1px solid #ffa39e',
                        marginRight: 6,
                        verticalAlign: 'middle',
                      }}
                    />
                    错误 {view.questionCount - view.correctCount}
                  </>
                )}
              </div>
            </aside>

            {/* 右侧试卷详情 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 考试名称 + 各科成绩：按 套 × 题型 汇总（第1套=理论卷，第2套=实操卷），末行总分 */}
              {(() => {
                const rows = setList.length
                  ? setList
                  : [{ name: view.paperName, questions: view.questions, score: view.score, correctCount: view.correctCount, totalScore: view.totalScore }]
                const cell: React.CSSProperties = { padding: '6px 10px', border: '1px solid #e8e8e8', fontSize: 13, textAlign: 'center', whiteSpace: 'nowrap' }
                // 某套卷某题型的 得分/满分（无该题型则 null，显示 --）
                const typeStat = (qs: ExamQuestion[], t: QuestionType) => {
                  const list = qs.filter((q) => q.type === t)
                  if (!list.length) return null
                  const total = list.reduce((s, q) => s + q.score, 0)
                  const obtained = list.reduce((s, q) => {
                    if (MANUAL_TYPES.includes(q.type)) {
                      const ex = q.examiners ?? []
                      return s + (ex.length ? +(ex.reduce((a, e) => a + e.score, 0) / ex.length).toFixed(1) : 0)
                    }
                    return s + (q.correct ? q.score : 0)
                  }, 0)
                  return { total, obtained }
                }
                const totalScoreSum = rows.reduce((s, x) => s + x.totalScore, 0)
                const totalObtainedSum = rows.reduce((s, x) => {
                  let sum = 0
                  TYPE_ORDER.forEach((t) => {
                    const st = typeStat(x.questions, t)
                    if (st) sum = +(sum + st.obtained).toFixed(1)
                  })
                  return +(s + sum).toFixed(1)
                }, 0)
                const passTag = (obtained: number, full: number) =>
                  obtained > 0 ? (
                    <Tag color={obtained >= full * 0.6 ? 'green' : 'red'}>{obtained >= full * 0.6 ? '合格' : '不合格'}</Tag>
                  ) : (
                    <span style={{ color: '#8c8c8c' }}>--</span>
                  )
                return (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
                      考试名称：{examName ?? view.paperName}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>各科成绩</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                          <th style={{ ...cell, width: 190 }}>试卷</th>
                          {TYPE_ORDER.map((t) => (
                            <th key={t} style={cell}>{TYPE_LABEL[t]}</th>
                          ))}
                          <th style={cell}>合计</th>
                          <th style={cell}>标记</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s, i) => {
                          let rowObtained = 0
                          return (
                            <tr key={i}>
                              <td style={{ ...cell, textAlign: 'left' }}>
                                <div>第{i + 1}套</div>
                                <div style={{ color: '#8c8c8c', fontSize: 12 }}>{s.name ?? view.paperName}</div>
                              </td>
                              {TYPE_ORDER.map((t) => {
                                const st = typeStat(s.questions, t)
                                if (st) rowObtained = +(rowObtained + st.obtained).toFixed(1)
                                return <td key={t} style={cell}>{st ? `${st.obtained}/${st.total}` : '--'}</td>
                              })}
                              <td style={{ ...cell, fontWeight: 600 }}>{rowObtained}</td>
                              <td style={cell}>{passTag(rowObtained, s.totalScore)}</td>
                            </tr>
                          )
                        })}
                        <tr style={{ background: '#fafafa' }}>
                          <td style={{ ...cell, fontWeight: 600 }} colSpan={7}>总分</td>
                          <td style={{ ...cell, fontWeight: 700 }}>{totalObtainedSum}</td>
                          <td style={cell}>{passTag(totalObtainedSum, totalScoreSum)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })()}

              {/* 多套试卷：标签切换（仅多套时显示） */}
              {setList.length > 1 && (
                <Tabs
                  type="card"
                  activeKey={String(setIndex)}
                  onChange={(k) => {
                    setScoreInputs({})
                    setRubricInputs({})
                    setSetIndex(Number(k))
                    setDrawer((prev) => (prev ? { ...prev, setIndex: Number(k) } : prev))
                  }}
                  items={setList.map((_, i) => ({ key: String(i), label: `第${i + 1}套` }))}
                  style={{ marginBottom: 12 }}
                />
              )}

              {/* 试卷头：居中标题 + 考试信息 */}
              <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.5 }}>
                {view.paperName}
              </div>
              <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 13, margin: '8px 0 16px' }}>
                考试用时：{formatDuration(view.durationSec)}，满分：{view.totalScore} 分
              </div>

              {/* 考生信息行：三个抽屉统一为 考生编号 + 分数 */}
              <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>
                考生编号：{view.candidateNo}
                <span style={{ marginLeft: 24 }}>
                  分数：
                  {view.score > 0 ? (
                    <>
                      <span style={{ color: view.score >= 60 ? '#389e0d' : '#cf1322', fontSize: 16 }}>
                        {view.score}
                      </span>
                      分
                    </>
                  ) : (
                    <span style={{ color: '#8c8c8c' }}>待出分</span>
                  )}
                </span>
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 12 }}>
                交卷时间：{view.submitTime}
                {drawer.mode === 'grade' && (
                  <span style={{ marginLeft: 16 }}>
                    考试次数：第 {drawer.attempt} 次 / 共 {view.totalAttempts} 次
                  </span>
                )}
                <span style={{ marginLeft: 16 }}>正确：{view.correctCount}/{view.questionCount}</span>
                <Tag style={{ marginLeft: 16 }} color={drawer.record.marked ? 'green' : 'orange'}>
                  {drawer.record.marked ? '已阅卷' : '未阅卷'}
                </Tag>
              </div>
              <div style={{ borderTop: '1px dashed #d9d9d9', margin: '4px 0 16px' }} />

              {/* 大题标题 */}
              <div style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
                {drawer.mode === 'grade'
                  ? `待阅试题（共 ${listQuestions.length} 题，客观题由系统自动判分）`
                  : `一、本卷试题（含选择答案、正确答案与评分表，每题 ${view.questions[0]?.score ?? 0} 分，共 ${view.totalScore} 分）`}
              </div>

              {/* 逐题展示：题干 + 竖排选项（正确项绿色，考生错选项红色） */}
              {listQuestions.map((q) => {
                const isManual = MANUAL_TYPES.includes(q.type)
                const examiners = q.examiners ?? []
                const avg = examiners.length
                  ? +(examiners.reduce((s, e) => s + e.score, 0) / examiners.length).toFixed(1)
                  : null
                const avgItems = q.rubric
                  ? q.rubric.map((_, idx) => {
                      const vals = examiners.map((e) => e.items?.[idx] ?? 0)
                      return vals.length ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : null
                    })
                  : null
                return (
                  <div
                    key={q.no}
                    ref={(el) => {
                      questionRefs.current[q.no] = el
                    }}
                    style={{ marginBottom: 16, scrollMarginTop: 12 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ color: '#1a1a1a' }}>
                        {q.no}. {q.stem}
                        <Tag style={{ marginLeft: 8 }} color="blue">{TYPE_LABEL[q.type]}</Tag>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>（{q.score} 分）</span>
                      </div>
                      {/* 右上角：试卷 / 详情 —— 在原「正确 / 错误」位置统一显示得分；阅评仅实操提示按评分表 */}
                      {drawer.mode === 'grade' ? (
                        q.type === 'practice' ? (
                          <Tag color="geekblue" style={{ marginLeft: 8, flexShrink: 0 }}>按评分表评分</Tag>
                        ) : null
                      ) : (
                        <Tag color="blue" style={{ marginLeft: 8, flexShrink: 0, fontWeight: 600 }}>
                          得分 {isManual ? (avg ?? '—') : (q.correct ? q.score : 0)} 分
                        </Tag>
                      )}
                    </div>
                    <div style={{ paddingLeft: 18, marginTop: 4 }}>
                      {q.options.length > 0 ? (
                        q.options.map((o) => {
                          const isCorrect = o.key === q.correctAnswer
                          const isCandidate = o.key === q.candidateAnswer
                          return (
                            <div
                              key={o.key}
                              style={{
                                color: isCorrect ? '#389e0d' : isCandidate && !q.correct ? '#cf1322' : '#595959',
                                fontWeight: isCorrect || isCandidate ? 600 : 400,
                                lineHeight: 1.8,
                              }}
                            >
                              {o.key}. {o.text}
                              {isCandidate ? ' （考生作答）' : ''}
                              {isCorrect ? ' （正确答案）' : ''}
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ lineHeight: 1.9 }}>
                          {q.type === 'practice' ? (
                            /* 实操题：删除「考生作答 / 正确答案」文字，改为现场录像 */
                            <div style={{ marginBottom: 10 }}>
                              <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>现场操作录像</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                {drawer.mode === 'grade' && (
                                  <Button
                                    size="small"
                                    icon={<VideoCameraOutlined />}
                                    onClick={() => startRecording(videoKeyOf(drawer.record, drawer.attempt, q.no))}
                                    disabled={recordingKey === videoKeyOf(drawer.record, drawer.attempt, q.no) && recording}
                                  >
                                    {videoBlobs[videoKeyOf(drawer.record, drawer.attempt, q.no)] ? '重新录制' : '开启录像'}
                                  </Button>
                                )}
                                {videoBlobs[videoKeyOf(drawer.record, drawer.attempt, q.no)] && (
                                  <Button
                                    size="small"
                                    type="link"
                                    icon={<PlayCircleOutlined />}
                                    style={{ paddingLeft: 0 }}
                                    onClick={() => setReplayKey(videoKeyOf(drawer.record, drawer.attempt, q.no))}
                                  >
                                    查看现场视频
                                  </Button>
                                )}
                                {!videoBlobs[videoKeyOf(drawer.record, drawer.attempt, q.no)] && drawer.mode !== 'grade' && (
                                  <span style={{ color: '#8c8c8c', fontSize: 13 }}>暂无现场录像</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ color: '#595959' }}>考生作答：{q.candidateAnswer || '（未作答）'}</div>
                              <div style={{ color: '#389e0d' }}>
                                {/* 填空 / 简答题的答案为「参考答案」（主观题非唯一正确项）；客观题仍为「正确答案」 */}
                                {q.type === 'fill' || q.type === 'short' ? '参考答案' : '正确答案'}：{q.correctAnswer}
                              </div>
                            </>
                          )}
                          {q.type === 'practice' && q.rubric ? (
                            /* 实操题：阅评（当前考官逐项录入） / 详情（各考官评分表） / 试卷（仅题头得分，不展示评分表） */
                            drawer.mode === 'grade' ? (
                              <div style={{ marginTop: 10, padding: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6 }}>
                                <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>实操评分表</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                      <th style={RUBRIC_CELL}>评分项</th>
                                      <th style={RUBRIC_CELL}>满分</th>
                                      <th style={RUBRIC_CELL}>评分要点</th>
                                      <th style={RUBRIC_CELL}>评分</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {q.rubric.map((r, idx) => (
                                      <tr key={r.item}>
                                        <td style={RUBRIC_CELL}>{r.item}</td>
                                        <td style={RUBRIC_CELL}>{r.max}</td>
                                        <td style={{ ...RUBRIC_CELL, color: '#595959' }}>{r.keyPoint}</td>
                                        <td style={RUBRIC_CELL}>
                                          <InputNumber
                                            min={0}
                                            max={r.max}
                                            step={0.5}
                                            precision={1}
                                            value={rubricInputs[q.no]?.[idx] ?? null}
                                            onChange={(v) =>
                                              setRubricInputs((p) => {
                                                const arr = [...(p[q.no] ?? q.rubric!.map(() => null))]
                                                arr[idx] = v ?? null
                                                return { ...p, [q.no]: arr }
                                              })
                                            }
                                            style={{ width: 110 }}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                    <tr style={{ fontWeight: 600, background: '#fff' }}>
                                      <td style={RUBRIC_CELL} colSpan={3}>合计（自动求和）</td>
                                      <td style={{ ...RUBRIC_CELL, color: '#1677ff', fontWeight: 700 }}>
                                        {rubricInputs[q.no] ? +((rubricInputs[q.no] as (number | null)[]).reduce<number>((s, v) => s + (v ?? 0), 0)).toFixed(1) : '0.0'}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div style={{ marginTop: 10 }}>
                                  {(() => {
                                    const me = examiners.find((e) => e.name === CURRENT_EXAMINER)
                                    return me ? (
                                      <span style={{ fontSize: 12, color: '#999' }}>
                                        您已评分 {me.score} 分，重新录入后点击右下角「保存」可覆盖
                                      </span>
                                    ) : null
                                  })()}
                                </div>
                              </div>
                            ) : drawer.mode === 'detail' ? (
                              <div style={{ marginTop: 10, padding: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6 }}>
                                <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>实操评分表（{examiners.length} 名考官）</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                      <th style={RUBRIC_CELL}>评分项</th>
                                      <th style={RUBRIC_CELL}>满分</th>
                                      {examiners.map((e) => <th key={e.name} style={RUBRIC_CELL}>{e.name}</th>)}
                                      <th style={RUBRIC_CELL}>平均分</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {q.rubric.map((r, idx) => (
                                      <tr key={r.item}>
                                        <td style={RUBRIC_CELL}>
                                          {r.item}
                                          {r.keyPoint ? <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>{r.keyPoint}</div> : null}
                                        </td>
                                        <td style={RUBRIC_CELL}>{r.max}</td>
                                        {examiners.map((e) => <td key={e.name} style={RUBRIC_CELL}>{e.items?.[idx] ?? '—'}</td>)}
                                        <td style={{ ...RUBRIC_CELL, color: '#1677ff', fontWeight: 600 }}>{avgItems?.[idx] ?? '—'}</td>
                                      </tr>
                                    ))}
                                    <tr style={{ fontWeight: 600, background: '#fff' }}>
                                      <td style={RUBRIC_CELL}>合计</td>
                                      <td style={RUBRIC_CELL}>{q.score}</td>
                                      {examiners.map((e) => <td key={e.name} style={RUBRIC_CELL}>{e.score}</td>)}
                                      <td style={{ ...RUBRIC_CELL, color: '#1677ff', fontWeight: 700 }}>{avg ?? '—'}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            ) : null
                          ) : isManual && drawer.mode === 'grade' ? (
                            /* 填空题 / 简答题（阅评）：手动输入数字得分，统一在右下角保存 */
                            <div style={{ marginTop: 10, padding: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 13, color: '#595959' }}>本题得分</span>
                                <InputNumber
                                  min={0}
                                  max={q.score}
                                  step={0.5}
                                  precision={1}
                                  value={scoreInputs[q.no] ?? null}
                                  onChange={(v) => setScoreInputs((p) => ({ ...p, [q.no]: v ?? null }))}
                                  style={{ width: 120 }}
                                />
                                <span style={{ fontSize: 12, color: '#999' }}>/ {q.score} 分</span>
                              </div>
                              {(() => {
                                const me = examiners.find((e) => e.name === CURRENT_EXAMINER)
                                return me ? (
                                  <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                                    您已评分 {me.score} 分，重新录入后点击右下角「保存」可覆盖
                                  </div>
                                ) : null
                              })()}
                            </div>
                          ) : isManual && drawer.mode === 'detail' ? (
                            /* 填空题 / 简答题（详情）：以表格展示各考官评分与平均分 */
                            <div style={{ marginTop: 10, padding: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6 }}>
                              <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>本题评分（{examiners.length} 名考官）</div>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                    <th style={RUBRIC_CELL}>评分项</th>
                                    <th style={RUBRIC_CELL}>满分</th>
                                    {examiners.map((e) => <th key={e.name} style={RUBRIC_CELL}>{e.name}</th>)}
                                    <th style={RUBRIC_CELL}>平均分</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={RUBRIC_CELL}>本题得分</td>
                                    <td style={RUBRIC_CELL}>{q.score}</td>
                                    {examiners.map((e) => <td key={e.name} style={RUBRIC_CELL}>{e.score}</td>)}
                                    <td style={{ ...RUBRIC_CELL, color: '#1677ff', fontWeight: 600 }}>{avg ?? '—'}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 实时录像框：固定在阅卷抽屉左下角（内容区底部，避开底部操作栏） */}
        <style>{`
          @keyframes recBlink { 0%,100% { opacity: 1 } 50% { opacity: 0.2 } }
          .rec-blink { animation: recBlink 1s infinite; }
          @keyframes recScan { 0% { top: 8% } 100% { top: 92% } }
          .rec-scan { animation: recScan 2.4s linear infinite; }
        `}</style>
        {recording && recordingKey && (
          <div
            style={{
              position: 'fixed',
              left: videoBoxLeft,
              bottom: 72,
              width: videoSize === 'large' ? 440 : 260,
              background: '#000',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
              zIndex: 1080,
            }}
          >
            <div style={{ position: 'relative' }}>
              {streamRef.current ? (
                <video
                  ref={liveVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', display: 'block', background: '#000' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: videoSize === 'large' ? 248 : 146,
                    background: 'linear-gradient(135deg, #1f1f1f, #3a3a3a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13 }}>模拟现场画面</div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>（未获取到摄像头，演示录制中）</div>
                  </div>
                  <div
                    className="rec-scan"
                    style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.25)' }}
                  />
                </div>
              )}
              {/* LIVE 角标 + 计时 */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: 4,
                  padding: '2px 8px',
                }}
              >
                <span
                  className="rec-blink"
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f', display: 'inline-block' }}
                />
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>LIVE</span>
                <span style={{ color: '#fff', fontSize: 12 }}>{formatRecTime(recordingTime)}</span>
              </div>
              {/* 控制条：放大 / 缩小 / 完成录制 */}
              <div style={{ display: 'flex', gap: 6, padding: 6, background: 'rgba(0,0,0,0.65)' }}>
                <Button
                  size="small"
                  type="text"
                  style={{ color: '#fff' }}
                  icon={videoSize === 'large' ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={() => setVideoSize((s) => (s === 'large' ? 'normal' : 'large'))}
                >
                  {videoSize === 'large' ? '缩小' : '放大'}
                </Button>
                <Button size="small" type="primary" danger style={{ marginLeft: 'auto' }} onClick={stopRecording}>
                  完成录制
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 现场视频回放 */}
        <Modal
          open={!!replayKey}
          title="现场视频回放"
          onCancel={() => setReplayKey(null)}
          footer={null}
          width={640}
          destroyOnClose
        >
          {replayKey && (() => {
            const url = videoBlobs[replayKey]
            if (url && url.startsWith('blob:')) {
              return <video src={url} controls style={{ width: '100%', borderRadius: 6 }} />
            }
            return (
              <div
                style={{
                  width: '100%',
                  height: 320,
                  background: 'linear-gradient(135deg, #1f1f1f, #3a3a3a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  borderRadius: 6,
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <PlayCircleOutlined style={{ fontSize: 40, opacity: 0.6 }} />
                  <div style={{ fontSize: 13, marginTop: 8 }}>现场视频回放（演示画面）</div>
                </div>
              </div>
            )
          })()}
        </Modal>
      </Drawer>

    </div>
  )
}

export default MarkingHall
