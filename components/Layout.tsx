import React from 'react';
import { Tab } from '../types';
import { CheckCircle, Gift, User, Settings, CalendarDays } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  points: number;
  onOpenParentMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, points, onOpenParentMode }) => {
  return (
    <div className="min-h-screen bg-kid-bg max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="bg-white p-4 pt-6 rounded-b-3xl shadow-sm z-10 flex justify-between items-center sticky top-0">
        <div>
          <h1 className="text-2xl font-black text-kid-blue tracking-tight">
            StarAchiever <span className="text-kid-yellow">✨</span>
          </h1>
          <p className="text-gray-500 text-xs font-bold">快乐打卡每一天</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-kid-yellow text-white px-4 py-2 rounded-full font-black text-lg shadow-md flex items-center gap-2">
            <span>⭐️</span>
            <span>{points}</span>
          </div>
          <button 
            onClick={onOpenParentMode}
            className="p-2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
       
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-28">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-2 pb-6 px-2 flex justify-between items-center z-20 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <NavButton 
          isActive={activeTab === Tab.TASKS} 
          onClick={() => onTabChange(Tab.TASKS)}
          icon={<CheckCircle size={24} />}
          label="任务"
          color="text-kid-blue"
        />
        <NavButton 
          isActive={activeTab === Tab.CALENDAR} 
          onClick={() => onTabChange(Tab.CALENDAR)}
          icon={<CalendarDays size={24} />}
          label="日历"
          color="text-orange-400"
        />
        <NavButton 
          isActive={activeTab === Tab.REWARDS} 
          onClick={() => onTabChange(Tab.REWARDS)}
          icon={<Gift size={24} />}
          label="奖励"
          color="text-kid-green"
        />
         <NavButton 
          isActive={activeTab === Tab.PROFILE} 
          onClick={() => onTabChange(Tab.PROFILE)}
          icon={<User size={24} />}
          label="我的"
          color="text-purple-500"
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ 
  isActive: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  color: string;
}> = ({ isActive, onClick, icon, label, color }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${isActive ? '-translate-y-2' : 'opacity-60 hover:opacity-100'}`}
  >
    <div className={`p-3 rounded-full ${isActive ? 'bg-gray-100 shadow-inner' : ''} ${color}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
      {label}
    </span>
  </button>
);

export default Layout;
