import React, { useState, useMemo } from 'react'
import { Button, Tooltip, Space } from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

// 假期类型
interface Holiday {
  name: string
  color: string
}

// 假期数据（2026年）
const holidays2026: Record<string, Holiday> = {
  '01-01': { name: '元旦', color: '#ff4d4f' },
  '01-28': { name: '春节', color: '#ff4d4f' },
  '01-29': { name: '春节', color: '#ff4d4f' },
  '01-30': { name: '春节', color: '#ff4d4f' },
  '01-31': { name: '春节', color: '#ff4d4f' },
  '02-01': { name: '春节', color: '#ff4d4f' },
  '02-02': { name: '春节', color: '#ff4d4f' },
  '02-03': { name: '春节', color: '#ff4d4f' },
  '02-14': { name: '情人节', color: '#eb2f96' },
  '04-04': { name: '清明节', color: '#52c41a' },
  '04-05': { name: '清明节', color: '#52c41a' },
  '04-06': { name: '清明节', color: '#52c41a' },
  '05-01': { name: '劳动节', color: '#1677ff' },
  '05-02': { name: '劳动节', color: '#1677ff' },
  '05-03': { name: '劳动节', color: '#1677ff' },
  '05-04': { name: '劳动节', color: '#1677ff' },
  '05-05': { name: '劳动节', color: '#1677ff' },
  '06-01': { name: '儿童节', color: '#eb2f96' },
  '06-19': { name: '端午节', color: '#52c41a' },
  '06-20': { name: '端午节', color: '#52c41a' },
  '06-21': { name: '端午节', color: '#52c41a' },
  '10-01': { name: '国庆节', color: '#ff4d4f' },
  '10-02': { name: '国庆节', color: '#ff4d4f' },
  '10-03': { name: '国庆节', color: '#ff4d4f' },
  '10-04': { name: '国庆节', color: '#ff4d4f' },
  '10-05': { name: '国庆节', color: '#ff4d4f' },
  '10-06': { name: '国庆节', color: '#ff4d4f' },
  '10-07': { name: '国庆节', color: '#ff4d4f' },
  '10-08': { name: '国庆节', color: '#ff4d4f' },
  '10-09': { name: '国庆节', color: '#ff4d4f' },
  '10-10': { name: '重阳节', color: '#fa8c16' },
}

// 班次时间配置
const shiftTimeConfig: Record<
  string,
  { start: string; end: string; nodes: string[]; color?: string }
> = {
  '早班': { start: '08:00', end: '16:00', nodes: ['08:00 上班', '12:00 午休', '13:30 返岗', '16:00 下班'] },
  '中班': { start: '14:00', end: '22:00', nodes: ['14:00 上班', '18:00 晚餐', '19:00 返岗', '22:00 下班'] },
  '晚班': { start: '16:00', end: '24:00', nodes: ['16:00 上班', '18:00 晚餐', '20:00 巡房', '24:00 下班'] },
  '夜班': { start: '00:00', end: '08:00', nodes: ['00:00 上班', '02:00 巡房', '05:00 交接', '08:00 下班'] },
  '值班': { start: '08:00', end: '次日08:00', nodes: ['08:00 接班', '12:00 午间', '18:00 晚间', '08:00(+1) 交班'] },
}

// 排班数据类型
interface DailyShift {
  date: string
  dayOfWeek: string
  dayNumber: number
  holiday: Holiday | null
  shifts: {
    name: string
    color: string
  }[]
}

const weekDayNames: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

// 根据日期获取班次（模拟数据生成逻辑）
const getShiftsForDate = (dayNumber: number): DailyShift['shifts'] => {
  const dayHash = dayNumber % 5
  const shifts: DailyShift['shifts'] = []

  // 每天根据日期分配不同的班次组合
  if (dayHash === 0) {
    shifts.push({ name: '早班', color: '#52c41a' })
    shifts.push({ name: '夜班', color: '#722ed1' })
  } else if (dayHash === 1) {
    shifts.push({ name: '中班', color: '#1677ff' })
    shifts.push({ name: '晚班', color: '#fa8c16' })
  } else if (dayHash === 2) {
    shifts.push({ name: '早班', color: '#52c41a' })
    shifts.push({ name: '夜班', color: '#722ed1' })
  } else if (dayHash === 3) {
    shifts.push({ name: '值班', color: '#ff4d4f' })
    shifts.push({ name: '中班', color: '#1677ff' })
  } else {
    shifts.push({ name: '早班', color: '#52c41a' })
    shifts.push({ name: '晚班', color: '#fa8c16' })
  }

  return shifts
}

const MySchedulePage: React.FC = () => {
  const [currentPeriod, setCurrentPeriod] = useState('2026-05')

  // 根据当前月份动态生成整月排班数据
  const monthlyShifts = useMemo(() => {
    const current = dayjs(currentPeriod, 'YYYY-MM')
    const daysInMonth = current.daysInMonth()
    const shifts: DailyShift[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = current.date(day)
      const isoWeekday = date.isoWeekday()
      const dateKey = date.format('MM-DD')
      const holiday = holidays2026[dateKey] || null

      shifts.push({
        date: dateKey,
        dayOfWeek: weekDayNames[isoWeekday],
        dayNumber: day,
        holiday,
        shifts: getShiftsForDate(day),
      })
    }

    return shifts
  }, [currentPeriod])

  const handlePrevPeriod = () => {
    const current = dayjs(currentPeriod, 'YYYY-MM')
    const prev = current.subtract(1, 'month')
    setCurrentPeriod(prev.format('YYYY-MM'))
  }

  const handleNextPeriod = () => {
    const current = dayjs(currentPeriod, 'YYYY-MM')
    const next = current.add(1, 'month')
    setCurrentPeriod(next.format('YYYY-MM'))
  }

  // 渲染班次时间提示
  const renderShiftTimeTip = (shiftName: string) => {
    const config = shiftTimeConfig[shiftName]
    if (!config) {
      return (
        <div className="p-3 bg-white text-gray-800">
          <div className="font-medium mb-2">{shiftName}</div>
          <div className="text-gray-500 text-sm">暂无班次时间信息</div>
        </div>
      )
    }

    return (
      <div className="p-3 min-w-48 bg-white text-gray-800 rounded shadow-lg">
        <div className="font-medium mb-3 flex items-center gap-2">
          <span
            className="w-3 h-3 rounded"
            style={{ backgroundColor: shiftTimeConfig[shiftName]?.color || '#666' }}
          />
          {shiftName}
        </div>
        <div className="text-sm space-y-1.5">
          {config.nodes.map((node, idx) => (
            <div key={idx} className="flex items-center gap-2 text-gray-700">
              <ClockCircleOutlined className="text-blue-500" />
              <span>{node}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 渲染日历视图
  const renderCalendarView = () => {
    const current = dayjs(currentPeriod, 'YYYY-MM')
    const daysInMonth = current.daysInMonth()
    const firstDayOfMonth = current.startOf('month')
    const startDayOfWeek = firstDayOfMonth.day()

    // 调整：周一到周日排列
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const weeks: (DailyShift | null)[][] = []
    let week: (DailyShift | null)[] = []

    // 填充空白
    for (let i = 0; i < adjustedStart; i++) {
      week.push(null)
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(monthlyShifts[day - 1])
      if (week.length === 7) {
        weeks.push(week)
        week = []
      }
    }

    // 填充剩余空白
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null)
      }
      weeks.push(week)
    }

    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

    return (
      <div className="bg-white rounded-lg border">
        {/* 表头 */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map(day => (
            <div key={day} className="text-center text-gray-600 font-medium py-3 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        {/* 日期格子 */}
        <div className="divide-y divide-gray-100">
          {weeks.map((weekData, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7">
              {weekData.map((daily, dayIdx) => (
                <div
                  key={dayIdx}
                  className={
                    'min-h-32 border-r border-gray-100 p-2 ' +
                    (daily === null ? 'bg-gray-50' : 'bg-white') +
                    (dayIdx === 6 ? ' border-r-0' : '')
                  }
                >
                  {daily && (
                    <>
                      {/* 左上角：日期 */}
                      <div className="flex items-start justify-between mb-2">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                          {daily.dayNumber}
                        </span>
                        {/* 右上角：假期 */}
                        {daily.holiday && (
                          <span
                            className="px-1.5 py-0.5 rounded text-white text-xs"
                            style={{ backgroundColor: daily.holiday.color }}
                          >
                            {daily.holiday.name}
                          </span>
                        )}
                      </div>
                      {/* 班次信息 */}
                      <div className="space-y-1">
                        {daily.shifts.map((shift, idx) => (
                          <Tooltip
                            key={idx}
                            title={renderShiftTimeTip(shift.name)}
                            placement="top"
                            overlayInnerStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                          >
                            <div
                              className="px-2 py-1.5 rounded text-white text-xs font-medium text-center cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: shift.color }}
                            >
                              {shift.name}
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 筛选栏 - 只保留期间筛选 */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <Space size="middle">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">期间</span>
              <Button
                icon={<LeftOutlined />}
                onClick={handlePrevPeriod}
                size="small"
              >
                上一月
              </Button>
              <span className="px-3 py-1 bg-gray-100 rounded min-w-24 text-center">
                {currentPeriod}
              </span>
              <Button
                size="small"
                onClick={handleNextPeriod}
              >
                下一月
                <RightOutlined />
              </Button>
            </div>
          </Space>
        </div>
      </div>

      {/* 日历视图 */}
      <div className="overflow-hidden">
        {renderCalendarView()}
      </div>
    </div>
  )
}

export default MySchedulePage
