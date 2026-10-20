import React, { useState } from 'react'
import {
  Button,
  Input,
  Tree,
  Tag,
  Modal,
  Select,
  Space,
  message,
  Drawer,
  Checkbox,
} from 'antd'
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'

// 各机构科室数据
const deptDataByOrg = {
  org1: [
    { id: 'dept1', name: '信息科' },
    { id: 'dept2', name: '金测试排班管理单元' },
    { id: 'dept3', name: '肝胆科门诊' },
    { id: 'dept4', name: '眼科' },
    { id: 'dept5', name: '胸外科' },
  ],
  org2: [
    { id: 'dept6', name: '南院区急诊科' },
    { id: 'dept7', name: '南院区门诊部' },
    { id: 'dept8', name: '南院区住院部' },
  ],
  org3: [
    { id: 'dept9', name: '北院区内科' },
    { id: 'dept10', name: '北院区外科' },
  ],
}

// 机构选项
const orgOptions = [
  { label: '贵阳市XX医院总院区', value: 'org1' },
  { label: '贵阳市XX医院南院区', value: 'org2' },
  { label: '贵阳市XX医院北院区', value: 'org3' },
]

// 班次配置数据类型
interface ShiftConfig {
  id: string
  groupName: string
  workday: string[]
  weekend: string[]
  holiday: string[]
}

// 模拟班次配置数据
const mockShiftConfigs: ShiftConfig[] = [
  {
    id: '1',
    groupName: '金测试排班-护士组',
    workday: ['金测试自定义护士班次', '金测试医生护士混用班次'],
    weekend: ['金测试自定义护士班次'],
    holiday: ['金测试自定义班次'],
  },
  {
    id: '2',
    groupName: '金测试排班-医生组',
    workday: ['金测试医生护士混用班次', '金测试自定义护士班次', '金测试自定义班次'],
    weekend: ['金测试医生护士混用班次'],
    holiday: [],
  },
]

// 可选班次列表
const availableShifts = [
  '金测试自定义护士班次',
  '金测试医生护士混用班次',
  '金测试自定义班次',
  '白班',
  '夜班',
  '值班',
]

const ShiftConfigPage: React.FC = () => {
  const [shiftConfigs, setShiftConfigs] = useState<ShiftConfig[]>(mockShiftConfigs)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ShiftConfig | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editType, setEditType] = useState<'workday' | 'weekend' | 'holiday'>('workday')
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])

  // 左侧树相关状态
  const [selectedOrg, setSelectedOrg] = useState<string>('org1')
  const [selectedDeptKey, setSelectedDeptKey] = useState<string>('dept2')
  const [treeSearchText, setTreeSearchText] = useState('')

  // 获取当前机构下的科室数据
  const getCurrentDeptData = () => {
    const data = deptDataByOrg[selectedOrg as keyof typeof deptDataByOrg] || []
    if (treeSearchText) {
      return data.filter(dept => dept.name.toLowerCase().includes(treeSearchText.toLowerCase()))
    }
    return data
  }

  // 获取当前选中科室名称
  const getSelectedDeptName = () => {
    const deptData = getCurrentDeptData()
    const dept = deptData.find(d => d.id === selectedDeptKey)
    return dept ? dept.name : ''
  }

  // 处理编辑班次
  const handleEditShift = () => {
    setIsEditMode(true)
  }

  // 处理保存
  const handleSave = () => {
    setIsEditMode(false)
    message.success('保存成功')
  }

  // 处理取消编辑
  const handleCancelEdit = () => {
    setIsEditMode(false)
    setShiftConfigs(mockShiftConfigs)
  }

  // 打开编辑弹窗
  const openEditModal = (config: ShiftConfig, type: 'workday' | 'weekend' | 'holiday') => {
    setEditingConfig(config)
    setEditType(type)
    setSelectedShifts(config[type])
    setEditModalVisible(true)
  }

  // 处理班次选择变化
  const handleShiftChange = (values: string[]) => {
    setSelectedShifts(values)
  }

  // 保存班次配置
  const handleSaveShifts = () => {
    if (editingConfig) {
      setShiftConfigs(prev =>
        prev.map(item =>
          item.id === editingConfig.id
            ? { ...item, [editType]: selectedShifts }
            : item
        )
      )
      message.success('修改成功')
      setEditModalVisible(false)
    }
  }

  // 删除班次
  const handleDeleteShift = (configId: string, type: 'workday' | 'weekend' | 'holiday', shiftName: string) => {
    setShiftConfigs(prev =>
      prev.map(item =>
        item.id === configId
          ? { ...item, [type]: item[type].filter(s => s !== shiftName) }
          : item
      )
    )
  }

  // 添加班次
  const handleAddShift = (configId: string, type: 'workday' | 'weekend' | 'holiday') => {
    const config = shiftConfigs.find(c => c.id === configId)
    if (config) {
      openEditModal(config, type)
    }
  }

  return (
    <div className="flex gap-4">
      {/* 左侧考勤单元树 */}
      <div className="w-56 flex flex-col bg-white overflow-hidden shadow-sm h-[calc(100vh-180px)]">
        {/* 机构下拉框 */}
        <div className="p-2 border-b">
          <Select
            value={selectedOrg}
            onChange={(value) => {
              setSelectedOrg(value)
              const newDepts = deptDataByOrg[value as keyof typeof deptDataByOrg]
              if (newDepts && newDepts.length > 0) {
                setSelectedDeptKey(newDepts[0].id)
              }
            }}
            style={{ width: '100%' }}
            options={orgOptions}
            placeholder="请选择机构"
          />
        </div>

        {/* 搜索框 */}
        <div className="p-2">
          <Input
            placeholder="请输入考勤单元名称"
            value={treeSearchText}
            onChange={e => setTreeSearchText(e.target.value)}
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
          />
        </div>
        <div className="flex-1 overflow-auto p-2">
          <Tree
            treeData={getCurrentDeptData().map(dept => ({
              key: dept.id,
              title: dept.name,
            }))}
            selectedKeys={[selectedDeptKey]}
            onSelect={(keys) => {
              if (keys.length > 0) {
                setSelectedDeptKey(keys[0] as string)
              }
            }}
            blockNode
          />
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1">
        {/* 标题栏 */}
        <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">
            【{getSelectedDeptName()}】排班配置
          </h3>
          <div>
            {isEditMode ? (
              <Space>
                <Button onClick={handleCancelEdit}>取消</Button>
                <Button type="primary" className="!bg-blue-600" onClick={handleSave}>
                  保存
                </Button>
              </Space>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                className="!bg-blue-600"
                onClick={handleEditShift}
              >
                编辑班次
              </Button>
            )}
          </div>
        </div>

        {/* 配置表格 */}
        <div className="bg-white rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-700 w-48">分组</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">工作日</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 w-48">周末</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 w-48">节假日</th>
              </tr>
            </thead>
            <tbody>
              {shiftConfigs.map((config) => (
                <tr key={config.id} className="border-t">
                  <td className="px-4 py-4 align-top">
                    <span className="text-gray-800">{config.groupName}</span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {config.workday.map((shift, idx) => (
                        <Tag
                          key={idx}
                          color="blue"
                          className="px-3 py-1"
                          closable={isEditMode}
                          onClose={() => handleDeleteShift(config.id, 'workday', shift)}
                        >
                          {shift}
                        </Tag>
                      ))}
                      {isEditMode && (
                        <Button
                          type="dashed"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddShift(config.id, 'workday')}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {config.weekend.map((shift, idx) => (
                        <Tag
                          key={idx}
                          color="blue"
                          className="px-3 py-1"
                          closable={isEditMode}
                          onClose={() => handleDeleteShift(config.id, 'weekend', shift)}
                        >
                          {shift}
                        </Tag>
                      ))}
                      {isEditMode && (
                        <Button
                          type="dashed"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddShift(config.id, 'weekend')}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {config.holiday.map((shift, idx) => (
                        <Tag
                          key={idx}
                          color="blue"
                          className="px-3 py-1"
                          closable={isEditMode}
                          onClose={() => handleDeleteShift(config.id, 'holiday', shift)}
                        >
                          {shift}
                        </Tag>
                      ))}
                      {isEditMode && (
                        <Button
                          type="dashed"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddShift(config.id, 'holiday')}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 编辑班次抽屉 */}
      <Drawer
        title={`编辑${editType === 'workday' ? '工作日' : editType === 'weekend' ? '周末' : '节假日'}班次 - ${editingConfig?.groupName || ''}`}
        placement="right"
        width={400}
        open={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        footer={
          <div className="flex justify-end gap-2 py-2">
            <Button onClick={() => setEditModalVisible(false)}>取消</Button>
            <Button type="primary" className="!bg-blue-600" onClick={handleSaveShifts}>
              确定
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <div className="mb-3 text-gray-600 font-medium">选择班次：</div>
          <div className="space-y-2">
            {availableShifts.map((shift) => (
              <div key={shift} className="flex items-center">
                <Checkbox
                  checked={selectedShifts.includes(shift)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedShifts([...selectedShifts, shift])
                    } else {
                      setSelectedShifts(selectedShifts.filter(s => s !== shift))
                    }
                  }}
                >
                  {shift}
                </Checkbox>
              </div>
            ))}
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default ShiftConfigPage
