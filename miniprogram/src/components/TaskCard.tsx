import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import './TaskCard.scss'

interface TaskCardProps {
  task: Task
  onToggle: (taskId: string) => void | Promise<void>
}

// 将 Tailwind 类名映射为实际颜色值
const getColorFromClass = (colorClass: string): string => {
  const colorMap: Record<string, string> = {
    'bg-blue-100 text-blue-600': '#3B82F6',
    'bg-blue-100 text-blue-700': '#2563EB',
    'bg-green-100 text-green-600': '#10B981',
    'bg-green-100 text-green-700': '#059669',
    'bg-purple-100 text-purple-600': '#8B5CF6',
    'bg-purple-100 text-purple-700': '#7C3AED',
    'bg-yellow-100 text-yellow-600': '#F59E0B',
    'bg-yellow-100 text-yellow-700': '#D97706',
    'bg-pink-100 text-pink-600': '#EC4899',
    'bg-pink-100 text-pink-700': '#DB2777',
    'bg-red-100 text-red-600': '#EF4444',
    'bg-red-100 text-red-700': '#DC2626',
  }
  return colorMap[colorClass] || '#FF6348'
}

// 获取背景色（更浅的版本）
const getBgColorFromClass = (colorClass: string): string => {
  const bgMap: Record<string, string> = {
    'bg-blue-100 text-blue-600': '#DBEAFE',
    'bg-blue-100 text-blue-700': '#DBEAFE',
    'bg-green-100 text-green-600': '#D1FAE5',
    'bg-green-100 text-green-700': '#D1FAE5',
    'bg-purple-100 text-purple-600': '#EDE9FE',
    'bg-purple-100 text-purple-700': '#EDE9FE',
    'bg-yellow-100 text-yellow-600': '#FEF3C7',
    'bg-yellow-100 text-yellow-700': '#FEF3C7',
    'bg-pink-100 text-pink-600': '#FCE7F3',
    'bg-pink-100 text-pink-700': '#FCE7F3',
    'bg-red-100 text-red-600': '#FEE2E2',
    'bg-red-100 text-red-700': '#FEE2E2',
  }
  return bgMap[colorClass] || '#FFF0EC'
}

export default function TaskCard({ task, onToggle }: TaskCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = async () => {
    setIsAnimating(true)
    await onToggle(task.id)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const borderColor = getColorFromClass(task.color)
  const bgColor = getBgColorFromClass(task.color)

  return (
    <View
      className={`task-card ${task.completed ? 'completed' : ''} ${isAnimating ? 'animating' : ''}`}
      style={{ borderColor }}
      onClick={handleClick}
    >
      <View className='task-icon' style={{ backgroundColor: bgColor, color: borderColor }}>
        <Text>{task.icon}</Text>
      </View>
      <View className='task-content'>
        <Text className='task-title'>{task.title}</Text>
        <View className='task-meta'>
          <Text className='task-points'>+{task.points}</Text>
          {task.category && (
            <Text className='task-category-badge'>
              {task.category.icon}
            </Text>
          )}
        </View>
      </View>
      {task.completed && (
        <View className='check-badge' style={{ backgroundColor: borderColor }}>
          <Text className='check-icon'>✓</Text>
        </View>
      )}
    </View>
  )
}
