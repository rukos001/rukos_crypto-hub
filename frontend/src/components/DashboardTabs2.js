import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Wallet, 
  ArrowRightLeft, Flame, Users
} from 'lucide-react';
import { 
  SectionHeader, MetricCard, CustomTooltip, LoadingSkeleton,
  formatNumber, formatPct, ValueChange 
} from './DashboardTabs';

// ==================== ETF INTELLIGENCE TAB ====================
export const ETFIntelligenceTab = ({ data, loading }) => {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">No data available</div>;

  const btc = data.btc_etf;
  const eth = data.eth_etf;

  // Prepare chart data
  const flowChartData = data.flow_history?.map(d => ({
    date: d.date_short,
    btc: d.btc_flow / 1e6,
    eth: d.eth_flow / 1e6
  })) || [];

  return (
    <div className="space-y-6">
      {/* ETF Absorption Signal */}
      <div className={`p-4 rounded-xl border-2 ${data.etf_absorption?.signal ? 'border-[#10B981] bg-[#10B981]/10' : 'border-[#F59E0B] bg-[#F59E0B]/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className={`w-6 h-6 ${data.etf_absorption?.signal ? 'text-[#10B981]' : 'text-[#F59E0B]'}`} />
            <div>
              <p className="font-bold">ETF Absorption Signal</p>
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

      {/* BTC & ETH ETF Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BTC ETF */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={TrendingUp} title="BTC ETF" badge="BlackRock, Fidelity..." />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 rounded-xl bg-[#F7931A]/10">
              <p className="text-sm text-muted-foreground">Total AUM</p>
              <p className="text-3xl font-bold font-mono text-[#F7931A]">{formatNumber(btc?.total_aum)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Daily Net Flow</p>
                <p className={`font-mono font-semibold ${btc?.daily_net_flow >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {btc?.daily_net_flow >= 0 ? '+' : ''}{formatNumber(btc?.daily_net_flow)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Cumulative</p>
                <p className="font-mono font-semibold text-[#F7931A]">{formatNumber(btc?.cumulative_flow)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">% of Spot Volume</span>
                <span className="font-mono">{btc?.pct_of_spot_volume}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Premium/Discount</span>
                <span className={`font-mono ${btc?.premium_discount >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {btc?.premium_discount >= 0 ? '+' : ''}{btc?.premium_discount}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Flow-Price Correlation</span>
                <span className="font-mono">{btc?.flow_price_correlation}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ETH ETF */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={TrendingUp} title="ETH ETF" badge="BlackRock, Fidelity..." />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 rounded-xl bg-[#3B82F6]/10">
              <p className="text-sm text-muted-foreground">Total AUM</p>
              <p className="text-3xl font-bold font-mono text-[#3B82F6]">{formatNumber(eth?.total_aum)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Daily Net Flow</p>
                <p className={`font-mono font-semibold ${eth?.daily_net_flow >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {eth?.daily_net_flow >= 0 ? '+' : ''}{formatNumber(eth?.daily_net_flow)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Cumulative</p>
                <p className="font-mono font-semibold text-[#3B82F6]">{formatNumber(eth?.cumulative_flow)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">% of Spot Volume</span>
                <span className="font-mono">{eth?.pct_of_spot_volume}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Premium/Discount</span>
                <span className={`font-mono ${eth?.premium_discount >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {eth?.premium_discount >= 0 ? '+' : ''}{eth?.premium_discount}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flow History Chart */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Activity} title="Daily Net Flows" badge="14 Days" />
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

      {/* Fund Breakdown */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Wallet} title="Fund Breakdown" badge="Daily Flow" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold mb-3">BTC ETFs</p>
              <div className="space-y-2">
                {btc?.funds?.map((fund, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <div>
                      <span className="font-semibold">{fund.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{fund.issuer}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{formatNumber(fund.aum)}</p>
                      <p className={`text-xs font-mono ${fund.daily_flow >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {fund.daily_flow >= 0 ? '+' : ''}{formatNumber(fund.daily_flow)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">ETH ETFs</p>
              <div className="space-y-2">
                {eth?.funds?.map((fund, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <div>
                      <span className="font-semibold">{fund.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{fund.issuer}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{formatNumber(fund.aum)}</p>
                      <p className={`text-xs font-mono ${fund.daily_flow >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {fund.daily_flow >= 0 ? '+' : ''}{formatNumber(fund.daily_flow)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Miner Metrics */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Flame} title="Miner Activity" />
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
export const OnchainTab = ({ data, loading }) => {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">No data available</div>;

  const metrics = data.metrics;
  const COLORS = ['#F7931A', '#3B82F6', '#10B981', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Key Onchain Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="SOPR" 
          value={metrics?.sopr?.toFixed(4)}
          status={metrics?.sopr_status?.toUpperCase()}
        />
        <MetricCard 
          title="NUPL" 
          value={metrics?.nupl?.toFixed(3)}
          status={metrics?.nupl_zone?.toUpperCase()}
        />
        <MetricCard 
          title="MVRV" 
          value={metrics?.mvrv?.toFixed(2)}
          status={metrics?.mvrv_signal?.toUpperCase()}
        />
        <MetricCard 
          title="CDD (7d)" 
          value={formatNumber(metrics?.cdd_7d_avg).replace('$', '')}
          status={metrics?.cdd_status?.toUpperCase()}
        />
      </div>

      {/* Realized vs Market Cap */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Activity} title="Realized vs Market Cap" />
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

      {/* Exchange Flows */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={ArrowRightLeft} title="Exchange Flows (24h)" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['BTC', 'ETH', 'stablecoins'].map(asset => {
              const flow = data.exchange_flows?.[asset];
              if (!flow) return null;
              const netflow = asset === 'stablecoins' 
                ? flow.inflow_24h - flow.outflow_24h 
                : flow.netflow_24h;
              const isOutflow = netflow > 0;
              
              return (
                <div key={asset} className="p-4 rounded-xl bg-secondary/30">
                  <p className="text-sm font-semibold mb-3">{asset.toUpperCase()}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inflow</span>
                      <span className="font-mono text-[#EF4444]">
                        {asset === 'stablecoins' ? formatNumber(flow.inflow_24h) : `${formatNumber(flow.inflow_24h).replace('$', '')} ${asset}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outflow</span>
                      <span className="font-mono text-[#10B981]">
                        {asset === 'stablecoins' ? formatNumber(flow.outflow_24h) : `${formatNumber(flow.outflow_24h).replace('$', '')} ${asset}`}
                      </span>
                    </div>
                    <div className={`flex justify-between pt-2 border-t border-white/10 ${isOutflow ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      <span>Net Flow</span>
                      <span className="font-mono font-semibold">
                        {isOutflow ? 'OUTFLOW' : 'INFLOW'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Whale Accumulation Zones */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={TrendingUp} title="Whale Accumulation Zones" />
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
          <SectionHeader icon={Wallet} title="Notable BTC Holders" badge="Top Entities" />
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
                    <p className="font-mono text-[#F7931A]">{wallet.btc.toLocaleString()} BTC</p>
                    <p className={`text-xs font-mono ${wallet.change_30d >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {wallet.change_30d >= 0 ? '+' : ''}{wallet.change_30d.toLocaleString()} (30d)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Miner Reserves */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Flame} title="Miner Reserves" />
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
    </div>
  );
};

// ==================== ALTSEASON MONITOR TAB ====================
export const AltseasonTab = ({ data, loading }) => {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">No data available</div>;

  const score = data.altseason_probability || 0;
  const status = data.altseason_status;
  const statusColor = status === 'ALTSEASON' ? '#10B981' : status === 'WARMING UP' ? '#F7931A' : '#EF4444';

  const domPieData = [
    { name: 'BTC', value: data.dominance?.btc || 0 },
    { name: 'ETH', value: data.dominance?.eth || 0 },
    { name: 'SOL', value: data.dominance?.sol || 0 },
    { name: 'Other', value: data.dominance?.other || 0 },
  ];
  const COLORS = ['#F7931A', '#3B82F6', '#10B981', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Altseason Score */}
      <div className="p-6 rounded-xl border-2" style={{ borderColor: statusColor, backgroundColor: `${statusColor}10` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Altseason Probability</p>
            <p className="text-5xl font-bold font-mono" style={{ color: statusColor }}>{score.toFixed(0)}</p>
          </div>
          <Badge className="text-lg px-4 py-2" style={{ backgroundColor: `${statusColor}30`, color: statusColor }}>
            {status}
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
          <SectionHeader icon={Activity} title="Dominance Breakdown" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="w-[180px] h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={domPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    labelLine={false}
                  >
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
          <SectionHeader icon={TrendingUp} title="Sector Performance (7d)" />
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
          <SectionHeader icon={Users} title="Top Coins vs BTC (7d)" badge={`${data.outperforming_count}/20 outperforming`} />
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
          <SectionHeader icon={Flame} title="Narrative Heatmap" />
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
                  <Badge variant="outline" className="text-xs border-white/10">
                    {n.trend}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DeFi TVL */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Activity} title="DeFi TVL" />
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
