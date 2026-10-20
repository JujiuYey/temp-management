import React, { useState } from 'react'
import {
  Card, Row, Col, Table, Tag, Progress, Space, Select, Typography,
} from 'antd'
import {
  Pie, Line, Bar, Heatmap,
} from '@ant-design/charts'

const { Text } = Typography

// ==================== 虚拟数据 ====================

// 项目进度追踪
const projectProgress = [
  { id: 'T2026-001', name: '腹腔镜下胰十二指肠切除术', stage: '试运行', progress: 65, reportRate: 80, color: '#1890ff' },
  { id: 'T2026-002', name: '经皮冠状动脉介入治疗', stage: '试运行', progress: 45, reportRate: 60, color: '#1890ff' },
  { id: 'T2026-003', name: '机器人辅助前列腺切除术', stage: '审批中', progress: 20, reportRate: 0, color: '#faad14' },
  { id: 'T2026-004', name: '3D打印骨骼植入技术', stage: '申请中', progress: 5, reportRate: 0, color: '#722ed1' },
  { id: 'T2026-005', name: '纳米刀消融术', stage: '试运行', progress: 80, reportRate: 90, color: '#52c41a' },
  { id: 'T2026-006', name: '经导管主动脉瓣置换术', stage: '试运行', progress: 55, reportRate: 75, color: '#1890ff' },
  { id: 'T2026-007', name: 'CAR-T细胞免疫治疗', stage: '申请中', progress: 10, reportRate: 0, color: '#722ed1' },
  { id: 'T2026-008', name: '人工智能辅助诊断系统', stage: '已转常规', progress: 100, reportRate: 100, color: '#52c41a' },
]

// 病例数监控
const caseMonitor = [
  { name: '腹腔镜下胰十二指肠切除术', actual: 35, planned: 50 },
  { name: '经皮冠状动脉介入治疗', actual: 28, planned: 40 },
  { name: '纳米刀消融术', actual: 42, planned: 45 },
  { name: '经导管主动脉瓣置换术', actual: 18, planned: 30 },
  { name: '3D打印骨骼植入技术', actual: 5, planned: 20 },
  { name: '机器人辅助前列腺切除术', actual: 0, planned: 35 },
]

// 病例数柱状图数据
const caseBarData = caseMonitor.flatMap((item) => [
  { name: item.name, type: '已开展例数', value: item.actual },
  { name: item.name, type: '计划例数', value: item.planned },
])

// 不良事件趋势
const adverseEventTrend = [
  { month: '1月', rate: 1.2, project: '全部项目' },
  { month: '2月', rate: 0.8, project: '全部项目' },
  { month: '3月', rate: 1.5, project: '全部项目' },
  { month: '4月', rate: 2.1, project: '全部项目' },
  { month: '5月', rate: 1.3, project: '全部项目' },
  { month: '6月', rate: 0.9, project: '全部项目' },
  { month: '7月', rate: 1.1, project: '全部项目' },
]

// 不良事件按项目
const adverseByProject = [
  { month: '1月', project: '腹腔镜下胰十二指肠切除术', value: 1 },
  { month: '1月', project: '经皮冠状动脉介入治疗', value: 0 },
  { month: '2月', project: '腹腔镜下胰十二指肠切除术', value: 0 },
  { month: '2月', project: '经皮冠状动脉介入治疗', value: 1 },
  { month: '3月', project: '腹腔镜下胰十二指肠切除术', value: 1 },
  { month: '3月', project: '经皮冠状动脉介入治疗', value: 1 },
  { month: '4月', project: '腹腔镜下胰十二指肠切除术', value: 2 },
  { month: '4月', project: '经皮冠状动脉介入治疗', value: 0 },
  { month: '5月', project: '腹腔镜下胰十二指肠切除术', value: 1 },
  { month: '5月', project: '经皮冠状动脉介入治疗', value: 0 },
  { month: '6月', project: '腹腔镜下胰十二指肠切除术', value: 0 },
  { month: '6月', project: '经皮冠状动脉介入治疗', value: 1 },
  { month: '7月', project: '腹腔镜下胰十二指肠切除术', value: 1 },
  { month: '7月', project: '经皮冠状动脉介入治疗', value: 0 },
]

// 严重不良事件列表
const seriousEvents = [
  { id: 'SE-001', project: '腹腔镜下胰十二指肠切除术', event: '术后出血', date: '2026-04-12', level: '严重', status: '已处理' },
  { id: 'SE-002', project: '经皮冠状动脉介入治疗', event: '造影剂过敏', date: '2026-03-25', level: '中度', status: '已处理' },
  { id: 'SE-003', project: '纳米刀消融术', event: '术后疼痛加剧', date: '2026-06-08', level: '轻度', status: '跟踪中' },
  { id: 'SE-004', project: '经导管主动脉瓣置换术', event: '瓣膜移位', date: '2026-05-20', level: '严重', status: '已处理' },
]

// 报告合规性
const reportCompliance = [
  { type: '按时提交率', value: 78 },
  { type: '一次通过率', value: 65 },
]

const reportPassData = [
  { type: '一次通过', value: 42 },
  { type: '需修改后通过', value: 18 },
  { type: '未通过', value: 5 },
]

// 人员资质
const personnelData = [
  { type: '已获授权', value: 28 },
  { type: '未获授权', value: 12 },
]

const personnelDetail = [
  { id: '1', name: '张医生', department: '外科', techName: '腹腔镜下胰十二指肠切除术', authorized: true, expireDate: '2027-06-30' },
  { id: '2', name: '李医生', department: '外科', techName: '腹腔镜下胰十二指肠切除术', authorized: true, expireDate: '2027-03-15' },
  { id: '3', name: '王医生', department: '心内科', techName: '经皮冠状动脉介入治疗', authorized: true, expireDate: '2027-12-01' },
  { id: '4', name: '赵医生', department: '外科', techName: '纳米刀消融术', authorized: false, expireDate: '-' },
  { id: '5', name: '刘医生', department: '心内科', techName: '经导管主动脉瓣置换术', authorized: true, expireDate: '2027-09-20' },
  { id: '6', name: '陈医生', department: '外科', techName: '机器人辅助前列腺切除术', authorized: false, expireDate: '-' },
  { id: '7', name: '吴医生', department: '骨科', techName: '3D打印骨骼植入技术', authorized: true, expireDate: '2027-08-10' },
  { id: '8', name: '周医生', department: '外科', techName: '腹腔镜下胰十二指肠切除术', authorized: true, expireDate: '2027-01-05' },
]

// ==================== 浅色主题样式 ====================

const lightCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #f0f0f0',
  borderRadius: 8,
}

const sectionTitleStyle: React.CSSProperties = {
  color: '#333',
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 16,
  paddingLeft: 10,
  borderLeft: '3px solid #1890ff',
}

// ==================== 组件 ====================

const TechMonitor: React.FC = () => {
  const [filterProject, setFilterProject] = useState<string | undefined>(undefined)

  const stageColorMap: Record<string, string> = {
    '申请中': '#722ed1',
    '审批中': '#faad14',
    '试运行': '#1890ff',
    '已转常规': '#52c41a',
    '已终止': '#ff4d4f',
  }

  const progressColumns = [
    { title: '项目编号', dataIndex: 'id', key: 'id', width: 120 },
    { title: '项目名称', dataIndex: 'name', key: 'name', width: 220 },
    {
      title: '当前阶段', dataIndex: 'stage', key: 'stage', width: 100,
      render: (stage: string) => <Tag color={stageColorMap[stage]}>{stage}</Tag>,
    },
    {
      title: '整体进度', dataIndex: 'progress', key: 'progress', width: 200,
      render: (val: number) => (
        <Progress
          percent={val}
          size="small"
          strokeColor={val >= 80 ? '#52c41a' : val >= 50 ? '#1890ff' : val >= 30 ? '#faad14' : '#ff4d4f'}
          format={(p) => `${p}%`}
        />
      ),
    },
    {
      title: '里程碑完成率', dataIndex: 'reportRate', key: 'reportRate', width: 200,
      render: (val: number) => (
        <Progress
          percent={val}
          size="small"
          strokeColor={val >= 80 ? '#52c41a' : val >= 60 ? '#1890ff' : '#faad14'}
          format={(p) => `${p}%`}
        />
      ),
    },
  ]

  const eventColumns = [
    { title: '编号', dataIndex: 'id', key: 'id', width: 80 },
    { title: '关联项目', dataIndex: 'project', key: 'project', width: 200 },
    { title: '事件描述', dataIndex: 'event', key: 'event', width: 150 },
    { title: '发生日期', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: '严重程度', dataIndex: 'level', key: 'level', width: 90,
      render: (level: string) => (
        <Tag color={level === '严重' ? 'red' : level === '中度' ? 'orange' : 'blue'}>{level}</Tag>
      ),
    },
    {
      title: '处理状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => (
        <Tag color={status === '已处理' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
  ]

  const personnelColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
    { title: '科室', dataIndex: 'department', key: 'department', width: 80 },
    { title: '技术项目', dataIndex: 'techName', key: 'techName', width: 200 },
    {
      title: '授权状态', dataIndex: 'authorized', key: 'authorized', width: 90,
      render: (val: boolean) => <Tag color={val ? 'green' : 'red'}>{val ? '已授权' : '未授权'}</Tag>,
    },
    { title: '到期日期', dataIndex: 'expireDate', key: 'expireDate', width: 120 },
  ]

  return (
    <div style={{
      background: '#f5f7fa',
      padding: 20,
      minHeight: '100%',
    }}>
      {/* 标题栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div style={{ color: '#333', fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
          🔍 过程监控中心
        </div>
        <Space>
          <Select
            value={filterProject}
            onChange={setFilterProject}
            placeholder="筛选项目"
            allowClear
            options={projectProgress.map((p) => ({ label: p.name, value: p.id }))}
            style={{ width: 220 }}
          />
        </Space>
      </div>

      {/* 第一行：项目进度追踪 + 病例数监控 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>项目进度追踪</div>
            <Table
              dataSource={projectProgress}
              columns={progressColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
            />
            {/* 里程碑完成率总览 */}
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 6 }}>
              <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                里程碑完成率：已按时完成阶段性报告的项目占比
              </div>
              <Space size={24}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#52c41a', fontSize: 28, fontWeight: 700 }}>75%</div>
                  <div style={{ color: '#999', fontSize: 11 }}>按时完成率</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#1890ff', fontSize: 28, fontWeight: 700 }}>6/8</div>
                  <div style={{ color: '#999', fontSize: 11 }}>按时完成项目</div>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>病例数监控</div>
            <Bar
              data={caseBarData}
              xField="value"
              yField="name"
              colorField="type"
              layout="vertical"
              group
              style={{
                maxWidth: 40,
              }}
              scale={{
                color: { range: ['#1890ff', '#d9d9d9'] },
              }}
              axis={{
                x: { labelFill: '#999', gridStroke: '#f0f0f0' },
                y: { labelFill: '#666', labelFontSize: 11 },
              }}
              legend={{
                color: { itemLabelFill: '#666' },
              }}
              height={340}
            />
            <div style={{ marginTop: 8, padding: '12px 16px', background: '#fafafa', borderRadius: 6 }}>
              <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                例数达标预测：按当前速度能否在监管期内完成
              </div>
              <Space size={16}>
                <Tag color="green">纳米刀消融术：预计达标</Tag>
                <Tag color="orange">经皮冠状动脉介入治疗：可能延迟</Tag>
                <Tag color="red">3D打印骨骼植入技术：预计不达标</Tag>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第二行：并发症/不良事件 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>并发症发生率趋势</div>
            <Line
              data={adverseEventTrend}
              xField="month"
              yField="rate"
              style={{ lineWidth: 2 }}
              color="#ff4d4f"
              axis={{
                x: { labelFill: '#999', lineStroke: '#e8e8e8' },
                y: { labelFill: '#999', lineStroke: '#e8e8e8', gridStroke: '#f0f0f0', title: '发生率(%)', titleFill: '#999' },
              }}
              height={220}
            />
            <div style={{ textAlign: 'center', color: '#999', fontSize: 11, marginTop: 4 }}>
              并发症例数 / 总开展例数
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>不良事件热力图</div>
            <Heatmap
              data={adverseByProject}
              xField="month"
              yField="project"
              colorField="value"
              style={{
                maxWidth: 20,
                inset: 2,
              }}
              scale={{
                color: { range: ['#f0f0f0', '#ff4d4f'] },
              }}
              axis={{
                x: { labelFill: '#999', lineStroke: '#e8e8e8' },
                y: { labelFill: '#666', labelFontSize: 10 },
              }}
              height={220}
            />
            <div style={{ textAlign: 'center', color: '#999', fontSize: 11, marginTop: 4 }}>
              按月/按项目不良事件分布
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>严重不良事件清单</div>
            <Table
              dataSource={seriousEvents}
              columns={eventColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 220 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 第三行：报告合规性 + 人员资质 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>报告合规性</div>
            <Row gutter={24}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>阶段报告按时提交率</div>
                  <Progress
                    type="dashboard"
                    percent={78}
                    strokeColor={{ '0%': '#1890ff', '100%': '#52c41a' }}
                    format={(p) => <span style={{ color: '#333', fontSize: 20, fontWeight: 700 }}>{p}%</span>}
                    size={120}
                  />
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>报告审批一次通过率</div>
                  <Progress
                    type="dashboard"
                    percent={65}
                    strokeColor={{ '0%': '#faad14', '100%': '#52c41a' }}
                    format={(p) => <span style={{ color: '#333', fontSize: 20, fontWeight: 700 }}>{p}%</span>}
                    size={120}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>报告审批通过分布</div>
                <Pie
                  data={reportPassData}
                  angleField="value"
                  colorField="type"
                  innerRadius={0.5}
                  radius={0.85}
                  color={['#52c41a', '#faad14', '#ff4d4f']}
                  label={{
                    type: 'outer',
                    content: '{name} {percentage}',
                    style: { fill: '#333', fontSize: 11 },
                  }}
                  legend={{
                    color: { itemLabelFill: '#666' },
                  }}
                  height={260}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>人员资质</div>
            <Row gutter={24}>
              <Col span={10}>
                <Pie
                  data={personnelData}
                  angleField="value"
                  colorField="type"
                  innerRadius={0.5}
                  radius={0.85}
                  color={['#52c41a', '#ff4d4f']}
                  label={{
                    type: 'outer',
                    content: '{name}\n{percentage}',
                    style: { fill: '#333', fontSize: 11 },
                  }}
                  statistic={{
                    title: { content: '授权率', style: { color: '#999', fontSize: 12 } },
                    content: { value: '70%', style: { color: '#52c41a', fontSize: 22, fontWeight: 700 } },
                  }}
                  legend={{
                    color: { itemLabelFill: '#666' },
                  }}
                  height={220}
                />
                <div style={{ textAlign: 'center', color: '#999', fontSize: 11 }}>
                  开展该技术的医生中已获授权的人数及占比
                </div>
              </Col>
              <Col span={14}>
                <Table
                  dataSource={personnelDetail}
                  columns={personnelColumns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ y: 240 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TechMonitor
