import React from 'react'
import { Layout, Menu } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { APP_MENUS, DEFAULT_OPEN_KEYS, APP_MAP, type AppKey } from '../../config/apps'
import { COLORS, LAYOUT } from '../../config/theme'

interface SideMenuProps {
  currentApp: AppKey
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  selectedKey: string
  onMenuSelect: (key: string) => void
}

const SideMenu: React.FC<SideMenuProps> = ({
  currentApp,
  collapsed,
  onCollapse,
  selectedKey,
  onMenuSelect,
}) => {
  const [openKeys, setOpenKeys] = React.useState<string[]>(DEFAULT_OPEN_KEYS[currentApp])
  const [prevApp, setPrevApp] = React.useState<AppKey>(currentApp)

  // 切换子系统时重置展开的分组
  if (prevApp !== currentApp) {
    setPrevApp(currentApp)
    setOpenKeys(DEFAULT_OPEN_KEYS[currentApp])
  }

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    onMenuSelect(e.key)
  }

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
  }

  const app = APP_MAP[currentApp]

  return (
    <Layout.Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={null}
      width={LAYOUT.siderWidth}
      collapsedWidth={LAYOUT.siderCollapsedWidth}
      style={{
        background: COLORS.siderBg,
        overflow: 'auto',
        borderRight: `1px solid ${COLORS.border}`,
      }}
    >
      {/* 折叠/展开按钮 */}
      <div
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          paddingRight: collapsed ? 0 : 12,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
          onClick: () => onCollapse(!collapsed),
          style: { fontSize: 16, color: COLORS.textSecondary, cursor: 'pointer' },
        })}
      </div>

      {/* 子系统名称（折叠时隐藏） */}
      {!collapsed && (
        <div
          style={{
            padding: '10px 16px',
            fontSize: 12,
            color: COLORS.textTertiary,
            letterSpacing: 1,
          }}
        >
          {app.name}
        </div>
      )}

      {/* 该子系统的功能菜单 */}
      <Menu
        mode="inline"
        theme="light"
        selectedKeys={[selectedKey]}
        openKeys={collapsed ? undefined : openKeys}
        onClick={handleMenuClick}
        onOpenChange={handleOpenChange}
        items={APP_MENUS[currentApp]}
        style={{ background: 'transparent', borderInlineEnd: 'none' }}
      />
    </Layout.Sider>
  )
}

export default SideMenu
