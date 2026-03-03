import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

// Translations
const translations = {
  ru: {
    // General
    dashboard: 'Дашборд',
    professional_analytics: 'Профессиональная крипто-аналитика',
    refresh: 'Обновить',
    loading: 'Загрузка...',
    no_data: 'Нет данных',
    view_more: 'Подробнее',
    source: 'Источник',
    updated: 'Обновлено',
    
    // Tabs
    tab_market: 'Market Core',
    tab_derivatives: 'Деривативы',
    tab_etf: 'ETF Intelligence',
    tab_onchain: 'Onchain',
    tab_altseason: 'Altseason',
    tab_predictions: 'Predictions',
    tab_risk: 'Risk Engine',
    tab_ai: 'AI Сигналы',
    tab_portfolio: 'Портфель',
    tab_war: 'War Mode',
    
    // Sidebar
    portfolio: 'Портфель',
    portfolio_my: 'Мой портфель',
    portfolio_rukos: 'Портфель RUKOS_CRYPTO',
    admin_panel: 'Админ-панель',
    
    // Market Core
    market_core_title: 'Market Core',
    market_core_desc: 'Макроэкономические показатели и общее состояние крипторынка. Отслеживайте капитализацию, доминирование BTC/ETH, корреляцию с традиционными рынками.',
    total_market_cap: 'Общая капитализация',
    btc_dominance: 'Доминирование BTC',
    eth_dominance: 'Доминирование ETH',
    total3: 'TOTAL3 (Альты)',
    total3_desc: 'Капитализация всех криптовалют кроме BTC и ETH',
    stablecoins: 'Стейблкоины',
    stablecoins_desc: 'Общая капитализация USDT + USDC',
    traditional_markets: 'Традиционные рынки',
    traditional_markets_desc: 'Корреляция крипты с традиционными активами',
    global_liquidity: 'Глобальная ликвидность',
    global_liquidity_desc: 'M2 денежная масса влияет на риск-аппетит инвесторов',
    market_regime: 'Режим рынка',
    market_regime_desc: 'Risk-on: инвесторы готовы к риску. Risk-off: уход в безопасные активы',
    risk_on: 'Risk-On',
    risk_off: 'Risk-Off',
    crypto_prices: 'Цены криптовалют',
    crypto_prices_desc: 'Актуальные цены топ-криптовалют с CoinGecko',
    fear_greed: 'Индекс страха и жадности',
    fear_greed_desc: '0-25: Extreme Fear, 25-45: Fear, 45-55: Neutral, 55-75: Greed, 75-100: Extreme Greed',
    gold: 'Золото',
    
    // Derivatives
    derivatives_title: 'Derivatives Control Panel',
    derivatives_desc: 'Анализ деривативов: Open Interest, Funding Rate, Long/Short Ratio. Ключевые метрики для понимания позиционирования трейдеров.',
    open_interest: 'Open Interest',
    open_interest_desc: 'Общий объём открытых позиций. Рост OI + рост цены = подтверждение тренда',
    funding_rate: 'Funding Rate',
    funding_rate_desc: 'Положительный: лонги платят шортам. Высокий funding = перегрев рынка',
    long_short_ratio: 'Long/Short Ratio',
    long_short_ratio_desc: 'Соотношение длинных к коротким позициям',
    liquidation_clusters: 'Кластеры ликвидаций',
    liquidation_clusters_desc: 'Ценовые уровни с высокой концентрацией ликвидаций',
    funding_history: 'История Funding Rate',
    top_traders: 'Топ трейдеры',
    top_traders_desc: 'Позиционирование крупных трейдеров на Hyperliquid',
    gamma_exposure: 'Gamma Exposure',
    gamma_exposure_desc: 'Гамма экспозиция маркет-мейкеров влияет на волатильность',
    oi_divergence: 'OI Дивергенция',
    oi_divergence_desc: 'Расхождение между OI и ценой - сигнал разворота',
    
    // ETF Intelligence
    etf_title: 'ETF Flow Intelligence',
    etf_desc: 'Потоки в крипто-ETF: BlackRock, Fidelity, Grayscale и др. Институциональный спрос - ключевой драйвер цены.',
    total_aum: 'Всего AUM',
    daily_flow: 'Дневной поток',
    cumulative_flow: 'Кумулятивно',
    etf_absorption: 'ETF Absorption',
    etf_absorption_desc: 'Сигнал когда ETF покупают больше, чем майнеры продают',
    miner_activity: 'Активность майнеров',
    flow_history: 'История потоков',
    fund_breakdown: 'По фондам',
    pct_spot_volume: '% от спот объёма',
    premium_discount: 'Премия/Дисконт',
    flow_correlation: 'Корреляция Flow-Price',
    all_etfs: 'Все ETF',
    btc_etfs: 'BTC ETF',
    eth_etfs: 'ETH ETF',
    
    // Onchain
    onchain_title: 'Onchain War Room',
    onchain_desc: 'Ончейн метрики: SOPR, NUPL, MVRV, потоки на биржи. Данные напрямую из блокчейна.',
    sopr: 'SOPR',
    sopr_desc: 'Spent Output Profit Ratio. >1: продажа в прибыль, <1: в убыток',
    nupl: 'NUPL',
    nupl_desc: 'Net Unrealized Profit/Loss. Показывает % нереализованной прибыли в сети',
    mvrv: 'MVRV',
    mvrv_desc: 'Market Value to Realized Value. >3: перекуплен, <1: перепродан',
    cdd: 'CDD',
    cdd_desc: 'Coin Days Destroyed. Высокий = старые монеты двигаются',
    exchange_flows: 'Потоки на биржи',
    exchange_flows_desc: 'Приток на биржи = давление продаж. Отток = накопление',
    whale_zones: 'Зоны накопления китов',
    notable_wallets: 'Известные кошельки',
    notable_wallets_desc: 'Балансы крупнейших публичных держателей',
    miner_reserves: 'Резервы майнеров',
    realized_vs_market: 'Realized vs Market Cap',
    
    // Altseason
    altseason_title: 'Altseason Monitor',
    altseason_desc: 'Мониторинг альтсезона: доминирование BTC, перформанс альтов, секторальная ротация.',
    altseason_probability: 'Вероятность альтсезона',
    altseason_probability_desc: 'Комплексный индекс на основе BTC.D, перформанса альтов, TVL',
    dominance_breakdown: 'Распределение доминирования',
    sector_performance: 'Перформанс секторов',
    top50_vs_btc: 'Топ-50 vs BTC',
    narrative_heatmap: 'Карта нарративов',
    defi_tvl: 'DeFi TVL',
    altseason: 'АЛЬТСЕЗОН',
    warming_up: 'РАЗОГРЕВ',
    btc_season: 'BTC СЕЗОН',
    
    // Risk Engine
    risk_title: 'Risk Engine',
    risk_desc: 'Система оценки рисков: волатильность, левередж, стейблкоин потоки, сигналы перегрева.',
    risk_score: 'Risk Score',
    risk_score_desc: 'Комплексная оценка риска от 1 до 10',
    volatility_index: 'Индекс волатильности',
    volatility_desc: 'DVOL - implied volatility из опционов',
    market_regime_risk: 'Режим рынка',
    market_regime_risk_desc: 'TREND: направленное движение. CHOP: боковик. DISTRIBUTION: распределение',
    leverage_crowding: 'Leverage Crowding',
    leverage_crowding_desc: 'Уровень концентрации плеча в системе',
    stablecoin_flows: 'Потоки стейблкоинов',
    stablecoin_flows_desc: 'Минтинг стейблов = приток капитала в крипту',
    overheat_alerts: 'Сигналы перегрева',
    overheat_alerts_desc: 'Предупреждения о перегреве рынка',
    
    // AI Signals
    ai_title: 'AI Signal Panel',
    ai_desc: 'Мультифакторный AI-анализ: ончейн + деривативы + ETF + макро + сентимент.',
    composite_signal: 'Композитный сигнал',
    composite_signal_desc: 'Агрегированный сигнал из 5 факторов',
    squeeze_probability: 'Вероятность сквиза',
    squeeze_desc: 'Short squeeze: принудительное закрытие шортов. Long squeeze: ликвидация лонгов',
    liquidity_zones: 'Зоны ликвидности',
    liquidity_zones_desc: 'Уровни с высокой концентрацией ликвидности',
    weekly_range: 'Недельный диапазон',
    weekly_range_desc: 'Прогнозируемый диапазон цены на неделю',
    key_levels: 'Ключевые уровни',
    
    // Portfolio
    portfolio_title: 'Portfolio Tracker',
    portfolio_desc: 'Отслеживание портфеля: позиции, PnL, риск-метрики, расстояние до ликвидации.',
    total_value: 'Стоимость портфеля',
    unrealized_pnl: 'Нереализованный PnL',
    positions: 'Позиции',
    risk_metrics: 'Риск метрики',
    avg_leverage: 'Средний левередж',
    risk_per_trade: 'Риск на сделку',
    risk_of_ruin: 'Risk of Ruin',
    risk_of_ruin_desc: 'Вероятность потери депозита при текущем риске',
    liq_distance: 'До ликвидации',
    concentration: 'Концентрация',
    
    // War Mode
    war_title: 'War Mode',
    war_desc: 'Режим стресса рынка: мониторинг аномалий funding, OI, ETF, whale движений, ликвидаций.',
    stress_level: 'Уровень стресса',
    stress_level_desc: 'Агрегированный показатель стресса рынка',
    active_alerts: 'Активные алерты',
    quick_actions: 'Быстрые действия',
    reduce_all: 'Сократить всё',
    add_hedges: 'Добавить хедж',
    set_stops: 'Поставить стопы',
    to_stables: 'В стейблы',
    
    // Common
    bullish: 'Бычий',
    bearish: 'Медвежий',
    neutral: 'Нейтральный',
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
    extreme: 'Экстремальный',
    normal: 'Нормальный',
    inflow: 'Приток',
    outflow: 'Отток',
    
    // Navigation
    posts: 'Посты',
    ideas: 'Идеи',
    chat: 'Чат',
    settings: 'Настройки',
    ai_assistant: 'AI Ассистент',
    collapse: 'Свернуть',
    logout: 'Выйти',
  },
  
  en: {
    // General
    dashboard: 'Dashboard',
    professional_analytics: 'Professional crypto analytics',
    refresh: 'Refresh',
    loading: 'Loading...',
    no_data: 'No data',
    view_more: 'View more',
    source: 'Source',
    updated: 'Updated',
    
    // Tabs
    tab_market: 'Market Core',
    tab_derivatives: 'Derivatives',
    tab_etf: 'ETF Intelligence',
    tab_onchain: 'Onchain',
    tab_altseason: 'Altseason',
    tab_predictions: 'Predictions',
    tab_risk: 'Risk Engine',
    tab_ai: 'AI Signals',
    tab_portfolio: 'Portfolio',
    tab_war: 'War Mode',
    
    // Sidebar
    portfolio: 'Portfolio',
    portfolio_my: 'My Portfolio',
    portfolio_rukos: 'RUKOS_CRYPTO Portfolio',
    admin_panel: 'Admin Panel',
    
    // Market Core
    market_core_title: 'Market Core',
    market_core_desc: 'Macroeconomic indicators and overall crypto market state. Track market cap, BTC/ETH dominance, correlation with traditional markets.',
    total_market_cap: 'Total Market Cap',
    btc_dominance: 'BTC Dominance',
    eth_dominance: 'ETH Dominance',
    total3: 'TOTAL3 (Alts)',
    total3_desc: 'Market cap of all cryptocurrencies except BTC and ETH',
    stablecoins: 'Stablecoins',
    stablecoins_desc: 'Total market cap of USDT + USDC',
    traditional_markets: 'Traditional Markets',
    traditional_markets_desc: 'Crypto correlation with traditional assets',
    global_liquidity: 'Global Liquidity',
    global_liquidity_desc: 'M2 money supply affects investor risk appetite',
    market_regime: 'Market Regime',
    market_regime_desc: 'Risk-on: investors seeking risk. Risk-off: flight to safety',
    risk_on: 'Risk-On',
    risk_off: 'Risk-Off',
    crypto_prices: 'Crypto Prices',
    crypto_prices_desc: 'Live prices of top cryptocurrencies from CoinGecko',
    fear_greed: 'Fear & Greed Index',
    fear_greed_desc: '0-25: Extreme Fear, 25-45: Fear, 45-55: Neutral, 55-75: Greed, 75-100: Extreme Greed',
    gold: 'Gold',
    
    // Derivatives
    derivatives_title: 'Derivatives Control Panel',
    derivatives_desc: 'Derivatives analysis: Open Interest, Funding Rate, Long/Short Ratio. Key metrics for understanding trader positioning.',
    open_interest: 'Open Interest',
    open_interest_desc: 'Total open positions. Rising OI + rising price = trend confirmation',
    funding_rate: 'Funding Rate',
    funding_rate_desc: 'Positive: longs pay shorts. High funding = market overheated',
    long_short_ratio: 'Long/Short Ratio',
    long_short_ratio_desc: 'Ratio of long to short positions',
    liquidation_clusters: 'Liquidation Clusters',
    liquidation_clusters_desc: 'Price levels with high liquidation concentration',
    funding_history: 'Funding Rate History',
    top_traders: 'Top Traders',
    top_traders_desc: 'Large trader positioning on Hyperliquid',
    gamma_exposure: 'Gamma Exposure',
    gamma_exposure_desc: 'Market maker gamma exposure affects volatility',
    oi_divergence: 'OI Divergence',
    oi_divergence_desc: 'Divergence between OI and price - reversal signal',
    
    // ETF Intelligence
    etf_title: 'ETF Flow Intelligence',
    etf_desc: 'Crypto ETF flows: BlackRock, Fidelity, Grayscale etc. Institutional demand is a key price driver.',
    total_aum: 'Total AUM',
    daily_flow: 'Daily Flow',
    cumulative_flow: 'Cumulative',
    etf_absorption: 'ETF Absorption',
    etf_absorption_desc: 'Signal when ETFs buy more than miners sell',
    miner_activity: 'Miner Activity',
    flow_history: 'Flow History',
    fund_breakdown: 'By Fund',
    pct_spot_volume: '% of Spot Volume',
    premium_discount: 'Premium/Discount',
    flow_correlation: 'Flow-Price Correlation',
    all_etfs: 'All ETFs',
    btc_etfs: 'BTC ETFs',
    eth_etfs: 'ETH ETFs',
    
    // Onchain
    onchain_title: 'Onchain War Room',
    onchain_desc: 'Onchain metrics: SOPR, NUPL, MVRV, exchange flows. Data directly from the blockchain.',
    sopr: 'SOPR',
    sopr_desc: 'Spent Output Profit Ratio. >1: selling at profit, <1: at loss',
    nupl: 'NUPL',
    nupl_desc: 'Net Unrealized Profit/Loss. Shows % of unrealized profit in network',
    mvrv: 'MVRV',
    mvrv_desc: 'Market Value to Realized Value. >3: overbought, <1: oversold',
    cdd: 'CDD',
    cdd_desc: 'Coin Days Destroyed. High = old coins moving',
    exchange_flows: 'Exchange Flows',
    exchange_flows_desc: 'Inflow to exchanges = sell pressure. Outflow = accumulation',
    whale_zones: 'Whale Accumulation Zones',
    notable_wallets: 'Notable Wallets',
    notable_wallets_desc: 'Balances of largest public holders',
    miner_reserves: 'Miner Reserves',
    realized_vs_market: 'Realized vs Market Cap',
    
    // Altseason
    altseason_title: 'Altseason Monitor',
    altseason_desc: 'Altseason monitoring: BTC dominance, alt performance, sector rotation.',
    altseason_probability: 'Altseason Probability',
    altseason_probability_desc: 'Composite index based on BTC.D, alt performance, TVL',
    dominance_breakdown: 'Dominance Breakdown',
    sector_performance: 'Sector Performance',
    top50_vs_btc: 'Top 50 vs BTC',
    narrative_heatmap: 'Narrative Heatmap',
    defi_tvl: 'DeFi TVL',
    altseason: 'ALTSEASON',
    warming_up: 'WARMING UP',
    btc_season: 'BTC SEASON',
    
    // Risk Engine
    risk_title: 'Risk Engine',
    risk_desc: 'Risk assessment system: volatility, leverage, stablecoin flows, overheat signals.',
    risk_score: 'Risk Score',
    risk_score_desc: 'Composite risk assessment from 1 to 10',
    volatility_index: 'Volatility Index',
    volatility_desc: 'DVOL - implied volatility from options',
    market_regime_risk: 'Market Regime',
    market_regime_risk_desc: 'TREND: directional move. CHOP: sideways. DISTRIBUTION: distribution',
    leverage_crowding: 'Leverage Crowding',
    leverage_crowding_desc: 'Level of leverage concentration in the system',
    stablecoin_flows: 'Stablecoin Flows',
    stablecoin_flows_desc: 'Stablecoin minting = capital inflow to crypto',
    overheat_alerts: 'Overheat Alerts',
    overheat_alerts_desc: 'Market overheat warnings',
    
    // AI Signals
    ai_title: 'AI Signal Panel',
    ai_desc: 'Multi-factor AI analysis: onchain + derivatives + ETF + macro + sentiment.',
    composite_signal: 'Composite Signal',
    composite_signal_desc: 'Aggregated signal from 5 factors',
    squeeze_probability: 'Squeeze Probability',
    squeeze_desc: 'Short squeeze: forced short closing. Long squeeze: long liquidation',
    liquidity_zones: 'Liquidity Zones',
    liquidity_zones_desc: 'Levels with high liquidity concentration',
    weekly_range: 'Weekly Range',
    weekly_range_desc: 'Predicted price range for the week',
    key_levels: 'Key Levels',
    
    // Portfolio
    portfolio_title: 'Portfolio Tracker',
    portfolio_desc: 'Portfolio tracking: positions, PnL, risk metrics, liquidation distance.',
    total_value: 'Portfolio Value',
    unrealized_pnl: 'Unrealized PnL',
    positions: 'Positions',
    risk_metrics: 'Risk Metrics',
    avg_leverage: 'Avg Leverage',
    risk_per_trade: 'Risk per Trade',
    risk_of_ruin: 'Risk of Ruin',
    risk_of_ruin_desc: 'Probability of losing deposit at current risk',
    liq_distance: 'To Liquidation',
    concentration: 'Concentration',
    
    // War Mode
    war_title: 'War Mode',
    war_desc: 'Market stress mode: monitoring funding, OI, ETF, whale moves, liquidation anomalies.',
    stress_level: 'Stress Level',
    stress_level_desc: 'Aggregated market stress indicator',
    active_alerts: 'Active Alerts',
    quick_actions: 'Quick Actions',
    reduce_all: 'Reduce All',
    add_hedges: 'Add Hedges',
    set_stops: 'Set Stops',
    to_stables: 'To Stables',
    
    // Common
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    extreme: 'Extreme',
    normal: 'Normal',
    inflow: 'Inflow',
    outflow: 'Outflow',
    
    // Navigation
    posts: 'Posts',
    ideas: 'Ideas',
    chat: 'Chat',
    settings: 'Settings',
    ai_assistant: 'AI Assistant',
    collapse: 'Collapse',
    logout: 'Logout',
  }
};

// External links for data sources
export const dataSourceLinks = {
  coingecko: 'https://www.coingecko.com',
  coinmarketcap: 'https://coinmarketcap.com',
  coinglass: 'https://www.coinglass.com',
  arkham: 'https://platform.arkhamintelligence.com',
  sosovalue: 'https://sosovalue.xyz',
  glassnode: 'https://glassnode.com',
  alternative_me: 'https://alternative.me/crypto/fear-and-greed-index',
  deribit: 'https://www.deribit.com',
  hyperliquid: 'https://app.hyperliquid.xyz',
  defillama: 'https://defillama.com',
  tradingview: 'https://www.tradingview.com',
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ru';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ru' ? 'en' : 'ru');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export { translations };
