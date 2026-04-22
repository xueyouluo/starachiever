import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useStore } from '../../store'
import { BRAND_COLORS, getSoftPalette } from '../../utils/colorTheme'
import type { Reward } from '../../types'
import './index.scss'

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
      confirmColor: BRAND_COLORS.primary
    })

    if (!res.confirm) return

    try {
      await redeemReward(reward.id)
      Taro.showToast({ title: '兑换成功！去找爸爸妈妈领取吧 🎉', icon: 'none', duration: 2500 })
    } catch (e) {
      Taro.showToast({ title: '兑换失败，请重试', icon: 'none' })
    }
  }

  const affordableCount = activeChild.rewards.filter((reward: Reward) => activeChild.totalPoints >= reward.cost).length

  return (
    <View className='rewards-page page-shell'>
      <View className='page-hero rewards-hero'>
        <Text className='hero-overline'>奖励中心</Text>
        <Text className='hero-title'>{activeChild.totalPoints} 积分</Text>
        <Text className='hero-subtitle'>完成任务后积累积分，再从奖励列表里挑选喜欢的礼物。</Text>

        <View className='summary-grid'>
          <View className='summary-item'>
            <Text className='summary-value'>{affordableCount}</Text>
            <Text className='summary-label'>可兑换</Text>
          </View>
          <View className='summary-item'>
            <Text className='summary-value'>{activeChild.rewards.length}</Text>
            <Text className='summary-label'>奖励总数</Text>
          </View>
          <View className='summary-item'>
            <Text className='summary-value'>{activeChild.redemptions?.length || 0}</Text>
            <Text className='summary-label'>已兑换</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className='page-scroll rewards-scroll'>
        {activeChild.rewards.length === 0 ? (
          <View className='empty-panel'>
            <Text className='empty-title'>还没有奖励</Text>
            <Text className='empty-text'>家长可以在家长模式里添加奖励，孩子就能在这里兑换。</Text>
          </View>
        ) : (
          <View className='rewards-grid'>
            {activeChild.rewards.map((reward: Reward) => {
              const canAfford = activeChild.totalPoints >= reward.cost
              const palette = getSoftPalette(reward.color)
              return (
                <View
                  key={reward.id}
                  className='reward-card'
                  style={{ borderColor: palette.border }}
                >
                  <View
                    className={`cost-badge ${canAfford ? '' : 'unaffordable'}`}
                    style={canAfford ? {
                      backgroundColor: palette.tintStrong,
                      color: palette.text,
                    } : undefined}
                  >
                    <Text className='cost-text'>{reward.cost} 积分</Text>
                  </View>

                  <View className='reward-icon-wrap' style={{ backgroundColor: palette.tint }}>
                    <Text className='reward-icon'>{reward.icon}</Text>
                  </View>

                  <Text className='reward-title'>{reward.title}</Text>
                  <Text className='reward-status'>{canAfford ? '现在可以兑换' : `还差 ${reward.cost - activeChild.totalPoints} 分`}</Text>

                  <View
                    className={`redeem-btn ${canAfford ? 'active' : 'disabled'}`}
                    style={canAfford ? { backgroundColor: palette.accent } : undefined}
                    onClick={() => canAfford && handleRedeem(reward)}
                  >
                    <Text className='redeem-text'>
                      {canAfford ? '立即兑换' : '积分不足'}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {activeChild.redemptions && activeChild.redemptions.length > 0 && (
          <View className='section-card history-section'>
            <View className='section-card-header'>
              <Text className='section-title'>兑换记录</Text>
              <Text className='section-note'>最近 10 条</Text>
            </View>
            {[...activeChild.redemptions].reverse().slice(0, 10).map(r => (
              <View key={r.id} className='history-item'>
                <Text className='history-icon'>{r.rewardIcon || '🎁'}</Text>
                <View className='history-info'>
                  <Text className='history-name'>{r.rewardTitle || r.rewardName}</Text>
                  <Text className='history-date'>{(r.redeemedAt || r.date || '').slice(0, 10)}</Text>
                </View>
                <Text className='history-cost'>-{r.cost}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
