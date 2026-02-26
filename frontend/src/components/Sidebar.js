import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { RukosIcon } from './RukosLogo';
import { Button } from './ui/button';
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
  Globe,
  Wallet,
  Shield,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Layers,
  BarChart3,
  Target,
  Globe2
} from 'lucide-react';

export const Sidebar = ({ onOpenAI }) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/portfolio', icon: Wallet, label: t('portfolio') },
    { path: '/posts', icon: FileText, label: t('posts') },
    { path: '/ideas', icon: Lightbulb, label: t('ideas') },
    { path: '/chat', icon: MessageCircle, label: t('chat') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ];

  const knowledgeSubitems = [
    { key: 'defi', icon: Layers, label: 'DeFi', color: '#3B82F6' },
    { key: 'perp', icon: BarChart3, label: 'PERP', color: '#F7931A' },
    { key: 'options', icon: Target, label: 'OPTIONS', color: '#10B981' },
    { key: 'macro', icon: Globe2, label: 'MACRO', color: '#F59E0B' },
  ];

  const isAdmin = user?.role === 'admin';

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
            {isCollapsed ? (
              <RukosIcon size={32} className="text-[#F7931A]" />
            ) : (
              <img 
                src="/logo.jpg" 
                alt="RUKOS CRYPTO" 
                className="h-10 object-contain"
                data-testid="sidebar-logo"
              />
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

            {/* Knowledge Base with subgroups */}
            <div className="mt-1">
              <button
                onClick={() => !isCollapsed && setKnowledgeOpen(!knowledgeOpen)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${window.location.pathname.startsWith('/knowledge')
                    ? 'bg-[#F7931A]/20 text-[#F7931A] font-medium'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                data-testid="nav-knowledge-toggle"
              >
                <BookOpen className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{language === 'ru' ? 'База знаний' : 'Knowledge'}</span>
                    {knowledgeOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </>
                )}
              </button>
              {(knowledgeOpen || isCollapsed) && !isCollapsed && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                  {knowledgeSubitems.map(sub => (
                    <NavLink
                      key={sub.key}
                      to={`/knowledge/${sub.key}`}
                      onClick={() => setIsMobileOpen(false)}
                      className={({ isActive }) => `
                        flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200
                        ${isActive
                          ? 'bg-white/5 font-medium'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                        }
                      `}
                      data-testid={`nav-knowledge-${sub.key}`}
                    >
                      <sub.icon className="w-4 h-4" style={{ color: sub.color }} />
                      <span>{sub.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Link - only visible to admins */}
            {isAdmin && (
              <>
                <div className="border-t border-white/10 my-3" />
                <NavLink
                  to="/admin"
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-[#EF4444]/20 text-[#EF4444] font-medium' 
                      : 'text-[#EF4444]/70 hover:bg-[#EF4444]/10 hover:text-[#EF4444]'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  data-testid="nav-admin"
                >
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>Admin</span>}
                </NavLink>
              </>
            )}
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
            {!isCollapsed && <span className="ml-2">{t('ai_assistant')}</span>}
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
            {!isCollapsed && <span className="ml-2">{t('collapse')}</span>}
          </Button>
        </div>
      </aside>
    </>
  );
};
