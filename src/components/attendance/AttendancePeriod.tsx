import React, { useState, useEffect } from 'react'
import {
  Button,
  Drawer,
  Form,
  InputNumber,
  DatePicker,
  Radio,
  Table,
  Tag,
  message,
  Empty,
  Select,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { AttendanceYear, AttendancePeriod } from '../../types'

// 模拟已有年度数据
const mockYears: AttendanceYear[] = [
  {
    id: 'year1',
    year: 2026,
    monthLimit: 12,
    generateMode: 'natural',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
  {
    id: 'year2',
    year: 2025,
    monthLimit: 12,
    generateMode: 'manual',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
]

const AttendancePeriod: React.FC = () => {
  // 生成期间数据（放在 useState 之前，因为初始化 state 时需要调用）
  const generatePeriods = (year: AttendanceYear): AttendancePeriod[] => {
    const result: AttendancePeriod[] = []
    for (let month = 1; month <= year.monthLimit; month++) {
      const monthStr = month.toString().padStart(2, '0')
      // 判断是否已归档：2025年全年+2026年1-4月为已归档
      const isArchived = year.year === 2025 || (year.year === 2026 && month <= 4)
      const status = isArchived ? 'archived' : 'unarchived'
      if (year.generateMode === 'natural') {
        result.push({
          id: `${year.id}-${monthStr}`,
          attendanceYearId: year.id,
          year: year.year,
          month: month,
          startDate: `${year.year}-${monthStr}-01`,
          endDate: dayjs(`${year.year}-${monthStr}-01`).endOf('month').format('YYYY-MM-DD'),
          status,
        })
      } else {
        result.push({
          id: `${year.id}-${monthStr}`,
          attendanceYearId: year.id,
          year: year.year,
          month: month,
          startDate: '',
          endDate: '',
          status,
        })
      }
    }
    return result
  }

  const [selectedYear, setSelectedYear] = useState<AttendanceYear | null>(mockYears[0] || null)
  const [addYearDrawerVisible, setAddYearDrawerVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editPeriod, setEditPeriod] = useState<AttendancePeriod | null>(null)
  const [generateMode, setGenerateMode] = useState<'natural' | 'manual'>('natural')
  const [years, setYears] = useState<AttendanceYear[]>(mockYears)
  const [periods, setPeriods] = useState<AttendancePeriod[]>(mockYears[0] ? generatePeriods(mockYears[0]) : [])
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  // 新增年度抽屉打开时，重置表单并设置默认值
  const handleAddYear = () => {
    setAddYearDrawerVisible(true)
    form.resetFields()
    form.setFieldsValue({ generateMode: 'natural', monthLimit: 12 })
    setGenerateMode('natural')
  }

  // 监听生成方式变化，自动设置年度起止日期（手动模式）
  useEffect(() => {
    if (addYearDrawerVisible && generateMode === 'manual') {
      const yearValue = form.getFieldValue('year')
      if (yearValue) {
        form.setFieldsValue({
          startDate: dayjs(`${yearValue}-01-01`),
          endDate: dayjs(`${yearValue}-12-31`),
        })
      }
    }
  }, [generateMode, addYearDrawerVisible])

  // 提交新增年度
  const handleSubmitYear = async () => {
    try {
      const values = await form.validateFields()
      const newYear: AttendanceYear = {
        id: `year-${Date.now()}`,
        year: values.year,
        monthLimit: values.monthLimit || 12,
        generateMode: values.generateMode,
        startDate: values.startDate?.format('YYYY-MM-DD') || `${values.year}-01-01`,
        endDate: values.endDate?.format('YYYY-MM-DD') || `${values.year}-12-31`,
      }
      
      // 检查年份是否已存在
      if (years.some(y => y.year === values.year)) {
        message.error('该年度已存在')
        return
      }

      const updatedYears = [...years, newYear].sort((a, b) => b.year - a.year)
      setYears(updatedYears)
      // 自动选中新创建的年度
      setSelectedYear(newYear)
      setPeriods(generatePeriods(newYear))
      message.success('年度创建成功')
      setAddYearDrawerVisible(false)
      form.resetFields()
      setGenerateMode('natural')
    } catch (error) {
      console.error('表单验证失败', error)
    }
  }

  // 修改期间
  const handleEditPeriod = (period: AttendancePeriod) => {
    if (period.status === 'archived') {
      message.warning('已归档期间不可修改')
      return
    }
    setEditPeriod(period)
    // 处理空日期的情况
    const startDate = period.startDate ? dayjs(period.startDate) : null
    const endDate = period.endDate ? dayjs(period.endDate) : null
    editForm.setFieldsValue({
      startDate,
      endDate,
    })
    setEditModalVisible(true)
  }

  // 保存修改
  const handleSavePeriod = async () => {
    try {
      const values = await editForm.validateFields()
      
      // 检查连续性
      const periodIndex = periods.findIndex(p => p.id === editPeriod?.id)
      const prevPeriod = periods[periodIndex - 1]
      const nextPeriod = periods[periodIndex + 1]
      
      const newStart = values.startDate.format('YYYY-MM-DD')
      const newEnd = values.endDate.format('YYYY-MM-DD')

      if (prevPeriod) {
        const prevEnd = dayjs(prevPeriod.endDate).add(1, 'day').format('YYYY-MM-DD')
        if (newStart !== prevEnd) {
          message.error('起止日期与相邻期间不连续')
          return
        }
      }

      if (nextPeriod) {
        const nextStart = dayjs(nextPeriod.startDate).subtract(1, 'day').format('YYYY-MM-DD')
        if (newEnd !== nextStart) {
          message.error('起止日期与相邻期间不连续')
          return
        }
      }

      setPeriods(prev => prev.map(p => 
        p.id === editPeriod?.id 
          ? { ...p, startDate: newStart, endDate: newEnd }
          : p
      ))
      message.success('修改成功')
      setEditModalVisible(false)
      editForm.resetFields()
    } catch (error) {
      console.error('表单验证失败', error)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '期间名称',
      dataIndex: 'month',
      key: 'month',
      render: (month: number, record: AttendancePeriod) => `${record.year}年${month.toString().padStart(2, '0')}月`,
    },
    {
      title: '年度',
      dataIndex: 'year',
      key: 'year',
      width: 80,
    },
    {
      title: '月度',
      dataIndex: 'month',
      key: 'month',
      width: 60,
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => {
        const isNaturalMode = selectedYear?.generateMode === 'natural'
        return (
          <span className={isNaturalMode ? 'text-gray-400' : ''}>
            {date}
          </span>
        )
      },
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => {
        const isNaturalMode = selectedYear?.generateMode === 'natural'
        return (
          <span className={isNaturalMode ? 'text-gray-400' : ''}>
            {date}
          </span>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        status === 'archived' ? (
          <Tag color="default">
            已归档
          </Tag>
        ) : (
          <Tag color="blue">
            未归档
          </Tag>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: AttendancePeriod) => {
        // 自然月模式或已归档期间，修改按钮置灰
        const isDisabled = selectedYear?.generateMode === 'natural' || record.status === 'archived'
        return (
          <Button
            size="small"
            disabled={isDisabled}
            onClick={() => handleEditPeriod(record)}
            className={isDisabled ? '!bg-gray-100 !border-gray-300 !text-gray-400 !text-xs' : '!bg-blue-100 !border-blue-300 !text-blue-600 !font-medium hover:!bg-blue-200 !text-xs'}
          >
            修改
          </Button>
        )
      },
    },
  ]

  // 获取当前年份选项（当前年±5年）
  const currentYear = dayjs().year()
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map(year => ({
    label: year,
    value: year,
  }))

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题和操作栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-500 rounded"></div>
          <h2 className="text-lg font-semibold text-gray-800">考勤期间</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedYear?.id}
            onChange={(id) => {
              const year = years.find(y => y.id === id)
              if (year) {
                setSelectedYear(year)
                setPeriods(generatePeriods(year))
              }
            }}
            placeholder="选择年度"
            style={{ width: 140 }}
            options={years.map(y => ({ label: `${y.year}年`, value: y.id }))}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddYear}
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
          >
            新增年度
          </Button>
        </div>
      </div>

      {/* 期间表格 */}
      <div className="flex-1 border border-gray-200 rounded-lg flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          {selectedYear ? (
            <Table
              columns={columns}
              dataSource={periods}
              rowKey="id"
              pagination={false}
              bordered
              size="middle"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Empty description="暂无考勤期间数据，请点击上方「新增年度」按钮创建" />
            </div>
          )}
        </div>
      </div>

      {/* 新增年度抽屉 */}
      <Drawer
        title="新增考勤年度"
        open={addYearDrawerVisible}
        onClose={() => {
          setAddYearDrawerVisible(false)
          form.resetFields()
          setGenerateMode('natural')
        }}
        width={480}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setAddYearDrawerVisible(false)
              form.resetFields()
              setGenerateMode('natural')
            }}>
              取消
            </Button>
            <Button type="primary" onClick={handleSubmitYear}>
              确认生成
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            generateMode: 'natural',
            monthLimit: 12,
          }}
        >
          <Form.Item
            name="year"
            label="考勤年度"
            rules={[{ required: true, message: '请选择年份' }]}
          >
            <Select
              placeholder="请选择年份"
              options={yearOptions}
            />
          </Form.Item>

          <Form.Item
            name="generateMode"
            label="生成方式"
          >
            <Radio.Group onChange={(e) => setGenerateMode(e.target.value)}>
              <Radio value="natural">自然月</Radio>
              <Radio value="manual">手动添加</Radio>
            </Radio.Group>
          </Form.Item>

          {generateMode === 'manual' && (
            <>
              <Form.Item
                name="monthLimit"
                label="月度上限"
                rules={[{ required: true, message: '请输入月度上限' }]}
              >
                <InputNumber min={1} max={12} className="w-full" />
              </Form.Item>

              <Form.Item
                name="startDate"
                label="开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>

              <Form.Item
                name="endDate"
                label="结束日期"
                rules={[{ required: true, message: '请选择结束日期' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </>
          )}

          {generateMode === 'natural' && (
            <div className="text-gray-400 text-sm bg-gray-50 p-3 rounded">
              自然月模式下，起止日期将自动设置为 01/01 ~ 12/31
            </div>
          )}
        </Form>
      </Drawer>

      {/* 修改期间抽屉 */}
      <Drawer
        title="修改考勤期间"
        open={editModalVisible}
        onClose={() => {
          setEditModalVisible(false)
          editForm.resetFields()
        }}
        width={480}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setEditModalVisible(false)
              editForm.resetFields()
            }}>
              取消
            </Button>
            <Button type="primary" onClick={handleSavePeriod}>
              保存
            </Button>
          </div>
        }
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <div className="text-sm text-gray-500 mb-4">
            {editPeriod && `${editPeriod.year}年${editPeriod.month.toString().padStart(2, '0')}月`}
          </div>

          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker
              className="w-full"
              format="YYYY-MM-DD"
              picker="date"
              allowClear
              placeholder="请选择开始日期"
              disabledDate={(current) => {
                if (!editPeriod) return false
                const yearStart = dayjs(`${editPeriod.year}-01-01`).startOf('day')
                return current ? current.isBefore(yearStart, 'day') : false
              }}
            />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="结束日期"
            rules={[{ required: true, message: '请选择结束日期' }]}
          >
            <DatePicker
              className="w-full"
              format="YYYY-MM-DD"
              picker="date"
              allowClear
              placeholder="请选择结束日期"
              disabledDate={(current) => {
                if (!editPeriod) return false
                const yearEnd = dayjs(`${editPeriod.year}-12-31`).endOf('day')
                return current ? current.isAfter(yearEnd, 'day') : false
              }}
            />
          </Form.Item>

          <div className="text-red-500 text-sm">
            注意：起止日期必须在年度日期范围内，且不能重叠
          </div>
        </Form>
      </Drawer>
    </div>
  )
}

export default AttendancePeriod
