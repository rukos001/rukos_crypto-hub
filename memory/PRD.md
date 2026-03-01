# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with branded design, admin panel, knowledge base, and AI assistant.

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT + role-based auth
- **Data Service**: Centralized `data_service.py` for all real-time API calls
- **Assets**: /public/hero-video.mp4 (landing video)

## What's Implemented

### Real-Time Data (Updated Mar 2026)
- **CoinGecko**: Real prices for BTC, ETH, SOL + 15 altcoins. Global market cap, dominance. 90s cache.
- **Alternative.me**: Real Fear & Greed Index with 7-day history. 600s cache.
- **DeFi Llama**: Real DeFi TVL, top protocols, stablecoin market caps, chain TVL. 120-300s cache.
- **Centralized data_service.py**: Single source of truth, prevents duplicate API calls.
- **Auto-refresh**: Frontend polls every 60 seconds.
- **Fallback**: Graceful degradation with cached/fallback data on API failures.

### Branding & Design (Updated Feb 2026)
- Video background on landing page (hero-video.mp4)
- Custom animated SVG logo: 3 golden wireframe cubes + "RUKOS_CRYPTO | HUB" text
- Components: `RukosAnimatedLogo`, `RukosCubeIcon`, `RukosSidebarLogo`
- No watermarks on any page
- Sidebar collapse button: transparent background
- Dark theme with orange/gold (#F7931A / #FFD700) accents

### Authentication
- JWT-based auth with role-based access (admin/user)
- Admin: admin@rukos.crypto / 1661616irk

### Admin Panel (/admin)
- Users management, portfolio editor, chat moderation, stats

### Portfolio Page (/portfolio)
- HOLD / ALTs / HI RISK groups with PnL

### Knowledge Base (/knowledge/:category)
- DeFi, PERP, OPTIONS, MACRO categories with articles

### Dashboard (8 tabs)
1. Market Core - REAL: BTC/ETH/SOL prices, Fear & Greed, market caps, dominance
2. Derivatives - Simulated OI/funding anchored to real prices
3. ETF Intelligence - Simulated flows anchored to real prices
4. Onchain - Real prices + simulated metrics
5. Altseason - REAL: dominance, DeFi TVL + real alt performances
6. Risk Engine - Real Fear & Greed influence + simulated metrics
7. AI Signals - Real price-based key levels
8. War Mode - Real price volatility alerts

## Data Status
- **REAL**: CoinGecko prices, Alternative.me F&G, DeFi Llama TVL/stablecoins
- **SIMULATED (anchored to real prices)**: Derivatives OI, ETF flows, DXY/SPX/Gold, Sentiment

## Testing
- iteration_9: Backend 98/98, Frontend 68/68, 0 regressions

## Backlog

### P1
- Connect real APIs: CoinGlass (derivatives), SoSoValue (ETF flows), Arkham (whales)
- WebSocket for real-time updates
- Traditional markets API (DXY, SPX, Gold)

### P2
- AI Assistant (GPT-5.2)
- Telegram bot integration
- Enhanced Posts/Ideas/Chat
- Admin knowledge article editor UI

### P3
- TradingView widgets
- Capital Flow Map
- Social & Sentiment tab
- Database migration (hardcoded data -> MongoDB)
- Refactor server.py monolith into modules
