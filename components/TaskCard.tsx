import React from 'react';
import { Task } from '../types';
import { Check } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

// 从 Tailwind bg 类中提取边框颜色
const getBorderColor = (colorClass: string): string => {
  const match = colorClass.match(/bg-(\w+)-\d+/);
  if (!match) return '#FF6348';
  const colorMap: Record<string, string> = {
    blue: '#3B82F6',
    green: '#22C55E',
    purple: '#A855F7',
    yellow: '#EAB308',
    pink: '#EC4899',
    red: '#EF4444',
    orange: '#F97316',
    teal: '#14B8A6',
    indigo: '#6366F1',
    cyan: '#06B6D4',
    lime: '#84CC16',
    amber: '#F59E0B',
    gray: '#9CA3AF',
  };
  return colorMap[match[1]] || '#FF6348';
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  const borderColor = getBorderColor(task.color);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 md:p-5 mb-4 transition-all duration-500 transform bg-white ${
        task.completed
          ? 'opacity-75 scale-[0.98]'
          : 'hover:shadow-lg hover:-translate-y-0.5'
      }`}
      style={{
        borderLeft: `4px solid ${task.completed ? '#D1D5DB' : borderColor}`,
        boxShadow: task.completed ? 'none' : '0 4px 20px rgba(255,99,72,0.08)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-sm ${task.completed ? 'grayscale opacity-60' : task.color}`}>
            {task.icon}
          </div>
          <div>
            <h3 className={`text-lg md:text-xl font-bold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{background: task.completed ? '#D1D5DB' : 'linear-gradient(135deg, #FF6348, #FFA502)'}}>
                +{task.points} 积分
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => !task.completed && onComplete(task.id)}
          disabled={task.completed}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            task.completed
              ? 'text-white cursor-default'
              : 'bg-gray-100 text-gray-300 hover:text-white active:scale-90'
          }`}
          style={task.completed ? {background: 'linear-gradient(135deg, #26DE81, #4BCFFA)'} : {}}
          onMouseEnter={e => {
            if (!task.completed) {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #26DE81, #4BCFFA)';
            }
          }}
          onMouseLeave={e => {
            if (!task.completed) {
              (e.currentTarget as HTMLButtonElement).style.background = '';
            }
          }}
        >
          {task.completed ? <Check size={24} strokeWidth={4} /> : <div className="w-4 h-4 rounded-full border-4 border-current" />}
        </button>
      </div>

      {task.completed && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-gray-50/40">
          <span className="text-white font-bold transform -rotate-12 px-3 py-1 rounded-xl text-sm md:text-base" style={{background: 'linear-gradient(135deg, #26DE81, #4BCFFA)'}}>
            已完成!
          </span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
