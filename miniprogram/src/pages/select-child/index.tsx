import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useStore } from '../../store'
import { getSoftPalette } from '../../utils/colorTheme'
import type { ChildProfile } from '../../types'
import './index.scss'

export default function SelectChildPage() {
  const { children, activeChild, setActiveChild, init } = useStore()

  useLoad(() => {
    init()
  })

  const handleSelectChild = (child: ChildProfile) => {
    setActiveChild(child)
    Taro.navigateBack()
  }

  if (children.length === 0) {
    return (
      <View className='select-child-page page-shell'>
        <View className='empty-panel'>
          <Text className='empty-title'>还没有孩子档案</Text>
          <Text className='empty-text'>请先在家长模式里创建至少一个孩子档案。</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='select-child-page page-shell'>
      <View className='page-hero select-hero'>
        <Text className='hero-overline'>成长档案</Text>
        <Text className='hero-title'>选择孩子</Text>
        <Text className='hero-subtitle'>每个孩子都有独立的任务、奖励和成长记录，切换后会进入对应档案。</Text>

        <View className='hero-chip-row'>
          <Text className='hero-chip strong'>当前档案 {activeChild?.name || '未选择'}</Text>
          <Text className='hero-chip'>{children.length} 个孩子</Text>
        </View>
      </View>

      <View className='children-list'>
        {children.map(child => (
          <View
            key={child.id}
            className={`child-item ${activeChild?.id === child.id ? 'active' : ''}`}
            style={{
              borderColor: getSoftPalette(child.themeColor).border,
              backgroundColor: getSoftPalette(child.themeColor).tint,
            }}
            onClick={() => handleSelectChild(child)}
          >
            <View
              className='child-avatar'
              style={{
                backgroundColor: getSoftPalette(child.themeColor).tintStrong,
                color: getSoftPalette(child.themeColor).text,
              }}
            >
              <Text>{child.avatar}</Text>
            </View>
            <View className='child-info'>
              <Text className='child-name'>{child.name}</Text>
              <Text className='child-points'>{child.totalPoints} 积分</Text>
            </View>
            <Text className='child-arrow'>{activeChild?.id === child.id ? '当前' : '进入'}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
