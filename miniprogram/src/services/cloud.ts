import Taro from '@tarojs/taro'
import { StorageData } from './storage'

/**
 * 初始化云开发
 */
export const initCloud = (): void => {
  try {
    if (Taro.cloud) {
      Taro.cloud.init({
        env: 'cloudbase-0gdzglds6ac28987',
        traceUser: true
      })
      console.log('云开发初始化成功')
    } else {
      console.warn('当前环境不支持云开发')
    }
  } catch (e) {
    console.error('云开发初始化失败', e)
  }
}

/**
 * 同步数据到云数据库
 */
export const syncToCloud = async (data: StorageData): Promise<void> => {
  try {
    if (!Taro.cloud) {
      console.warn('云开发未初始化，跳过云端同步')
      return
    }

    // 获取用户 openid
    const { result } = await Taro.cloud.callFunction({
      name: 'login'
    })

    const openid = (result as any).openid

    // 保存到云数据库
    const db = Taro.cloud.database()
    await db.collection('users').doc(openid).set({
      data: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    })

    console.log('云端同步成功')
  } catch (e) {
    console.error('云端同步失败', e)
    throw e
  }
}

/**
 * 从云数据库恢复数据
 */
export const restoreFromCloud = async (): Promise<StorageData | null> => {
  try {
    if (!Taro.cloud) {
      console.warn('云开发未初始化')
      return null
    }

    // 获取用户 openid
    const { result } = await Taro.cloud.callFunction({
      name: 'login'
    })

    const openid = (result as any).openid

    // 从云数据库获取数据
    const db = Taro.cloud.database()
    const { data: cloudData } = await db.collection('users').doc(openid).get()

    if (!cloudData) {
      console.log('云端无数据')
      return null
    }

    console.log('云端数据恢复成功')
    return cloudData as StorageData
  } catch (e) {
    console.error('云端数据恢复失败', e)
    return null
  }
}
