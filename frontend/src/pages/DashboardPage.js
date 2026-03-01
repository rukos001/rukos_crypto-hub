import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area';
import { RefreshCw, AlertOctagon, Globe, BarChart3, Activity, 
  Wallet, Shield, Brain, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
// watermarks removed

// Import all tab components
import { MarketCoreTab, DerivativesTab } from '../components/DashboardTabs';
import { ETFIntelligenceTab, OnchainTab, AltseasonTab } from '../components/DashboardTabs2';
import { RiskEngineTab, AISignalsTab } from '../components/DashboardTabs3';
import { WarModeTab } from '../components/DashboardTabs4';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const DashboardPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('market');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [warModeActive, setWarModeActive] = useState(false);

  // Tab configuration with translation keys
  const TABS = [
    { id: 'market', labelKey: 'tab_market', icon: Globe, endpoint: '/analytics/market-core' },
    { id: 'derivatives', labelKey: 'tab_derivatives', icon: BarChart3, endpoint: '/analytics/derivatives' },
    { id: 'etf', labelKey: 'tab_etf', icon: Activity, endpoint: '/analytics/etf-intelligence' },
    { id: 'onchain', labelKey: 'tab_onchain', icon: Wallet, endpoint: '/analytics/onchain' },
    { id: 'altseason', labelKey: 'tab_altseason', icon: Flame, endpoint: '/analytics/altseason' },
    { id: 'risk', labelKey: 'tab_risk', icon: Shield, endpoint: '/analytics/risk-engine' },
    { id: 'ai', labelKey: 'tab_ai', icon: Brain, endpoint: '/analytics/ai-signals' },
    { id: 'war', labelKey: 'tab_war', icon: AlertOctagon, endpoint: '/analytics/war-mode' },
  ];

  // Fetch data for a specific tab
  const fetchTabData = useCallback(async (tabId, force = false) => {
    if (data[tabId] && !force) return;
    
    const tab = TABS.find(t => t.id === tabId);
    if (!tab) return;

    setLoading(prev => ({ ...prev, [tabId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}${tab.endpoint}`, { headers });
      setData(prev => ({ ...prev, [tabId]: response.data }));
      
      if (tabId === 'war') {
        setWarModeActive(response.data?.war_mode_active || false);
      }
    } catch (error) {
      console.error(`Error fetching ${tabId}:`, error);
      toast.error(`${t('loading')} ${t(`tab_${tabId === 'market' ? 'market' : tabId}`)}`);
    } finally {
      setLoading(prev => ({ ...prev, [tabId]: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    fetchTabData(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    fetchTabData('war');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setData({});
    await fetchTabData(activeTab, true);
    await fetchTabData('war', true);
    setRefreshing(false);
    toast.success(t('updated'));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTabData(activeTab, true);
      fetchTabData('war', true);
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const renderTabContent = (tabId) => {
    const tabData = data[tabId];
    const isLoading = loading[tabId];

    switch (tabId) {
      case 'market':
        return <MarketCoreTab data={tabData} loading={isLoading} />;
      case 'derivatives':
        return <DerivativesTab data={tabData} loading={isLoading} />;
      case 'etf':
        return <ETFIntelligenceTab data={tabData} loading={isLoading} />;
      case 'onchain':
        return <OnchainTab data={tabData} loading={isLoading} />;
      case 'altseason':
        return <AltseasonTab data={tabData} loading={isLoading} />;
      case 'risk':
        return <RiskEngineTab data={tabData} loading={isLoading} />;
      case 'ai':
        return <AISignalsTab data={tabData} loading={isLoading} />;
      case 'war':
        return <WarModeTab data={tabData} loading={isLoading} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {t('dashboard')}
            {warModeActive && (
              <Badge className="bg-[#EF4444]/20 text-[#EF4444] animate-pulse">
                <AlertOctagon className="w-4 h-4 mr-1" />
                WAR MODE
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">{t('professional_analytics')}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-white/10"
          data-testid="refresh-btn"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative">
          <ScrollArea className="w-full whitespace-nowrap pb-3">
            <TabsList className="inline-flex h-auto p-1 bg-secondary/30 rounded-xl gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isWar = tab.id === 'war';
                
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    data-testid={`tab-${tab.id}`}
                    className={`
                      px-4 py-2.5 rounded-lg transition-all duration-200
                      data-[state=active]:bg-[#F7931A]/20 data-[state=active]:text-[#F7931A]
                      data-[state=inactive]:text-muted-foreground
                      ${isWar && warModeActive ? 'text-[#EF4444] animate-pulse' : ''}
                    `}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isWar && warModeActive ? 'text-[#EF4444]' : ''}`} />
                    <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <div className="mt-6">
          {TABS.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              {renderTabContent(tab.id)}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};
