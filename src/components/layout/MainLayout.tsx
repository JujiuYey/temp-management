import React, { lazy, Suspense, useState } from 'react'
import { Layout, Spin } from 'antd'
import TopNavbar from './TopNavbar'
import SideMenu from './SideMenu'
import AppSwitcher from './AppSwitcher'
import { APP_MAP, BREADCRUMB_MAP, type AppKey } from '../../config/apps'
import { COLORS, LAYOUT } from '../../config/theme'

// 子系统按需加载，避免首屏把 5 个子系统的代码（含图表库）全部下载
const AttendanceApp = lazy(() => import('../attendance/AttendanceApp'))
const MedicalApp = lazy(() => import('../medical/MedicalApp'))
const CoopApp = lazy(() => import('../coop/CoopApp'))
const AdminApp = lazy(() => import('../admin/AdminApp'))
const ExamApp = lazy(() => import('../exam/ExamApp'))

const { Header, Content } = Layout

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [currentApp, setCurrentApp] = useState<AppKey>('exam')
  const [selectedKey, setSelectedKey] = useState(APP_MAP.exam.defaultMenuKey)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  /** 切换子系统：落到该子系统的默认页面 */
  const handleSwitchApp = (key: AppKey) => {
    setCurrentApp(key)
    setSelectedKey(APP_MAP[key].defaultMenuKey)
  }

  const renderContent = () => {
    switch (currentApp) {
      case 'attendance':
        return <AttendanceApp pageKey={selectedKey} />
      case 'medical':
        return <MedicalApp pageKey={selectedKey} onNavigate={setSelectedKey} />
      case 'coop':
        return <CoopApp pageKey={selectedKey} />
      case 'admin':
        return <AdminApp pageKey={selectedKey} />
      case 'exam':
        return <ExamApp pageKey={selectedKey} />
      default:
        return null
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 顶部导航栏（统一） */}
      <Header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: 0,
          height: LAYOUT.headerHeight,
          lineHeight: `${LAYOUT.headerHeight}px`,
          background: COLORS.headerBg,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <TopNavbar currentApp={currentApp} onOpenSwitcher={() => setSwitcherOpen(true)} />
      </Header>

      <Layout
        style={{
          marginTop: LAYOUT.headerHeight,
          height: `calc(100vh - ${LAYOUT.headerHeight}px)`,
        }}
      >
        {/* 左侧菜单（按子系统渲染） */}
        <SideMenu
          currentApp={currentApp}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          selectedKey={selectedKey}
          onMenuSelect={setSelectedKey}
        />

        <Layout style={{ background: COLORS.contentBg, overflow: 'hidden' }}>
          {/* 面包屑 */}
          <div
            style={{
              height: LAYOUT.breadcrumbHeight,
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              fontSize: 14,
              color: COLORS.textSecondary,
              borderBottom: `1px solid ${COLORS.border}`,
              background: '#fff',
            }}
          >
            {BREADCRUMB_MAP[selectedKey] ?? APP_MAP[currentApp].name}
          </div>

          {/* 内容区 */}
          <Content
            style={{
              padding: 15,
              background: COLORS.contentBg,
              height: `calc(100vh - ${LAYOUT.headerHeight + LAYOUT.breadcrumbHeight}px)`,
              overflowY: 'auto',
            }}
          >
            <Suspense
              fallback={
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
                  <Spin tip="加载中…" size="large">
                    <div style={{ width: 120, height: 60 }} />
                  </Spin>
                </div>
              }
            >
              {renderContent()}
            </Suspense>
          </Content>
        </Layout>
      </Layout>

      {/* 切换应用面板 */}
      <AppSwitcher
        open={switcherOpen}
        currentApp={currentApp}
        onClose={() => setSwitcherOpen(false)}
        onSwitch={handleSwitchApp}
      />
    </Layout>
  )
}

export default MainLayout
