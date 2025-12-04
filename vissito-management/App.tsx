import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';

// Simple view state management for the demo
type AppView = 'login' | 'dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('login');

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentView('login');
  };

  return (
    <div className="antialiased text-slate-900">
      {currentView === 'login' ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;