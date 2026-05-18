# Clexpay - Fintech Platform Documentation

## 1. Project Overview

**Clexpay** is a 3-in-1 fintech platform providing:
1. **Crypto Trading** - Buy, Sell, Swap cryptocurrencies
2. **Bill Payments** - Airtime, Data, Electricity, Cable TV, Betting
3. **Gift Card Trading** - Buy and sell gift cards

### Design Philosophy: Palmreimit Style
Based on Palremit's fintech design language:
- **Color Scheme**: Primary Green (#10B981), Dark Navy (#0F172A), Soft whites
- **Visual Elements**: Soft glassmorphism, rounded corners (12-16px radius), generous whitespace
- **Typography**: Inter/Sans-serif, clean hierarchy
- **Motion**: Subtle fade-ins, smooth transitions (200-300ms ease)
- **Cards**: Elevated with subtle shadows, soft gradients

---

## 2. Architecture Overview

### Service Provider Pattern
Each module implements a two-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                             │
│  (React + TypeScript + Tailwind CSS)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  (Express.js Routes → Controllers)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ INTERFACE       │  │ IMPLEMENTATION  │                   │
│  │ (Contracts)     │  │ (Demo | Live)   │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
│  • CryptoServiceInterface                                    │
│    ├── DemoCryptoService                                     │
│    └── LiveCryptoService (stub)                              │
│                                                              │
│  • WalletServiceInterface                                    │
│    ├── DemoWalletService                                     │
│    └── LiveWalletService (stub)                              │
│                                                              │
│  • BillServiceInterface                                      │
│    ├── DemoBillService                                       │
│    └── LiveBillService (stub)                                │
│                                                              │
│  • GiftCardServiceInterface                                  │
│    ├── DemoGiftCardService                                   │
│    └── LiveGiftCardService (stub)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                           │
│  (Repositories → PostgreSQL/MySQL)                           │
└─────────────────────────────────────────────────────────────┘
```

### Mode Switching
- System operates in **DEMO** or **LIVE** mode
- Configuration stored in `settings` table
- Admin panel provides toggle for mode switching
- Service factory returns appropriate implementation based on mode

---

## 3. Technical Stack

### Full-Stack Framework
| Component | Technology |
|-----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript 5.x |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Prisma |
| Auth | NextAuth.js |
| Hosting | Vercel |

### Frontend
| Component | Technology |
|-----------|------------|
| UI Library | shadcn/ui |
| Styling | Tailwind CSS 3.x |
| State | Zustand + React Query |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Frontend Hosting | Vercel |
| Database | Neon (Serverless PostgreSQL) |
| Git | GitHub |
| CI/CD | Vercel Auto-Deploy |

### Infrastructure (Recommendations)
| Component | Technology |
|-----------|------------|
| Container | Docker + Docker Compose |
| Web Server | Nginx |
| CI/CD | GitHub Actions |
| Cloud | AWS / Vercel / Railway |

---

## 4. Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
    role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Wallets Table
```sql
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    currency VARCHAR(10) NOT NULL, -- NGN, BTC, ETH, USDT
    balance DECIMAL(20, 8) DEFAULT 0,
    is_crypto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, currency)
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- deposit, withdrawal, transfer, trade, bill, giftcard
    subtype VARCHAR(50), -- buy, sell, swap, airtime, data, etc.
    currency VARCHAR(10),
    amount DECIMAL(20, 8) NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    status ENUM('pending', 'success', 'failed', 'cancelled') DEFAULT 'pending',
    reference VARCHAR(100) UNIQUE,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Settings Table
```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value) VALUES
('system_mode', '{"mode": "demo"}'),
('api_keys', '{"crypto": {}, "bills": {}, "giftcards": {}}'),
('exchange_rates', '{"BTC_NGN": 50000000, "ETH_NGN": 3500000, "USDT_NGN": 1500}'),
('fees', '{"crypto_buy": 0.5, "crypto_sell": 0.5, "transfer": 0, "bill": 100}');
```

### Activity Logs Table
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| POST | /api/auth/verify-otp | Verify OTP |
| POST | /api/auth/resend-otp | Resend OTP |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/wallets | Get user wallets |
| GET | /api/wallets/:currency | Get specific wallet |
| POST | /api/wallets/fund | Fund wallet (demo) |
| POST | /api/wallets/withdraw | Withdraw from wallet |
| POST | /api/wallets/transfer | Transfer to another user |

### Crypto
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/crypto/rates | Get exchange rates |
| POST | /api/crypto/buy | Buy crypto |
| POST | /api/crypto/sell | Sell crypto |
| POST | /api/crypto/swap | Swap crypto |

### Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bills/services | Get available services |
| GET | /api/bills/services/:id/products | Get products |
| POST | /api/bills/pay | Pay bill |

### Gift Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/giftcards/categories | Get categories |
| GET | /api/giftcards/products | Get products |
| POST | /api/giftcards/buy | Buy gift card |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/transactions | Get transaction history |
| GET | /api/transactions/:id | Get transaction details |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | List all users |
| PUT | /api/admin/users/:id | Update user |
| GET | /api/admin/wallets | List all wallets |
| PUT | /api/admin/wallets/:id | Update wallet balance |
| GET | /api/admin/transactions | List all transactions |
| PUT | /api/admin/transactions/:id | Update transaction |
| GET | /api/admin/settings | Get system settings |
| PUT | /api/admin/settings | Update settings |
| POST | /api/admin/settings/mode | Switch DEMO/LIVE mode |

---

## 6. Service Interfaces

### IWalletService
```typescript
interface IWalletService {
  getWallets(userId: string): Promise<Wallet[]>;
  getWallet(userId: string, currency: string): Promise<Wallet>;
  fundWallet(userId: string, currency: string, amount: number): Promise<Transaction>;
  withdraw(userId: string, currency: string, amount: number): Promise<Transaction>;
  transfer(fromUserId: string, toUserId: string, currency: string, amount: number): Promise<Transaction>;
}
```

### ICryptoService
```typescript
interface ICryptoService {
  getRates(): Promise<ExchangeRates>;
  buyCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction>;
  sellCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction>;
  swapCrypto(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<Transaction>;
}
```

### IBillService
```typescript
interface IBillService {
  getServices(): Promise<BillService[]>;
  getProducts(serviceId: string): Promise<BillProduct[]>;
  payBill(userId: string, serviceId: string, productId: string, customerId: string): Promise<Transaction>;
}
```

### IGiftCardService
```typescript
interface IGiftCardService {
  getCategories(): Promise<GiftCardCategory[]>;
  getProducts(categoryId: string): Promise<GiftCardProduct[]>;
  buyGiftCard(userId: string, productId: string, quantity: number): Promise<Transaction>;
}
```

---

## 7. Folder Structure (Next.js App Router)

```
clexpay/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group routes
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/              # Protected routes
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Dashboard home
│   │   ├── wallet/
│   │   ├── crypto/
│   │   ├── bills/
│   │   ├── giftcards/
│   │   └── admin/
│   │       ├── users/
│   │       ├── transactions/
│   │       └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── wallet/route.ts
│   │   ├── crypto/route.ts
│   │   ├── bills/route.ts
│   │   ├── giftcards/route.ts
│   │   ├── transactions/route.ts
│   │   └── admin/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── auth/
│   ├── wallet/
│   ├── crypto/
│   ├── bills/
│   ├── giftcards/
│   └── admin/
├── lib/                          # Shared utilities
│   ├── services/
│   │   ├── interfaces/
│   │   │   ├── wallet.service.interface.ts
│   │   │   ├── crypto.service.interface.ts
│   │   │   └── ...
│   │   ├── implementations/
│   │   │   ├── demo/
│   │   │   └── live/
│   │   └── factory.ts
│   ├── repositories/
│   ├── utils/
│   └── validations/
├── prisma/
│   └── schema.prisma
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```
```

### Frontend (`/client`)
```
client/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Layout.tsx
│   │   ├── auth/
│   │   │   └── AuthForms.tsx
│   │   ├── wallet/
│   │   │   ├── WalletCard.tsx
│   │   │   └── TransactionList.tsx
│   │   ├── crypto/
│   │   │   ├── CryptoCard.tsx
│   │   │   └── TradeForm.tsx
│   │   └── admin/
│   │       ├── UserTable.tsx
│   │       └── SettingsPanel.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Wallet.tsx
│   │   ├── Crypto.tsx
│   │   ├── Bills.tsx
│   │   ├── GiftCards.tsx
│   │   └── Admin.tsx
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   ├── wallet.service.ts
│   │   └── ...
│   ├── stores/
│   │   ├── auth.store.ts
│   │   └── settings.store.ts
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 8. Frontend Design System (Palmreimit Style)

### Color Palette
```css
:root {
  /* Primary */
  --color-primary: #10B981;       /* Emerald green */
  --color-primary-dark: #059669;
  --color-primary-light: #34D399;
  
  /* Secondary */
  --color-secondary: #3B82F6;     /* Blue accent */
  --color-secondary-dark: #2563EB;
  
  /* Neutral */
  --color-dark: #0F172A;          /* Slate 900 */
  --color-dark-soft: #1E293B;     /* Slate 800 */
  --color-gray: #64748B;          /* Slate 500 */
  --color-light: #F8FAFC;         /* Slate 50 */
  --color-white: #FFFFFF;
  
  /* Semantic */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Crypto Colors */
  --color-btc: #F7931A;
  --color-eth: #627EEA;
  --color-usdt: #26A17B;
}
```

### Typography
```css
.font-heading {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
}

.font-body {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```

### Component Styling
```css
/* Cards with glassmorphism */
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
}

/* Inputs */
.input-field {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
```

---

## 9. Security Considerations

1. **Authentication**
   - JWT tokens with short expiration (15 min access, 7 day refresh)
   - Password hashing with bcrypt (12 rounds)
   - Rate limiting on auth endpoints

2. **Authorization**
   - Role-based access control (RBAC)
   - Super Admin has unrestricted access
   - Admin manages users and transactions
   - Users manage own wallets

3. **Data Protection**
   - Input validation with Zod
   - SQL injection prevention via Prisma
   - XSS prevention in React
   - HTTPS only in production

4. **Audit**
   - All actions logged to activity_logs
   - Transaction references for traceability

---

## 10. Testing Strategy

### Unit Tests
- Service layer business logic
- Utility functions
- Validation schemas

### Integration Tests
- API endpoint testing
- Database operations
- Service integrations

### E2E Tests
- User flows (register → login → trade)
- Admin workflows

---

## 11. Deployment Architecture

### Development
```
┌─────────────────────────────────────────┐
│           Development Environment        │
│  ┌─────────────┐    ┌────────────────┐  │
│  │ Client:3000 │    │ Server:4000    │  │
│  └─────────────┘    └────────────────┘  │
│                            │             │
│                     ┌──────┴──────┐      │
│                     │ PostgreSQL  │      │
│                     └─────────────┘      │
└─────────────────────────────────────────┘
```

### Production (Recommended)
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx/Cloud)               │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │ Client    │      │ Client    │      │ Client    │
    │ Instance  │      │ Instance  │      │ Instance  │
    └───────────┘      └───────────┘      └───────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   API Server(s)    │
                    │  (Express Cluster) │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │ Database  │      │ Redis     │      │ S3/CDN    │
    │ (Primary) │      │ (Cache)   │      │ (Assets)  │
    └───────────┘      └───────────┘      └───────────┘
```

---

## 12. Environment Variables

### Backend (.env)
```env
# Application
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clexpay

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional for caching)
REDIS_URL=redis://localhost:6379

# External APIs (for live mode)
CRYPTO_API_KEY=
BILLS_API_KEY=
GIFTCARD_API_KEY=
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=Clexpay
```

---

## 13. Deployment Recommendations

### Option 1: Vercel + Railway (Quick Start)
- **Frontend**: Deploy to Vercel (free tier available)
- **Backend**: Deploy to Railway ($5/month starter)
- **Database**: Railway PostgreSQL
- **Pros**: Fast setup, managed infrastructure
- **Cons**: Vendor lock-in, limited scaling

### Option 2: AWS (Enterprise)
- **Frontend**: S3 + CloudFront
- **Backend**: ECS/Fargate or EC2
- **Database**: RDS PostgreSQL
- **Pros**: Full control, unlimited scaling
- **Cons**: Complex setup, requires DevOps

### Option 3: Docker + VPS (Balanced)
- **Frontend**: Nginx container
- **Backend**: Express container
- **Database**: PostgreSQL container
- **Hosting**: DigitalOcean/Vultr ($10-20/month)
- **Pros**: Simple, affordable, portable
- **Cons**: Manual scaling

### Recommended for MVP: Option 3
```bash
# docker-compose.yml structure
services:
  client:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - server

  server:
    build: ./server
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/clexpay
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=clexpay
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 14. Development Phases

### Phase 1: Foundation (Foundation)
- [x] Project setup (monorepo structure)
- [x] Database schema and Prisma setup
- [x] Authentication system
- [x] Basic wallet system
- [x] User dashboard

### Phase 2: Core Features
- [ ] Wallet operations (fund, withdraw, transfer)
- [ ] Transaction history
- [ ] Demo crypto trading
- [ ] Demo bill payments

### Phase 3: Gift Cards & Admin
- [ ] Gift card module
- [ ] Super Admin panel
- [ ] Settings management
- [ ] Mode switching (demo/live)

### Phase 4: Polish & Security
- [ ] Input validation hardening
- [ ] Rate limiting
- [ ] Error handling
- [ ] Testing setup

### Phase 5: Deployment
- [ ] Docker configuration
- [ ] CI/CD pipeline
- [ ] Production deployment

---

## 15. Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/your-org/clexpay.git
cd clexpay

# Backend setup
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend setup
cd client
npm install
npm run dev

# Docker (full stack)
docker-compose up -d
```

---

*Document Version: 1.0*
*Last Updated: March 2026*
*Architecture: Service Provider Pattern with Demo/Live Mode*
