import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, 
  Zap, Gauge, BarChart3, PieChart as PieIcon, Target,
  Shield, AlertOctagon, Waves, Flame, Eye, Brain, Wallet,
  Globe, Users
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { InfoTooltip, SourceLink } from './InfoComponents';

// Utility functions
const formatNumber = (num, decimals = 2) => {
  if (!num && num !== 0) return '-';
  if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(decimals)}T`;
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
  return `$${num.toLocaleString()}`;
};

const formatPct = (num) => {
  if (!num && num !== 0) return '-';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

const formatCompact = (num) => {
  if (!num && num !== 0) return '-';
  if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toFixed(2);
};

const ValueChange = ({ value, suffix = '%' }) => {
  const isPositive = value >= 0;
  return (
    <span className={`font-mono text-sm ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
      {isPositive ? '+' : ''}{value?.toFixed(2)}{suffix}
    </span>
  );
};

const MetricCard = ({ title, value, change, icon: Icon, status, isRecord, tooltip, testId }) => (
  <div
    data-testid={testId}
    className={`p-4 rounded-xl bg-secondary/30 ${isRecord ? 'border-2 border-[#F7931A] animate-pulse' : 'border border-white/5'}`}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center">
        {title}
        {tooltip && <InfoTooltip text={tooltip} />}
      </span>
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
    </div>
    <p className={`font-mono text-xl font-bold ${isRecord ? 'text-[#F7931A]' : ''}`}>{value}</p>
    {change !== undefined && <ValueChange value={change} />}
    {status && (
      <Badge className={`mt-2 text-xs ${
        status === 'HIGH' || status === 'CRITICAL' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
        status === 'LOW' ? 'bg-[#10B981]/20 text-[#10B981]' :
        'bg-[#F59E0B]/20 text-[#F59E0B]'
      }`}>
        {status}
      </Badge>
    )}
    {isRecord && <Badge className="mt-2 text-xs bg-[#F7931A]/20 text-[#F7931A]">RECORD!</Badge>}
  </div>
);

const SectionHeader = ({ icon: Icon, title, badge, badgeColor = 'default', tooltip, source, sourceLabel }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-[#F7931A]" />}
        {title}
        {tooltip && <InfoTooltip text={tooltip} />}
      </h3>
      {source && <SourceLink source={source} label={sourceLabel} />}
    </div>
    {badge && (
      <Badge variant="outline" className={`text-xs border-white/10 ${badgeColor}`}>
        {badge}
      </Badge>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg border border-white/10 text-sm">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="font-mono">
            {entry.name}: {typeof entry.value === 'number' ? formatCompact(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ==================== MARKET CORE TAB ====================
const MarketCoreTab = ({ data, loading }) => {
  const { t } = useLanguage();

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">{t('no_data')}</div>;

  const regime = data.market_regime;
  const regimeColor = regime === 'risk-on' ? '#10B981' : '#EF4444';
  const fg = data.fear_greed;

  // Fear & Greed color
  const fgColor = fg?.value <= 25 ? '#EF4444' : fg?.value <= 45 ? '#F59E0B' : fg?.value <= 55 ? '#A1A1AA' : fg?.value <= 75 ? '#10B981' : '#22C55E';

  return (
    <div className="space-y-6">
      {/* Tab description */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
        <p className="text-sm text-muted-foreground">{t('market_core_desc')}</p>
        <SourceLink source="coinmarketcap" label="CoinMarketCap" />
      </div>

      {/* Market Regime Banner */}
      <div className={`p-4 rounded-xl border-2 ${regime === 'risk-on' ? 'border-[#10B981] bg-[#10B981]/10' : 'border-[#EF4444] bg-[#EF4444]/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${regime === 'risk-on' ? 'bg-[#10B981]' : 'bg-[#EF4444]'} animate-pulse`} />
            <span className="text-lg font-bold uppercase flex items-center" style={{ color: regimeColor }}>
              {regime === 'risk-on' ? t('risk_on') : t('risk_off')}
              <InfoTooltip text={t('market_regime_desc')} />
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Risk Score</p>
            <p className="font-mono text-2xl font-bold" style={{ color: regimeColor }}>{data.risk_score}</p>
          </div>
        </div>
      </div>

      {/* Crypto Prices */}
      <Card className="glass-card" data-testid="crypto-prices-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={DollarSign} title={t('crypto_prices')} tooltip={t('crypto_prices_desc')} source="coingecko" sourceLabel="CoinGecko" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.prices?.map(coin => (
              <div key={coin.symbol} className="p-4 rounded-xl bg-secondary/30 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-base">{coin.symbol}</span>
                  <span className="text-xs text-muted-foreground">{coin.name}</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[#F7931A]">
                  ${coin.price?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
                <div className="flex gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">24h:</span>
                  <ValueChange value={coin.change_24h} />
                  <span className="text-xs text-muted-foreground ml-2">7d:</span>
                  <ValueChange value={coin.change_7d} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">MCap: {formatNumber(coin.market_cap)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fear & Greed Index */}
      <Card className="glass-card" data-testid="fear-greed-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Gauge} title={t('fear_greed')} tooltip={t('fear_greed_desc')} source="alternative_me" sourceLabel="Alternative.me" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div 
                className="absolute inset-0 rounded-full border-8 transition-all duration-500"
                style={{ borderColor: fgColor, borderRightColor: 'transparent', borderBottomColor: 'transparent', transform: `rotate(${(fg?.value || 0) * 3.6}deg)` }}
              />
              <div className="absolute inset-2 rounded-full bg-[#0a0a1a]" />
              <div className="relative text-center">
                <p className="text-3xl font-bold font-mono" style={{ color: fgColor }}>{fg?.value}</p>
                <p className="text-xs text-muted-foreground">{fg?.classification}</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Previous Day</span>
                <span className="font-mono">{fg?.previous_day}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Previous Week</span>
                <span className="font-mono">{fg?.previous_week}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#22C55E] mt-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Extreme Fear</span>
                <span>Extreme Greed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title={t('total_market_cap')} 
          value={formatNumber(data.total_market_cap)} 
          change={data.total_market_cap_change_24h}
          icon={Globe}
          testId="metric-total-mcap"
        />
        <MetricCard 
          title={t('btc_dominance')} 
          value={`${data.btc_dominance}%`} 
          change={data.btc_dominance_change_24h}
          icon={PieIcon}
          testId="metric-btc-dom"
        />
        <MetricCard 
          title={t('eth_dominance')} 
          value={`${data.eth_dominance}%`} 
          change={data.eth_dominance_change_24h}
          testId="metric-eth-dom"
        />
        <MetricCard 
          title={t('total3')} 
          value={formatNumber(data.total3)} 
          change={data.total3_change_24h}
          tooltip={t('total3_desc')}
          testId="metric-total3"
        />
      </div>

      {/* Stablecoins & Traditional Markets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={DollarSign} title={t('stablecoins')} tooltip={t('stablecoins_desc')} source="coinmarketcap" sourceLabel="CoinMarketCap" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Stablecoin MCap</span>
              <span className="font-mono font-semibold">{formatNumber(data.stablecoin_mcap)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">USDT</span>
              <span className="font-mono">{formatNumber(data.usdt_mcap)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">USDC</span>
              <span className="font-mono">{formatNumber(data.usdc_mcap)}</span>
            </div>
            <ValueChange value={data.stablecoin_change_24h} />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={BarChart3} title={t('traditional_markets')} tooltip={t('traditional_markets_desc')} source="tradingview" sourceLabel="TradingView" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">DXY</span>
              <div className="text-right">
                <span className="font-mono font-semibold">{data.dxy}</span>
                <ValueChange value={data.dxy_change} suffix="" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">US10Y</span>
              <div className="text-right">
                <span className="font-mono font-semibold">{data.us10y}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">SPX</span>
              <div className="text-right">
                <span className="font-mono font-semibold">{data.spx?.toLocaleString()}</span>
                <ValueChange value={data.spx_change_pct} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">NQ</span>
              <div className="text-right">
                <span className="font-mono font-semibold">{data.nq?.toLocaleString()}</span>
                <ValueChange value={data.nq_change_pct} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('gold')} (XAU)</span>
              <div className="text-right">
                <span className="font-mono font-semibold text-[#FFD700]">${data.gold?.toLocaleString()}</span>
                {data.gold_change_pct !== undefined && <ValueChange value={data.gold_change_pct} />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* M2 Global Liquidity */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Waves} title={t('global_liquidity')} tooltip={t('global_liquidity_desc')} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold font-mono text-[#F7931A]">${data.m2_global}T</p>
              <p className="text-sm text-muted-foreground">Global M2 Money Supply</p>
            </div>
            <div className="text-right">
              <ValueChange value={data.m2_change_mom} suffix="% MoM" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== DERIVATIVES TAB ====================
const DerivativesTab = ({ data, loading }) => {
  const { t } = useLanguage();
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  
  if (loading) return <LoadingSkeleton />;
  if (!data || !data.by_asset) return <div className="text-muted-foreground">{t('no_data')}</div>;

  const assetData = data.by_asset[selectedAsset];
  if (!assetData) return null;

  const fundingChartData = assetData.funding_history?.map(f => ({
    time: f.time,
    rate: f.rate * 100
  })) || [];

  return (
    <div className="space-y-6">
      {/* Tab description */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
        <p className="text-sm text-muted-foreground">{t('derivatives_desc')}</p>
        <SourceLink source="coinglass" label="CoinGlass" />
      </div>

      {/* Asset Selector */}
      <div className="flex gap-2">
        {['BTC', 'ETH', 'SOL'].map(asset => (
          <Button
            key={asset}
            variant={selectedAsset === asset ? 'default' : 'outline'}
            onClick={() => setSelectedAsset(asset)}
            className={selectedAsset === asset ? 'bg-[#F7931A] text-black' : 'border-white/10'}
            data-testid={`derivatives-${asset.toLowerCase()}-btn`}
          >
            {asset}
          </Button>
        ))}
      </div>

      {/* Total OI Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#F7931A]/20 to-transparent border border-[#F7931A]/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              {t('open_interest')} (Total)
              <InfoTooltip text={t('open_interest_desc')} />
            </p>
            <p className="text-3xl font-bold font-mono">{formatNumber(data.total_open_interest)}</p>
          </div>
          <ValueChange value={data.total_oi_change_24h} />
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title={`${selectedAsset} OI`}
          value={formatNumber(assetData.open_interest)}
          change={assetData.oi_change_24h}
          isRecord={assetData.is_oi_record}
          tooltip={t('open_interest_desc')}
        />
        <MetricCard 
          title={t('funding_rate')}
          value={`${(assetData.funding_rate * 100).toFixed(3)}%`}
          isRecord={assetData.is_funding_record}
          status={Math.abs(assetData.funding_rate) > 0.05 ? 'HIGH' : 'NORMAL'}
          tooltip={t('funding_rate_desc')}
        />
        <MetricCard 
          title={t('long_short_ratio')}
          value={assetData.long_short_ratio?.toFixed(2)}
          status={assetData.long_short_ratio > 1.5 ? 'LONG HEAVY' : assetData.long_short_ratio < 0.7 ? 'SHORT HEAVY' : 'BALANCED'}
          tooltip={t('long_short_ratio_desc')}
        />
        <MetricCard 
          title="Basis"
          value={`${assetData.basis?.toFixed(2)}%`}
          status={assetData.basis > 1 ? 'CONTANGO' : 'BACKWARDATION'}
        />
      </div>

      {/* Divergence Alert */}
      {assetData.divergence && (
        <div className={`p-4 rounded-xl ${assetData.divergence.type === 'bearish' ? 'bg-[#EF4444]/10 border border-[#EF4444]/30' : 'bg-[#10B981]/10 border border-[#10B981]/30'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${assetData.divergence.type === 'bearish' ? 'text-[#EF4444]' : 'text-[#10B981]'}`} />
            <span className="font-semibold flex items-center">
              {t('oi_divergence')}
              <InfoTooltip text={t('oi_divergence_desc')} />
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{assetData.divergence.signal}</p>
        </div>
      )}

      {/* Funding History Chart */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Activity} title={t('funding_history')} tooltip={t('funding_rate_desc')} source="coinglass" sourceLabel="CoinGlass" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fundingChartData}>
                <defs>
                  <linearGradient id="fundingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F7931A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#52525B', fontSize: 10 }} />
                <YAxis tick={{ fill: '#52525B', fontSize: 10 }} tickFormatter={v => `${v.toFixed(2)}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="rate" stroke="#F7931A" fill="url(#fundingGrad)" name="Funding %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Liquidation Clusters */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Zap} title={t('liquidation_clusters')} tooltip={t('liquidation_clusters_desc')} source="coinglass" sourceLabel="CoinGlass" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {assetData.liquidation_clusters?.map((cluster, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-xs w-16 ${cluster.side === 'long' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {cluster.pct_from_current > 0 ? '+' : ''}{cluster.pct_from_current}%
                </span>
                <span className="font-mono text-sm w-24">${cluster.price.toLocaleString()}</span>
                <div className="flex-1">
                  <div 
                    className={`h-4 rounded ${cluster.side === 'long' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                    style={{ width: `${cluster.density}%`, opacity: 0.3 + cluster.density / 200 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-20">{formatNumber(cluster.value_usd)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Traders & Gamma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={Users} title={t('top_traders')} tooltip={t('top_traders_desc')} source="hyperliquid" sourceLabel="Hyperliquid" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Long Accounts</span>
                <span className="font-mono text-[#10B981]">{assetData.top_traders?.long_accounts}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Short Accounts</span>
                <span className="font-mono text-[#EF4444]">{assetData.top_traders?.short_accounts}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Whale Sentiment</span>
                <Badge className={assetData.top_traders?.whale_sentiment === 'bullish' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}>
                  {assetData.top_traders?.whale_sentiment?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={Target} title={t('gamma_exposure')} tooltip={t('gamma_exposure_desc')} source="deribit" sourceLabel="Deribit" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Gamma</span>
                <span className="font-mono">{formatNumber(assetData.gamma_exposure?.total_gamma)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Pain</span>
                <span className="font-mono text-[#F7931A]">${assetData.gamma_exposure?.max_pain?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gamma Flip</span>
                <span className="font-mono">${assetData.gamma_exposure?.gamma_flip?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dealer Position</span>
                <Badge variant="outline" className="border-white/10">
                  {assetData.gamma_exposure?.dealer_positioning?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-20 w-full" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
    <Skeleton className="h-48 w-full" />
  </div>
);

export { MarketCoreTab, DerivativesTab, LoadingSkeleton, MetricCard, SectionHeader, CustomTooltip, formatNumber, formatPct, formatCompact, ValueChange };
