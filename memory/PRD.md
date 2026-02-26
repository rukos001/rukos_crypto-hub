# RUKOS_CRYPTO | HUB - Product Requirements Document

## Original Problem Statement
Создать веб-приложение RUKOS_CRYPTO | HUB с криптовалютными данными с CoinMarketCap, SoSoValue, Arkham, Coinglass. Вкладка для постов, Telegram интеграция, AI-помощник, вкладка для идей, чат.

## What's Been Implemented (Jan-Feb 2026)

### Phase 1 - MVP ✅
- Dashboard с крипто данными
- Посты, Идеи, Чат
- AI Ассистент (GPT-5.2)
- JWT авторизация
- Тёмная тема с оранжевым/золотым

### Phase 2 - API & Charts ✅ (Current)
- **CoinGecko API** - реальные цены BTC/ETH/SOL (с fallback)
- **Alternative.me API** - реальный Fear & Greed Index
- **Графики Recharts**:
  - Price history (Area chart)
  - ETF Flows (Bar chart)
  - Liquidations (Stacked bar chart)
  - Fear & Greed (Line chart)
- Симулированные данные: ETF flows, Whale activity, Liquidations

## Data Sources
| Data | Source | Status |
|------|--------|--------|
| Prices BTC/ETH/SOL | CoinGecko API | ✅ Real |
| Fear & Greed | Alternative.me | ✅ Real |
| ETF Flows | SoSoValue | Simulated |
| Whale Activity | Arkham | Simulated |
| Liquidations | Coinglass | Simulated |

## Tech Stack
- Backend: FastAPI, MongoDB, httpx, emergentintegrations
- Frontend: React, Tailwind, Shadcn/UI, Recharts
- AI: OpenAI GPT-5.2 via Emergent LLM Key

## Prioritized Backlog
### P0 (Critical) - Done ✅
- Real price data
- Charts/visualizations

### P1 (High)
- Telegram Bot integration
- WebSocket for real-time chat
- Real ETF/Whale/Liquidations APIs (paid subscriptions required)

### P2 (Medium)
- Comments on posts/ideas
- Advanced filtering
- Push notifications

## API Endpoints
- `/api/crypto/prices` - BTC/ETH/SOL prices (CoinGecko)
- `/api/crypto/price-history/{coin}` - Price charts
- `/api/crypto/etf-flows` - ETF data
- `/api/crypto/whale-activity` - Whale alerts
- `/api/crypto/liquidations` - Liquidation data
- `/api/crypto/fear-greed` - Fear & Greed Index (real)
