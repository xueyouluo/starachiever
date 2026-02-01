import React from 'react';
import { Reward } from '../types';
import { Lock } from 'lucide-react';

interface RewardCardProps {
  reward: Reward;
  canAfford: boolean;
  onRedeem: (reward: Reward) => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, canAfford, onRedeem }) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border-b-4 border-gray-100 flex flex-col justify-between h-full relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-2 bg-kid-yellow text-white text-xs font-bold rounded-bl-xl z-10`}>
        {reward.cost} ⭐️
      </div>

      <div className="flex flex-col items-center text-center pt-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-5xl mb-3 transition-transform group-hover:scale-110 ${reward.color}`}>
          {reward.icon}
        </div>
        <h3 className="font-bold text-gray-800 leading-tight mb-1">{reward.title}</h3>
      </div>

      <button
        onClick={() => canAfford && onRedeem(reward)}
        disabled={!canAfford}
        className={`w-full mt-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          canAfford
            ? 'bg-kid-blue text-white shadow-lg hover:bg-indigo-600 active:translate-y-1'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {!canAfford && <Lock size={14} />}
        {canAfford ? '兑换' : '积分不足'}
      </button>
    </div>
  );
};

export default RewardCard;
