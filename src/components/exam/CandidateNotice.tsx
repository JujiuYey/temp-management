import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Drawer, Button, Select, Tooltip, Dropdown, message } from 'antd'
import {
  UndoOutlined,
  RedoOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  FontColorsOutlined,
  HighlightOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ClearOutlined,
  SaveOutlined,
  CloseOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

// ===== 选项常量 =====
const FONT_FAMILIES = [
  { label: '仿宋', value: 'FangSong, 仿宋, serif' },
  { label: '宋体', value: 'SimSun, 宋体, serif' },
  { label: '黑体', value: 'SimHei, 黑体, sans-serif' },
  { label: '楷体', value: 'KaiTi, 楷体, serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", 微软雅黑, sans-serif' },
  { label: '方正小标宋', value: '"FZXiaoBiaoSong-B05S", 方正小标宋简体, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
]

const FONT_SIZES = [
  { label: '初号', value: '42px' },
  { label: '小初', value: '36px' },
  { label: '一号', value: '26px' },
  { label: '小一', value: '24px' },
  { label: '二号', value: '22px' },
  { label: '小二', value: '18px' },
  { label: '三号', value: '16px' },
  { label: '小三', value: '15px' },
  { label: '四号', value: '14px' },
  { label: '小四', value: '12px' },
  { label: '五号', value: '10.5px' },
]

const TEXT_COLORS = [
  '#000000', '#262626', '#595959', '#8c8c8c', '#bfbfbf',
  '#d9363e', '#d46b08', '#d4b106', '#237804', '#08979c',
  '#1677ff', '#531dab', '#c41d7f',
]

const HIGHLIGHT_COLORS = [
  '#ffff00', '#a0e75a', '#00ff00', '#00ffff', '#7fdbff',
  '#ffc000', '#ff7c80', '#e6e6e6',
]

const DEFAULT_HTML = `
<div style="text-align:center;font-size:22px;font-weight:700;letter-spacing:2px;margin-bottom:4px;">考生须知</div>
<div style="text-align:center;color:#8c8c8c;font-size:13px;margin-bottom:22px;">（理论 / 实操考核通用版）</div>
<div style="font-weight:700;margin:16px 0 6px;">一、考前准备</div>
<div>1. 考生须在开考前 15 分钟到达指定考场，凭本人有效身份证件及准考证入场，迟到 20 分钟以上者不得入场。</div>
<div>2. 入场后按座位号就座，将证件置于桌面左上角备查，不得随意调换座位。</div>
<div style="font-weight:700;margin:16px 0 6px;">二、考场纪律</div>
<div>1. 严禁携带手机、智能手表、电子存储设备等与考试无关的物品进入考场，已携带者须关机后存放于指定位置。</div>
<div>2. 考试期间不得交头接耳、左顾右盼，不得抄袭、传递答案或协助他人作弊。</div>
<div>3. 如遇试卷字迹不清、设备故障等问题，应举手示意监考人员，不得询问试题内容。</div>
<div style="font-weight:700;margin:16px 0 6px;">三、答卷要求</div>
<div>1. 须在规定的答题区域内作答，字迹工整、卷面整洁，不得在卷面做任何标记。</div>
<div>2. 交卷后应立即离开考场，不得在考场附近逗留、喧哗。</div>
<div style="font-weight:700;margin:16px 0 6px;">四、违规处理</div>
<div>考试期间违反上述规定者，视情节轻重给予口头警告、取消当次考试成绩，直至按医院相关管理规定处理。</div>
`

// 会话级存储：按考试 id 保存考生须知内容（演示用）
const NOTICE_STORE = new Map<string, string>()

// ===== 工具栏按钮 =====
const ToolBtn: React.FC<{
  tip: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}> = ({ tip, active, onClick, children }) => (
  <Tooltip title={tip} mouseEnterDelay={0.3}>
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid transparent',
        borderRadius: 4,
        background: active ? '#e6f4ff' : 'transparent',
        color: active ? '#1677ff' : 'rgba(0,0,0,0.72)',
        cursor: 'pointer',
        fontSize: 14,
        padding: 0,
        transition: 'background .15s',
      }}
    >
      {children}
    </button>
  </Tooltip>
)

const GroupDivider: React.FC = () => (
  <span style={{ width: 1, height: 18, background: '#e8e8e8', margin: '0 6px', flexShrink: 0 }} />
)

// ===== 颜色选择按钮 =====
const ColorButton: React.FC<{
  tip: string
  icon: React.ReactNode
  colors: string[]
  onPick: (c: string) => void
}> = ({ tip, icon, colors, onPick }) => {
  const panel = (
    <div
      style={{
        background: '#fff',
        borderRadius: 6,
        padding: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        width: 196,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {colors.map((c) => (
          <div
            key={c}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(c)}
            title={c}
            style={{
              width: 18,
              height: 18,
              borderRadius: 3,
              background: c,
              border: '1px solid rgba(0,0,0,0.15)',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>自定义</span>
        <input
          type="color"
          onChange={(e) => onPick(e.target.value)}
          style={{ width: 32, height: 22, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
        />
      </div>
    </div>
  )
  return (
    <Dropdown trigger={['click']} dropdownRender={() => panel} placement="bottomLeft">
      <Tooltip title={tip} mouseEnterDelay={0.3}>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          style={{
            width: 28,
            height: 28,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid transparent',
            borderRadius: 4,
            background: 'transparent',
            color: 'rgba(0,0,0,0.72)',
            cursor: 'pointer',
            fontSize: 14,
            padding: 0,
          }}
        >
          {icon}
        </button>
      </Tooltip>
    </Dropdown>
  )
}

// ===== 考生须知 Word 编辑抽屉 =====
const CandidateNoticeDrawer: React.FC<{
  open: boolean
  examId?: string
  examName?: string
  onClose: () => void
}> = ({ open, examId, examName, onClose }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<Record<string, boolean>>({})
  const [fontFamily, setFontFamily] = useState<string | undefined>()
  const [fontSize, setFontSize] = useState<string | undefined>()

  useEffect(() => {
    if (open && editorRef.current) {
      editorRef.current.innerHTML = (examId && NOTICE_STORE.get(examId)) || DEFAULT_HTML
    }
  }, [open, examId])

  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }, [])

  // 同步工具栏激活态
  useEffect(() => {
    if (!open) return
    const sync = () => {
      if (!editorRef.current) return
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      if (!editorRef.current.contains(sel.anchorNode)) return
      const q = (c: string) => {
        try {
          return document.queryCommandState(c)
        } catch {
          return false
        }
      }
      setActive({
        bold: q('bold'),
        italic: q('italic'),
        underline: q('underline'),
        strikeThrough: q('strikeThrough'),
        justifyLeft: q('justifyLeft'),
        justifyCenter: q('justifyCenter'),
        justifyRight: q('justifyRight'),
        insertUnorderedList: q('insertUnorderedList'),
        insertOrderedList: q('insertOrderedList'),
      })
    }
    document.addEventListener('selectionchange', sync)
    return () => document.removeEventListener('selectionchange', sync)
  }, [open])

  // 设置字号：execCommand('fontSize') 生成 <font size=7>，替换为 span 精确 px
  const setFontSizePx = (px: string) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    document.execCommand('fontSize', false, '7')
    el.querySelectorAll('font[size="7"]').forEach((f) => {
      const span = document.createElement('span')
      span.style.fontSize = px
      span.innerHTML = (f as HTMLElement).innerHTML
      f.replaceWith(span)
    })
  }

  const handleSave = () => {
    const html = editorRef.current?.innerHTML ?? ''
    if (examId) NOTICE_STORE.set(examId, html)
    message.success('考生须知已保存')
    onClose()
  }

  return (
    <Drawer
      title={null}
      closable={false}
      placement="right"
      width={1000}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 0 } }}
      destroyOnClose
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {/* 顶栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: '#e6f4ff',
                color: '#1677ff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              <FileTextOutlined />
            </span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>考生须知</span>
            {examName && (
              <span
                style={{
                  fontSize: 13,
                  color: 'rgba(0,0,0,0.45)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                · {examName}
              </span>
            )}
          </div>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
        </div>

        {/* 工具栏（Word 风格） */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            padding: '6px 12px',
            background: '#fafafa',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <ToolBtn tip="撤销" onClick={() => exec('undo')}>
            <UndoOutlined />
          </ToolBtn>
          <ToolBtn tip="重做" onClick={() => exec('redo')}>
            <RedoOutlined />
          </ToolBtn>

          <GroupDivider />

          <Select
            size="small"
            placeholder="字体"
            style={{ width: 116 }}
            value={fontFamily}
            onChange={(v) => {
              setFontFamily(v)
              exec('fontName', v)
            }}
            options={FONT_FAMILIES}
          />
          <Select
            size="small"
            placeholder="字号"
            style={{ width: 82, marginLeft: 6 }}
            value={fontSize}
            onChange={(v) => {
              setFontSize(v)
              setFontSizePx(v)
            }}
            options={FONT_SIZES}
          />
          <div style={{ width: 6 }} />
          <ToolBtn tip="加粗" active={active.bold} onClick={() => exec('bold')}>
            <BoldOutlined />
          </ToolBtn>
          <ToolBtn tip="倾斜" active={active.italic} onClick={() => exec('italic')}>
            <ItalicOutlined />
          </ToolBtn>
          <ToolBtn tip="下划线" active={active.underline} onClick={() => exec('underline')}>
            <UnderlineOutlined />
          </ToolBtn>
          <ToolBtn tip="删除线" active={active.strikeThrough} onClick={() => exec('strikeThrough')}>
            <StrikethroughOutlined />
          </ToolBtn>
          <ColorButton tip="字体颜色" icon={<FontColorsOutlined />} colors={TEXT_COLORS} onPick={(c) => exec('foreColor', c)} />
          <ColorButton tip="突出显示" icon={<HighlightOutlined />} colors={HIGHLIGHT_COLORS} onPick={(c) => exec('hiliteColor', c)} />

          <GroupDivider />

          <ToolBtn tip="左对齐" active={active.justifyLeft} onClick={() => exec('justifyLeft')}>
            <AlignLeftOutlined />
          </ToolBtn>
          <ToolBtn tip="居中" active={active.justifyCenter} onClick={() => exec('justifyCenter')}>
            <AlignCenterOutlined />
          </ToolBtn>
          <ToolBtn tip="右对齐" active={active.justifyRight} onClick={() => exec('justifyRight')}>
            <AlignRightOutlined />
          </ToolBtn>
          <ToolBtn tip="项目符号" active={active.insertUnorderedList} onClick={() => exec('insertUnorderedList')}>
            <UnorderedListOutlined />
          </ToolBtn>
          <ToolBtn tip="编号列表" active={active.insertOrderedList} onClick={() => exec('insertOrderedList')}>
            <OrderedListOutlined />
          </ToolBtn>
          <ToolBtn tip="减少缩进" onClick={() => exec('outdent')}>
            <ArrowLeftOutlined />
          </ToolBtn>
          <ToolBtn tip="增加缩进" onClick={() => exec('indent')}>
            <ArrowRightOutlined />
          </ToolBtn>

          <GroupDivider />

          <ToolBtn tip="清除格式" onClick={() => exec('removeFormat')}>
            <ClearOutlined />
          </ToolBtn>
        </div>

        {/* 纸张画布 */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#f0f2f5', padding: '20px 0' }}>
          <div
            style={{
              width: 760,
              minHeight: 1040,
              margin: '0 auto',
              background: '#fff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              borderRadius: 2,
              padding: '60px 64px',
            }}
          >
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              style={{
                minHeight: 920,
                outline: 'none',
                fontFamily: 'FangSong, 仿宋, serif',
                fontSize: 16,
                lineHeight: '30px',
                color: '#1a1a1a',
              }}
            />
          </div>
        </div>

        {/* 底栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '12px 16px',
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
          }}
        >
          <Button onClick={onClose}>关闭</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

export default CandidateNoticeDrawer
