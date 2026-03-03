# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with branded design, admin panel, knowledge base, predictions, and AI assistant.

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT + role-based auth
- **Data Service**: Centralized `data_service.py` for all real-time API calls
- **External APIs**: CoinGecko, Alternative.me, DeFi Llama, Polymarket

## What's Implemented

### Term Links to Knowledge Base (Mar 2026 - NEW)
- Created `TermLink` component (`/app/frontend/src/components/shared/TermLink.js`)
- All crypto terms throughout the dashboard now have clickable ? icons
- Clicking redirects to the relevant knowledge base article
- Auto-highlights and scrolls to the specific article
- 80+ terms mapped to articles:
  - DeFi: TVL, liquidity, yield farming, AMM, smart contracts
  - Derivatives: perpetual, funding rate, OI, leverage, liquidation
  - Options: gamma, delta, max pain, IV, greeks
  - Macro: DXY, M2, interest rates, global liquidity, risk-on/off
  - Onchain: SOPR, NUPL, MVRV, realized cap
- Russian translations included

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
- WebSocket for live updates
### P2
- AI Assistant (GPT-5.2), Telegram bot
- Posts/Ideas/Chat enhancements
### P3
- TradingView widgets, DB migration, server.py refactoring
