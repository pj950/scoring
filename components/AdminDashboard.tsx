import React, { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import type { Team, Judge, Criterion, Score, FinalScore } from '../types';
import { LogoutIcon, UsersIcon, ClipboardListIcon, ChartBarIcon, TrashIcon, TrophyIcon, SparklesIcon } from './Icons';
import { utils, writeFile } from 'xlsx';

type AdminTab = 'teams' | 'judges' | 'criteria' | 'progress';

const HudCard: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`relative bg-slate-800/80 p-3 transition-all duration-300 group ${className}`} style={{clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)'}}>
        <div className="absolute inset-0 bg-cyber-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)'}}></div>
        <div className="relative">
            {children}
        </div>
    </div>
);

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  
  const { data: teams = [] } = useSWR<Team[]>('/api/data?entity=teams');
  const { data: judges = [] } = useSWR<Judge[]>('/api/data?entity=judges');
  const { data: criteria = [] } = useSWR<Criterion[]>('/api/data?entity=criteria');
  const { data: scores = [] } = useSWR<Score[]>('/api/data?entity=scores');
  const { data: activeTeamId } = useSWR<string | null>('/api/data?entity=activeTeamId');
  const { data: finalScores = [] } = useSWR<FinalScore[]>('/api/data?entity=finalScores', { refreshInterval: 5000 });

  const [newItemName, setNewItemName] = useState('');
  const [newCriterion, setNewCriterion] = useState({ name: '', description: '', weight: 0 });

  const mutateAll = () => {
      mutate('/api/data?entity=teams');
      mutate('/api/data?entity=judges');
      mutate('/api/data?entity=criteria');
      mutate('/api/data?entity=scores');
      mutate('/api/data?entity=activeTeamId');
      mutate('/api/data?entity=finalScores');
  }

  const handleAddItem = async (entity: 'teams' | 'judges') => {
    if (newItemName.trim()) {
      await fetch(`/api/data?entity=${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName.trim() }),
      });
      setNewItemName('');
      mutateAll();
    }
  };

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCriterion.name.trim() && newCriterion.weight > 0) {
      await fetch('/api/data?entity=criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCriterion),
      });
      setNewCriterion({ name: '', description: '', weight: 0 });
      mutateAll();
    }
  };

  const handleDeleteItem = async (entity: 'teams' | 'judges' | 'criteria', id: string) => {
    if(confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        await fetch(`/api/data?entity=${entity}&id=${id}`, { method: 'DELETE' });
        mutateAll();
    }
  }

  const totalWeight = useMemo(() => criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0), [criteria]);

  const activateTeam = async (id: string) => {
    await fetch('/api/data?entity=activeTeamId', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });
    mutateAll();
  };
  
  const exportToExcel = () => {
    const ws_data = finalScores.map(s => ({
        Rank: s.rank,
        Team: s.teamName,
        'Final Score': s.weightedScore,
    }));
    const ws = utils.json_to_sheet(ws_data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Hackathon Results');
    writeFile(wb, 'Hackathon_Results.xlsx');
  };


  const renderTeams = () => (
    <div>
        <form onSubmit={(e) => { e.preventDefault(); handleAddItem('teams'); }} className="flex gap-2 mb-4">
            <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="New team name" className="flex-grow p-2 border rounded bg-slate-800 border-slate-600 focus:border-cyber-400 focus:ring-cyber-400 focus:outline-none"/>
            <button type="submit" className="px-4 py-2 bg-cyber-600 text-white rounded hover:bg-cyber-500 transition-colors">Add Team</button>
        </form>
        <div className="space-y-3">
            {teams.map(team => (
                <HudCard key={team.id}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{team.name}</span>
                      <div className="flex items-center gap-2">
                           <button onClick={() => activateTeam(team.id)} disabled={activeTeamId === team.id} className={`px-3 py-1 text-sm rounded transition-colors ${activeTeamId === team.id ? 'bg-green-500 text-white cursor-default' : 'bg-cyber-500 text-white hover:bg-cyber-400'}`}>
                              {activeTeamId === team.id ? 'Active' : 'Activate'}
                           </button>
                           <button onClick={() => handleDeleteItem('teams', team.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                    </div>
                </HudCard>
            ))}
        </div>
    </div>
  );

  const renderJudges = () => (
    <div>
        <form onSubmit={(e) => { e.preventDefault(); handleAddItem('judges'); }} className="flex gap-2 mb-4">
            <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="New judge name" className="flex-grow p-2 border rounded bg-slate-800 border-slate-600 focus:border-cyber-400 focus:ring-cyber-400 focus:outline-none"/>
            <button type="submit" className="px-4 py-2 bg-cyber-600 text-white rounded hover:bg-cyber-500 transition-colors">Add Judge</button>
        </form>
        <div className="space-y-3">
            {judges.map(judge => (
                <HudCard key={judge.id}>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium">{judge.name}</span>
                            <p className="text-sm text-gray-400">Login Code: <code className="bg-slate-700 text-cyber-300 px-2 py-1 rounded font-mono">{judge.loginCode}</code></p>
                        </div>
                         <button onClick={() => handleDeleteItem('judges', judge.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                </HudCard>
            ))}
        </div>
    </div>
  );

  const renderCriteria = () => (
    <div>
        <form onSubmit={handleAddCriterion} className="p-4 mb-4 space-y-3 border rounded-lg bg-slate-800 border-slate-700">
            <h3 className="text-lg font-semibold font-display">Add New Criterion</h3>
            <input value={newCriterion.name} onChange={e => setNewCriterion({...newCriterion, name: e.target.value})} placeholder="Criterion Name (e.g., Innovation)" className="w-full p-2 border rounded bg-slate-900 border-slate-600 focus:border-cyber-400 focus:ring-cyber-400 focus:outline-none"/>
            <textarea value={newCriterion.description} onChange={e => setNewCriterion({...newCriterion, description: e.target.value})} placeholder="Description" className="w-full p-2 border rounded bg-slate-900 border-slate-600 h-20 focus:border-cyber-400 focus:ring-cyber-400 focus:outline-none"></textarea>
            <input type="number" value={newCriterion.weight} onChange={e => setNewCriterion({...newCriterion, weight: parseInt(e.target.value, 10) || 0})} placeholder="Weight (%)" className="w-full p-2 border rounded bg-slate-900 border-slate-600 focus:border-cyber-400 focus:ring-cyber-400 focus:outline-none"/>
            <button type="submit" className="w-full px-4 py-2 bg-cyber-600 text-white rounded hover:bg-cyber-500 transition-colors">Add Criterion</button>
        </form>
         <div className="flex justify-between items-center mb-2 p-3 bg-slate-800 rounded font-bold">
            <span className="font-display">Total Weight</span>
            <span className={totalWeight !== 100 ? 'text-red-400' : 'text-green-400'}>{totalWeight}%</span>
        </div>
        <div className="space-y-2">
            {criteria.map(c => (
                <HudCard key={c.id}>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium">{c.name} ({c.weight}%)</span>
                            <p className="text-sm text-gray-400">{c.description}</p>
                        </div>
                        <button onClick={() => handleDeleteItem('criteria', c.id)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                </HudCard>
            ))}
        </div>
    </div>
  );
  
  const renderProgress = () => (
    <div className="space-y-8">
        <div>
            <h3 className="text-xl font-bold mb-3 font-display">Scoring Progress Matrix</h3>
            <div className="overflow-x-auto bg-slate-800/80 rounded-lg shadow-lg border border-slate-700">
                 <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Team</th>
                            {judges.map(j => <th key={j.id} scope="col" className="px-6 py-3 text-center">{j.name}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map(t => (
                            <tr key={t.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-100 whitespace-nowrap">{t.name}</th>
                                {judges.map(j => {
                                    const hasScored = scores.some(s => s.teamId === t.id && s.judgeId === j.id);
                                    return (
                                        <td key={j.id} className="px-6 py-4 text-center">
                                            <div className={`w-3 h-3 rounded-full mx-auto ${hasScored ? 'bg-green-500 animate-pulse-indicator-green' : 'bg-red-500 animate-pulse-indicator-red'}`} />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold font-display">Leaderboard</h3>
                <button onClick={exportToExcel} disabled={!finalScores.length} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">Export to Excel</button>
            </div>
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
                {!finalScores.length && <p className="text-center text-gray-500 py-4">Awaiting data... Ranks appear once all judges have scored a team.</p>}
            </div>
        </div>
    </div>
  );
  
  const TABS = [
      { id: 'teams', label: 'Teams', icon: UsersIcon },
      { id: 'judges', label: 'Judges', icon: UsersIcon },
      { id: 'criteria', label: 'Criteria', icon: ClipboardListIcon },
      { id: 'progress', label: 'Progress & Results', icon: ChartBarIcon }
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-cyber-400"/>
            <h1 className="text-2xl font-bold text-gray-100 font-display">Admin Dashboard</h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 rounded transition-colors">
          <LogoutIcon className="w-5 h-5"/> Logout
        </button>
      </header>
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 border-b border-slate-700">
             <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as AdminTab)}
                           className={`${activeTab === tab.id ? 'border-cyber-400 text-cyber-400' : 'border-transparent text-gray-400 hover:text-cyber-500 hover:border-gray-500'}
                           flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                        >
                           <Icon className="w-5 h-5" />
                           {tab.label}
                        </button>
                    )
                })}
            </nav>
          </div>
          <div className="p-1">
              {activeTab === 'teams' && renderTeams()}
              {activeTab === 'judges' && renderJudges()}
              {activeTab === 'criteria' && renderCriteria()}
              {activeTab === 'progress' && renderProgress()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;