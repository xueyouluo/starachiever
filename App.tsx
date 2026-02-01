import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TaskCard from './components/TaskCard';
import RewardCard from './components/RewardCard';
import ProfileTab from './components/ProfileTab';
import CalendarTab from './components/CalendarTab';
import ParentMode from './components/ParentMode';
import { Task, Reward, Tab, AppData, Badge, BadgeCriteria, ChildProfile, UserState } from './types';
import { createDefaultChild, INITIAL_STATS } from './constants';
import { PlusCircle, User, LogOut } from 'lucide-react';

const STORAGE_KEY = 'starachiever_data_v4'; 
const NEW_STORAGE_KEY = 'starachiever_data_v5'; // Bump version for multi-user support

const App: React.FC = () => {
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [parentPassword, setParentPassword] = useState<string | undefined>(undefined);
  
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TASKS);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [isParentModeOpen, setIsParentModeOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from local storage with Migration Logic
  useEffect(() => {
    // Check new storage first
    const savedDataV5 = localStorage.getItem(NEW_STORAGE_KEY);
    
    if (savedDataV5) {
      try {
        const parsed: AppData = JSON.parse(savedDataV5);
        // Ensure date consistency for each child
        const today = new Date().toISOString().split('T')[0];
        
        const updatedChildren = parsed.children.map(child => {
           // 确保 dailyHistory 字段存在（兼容旧数据）
           if (!child.dailyHistory) {
               child.dailyHistory = {};
           }

           // Reset daily tasks logic
           if (child.lastLoginDate !== today) {
               const tasks = child.tasks.map(t => ({...t, completed: false}));

               const yesterday = new Date();
               yesterday.setDate(yesterday.getDate() - 1);
               const yesterdayStr = yesterday.toISOString().split('T')[0];

               let newStreak = child.currentStreak;
               if (child.lastLoginDate === yesterdayStr) {
                   newStreak += 1;
               } else {
                   newStreak = 1;
               }

               return {
                   ...child,
                   lastLoginDate: today,
                   currentStreak: newStreak,
                   tasks
               };
           }
           return child;
        });
        
        setChildrenList(updatedChildren);
        setActiveChildId(parsed.activeChildId);
        setParentPassword(parsed.parentPassword);
      } catch (e) {
        console.error("Failed to load v5 data", e);
      }
    } else {
      // Fallback: Check for V4 data to migrate
      const savedDataV4 = localStorage.getItem(STORAGE_KEY);
      if (savedDataV4) {
          try {
             // Migration from V4 (single user) to V5 (multi user)
             const oldData = JSON.parse(savedDataV4);
             
             // Create a child profile from old data
             const migratedChild: ChildProfile = {
                 id: 'default_migrated_child',
                 name: oldData.user.name || '宝贝',
                 avatar: '👶',
                 themeColor: 'kid-blue',
                 tasks: oldData.tasks || [],
                 rewards: oldData.rewards || [],
                 badges: oldData.badges || [],
                 history: oldData.history || {},
                 dailyHistory: {}, // 旧数据没有详细记录，从现在开始记录
                 totalPoints: oldData.user.totalPoints || 0,
                 currentStreak: oldData.user.currentStreak || 0,
                 lastLoginDate: oldData.user.lastLoginDate || new Date().toISOString().split('T')[0],
                 unlockedBadges: oldData.user.unlockedBadges || [],
                 stats: oldData.user.stats || INITIAL_STATS
             };
             
             setChildrenList([migratedChild]);
             setActiveChildId(migratedChild.id);
             // No password in old version, leave as undefined
          } catch(e) {
              console.error("Migration failed", e);
          }
      }
    }
    setIsLoaded(true);
  }, []);

  // Save data
  useEffect(() => {
    if (!isLoaded) return;
    
    const data: AppData = {
      children: childrenList,
      activeChildId,
      parentPassword
    };
    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(data));
  }, [childrenList, activeChildId, parentPassword, isLoaded]);

  // Derived state for current child
  const currentChild = childrenList.find(c => c.id === activeChildId);

  // Helper to update CURRENT child
  const updateCurrentChild = (updater: (c: ChildProfile) => ChildProfile) => {
      if (!currentChild) return;
      setChildrenList(prev => prev.map(c => c.id === currentChild.id ? updater(c) : c));
  };

  // Badge Logic
  const checkCriteria = (criteria: BadgeCriteria, stats: any, streak: number): boolean => {
    switch (criteria.type) {
      case 'TOTAL_TASKS':
        return stats.totalTasksCompleted >= criteria.threshold;
      case 'TOTAL_POINTS':
        return stats.totalPointsEarned >= criteria.threshold;
      case 'STREAK':
        return streak >= criteria.threshold;
      case 'CATEGORY_COUNT':
        if (!criteria.categoryId) return false;
        return (stats.categoryCounts[criteria.categoryId] || 0) >= criteria.threshold;
      default:
        return false;
    }
  };

  const checkBadges = (child: ChildProfile) => {
    const unlockedNow: Badge[] = [];
    let updatedChild = { ...child };

    child.badges.forEach(badge => {
      if (!updatedChild.unlockedBadges.includes(badge.id)) {
        if (checkCriteria(badge.criteria, updatedChild.stats, updatedChild.currentStreak)) {
          updatedChild.unlockedBadges = [...updatedChild.unlockedBadges, badge.id];
          unlockedNow.push(badge);
        }
      }
    });

    if (unlockedNow.length > 0) {
      updateCurrentChild(() => updatedChild);
      setNewBadge(unlockedNow[0]); 
      setTimeout(() => setNewBadge(null), 4000);
    }
  };

  const handleCompleteTask = async (id: string) => {
    if (!currentChild) return;

    const task = currentChild.tasks.find(t => t.id === id);
    if (!task || task.completed) return;

    // We can't use simple updateCurrentChild efficiently because we need to chain updates for badge check
    // So we manually calculate the new state for the child

    const today = new Date().toISOString().split('T')[0];
    const completedTime = new Date().toISOString();

    const updatedTasks = currentChild.tasks.map(t => t.id === id ? { ...t, completed: true } : t);
    const updatedHistory = {
        ...currentChild.history,
        [today]: (currentChild.history[today] || 0) + 1
    };

    // 更新每日详细记录
    const todayHistory = currentChild.dailyHistory?.[today] || { date: today, tasks: [], totalPoints: 0, totalTasks: 0 };
    const newDailyHistory = {
        ...currentChild.dailyHistory,
        [today]: {
            date: today,
            tasks: [
                ...todayHistory.tasks,
                {
                    id: task.id,
                    title: task.title,
                    icon: task.icon,
                    points: task.points,
                    category: task.category,
                    completedTime
                }
            ],
            totalPoints: todayHistory.totalPoints + task.points,
            totalTasks: todayHistory.totalTasks + 1
        }
    };

    const updatedStats = {
        ...currentChild.stats,
        totalTasksCompleted: currentChild.stats.totalTasksCompleted + 1,
        totalPointsEarned: currentChild.stats.totalPointsEarned + task.points,
        categoryCounts: {
            ...currentChild.stats.categoryCounts,
            [task.category]: (currentChild.stats.categoryCounts[task.category] || 0) + 1
        }
    };

    let updatedChild: ChildProfile = {
        ...currentChild,
        tasks: updatedTasks,
        history: updatedHistory,
        dailyHistory: newDailyHistory,
        stats: updatedStats,
        totalPoints: currentChild.totalPoints + task.points
    };

    // Check badges on this new state
    const unlockedNow: Badge[] = [];
    updatedChild.badges.forEach(badge => {
      if (!updatedChild.unlockedBadges.includes(badge.id)) {
        if (checkCriteria(badge.criteria, updatedChild.stats, updatedChild.currentStreak)) {
          updatedChild.unlockedBadges = [...updatedChild.unlockedBadges, badge.id];
          unlockedNow.push(badge);
        }
      }
    });

    if (unlockedNow.length > 0) {
       setNewBadge(unlockedNow[0]);
       setTimeout(() => setNewBadge(null), 4000);
    }

    setChildrenList(prev => prev.map(c => c.id === currentChild.id ? updatedChild : c));
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const handleRedeemReward = (reward: Reward) => {
    if (!currentChild) return;
    
    if (currentChild.totalPoints >= reward.cost) {
      if(window.confirm(`确定要花 ${reward.cost} 积分兑换 "${reward.title}" 吗?`)) {
        updateCurrentChild(c => ({...c, totalPoints: c.totalPoints - reward.cost}));
        alert(`兑换成功！请找爸爸妈妈领取奖励: ${reward.title}`);
      }
    }
  };

  // --- Render Views ---

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kid-bg">
        <div className="animate-spin text-4xl">🌟</div>
      </div>
    );
  }

  // Profile Selection Screen
  if (!activeChildId || !currentChild) {
      return (
          <div className="min-h-screen bg-kid-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
               {/* Background decorations */}
               <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-10 -translate-y-10"></div>
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-10 translate-y-10"></div>
               
               <h1 className="text-3xl font-black text-gray-800 mb-8 relative z-10">谁在打卡? 🤔</h1>
               
               <div className="grid grid-cols-2 gap-6 w-full max-w-sm mb-10 relative z-10">
                   {childrenList.map(child => (
                       <button 
                        key={child.id}
                        onClick={() => setActiveChildId(child.id)}
                        className="bg-white p-6 rounded-3xl shadow-xl flex flex-col items-center gap-3 transition-transform hover:scale-105 active:scale-95 border-4 border-transparent hover:border-kid-blue"
                       >
                           <div className="text-6xl">{child.avatar}</div>
                           <span className="font-bold text-lg text-gray-700">{child.name}</span>
                           <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">⭐️ {child.totalPoints}</span>
                       </button>
                   ))}
                   
                   <button 
                    onClick={() => setIsParentModeOpen(true)}
                    className="bg-gray-100 p-6 rounded-3xl border-4 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:bg-white hover:border-gray-400 transition-colors"
                   >
                       <PlusCircle size={40} className="text-gray-400" />
                       <span className="font-bold text-gray-500">添加成员</span>
                   </button>
               </div>
               
               <div className="absolute bottom-10">
                   <button onClick={() => setIsParentModeOpen(true)} className="text-gray-400 text-sm font-bold flex items-center gap-1 hover:text-gray-600">
                       <User size={16} /> 家长模式
                   </button>
               </div>

               <ParentMode 
                isOpen={isParentModeOpen}
                onClose={() => setIsParentModeOpen(false)}
                childrenList={childrenList}
                setChildrenList={setChildrenList}
                activeChildId={activeChildId}
                setActiveChildId={setActiveChildId}
                savedPassword={parentPassword}
                onSetPassword={setParentPassword}
               />
          </div>
      );
  }

  // Main App Content
  const renderContent = () => {
    switch (activeTab) {
      case Tab.TASKS:
        const totalTasks = currentChild.tasks.length;
        const completedTasks = currentChild.tasks.filter(t => t.completed).length;
        const todayPoints = currentChild.tasks.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0);

        return (
          <div className="space-y-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
               
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl border-2 border-white/30">
                            {currentChild.avatar}
                        </div>
                        <div>
                            <h2 className="text-xl font-black mb-1">早安, {currentChild.name}!</h2>
                            <p className="opacity-90 text-xs font-bold">今天也要元气满满哦！</p>
                        </div>
                     </div>
                     <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <span className="text-orange-300">🔥</span>
                        <span className="font-black text-sm">{currentChild.currentStreak}天</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-black/20 rounded-xl p-3 flex flex-col items-center">
                        <span className="text-xs opacity-80 font-bold mb-1">今日任务</span>
                        <div className="text-2xl font-black flex items-baseline gap-1">
                           <span>{completedTasks}</span>
                           <span className="text-sm opacity-60">/ {totalTasks}</span>
                        </div>
                     </div>
                     <div className="bg-black/20 rounded-xl p-3 flex flex-col items-center">
                         <span className="text-xs opacity-80 font-bold mb-1">今日获得</span>
                         <div className="text-2xl font-black text-yellow-300">+{todayPoints}</div>
                     </div>
                  </div>
               </div>
            </div>

            <h3 className="text-gray-700 font-bold text-lg mb-4 pl-2 flex items-center justify-between">
                <span>今日任务</span>
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">{currentChild.name}的任务表</span>
            </h3>
            {currentChild.tasks.length === 0 ? (
               <div className="text-center py-10 text-gray-400">
                  <p>还没有任务哦，请家长添加</p>
               </div>
            ) : (
              currentChild.tasks.map(task => (
                <TaskCard key={task.id} task={task} onComplete={handleCompleteTask} />
              ))
            )}
            
            {currentChild.tasks.length > 0 && currentChild.tasks.every(t => t.completed) && (
               <div className="text-center py-10 opacity-60">
                  <p className="text-4xl mb-2">🎉</p>
                  <p className="text-gray-500 font-bold">任务全部完成啦！太棒了！</p>
               </div>
            )}
          </div>
        );
      case Tab.CALENDAR:
        return <CalendarTab history={currentChild.history} />;
      case Tab.REWARDS:
        return (
          <div>
             <div className="bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl p-6 text-white mb-6 shadow-lg text-center relative">
               {/* User badge */}
               <div className="absolute top-4 left-4 flex items-center gap-1 opacity-50">
                    <span className="text-sm">{currentChild.avatar}</span>
                    <span className="text-xs font-bold">{currentChild.name}</span>
               </div>
              <p className="text-sm font-bold opacity-80 mb-1">当前积分</p>
              <h2 className="text-5xl font-black drop-shadow-md">{currentChild.totalPoints}</h2>
            </div>
            <h3 className="text-gray-700 font-bold text-lg mb-4 pl-2">奖励兑换</h3>
            {currentChild.rewards.length === 0 ? (
               <div className="text-center py-10 text-gray-400">
                  <p>还没有奖励哦，请家长添加</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {currentChild.rewards.map(reward => (
                  <RewardCard 
                    key={reward.id} 
                    reward={reward} 
                    canAfford={currentChild.totalPoints >= reward.cost} 
                    onRedeem={handleRedeemReward} 
                  />
                ))}
              </div>
            )}
          </div>
        );
      case Tab.PROFILE:
        const userStateCompatible: UserState = {
            name: currentChild.name,
            totalPoints: currentChild.totalPoints,
            currentStreak: currentChild.currentStreak,
            lastLoginDate: currentChild.lastLoginDate,
            stats: currentChild.stats,
            unlockedBadges: currentChild.unlockedBadges
        };
        return (
            <div className="relative">
                <ProfileTab user={userStateCompatible} badges={currentChild.badges} />
                
                <div className="mt-8 px-4">
                    <button 
                        onClick={() => setActiveChildId(null)} 
                        className="w-full bg-white border-2 border-gray-200 text-gray-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50"
                    >
                        <LogOut size={18} />
                        切换用户
                    </button>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      points={currentChild.totalPoints}
      onOpenParentMode={() => setIsParentModeOpen(true)}
    >
      {renderContent()}
      
      {/* Task Completion Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
           <div className="animate-bounce-slow text-9xl filter drop-shadow-2xl">
              🌟
           </div>
           <div className="absolute inset-0 bg-white/30 mix-blend-overlay"></div>
        </div>
      )}

      {/* New Badge Popup */}
      {newBadge && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6 animate-fadeIn">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-3xl p-8 text-center relative z-10 shadow-2xl max-w-sm animate-bounce">
            <div className="text-xs font-bold text-kid-blue uppercase tracking-widest mb-2">新成就解锁!</div>
            <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center text-6xl mb-4 shadow-lg ${newBadge.color}`}>
              {newBadge.icon}
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">{newBadge.title}</h2>
            <p className="text-gray-500 font-medium">{newBadge.description}</p>
          </div>
        </div>
      )}

      {/* Parent Mode Modal */}
      <ParentMode 
        isOpen={isParentModeOpen}
        onClose={() => setIsParentModeOpen(false)}
        childrenList={childrenList}
        setChildrenList={setChildrenList}
        activeChildId={activeChildId}
        setActiveChildId={setActiveChildId}
        savedPassword={parentPassword}
        onSetPassword={setParentPassword}
      />
    </Layout>
  );
};

export default App;
