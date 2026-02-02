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
    <div className="min-h-screen bg-kid-bg max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto relative shadow-2xl overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="bg-white p-4 pt-6 md:p-6 md:pt-8 rounded-b-3xl shadow-sm z-10 flex justify-between items-center sticky top-0">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-kid-blue tracking-tight">
            StarAchiever <span className="text-kid-yellow">✨</span>
          </h1>
          <p className="text-gray-500 text-xs md:text-sm font-bold">快乐打卡每一天</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-kid-yellow text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-black text-lg md:text-2xl shadow-md flex items-center gap-2">
            <span className="text-lg md:text-2xl">⭐️</span>
            <span>{points}</span>
          </div>
          <button
            onClick={onOpenParentMode}
            className="p-2 md:p-3 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <Settings size={20} className="md:hidden" />
            <Settings size={28} className="hidden md:block" />
          </button>
        </div>

      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-32">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-2 pb-6 px-2 md:p-3 md:pb-8 md:px-3 flex justify-between items-center z-20 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
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
    className={`flex flex-col items-center gap-1 w-16 md:w-20 transition-all duration-300 ${isActive ? '-translate-y-2' : 'opacity-60 hover:opacity-100'}`}
  >
    <div className={`p-3 md:p-4 rounded-full ${isActive ? 'bg-gray-100 shadow-inner' : ''} ${color}`}>
      {icon}
    </div>
    <span className={`text-[10px] md:text-xs font-bold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
      {label}
    </span>
  </button>
);

export default Layout;
