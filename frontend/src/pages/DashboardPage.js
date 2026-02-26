import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  AlertTriangle, Zap, Gauge, RefreshCw 
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatNumber = (num) => {
  if (!num) return '$0';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toLocaleString()}`;
};

const formatPrice = (price) => {
  if (!price) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg border border-white/10">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-mono">
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardPage = () => {
  const [prices, setPrices] = useState(null);
  const [etfFlows, setEtfFlows] = useState(null);
  const [whaleActivity, setWhaleActivity] = useState(null);
  const [liquidations, setLiquidations] = useState(null);
  const [fearGreed, setFearGreed] = useState(null);
  const [priceHistory, setPriceHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState('btc');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!priceHistory[selectedCoin]) {
      fetchPriceHistory(selectedCoin);
    }
  }, [selectedCoin]);

  const fetchData = async () => {
    try {
      const [pricesRes, etfRes, whaleRes, liqRes, fgRes] = await Promise.all([
        axios.get(`${API}/crypto/prices`),
        axios.get(`${API}/crypto/etf-flows`),
        axios.get(`${API}/crypto/whale-activity`),
        axios.get(`${API}/crypto/liquidations`),
        axios.get(`${API}/crypto/fear-greed`)
      ]);
      setPrices(pricesRes.data);
      setEtfFlows(etfRes.data);
      setWhaleActivity(whaleRes.data);
      setLiquidations(liqRes.data);
      setFearGreed(fgRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPriceHistory = async (coin) => {
    try {
      const response = await axios.get(`${API}/crypto/price-history/${coin}?days=7`);
      setPriceHistory(prev => ({ ...prev, [coin]: response.data }));
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getFearGreedColor = (value) => {
    if (value <= 25) return '#EF4444';
    if (value <= 45) return '#F59E0B';
    if (value <= 55) return '#A1A1AA';
    if (value <= 75) return '#10B981';
    return '#22C55E';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Market Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Капитализация:</span>
            <span className="font-mono text-[#F7931A] font-semibold">{formatNumber(prices?.total_market_cap)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">BTC:</span>
            <span className="font-mono text-[#FFD700] font-semibold">{prices?.btc_dominance}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">ETH:</span>
            <span className="font-mono text-[#3B82F6] font-semibold">{prices?.eth_dominance}%</span>
          </div>
          {fearGreed?.current && (
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Fear & Greed:</span>
              <span 
                className="font-mono font-semibold"
                style={{ color: getFearGreedColor(fearGreed.current.value) }}
              >
                {fearGreed.current.value} ({fearGreed.current.classification})
              </span>
            </div>
          )}
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
          Обновить
        </Button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Prices Section with Chart */}
        <Card className="glass-card lg:col-span-2 hover:-translate-y-1 transition-all duration-300" data-testid="prices-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#F7931A]" />
              Цены криптовалют
            </CardTitle>
            <Badge variant="outline" className="text-xs text-muted-foreground border-white/10">
              CoinGecko {prices?.is_fallback && '(offline)'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {prices?.data.map((coin) => (
                <div 
                  key={coin.symbol} 
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedCoin === coin.symbol.toLowerCase() 
                      ? 'bg-[#F7931A]/20 border border-[#F7931A]/30' 
                      : 'bg-secondary/30 hover:bg-secondary/50'
                  }`}
                  onClick={() => setSelectedCoin(coin.symbol.toLowerCase())}
                >
                  <div className="flex items-center gap-3">
                    {coin.image ? (
                      <img src={coin.image} alt={coin.symbol} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FFD700] flex items-center justify-center font-bold text-black text-sm">
                        {coin.symbol.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{coin.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{coin.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-semibold">{formatPrice(coin.price)}</p>
                    <div className="flex items-center justify-end gap-3 text-sm">
                      <span className={`flex items-center gap-1 ${coin.change_24h >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {coin.change_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span className="font-mono">{coin.change_24h >= 0 ? '+' : ''}{coin.change_24h}%</span>
                      </span>
                      <span className={`font-mono ${coin.change_7d >= 0 ? 'text-positive' : 'text-negative'}`}>
                        7d: {coin.change_7d >= 0 ? '+' : ''}{coin.change_7d}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Chart */}
            {priceHistory[selectedCoin] && (
              <div className="h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistory[selectedCoin].prices.filter((_, i) => i % 4 === 0)}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F7931A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#52525B" 
                      tick={{ fill: '#A1A1AA', fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#52525B" 
                      tick={{ fill: '#A1A1AA', fontSize: 11 }}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#F7931A" 
                      strokeWidth={2}
                      fill="url(#priceGradient)" 
                      name="Цена"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liquidations with Chart */}
        <Card className="glass-card hover:-translate-y-1 transition-all duration-300" data-testid="liquidations-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#EF4444]" />
              Ликвидации 24ч
            </CardTitle>
            <Badge variant="outline" className="text-xs text-muted-foreground border-white/10">Coinglass</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 rounded-xl bg-secondary/30">
                <p className="text-3xl font-bold font-mono text-[#F7931A]">{formatNumber(liquidations?.total_24h)}</p>
                <p className="text-sm text-muted-foreground mt-1">Всего ликвидаций</p>
              </div>
              
              {liquidations?.near_record && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
                  <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                  <span className="text-sm text-[#EF4444]">Близко к рекорду! ({liquidations.current_vs_record_percent}%)</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#10B981]/10">
                  <p className="text-xs text-muted-foreground mb-1">Лонги</p>
                  <p className="font-mono text-[#10B981] font-semibold">{formatNumber(liquidations?.long_liquidations)}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#EF4444]/10">
                  <p className="text-xs text-muted-foreground mb-1">Шорты</p>
                  <p className="font-mono text-[#EF4444] font-semibold">{formatNumber(liquidations?.short_liquidations)}</p>
                </div>
              </div>

              {/* Liquidations Mini Chart */}
              {liquidations?.history_24h && (
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liquidations.history_24h.slice(-12)}>
                      <XAxis dataKey="hour" tick={{ fill: '#52525B', fontSize: 9 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="longs" stackId="a" fill="#10B981" name="Лонги" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="shorts" stackId="a" fill="#EF4444" name="Шорты" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ETF Flows with Chart */}
        <Card className="glass-card lg:col-span-2 hover:-translate-y-1 transition-all duration-300" data-testid="etf-flows-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#3B82F6]" />
              ETF Потоки
            </CardTitle>
            <Badge variant="outline" className="text-xs text-muted-foreground border-white/10">SoSoValue</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">BTC ETF AUM</p>
                <p className="font-mono text-[#F7931A] font-semibold text-lg">{formatNumber(etfFlows?.total_btc_aum)}</p>
                <p className={`text-xs font-mono ${etfFlows?.weekly_btc_flow >= 0 ? 'text-positive' : 'text-negative'}`}>
                  Неделя: {etfFlows?.weekly_btc_flow >= 0 ? '+' : ''}{formatNumber(etfFlows?.weekly_btc_flow)}
                </p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">ETH ETF AUM</p>
                <p className="font-mono text-[#3B82F6] font-semibold text-lg">{formatNumber(etfFlows?.total_eth_aum)}</p>
                <p className={`text-xs font-mono ${etfFlows?.weekly_eth_flow >= 0 ? 'text-positive' : 'text-negative'}`}>
                  Неделя: {etfFlows?.weekly_eth_flow >= 0 ? '+' : ''}{formatNumber(etfFlows?.weekly_eth_flow)}
                </p>
              </div>
            </div>

            {/* ETF Flows Chart */}
            {etfFlows?.data && (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={etfFlows.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date_short" 
                      stroke="#52525B" 
                      tick={{ fill: '#A1A1AA', fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#52525B" 
                      tick={{ fill: '#A1A1AA', fontSize: 10 }}
                      tickLine={false}
                      tickFormatter={(v) => `${(v/1e6).toFixed(0)}M`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="btc_inflow" fill="#F7931A" name="BTC Flow" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="eth_inflow" fill="#3B82F6" name="ETH Flow" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Whale Activity */}
        <Card className="glass-card hover:-translate-y-1 transition-all duration-300" data-testid="whale-activity-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🐋</span>
              Whale Activity
            </CardTitle>
            <Badge variant="outline" className="text-xs text-muted-foreground border-white/10">Arkham</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {whaleActivity?.alerts.map((alert, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-xs ${
                      alert.type === 'potential_sell' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                      alert.type === 'accumulation' ? 'bg-[#10B981]/20 text-[#10B981]' :
                      alert.type === 'deposit' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                      'bg-[#3B82F6]/20 text-[#3B82F6]'
                    }`}>
                      {alert.coin}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-mono text-[#F7931A]">{alert.amount.toLocaleString()} {alert.coin}</span>
                    <span className="text-muted-foreground"> ({formatNumber(alert.usd_value)})</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.from} → {alert.to}
                  </p>
                  <p className="text-xs text-muted-foreground/50 font-mono mt-1 truncate">
                    {alert.tx_hash}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fear & Greed Index */}
        {fearGreed?.history && fearGreed.history.length > 0 && (
          <Card className="glass-card lg:col-span-3 hover:-translate-y-1 transition-all duration-300" data-testid="fear-greed-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="w-5 h-5 text-[#F7931A]" />
                Fear & Greed Index
              </CardTitle>
              <Badge variant="outline" className="text-xs text-muted-foreground border-white/10">Alternative.me</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold font-mono"
                    style={{ 
                      backgroundColor: `${getFearGreedColor(fearGreed.current.value)}20`,
                      color: getFearGreedColor(fearGreed.current.value),
                      border: `2px solid ${getFearGreedColor(fearGreed.current.value)}`
                    }}
                  >
                    {fearGreed.current.value}
                  </div>
                  <p className="text-sm mt-2" style={{ color: getFearGreedColor(fearGreed.current.value) }}>
                    {fearGreed.current.classification}
                  </p>
                </div>
                <div className="flex-1 h-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...fearGreed.history].reverse()}>
                      <XAxis dataKey="date" tick={{ fill: '#52525B', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#52525B', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#F7931A" 
                        strokeWidth={2}
                        dot={{ fill: '#F7931A', r: 3 }}
                        name="Index"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
