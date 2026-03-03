import React from 'react';
import { HelpCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useLanguage } from '../../context/LanguageContext';

// Mapping of terms to knowledge base categories and article IDs
const TERM_MAPPINGS = {
  // DeFi terms
  'defi': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'tvl': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'total value locked': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'liquidity': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'liquidity pool': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'yield': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'yield farming': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'amm': { category: 'defi', articleId: 'd2', title: 'AMM vs Order Book' },
  'dex': { category: 'defi', articleId: 'd2', title: 'AMM vs Order Book' },
  'impermanent loss': { category: 'defi', articleId: 'd3', title: 'DeFi Risk Management' },
  'smart contract': { category: 'defi', articleId: 'd3', title: 'DeFi Risk Management' },
  'oracle': { category: 'defi', articleId: 'd3', title: 'DeFi Risk Management' },
  
  // Perpetual/Derivatives terms
  'perpetual': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'perp': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'futures': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'leverage': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'open interest': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'oi': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'funding rate': { category: 'perp', articleId: 'p2', title: 'Funding Rate Strategy' },
  'funding': { category: 'perp', articleId: 'p2', title: 'Funding Rate Strategy' },
  'contango': { category: 'perp', articleId: 'p2', title: 'Funding Rate Strategy' },
  'backwardation': { category: 'perp', articleId: 'p2', title: 'Funding Rate Strategy' },
  'liquidation': { category: 'perp', articleId: 'p3', title: 'Liquidation Mechanics' },
  'margin': { category: 'perp', articleId: 'p3', title: 'Liquidation Mechanics' },
  'long': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'short': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'long/short': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  
  // Options terms
  'options': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'call': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'put': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'delta': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'gamma': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'theta': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'vega': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'iv': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'implied volatility': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'dvol': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'greeks': { category: 'options', articleId: 'o1', title: 'Options Fundamentals' },
  'max pain': { category: 'options', articleId: 'o3', title: 'Max Pain & Gamma Exposure' },
  'gamma exposure': { category: 'options', articleId: 'o3', title: 'Max Pain & Gamma Exposure' },
  'gex': { category: 'options', articleId: 'o3', title: 'Max Pain & Gamma Exposure' },
  'gamma flip': { category: 'options', articleId: 'o3', title: 'Max Pain & Gamma Exposure' },
  'straddle': { category: 'options', articleId: 'o2', title: 'Options Strategies for Crypto' },
  'covered call': { category: 'options', articleId: 'o2', title: 'Options Strategies for Crypto' },
  
  // Macro terms
  'dxy': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'dollar index': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'm2': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'money supply': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'fed': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'interest rate': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'cpi': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'inflation': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'global liquidity': { category: 'macro', articleId: 'm2', title: 'Global Liquidity & Bitcoin' },
  'risk-on': { category: 'macro', articleId: 'm3', title: 'Risk-On vs Risk-Off' },
  'risk-off': { category: 'macro', articleId: 'm3', title: 'Risk-On vs Risk-Off' },
  'vix': { category: 'macro', articleId: 'm3', title: 'Risk-On vs Risk-Off' },
  'fear & greed': { category: 'macro', articleId: 'm3', title: 'Risk-On vs Risk-Off' },
  'fear and greed': { category: 'macro', articleId: 'm3', title: 'Risk-On vs Risk-Off' },
  
  // Onchain terms
  'sopr': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'nupl': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'mvrv': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'realized cap': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'market cap': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  
  // ETF terms
  'etf': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'aum': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'inflow': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'outflow': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  
  // Stablecoin terms
  'stablecoin': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'usdt': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  'usdc': { category: 'defi', articleId: 'd1', title: 'What is DeFi?' },
  
  // Trading terms
  'support': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'resistance': { category: 'perp', articleId: 'p1', title: 'Perpetual Futures Basics' },
  'dominance': { category: 'macro', articleId: 'm1', title: 'Macro Indicators for Crypto' },
  'altseason': { category: 'macro', articleId: 'm3', title: 'Risk-On vs Risk-Off' },
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
  'гамма экспозиция': TERM_MAPPINGS['gamma exposure'],
  
  // Macro
  'денежная масса': TERM_MAPPINGS['money supply'],
  'процентная ставка': TERM_MAPPINGS['interest rate'],
  'инфляция': TERM_MAPPINGS['inflation'],
  'глобальная ликвидность': TERM_MAPPINGS['global liquidity'],
  'страх и жадность': TERM_MAPPINGS['fear & greed'],
  
  // Trading
  'поддержка': TERM_MAPPINGS['support'],
  'сопротивление': TERM_MAPPINGS['resistance'],
  'доминация': TERM_MAPPINGS['dominance'],
  'альтсезон': TERM_MAPPINGS['altseason'],
  'стейблкоин': TERM_MAPPINGS['stablecoin'],
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
