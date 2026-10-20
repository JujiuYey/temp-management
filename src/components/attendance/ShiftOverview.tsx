import React, { useState, useMemo } from 'react'
import {
  Button,
  Select,
  Input,
  Tag,
  Radio,
  Tooltip,
  Avatar,
  Space,
  DatePicker,
} from 'antd'
import type { DatePickerProps } from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  UserOutlined,
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

// 人员详情数据类型
interface StaffDetail {
  name: string
  avatar?: string
  department: string
  phone: string
  workPhone: string
  personType: string
  personCategory: string
  position: string
  title: string
}

// 人员详情数据映射
const staffDetailsMap: Record<string, StaffDetail> = {
  '张三': {
    name: '张三',
    department: '信息科',
    phone: '138****1234',
    workPhone: '0851-12345678',
    personType: '在职',
    personCategory: '医生',
    position: '科室主任',
    title: '主任医师',
  },
  '李四': {
    name: '李四',
    department: '信息科',
    phone: '139****5678',
    workPhone: '0851-87654321',
    personType: '在职',
    personCategory: '护士',
    position: '护士长',
    title: '主管护师',
  },
  '王五': {
    name: '王五',
    department: '胸外科',
    phone: '137****9012',
    workPhone: '0851-11112222',
    personType: '在职',
    personCategory: '医生',
    position: '副主任',
    title: '副主任医师',
  },
}

// 班次定义
const shiftTemplates = [
  { name: '早班', color: '#52c41a' },
  { name: '中班', color: '#1677ff' },
  { name: '晚班', color: '#fa8c16' },
  { name: '夜班', color: '#722ed1' },
  { name: '值班', color: '#ff4d4f' },
]

// 排班数据类型
interface DailyShift {
  date: string
  dayOfWeek: string
  dayNumber: number
  holiday: Holiday | null
  shifts: {
    name: string
    color: string
    staff: string[]
  }[]
}

// 根据日期获取班次（模拟数据生成逻辑）
const getShiftsForDate = (dayNumber: number): DailyShift['shifts'] => {
  // 使用日期生成固定的班次分配
  const dayHash = dayNumber % 5
  const shifts: DailyShift['shifts'] = []

  // 每天根据日期分配不同的班次组合
  if (dayHash === 0) {
    shifts.push({ name: '早班', color: '#52c41a', staff: ['张三', '李四'] })
    shifts.push({ name: '夜班', color: '#722ed1', staff: ['王五'] })
  } else if (dayHash === 1) {
    shifts.push({ name: '中班', color: '#1677ff', staff: ['张三'] })
    shifts.push({ name: '晚班', color: '#fa8c16', staff: ['李四', '王五'] })
  } else if (dayHash === 2) {
    shifts.push({ name: '早班', color: '#52c41a', staff: ['王五'] })
    shifts.push({ name: '夜班', color: '#722ed1', staff: ['张三', '李四'] })
  } else if (dayHash === 3) {
    shifts.push({ name: '值班', color: '#ff4d4f', staff: ['张三'] })
    shifts.push({ name: '中班', color: '#1677ff', staff: ['李四'] })
  } else {
    shifts.push({ name: '早班', color: '#52c41a', staff: ['张三', '王五'] })
    shifts.push({ name: '晚班', color: '#fa8c16', staff: ['李四'] })
  }

  return shifts
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

const ShiftOverviewPage: React.FC = () => {
  const [unitFilter, setUnitFilter] = useState<string>('信息科')
  const [staffNameFilter, setStaffNameFilter] = useState<string>('')
  const [shiftFilter, setShiftFilter] = useState<string | null>(null)
  const [dateType, setDateType] = useState<'week' | 'month' | 'date'>('month')
  const [viewMode, setViewMode] = useState<'standard' | 'calendar'>('standard')
  const [currentPeriod, setCurrentPeriod] = useState('2026-02')
  const [currentWeek, setCurrentWeek] = useState(6) // 当前第几周
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null) // 日期范围

  // 获取当前显示的期间描述
  const getPeriodDisplay = () => {
    switch (dateType) {
      case 'month':
        return currentPeriod
      case 'week':
        return `第${currentWeek}周`
      case 'date':
        return dateRange ? `${dateRange[0].format('YYYY-MM-DD')} ~ ${dateRange[1].format('YYYY-MM-DD')}` : '请选择日期范围'
      default:
        return currentPeriod
    }
  }

  // 周切换
  const handlePrevWeek = () => {
    setCurrentWeek(prev => (prev > 1 ? prev - 1 : 1))
  }

  const handleNextWeek = () => {
    setCurrentWeek(prev => (prev < 52 ? prev + 1 : 52))
  }

  // 日期范围切换（RangePicker 的 onChange 收到的是日期元组）
  const handleDateRangeChange = (dates: unknown) => {
    const range = dates as [dayjs.Dayjs, dayjs.Dayjs] | null
    if (range && range[0] && range[1]) {
      setDateRange(range)
    } else {
      setDateRange(null)
    }
  }

  // 根据当前月份动态生成整月排班数据
  const monthlyShifts = useMemo(() => {
    const current = dayjs(currentPeriod, 'YYYY-MM')
    const daysInMonth = current.daysInMonth()
    const shifts: DailyShift[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = current.date(day)
      const isoWeekday = date.isoWeekday() // 1=周一, 7=周日
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

  const renderStaffDetail = (staffName: string) => {
    const detail = staffDetailsMap[staffName]
    const displayDetail: StaffDetail = detail || {
      name: staffName,
      department: '-',
      phone: '-',
      workPhone: '-',
      personType: '-',
      personCategory: '-',
      position: '-',
      title: '-',
    }

    return (
      <div className="w-64 p-3 bg-white shadow-lg rounded-lg">
        <div className="flex items-center gap-3 pb-3 border-b mb-3">
          <Avatar
            size={48}
            src={displayDetail.avatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1677ff' }}
          />
          <div className="font-medium text-base text-gray-800">{displayDetail.name}</div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="text-gray-800 w-24">部门</span>
            <span className="text-gray-800">{displayDetail.department}</span>
          </div>
          <div className="flex">
            <span className="text-gray-800 w-24">联系电话</span>
            <span className="text-gray-800">{displayDetail.phone}</span>
          </div>
          <div className="flex">
            <span className="text-gray-800 w-24">工作电话</span>
            <span className="text-gray-800">{displayDetail.workPhone}</span>
          </div>
          <div className="flex">
            <span className="text-gray-800 w-24">人员性质</span>
            <span className="text-gray-800">{displayDetail.personType}</span>
          </div>
          <div className="flex">
            <span className="text-gray-800 w-24">人员类别</span>
            <span className="text-gray-800">{displayDetail.personCategory}</span>
          </div>
          <div className="flex">
            <span className="text-gray-800 w-24">聘任职务</span>
            <span className="text-gray-800">{displayDetail.position}</span>
          </div>
          <div className="flex">
            <span className="text-gray-800 w-24">聘任职称</span>
            <span className="text-gray-800">{displayDetail.title}</span>
          </div>
        </div>
      </div>
    )
  }

  // 渲染单日排班（标准视图和日历视图共用）
  const renderDayShifts = (daily: DailyShift, compact = false) => (
    <div className={compact ? 'flex flex-wrap gap-2' : 'flex gap-4'}>
      {daily.shifts.map((shift, shiftIndex) => (
        <div
          key={shiftIndex}
          className={compact ? '' : 'flex-1 max-w-xs'}
        >
          <div
            className="px-3 py-1 rounded-t text-white text-sm font-medium"
            style={{ backgroundColor: shift.color }}
          >
            {shift.name}
          </div>
          <div className="border border-t-0 rounded-b p-2">
            {shift.staff.map((person, personIndex) => (
              <Tooltip
                key={personIndex}
                title={renderStaffDetail(person)}
                placement="top"
                overlayStyle={{ background: 'transparent', padding: 0 }}
                overlayInnerStyle={{ background: 'transparent', padding: 0, boxShadow: 'none' }}
              >
                <Tag
                  className="mb-1 cursor-pointer hover:text-blue-500"
                  bordered={false}
                >
                  {person}
                </Tag>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // 渲染日历视图（周一到周日排列）
  const renderCalendarView = () => {
    const current = dayjs(currentPeriod, 'YYYY-MM')
    const daysInMonth = current.daysInMonth()
    const firstDayOfMonth = current.startOf('month')
    const startDayOfWeek = firstDayOfMonth.day() // 0=周日, 1=周一...

    // 调整：周一到周日排列，所以周一是0
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    const weeks: (DailyShift | null)[][] = []
    let week: (DailyShift | null)[] = []

    // 填充空白
    for (let i = 0; i < adjustedStart; i++) {
      week.push(null)
    }

    // 填充日期（使用monthlyShifts数据）
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
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-gray-600 font-medium py-2 bg-gray-50 rounded">
              {day}
            </div>
          ))}
          {weeks.flat().map((daily, index) => (
            <div
              key={index}
              className={'min-h-28 border rounded p-2 relative ' + (daily === null ? 'bg-gray-50' : 'bg-white')}
            >
              {daily && (
                <>
                  {/* 左上角：日期 */}
                  <div className="absolute top-1 left-1">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                      {daily.dayNumber}
                    </span>
                  </div>
                  {/* 右上角：假期 */}
                  {daily.holiday && (
                    <div className="absolute top-1 right-1">
                      <span
                        className="px-1 py-0.5 rounded text-white text-xs"
                        style={{ backgroundColor: daily.holiday.color, fontSize: '10px' }}
                      >
                        {daily.holiday.name}
                      </span>
                    </div>
                  )}
                  {/* 下方：排班信息 */}
                  <div className="mt-8 space-y-1">
                    {daily.shifts.map((shift, idx) => (
                      <div key={idx} className="text-xs">
                        <span
                          className="inline-block px-1 rounded text-white mr-1"
                          style={{ backgroundColor: shift.color, fontSize: '10px' }}
                        >
                          {shift.name}
                        </span>
                        <Tooltip
                          title={renderStaffDetail(shift.staff[0])}
                          placement="top"
                          overlayStyle={{ background: 'transparent', padding: 0 }}
                          overlayInnerStyle={{ background: 'transparent', padding: 0, boxShadow: 'none' }}
                        >
                          <span className="text-gray-600 cursor-pointer hover:text-blue-500">
                            {shift.staff.join('、')}
                          </span>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const handleReset = () => {
    setUnitFilter('信息科')
    setStaffNameFilter('')
    setShiftFilter(null)
    setDateType('month')
    setCurrentPeriod('2026-02')
    setCurrentWeek(6)
    setDateRange(null)
  }

  return (
    <div>
      {/* 筛选栏 */}
      <div className="bg-white p-4 rounded-lg mb-4">
        {/* 第一行：标准/日历标签、日期类型、日期 */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          {/* 左侧：视图切换 */}
          <Radio.Group
            value={viewMode}
            onChange={e => setViewMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="standard">标准</Radio.Button>
            <Radio.Button value="calendar">日历</Radio.Button>
          </Radio.Group>

          {/* 右侧：日期类型和日期选择 */}
          <Space size="middle" wrap>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">日期类型</span>
              <Radio.Group
                value={dateType}
                onChange={e => setDateType(e.target.value)}
              >
                <Radio.Button value="week">周</Radio.Button>
                <Radio.Button value="month">月</Radio.Button>
                <Radio.Button value="date">日期</Radio.Button>
              </Radio.Group>
            </div>

            {/* 月份选择 */}
            {dateType === 'month' && (
              <div className="flex items-center gap-2">
                <Button
                  icon={<LeftOutlined />}
                  size="small"
                  onClick={handlePrevPeriod}
                >
                  上一月
                </Button>
                <span className="px-3 py-1 bg-gray-100 rounded min-w-24 text-center">{currentPeriod}</span>
                <Button
                  size="small"
                  onClick={handleNextPeriod}
                >
                  下一月
                  <RightOutlined />
                </Button>
              </div>
            )}

            {/* 周选择 */}
            {dateType === 'week' && (
              <div className="flex items-center gap-2">
                <Button
                  icon={<LeftOutlined />}
                  size="small"
                  onClick={handlePrevWeek}
                >
                  上一周
                </Button>
                <span className="px-3 py-1 bg-gray-100 rounded min-w-16 text-center">{getPeriodDisplay()}</span>
                <Button
                  size="small"
                  onClick={handleNextWeek}
                >
                  下一周
                  <RightOutlined />
                </Button>
              </div>
            )}

            {/* 日期范围选择 */}
            {dateType === 'date' && (
              <DatePicker.RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                placeholder={['开始日期', '结束日期']}
                style={{ width: 260 }}
              />
            )}
          </Space>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-gray-200 my-3"></div>

        {/* 第二行：考勤单元、人员姓名、排班班次、查询和重置按钮 */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Space size="middle" wrap>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">考勤单元</span>
              <Select
                value={unitFilter}
                onChange={setUnitFilter}
                style={{ width: 160 }}
                options={[
                  { label: '信息科', value: '信息科' },
                  { label: '金测试排班管理单元', value: '金测试排班管理单元' },
                  { label: '胸外科', value: '胸外科' },
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">人员姓名</span>
              <Input
                placeholder="请输入人员姓名"
                value={staffNameFilter}
                onChange={e => setStaffNameFilter(e.target.value)}
                style={{ width: 140 }}
                allowClear
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">排班班次</span>
              <Select
                placeholder="请选择排班班次"
                value={shiftFilter}
                onChange={setShiftFilter}
                allowClear
                style={{ width: 160 }}
                options={[
                  { label: '值班', value: '值班' },
                  { label: '白班', value: '白班' },
                  { label: '夜班', value: '夜班' },
                ]}
              />
            </div>
          </Space>

          <Space size="middle">
            <Button type="primary" className="!bg-blue-600">
              查询
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>
      </div>

      {/* 排班一览表格 */}
      <div className="bg-white rounded-lg border flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {viewMode === 'calendar' ? renderCalendarView() : (
        <div className="overflow-y-auto flex-1">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-blue-50">
              <th className="px-4 py-3 text-left font-medium text-gray-700 w-32">
                日期
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                排班情况
              </th>
            </tr>
          </thead>
          <tbody>
            {monthlyShifts.map((daily, index) => (
              <tr
                key={index}
                className={'border-t ' + (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
              >
                <td className="px-4 py-3 align-top">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-gray-800 font-medium">{daily.date}</div>
                      <div className="text-gray-500 text-sm">{daily.dayOfWeek}</div>
                    </div>
                    {daily.holiday && (
                      <span
                        className="px-2 py-0.5 rounded text-white text-xs whitespace-nowrap"
                        style={{ backgroundColor: daily.holiday.color }}
                      >
                        {daily.holiday.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {renderDayShifts(daily)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        )}
      </div>
    </div>
  )
}

export default ShiftOverviewPage
