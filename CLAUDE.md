# T3 Stack Starter Repository - Technical Documentation

## Overview

This is a modern full-stack TypeScript starter repository built with the [T3 Stack](https://create.t3.gg/), optimized for rapid development of type-safe web applications. The stack emphasizes end-to-end type safety, developer experience, and modern best practices.

**Created with**: `create-t3-app` v7.39.3
**Package Manager**: pnpm 10.13.1

---

## Tech Stack

### Core Framework
- **Next.js 15.5.4** - React framework with App Router
  - Server Components (RSC) by default
  - API routes for backend functionality
  - Turbopack for fast development (`--turbo` flag)
  - Built-in optimizations and image handling

### Frontend
- **React 19.2.0** - UI library with latest concurrent features
- **Tailwind CSS 4.1.14** - Utility-first CSS framework
  - PostCSS integration
  - Configured with Geist font family
  - Custom gradient backgrounds and utility classes

### Backend & API Layer
- **tRPC 11.6.0** - End-to-end typesafe API layer
  - Type inference for inputs/outputs
  - React Query integration
  - Server-side calls (RSC support)
  - Batched requests via HTTP streaming
  - SuperJSON for data serialization

### Database & ORM
- **Drizzle ORM 0.41.0** - TypeScript ORM
  - PostgreSQL dialect
  - Type-safe query builder
  - Schema-based approach
  - Multi-project schema support (table prefixing: `starter-repo_*`)
- **postgres.js 3.4.7** - PostgreSQL client
  - Connection pooling
  - Development connection caching

### Authentication
- **Clerk 6.33.2** - Complete authentication solution
  - Sign in/Sign out flows
  - User management
  - Protected routes via middleware
  - Session handling

### State Management & Data Fetching
- **TanStack Query 5.90.2** (React Query) - Server state management
  - Query caching
  - Automatic refetching
  - Optimistic updates
  - Integrated with tRPC

### Type Safety & Validation
- **TypeScript 5.9.3** - Static type checking
- **Zod 3.25.76** - Schema validation
  - Runtime type checking
  - Form validation
  - Environment variable validation via `@t3-oss/env-nextjs`

### Code Quality & Formatting
- **Biome 1.9.4** - Fast formatter and linter (replaces ESLint + Prettier)
  - Formatting enabled
  - Import organization
  - Tailwind class sorting (via `useSortedClasses`)
  - VCS integration

---

## Project Structure

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── _components/        # Private components (not routes)
│   │   ├── api/
│   │   │   └── trpc/[trpc]/   # tRPC API endpoint
│   │   ├── protected/          # Protected routes (requires auth)
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx            # Homepage
│   │
│   ├── server/                 # Backend code (server-only)
│   │   ├── api/
│   │   │   ├── routers/        # tRPC routers
│   │   │   ├── root.ts         # Main router aggregation
│   │   │   └── trpc.ts         # tRPC initialization & procedures
│   │   └── db/
│   │       ├── schema/         # Database schemas
│   │       │   ├── posts.ts
│   │       │   └── index.ts
│   │       ├── helpers.ts      # Schema helpers (defaultFields, createTable)
│   │       └── index.ts        # Database connection
│   │
│   ├── trpc/                   # tRPC client setup
│   │   ├── react.tsx           # Client components provider
│   │   ├── server.ts           # Server components caller
│   │   └── query-client.ts     # Query client configuration
│   │
│   ├── styles/
│   │   └── globals.css         # Global styles & Tailwind imports
│   │
│   ├── env.js                  # Environment variable validation
│   ├── middleware.ts           # Clerk auth middleware
│   └── instrumentation-client.ts  # Client-side instrumentation
│
├── public/                     # Static assets
├── .github/                    # GitHub workflows and configurations
├── biome.jsonc                 # Biome configuration
├── drizzle.config.ts           # Drizzle Kit configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── postcss.config.js           # PostCSS configuration
├── docker-compose.yaml         # Local PostgreSQL setup
└── package.json                # Dependencies and scripts
```

---

## Architecture & Patterns

### 1. **Type Safety Philosophy**

This stack prioritizes type safety across all layers:

- **Database → API → Frontend**: Full type inference from database schema to UI
- **Environment Variables**: Validated at build time using Zod schemas in `src/env.js`
- **API Contracts**: tRPC provides automatic type inference for all API calls
- **Runtime Validation**: Zod schemas validate user inputs and external data

### 2. **tRPC Setup**

#### Server-Side (`src/server/api/`)

**Context Creation** (`trpc.ts:28-33`):
```typescript
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    db,
    ...opts,
  };
};
```
- Context provides shared resources (database, headers) to all procedures
- Available in every tRPC procedure via `ctx` parameter

**Procedures**:
- `publicProcedure`: Available to all users (authenticated or not)
- `protectedProcedure`: Requires authentication via Clerk
  - Automatically adds `user` to context
  - Throws `UNAUTHORIZED` if user not signed in

**Middleware**:
- `timingMiddleware`: Logs execution time + adds artificial delay in dev (100-500ms)
  - Helps identify N+1 queries and performance issues early

#### Client-Side

**Client Components** (`src/trpc/react.tsx`):
```typescript
const api = createTRPCReact<AppRouter>();
// Usage in components:
const { data } = api.post.hello.useQuery({ text: "world" });
```

**Server Components** (`src/trpc/server.ts`):
```typescript
import { api } from "~/trpc/server";
// Usage in RSC:
const data = await api.post.hello({ text: "world" });
```

**Key Features**:
- Automatic request batching
- SuperJSON for complex types (Date, Map, Set, etc.)
- Logger link for debugging
- Singleton QueryClient pattern

### 3. **Database Architecture**

**Schema Patterns** (`src/server/db/helpers.ts`):

```typescript
export const defaultFields = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};
```

**Standard Fields**:
- `id`: UUID primary key (auto-generated)
- `createdAt`: Timestamp with timezone (set on creation)
- `updatedAt`: Automatically updated on record modification
- `deletedAt`: Soft delete support (nullable)

**Table Naming**:
- Tables are prefixed with `starter-repo_*` via `createTable` helper
- Enables multi-project schema in single database
- Configure prefix in `drizzle.config.ts:11`

**Connection Management**:
- Development: Cached connection to avoid HMR issues
- Production: New connection instance

### 4. **Authentication Flow**

**Middleware** (`src/middleware.ts`):
- Protects routes matching `/protected(.*)`
- Redirects unauthenticated users to sign-in
- Runs on all non-static routes and API endpoints

**Integration Points**:
- Layout: `<ClerkProvider>` wraps entire app
- Server Components: `currentUser()` for user data
- tRPC: `protectedProcedure` enforces authentication

### 5. **Environment Variables**

**Validation** (`src/env.js`):

Using `@t3-oss/env-nextjs` for type-safe environment variables:

```typescript
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
  },
  runtimeEnv: { /* mapping */ },
});
```

**Features**:
- Build-time validation
- Type inference in TypeScript
- Client variables must be prefixed with `NEXT_PUBLIC_`
- Empty strings treated as undefined
- Skip validation with `SKIP_ENV_VALIDATION=1`

### 6. **Data Flow Example**

**Creating a Post**:

1. **UI** (`src/app/_components/post.tsx`):
   ```typescript
   const createPost = api.post.create.useMutation();
   createPost.mutate({ name: "Hello" });
   ```

2. **tRPC Router** (`src/server/api/routers/post.ts:19-25`):
   ```typescript
   create: publicProcedure
     .input(z.object({ name: z.string().min(1) }))
     .mutation(async ({ ctx, input }) => {
       await ctx.db.insert(posts).values({
         name: input.name,
       });
     }),
   ```

3. **Database**: Drizzle inserts into `starter-repo_posts` table

**Type safety at every step**:
- Input validated via Zod
- Database types from Drizzle schema
- Return types inferred back to frontend

---

## Configuration Files

### TypeScript (`tsconfig.json`)

**Key Settings**:
- **Target**: ES2022 with modern features
- **Strictness**: `strict: true`, `noUncheckedIndexedAccess: true`, `checkJs: true`
- **Module**: ESNext with Bundler resolution
- **Path Alias**: `~/*` maps to `./src/*`
- **JSX**: Preserve (Next.js handles transformation)

### Next.js (`next.config.js`)

**Features**:
- Environment validation via `./src/env.js`
- PostHog reverse proxy (rewrites `/ingest/*` to EU endpoints)
- Trailing slash skip for PostHog compatibility

### Biome (`biome.jsonc`)

**Configuration**:
- Formatter and linter enabled
- Automatic import organization
- Tailwind class sorting (supports `clsx`, `cva`, `cn` functions)
- Git integration for VCS-aware operations
- Recommended rules enabled

### Drizzle (`drizzle.config.ts`)

**Settings**:
- Schema path: `./src/server/db/schema/index.ts`
- PostgreSQL dialect
- Table filter: `starter-repo_*`
- Database URL from environment variables

---

## Development Workflows

### Available Scripts

```bash
# Development
pnpm dev              # Start Next.js dev server with Turbopack
pnpm build            # Production build
pnpm start            # Start production server
pnpm preview          # Build and preview production locally

# Code Quality
pnpm check            # Run Biome checks (format + lint)
pnpm check:write      # Auto-fix safe issues
pnpm check:unsafe     # Auto-fix including unsafe changes
pnpm typecheck        # TypeScript type checking (no emit)

# Database
pnpm db:generate      # Generate migration files
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema changes (development)
pnpm db:studio        # Open Drizzle Studio UI
```

### Local Database Setup

**Using Docker Compose** (`docker-compose.yaml`):
```bash
docker compose up -d
# PostgreSQL available at: localhost:5432
# Database: starter-repo
# User: postgres
# Password: password
```

### Adding New Features

#### 1. **New Database Table**

Create schema in `src/server/db/schema/`:
```typescript
// src/server/db/schema/users.ts
import { createTable, defaultFields } from "../helpers";
import { varchar } from "drizzle-orm/pg-core";

export const users = createTable("users", {
  ...defaultFields,
  email: varchar("email", { length: 255 }).notNull(),
});
```

Export from `src/server/db/schema/index.ts`:
```typescript
export * from "./users";
```

Push to database:
```bash
pnpm db:push
```

#### 2. **New tRPC Router**

Create router in `src/server/api/routers/`:
```typescript
// src/server/api/routers/user.ts
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.users.findMany();
  }),
});
```

Register in `src/server/api/root.ts`:
```typescript
export const appRouter = createTRPCRouter({
  post: postRouter,
  user: userRouter, // Add this
});
```

#### 3. **New Protected Route**

Create in `src/app/`:
```typescript
// src/app/dashboard/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  return <div>Welcome {user.firstName}</div>;
}
```

Update middleware if needed (`src/middleware.ts`):
```typescript
const isProtectedRoute = createRouteMatcher([
  "/protected(.*)",
  "/dashboard(.*)", // Add this
]);
```

---

## Best Practices & Guidelines

### 1. **File Organization**

- **Server code**: Must stay in `src/server/` or use `"server-only"` package
- **Client components**: Mark with `"use client"` directive
- **Private components**: Prefix directories with `_` (e.g., `_components/`)
- **Colocate**: Keep related code together (components near routes that use them)

### 2. **Type Safety**

- **Never use `any`**: Use `unknown` and narrow types instead
- **Use Zod for validation**: All external inputs must be validated
- **Leverage inference**: Let TypeScript infer types from Drizzle/tRPC when possible
- **Export types**: Use `type Post = typeof posts.$inferSelect` for Drizzle models

### 3. **Database**

- **UserId is a string not uuid**: Because we are using clerk for auth, clerk doesnt use uuid.
- **Do not foreign reference users table**: Because we are using clerk, don't make forign references on user id.
- **Always use defaultFields**: Ensures consistent `id`, timestamps, soft delete
- **Soft deletes**: Prefer setting `deletedAt` over hard deletes

### 4. **tRPC Procedures**

- **Input validation**: Always define `.input()` with Zod schema
- **Use appropriate procedure type**: `publicProcedure` vs `protectedProcedure`
- **Return explicit data**: Don't return entire entities if not needed
- **Handle errors**: Use `TRPCError` with appropriate codes

### 5. **Code Style**

- **Use Biome**: Run `pnpm check:write` before commits
- **Sort imports**: Biome handles this automatically
- **Tailwind order**: Biome sorts class names for consistency
- **Path aliases**: Use `~/` instead of relative imports (`../../../`)

---

## Common Patterns

### Server Component with tRPC

```typescript
import { api } from "~/trpc/server";

export default async function Page() {
  const posts = await api.post.getLatest();
  return <div>{posts?.name}</div>;
}
```

### Client Component with tRPC

```typescript
"use client";
import { api } from "~/trpc/react";

export function PostList() {
  const { data, isLoading } = api.post.getLatest.useQuery();
  if (isLoading) return <div>Loading...</div>;
  return <div>{data?.name}</div>;
}
```

### Optimistic Updates

```typescript
const utils = api.useUtils();
const createPost = api.post.create.useMutation({
  onMutate: async (newPost) => {
    await utils.post.getLatest.cancel();
    const prev = utils.post.getLatest.getData();
    utils.post.getLatest.setData(undefined, newPost);
    return { prev };
  },
  onError: (err, newPost, context) => {
    utils.post.getLatest.setData(undefined, context?.prev);
  },
  onSettled: () => {
    utils.post.getLatest.invalidate();
  },
});
```

### Protected tRPC Procedure

```typescript
secret: protectedProcedure.query(({ ctx }) => {
  // ctx.user is guaranteed to exist (Clerk User object)
  return {
    message: `Hello ${ctx.user.firstName}`,
    userId: ctx.user.id,
  };
}),
```

---

## Additional Resources

- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Clerk Documentation](https://clerk.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Biome](https://biomejs.dev/)
