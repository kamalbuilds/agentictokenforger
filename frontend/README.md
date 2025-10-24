# SOLTokenForger - Frontend

**Next.js 14 Responsive Web Application** - 100% Complete & Production Ready ✅

## Features

- ✅ **Fully Responsive** - Mobile-first design
- ✅ **Solana Wallet Integration** - Phantom, Solflare
- ✅ **Real-time Updates** - WebSocket integration
- ✅ **AI Recommendations** - Live ML predictions
- ✅ **Complete API Layer** - TypeScript client with error handling
- ✅ **5 Core Pages** - Home, Launch, Discover, Portfolio, Profile
- ✅ **Dark Mode** - Beautiful UI with Tailwind CSS
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Production Build Tested** - Ready for deployment

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (Animations)
- **Solana Wallet Adapter**
- **Socket.IO Client** (WebSocket)
- **Axios** (HTTP Client)
- **Zustand** (State Management)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # ✅ Home page
│   │   ├── layout.tsx                # ✅ Root layout
│   │   ├── globals.css               # ✅ Global styles
│   │   ├── launch/
│   │   │   └── page.tsx              # ✅ Launch token page
│   │   ├── discover/
│   │   │   └── page.tsx              # ✅ Discover tokens page
│   │   ├── portfolio/
│   │   │   └── page.tsx              # ✅ User portfolio page
│   │   └── profile/
│   │       └── page.tsx              # ✅ User profile page
│   ├── components/                   # React components
│   │   ├── layout/
│   │   │   └── Header.tsx            # ✅ Navigation
│   │   ├── home/
│   │   │   ├── StatsCards.tsx        # ✅ Platform stats
│   │   │   ├── QuickActions.tsx      # ✅ Action cards
│   │   │   └── TrendingLaunches.tsx  # ✅ Token listings
│   │   └── providers/
│   │       └── WalletProvider.tsx    # ✅ Solana wallet
│   └── lib/                          # ✅ API & Utilities
│       ├── api/
│       │   ├── client.ts             # Axios client
│       │   ├── types.ts              # TypeScript types
│       │   ├── launch.ts             # Launch API
│       │   ├── tokens.ts             # Tokens API
│       │   ├── portfolio.ts          # Portfolio API
│       │   ├── risk.ts               # Risk API
│       │   ├── stats.ts              # Stats API
│       │   └── index.ts              # Exports
│       └── websocket.ts              # WebSocket client
├── public/                           # Static assets
└── package.json
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Build & Deploy

```bash
# Production build
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel deploy
```

## Pages

### ✅ Home Page (`/`)
- Hero section with gradient text
- Live platform statistics (4 stat cards)
- Quick action cards (Launch, Discover, Portfolio, Profile)
- Trending token launches (3 cards)
- Feature highlights (3 sections)
- Fully responsive with animations

### ✅ Launch Page (`/launch`)
- Complete token creation form
- AI-powered recommendations
- Real-time validation
- Wallet integration
- API integration for submission
- Loading states and error handling

### ✅ Discover Page (`/discover`)
- Token listings grid with filters
- Search functionality (name/symbol)
- Category filter (Meme, DeFi, AI, Gaming, Utility)
- Sort by Market Cap, Holders, Risk Score, Progress
- Risk score visualization
- Token details cards with badges

### ✅ Portfolio Page (`/portfolio`)
- Wallet connection requirement
- Portfolio summary (Total Value, P&L, Holdings)
- Token holdings table with:
  - Balance and value
  - 24h price changes
  - Profit/Loss calculations
- Recent transactions list

### ✅ Profile Page (`/profile`)
- User statistics dashboard
- Performance metrics (Success Rate, Avg Risk Score)
- Achievements and badges
- Settings:
  - Risk tolerance slider
  - Notification preferences
  - Save settings functionality

## Responsive Design

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

Fully optimized for all screen sizes!

## API Integration

### API Client (`src/lib/api/`)

Complete TypeScript API layer with:

- **client.ts** - Axios instance with interceptors
- **types.ts** - Full TypeScript type definitions
- **launch.ts** - Token launch endpoints
- **tokens.ts** - Token discovery & details
- **portfolio.ts** - User holdings & transactions
- **risk.ts** - Risk analysis endpoints
- **stats.ts** - Platform & user statistics

### WebSocket Client (`src/lib/websocket.ts`)

Real-time updates with:

- Auto-reconnection (5 attempts)
- Launch progress updates
- Risk alerts
- Price updates
- Liquidity notifications
- Room management (join/leave)

## Development

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Production build
npm run build

# Start production server
npm start
```

## Production Status

✅ **Build Status**: Successful
✅ **Type Checking**: Passed
✅ **All Pages**: 5/5 Complete
✅ **API Layer**: 100% Complete
✅ **WebSocket**: Fully Integrated
✅ **Deployment**: Ready for Vercel

---

Built with ❤️ for ASI Alliance & Solana Hackathons 2025
