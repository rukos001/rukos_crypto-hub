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
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-red-500" />
              <span className="text-red-500">Offline</span>
            </>
          )}
        </div>
        {lastUpdate && (
          <span className="text-[10px] text-muted-foreground">
            {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Price Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* BTC */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-[#F7931A] font-bold text-sm">BTC</span>
            {prices?.btc?.change_24h >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
          </div>
          <p className="font-mono text-lg font-bold">{formatPrice(prices?.btc?.price)}</p>
          <p className={`text-xs ${prices?.btc?.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatChange(prices?.btc?.change_24h)}
          </p>
        </div>

        {/* ETH */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-blue-400 font-bold text-sm">ETH</span>
            {prices?.eth?.change_24h >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
          </div>
          <p className="font-mono text-lg font-bold">{formatPrice(prices?.eth?.price)}</p>
          <p className={`text-xs ${prices?.eth?.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatChange(prices?.eth?.change_24h)}
          </p>
        </div>

        {/* SOL */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-purple-400 font-bold text-sm">SOL</span>
            {prices?.sol?.change_24h >= 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
          </div>
          <p className="font-mono text-lg font-bold">{formatPrice(prices?.sol?.price)}</p>
          <p className={`text-xs ${prices?.sol?.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatChange(prices?.sol?.change_24h)}
          </p>
        </div>
      </div>

      {/* Fear & Greed */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Fear & Greed</span>
        <div className="flex items-center gap-2">
          <span 
            className={`font-mono font-bold ${
              fear_greed?.value <= 25 ? 'text-red-500' : 
              fear_greed?.value >= 75 ? 'text-green-500' : 
              'text-yellow-500'
            }`}
          >
            {fear_greed?.value}
          </span>
          <span className="text-xs text-muted-foreground">
            {fear_greed?.classification}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LivePriceTicker;
