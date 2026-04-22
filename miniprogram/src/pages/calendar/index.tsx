import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useState } from 'react'
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
    if (!activeChild?.history) return { style: '', marker: '', count: 0 }

    const dateStr = formatDate(day)
    const count = activeChild.history[dateStr] || 0

    let style = ''
    let marker = ''

    if (count > 0) {
      if (count >= 5) {
        style = 'excellent'
        marker = '5+'
      } else if (count >= 3) {
        style = 'good'
        marker = '3+'
      } else {
        style = 'normal'
      }
    }

    const todayDate = new Date()
    const today = dateStr === `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
    if (today) {
      style += ' today'
    }

    return { style, marker, count }
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
  const activeDaysThisMonth = Array.from({ length: daysInMonth }).filter((_, index) => {
    const day = index + 1
    return (activeChild.history?.[formatDate(day)] || 0) > 0
  }).length

  return (
    <View className='calendar-page page-shell'>
      <View className='page-hero calendar-hero'>
        <Text className='hero-overline'>成长节奏</Text>
        <Text className='hero-title'>打卡记录</Text>
        <Text className='hero-subtitle'>{activeChild.name} 本月已经留下 {activeDaysThisMonth} 天的成长足迹。</Text>

        <View className='summary-grid'>
          <View className='summary-item'>
            <Text className='summary-value'>{totalTasksThisMonth()}</Text>
            <Text className='summary-label'>本月完成</Text>
          </View>
          <View className='summary-item'>
            <Text className='summary-value'>{activeDaysThisMonth}</Text>
            <Text className='summary-label'>打卡天数</Text>
          </View>
          <View className='summary-item'>
            <Text className='summary-value'>{activeChild.currentStreak}</Text>
            <Text className='summary-label'>连续打卡</Text>
          </View>
        </View>
      </View>

      <View className='section-card stats-card'>
        <Text className='stats-title'>本月累计任务</Text>
        <View className='stats-content'>
          <Text className='stats-count'>{totalTasksThisMonth()}</Text>
          <Text className='stats-unit'>次</Text>
        </View>
        <Text className='stats-hint'>连续的小进步，最后会连成很长的成长曲线。</Text>
      </View>

      <View className='section-card calendar-shell'>
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

        <View className='calendar-container'>
          <View className='week-header'>
            {weekDays.map(day => (
              <View key={day} className='week-day'>
                <Text>{day}</Text>
              </View>
            ))}
          </View>

          <View className='calendar-grid'>
            {Array.from({ length: startingEmptyCells }).map((_, i) => (
              <View key={`empty-${i}`} className='calendar-day empty'></View>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const { style, marker, count } = getDayContent(day)

              return (
                <View key={day} className={`calendar-day ${style}`}>
                  <Text className='day-number'>{day}</Text>
                  {count > 0 && (
                    <View className='day-indicator'>
                      {marker ? <Text className='day-marker'>{marker}</Text> : <View className='dot' />}
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      </View>

      <View className='section-card legend-card'>
        <View className='legend'>
          <View className='legend-item'>
            <View className='legend-dot normal'></View>
            <Text className='legend-text'>1 次以上</Text>
          </View>
          <View className='legend-item'>
            <View className='legend-dot good'>3+</View>
            <Text className='legend-text'>表现稳定</Text>
          </View>
          <View className='legend-item'>
            <View className='legend-dot excellent'>5+</View>
            <Text className='legend-text'>状态很好</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
