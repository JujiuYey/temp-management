import React, { useMemo, useState } from 'react'
import { Button, Empty, Input, Select, Tag, message } from 'antd'
import {
  SearchOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

// ===== 考试数据模型 =====
interface ExamItem {
  id: string
  paperName: string       // 试卷名称
  category: string        // 考试类别
  startTime: string       // 考试开始时间
  endTime: string         // 考试结束时间
  duration: number        // 考试时长（分钟）
  signUpDeadline: string  // 报名截止时间
  capacity: number        // 名额上限
  enrolled: number        // 已报名人数
}

// 以当前时间为基准生成日期，保证演示数据始终覆盖各种状态
const at = (dayOffset: number, time: string) => `${dayjs().add(dayOffset, 'day').format('YYYY-MM-DD')} ${time}`

// ===== 考试计划 mock 数据 =====
const MOCK_EXAMS: ExamItem[] = [
  {
    id: '1', paperName: '2026年第三季度医师三基理论考核', category: '三基考核',
    startTime: at(1, '09:00'), endTime: at(1, '10:30'), duration: 90,
    signUpDeadline: at(1, '00:00'), capacity: 120, enrolled: 86,
  },
  {
    id: '2', paperName: '抗菌药物临床应用知识考试', category: '专项培训',
    startTime: at(3, '14:00'), endTime: at(3, '15:00'), duration: 60,
    signUpDeadline: at(3, '00:00'), capacity: 80, enrolled: 41, // 已报名人数不含本人
  },
  {
    id: '3', paperName: '住院医师规范化培训出科理论考核', category: '规培考核',
    startTime: at(8, '09:30'), endTime: at(8, '11:00'), duration: 90,
    signUpDeadline: at(8, '00:00'), capacity: 60, enrolled: 57,
  },
  {
    id: '4', paperName: '突发公共卫生事件应急处置知识测验', category: '专项培训',
    startTime: at(13, '15:00'), endTime: at(13, '16:00'), duration: 60,
    signUpDeadline: at(13, '00:00'), capacity: 100, enrolled: 100,
  },
  {
    id: '5', paperName: '心肺复苏（CPR）操作技能考核', category: '技能考核',
    startTime: at(21, '13:30'), endTime: at(21, '15:00'), duration: 90,
    signUpDeadline: at(21, '00:00'), capacity: 50, enrolled: 12,
  },
  {
    id: '6', paperName: '病历书写规范专项考试', category: '专项培训',
    startTime: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm'),
    endTime: dayjs().add(90, 'minute').format('YYYY-MM-DD HH:mm'),
    duration: 120, signUpDeadline: at(-1, '00:00'), capacity: 90, enrolled: 63,
  },
  {
    id: '7', paperName: '医疗核心制度应知应会考试', category: '专项培训',
    startTime: at(-5, '09:00'), endTime: at(-5, '10:00'), duration: 60,
    signUpDeadline: at(-5, '00:00'), capacity: 150, enrolled: 143,
  },
]

type ExamStatus = '未开始' | '进行中' | '已结束'

const getExamStatus = (exam: ExamItem, now: dayjs.Dayjs): ExamStatus => {
  if (now.isAfter(dayjs(exam.endTime))) return '已结束'
  if (now.isAfter(dayjs(exam.startTime))) return '进行中'
  return '未开始'
}

const STATUS_COLOR: Record<ExamStatus, string> = {
  未开始: 'blue',
  进行中: 'green',
  已结束: 'default',
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分钟`
}

const MetricRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#595959', lineHeight: '24px' }}>
    <span style={{ color: '#bfbfbf', marginRight: 8, display: 'inline-flex' }}>{icon}</span>
    <span style={{ color: '#8c8c8c', width: 64, flexShrink: 0 }}>{label}</span>
    <span style={{ color: '#1f1f1f', flex: 1, minWidth: 0 }}>{value}</span>
  </div>
)

const ExamBooking: React.FC = () => {
  // 当前时间固定为页面加载时刻，避免渲染过程中时间漂移
  const now = useMemo(() => dayjs(), [])
  const [bookedIds, setBookedIds] = useState<string[]>(['2'])
  const [keyword, setKeyword] = useState('')
  const [examStatus, setExamStatus] = useState<'全部' | ExamStatus>('全部')

  const exams = useMemo(
    () => MOCK_EXAMS.map((e) => ({ ...e, status: getExamStatus(e, now) })),
    [now],
  )

  const canSignUp = (exam: ExamItem & { status: ExamStatus }) =>
    exam.status === '未开始' && now.isBefore(dayjs(exam.signUpDeadline)) && exam.enrolled + 1 <= exam.capacity

  // 页面展示的已报名人数 = 其他已报名人数 + 本人是否已报名
  const enrolledCount = (exam: ExamItem) => exam.enrolled + (bookedIds.includes(exam.id) ? 1 : 0)

  const handleBook = (exam: ExamItem) => {
    setBookedIds((prev) => [...prev, exam.id])
    message.success(`已成功报名「${exam.paperName}」，请准时参加考试`)
  }

  const handleCancel = (exam: ExamItem) => {
    setBookedIds((prev) => prev.filter((id) => id !== exam.id))
    message.info(`已取消报名「${exam.paperName}」`)
  }

  const filtered = exams.filter((e) => {
    if (keyword && !e.paperName.includes(keyword)) return false
    if (examStatus !== '全部' && e.status !== examStatus) return false
    return true
  })

  const renderButton = (exam: ExamItem & { status: ExamStatus }) => {
    const booked = bookedIds.includes(exam.id)
    if (booked) {
      return (
        <Button danger onClick={() => handleCancel(exam)}>
          取消报名
        </Button>
      )
    }
    if (exam.status === '已结束') return <Button disabled>考试已结束</Button>
    if (exam.status === '进行中') return <Button disabled>考试进行中</Button>
    if (exam.enrolled + 1 > exam.capacity) return <Button disabled>名额已满</Button>
    if (now.isAfter(dayjs(exam.signUpDeadline))) return <Button disabled>报名已截止</Button>
    return (
      <Button type="primary" onClick={() => handleBook(exam)}>
        报 名
      </Button>
    )
  }

  return (
    <div>
      <style>{`
        .exam-card { transition: box-shadow 0.2s, border-color 0.2s; }
        .exam-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      `}</style>

      {/* 页面标题 + 筛选 */}
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
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>考试预约</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            value={examStatus}
            onChange={(v) => setExamStatus(v as typeof examStatus)}
            style={{ width: 140 }}
            options={[
              { value: '全部', label: '全部状态' },
              { value: '未开始', label: '未开始' },
              { value: '进行中', label: '进行中' },
              { value: '已结束', label: '已结束' },
            ]}
          />
          <Input
            placeholder="请输入试卷名称"
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* 考试卡片列表 */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', padding: '80px 0' }}>
          <Empty description="暂无符合条件的考试" />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((exam) => {
            const booked = bookedIds.includes(exam.id)
            const disabled = exam.status === '已结束'
            return (
              <div
                key={exam.id}
                className="exam-card"
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  border: booked ? '1px solid #91caff' : '1px solid #f0f0f0',
                  padding: '16px 20px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: disabled ? 0.72 : 1,
                }}
              >
                {/* 标题行 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', lineHeight: '22px' }}>
                    {exam.paperName}
                  </span>
                  <Tag color={STATUS_COLOR[exam.status]} style={{ marginInlineEnd: 0, flexShrink: 0 }}>
                    {exam.status}
                  </Tag>
                </div>

                <div style={{ margin: '6px 0 12px' }}>
                  <Tag color="geekblue" style={{ marginInlineEnd: 0 }}>{exam.category}</Tag>
                </div>

                {/* 关键信息 */}
                <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <MetricRow
                    icon={<CalendarOutlined />}
                    label="考试时间"
                    value={`${dayjs(exam.startTime).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(exam.endTime).format('HH:mm')}`}
                  />
                  <MetricRow
                    icon={<ClockCircleOutlined />}
                    label="考试时长"
                    value={formatDuration(exam.duration)}
                  />
                  <MetricRow
                    icon={<FieldTimeOutlined />}
                    label="报名截止"
                    value={dayjs(exam.signUpDeadline).format('YYYY-MM-DD HH:mm')}
                  />
                  <MetricRow
                    icon={<TeamOutlined />}
                    label="已报名"
                    value={`${enrolledCount(exam)} 人`}
                  />
                </div>

                {/* 操作区 */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid #f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    minHeight: 44,
                  }}
                >
                  {renderButton(exam)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ExamBooking
