# Clexpay - Fintech Platform

A 3-in-1 fintech platform for crypto trading, bill payments, and gift card trading.

## Features

- **Crypto Trading**: Buy, Sell, Swap Bitcoin, Ethereum, and USDT
- **Bill Payments**: Airtime, Data, Electricity, Cable TV, Betting
- **Gift Cards**: Purchase gift cards from top brands
- **Multi-Currency Wallet**: NGN, BTC, ETH, USDT wallets
- **Admin Panel**: User management, transaction oversight, system settings
- **Demo/Live Mode**: Service provider architecture with easy switching

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Hosting**: Vercel

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/setugbo/clexpay.git
cd clexpay
npm install
```

### 2. Create Environment File

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-32-character-string"
```

**To generate NEXTAUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/setugbo/clexpay.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository (`setugbo/clexpay`)
4. Add these Environment Variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_URL` | Your Vercel URL (e.g., `https://clexpay.vercel.app`) |
| `NEXTAUTH_SECRET` | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

5. Click **Deploy**

### Step 3: After Deployment

1. Note your Vercel deployment URL
2. Update `NEXTAUTH_URL` in Vercel environment variables with the actual URL
3. Redeploy to apply the change

## Project Structure

```
clexpay/
├── app/
│   ├── (auth)/              # Login, Register pages
│   ├── (dashboard)/         # Protected dashboard
│   │   ├── admin/          # Admin: Users, Transactions, Settings
│   │   ├── wallet/         # Wallet management
│   │   ├── crypto/         # Crypto trading
│   │   ├── bills/          # Bill payments
│   │   └── giftcards/      # Gift cards
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Feature components
├── lib/
│   ├── services/           # Business logic (demo/live)
│   └── prisma.ts          # Database client
├── prisma/
│   └── schema.prisma       # Database schema
└── public/                 # Static assets
```

## Service Architecture

```
Service Factory (checks system_mode)
         │
         ├── DEMO mode → Demo Wallet/Crypto/Bill/GiftCard Services
         │
         └── LIVE mode → Live Wallet/Crypto/Bill/GiftCard Services
```

Switch between modes in **Admin Panel → Settings**.

## Database Commands

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema changes to database
npm run db:studio     # Open database GUI
npm run db:migrate    # Run migrations
```

## Making Updates

```bash
# Make your changes
git add .
git commit -m "Your commit message"
git push origin main

# Vercel auto-deploys on every push!
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm run db:generate` |
| Database connection failed | Check `DATABASE_URL` has `?sslmode=require` |
| Auth not working | Verify `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set |
| Build failed | Check Vercel deployment logs |

## License

MIT
