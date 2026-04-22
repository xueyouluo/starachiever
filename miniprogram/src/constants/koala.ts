import { Category, Task } from '../types'

export const KOALA_CATEGORIES: Category[] = [
  { id: 'koala_read', name: '阅读', icon: '📖', color: 'bg-blue-100 text-blue-700', isDefault: true, isArchived: false, createdAt: '' },
  { id: 'koala_study', name: '学习习惯', icon: '✏️', color: 'bg-green-100 text-green-700', isDefault: true, isArchived: false, createdAt: '' },
  { id: 'koala_char', name: '行为品格', icon: '❤️', color: 'bg-pink-100 text-pink-700', isDefault: true, isArchived: false, createdAt: '' },
  { id: 'koala_extra', name: '额外学习', icon: '🎓', color: 'bg-purple-100 text-purple-700', isDefault: true, isArchived: false, createdAt: '' },
  { id: 'koala_life', name: '生活习惯', icon: '🧹', color: 'bg-teal-100 text-teal-700', isDefault: true, isArchived: false, createdAt: '' },
  { id: 'koala_achieve', name: '小成就', icon: '🌟', color: 'bg-yellow-100 text-yellow-700', isDefault: true, isArchived: false, createdAt: '' },
  { id: 'koala_penalty', name: '扣分项', icon: '⚠️', color: 'bg-red-100 text-red-700', isDefault: true, isArchived: false, createdAt: '' },
]

const cat = (id: string) => KOALA_CATEGORIES.find(c => c.id === id)!

export const KOALA_TASKS: Task[] = [
  // 阅读
  { id: 'kt1', title: '认真晨读20分钟', icon: '📖', points: 2, completed: false, color: 'bg-blue-100 text-blue-700', category: cat('koala_read') },
  { id: 'kt2', title: '认真阅读英文≥20分钟', icon: '🔤', points: 3, completed: false, color: 'bg-blue-100 text-blue-700', category: cat('koala_read') },
  { id: 'kt3', title: '阅读≥30分钟', icon: '📚', points: 3, completed: false, color: 'bg-blue-100 text-blue-700', category: cat('koala_read') },

  // 学习习惯
  { id: 'kt4', title: '高品质有计划完成作业', icon: '📝', points: 2, completed: false, color: 'bg-green-100 text-green-700', category: cat('koala_study') },
  { id: 'kt5', title: '及时整理桌面/书包', icon: '🎒', points: 1, completed: false, color: 'bg-green-100 text-green-700', category: cat('koala_study') },
  { id: 'kt6', title: '坐姿/握笔标准，合理用眼', icon: '👀', points: 2, completed: false, color: 'bg-green-100 text-green-700', category: cat('koala_study') },
  { id: 'kt7', title: '预习明天所学内容', icon: '📋', points: 3, completed: false, color: 'bg-green-100 text-green-700', category: cat('koala_study') },
  { id: 'kt8', title: '复习今日所学内容', icon: '🔁', points: 2, completed: false, color: 'bg-green-100 text-green-700', category: cat('koala_study') },

  // 行为品格
  { id: 'kt9', title: '9点20之前关灯睡觉', icon: '🌙', points: 2, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },
  { id: 'kt10', title: '7点10分高效起床', icon: '⏰', points: 2, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },
  { id: 'kt11', title: '玩具/书及时收拾整理', icon: '🧸', points: 3, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },
  { id: 'kt12', title: '照顾妹妹，耐心引导妹妹', icon: '👧', points: 3, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },
  { id: 'kt13', title: '一天不乱发脾气', icon: '😊', points: 3, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },
  { id: 'kt14', title: '礼貌待人，主动打招呼', icon: '👋', points: 2, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },
  { id: 'kt15', title: '友好相处，乐于助人', icon: '🤝', points: 2, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },
  { id: 'kt16', title: '遇到难题主动想办法解决', icon: '💡', points: 5, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },
  { id: 'kt17', title: '尊重长辈，好好说话', icon: '💬', points: 3, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },
  { id: 'kt18', title: '有错主动承认并积极改正', icon: '✅', points: 5, completed: false, color: 'bg-pink-100 text-pink-700', category: cat('koala_char') },

  // 额外学习
  { id: 'kt19', title: '写字15分钟', icon: '✏️', points: 2, completed: false, color: 'bg-purple-100 text-purple-700', category: cat('koala_extra') },
  { id: 'kt20', title: '计算练习', icon: '🔢', points: 2, completed: false, color: 'bg-purple-100 text-purple-700', category: cat('koala_extra') },
  { id: 'kt21', title: '看图写话/句式练习', icon: '🖊️', points: 2, completed: false, color: 'bg-purple-100 text-purple-700', category: cat('koala_extra') },
  { id: 'kt22', title: '五星学霸/阳光同学', icon: '⭐', points: 2, completed: false, color: 'bg-purple-100 text-purple-700', category: cat('koala_extra') },
  { id: 'kt23', title: '实验班/默写达人', icon: '🏅', points: 2, completed: false, color: 'bg-purple-100 text-purple-700', category: cat('koala_extra') },
  { id: 'kt24', title: '高频词并熟读', icon: '📑', points: 2, completed: false, color: 'bg-purple-100 text-purple-700', category: cat('koala_extra') },
  { id: 'kt25', title: '听英语15分钟', icon: '🎧', points: 2, completed: false, color: 'bg-purple-100 text-purple-700', category: cat('koala_extra') },
  { id: 'kt26', title: '天天练/数感星球/纪录片≥20分钟', icon: '📱', points: 1, completed: false, color: 'bg-purple-100 text-purple-700', category: cat('koala_extra') },

  // 生活习惯
  { id: 'kt27', title: '洗内裤/袜子/碗', icon: '🧺', points: 1, completed: false, color: 'bg-teal-100 text-teal-700', category: cat('koala_life') },
  { id: 'kt28', title: '鞋子摆放整齐', icon: '👟', points: 1, completed: false, color: 'bg-teal-100 text-teal-700', category: cat('koala_life') },
  { id: 'kt29', title: '扫地/擦桌子/整理房间', icon: '🧹', points: 1, completed: false, color: 'bg-teal-100 text-teal-700', category: cat('koala_life') },
  { id: 'kt30', title: '独立睡觉', icon: '🛏️', points: 2, completed: false, color: 'bg-teal-100 text-teal-700', category: cat('koala_life') },
  { id: 'kt31', title: '运动≥30分钟', icon: '⚽', points: 2, completed: false, color: 'bg-teal-100 text-teal-700', category: cat('koala_life') },
  { id: 'kt32', title: '跳绳2次/街舞打卡', icon: '🎽', points: 2, completed: false, color: 'bg-teal-100 text-teal-700', category: cat('koala_life') },

  // 小成就
  { id: 'kt33', title: '测试95分以上', icon: '🏆', points: 5, completed: false, color: 'bg-yellow-100 text-yellow-700', category: cat('koala_achieve') },
  { id: 'kt34', title: '在校得表扬/星', icon: '⭐', points: 3, completed: false, color: 'bg-yellow-100 text-yellow-700', category: cat('koala_achieve') },

  // 扣分项
  { id: 'kt35', title: '说谎/打人等不良行为', icon: '❌', points: -10, completed: false, color: 'bg-red-100 text-red-700', category: cat('koala_penalty') },
  { id: 'kt36', title: '提醒3次无效', icon: '🔔', points: -5, completed: false, color: 'bg-red-100 text-red-700', category: cat('koala_penalty') },
  { id: 'kt37', title: '上课/写作业态度不端正', icon: '😤', points: -10, completed: false, color: 'bg-red-100 text-red-700', category: cat('koala_penalty') },
  { id: 'kt38', title: '大喊大叫，乱说话', icon: '📢', points: -5, completed: false, color: 'bg-red-100 text-red-700', category: cat('koala_penalty') },
]
