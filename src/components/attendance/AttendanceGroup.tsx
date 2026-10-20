import React, { useState, useMemo } from 'react'
import {
  Button,
  Drawer,
  Form,
  Input,
  Radio,
  Checkbox,
  Table,
  TimePicker,
  InputNumber,
  Tabs,
  message,
  Space,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AttendanceGroup } from '../../types'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { TabPane } = Tabs

// 模拟考勤组数据
const mockAttendanceGroups: AttendanceGroup[] = [
  {
    id: 'group1',
    name: '灵活打卡组',
    checkIn: true,
    attendanceMethod: 'fixed',
    checkInMethod: ['location', 'wifi'],
    workDayStartTime: '08:30',
    workDayEndTime: '17:30',
    allowEarlyCheckIn: 30,
    allowEarlyCheckOut: 0,
    allowLateCheckOut: 30,
    lateThreshold: 15,
    seriousLateThreshold: 30,
    absentThreshold: 120,
    fullDayAbsentThreshold: 240,
    allowReplacementCount: 3,
    allowReplacementTypes: ['missing', 'late'],
    replacementTimeLimit: 3,
    memberCount: 45,
  },
  {
    id: 'group2',
    name: '固定打卡组',
    checkIn: true,
    attendanceMethod: 'fixed',
    checkInMethod: ['location'],
    workDayStartTime: '09:00',
    workDayEndTime: '18:00',
    restDayStartTime: '09:00',
    restDayEndTime: '12:00',
    allowEarlyCheckIn: 15,
    allowEarlyCheckOut: 0,
    allowLateCheckOut: 15,
    lateThreshold: 10,
    seriousLateThreshold: 30,
    absentThreshold: 60,
    fullDayAbsentThreshold: 120,
    allowReplacementCount: 2,
    allowReplacementTypes: ['missing'],
    replacementTimeLimit: 2,
    memberCount: 32,
  },
  {
    id: 'group3',
    name: '排班打卡组',
    checkIn: true,
    attendanceMethod: 'scheduling',
    checkInMethod: ['location'],
    allowEarlyCheckIn: 30,
    allowEarlyCheckOut: 0,
    allowLateCheckOut: 30,
    lateThreshold: 15,
    seriousLateThreshold: 30,
    absentThreshold: 90,
    fullDayAbsentThreshold: 180,
    earlyLeaveThreshold: 15,
    seriousEarlyLeaveThreshold: 30,
    earlyAbsentThreshold: 90,
    earlyFullDayAbsentThreshold: 180,
    allowReplacementCount: 3,
    allowReplacementTypes: ['missing', 'late', 'early'],
    replacementTimeLimit: 3,
    memberCount: 28,
  },
  {
    id: 'group4',
    name: '不打卡组',
    checkIn: false,
    attendanceMethod: 'scheduling',
    checkInMethod: [],
    memberCount: 15,
  },
]

const AttendanceGroupPage: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [activeTab, setActiveTab] = useState('basic')
  const [form] = Form.useForm()
  const [groups, setGroups] = useState<AttendanceGroup[]>(mockAttendanceGroups)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [editGroup, setEditGroup] = useState<AttendanceGroup | null>(null)

  // 筛选后的数据
  const filteredGroups = useMemo(() => {
    if (!searchText) return groups
    return groups.filter(g => g.name.toLowerCase().includes(searchText.toLowerCase()))
  }, [groups, searchText])

  // 打开新增抽屉
  const handleCreate = () => {
    setDrawerMode('create')
    setActiveTab('basic')
    setEditGroup(null)
    form.resetFields()
    form.setFieldsValue({
      checkIn: true,
      attendanceMethod: 'fixed',
      checkInMethod: ['location'],
      crossMidnight: false,
      allowEarlyCheckIn: 0,
      allowEarlyCheckOut: 0,
      allowLateCheckOut: 0,
      lateThreshold: 0,
      seriousLateThreshold: 0,
      absentThreshold: 0,
      fullDayAbsentThreshold: 0,
      earlyLeaveThreshold: 0,
      seriousEarlyLeaveThreshold: 0,
      earlyAbsentThreshold: 0,
      earlyFullDayAbsentThreshold: 0,
      allowReplacementCount: 0,
      replacementTimeLimit: 0,
    })
    setDrawerVisible(true)
  }

  // 打开修改抽屉
  const handleEdit = (group: AttendanceGroup) => {
    setDrawerMode('edit')
    setActiveTab('basic')
    setEditGroup(group)
    form.setFieldsValue({
      name: group.name,
      checkIn: group.checkIn,
      attendanceMethod: group.attendanceMethod,
      checkInMethod: group.checkInMethod,
      workDayStartTime: group.workDayStartTime ? dayjs(group.workDayStartTime, 'HH:mm') : undefined,
      workDayEndTime: group.workDayEndTime ? dayjs(group.workDayEndTime, 'HH:mm') : undefined,
      restDayStartTime: group.restDayStartTime ? dayjs(group.restDayStartTime, 'HH:mm') : undefined,
      restDayEndTime: group.restDayEndTime ? dayjs(group.restDayEndTime, 'HH:mm') : undefined,
      holidayStartTime: group.holidayStartTime ? dayjs(group.holidayStartTime, 'HH:mm') : undefined,
      holidayEndTime: group.holidayEndTime ? dayjs(group.holidayEndTime, 'HH:mm') : undefined,
      allowEarlyCheckIn: group.allowEarlyCheckIn || 0,
      allowEarlyCheckOut: group.allowEarlyCheckOut || 0,
      allowLateCheckOut: group.allowLateCheckOut || 0,
      lateThreshold: group.lateThreshold || 0,
      seriousLateThreshold: group.seriousLateThreshold || 0,
      absentThreshold: group.absentThreshold || 0,
      fullDayAbsentThreshold: group.fullDayAbsentThreshold || 0,
      earlyLeaveThreshold: group.earlyLeaveThreshold || 0,
      seriousEarlyLeaveThreshold: group.seriousEarlyLeaveThreshold || 0,
      earlyAbsentThreshold: group.earlyAbsentThreshold || 0,
      earlyFullDayAbsentThreshold: group.earlyFullDayAbsentThreshold || 0,
      allowReplacementCount: group.allowReplacementCount || 0,
      allowReplacementTypes: group.allowReplacementTypes || [],
      replacementTimeLimit: group.replacementTimeLimit || 0,
    })
    setDrawerVisible(true)
  }

  // 删除考勤组
  const handleDelete = (group: AttendanceGroup) => {
    if (group.memberCount > 0) {
      message.warning('请先移除所有成员')
      return
    }
    setGroups(groups.filter(g => g.id !== group.id))
    message.success('删除成功')
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (drawerMode === 'create') {
        const newGroup: AttendanceGroup = {
          id: `group${Date.now()}`,
          name: values.name,
          checkIn: values.checkIn,
          attendanceMethod: values.attendanceMethod || 'fixed',
          checkInMethod: values.checkInMethod || [],
          workDayStartTime: values.workDayStartTime?.format('HH:mm'),
          workDayEndTime: values.workDayEndTime?.format('HH:mm'),
          restDayStartTime: values.restDayStartTime?.format('HH:mm'),
          restDayEndTime: values.restDayEndTime?.format('HH:mm'),
          holidayStartTime: values.holidayStartTime?.format('HH:mm'),
          holidayEndTime: values.holidayEndTime?.format('HH:mm'),
          allowEarlyCheckIn: values.allowEarlyCheckIn || 0,
          allowEarlyCheckOut: values.allowEarlyCheckOut || 0,
          allowLateCheckOut: values.allowLateCheckOut || 0,
          lateThreshold: values.lateThreshold || 0,
          seriousLateThreshold: values.seriousLateThreshold || 0,
          absentThreshold: values.absentThreshold || 0,
          fullDayAbsentThreshold: values.fullDayAbsentThreshold || 0,
          earlyLeaveThreshold: values.earlyLeaveThreshold || 0,
          seriousEarlyLeaveThreshold: values.seriousEarlyLeaveThreshold || 0,
          earlyAbsentThreshold: values.earlyAbsentThreshold || 0,
          earlyFullDayAbsentThreshold: values.earlyFullDayAbsentThreshold || 0,
          allowReplacementCount: values.allowReplacementCount || 0,
          allowReplacementTypes: values.allowReplacementTypes || [],
          replacementTimeLimit: values.replacementTimeLimit || 0,
          memberCount: 0,
        }
        setGroups([...groups, newGroup])
        message.success('新增成功')
      } else {
        setGroups(groups.map(g => 
          g.id === editGroup?.id 
            ? {
                ...g,
                name: values.name,
                checkIn: values.checkIn,
                attendanceMethod: values.attendanceMethod || 'fixed',
                checkInMethod: values.checkInMethod || [],
                workDayStartTime: values.workDayStartTime?.format('HH:mm'),
                workDayEndTime: values.workDayEndTime?.format('HH:mm'),
                restDayStartTime: values.restDayStartTime?.format('HH:mm'),
                restDayEndTime: values.restDayEndTime?.format('HH:mm'),
                holidayStartTime: values.holidayStartTime?.format('HH:mm'),
                holidayEndTime: values.holidayEndTime?.format('HH:mm'),
                allowEarlyCheckIn: values.allowEarlyCheckIn || 0,
                allowEarlyCheckOut: values.allowEarlyCheckOut || 0,
                allowLateCheckOut: values.allowLateCheckOut || 0,
                lateThreshold: values.lateThreshold || 0,
                seriousLateThreshold: values.seriousLateThreshold || 0,
                absentThreshold: values.absentThreshold || 0,
                fullDayAbsentThreshold: values.fullDayAbsentThreshold || 0,
                earlyLeaveThreshold: values.earlyLeaveThreshold || 0,
                seriousEarlyLeaveThreshold: values.seriousEarlyLeaveThreshold || 0,
                earlyAbsentThreshold: values.earlyAbsentThreshold || 0,
                earlyFullDayAbsentThreshold: values.earlyFullDayAbsentThreshold || 0,
                allowReplacementCount: values.allowReplacementCount || 0,
                allowReplacementTypes: values.allowReplacementTypes || [],
                replacementTimeLimit: values.replacementTimeLimit || 0,
              }
            : g
        ))
        message.success('修改成功')
      }
      
      setDrawerVisible(false)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error('表单验证失败', error)
    }
  }

  // 表格列定义
  const columns: ColumnsType<AttendanceGroup> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '考勤组名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '是否打卡',
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 100,
      render: (checkIn: boolean) => (
        <span className={checkIn ? 'text-green-600' : 'text-gray-400'}>
          {checkIn ? '是' : '否'}
        </span>
      ),
    },
    {
      title: '考勤方式',
      dataIndex: 'attendanceMethod',
      key: 'attendanceMethod',
      width: 120,
      render: (method: string) => (
        method === 'fixed' ? '固定打卡' : '排班表打卡'
      ),
    },
    {
      title: '打卡方式',
      dataIndex: 'checkInMethod',
      key: 'checkInMethod',
      width: 180,
      render: (methods: string[]) => {
        if (!methods || methods.length === 0) return '-'
        return methods.map(m => m === 'location' ? '地点打卡' : 'WIFI打卡').join('、')
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: unknown, record: AttendanceGroup) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="!text-blue-600 !border-blue-300 hover:!bg-blue-50"
          >
            修改
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={record.memberCount > 0}
            title={record.memberCount > 0 ? '请先移除所有成员' : '删除'}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* 表格区域 */}
      <div className="flex-1 overflow-auto p-3">
        {/* 工具栏 */}
        <div className="flex items-center justify-between mb-3">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            style={{ height: 32 }}
            className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600"
          >
            新增考勤组
          </Button>
          <Space size="small">
            <Input
              placeholder="搜索考勤组名称"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              style={{ width: 200, height: 32 }}
            />
            <Button type="primary" style={{ height: 32 }}>
              查询
            </Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={filteredGroups}
          rowKey="id"
          pagination={{
            pageSize: 20,
            defaultCurrent: 1,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => `共 ${total} 条`,
            position: ['bottomLeft'],
          }}
          size="middle"
          locale={{ emptyText: '暂无数据' }}
        />
      </div>

      {/* 新增/修改抽屉 */}
      <Drawer
        title={drawerMode === 'create' ? '新增考勤组' : `修改考勤组 - ${editGroup?.name || ''}`}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={600}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              保存
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* Tab1: 基本信息 */}
            <TabPane tab="基本信息" key="basic">
              <Form.Item
                name="name"
                label={<span className="font-bold">考勤组名称</span>}
                rules={[{ required: true, message: '请输入考勤组名称' }]}
              >
                <Input placeholder="请输入考勤组名称" style={{ height: 32 }} />
              </Form.Item>

              <Form.Item name="checkIn" label={<span className="font-bold">是否打卡</span>}>
                <Radio.Group>
                  <Radio value={true}>是</Radio>
                  <Radio value={false}>否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.checkIn !== curr.checkIn}
              >
                {({ getFieldValue }) =>
                  getFieldValue('checkIn') !== false ? (
                    <>
                      <Form.Item name="attendanceMethod" label={<span className="font-bold">考勤方式</span>}>
                        <Radio.Group>
                          <Radio value="fixed">固定打卡</Radio>
                          <Radio value="scheduling">排班表打卡</Radio>
                        </Radio.Group>
                      </Form.Item>

                      <Form.Item name="checkInMethod" label={<span className="font-bold">打卡方式</span>}>
                        <Checkbox.Group options={[
                          { label: '地点打卡', value: 'location' },
                          { label: 'WIFI打卡', value: 'wifi' },
                          { label: '考勤机打卡', value: 'machine' },
                        ]} />
                      </Form.Item>

                      <Form.Item name="outDoorCheckIn" label={<span className="font-bold">外出打卡</span>}>
                        <Radio.Group>
                          <Radio value="none">无需打卡</Radio>
                          <Radio value="required">需上下班打卡</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </>
                  ) : null
                }
              </Form.Item>
            </TabPane>

            {/* Tab2: 固定打卡时间 */}
            <TabPane
              tab="固定打卡时间"
              key="time"
            >
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.checkIn !== curr.checkIn || prev.attendanceMethod !== curr.attendanceMethod}>
                {({ getFieldValue }) => {
                  const checkIn = getFieldValue('checkIn')
                  const isFixed = getFieldValue('attendanceMethod') === 'fixed'
                  
                  if (checkIn === false) {
                    return (
                      <div className="text-gray-400 text-center py-8">
                        打卡已关闭，无需配置固定打卡时间
                      </div>
                    )
                  }
                  
                  if (!isFixed) {
                    return (
                      <div className="text-gray-400 text-center py-8">
                        非固定打卡，无需配置固定打卡时间
                      </div>
                    )
                  }
                  
                  return (
                    <div>
                      {/* 工作日 */}
                      <div className="mb-4">
                        <div className="font-bold text-gray-700 mb-3">工作日</div>
                        <div className="flex gap-4">
                          <Form.Item name="workDayStartTime" label={<span className="font-bold">上班打卡时间</span>} className="!mb-0">
                            <TimePicker format="HH:mm" minuteStep={5} placeholder="上班时间" style={{ width: 140, height: 32 }} />
                          </Form.Item>
                          <Form.Item name="workDayEndTime" label={<span className="font-bold">下班打卡时间</span>} className="!mb-0">
                            <TimePicker format="HH:mm" minuteStep={5} placeholder="下班时间" style={{ width: 140, height: 32 }} />
                          </Form.Item>
                        </div>
                      </div>

                      {/* 休息日 */}
                      <div className="mb-4">
                        <div className="font-bold text-gray-700 mb-3">休息日</div>
                        <div className="flex gap-4">
                          <Form.Item name="restDayStartTime" label={<span className="font-bold">上班打卡时间</span>} className="!mb-0">
                            <TimePicker format="HH:mm" minuteStep={5} placeholder="上班时间" style={{ width: 140, height: 32 }} />
                          </Form.Item>
                          <Form.Item name="restDayEndTime" label={<span className="font-bold">下班打卡时间</span>} className="!mb-0">
                            <TimePicker format="HH:mm" minuteStep={5} placeholder="下班时间" style={{ width: 140, height: 32 }} />
                          </Form.Item>
                        </div>
                      </div>

                      {/* 节假日 */}
                      <div>
                        <div className="font-bold text-gray-700 mb-3">节假日</div>
                        <div className="flex gap-4">
                          <Form.Item name="holidayStartTime" label={<span className="font-bold">上班打卡时间</span>} className="!mb-0">
                            <TimePicker format="HH:mm" minuteStep={5} placeholder="上班时间" style={{ width: 140, height: 32 }} />
                          </Form.Item>
                          <Form.Item name="holidayEndTime" label={<span className="font-bold">下班打卡时间</span>} className="!mb-0">
                            <TimePicker format="HH:mm" minuteStep={5} placeholder="下班时间" style={{ width: 140, height: 32 }} />
                          </Form.Item>
                        </div>
                      </div>
                    </div>
                  )
                }}
              </Form.Item>
            </TabPane>

            {/* Tab3: 打卡容差 */}
            <TabPane tab="打卡容差" key="tolerance">
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.checkIn !== curr.checkIn}>
                {({ getFieldValue }) => {
                  const checkIn = getFieldValue('checkIn')
                  
                  if (checkIn === false) {
                    return (
                      <div className="text-gray-400 text-center py-8">
                        打卡已关闭，无需配置打卡容差
                      </div>
                    )
                  }
                  
                  return (
                      <div className="space-y-4">
                      {/* 打卡容差设置 */}
                      <div className="mb-4">
                        <div className="font-bold text-gray-700 mb-2">打卡规则</div>
                        <Form.Item name="allowEarlyCheckIn" className="!mb-3">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">可提前</span>
                            <InputNumber min={0} max={120} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟上班打卡</span>
                          </div>
                        </Form.Item>
                        <Form.Item name="allowEarlyCheckOut" className="!mb-3">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">可提前</span>
                            <InputNumber min={0} max={120} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟下班打卡</span>
                          </div>
                        </Form.Item>
                        <Form.Item name="allowLateCheckOut" className="!mb-0">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">可延后</span>
                            <InputNumber min={0} max={120} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟下班打卡</span>
                          </div>
                        </Form.Item>
                      </div>

                      {/* 异常判定 - 上班迟到 */}
                      <div className="mb-4">
                        <div className="font-bold text-gray-700 mb-2">上班打卡异常判定</div>
                        <Form.Item name="lateThreshold" className="!mb-3">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">晚于</span>
                            <InputNumber min={0} max={120} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟记为迟到</span>
                          </div>
                        </Form.Item>
                        <Form.Item name="seriousLateThreshold" className="!mb-3">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">晚于</span>
                            <InputNumber min={0} max={120} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟记为严重迟到</span>
                          </div>
                        </Form.Item>
                        <Form.Item name="absentThreshold" className="!mb-3">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">晚于</span>
                            <InputNumber min={0} max={480} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟记为半天缺卡</span>
                          </div>
                        </Form.Item>
                        <Form.Item name="fullDayAbsentThreshold" className="!mb-0">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">晚于</span>
                            <InputNumber min={0} max={480} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟记为一天缺卡</span>
                          </div>
                        </Form.Item>
                      </div>

                      {/* 异常判定 - 早退 */}
                      <div>
                        <div className="font-bold text-gray-700 mb-2">下班打卡异常判定</div>
                        <Form.Item name="earlyLeaveThreshold" className="!mb-3">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">早于</span>
                            <InputNumber min={0} max={120} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟记为早退</span>
                          </div>
                        </Form.Item>
                        <Form.Item name="seriousEarlyLeaveThreshold" className="!mb-3">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">早于</span>
                            <InputNumber min={0} max={120} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟记为严重早退</span>
                          </div>
                        </Form.Item>
                        <Form.Item name="earlyAbsentThreshold" className="!mb-3">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">早于</span>
                            <InputNumber min={0} max={480} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟记为半天缺卡</span>
                          </div>
                        </Form.Item>
                        <Form.Item name="earlyFullDayAbsentThreshold" className="!mb-0">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">早于</span>
                            <InputNumber min={0} max={480} placeholder="0" style={{ width: 80, height: 32 }} />
                            <span>分钟记为一天缺卡</span>
                          </div>
                        </Form.Item>
                      </div>
                    </div>
                  )
                }}
              </Form.Item>
            </TabPane>

            {/* Tab4: 补卡 */}
            <TabPane
              tab="补卡"
              key="replacement"
            >
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.checkIn !== curr.checkIn}>
                {({ getFieldValue }) => {
                  const checkIn = getFieldValue('checkIn')
                  
                  if (checkIn === false) {
                    return (
                      <div className="text-gray-400 text-center py-8">
                        打卡已关闭，无需配置补卡规则
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-4">
                      {/* 允许补卡类型 */}
                      <div className="mb-4">
                        <div className="font-bold text-gray-700 mb-3">允许补卡类型</div>
                        <Form.Item name="allowReplacementTypes" label="" className="!mb-0">
                          <Checkbox.Group options={[
                            { label: '缺卡', value: 'missing' },
                            { label: '迟到', value: 'late' },
                            { label: '早退', value: 'early' },
                          ]} />
                        </Form.Item>
                      </div>

                      {/* 补卡规则 */}
                      <div className="mb-4">
                        <div className="font-bold text-gray-700 mb-3">补卡规则</div>
                        <div className="flex gap-4">
                          <Form.Item name="allowReplacementCount" label={<span className="font-bold">允许补卡次数</span>} className="!mb-0">
                            <InputNumber min={0} max={10} placeholder="0" style={{ width: 200, height: 32 }} />
                          </Form.Item>
                          <Form.Item name="replacementTimeLimit" label={<span className="font-bold">限制补卡时间（天）</span>} className="!mb-0">
                            <InputNumber min={0} max={30} placeholder="0" style={{ width: 200, height: 32 }} />
                          </Form.Item>
                        </div>
                      </div>
                    </div>
                  )
                }}
              </Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </Drawer>
    </div>
  )
}

export default AttendanceGroupPage
