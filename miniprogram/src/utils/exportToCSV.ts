import Taro from '@tarojs/taro'
import { ChildProfile } from '../types'

/**
 * 导出单个孩子的数据为 CSV
 */
export const exportToCSV = (child: ChildProfile): void => {
  try {
    // 生成 CSV 头部
    const headers = ['日期', '完成任务数', '获得积分', '解锁成就', '总积分']

    // 生成每日记录
    const rows = Object.entries(child.dailyHistory).map(([date, record]) => [
      date,
      record.completedTasks.toString(),
      record.pointsEarned.toString(),
      record.unlockedBadges.join('; '),
      child.totalPoints.toString()
    ])

    // 组合 CSV 内容
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // 复制到剪贴板
    Taro.setClipboardData({
      data: csv,
      success: () => {
        Taro.showToast({
          title: 'CSV 已复制到剪贴板',
          icon: 'success',
          duration: 2000
        })
      },
      fail: () => {
        Taro.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  } catch (e) {
    console.error('导出 CSV 失败', e)
    Taro.showToast({
      title: '导出失败',
      icon: 'none'
    })
  }
}

/**
 * 导出所有数据为 JSON
 */
export const exportToJSON = (children: ChildProfile[]): void => {
  try {
    const data = {
      version: 'v6',
      exportDate: new Date().toISOString(),
      children
    }

    const json = JSON.stringify(data, null, 2)

    Taro.setClipboardData({
      data: json,
      success: () => {
        Taro.showModal({
          title: '导出成功',
          content: 'JSON 数据已复制到剪贴板，请保存到安全的地方',
          showCancel: false
        })
      },
      fail: () => {
        Taro.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  } catch (e) {
    console.error('导出 JSON 失败', e)
    Taro.showToast({
      title: '导出失败',
      icon: 'none'
    })
  }
}

/**
 * 导入数据
 */
export const importData = (): Promise<ChildProfile[] | null> => {
  return new Promise((resolve) => {
    Taro.showModal({
      title: '导入数据',
      content: '请粘贴从其他设备导出的 JSON 数据',
      editable: true,
      placeholderText: '{"version": "v6", "children": [...]}',
      success: (res) => {
        if (res.confirm && res.content) {
          try {
            const data = JSON.parse(res.content)

            // 验证数据格式
            if (!data.children || !Array.isArray(data.children)) {
              throw new Error('数据格式不正确')
            }

            Taro.showToast({
              title: '导入成功',
              icon: 'success'
            })

            resolve(data.children)
          } catch (e) {
            console.error('导入失败', e)
            Taro.showToast({
              title: '导入失败，数据格式错误',
              icon: 'none'
            })
            resolve(null)
          }
        } else {
          resolve(null)
        }
      },
      fail: () => resolve(null)
    })
  })
}
