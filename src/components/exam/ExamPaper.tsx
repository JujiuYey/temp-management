import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, Modal, Tag, message } from 'antd'
import {
  ClockCircleOutlined,
  CloseOutlined,
  CheckOutlined,
  FileTextOutlined,
  ToolOutlined,
} from '@ant-design/icons'

// ===== 试卷数据模型 =====
type PaperQType = '单选题' | '多选题' | '判断题' | '填空题' | '简答题' | '实操题'

interface PaperOption {
  key: string
  text: string
}

interface PaperQuestion {
  id: number
  type: PaperQType
  score: number
  stem: string
  options?: PaperOption[] // 单选题 / 多选题 / 判断题
}

const TYPE_COLOR: Record<PaperQType, string> = {
  单选题: 'blue',
  多选题: 'purple',
  判断题: 'cyan',
  填空题: 'orange',
  简答题: 'green',
  实操题: 'geekblue',
}

// 答题卡分组标题用中文序号
const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八']

// ===== 试卷题目 mock =====
const PAPER_QUESTIONS: PaperQuestion[] = [
  {
    id: 1, type: '单选题', score: 5,
    stem: '成人心肺复苏时，胸外心脏按压的深度应为（　）。',
    options: [
      { key: 'A', text: '2 ~ 3 cm' },
      { key: 'B', text: '5 ~ 6 cm' },
      { key: 'C', text: '7 ~ 8 cm' },
      { key: 'D', text: '按压越深越好' },
    ],
  },
  {
    id: 2, type: '单选题', score: 5,
    stem: '成人单人施救的心肺复苏中，胸外按压与人工呼吸的比例为（　）。',
    options: [
      { key: 'A', text: '15 : 2' },
      { key: 'B', text: '30 : 2' },
      { key: 'C', text: '5 : 1' },
      { key: 'D', text: '10 : 1' },
    ],
  },
  {
    id: 3, type: '单选题', score: 5,
    stem: '高质量心肺复苏要求胸外按压的频率为（　）。',
    options: [
      { key: 'A', text: '60 ~ 80 次/分' },
      { key: 'B', text: '80 ~ 100 次/分' },
      { key: 'C', text: '100 ~ 120 次/分' },
      { key: 'D', text: '120 ~ 150 次/分' },
    ],
  },
  {
    id: 4, type: '单选题', score: 5,
    stem: '使用 AED 完成一次电击除颤后，施救者应（　）。',
    options: [
      { key: 'A', text: '立即继续胸外按压，2 分钟后再次分析心律' },
      { key: 'B', text: '等待患者恢复自主呼吸再操作' },
      { key: 'C', text: '移除电极片后重新评估' },
      { key: 'D', text: '立即再次按下电击按钮' },
    ],
  },
  {
    id: 5, type: '多选题', score: 10,
    stem: '下列属于高质量心肺复苏要点的是（　）。',
    options: [
      { key: 'A', text: '按压频率 100 ~ 120 次/分' },
      { key: 'B', text: '保证胸廓充分回弹' },
      { key: 'C', text: '尽量减少按压中断' },
      { key: 'D', text: '按压深度 5 ~ 6 cm' },
    ],
  },
  {
    id: 6, type: '多选题', score: 10,
    stem: '关于 AED 的使用，下列说法正确的是（　）。',
    options: [
      { key: 'A', text: '粘贴电极片前应擦干患者胸部' },
      { key: 'B', text: '分析心律时所有人不得接触患者' },
      { key: 'C', text: '患者装有心脏起搏器时，电极片应避开起搏器位置' },
      { key: 'D', text: '按下放电按钮前须确认无人接触患者' },
    ],
  },
  {
    id: 7, type: '判断题', score: 5,
    stem: '发现患者无反应且无正常呼吸时，应立即开始心肺复苏，无需等待专业医护人员到场。',
    options: [
      { key: '正确', text: '正确' },
      { key: '错误', text: '错误' },
    ],
  },
  {
    id: 8, type: '判断题', score: 5,
    stem: '对淹溺患者，单人施救时应先进行约 2 分钟心肺复苏，再拨打急救电话。',
    options: [
      { key: '正确', text: '正确' },
      { key: '错误', text: '错误' },
    ],
  },
  {
    id: 9, type: '填空题', score: 5,
    stem: '成人胸外心脏按压的部位为 ______ 。',
  },
  {
    id: 10, type: '填空题', score: 5,
    stem: '高质量心肺复苏要求胸外按压频率为每分钟 ______ 次。',
  },
  {
    id: 11, type: '简答题', score: 10,
    stem: '简述成人心肺复苏的完整操作流程（包括判断意识与呼吸、呼救、胸外按压、开放气道、人工呼吸等关键步骤）。',
  },
  {
    id: 12, type: '简答题', score: 10,
    stem: '简述使用自动体外除颤器（AED）的注意事项。',
  },
  {
    id: 13, type: '实操题', score: 10,
    stem: '成人单人 CPR 现场操作：请现场完成判断意识与呼吸、启动应急反应系统、胸外心脏按压、开放气道与人工呼吸的完整流程。',
  },
  {
    id: 14, type: '实操题', score: 10,
    stem: 'AED 现场操作：请现场完成开机、粘贴电极片、心律分析与电击除颤（含安全确认）的完整流程。',
  },
]

// ===== 选项指示器（单选=圆点 / 多选=方块勾） =====
const Indicator: React.FC<{ multi?: boolean; selected: boolean }> = ({ multi, selected }) => {
  if (multi) {
    return (
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          flexShrink: 0,
          marginTop: 2,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${selected ? '#1677ff' : '#d9d9d9'}`,
          background: selected ? '#1677ff' : '#fff',
          color: '#fff',
          fontSize: 11,
        }}
      >
        {selected && <CheckOutlined />}
      </span>
    )
  }
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        flexShrink: 0,
        marginTop: 2,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${selected ? '#1677ff' : '#d9d9d9'}`,
        background: '#fff',
      }}
    >
      {selected && <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#1677ff' }} />}
    </span>
  )
}

const fmtElapsed = (s: number) => {
  const p = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`
}

// ===== 试卷作答界面（全屏弹出） =====
const ExamPaper: React.FC<{
  open: boolean
  examName?: string
  onClose: () => void
}> = ({ open, examName, onClose }) => {
  const [choice, setChoice] = useState<Record<number, string[]>>({})
  const [text, setText] = useState<Record<number, string>>({})
  const [active, setActive] = useState<number>(1)
  const [elapsed, setElapsed] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const qRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const totalScore = useMemo(() => PAPER_QUESTIONS.reduce((s, q) => s + q.score, 0), [])

  // 实操题不可机考，不计入在线作答
  const answerable = useMemo(() => PAPER_QUESTIONS.filter((q) => q.type !== '实操题'), [])
  const practiceCount = PAPER_QUESTIONS.length - answerable.length

  // 按题型分组（连续同题型归为一组）
  const groups = useMemo(() => {
    const out: { type: PaperQType; questions: PaperQuestion[] }[] = []
    PAPER_QUESTIONS.forEach((q) => {
      const last = out[out.length - 1]
      if (last && last.type === q.type) last.questions.push(q)
      else out.push({ type: q.type, questions: [q] })
    })
    return out
  }, [])

  const isAnswered = (q: PaperQuestion): boolean => {
    if (q.type === '实操题') return false
    return q.type === '填空题' || q.type === '简答题'
      ? !!(text[q.id] && text[q.id].trim())
      : !!(choice[q.id] && choice[q.id].length > 0)
  }

  const answeredCount = useMemo(() => answerable.filter((q) => isAnswered(q)).length, [answerable, choice, text])

  // 打开时重置作答状态
  useEffect(() => {
    if (open) {
      setChoice({})
      setText({})
      setActive(1)
      setElapsed(0)
    }
  }, [open])

  // 计时
  useEffect(() => {
    if (!open) return
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [open])

  const pickChoice = (q: PaperQuestion, key: string) => {
    const multi = q.type === '多选题'
    setChoice((prev) => {
      const cur = prev[q.id] ?? []
      if (multi) return { ...prev, [q.id]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] }
      return { ...prev, [q.id]: cur.includes(key) ? [] : [key] }
    })
  }

  const goto = (id: number) => {
    setActive(id)
    const el = qRefs.current[id]
    const sc = scrollRef.current
    if (el && sc) sc.scrollTo({ top: Math.max(el.offsetTop - 16, 0), behavior: 'smooth' })
  }

  const handleSubmit = () => {
    message.success(`交卷成功，在线作答 ${answeredCount} / ${answerable.length} 题`)
    setConfirmOpen(false)
    onClose()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: '#f0f2f5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 顶栏 */}
      <div
        style={{
          flexShrink: 0,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: '#e6f4ff',
              color: '#1677ff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            <FileTextOutlined />
          </span>
          <span style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>{examName ?? '在线考试'}</span>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>
            共 {PAPER_QUESTIONS.length} 题 · {totalScore} 分 · 在线作答 {answeredCount}/{answerable.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 12px',
              borderRadius: 999,
              background: '#f5f5f5',
              fontSize: 13,
              color: 'rgba(0,0,0,0.65)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <ClockCircleOutlined />
            已用时 {fmtElapsed(elapsed)}
          </span>
          <Button type="primary" onClick={() => setConfirmOpen(true)}>
            交卷
          </Button>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </div>
      </div>

      {/* 主体：左答题卡 + 右题目 */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* 左：题目序号 */}
        <div
          style={{
            width: 268,
            flexShrink: 0,
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '14px 16px 10px', fontWeight: 600, fontSize: 13 }}>答题卡</div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 16px' }}>
            {groups.map((g, gi) => (
              <div key={g.type}>
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(0,0,0,0.45)',
                    margin: gi === 0 ? '0 0 8px' : '16px 0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.65)' }}>
                    {CN_NUM[gi] ?? gi + 1}、{g.type}
                  </span>
                  <span>{g.questions.length} 题</span>
                  {g.type === '实操题' && (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#2f54eb',
                        background: '#f0f5ff',
                        border: '1px solid #adc6ff',
                        borderRadius: 3,
                        padding: '0 4px',
                        lineHeight: '16px',
                      }}
                    >
                      不可机考
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {g.questions.map((q) => {
                    const done = isAnswered(q)
                    const isActive = q.id === active
                    const isPractice = q.type === '实操题'
                    return (
                      <div
                        key={q.id}
                        onClick={() => goto(q.id)}
                        style={{
                          height: 34,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          cursor: 'pointer',
                          userSelect: 'none',
                          background: isPractice ? '#fafafa' : done ? '#1677ff' : '#fff',
                          color: isPractice ? 'rgba(0,0,0,0.35)' : done ? '#fff' : 'rgba(0,0,0,0.65)',
                          border: `1px solid ${isPractice ? '#e8e8e8' : done ? '#1677ff' : isActive ? '#1677ff' : '#e0e0e0'}`,
                          boxShadow: isActive ? '0 0 0 2px rgba(22,119,255,0.25)' : 'none',
                          fontWeight: isActive ? 600 : 400,
                          transition: 'all .15s',
                        }}
                      >
                        {q.id}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              flexShrink: 0,
              borderTop: '1px solid #f0f0f0',
              padding: '10px 16px',
              fontSize: 12,
              color: 'rgba(0,0,0,0.45)',
              display: 'flex',
              gap: 16,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i style={{ width: 12, height: 12, borderRadius: 3, background: '#1677ff', display: 'inline-block' }} />
              已作答
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i style={{ width: 12, height: 12, borderRadius: 3, background: '#fff', border: '1px solid #e0e0e0', display: 'inline-block' }} />
              未作答
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i style={{ width: 12, height: 12, borderRadius: 3, background: '#fafafa', border: '1px solid #e8e8e8', display: 'inline-block' }} />
              实操题
            </span>
          </div>
        </div>

        {/* 右：题目 + 答题区 */}
        <div ref={scrollRef} style={{ flex: 1, minWidth: 0, position: 'relative', overflowY: 'auto', padding: '20px 24px' }}>
          {PAPER_QUESTIONS.map((q) => (
            <div
              key={q.id}
              ref={(el) => {
                qRefs.current[q.id] = el
              }}
              onClick={() => setActive(q.id)}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: '20px 24px',
                marginBottom: 16,
                border: `1px solid ${active === q.id ? '#91caff' : 'transparent'}`,
                transition: 'border-color .2s',
              }}
            >
              {/* 题头 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{q.id}.</span>
                <Tag color={TYPE_COLOR[q.type]} style={{ margin: 0, borderRadius: 4 }}>
                  {q.type}
                </Tag>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{q.score} 分</span>
              </div>

              {/* 题干 */}
              <div style={{ fontSize: 14, lineHeight: '24px', color: '#1a1a1a', marginBottom: 14 }}>{q.stem}</div>

              {/* 答题区 */}
              {q.type === '填空题' && (
                <Input
                  placeholder="请输入答案"
                  value={text[q.id] ?? ''}
                  onChange={(e) => setText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  style={{ width: 420 }}
                />
              )}

              {q.type === '简答题' && (
                <Input.TextArea
                  rows={5}
                  placeholder="请输入作答内容"
                  value={text[q.id] ?? ''}
                  onChange={(e) => setText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  style={{ width: '100%', maxWidth: 820 }}
                />
              )}

              {(q.type === '单选题' || q.type === '多选题' || q.type === '判断题') &&
                q.options?.map((o) => {
                  const selected = (choice[q.id] ?? []).includes(o.key)
                  return (
                    <div
                      key={o.key}
                      onClick={() => pickChoice(q, o.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        maxWidth: 820,
                        padding: '10px 14px',
                        marginBottom: 10,
                        borderRadius: 6,
                        cursor: 'pointer',
                        border: `1px solid ${selected ? '#1677ff' : '#ebedf0'}`,
                        background: selected ? '#f0f7ff' : '#fff',
                        transition: 'all .15s',
                      }}
                    >
                      <Indicator multi={q.type === '多选题'} selected={selected} />
                      <span style={{ fontSize: 14, lineHeight: '20px', color: '#1a1a1a' }}>
                        {q.type !== '判断题' && (
                          <span style={{ fontWeight: 600, marginRight: 6 }}>{o.key}.</span>
                        )}
                        {o.text}
                      </span>
                    </div>
                  )
                })}

              {/* 实操题：不可机考，仅展示题目 */}
              {q.type === '实操题' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    maxWidth: 820,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: '#f0f5ff',
                    border: '1px solid #adc6ff',
                  }}
                >
                  <ToolOutlined style={{ color: '#2f54eb', fontSize: 15, marginTop: 2 }} />
                  <div style={{ fontSize: 13, lineHeight: '22px', color: '#2f54eb' }}>
                    本类题型为实操考核，<b>不支持在线作答</b>，请按题目要求在考核现场完成操作，由考官依据评分细则现场评分。
                  </div>
                </div>
              )}
            </div>
          ))}
          <div style={{ height: 8 }} />
        </div>
      </div>

      {/* 交卷确认 */}
      <Modal
        title="确认交卷"
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleSubmit}
        okText="确认交卷"
        cancelText="继续作答"
      >
        <div style={{ fontSize: 13, lineHeight: '22px', color: 'rgba(0,0,0,0.65)' }}>
          本卷共 {PAPER_QUESTIONS.length} 题，其中 <b style={{ color: '#2f54eb' }}>{practiceCount}</b> 道实操题需在考核现场完成、不参与在线作答；
          在线作答部分共 {answerable.length} 题，你已作答 <b style={{ color: '#1677ff' }}>{answeredCount}</b> 题，
          仍有 <b style={{ color: '#fa8c16' }}>{answerable.length - answeredCount}</b> 题未作答。
          <br />
          交卷后将无法修改答案，确认交卷吗？
        </div>
      </Modal>
    </div>
  )
}

export default ExamPaper
