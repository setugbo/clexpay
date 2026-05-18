# Clexpay - Deployment Recommendations

## Overview

This document provides deployment strategies for Clexpay, ranging from quick development setups to production-ready architectures.

---

## Deployment Options Summary

| Option | Cost | Complexity | Scalability | Best For |
|--------|------|------------|-------------|----------|
| Local Development | Free | Low | None | Development |
| Docker Compose | $5-20/mo | Medium | Limited | Small teams, MVPs |
| Vercel + Railway | $15-50/mo | Low | Medium | Quick startups |
| DigitalOcean | $20-50/mo | Medium | Good | Growing apps |
| AWS Full Stack | $50-200/mo | High | Excellent | Enterprise |

---

## Option 1: Local Development (Development Only)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Docker (optional)

### Quick Start
```bash
# Clone repository
git clone https://github.com/your-org/clexpay.git
cd clexpay

# Backend setup
cd server
cp .env.example .env
# Edit .env with your database URL
npm install
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev
```

### Database Setup
```bash
# Install PostgreSQL locally or use Docker
docker run --name clexpay-db -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=clexpay -p 5432:5432 -d postgres:15
```

---

## Option 2: Docker Compose (Recommended for MVP)

### Architecture
```
┌─────────────────────────────────────────────────────┐
│                    Docker Host                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Client    │  │   Server    │  │  PostgreSQL │ │
│  │   (Nginx)   │  │  (Node.js)  │  │             │ │
│  │   Port 80   │  │   Port      │  │   Port 5432 │ │
│  │             │  │    4000     │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Files to Create

#### `docker-compose.yml`
```yaml
version: '3.8'

services:
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - server
    networks:
      - clexpay-network

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/clexpay
      - JWT_SECRET=${JWT_SECRET}
      - PORT=4000
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - clexpay-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=clexpay
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - clexpay-network

volumes:
  postgres_data:

networks:
  clexpay-network:
    driver: bridge
```

#### `server/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN npm ci --only=production
RUN npx prisma generate

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/app.js"]
```

#### `client/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### `client/nginx.conf`
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://server:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Deployment Steps
```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone and setup
git clone https://github.com/your-org/clexpay.git
cd clexpay

# Create environment file
cat > .env << EOF
DB_PASSWORD=your-secure-db-password
JWT_SECRET=your-very-secure-jwt-secret-key-here
EOF

# Build and run
docker-compose up -d --build

# Check status
docker-compose logs -f
```

### Server Requirements
- **CPU**: 2 vCPUs
- **RAM**: 2 GB (minimum), 4 GB (recommended)
- **Storage**: 20 GB SSD
- **OS**: Ubuntu 22.04 LTS

### Providers for $10-20/month
| Provider | Plan | Price |
|----------|------|-------|
| DigitalOcean | Basic Droplet | $6/mo |
| Vultr | Basic | $6/mo |
| Hetzner | CX21 | €4.14/mo |
| Contabo | VPS | €4.99/mo |

---

## Option 3: Vercel + Railway (Quick Startup)

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel CDN                           │
│              (Frontend - Automatic Deploy)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Railway                                │
│         ┌─────────────────┐  ┌─────────────────┐           │
│         │   API Server    │  │   PostgreSQL    │           │
│         │                 │  │                 │           │
│         │    Port 4000    │  │    Port 5432    │           │
│         └─────────────────┘  └─────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Frontend: Vercel

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Deploy
   cd client
   vercel
   ```

2. **Environment Variables (Vercel)**
   ```
   VITE_API_URL=https://your-api.railway.app/api
   ```

3. **Custom Domain (Optional)**
   - Purchase domain from Route53/Namecheap
   - Add to Vercel project settings
   - Update DNS records

### Backend: Railway

1. **Create Railway Project**
   - Sign up at railway.app
   - Create new project
   - Add PostgreSQL database
   - Add Node.js application

2. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Initialize
   cd server
   railway init
   
   # Set environment variables
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-secret
   railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
   
   # Deploy
   railway up
   ```

3. **Domain Setup**
   - Railway provides random subdomain
   - Add custom domain in project settings

### Cost Breakdown
| Service | Usage | Cost |
|---------|-------|------|
| Vercel | Hobby tier | Free |
| Railway | Starter plan | $5/mo |
| Railway PostgreSQL | Starter plan | $5/mo |
| **Total** | | **$10/mo** |

---

## Option 4: DigitalOcean App Platform

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   DigitalOcean App Platform                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                   Web Service                        │    │
│  │  ┌─────────────┐  ┌─────────────┐                   │    │
│  │  │   Client    │  │   Server    │                   │    │
│  │  │   (Nginx)   │  │  (Express)  │                   │    │
│  │  └─────────────┘  └─────────────┘                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Managed PostgreSQL                       │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Setup Steps

1. **Create DigitalOcean Account**
2. **Create App**
   - Choose "App Platform"
   - Connect GitHub repository
   - Select monorepo structure

3. **Configure Services**
   ```yaml
   # .do/app.yaml
   name: clexpay
   region: nyc
   
   services:
     - name: api
       dockerfile_path: server/Dockerfile
       health_check:
         path: /api/health
       http_port: 4000
       env:
         - key: DATABASE_URL
           value: ${database.DATABASE_URL}
         - key: JWT_SECRET
           sync: false
       routes:
         - path: /api
   
   databases:
     - name: database
       engine: PG
       version: "15"
   ```

4. **Deploy**
   ```bash
   # Install doctl
   brew install doctl
   
   # Authenticate
   doctl auth init
   
   # Create app
   doctl apps create --spec .do/app.yaml
   ```

### Cost
| Component | Plan | Price |
|-----------|------|-------|
| Web Service | Basic | $5/mo |
| Database | Starter | $15/mo |
| **Total** | | **$20/mo** |

---

## Option 5: AWS Full Stack (Enterprise)

### Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                           Route 53                               │
│                      (DNS Management)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CloudFront                                │
│                     (CDN + SSL Termination)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│     S3 Bucket          │         │     Application Load    │
│  (Static Assets)       │         │        Balancer          │
│                        │         └─────────────────────────┘
└─────────────────────────┘                    │
                                                ▼
                                  ┌─────────────────────────┐
                                  │    ECS Fargate          │
                                  │  ┌─────────┐ ┌─────────┐ │
                                  │  │ Client  │ │ Server  │ │
                                  │  │ (Nginx) │ │(Express)│ │
                                  │  └─────────┘ └─────────┘ │
                                  └─────────────────────────┘
                                                │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                    ┌─────────────────┐           ┌─────────────────┐
                    │   RDS Aurora    │           │      Elasti     │
                    │   PostgreSQL    │           │  Cache (Redis)   │
                    └─────────────────┘           └─────────────────┘
```

### Terraform Configuration

#### `main.tf`
```hcl
provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "clexpay-cluster"
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier           = "clexpay-db"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username            = var.db_username
  password            = var.db_password
  skip_final_snapshot = true
}

# S3 Bucket for static files
resource "aws_s3_bucket" "client" {
  bucket = "clexpay-client"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "client" {
  origin {
    domain_name = aws_s3_bucket.client.bucket_regional_domain_name
    origin_id   = "client-origin"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    viewer_protocol_policy = "redirect-to-https"
    target_origin_id       = "client-origin"
  }
}
```

#### `ecs-task-definition.tf`
```hcl
resource "aws_ecs_task_definition" "server" {
  family                   = "clexpay-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  cpu    = "256"
  memory = "512"

  container_definitions = jsonencode([
    {
      name      = "server"
      image     = "${aws_ecr_repository.server.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 4000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "DATABASE_URL"
          value = aws_db_instance.main.connection_url
        }
      ]
      secrets = [
        {
          name      = "JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt.arn
        }
      ]
    }
  ])
}
```

### Cost Breakdown
| Component | Monthly Estimate |
|-----------|------------------|
| ECS Fargate | $20-50 |
| RDS PostgreSQL (t3.micro) | $15-30 |
| S3 Storage | $5 |
| CloudFront | $10 |
| Route 53 | $0.50 |
| Data Transfer | $10 |
| **Total** | **$60-110/mo** |

---

## Security Checklist

### Pre-Deployment
- [ ] All secrets in environment variables, not code
- [ ] Strong JWT secret (32+ characters)
- [ ] Database password is strong and unique
- [ ] HTTPS enforced
- [ ] CORS configured for specific domains
- [ ] Rate limiting enabled
- [ ] Helmet.js security headers set

### Production Hardening
```javascript
// server/src/middleware/security.js
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
});

const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});

export { helmetMiddleware, corsMiddleware, limiter };
```

### Database Security
```sql
-- Create application user (not postgres)
CREATE USER clexpay_app WITH PASSWORD 'strong-password-here';

-- Grant minimal permissions
GRANT CONNECT ON DATABASE clexpay TO clexpay_app;
GRANT USAGE ON SCHEMA public TO clexpay_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clexpay_app;

-- Enable SSL
ALTER DATABASE clexpay SET ssl = on;
```

---

## Monitoring & Logging

### Logging Strategy
```javascript
// Winston configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Health Check Endpoint
```javascript
// server/src/routes/health.routes.js
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});
```

### Recommended Monitoring Tools
| Tool | Purpose | Cost |
|------|---------|------|
| Sentry | Error tracking | Free tier available |
| DataDog | APM | $15/mo |
| LogRocket | Session replay | $20/mo |
| UptimeRobot | Uptime monitoring | Free |

---

## Backup Strategy

### Database Backups
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups
DB_HOST=localhost
DB_NAME=clexpay
DB_USER=postgres

pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/backup_$DATE.dump"

# Keep last 7 backups
find $BACKUP_DIR -name "backup_*.dump" -mtime +7 -delete
```

### Cron Job
```bash
# Add to crontab
0 2 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1
```

---

## CI/CD Pipeline

### GitHub Actions

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run lint
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Type check
        run: npm run typecheck

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /app/clexpay
            git pull
            docker-compose down
            docker-compose up -d --build
            docker-compose exec -T server npx prisma migrate deploy
```

---

## Recommended Deployment Path

### For This Project: Option 2 (Docker Compose)

**Why:**
1. Simple to understand and maintain
2. Portable across any VPS provider
3. Cost-effective ($6-20/month)
4. Full control over infrastructure
5. Easy to migrate later

### Migration Path
```
Development → Docker Compose (MVP) → Kubernetes (Scale)
                              ↓
                    Cloud Platforms (Enterprise)
```

---

*Deployment Guide Version: 1.0*
*Last Updated: March 2026*
