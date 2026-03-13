import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import './index.scss'

export default function CalendarPage() {
  const { activeChild, init } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())

  useLoad(() => {
    init()
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getDayContent = (day: number) => {
    if (!activeChild?.history) return { style: '', icon: null, count: 0 }

    const dateStr = formatDate(day)
    const count = activeChild.history[dateStr] || 0

    let style = ''
    let icon = null

    if (count > 0) {
      if (count >= 5) {
        style = 'excellent'
        icon = '⭐'
      } else if (count >= 3) {
        style = 'good'
        icon = '✨'
      } else {
        style = 'normal'
        icon = null
      }
    }

    const today = dateStr === new Date().toISOString().split('T')[0]
    if (today) {
      style += ' today'
    }

    return { style, icon, count }
  }

  const totalTasksThisMonth = () => {
    if (!activeChild?.history) return 0

    let total = 0
    for (let day = 1; day <= daysInMonth; day++) {
      total += activeChild.history[formatDate(day)] || 0
    }
    return total
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  if (!activeChild) {
    return (
      <View className='loading-container'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const startingEmptyCells = firstDayOfMonth

  return (
    <View className='calendar-page'>
      {/* 渐变头部 */}
      <View className='cal-header'>
        <Text className='cal-header-title'>📅 打卡记录</Text>
        <Text className='cal-header-sub'>{activeChild.name} 的成长轨迹</Text>
      </View>

      <View className='content-wrapper'>
        {/* 统计卡片 */}
        <View className='stats-card'>
          <Text className='stats-title'>本月累计打卡</Text>
          <View className='stats-content'>
            <Text className='stats-count'>{totalTasksThisMonth()}</Text>
            <Text className='stats-unit'>次</Text>
          </View>
          <Text className='stats-hint'>每一天都在进步！</Text>
        </View>

        {/* 月份导航 */}
        <View className='month-nav'>
          <View className='nav-btn' onClick={prevMonth}>
            <Text>←</Text>
          </View>
          <Text className='month-title'>
            {year}年{month + 1}月
          </Text>
          <View className='nav-btn' onClick={nextMonth}>
            <Text>→</Text>
          </View>
        </View>

        {/* 日历 */}
        <View className='calendar-container'>
          {/* 星期标题 */}
          <View className='week-header'>
            {weekDays.map(day => (
              <View key={day} className='week-day'>
                <Text>{day}</Text>
              </View>
            ))}
          </View>

          {/* 日期网格 */}
          <View className='calendar-grid'>
            {Array.from({ length: startingEmptyCells }).map((_, i) => (
              <View key={`empty-${i}`} className='calendar-day empty'></View>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const { style, icon, count } = getDayContent(day)

              return (
                <View key={day} className={`calendar-day ${style}`}>
                  <Text className='day-number'>{day}</Text>
                  {count > 0 && (
                    <View className='day-indicator'>
                      {icon || <View className='dot' />}
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>

        {/* 图例 */}
        <View className='legend'>
          <View className='legend-item'>
            <View className='legend-dot normal'></View>
            <Text className='legend-text'>完成任务</Text>
          </View>
          <View className='legend-item'>
            <View className='legend-dot good'>✨</View>
            <Text className='legend-text'>表现不错 (3+)</Text>
          </View>
          <View className='legend-item'>
            <View className='legend-dot excellent'>⭐</View>
            <Text className='legend-text'>表现超棒 (5+)</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
