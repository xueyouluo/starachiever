import type { ChildProfile, Pet, PetType, PetMood, PetStage } from '../types'
import { STAGE_THRESHOLDS } from '../constants/pets'

// 基础衰减（每小时）
const BASE_DECAY = {
  hunger: 4,
  cleanliness: 3,
  happiness: 5,
}

/**
 * 纯函数：根据经过时间计算各属性衰减后的值
 */
export function applyTimeDecay(pet: Pet, petType: PetType): Pet {
  const now = new Date()
  const lastUpdated = new Date(pet.lastUpdatedAt)
  const hoursElapsed = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

  if (hoursElapsed <= 0) return pet

  const newHunger = Math.max(0, pet.hunger - BASE_DECAY.hunger * petType.hungerDecayRate * hoursElapsed)
  const newCleanliness = Math.max(0, pet.cleanliness - BASE_DECAY.cleanliness * petType.dirtDecayRate * hoursElapsed)
  const newHappiness = Math.max(0, pet.happiness - BASE_DECAY.happiness * petType.happinessDecayRate * hoursElapsed)

  return {
    ...pet,
    hunger: Math.round(newHunger),
    cleanliness: Math.round(newCleanliness),
    happiness: Math.round(newHappiness),
    lastUpdatedAt: now.toISOString(),
  }
}

/**
 * 根据宠物属性判断心情
 */
export function getPetMood(pet: Pet): PetMood {
  // 任意属性 <= 10 则生病
  if (pet.hunger <= 10 || pet.cleanliness <= 10 || pet.happiness <= 10) {
    return 'sick'
  }
  const avg = (pet.hunger + pet.cleanliness + pet.happiness) / 3
  if (avg >= 85) return 'ecstatic'
  if (avg >= 65) return 'happy'
  if (avg >= 40) return 'normal'
  return 'sad'
}

/**
 * 根据累计照料次数计算成长阶段
 */
export function calcPetStage(careCount: number): PetStage {
  if (careCount >= STAGE_THRESHOLDS.adult) return 'adult'
  if (careCount >= STAGE_THRESHOLDS.teen) return 'teen'
  return 'baby'
}

/**
 * 获取宠物对应阶段的 emoji
 */
export function getPetEmoji(petType: PetType, stage: PetStage): string {
  const stageIndex: Record<PetStage, number> = { baby: 0, teen: 1, adult: 2 }
  return petType.emoji[stageIndex[stage]]
}

export function getChildPets(child?: Pick<ChildProfile, 'pets' | 'pet'> | null): Pet[] {
  if (!child) return []

  const pets = Array.isArray(child.pets) ? child.pets.filter(Boolean) : []
  if (pets.length > 0) {
    return pets
  }

  return child.pet ? [child.pet] : []
}

export function withNormalizedChildPets<T extends ChildProfile>(child: T): T {
  const pets = getChildPets(child)

  return {
    ...child,
    pets,
    pet: pets[0],
  }
}

export const MOOD_EMOJI: Record<PetMood, string> = {
  ecstatic: '🤩',
  happy: '😊',
  normal: '😐',
  sad: '😢',
  sick: '🤒',
}

export const MOOD_LABEL: Record<PetMood, string> = {
  ecstatic: '超级开心',
  happy: '心情不错',
  normal: '还好啦',
  sad: '有点难过',
  sick: '生病了',
}

export const STAGE_LABEL: Record<PetStage, string> = {
  baby: '幼崽',
  teen: '少年',
  adult: '成年',
}
