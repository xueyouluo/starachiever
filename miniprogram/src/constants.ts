import { Task, Reward, Badge, ChildProfile, UserStats, Category } from './types';
import { DEFAULT_CATEGORIES } from './constants/categories';

export const INITIAL_TASKS: Task[] = [
  { id: '1', title: '早起刷牙洗脸', icon: '🪥', points: 5, completed: false, color: 'bg-blue-100 text-blue-600', category: DEFAULT_CATEGORIES[1] },
  { id: '2', title: '阅读绘本 20分钟', icon: '📖', points: 10, completed: false, color: 'bg-green-100 text-green-600', category: DEFAULT_CATEGORIES[0] },
  { id: '3', title: '整理玩具', icon: '🧸', points: 8, completed: false, color: 'bg-purple-100 text-purple-600', category: DEFAULT_CATEGORIES[2] },
  { id: '4', title: '吃完所有蔬菜', icon: '🥦', points: 15, completed: false, color: 'bg-green-100 text-green-700', category: DEFAULT_CATEGORIES[1] },
  { id: '5', title: '练习写字', icon: '✏️', points: 10, completed: false, color: 'bg-yellow-100 text-yellow-600', category: DEFAULT_CATEGORIES[0] },
];

export const INITIAL_REWARDS: Reward[] = [
  { id: 'r1', title: '看电视 30分钟', cost: 50, icon: '📺', color: 'bg-pink-100 text-pink-600' },
  { id: 'r2', title: '去公园玩', cost: 100, icon: '🎠', color: 'bg-green-100 text-green-600' },
  { id: 'r3', title: '吃冰淇淋', cost: 80, icon: '🍦', color: 'bg-blue-100 text-blue-600' },
  { id: 'r4', title: '买一个小玩具', cost: 200, icon: '🎁', color: 'bg-yellow-100 text-yellow-600' },
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_step',
    title: '初出茅庐',
    description: '完成第1个任务',
    icon: '🐣',
    color: 'bg-yellow-100 text-yellow-600',
    criteria: { type: 'TOTAL_TASKS', value: 1 }
  },
  {
    id: 'streak_3',
    title: '坚持不懈',
    description: '连续打卡3天',
    icon: '🔥',
    color: 'bg-red-100 text-red-600',
    criteria: { type: 'STREAK', value: 3 }
  },
  {
    id: 'streak_7',
    title: '习惯养成',
    description: '连续打卡7天',
    icon: '📅',
    color: 'bg-purple-100 text-purple-600',
    criteria: { type: 'STREAK', value: 7 }
  },
  {
    id: 'learner_5',
    title: '阅读小博士',
    description: '完成5次学习任务',
    icon: '🎓',
    color: 'bg-blue-100 text-blue-600',
    criteria: { type: 'CATEGORY_COUNT', value: 5, categoryId: 'learning' }
  },
  {
    id: 'health_hero',
    title: '健康小卫士',
    description: '完成10次健康任务',
    icon: '🦸',
    color: 'bg-green-100 text-green-600',
    criteria: { type: 'CATEGORY_COUNT', value: 10, categoryId: 'health' }
  },
  {
    id: 'rich_kid',
    title: '积分大亨',
    description: '累计获得100积分',
    icon: '💰',
    color: 'bg-yellow-200 text-yellow-700',
    criteria: { type: 'TOTAL_POINTS', value: 100 }
  }
];

export const INITIAL_STATS: UserStats = {
  totalTasksCompleted: 0,
  totalPointsEarned: 0,
  categoryCounts: {}  // 动态分类计数，初始为空
};

/**
 * 确保统计对象包含所有分类的计数
 * @param stats 当前统计对象
 * @param categories 分类列表
 * @returns 更新后的统计对象
 */
export const ensureCategoryCounts = (stats: UserStats, categories: Category[]): UserStats => {
  const updatedCategoryCounts = { ...stats.categoryCounts };

  // 确保所有分类都有计数
  categories.forEach(cat => {
    if (!(cat.id in updatedCategoryCounts)) {
      updatedCategoryCounts[cat.id] = 0;
    }
  });

  return {
    ...stats,
    categoryCounts: updatedCategoryCounts
  };
};

export const createDefaultChild = (name: string, avatar: string = '👶'): ChildProfile => {
  const defaultCategories = [...DEFAULT_CATEGORIES];
  const initialStatsWithCategories = ensureCategoryCounts(INITIAL_STATS, defaultCategories);

  return {
    id: Date.now().toString() + Math.random().toString().slice(2, 6),
    name,
    avatar,
    themeColor: 'kid-blue',
    categories: defaultCategories,
    tasks: [...INITIAL_TASKS],
    rewards: [...INITIAL_REWARDS],
    badges: [...INITIAL_BADGES],
    history: {},
    dailyHistory: {},
    redemptions: [],
    totalPoints: 0,
    currentStreak: 0,
    lastLoginDate: new Date().toISOString().split('T')[0],
    unlockedBadges: [],
    stats: initialStatsWithCategories
  };
};