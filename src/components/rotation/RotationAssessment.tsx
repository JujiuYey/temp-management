import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Drawer,
  Select,
  Row,
  Col,
  message,
  Popconfirm,
  Empty,
} from 'antd'
import {
  SettingOutlined,
  EyeOutlined,
  DisconnectOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

// ==================== 类型定义 ====================

// 考核环节
interface AssessmentStage {
  id: string
  name: string
  description: string
}

// 评分表：分组下的评分指标
interface ScoreItem {
  name: string
  note: string
}

// 评分表：项目分组
interface ScoreGroup {
  name: string
  items: ScoreItem[]
}

// 评价表（核查评分表样式）
interface FormDoc {
  id: string
  name: string
  type: string
  headerFields: string[]
  groups: ScoreGroup[]
}

// 环节-表单关联（一个环节仅可关联一个表单）
interface StageFormLink {
  formId: string
  linkTime: string
}

// ==================== 模拟数据 ====================

const STAGES: AssessmentStage[] = [
  {
    id: 'stage-exit',
    name: '出科考核',
    description: '轮转人员完成科室轮转出科前进行的考核，评价轮转期间理论知识与临床技能掌握情况',
  },
  {
    id: 'stage-final',
    name: '定科考核',
    description: '轮转周期结束后定科前进行的综合考核，考核结果作为确定定科科室的重要依据',
  },
]

// 表单库（评价表样式）
const FORM_LIBRARY: FormDoc[] = [
  {
    id: 'f1', name: '住院医师规范化培训出科核查评分表', type: '考核表',
    headerFields: ['姓名', '培训专业', '轮转科室', '轮转时间'],
    groups: [
      {
        name: '医德医风',
        items: [
          { name: '清廉行医', note: '有投诉且经查实的记 1 分。' },
          { name: '服务态度', note: '有投诉且经查实的记 1 分。' },
          { name: '工作责任心', note: '有投诉且经查实的记 1 分。' },
          { name: '医患交流能力', note: '有投诉且经查实的记 1 分。' },
          { name: '医疗差错、事故', note: '≥1次为不合格。无差错及无事故者记5分。' },
        ],
      },
      {
        name: '出勤情况',
        items: [
          { name: '出勤状况', note: '全勤记5分，每个月病事假≤1天记4分，病事假2天记3分，>2天记1分，旷工不得分。' },
        ],
      },
      {
        name: '临床实践指标',
        items: [
          { name: '病历质量数目', note: '书写病历甲级率100%；有丙级病历则不可以经过。' },
        ],
      },
      {
        name: '达成情况',
        items: [
          { name: '临床操作', note: '操作规范，项目达成率≥80%，不然不可以经过。' },
        ],
      },
      {
        name: '临床综合',
        items: [
          { name: '体格检查', note: '手法规范，按次序进行，重要征无遗漏。（有一项不符合，则扣1分）' },
          { name: '专业理论', note: '临床基本理论、专业知识、学科发展动向的认识与掌握。' },
          { name: '办理常见病人的能力', note: '临床资料的分析，反调能力，表达能力强。（有一项不符合，则扣1分）' },
          { name: '医疗法规掌握', note: '熟悉医疗相关法律法规，依法依规执业。' },
        ],
      },
    ],
  },
  {
    id: 'f2', name: '出科技能操作考核评分表', type: '考核表',
    headerFields: ['姓名', '培训专业', '轮转科室', '轮转时间'],
    groups: [
      {
        name: '技能操作',
        items: [
          { name: '无菌操作', note: '无菌观念强，操作规范。（违反一次扣1分）' },
          { name: '基本技能操作', note: '操作熟练、手法正确。（按项目达成度记分）' },
          { name: '临床应急处理', note: '应急流程掌握熟练，处理得当。' },
        ],
      },
      {
        name: '病历书写',
        items: [
          { name: '病历书写质量', note: '病历书写规范、及时、完整。（有一项不符合扣1分）' },
        ],
      },
      {
        name: '医德医风',
        items: [
          { name: '服务态度', note: '有投诉且经查实的记 1 分。' },
          { name: '工作责任心', note: '有投诉且经查实的记 1 分。' },
        ],
      },
    ],
  },
  {
    id: 'f3', name: '定科综合考核评分表', type: '考核表',
    headerFields: ['姓名', '培训专业', '轮转时间'],
    groups: [
      {
        name: '理论考核',
        items: [
          { name: '基础理论', note: '基础理论知识笔试成绩。' },
          { name: '专业理论', note: '专业理论知识笔试成绩。' },
        ],
      },
      {
        name: '临床技能',
        items: [
          { name: '临床操作', note: '项目达成率≥80%，不然不可以经过。' },
          { name: '应急能力', note: '急危重症识别与处理能力。' },
        ],
      },
      {
        name: '综合能力',
        items: [
          { name: '综合面试', note: '临床资料分析、表达能力、团队协作。' },
          { name: '医患沟通', note: '沟通技巧与服务意识。' },
        ],
      },
    ],
  },
  {
    id: 'f4', name: '带教老师评价表', type: '评估表',
    headerFields: ['姓名', '轮转科室', '轮转时间'],
    groups: [
      {
        name: '学习表现',
        items: [
          { name: '学习态度', note: '学习主动性与出勤情况。' },
          { name: '团队协作', note: '与科室同事协作配合情况。' },
        ],
      },
      {
        name: '临床能力',
        items: [
          { name: '临床思维', note: '病史采集与临床决策能力。' },
          { name: '医患沟通', note: '沟通能力与服务态度。' },
        ],
      },
    ],
  },
  {
    id: 'f5', name: '轮转人员自我评价表', type: '评估表',
    headerFields: ['姓名', '培训专业', '轮转科室', '轮转时间'],
    groups: [
      {
        name: '目标完成',
        items: [
          { name: '学习目标完成情况', note: '对照轮转计划大纲自评完成度。' },
        ],
      },
      {
        name: '技能掌握',
        items: [
          { name: '掌握较好的技能', note: '自评掌握较好的临床技能。' },
        ],
      },
      {
        name: '自我总结',
        items: [
          { name: '自我总结', note: '本阶段学习收获与不足。' },
        ],
      },
    ],
  },
]

const mockLinks: Record<string, StageFormLink> = {
  'stage-exit': { formId: 'f1', linkTime: '2026-08-20 10:30:00' },
  'stage-final': { formId: 'f3', linkTime: '2026-09-01 09:00:00' },
}

const formTypeTag = (type: string) => (type === '考核表' ? 'blue' : 'cyan')

// 评分格子样式
const cellBorder: React.CSSProperties = { border: '1px solid #8c8c8c', padding: '8px 10px', fontSize: 13 }
const scoreCell: React.CSSProperties = { ...cellBorder, width: 34, textAlign: 'center', padding: '8px 4px' }

const RotationAssessment: React.FC = () => {
  const [links, setLinks] = useState<Record<string, StageFormLink>>(mockLinks)

  // 模版管理抽屉
  const [manageOpen, setManageOpen] = useState(false)
  const [currentStage, setCurrentStage] = useState<AssessmentStage | null>(null)
  const [selectedFormId, setSelectedFormId] = useState<string | undefined>(undefined)

  // 表单预览抽屉
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewForm, setPreviewForm] = useState<FormDoc | null>(null)

  const currentLink = currentStage ? links[currentStage.id] : undefined
  const currentForm = currentLink ? FORM_LIBRARY.find((f) => f.id === currentLink.formId) : undefined

  // 可选表单：排除当前环节已关联的表单
  const selectableForms = currentStage
    ? FORM_LIBRARY.filter((f) => f.id !== links[currentStage.id]?.formId)
    : []

  const formOf = (formId: string) => FORM_LIBRARY.find((f) => f.id === formId)

  // 点击「配置」→ 打开对应环节的模版管理抽屉
  const handleConfig = (stage: AssessmentStage) => {
    setCurrentStage(stage)
    setSelectedFormId(undefined)
    setManageOpen(true)
  }

  // 关联 / 更换表单（一个环节仅一个）
  const handleLink = () => {
    if (!selectedFormId || !currentStage) return
    const isReplace = !!links[currentStage.id]
    setLinks({
      ...links,
      [currentStage.id]: { formId: selectedFormId, linkTime: new Date().toISOString().slice(0, 19).replace('T', ' ') },
    })
    message.success(isReplace ? '已更换关联表单' : '表单关联成功')
    setSelectedFormId(undefined)
  }

  // 取消关联
  const handleUnlink = () => {
    if (!currentStage) return
    const next = { ...links }
    delete next[currentStage.id]
    setLinks(next)
    message.success('已取消关联')
  }

  // 预览表单
  const handlePreview = (formId: string) => {
    setPreviewForm(formOf(formId) || null)
    setPreviewOpen(true)
  }

  // 环节列表列
  const stageColumns: ColumnsType<AssessmentStage> = [
    { title: '序号', width: 60, render: (_, __, i) => i + 1 },
    {
      title: '考核环节', dataIndex: 'name', width: 140,
      render: (v: string) => <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{v}</span>,
    },
    { title: '考核说明', dataIndex: 'description' },
    {
      title: '操作', width: 100, align: 'center',
      render: (_, r) => (
        <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleConfig(r)}>配置</Button>
      ),
    },
  ]

  // 已关联表单列表列（最多一条）
  const linkRows: (StageFormLink & { key: string })[] = currentLink ? [{ key: 'current', ...currentLink }] : []
  const linkColumns: ColumnsType<StageFormLink & { key: string }> = [
    { title: '表单名称', dataIndex: 'formId', render: (formId: string) => <span style={{ fontWeight: 500 }}>{formOf(formId)?.name || formId}</span> },
    {
      title: '表单类型', dataIndex: 'formId', width: 90,
      render: (formId: string) => {
        const form = formOf(formId)
        return form ? <Tag color={formTypeTag(form.type)}>{form.type}</Tag> : '-'
      },
    },
    { title: '关联时间', dataIndex: 'linkTime', width: 160 },
    {
      title: '操作', width: 150, fixed: 'right',
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(r.formId)}>预览</Button>
          <Popconfirm title="确定取消关联该表单吗？" onConfirm={handleUnlink} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DisconnectOutlined />}>取消关联</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card styles={{ body: { padding: '12px 16px' } }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 16, background: '#1890ff', borderRadius: 2 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>考核设置</span>
          </div>
        </Col>
      </Row>

      <Table
        columns={stageColumns}
        dataSource={STAGES}
        rowKey="id"
        size="small"
        pagination={false}
      />

      {/* 考核模版管理抽屉 */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>考核模版管理{currentStage ? ` · ${currentStage.name}` : ''}</span>}
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        width={720}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {currentStage && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f6f8fa', borderRadius: 6, fontSize: 13, color: '#666' }}>
            {currentStage.description}（每个环节仅可关联一个评价表）
          </div>
        )}

        {/* 选择表单进行关联 */}
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col flex="none" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ whiteSpace: 'nowrap' }}>选择表单：</span>
          </Col>
          <Col flex="auto">
            <Select
              placeholder={currentLink ? '请选择新的表单进行更换' : '请选择要关联的表单'}
              style={{ width: '100%' }}
              value={selectedFormId}
              onChange={setSelectedFormId}
              disabled={selectableForms.length === 0}
              showSearch
              optionFilterProp="label"
              options={selectableForms.map((f) => ({ label: `${f.name}（${f.type}）`, value: f.id }))}
            />
          </Col>
          <Col flex="none">
            <Button type="primary" disabled={!selectedFormId} onClick={handleLink}>
              {currentLink ? '更换' : '关联'}
            </Button>
          </Col>
        </Row>

        <Table
          columns={linkColumns}
          dataSource={linkRows}
          rowKey="key"
          size="small"
          pagination={false}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂未关联表单，请在上方选择表单进行关联" /> }}
        />
      </Drawer>

      {/* 表单预览抽屉：评价表样式 */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>表单预览{previewForm ? ` · ${previewForm.name}` : ''}</span>}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        width={760}
      >
        {previewForm && (
          <>
            {/* 表单标题 */}
            <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '4px 0 14px' }}>
              {previewForm.name}
            </div>

            {/* 表头信息栏：姓名、培训专业、轮转科室、轮转时间 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 14, fontSize: 13, color: '#333', flexWrap: 'wrap' }}>
              {previewForm.headerFields.map((label) => (
                <span key={label}>{label}：<span style={{ display: 'inline-block', width: 72, borderBottom: '1px solid #8c8c8c' }} /></span>
              ))}
            </div>

            {/* 评分表格：项目 / 指标 / 评分标准(1-5分) / 评分说明 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ ...cellBorder, width: 80 }} rowSpan={2}>项目</th>
                  <th style={{ ...cellBorder, width: 110 }} rowSpan={2}>指标</th>
                  <th style={{ ...cellBorder }} colSpan={5}>评分标准</th>
                  <th style={{ ...cellBorder, width: 250 }}>评分说明</th>
                </tr>
                <tr style={{ background: '#fafafa' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <th key={n} style={scoreCell}>{n}分</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewForm.groups.map((group) =>
                  group.items.map((item, idx) => (
                    <tr key={`${group.name}-${idx}`}>
                      {idx === 0 && (
                        <td
                          style={{ ...cellBorder, textAlign: 'center', fontWeight: 500, background: '#fafafa', verticalAlign: 'middle' }}
                          rowSpan={group.items.length}
                        >
                          {group.name}
                        </td>
                      )}
                      <td style={cellBorder}>{item.name}</td>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <td key={n} style={scoreCell} />
                      ))}
                      <td style={{ ...cellBorder, color: '#555' }}>{item.note}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </>
        )}
      </Drawer>
    </Card>
  )
}

export default RotationAssessment
