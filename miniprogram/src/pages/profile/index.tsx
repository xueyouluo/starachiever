import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useStore } from '../../store'
import Taro from '@tarojs/taro'
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

  const unlockedBadges = activeChild.badges.filter(b =>
    activeChild.unlockedBadges.includes(b.id)
  )

  return (
    <View className='profile-page'>
      <ScrollView scrollY>
        {/* 个人信息卡片 */}
        <View className='profile-header'>
          <View className='avatar' style={{ backgroundColor: activeChild.themeColor }}>
            <Text className='avatar-text'>{activeChild.avatar}</Text>
          </View>
          <Text className='name'>{activeChild.name}</Text>
          {children.length > 1 && (
            <View className='switch-btn' onClick={handleSwitchChild}>
              <Text>切换孩子</Text>
            </View>
          )}
        </View>

        {/* 数据统计 */}
        <View className='stats-container'>
          <View className='stat-item'>
            <Text className='stat-value'>{activeChild.totalPoints}</Text>
            <Text className='stat-label'>总积分</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-value'>{activeChild.currentStreak}</Text>
            <Text className='stat-label'>连续打卡</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-value'>{activeChild.stats.totalTasksCompleted}</Text>
            <Text className='stat-label'>完成任务</Text>
          </View>
        </View>

        {/* 勋章墙 */}
        <View className='badges-section'>
          <View className='section-header'>
            <Text className='section-title'>我的成就</Text>
            <Text className='section-count'>
              {unlockedBadges.length}/{activeChild.badges.length}
            </Text>
          </View>

          {unlockedBadges.length > 0 ? (
            <View className='badges-grid'>
              {unlockedBadges.map(badge => (
                <View key={badge.id} className='badge-item' style={{ borderColor: badge.color }}>
                  <Text className='badge-icon'>{badge.icon}</Text>
                  <Text className='badge-name'>{badge.title}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View className='empty-state'>
              <Text>完成任务来解锁成就吧！🏆</Text>
            </View>
          )}
        </View>

        {/* 未解锁勋章 */}
        <View className='badges-section'>
          <View className='section-header'>
            <Text className='section-title'>待解锁</Text>
          </View>

          <View className='badges-grid'>
            {activeChild.badges
              .filter(b => !activeChild.unlockedBadges.includes(b.id))
              .map(badge => (
                <View key={badge.id} className='badge-item locked'>
                  <Text className='badge-icon'>{badge.icon}</Text>
                  <Text className='badge-name'>{badge.title}</Text>
                  <Text className='badge-desc'>{badge.description}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* 家长模式入口 */}
        <View className='parent-mode-btn' onClick={handleParentMode}>
          <Text className='parent-mode-text'>👨‍👩‍👧 家长模式</Text>
        </View>
      </ScrollView>
    </View>
  )
}
