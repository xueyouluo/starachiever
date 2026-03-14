import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useStore } from '../../store'
import './index.scss'

// 将 Tailwind 类名映射为背景色
const getBgColor = (colorClass: string): string => {
  const map: Record<string, string> = {
    'bg-pink-100 text-pink-600':     '#FCE7F3',
    'bg-green-100 text-green-600':   '#D1FAE5',
    'bg-blue-100 text-blue-600':     '#DBEAFE',
    'bg-yellow-100 text-yellow-600': '#FEF3C7',
    'bg-purple-100 text-purple-600': '#EDE9FE',
    'bg-red-100 text-red-600':       '#FEE2E2',
    'bg-orange-100 text-orange-600': '#FFEDD5',
  }
  return map[colorClass] || '#FFF0EC'
}

export default function RewardsPage() {
  const { activeChild, redeemReward, init } = useStore()

  useLoad(() => {
    init()
  })

  if (!activeChild) {
    return (
      <View className='loading-container'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const handleRedeem = async (reward: Reward) => {
    if (activeChild.totalPoints < reward.cost) {
      Taro.showToast({ title: `还差 ${reward.cost - activeChild.totalPoints} 积分`, icon: 'none' })
      return
    }

    const res = await Taro.showModal({
      title: '确认兑换',
      content: `花费 ${reward.cost} 积分兑换「${reward.title}」？`,
      confirmText: '兑换',
      confirmColor: '#FF6348'
    })

    if (!res.confirm) return

    try {
      await redeemReward(reward.id)
      Taro.showToast({ title: '兑换成功！去找爸爸妈妈领取吧 🎉', icon: 'none', duration: 2500 })
    } catch (e) {
      Taro.showToast({ title: '兑换失败，请重试', icon: 'none' })
    }
  }

  return (
    <View className='rewards-page'>
      {/* 顶部积分栏 */}
      <View className='points-header'>
        <View className='points-decoration' />
        <Text className='points-label'>当前积分</Text>
        <Text className='points-value'>⭐️ {activeChild.totalPoints}</Text>
        <Text className='points-hint'>完成任务积累积分，兑换心仪奖励！</Text>
      </View>

      <ScrollView scrollY className='scroll-area'>
        {activeChild.rewards.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>🎁</Text>
            <Text className='empty-text'>还没有奖励</Text>
            <Text className='empty-hint'>请家长在家长模式中添加奖励</Text>
          </View>
        ) : (
          <View className='rewards-grid'>
            {activeChild.rewards.map(reward => {
              const canAfford = activeChild.totalPoints >= reward.cost
              const bgColor = getBgColor(reward.color)
              return (
                <View key={reward.id} className='reward-card'>
                  {/* 积分标签 */}
                  <View className={`cost-badge ${canAfford ? '' : 'unaffordable'}`}>
                    <Text className='cost-text'>{reward.cost} ⭐️</Text>
                  </View>

                  {/* 图标 */}
                  <View className='reward-icon-wrap' style={{ backgroundColor: bgColor }}>
                    <Text className='reward-icon'>{reward.icon}</Text>
                  </View>

                  {/* 名称 */}
                  <Text className='reward-title'>{reward.title}</Text>

                  {/* 兑换按钮 */}
                  <View
                    className={`redeem-btn ${canAfford ? 'active' : 'disabled'}`}
                    onClick={() => canAfford && handleRedeem(reward)}
                  >
                    <Text className='redeem-text'>
                      {canAfford ? '立即兑换' : `差 ${reward.cost - activeChild.totalPoints} 分`}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* 兑换记录 */}
        {activeChild.redemptions && activeChild.redemptions.length > 0 && (
          <View className='history-section'>
            <Text className='history-title'>兑换记录</Text>
            {[...activeChild.redemptions].reverse().slice(0, 10).map(r => (
              <View key={r.id} className='history-item'>
                <Text className='history-icon'>{r.rewardIcon || '🎁'}</Text>
                <View className='history-info'>
                  <Text className='history-name'>{r.rewardTitle || r.rewardName}</Text>
                  <Text className='history-date'>{(r.redeemedAt || r.date || '').slice(0, 10)}</Text>
                </View>
                <Text className='history-cost'>-{r.cost} ⭐️</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
