import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { AIAssistant } from '../components/AIAssistant';
import { Loader2 } from 'lucide-react';

export const MainLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isAIOpen, setIsAIOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7931A]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen grid-texture">
      <Sidebar onOpenAI={() => setIsAIOpen(true)} />
      <main className="lg:ml-64 p-6 pt-20 lg:pt-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
};
