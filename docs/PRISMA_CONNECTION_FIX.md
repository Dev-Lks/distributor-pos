# Prisma Connection Fix - "Server has closed the connection"

## Problem
The application was experiencing connection errors during login with the error:
```
Invalid `prisma.user.findUnique()` invocation: Server has closed the connection.
```

## Root Cause
The issue was caused by trying to use the **direct database URL** instead of **Prisma Accelerate**:
- ❌ Direct connection (`postgres://...@db.prisma.io`) → **Frequent disconnections**
- ✅ Prisma Accelerate (`prisma+postgres://accelerate.prisma-data.net`) → **Stable with retry logic**

## Solution Implemented ✅

### 1. Updated `.env` to use Prisma Accelerate
```bash
# Use Prisma Accelerate (edge connection pooling - funciona sem erros!)
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...

# Conexão direta (apenas para migrations)
DIRECT_DATABASE_URL=postgres://...@db.prisma.io:5432/postgres?sslmode=require
```

### 2. Updated `prisma/schema.prisma`
Added `directUrl` for migrations while using Accelerate for queries:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        # Prisma Accelerate
  directUrl = env("DIRECT_DATABASE_URL") # Direct for migrations
}
```

### 3. Fixed `lib/prisma.ts`
- Removed redundant datasource config (already in schema)
- Fixed MaxListeners warning
- Registered shutdown handlers only once

```typescript
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Graceful shutdown - only register once
if (!globalForPrisma.prisma) {
  process.setMaxListeners(15)
  process.once('beforeExit', gracefulShutdown)
  process.once('SIGINT', gracefulShutdown)
  process.once('SIGTERM', gracefulShutdown)
}
```

### 3. Created Connection Test Script
Added `scripts/test-db-connection.ts` for debugging connection issues:
```bash
pnpm tsx scripts/test-db-connection.ts
```

## Testing
After applying the fixes, the connection test shows:
```
✅ Connection successful!
✅ Found 1 users in database
```

Login is working without "Server has closed the connection" errors! 🎉

## Why Prisma Accelerate?

### Benefits
✅ **Edge connection pooling** - Global CDN with low latency  
✅ **Automatic retries** - Handles transient failures gracefully  
✅ **Built-in caching** - Faster queries with intelligent caching  
✅ **No connection limits** - Scales automatically  
✅ **Works in serverless** - Perfect for Vercel/Next.js  

### Direct Connection vs Accelerate
| Feature | Direct (`postgres://`) | Accelerate (`prisma+postgres://`) |
|---------|------------------------|-----------------------------------|
| Stability | ❌ Frequent disconnects | ✅ Very stable |
| Retries | ❌ No automatic retries | ✅ 3 automatic retries |
| Caching | ❌ No caching | ✅ Intelligent caching |
| Serverless | ⚠️ Connection pool issues | ✅ Optimized for serverless |
| Latency | ⚠️ Direct to DB | ✅ Edge locations |

## Commands

### Development
```bash
# Start dev server
pnpm dev

# Test connection
pnpm tsx scripts/test-db-connection.ts

# Generate Prisma Client
pnpm prisma generate
```

### Migrations
Migrations use the direct connection automatically:
```bash
# Run migrations
pnpm prisma migrate dev

# Deploy to production
pnpm prisma migrate deploy
```

## Important Notes

### Environment Variables
Make sure both URLs are set:
```bash
# Runtime queries (Accelerate)
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...

# Migrations only (Direct)
DIRECT_DATABASE_URL=postgres://...@db.prisma.io:5432/postgres?sslmode=require
```

### Never Use Direct URL for Queries
❌ **Wrong:**
```typescript
// This will cause "Server has closed the connection"
DATABASE_URL=postgres://...@db.prisma.io:5432/postgres
```

✅ **Correct:**
```typescript
// This is stable with automatic retries
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...
```

## Troubleshooting

### Error: "Server has closed the connection"
✅ **Fixed!** Use Prisma Accelerate URL in `DATABASE_URL`

### Error: "Too many connections"
This shouldn't happen with Accelerate, but if it does:
1. Check your Prisma Accelerate dashboard
2. Verify you're using the correct API key
3. Ensure `DATABASE_URL` has the `prisma+postgres://` prefix

### Error: "Direct connection failed during migration"
Check `DIRECT_DATABASE_URL` is set correctly:
```bash
DIRECT_DATABASE_URL=postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require
```

### Warning: "MaxListenersExceeded"
✅ **Fixed!** Now uses `process.once()` and `setMaxListeners(15)`

## Deployment

### Vercel
Add both environment variables:
```bash
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...
DIRECT_DATABASE_URL=postgres://...@db.prisma.io:5432/postgres?sslmode=require
```

### Other Platforms
The Accelerate URL works universally across all platforms:
- Vercel ✅
- Netlify ✅
- Railway ✅
- AWS Lambda ✅
- Google Cloud Run ✅

## Related Files
- ✅ `.env` - Environment variables with Accelerate URLs
- ✅ `prisma/schema.prisma` - Schema with directUrl for migrations
- ✅ `lib/prisma.ts` - Simplified Prisma client singleton
- ✅ `scripts/test-db-connection.ts` - Connection testing utility

## Status
✅ **COMPLETELY FIXED** - Login working without connection errors!

### Test Results
```bash
$ pnpm tsx scripts/test-db-connection.ts
Testing database connection...
✅ Connection successful!
✅ Found 1 users in database
```

### Production Logs
```bash
POST /api/auth/callback/credentials 200 in 974ms  ✅
GET /dashboard/orders 200 in 1945ms                ✅
```

Last updated: October 8, 2025

