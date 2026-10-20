import type { ThemeConfig } from 'antd'

/**
 * 全局统一配色 —— 全平台（考勤管理 / 智慧医务 / 协同办公 / 后台管理）共用
 * 主色采用医疗蓝，界面整体为浅色（light）风格
 */
export const COLORS = {
  /** 品牌主色（医疗蓝） */
  primary: '#1677ff',
  primaryDark: '#0958d9',
  primaryLight: '#e6f4ff',
  /** 品牌深色（Logo 渐变、标题文字） */
  brandDark: '#1a2a44',
  /** 布局底色 */
  headerBg: '#ffffff',
  siderBg: '#ffffff',
  contentBg: '#f5f5f5',
  /** 文字 */
  textPrimary: '#1a2a44',
  textSecondary: '#666666',
  textTertiary: '#999999',
  /** 描边 */
  border: '#f0f0f0',
  borderStrong: '#e8e8e8',
} as const

/** 布局尺寸 */
export const LAYOUT = {
  headerHeight: 56,
  breadcrumbHeight: 48,
  siderWidth: 220,
  siderCollapsedWidth: 56,
} as const

/** AntD 全局主题 —— 通过 ConfigProvider 注入，保证四个子系统视觉一致 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: COLORS.primary,
    colorInfo: COLORS.primary,
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorTextBase: COLORS.textPrimary,
    colorBgLayout: COLORS.contentBg,
    borderRadius: 6,
    fontSize: 14,
    controlHeight: 32,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerBg: COLORS.headerBg,
      siderBg: COLORS.siderBg,
      bodyBg: COLORS.contentBg,
      headerHeight: LAYOUT.headerHeight,
      headerPadding: '0 24px',
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemSelectedBg: COLORS.primaryLight,
      itemSelectedColor: COLORS.primary,
      itemHoverBg: '#f5f5f5',
      itemActiveBg: COLORS.primaryLight,
      itemBorderRadius: 6,
      itemMarginInline: 8,
      itemHeight: 38,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: COLORS.textPrimary,
      rowHoverBg: '#f5faff',
    },
  },
}
