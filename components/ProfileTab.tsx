import React from 'react';
import { UserState, Badge } from '../types';
import { Award, Trophy } from 'lucide-react';

interface ProfileTabProps {
  user: UserState;
  badges: Badge[];
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, badges }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-purple-400 to-kid-blue opacity-20"></div>
        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-kid-yellow to-orange-400 rounded-full flex items-center justify-center text-5xl shadow-xl border-4 border-white mb-3">
             👶
          </div>
          <h2 className="text-2xl font-black text-gray-800">{user.name}</h2>
          <p className="text-gray-500 font-medium text-sm">小小成就大师</p>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-50 rounded-2xl p-3">
             <div className="text-kid-blue font-black text-2xl">{user.currentStreak}</div>
             <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">连续天数</div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3">
             <div className="text-kid-yellow font-black text-2xl">{user.stats.totalTasksCompleted}</div>
             <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">完成任务</div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
           <Trophy className="text-kid-yellow" size={24} />
           <h3 className="text-xl font-black text-gray-800">我的勋章墙</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => {
            const isUnlocked = user.unlockedBadges.includes(badge.id);
            return (
              <div 
                key={badge.id}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-2 ${
                  isUnlocked 
                    ? 'bg-white border-white shadow-md' 
                    : 'bg-gray-100 border-gray-100 opacity-60 grayscale'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-1 ${isUnlocked ? badge.color : 'bg-gray-200 text-gray-400'}`}>
                  {isUnlocked ? badge.icon : '🔒'}
                </div>
                <div>
                   <h4 className={`font-bold text-sm ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>{badge.title}</h4>
                   <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                </div>
                
                {isUnlocked && (
                  <div className="absolute top-2 right-2 text-yellow-500">
                    <Award size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
