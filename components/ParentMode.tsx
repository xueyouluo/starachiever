import React, { useState, useEffect } from 'react';
import { Task, Reward, Badge, TaskCategory, BadgeCriteriaType, ChildProfile } from '../types';
import { X, Trash2, Plus, Users, UserPlus, Lock, KeyRound, Download, FileJson } from 'lucide-react';
import { createDefaultChild } from '../constants';
import { exportChildrenToExcel, exportDataToJSON } from './exportToExcel';
import { AlertModal } from './Modal';

interface ParentModeProps {
  isOpen: boolean;
  onClose: () => void;
  childrenList: ChildProfile[];
  setChildrenList: React.Dispatch<React.SetStateAction<ChildProfile[]>>;
  activeChildId: string | null;
  setActiveChildId: (id: string) => void;
  savedPassword?: string;
  onSetPassword: (password: string) => void;
}

const ParentMode: React.FC<ParentModeProps> = ({
  isOpen, onClose, childrenList, setChildrenList, activeChildId, setActiveChildId,
  savedPassword, onSetPassword
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auth State
  const [inputPassword, setInputPassword] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 弹窗状态
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const [activeTab, setActiveTab] = useState<'children' | 'tasks' | 'rewards' | 'badges'>('children');
  const [editingChildId, setEditingChildId] = useState<string | null>(activeChildId);

  useEffect(() => {
     if (isOpen && activeChildId) {
         setEditingChildId(activeChildId);
     }
     // Reset auth state when closed
     if (!isOpen) {
         setIsAuthenticated(false);
         setInputPassword('');
         setSetupPassword('');
         setConfirmPassword('');
     }
  }, [isOpen, activeChildId]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (inputPassword === savedPassword) {
          setIsAuthenticated(true);
      } else {
          setAlertModal({
              isOpen: true,
              title: '密码错误',
              message: '密码错误哦，请重试',
              type: 'error'
          });
          setInputPassword('');
      }
  };

  // Handle Setup
  const handleSetup = (e: React.FormEvent) => {
      e.preventDefault();
      if (setupPassword.length < 4) {
          setAlertModal({
              isOpen: true,
              title: '密码太短',
              message: '密码太短啦，至少设置4位哦',
              type: 'warning'
          });
          return;
      }
      if (setupPassword !== confirmPassword) {
          setAlertModal({
              isOpen: true,
              title: '密码不匹配',
              message: '两次输入的密码不一样哦',
              type: 'error'
          });
          return;
      }
      onSetPassword(setupPassword);
      setIsAuthenticated(true);
      setAlertModal({
          isOpen: true,
          title: '设置成功',
          message: '密码设置成功！请牢记您的家长密码。',
          type: 'success'
      });
  };

  const reset = () => {
    onClose();
  };
  
  // Helpers
  const getEditingChild = () => childrenList.find(c => c.id === editingChildId) || childrenList[0];
  
  const updateEditingChild = (updater: (child: ChildProfile) => ChildProfile) => {
      const targetId = editingChildId || childrenList[0]?.id;
      if (!targetId) return;
      
      setChildrenList(prev => prev.map(c => {
          if (c.id === targetId) {
              return updater(c);
          }
          return c;
      }));
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[85vh] flex flex-col relative overflow-hidden shadow-2xl">
        <button onClick={reset} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-20">
          <X size={20} />
        </button>

        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
             <div className="bg-white p-4 rounded-full shadow-lg mb-6 text-kid-blue">
                <Lock size={48} />
             </div>

             {/* If no password saved, show Setup Mode */}
             {!savedPassword ? (
                 <div className="w-full max-w-xs">
                     <h2 className="text-2xl font-black mb-2 text-center text-gray-800">设置家长密码 🛡️</h2>
                     <p className="mb-6 text-gray-500 text-center text-sm">为了防止小朋友误操作，请先设置一个密码。</p>
                     <form onSubmit={handleSetup} className="space-y-4">
                         <input
                            type="password"
                            inputMode="numeric"
                            value={setupPassword}
                            onChange={(e) => setSetupPassword(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-xl outline-none focus:border-kid-blue transition-colors"
                            placeholder="输入新密码"
                            autoFocus
                         />
                         <input
                            type="password"
                            inputMode="numeric"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-xl outline-none focus:border-kid-blue transition-colors"
                            placeholder="再次输入确认"
                         />
                         <button type="submit" className="w-full bg-kid-blue text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition-colors">
                             保存并进入
                         </button>
                     </form>
                 </div>
             ) : (
                 /* Login Mode */
                 <div className="w-full max-w-xs">
                     <h2 className="text-2xl font-black mb-2 text-center text-gray-800">家长验证 🛡️</h2>
                     <p className="mb-6 text-gray-500 text-center text-sm">请输入密码进入设置中心。</p>
                     <form onSubmit={handleLogin} className="space-y-4">
                         <input
                            type="password"
                            inputMode="numeric"
                            value={inputPassword}
                            onChange={(e) => setInputPassword(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-xl outline-none focus:border-kid-blue transition-colors"
                            placeholder="输入密码"
                            autoFocus
                         />
                         <button type="submit" className="w-full bg-kid-blue text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                             <KeyRound size={18} />
                             验证进入
                         </button>
                     </form>
                 </div>
             )}
          </div>
        ) : (
          /* Settings Panel (Authenticated) */
          <div className="flex-1 flex flex-col overflow-hidden animate-fadeIn">
             <div className="p-6 pb-2 border-b bg-white z-10">
               <h2 className="text-xl font-bold mb-4">家长设置中心 ⚙️</h2>

               {/* Tab Navigation */}
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                 <button
                    onClick={() => setActiveTab('children')}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${activeTab === 'children' ? 'bg-kid-pink text-white' : 'bg-gray-100 text-gray-500'}`}
                 >
                     <Users size={14} /> 成员
                 </button>
                 {childrenList.length > 0 && ['tasks', 'rewards', 'badges'].map((t) => (
                   <button
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${activeTab === t ? 'bg-kid-blue text-white' : 'bg-gray-100 text-gray-500'}`}
                   >
                     {t === 'tasks' ? '任务' : t === 'rewards' ? '奖励' : '勋章'}
                   </button>
                 ))}
               </div>

               {/* Context Selector for Tasks/Rewards/Badges */}
               {activeTab !== 'children' && childrenList.length > 0 && (
                   <div className="mt-4 flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                       <span className="text-xs font-bold text-gray-400">正在编辑:</span>
                       <select
                        value={editingChildId || ''}
                        onChange={(e) => setEditingChildId(e.target.value)}
                        className="bg-white border border-gray-200 text-sm font-bold rounded-md px-2 py-1 flex-1 outline-none text-kid-blue"
                       >
                           {childrenList.map(c => (
                               <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>
                           ))}
                       </select>
                   </div>
               )}
             </div>

             <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {activeTab === 'children' && (
                    <ChildrenManager
                        childrenList={childrenList}
                        setChildrenList={setChildrenList}
                        activeChildId={activeChildId}
                        setActiveChildId={setActiveChildId}
                        savedPassword={savedPassword}
                    />
                )}
                {activeTab === 'tasks' && childrenList.length > 0 && (
                    <TasksManager
                        tasks={getEditingChild()?.tasks || []}
                        setTasks={(newTasks) => updateEditingChild(c => ({...c, tasks: newTasks}))}
                    />
                )}
                {activeTab === 'rewards' && childrenList.length > 0 && (
                    <RewardsManager
                        rewards={getEditingChild()?.rewards || []}
                        setRewards={(newRewards) => updateEditingChild(c => ({...c, rewards: newRewards}))}
                    />
                )}
                {activeTab === 'badges' && childrenList.length > 0 && (
                    <BadgesManager
                        badges={getEditingChild()?.badges || []}
                        setBadges={(newBadges) => updateEditingChild(c => ({...c, badges: newBadges}))}
                    />
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );

  // 弹窗组件
  return (
    <>
      {modalContent}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ isOpen: false, title: '', message: '', type: 'info' })}
      />
    </>
  );
};

// --- Sub-components ---

const ChildrenManager = ({ childrenList, setChildrenList, activeChildId, setActiveChildId, savedPassword }: any) => {
    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState('👶');

    const handleAddChild = () => {
        if (!newName.trim()) return;
        const newChild = createDefaultChild(newName, newAvatar);
        setChildrenList([...childrenList, newChild]);
        setNewName('');
        setNewAvatar('👶');
        // If it's the first child, auto-select
        if (childrenList.length === 0) setActiveChildId(newChild.id);
    };

    const handleDelete = (id: string) => {
        if (childrenList.length <= 1) {
            alert("至少需要保留一个宝贝哦！");
            return;
        }
        if (confirm("确定要删除这个宝贝的档案吗？所有数据都会消失哦。")) {
            const newList = childrenList.filter((c: any) => c.id !== id);
            setChildrenList(newList);
            if (activeChildId === id) {
                setActiveChildId(newList[0].id);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* 导出按钮组 */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-xl shadow-md">
                    <button
                        onClick={() => exportChildrenToExcel(childrenList)}
                        className="w-full bg-white text-blue-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-md"
                    >
                        <Download size={18} />
                        导出Excel
                    </button>
                    <p className="text-white/80 text-xs mt-2 text-center">每日打卡明细</p>
                </div>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-xl shadow-md">
                    <button
                        onClick={() => exportDataToJSON(childrenList, activeChildId, savedPassword)}
                        className="w-full bg-white text-emerald-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors shadow-md"
                    >
                        <FileJson size={18} />
                        导出JSON
                    </button>
                    <p className="text-white/80 text-xs mt-2 text-center">完整数据备份</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-gray-500 uppercase">添加新成员</h3>
                <div className="flex gap-2">
                    <input 
                        className="w-16 border p-2 rounded-lg text-center text-xl" 
                        value={newAvatar} 
                        onChange={e => setNewAvatar(e.target.value)} 
                        placeholder="👶"
                    />
                    <input 
                        className="flex-1 border p-2 rounded-lg" 
                        placeholder="宝贝名字" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                    />
                </div>
                <button 
                    onClick={handleAddChild} 
                    className="w-full bg-kid-pink text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-pink-600"
                >
                    <UserPlus size={18}/> 添加宝贝
                </button>
            </div>

            <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-500 uppercase px-1">当前成员</h3>
                {childrenList.map((child: ChildProfile) => (
                    <div key={child.id} className={`bg-white p-3 rounded-xl flex items-center justify-between shadow-sm border-l-4 ${activeChildId === child.id ? 'border-kid-blue' : 'border-transparent'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                                {child.avatar}
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">{child.name}</div>
                                <div className="text-xs text-gray-400">积分: {child.totalPoints}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             {activeChildId !== child.id && (
                                 <button onClick={() => setActiveChildId(child.id)} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">
                                     切换
                                 </button>
                             )}
                            <button onClick={() => handleDelete(child.id)} className="text-red-300 hover:text-red-500 p-2">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const TasksManager = ({ tasks, setTasks }: { tasks: Task[], setTasks: (t: Task[]) => void }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(5);
  const [newIcon, setNewIcon] = useState('🌟');
  const [newCategory, setNewCategory] = useState<TaskCategory>('other');

  const add = () => {
    if (!newTitle) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle,
      points: Number(newPoints),
      icon: newIcon,
      category: newCategory,
      completed: false,
      color: 'bg-white border-2 border-gray-100' // simplified color logic
    };
    setTasks([...tasks, newTask]);
    setNewTitle('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-gray-500 uppercase">添加新任务</h3>
        <input className="w-full border p-2 rounded-lg" placeholder="任务名称" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
        <div className="flex gap-2">
          <input className="w-20 border p-2 rounded-lg text-center" type="number" value={newPoints} onChange={e => setNewPoints(Number(e.target.value))} />
          <input className="w-16 border p-2 rounded-lg text-center" value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="Emoji" />
          <select className="flex-1 border p-2 rounded-lg" value={newCategory} onChange={e => setNewCategory(e.target.value as any)}>
            <option value="learning">学习</option>
            <option value="health">健康</option>
            <option value="chores">家务</option>
            <option value="other">其他</option>
          </select>
        </div>
        <button onClick={add} className="w-full bg-green-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Plus size={16}/> 添加任务</button>
      </div>

      <div className="space-y-2">
         {tasks.length === 0 && <p className="text-center text-gray-400 py-4">暂无任务</p>}
         {tasks.map(task => (
           <div key={task.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{task.icon}</span>
                <div>
                  <div className="font-bold">{task.title}</div>
                  <div className="text-xs text-gray-500">+{task.points} | {task.category === 'learning' ? '学习' : task.category === 'health' ? '健康' : task.category === 'chores' ? '家务' : '其他'}</div>
                </div>
              </div>
              <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="text-red-400 p-2"><Trash2 size={18} /></button>
           </div>
         ))}
      </div>
    </div>
  );
};

const RewardsManager = ({ rewards, setRewards }: { rewards: Reward[], setRewards: (r: Reward[]) => void }) => {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(50);
  const [icon, setIcon] = useState('🎁');

  const add = () => {
    if (!title) return;
    const newReward: Reward = {
      id: Date.now().toString(),
      title,
      cost: Number(cost),
      icon,
      color: 'bg-white border-2 border-gray-100'
    };
    setRewards([...rewards, newReward]);
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-gray-500 uppercase">添加新奖励</h3>
        <input className="w-full border p-2 rounded-lg" placeholder="奖励名称" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="flex gap-2">
          <input className="w-24 border p-2 rounded-lg text-center" type="number" placeholder="花费" value={cost} onChange={e => setCost(Number(e.target.value))} />
          <input className="w-16 border p-2 rounded-lg text-center" value={icon} onChange={e => setIcon(e.target.value)} placeholder="Emoji" />
          <button onClick={add} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Plus size={16}/> 添加</button>
        </div>
      </div>

      <div className="space-y-2">
         {rewards.length === 0 && <p className="text-center text-gray-400 py-4">暂无奖励</p>}
         {rewards.map(r => (
           <div key={r.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <div className="font-bold">{r.title}</div>
                  <div className="text-xs text-gray-500">{r.cost} 积分</div>
                </div>
              </div>
              <button onClick={() => setRewards(rewards.filter(x => x.id !== r.id))} className="text-red-400 p-2"><Trash2 size={18} /></button>
           </div>
         ))}
      </div>
    </div>
  );
};

const BadgesManager = ({ badges, setBadges }: { badges: Badge[], setBadges: (b: Badge[]) => void }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('🏅');
  const [type, setType] = useState<BadgeCriteriaType>('TOTAL_TASKS');
  const [threshold, setThreshold] = useState(10);
  const [cat, setCat] = useState<TaskCategory>('learning');

  const add = () => {
    if (!title) return;
    const newBadge: Badge = {
      id: Date.now().toString(),
      title,
      description: desc,
      icon,
      color: 'bg-white border-2 border-gray-200',
      criteria: {
        type,
        threshold: Number(threshold),
        categoryId: type === 'CATEGORY_COUNT' ? cat : undefined
      }
    };
    setBadges([...badges, newBadge]);
    setTitle('');
    setDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-gray-500 uppercase">设计新勋章</h3>
        <input className="w-full border p-2 rounded-lg" placeholder="勋章名称" value={title} onChange={e => setTitle(e.target.value)} />
        <input className="w-full border p-2 rounded-lg" placeholder="描述 (例如: 完成100个任务)" value={desc} onChange={e => setDesc(e.target.value)} />
        
        <div className="flex gap-2 items-center">
           <span className="text-sm font-bold w-12">条件:</span>
           <select className="flex-1 border p-2 rounded-lg text-sm" value={type} onChange={e => setType(e.target.value as any)}>
            <option value="TOTAL_TASKS">累计任务总数</option>
            <option value="TOTAL_POINTS">累计积分总数</option>
            <option value="STREAK">连续打卡天数</option>
            <option value="CATEGORY_COUNT">特定分类任务数</option>
          </select>
        </div>

        {type === 'CATEGORY_COUNT' && (
           <div className="flex gap-2 items-center">
             <span className="text-sm font-bold w-12">分类:</span>
             <select className="flex-1 border p-2 rounded-lg" value={cat} onChange={e => setCat(e.target.value as any)}>
               <option value="learning">学习</option>
               <option value="health">健康</option>
               <option value="chores">家务</option>
               <option value="other">其他</option>
             </select>
           </div>
        )}

        <div className="flex gap-2 items-center">
           <span className="text-sm font-bold w-12">目标:</span>
           <input className="flex-1 border p-2 rounded-lg" type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
           <span className="text-sm font-bold">Icon:</span>
           <input className="w-16 border p-2 rounded-lg text-center" value={icon} onChange={e => setIcon(e.target.value)} />
        </div>
        
        <button onClick={add} className="w-full bg-purple-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"><Plus size={16}/> 创建勋章</button>
      </div>

      <div className="space-y-2">
         {badges.map(b => (
           <div key={b.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <div className="font-bold">{b.title}</div>
                  <div className="text-xs text-gray-500">{b.description}</div>
                </div>
              </div>
              <button onClick={() => setBadges(badges.filter(x => x.id !== b.id))} className="text-red-400 p-2"><Trash2 size={18} /></button>
           </div>
         ))}
      </div>
    </div>
  );
};

export default ParentMode;
