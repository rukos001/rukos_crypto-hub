import React from 'react';
import { useMarketWebSocket } from '../hooks/useMarketWebSocket';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react';

const formatPrice = (price) => {
  if (!price) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price > 100 ? 0 : 2,
    maximumFractionDigits: price > 100 ? 0 : 2,
  }).format(price);
};

const formatChange = (change) => {
  if (!change) return '0.00%';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

export const LivePriceTicker = ({ compact = false }) => {
  const { isConnected, marketData, lastUpdate } = useMarketWebSocket();

  if (!marketData) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <WifiOff className="w-3 h-3" />
        <span>Подключение...</span>
      </div>
    );
  }

  const { prices, fear_greed } = marketData;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#F7931A] font-medium">BTC</span>
          <span className="font-mono">{formatPrice(prices?.btc?.price)}</span>
          <span className={prices?.btc?.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}>
            {formatChange(prices?.btc?.change_24h)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-400 font-medium">ETH</span>
          <span className="font-mono">{formatPrice(prices?.eth?.price)}</span>
        </div>
        <Badge 
          variant="outline" 
          className={`text-[10px] ${fear_greed?.value <= 25 ? 'border-red-500 text-red-500' : fear_greed?.value >= 75 ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}`}
        >
          F&G: {fear_greed?.value}
        </Badge>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 rounded-lg p-3 border border-white/5">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-500 font-medium">Live</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-500">Offline</span>
            </>
          )}
        </div>
        {lastUpdate && (
          <span className="text-[10px] text-white/40">
            {lastUpdate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Prices - Vertical Layout */}
      <div className="space-y-2.5">
        {/* BTC */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F7931A]/20 flex items-center justify-center">
              <span className="text-[#F7931A] font-bold text-[10px]">₿</span>
            </div>
            <span className="text-white/80 text-sm font-medium">BTC</span>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-white">{formatPrice(prices?.btc?.price)}</p>
            <p className={`text-[10px] font-medium ${prices?.btc?.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatChange(prices?.btc?.change_24h)}
            </p>
          </div>
        </div>

        {/* ETH */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 font-bold text-[10px]">Ξ</span>
            </div>
            <span className="text-white/80 text-sm font-medium">ETH</span>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-white">{formatPrice(prices?.eth?.price)}</p>
            <p className={`text-[10px] font-medium ${prices?.eth?.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatChange(prices?.eth?.change_24h)}
            </p>
          </div>
        </div>

        {/* SOL */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-purple-400 font-bold text-[10px]">◎</span>
            </div>
            <span className="text-white/80 text-sm font-medium">SOL</span>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-white">{formatPrice(prices?.sol?.price)}</p>
            <p className={`text-[10px] font-medium ${prices?.sol?.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatChange(prices?.sol?.change_24h)}
            </p>
          </div>
        </div>
      </div>

      {/* Fear & Greed */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">Fear & Greed</span>
          <div className="flex items-center gap-2">
            <span 
              className={`font-mono text-lg font-bold ${
                fear_greed?.value <= 25 ? 'text-red-400' : 
                fear_greed?.value >= 75 ? 'text-green-400' : 
                'text-yellow-400'
              }`}
            >
              {fear_greed?.value}
            </span>
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              fear_greed?.value <= 25 ? 'bg-red-500' : 
              fear_greed?.value >= 75 ? 'bg-green-500' : 
              'bg-yellow-500'
            }`}
            style={{ width: `${fear_greed?.value || 0}%` }}
          />
        </div>
        <p className="text-[10px] text-white/40 mt-1 text-center">{fear_greed?.classification}</p>
      </div>
    </div>
  );
};

export default LivePriceTicker;
