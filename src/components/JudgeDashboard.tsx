

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import type { Judge, Team, Criterion, Score } from '../types';
import { LogoutIcon, SparklesIcon, CheckCircleIcon } from './Icons';

interface JudgeDashboardProps {
  judge: Judge;
  onLogout: () => void;
}

const ScoringModal: React.FC<{
  team: Team;
  criteria: Criterion[];
  judgeId: string;
  onClose: () => void;
  onSubmit: () => void;
}> = ({ team, criteria, judgeId, onClose, onSubmit }) => {
  const { data: judgeScores } = useSWR<Score>(`/api/data?entity=scores&judgeId=${judgeId}&teamId=${team.id}`);
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (judgeScores?.scores) {
      setScores(judgeScores.scores);
    } else {
      // Pre-fill scores with 0 if there are no existing scores
      const initialScores: Record<string, number> = {};
      criteria.forEach(c => {
        initialScores[c.id] = 0;
      });
      setScores(initialScores);
    }
  }, [judgeScores, criteria]);

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores(prev => ({ ...prev, [criterionId]: value }));
  };
  
  const handleSubmit = async () => {
    const newScore: Score = {
        teamId: team.id,
        judgeId: judgeId,
        scores: scores,
    };
    await fetch('/api/data?entity=scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScore),
    });
    onSubmit();
    onClose();
  };

  const isFormComplete = criteria.every(c => scores[c.id] !== undefined && scores[c.id] >= 0);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 min-h-screen flex items-center justify-center p-4">
      <div 
        className="bg-slate-800/80 border border-cyber-700 shadow-lg w-full max-w-lg flex flex-col max-h-screen overflow-y-auto relative"
        style={{clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)'}}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-100 font-display">Scoring: {team.name}</h2>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pl-6 pr-8 pt-2 pb-6 space-y-6 flex-1 h-0">
          {criteria.map(c => (
            <div key={c.id}>
              <label className="block text-sm font-medium text-gray-300">
                <p className="font-semibold">{c.name} (out of {c.max_score})</p>
              </label>
              <div className="flex items-center gap-4 mt-2">
                <input
                    type="range"
                    min="0"
                    max={c.max_score}
                    step="1"
                    value={scores[c.id] || 0}
                    onChange={e => handleScoreChange(c.id, parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyber-400"
                />
                <span key={`${c.id}-${scores[c.id] || 0}`} className="font-bold font-display text-2xl text-cyber-300 w-16 text-center animate-pop-in">{scores[c.id] || 0}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Modal Footer */}
        <div className="flex justify-end gap-4 p-6 pt-4 flex-shrink-0 border-t border-slate-700/50">
          <button onClick={onClose} className="px-4 py-2 bg-slate-600 text-gray-200 rounded hover:bg-slate-500 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={!isFormComplete} className="px-4 py-2 bg-cyber-600 text-white rounded hover:bg-cyber-500 disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">Submit Score</button>
        </div>
      </div>
    </div>
  );
};

const JudgeDashboard: React.FC<JudgeDashboardProps> = ({ judge, onLogout }) => {
  const { data: teams = [] } = useSWR<Team[]>('/api/data?entity=teams', { refreshInterval: 5000 });
  const { data: criteria = [] } = useSWR<Criterion[]>('/api/data?entity=criteria');
  const { data: scores = [] } = useSWR<Score[]>(`/api/data?entity=scores&judgeId=${judge.id}`, { refreshInterval: 2000 });
  const { data: activeTeamId } = useSWR<string | null>('/api/data?entity=activeTeamId', { refreshInterval: 2000 });
  
  const [scoringTeam, setScoringTeam] = useState<Team | null>(null);

  const hasScoredTeam = (teamId: string) => {
      return scores.some(s => s.teamId === teamId);
  }
  
  const refreshAllScores = () => {
    mutate(`/api/data?entity=scores&judgeId=${judge.id}`);
  }

  return (
    <div>
      <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-cyber-400"/>
          <div>
            <h1 className="text-xl font-bold text-gray-100 font-display">Judge Dashboard</h1>
            <p className="text-sm text-gray-400">Welcome, {judge.name}!</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 rounded transition-colors">
          <LogoutIcon className="w-5 h-5"/> Logout
        </button>
      </header>
      <main className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 font-display">Teams to Score</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => {
              const isActive = team.id === activeTeamId;
              const hasScored = hasScoredTeam(team.id);
              return (
                <div key={team.id}
                     className={`relative p-5 flex flex-col justify-between transition-all duration-300
                       ${isActive 
                         ? 'bg-slate-800' 
                         : 'bg-slate-900 opacity-60'}`
                     }
                     style={{clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)'}}>
                  
                  {isActive && <div className="absolute inset-0 border-2 border-cyber-400 animate-trace-border pointer-events-none" style={{clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)'}}></div>}

                  <div className="relative z-10">
                    <h3 className={`font-bold text-lg ${isActive ? 'text-gray-100' : 'text-gray-500'}`}>{team.name}</h3>
                    {hasScored && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-400">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>Scored</span>
                        </div>
                    )}
                  </div>
                  <button onClick={() => setScoringTeam(team)} disabled={!isActive}
                          className={`relative z-10 mt-4 w-full py-2 px-4 text-sm font-semibold rounded-md transition-colors
                            ${isActive ? 'bg-cyber-600 text-white hover:bg-cyber-500' : 'bg-slate-700 text-gray-500 cursor-not-allowed'}`}>
                    {hasScored ? "Edit Score" : "Score Now"}
                  </button>
                </div>
              );
            })}
          </div>
          {!teams.length && <p className="text-center text-gray-500 py-10 font-mono">No teams assigned yet...</p>}
        </div>
      </main>

      {scoringTeam && (
        <ScoringModal 
            team={scoringTeam}
            criteria={criteria}
            judgeId={judge.id}
            onClose={() => setScoringTeam(null)}
            onSubmit={refreshAllScores}
        />
      )}
    </div>
  );
};

export default JudgeDashboard;
