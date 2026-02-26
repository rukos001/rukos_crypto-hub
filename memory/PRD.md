# RUKOS_CRYPTO | HUB - Product Requirements Document

## Overview
Professional crypto trading dashboard with branded design, admin panel, knowledge base, and AI assistant.

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Recharts
- **Backend**: FastAPI + MongoDB (Motor) + JWT + role-based auth
- **Assets**: /public/logo.jpg (brand logo), /public/hero-video.mp4 (landing video)

## What's Implemented

### Branding & Design
- Video background on landing page (hero-video.mp4 converted from .mov)
- Logo image (logo.jpg) in hero section and sidebar
- SVG logo components (RukosLogo, RukosIcon, RukosWatermark)
- Subtle watermark cubes (2-3 per page, 3% opacity)
- Dark theme with orange/gold (#F7931A) accents

### Authentication
- JWT-based auth with role-based access (admin/user)
- Admin: admin@rukos.crypto / 1661616irk (seeded on startup)

### Admin Panel (/admin)
- **Users**: View all users (login, email, password show/hide), delete
- **Portfolio Manager**: Select user OR toggle "Apply to All Users" -> edit HOLD/ALTs/HI_RISK groups -> add/remove/save positions. "Apply to All" writes to every user's portfolio in MongoDB.
- **Chat**: View and moderate chat messages
- **Stats**: Platform statistics

### Portfolio Page (/portfolio)
- Separate sidebar item with HOLD / ALTs / HI RISK subgroups
- Filter by group, per-position PnL, group totals

### Knowledge Base (/knowledge/:category)
- Sidebar with expandable subgroups: DeFi, PERP, OPTIONS, MACRO
- 12 default educational articles (3 per category)
- Expandable article cards with tags, bold formatting

### Dashboard (8 tabs)
1. Market Core: BTC/ETH/SOL, Fear & Greed, Gold, Traditional Markets, Stablecoins, M2
2. Derivatives: OI, Funding, Long/Short, Liquidation Clusters, Gamma
3. ETF Intelligence: All/BTC/ETH filter (20 ETFs), AUM, flows
4. Onchain: BTC/ETH/SOL chain selector, SOPR, NUPL, MVRV, Exchange Flows
5. Altseason: Probability, Dominance, Sectors, DeFi TVL
6. Risk Engine: Risk score, Overheat alerts, Volatility
7. AI Signals: Composite signal, Squeeze, Weekly range, Key levels
8. War Mode: Stress level, Alerts, Quick actions

### Localization (RU/EN)
- Language switcher, all UI text localized

### UI Components
- Info tooltips on all key metrics
- Source links to data portals

## Testing
- iteration_7: Backend 59/59, Frontend 70/70, 0 regressions

## Data Status
- **MOCK**: All analytics, portfolio defaults, knowledge defaults

## Backlog
### P1
- Real API integrations (CoinGlass, SoSoValue, Arkham)
- CoinGecko caching
- WebSocket for real-time updates

### P2
- AI Assistant (GPT-5.2)
- Telegram bot
- Enhanced Posts/Ideas/Chat
- Admin knowledge article editor UI

### P3
- TradingView widgets
- Capital Flow Map
- Social & Sentiment tab
