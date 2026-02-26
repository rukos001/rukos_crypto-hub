# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with multi-source data aggregation, real-time analytics, and AI assistant.

## Core Requirements
- Dashboard with 9 analytical tabs
- Russian/English localization
- JWT authentication
- Data from CoinMarketCap, SoSoValue, Arkham, CoinGlass, Glassnode
- Telegram integration
- AI assistant
- Posts, Ideas, Chat sections

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT
- **Data**: Mock data in advanced_analytics.py (to be replaced with real APIs)

## What's Implemented

### Authentication
- JWT-based registration and login
- Protected routes

### Dashboard Tabs (9 total)
1. **Market Core**: BTC/ETH/SOL prices, Fear & Greed Index, Gold, Traditional Markets (DXY, US10Y, SPX, NQ), Stablecoins, Global M2 Liquidity
2. **Derivatives**: OI, Funding Rate, Long/Short Ratio, Liquidation Clusters, Gamma Exposure
3. **ETF Intelligence**: All/BTC/ETH fund filter, 20 total ETFs, AUM, daily flows, ETF Absorption signal
4. **Onchain**: BTC/ETH/SOL chain selector, SOPR, NUPL, MVRV, CDD, Exchange Flows, Whale Zones, Notable Wallets, Staking (ETH/SOL)
5. **Altseason Monitor**: Altseason probability, Dominance breakdown, Sector performance, DeFi TVL
6. **Risk Engine**: Risk score radar, Overheat alerts, Volatility, Leverage crowding
7. **AI Signals**: Composite signal, Squeeze probability, Weekly range, Liquidity zones, Key levels
8. **Portfolio**: Positions, PnL, Risk metrics
9. **War Mode**: Stress level, Active alerts, Quick actions

### Localization (RU/EN)
- Language switcher in sidebar
- All tab names, section headers, descriptions localized
- Language persists in localStorage

### UI Enhancements
- Info tooltips (i) on all key metrics with explanations
- Source links to data portals (CoinGecko, Glassnode, SoSoValue, CoinGlass, Arkham, TradingView, etc.)
- Dark theme with orange/gold accents

### Other Pages
- Landing page
- Posts page (CRUD)
- Ideas page (CRUD)
- Chat page (basic)
- Settings page

## Data Status
- **MOCK**: All analytics endpoints return simulated data from advanced_analytics.py
- **Partial Real**: Some CoinGecko data (rate-limited)

## Testing Status
- Backend: 20/20 tests passing
- Frontend: 27/27 Playwright specs passing
- Test reports: /app/test_reports/iteration_4.json

## Tech Stack
- React 18, Tailwind CSS, Shadcn/UI, Recharts, Axios
- FastAPI, Motor (MongoDB), Pydantic, JWT
- CoinGecko (pycoingecko) for partial real data

## Known Issues
- CoinGecko API rate limiting (falls back to mock data)
- Portfolio endpoint requires auth token

## Backlog (Priority Order)
### P1 - Next Up
- Replace mock data with real API integrations (CoinGlass, SoSoValue, Arkham)
- CoinGecko caching to fix rate limiting
- WebSocket for real-time updates

### P2 - Future
- AI Assistant (GPT-5.2 via Emergent LLM Key)
- Telegram bot integration
- Enhanced Posts/Ideas/Chat functionality
- Custom Block from Rukos (user portfolio data)

### P3 - Backlog
- User-specific custom block
- Advanced charting
- Capital Flow Map visualization
- Social & Sentiment tab
