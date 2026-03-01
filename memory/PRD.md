# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with branded design, admin panel, knowledge base, and AI assistant.

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT + role-based auth
- **Data Service**: Centralized `data_service.py` for all real-time API calls
- **Assets**: /public/hero-video.mp4 (landing video)

## What's Implemented

### Real-Time Data (Verified Mar 1, 2026)
- **CoinGecko**: Real prices for BTC, ETH, SOL + 15 altcoins. Global market cap, dominance. 90s cache.
- **Alternative.me**: Real Fear & Greed Index with 7-day history. 600s cache.
- **DeFi Llama**: Real DeFi TVL ($94.8B), top protocols, stablecoin market caps ($305.7B), chain TVL. 120-300s cache.
- **Centralized data_service.py**: Single source of truth, prevents duplicate API calls.
- **Auto-refresh**: Frontend polls every 60 seconds.
- **All data verified against real sources**: BTC $67K, Gold $5,278, DXY 97.6, SPX 6,879, NQ 24,960, US10Y 3.95%
- **All 29 endpoints verified working** (24 public + 7 authenticated)

### Simulated Data (Anchored to Real Prices)
- Derivatives OI/funding: Realistic ranges (funding 0.01-0.1%, L/S 0.85-1.2)
- ETF flows: Realistic AUM (IBIT $52B, GBTC $19B)
- Traditional markets: DXY ~97.6, SPX ~6,880, Gold ~$5,278, US10Y ~3.95%
- Onchain wallets: MicroStrategy 717,722 BTC (verified Feb 2026)

### Branding & Design
- Custom animated SVG logo: 3 golden wireframe cubes + "RUKOS_CRYPTO | HUB"
- Video landing page, no watermarks, transparent collapse button

### Features
- JWT auth with admin/user roles (admin@rukos.crypto / 1661616irk)
- Admin panel: users, portfolios, chat, stats
- Portfolio page: HOLD/ALTs/HI RISK groups
- Knowledge base: DeFi, PERP, OPTIONS, MACRO
- Dashboard: 8 tabs with real + simulated data
- RU/EN localization

## Testing
- iteration_9: Backend 98/98, Frontend 68/68
- All 29 API endpoints verified 200 status
- Data accuracy verified against real sources

## Backlog
### P1
- CoinGlass API (real derivatives data)
- SoSoValue API (real ETF flows)
- WebSocket for live updates
### P2
- AI Assistant (GPT-5.2)
- Telegram integration
- Posts/Ideas/Chat
### P3
- TradingView widgets
- DB migration, server.py refactoring
