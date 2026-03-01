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
- **Fallback**: Graceful degradation with cached/fallback data on API failures (price-history generates synthetic history from real current price).
- **All 29 endpoints verified working** (22 public + 7 authenticated)

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
All tabs use real prices from CoinGecko as anchor:
1. Market Core - REAL: BTC/ETH/SOL prices, Fear & Greed, market caps, dominance
2. Derivatives - Simulated OI/funding anchored to real prices
3. ETF Intelligence - Simulated flows anchored to real prices
4. Onchain - Real prices + simulated metrics
5. Altseason - REAL: dominance, DeFi TVL + real alt performances
6. Risk Engine - Real Fear & Greed influence + simulated metrics
7. AI Signals - Real price-based key levels
8. War Mode - Real price volatility alerts

## API Endpoints (All Working)
### Public (22):
- GET /api/ - health
- GET /api/crypto/prices - real CoinGecko
- GET /api/crypto/price-history/{coin} - CoinGecko + fallback
- GET /api/crypto/etf-flows - simulated
- GET /api/crypto/whale-activity - real prices
- GET /api/crypto/liquidations - simulated
- GET /api/crypto/fear-greed - real Alternative.me
- GET /api/analytics/market-core - real
- GET /api/analytics/derivatives - simulated + real prices
- GET /api/analytics/etf-intelligence - simulated + real prices
- GET /api/analytics/onchain - real prices
- GET /api/analytics/altseason - real DeFi Llama + CoinGecko
- GET /api/analytics/risk-engine - real F&G
- GET /api/analytics/options - real prices
- GET /api/analytics/sentiment - simulated
- GET /api/analytics/capital-flows - simulated
- GET /api/analytics/ai-signals - real prices
- GET /api/analytics/war-mode - real prices
- GET /api/knowledge - hardcoded
- GET /api/posts - MongoDB
- GET /api/ideas - MongoDB
- GET /api/chat - MongoDB

### Authenticated (7):
- GET /api/auth/me
- GET /api/analytics/portfolio
- GET /api/portfolio/groups
- GET /api/admin/users (admin)
- GET /api/admin/stats (admin)
- GET /api/admin/chat-messages (admin)
- GET /api/admin/portfolios (admin)

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
- Posts/Ideas/Chat enhancements

### P3
- TradingView widgets
- Database migration (hardcoded data -> MongoDB)
- Refactor server.py monolith into modules
