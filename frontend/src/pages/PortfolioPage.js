import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { 
  Wallet, TrendingUp, TrendingDown, Shield, Zap, RefreshCw,
  Lock, Coins, Flame
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
};

const GROUP_CONFIG = {
  HOLD: { icon: Lock, color: '#F7931A', gradient: 'from-[#F7931A]/20 to-[#FFD700]/10', border: 'border-[#F7931A]/30' },
  ALTs: { icon: Coins, color: '#3B82F6', gradient: 'from-[#3B82F6]/20 to-[#6366F1]/10', border: 'border-[#3B82F6]/30' },
  HI_RISK: { icon: Flame, color: '#EF4444', gradient: 'from-[#EF4444]/20 to-[#F59E0B]/10', border: 'border-[#EF4444]/30' },
};

const PositionCard = ({ pos, groupColor }) => {
  const pnlPositive = pos.pnl_usd >= 0;
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors" data-testid={`position-${pos.asset}`}>
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black text-sm"
          style={{ background: `linear-gradient(135deg, ${groupColor}, ${groupColor}88)` }}
        >
          {pos.asset.slice(0, 3)}
        </div>
        <div>
          <p className="font-semibold">{pos.asset}</p>
          <p className="text-xs text-muted-foreground">{pos.size?.toLocaleString()} units</p>
          {pos.notes && <p className="text-xs text-[#F7931A]/70 mt-0.5">{pos.notes}</p>}
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono font-semibold">{formatNumber(pos.value_usd)}</p>
        <p className={`text-sm font-mono ${pnlPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {pnlPositive ? '+' : ''}{formatNumber(pos.pnl_usd)}
        </p>
        <p className={`text-xs font-mono ${pnlPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          ({pnlPositive ? '+' : ''}{pos.pnl_pct?.toFixed(2)}%)
        </p>
      </div>
    </div>
  );
};

const GroupSection = ({ name, group, config }) => {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = config.icon;
  const pnlPositive = group.total_pnl >= 0;

  return (
    <Card className={`glass-card ${config.border}`} data-testid={`portfolio-group-${name}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color: config.color }} />
            </div>
            <div>
              <span style={{ color: config.color }}>{name === 'HI_RISK' ? 'HI RISK' : name}</span>
              <p className="text-xs text-muted-foreground font-normal">{group.description}</p>
            </div>
          </CardTitle>
          <div className="text-right">
            <p className="font-mono font-bold text-lg">{formatNumber(group.total_value)}</p>
            <p className={`text-sm font-mono ${pnlPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {pnlPositive ? '+' : ''}{formatNumber(group.total_pnl)} ({pnlPositive ? '+' : ''}{group.total_pnl_pct?.toFixed(2)}%)
            </p>
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-2">
          {group.positions?.map((pos, i) => (
            <PositionCard key={i} pos={pos} groupColor={config.color} />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export const PortfolioPage = () => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState('all');

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/portfolio/groups`);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) return <div className="text-muted-foreground">No portfolio data</div>;

  const totalPnlPositive = data.total_pnl >= 0;
  const groupEntries = Object.entries(data.groups || {});
  const filteredGroups = activeGroup === 'all' 
    ? groupEntries 
    : groupEntries.filter(([k]) => k === activeGroup);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="portfolio-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#F7931A]" />
            {t('portfolio')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('portfolio_desc')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPortfolio} className="border-white/10" data-testid="portfolio-refresh">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('refresh')}
        </Button>
      </div>

      {/* Total Summary */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#F7931A]/20 to-transparent border border-[#F7931A]/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">{t('total_value')}</p>
            <p className="text-4xl font-bold font-mono text-[#F7931A]">{formatNumber(data.total_value)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">PnL</p>
            <p className={`text-2xl font-bold font-mono ${totalPnlPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {totalPnlPositive ? '+' : ''}{formatNumber(data.total_pnl)}
            </p>
            <p className={`text-sm font-mono ${totalPnlPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              ({totalPnlPositive ? '+' : ''}{data.total_pnl_pct?.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Group Filter */}
      <div className="flex gap-2 flex-wrap" data-testid="portfolio-group-filter">
        <Button
          variant={activeGroup === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveGroup('all')}
          className={activeGroup === 'all' ? 'bg-[#F7931A] text-black' : 'border-white/10'}
          data-testid="portfolio-filter-all"
        >
          All Groups
        </Button>
        {Object.entries(GROUP_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Button
              key={key}
              variant={activeGroup === key ? 'default' : 'outline'}
              onClick={() => setActiveGroup(key)}
              className={activeGroup === key ? 'text-black' : 'border-white/10'}
              style={activeGroup === key ? { backgroundColor: cfg.color } : {}}
              data-testid={`portfolio-filter-${key.toLowerCase()}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {key === 'HI_RISK' ? 'HI RISK' : key}
            </Button>
          );
        })}
      </div>

      {/* Group Cards */}
      {filteredGroups.map(([name, group]) => (
        <GroupSection 
          key={name} 
          name={name} 
          group={group} 
          config={GROUP_CONFIG[name] || GROUP_CONFIG.HOLD} 
        />
      ))}
    </div>
  );
};
