import React, { useState, useMemo } from 'react'
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Table,
  Space,
  message,
} from 'antd'
import type { AttendanceUnit, Employee } from '../../types'

// 模拟机构数据（固定的医院结构）
const mockOrganizations = [
  { id: 'org1', name: '贵阳市xx医院总院区', parentId: '' },
  { id: 'org2', name: '贵阳市xx医院南院区', parentId: '' },
  { id: 'org3', name: '贵阳市xx医院北院区', parentId: '' },
]

// 模拟员工数据
const mockEmployees: Employee[] = [
  { id: 'emp1', name: '张三', code: 'E001', organizationId: 'org1' },
  { id: 'emp2', name: '李四', code: 'E002', organizationId: 'org1' },
  { id: 'emp3', name: '王五', code: 'E003', organizationId: 'org2' },
  { id: 'emp4', name: '赵六', code: 'E004', organizationId: 'org3' },
  { id: 'emp5', name: '钱七', code: 'E005', organizationId: 'org1' },
]

// 模拟考勤单元数据
const mockAttendanceUnits: AttendanceUnit[] = [
  // 贵阳市xx医院总院区 - org1 (15个科室)
  { id: 'unit1', organizationId: 'org1', departmentId: 'dept1', departmentCode: 'D001', departmentName: '内科', attendanceOfficerId: 'emp1', attendanceOfficerName: '张三', attendanceOfficerCode: 'E001' },
  { id: 'unit2', organizationId: 'org1', departmentId: 'dept2', departmentCode: 'D002', departmentName: '外科', attendanceOfficerId: 'emp2', attendanceOfficerName: '李四', attendanceOfficerCode: 'E002' },
  { id: 'unit3', organizationId: 'org1', departmentId: 'dept3', departmentCode: 'D003', departmentName: '儿科', attendanceOfficerId: 'emp5', attendanceOfficerName: '钱七', attendanceOfficerCode: 'E005' },
  { id: 'unit4', organizationId: 'org1', departmentId: 'dept4', departmentCode: 'D004', departmentName: '急诊科', attendanceOfficerId: 'emp3', attendanceOfficerName: '王五', attendanceOfficerCode: 'E003' },
  { id: 'unit5', organizationId: 'org1', departmentId: 'dept5', departmentCode: 'D005', departmentName: '骨科', attendanceOfficerId: 'emp1', attendanceOfficerName: '张三', attendanceOfficerCode: 'E001' },
  { id: 'unit6', organizationId: 'org1', departmentId: 'dept6', departmentCode: 'D006', departmentName: '神经科', attendanceOfficerId: 'emp2', attendanceOfficerName: '李四', attendanceOfficerCode: 'E002' },
  { id: 'unit7', organizationId: 'org1', departmentId: 'dept7', departmentCode: 'D007', departmentName: '眼科', attendanceOfficerId: 'emp5', attendanceOfficerName: '钱七', attendanceOfficerCode: 'E005' },
  { id: 'unit8', organizationId: 'org1', departmentId: 'dept8', departmentCode: 'D008', departmentName: '耳鼻喉科', attendanceOfficerId: 'emp3', attendanceOfficerName: '王五', attendanceOfficerCode: 'E003' },
  { id: 'unit9', organizationId: 'org1', departmentId: 'dept9', departmentCode: 'D009', departmentName: '皮肤科', attendanceOfficerId: 'emp1', attendanceOfficerName: '张三', attendanceOfficerCode: 'E001' },
  { id: 'unit10', organizationId: 'org1', departmentId: 'dept10', departmentCode: 'D010', departmentName: '泌尿科', attendanceOfficerId: 'emp2', attendanceOfficerName: '李四', attendanceOfficerCode: 'E002' },
  { id: 'unit11', organizationId: 'org1', departmentId: 'dept11', departmentCode: 'D011', departmentName: '妇科', attendanceOfficerId: 'emp5', attendanceOfficerName: '钱七', attendanceOfficerCode: 'E005' },
  { id: 'unit12', organizationId: 'org1', departmentId: 'dept12', departmentCode: 'D012', departmentName: '产科', attendanceOfficerId: 'emp3', attendanceOfficerName: '王五', attendanceOfficerCode: 'E003' },
  { id: 'unit13', organizationId: 'org1', departmentId: 'dept13', departmentCode: 'D013', departmentName: '麻醉科', attendanceOfficerId: 'emp1', attendanceOfficerName: '张三', attendanceOfficerCode: 'E001' },
  { id: 'unit14', organizationId: 'org1', departmentId: 'dept14', departmentCode: 'D014', departmentName: '放射科', attendanceOfficerId: 'emp2', attendanceOfficerName: '李四', attendanceOfficerCode: 'E002' },
  { id: 'unit15', organizationId: 'org1', departmentId: 'dept15', departmentCode: 'D015', departmentName: '检验科', attendanceOfficerId: 'emp5', attendanceOfficerName: '钱七', attendanceOfficerCode: 'E005' },

  // 贵阳市xx医院南院区 - org2 (18个科室)
  { id: 'unit16', organizationId: 'org2', departmentId: 'dept16', departmentCode: 'N001', departmentName: 'ICU', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit17', organizationId: 'org2', departmentId: 'dept17', departmentCode: 'N002', departmentName: '心血管科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit18', organizationId: 'org2', departmentId: 'dept18', departmentCode: 'N003', departmentName: '呼吸科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit19', organizationId: 'org2', departmentId: 'dept19', departmentCode: 'N004', departmentName: '消化科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit20', organizationId: 'org2', departmentId: 'dept20', departmentCode: 'N005', departmentName: '内分泌科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit21', organizationId: 'org2', departmentId: 'dept21', departmentCode: 'N006', departmentName: '肿瘤科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit22', organizationId: 'org2', departmentId: 'dept22', departmentCode: 'N007', departmentName: '康复科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit23', organizationId: 'org2', departmentId: 'dept23', departmentCode: 'N008', departmentName: '中医科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit24', organizationId: 'org2', departmentId: 'dept24', departmentCode: 'N009', departmentName: '精神科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit25', organizationId: 'org2', departmentId: 'dept25', departmentCode: 'N010', departmentName: '感染科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit26', organizationId: 'org2', departmentId: 'dept26', departmentCode: 'N011', departmentName: '血液科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit27', organizationId: 'org2', departmentId: 'dept27', departmentCode: 'N012', departmentName: '肾内科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit28', organizationId: 'org2', departmentId: 'dept28', departmentCode: 'N013', departmentName: '风湿免疫科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit29', organizationId: 'org2', departmentId: 'dept29', departmentCode: 'N014', departmentName: '口腔科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit30', organizationId: 'org2', departmentId: 'dept30', departmentCode: 'N015', departmentName: '烧伤科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit31', organizationId: 'org2', departmentId: 'dept31', departmentCode: 'N016', departmentName: '血管外科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit32', organizationId: 'org2', departmentId: 'dept32', departmentCode: 'N017', departmentName: '心胸外科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit33', organizationId: 'org2', departmentId: 'dept33', departmentCode: 'N018', departmentName: '肝胆外科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },

  // 贵阳市xx医院北院区 - org3 (12个科室)
  { id: 'unit34', organizationId: 'org3', departmentId: 'dept34', departmentCode: 'B001', departmentName: '老年病科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit35', organizationId: 'org3', departmentId: 'dept35', departmentCode: 'B002', departmentName: '体检科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit36', organizationId: 'org3', departmentId: 'dept36', departmentCode: 'B003', departmentName: '药剂科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit37', organizationId: 'org3', departmentId: 'dept37', departmentCode: 'B004', departmentName: '病理科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit38', organizationId: 'org3', departmentId: 'dept38', departmentCode: 'B005', departmentName: '超声科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit39', organizationId: 'org3', departmentId: 'dept39', departmentCode: 'B006', departmentName: '心电图室', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit40', organizationId: 'org3', departmentId: 'dept40', departmentCode: 'B007', departmentName: '脑电图室', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit41', organizationId: 'org3', departmentId: 'dept41', departmentCode: 'B008', departmentName: '内镜中心', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit42', organizationId: 'org3', departmentId: 'dept42', departmentCode: 'B009', departmentName: '导管室', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit43', organizationId: 'org3', departmentId: 'dept43', departmentCode: 'B010', departmentName: '供应室', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit44', organizationId: 'org3', departmentId: 'dept44', departmentCode: 'B011', departmentName: '手术室', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
  { id: 'unit45', organizationId: 'org3', departmentId: 'dept45', departmentCode: 'B012', departmentName: '输血科', attendanceOfficerId: 'emp4', attendanceOfficerName: '赵六', attendanceOfficerCode: 'E004' },
]

const AttendanceUnitPage: React.FC = () => {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editUnit, setEditUnit] = useState<AttendanceUnit | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [editForm] = Form.useForm()

  // 获取当前机构下的考勤单元
  const filteredUnits = useMemo(() => {
    let units = [...mockAttendanceUnits]
    
    if (selectedOrgId) {
      units = units.filter(unit => unit.organizationId === selectedOrgId)
    }
    
    if (searchKeyword) {
      units = units.filter(unit => 
        unit.departmentName.includes(searchKeyword) ||
        unit.departmentCode.includes(searchKeyword)
      )
    }
    
    return units
  }, [selectedOrgId, searchKeyword])

  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '科室编码',
      dataIndex: 'departmentCode',
      key: 'departmentCode',
      width: 100,
    },
    {
      title: '科室名称',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 150,
    },
    {
      title: '所属机构',
      dataIndex: 'organizationId',
      key: 'organizationId',
      width: 180,
      render: (orgId: string) => {
        const org = mockOrganizations.find(o => o.id === orgId)
        return org?.name || '-'
      },
    },
    {
      title: '考勤员姓名',
      dataIndex: 'attendanceOfficerName',
      key: 'attendanceOfficerName',
      width: 100,
    },
    {
      title: '考勤员工号',
      dataIndex: 'attendanceOfficerCode',
      key: 'attendanceOfficerCode',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: AttendanceUnit) => (
        <Button
          size="small"
          onClick={() => handleEdit(record)}
          className="!bg-blue-100 !border-blue-300 !text-blue-600 !font-medium hover:!bg-blue-200 !text-xs"
        >
          修改
        </Button>
      ),
    },
  ]

  // 修改考勤单元
  const handleEdit = (unit: AttendanceUnit) => {
    setEditUnit(unit)
    editForm.setFieldsValue({
      departmentId: unit.departmentId,
      departmentCode: unit.departmentCode,
      attendanceOfficerId: unit.attendanceOfficerId,
    })
    setDrawerVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      
      // 修改模式：只更新考勤员
      const index = mockAttendanceUnits.findIndex(u => u.id === editUnit?.id)
      if (index !== -1) {
        const officer = mockEmployees.find(e => e.id === values.attendanceOfficerId)
        mockAttendanceUnits[index] = {
          ...mockAttendanceUnits[index],
          attendanceOfficerId: values.attendanceOfficerId,
          attendanceOfficerName: officer?.name || '',
          attendanceOfficerCode: officer?.code || '',
        }
      }
      message.success('修改成功')
      setDrawerVisible(false)
    } catch (error) {
      console.error('表单验证失败', error)
    }
  }

  return (
    <div className="h-full flex gap-[15px] flex-1 min-h-0">
      {/* 左侧面板——机构列表 */}
      <div className="w-60 border border-gray-200 rounded-lg flex flex-col bg-white overflow-hidden shadow-sm ml-[10px]">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded"></div>
              <span className="font-bold text-gray-700 text-sm">机构列表</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {mockOrganizations.map(org => (
              <div
                key={org.id}
                onClick={() => setSelectedOrgId(org.id)}
                className={`p-3 mb-1 rounded cursor-pointer transition-colors ${
                  selectedOrgId === org.id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <span className={`text-sm ${selectedOrgId === org.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                  {org.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧面板——考勤单元列表 */}
        <div className="flex-1 border border-gray-200 rounded-lg flex flex-col overflow-hidden bg-white shadow-sm">
        {/* 筛选栏 */}
        <div className="p-3 border-b border-gray-200 flex justify-end">
          <Space>
            <Input
              placeholder="请输入科室名称"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button type="primary" onClick={() => setSearchKeyword(searchKeyword)}>
              查询
            </Button>
          </Space>
        </div>

        {/* 表格 */}
        <div className="flex-1 overflow-auto p-3">
          <Table
            columns={columns}
            dataSource={filteredUnits}
            rowKey="id"
            pagination={{
              pageSize: 10,
              defaultCurrent: 1,
              showSizeChanger: true,
              showQuickJumper: true,
              position: ['bottomLeft'],
              showTotal: (total) => `共 ${total} 条`,
            }}
            size="middle"
            locale={{ emptyText: selectedOrgId ? '暂无考勤单元' : '请先选择机构' }}
          />
        </div>
      </div>

      {/* 修改抽屉 */}
      <Drawer
        title="修改考勤单元"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={480}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>
              确认
            </Button>
          </div>
        }
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          {/* 所属机构 */}
          <Form.Item label="所属机构">
            <Input
              value={mockOrganizations.find(o => o.id === selectedOrgId)?.name}
              readOnly
              className="!bg-gray-50"
            />
          </Form.Item>

          {/* 科室名称 */}
          <Form.Item label="科室名称">
            <Input
              value={editUnit?.departmentName}
              readOnly
              className="!bg-gray-50"
            />
          </Form.Item>

          {/* 科室编码 */}
          <Form.Item label="科室编码">
            <Input
              value={editUnit?.departmentCode}
              readOnly
              className="!bg-gray-50"
            />
          </Form.Item>

          {/* 考勤员 */}
          <Form.Item
            name="attendanceOfficerId"
            label="考勤员"
            rules={[{ required: true, message: '请选择考勤员' }]}
          >
            <Select
              placeholder="请选择考勤员"
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={mockEmployees.map(emp => ({
                label: `${emp.name} (${emp.code})`,
                value: emp.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default AttendanceUnitPage
