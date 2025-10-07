# Architecture Documentation

## System Overview

Claudiao is a full-stack inventory and sales management system built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Radix UI** - Component primitives
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - RESTful API
- **Prisma ORM** - Database access
- **PostgreSQL** - Primary database
- **NextAuth** - Authentication
- **IndexedDB** - Client-side storage

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## Project Structure

```
claudiao/
├── app/                      # Next.js App Router
│   ├── (app)/               # Authenticated routes
│   │   └── dashboard/       # Dashboard pages
│   ├── (auth)/              # Authentication routes
│   ├── (home)/              # Public home page
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                  # Base UI components
│   ├── admin/               # Admin components
│   ├── dashboard/           # Dashboard components
│   └── inventory/           # Inventory components
├── lib/                     # Utility libraries
│   ├── middleware/          # Middleware utilities
│   ├── inventory/           # Inventory logic
│   ├── logger.ts            # Logging system
│   ├── errors.ts            # Error handling
│   └── prisma.ts            # Prisma client
├── types/                   # TypeScript types
│   ├── api.ts               # API types
│   ├── forms.ts             # Form types
│   ├── user.ts              # User types
│   └── prisma.ts            # Prisma types
├── prisma/                  # Database schema
│   ├── schema.prisma        # Prisma schema
│   └── migrations/          # Database migrations
├── public/                  # Static assets
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────┐
│      Presentation Layer         │
│  (Pages, Components, UI)        │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│      Business Logic Layer       │
│  (Hooks, Services, Utilities)   │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│      Data Access Layer          │
│  (Prisma, API Routes)           │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│      Database Layer             │
│  (PostgreSQL, IndexedDB)        │
└─────────────────────────────────┘
```

### 2. Component Patterns

#### Compound Components
Used for complex UI components with multiple parts:

```tsx
<Dialog>
  <DialogTrigger />
  <DialogContent>
    <DialogHeader />
    <DialogBody />
    <DialogFooter />
  </DialogContent>
</Dialog>
```

#### Render Props
Used for flexible component composition:

```tsx
<DataTable
  columns={columns}
  data={data}
  renderRow={(row) => <CustomRow data={row} />}
/>
```

#### Custom Hooks
Encapsulate reusable logic:

```tsx
const { products, loading, error } = useProducts();
const { createSale, isCreating } = useCreateSale();
```

### 3. Data Flow

```
User Action → Component → Hook → API Route → Prisma → Database
     ↑                                                      ↓
     └──────────────── React Query Cache ←─────────────────┘
```

## Key Systems

### 1. Authentication & Authorization

**Flow:**
1. User logs in via `/api/auth/signin`
2. NextAuth creates session with JWT
3. Middleware validates session on protected routes
4. Permission checks via `checkRoutePermission()`

**Permissions:**
- Stored in User model
- Checked at route level (middleware)
- Checked at API level (route handlers)
- Checked at UI level (components)

### 2. Data Fetching

**React Query Strategy:**
- Cache time: 5 minutes
- Stale time: 1 minute
- Automatic refetch on window focus
- Optimistic updates for mutations

**Example:**
```tsx
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 60000,
});
```

### 3. Error Handling

**Centralized Error System:**
```
Error Occurs → handleError() → Logger → User Feedback
```

**Error Classes:**
- `AppError` - Base error class
- `ValidationError` - Form validation errors
- `NotFoundError` - Resource not found
- `UnauthorizedError` - Auth errors
- `ForbiddenError` - Permission errors

### 4. Logging

**4-Level Logger:**
- `debug` - Development only
- `info` - General information
- `warn` - Warnings
- `error` - Errors

**Usage:**
```ts
logger.info('User logged in', { userId, email });
logger.error('Failed to create sale', { error, saleData });
```

## Database Design

### Core Tables

#### User
- id (UUID)
- email (unique)
- name
- password (hashed)
- isAdmin (boolean)
- permissions (string[])

#### Product
- id (UUID)
- name
- sku (unique)
- price (decimal)
- category
- active (boolean)

#### Inventory
- id (UUID)
- productId (FK → Product)
- coldRoomQuantity
- houseQuantity
- salePointQuantity
- *MinStock fields

#### Sale
- id (UUID)
- userId (FK → User)
- date
- total
- paymentMethod
- status

#### SaleItem
- id (UUID)
- saleId (FK → Sale)
- productId (FK → Product)
- quantity
- price

### Relationships

```
User ──1:N──→ Sale
Sale ──1:N──→ SaleItem
Product ──1:1──→ Inventory
Product ──1:N──→ SaleItem
```

## API Design

### REST Principles
- Resource-based URLs
- HTTP methods (GET, POST, PUT, DELETE)
- JSON responses
- Consistent error format

### Response Format

**Success:**
```json
{
  "data": {},
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

**Error:**
```json
{
  "error": "Error message",
  "details": []
}
```

## Security

### 1. Authentication
- NextAuth with credentials provider
- Bcrypt password hashing
- Secure session tokens (JWT)

### 2. Authorization
- Role-based access control (RBAC)
- Permission-based routes
- Middleware protection

### 3. Data Validation
- Zod schemas for all inputs
- Server-side validation
- Type-safe API endpoints

### 4. CSRF Protection
- NextAuth built-in CSRF tokens
- SameSite cookie policy

## Performance

### 1. Caching Strategy
- React Query for API responses
- IndexedDB for offline data
- Next.js static generation where possible

### 2. Code Splitting
- Dynamic imports for large components
- Route-based splitting (automatic)
- Lazy loading of heavy dependencies

### 3. Database Optimization
- Indexed foreign keys
- Query optimization with Prisma
- Pagination for large datasets

## Scalability

### Horizontal Scaling
- Stateless API design
- External session storage (Redis)
- Load balancer ready

### Vertical Scaling
- Efficient database queries
- Connection pooling
- Optimized React renders

## Monitoring & Logging

### Application Logs
- Centralized logging system
- Development vs Production modes
- Structured log format

### Error Tracking
- Error boundaries in React
- API error logging
- User feedback system

## Future Improvements

### Phase 1: Testing
- Unit tests with Vitest
- Integration tests
- E2E tests with Playwright

### Phase 2: CI/CD
- GitHub Actions workflow
- Automated testing
- Automated deployment

### Phase 3: Advanced Features
- Real-time updates (WebSocket)
- Advanced reporting
- Multi-tenancy support
- Mobile app

## Development Workflow

### 1. Feature Development
```bash
git checkout -b feature/new-feature
# Develop feature
pnpm dev
# Test locally
pnpm build
# Commit and push
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### 2. Code Review
- Pull request on GitHub
- Code review by team
- CI checks pass
- Merge to main

### 3. Deployment
- Automatic deploy on push to main (Vercel)
- Run migrations
- Monitor logs

## Best Practices

### Code Style
- Use TypeScript strictly
- Follow ESLint rules
- Use Prettier for formatting
- Write self-documenting code

### Component Design
- Small, focused components
- Props destructuring
- TypeScript interfaces for props
- Error boundaries

### API Design
- RESTful conventions
- Consistent naming
- Proper HTTP status codes
- Comprehensive error messages

### Database
- Use migrations for schema changes
- Never modify migration files
- Backup before major changes
- Index frequently queried fields
