import { apiClient } from './apiClient'
import * as storage from './storage'
import type { StorageData } from './storage'

interface CloudSnapshot {
  data: StorageData | null
  dataVersion?: string
  clientUpdatedAt?: string
  serverUpdatedAt?: string
}

interface SyncResponse {
  dataVersion: string
  clientUpdatedAt: string
  serverUpdatedAt: string
}

/**
 * 初始化自有服务器同步配置
 */
export const initCloud = (): void => {
  console.log('自有服务器同步已启用')
}

/**
 * 同步数据到自有服务器
 */
export const syncToCloud = async (data: StorageData): Promise<void> => {
  try {
    const result = await apiClient.put<SyncResponse>('/api/data', {
      data: storage.toCloudData(data),
      dataVersion: 'v6',
      clientUpdatedAt: data.localUpdatedAt || new Date().toISOString(),
    })

    await storage.markSyncedAt(result.serverUpdatedAt)
    console.log('服务器同步成功')
  } catch (e) {
    console.error('服务器同步失败', e)
    throw e
  }
}

/**
 * 从自有服务器恢复数据
 */
export const restoreFromCloud = async (): Promise<CloudSnapshot | null> => {
  try {
    const cloudData = await apiClient.get<CloudSnapshot>('/api/data')
    if (!cloudData?.data) {
      console.log('服务器无数据')
      return null
    }

    console.log('服务器数据恢复成功')
    return cloudData
  } catch (e) {
    console.error('服务器数据恢复失败', e)
    return null
  }
}
