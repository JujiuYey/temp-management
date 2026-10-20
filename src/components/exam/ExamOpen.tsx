import React, { useMemo, useState } from 'react'
import { Button, Drawer, Empty, Input, Modal, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  INITIAL_EXAMS,
  computeExamStatus,
  CandidateModal,
  CopyExamDrawer,
  DelayModal,
  ExamCard,
  ExaminerSettingsDrawer,
  PickerModal,
  TheoryExamForm,
} from './TheoryExam'
import type { ExamStatus, TheoryExamRecord } from './TheoryExam'
import CandidateNoticeDrawer from './CandidateNotice'
import MarkingHall from './MarkingHall'

/** 状态筛选页签 */
const STATUS_TABS: Array<'全部' | ExamStatus> = ['全部', '未发布', '未开始', '进行中', '已结束', '已中止']

// ===== 左侧考试分类（样式与「理论题目」左侧「题目分类」保持一致） =====
const ALL_KEY = 'all'
const catKey = (c: string) => `c:${c}`

/**
 * 开启考试
 * 左侧为考试分类列表（全部考试 + 各考试分类），样式与「理论题目」的「题目分类」一致；
 * 右侧为考试卡片总览，卡片状态：未发布 / 未开始 / 进行中 / 已结束 / 已中止。
 * 卡片操作：编辑、考生管理、更多（考官管理 / 考试须知 / 成绩单 / 复制 / 延期 / 中止 / 发布 / 取消）。
 * 试卷本身（名称 / 说明 / 组卷与试题 / 录屏录像）在「试卷维护」中维护，
 * 「编辑」用于维护考试安排、预约设置、考官出分等运营配置。
 */
const ExamOpen: React.FC = () => {
  const [exams, setExams] = useState<TheoryExamRecord[]>(INITIAL_EXAMS)
  const [kw, setKw] = useState('')
  const [activeTab, setActiveTab] = useState<'全部' | ExamStatus>('全部')
  // 左侧分类树选中项
  const [selectedKey, setSelectedKey] = useState<string>(ALL_KEY)

  // 编辑（运营配置表单）
  const [editing, setEditing] = useState<TheoryExamRecord | null>(null)
  // 新建考试：先选考试类型 + 出题方式，再进入运营配置表单
  const [pickOpen, setPickOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCtx, setNewCtx] = useState<{ examType: string; pickerMode: string }>({
    examType: '理论考试',
    pickerMode: '统一考试',
  })
  // 考生管理 / 考官设置 / 考试须知 / 复制 / 延期
  const [candidateExam, setCandidateExam] = useState<TheoryExamRecord | null>(null)
  const [examinerExam, setExaminerExam] = useState<TheoryExamRecord | null>(null)
  const [noticeExam, setNoticeExam] = useState<TheoryExamRecord | null>(null)
  const [copySource, setCopySource] = useState<TheoryExamRecord | null>(null)
  const [delayExam, setDelayExam] = useState<TheoryExamRecord | null>(null)
  // 成绩单：查看该考试的考生答卷
  const [reportExam, setReportExam] = useState<TheoryExamRecord | null>(null)

  /** 左侧分类列表：直接按「考试分类」一级聚合当前考试数据（不区分理论 / 实操） */
  const categories = useMemo(() => {
    const cm = new Map<string, number>()
    exams.forEach((e) => {
      const c = e.category || '未分类'
      cm.set(c, (cm.get(c) ?? 0) + 1)
    })
    return [
      { key: ALL_KEY, name: '全部考试', count: exams.length },
      ...Array.from(cm.entries()).map(([c, n]) => ({ key: catKey(c), name: c, count: n })),
    ]
  }, [exams])

  const filtered = exams.filter((e) => {
    if (kw && !e.name.includes(kw)) return false
    if (activeTab !== '全部' && computeExamStatus(e) !== activeTab) return false
    if (selectedKey === ALL_KEY) return true
    return (e.category || '未分类') === selectedKey.slice(2)
  })

  const handleSaved = (record: TheoryExamRecord) => {
    const isNew = !editing
    setExams((list) =>
      list.some((x) => x.id === record.id) ? list.map((x) => (x.id === record.id ? record : x)) : [record, ...list],
    )
    setEditing(null)
    setCreating(false)
    message.success(isNew ? '考试已创建' : '考试已保存')
  }

  /** 关闭编辑 / 新建抽屉 */
  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  const handlePublish = (e: TheoryExamRecord) => {
    setExams((list) => list.map((x) => (x.id === e.id ? { ...x, status: '未开始' } : x)))
    message.success(`「${e.name}」已发布`)
  }
  const handleCancelPublish = (e: TheoryExamRecord) => {
    setExams((list) => list.map((x) => (x.id === e.id ? { ...x, status: '未发布' } : x)))
    message.success(`「${e.name}」已取消发布`)
  }
  /** 中止：二次确认后置为「已中止」 */
  const handleAbort = (e: TheoryExamRecord) => {
    Modal.confirm({
      title: '中止考试',
      content: `确定中止「${e.name}」吗？中止后考生将无法再进入考试，状态变更为「已中止」，该操作不可撤销。`,
      okText: '确定中止',
      cancelText: '再想想',
      okButtonProps: { danger: true },
      onOk: () => {
        setExams((list) => list.map((x) => (x.id === e.id ? { ...x, status: '已中止' } : x)))
        message.success(`「${e.name}」已中止`)
      },
    })
  }
  const confirmDelay = (patch: { examTime: string; duration: string; runTime: string }) => {
    if (!delayExam) return
    setExams((list) => list.map((x) => (x.id === delayExam.id ? { ...x, ...patch } : x)))
    message.success(`「${delayExam.name}」已延期至 ${patch.examTime}`)
    setDelayExam(null)
  }
  const handleCopyConfirm = (record: TheoryExamRecord) => {
    setExams((list) => [record, ...list])
    setCopySource(null)
  }

  return (
    <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* 左侧：考试分类（样式与「理论题目」的题目分类一致） */}
      <div style={{ width: 200, flexShrink: 0, background: '#fff', borderRadius: 6, border: '1px solid #f0f0f0', padding: '16px 0' }}>
        <div style={{ padding: '0 12px 12px', fontWeight: 600, fontSize: 14 }}>考试分类</div>
        <div>
          {categories.map((c) => (
            <div
              key={c.key}
              onClick={() => setSelectedKey(c.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '9px 16px',
                cursor: 'pointer',
                fontSize: 13,
                color: c.key === selectedKey ? '#1677ff' : 'rgba(0,0,0,0.65)',
                background: c.key === selectedKey ? '#e6f4ff' : 'transparent',
                fontWeight: c.key === selectedKey ? 600 : 400,
              }}
            >
              <span>{c.name}</span>
              <span style={{ fontSize: 12, color: c.key === selectedKey ? '#1677ff' : 'rgba(0,0,0,0.45)' }}>
                {c.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：状态筛选 + 搜索 + 考试卡片 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 页头：标题 + 状态筛选 + 搜索 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 16, background: '#1677ff', borderRadius: 2 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>开启考试</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPickOpen(true)} style={{ marginLeft: 8 }}>
              新建考试
            </Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {STATUS_TABS.map((t) => (
                <div
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: 13,
                    borderRadius: 4,
                    color: t === activeTab ? '#1677ff' : 'rgba(0,0,0,0.65)',
                    fontWeight: t === activeTab ? 600 : 400,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
            <Input
              placeholder="搜索考试名称"
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              style={{ width: 200 }}
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              allowClear
            />
          </div>
        </div>

        {/* 考试卡片 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {filtered.map((e) => (
            <ExamCard
              key={e.id}
              record={e}
              onEdit={() => setEditing(e)}
              onCandidate={() => setCandidateExam(e)}
              onExaminer={() => setExaminerExam(e)}
              onNotice={() => setNoticeExam(e)}
              onReport={() => setReportExam(e)}
              onCopy={() => setCopySource(e)}
              onDelay={() => setDelayExam(e)}
              onAbort={() => handleAbort(e)}
              onPublish={() => handlePublish(e)}
              onCancelPublish={() => handleCancelPublish(e)}
            />
          ))}
        </div>

        {filtered.length === 0 && <Empty description="该分类下暂无考试" style={{ marginTop: 80 }} />}
      </div>

      {/* 选择出题方式（新建考试第一步） */}
      <PickerModal
        open={pickOpen}
        onCancel={() => setPickOpen(false)}
        onConfirm={(examType, pickerMode) => {
          setNewCtx({ examType, pickerMode })
          setPickOpen(false)
          setEditing(null)
          setCreating(true)
        }}
      />

      {/* 新建 / 编辑考试（运营配置：基本 / 考试安排 / 预约设置 / 考官出分） */}
      <Drawer
        title={null}
        closable={false}
        placement="right"
        width={1333}
        open={!!editing || creating}
        onClose={closeForm}
        styles={{ body: { padding: 0 } }}
        destroyOnClose
      >
        {(editing || creating) && (
          <TheoryExamForm
            variant="exam"
            initial={editing}
            examType={editing?.examType ?? newCtx.examType}
            pickerMode={editing?.pickerMode ?? newCtx.pickerMode}
            onBack={closeForm}
            onSaved={handleSaved}
          />
        )}
      </Drawer>

      {/* 考生管理 */}
      <CandidateModal open={!!candidateExam} exam={candidateExam} onClose={() => setCandidateExam(null)} />

      {/* 考官设置 */}
      <ExaminerSettingsDrawer
        open={!!examinerExam}
        exam={examinerExam}
        onClose={() => setExaminerExam(null)}
        onSave={(record) => {
          setExams((list) => list.map((x) => (x.id === record.id ? record : x)))
          setExaminerExam(null)
          message.success('考官设置已保存')
        }}
      />

      {/* 考试须知 */}
      <CandidateNoticeDrawer
        open={!!noticeExam}
        examId={noticeExam?.id}
        examName={noticeExam?.name}
        onClose={() => setNoticeExam(null)}
      />

      {/* 成绩单：该考试的考生答卷 */}
      <Drawer
        title={reportExam ? `成绩单 - ${reportExam.name}` : '成绩单'}
        placement="right"
        width={1333}
        open={!!reportExam}
        onClose={() => setReportExam(null)}
        destroyOnClose
      >
        <MarkingHall scope="all" examName={reportExam?.name} />
      </Drawer>

      {/* 延期 */}
      <DelayModal exam={delayExam} onClose={() => setDelayExam(null)} onConfirm={confirmDelay} />

      {/* 复制 */}
      <CopyExamDrawer source={copySource} onClose={() => setCopySource(null)} onConfirm={handleCopyConfirm} />
    </div>
  )
}

export default ExamOpen
