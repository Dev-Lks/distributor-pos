# Setup Guide

## Prerequisites

- Node.js 18+ or 20+
- pnpm 8+
- PostgreSQL 14+
- Git

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd claudiao
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/claudiao"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google Sheets (optional)
GOOGLE_SHEETS_PRIVATE_KEY=""
GOOGLE_SHEETS_CLIENT_EMAIL=""
GOOGLE_SPREADSHEET_ID=""
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed database
pnpm prisma db seed
```

### 5. Run Development Server

```bash
pnpm dev
```

Access the application at `http://localhost:3000`

## First Login

### Create Admin User

Run the admin creation script:

```bash
pnpm tsx scripts/createAdmin.ts
```

Or use Prisma Studio to create a user:

```bash
pnpm prisma studio
```

Set `isAdmin: true` for the admin user.

## Production Build

### 1. Build the Application

```bash
pnpm build
```

### 2. Run Production Server

```bash
pnpm start
```

## Database Migrations

### Create a new migration

```bash
pnpm prisma migrate dev --name description-of-changes
```

### Deploy migrations to production

```bash
pnpm prisma migrate deploy
```

### Reset database (CAUTION: deletes all data)

```bash
pnpm prisma migrate reset
```

## Troubleshooting

### Port 3000 already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### Database connection errors

1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Ensure database exists
4. Check firewall settings

### Prisma errors

```bash
# Regenerate Prisma client
pnpm prisma generate

# Check database schema
pnpm prisma db pull
```

### Build errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Environment-Specific Configuration

### Development

- Hot reload enabled
- Verbose logging
- Source maps enabled
- No caching

### Production

- Optimized bundles
- Minimal logging
- Source maps disabled
- Aggressive caching

## Docker Setup (Optional)

### Using Docker Compose

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

## Vercel Deployment

### 1. Connect Repository

1. Import project in Vercel
2. Select your Git repository
3. Configure project settings

### 2. Environment Variables

Add all environment variables from `.env` in Vercel dashboard.

### 3. Build Settings

- Framework Preset: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`

### 4. Deploy

Push to main branch or click "Deploy" in Vercel dashboard.

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Database Queries

```bash
pnpm prisma studio
```

### Logs

```bash
# Development logs
pnpm dev

# Production logs (with PM2)
pm2 logs claudiao
```

## Security

### Update Dependencies

```bash
# Check for outdated packages
pnpm outdated

# Update packages
pnpm update

# Check for security vulnerabilities
pnpm audit
```

### Environment Security

- Never commit `.env` files
- Use strong NEXTAUTH_SECRET
- Rotate secrets regularly
- Use HTTPS in production
- Enable CORS restrictions
- Implement rate limiting

## Performance Optimization

### Database Indexes

Ensure proper indexes on frequently queried columns:

```sql
CREATE INDEX idx_sales_date ON "Sale"(date);
CREATE INDEX idx_products_sku ON "Product"(sku);
```

### Caching

Configure Redis for session storage (optional):

```env
REDIS_URL="redis://localhost:6379"
```

### CDN

Use Vercel's CDN or configure CloudFront for static assets.

## Backup

### Database Backup

```bash
# Backup
pg_dump claudiao > backup.sql

# Restore
psql claudiao < backup.sql
```

### Automated Backups

Set up cron job:

```bash
0 2 * * * pg_dump claudiao > /backups/claudiao_$(date +\%Y\%m\%d).sql
```
