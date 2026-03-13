import { Category } from '../types';

/**
 * 12种预设颜色方案
 * 每种颜色包含背景色和文字颜色的组合
 */
export const CATEGORY_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', name: '蓝色' },
  { bg: 'bg-green-100', text: 'text-green-700', name: '绿色' },
  { bg: 'bg-purple-100', text: 'text-purple-700', name: '紫色' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', name: '黄色' },
  { bg: 'bg-pink-100', text: 'text-pink-700', name: '粉色' },
  { bg: 'bg-red-100', text: 'text-red-700', name: '红色' },
  { bg: 'bg-orange-100', text: 'text-orange-700', name: '橙色' },
  { bg: 'bg-teal-100', text: 'text-teal-700', name: '青色' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', name: '靛蓝' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', name: '天蓝' },
  { bg: 'bg-lime-100', text: 'text-lime-700', name: '青柠' },
  { bg: 'bg-amber-100', text: 'text-amber-700', name: '琥珀' },
];

/**
 * 30个预设分类图标（emoji）
 * 涵盖学习、运动、生活、艺术等各个方面
 */
export const CATEGORY_ICONS = [
  // 学习相关
  '📚', '✏️', '📖', '🎓', '🔬',
  // 运动健康
  '⚽', '🏀', '🏊', '🚴', '💪',
  // 艺术创作
  '🎨', '🎵', '🎭', '📸', '🎬',
  // 生活技能
  '🍳', '🧹', '🌱', '👔', '💻',
  // 品德习惯
  '❤️', '🤝', '🌟', '🎯', '💡',
  // 其他
  '⭐', '🎁', '🎪', '🎢', '🏰',
];

/**
 * 常见分类名称建议
 * 用于在创建分类时提供快速选项
 */
export const CATEGORY_NAME_SUGGESTIONS = [
  // 学习类
  '阅读', '写作', '数学', '英语', '科学', '编程', '绘画', '音乐',
  // 运动类
  '跑步', '游泳', '球类', '瑜伽', '健身', '舞蹈',
  // 生活类
  '家务', '烹饪', '整理', '购物', '理财',
  // 习惯类
  '早起', '早睡', '喝水', '锻炼', '冥想',
  // 品德类
  '助人', '礼貌', '分享', '诚实', '感恩',
  // 其他
  '娱乐', '休闲', '社交', '旅行',
];

/**
 * 4个默认分类
 * 这些分类会在数据迁移时自动创建
 */
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'learning',
    name: '学习',
    icon: '📚',
    color: `${CATEGORY_COLORS[0].bg} ${CATEGORY_COLORS[0].text}`,
    isArchived: false,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'health',
    name: '健康',
    icon: '💪',
    color: `${CATEGORY_COLORS[1].bg} ${CATEGORY_COLORS[1].text}`,
    isArchived: false,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'chores',
    name: '家务',
    icon: '🧹',
    color: `${CATEGORY_COLORS[2].bg} ${CATEGORY_COLORS[2].text}`,
    isArchived: false,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'other',
    name: '其他',
    icon: '⭐',
    color: `${CATEGORY_COLORS[3].bg} ${CATEGORY_COLORS[3].text}`,
    isArchived: false,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

/**
 * 生成唯一的分类ID
 * @param name 分类名称（可选，用于生成更友好的ID）
 * @returns 唯一的分类ID
 */
export const generateCategoryId = (name?: string): string => {
  if (name) {
    // 将中文名称转换为拼音或简化形式
    // 这里使用简单的时间戳 + 随机数策略
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `cat_${timestamp}_${random}`;
  }

  // 生成格式：cat_ + 时间戳 + 4位随机数
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `cat_${timestamp}_${random}`;
};

/**
 * 检查分类ID在列表中是否唯一
 * @param id 要检查的分类ID
 * @param categories 现有分类列表
 * @param excludeId 排除的分类ID（用于编辑时检查）
 * @returns 是否唯一
 */
export const isCategoryIdUnique = (
  id: string,
  categories: Category[],
  excludeId?: string
): boolean => {
  return !categories.some(cat => cat.id === id && cat.id !== excludeId);
};

/**
 * 获取颜色方案的完整类名
 * @param colorIndex 颜色索引（0-11）
 * @returns 完整的 Tailwind 类名字符串
 */
export const getColorClasses = (colorIndex: number): string => {
  const index = Math.max(0, Math.min(colorIndex, CATEGORY_COLORS.length - 1));
  const color = CATEGORY_COLORS[index];
  return `${color.bg} ${color.text}`;
};

/**
 * 从建议列表中获取分类名称（辅助函数，已弃用，保留用于兼容性）
 * @param keyword 关键词
 * @returns 建议的分类名称
 */
export const getCategoryName = (keyword?: string): string => {
  // 这个函数已弃用，仅用于类型兼容
  return keyword || '自定义分类';
};
