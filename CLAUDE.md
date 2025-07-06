# ResLife Duty Calendar - Tech Stack Recommendations

## Current Stack Issues

The current tech stack has several limitations:
- **No component system** - Using vanilla HTML/CSS/JS leads to code duplication
- **Limited type safety** - No TypeScript means more runtime errors
- **Manual API management** - Each endpoint is a separate file
- **CSS build issues** - DaisyUI components not properly integrated
- **No state management** - Complex client-side state handling

## Recommended Tech Stack: Next.js 15

### Frontend & Backend: Next.js 15 App Router
```typescript
// Use latest Next.js 15 with App Router
npx create-next-app@latest reslife-calendar --typescript --tailwind --app
```

### UI Components: shadcn/ui (not DaisyUI)
```bash
# Initialize shadcn/ui with proper theming
npx shadcn@latest init
```

**Why shadcn/ui over DaisyUI:**
- Copy-paste components you own and can customize
- No CDN or build issues
- Better TypeScript support
- Radix UI primitives for accessibility
- Works perfectly with Tailwind CSS v4

### Database: Prisma + PostgreSQL (Neon)
```typescript
// Type-safe database queries
const duties = await prisma.duty.findMany({
  where: { date: { gte: startDate } },
  include: { user: true, swaps: true }
})
```

### Authentication: NextAuth.js v5 (Auth.js)
```typescript
// Simple, secure authentication
import { auth } from "@/auth"

export default async function Page() {
  const session = await auth()
  if (!session) redirect("/login")
  // ...
}
```

### State Management: TanStack Query
```typescript
// Automatic caching, refetching, and optimistic updates
const { data: duties, mutate } = useQuery({
  queryKey: ['duties', month],
  queryFn: () => fetchDuties(month)
})
```

## Migration Plan

### Phase 1: Setup Next.js 15
```bash
# Create new Next.js project
npx create-next-app@latest reslife-v2 --typescript --tailwind --app

# Install dependencies
npm install @prisma/client prisma
npm install next-auth@beta @auth/prisma-adapter
npm install @tanstack/react-query
npm install zod react-hook-form @hookform/resolvers
```

### Phase 2: Initialize shadcn/ui
```bash
# Setup shadcn/ui with custom theme
npx shadcn@latest init

# Add essential components
npx shadcn@latest add button card form calendar badge
npx shadcn@latest add dialog sheet toast navigation-menu
```

### Phase 3: Configure Custom Theme
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#22c55e", // ResLife green
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#16a34a",
          foreground: "#ffffff",
        }
      }
    }
  }
}
```

### Phase 4: Project Structure
```
/app
  /(auth)
    /login/page.tsx
    /register/page.tsx
  /(dashboard)
    /layout.tsx
    /page.tsx
    /duties/page.tsx
    /swaps/page.tsx
    /admin/page.tsx
  /api
    /auth/[...nextauth]/route.ts
    /trpc/[trpc]/route.ts
/components
  /ui (shadcn components)
  /calendar
  /duty-card
  /swap-modal
/lib
  /db.ts (Prisma client)
  /auth.ts (NextAuth config)
  /api.ts (tRPC or API utilities)
/prisma
  schema.prisma
```

## Key Improvements

### 1. Type Safety Everywhere
```typescript
// API routes with full type safety
export async function POST(request: Request) {
  const body = await request.json()
  const validated = createDutySchema.parse(body)
  
  const duty = await prisma.duty.create({
    data: validated
  })
  
  return NextResponse.json(duty)
}
```

### 2. Server Components for Performance
```typescript
// No client-side data fetching needed
export default async function DutiesPage() {
  const duties = await prisma.duty.findMany()
  
  return <DutyCalendar duties={duties} />
}
```

### 3. Optimistic Updates
```typescript
// Instant UI updates while saving
const { mutate } = useMutation({
  mutationFn: updateDuty,
  onMutate: async (newDuty) => {
    // Update UI immediately
    await queryClient.cancelQueries(['duties'])
    queryClient.setQueryData(['duties'], old => 
      old.map(d => d.id === newDuty.id ? newDuty : d)
    )
  }
})
```

### 4. Real-time Updates (Optional)
```typescript
// Using Server-Sent Events or WebSockets
export default function DutyCalendar() {
  useEffect(() => {
    const eventSource = new EventSource('/api/duties/stream')
    eventSource.onmessage = (e) => {
      const duty = JSON.parse(e.data)
      // Update local state
    }
  }, [])
}
```

## Environment Variables
```env
# .env.local
DATABASE_URL="your-neon-database-url"
NEXTAUTH_SECRET="generate-with-openssl"
NEXTAUTH_URL="http://localhost:3000"
```

## Deployment
```bash
# Deploy to Vercel (automatic with GitHub)
vercel

# Database migrations
npx prisma migrate deploy
```

## Benefits of This Stack

1. **Unified Development** - Frontend and backend in one codebase
2. **Type Safety** - TypeScript catches errors at compile time
3. **Better Performance** - Server Components, automatic code splitting
4. **Developer Experience** - Hot reload, great debugging tools
5. **Production Ready** - Built-in optimizations, edge runtime support
6. **Maintainable** - Clear structure, reusable components
7. **Scalable** - Can add features like real-time updates, notifications
8. **Modern Patterns** - Server-first, progressive enhancement

## Next Steps

1. Create a new Next.js 15 project
2. Set up Prisma with existing database schema
3. Implement authentication with NextAuth.js
4. Build UI components with shadcn/ui
5. Migrate existing features one by one
6. Add new features like real-time updates

This modern stack will make development faster, more enjoyable, and result in a better user experience.