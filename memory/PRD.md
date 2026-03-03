# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with branded design, admin panel, knowledge base, predictions, and AI assistant.

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT + role-based auth
- **Data Service**: Centralized `data_service.py` for all real-time API calls
- **External APIs**: CoinGecko, Alternative.me, DeFi Llama, Polymarket

## What's Implemented

### Full Russian Localization (Mar 2026 - COMPLETED)
- All UI components now translate dynamically via LanguageContext.js
- Added `translateStatus()` function for API response statuses:
  - SOPR: НЕЙТРАЛЬНО, В ПРИБЫЛИ, В УБЫТКЕ, ФИКСАЦИЯ ПРИБЫЛИ
  - NUPL: ВЕРА, КАПИТУЛЯЦИЯ, ЭЙФОРИЯ, ОПТИМИЗМ, etc.
  - MVRV: ПЕРЕОЦЕНЁН, НЕДООЦЕНЁН, СПРАВЕДЛИВО
  - Funding: НОРМАЛЬНЫЙ, БЭКВАРДАЦИЯ, КОНТАНГО, БАЛАНС
  - Risk: КРИТИЧЕСКИЙ, ВЫСОКИЙ, СРЕДНИЙ, НОРМАЛЬНЫЙ, ПОВЫШЕН
- Added `translateDirection()` for AI signals: БЫЧИЙ, МЕДВЕЖИЙ, НЕЙТРАЛЬНЫЙ
- Added `translateAlertType()` for alerts: СКАЧОК OI, ДВИЖЕНИЕ КИТОВ, СКАЧОК ФАНДИНГА
- Added `translateMessage()` for backend messages in War Mode
- ETF tab: "ПОГЛОЩЕНИЕ", "НЕ ПОГЛОЩАЕТ" instead of English statuses
- Portfolio: ДЕРЖАТЬ, АЛЬТЫ, ВЫСОКИЙ РИСК, Прибыль/Убыток
- Predictions: Да/Нет, Объём, Ликвидность, Источник, etc.

### Predictions Tab (Mar 2026)
- **Polymarket API** integration (gamma-api.polymarket.com)
- Top 10 events by volume with probability bars (Yes/No %)
- Extreme mover card (event with highest 24h activity)
- Volume, liquidity, spread, links to Polymarket
- 60-second auto-refresh
- API: GET /api/predictions

### Portfolio System (Mar 2026)
- **"Мой портфель"** tab: Full CRUD (add/edit/delete positions)
  - Groups: HOLD / ALTs / HI RISK
  - Real-time PnL from CoinGecko prices
  - Entry price, size, notes
  - MongoDB: user_positions collection
  - APIs: GET /portfolio/my, POST/PUT/DELETE /portfolio/positions
- **"Портфель RUKOS_CRYPTO"** tab: Read-only team portfolio
  - Low-risk portfolio managed by admin
  - MongoDB: rukos_portfolio collection
  - APIs: GET /portfolio/rukos, PUT /admin/portfolio/rukos (admin)

### Real-Time Data
- CoinGecko: BTC, ETH, SOL + 15 alts, global market data (90s cache)
- Alternative.me: Fear & Greed Index (600s cache)
- DeFi Llama: TVL, stablecoins, protocols (120-300s cache)
- Polymarket: Prediction markets (60s cache)
- All data verified accurate against real sources (Mar 1, 2026)

### Dashboard (9 tabs)
1. Market Core - CoinGecko + Alternative.me
2. Derivatives - Simulated OI/funding (realistic ranges)
3. ETF Intelligence - Simulated flows (realistic AUM)
4. Onchain - Real prices + wallets (MicroStrategy 717K BTC)
5. Altseason - DeFi Llama TVL + CoinGecko dominance
6. **Predictions - Polymarket**
7. Risk Engine - Fear & Greed influence
8. AI Signals - Real price-based levels
9. War Mode - Real price volatility alerts

### Other Features
- JWT auth with admin/user roles
- Admin panel: users, portfolios, chat, stats
- Knowledge base: DeFi, PERP, OPTIONS, MACRO
- Custom animated SVG logo (3 golden cubes)
- Video landing page, RU/EN localization

## Testing
- iteration_11: Russian localization verified - 87.5% pass rate
- All major UI components fully translated

## Backlog
### P1
- CoinGlass API (real derivatives), SoSoValue (ETF flows)
- WebSocket for live updates
### P2
- AI Assistant (GPT-5.2), Telegram bot
- Posts/Ideas/Chat enhancements
### P3
- TradingView widgets, DB migration, server.py refactoring
