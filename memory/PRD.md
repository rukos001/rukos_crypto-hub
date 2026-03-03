# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with branded design, admin panel, knowledge base, predictions, and AI assistant.

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT + role-based auth
- **Data Service**: Centralized `data_service.py` for all real-time API calls
- **External APIs**: CoinGecko, Alternative.me, DeFi Llama, Polymarket

## What's Implemented

### Predictions Tab (Mar 2026 - NEW)
- **Polymarket API** integration (gamma-api.polymarket.com)
- Top 10 events by volume with probability bars (Yes/No %)
- Extreme mover card (event with highest 24h activity)
- Volume, liquidity, spread, links to Polymarket
- 60-second auto-refresh
- API: GET /api/predictions

### Portfolio System (Mar 2026 - REDESIGNED)
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
6. **Predictions - Polymarket (NEW)**
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
- iteration_10: Backend 124/124, Frontend 42/42, 0 regressions

## Backlog
### P1
- CoinGlass API (real derivatives), SoSoValue (ETF flows)
- WebSocket for live updates
### P2
- AI Assistant (GPT-5.2), Telegram bot
- Posts/Ideas/Chat enhancements
### P3
- TradingView widgets, DB migration, server.py refactoring
