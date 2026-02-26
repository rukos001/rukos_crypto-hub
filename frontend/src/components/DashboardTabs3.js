import React from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Progress } from '../components/ui/progress';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell
} from 'recharts';
import { 
  Shield, AlertOctagon, AlertTriangle, Zap, Target, Eye, Brain, 
  Wallet, TrendingUp, TrendingDown, MessageCircle, ArrowRightLeft,
  Flame, Activity
} from 'lucide-react';
import { 
  SectionHeader, MetricCard, CustomTooltip, LoadingSkeleton,
  formatNumber, formatPct, ValueChange, formatCompact
} from './DashboardTabs';

// ==================== RISK ENGINE TAB ====================
export const RiskEngineTab = ({ data, loading }) => {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">No data available</div>;

  const riskLevel = data.risk_score?.level;
  const riskColor = 
    riskLevel === 'EXTREME' ? '#EF4444' :
    riskLevel === 'HIGH' ? '#F59E0B' :
    riskLevel === 'MEDIUM' ? '#F7931A' : '#10B981';

  const radarData = Object.entries(data.risk_score?.factors || {}).map(([key, value]) => ({
    factor: key.replace('_', ' ').toUpperCase(),
    value: value
  }));

  return (
    <div className="space-y-6">
      {/* Risk Score Banner */}
      <div 
        className="p-6 rounded-xl border-2"
        style={{ borderColor: riskColor, backgroundColor: `${riskColor}10` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Overall Risk Score</p>
            <p className="text-6xl font-bold font-mono" style={{ color: riskColor }}>
              {data.risk_score?.overall?.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">/10</p>
          </div>
          <Badge className="text-xl px-6 py-3" style={{ backgroundColor: `${riskColor}30`, color: riskColor }}>
            {riskLevel}
          </Badge>
        </div>
      </div>

      {/* Overheat Alerts */}
      {data.overheat_alerts?.length > 0 && (
        <Card className="glass-card border-[#EF4444]/30 bg-[#EF4444]/5">
          <CardHeader className="pb-2">
            <SectionHeader icon={AlertOctagon} title="OVERHEAT ALERTS" badgeColor="text-[#EF4444]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.overheat_alerts.map((alert, i) => (
                <div key={i} className={`p-4 rounded-xl ${alert.severity === 'HIGH' ? 'bg-[#EF4444]/10' : 'bg-[#F59E0B]/10'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={alert.severity === 'HIGH' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}>
                      {alert.type}
                    </Badge>
                    <span className={`font-mono ${alert.severity === 'HIGH' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                      {alert.value}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-[#F7931A] mt-2">Action: {alert.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors Radar */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Shield} title="Risk Factors" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: '#A1A1AA', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#52525B', fontSize: 10 }} />
                <Radar name="Risk" dataKey="value" stroke="#F7931A" fill="#F7931A" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Volatility & Market Regime */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={Activity} title="Volatility Index" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">BTC DVOL</span>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-[#F7931A]">{data.volatility?.dvol_btc}</span>
                <Badge className="ml-2" variant="outline">{data.volatility?.status}</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">ETH DVOL</span>
              <span className="font-mono text-xl">{data.volatility?.dvol_eth}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={Target} title="Market Regime" />
          </CardHeader>
          <CardContent>
            <div className="text-center p-4">
              <p className="text-3xl font-bold text-[#F7931A]">{data.market_regime?.current}</p>
              <p className="text-sm text-muted-foreground mt-2">{data.market_regime?.description}</p>
              <Progress value={data.market_regime?.score} className="mt-4 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leverage & Stablecoin Flows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={Zap} title="Leverage Crowding" />
          </CardHeader>
          <CardContent>
            <div className="text-center p-4">
              <p className="text-4xl font-bold font-mono" style={{ 
                color: data.leverage_crowding?.status === 'DANGEROUS' ? '#EF4444' : 
                       data.leverage_crowding?.status === 'ELEVATED' ? '#F59E0B' : '#10B981' 
              }}>
                {data.leverage_crowding?.score?.toFixed(1)}
              </p>
              <Badge className="mt-2" style={{ 
                backgroundColor: data.leverage_crowding?.status === 'DANGEROUS' ? '#EF444420' : 
                                data.leverage_crowding?.status === 'ELEVATED' ? '#F59E0B20' : '#10B98120',
                color: data.leverage_crowding?.status === 'DANGEROUS' ? '#EF4444' : 
                       data.leverage_crowding?.status === 'ELEVATED' ? '#F59E0B' : '#10B981'
              }}>
                {data.leverage_crowding?.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={ArrowRightLeft} title="Stablecoin Flows (7d)" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">USDT Minted</span>
              <span className={`font-mono ${data.stablecoin_flows?.usdt_minted_7d >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {formatNumber(data.stablecoin_flows?.usdt_minted_7d)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">USDC Minted</span>
              <span className={`font-mono ${data.stablecoin_flows?.usdc_minted_7d >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {formatNumber(data.stablecoin_flows?.usdc_minted_7d)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between">
              <span className="font-semibold">Signal</span>
              <Badge className={data.stablecoin_flows?.signal === 'BULLISH' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}>
                {data.stablecoin_flows?.signal}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Reserves */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Wallet} title="Exchange Reserves" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="text-sm text-muted-foreground">BTC on Exchanges</p>
              <p className="text-2xl font-bold font-mono">{data.exchange_reserves?.btc_reserve?.toLocaleString()} BTC</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">30d Change</p>
              <p className={`font-mono ${data.exchange_reserves?.btc_change_30d_pct >= 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                {data.exchange_reserves?.btc_change_30d_pct >= 0 ? '+' : ''}{data.exchange_reserves?.btc_change_30d_pct}%
              </p>
              <Badge className="mt-1" variant="outline">
                {data.exchange_reserves?.signal}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== AI SIGNALS TAB ====================
export const AISignalsTab = ({ data, loading }) => {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">No data available</div>;

  const signal = data.composite_signal;
  const signalColor = signal?.direction === 'BULLISH' ? '#10B981' : signal?.direction === 'BEARISH' ? '#EF4444' : '#F59E0B';

  const factorsData = Object.entries(signal?.factors || {}).map(([key, value]) => ({
    name: key.toUpperCase(),
    value: value,
    fill: value > 0 ? '#10B981' : '#EF4444'
  }));

  return (
    <div className="space-y-6">
      {/* Composite Signal */}
      <div 
        className="p-6 rounded-xl border-2"
        style={{ borderColor: signalColor, backgroundColor: `${signalColor}10` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">AI Composite Signal</p>
            <p className="text-5xl font-bold font-mono" style={{ color: signalColor }}>
              {signal?.direction}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Strength: {signal?.strength?.toFixed(0)}%</p>
          </div>
          <Brain className="w-16 h-16" style={{ color: signalColor }} />
        </div>
      </div>

      {/* Factor Breakdown */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Target} title="Signal Factors" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[-1, 1]} tick={{ fill: '#52525B', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 10 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {factorsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Squeeze Probabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={TrendingUp} title="Short Squeeze Probability" />
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-[#10B981]">
                {data.squeeze_probability?.short_squeeze?.toFixed(0)}%
              </p>
              <Progress value={data.squeeze_probability?.short_squeeze} className="mt-4 h-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={TrendingDown} title="Long Squeeze Probability" />
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold font-mono text-[#EF4444]">
                {data.squeeze_probability?.long_squeeze?.toFixed(0)}%
              </p>
              <Progress value={data.squeeze_probability?.long_squeeze} className="mt-4 h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Range Prediction */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Activity} title="Predicted Weekly Range" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Low</p>
              <p className="text-2xl font-bold font-mono text-[#EF4444]">
                ${data.weekly_range?.predicted_low?.toLocaleString()}
              </p>
            </div>
            <div className="flex-1 mx-8">
              <div className="h-2 bg-gradient-to-r from-[#EF4444] via-[#F7931A] to-[#10B981] rounded-full" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                Range: {data.weekly_range?.range_pct}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">High</p>
              <p className="text-2xl font-bold font-mono text-[#10B981]">
                ${data.weekly_range?.predicted_high?.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liquidity Zones */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Eye} title="Liquidity Vacuum Zones" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.liquidity_zones?.map((zone, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className={`font-mono text-sm w-28 ${zone.type === 'demand' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  ${zone.price.toLocaleString()}
                </span>
                <Badge className={`w-20 justify-center ${zone.type === 'demand' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                  {zone.type.toUpperCase()}
                </Badge>
                <div className="flex-1">
                  <div 
                    className={`h-4 rounded ${zone.type === 'demand' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                    style={{ width: `${zone.strength}%`, opacity: 0.4 + zone.strength / 200 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12">{zone.strength.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Levels */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Target} title="Key Levels" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-[#10B981]/10 text-center">
              <p className="text-xs text-muted-foreground">Strong Support</p>
              <p className="font-mono font-bold text-[#10B981]">
                ${data.key_levels?.strong_support?.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#10B981]/5 text-center">
              <p className="text-xs text-muted-foreground">Immediate Support</p>
              <p className="font-mono font-bold text-[#10B981]">
                ${data.key_levels?.immediate_support?.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#EF4444]/5 text-center">
              <p className="text-xs text-muted-foreground">Immediate Resistance</p>
              <p className="font-mono font-bold text-[#EF4444]">
                ${data.key_levels?.immediate_resistance?.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#EF4444]/10 text-center">
              <p className="text-xs text-muted-foreground">Strong Resistance</p>
              <p className="font-mono font-bold text-[#EF4444]">
                ${data.key_levels?.strong_resistance?.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Need to import Cell for BarChart
import { Cell } from 'recharts';
