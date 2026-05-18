# Clexpay - Work Plan & Implementation Roadmap

## Executive Summary
Building Clexpay, a 3-in-1 fintech platform with crypto trading, bill payments, and gift card trading. The application follows a service-provider architecture allowing seamless switching between DEMO and LIVE modes.

---

## Phase 1: Project Foundation (Week 1)

### 1.1 Repository & Monorepo Setup
```
clexpay/
├── server/          # Express.js backend
├── client/          # React frontend
├── docker-compose.yml
└── README.md
```

**Tasks:**
- [ ] Initialize monorepo with npm workspaces
- [ ] Setup server with Express + TypeScript
- [ ] Setup client with Vite + React + TypeScript
- [ ] Configure ESLint + Prettier
- [ ] Setup Git hooks (Husky)

### 1.2 Database Design
**Prisma Schema Setup:**
- [ ] Users table
- [ ] Wallets table (multi-currency)
- [ ] Transactions table
- [ ] Settings table
- [ ] Activity logs table

### 1.3 Backend Infrastructure
**Tasks:**
- [ ] Configure Prisma with PostgreSQL
- [ ] Setup Winston logger
- [ ] Setup Morgan HTTP logger
- [ ] Create error handling middleware
- [ ] Create validation middleware (Zod)

### 1.4 Deliverables
- [ ] Working monorepo structure
- [ ] Database migrations running
- [ ] Basic Express server responding

---

## Phase 2: Authentication System (Week 1-2)

### 2.1 User Registration & Login
**Backend:**
- [ ] User repository (create, find, update)
- [ ] Auth service with bcrypt
- [ ] JWT token generation
- [ ] Register controller & route
- [ ] Login controller & route

**Frontend:**
- [ ] Register page with form
- [ ] Login page with form
- [ ] Auth service for API calls
- [ ] Auth store (Zustand)
- [ ] Protected route component

### 2.2 OTP Verification
**Backend:**
- [ ] OTP generation (6 digits)
- [ ] OTP storage with expiry (10 min)
- [ ] Verify OTP endpoint
- [ ] Resend OTP endpoint
- [ ] Auto-login after verification

**Frontend:**
- [ ] OTP input component
- [ ] Verification flow after register
- [ ] Resend countdown timer

### 2.3 Session Management
- [ ] JWT middleware
- [ ] Refresh token logic
- [ ] Logout endpoint
- [ ] Auth context in React

### 2.4 Deliverables
- [ ] Users can register and login
- [ ] OTP verification working
- [ ] Protected routes functional
- [ ] Session persistence

---

## Phase 3: Wallet System (Week 2-3)

### 3.1 Wallet Infrastructure
**Database:**
- [ ] Seed initial wallets per user (NGN, BTC, ETH, USDT)
- [ ] Wallet creation triggers

**Backend:**
- [ ] Wallet repository
- [ ] Wallet service interface
- [ ] Demo wallet service implementation
- [ ] Get wallets endpoint
- [ ] Get single wallet endpoint

### 3.2 Wallet Operations
**Backend:**
- [ ] Fund wallet (demo deposit)
- [ ] Withdraw from wallet
- [ ] Transfer between users
- [ ] Transaction logging

**Frontend:**
- [ ] Wallet list component
- [ ] Wallet card with balance
- [ ] Fund modal
- [ ] Withdraw modal
- [ ] Transfer modal

### 3.3 Transaction History
**Backend:**
- [ ] Transaction repository
- [ ] Transaction service
- [ ] Get user transactions
- [ ] Filter by type, date
- [ ] Pagination

**Frontend:**
- [ ] Transaction list component
- [ ] Transaction filters
- [ ] Transaction details modal
- [ ] Export functionality

### 3.4 Deliverables
- [ ] Multi-currency wallets
- [ ] Fund/withdraw/transfer working
- [ ] Full transaction history
- [ ] Demo balance preloading

---

## Phase 4: Crypto Module (Week 3-4)

### 4.1 Service Interface
**Backend:**
- [ ] ICryptoService interface
- [ ] Service factory pattern
- [ ] Mode detection from settings

### 4.2 Demo Crypto Service
**Backend:**
- [ ] Static exchange rates
- [ ] Buy crypto (NGN → BTC/ETH/USDT)
- [ ] Sell crypto (BTC/ETH/USDT → NGN)
- [ ] Swap crypto (BTC → ETH, etc.)
- [ ] Rate calculation with fees

**Frontend:**
- [ ] Crypto dashboard page
- [ ] Exchange rate display
- [ ] Buy form
- [ ] Sell form
- [ ] Swap form
- [ ] Crypto wallet cards

### 4.3 Live Service Stub
**Backend:**
- [ ] LiveCryptoService structure
- [ ] API key configuration
- [ ] Placeholder methods with TODO comments

### 4.4 Deliverables
- [ ] Demo crypto trading working
- [ ] Live service structure ready
- [ ] UI for all trade types
- [ ] Fee calculation accurate

---

## Phase 5: Bill Payments Module (Week 4-5)

### 5.1 Service Interface
**Backend:**
- [ ] IBillService interface
- [ ] Bill service factory integration

### 5.2 Demo Bill Service
**Backend:**
- [ ] Bill services data (MTN, Airtel, ECG, DSTV, etc.)
- [ ] Get services endpoint
- [ ] Get products/products endpoint
- [ ] Simulated payment processing
- [ ] Success/failure simulation

**Frontend:**
- [ ] Bills page layout
- [ ] Service category tabs
- [ ] Product selection
- [ ] Payment form
- [ ] Confirmation modal
- [ ] Receipt display

### 5.3 Bill Categories
| Category | Providers |
|----------|-----------|
| Airtime | MTN, Airtel, Glo, 9mobile |
| Data | All networks |
| Electricity | ECG, AEDC, IKEDC, etc. |
| Cable TV | DSTV, GOtv, Startimes |
| Betting | Bet9ja, Nairabet, etc. |

### 5.4 Deliverables
- [ ] All bill categories working
- [ ] Demo transactions processing
- [ ] Receipt generation
- [ ] Transaction history updates

---

## Phase 6: Gift Card Module (Week 5)

### 6.1 Service Interface
**Backend:**
- [ ] IGiftCardService interface
- [ ] Gift card service factory

### 6.2 Demo Gift Card Service
**Backend:**
- [ ] Gift card categories
- [ ] Product catalog
- [ ] Purchase simulation
- [ ] Code generation (demo)

**Frontend:**
- [ ] Gift cards page
- [ ] Category browser
- [ ] Product cards
- [ ] Purchase flow
- [ ] Order confirmation

### 6.3 Deliverables
- [ ] Gift card browsing working
- [ ] Demo purchase flow
- [ ] Order history integration

---

## Phase 7: Super Admin Panel (Week 5-6)

### 7.1 Admin Authentication
**Backend:**
- [ ] Admin role check middleware
- [ ] Super admin access level
- [ ] Admin login endpoint

**Frontend:**
- [ ] Admin login page
- [ ] Admin dashboard
- [ ] Role-based menu

### 7.2 User Management
**Backend:**
- [ ] List all users
- [ ] View user details
- [ ] Edit user (suspend, activate)
- [ ] Delete user
- [ ] View user transactions

**Frontend:**
- [ ] Users table with filters
- [ ] User detail modal
- [ ] User edit form
- [ ] User status toggle

### 7.3 Wallet Management
**Backend:**
- [ ] List all wallets
- [ ] Edit wallet balance
- [ ] Add wallet for user
- [ ] Wallet audit log

**Frontend:**
- [ ] Wallets table
- [ ] Balance edit form
- [ ] Wallet history view

### 7.4 Transaction Management
**Backend:**
- [ ] List all transactions
- [ ] Filter by status, type, date
- [ ] Approve/reject pending
- [ ] Transaction details

**Frontend:**
- [ ] Transactions table
- [ ] Status filters
- [ ] Action buttons
- [ ] Detail modal

### 7.5 System Settings
**Backend:**
- [ ] Get settings endpoint
- [ ] Update settings endpoint
- [ ] Mode switch endpoint (DEMO/LIVE)

**Frontend:**
- [ ] Settings panel
- [ ] API keys form
- [ ] Mode toggle switch
- [ ] Exchange rates editor
- [ ] Fee configuration

### 7.6 Content Management
**Frontend:**
- [ ] Banner management
- [ ] Text content editor
- [ ] Announcement system

### 7.7 Deliverables
- [ ] Full user management
- [ ] Wallet balance control
- [ ] Transaction oversight
- [ ] System configuration
- [ ] Mode switching functional

---

## Phase 8: Dashboard & UI Polish (Week 6-7)

### 8.1 User Dashboard
**Frontend:**
- [ ] Overview cards (balances)
- [ ] Recent transactions
- [ ] Quick action buttons
- [ ] Charts (optional)

### 8.2 Navigation
**Frontend:**
- [ ] Sidebar navigation
- [ ] Mobile responsive menu
- [ ] Breadcrumbs
- [ ] User profile dropdown

### 8.3 Design System
**Frontend:**
- [ ] Consistent button styles
- [ ] Card components
- [ ] Form components
- [ ] Modal components
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

### 8.4 Responsive Design
**Frontend:**
- [ ] Desktop layout
- [ ] Tablet layout
- [ ] Mobile layout
- [ ] Touch-friendly interactions

### 8.5 Deliverables
- [ ] Beautiful user dashboard
- [ ] Consistent design system
- [ ] Responsive on all devices

---

## Phase 9: Security & Validation (Week 7)

### 9.1 Backend Validation
- [ ] Zod schemas for all inputs
- [ ] Request sanitization
- [ ] SQL injection prevention
- [ ] Rate limiting

### 9.2 Frontend Validation
- [ ] Form validation
- [ ] Input masking
- [ ] Error messages
- [ ] Success feedback

### 9.3 Security Headers
- [ ] Helmet.js configuration
- [ ] CORS configuration
- [ ] HTTPS redirect

### 9.4 Audit Logging
- [ ] Activity log service
- [ ] Log all admin actions
- [ ] Log important user actions

### 9.5 Deliverables
- [ ] Fully validated inputs
- [ ] Security headers set
- [ ] Audit trail complete

---

## Phase 10: Testing (Week 7-8)

### 10.1 Backend Tests
- [ ] Service unit tests
- [ ] Controller integration tests
- [ ] API endpoint tests
- [ ] Auth flow tests

### 10.2 Frontend Tests
- [ ] Component tests (Vitest)
- [ ] Hook tests
- [ ] Integration tests
- [ ] E2E tests (Playwright)

### 10.3 Deliverables
- [ ] 80%+ code coverage
- [ ] All critical paths tested
- [ ] E2E flows passing

---

## Phase 11: Deployment (Week 8)

### 11.1 Docker Configuration
**Files:**
- [ ] Dockerfile for server
- [ ] Dockerfile for client (nginx)
- [ ] docker-compose.yml
- [ ] .dockerignore

### 11.2 CI/CD Pipeline
**GitHub Actions:**
- [ ] Lint & typecheck on PR
- [ ] Run tests on PR
- [ ] Build on merge
- [ ] Deploy to staging

### 11.3 Environment Setup
- [ ] Development .env.example
- [ ] Production .env template
- [ ] Secrets management

### 11.4 Deployment Options

#### Option A: Vercel + Railway (Recommended for MVP)
```
Frontend: Vercel (automatic deploy)
Backend: Railway
Database: Railway PostgreSQL
Cost: ~$15/month
```

#### Option B: DigitalOcean + Docker
```
Frontend: Nginx on Droplet
Backend: Express on Droplet
Database: Managed PostgreSQL
Cost: ~$20-30/month
```

#### Option C: AWS Full Stack
```
Frontend: S3 + CloudFront
Backend: ECS/Fargate
Database: RDS PostgreSQL
Cost: ~$50-100/month
```

### 11.5 Deliverables
- [ ] Docker containers building
- [ ] CI/CD working
- [ ] Production deployment live

---

## Implementation Order

```
WEEK 1:
┌────────────────────────────────────────────┐
│ Day 1-2: Project setup, monorepo          │
│ Day 3-4: Database schema, Prisma           │
│ Day 5-7: Express server, middleware        │
└────────────────────────────────────────────┘

WEEK 2:
┌────────────────────────────────────────────┐
│ Day 1-2: Auth service, JWT                 │
│ Day 3-4: Register/Login endpoints          │
│ Day 5-7: OTP verification                  │
└────────────────────────────────────────────┘

WEEK 3:
┌────────────────────────────────────────────┐
│ Day 1-2: Wallet service, interface         │
│ Day 3-4: Wallet operations                 │
│ Day 5-7: React auth pages, wallet UI       │
└────────────────────────────────────────────┘

WEEK 4:
┌────────────────────────────────────────────┐
│ Day 1-2: Crypto service, demo impl         │
│ Day 3-4: Buy/sell/swap endpoints          │
│ Day 5-7: Crypto trading UI                │
└────────────────────────────────────────────┘

WEEK 5:
┌────────────────────────────────────────────┐
│ Day 1-2: Bill service, demo impl           │
│ Day 3-4: Bill payment endpoints            │
│ Day 5-7: Bills UI, gift card service      │
└────────────────────────────────────────────┘

WEEK 6:
┌────────────────────────────────────────────┐
│ Day 1-3: Admin panel - users, wallets     │
│ Day 4-5: Admin panel - transactions       │
│ Day 6-7: Admin panel - settings           │
└────────────────────────────────────────────┘

WEEK 7:
┌────────────────────────────────────────────┐
│ Day 1-2: Dashboard polish, design system │
│ Day 3-4: Security hardening                │
│ Day 5-7: Testing, bug fixes               │
└────────────────────────────────────────────┘

WEEK 8:
┌────────────────────────────────────────────┐
│ Day 1-2: Docker setup, CI/CD              │
│ Day 3-4: Deployment to staging           │
│ Day 5-7: Production deployment            │
└────────────────────────────────────────────┘
```

---

## Daily Standup Checklist

Before each coding session:
- [ ] Pull latest changes
- [ ] Check current task status
- [ ] Note blockers

After each coding session:
- [ ] Commit with clear message
- [ ] Push to branch
- [ ] Update task status

---

## Definition of Done

Each feature is complete when:
- [ ] Backend endpoint returns correct response
- [ ] Frontend displays correct data
- [ ] Input validation works
- [ ] Error handling implemented
- [ ] Transaction logged
- [ ] Tests passing
- [ ] Lint passing
- [ ] Responsive on mobile

---

*Work Plan Version: 1.0*
*Total Duration: 8 weeks*
*Team: 1 Senior Full-Stack Developer*
