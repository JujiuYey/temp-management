import React from 'react'
import { Dropdown, Space, Avatar, Typography, Tooltip } from 'antd'
import { UserOutlined, DownOutlined, SwapOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { APP_MAP, type AppKey } from '../../config/apps'
import { COLORS, LAYOUT } from '../../config/theme'

const { Text } = Typography

const userMenuItems: MenuProps['items'] = [
  { key: 'profile', label: '个人中心' },
  { key: 'settings', label: '系统设置' },
  { type: 'divider' },
  { key: 'logout', label: '退出登录', danger: true },
]

interface TopNavbarProps {
  currentApp: AppKey
  onOpenSwitcher: () => void
}

const TopNavbar: React.FC<TopNavbarProps> = ({ currentApp, onOpenSwitcher }) => {
  const app = APP_MAP[currentApp]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: LAYOUT.headerHeight,
        padding: '0 24px',
        background: COLORS.headerBg,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {/* 左侧：平台 Logo + 名称 + 当前子系统 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          医
        </div>
        <Text strong style={{ fontSize: 16, color: COLORS.brandDark }}>
          医院综合管理平台
        </Text>

        <span style={{ width: 1, height: 20, background: COLORS.borderStrong, margin: '0 4px' }} />

        {/* 当前子系统名称 + 其后方的「切换应用」图标按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, color: app.color }}>{app.icon}</span>
          <Text strong style={{ fontSize: 15, color: COLORS.textPrimary }}>
            {app.name}
          </Text>
          <Tooltip title="切换应用">
            <div
              onClick={onOpenSwitcher}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: COLORS.primary,
                fontSize: 15,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.primaryLight
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <SwapOutlined />
            </div>
          </Tooltip>
        </div>
      </div>

      {/* 右侧：用户信息 */}
      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: COLORS.primary }} />
          <Text style={{ fontSize: 14 }}>管理员</Text>
          <DownOutlined style={{ fontSize: 12, color: COLORS.textTertiary }} />
        </Space>
      </Dropdown>
    </div>
  )
}

export default TopNavbar
