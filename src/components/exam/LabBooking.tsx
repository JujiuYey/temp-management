import React, { useMemo, useState } from 'react'
import { Badge, Button, DatePicker, Drawer, Empty, Input, Popconfirm, Select, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ScheduleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

// ===== 实训室数据模型 =====
interface OpenPeriod { start: string; end: string }
interface LabRoom {
  id: string
  code: string
  name: string
  location: string   // 位置
  capacity: number
  devices: string
  openPeriods: OpenPeriod[]
  status: '开放' | '维护中' | '停用'
}

// ===== 实训室 mock 数据 =====
const LAB_ROOMS: LabRoom[] = [
  { id: 'lab1', code: 'A-201', name: '急救实训室', location: '门诊楼 2 楼东侧', capacity: 12, devices: '除颤仪、急救模型、监护仪', openPeriods: [{ start: '08:00', end: '21:00' }], status: '开放' },
  { id: 'lab2', code: 'B-102', name: '基础技能室', location: '门诊楼 2 楼西侧', capacity: 16, devices: '气道模型、可视喉镜', openPeriods: [{ start: '08:00', end: '18:00' }], status: '开放' },
  { id: 'lab3', code: 'C-301', name: '护理实训室', location: '住院楼 3 楼护理示教区', capacity: 20, devices: '输液泵、护理模型', openPeriods: [{ start: '09:00', end: '21:00' }], status: '维护中' },
  { id: 'lab4', code: 'D-105', name: '模拟手术室', location: '手术楼 4 楼', capacity: 8, devices: '麻醉机、监护仪', openPeriods: [{ start: '08:00', end: '20:00' }], status: '开放' },
  { id: 'lab5', code: 'E-210', name: '康复实训室', location: '康复楼 2 楼', capacity: 10, devices: '康复器材、平衡仪', openPeriods: [{ start: '09:00', end: '17:00' }], status: '开放' },
  { id: 'lab6', code: 'F-118', name: '腔镜训练室', location: '住院楼 6 楼外科示教区', capacity: 6, devices: '腔镜模拟器', openPeriods: [{ start: '08:30', end: '18:00' }], status: '停用' },
]

const LAB_STATUS_COLOR: Record<LabRoom['status'], string> = { 开放: 'green', 维护中: 'red', 停用: 'default' }
const periodText = (room: LabRoom) => room.openPeriods.map((p) => `${p.start}-${p.end}`).join('、')

// 由开放时段派生 上午 / 下午 / 晚上 三段可预约时段（仅保留与开放区间重叠的段；界面仅展示时间，不显示“上午/下午/晚上”文字）
const DAY_SLOTS = [
  { key: 'morning', start: '08:00', end: '12:00' },
  { key: 'afternoon', start: '13:00', end: '17:00' },
  { key: 'evening', start: '18:00', end: '21:00' },
]
const overlap = (s: string, e: string, ps: string, pe: string) => s < pe && e > ps
const buildSlots = (room: LabRoom) =>
  DAY_SLOTS.filter((s) => room.openPeriods.some((p) => overlap(s.start, s.end, p.start, p.end)))

// 可预约日期：今天起 7 天
const BOOKING_DATES = Array.from({ length: 7 }, (_, i) => dayjs().add(i, 'day'))
const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

// 字符串哈希：让演示数据稳定可复现
const hashOf = (s: string) => {
  let a = 7
  for (const c of s) a = (a * 31 + c.charCodeAt(0)) % 997
  return a
}

// 初始化各时段已预约人数（基线，演示用；可能已约满）
const initBooked = (): Record<string, number> => {
  const m: Record<string, number> = {}
  LAB_ROOMS.forEach((r) => {
    const slots = buildSlots(r)
    BOOKING_DATES.forEach((d) => {
      const date = d.format('YYYY-MM-DD')
      slots.forEach((s) => {
        const base = hashOf(`${r.id}-${date}-${s.key}`) % (r.capacity + 1)
        m[`${r.id}|${date}|${s.key}`] = base
      })
    })
  })
  return m
}

// ===== 个人预约记录 =====
// 签到状态：待签到（未到签到时间/等待签到） / 已签到 / 未签到（超时未签到） / 已取消（自行取消预约）
type SignStatus = '待签到' | '已签到' | '未签到' | '已取消'

interface MyBooking {
  id: string
  roomName: string   // 实训室
  location: string   // 位置
  date: string       // 预约日期 YYYY-MM-DD
  timeRange: string  // 预约时间段，如 08:00-12:00
  createdAt: string  // 预约时间
  status: SignStatus // 签到状态
  signInAt?: string  // 签到时间
}

const SIGN_STATUS_COLOR: Record<SignStatus, string> = {
  待签到: 'blue',
  已签到: 'green',
  未签到: 'red',
  已取消: 'default',
}

// 个人预约记录演示数据（覆盖 待签到 / 已签到 / 未签到 状态；已取消 可经操作列「取消」产生）
const SEED_BOOKINGS: MyBooking[] = (() => {
  const d = (n: number) => dayjs().add(n, 'day').format('YYYY-MM-DD')
  return [
    {
      id: 'bk1', roomName: '基础技能室', location: '门诊楼 2 楼西侧',
      date: d(-1), timeRange: '13:00-17:00', createdAt: `${d(-3)} 09:12:40`,
      status: '已签到', signInAt: `${d(-1)} 13:02:15`,
    },
    {
      id: 'bk2', roomName: '急救实训室', location: '门诊楼 2 楼东侧',
      date: d(0), timeRange: '08:00-12:00', createdAt: `${d(-2)} 15:30:10`,
      status: '已签到', signInAt: `${d(0)} 08:05:42`,
    },
    {
      id: 'bk3', roomName: '模拟手术室', location: '手术楼 4 楼',
      date: d(1), timeRange: '08:00-12:00', createdAt: `${d(-1)} 10:20:00`,
      status: '待签到',
    },
    {
      id: 'bk4', roomName: '康复实训室', location: '康复楼 2 楼',
      date: d(-3), timeRange: '13:00-17:00', createdAt: `${d(-5)} 11:05:33`,
      status: '未签到',
    },
  ]
})()

const LabBooking: React.FC = () => {  const [bookingRoom, setBookingRoom] = useState<LabRoom | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(BOOKING_DATES[0].format('YYYY-MM-DD'))
  // 各时段已预约人数：key = roomId|date|slotKey
  const [booked, setBooked] = useState<Record<string, number>>(initBooked)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null) // 当前选中的时段
  // 过滤条件：实训室名称 + 状态
  const [nameKeyword, setNameKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | LabRoom['status']>('all')
  // 我的预约记录 + 记录抽屉
  const [myBookings, setMyBookings] = useState<MyBooking[]>(SEED_BOOKINGS)
  const [recordOpen, setRecordOpen] = useState(false)
  // 预约记录过滤条件：实训室名称 + 预约日期范围 + 签到状态
  const [recRoomKeyword, setRecRoomKeyword] = useState('')
  const [recDateRange, setRecDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [recStatus, setRecStatus] = useState<'all' | SignStatus>('all')
  const pendingSignCount = myBookings.filter((b) => b.status === '待签到').length

  // 按过滤条件筛选预约记录
  const filteredBookings = useMemo(
    () =>
      myBookings.filter((b) => {
        const kw = recRoomKeyword.trim()
        if (kw && !b.roomName.includes(kw)) return false
        if (recStatus !== 'all' && b.status !== recStatus) return false
        if (recDateRange && recDateRange[0] && recDateRange[1]) {
          const d = dayjs(b.date)
          if (d.isBefore(recDateRange[0], 'day') || d.isAfter(recDateRange[1], 'day')) return false
        }
        return true
      }),
    [myBookings, recRoomKeyword, recDateRange, recStatus],
  )

  const filteredRooms = useMemo(
    () =>
      LAB_ROOMS.filter((r) => {
        const matchName = !nameKeyword || r.name.includes(nameKeyword) || r.code.includes(nameKeyword)
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        return matchName && matchStatus
      }),
    [nameKeyword, statusFilter],
  )

  const openBooking = (room: LabRoom) => {
    setSelectedDate(BOOKING_DATES[0].format('YYYY-MM-DD'))
    setSelectedSlot(null)
    setBookingRoom(room)
  }
  const closeBooking = () => setBookingRoom(null)

  const slots = bookingRoom ? buildSlots(bookingRoom) : []
  // 某时段剩余名额
  const slotRemaining = (slotKey: string) => {
    if (!bookingRoom) return 0
    const key = `${bookingRoom.id}|${selectedDate}|${slotKey}`
    return Math.max(0, bookingRoom.capacity - (booked[key] ?? 0))
  }

  const handleSlotClick = (slotKey: string) => {
    if (!bookingRoom) return
    if (slotRemaining(slotKey) <= 0) return // 已约满，不可选
    setSelectedSlot((prev) => (prev === slotKey ? null : slotKey)) // 选中 / 取消选中
  }

  const handleConfirm = () => {
    if (!bookingRoom || !selectedSlot) return
    const slot = slots.find((s) => s.key === selectedSlot)
    if (!slot) return
    const key = `${bookingRoom.id}|${selectedDate}|${selectedSlot}`
    setBooked((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }))
    // 同步写入个人预约记录（初始为待签到）
    const rec: MyBooking = {
      id: `bk-${Date.now()}`,
      roomName: bookingRoom.name,
      location: bookingRoom.location,
      date: selectedDate,
      timeRange: `${slot.start}-${slot.end}`,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: '待签到',
    }
    setMyBookings((prev) => [rec, ...prev])
    message.success(`已预约：${bookingRoom.name} ${selectedDate} ${slot.start}-${slot.end}`)
    setSelectedSlot(null)
  }

  // 取消预约（仅待签到的记录可取消）：保留记录，签到状态改为已取消
  const handleCancelBooking = (b: MyBooking) => {
    setMyBookings((prev) =>
      prev.map((x) => (x.id === b.id ? { ...x, status: '已取消' } : x)),
    )
    message.success(`已取消预约：${b.roomName}（${b.date} ${b.timeRange}）`)
  }

  // 预约记录表格列
  const bookingColumns: ColumnsType<MyBooking> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_: unknown, __: MyBooking, idx: number) => idx + 1,
    },
    {
      title: '实训室',
      key: 'room',
      width: 140, // 一行可容纳 8 个字
      render: (_: unknown, b: MyBooking) => (
        <div>
          <div style={{ color: '#1a1a1a', fontWeight: 500, whiteSpace: 'nowrap' }}>{b.roomName}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{b.location}</div>
        </div>
      ),
    },
    {
      // 预约日期 + 周几 + 时间段：合并一列，分三行展示
      title: '预约日期',
      key: 'date',
      width: 150,
      render: (_: unknown, b: MyBooking) => (
        <div>
          <div style={{ color: 'rgba(0,0,0,0.85)' }}>{b.date}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>周{WEEK_CN[dayjs(b.date).day()]}</div>
          <div style={{ fontSize: 12, color: '#1677ff' }}>{b.timeRange}</div>
        </div>
      ),
    },
    {
      // 申请时间：日期一行、时刻一行
      title: '申请时间',
      key: 'createdAt',
      width: 130,
      render: (_: unknown, b: MyBooking) => (
        <div>
          <div style={{ color: 'rgba(0,0,0,0.85)' }}>{b.createdAt.slice(0, 10)}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{b.createdAt.slice(11)}</div>
        </div>
      ),
    },
    {
      title: '签到状态',
      key: 'status',
      width: 100,
      align: 'center',
      render: (_: unknown, b: MyBooking) => <Tag color={SIGN_STATUS_COLOR[b.status]}>{b.status}</Tag>,
    },
    {
      // 签到时间：日期一行、时刻一行
      title: '签到时间',
      key: 'signInAt',
      width: 130,
      render: (_: unknown, b: MyBooking) =>
        b.signInAt ? (
          <div>
            <div style={{ color: 'rgba(0,0,0,0.85)' }}>{b.signInAt.slice(0, 10)}</div>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{b.signInAt.slice(11)}</div>
          </div>
        ) : (
          <span style={{ color: 'rgba(0,0,0,0.35)' }}>—</span>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_: unknown, b: MyBooking) => {
        // 仅待签到的预约可取消；已签到 / 未签到 无操作
        if (b.status !== '待签到') return <span style={{ color: 'rgba(0,0,0,0.25)' }}>—</span>
        return (
          <Popconfirm
            title="取消预约"
            description={`确定取消「${b.roomName}」的预约吗？`}
            okText="确定"
            cancelText="再想想"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleCancelBooking(b)}
          >
            <a style={{ color: '#ff4d4f' }}>取消</a>
          </Popconfirm>
        )
      },
    },
  ]

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%' }}>
      {/* 标题 + 右上角过滤条件 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>实训室预约</div>
        <Space>
          <Input.Search
            allowClear
            placeholder="实训室名称"
            style={{ width: 200 }}
            value={nameKeyword}
            onChange={(e) => setNameKeyword(e.target.value)}
            onSearch={(v) => setNameKeyword(v)}
          />
          <Select
            value={statusFilter}
            style={{ width: 140 }}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { value: 'all', label: '全部状态' },
              { value: '开放', label: '开放' },
              { value: '维护中', label: '维护中' },
              { value: '停用', label: '停用' },
            ]}
          />
          <Badge count={pendingSignCount} size="small">
            <Button icon={<ScheduleOutlined />} onClick={() => setRecordOpen(true)}>
              预约记录
            </Button>
          </Badge>
        </Space>
      </div>

      {/* 实训室卡片：平铺展示（不再按科室分组） */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filteredRooms.map((r) => {
          const canBook = r.status === '开放'
          return (
            <div
              key={r.id}
              style={{
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #eef0f3',
                padding: 16,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{r.name}</span>
                <Tag color={LAB_STATUS_COLOR[r.status]}>{r.status}</Tag>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                编号 {r.code} · 容量 {r.capacity} 人
              </div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 10 }}>位置：{r.location}</div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 4 }}>开放时段：{periodText(r)}</div>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 4 }}>设备：{r.devices}</div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" disabled={!canBook} onClick={() => openBooking(r)}>
                  发起预约
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Drawer
        title={bookingRoom ? `预约 - ${bookingRoom.code} ${bookingRoom.name}` : ''}
        placement="right"
        width={460}
        open={!!bookingRoom}
        onClose={closeBooking}
        destroyOnClose
        styles={{ body: { padding: 16 } }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" disabled={!selectedSlot} onClick={handleConfirm}>
              确认预约
            </Button>
          </div>
        }
      >
        {bookingRoom && bookingRoom.status !== '开放' ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>
            该实训室{bookingRoom.status}，暂停预约。
          </div>
        ) : (
          bookingRoom && (
            <>
              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginBottom: 8 }}>选择预约日期</div>
              <Space wrap style={{ marginBottom: 24 }}>
                {BOOKING_DATES.map((d) => {
                  const v = d.format('YYYY-MM-DD')
                  const active = v === selectedDate
                  return (
                    <Button key={v} type={active ? 'primary' : 'default'} onClick={() => { setSelectedDate(v); setSelectedSlot(null) }}>
                      {d.format('M/D')}
                      <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>{WEEK_CN[d.day()]}</span>
                    </Button>
                  )
                })}
              </Space>

              <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginBottom: 8 }}>
                可预约时间段（余 / 总，点击选择）
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {slots.length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>
                    当日暂无可预约时段
                  </div>
                )}
                {slots.map((s) => {
                  const rem = slotRemaining(s.key)
                  const full = rem <= 0
                  const isSel = selectedSlot === s.key
                  return (
                    <div
                      key={s.key}
                      onClick={() => handleSlotClick(s.key)}
                      style={{
                        border: `1px solid ${isSel ? '#1677ff' : full ? '#f0f0f0' : '#d9d9d9'}`,
                        background: isSel ? '#e6f4ff' : full ? '#fafafa' : '#fff',
                        borderRadius: 8,
                        padding: '12px 14px',
                        cursor: full ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        opacity: full ? 0.6 : 1,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{s.start} - {s.end}</div>
                        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                          余 {rem} / 总 {bookingRoom.capacity}
                        </div>
                      </div>
                      <Tag color={isSel ? 'blue' : full ? 'default' : 'green'}>
                        {isSel ? '已选' : full ? '已约满' : '可预约'}
                      </Tag>
                    </div>
                  )
                })}
              </div>
            </>
          )
        )}
      </Drawer>

      {/* 我的预约记录抽屉：查看预约与签到状态 */}
      <Drawer
        title="我的预约记录"
        placement="right"
        width={1180}
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        styles={{ body: { padding: 16 } }}
      >
        {/* 过滤条件：实训室名称 + 预约日期范围 + 签到状态 */}
        <Space style={{ marginBottom: 12 }} wrap>
          <Input.Search
            allowClear
            placeholder="实训室名称"
            style={{ width: 200 }}
            value={recRoomKeyword}
            onChange={(e) => setRecRoomKeyword(e.target.value)}
            onSearch={(v) => setRecRoomKeyword(v)}
          />
          <DatePicker.RangePicker
            value={recDateRange}
            style={{ width: 260 }}
            placeholder={['预约开始日期', '预约结束日期']}
            onChange={(v) => setRecDateRange(v as [Dayjs | null, Dayjs | null] | null)}
          />
          <Select
            value={recStatus}
            style={{ width: 160 }}
            onChange={(v) => setRecStatus(v)}
            options={[
              { value: 'all', label: '全部状态' },
              { value: '待签到', label: '待签到' },
              { value: '已签到', label: '已签到' },
              { value: '未签到', label: '未签到' },
              { value: '已取消', label: '已取消' },
            ]}
          />
        </Space>
        <Table<MyBooking>
          columns={bookingColumns}
          dataSource={filteredBookings}
          rowKey="id"
          size="middle"
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条`, position: ['bottomLeft'] }}
          locale={{ emptyText: <Empty description="暂无预约记录" /> }}
        />
      </Drawer>
    </div>
  )
}

export default LabBooking
