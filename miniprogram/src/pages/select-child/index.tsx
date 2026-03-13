import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useStore } from '../../store'
import './index.scss'

export default function SelectChildPage() {
  const { children, setActiveChild, init } = useStore()

  useLoad(() => {
    init()
  })

  const handleSelectChild = (child: ChildProfile) => {
    setActiveChild(child)
    Taro.navigateBack()
  }

  if (children.length === 0) {
    return (
      <View className='select-child-page'>
        <View className='empty-state'>
          <Text className='empty-icon'>👶</Text>
          <Text className='empty-text'>还没有孩子档案</Text>
          <Text className='empty-hint'>请先在家长模式中创建</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='select-child-page'>
      <View className='page-header'>
        <Text className='page-title'>选择孩子</Text>
      </View>

      <View className='children-list'>
        {children.map(child => (
          <View
            key={child.id}
            className='child-item'
            style={{ borderLeftColor: child.themeColor }}
            onClick={() => handleSelectChild(child)}
          >
            <View className='child-avatar' style={{ backgroundColor: child.themeColor }}>
              <Text>{child.avatar}</Text>
            </View>
            <View className='child-info'>
              <Text className='child-name'>{child.name}</Text>
              <Text className='child-points'>💎 {child.totalPoints} 积分</Text>
            </View>
            <Text className='child-arrow'>→</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
