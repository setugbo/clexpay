# Clexpay - Complete Deployment Guide

## Table of Contents
1. [GitHub Setup](#1-github-setup)
2. [Neon Database Setup](#2-neon-database-setup)
3. [Vercel Setup](#3-vercel-setup)
4. [Local Development](#4-local-development)
5. [Deployment](#5-deployment)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. GitHub Setup

### Step 1.1: Create a New Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Fill in the details:
   - **Owner**: `setugbo`
   - **Repository name**: `clexpay`
   - **Description**: `Clexpay - 3-in-1 Fintech Platform`
   - **Visibility**: Public (or Private if you prefer)
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **Create repository**

### Step 1.2: Push Your Code to GitHub

Open your terminal/command prompt and run these commands:

```bash
# Navigate to the clexpay project directory
cd C:\workspace\nnn\clexpay

# Initialize git (if not already initialized)
git init

# Add all files to staging
git add .

# Create your first commit
git commit -m "Initial commit - Clexpay fintech platform"

# Rename default branch to main
git branch -M main

# Add your GitHub repository as remote
git remote add origin https://github.com/setugbo/clexpay.git

# Push to GitHub
git push -u origin main
```

You'll be prompted for your GitHub username and password/token.

### Step 1.3: Using a Personal Access Token (Recommended)

If you get an authentication error, you need a Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**
2. Click **Generate new token**
3. Give it a name like "Clexpay Deploy"
4. Select scopes: `repo` (full control)
5. Click **Generate token**
6. **COPY THE TOKEN NOW** (you won't see it again)

When pushing, use the token as your password:
- Username: `setugbo`
- Password: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (your token)

---

## 2. Neon Database Setup

### Step 2.1: Create a Neon Project

1. Go to [Neon](https://neon.tech) and sign in
2. Click **Create Project**

3. Fill in the details:
   - **Project Name**: `clexpay-db`
   - **Region**: Choose closest to you (e.g., `EU West` for Europe, `US East` for US)
   - **Database Name**: `clexpay`
   - **Username**: Keep as `app` or customize

4. Click **Create Project**

### Step 2.2: Get Your Connection String

After creating the project, you'll see a connection string:

```
postgresql://username:password@ep-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Copy this connection string** - you'll need it for:
1. Local development (`.env` file)
2. Vercel environment variables

### Step 2.3: Connection String Format

The connection string format is:
```
postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
```

Example:
```
postgresql://app:Abc123xyz@ep-silent-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 3. Vercel Setup

### Step 3.1: Connect Vercel to GitHub

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Under **Import Git Repository**, find your GitHub account
4. Select the `clexpay` repository
5. Click **Import**

### Step 3.2: Configure Project Settings

On the configuration page:

**Framework Preset**: Next.js (should auto-detect)

**Root Directory**: `.` (leave as default)

**Build Command**: `npx prisma generate && next build`

**Output Directory**: `.next`

### Step 3.3: Add Environment Variables

Click **Environment Variables** and add these:

| Name | Value | Description |
|------|-------|-------------|
| `DATABASE_URL` | Your Neon connection string | PostgreSQL connection |
| `NEXTAUTH_URL` | `https://clexpay.vercel.app` | Your Vercel URL (after deploy) |
| `NEXTAUTH_SECRET` | Generate a random string | JWT secret (see below) |

**How to generate NEXTAUTH_SECRET**:

Open terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output as your secret.

### Step 3.4: Deploy

1. Click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. You'll get a URL like: `https://clexpay.vercel.app`

---

## 4. Local Development

### Step 4.1: Clone the Repository (on any machine)

```bash
git clone https://github.com/setugbo/clexpay.git
cd clexpay
npm install
```

### Step 4.2: Create .env File

Create a file named `.env` in the project root:

```env
# Database (from Neon)
DATABASE_URL="postgresql://app:YOUR_PASSWORD@ep-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
```

### Step 4.3: Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Optional: Open Prisma Studio to view data
npm run db:studio
```

### Step 4.4: Create Admin User

Since we don't have a UI for creating admins yet, run this SQL in Prisma Studio or via psql:

```sql
-- Update a user's role to super_admin
UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

### Step 4.5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 5. Deployment

### Step 5.1: Update Your GitHub Code

```bash
# Make changes
git add .
git commit -m "Your commit message"
git push origin main
```

### Step 5.2: Vercel Auto-Deploys

Every push to `main` automatically triggers a new deployment on Vercel.

To view deployments:
1. Go to Vercel Dashboard
2. Select your project
3. Click **Deployments** tab

### Step 5.3: Add Custom Domain (Optional)

1. In Vercel, go to **Settings** → **Domains**
2. Enter your domain (e.g., `clexpay.com`)
3. Add the DNS records shown by Vercel to your domain registrar
4. Wait for SSL certificate to provision

---

## 6. Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
npm run db:generate
```

### Error: "Database connection failed"

1. Check your `DATABASE_URL` in Vercel environment variables
2. Ensure Neon project is not paused (check Neon dashboard)
3. Verify SSL mode is enabled: `?sslmode=require`

### Error: "Authentication failed"

1. Check `NEXTAUTH_SECRET` is set
2. Ensure `NEXTAUTH_URL` matches your deployment URL exactly

### Prisma Migration Issues

If you have schema changes:

```bash
# For local
npm run db:push

# For production, add a postinstall script or run:
npx prisma db push
```

### Clear Build Cache

If deployment fails:

1. In Vercel, go to **Settings** → **General**
2. Under **Build & Development Settings**, find **Cache**
3. Click **Clear Cache** and redeploy

---

## Quick Reference Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:studio      # Open database GUI
npm run db:migrate     # Run migrations

# Git commands
git add .
git commit -m "message"
git push origin main
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Full URL of your deployment |
| `NEXTAUTH_SECRET` | Yes | Random string for JWT signing |

---

## Project Update Workflow

```
1. Make changes locally
2. Test with npm run dev
3. Commit: git add . && git commit -m "changes"
4. Push: git push origin main
5. Vercel auto-deploys
6. Check deployment status in Vercel dashboard
```

---

## Need Help?

If stuck:
1. Check Vercel deployment logs (click on failed deployment)
2. Check Neon console for database errors
3. Verify all environment variables are set correctly
