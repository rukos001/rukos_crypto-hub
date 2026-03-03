import React from 'react';
import { HelpCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useLanguage } from '../../context/LanguageContext';

// Mapping of terms to knowledge base categories and article IDs
const TERM_MAPPINGS = {
  // DeFi terms
  'defi': { category: 'defi', articleId: 'd1', title: 'Что такое DeFi?' },
  'tvl': { category: 'defi', articleId: 'd1', title: 'Что такое DeFi?' },
  'total value locked': { category: 'defi', articleId: 'd1', title: 'Что такое DeFi?' },
  'liquidity': { category: 'defi', articleId: 'd1', title: 'Что такое DeFi?' },
  'liquidity pool': { category: 'defi', articleId: 'd1', title: 'Что такое DeFi?' },
  'yield': { category: 'defi', articleId: 'd1', title: 'Что такое DeFi?' },
  'yield farming': { category: 'defi', articleId: 'd1', title: 'Что такое DeFi?' },
  'amm': { category: 'defi', articleId: 'd2', title: 'AMM vs Книга ордеров' },
  'dex': { category: 'defi', articleId: 'd2', title: 'AMM vs Книга ордеров' },
  'impermanent loss': { category: 'defi', articleId: 'd3', title: 'Управление рисками в DeFi' },
  'smart contract': { category: 'defi', articleId: 'd3', title: 'Управление рисками в DeFi' },
  'oracle': { category: 'defi', articleId: 'd3', title: 'Управление рисками в DeFi' },
  'stablecoin': { category: 'defi', articleId: 'st1', title: 'Стейблкоины: Гид' },
  'usdt': { category: 'defi', articleId: 'st1', title: 'Стейблкоины: Гид' },
  'usdc': { category: 'defi', articleId: 'st1', title: 'Стейблкоины: Гид' },
  
  // Perpetual/Derivatives terms
  'perpetual': { category: 'perp', articleId: 'p1', title: 'Основы бессрочных фьючерсов' },
  'perp': { category: 'perp', articleId: 'p1', title: 'Основы бессрочных фьючерсов' },
  'futures': { category: 'perp', articleId: 'p1', title: 'Основы бессрочных фьючерсов' },
  'leverage': { category: 'perp', articleId: 'p1', title: 'Основы бессрочных фьючерсов' },
  'open interest': { category: 'perp', articleId: 'p1', title: 'Основы бессрочных фьючерсов' },
  'oi': { category: 'perp', articleId: 'p1', title: 'Основы бессрочных фьючерсов' },
  'long': { category: 'perp', articleId: 'p1', title: 'Основы бессрочных фьючерсов' },
  'short': { category: 'perp', articleId: 'p1', title: 'Основы бессрочных фьючерсов' },
  'long/short': { category: 'perp', articleId: 'p1', title: 'Основы бессрочных фьючерсов' },
  'funding rate': { category: 'perp', articleId: 'p2', title: 'Стратегии ставки фандинга' },
  'funding': { category: 'perp', articleId: 'p2', title: 'Стратегии ставки фандинга' },
  'contango': { category: 'perp', articleId: 'p2', title: 'Стратегии ставки фандинга' },
  'backwardation': { category: 'perp', articleId: 'p2', title: 'Стратегии ставки фандинга' },
  'liquidation': { category: 'perp', articleId: 'p3', title: 'Механика ликвидаций' },
  'margin': { category: 'perp', articleId: 'p3', title: 'Механика ликвидаций' },
  'support': { category: 'perp', articleId: 'tr1', title: 'Уровни поддержки и сопротивления' },
  'resistance': { category: 'perp', articleId: 'tr1', title: 'Уровни поддержки и сопротивления' },
  
  // Options terms
  'options': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'call': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'put': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'delta': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'gamma': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'theta': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'vega': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'iv': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'implied volatility': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'dvol': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'greeks': { category: 'options', articleId: 'o1', title: 'Основы опционов' },
  'straddle': { category: 'options', articleId: 'o2', title: 'Опционные стратегии для крипто' },
  'covered call': { category: 'options', articleId: 'o2', title: 'Опционные стратегии для крипто' },
  'max pain': { category: 'options', articleId: 'o3', title: 'Max Pain и Гамма-экспозиция' },
  'gamma exposure': { category: 'options', articleId: 'o3', title: 'Max Pain и Гамма-экспозиция' },
  'gex': { category: 'options', articleId: 'o3', title: 'Max Pain и Гамма-экспозиция' },
  'gamma flip': { category: 'options', articleId: 'o3', title: 'Max Pain и Гамма-экспозиция' },
  
  // Macro terms
  'dxy': { category: 'macro', articleId: 'm1', title: 'Макро-индикаторы для крипто' },
  'dollar index': { category: 'macro', articleId: 'm1', title: 'Макро-индикаторы для крипто' },
  'm2': { category: 'macro', articleId: 'm1', title: 'Макро-индикаторы для крипто' },
  'money supply': { category: 'macro', articleId: 'm1', title: 'Макро-индикаторы для крипто' },
  'fed': { category: 'macro', articleId: 'm1', title: 'Макро-индикаторы для крипто' },
  'interest rate': { category: 'macro', articleId: 'm1', title: 'Макро-индикаторы для крипто' },
  'cpi': { category: 'macro', articleId: 'm1', title: 'Макро-индикаторы для крипто' },
  'inflation': { category: 'macro', articleId: 'm1', title: 'Макро-индикаторы для крипто' },
  'global liquidity': { category: 'macro', articleId: 'm2', title: 'Глобальная ликвидность и Bitcoin' },
  'risk-on': { category: 'macro', articleId: 'm3', title: 'Risk-On vs Risk-Off' },
  'risk-off': { category: 'macro', articleId: 'm3', title: 'Risk-On vs Risk-Off' },
  'vix': { category: 'macro', articleId: 'm3', title: 'Risk-On vs Risk-Off' },
  'fear & greed': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'fear and greed': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'fear greed': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'fear': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'greed': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'dominance': { category: 'macro', articleId: 'alt1', title: 'Доминация BTC и альтсезон' },
  'altseason': { category: 'macro', articleId: 'alt1', title: 'Доминация BTC и альтсезон' },
  
  // Onchain terms
  'sopr': { category: 'onchain', articleId: 'on1', title: 'Ончейн-метрики: SOPR' },
  'nupl': { category: 'onchain', articleId: 'on2', title: 'Ончейн-метрики: NUPL' },
  'mvrv': { category: 'onchain', articleId: 'on3', title: 'Ончейн-метрики: MVRV' },
  'realized cap': { category: 'onchain', articleId: 'on3', title: 'Ончейн-метрики: MVRV' },
  'market cap': { category: 'onchain', articleId: 'on3', title: 'Ончейн-метрики: MVRV' },
  
  // ETF terms
  'etf': { category: 'etf', articleId: 'etf1', title: 'Bitcoin ETF: Основы' },
  'aum': { category: 'etf', articleId: 'etf1', title: 'Bitcoin ETF: Основы' },
  'inflow': { category: 'etf', articleId: 'etf1', title: 'Bitcoin ETF: Основы' },
  'outflow': { category: 'etf', articleId: 'etf1', title: 'Bitcoin ETF: Основы' },
};

// Russian term mappings
const TERM_MAPPINGS_RU = {
  // DeFi
  'дефи': TERM_MAPPINGS['defi'],
  'ликвидность': TERM_MAPPINGS['liquidity'],
  'пул ликвидности': TERM_MAPPINGS['liquidity pool'],
  'доходность': TERM_MAPPINGS['yield'],
  'фарминг': TERM_MAPPINGS['yield farming'],
  'смарт-контракт': TERM_MAPPINGS['smart contract'],
  'оракул': TERM_MAPPINGS['oracle'],
  'стейблкоин': TERM_MAPPINGS['stablecoin'],
  'стейблкоины': TERM_MAPPINGS['stablecoin'],
  
  // Derivatives
  'деривативы': TERM_MAPPINGS['perpetual'],
  'фьючерсы': TERM_MAPPINGS['futures'],
  'плечо': TERM_MAPPINGS['leverage'],
  'кредитное плечо': TERM_MAPPINGS['leverage'],
  'открытый интерес': TERM_MAPPINGS['open interest'],
  'ставка фандинга': TERM_MAPPINGS['funding rate'],
  'фандинг': TERM_MAPPINGS['funding'],
  'ликвидация': TERM_MAPPINGS['liquidation'],
  'маржа': TERM_MAPPINGS['margin'],
  'лонг': TERM_MAPPINGS['long'],
  'шорт': TERM_MAPPINGS['short'],
  'контанго': TERM_MAPPINGS['contango'],
  'бэквардация': TERM_MAPPINGS['backwardation'],
  'поддержка': TERM_MAPPINGS['support'],
  'сопротивление': TERM_MAPPINGS['resistance'],
  
  // Options
  'опционы': TERM_MAPPINGS['options'],
  'колл': TERM_MAPPINGS['call'],
  'пут': TERM_MAPPINGS['put'],
  'дельта': TERM_MAPPINGS['delta'],
  'гамма': TERM_MAPPINGS['gamma'],
  'тета': TERM_MAPPINGS['theta'],
  'вега': TERM_MAPPINGS['vega'],
  'волатильность': TERM_MAPPINGS['implied volatility'],
  'греки': TERM_MAPPINGS['greeks'],
  'макс боль': TERM_MAPPINGS['max pain'],
  'максимальная боль': TERM_MAPPINGS['max pain'],
  'гамма экспозиция': TERM_MAPPINGS['gamma exposure'],
  'гамма-экспозиция': TERM_MAPPINGS['gamma exposure'],
  
  // Macro
  'денежная масса': TERM_MAPPINGS['money supply'],
  'процентная ставка': TERM_MAPPINGS['interest rate'],
  'инфляция': TERM_MAPPINGS['inflation'],
  'глобальная ликвидность': TERM_MAPPINGS['global liquidity'],
  'страх и жадность': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'индекс страха': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'индекс жадности': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'страх': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'жадность': { category: 'macro', articleId: 'm4', title: 'Индекс страха и жадности' },
  'доминация': TERM_MAPPINGS['dominance'],
  'альтсезон': TERM_MAPPINGS['altseason'],
  
  // Onchain
  'реализованная капитализация': TERM_MAPPINGS['realized cap'],
  'рыночная капитализация': TERM_MAPPINGS['market cap'],
  
  // ETF
  'приток': TERM_MAPPINGS['inflow'],
  'отток': TERM_MAPPINGS['outflow'],
};

// Combine mappings
const ALL_TERM_MAPPINGS = { ...TERM_MAPPINGS, ...TERM_MAPPINGS_RU };

/**
 * Get term info by searching for a matching term
 */
export const getTermInfo = (term) => {
  if (!term) return null;
  const normalized = term.toLowerCase().trim();
  return ALL_TERM_MAPPINGS[normalized] || null;
};

/**
 * TermLink component - displays a help icon that links to knowledge base
 * Usage: <TermLink term="funding rate" />
 */
export const TermLink = ({ term, className = '', size = 'sm', showText = false }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const termInfo = getTermInfo(term);
  
  if (!termInfo) return null;
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/knowledge/${termInfo.category}`, { 
      state: { highlightArticle: termInfo.articleId }
    });
  };
  
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={`inline-flex items-center gap-1 text-[#F7931A]/60 hover:text-[#F7931A] transition-colors cursor-pointer ${className}`}
            data-testid={`term-link-${term.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <HelpCircle className={iconSize} />
            {showText && <span className="text-xs">{language === 'ru' ? 'Подробнее' : 'Learn more'}</span>}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-[#1a1a1a] border-white/10 text-white">
          <div className="flex items-center gap-2 text-xs">
            <BookOpen className="w-3 h-3 text-[#F7931A]" />
            <span>{language === 'ru' ? 'Узнать о' : 'Learn about'}: {termInfo.title}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * TermWithLink component - wraps text with a term link
 * Usage: <TermWithLink term="funding rate">Funding Rate</TermWithLink>
 */
export const TermWithLink = ({ term, children, className = '' }) => {
  const termInfo = getTermInfo(term);
  
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {children}
      {termInfo && <TermLink term={term} size="sm" />}
    </span>
  );
};

/**
 * InfoButton component - standalone info button for sections
 * Usage: <InfoButton term="derivatives" label="Деривативы" />
 */
export const InfoButton = ({ term, label, className = '' }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const termInfo = getTermInfo(term);
  
  if (!termInfo) return null;
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/knowledge/${termInfo.category}`, { 
      state: { highlightArticle: termInfo.articleId }
    });
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F7931A]/10 hover:bg-[#F7931A]/20 text-[#F7931A] text-xs transition-all ${className}`}
            data-testid={`info-btn-${term.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <BookOpen className="w-3 h-3" />
            <span>{language === 'ru' ? 'Что это?' : 'What is this?'}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-[#1a1a1a] border-white/10 text-white max-w-xs">
          <p className="text-xs">{language === 'ru' ? 'Перейти к статье' : 'Go to article'}: {termInfo.title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TermLink;
