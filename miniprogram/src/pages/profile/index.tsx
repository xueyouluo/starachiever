import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useStore } from '../../store'
import { getSoftPalette } from '../../utils/colorTheme'
import type { Badge } from '../../types'
import './index.scss'

export default function ProfilePage() {
  const { activeChild, init, children } = useStore()

  useLoad(() => {
    init()
  })

  const handleSwitchChild = () => {
    if (children.length > 1) {
      Taro.navigateTo({
        url: '/pages/select-child/index'
      })
    }
  }

  const handleParentMode = () => {
    Taro.navigateTo({
      url: '/pages/parent/index'
    })
  }

  if (!activeChild) {
    return (
      <View className='loading-container'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const unlockedBadges = activeChild.badges.filter((b: Badge) =>
    activeChild.unlockedBadges.includes(b.id)
  )
  const childPalette = getSoftPalette(activeChild.themeColor)

  return (
    <View className='profile-page page-shell'>
      <ScrollView scrollY className='page-scroll profile-scroll'>
        <View className='page-hero profile-hero'>
          <View
            className='profile-avatar'
            style={{
              backgroundColor: childPalette.tintStrong,
              color: childPalette.text,
            }}
          >
            <Text className='profile-avatar-text'>{activeChild.avatar}</Text>
          </View>
          <Text className='hero-overline'>成长档案</Text>
          <Text className='hero-title'>{activeChild.name}</Text>
          <Text className='hero-subtitle'>积分、连续打卡和成就都会在这里慢慢累积，留下清晰的成长记录。</Text>

          <View className='hero-chip-row'>
            {children.length > 1 && (
              <View className='hero-chip' onClick={handleSwitchChild}>
                <Text>切换孩子</Text>
              </View>
            )}
            <View className='hero-chip strong' onClick={handleParentMode}>
              <Text>进入家长模式</Text>
            </View>
          </View>

          <View className='summary-grid profile-summary-grid'>
            <View className='summary-item'>
              <Text className='summary-value'>{activeChild.totalPoints}</Text>
              <Text className='summary-label'>当前积分</Text>
            </View>
            <View className='summary-item'>
              <Text className='summary-value'>{activeChild.currentStreak}</Text>
              <Text className='summary-label'>连续打卡</Text>
            </View>
            <View className='summary-item'>
              <Text className='summary-value'>{activeChild.stats.totalTasksCompleted}</Text>
              <Text className='summary-label'>累计完成</Text>
            </View>
          </View>
        </View>

        <View className='section-card profile-section'>
          <View className='section-card-header'>
            <Text className='section-title'>已解锁成就</Text>
            <Text className='section-note'>{unlockedBadges.length}/{activeChild.badges.length}</Text>
          </View>

          {unlockedBadges.length > 0 ? (
            <View className='badges-grid'>
              {unlockedBadges.map((badge: Badge) => {
                const palette = getSoftPalette(badge.color)
                return (
                  <View
                    key={badge.id}
                    className='badge-item'
                    style={{
                      backgroundColor: palette.tint,
                      borderColor: palette.border,
                    }}
                  >
                    <Text className='badge-icon'>{badge.icon}</Text>
                    <Text className='badge-name'>{badge.title}</Text>
                    <Text className='badge-desc' style={{ color: palette.text }}>
                      {badge.description}
                    </Text>
                  </View>
                )
              })}
            </View>
          ) : (
            <View className='empty-panel'>
              <Text className='empty-title'>还没有解锁成就</Text>
              <Text className='empty-text'>继续完成任务，新的勋章会逐渐亮起来。</Text>
            </View>
          )}
        </View>

        <View className='section-card profile-section'>
          <View className='section-card-header'>
            <Text className='section-title'>待解锁</Text>
            <Text className='section-note'>继续积累</Text>
          </View>

          <View className='badges-grid'>
            {activeChild.badges
              .filter((b: Badge) => !activeChild.unlockedBadges.includes(b.id))
              .map((badge: Badge) => (
                <View key={badge.id} className='badge-item locked'>
                  <Text className='badge-icon'>{badge.icon}</Text>
                  <Text className='badge-name'>{badge.title}</Text>
                  <Text className='badge-desc'>{badge.description}</Text>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
