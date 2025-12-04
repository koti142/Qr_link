import React from 'react';
import { Logo } from './Logo';
import { Button } from './Button';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm text-slate-600">
            Welcome, User
          </div>
          <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
            U
          </div>
          <Button variant="outline" onClick={onLogout} className="py-2 text-xs">
            Sign Out
          </Button>
        </div>
      </nav>
      
      <main className="p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication Successful</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            You have successfully logged into the Vissito Management Application. 
            This is where the main application dashboard would render.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-lg bg-slate-50 border border-slate-100">
                <div className="h-4 w-24 bg-slate-200 rounded mb-4"></div>
                <div className="h-2 w-full bg-slate-200 rounded mb-2"></div>
                <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};