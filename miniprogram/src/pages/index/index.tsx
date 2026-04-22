import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import TaskCard from '../../components/TaskCard'
import { getSoftPalette } from '../../utils/colorTheme'
import type { Task } from '../../types'
import './index.scss'

interface TaskGroup {
  key: string
  name: string
  icon: string
  color: string
  tasks: Task[]
}

export default function TaskPage() {
  const { activeChild, init, toggleTask } = useStore()
  const [greeting, setGreeting] = useState('你好')
  const [groupedTasks, setGroupedTasks] = useState<TaskGroup[]>([])

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
      const groups = activeChild.tasks.reduce<Record<string, TaskGroup>>((acc, task: Task) => {
        const category = task.category && typeof task.category === 'object'
          ? task.category as any
          : null
        const key = category?.id || category?.name || task.title

        if (!acc[key]) {
          acc[key] = {
            key,
            name: category?.name || '其他',
            icon: category?.icon || '•',
            color: category?.color || task.color,
            tasks: [],
          }
        }
        acc[key].tasks.push(task)
        return acc
      }, {} as Record<string, TaskGroup>)

      Object.values(groups).forEach((group: TaskGroup) => {
        group.tasks.sort((a, b) => {
          if (a.completed === b.completed) return 0
          return a.completed ? 1 : -1
        })
      })

      setGroupedTasks(Object.values(groups))
    }
  }, [activeChild])

  const handleTaskToggle = async (taskId: string) => {
    const task = activeChild.tasks.find((item: Task) => item.id === taskId)
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

  const completedCount = activeChild.tasks.filter((task: Task) => task.completed).length
  const totalCount = activeChild.tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const now = new Date()
  const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日`

  return (
    <View className='task-page page-shell'>
      <View className='page-hero task-hero'>
        <Text className='hero-overline'>{dateLabel}</Text>
        <Text className='hero-title'>{greeting}，{activeChild.name}</Text>
        <Text className='hero-subtitle'>今天的目标已经整理好了，完成后会自动累计积分。</Text>

        <View className='hero-chip-row'>
          <Text className='hero-chip strong'>当前积分 {activeChild.totalPoints}</Text>
          <Text className='hero-chip'>{groupedTasks.length} 个分类</Text>
          <Text className='hero-chip warm'>{progressPercent}% 已完成</Text>
        </View>

        <View className='task-progress-panel'>
          <View className='task-progress-header'>
            <Text className='task-progress-title'>今日进度</Text>
            <Text className='task-progress-value'>{completedCount}/{totalCount}</Text>
          </View>
          <View className='task-progress-track'>
            <View
              className='task-progress-fill'
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          <View className='task-progress-foot'>
            <Text className='task-progress-note'>完成一个任务，就离今天的小目标更近一点。</Text>
            <Text className='task-progress-note emphasis'>{progressPercent}%</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className='page-scroll task-scroll'>
        <View className='task-list-container'>
          {groupedTasks.length === 0 && (
            <View className='empty-panel'>
              <Text className='empty-title'>今天还没有任务</Text>
              <Text className='empty-text'>家长可以在家长模式里补充任务和分类。</Text>
            </View>
          )}

          {groupedTasks.map(group => {
            const palette = getSoftPalette(group.color)
            const doneCount = group.tasks.filter(task => task.completed).length

            return (
              <View key={group.key} className='section-card task-category-card'>
                <View className='section-card-header task-category-header'>
                  <View
                    className='task-category-tag'
                    style={{
                      backgroundColor: palette.tint,
                      borderColor: palette.border,
                    }}
                  >
                    <Text className='task-category-icon'>{group.icon}</Text>
                    <Text className='task-category-name' style={{ color: palette.text }}>
                      {group.name}
                    </Text>
                  </View>
                  <Text className='task-category-count'>{doneCount}/{group.tasks.length}</Text>
                </View>
                {group.tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleTaskToggle}
                  />
                ))}
              </View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}
