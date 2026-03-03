import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Wallet, Target, Shield, AlertOctagon, Zap, TrendingUp, TrendingDown
} from 'lucide-react';
import { 
  SectionHeader, MetricCard, LoadingSkeleton, formatNumber, ValueChange
} from './DashboardTabs';
import { useLanguage } from '../context/LanguageContext';
import { InfoTooltip } from './InfoComponents';
import { TermLink, InfoButton } from './shared/TermLink';

// ==================== PORTFOLIO TAB ====================
export const PortfolioTab = ({ data, loading }) => {
  const { t } = useLanguage();

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">{t('no_data')}</div>;

  const pnlColor = data.summary?.unrealized_pnl >= 0 ? '#10B981' : '#EF4444';

  return (
    <div className="space-y-6">
      {/* Tab description */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
        <p className="text-sm text-muted-foreground">{t('portfolio_desc')}</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#F7931A]/20 to-transparent border border-[#F7931A]/30">
          <p className="text-sm text-muted-foreground">{t('total_value')}</p>
          <p className="text-3xl font-bold font-mono text-[#F7931A]">
            {formatNumber(data.summary?.total_value)}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-secondary/30 border border-white/5">
          <p className="text-sm text-muted-foreground">{t('unrealized_pnl')}</p>
          <p className="text-3xl font-bold font-mono" style={{ color: pnlColor }}>
            {data.summary?.unrealized_pnl >= 0 ? '+' : ''}{formatNumber(data.summary?.unrealized_pnl)}
          </p>
          <p className="text-sm font-mono" style={{ color: pnlColor }}>
            ({data.summary?.unrealized_pnl_pct >= 0 ? '+' : ''}{data.summary?.unrealized_pnl_pct?.toFixed(2)}%)
          </p>
        </div>
        <div className="p-6 rounded-xl bg-secondary/30 border border-white/5">
          <p className="text-sm text-muted-foreground">{t('account_balance')}</p>
          <p className="text-3xl font-bold font-mono">
            {formatNumber(data.summary?.account_balance)}
          </p>
        </div>
      </div>

      {/* Positions */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Wallet} title={t('positions')} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.positions?.map((pos, i) => (
              <div key={i} className="p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FFD700] flex items-center justify-center font-bold text-black">
                      {pos.asset}
                    </div>
                    <div>
                      <p className="font-semibold">{pos.asset}</p>
                      <p className="text-sm text-muted-foreground">{pos.size} {t('units_at')} ${pos.entry?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold ${pos.pnl_usd >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {pos.pnl_usd >= 0 ? '+' : ''}{formatNumber(pos.pnl_usd)}
                    </p>
                    <p className={`text-sm font-mono ${pos.pnl_pct >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      ({pos.pnl_pct >= 0 ? '+' : ''}{pos.pnl_pct?.toFixed(2)}%)
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">{t('avg_leverage')}</p>
                    <p className="font-mono">{pos.leverage?.toFixed(1)}x</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('value')}</p>
                    <p className="font-mono">{formatNumber(pos.value_usd)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('exposure')}</p>
                    <p className="font-mono">{pos.exposure_pct?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{t('liq_distance')}</p>
                    <p className={`font-mono ${pos.distance_to_liq_pct < 10 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                      {pos.distance_to_liq_pct?.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {pos.liquidation_price > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('liquidation_price')}</span>
                    <span className="font-mono text-[#EF4444]">${pos.liquidation_price?.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Shield} title={t('risk_metrics')} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground">{t('avg_leverage')}</p>
              <p className="font-mono font-bold text-lg">{data.risk_metrics?.avg_leverage?.toFixed(2)}x</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground">{t('risk_per_trade')}</p>
              <p className="font-mono font-bold text-lg">{formatNumber(data.risk_metrics?.risk_per_trade)}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground">{t('leverage_exposure')}</p>
              <p className="font-mono font-bold text-lg">{formatNumber(data.risk_metrics?.total_leverage_exposure)}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center">
                {t('risk_of_ruin')}
                <InfoTooltip text={t('risk_of_ruin_desc')} />
              </p>
              <p className={`font-mono font-bold text-lg ${data.risk_metrics?.risk_of_ruin_pct > 20 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                {data.risk_metrics?.risk_of_ruin_pct?.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground">{t('liq_distance')} ({t('min')})</p>
              <p className={`font-mono font-bold text-lg ${data.risk_metrics?.min_distance_to_liq < 10 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                {data.risk_metrics?.min_distance_to_liq?.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Concentration Warning */}
      {data.concentration?.warning && (
        <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <p className="font-semibold text-[#F59E0B]">{t('concentration')}</p>
              <p className="text-sm text-muted-foreground">
                {data.concentration?.largest_position} position is {data.concentration?.largest_exposure_pct?.toFixed(1)}% of portfolio
              </p>
              <p className="text-xs text-[#F7931A] mt-1">{data.concentration?.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== WAR MODE TAB ====================
export const WarModeTab = ({ data, loading }) => {
  const { t } = useLanguage();

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-muted-foreground">{t('no_data')}</div>;

  // Translate stress level
  const translateStressLevel = (level) => {
    const translations = {
      'CRITICAL': t('status_critical'),
      'HIGH': t('status_high'),
      'ELEVATED': t('status_elevated'),
      'NORMAL': t('status_normal'),
      'LOW': t('status_low'),
    };
    return translations[level] || level;
  };

  // Translate alert type
  const translateAlertType = (type) => {
    const typeKey = type?.replace(/_/g, ' ');
    const translations = {
      'OI SPIKE': t('oi_spike') || 'СКАЧОК OI',
      'WHALE MOVE': t('whale_move') || 'ДВИЖЕНИЕ КИТОВ',
      'FUNDING SPIKE': t('funding_spike') || 'СКАЧОК ФАНДИНГА',
      'LIQUIDATION': t('liquidation') || 'ЛИКВИДАЦИЯ',
    };
    return translations[typeKey] || typeKey;
  };

  // Translate recommendation/message
  const translateMessage = (msg) => {
    if (!msg) return msg;
    const translations = {
      'Normal operations': 'Нормальная работа',
      'Monitor closely': 'Внимательно наблюдать',
      'Consider reducing exposure': 'Рассмотрите сокращение экспозиции',
      'Extreme funding rate detected': 'Обнаружена экстремальная ставка фандинга',
      'Large whale transaction detected': 'Обнаружена крупная транзакция кита',
      'Rapid OI change in last hour': 'Быстрое изменение OI за последний час',
      'Consider counter-trading the crowd': 'Рассмотрите торговлю против толпы',
      'Monitor exchange flows': 'Отслеживайте потоки на биржах',
      'Watch for liquidation cascade': 'Следите за каскадом ликвидаций',
    };
    return translations[msg] || msg;
  };

  const stressColor = 
    data.stress_level === 'CRITICAL' ? '#EF4444' :
    data.stress_level === 'HIGH' ? '#F59E0B' :
    data.stress_level === 'ELEVATED' ? '#F7931A' : '#10B981';

  return (
    <div className="space-y-6">
      {/* Tab description */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-white/5">
        <p className="text-sm text-muted-foreground">{t('war_desc')}</p>
      </div>

      {/* Stress Level Banner */}
      <div 
        className={`p-8 rounded-xl border-2 ${data.war_mode_active ? 'animate-pulse' : ''}`}
        style={{ borderColor: stressColor, backgroundColor: `${stressColor}15` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider flex items-center">
              {t('stress_level')}
              <InfoTooltip text={t('stress_level_desc')} />
            </p>
            <p className="text-6xl font-bold font-mono" style={{ color: stressColor }}>
              {data.stress_score}
            </p>
            <p className="text-sm text-muted-foreground">/100</p>
          </div>
          <div className="text-right">
            <Badge 
              className="text-2xl px-6 py-3 mb-4"
              style={{ backgroundColor: `${stressColor}30`, color: stressColor }}
            >
              {translateStressLevel(data.stress_level)}
            </Badge>
            {data.war_mode_active && (
              <div className="flex items-center gap-2 text-[#EF4444]">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
                <span className="font-bold">{t('war_mode_active')}</span>
              </div>
            )}
          </div>
        </div>
        <Progress value={data.stress_score} className="mt-4 h-3" />
        <p className="text-sm mt-4" style={{ color: stressColor }}>{translateMessage(data.recommendation)}</p>
      </div>

      {/* Active Alerts */}
      {data.alerts?.length > 0 ? (
        <Card className="glass-card border-[#EF4444]/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <SectionHeader icon={AlertOctagon} title={t('active_alerts')} />
              <Badge className="bg-[#EF4444]/20 text-[#EF4444]">
                {data.active_alerts} {t('alerts')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.alerts.map((alert, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-xl ${
                    alert.severity === 'HIGH' ? 'bg-[#EF4444]/10 border border-[#EF4444]/30' : 'bg-[#F59E0B]/10 border border-[#F59E0B]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-5 h-5 ${alert.severity === 'HIGH' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`} />
                      <Badge className={alert.severity === 'HIGH' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}>
                        {translateAlertType(alert.type)}
                      </Badge>
                    </div>
                    <span className={`font-mono font-bold ${alert.severity === 'HIGH' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                      {alert.value}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{translateMessage(alert.message)}</p>
                  <p className="text-xs text-[#F7931A] mt-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> {translateMessage(alert.action)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-[#10B981]/30 bg-[#10B981]/5">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-[#10B981] mb-4" />
            <p className="text-xl font-semibold text-[#10B981]">{t('all_clear')}</p>
            <p className="text-muted-foreground">{t('no_stress_signals')}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <SectionHeader icon={Target} title={t('quick_actions')} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 border-white/10 hover:bg-[#EF4444]/10 hover:border-[#EF4444]/30" data-testid="war-reduce-all">
              <div className="text-center">
                <TrendingDown className="w-6 h-6 mx-auto mb-2 text-[#EF4444]" />
                <p className="text-sm">{t('reduce_all')}</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4 border-white/10 hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]/30" data-testid="war-add-hedges">
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-[#F59E0B]" />
                <p className="text-sm">{t('add_hedges')}</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4 border-white/10 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/30" data-testid="war-set-stops">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-[#3B82F6]" />
                <p className="text-sm">{t('set_stops')}</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4 border-white/10 hover:bg-[#10B981]/10 hover:border-[#10B981]/30" data-testid="war-to-stables">
              <div className="text-center">
                <Wallet className="w-6 h-6 mx-auto mb-2 text-[#10B981]" />
                <p className="text-sm">{t('to_stables')}</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
