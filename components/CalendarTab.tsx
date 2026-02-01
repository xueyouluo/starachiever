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
    
    let style = "bg-white text-gray-700";
    let icon = null;

    if (count > 0) {
      if (count >= 5) {
        style = "bg-yellow-400 text-white shadow-md border-yellow-500";
        icon = <Star size={12} fill="currentColor" />;
      } else if (count >= 3) {
        style = "bg-yellow-200 text-yellow-800 border-yellow-300";
        icon = <Star size={10} fill="currentColor" className="opacity-50"/>;
      } else {
        style = "bg-blue-100 text-blue-600 border-blue-200";
      }
    }

    const isToday = dateStr === new Date().toISOString().split('T')[0];
    if (isToday) {
      style += " ring-2 ring-kid-blue ring-offset-1 font-bold";
    }

    return { style, icon, count };
  };

  // Calculate stats for this month
  const totalTasksThisMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1).reduce((acc, day) => {
    return acc + (history[formatDate(day)] || 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 translate-y-10 -translate-x-10"></div>
        
        <div className="relative z-10 flex flex-col items-center">
           <h2 className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">本月累计打卡</h2>
           <div className="text-5xl font-black text-kid-blue mb-2 flex items-baseline gap-2">
             {totalTasksThisMonth}
             <span className="text-lg text-gray-400 font-bold">次</span>
           </div>
           <p className="text-xs text-gray-400">每一天都在进步！</p>
        </div>
      </div>

      {/* Calendar Control */}
      <div className="flex items-center justify-between px-4">
        <button onClick={prevMonth} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-kid-blue">
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-xl font-black text-gray-800">
          {year}年 {month + 1}月
        </h3>
        <button onClick={nextMonth} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-kid-blue">
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
            const { style, icon, count } = getDayContent(day);
            
            return (
              <div key={day} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm border-2 border-transparent transition-all ${style}`}>
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
      <div className="flex justify-center gap-6 text-xs text-gray-500 font-medium">
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200"></div>
           <span>完成任务</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500 flex items-center justify-center">
             <Star size={8} className="text-white" fill="currentColor"/>
           </div>
           <span>表现超棒 (5+)</span>
         </div>
      </div>
    </div>
  );
};

export default CalendarTab;
