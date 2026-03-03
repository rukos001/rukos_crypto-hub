import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Zap, ExternalLink, BarChart3, PieChart, Target, Activity } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

const API = process.env.REACT_APP_BACKEND_URL;

const formatVolume = (v) => {
  if (!v) return '$0';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const ProbBar = ({ yes, no, outcomes, t }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs font-medium">
      <span className="text-emerald-400">{outcomes?.[0] || t('yes')} {yes}%</span>
      <span className="text-rose-400">{outcomes?.[1] || t('no')} {no}%</span>
    </div>
    <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
      <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${yes}%` }} />
      <div className="bg-rose-500 transition-all duration-500" style={{ width: `${no}%` }} />
    </div>
  </div>
);

const EventCard = ({ event, rank, t }) => (
  <Card className="glass-card hover:border-[#F7931A]/30 transition-all duration-200 group" data-testid={`prediction-event-${rank}`}>
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/40">
          #{rank}
        </div>
        {event.image && (
          <img src={event.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <a
            href={event.url || `https://polymarket.com/event/${event.slug || event.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold hover:text-[#F7931A] transition-colors line-clamp-2 flex items-start gap-1"
            data-testid={`event-link-${rank}`}
          >
            {event.title}
            <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
          {event.category && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1 border-white/10 text-white/40">
              {event.category}
            </Badge>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
            <span>{t('volume')}: {formatVolume(event.volume)}</span>
            {event.volume_24h > 0 && (
              <span className="text-[#F7931A]">24ч: {formatVolume(event.volume_24h)}</span>
            )}
            {event.liquidity > 0 && <span>{t('liquidity')}: {formatVolume(event.liquidity)}</span>}
          </div>
          <div className="mt-2.5">
            <ProbBar yes={event.yes_probability} no={event.no_probability} outcomes={event.outcomes} t={t} />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Analytics Section Component
const AnalyticsSection = ({ analytics, t }) => {
  if (!analytics) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Market Activity */}
      <Card className="glass-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[#F7931A]" />
            <span className="text-xs text-white/50">{t('market_activity_24h')}</span>
          </div>
          <p className="text-xl font-bold font-mono text-[#F7931A]">{analytics.market_activity}%</p>
          <p className="text-xs text-white/30">{t('daily_turnover')}</p>
        </CardContent>
      </Card>
      
      {/* Average Probability */}
      <Card className="glass-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-white/50">{t('avg_probability')}</span>
          </div>
          <p className="text-xl font-bold font-mono">{analytics.avg_yes_probability}%</p>
          <p className="text-xs text-white/30">{t('avg_yes_across_markets')}</p>
        </CardContent>
      </Card>
      
      {/* High Confidence Events */}
      <Card className="glass-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-white/50">{t('high_confidence')}</span>
          </div>
          {analytics.high_confidence_events?.length > 0 ? (
            <div className="space-y-1">
              {analytics.high_confidence_events.slice(0, 2).map((ev, i) => (
                <a 
                  key={i} 
                  href={ev.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-xs hover:text-[#F7931A] transition-colors truncate"
                >
                  <span className={ev.direction === 'yes' ? 'text-emerald-400' : 'text-rose-400'}>
                    {ev.probability}%
                  </span>{' '}
                  {ev.title.substring(0, 30)}...
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30">{t('no_high_confidence')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const PredictionsTab = () => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/api/predictions`);
      setData(res.data);
    } catch (err) {
      console.error('Predictions fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center py-20 text-white/40">{t('loading')} Polymarket...</div>;
  if (!data || !data.top_events?.length) return <div className="text-center py-20 text-white/40">{t('no_data')} Polymarket</div>;

  return (
    <div className="space-y-5" data-testid="predictions-tab">
      {/* Header stats */}
      <div className="flex flex-wrap items-center gap-4">
        <Badge variant="outline" className="border-[#F7931A]/30 text-[#F7931A] px-3 py-1">
          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
          {data.active_markets} {t('markets')}
        </Badge>
        <Badge variant="outline" className="border-white/10 text-white/50 px-3 py-1">
          {t('total_volume')}: {formatVolume(data.total_volume)}
        </Badge>
        {data.total_liquidity > 0 && (
          <Badge variant="outline" className="border-white/10 text-white/50 px-3 py-1">
            {t('total_liquidity')}: {formatVolume(data.total_liquidity)}
          </Badge>
        )}
        {data.volume_24h > 0 && (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 px-3 py-1">
            24ч: {formatVolume(data.volume_24h)}
          </Badge>
        )}
        <span className="text-xs text-white/30 ml-auto">{t('source_label')}: Polymarket</span>
      </div>
      
      {/* Analytics Section */}
      {data.analytics && <AnalyticsSection analytics={data.analytics} t={t} />}

      {/* Extreme mover alert */}
      {data.extreme_mover && (
        <Card className="border-[#F7931A]/40 bg-[#F7931A]/5" data-testid="extreme-mover-card">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#F7931A]" />
              {t('extreme_change')}
              <Badge variant="outline" className="border-[#F7931A]/50 text-[#F7931A] text-xs ml-auto">
                {t('activity')}: {data.extreme_mover.activity_score}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <a
              href={data.extreme_mover.url || `https://polymarket.com/event/${data.extreme_mover.slug || data.extreme_mover.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium mb-2 hover:text-[#F7931A] transition-colors flex items-center gap-1"
            >
              {data.extreme_mover.title}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <ProbBar
              yes={data.extreme_mover.yes_probability}
              no={data.extreme_mover.no_probability}
              outcomes={data.extreme_mover.outcomes}
              t={t}
            />
            <div className="flex gap-3 mt-2 text-xs text-white/40">
              <span>{t('volume')}: {formatVolume(data.extreme_mover.volume)}</span>
              <span className="text-[#F7931A]">24ч: {formatVolume(data.extreme_mover.volume_24h)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 10 events */}
      <div className="grid gap-3">
        {data.top_events.map((event, i) => (
          <EventCard key={event.id} event={event} rank={i + 1} t={t} />
        ))}
      </div>
    </div>
  );
};

export default PredictionsTab;
