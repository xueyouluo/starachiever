import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface CalendarTabProps {
  history: Record<string, number>;
}

const CalendarTab: React.FC<CalendarTabProps> = ({ history }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  
  // Adjust so Monday is first day of week (optional, but common in CN)
  // Let's stick to Sunday start for simplicity or Monday? 
  // Standard CN calendars often start on Sunday or Monday. Let's do Sunday start to match standard Date.getDay()
  const startingEmptyCells = firstDayOfMonth;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getDayContent = (day: number) => {
    const dateStr = formatDate(day);
    const count = history[dateStr] || 0;

    let className = "bg-white text-gray-600";
    let inlineStyle: React.CSSProperties = {};
    let icon = null;

    if (count > 0) {
      if (count >= 5) {
        className = "text-white shadow-md";
        inlineStyle = { background: 'linear-gradient(135deg, #FFA502, #FF6348)' };
        icon = <Star size={12} fill="currentColor" />;
      } else if (count >= 3) {
        className = "text-white";
        inlineStyle = { background: 'linear-gradient(135deg, #4BCFFA, #26DE81)' };
        icon = <Star size={10} fill="currentColor" className="opacity-70"/>;
      } else {
        className = "text-white";
        inlineStyle = { background: 'linear-gradient(135deg, #FF6B9D, #FF6348)', opacity: 0.85 };
      }
    }

    const isToday = dateStr === new Date().toISOString().split('T')[0];
    if (isToday) {
      className += " ring-2 ring-kid-coral ring-offset-1 font-bold";
    }

    return { className, inlineStyle, icon, count };
  };

  // Calculate stats for this month
  const totalTasksThisMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1).reduce((acc, day) => {
    return acc + (history[formatDate(day)] || 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Gradient Header */}
      <div className="rounded-3xl p-6 text-white relative overflow-hidden" style={{background: 'linear-gradient(135deg, #4BCFFA 0%, #26DE81 100%)', boxShadow: '0 8px 32px rgba(75,207,250,0.25)'}}>
        <div className="absolute top-0 right-0 w-28 h-28 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full translate-y-6 -translate-x-6"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-3xl mb-1">📅</div>
          <h2 className="text-xl font-black mb-1">打卡记录</h2>
          <div className="text-5xl font-black mb-1 flex items-baseline gap-2">
            {totalTasksThisMonth}
            <span className="text-xl font-bold text-white/70">次</span>
          </div>
          <p className="text-sm text-white/80 font-bold">本月累计打卡 · 每一天都在进步！</p>
        </div>
      </div>

      {/* Calendar Control */}
      <div className="flex items-center justify-between px-4">
        <button onClick={prevMonth} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-kid-coral transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-xl font-black text-gray-800">
          {year}年 {month + 1}月
        </h3>
        <button onClick={nextMonth} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-kid-coral transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl p-4 shadow-lg">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="text-xs font-bold text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingEmptyCells }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const { className, inlineStyle, icon, count } = getDayContent(day);

            return (
              <div key={day} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm border-2 border-transparent transition-all ${className}`} style={inlineStyle}>
                <span className="leading-none">{day}</span>
                {count > 0 && (
                  <div className="mt-1 flex items-center justify-center">
                    {icon || <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs text-gray-500 font-medium flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{background: 'linear-gradient(135deg, #FF6B9D, #FF6348)'}}></div>
          <span>打卡</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{background: 'linear-gradient(135deg, #4BCFFA, #26DE81)'}}></div>
          <span>表现棒 (3+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #FFA502, #FF6348)'}}>
            <Star size={7} className="text-white" fill="currentColor"/>
          </div>
          <span>超级棒 (5+)</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarTab;
