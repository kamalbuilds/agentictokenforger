# LaunchPad AI - Frontend

**Next.js 14 Responsive Web Application**

## Features

- ✅ **Fully Responsive** - Mobile-first design
- ✅ **Solana Wallet Integration** - Phantom, Solflare, Backpack
- ✅ **Real-time Updates** - WebSocket integration
- ✅ **AI Recommendations** - Live ML predictions
- ✅ **Dark Mode** - Beautiful UI with Tailwind CSS
- ✅ **Type-Safe** - Full TypeScript support

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (Animations)
- **Solana Wallet Adapter**
- **Socket.IO Client**
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
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Home page
│   │   ├── launch/       # Launch token page
│   │   ├── discover/     # Discover tokens
│   │   ├── portfolio/    # User portfolio
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── layout/       # Layout components (Header, Footer)
│   │   ├── home/         # Home page components
│   │   └── providers/    # Context providers
│   └── lib/             # Utilities and helpers
├── public/              # Static assets
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

## Features

### Home Page
- Live platform statistics
- Trending token launches
- Quick action cards
- Feature highlights

### Launch Page
- Token creation form
- AI-powered recommendations
- Real-time validation
- One-click deployment

### Discover Page
- Token listings with filters
- Risk scores and metrics
- Search and sort functionality

### Portfolio Page
- User token holdings
- Performance analytics
- Transaction history

## Responsive Design

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

Fully optimized for all screen sizes!

## Development

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

---

Built with ❤️ for ASI Alliance & Solana Hackathons 2025
