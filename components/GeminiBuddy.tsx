import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import { getEncouragement, suggestActivity } from '../services/geminiService';

interface GeminiBuddyProps {
  points: number;
}

const GeminiBuddy: React.FC<GeminiBuddyProps> = ({ points }) => {
  const [message, setMessage] = useState<string>("你好呀！我是你的智能伙伴。今天想做点什么呢？🤖");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{title: string, description: string, icon: string} | null>(null);

  useEffect(() => {
    // Initial greeting based on points logic could go here, 
    // but we'll wait for user interaction to save API calls on mount.
  }, []);

  const handleEncourage = async () => {
    if (loading) return;
    setLoading(true);
    setSuggestion(null);
    const msg = await getEncouragement(points);
    setMessage(msg);
    setLoading(false);
  };

  const handleSuggest = async () => {
    if (loading) return;
    setLoading(true);
    const activity = await suggestActivity();
    setSuggestion(activity);
    setMessage(`怎么玩：${activity.description}`);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 items-center p-4 animate-fadeIn">
      
      {/* Character Visualization */}
      <div className="relative">
        <div className={`w-32 h-32 bg-gradient-to-tr from-kid-blue to-purple-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white ${loading ? 'animate-bounce' : 'animate-float'}`}>
           <span className="text-6xl">🤖</span>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-kid-yellow text-white p-2 rounded-full border-2 border-white">
            <Sparkles size={20} className={loading ? 'animate-spin' : ''} />
        </div>
      </div>

      {/* Chat Bubble */}
      <div className="bg-white p-6 rounded-3xl rounded-tr-none shadow-lg max-w-xs relative border-2 border-kid-blue/10">
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-white rotate-45 border-r-2 border-t-2 border-kid-blue/10"></div>
        
        {suggestion ? (
          <div className="text-center">
             <div className="text-4xl mb-2">{suggestion.icon}</div>
             <h3 className="font-bold text-kid-blue text-lg mb-1">{suggestion.title}</h3>
             <p className="text-gray-600">{message}</p>
          </div>
        ) : (
          <p className="text-gray-700 font-medium text-lg leading-relaxed text-center">
            {message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4 w-full mt-4">
        <button
          onClick={handleEncourage}
          disabled={loading}
          className="bg-kid-pink text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex flex-col items-center gap-2"
        >
          <Sparkles size={24} />
          <span>夸夸我</span>
        </button>
        <button
          onClick={handleSuggest}
          disabled={loading}
          className="bg-kid-green text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex flex-col items-center gap-2"
        >
          <Lightbulb size={24} />
          <span>新任务</span>
        </button>
      </div>
      
      {loading && (
        <p className="text-gray-400 text-sm animate-pulse">正在思考中...</p>
      )}
    </div>
  );
};

export default GeminiBuddy;
