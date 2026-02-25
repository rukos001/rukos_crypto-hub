import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, Zap } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatNumber = (num) => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

export const DashboardPage = () => {
  const [prices, setPrices] = useState(null);
  const [etfFlows, setEtfFlows] = useState(null);
  const [whaleActivity, setWhaleActivity] = useState(null);
  const [liquidations, setLiquidations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [pricesRes, etfRes, whaleRes, liqRes] = await Promise.all([
        axios.get(`${API}/crypto/prices`),
        axios.get(`${API}/crypto/etf-flows`),
        axios.get(`${API}/crypto/whale-activity`),
        axios.get(`${API}/crypto/liquidations`)
      ]);
      setPrices(pricesRes.data);
      setEtfFlows(etfRes.data);
      setWhaleActivity(whaleRes.data);
      setLiquidations(liqRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Market Overview */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Капитализация:</span>
          <span className="font-mono text-[#F7931A] font-semibold">{formatNumber(prices?.total_market_cap)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">BTC Dominance:</span>
          <span className="font-mono text-[#FFD700] font-semibold">{prices?.btc_dominance}%</span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Prices Section - Takes 2 columns on large screens */}
        <Card className="glass-card lg:col-span-2 hover:-translate-y-1 transition-all duration-300" data-testid="prices-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#F7931A]" />
              Цены криптовалют
            </CardTitle>
            <Badge variant="outline" className="text-xs text-muted-foreground border-white/10">CoinMarketCap</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prices?.data.map((coin) => (
                <div key={coin.symbol} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FFD700] flex items-center justify-center font-bold text-black text-sm">
                      {coin.symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{coin.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{coin.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-semibold">{formatPrice(coin.price)}</p>
                    <div className={`flex items-center justify-end gap-1 text-sm ${coin.change_24h >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {coin.change_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-mono">{coin.change_24h >= 0 ? '+' : ''}{coin.change_24h}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Liquidations */}
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
            </div>
          </CardContent>
        </Card>

        {/* ETF Flows */}
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
              </div>
              <div className="flex-1 p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">ETH ETF AUM</p>
                <p className="font-mono text-[#3B82F6] font-semibold text-lg">{formatNumber(etfFlows?.total_eth_aum)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {etfFlows?.data.slice(0, 5).map((day, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <span className="text-sm text-muted-foreground font-mono">{day.date}</span>
                  <div className="flex gap-4">
                    <div className={`flex items-center gap-1 ${day.btc_inflow >= 0 ? 'text-positive' : 'text-negative'}`}>
                      <span className="text-xs text-muted-foreground">BTC:</span>
                      <span className="font-mono text-sm">{day.btc_inflow >= 0 ? '+' : ''}{formatNumber(day.btc_inflow)}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${day.eth_inflow >= 0 ? 'text-positive' : 'text-negative'}`}>
                      <span className="text-xs text-muted-foreground">ETH:</span>
                      <span className="font-mono text-sm">{day.eth_inflow >= 0 ? '+' : ''}{formatNumber(day.eth_inflow)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {whaleActivity?.alerts.map((alert, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-xs ${
                      alert.type === 'potential_sell' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                      alert.type === 'accumulation' ? 'bg-[#10B981]/20 text-[#10B981]' :
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
