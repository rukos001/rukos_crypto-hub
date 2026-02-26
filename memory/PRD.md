# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with multi-source data, admin panel, knowledge base, and AI assistant.

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT + role-based auth
- **Data**: Mock data in advanced_analytics.py (to be replaced with real APIs)

## What's Implemented

### Authentication
- JWT-based registration and login with role-based access (admin/user)
- Admin: admin@rukos.crypto / 1661616irk (seeded on startup)

### Admin Panel (/admin)
- **Users**: View all users (login, email, password show/hide), delete non-admin users
- **Portfolio Manager**: Select any user -> edit HOLD/ALTs/HI_RISK groups -> add/remove/save positions (saved to MongoDB)
- **Chat**: View and moderate all chat messages
- **Stats**: Platform statistics (users, posts, ideas, messages)
- **Knowledge Management**: Create/delete knowledge articles (via API)

### Portfolio Page (/portfolio)
- Separate sidebar menu item
- **HOLD**: Long-term core positions (BTC, ETH)
- **ALTs**: Altcoin swing positions (SOL, AVAX, LINK, ARB)
- **HI RISK**: High risk/reward bets (PEPE, WIF, INJ)
- Filter by group, per-position PnL, group totals

### Knowledge Base (/knowledge/:category)
- Sidebar menu with expandable subgroups: DeFi, PERP, OPTIONS, MACRO
- 12 default educational articles (3 per category)
- Expandable article cards with tags, bold formatting
- Russian descriptions, localized UI
- Admin can create/delete articles via API

### Dashboard Tabs (8 total)
1. **Market Core**: BTC/ETH/SOL prices, Fear & Greed, Gold, Traditional Markets, Stablecoins, M2
2. **Derivatives**: OI, Funding Rate, Long/Short, Liquidation Clusters, Gamma
3. **ETF Intelligence**: All/BTC/ETH filter (20 ETFs), AUM, flows, Absorption
4. **Onchain**: BTC/ETH/SOL chain selector, SOPR, NUPL, MVRV, Exchange Flows, Staking
5. **Altseason Monitor**: Probability, Dominance, Sectors, DeFi TVL
6. **Risk Engine**: Risk score, Overheat alerts, Volatility, Leverage
7. **AI Signals**: Composite signal, Squeeze, Weekly range, Key levels
8. **War Mode**: Stress level, Alerts, Quick actions

### Localization (RU/EN)
- Language switcher in sidebar, all UI text localized

### UI Enhancements
- Info tooltips on all key metrics
- Source links to data portals (CoinGecko, Glassnode, SoSoValue, etc.)

## API Endpoints
- `/api/auth/{register, login, me}`
- `/api/admin/{users, stats, chat-messages, portfolio, portfolios, knowledge}` (admin only)
- `/api/portfolio/groups` (auth required)
- `/api/knowledge?category=` (public)
- `/api/analytics/{market-core, derivatives, etf-intelligence, onchain, altseason, risk-engine, ai-signals, war-mode}`

## Testing
- iteration_6: Backend 17/17, Frontend 15/15, Regression 32/32
- All test reports: /app/test_reports/

## Data Status
- **MOCK**: All analytics, portfolio defaults, knowledge defaults

## Backlog
### P1 - Next Up
- Real API integrations (CoinGlass, SoSoValue, Arkham)
- CoinGecko caching
- WebSocket for real-time updates

### P2 - Future
- AI Assistant (GPT-5.2)
- Telegram bot integration
- Enhanced Posts/Ideas/Chat
- User-editable portfolio from Portfolio page
- Custom Block from Rukos

### P3 - Backlog
- TradingView widgets
- Capital Flow Map
- Social & Sentiment tab
