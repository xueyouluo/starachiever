import { create } from 'zustand'
import * as storage from '../services/storage'
import { syncToCloud } from '../services/cloud'
import { createDefaultChild } from '../constants'

// 后台静默同步，不阻塞操作，失败不提示
const backgroundSync = () => {
  storage.getData().then(data => {
    if (data) syncToCloud(data).catch(() => {})
  }).catch(() => {})
}

interface AppState {
  activeChild: ChildProfile | null
  children: ChildProfile[]
  isLoading: boolean

  // Actions
  init: () => Promise<void>
  setActiveChild: (child: ChildProfile) => Promise<void>
  toggleTask: (taskId: string) => Promise<void>
  redeemReward: (rewardId: string) => Promise<void>
  addChild: (child: ChildProfile) => Promise<void>
  updateChild: (child: ChildProfile) => Promise<void>
  deleteChild: (childId: string) => Promise<void>
  addTask: (task: Task) => Promise<void>
  updateTask: (task: Task) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  addReward: (reward: Reward) => Promise<void>
  updateReward: (reward: Reward) => Promise<void>
  deleteReward: (rewardId: string) => Promise<void>
  addCategory: (category: Category) => Promise<void>
  updateCategory: (category: Category) => Promise<void>
  deleteCategory: (categoryId: string) => Promise<void>
  archiveCategory: (categoryId: string) => Promise<void>
  exportData: () => Promise<string>
  importData: (jsonData: string) => Promise<boolean>
  checkBadgeUnlock: (child: ChildProfile) => string[]
}

export const useStore = create<AppState>((set, get) => ({
  activeChild: null,
  children: [],
  isLoading: true,

  init: async () => {
    set({ isLoading: true })
    try {
      const data = await storage.getData()
      if (data && data.children.length > 0) {
        // 有数据，加载现有数据
        const activeChild = data.children.find(c => c.id === data.activeChildId) || data.children[0]
        set({
          children: data.children,
          activeChild
        })
      } else {
        // 首次使用，创建默认数据
        const defaultChild = createDefaultChild('小宝贝', '👶')
        await storage.setData({
          children: [defaultChild],
          activeChildId: defaultChild.id
        })
        set({
          children: [defaultChild],
          activeChild: defaultChild
        })
      }
    } catch (e) {
      console.error('初始化失败', e)
      // 出错时也创建默认数据
      const defaultChild = createDefaultChild('小宝贝', '👶')
      set({
        children: [defaultChild],
        activeChild: defaultChild
      })
    } finally {
      set({ isLoading: false })
    }
  },

  setActiveChild: async (child) => {
    await storage.setActiveChild(child.id)
    set({ activeChild: child })
  },

  toggleTask: async (taskId) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const task = child.tasks.find(t => t.id === taskId)
    if (!task) return

    const isCompleting = !task.completed

    // 更新任务状态
    const updatedTasks = child.tasks.map(t =>
      t.id === taskId ? { ...t, completed: isCompleting } : t
    )

    // 计算积分变化
    const pointsEarned = isCompleting ? task.points : -task.points
    const newTotalPoints = child.totalPoints + pointsEarned

    // 更新统计数据
    const newStats = { ...child.stats }
    if (isCompleting) {
      newStats.totalTasksCompleted++
      newStats.totalPointsEarned += pointsEarned
    }

    // 更新分类计数
    if (task.category && newStats.categoryCounts) {
      const categoryId = task.category.id || task.category
      if (!newStats.categoryCounts[categoryId]) {
        newStats.categoryCounts[categoryId] = 0
      }
      if (isCompleting) {
        newStats.categoryCounts[categoryId]++
      } else {
        newStats.categoryCounts[categoryId]--
      }
    }

    // 更新 history（记录每天完成任务次数）
    const today = new Date().toISOString().split('T')[0]
    const updatedHistory = { ...child.history }
    if (!updatedHistory[today]) {
      updatedHistory[today] = 0
    }
    updatedHistory[today] += isCompleting ? 1 : -1
    if (updatedHistory[today] <= 0) {
      delete updatedHistory[today]
    }

    const updatedChild = {
      ...child,
      tasks: updatedTasks,
      totalPoints: newTotalPoints,
      stats: newStats,
      history: updatedHistory
    }

    // 检查成就解锁
    const newlyUnlockedBadges = get().checkBadgeUnlock(updatedChild)

    // 添加新解锁的勋章
    const finalChild = {
      ...updatedChild,
      unlockedBadges: [...updatedChild.unlockedBadges, ...newlyUnlockedBadges]
    }

    // 保存到存储
    await storage.updateChild(finalChild)

    set({
      activeChild: finalChild,
      children: state.children.map(c => c.id === child.id ? finalChild : c)
    })

    backgroundSync()
    return newlyUnlockedBadges
  },

  redeemReward: async (rewardId) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const reward = child.rewards.find(r => r.id === rewardId)
    if (!reward) return

    if (child.totalPoints < reward.cost) {
      throw new Error('积分不足')
    }

    // 创建兑换记录
    const redemption: PointRedemption = {
      id: Date.now().toString(),
      rewardId: reward.id,
      rewardName: reward.title,
      cost: reward.cost,
      date: new Date().toISOString()
    }

    const updatedChild = {
      ...child,
      totalPoints: child.totalPoints - reward.cost,
      redemptions: [...child.redemptions, redemption]
    }

    await storage.updateChild(updatedChild)

    set({
      activeChild: updatedChild,
      children: state.children.map(c => c.id === child.id ? updatedChild : c)
    })
    backgroundSync()
  },

  addChild: async (child) => {
    const state = get()
    const updatedChildren = [...state.children, child]
    await storage.setData({
      children: updatedChildren,
      activeChildId: child.id
    })
    set({
      children: updatedChildren,
      activeChild: child
    })
    backgroundSync()
  },

  updateChild: async (child) => {
    await storage.updateChild(child)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? child : c),
      activeChild: state.activeChild?.id === child.id ? child : state.activeChild
    }))
    backgroundSync()
  },

  deleteChild: async (childId) => {
    const state = get()
    const updatedChildren = state.children.filter(c => c.id !== childId)
    const activeChildId = state.activeChild?.id === childId ? null : state.activeChild?.id || null
    await storage.setData({
      children: updatedChildren,
      activeChildId
    })
    set({
      children: updatedChildren,
      activeChild: state.activeChild?.id === childId ? null : state.activeChild
    })
    backgroundSync()
  },

  addTask: async (task) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const updatedChild = {
      ...child,
      tasks: [...child.tasks, task]
    }

    await storage.updateChild(updatedChild)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? updatedChild : c),
      activeChild: updatedChild
    }))
    backgroundSync()
  },

  updateTask: async (task) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const updatedChild = {
      ...child,
      tasks: child.tasks.map(t => t.id === task.id ? task : t)
    }

    await storage.updateChild(updatedChild)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? updatedChild : c),
      activeChild: updatedChild
    }))
    backgroundSync()
  },

  deleteTask: async (taskId) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const updatedChild = {
      ...child,
      tasks: child.tasks.filter(t => t.id !== taskId)
    }

    await storage.updateChild(updatedChild)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? updatedChild : c),
      activeChild: updatedChild
    }))
    backgroundSync()
  },

  addReward: async (reward) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const updatedChild = {
      ...child,
      rewards: [...child.rewards, reward]
    }

    await storage.updateChild(updatedChild)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? updatedChild : c),
      activeChild: updatedChild
    }))
    backgroundSync()
  },

  updateReward: async (reward) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const updatedChild = {
      ...child,
      rewards: child.rewards.map(r => r.id === reward.id ? reward : r)
    }

    await storage.updateChild(updatedChild)
    set({ activeChild: updatedChild })
    backgroundSync()
  },

  deleteReward: async (rewardId) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const updatedChild = {
      ...child,
      rewards: child.rewards.filter(r => r.id !== rewardId)
    }

    await storage.updateChild(updatedChild)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? updatedChild : c),
      activeChild: updatedChild
    }))
    backgroundSync()
  },

  addCategory: async (category) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const updatedChild = {
      ...child,
      categories: [...child.categories, category]
    }

    await storage.updateChild(updatedChild)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? updatedChild : c),
      activeChild: updatedChild
    }))
    backgroundSync()
  },

  updateCategory: async (category) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const updatedChild = {
      ...child,
      categories: child.categories.map(c => c.id === category.id ? category : c)
    }

    await storage.updateChild(updatedChild)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? updatedChild : c),
      activeChild: updatedChild
    }))
    backgroundSync()
  },

  deleteCategory: async (categoryId) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    // 检查是否有任务使用该分类
    const hasTasksInCategory = child.tasks.some(t => t.category?.id === categoryId)
    if (hasTasksInCategory) {
      throw new Error('该分类下还有任务，无法删除')
    }

    const updatedChild = {
      ...child,
      categories: child.categories.filter(c => c.id !== categoryId)
    }

    await storage.updateChild(updatedChild)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? updatedChild : c),
      activeChild: updatedChild
    }))
    backgroundSync()
  },

  archiveCategory: async (categoryId) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const updatedChild = {
      ...child,
      categories: child.categories.map(c =>
        c.id === categoryId ? { ...c, isArchived: !c.isArchived } : c
      )
    }

    await storage.updateChild(updatedChild)
    set(state => ({
      children: state.children.map(c => c.id === child.id ? updatedChild : c),
      activeChild: updatedChild
    }))
    backgroundSync()
  },

  exportData: async () => {
    const state = get()
    return JSON.stringify({
      children: state.children,
      exportDate: new Date().toISOString()
    }, null, 2)
  },

  importData: async (jsonData) => {
    try {
      const data = JSON.parse(jsonData)
      if (!data.children || !Array.isArray(data.children)) {
        throw new Error('数据格式不正确')
      }

      await storage.setData({
        children: data.children,
        activeChildId: data.children[0]?.id || null
      })

      set({
        children: data.children,
        activeChild: data.children[0] || null
      })

      backgroundSync()
      return true
    } catch (e) {
      console.error('导入失败', e)
      return false
    }
  },

  checkBadgeUnlock: (child: ChildProfile) => {
    const unlockedBadges: string[] = []

    for (const badge of child.badges) {
      if (child.unlockedBadges.includes(badge.id)) continue

      let unlocked = false

      switch (badge.criteria.type) {
        case 'TOTAL_TASKS':
          unlocked = child.stats.totalTasksCompleted >= badge.criteria.value
          break
        case 'TOTAL_POINTS':
          unlocked = child.totalPoints >= badge.criteria.value
          break
        case 'STREAK':
          unlocked = child.currentStreak >= badge.criteria.value
          break
        case 'CATEGORY_COUNT':
          if (badge.criteria.categoryId) {
            const categoryTasks = child.tasks.filter(
              t => t.category?.id === badge.criteria.categoryId && t.completed
            )
            unlocked = categoryTasks.length >= badge.criteria.value
          }
          break
      }

      if (unlocked) {
        unlockedBadges.push(badge.id)
      }
    }

    return unlockedBadges
  }
}))
