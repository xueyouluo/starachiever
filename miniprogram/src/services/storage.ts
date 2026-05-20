import Taro from '@tarojs/taro'
import type { ChildProfile } from '../types'
import { withNormalizedChildPets } from '../utils/petUtils'

const STORAGE_KEY = 'starachiever_data_v6'

export interface StorageData {
  children: ChildProfile[]
  activeChildId: string | null
  lastSyncedAt?: string | null
  localUpdatedAt?: string | null
}

interface SetDataOptions {
  markLocalUpdate?: boolean
  lastSyncedAt?: string | null
  localUpdatedAt?: string | null
}

const nowIso = () => new Date().toISOString()

export const normalizeStorageData = <T extends StorageData>(data: T): T => {
  const children = Array.isArray(data.children)
    ? data.children.map(child => withNormalizedChildPets(child))
    : []

  return {
    ...data,
    children,
    activeChildId: data.activeChildId ?? children[0]?.id ?? null,
    lastSyncedAt: data.lastSyncedAt ?? null,
    localUpdatedAt: data.localUpdatedAt ?? null,
  }
}

const getExistingData = (): StorageData | null => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    return raw ? normalizeStorageData(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

/**
 * 从本地存储获取数据
 */
export const getData = async (): Promise<StorageData | null> => {
  try {
    return getExistingData()
  } catch (e) {
    console.error('读取数据失败', e)
    return null
  }
}

/**
 * 保存数据到本地存储
 */
export const setData = async (data: StorageData, options: SetDataOptions = {}): Promise<void> => {
  try {
    const existingData = getExistingData()
    const normalizedData = normalizeStorageData(data)
    const shouldMarkLocalUpdate = options.markLocalUpdate !== false
    const dataToSave: StorageData = {
      ...normalizedData,
      lastSyncedAt: options.lastSyncedAt !== undefined
        ? options.lastSyncedAt
        : normalizedData.lastSyncedAt ?? existingData?.lastSyncedAt ?? null,
      localUpdatedAt: options.localUpdatedAt !== undefined
        ? options.localUpdatedAt
        : shouldMarkLocalUpdate
          ? nowIso()
          : normalizedData.localUpdatedAt ?? existingData?.localUpdatedAt ?? null,
    }

    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(dataToSave))
  } catch (e) {
    console.error('存储失败', e)
    throw e
  }
}

export const markSyncedAt = async (serverUpdatedAt: string): Promise<void> => {
  const data = await getData()
  if (!data) return

  await setData(data, {
    markLocalUpdate: false,
    lastSyncedAt: serverUpdatedAt,
    localUpdatedAt: data.localUpdatedAt ?? serverUpdatedAt,
  })
}

export const toCloudData = (data: StorageData): StorageData => ({
  children: data.children,
  activeChildId: data.activeChildId,
})

/**
 * 更新指定孩子数据
 */
export const updateChild = async (child: ChildProfile): Promise<void> => {
  const data = await getData()
  if (!data) return

  const updatedChildren = data.children.map(c =>
    c.id === child.id ? child : c
  )

  await setData({
    ...data,
    children: updatedChildren
  })
}

/**
 * 获取当前活跃孩子
 */
export const getActiveChild = async (): Promise<ChildProfile | null> => {
  const data = await getData()
  if (!data || !data.activeChildId) return null

  return data.children.find(c => c.id === data.activeChildId) || null
}

/**
 * 设置活跃孩子
 */
export const setActiveChild = async (childId: string): Promise<void> => {
  const data = await getData()
  if (!data) return

  await setData({
    ...data,
    activeChildId: childId
  })
}

export default {
  getData,
  setData,
  markSyncedAt,
  toCloudData,
  updateChild,
  getActiveChild,
  setActiveChild
}
