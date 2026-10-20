import React, { useState } from 'react'
import { Card, Row, Col, Select, Statistic, Tag, Space } from 'antd'
import {
  Pie, Line, Gauge, Bar,
} from '@ant-design/charts'
import {
  ProjectOutlined,
  FileSearchOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

// ==================== 虚拟数据 ====================

const statusData = [
  { type: '申请中', value: 23 },
  { type: '试运行中', value: 67 },
  { type: '已转常规', value: 38 },
  { type: '已终止', value: 5 },
]

const statusColorMap: Record<string, string> = {
  '申请中': '#faad14',
  '试运行中': '#1890ff',
  '已转常规': '#52c41a',
  '已终止': '#ff4d4f',
}

const trendData2025 = [3, 5, 4, 6, 8, 7, 9, 6, 5, 8, 7, 10]
const trendData2026 = [5, 7, 6, 9, 11, 10, 8, 0, 0, 0, 0, 0]

const trendData = [
  ...trendData2025.map((v, i) => ({ month: `${i + 1}月`, value: v, year: '2025年' })),
  ...trendData2026.map((v, i) => ({ month: `${i + 1}月`, value: v, year: '2026年' })),
]

const deptApplyTop5 = [
  { department: '骨科', value: 15 },
  { department: '心内科', value: 12 },
  { department: '普外科', value: 10 },
  { department: '神经外科', value: 8 },
  { department: '泌尿外科', value: 6 },
]

const deptSuccessTop5 = [
  { department: '骨科', value: 92 },
  { department: '心内科', value: 88 },
  { department: '普外科', value: 85 },
  { department: '神经外科', value: 82 },
  { department: '泌尿外科', value: 80 },
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

const TechOverview: React.FC = () => {
  const [year, setYear] = useState<string>('2026')

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
          📊 技术总览驾驶舱
        </div>
        <Select
          value={year}
          onChange={setYear}
          options={[
            { label: '2024年', value: '2024' },
            { label: '2025年', value: '2025' },
            { label: '2026年', value: '2026' },
          ]}
          style={{ width: 120 }}
        />
      </div>

      {/* 数字卡片行 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card style={lightCardStyle} bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title={<span style={{ color: '#666' }}>项目总数</span>}
              value={128}
              prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#333', fontSize: 32, fontWeight: 700 }}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>个</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={lightCardStyle} bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title={<span style={{ color: '#666' }}>申请中</span>}
              value={23}
              prefix={<FileSearchOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 32, fontWeight: 700 }}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>个</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={lightCardStyle} bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title={<span style={{ color: '#666' }}>试运行中</span>}
              value={67}
              prefix={<ExperimentOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 32, fontWeight: 700 }}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>个</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={lightCardStyle} bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title={<span style={{ color: '#666' }}>已转常规</span>}
              value={38}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 32, fontWeight: 700 }}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>个</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* 第一行：项目状态 + 申请趋势 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>项目状态分布</div>
            <Pie
              data={statusData}
              angleField="value"
              colorField="type"
              innerRadius={0.6}
              radius={0.9}
              color={(datum: { type: string }) => statusColorMap[datum.type] || '#999'}
              label={{
                type: 'outer',
                content: '{name} {percentage}',
                style: { fill: '#333', fontSize: 12 },
              }}
              statistic={{
                title: { content: '总计', style: { color: '#999', fontSize: 14 } },
                content: { value: 128, style: { color: '#333', fontSize: 28, fontWeight: 700 } },
              }}
              legend={{
                color: {
                  itemLabelFill: '#666',
                },
              }}
              height={280}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>申请趋势</div>
            <Line
              data={trendData}
              xField="month"
              yField="value"
              colorField="year"
              style={{
                lineWidth: 2,
              }}
              scale={{
                color: { range: ['#bfbfbf', '#1890ff'] },
              }}
              interaction={{ tooltip: { marker: false } }}
              axis={{
                x: { labelFill: '#999', lineStroke: '#e8e8e8' },
                y: { labelFill: '#999', lineStroke: '#e8e8e8', gridStroke: '#f0f0f0' },
              }}
              legend={{
                color: { itemLabelFill: '#666' },
              }}
              height={280}
            />
          </Card>
        </Col>
      </Row>

      {/* 第二行：监管警示 + 科室排行榜 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>⚠️ 监管警示</div>
            <Row gutter={16}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Gauge
                  value={7 / 20}
                  range={{ color: [[0, 1, '#ff4d4f']] }}
                  startAngle={Math.PI}
                  endAngle={2 * Math.PI}
                  indicator={{
                    pointer: { style: { stroke: '#ff4d4f' } },
                    pin: { style: { stroke: '#ff4d4f' } },
                  }}
                  axis={{
                    label: { style: { fill: '#bfbfbf', fontSize: 10 } },
                    subTickLine: { style: { stroke: '#e8e8e8' } },
                    tickLine: { style: { stroke: '#e8e8e8' } },
                  }}
                  statistic={{
                    content: {
                      style: { color: '#ff4d4f', fontSize: 22, fontWeight: 700 },
                      formatter: () => '7',
                    },
                    title: {
                      style: { color: '#999', fontSize: 11 },
                      formatter: () => '逾期未报告',
                    },
                  }}
                  height={160}
                />
                <Tag color="red" style={{ marginTop: 4 }}>逾期未报告项目</Tag>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Gauge
                  value={4 / 15}
                  range={{ color: [[0, 1, '#fa8c16']] }}
                  startAngle={Math.PI}
                  endAngle={2 * Math.PI}
                  indicator={{
                    pointer: { style: { stroke: '#fa8c16' } },
                    pin: { style: { stroke: '#fa8c16' } },
                  }}
                  axis={{
                    label: { style: { fill: '#bfbfbf', fontSize: 10 } },
                    subTickLine: { style: { stroke: '#e8e8e8' } },
                    tickLine: { style: { stroke: '#e8e8e8' } },
                  }}
                  statistic={{
                    content: {
                      style: { color: '#fa8c16', fontSize: 22, fontWeight: 700 },
                      formatter: () => '4',
                    },
                    title: {
                      style: { color: '#999', fontSize: 11 },
                      formatter: () => '例数不达标',
                    },
                  }}
                  height={160}
                />
                <Tag color="orange" style={{ marginTop: 4 }}>例数不达标项目</Tag>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Gauge
                  value={2 / 10}
                  range={{ color: [[0, 1, '#ff4d4f']] }}
                  startAngle={Math.PI}
                  endAngle={2 * Math.PI}
                  indicator={{
                    pointer: { style: { stroke: '#ff4d4f' } },
                    pin: { style: { stroke: '#ff4d4f' } },
                  }}
                  axis={{
                    label: { style: { fill: '#bfbfbf', fontSize: 10 } },
                    subTickLine: { style: { stroke: '#e8e8e8' } },
                    tickLine: { style: { stroke: '#e8e8e8' } },
                  }}
                  statistic={{
                    content: {
                      style: { color: '#ff4d4f', fontSize: 22, fontWeight: 700 },
                      formatter: () => '2',
                    },
                    title: {
                      style: { color: '#999', fontSize: 11 },
                      formatter: () => '不良事件',
                    },
                  }}
                  height={160}
                />
                <Tag color="red" style={{ marginTop: 4 }}>发生不良事件项目</Tag>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={lightCardStyle} bodyStyle={{ padding: 20 }}>
            <div style={sectionTitleStyle}>科室排行榜</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>申请/立项最多 Top5</div>
              <Bar
                data={deptApplyTop5}
                xField="value"
                yField="department"
                layout="vertical"
                color="#1890ff"
                axis={{
                  x: { labelFill: '#999', gridStroke: '#f0f0f0' },
                  y: { labelFill: '#666' },
                }}
                label={{
                  text: (d: { value: number }) => d.value,
                  position: 'right',
                  style: { fill: '#333', fontSize: 11 },
                }}
                height={100}
              />
            </div>
            <div>
              <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>转常规成功率最高 Top5</div>
              <Bar
                data={deptSuccessTop5}
                xField="value"
                yField="department"
                layout="vertical"
                color="#52c41a"
                axis={{
                  x: { labelFill: '#999', gridStroke: '#f0f0f0', max: 100 },
                  y: { labelFill: '#666' },
                }}
                label={{
                  text: (d: { value: number }) => `${d.value}%`,
                  position: 'right',
                  style: { fill: '#333', fontSize: 11 },
                }}
                height={100}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第三行：转常规率 */}
      <Row gutter={16}>
        <Col span={24}>
          <Card style={lightCardStyle} bodyStyle={{ padding: '20px 40px' }}>
            <div style={sectionTitleStyle}>转常规率</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge
                value={0.85}
                range={{
                  color: [[0, 0.6, '#ff4d4f'], [0.6, 0.8, '#faad14'], [0.8, 1, '#52c41a']],
                }}
                startAngle={Math.PI * 0.8}
                endAngle={Math.PI * 2.2}
                indicator={{
                  pointer: { style: { stroke: '#1890ff' } },
                  pin: { style: { stroke: '#1890ff' } },
                }}
                axis={{
                  label: { style: { fill: '#bfbfbf', fontSize: 10 } },
                  subTickLine: { style: { stroke: '#e8e8e8' } },
                  tickLine: { style: { stroke: '#e8e8e8' } },
                }}
                statistic={{
                  content: {
                    style: { color: '#52c41a', fontSize: 36, fontWeight: 700 },
                    formatter: () => '85%',
                  },
                  title: {
                    style: { color: '#999', fontSize: 13 },
                    formatter: () => '当年转常规项目数 / 当年到期应转常规项目数',
                  },
                }}
                height={220}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TechOverview
