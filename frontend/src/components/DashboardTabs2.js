import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { 
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Wallet, 
  ArrowRightLeft, Flame, Users
} from 'lucide-react';
import { 
  SectionHeader, MetricCard, CustomTooltip, LoadingSkeleton,
  formatNumber, ValueChange 
} from './DashboardTabs';
import { useLanguage } from '../context/LanguageContext';
import { InfoTooltip, SourceLink } from './InfoComponents';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ==================== ETF INTELLIGENCE TAB ====================
export const ETFIntelligenceTab = ({ data, loading }) => {
  const { t } = useLanguage();
  const [etfFilter, setEtfFilter] = useState('all');

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">{t('no_data')}</div>;

  const btc = data.btc_etf;
  const eth = data.eth_etf;

  const flowChartData = data.flow_history?.map(d => ({
    date: d.date_short,
    btc: d.btc_flow / 1e6,
    eth: d.eth_flow / 1e6
  })) || [];

  // Filter funds based on selection
  const getDisplayFunds = () => {
    if (etfFilter === 'btc') return btc?.funds?.map(f => ({...f, asset: 'BTC'})) || [];
    if (etfFilter === 'eth') return eth?.funds?.map(f => ({...f, asset: 'ETH'})) || [];
    return data.all_funds || [];
  };

  const displayFunds = getDisplayFunds();
  const totalDisplayAum = displayFunds.reduce((s, f) => s + (f.aum || 0), 0);
  const totalDisplayFlow = displayFunds.reduce((s, f) => s + (f.daily_flow || 0), 0);

  return (
    <div className="space-y-6">
      {/* Tab description */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
        <p className="text-sm text-muted-foreground">{t('etf_desc')}</p>
        <SourceLink source="sosovalue" label="SoSoValue" />
      </div>

      {/* ETF Absorption Signal */}
      <div className={`p-4 rounded-xl border-2 ${data.etf_absorption?.signal ? 'border-[#10B981] bg-[#10B981]/10' : 'border-[#F59E0B] bg-[#F59E0B]/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className={`w-6 h-6 ${data.etf_absorption?.signal ? 'text-[#10B981]' : 'text-[#F59E0B]'}`} />
            <div>
              <p className="font-bold flex items-center">
                {t('etf_absorption')}
                <InfoTooltip text={t('etf_absorption_desc')} />
              </p>
              <p className="text-sm text-muted-foreground">
                {data.etf_absorption?.signal 
                  ? 'ETFs buying more than miners selling' 
                  : 'Miners selling exceeds ETF buying'}
              </p>
            </div>
          </div>
          <Badge className={data.etf_absorption?.signal ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}>
            {data.etf_absorption?.status} ({data.etf_absorption?.ratio}x)
          </Badge>
        </div>
      </div>

      {/* ETF Filter Selector */}
      <div className="flex gap-2" data-testid="etf-filter">
        {[
          { key: 'all', label: t('all_etfs') },
          { key: 'btc', label: t('btc_etfs') },
          { key: 'eth', label: t('eth_etfs') },
        ].map(f => (
          <Button
            key={f.key}
            variant={etfFilter === f.key ? 'default' : 'outline'}
            onClick={() => setEtfFilter(f.key)}
            className={etfFilter === f.key ? 'bg-[#F7931A] text-black' : 'border-white/10'}
            data-testid={`etf-filter-${f.key}`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Totals for selected filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#F7931A]/10 text-center border border-[#F7931A]/20">
          <p className="text-sm text-muted-foreground">{t('total_aum')}</p>
          <p className="text-3xl font-bold font-mono text-[#F7931A]">{formatNumber(totalDisplayAum)}</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 text-center border border-white/5">
          <p className="text-sm text-muted-foreground">{t('daily_flow')}</p>
          <p className={`text-3xl font-bold font-mono ${totalDisplayFlow >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {totalDisplayFlow >= 0 ? '+' : ''}{formatNumber(totalDisplayFlow)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 text-center border border-white/5">
          <p className="text-sm text-muted-foreground">{t('fund_breakdown')}</p>
          <p className="text-3xl font-bold font-mono">{displayFunds.length}</p>
          <p className="text-xs text-muted-foreground">funds</p>
        </div>
      </div>

      {/* All Funds Table */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader
            icon={Wallet}
            title={etfFilter === 'all' ? t('all_etfs') : etfFilter === 'btc' ? t('btc_etfs') : t('eth_etfs')}
            source="sosovalue"
            sourceLabel="SoSoValue"
          />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {displayFunds.map((fund, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs w-6">#{i + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{fund.ticker}</span>
                        {fund.asset && (
                          <Badge variant="outline" className={`text-xs ${fund.asset === 'BTC' ? 'border-[#F7931A]/30 text-[#F7931A]' : 'border-[#3B82F6]/30 text-[#3B82F6]'}`}>
                            {fund.asset}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{fund.issuer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{formatNumber(fund.aum)}</p>
                    <p className={`text-xs font-mono ${fund.daily_flow >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {fund.daily_flow >= 0 ? '+' : ''}{formatNumber(fund.daily_flow)}
                    </p>
                    <p className="text-xs text-muted-foreground">ER: {fund.expense_ratio}%</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Flow History Chart */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Activity} title={t('flow_history')} badge="14 Days" source="sosovalue" sourceLabel="SoSoValue" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#52525B', fontSize: 10 }} />
                <YAxis tick={{ fill: '#52525B', fontSize: 10 }} tickFormatter={v => `${v}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="btc" fill="#F7931A" name="BTC Flow ($M)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="eth" fill="#3B82F6" name="ETH Flow ($M)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Miner Metrics */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Flame} title={t('miner_activity')} source="glassnode" sourceLabel="Glassnode" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="text-sm text-muted-foreground">Daily Miner Sell</p>
              <p className="font-mono font-semibold">{data.miner_metrics?.daily_sell_btc?.toFixed(1)} BTC</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">USD Value</p>
              <p className="font-mono text-[#EF4444]">{formatNumber(data.miner_metrics?.daily_sell_usd)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== ONCHAIN WAR ROOM TAB ====================
export const OnchainTab = ({ data: initialData, loading: initialLoading }) => {
  const { t } = useLanguage();
  const [chain, setChain] = useState('btc');
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(initialLoading);

  // Update data when parent provides new data (initial load for btc)
  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

  const fetchChainData = useCallback(async (selectedChain) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics/onchain?chain=${selectedChain}`);
      setData(response.data);
    } catch (error) {
      console.error(`Error fetching onchain ${selectedChain}:`, error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChainChange = (newChain) => {
    setChain(newChain);
    fetchChainData(newChain);
  };

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">{t('no_data')}</div>;

  const metrics = data.metrics;
  const chainLabel = (data.chain || chain).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Tab description */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
        <p className="text-sm text-muted-foreground">{t('onchain_desc')}</p>
        <SourceLink source="glassnode" label="Glassnode" />
      </div>

      {/* Chain Selector */}
      <div className="flex gap-2" data-testid="onchain-chain-selector">
        {[
          { key: 'btc', label: 'BTC', color: '#F7931A' },
          { key: 'eth', label: 'ETH', color: '#3B82F6' },
          { key: 'sol', label: 'SOL', color: '#10B981' },
        ].map(c => (
          <Button
            key={c.key}
            variant={chain === c.key ? 'default' : 'outline'}
            onClick={() => handleChainChange(c.key)}
            className={chain === c.key ? `text-black` : 'border-white/10'}
            style={chain === c.key ? { backgroundColor: c.color } : {}}
            data-testid={`onchain-${c.key}-btn`}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {/* Price */}
      {data.price && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#F7931A]/20 to-transparent border border-[#F7931A]/30">
          <p className="text-sm text-muted-foreground">{chainLabel} Price</p>
          <p className="text-3xl font-bold font-mono text-[#F7931A]">
            ${data.price?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      )}

      {/* Key Onchain Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title={t('sopr')} 
          value={metrics?.sopr?.toFixed(4)}
          status={metrics?.sopr_status?.toUpperCase()}
          tooltip={t('sopr_desc')}
        />
        <MetricCard 
          title={t('nupl')} 
          value={metrics?.nupl?.toFixed(3)}
          status={metrics?.nupl_zone?.toUpperCase()}
          tooltip={t('nupl_desc')}
        />
        <MetricCard 
          title={t('mvrv')} 
          value={metrics?.mvrv?.toFixed(2)}
          status={metrics?.mvrv_signal?.toUpperCase()}
          tooltip={t('mvrv_desc')}
        />
        <MetricCard 
          title={t('cdd')} 
          value={formatNumber(metrics?.cdd_7d_avg).replace('$', '')}
          status={metrics?.cdd_status?.toUpperCase()}
          tooltip={t('cdd_desc')}
        />
      </div>

      {/* Realized vs Market Cap */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Activity} title={t('realized_vs_market')} source="glassnode" sourceLabel="Glassnode" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F7931A]/10 text-center">
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-2xl font-bold font-mono text-[#F7931A]">{formatNumber(metrics?.market_cap)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#3B82F6]/10 text-center">
              <p className="text-sm text-muted-foreground">Realized Cap</p>
              <p className="text-2xl font-bold font-mono text-[#3B82F6]">{formatNumber(metrics?.realized_cap)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staking Data (ETH & SOL only) */}
      {data.staking && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={Wallet} title={`${chainLabel} Staking`} source={chain === 'eth' ? 'glassnode' : 'glassnode'} sourceLabel="Glassnode" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">Total Staked</p>
                <p className="font-mono font-semibold">{formatNumber(data.staking.total_staked).replace('$', '')} {chainLabel}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">Staking Ratio</p>
                <p className="font-mono font-semibold text-[#10B981]">{data.staking.staking_ratio}%</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">Validators</p>
                <p className="font-mono font-semibold">{data.staking.validators?.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">Avg APY</p>
                <p className="font-mono font-semibold text-[#F7931A]">{data.staking.avg_apy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exchange Flows */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={ArrowRightLeft} title={t('exchange_flows')} tooltip={t('exchange_flows_desc')} source="glassnode" sourceLabel="Glassnode" />
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-sm font-semibold mb-3">{chainLabel}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('inflow')}</span>
                <span className="font-mono text-[#EF4444]">
                  {formatNumber(data.exchange_flows?.inflow_24h).replace('$', '')} {chainLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('outflow')}</span>
                <span className="font-mono text-[#10B981]">
                  {formatNumber(data.exchange_flows?.outflow_24h).replace('$', '')} {chainLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exchange Reserve</span>
                <span className="font-mono">{formatNumber(data.exchange_flows?.exchange_reserve).replace('$', '')} {chainLabel}</span>
              </div>
              <div className={`flex justify-between pt-2 border-t border-white/10`}>
                <span>Net Flow</span>
                <Badge className={data.exchange_flows?.netflow_signal === 'ACCUMULATION' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}>
                  {data.exchange_flows?.netflow_signal}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Whale Accumulation Zones */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={TrendingUp} title={t('whale_zones')} source="arkham" sourceLabel="Arkham" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.accumulation_zones?.map((zone, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-36">{zone.range}</span>
                <div className="flex-1">
                  <Progress value={zone.strength} className="h-3" />
                </div>
                <span className="font-mono text-sm w-12">{zone.strength.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notable Wallets */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader
            icon={Wallet}
            title={`${t('notable_wallets')} (${chainLabel})`}
            tooltip={t('notable_wallets_desc')}
            source="arkham"
            sourceLabel="Arkham Intelligence"
          />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            <div className="space-y-2">
              {data.notable_wallets?.map((wallet, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm w-6">#{i + 1}</span>
                    <div>
                      <p className="font-semibold">{wallet.name}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(wallet.value_usd)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[#F7931A]">{wallet.balance?.toLocaleString()} {chainLabel}</p>
                    <p className={`text-xs font-mono ${wallet.change_30d >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {wallet.change_30d >= 0 ? '+' : ''}{wallet.change_30d?.toLocaleString()} (30d)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Miner Reserves (BTC only) */}
      {data.miner_reserves && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={Flame} title={t('miner_reserves')} source="glassnode" sourceLabel="Glassnode" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div>
                <p className="text-sm text-muted-foreground">Total Reserves</p>
                <p className="text-2xl font-bold font-mono text-[#F7931A]">
                  {data.miner_reserves?.btc_balance?.toLocaleString()} BTC
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">30d Change</p>
                <p className={`font-mono ${data.miner_reserves?.change_30d >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {data.miner_reserves?.change_30d >= 0 ? '+' : ''}{data.miner_reserves?.change_30d?.toLocaleString()} BTC
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ==================== ALTSEASON MONITOR TAB ====================
export const AltseasonTab = ({ data, loading }) => {
  const { t } = useLanguage();

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">{t('no_data')}</div>;

  const score = data.altseason_probability || 0;
  const status = data.altseason_status;
  const statusColor = status === 'ALTSEASON' ? '#10B981' : status === 'WARMING UP' ? '#F7931A' : '#EF4444';
  const statusTranslated = status === 'ALTSEASON' ? t('altseason') : status === 'WARMING UP' ? t('warming_up') : t('btc_season');

  const domPieData = [
    { name: 'BTC', value: data.dominance?.btc || 0 },
    { name: 'ETH', value: data.dominance?.eth || 0 },
    { name: 'SOL', value: data.dominance?.sol || 0 },
    { name: 'Other', value: data.dominance?.other || 0 },
  ];
  const COLORS = ['#F7931A', '#3B82F6', '#10B981', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Tab description */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
        <p className="text-sm text-muted-foreground">{t('altseason_desc')}</p>
        <SourceLink source="coinmarketcap" label="CoinMarketCap" />
      </div>

      {/* Altseason Score */}
      <div className="p-6 rounded-xl border-2" style={{ borderColor: statusColor, backgroundColor: `${statusColor}10` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider flex items-center">
              {t('altseason_probability')}
              <InfoTooltip text={t('altseason_probability_desc')} />
            </p>
            <p className="text-5xl font-bold font-mono" style={{ color: statusColor }}>{score.toFixed(0)}</p>
          </div>
          <Badge className="text-lg px-4 py-2" style={{ backgroundColor: `${statusColor}30`, color: statusColor }}>
            {statusTranslated}
          </Badge>
        </div>
        <div className="mt-4">
          <Progress value={score} className="h-3" />
        </div>
      </div>

      {/* TOTAL2 / TOTAL3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard 
          title="TOTAL2 (All ex-BTC)" 
          value={formatNumber(data.total2)}
          change={data.total2_change_7d}
        />
        <MetricCard 
          title="TOTAL3 (All ex-BTC/ETH)" 
          value={formatNumber(data.total3)}
          change={data.total3_change_7d}
        />
      </div>

      {/* Dominance Breakdown */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Activity} title={t('dominance_breakdown')} source="coinmarketcap" sourceLabel="CoinMarketCap" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="w-[180px] h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={domPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value.toFixed(1)}%`} labelLine={false}>
                    {domPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {domPieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-mono">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sector Performance */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={TrendingUp} title={t('sector_performance')} source="coinmarketcap" sourceLabel="CoinMarketCap" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(data.sectors || {}).map(([sector, perf]) => (
              <div key={sector} className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground uppercase">{sector}</p>
                <p className={`text-xl font-bold font-mono ${perf.change_7d >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {perf.change_7d >= 0 ? '+' : ''}{perf.change_7d.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Vol: {perf.volume_change >= 0 ? '+' : ''}{perf.volume_change.toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 50 vs BTC */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Users} title={t('top50_vs_btc')} badge={`${data.outperforming_count}/20 outperforming`} />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {data.top50_vs_btc?.map((coin, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <span className="font-semibold">{coin.coin}</span>
                  <span className={`font-mono ${coin.outperforming ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {coin.vs_btc_7d >= 0 ? '+' : ''}{coin.vs_btc_7d}%
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Narratives */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Flame} title={t('narrative_heatmap')} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.narratives?.map((n, i) => (
              <div 
                key={i} 
                className="p-3 rounded-xl"
                style={{ 
                  backgroundColor: `rgba(247, 147, 26, ${n.score / 200})`,
                  border: n.trend === 'hot' ? '1px solid #F7931A' : '1px solid transparent'
                }}
              >
                <p className="font-semibold text-sm">{n.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-[#F7931A]">{n.score.toFixed(0)}</span>
                  <Badge variant="outline" className="text-xs border-white/10">{n.trend}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DeFi TVL */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Activity} title={t('defi_tvl')} source="defillama" sourceLabel="DefiLlama" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="text-sm text-muted-foreground">Total Value Locked</p>
              <p className="text-3xl font-bold font-mono text-[#F7931A]">{formatNumber(data.defi_tvl)}</p>
            </div>
            <ValueChange value={data.defi_tvl_change_7d} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
