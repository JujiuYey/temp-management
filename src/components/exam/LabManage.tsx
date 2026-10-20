import React, { useState, useEffect } from 'react'
import { Button, Card, Drawer, Form, Input, InputNumber, Popconfirm, Select, Table, Tag, TimePicker, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

interface LabFormValues {
  name: string
  location?: string
  remark?: string
  capacity: number
  devices: string
  bookingDuration?: number // 提前预约天数，必填
  status: LabRoom['status']
}

// ===== 实训室数据模型 =====
interface OpenPeriod { start: string; end: string } // 单个开放时间段
interface LabRoom {
  id: string
  code: string        // 房间编号，如 A-201（列表展示用，表单不维护）
  name: string        // 实训室名称
  location?: string   // 位置
  remark?: string     // 说明
  capacity: number    // 容量（人）
  devices: string     // 设备清单
  bookingDuration?: number // 提前预约天数，必填
  openPeriods: OpenPeriod[] // 开放时段（可多个）
  status: '开放' | '维护中' | '停用'
}

// 开放时段文本：多个时间段用「、」连接
const periodText = (room: LabRoom) => room.openPeriods.map((p) => `${p.start}-${p.end}`).join('、')

// ===== 实训室 mock 数据 =====
const LAB_ROOMS: LabRoom[] = [
  { id: 'lab1', code: 'A-201', name: '急救实训室', capacity: 12, devices: '除颤仪、急救模型、监护仪', openPeriods: [{ start: '08:00', end: '21:00' }], status: '开放' },
  { id: 'lab2', code: 'B-102', name: '基础技能室', capacity: 16, devices: '气道模型、可视喉镜', openPeriods: [{ start: '08:00', end: '18:00' }], status: '开放' },
  { id: 'lab3', code: 'C-301', name: '护理实训室', capacity: 20, devices: '输液泵、护理模型', openPeriods: [{ start: '09:00', end: '21:00' }], status: '维护中' },
]

// ===== 状态标签配色 =====
const LAB_STATUS_COLOR: Record<LabRoom['status'], string> = { 开放: 'green', 维护中: 'red', 停用: 'default' }

// ===== 预约日历数据（演示用）：roomId -> 本月各日期的可预约时段 =====
interface BookingPerson {
  name: string        // 姓名
  department: string  // 科室
  phone: string       // 联系电话
  checkedIn: boolean  // 签到状态
  cancelled?: boolean // 是否已取消（关闭预约后）
}
interface DayBooking {
  date: string        // 预约日期 YYYY-MM-DD
  start: string       // 开始时间
  end: string         // 结束时间
  title: string       // 预约项目
  capacity: number    // 时段容量（分母，如 12）
  people: BookingPerson[] // 已预约人员明细
  closed?: boolean    // 是否已关闭预约（关闭后不可预约）
}

// 各实训室的可预约时段模板
const SLOT_TEMPLATES: Record<string, { start: string; end: string; title: string }[]> = {
  lab1: [
    { start: '09:00', end: '11:00', title: '心肺复苏练习' },
    { start: '14:00', end: '16:00', title: '气道管理练习' },
    { start: '19:00', end: '21:00', title: '开放练习' },
  ],
  lab2: [
    { start: '09:30', end: '11:30', title: '基础技能练习' },
    { start: '15:00', end: '17:00', title: '可视喉镜练习' },
  ],
  lab3: [
    { start: '10:00', end: '12:00', title: '护理操作练习' },
  ],
}

// 预约人员池（20 人，覆盖最大容量 20）
const PERSON_POOL: { name: string; department: string; phone: string }[] = [
  { name: '张伟', department: '急诊科', phone: '138****0101' },
  { name: '李娜', department: 'ICU', phone: '138****0102' },
  { name: '王强', department: '心内科', phone: '138****0103' },
  { name: '刘敏', department: '麻醉科', phone: '138****0104' },
  { name: '陈静', department: '护理部', phone: '138****0105' },
  { name: '杨帆', department: '呼吸内科', phone: '138****0106' },
  { name: '赵磊', department: '骨科', phone: '138****0107' },
  { name: '孙丽', department: '神经内科', phone: '138****0108' },
  { name: '周涛', department: '普外科', phone: '138****0109' },
  { name: '吴雪', department: '妇产科', phone: '138****0110' },
  { name: '郑阳', department: '儿科', phone: '138****0111' },
  { name: '冯婷', department: '科教科', phone: '138****0112' },
  { name: '许亮', department: '消化内科', phone: '138****0113' },
  { name: '何芳', department: '内分泌科', phone: '138****0114' },
  { name: '吕俊', department: '泌尿外科', phone: '138****0115' },
  { name: '施雨', department: '眼科', phone: '138****0116' },
  { name: '曹颖', department: '耳鼻喉科', phone: '138****0117' },
  { name: '袁浩', department: '康复科', phone: '138****0118' },
  { name: '邓琪', department: '检验科', phone: '138****0119' },
  { name: '潘晨', department: '影像科', phone: '138****0120' },
]

// 字符串哈希：让演示数据稳定可复现
const hashOf = (s: string) => {
  let a = 7
  for (const c of s) a = (a * 31 + c.charCodeAt(0)) % 997
  return a
}

// 生成本月演示预约：周日不开放；约 1/4 日期无预约；每时段人数由哈希决定
const buildMonthBookings = (roomId: string, capacity: number): DayBooking[] => {
  const templates = SLOT_TEMPLATES[roomId] ?? []
  const first = dayjs().startOf('month')
  const list: DayBooking[] = []
  for (let d = 1; d <= first.daysInMonth(); d++) {
    const date = first.date(d)
    if (date.day() === 0) continue
    const dh = hashOf(`${roomId}-${date.format('YYYY-MM-DD')}`)
    if (dh % 4 === 0) continue
    templates.forEach((t, ti) => {
      const sh = hashOf(`${roomId}-${d}-${ti}`)
      const count = Math.max(1, Math.round(((sh % 89) / 89) * capacity))
      const people: BookingPerson[] = Array.from({ length: count }, (_, i) => ({
        ...PERSON_POOL[(sh + i) % PERSON_POOL.length],
        checkedIn: (sh + i) % 3 !== 0,
      }))
      list.push({ date: date.format('YYYY-MM-DD'), ...t, capacity, people })
    })
  }
  return list
}

const ROOM_BOOKINGS: Record<string, DayBooking[]> = {
  lab1: buildMonthBookings('lab1', 12),
  lab2: buildMonthBookings('lab2', 16),
  lab3: [], // 维护中，暂停预约
}

const LabManage: React.FC = () => {
  const [rooms, setRooms] = useState<LabRoom[]>(LAB_ROOMS)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LabRoom | null>(null)
  const [form] = Form.useForm<LabFormValues>()
  const [keyword, setKeyword] = useState('')
  const [bookingRoom, setBookingRoom] = useState<LabRoom | null>(null)
  // 预约日历数据（可变更：关闭/恢复时段、取消人员）
  const [roomBookings, setRoomBookings] = useState<Record<string, DayBooking[]>>(ROOM_BOOKINGS)
  const [viewMonth, setViewMonth] = useState<Dayjs>(dayjs().startOf('month')) // 日历当前显示月份
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())            // 所选日期
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)       // 所选时段 key：date|start
  const [personKeyword, setPersonKeyword] = useState('')                       // 人员姓名查询
  const [personStatus, setPersonStatus] = useState<'all' | 'checked' | 'unchecked' | 'cancelled'>('all') // 签到状态过滤
  // 添加时段：行内编辑状态（不再使用弹窗）
  const [addingSlot, setAddingSlot] = useState(false)
  const [newStart, setNewStart] = useState<Dayjs | null>(null)
  const [newEnd, setNewEnd] = useState<Dayjs | null>(null)

  // 切换时段或日期时重置人员查询/过滤条件
  useEffect(() => {
    setPersonKeyword('')
    setPersonStatus('all')
  }, [selectedSlot, selectedDate])

  const openBooking = (room: LabRoom) => {
    setBookingRoom(room)
    setViewMonth(dayjs().startOf('month'))
    setSelectedDate(dayjs())
    setSelectedSlot(null)
  }
  const closeBooking = () => setBookingRoom(null)

  // 行内添加时段：点击“添加时段”后直接在列表末尾出现可编辑行
  const startAddSlot = () => {
    setNewStart(null)
    setNewEnd(null)
    setAddingSlot(true)
  }
  const confirmAddSlot = () => {
    if (!bookingRoom || !selectedDate) return
    const start = newStart ? dayjs(newStart).format('HH:mm') : ''
    const end = newEnd ? dayjs(newEnd).format('HH:mm') : ''
    if (!start || !end) {
      message.warning('请选择开始和结束时间')
      return
    }
    if (start >= end) {
      message.warning('结束时间需晚于开始时间')
      return
    }
    const date = selectedDate.format('YYYY-MM-DD')
    const key = `${date}|${start}`
    const exists = (roomBookings[bookingRoom.id] ?? []).some((b) => `${b.date}|${b.start}` === key)
    if (exists) {
      message.warning('该日期已存在相同时段的预约，请调整时间')
      return
    }
    const newSlot: DayBooking = {
      date, start, end, title: '', capacity: bookingRoom.capacity, people: [],
    }
    setRoomBookings((prev) => ({
      ...prev,
      [bookingRoom.id]: [...(prev[bookingRoom.id] ?? []), newSlot],
    }))
    message.success(`已添加时段：${start} - ${end}`)
    setAddingSlot(false)
  }
  // 复制前一天时段到所选日期
  const copyPrevDaySlots = () => {
    if (!bookingRoom) return
    const date = selectedDate.format('YYYY-MM-DD')
    const prevDate = selectedDate.subtract(1, 'day').format('YYYY-MM-DD')
    const prevSlots = (roomBookings[bookingRoom.id] ?? []).filter((b) => b.date === prevDate)
    if (prevSlots.length === 0) {
      message.warning('前一天暂无时段可复制')
      return
    }
    const newSlots: DayBooking[] = prevSlots.map((b) => ({ ...b, date, people: [] }))
    setRoomBookings((prev) => {
      const list = (prev[bookingRoom.id] ?? []).filter((b) => b.date !== date)
      return { ...prev, [bookingRoom.id]: [...list, ...newSlots] }
    })
    message.success('已复制前一天时段')
  }

  // 关闭/恢复时段预约：关闭后该时段不可预约，仅将未签到人员的状态置为已取消
  const toggleCloseSlot = (b: DayBooking, close: boolean) => {
    if (!bookingRoom) return
    setRoomBookings((prev) => {
      const list = prev[bookingRoom.id] ?? []
      const next = list.map((x) => {
        if (x.date === b.date && x.start === b.start) {
          return {
            ...x,
            closed: close,
            // 关闭时仅取消未签到人员；恢复时全部还原
            people: x.people.map((p) => ({ ...p, cancelled: close ? !p.checkedIn : false })),
          }
        }
        return x
      })
      return { ...prev, [bookingRoom.id]: next }
    })
    message.success(close ? '已暂停该时段预约，未签到人员已取消' : '已恢复该时段预约')
  }

  // 删除时段：仅当无人预约（活跃预约数为 0）时可删除
  const deleteSlot = (b: DayBooking) => {
    if (!bookingRoom) return
    const key = `${b.date}|${b.start}`
    setRoomBookings((prev) => ({
      ...prev,
      [bookingRoom.id]: (prev[bookingRoom.id] ?? []).filter(
        (x) => !(x.date === b.date && x.start === b.start),
      ),
    }))
    if (selectedSlot === key) setSelectedSlot(null)
    message.success('已删除该时段')
  }

  const openAdd = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      status: '开放',
      capacity: 10,
    })
    setFormOpen(true)
  }
  const openEdit = (room: LabRoom) => {
    setEditing(room)
    // 剔除 id/code/openPeriods 等表单无关字段（开放时段不在表单维护）
    const { id: _id, code: _code, openPeriods: _op, ...rest } = room
    void _id; void _code; void _op
    form.setFieldsValue(rest)
    setFormOpen(true)
  }
  const closeForm = () => setFormOpen(false)
  const handleSubmit = async () => {
    const values = await form.validateFields()
    // 开放时段不在表单维护：编辑时保留原值，新建时给默认时段以保证预约可用
    const openPeriods: OpenPeriod[] = editing
      ? (editing.openPeriods ?? [])
      : [{ start: '08:00', end: '21:00' }]
    if (editing) {
      setRooms((list) => list.map((r) => (r.id === editing.id ? { ...r, ...values, openPeriods } : r)))
      message.success('实训室已更新')
    } else {
      const id = `lab-${Date.now()}`
      setRooms((list) => [...list, { ...values, id, code: '', openPeriods }])
      message.success('实训室已添加')
    }
    setFormOpen(false)
  }

  const columns: ColumnsType<LabRoom> = [
    {
      title: '实训室',
      dataIndex: 'name',
      key: 'name',
      render: (_: unknown, r: LabRoom) => (
        <a onClick={() => openBooking(r)}>
          {r.code ? `${r.code} ` : ''}{r.name}
        </a>
      ),
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 120,
      render: (v: number) => `${v} 人`,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 160,
      render: (v?: string) => v || '—',
    },
    { title: '设备', dataIndex: 'devices', key: 'devices' },
    {
      title: '开放时段',
      dataIndex: 'openPeriods',
      key: 'openPeriods',
      width: 200,
      render: (_: unknown, r: LabRoom) => periodText(r),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: LabRoom['status']) => <Tag color={LAB_STATUS_COLOR[s]}>{s}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, r: LabRoom) => (
        <>
          <a onClick={() => openEdit(r)}>编辑</a>
          <span style={{ color: '#f0f0f0', margin: '0 8px' }}>|</span>
          <a onClick={() => openBooking(r)}>预约日历</a>
        </>
      ),
    },
  ]

  // 当前查看预约日历的实训室的时段数据
  const monthBookings = bookingRoom ? roomBookings[bookingRoom.id] ?? [] : []
  // 某日期的时段列表
  const bookingsOfDate = (d: Dayjs) => monthBookings.filter((b) => b.date === d.format('YYYY-MM-DD'))
  // 所选日期的时段列表 + 所选时段明细
  const daySlots = bookingsOfDate(selectedDate)
  const selectedBooking = daySlots.find((b) => `${b.date}|${b.start}` === selectedSlot) ?? null
  // 当天所有时段的人员（点击日期时展示“当天预约人员”；按 phone 去重，避免同一人预约多时段重复出现）
  const dayPeopleRaw = daySlots.flatMap((b) => b.people)
  const seenPhones = new Set<string>()
  const dayPeople = dayPeopleRaw.filter((p) => {
    if (seenPhones.has(p.phone)) return false
    seenPhones.add(p.phone)
    return true
  })
  // 人员来源：选中时段 → 该时段人员；否则（仅选中日期）→ 当天全部时段人员
  const personSource = selectedBooking ? selectedBooking.people : dayPeople
  // 按姓名 / 签到状态过滤的预约人员
  const personList = personSource.filter((p) => {
    const matchName = !personKeyword || p.name.includes(personKeyword)
    const matchStatus =
      personStatus === 'all' ||
      (personStatus === 'checked' && p.checkedIn && !p.cancelled) ||
      (personStatus === 'unchecked' && !p.checkedIn && !p.cancelled) ||
      (personStatus === 'cancelled' && !!p.cancelled)
    return matchName && matchStatus
  })
  // 月历网格：从显示月 1 号所在周的周一开始，共 42 格（6 行 x 7 列，周一为首列）
  const gridOffset = (viewMonth.day() + 6) % 7
  const firstCell = viewMonth.subtract(gridOffset, 'day')
  const calendarCells = Array.from({ length: 42 }, (_, i) => firstCell.add(i, 'day'))

  return (
    <Card bordered={false} bodyStyle={{ padding: '8px 24px 24px' }}>
      {/* 表格上方标题栏：左侧蓝色小竖条 + 实训室 + 添加按钮，右侧实训室名称搜索 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              width: 4,
              height: 16,
              background: '#1677ff',
              borderRadius: 2,
              marginRight: 8,
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginRight: 16 }}>实训室</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加</Button>
        </div>
        <Input.Search
          allowClear
          placeholder="实训室名称"
          style={{ width: 220 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={(v) => setKeyword(v)}
        />
      </div>

      <Table<LabRoom>
        rowKey="id"
        columns={columns}
        dataSource={keyword ? rooms.filter((r) => `${r.code}${r.name}`.includes(keyword)) : rooms}
        pagination={false}
      />

      {/* 预约日历抽屉：左侧月历，右侧所选日期的可预约时段与人员详情 */}
      <Drawer
        title={`预约日历 - ${bookingRoom ? `${bookingRoom.code} ${bookingRoom.name}` : ''}`}
        placement="right"
        width={1440}
        open={!!bookingRoom}
        onClose={closeBooking}
      >
        {bookingRoom && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* 左侧：月历 + 下方所选日期可预约时段（抽屉加宽 1/5 的额外宽度作用于此，保证日历“未开放”完整显示） */}
            <div style={{ width: 720, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 月历 */}
              <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Button size="small" type="text" icon={<LeftOutlined />} onClick={() => setViewMonth(viewMonth.subtract(1, 'month'))} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{viewMonth.format('YYYY 年 M 月')}</span>
                  <Button size="small" type="text" icon={<RightOutlined />} onClick={() => setViewMonth(viewMonth.add(1, 'month'))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                  {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 12, color: '#8c8c8c', padding: '4px 0' }}>{d}</div>
                  ))}
                  {calendarCells.map((d) => {
                    const inMonth = d.isSame(viewMonth, 'month')
                    const dayBookings = bookingsOfDate(d)
                    const count = dayBookings.length
                    const peopleCount = dayBookings.reduce((s, b) => s + b.people.filter((p) => !p.cancelled).length, 0)
                    const isSel = d.isSame(selectedDate, 'day')
                    const isToday = d.isSame(dayjs(), 'day')
                    return (
                      <button
                        key={d.format('YYYY-MM-DD')}
                        type="button"
                        onClick={() => { setSelectedDate(d); setSelectedSlot(null) }}
                        style={{
                          minHeight: 62,
                          textAlign: 'left',
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: isSel ? '2px solid #13c2c2' : '1px solid #f0f0f0',
                          background: isSel ? '#e6fffb' : inMonth ? '#fff' : '#fafafa',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: isToday || isSel ? 700 : 400, color: !inMonth ? '#c0c0c0' : isSel ? '#08979c' : '#1a1a1a' }}>
                          {d.date()}
                        </span>
                        {inMonth && (
                          count > 0 ? (
                            <span style={{ fontSize: 11, color: '#13c2c2', background: '#e6fffb', borderRadius: 4, padding: '1px 6px', alignSelf: 'flex-start' }}>
                              {peopleCount} 人
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#8c8c8c', background: '#f5f5f5', borderRadius: 4, padding: '1px 6px', alignSelf: 'flex-start' }}>
                              未开放
                            </span>
                          )
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 下方：所选日期可预约时段（带关闭/恢复预约按钮） */}
              <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                    {selectedDate.format('M 月 D 日')} · 可预约时段
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="small" type="primary" icon={<PlusOutlined />} onClick={startAddSlot} disabled={addingSlot}>添加时段</Button>
                    <Button size="small" onClick={copyPrevDaySlots} disabled={daySlots.length > 0}>复制前一天时段</Button>
                  </div>
                </div>

                {bookingRoom.status === '维护中' && (
                  <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 6, color: '#cf1322', fontSize: 13 }}>
                    该实训室维护中，暂停预约。
                  </div>
                )}

                {/* 时段卡片：时间段 / 已约人数÷容量 / 关闭预约按钮（不再展示项目中文名） */}
                {daySlots.length === 0 ? (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>当日暂无可预约时段</div>
                ) : (
                  daySlots.map((b) => {
                    const key = `${b.date}|${b.start}`
                    const isSel = key === selectedSlot
                    const closed = !!b.closed
                    const active = b.people.filter((p) => !p.cancelled).length
                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedSlot(isSel ? null : key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 16px',
                          marginBottom: 10,
                          borderRadius: 8,
                          border: isSel ? '1px solid #13c2c2' : '1px solid #f0f0f0',
                          background: closed ? '#f5f5f5' : isSel ? '#e6fffb' : '#fff',
                          cursor: 'pointer',
                          opacity: closed ? 0.75 : 1,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: closed ? '#8c8c8c' : '#1a1a1a' }}>{b.start} - {b.end}</span>
                        {closed && <Tag color="default">已暂停</Tag>}
                        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: closed ? '#8c8c8c' : '#13c2c2' }}>
                          {active}/{b.capacity}
                        </span>
                        {active === 0 && (
                          <Popconfirm
                            title="确定删除该时段？"
                            okText="删除"
                            okButtonProps={{ danger: true }}
                            cancelText="取消"
                            onConfirm={(e) => { e?.stopPropagation(); deleteSlot(b) }}
                            onCancel={(e) => { e?.stopPropagation() }}
                          >
                            <Button size="small" danger onClick={(e) => e.stopPropagation()}>删除</Button>
                          </Popconfirm>
                        )}
                        <Popconfirm
                          title={closed
                            ? '确定恢复该时段预约？'
                            : (active > 0
                                ? `该时段已有 ${active} 人预约，暂停后将取消未签到人员的预约，是否继续？`
                                : '该时段暂无人预约，确定暂停？')}
                          okText="继续"
                          cancelText="取消"
                          onConfirm={(e) => { e?.stopPropagation(); toggleCloseSlot(b, !closed) }}
                          onCancel={(e) => { e?.stopPropagation() }}
                        >
                          <Button
                            size="small"
                            danger={!closed}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {closed ? '恢复预约' : '暂停'}
                          </Button>
                        </Popconfirm>
                      </div>
                    )
                  })
                )}
                {addingSlot && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      marginBottom: 10,
                      borderRadius: 8,
                      border: '1px dashed #13c2c2',
                      background: '#e6fffb',
                    }}
                  >
                    <TimePicker format="HH:mm" minuteStep={5} value={newStart} onChange={setNewStart} placeholder="开始" />
                    <span style={{ color: '#8c8c8c' }}>至</span>
                    <TimePicker format="HH:mm" minuteStep={5} value={newEnd} onChange={setNewEnd} placeholder="结束" />
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <Button size="small" type="primary" onClick={confirmAddSlot}>确定</Button>
                      <Button size="small" onClick={() => setAddingSlot(false)}>取消</Button>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：预约人员详情（定格显示） */}
            <div style={{ flex: 1, minWidth: 0, border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, position: 'sticky', top: 0 }}>
              {personList.length > 0 ? (
                <>
                  <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
                    {selectedBooking
                      ? `预约人员详情（${selectedBooking.start} - ${selectedBooking.end}，${personList.length} 人）`
                      : `${selectedDate.format('M 月 D 日')} · 当天预约人员（${personList.length} 人）`}
                  </div>
                  {/* 人员姓名查询 + 签到状态过滤 */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <Input.Search
                      allowClear
                      placeholder="人员姓名"
                      style={{ width: 200 }}
                      value={personKeyword}
                      onChange={(e) => setPersonKeyword(e.target.value)}
                      onSearch={(v) => setPersonKeyword(v)}
                    />
                    <Select
                      value={personStatus}
                      style={{ width: 150 }}
                      onChange={(v) => setPersonStatus(v)}
                      options={[
                        { value: 'all', label: '全部签到状态' },
                        { value: 'checked', label: '已签到' },
                        { value: 'unchecked', label: '未签到' },
                        { value: 'cancelled', label: '已取消' },
                      ]}
                    />
                  </div>
                  <Table<BookingPerson>
                    rowKey={(p) => p.phone}
                    size="small"
                    pagination={false}
                    dataSource={personList}
                    columns={[
                      { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
                      { title: '科室', dataIndex: 'department', key: 'department', width: 120 },
                      { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140 },
                      {
                        title: '签到状态',
                        key: 'checkedIn',
                        width: 100,
                        render: (_: unknown, p: BookingPerson) =>
                          p.cancelled
                            ? <Tag color="red">已取消</Tag>
                            : <Tag color={p.checkedIn ? 'green' : 'default'}>{p.checkedIn ? '已签到' : '未签到'}</Tag>,
                      },
                    ]}
                  />
                </>
              ) : (
                <div style={{ padding: '64px 0', textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>
                  {selectedBooking ? '该时段暂无预约人员' : '该日暂无预约人员'}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* 添加 / 编辑 实训室抽屉 */}
      <Drawer
        title={editing ? '编辑实训室' : '添加实训室'}
        placement="right"
        width={520}
        open={formOpen}
        onClose={closeForm}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 17 }} style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            <Form.Item name="name" label="实训室名称" rules={[{ required: true, message: '请输入实训室名称' }]}>
              <Input placeholder="如 急救实训室" maxLength={30} />
            </Form.Item>
            <Form.Item name="remark" label="说明">
              <Input.TextArea rows={3} placeholder="实训室用途、注意事项等补充说明" maxLength={300} />
            </Form.Item>
            <Form.Item name="location" label="位置" rules={[{ required: true, message: '请输入位置' }]}>
              <Input placeholder="如 教学楼3层东侧" maxLength={50} />
            </Form.Item>
            <Form.Item name="capacity" label="容量（人）" rules={[{ required: true, message: '请输入容量' }]}>
              <InputNumber min={1} max={500} style={{ width: '100%' }} placeholder="请输入容量" />
            </Form.Item>
            <Form.Item name="devices" label="设备" rules={[{ required: true, message: '请输入设备清单' }]}>
              <Input.TextArea rows={2} placeholder="如 除颤仪、急救模型、监护仪" maxLength={200} />
            </Form.Item>
            <Form.Item name="bookingDuration" label="提前预约天数" rules={[{ required: true, message: '请输入提前预约天数' }]}>
              <InputNumber min={1} max={365} precision={0} style={{ width: '100%' }} placeholder="请输入提前预约天数" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select
                options={[
                  { value: '开放', label: '开放' },
                  { value: '维护中', label: '维护中' },
                  { value: '停用', label: '停用' },
                ]}
              />
            </Form.Item>
          </Form>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <Button type="primary" onClick={handleSubmit}>
              {editing ? '保存' : '确定'}
            </Button>
          </div>
        </div>
      </Drawer>
    </Card>
  )
}

export default LabManage
