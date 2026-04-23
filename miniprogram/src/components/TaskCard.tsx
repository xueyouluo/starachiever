import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { getSoftPalette } from '../utils/colorTheme'
import { formatSignedPoints } from '../utils/points'
import type { Task } from '../types'
import './TaskCard.scss'

interface TaskCardProps {
  task: Task
  onToggle: (taskId: string) => void | Promise<void>
}

export default function TaskCard({ task, onToggle }: TaskCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const category = task.category && typeof task.category === 'object' ? task.category as any : null
  const palette = getSoftPalette(category?.color || task.color)

  const handleClick = async () => {
    setIsAnimating(true)
    await onToggle(task.id)
    setTimeout(() => setIsAnimating(false), 500)
  }

  return (
    <View
      className={`task-card ${task.completed ? 'completed' : ''} ${isAnimating ? 'animating' : ''}`}
      style={{
        borderColor: task.completed ? '#DCE8E1' : palette.border,
        backgroundColor: task.completed ? '#F7FAF8' : '#FFFFFF',
      }}
      onClick={handleClick}
    >
      <View className='task-card-body'>
        <View
          className='task-icon'
          style={{
            backgroundColor: task.completed ? '#E8EFEC' : palette.tint,
            color: task.completed ? '#8FA39E' : palette.accent,
          }}
        >
          <Text>{task.icon}</Text>
        </View>
        <View className='task-content'>
          <Text className='task-title'>{task.title}</Text>
          <View className='task-meta'>
            <Text
              className='task-points'
              style={{
                backgroundColor: task.completed ? '#E1E8E4' : palette.tintStrong,
                color: task.completed ? '#7C908A' : palette.text,
              }}
            >
              {formatSignedPoints(task.points)} 积分
            </Text>
            {category && (
              <Text
                className='task-category-badge'
                style={{
                  backgroundColor: palette.tint,
                  color: palette.text,
                }}
              >
                {category.icon} {category.name}
              </Text>
            )}
          </View>
        </View>
        <View
          className={`task-status ${task.completed ? 'completed' : ''}`}
          style={task.completed ? undefined : { backgroundColor: palette.tint, color: palette.text }}
        >
          <Text className='task-status-text'>{task.completed ? '已完成' : '打卡'}</Text>
        </View>
      </View>
    </View>
  )
}
