import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { 
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell
} from 'recharts';
import { 
  Shield, AlertOctagon, Zap, Target, Eye, Brain, 
  Wallet, TrendingUp, TrendingDown,
  ArrowRightLeft, Activity
} from 'lucide-react';
import { 
  SectionHeader, MetricCard, CustomTooltip, LoadingSkeleton,
  formatNumber, ValueChange
} from './DashboardTabs';
import { useLanguage } from '../context/LanguageContext';
import { InfoTooltip, SourceLink } from './InfoComponents';

// ==================== RISK ENGINE TAB ====================
export const RiskEngineTab = ({ data, loading }) => {
  const { t } = useLanguage();

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">{t('no_data')}</div>;

  // Translate risk level
  const translateRiskLevel = (level) => {
    const translations = {
      'EXTREME': t('status_extreme'),
      'HIGH': t('status_high'),
      'MEDIUM': t('status_medium'),
      'LOW': t('status_low'),
      'CRITICAL': t('status_critical'),
      'ELEVATED': t('status_elevated'),
      'DANGEROUS': t('status_dangerous'),
      'NORMAL': t('status_normal'),
    };
    return translations[level] || level;
  };

  // Translate alert type
  const translateAlertType = (type) => {
    const translations = {
      'FUNDING_SPIKE': t('alert_funding_spike'),
      'OI_PRICE_DIVERGENCE': t('alert_oi_divergence'),
      'WHALE_MOVE': t('alert_whale_move'),
      'LIQUIDATION': t('alert_liquidation'),
    };
    return translations[type] || type;
  };

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
      {/* Tab description */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
        <p className="text-sm text-muted-foreground">{t('risk_desc')}</p>
        <SourceLink source="coinglass" label="CoinGlass" />
      </div>

      {/* Risk Score Banner */}
      <div className="p-6 rounded-xl border-2" style={{ borderColor: riskColor, backgroundColor: `${riskColor}10` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider flex items-center">
              {t('risk_score')}
              <InfoTooltip text={t('risk_score_desc')} />
            </p>
            <p className="text-6xl font-bold font-mono" style={{ color: riskColor }}>
              {data.risk_score?.overall?.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">/10</p>
          </div>
          <Badge className="text-xl px-6 py-3" style={{ backgroundColor: `${riskColor}30`, color: riskColor }}>
            {translateRiskLevel(riskLevel)}
          </Badge>
        </div>
      </div>

      {/* Overheat Alerts */}
      {data.overheat_alerts?.length > 0 && (
        <Card className="glass-card border-[#EF4444]/30 bg-[#EF4444]/5">
          <CardHeader className="pb-2">
            <SectionHeader icon={AlertOctagon} title={t('overheat_alerts')} tooltip={t('overheat_alerts_desc')} badgeColor="text-[#EF4444]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.overheat_alerts.map((alert, i) => (
                <div key={i} className={`p-4 rounded-xl ${alert.severity === 'HIGH' ? 'bg-[#EF4444]/10' : 'bg-[#F59E0B]/10'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={alert.severity === 'HIGH' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}>
                      {translateAlertType(alert.type)}
                    </Badge>
                    <span className={`font-mono ${alert.severity === 'HIGH' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                      {alert.value}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-[#F7931A] mt-2">{t('action')}: {alert.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors Radar */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Shield} title={t('risk_factors') || 'Факторы риска'} />
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
            <SectionHeader icon={Activity} title={t('volatility_index')} tooltip={t('volatility_desc')} source="deribit" sourceLabel="Deribit" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('btc_dvol')}</span>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-[#F7931A]">{data.volatility?.dvol_btc}</span>
                <Badge className="ml-2" variant="outline">{data.volatility?.status}</Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('eth_dvol')}</span>
              <span className="font-mono text-xl">{data.volatility?.dvol_eth}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={Target} title={t('market_regime_risk')} tooltip={t('market_regime_risk_desc')} />
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
            <SectionHeader icon={Zap} title={t('leverage_crowding')} tooltip={t('leverage_crowding_desc')} source="coinglass" sourceLabel="CoinGlass" />
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
            <SectionHeader icon={ArrowRightLeft} title={t('stablecoin_flows')} tooltip={t('stablecoin_flows_desc')} source="glassnode" sourceLabel="Glassnode" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('usdt_minted')}</span>
              <span className={`font-mono ${data.stablecoin_flows?.usdt_minted_7d >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {formatNumber(data.stablecoin_flows?.usdt_minted_7d)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('usdc_minted')}</span>
              <span className={`font-mono ${data.stablecoin_flows?.usdc_minted_7d >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {formatNumber(data.stablecoin_flows?.usdc_minted_7d)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between">
              <span className="font-semibold">{t('signal')}</span>
              <Badge className={data.stablecoin_flows?.signal === 'BULLISH' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}>
                {data.stablecoin_flows?.signal === 'BULLISH' ? t('bullish').toUpperCase() : t('neutral').toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Reserves */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Wallet} title={t('exchange_reserves') || 'Резервы на биржах'} source="glassnode" sourceLabel="Glassnode" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="text-sm text-muted-foreground">{t('btc_on_exchanges')}</p>
              <p className="text-2xl font-bold font-mono">{data.exchange_reserves?.btc_reserve?.toLocaleString()} BTC</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('change_30d')}</p>
              <p className={`font-mono ${data.exchange_reserves?.btc_change_30d_pct >= 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                {data.exchange_reserves?.btc_change_30d_pct >= 0 ? '+' : ''}{data.exchange_reserves?.btc_change_30d_pct}%
              </p>
              <Badge className="mt-1" variant="outline">{data.exchange_reserves?.signal}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== AI SIGNALS TAB ====================
export const AISignalsTab = ({ data, loading }) => {
  const { t } = useLanguage();

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">{t('no_data')}</div>;

  const signal = data.composite_signal;
  const signalColor = signal?.direction === 'BULLISH' ? '#10B981' : signal?.direction === 'BEARISH' ? '#EF4444' : '#F59E0B';

  // Translate signal direction
  const translateDirection = (dir) => {
    const translations = {
      'BULLISH': t('bullish').toUpperCase(),
      'BEARISH': t('bearish').toUpperCase(),
      'NEUTRAL': t('neutral').toUpperCase(),
    };
    return translations[dir] || dir;
  };

  const factorsData = Object.entries(signal?.factors || {}).map(([key, value]) => ({
    name: key.toUpperCase(),
    value: value,
    fill: value > 0 ? '#10B981' : '#EF4444'
  }));

  return (
    <div className="space-y-6">
      {/* Tab description */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
        <p className="text-sm text-muted-foreground">{t('ai_desc')}</p>
      </div>

      {/* Composite Signal */}
      <div className="p-6 rounded-xl border-2" style={{ borderColor: signalColor, backgroundColor: `${signalColor}10` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider flex items-center">
              {t('composite_signal')}
              <InfoTooltip text={t('composite_signal_desc')} />
            </p>
            <p className="text-5xl font-bold font-mono" style={{ color: signalColor }}>
              {translateDirection(signal?.direction)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t('strength')}: {signal?.strength?.toFixed(0)}%</p>
          </div>
          <Brain className="w-16 h-16" style={{ color: signalColor }} />
        </div>
      </div>

      {/* Factor Breakdown */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Target} title={t('signal_factors') || 'Факторы сигнала'} />
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
            <SectionHeader icon={TrendingUp} title={t('squeeze_probability')} tooltip={t('squeeze_desc')} />
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{t('short_squeeze') || 'Сквиз шортов'}</p>
              <p className="text-4xl font-bold font-mono text-[#10B981]">
                {data.squeeze_probability?.short_squeeze?.toFixed(0)}%
              </p>
              <Progress value={data.squeeze_probability?.short_squeeze} className="mt-4 h-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <SectionHeader icon={TrendingDown} title={t('squeeze_probability')} tooltip={t('squeeze_desc')} />
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{t('long_squeeze') || 'Сквиз лонгов'}</p>
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
          <SectionHeader icon={Activity} title={t('weekly_range')} tooltip={t('weekly_range_desc')} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('low')}</p>
              <p className="text-2xl font-bold font-mono text-[#EF4444]">
                ${data.weekly_range?.predicted_low?.toLocaleString()}
              </p>
            </div>
            <div className="flex-1 mx-8">
              <div className="h-2 bg-gradient-to-r from-[#EF4444] via-[#F7931A] to-[#10B981] rounded-full" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                {t('range')}: {data.weekly_range?.range_pct}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('high')}</p>
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
          <SectionHeader icon={Eye} title={t('liquidity_zones')} tooltip={t('liquidity_zones_desc')} source="coinglass" sourceLabel="CoinGlass" />
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
          <SectionHeader icon={Target} title={t('key_levels')} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-[#10B981]/10 text-center">
              <p className="text-xs text-muted-foreground">{t('strong_support')}</p>
              <p className="font-mono font-bold text-[#10B981]">${data.key_levels?.strong_support?.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#10B981]/5 text-center">
              <p className="text-xs text-muted-foreground">{t('immediate_support')}</p>
              <p className="font-mono font-bold text-[#10B981]">${data.key_levels?.immediate_support?.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#EF4444]/5 text-center">
              <p className="text-xs text-muted-foreground">{t('immediate_resistance')}</p>
              <p className="font-mono font-bold text-[#EF4444]">${data.key_levels?.immediate_resistance?.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#EF4444]/10 text-center">
              <p className="text-xs text-muted-foreground">{t('strong_resistance')}</p>
              <p className="font-mono font-bold text-[#EF4444]">${data.key_levels?.strong_resistance?.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
