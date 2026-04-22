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
import { BRAND_COLORS } from '../../utils/colorTheme'
import type { PetActionType, Pet, ChildProfile } from '../../types'
import './index.scss'

const getBarTone = (value: number) => {
  if (value >= 70) {
    return { fill: BRAND_COLORS.primary, track: '#E3F4EC' }
  }
  if (value >= 40) {
    return { fill: BRAND_COLORS.secondary, track: '#EAF4FF' }
  }
  if (value >= 20) {
    return { fill: BRAND_COLORS.accentStrong, track: '#FDF1E5' }
  }
  return { fill: BRAND_COLORS.danger, track: '#FCEDEA' }
}

export default function PetPage() {
  const { activeChild: rawActiveChild, adoptPet, carePet, syncPetDecay, init } = useStore()
  const activeChild = rawActiveChild as ChildProfile | null

  useLoad(() => {
    init()
  })

  useDidShow(() => {
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

  if (pet) {
    const petType = PET_TYPES.find(item => item.id === pet.petTypeId)
    if (!petType) return null

    const mood = getPetMood(pet)
    const petEmoji = getPetEmoji(petType, pet.stage)

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
        confirmColor: BRAND_COLORS.primary,
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
      <View className='pet-page page-shell'>
        <View className='page-hero pet-hero'>
          <Text className='hero-overline'>宠物伙伴</Text>
          <Text className='hero-title'>{pet.name}</Text>
          <Text className='hero-subtitle'>{MOOD_LABEL[mood]}，继续照料就会慢慢长大。</Text>

          <View className='pet-hero-emoji'>
            <Text className='pet-emoji-big'>{petEmoji}</Text>
          </View>

          <View className='hero-chip-row'>
            <Text className='hero-chip strong'>{MOOD_EMOJI[mood]} {MOOD_LABEL[mood]}</Text>
            <Text className='hero-chip'>{STAGE_LABEL[pet.stage]}</Text>
            <Text className='hero-chip warm'>积分 {activeChild.totalPoints}</Text>
          </View>
        </View>

        <ScrollView scrollY className='page-scroll pet-scroll'>
          <View className='section-card pet-section'>
            <View className='section-card-header'>
              <Text className='section-title'>宠物状态</Text>
              <Text className='section-note'>实时变化</Text>
            </View>
            {[
              { label: '饱食度', value: pet.hunger },
              { label: '清洁度', value: pet.cleanliness },
              { label: '快乐度', value: pet.happiness },
            ].map(stat => {
              const tone = getBarTone(stat.value)
              return (
                <View key={stat.label} className='stat-row'>
                  <Text className='stat-label'>{stat.label}</Text>
                  <View className='stat-bar-bg' style={{ backgroundColor: tone.track }}>
                    <View
                      className='stat-bar-fill'
                      style={{ width: `${stat.value}%`, backgroundColor: tone.fill }}
                    />
                  </View>
                  <Text className='stat-value'>{stat.value}</Text>
                </View>
              )
            })}
          </View>

          <View className='section-card pet-section'>
            <View className='section-card-header'>
              <Text className='section-title'>照料动作</Text>
              <Text className='section-note'>会消耗积分</Text>
            </View>
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
                    <Text className='action-cost'>-{action.cost} 分</Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View className='section-card pet-section'>
            <View className='section-card-header'>
              <Text className='section-title'>成长历程</Text>
              <Text className='section-note'>{pet.careCount} 次照料</Text>
            </View>
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
                ? `已照料 ${pet.careCount} 次，现在已经成年。`
                : `还需照料 ${nextThreshold - pet.careCount} 次升级。`}
            </Text>
          </View>
        </ScrollView>
      </View>
    )
  }

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
      confirmColor: BRAND_COLORS.primary,
    })

    if (!nameRes.confirm) return
    const petName = (nameRes.content?.trim() as string) || petType.name

    try {
      await adoptPet(petTypeId, petName)
      Taro.showToast({ title: `成功领养了 ${petName}！`, icon: 'none', duration: 2500 })
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '领养失败', icon: 'none' })
    }
  }

  return (
    <View className='pet-page page-shell'>
      <View className='page-hero pet-hero'>
        <Text className='hero-overline'>宠物商店</Text>
        <Text className='hero-title'>挑选新伙伴</Text>
        <Text className='hero-subtitle'>攒够积分后，就能把喜欢的宠物带回家慢慢照料。</Text>

        <View className='summary-grid'>
          <View className='summary-item'>
            <Text className='summary-value'>{PET_TYPES.length}</Text>
            <Text className='summary-label'>可选伙伴</Text>
          </View>
          <View className='summary-item'>
            <Text className='summary-value'>{activeChild.totalPoints}</Text>
            <Text className='summary-label'>当前积分</Text>
          </View>
          <View className='summary-item'>
            <Text className='summary-value'>{PET_TYPES.filter(p => activeChild.totalPoints >= p.price).length}</Text>
            <Text className='summary-label'>可领养</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className='page-scroll pet-scroll'>
        <Text className='shop-hint'>选一只喜欢的宠物，之后就能在这里持续照料它。</Text>
        <View className='shop-list'>
          {PET_TYPES.map(p => {
            const canAfford = activeChild.totalPoints >= p.price
            return (
              <View key={p.id} className='section-card shop-card'>
                <Text className='shop-pet-emoji'>{p.emoji[0]}</Text>
                <View className='shop-pet-info'>
                  <Text className='shop-pet-name'>{p.name}</Text>
                  <Text className='shop-pet-desc'>{p.description}</Text>
                  <Text className='shop-pet-special'>{p.speciality}</Text>
                </View>
                <View className='shop-adopt-wrap'>
                  <Text className={`shop-price ${canAfford ? '' : 'unaffordable'}`}>{p.price} 分</Text>
                  <View
                    className={`shop-adopt-btn ${canAfford ? 'active' : 'disabled'}`}
                    onClick={() => canAfford && handleAdopt(p.id)}
                  >
                    <Text className='shop-adopt-text'>
                      {canAfford ? '领养' : '积分不足'}
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
