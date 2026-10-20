import React from 'react'
import { Modal, Tag } from 'antd'
import { SwapOutlined, CheckOutlined } from '@ant-design/icons'
import { APPS, type AppKey } from '../../config/apps'
import { COLORS } from '../../config/theme'

interface AppSwitcherProps {
  open: boolean
  currentApp: AppKey
  onClose: () => void
  onSwitch: (key: AppKey) => void
}

/**
 * 切换应用面板
 * 逐个列出全部子系统，每个子系统名称后方提供「切换应用」图标按钮
 */
const AppSwitcher: React.FC<AppSwitcherProps> = ({ open, currentApp, onClose, onSwitch }) => {
  const handleSwitch = (key: AppKey) => {
    if (key === currentApp) {
      onClose()
      return
    }
    onSwitch(key)
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={620}
      title={
        <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>
          切换应用
        </span>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {APPS.map((app) => {
          const active = app.key === currentApp
          return (
            <div
              key={app.key}
              onClick={() => handleSwitch(app.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                border: `1px solid ${active ? app.color : COLORS.borderStrong}`,
                background: active ? '#f5faff' : '#fff',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {/* 子系统图标 */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#fff',
                  background: app.color,
                }}
              >
                {app.icon}
              </div>

              {/* 子系统名称 + 描述 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>
                    {app.name}
                  </span>
                  {active && (
                    <Tag color={app.color} style={{ marginInlineEnd: 0 }}>
                      <CheckOutlined /> 当前
                    </Tag>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: COLORS.textTertiary,
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {app.desc}
                </div>
              </div>

              {/* 子系统名称后方：切换应用图标按钮 */}
              <div
                title={active ? '当前应用' : `切换到${app.name}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSwitch(app.key)
                }}
                style={{
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  cursor: 'pointer',
                  color: active ? COLORS.textTertiary : app.color,
                  background: active ? '#f5f5f5' : '#fff',
                  border: `1px solid ${active ? COLORS.borderStrong : app.color}`,
                  transition: 'all 0.2s',
                }}
              >
                <SwapOutlined />
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export default AppSwitcher
