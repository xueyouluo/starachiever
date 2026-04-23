import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useLoad, useDidShow } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useStore } from '../../store'
import { PET_TYPES, PET_ACTIONS, STAGE_THRESHOLDS } from '../../constants/pets'
import {
  getChildPets,
  getPetMood,
  getPetEmoji,
  MOOD_EMOJI,
  MOOD_LABEL,
  STAGE_LABEL,
} from '../../utils/petUtils'
import { BRAND_COLORS } from '../../utils/colorTheme'
import type { ChildProfile, PetActionType } from '../../types'
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
  const pets = getChildPets(activeChild)
  const [selectedPetId, setSelectedPetId] = useState('')

  useLoad(() => {
    init()
  })

  useDidShow(() => {
    syncPetDecay()
  })

  useEffect(() => {
    if (pets.length === 0) {
      if (selectedPetId) {
        setSelectedPetId('')
      }
      return
    }

    if (!pets.some(pet => pet.id === selectedPetId)) {
      setSelectedPetId(pets[0].id)
    }
  }, [pets, selectedPetId])

  if (!activeChild) {
    return (
      <View className='loading-container'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const selectedPet = pets.find(pet => pet.id === selectedPetId) || pets[0]
  const affordableCount = PET_TYPES.filter(petType => activeChild.totalPoints >= petType.price).length

  const handleAdopt = async (petTypeId: string) => {
    const petType = PET_TYPES.find(pet => pet.id === petTypeId)
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

  const renderShopList = () => (
    <View className='shop-list'>
      {PET_TYPES.map(petType => {
        const canAfford = activeChild.totalPoints >= petType.price
        return (
          <View key={petType.id} className='section-card shop-card'>
            <Text className='shop-pet-emoji'>{petType.emoji[0]}</Text>
            <View className='shop-pet-info'>
              <Text className='shop-pet-name'>{petType.name}</Text>
              <Text className='shop-pet-desc'>{petType.description}</Text>
              <Text className='shop-pet-special'>{petType.speciality}</Text>
            </View>
            <View className='shop-adopt-wrap'>
              <Text className={`shop-price ${canAfford ? '' : 'unaffordable'}`}>{petType.price} 分</Text>
              <View
                className={`shop-adopt-btn ${canAfford ? 'active' : 'disabled'}`}
                onClick={() => canAfford && handleAdopt(petType.id)}
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
  )

  if (!selectedPet) {
    return (
      <View className='pet-page page-shell'>
        <View className='page-hero pet-hero'>
          <Text className='hero-overline'>宠物商店</Text>
          <Text className='hero-title'>挑选新伙伴</Text>
          <Text className='hero-subtitle'>攒够积分后，可以把喜欢的宠物带回家，而且以后还能继续养更多。</Text>

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
              <Text className='summary-value'>{affordableCount}</Text>
              <Text className='summary-label'>可领养</Text>
            </View>
          </View>
        </View>

        <ScrollView scrollY className='page-scroll pet-scroll'>
          <Text className='shop-hint'>先选一只喜欢的宠物开始养成，之后还可以继续带更多伙伴回家。</Text>
          {renderShopList()}
        </ScrollView>
      </View>
    )
  }

  const selectedPetType = PET_TYPES.find(item => item.id === selectedPet.petTypeId)
  if (!selectedPetType) return null

  const mood = getPetMood(selectedPet)
  const petEmoji = getPetEmoji(selectedPetType, selectedPet.stage)
  const nextThreshold = selectedPet.stage === 'baby'
    ? STAGE_THRESHOLDS.teen
    : selectedPet.stage === 'teen'
      ? STAGE_THRESHOLDS.adult
      : STAGE_THRESHOLDS.adult
  const prevThreshold = selectedPet.stage === 'baby'
    ? 0
    : selectedPet.stage === 'teen'
      ? STAGE_THRESHOLDS.teen
      : STAGE_THRESHOLDS.adult
  const stageProgress = selectedPet.stage === 'adult'
    ? 100
    : Math.min(100, ((selectedPet.careCount - prevThreshold) / (nextThreshold - prevThreshold)) * 100)

  const handleCare = async (actionType: PetActionType) => {
    const action = PET_ACTIONS[actionType]
    if (activeChild.totalPoints < action.cost) {
      Taro.showToast({ title: `还差 ${action.cost - activeChild.totalPoints} 积分`, icon: 'none' })
      return
    }

    const res = await Taro.showModal({
      title: `${action.emoji} ${action.label}`,
      content: `花费 ${action.cost} 积分给 ${selectedPet.name} ${action.label}？`,
      confirmText: '确认',
      confirmColor: BRAND_COLORS.primary,
    })
    if (!res.confirm) return

    try {
      await carePet(selectedPet.id, actionType)
      Taro.showToast({ title: `${action.label}成功！${selectedPet.name} 很开心 ${action.emoji}`, icon: 'none', duration: 2000 })
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '操作失败', icon: 'none' })
    }
  }

  return (
    <View className='pet-page page-shell'>
      <View className='page-hero pet-hero'>
        <Text className='hero-overline'>宠物伙伴</Text>
        <Text className='hero-title'>{selectedPet.name}</Text>
        <Text className='hero-subtitle'>{MOOD_LABEL[mood]}。你已经养了 {pets.length} 只宠物，可以切换照顾，也能继续领养新的伙伴。</Text>

        <View className='pet-hero-emoji'>
          <Text className='pet-emoji-big'>{petEmoji}</Text>
        </View>

        <View className='hero-chip-row'>
          <Text className='hero-chip strong'>{MOOD_EMOJI[mood]} {MOOD_LABEL[mood]}</Text>
          <Text className='hero-chip'>{STAGE_LABEL[selectedPet.stage]}</Text>
          <Text className='hero-chip'>{pets.length} 只宠物</Text>
          <Text className='hero-chip warm'>积分 {activeChild.totalPoints}</Text>
        </View>
      </View>

      <ScrollView scrollY className='page-scroll pet-scroll'>
        <View className='section-card pet-section'>
          <View className='section-card-header'>
            <Text className='section-title'>我的宠物</Text>
            <Text className='section-note'>点击切换当前照顾对象</Text>
          </View>
          <ScrollView scrollX enableFlex className='pet-selector-scroll'>
            <View className='pet-selector-row'>
              {pets.map(pet => {
                const petType = PET_TYPES.find(item => item.id === pet.petTypeId)
                const cardMood = getPetMood(pet)
                const isActive = pet.id === selectedPet.id
                return (
                  <View
                    key={pet.id}
                    className={`pet-selector-card ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedPetId(pet.id)}
                  >
                    <View className='pet-selector-top'>
                      <Text className='pet-selector-emoji'>{petType ? getPetEmoji(petType, pet.stage) : '🐾'}</Text>
                      <Text className='pet-selector-stage'>{STAGE_LABEL[pet.stage]}</Text>
                    </View>
                    <Text className='pet-selector-name'>{pet.name}</Text>
                    <Text className='pet-selector-meta'>{MOOD_LABEL[cardMood]}</Text>
                  </View>
                )
              })}
            </View>
          </ScrollView>
        </View>

        <View className='section-card pet-section'>
          <View className='section-card-header'>
            <Text className='section-title'>宠物状态</Text>
            <Text className='section-note'>实时变化</Text>
          </View>
          {[
            { label: '饱食度', value: selectedPet.hunger },
            { label: '清洁度', value: selectedPet.cleanliness },
            { label: '快乐度', value: selectedPet.happiness },
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
            <Text className='section-note'>{selectedPet.careCount} 次照料</Text>
          </View>
          <View className='growth-stages'>
            <Text className={`growth-stage ${selectedPet.stage === 'baby' ? 'active' : ''}`}>幼崽</Text>
            <View className='growth-line'>
              <View className='growth-progress' style={{ width: `${stageProgress}%` }} />
            </View>
            <Text className={`growth-stage ${selectedPet.stage === 'teen' ? 'active' : ''}`}>少年</Text>
            <View className='growth-line'>
              <View className='growth-progress' style={{ width: selectedPet.stage === 'adult' ? '100%' : '0%' }} />
            </View>
            <Text className={`growth-stage ${selectedPet.stage === 'adult' ? 'active' : ''}`}>成年</Text>
          </View>
          <Text className='growth-count'>
            {selectedPet.stage === 'adult'
              ? `已照料 ${selectedPet.careCount} 次，现在已经成年。`
              : `还需照料 ${nextThreshold - selectedPet.careCount} 次升级。`}
          </Text>
        </View>

        <View className='section-card pet-section'>
          <View className='section-card-header'>
            <Text className='section-title'>继续领养</Text>
            <Text className='section-note'>新伙伴会加入你的宠物列表</Text>
          </View>
          <Text className='shop-hint shop-hint-inline'>已有宠物不会受影响，想养更多就直接继续挑选。</Text>
          {renderShopList()}
        </View>
      </ScrollView>
    </View>
  )
}
