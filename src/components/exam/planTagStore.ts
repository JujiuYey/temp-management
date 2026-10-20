// 计划标记：可新增 / 编辑 / 删除的标记内容集合。
// 通过 localStorage 持久化，使「编辑考试抽屉」中的计划标记下拉与「计划标记」管理页保持一致。

export interface PlanTagItem {
  id: string
  name: string
  status: '启用' | '停用'
}

const STORAGE_KEY = 'exam_plan_tags'

// 初始演示数据（与编辑考试抽屉下拉默认项一致）
export const SEED_PLAN_TAGS: PlanTagItem[] = [
  { id: 'pt1', name: '三基三严', status: '启用' },
  { id: 'pt2', name: '新员工培训', status: '启用' },
  { id: 'pt3', name: '专科培训', status: '启用' },
  { id: 'pt4', name: '继续教育', status: '启用' },
  { id: 'pt5', name: '考核认定', status: '启用' },
  { id: 'pt6', name: '院级培训', status: '启用' },
]

const hasStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

export const loadPlanTags = (): PlanTagItem[] => {
  if (!hasStorage()) return SEED_PLAN_TAGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLAN_TAGS))
      return SEED_PLAN_TAGS
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // 兼容旧数据（无 status 字段时默认「启用」）
      return parsed.map((p: Partial<PlanTagItem>) => ({
        id: p.id ?? `pt-${Date.now()}`,
        name: p.name ?? '',
        status: p.status ?? '启用',
      }))
    }
    return SEED_PLAN_TAGS
  } catch {
    return SEED_PLAN_TAGS
  }
}

export const savePlanTags = (items: PlanTagItem[]): void => {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* 忽略写入异常（如隐私模式） */
  }
}

/** 仅返回标记名称数组，供下拉选项使用 */
export const getPlanTagNames = (): string[] => loadPlanTags().map((t) => t.name)
