export type TaskCategory = 'learning' | 'health' | 'chores' | 'other';

export interface Task {
  id: string;
  title: string;
  icon: string; // Emoji or icon name
  points: number;
  completed: boolean;
  color: string;
  category: TaskCategory;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string;
  color: string;
}

// Badge criteria types for serialization
export type BadgeCriteriaType = 'TOTAL_TASKS' | 'TOTAL_POINTS' | 'STREAK' | 'CATEGORY_COUNT';

export interface BadgeCriteria {
  type: BadgeCriteriaType;
  threshold: number;
  categoryId?: TaskCategory; // Only required if type is CATEGORY_COUNT
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria; // Serializable object instead of function
  color: string;
}

export interface UserStats {
  totalTasksCompleted: number;
  totalPointsEarned: number; // Cumulative all-time points
  categoryCounts: Record<TaskCategory, number>;
}

// 每日任务完成明细
export interface DailyTaskCompletion {
  date: string; // YYYY-MM-DD
  tasks: Array<{
    id: string;
    title: string;
    icon: string;
    points: number;
    category: TaskCategory;
    completedTime: string; // ISO timestamp
  }>;
  totalPoints: number; // 当天获得的总积分
  totalTasks: number; // 当天完成的任务数
}

// Added UserState for ProfileTab compatibility
export interface UserState {
  name: string;
  totalPoints: number;
  currentStreak: number;
  lastLoginDate: string;
  stats: UserStats;
  unlockedBadges: string[];
}

export interface ChildProfile {
  id: string;
  name: string;
  avatar: string; // Emoji
  themeColor: string; // e.g., 'blue', 'pink', 'green'

  // Data specific to this child
  tasks: Task[];
  rewards: Reward[];
  badges: Badge[];
  history: Record<string, number>; // Date YYYY-MM-DD -> count of completed tasks
  dailyHistory: Record<string, DailyTaskCompletion>; // Date YYYY-MM-DD -> detailed completion data

  // State
  totalPoints: number; // Current spendable points
  currentStreak: number;
  lastLoginDate: string; // YYYY-MM-DD
  unlockedBadges: string[]; // List of Badge IDs
  stats: UserStats;
}

export interface AppData {
  children: ChildProfile[];
  activeChildId: string | null;
  parentPassword?: string; // Saved password for parent mode
}

export enum Tab {
  TASKS = 'TASKS',
  CALENDAR = 'CALENDAR',
  REWARDS = 'REWARDS',
  PROFILE = 'PROFILE',
}
