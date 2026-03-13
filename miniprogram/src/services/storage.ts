import Taro from '@tarojs/taro'

const STORAGE_KEY = 'starachiever_data_v6'

export interface StorageData {
  children: ChildProfile[]
  activeChildId: string | null
}

/**
 * 从本地存储获取数据
 */
export const getData = async (): Promise<StorageData | null> => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return null
  } catch (e) {
    console.error('读取数据失败', e)
    return null
  }
}

/**
 * 保存数据到本地存储
 */
export const setData = async (data: StorageData): Promise<void> => {
  try {
    // 本地存储
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('存储失败', e)
    throw e
  }
}

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

export default {
  getData,
  setData,
  updateChild,
  getActiveChild,
  setActiveChild
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
