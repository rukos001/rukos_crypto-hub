# RUKOS_CRYPTO | HUB - Product Requirements Document

## Original Problem Statement
Профессиональный криптовалютный хаб с продвинутой аналитикой для трейдеров.

## What's Been Implemented (Feb 2026)

### Phase 1 - MVP ✅
- Базовый Dashboard с крипто данными
- Посты, Идеи, Чат
- AI Ассистент (GPT-5.2)
- JWT авторизация

### Phase 2 - API & Charts ✅
- CoinGecko API интеграция
- Fear & Greed Index (реальный)
- Recharts графики

### Phase 3 - Professional Dashboard ✅ (Current)
9 профессиональных вкладок аналитики:

| Tab | Features |
|-----|----------|
| **Market Core** | Total MCap, BTC/ETH Dominance, TOTAL3, Stablecoins, DXY, US10Y, SPX, NQ, M2 Global, Risk-on/Risk-off |
| **Derivatives** | OI по BTC/ETH/SOL, Funding History chart, Long/Short Ratio, Basis, Top Traders, Gamma Exposure, Liquidation Clusters |
| **ETF Intelligence** | AUM, Daily Flows, Cumulative, % of Spot, Premium/Discount, Flow-Price Correlation, ETF Absorption Signal, Miner Metrics |
| **Onchain** | SOPR, NUPL, MVRV, CDD, Exchange Flows, Whale Accumulation Zones, Notable Wallets (MicroStrategy, US Gov, El Salvador...) |
| **Altseason** | Probability Score, TOTAL2/TOTAL3, Dominance Pie Chart, Sector Performance, Top50 vs BTC, Narrative Heatmap, DeFi TVL |
| **Risk Engine** | Risk Score 1-10, Radar Chart факторов, DVOL, Market Regime, Leverage Crowding, Stablecoin Flows, Overheat Alerts |
| **AI Signals** | Composite Signal (Onchain+Derivatives+ETF+Macro+Sentiment), Squeeze Probabilities, Liquidity Zones, Weekly Range |
| **Portfolio** | Positions, PnL, Leverage Exposure, Risk per Trade, Liquidation Distance, Risk of Ruin %, Concentration Warning |
| **War Mode** | Stress Score 0-100, Active Alerts (Funding/OI/ETF/Whale/Liquidation/Stablecoin Spikes), Quick Actions |

## Tech Stack
- Backend: FastAPI, MongoDB, httpx
- Frontend: React, Tailwind, Shadcn/UI, Recharts
- AI: OpenAI GPT-5.2 via Emergent LLM Key

## Test Results
- Backend: 96% (25/26 endpoints)
- Frontend: 100% (9/9 tabs)
- Overall: 98%

## Prioritized Backlog
### P0 (Done) ✅
- Advanced Dashboard with 9 tabs

### P1 (Next)
- Telegram Bot integration
- Real API connections (Coinglass, Arkham, SoSoValue paid APIs)
- WebSocket for real-time updates

### P2 (Later)
- Options Intelligence tab expansion
- Social & Sentiment tab
- Capital Flow Map visualization
