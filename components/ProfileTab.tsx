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
      <div className="rounded-3xl p-6 text-center relative overflow-hidden text-white" style={{background: 'linear-gradient(135deg, #FF6B9D 0%, #FF6348 100%)', boxShadow: '0 8px 32px rgba(255,99,72,0.25)'}}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-6 -translate-x-6"></div>
        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-5xl shadow-xl border-4 border-white/40 mb-3">
             👶
          </div>
          <h2 className="text-2xl font-black">{user.name}</h2>
          <p className="text-white/80 font-medium text-sm mt-1">小小成就大师 🌟</p>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
             <div className="text-white font-black text-2xl">{user.currentStreak}</div>
             <div className="text-xs text-white/70 font-bold mt-0.5">连续天数</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
             <div className="text-white font-black text-2xl">{user.stats.totalTasksCompleted}</div>
             <div className="text-xs text-white/70 font-bold mt-0.5">完成任务</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
             <div className="text-white font-black text-2xl">{user.totalPoints}</div>
             <div className="text-xs text-white/70 font-bold mt-0.5">累计积分</div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
           <Trophy className="text-kid-amber" size={24} />
           <h3 className="text-xl font-black text-gray-800">我的勋章墙</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => {
            const isUnlocked = user.unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`relative p-4 rounded-2xl transition-all duration-300 flex flex-col items-center text-center gap-2 ${
                  isUnlocked
                    ? 'bg-white opacity-100'
                    : 'bg-gray-100 opacity-60 grayscale'
                }`}
                style={isUnlocked ? {borderLeft: '3px solid #FF6348', boxShadow: '0 4px 16px rgba(255,99,72,0.10)'} : {}}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-1 ${isUnlocked ? badge.color : 'bg-gray-200 text-gray-400'}`}>
                  {isUnlocked ? badge.icon : '🔒'}
                </div>
                <div>
                   <h4 className={`font-bold text-sm ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>{badge.title}</h4>
                   <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                </div>

                {isUnlocked && (
                  <div className="absolute top-2 right-2 text-kid-amber">
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
