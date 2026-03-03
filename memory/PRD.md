# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with branded design, admin panel, knowledge base, predictions, and AI assistant.

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT + role-based auth
- **Data Service**: Centralized `data_service.py` for all real-time API calls
- **External APIs**: CoinGecko, Alternative.me, DeFi Llama, Polymarket

## What's Implemented

### UX/UI Improvements (Mar 2026 - NEW ✅)
- **Fear & Greed Index карточка** — увеличена, добавлена пульсация при экстремальных значениях, сигнал покупки/продажи
- **РИСК-ОФФ баннер** — градиентный дизайн, прогресс-бар вместо рамки
- **Поиск в базе знаний** — мгновенный поиск по всем статьям, тегам и контенту
- **Pie Chart в портфеле** — круговая диаграмма распределения по группам (HOLD/ALTs/HI RISK)
- **Skeleton loaders** — анимированные скелетоны при загрузке данных
- **Мобильное меню** — dropdown с группировкой табов (Рынок/Аналитика/Сигналы)
- **Timestamp обновления** — показывает "Только что" / "X мин назад" после обновления
- **Переводы** — добавлены buy_signal, sell_signal, risk_score, группы табов

### Term Links to Knowledge Base (Mar 2026 - VERIFIED ✅)
- Created `TermLink` component (`/app/frontend/src/components/shared/TermLink.js`)
- All crypto terms throughout the dashboard now have clickable ? icons
- Clicking redirects to the relevant knowledge base article
- Auto-highlights and scrolls to the specific article
- 80+ terms mapped to **20 articles** across 6 categories:
  - DeFi (4 статьи): d1, d2, d3, st1 - TVL, liquidity, yield farming, AMM, stablecoins
  - Derivatives (4 статьи): p1, p2, p3, tr1 - perpetual, funding rate, OI, liquidation, support/resistance
  - Options (3 статьи): o1, o2, o3 - gamma, delta, max pain, IV, greeks, strategies
  - Macro (5 статей): m1, m2, m3, **m4**, alt1 - DXY, M2, global liquidity, **Risk-On/Off (отдельно)**, **Fear & Greed Index (отдельно)**, altseason
  - Onchain (3 статьи): on1, on2, on3 - SOPR, NUPL, MVRV, realized cap
  - ETF (1 статья): etf1 - AUM, inflows, outflows
- All 20 articles written in Russian
- **Bug fix (Mar 2026):** Разделены статьи Risk-On/Off (m3) и Индекс страха и жадности (m4) по запросу пользователя

### Full Russian Localization (Mar 2026)
- All UI components translate dynamically via LanguageContext.js
- Status translations: НЕЙТРАЛЬНО, БЫЧИЙ, ВЫСОКИЙ, etc.
- All alert types and messages translated

### Predictions Tab with Analytics (Mar 2026)
- Polymarket API integration with clickable links
- Analytics: market activity, avg probability, high confidence events
- 60-second auto-refresh

### Portfolio System (Mar 2026)
- "Мой портфель" tab: Full CRUD
- "Портфель RUKOS_CRYPTO" tab: Read-only team portfolio

### Real-Time Data
- CoinGecko, Alternative.me, DeFi Llama, Polymarket

### Dashboard (9 tabs)
1. Market Core - CoinGecko + Alternative.me
2. Derivatives - OI/funding with term links
3. ETF Intelligence - AUM/flow with term links
4. Onchain - SOPR/NUPL/MVRV with term links
5. Altseason - TVL/dominance with term links
6. Predictions - Polymarket with analytics
7. Risk Engine - Fear & Greed influence
8. AI Signals - Real price-based levels
9. War Mode - Real price volatility alerts

## Backlog
### P1
- CoinGlass API (real derivatives), SoSoValue (ETF flows)

### P2
- AI Assistant (GPT-5.2), Telegram bot
- Posts/Ideas/Chat enhancements
- CoinGecko rate limiting fix (exponential backoff)

### P3
- TradingView widgets, server.py refactoring

---

## Completed Migrations

### WebSocket Real-Time Updates (Mar 2026) ✅
- Added WebSocket endpoint `/api/ws/market` for live market data
- Created `useMarketWebSocket` React hook for auto-reconnection
- Created `LivePriceTicker` component in sidebar showing:
  - BTC, ETH, SOL prices with 24h change
  - Fear & Greed index
  - Connection status (Live/Offline)
  - Auto-updates every 30 seconds
- Note: Data depends on CoinGecko API (may show $0 during rate limiting)

### Knowledge Base Migration (Mar 2026) ✅
- Moved 20 articles from hardcoded `get_default_knowledge()` to MongoDB collection `knowledge`
- Created migration script: `/app/backend/migrate_knowledge.py`
- Reduced server.py from 2280 to 1513 lines (-767 lines)
- Categories: DeFi (4), Perp (4), Options (3), Macro (5), Onchain (3), ETF (1)
- API endpoint `/api/knowledge` now reads from MongoDB
- Admin CRUD endpoints available for article management
