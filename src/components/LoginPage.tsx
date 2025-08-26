// Fix: Add triple-slash directive to include Vite client types for `import.meta.env`.
/// <reference types="vite/client" />

import React, { useState } from 'react';
import { CircuitIcon } from './Icons';

// The hint now uses the environment variable, ensuring it matches what the backend expects.
const ADMIN_LOGIN_CODE = import.meta.env.VITE_ADMIN_LOGIN_CODE || 'ADMIN-2024'; 


interface LoginPageProps {
  onLogin: (loginCode: string) => Promise<boolean>;
  onShowLeaderboard: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onShowLeaderboard }) => {
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!loginCode) {
      setError('Please enter a login code.');
      setLoading(false);
      return;
    }
    
    const success = await onLogin(loginCode.trim());
    if (!success) {
      setError('Invalid login code. Access denied.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent p-4">
      <div 
        className="w-full max-w-md p-8 space-y-8 bg-slate-900/60 backdrop-blur-sm rounded-lg shadow-glow relative"
        style={{clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)'}}
      >
        <div className="absolute inset-0 border-2 border-cyber-600/70 rounded-lg pointer-events-none" style={{clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)'}}></div>
        <div className="text-center">
            <CircuitIcon className="w-20 h-20 mx-auto text-cyber-400 animate-spin-slow"/>
          <h1 className="mt-4 text-4xl font-bold text-gray-100 font-display">
            AI Scoring Matrix
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Awaiting Authentication...
          </p>
          <p className="mt-2 text-xs text-cyber-600 font-mono">// Access Code Hint: '{ADMIN_LOGIN_CODE}'</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
              <label htmlFor="login-code" className="sr-only">
                Login Code
              </label>
              <input
                id="login-code"
                name="loginCode"
                type="text"
                autoComplete="off"
                required
                className="appearance-none rounded-md relative block w-full px-4 py-3 bg-slate-800 border border-slate-600 placeholder-slate-400 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyber-400 focus:border-cyber-400 focus:z-10 sm:text-sm transition-all"
                placeholder="Enter Access Code"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                disabled={loading}
              />
          </div>

          {error && <p className="text-sm text-red-400 text-center font-mono">{error}</p>}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-slate-950 bg-cyber-400 hover:bg-cyber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-cyber-500 transition-all duration-300 shadow-glow hover:shadow-glow-lg transform hover:scale-105 disabled:bg-slate-600 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Authorizing...' : 'Authorize'}
            </button>
            <button
              type="button"
              onClick={onShowLeaderboard}
              className="group relative w-full flex justify-center py-3 px-4 border border-cyber-400 text-sm font-bold rounded-md text-cyber-300 bg-transparent hover:bg-cyber-400 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-cyber-500 transition-all duration-300"
            >
              Access Public Leaderboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;