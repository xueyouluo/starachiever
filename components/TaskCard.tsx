import React from 'react';
import { Task } from '../types';
import { Check } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 md:p-5 mb-4 transition-all duration-500 transform ${
        task.completed
          ? 'bg-gray-100 opacity-80 scale-95 border-2 border-gray-200'
          : 'bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 border-b-4 border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-sm ${task.color}`}>
            {task.icon}
          </div>
          <div>
            <h3 className={`text-lg md:text-xl font-bold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-kid-yellow text-sm md:text-base">⭐️</span>
              <span className="text-gray-500 text-sm md:text-base font-bold">+{task.points} 积分</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => !task.completed && onComplete(task.id)}
          disabled={task.completed}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            task.completed
              ? 'bg-green-500 text-white cursor-default'
              : 'bg-gray-100 text-gray-300 hover:bg-kid-blue hover:text-white active:scale-90'
          }`}
        >
          {task.completed ? <Check size={24} strokeWidth={4} /> : <div className="w-4 h-4 rounded-full border-4 border-current" />}
        </button>
      </div>

      {/* Celebration overlay logic could go here, but kept simple for now */}
      {task.completed && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-green-500/10">
          <span className="text-green-600 font-bold transform -rotate-12 border-2 border-green-600 px-2 py-1 rounded-lg text-sm md:text-base bg-white/80">
            已完成!
          </span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
