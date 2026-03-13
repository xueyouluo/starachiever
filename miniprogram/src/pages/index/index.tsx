import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useReachBottom } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import TaskCard from '../../components/TaskCard'
import './index.scss'

export default function TaskPage() {
  const { activeChild, init, toggleTask } = useStore()
  const [greeting, setGreeting] = useState('你好')
  const [groupedTasks, setGroupedTasks] = useState({})

  useLoad(() => {
    init()
  })

  useEffect(() => {
    // 设置问候语
    const hour = new Date().getHours()
    if (hour < 6) setGreeting('夜深了')
    else if (hour < 9) setGreeting('早上好')
    else if (hour < 12) setGreeting('上午好')
    else if (hour < 14) setGreeting('中午好')
    else if (hour < 18) setGreeting('下午好')
    else if (hour < 22) setGreeting('晚上好')
    else setGreeting('夜深了')
  }, [])

  useEffect(() => {
    if (activeChild) {
      // 按分类分组任务
      const groups = activeChild.tasks.reduce((acc, task) => {
        const categoryName = task.category?.name || '其他'
        if (!acc[categoryName]) {
          acc[categoryName] = []
        }
        acc[categoryName].push(task)
        return acc
      }, {} as Record<string, Task[]>)

      // 排序：未完成的在前
      Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => {
          if (a.completed === b.completed) return 0
          return a.completed ? 1 : -1
        })
      })

      setGroupedTasks(groups)
    }
  }, [activeChild])

  const handleTaskToggle = async (taskId) => {
    const task = activeChild.tasks.find(t => t.id === taskId)
    if (!task) return

    const isCompleting = !task.completed

    try {
      await toggleTask(taskId)

      // 如果是完成任务，显示恭喜弹窗
      if (isCompleting) {
        const encouragements = [
          '太棒了！你完成了一个任务！🎉',
          '做得好！继续加油！💪',
          '你真厉害！🌟',
          '优秀！又完成一个任务！⭐',
          '哇！你越来越棒了！👏'
        ]
        const randomMsg = encouragements[Math.floor(Math.random() * encouragements.length)]

        Taro.showModal({
          title: '恭喜！',
          content: `${randomMsg}\n\n获得 ${task.points} 积分！💎`,
          showCancel: false,
          confirmText: '太好了',
          success: () => {
            // 可以在这里添加其他效果
          }
        })
      }
    } catch (e) {
      console.error('任务切换失败', e)
    }
  }

  if (!activeChild) {
    return (
      <View className='loading-container'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const completedCount = activeChild.tasks.filter(t => t.completed).length
  const totalCount = activeChild.tasks.length

  return (
    <View className='task-page'>
      {/* 头部 */}
      <View className='header'>
        <View className='greeting-section'>
          <Text className='greeting'>{greeting}，{activeChild.name}!</Text>
          <Text className='subtitle'>今天也要加油哦 💪</Text>
        </View>
        <View className='points-badge'>
          <Text className='points-icon'>💎</Text>
          <Text className='points-value'>{activeChild.totalPoints}</Text>
        </View>
      </View>

      {/* 内容卡片 */}
      <View className='content-card'>
        {/* 进度卡片 */}
        <View className='progress-card'>
          <View className='progress-header'>
            <Text className='progress-title'>今日进度</Text>
            <Text className='progress-text'>{completedCount}/{totalCount}</Text>
          </View>
          <View className='progress-bar'>
            <View
              className='progress-fill'
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </View>
        </View>

        {/* 任务列表 */}
        <View className='task-list-container'>
          {Object.entries(groupedTasks).map(([categoryName, tasks]) => (
            <View key={categoryName} className='task-category'>
              <View className='category-header'>
                <Text className='category-name'>{categoryName}</Text>
                <Text className='category-count'>
                  {tasks.filter(t => t.completed).length}/{tasks.length}
                </Text>
              </View>
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleTaskToggle}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
