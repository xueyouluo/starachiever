import { create } from 'zustand'
import * as storage from '../services/storage'
import { syncToCloud, restoreFromCloud } from '../services/cloud'
import { createDefaultChild } from '../constants'
import { PET_TYPES, PET_ACTIONS } from '../constants/pets'
import { applyTimeDecay, calcPetStage, getChildPets, withNormalizedChildPets } from '../utils/petUtils'
import type { Category, ChildProfile, PetActionType, Pet, PointRedemption, Reward, Task } from '../types'

// 后台静默同步，不阻塞操作，失败不提示
const backgroundSync = () => {
  storage.getData().then(data => {
    if (data) syncToCloud(data).catch((e) => {
      console.error('[服务器同步失败]', e)
    })
  }).catch((e) => {
    console.error('[读取本地数据失败]', e)
  })
}

// 每日重置：若 lastLoginDate 不是今天，重置任务并更新连续打卡天数
const applyDailyReset = (child: ChildProfile): { child: ChildProfile; changed: boolean } => {
  const today = new Date().toISOString().split('T')[0]
  if (child.lastLoginDate === today) {
    return { child, changed: false }
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // 方案B：昨天打开过 AND 昨天至少完成1个任务，才算连续
  const yesterdayTaskCount = child.history[yesterdayStr] || 0
  const newStreak = (child.lastLoginDate === yesterdayStr && yesterdayTaskCount > 0)
    ? child.currentStreak + 1
    : 0

  const resetChild: ChildProfile = {
    ...child,
    tasks: child.tasks.map(t => ({ ...t, completed: false })),
    lastLoginDate: today,
    currentStreak: newStreak
  }

  return { child: resetChild, changed: true }
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
  adoptPet: (petTypeId: string, petName: string) => Promise<void>
  carePet: (petId: string, actionType: PetActionType) => Promise<void>
  syncPetDecay: () => Promise<void>
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
        let anyChanged = false
        const updatedChildren = data.children.map(child => {
          const { child: resetChild, changed } = applyDailyReset(child)
          if (changed) anyChanged = true
          return resetChild
        })

        const localData = {
          ...data,
          children: updatedChildren
        }

        if (anyChanged) {
          await storage.setData(localData)
        }

        const activeChild = updatedChildren.find(c => c.id === data.activeChildId) || updatedChildren[0]
        set({
          children: updatedChildren,
          activeChild
        })

        backgroundSync()
      } else {
        // 本地无数据，先尝试从服务器恢复
        const cloudSnapshot = await restoreFromCloud()
        if (cloudSnapshot?.data && cloudSnapshot.data.children?.length > 0) {
          const normalizedCloudData = storage.normalizeStorageData({
            ...cloudSnapshot.data,
            lastSyncedAt: cloudSnapshot.serverUpdatedAt,
            localUpdatedAt: cloudSnapshot.clientUpdatedAt || cloudSnapshot.serverUpdatedAt || null,
          })
          await storage.setData(normalizedCloudData, {
            markLocalUpdate: false,
            lastSyncedAt: cloudSnapshot.serverUpdatedAt || null,
            localUpdatedAt: cloudSnapshot.clientUpdatedAt || cloudSnapshot.serverUpdatedAt || null,
          })
          const activeChild = normalizedCloudData.children.find(c => c.id === normalizedCloudData.activeChildId) || normalizedCloudData.children[0]
          set({ children: normalizedCloudData.children, activeChild })
        } else {
          // 服务器也没有，首次使用，创建默认数据
          const defaultChild = createDefaultChild('小宝贝', '👶')
          await storage.setData({
            children: [defaultChild],
            activeChildId: defaultChild.id
          })
          set({
            children: [defaultChild],
            activeChild: defaultChild
          })
          backgroundSync()
        }
      }
    } catch (e) {
      console.error('初始化失败', e)
      // 出错时先尝试从服务器恢复
      try {
        const cloudSnapshot = await restoreFromCloud()
        if (cloudSnapshot?.data && cloudSnapshot.data.children?.length > 0) {
          const normalizedCloudData = storage.normalizeStorageData({
            ...cloudSnapshot.data,
            lastSyncedAt: cloudSnapshot.serverUpdatedAt,
            localUpdatedAt: cloudSnapshot.clientUpdatedAt || cloudSnapshot.serverUpdatedAt || null,
          })
          await storage.setData(normalizedCloudData, {
            markLocalUpdate: false,
            lastSyncedAt: cloudSnapshot.serverUpdatedAt || null,
            localUpdatedAt: cloudSnapshot.clientUpdatedAt || cloudSnapshot.serverUpdatedAt || null,
          })
          const activeChild = normalizedCloudData.children.find(c => c.id === normalizedCloudData.activeChildId) || normalizedCloudData.children[0]
          set({ children: normalizedCloudData.children, activeChild })
          return
        }
      } catch {}
      // 服务器也失败，创建默认数据
      const defaultChild = createDefaultChild('小宝贝', '👶')
      await storage.setData({ children: [defaultChild], activeChildId: defaultChild.id })
      set({ children: [defaultChild], activeChild: defaultChild })
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

    const today = new Date().toISOString().split('T')[0]
    const completedTime = new Date().toISOString()

    // 更新 history（记录每天完成任务次数）
    const updatedHistory = { ...child.history }
    if (!updatedHistory[today]) {
      updatedHistory[today] = 0
    }
    updatedHistory[today] += isCompleting ? 1 : -1
    if (updatedHistory[today] <= 0) {
      delete updatedHistory[today]
    }

    // 更新 dailyHistory（记录每天完成任务明细和完成时间）
    const dailyHistory = child.dailyHistory || {}
    const todayHistory = dailyHistory[today] || { date: today, tasks: [], totalPoints: 0, totalTasks: 0 }
    const existingTasks = Array.isArray(todayHistory.tasks) ? todayHistory.tasks : []
    const nextTasks = isCompleting
      ? [
          ...existingTasks.filter(t => t.id !== task.id),
          {
            id: task.id,
            title: task.title,
            icon: task.icon,
            points: task.points,
            category: task.category,
            completedTime
          }
        ]
      : existingTasks.filter(t => t.id !== task.id)

    const nextTodayHistory = {
      date: today,
      tasks: nextTasks,
      totalPoints: nextTasks.reduce((sum, item) => sum + Number(item.points || 0), 0),
      totalTasks: nextTasks.length
    }
    const updatedDailyHistory = { ...dailyHistory }
    if (nextTodayHistory.totalTasks > 0 || nextTodayHistory.totalPoints !== 0) {
      updatedDailyHistory[today] = nextTodayHistory
    } else {
      delete updatedDailyHistory[today]
    }

    const updatedChild = {
      ...child,
      tasks: updatedTasks,
      totalPoints: newTotalPoints,
      stats: newStats,
      history: updatedHistory,
      dailyHistory: updatedDailyHistory
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

      const normalizedData = storage.normalizeStorageData({
        children: data.children,
        activeChildId: data.children[0]?.id || null
      })

      await storage.setData(normalizedData)

      set({
        children: normalizedData.children,
        activeChild: normalizedData.children[0] || null
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
  },

  adoptPet: async (petTypeId: string, petName: string) => {
    const state = get()
    const child = state.activeChild
    if (!child) return

    const petType = PET_TYPES.find(p => p.id === petTypeId)
    if (!petType) throw new Error('宠物类型不存在')

    if (child.totalPoints < petType.price) {
      throw new Error('积分不足')
    }

    const now = new Date().toISOString()
    const pet: Pet = {
      id: Date.now().toString(),
      petTypeId,
      name: petName,
      stage: 'baby',
      careCount: 0,
      hunger: 80,
      cleanliness: 80,
      happiness: 80,
      lastUpdatedAt: now,
      adoptedAt: now,
      careLogs: [],
    }

    const redemption = {
      id: Date.now().toString() + '_pet',
      rewardId: 'pet_adopt',
      rewardTitle: `领养${petName}`,
      rewardIcon: '🐾',
      cost: petType.price,
      redeemedAt: now,
      date: now.slice(0, 10),
    }

    const updatedChild = withNormalizedChildPets({
      ...child,
      pets: [...getChildPets(child), pet],
      totalPoints: child.totalPoints - petType.price,
      redemptions: [...child.redemptions, redemption],
    })

    await storage.updateChild(updatedChild)
    set(s => ({
      activeChild: updatedChild,
      children: s.children.map(c => c.id === child.id ? updatedChild : c),
    }))
    backgroundSync()
  },

  carePet: async (petId: string, actionType: PetActionType) => {
    const state = get()
    const child = state.activeChild
    const pets = getChildPets(child)
    if (!child || pets.length === 0) throw new Error('没有宠物')

    const currentPet = pets.find(p => p.id === petId)
    if (!currentPet) throw new Error('宠物不存在')

    const petType = PET_TYPES.find(p => p.id === currentPet.petTypeId)
    if (!petType) throw new Error('宠物类型不存在')

    const action = PET_ACTIONS[actionType]
    if (child.totalPoints < action.cost) {
      throw new Error('积分不足')
    }

    // 先应用时间衰减
    const decayedPet = applyTimeDecay(currentPet, petType)

    // 计算效果
    const bonusMap: Record<PetActionType, number> = {
      feed: petType.feedBonus,
      clean: petType.cleanBonus,
      play: petType.playBonus,
    }
    const effect = Math.round(action.baseEffect * bonusMap[actionType])

    let updatedStats = { ...decayedPet }
    if (actionType === 'feed') {
      updatedStats = { ...updatedStats, hunger: Math.min(100, decayedPet.hunger + effect) }
    } else if (actionType === 'clean') {
      updatedStats = { ...updatedStats, cleanliness: Math.min(100, decayedPet.cleanliness + effect) }
    } else if (actionType === 'play') {
      updatedStats = { ...updatedStats, happiness: Math.min(100, decayedPet.happiness + effect) }
    }

    const newCareCount = decayedPet.careCount + 1
    const newStage = calcPetStage(newCareCount)

    // 追加照料日志，保留最近50条
    const now = new Date().toISOString()
    const careLog = {
      id: now,
      actionType,
      cost: action.cost,
      timestamp: now,
    }
    const careLogs = [...decayedPet.careLogs, careLog].slice(-50)

    const updatedPet: Pet = {
      ...updatedStats,
      careCount: newCareCount,
      stage: newStage,
      careLogs,
      lastUpdatedAt: now,
    }

    const redemption = {
      id: now + '_care',
      rewardId: `pet_care_${actionType}`,
      rewardTitle: `${action.label}${currentPet.name}`,
      rewardIcon: action.emoji,
      cost: action.cost,
      redeemedAt: now,
      date: now.slice(0, 10),
    }

    const updatedChild = withNormalizedChildPets({
      ...child,
      pets: pets.map(p => p.id === petId ? updatedPet : p),
      totalPoints: child.totalPoints - action.cost,
      redemptions: [...child.redemptions, redemption],
    })

    await storage.updateChild(updatedChild)
    set(s => ({
      activeChild: updatedChild,
      children: s.children.map(c => c.id === child.id ? updatedChild : c),
    }))
    backgroundSync()
  },

  syncPetDecay: async () => {
    const state = get()
    const child = state.activeChild
    const pets = getChildPets(child)
    if (!child || pets.length === 0) return

    const now = new Date()
    let shouldPersist = false
    let hasUpdates = false

    const updatedPets = pets.map(pet => {
      const petType = PET_TYPES.find(type => type.id === pet.petTypeId)
      if (!petType) return pet

      const decayedPet = applyTimeDecay(pet, petType)
      const minutesElapsed = (now.getTime() - new Date(pet.lastUpdatedAt).getTime()) / (1000 * 60)
      if (minutesElapsed > 0) {
        hasUpdates = true
      }
      if (minutesElapsed > 1) {
        shouldPersist = true
      }

      return decayedPet
    })

    if (!hasUpdates) return

    const updatedChild = withNormalizedChildPets({
      ...child,
      pets: updatedPets,
    })

    if (shouldPersist) {
      await storage.updateChild(updatedChild)
    }

    set(s => ({
      activeChild: updatedChild,
      children: s.children.map(c => c.id === child.id ? updatedChild : c),
    }))
  },
}))
