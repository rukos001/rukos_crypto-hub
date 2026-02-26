# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with multi-source data aggregation, real-time analytics, admin panel, and AI assistant.

## Core Requirements
- Dashboard with 8 analytical tabs (Market Core, Derivatives, ETF Intelligence, Onchain, Altseason, Risk Engine, AI Signals, War Mode)
- Separate Portfolio page with HOLD / ALTs / HI RISK subgroups
- Admin panel with user management, chat management, platform stats
- Russian/English localization with language switcher
- JWT authentication with role-based access (admin/user)
- Info tooltips and source links throughout dashboard

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT + role-based auth
- **Data**: Mock data in advanced_analytics.py (to be replaced with real APIs)

## What's Implemented

### Authentication
- JWT-based registration and login
- Role-based access: `admin` and `user` roles
- Admin account: admin@rukos.crypto / 1661616irk (seeded on startup)
- Protected routes with auth middleware

### Admin Panel (/admin)
- **Users**: View all registered users with login, email, password (show/hide), role badge, delete
- **Chat**: View and moderate all chat messages
- **Stats**: Platform statistics (users, posts, ideas, messages)
- Admin link only visible in sidebar for admin users
- Non-admin users see "Access Denied"

### Portfolio Page (/portfolio)
- Separate sidebar menu item (moved out of dashboard tabs)
- **HOLD**: Long-term core positions (BTC, ETH)
- **ALTs**: Altcoin swing positions (SOL, AVAX, LINK, ARB)
- **HI RISK**: High risk/reward bets (PEPE, WIF, INJ)
- Filter by group (All Groups / HOLD / ALTs / HI RISK)
- Per-position PnL calculation and group totals

### Dashboard Tabs (8 total)
1. **Market Core**: BTC/ETH/SOL prices, Fear & Greed, Gold, Traditional Markets, Stablecoins, Global M2
2. **Derivatives**: OI, Funding Rate, Long/Short Ratio, Liquidation Clusters, Gamma Exposure
3. **ETF Intelligence**: All/BTC/ETH fund filter (20 ETFs), AUM, daily flows, ETF Absorption
4. **Onchain**: BTC/ETH/SOL chain selector, SOPR, NUPL, MVRV, CDD, Exchange Flows, Whale Zones, Staking
5. **Altseason Monitor**: Probability, Dominance breakdown, Sector performance, DeFi TVL
6. **Risk Engine**: Risk score radar, Overheat alerts, Volatility, Leverage crowding
7. **AI Signals**: Composite signal, Squeeze probability, Weekly range, Liquidity zones, Key levels
8. **War Mode**: Stress level, Active alerts, Quick actions

### Localization (RU/EN)
- Language switcher in sidebar
- All UI text localized
- Language persists in localStorage

### UI Enhancements
- Info tooltips (i) on all key metrics
- Source links to data portals (CoinGecko, Glassnode, SoSoValue, CoinGlass, Arkham, TradingView)
- Dark theme with orange/gold accents

## API Endpoints
- `/api/auth/{register, login, me}`
- `/api/admin/{users, stats, chat-messages}` (admin only)
- `/api/portfolio/groups` (auth required)
- `/api/analytics/{market-core, derivatives, etf-intelligence, onchain, altseason, risk-engine, ai-signals, war-mode}`
- `/api/posts`, `/api/ideas`, `/api/chat`

## DB Schema
- `users`: `{id, username, email, password_hash, raw_password, role, created_at}`
- `posts`: `{id, title, content, tags, author_id, author_username, created_at, likes}`
- `ideas`: `{id, title, content, coin, direction, target_price, stop_loss, author_id, ...}`
- `chat_messages`: `{id, content, author_id, author_username, created_at}`
- `portfolios`: `{user_id, groups: {HOLD, ALTs, HI_RISK}}`

## Testing
- Backend: 36/36 tests (iteration 4 + 5)
- Frontend: 49/49 Playwright specs
- Test reports: /app/test_reports/iteration_5.json

## Data Status
- **MOCK**: All analytics and portfolio data is simulated
- **Partial Real**: Some CoinGecko data (rate-limited)

## Backlog
### P1 - Next Up
- Replace mock data with real API integrations (CoinGlass, SoSoValue, Arkham)
- CoinGecko caching for rate limiting
- WebSocket for real-time updates

### P2 - Future
- AI Assistant (GPT-5.2 via Emergent LLM Key)
- Telegram bot integration
- Enhanced Posts/Ideas/Chat functionality
- User-specific custom portfolio editing (CRUD)
- Custom Block from Rukos

### P3 - Backlog
- Advanced charting / TradingView widget
- Capital Flow Map visualization
- Social & Sentiment tab
