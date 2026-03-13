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
      <div className="bg-white p-4 pt-6 md:p-6 md:pt-8 rounded-b-3xl shadow-sm z-10 flex justify-between items-center sticky top-0" style={{boxShadow: '0 4px 20px rgba(255,99,72,0.10)'}}>
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-kid-coral tracking-tight">
            StarAchiever <span className="text-kid-amber">✨</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-bold">快乐打卡每一天</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-black text-lg md:text-2xl shadow-md flex items-center gap-2" style={{background: 'linear-gradient(135deg, #FF6348 0%, #FFA502 100%)'}}>
            <span className="text-lg md:text-2xl">⭐️</span>
            <span>{points}</span>
          </div>
          <button
            onClick={onOpenParentMode}
            className="p-2 md:p-3 text-gray-300 hover:text-kid-coral transition-colors"
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

      {/* Bottom Navigation — 胶囊/药丸风格 */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-[#FFE0D6] p-2 pb-6 px-4 md:p-3 md:pb-8 md:px-6 flex justify-between items-center z-20 rounded-t-3xl shadow-[0_-5px_20px_rgba(255,99,72,0.08)]">
        <NavButton
          isActive={activeTab === Tab.TASKS}
          onClick={() => onTabChange(Tab.TASKS)}
          icon={<CheckCircle size={22} />}
          label="任务"
          inactiveColor="text-kid-coral"
        />
        <NavButton
          isActive={activeTab === Tab.CALENDAR}
          onClick={() => onTabChange(Tab.CALENDAR)}
          icon={<CalendarDays size={22} />}
          label="日历"
          inactiveColor="text-kid-sky"
        />
        <NavButton
          isActive={activeTab === Tab.REWARDS}
          onClick={() => onTabChange(Tab.REWARDS)}
          icon={<Gift size={22} />}
          label="奖励"
          inactiveColor="text-kid-lime"
        />
        <NavButton
          isActive={activeTab === Tab.PROFILE}
          onClick={() => onTabChange(Tab.PROFILE)}
          icon={<User size={22} />}
          label="我的"
          inactiveColor="text-kid-purple"
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
  inactiveColor: string;
}> = ({ isActive, onClick, icon, label, inactiveColor }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? '' : 'opacity-60 hover:opacity-100'}`}
  >
    <div
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300 ${
        isActive ? 'text-white shadow-md' : inactiveColor
      }`}
      style={isActive ? {background: 'linear-gradient(135deg, #FF6348 0%, #FFA502 100%)'} : {}}
    >
      {icon}
      {isActive && (
        <span className="text-xs font-bold whitespace-nowrap">{label}</span>
      )}
    </div>
    {!isActive && (
      <span className="text-[10px] md:text-xs font-bold text-gray-400">{label}</span>
    )}
  </button>
);

export default Layout;
