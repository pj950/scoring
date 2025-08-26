import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import JudgeDashboard from './components/JudgeDashboard';
import LiveScoreboard from './components/LiveScoreboard';
import type { Judge } from './types';
import { SWRConfig } from 'swr';

type UserRole = 'ADMIN' | 'JUDGE' | null;
type PublicPage = 'LOGIN' | 'LEADERBOARD';

// This should be set in an environment variable, but for this example, we'll define it here.
// In Vercel, this would be process.env.VITE_ADMIN_LOGIN_CODE
const ADMIN_LOGIN_CODE = 'ADMIN-2024'; 

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<Judge | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicPage, setPublicPage] = useState<PublicPage>('LOGIN');

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
        setCurrentUser(data.user);
      } else {
        setUserRole(null);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Session check failed", error);
      setUserRole(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLogin = async (loginCode: string): Promise<boolean> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginCode, adminCode: ADMIN_LOGIN_CODE }),
    });

    if (res.ok) {
      await checkSession(); // Re-check session to get user details
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserRole(null);
    setCurrentUser(null);
    setPublicPage('LOGIN'); // Reset to login page on logout
  };

  const renderContent = () => {
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-cyber-400 font-display text-2xl">Initializing System...</div>;
    }

    // User is logged in
    if (userRole) {
        switch (userRole) {
            case 'ADMIN':
                return <AdminDashboard onLogout={handleLogout} />;
            case 'JUDGE':
                return currentUser ? <JudgeDashboard judge={currentUser} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} onShowLeaderboard={() => setPublicPage('LEADERBOARD')} />;
            default:
                 return <LoginPage onLogin={handleLogin} onShowLeaderboard={() => setPublicPage('LEADERBOARD')} />;
        }
    }
    
    // User is not logged in, show public pages
    switch (publicPage) {
        case 'LEADERBOARD':
            return <LiveScoreboard onBackToLogin={() => setPublicPage('LOGIN')} />;
        case 'LOGIN':
        default:
            return <LoginPage onLogin={handleLogin} onShowLeaderboard={() => setPublicPage('LEADERBOARD')} />;
    }
  };

  return (
    <SWRConfig value={{ fetcher }}>
        <div className="min-h-screen bg-transparent text-gray-200 font-sans">
          <div key={`${userRole}-${publicPage}`} className="opacity-0 animate-fade-in-up">
            {renderContent()}
          </div>
        </div>
    </SWRConfig>
  );
};

export default App;