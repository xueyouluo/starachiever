import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad, useDidShow } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useStore } from '../../store'
import { PET_TYPES, PET_ACTIONS, STAGE_THRESHOLDS } from '../../constants/pets'
import {
  getPetMood,
  getPetEmoji,
  MOOD_EMOJI,
  MOOD_LABEL,
  STAGE_LABEL,
} from '../../utils/petUtils'
import type { PetActionType, Pet, ChildProfile } from '../../types'
import './index.scss'

export default function PetPage() {
  const { activeChild: rawActiveChild, adoptPet, carePet, syncPetDecay, init } = useStore()
  const activeChild = rawActiveChild as ChildProfile | null

  useLoad(() => {
    init()
  })

  useDidShow(() => {
    // 每次进入页面时同步宠物状态衰减
    syncPetDecay()
  })

  if (!activeChild) {
    return (
      <View className='loading-container'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const pet = activeChild.pet as Pet | undefined

  // -------- 有宠物视图 --------
  if (pet) {
    const petType = PET_TYPES.find(p => p.id === pet.petTypeId)
    if (!petType) return null

    const mood = getPetMood(pet)
    const petEmoji = getPetEmoji(petType, pet.stage)

    // 成长进度条
    const nextThreshold = pet.stage === 'baby'
      ? STAGE_THRESHOLDS.teen
      : pet.stage === 'teen'
        ? STAGE_THRESHOLDS.adult
        : STAGE_THRESHOLDS.adult
    const prevThreshold = pet.stage === 'baby'
      ? 0
      : pet.stage === 'teen'
        ? STAGE_THRESHOLDS.teen
        : STAGE_THRESHOLDS.adult
    const stageProgress = pet.stage === 'adult'
      ? 100
      : Math.min(100, ((pet.careCount - prevThreshold) / (nextThreshold - prevThreshold)) * 100)

    const getBarColor = (value: number) => {
      if (value >= 70) return '#2ED573'
      if (value >= 40) return '#FFA502'
      if (value >= 20) return '#FF6348'
      return '#FF4757'
    }

    const handleCare = async (actionType: PetActionType) => {
      const action = PET_ACTIONS[actionType]
      if (activeChild.totalPoints < action.cost) {
        Taro.showToast({ title: `还差 ${action.cost - activeChild.totalPoints} 积分`, icon: 'none' })
        return
      }

      const res = await Taro.showModal({
        title: `${action.emoji} ${action.label}`,
        content: `花费 ${action.cost} 积分给 ${pet.name} ${action.label}？`,
        confirmText: '确认',
        confirmColor: '#FF6348',
      })
      if (!res.confirm) return

      try {
        await carePet(actionType)
        Taro.showToast({ title: `${action.label}成功！${pet.name} 很开心 ${action.emoji}`, icon: 'none', duration: 2000 })
      } catch (e: any) {
        Taro.showToast({ title: e?.message || '操作失败', icon: 'none' })
      }
    }

    return (
      <View className='pet-page'>
        {/* 顶部积分栏 */}
        <View className='pet-header'>
          <Text className='header-title'>🐾 我的宠物</Text>
          <Text className='header-points'>⭐ {activeChild.totalPoints}</Text>
        </View>

        <ScrollView scrollY className='scroll-area'>
          {/* 宠物展示区 */}
          <View className='pet-showcase'>
            <Text className='pet-emoji-big bounce'>{petEmoji}</Text>
            <View className='pet-mood-row'>
              <Text className='pet-mood-emoji'>{MOOD_EMOJI[mood]}</Text>
              <Text className='pet-mood-label'>{MOOD_LABEL[mood]}</Text>
            </View>
            <View className='pet-name-row'>
              <Text className='pet-name'>{pet.name}</Text>
              <View className='pet-stage-badge'>
                <Text className='pet-stage-text'>{STAGE_LABEL[pet.stage]}</Text>
              </View>
            </View>
          </View>

          {/* 属性条 */}
          <View className='stats-card'>
            <Text className='stats-title'>宠物状态</Text>
            {[
              { label: '🍖 饱食度', value: pet.hunger },
              { label: '🛁 清洁度', value: pet.cleanliness },
              { label: '🎾 快乐度', value: pet.happiness },
            ].map(stat => (
              <View key={stat.label} className='stat-row'>
                <Text className='stat-label'>{stat.label}</Text>
                <View className='stat-bar-bg'>
                  <View
                    className='stat-bar-fill'
                    style={{ width: `${stat.value}%`, backgroundColor: getBarColor(stat.value) }}
                  />
                </View>
                <Text className='stat-value'>{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* 操作区 */}
          <View className='actions-card'>
            <Text className='actions-title'>照料宠物</Text>
            <View className='actions-row'>
              {(Object.entries(PET_ACTIONS) as [PetActionType, typeof PET_ACTIONS[PetActionType]][]).map(([type, action]) => {
                const canAfford = activeChild.totalPoints >= action.cost
                return (
                  <View
                    key={type}
                    className={`action-btn ${canAfford ? 'active' : 'disabled'}`}
                    onClick={() => canAfford && handleCare(type)}
                  >
                    <Text className='action-emoji'>{action.emoji}</Text>
                    <Text className='action-label'>{action.label}</Text>
                    <Text className='action-cost'>-{action.cost}⭐</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 成长进度 */}
          <View className='growth-card'>
            <Text className='growth-title'>成长历程</Text>
            <View className='growth-stages'>
              <Text className={`growth-stage ${pet.stage === 'baby' ? 'active' : ''}`}>幼崽</Text>
              <View className='growth-line'>
                <View className='growth-progress' style={{ width: `${stageProgress}%` }} />
              </View>
              <Text className={`growth-stage ${pet.stage === 'teen' ? 'active' : ''}`}>少年</Text>
              <View className='growth-line'>
                <View className='growth-progress' style={{ width: pet.stage === 'adult' ? '100%' : '0%' }} />
              </View>
              <Text className={`growth-stage ${pet.stage === 'adult' ? 'active' : ''}`}>成年</Text>
            </View>
            <Text className='growth-count'>
              {pet.stage === 'adult'
                ? `已照料 ${pet.careCount} 次，已成年 🎉`
                : `还需照料 ${nextThreshold - pet.careCount} 次升级`}
            </Text>
          </View>
        </ScrollView>
      </View>
    )
  }

  // -------- 无宠物（商店）视图 --------
  const handleAdopt = async (petTypeId: string) => {
    const petType = PET_TYPES.find(p => p.id === petTypeId)
    if (!petType) return

    if (activeChild.totalPoints < petType.price) {
      Taro.showToast({ title: `还差 ${petType.price - activeChild.totalPoints} 积分`, icon: 'none' })
      return
    }

    const nameRes = await (Taro.showModal as any)({
      title: `领养 ${petType.emoji[0]} ${petType.name}`,
      content: `花费 ${petType.price} 积分领养，请给宠物起个名字：`,
      editable: true,
      placeholderText: petType.name,
      confirmText: '领养',
      confirmColor: '#FF6348',
    })

    if (!nameRes.confirm) return
    const petName = (nameRes.content?.trim() as string) || petType.name

    try {
      await adoptPet(petTypeId, petName)
      Taro.showToast({ title: `🎉 成功领养了 ${petName}！`, icon: 'none', duration: 2500 })
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '领养失败', icon: 'none' })
    }
  }

  return (
    <View className='pet-page'>
      {/* 顶部积分栏 */}
      <View className='pet-header'>
        <Text className='header-title'>🐾 宠物商店</Text>
        <Text className='header-points'>⭐ {activeChild.totalPoints}</Text>
      </View>

      <ScrollView scrollY className='scroll-area'>
        <Text className='shop-hint'>选一只宠物来照料吧！</Text>
        <View className='shop-list'>
          {PET_TYPES.map(p => {
            const canAfford = activeChild.totalPoints >= p.price
            return (
              <View key={p.id} className='shop-card'>
                <Text className='shop-pet-emoji'>{p.emoji[0]}</Text>
                <View className='shop-pet-info'>
                  <Text className='shop-pet-name'>{p.name}</Text>
                  <Text className='shop-pet-desc'>{p.description}</Text>
                  <Text className='shop-pet-special'>{p.speciality}</Text>
                </View>
                <View className='shop-adopt-wrap'>
                  <Text className={`shop-price ${canAfford ? '' : 'unaffordable'}`}>⭐ {p.price}</Text>
                  <View
                    className={`shop-adopt-btn ${canAfford ? 'active' : 'disabled'}`}
                    onClick={() => handleAdopt(p.id)}
                  >
                    <Text className='shop-adopt-text'>
                      {canAfford ? '领养' : `差${p.price - activeChild.totalPoints}分`}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}
