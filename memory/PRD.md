# RUKOS_CRYPTO | HUB - Product Requirements Document

## Original Problem Statement
Создать веб-приложение RUKOS_CRYPTO | HUB, которое предоставляет ключевые данные с CoinMarketCap, SoSoValue, Arkham, Coinglass. Должна быть вкладка для постов, возможность подключить Telegram, окно с AI-помощником, вкладка для идей, и чат.

## User Personas
- **Криптотрейдеры**: Активные трейдеры, следящие за рынком 24/7
- **Инвесторы**: Долгосрочные держатели, анализирующие whale activity и ETF потоки
- **Комьюнити**: Пользователи, желающие делиться идеями и общаться

## Core Requirements (Static)
1. ✅ Криптовалютные данные (BTC, ETH, SOL) - цены, капитализация
2. ✅ ETF потоки (SoSoValue стиль)
3. ✅ Whale Activity (Arkham стиль)
4. ✅ Ликвидации (Coinglass стиль)
5. ✅ Посты пользователей с тегами
6. ✅ Торговые идеи (coin, direction, target, stoploss)
7. ✅ Общий чат
8. ✅ AI Ассистент (GPT-5.2)
9. ✅ JWT авторизация
10. ⏳ Telegram интеграция (placeholder готов)

## What's Been Implemented (Jan 2026)
- **Backend**: FastAPI + MongoDB
  - Auth (register/login/me)
  - Posts CRUD + likes
  - Ideas CRUD + likes
  - Chat messages
  - AI Assistant (emergentintegrations + GPT-5.2)
  - Mock crypto data endpoints
- **Frontend**: React + Tailwind + Shadcn/UI
  - Landing page
  - Auth page (login/register)
  - Dashboard (Bento grid layout)
  - Posts page
  - Ideas page
  - Chat page
  - Settings page (Telegram placeholder)
  - AI Assistant modal
  - Responsive sidebar

## Prioritized Backlog
### P0 (Critical)
- Реальные API интеграции (CoinMarketCap, Coinglass, Arkham, SoSoValue)

### P1 (High)
- Telegram Bot интеграция для уведомлений
- WebSocket для real-time чата
- Графики (Recharts) для ETF потоков и ликвидаций

### P2 (Medium)
- Комментарии к постам и идеям
- Фильтрация идей по монетам
- История AI чата

## Tech Stack
- Backend: FastAPI, MongoDB, emergentintegrations
- Frontend: React, Tailwind CSS, Shadcn/UI
- AI: OpenAI GPT-5.2 via Emergent LLM Key

## Design Theme
- Dark mode (#050505 background)
- Orange/Gold accents (#F7931A, #FFD700)
- Fonts: Space Grotesk (headings), Manrope (body), JetBrains Mono (data)
