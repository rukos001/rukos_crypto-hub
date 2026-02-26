import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Lightbulb, 
  MessageCircle, 
  Settings, 
  Menu, 
  X,
  TrendingUp,
  Sparkles,
  LogOut,
  Globe
} from 'lucide-react';

export const Sidebar = ({ onOpenAI }) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/posts', icon: FileText, label: t('posts') },
    { path: '/ideas', icon: Lightbulb, label: t('ideas') },
    { path: '/chat', icon: MessageCircle, label: t('chat') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        data-testid="mobile-menu-btn"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 glass-card border-r border-white/5
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F7931A] to-[#FFD700] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">
                  <span className="gold-gradient">RUKOS</span>
                  <span className="text-muted-foreground">_CRYPTO</span>
                </h1>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-[#F7931A]/20 text-[#F7931A] font-medium' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                data-testid={`nav-${item.path.slice(1)}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Language Switcher */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className={`mb-2 border-white/10 hover:bg-[#F7931A]/10 hover:border-[#F7931A]/30 transition-all ${isCollapsed ? 'w-full px-0' : ''}`}
            data-testid="language-switcher"
          >
            <Globe className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2 font-mono text-xs">{language === 'ru' ? 'RU' : 'EN'}</span>}
          </Button>

          {/* AI Assistant Button */}
          <Button
            onClick={onOpenAI}
            className={`mb-4 bg-gradient-to-r from-[#F7931A] to-[#FFD700] text-black font-semibold hover:brightness-110 transition-all
              ${isCollapsed ? 'w-full px-0' : ''}
            `}
            data-testid="open-ai-btn"
          >
            <Sparkles className="w-5 h-5" />
            {!isCollapsed && <span className="ml-2">AI Ассистент</span>}
          </Button>

          {/* User info */}
          {user && (
            <div className={`p-3 rounded-xl bg-secondary/30 ${isCollapsed ? 'text-center' : ''}`}>
              <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FFD700] flex items-center justify-center font-bold text-black text-sm flex-shrink-0">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapse button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mt-4 text-muted-foreground hover:text-white hidden lg:flex"
            data-testid="collapse-sidebar-btn"
          >
            <Menu className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">Свернуть</span>}
          </Button>
        </div>
      </aside>
    </>
  );
};
