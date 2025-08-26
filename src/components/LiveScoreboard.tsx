
import React from 'react';
import useSWR from 'swr';
import type { FinalScore } from '../types';
import { TrophyIcon, CircuitIcon } from './Icons';

interface LiveScoreboardProps {
  onBackToLogin: () => void;
}

const LiveScoreboard: React.FC<LiveScoreboardProps> = ({ onBackToLogin }) => {
  const { data: finalScores = [], error } = useSWR<FinalScore[]>('/api/data?entity=finalScores', { refreshInterval: 5000 });

  const renderContent = () => {
    if (error) return <p className="text-center text-red-400">Failed to load scores. Retrying...</p>;
    if (!finalScores || finalScores.length === 0) {
      return (
          <div className="text-center text-gray-400 py-10">
              <CircuitIcon className="w-16 h-16 mx-auto text-cyber-500 animate-spin-slow mb-4"/>
              <p className="font-display text-xl">Awaiting Final Scores...</p>
              <p className="text-sm font-mono mt-2">// Ranks will appear here once teams are fully scored.</p>
          </div>
      );
    }

    return (
      <div className="space-y-3">
        {finalScores.map((s, idx) => {
          const rankStyles = [
            { bg: 'bg-yellow-400/10', shadow: 'shadow-glow-gold', text: 'text-yellow-300', border: 'border-yellow-400' },
            { bg: 'bg-gray-400/10', shadow: 'shadow-glow-silver', text: 'text-gray-300', border: 'border-gray-400' },
            { bg: 'bg-glow-pink/10', shadow: 'shadow-glow-bronze', text: 'text-glow-pink', border: 'border-glow-pink' },
          ];
          const style = idx < 3 ? rankStyles[idx] : {bg: 'bg-slate-800/80', shadow: '', text: 'text-cyber-300', border: 'border-slate-700'};

          return (
            <div key={s.teamId} className={`flex items-center p-4 rounded-lg shadow-md border transition-all ${style.bg} ${style.border} ${style.shadow} ${idx === 0 ? 'animate-pulse-strong' : ''}`}>
              <div className={`flex items-center justify-center w-12 h-12 rounded-full mr-4 ${idx < 3 ? `${style.bg} ${style.text}` : 'bg-slate-700 text-cyber-300'} font-bold text-xl`}>
                {idx < 3 ? <TrophyIcon className="w-8 h-8"/> : s.rank}
              </div>
              <div className="flex-grow">
                <p className="text-lg font-semibold text-gray-100">{s.teamName}</p>
              </div>
              <div className={`text-3xl font-bold font-display ${style.text}`}>{s.weightedScore.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent p-4">
      <div 
        className="w-full max-w-2xl p-6 md:p-8 space-y-6 bg-slate-900/70 backdrop-blur-sm rounded-lg shadow-glow relative"
        style={{clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)'}}
      >
        <div className="absolute inset-0 border-2 border-cyber-600/70 rounded-lg pointer-events-none" style={{clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)'}}></div>
        <div className="text-center">
            <TrophyIcon className="w-16 h-16 mx-auto text-cyber-400"/>
            <h1 className="mt-4 text-4xl font-bold text-gray-100 font-display">Live Scoreboard</h1>
            <p className="mt-2 text-sm text-gray-400">Scores are updated in real-time</p>
        </div>
        
        <div className="max-h-[50vh] overflow-y-auto pr-2">
            {renderContent()}
        </div>

        <div className="pt-4">
            <button
              onClick={onBackToLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-cyber-400 text-sm font-bold rounded-md text-cyber-300 bg-transparent hover:bg-cyber-400 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-cyber-500 transition-all duration-300"
            >
              Back to Login
            </button>
        </div>
      </div>
    </div>
  );
};

export default LiveScoreboard;
