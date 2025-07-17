# ResLife Duty Calendar - Knowledge Graph

## Project Overview
The ResLife Duty Calendar is a comprehensive full-stack web application designed for managing residential life duties in educational institutions. Built with modern technologies and following best practices for scalability and maintainability.

## Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js v5 with credentials provider
- **State Management**: TanStack Query (React Query)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Database**: PostgreSQL hosted on Neon Database
- **Deployment**: Vercel

## Architecture Overview

### Project Structure
```
/home/developer/reslife-duty-calendar/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── admin/             # Admin panel
│   │   └── profile/           # User profile
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── admin/            # Admin components
│   │   └── profile/          # Profile components
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Helper functions
│   ├── types/                # TypeScript type definitions
│   └── middleware.ts         # Next.js middleware
├── prisma/                   # Database schema and migrations
├── scripts/                  # Utility scripts
├── public/                   # Static assets
└── configuration files
```

## Database Schema

### Core Entities & Relationships
- **User**: User accounts with roles (member/admin), building assignments
  - Fields: id, name, email, password, building, role, createdAt, updatedAt
  - Relationships: 1:N → Duty, DutySwap, UnavailableDay, CalendarSubscription, PasswordReset

- **Duty**: Individual duty assignments
  - Fields: id, date, dayOfWeek, type, notes, userId, createdAt, updatedAt
  - Relationships: N:1 → User, 1:N → DutySwap (as requester_duty/requested_duty)

- **DutySwap**: Swap requests between users
  - Fields: id, requesterId, requestedWithId, requesterDutyId, requestedDutyId, status, createdAt, updatedAt
  - Relationships: N:1 → User (requester), N:1 → User (requested_with), N:1 → Duty (requester_duty), N:1 → Duty (requested_duty)

- **UnavailableDay**: User availability periods
  - Fields: id, userId, startDate, endDate, isRecurring, createdAt, updatedAt
  - Relationships: N:1 → User

- **CalendarSubscription**: Calendar feed subscriptions
  - Fields: id, userId, url, name, createdAt, updatedAt
  - Relationships: N:1 → User

- **PasswordReset**: Password reset tokens
  - Fields: id, userId, token, expiresAt, createdAt, updatedAt
  - Relationships: N:1 → User

## API Architecture

### Authentication & Security
- **NextAuth.js v5** with credentials provider
- **JWT tokens** for session management
- **Password hashing** with bcryptjs
- **Role-based access control** (member/admin)
- **Protected routes** via middleware.ts
- **Input validation** with Zod schemas

### API Endpoints Structure
```
/api/auth/*                    # NextAuth handlers
/api/users/                    # User management
  - GET, POST /api/users       # List users, create user
  - GET, PATCH, DELETE /api/users/[id]  # User CRUD
  - PATCH /api/users/profile   # Update profile
  - POST /api/users/change-password  # Change password
/api/duties/                   # Duty management
  - GET, POST /api/duties      # List/create duties
  - GET, PATCH, DELETE /api/duties/[id]  # Duty CRUD
  - POST /api/duties/import    # CSV import
/api/swaps/                    # Swap management
  - GET, POST /api/swaps       # List/create swaps
  - PATCH /api/swaps/[id]      # Update swap status
/api/dashboard/stats           # Dashboard statistics
/api/admin/grant-admin         # Grant admin access
```

### API Response Patterns
- **Standard REST responses** with proper HTTP status codes
- **Consistent error handling** with error messages
- **Cache headers** for performance optimization
- **Zod validation** for request/response schemas

## Frontend Architecture

### Component Organization
```
components/
├── ui/                        # Base UI components (shadcn/ui)
│   ├── button.tsx, input.tsx, card.tsx, etc.
│   └── user-avatar.tsx       # Custom user dropdown
├── dashboard/                 # Dashboard feature components
│   ├── dashboard-content.tsx # Main dashboard container
│   ├── calendar-view.tsx     # Calendar display
│   ├── my-duties.tsx         # User's duties list
│   ├── swap-requests.tsx     # Swap management
│   ├── team-members.tsx      # Team overview
│   ├── duty-card.tsx         # Duty display component
│   ├── swap-request-dialog.tsx # Swap creation modal
│   └── import-duties-dialog.tsx # CSV import modal
├── profile/                   # Profile management
│   ├── profile-content.tsx   # Profile page container
│   ├── profile-form.tsx      # User info editing
│   ├── password-change-form.tsx # Password management
│   └── unavailable-days-manager.tsx # Availability management
├── admin/                     # Admin panel components
│   ├── admin-wrapper.tsx     # Admin dashboard
│   ├── user-management.tsx   # User CRUD operations
│   └── duty-editor.tsx       # Duty management
├── providers.tsx             # Global providers wrapper
├── navbar.tsx                # Navigation component
└── error-boundary.tsx        # Error handling
```

### State Management
- **TanStack Query** for server state management and caching
- **React Hook Form** for form state management
- **NextAuth session** for authentication state
- **next-themes** for theme management

### Query Keys & Caching Strategy
```typescript
// Query keys used throughout the application
["dashboard-stats"] → /api/dashboard/stats
["my-duties", userId] → /api/duties?userId=X
["swaps", userId] → /api/swaps?userId=X
["duties", startDate, endDate] → /api/duties?startDate=X&endDate=Y
["profile"] → /api/users/profile
["unavailable-days", userId] → /api/users/{id}/unavailable-days
["users"] → /api/users
```

### Form Management
- **React Hook Form** + **Zod** for validation
- **Consistent form patterns** across the application
- **Optimistic updates** for better UX
- **Error handling** with toast notifications

## Key Features

### User Dashboard
- **Personal duty calendar** with interactive date selection
- **Duty swap management** with request/approval workflow
- **Team member directory** with contact information
- **CSV import functionality** for bulk duty imports
- **Real-time statistics** and notifications

### Admin Panel
- **User management** with CRUD operations
- **Role assignment** and permission management
- **Duty editing** with bulk operations
- **System statistics** and monitoring
- **Admin access granting** functionality

### Profile Management
- **User profile editing** with validation
- **Password change** with security checks
- **Availability management** with recurring periods
- **Theme preferences** (light/dark mode)

## User Flow & Navigation

### Authentication Flow
```
/ → redirects to /auth/login (if not authenticated)
/auth/login → validates credentials → /dashboard
/auth/register → creates account → /auth/login
/auth/forgot-password → sends reset email → /auth/login
```

### Protected Routes
```
/dashboard → Main dashboard with tabs
  - My Duties: Personal duty management
  - Calendar: Calendar view of all duties
  - Swap Requests: Manage duty swaps
  - Team Members: View team information

/profile → User profile management
  - Profile: Edit user information
  - Security: Change password
  - Availability: Manage unavailable periods

/admin → Admin panel (admin role required)
  - Users: User management
  - Grant Access: Grant admin privileges
```

## Data Flow Patterns

### Client-Server Communication
1. **Request** → API Route Handler
2. **Authentication check** via auth()
3. **Input validation** via Zod schema
4. **Database operation** via Prisma
5. **Response formatting**
6. **Error handling** and logging

### State Synchronization
- **TanStack Query** for server state caching
- **5-minute stale time** for most queries
- **Automatic cache invalidation** on mutations
- **Optimistic updates** for immediate feedback

### Component Communication
- **Props drilling** for simple parent-child communication
- **Callback functions** for child-to-parent events
- **Context providers** for global state (auth, theme)
- **Query invalidation** for cross-component updates

## Performance Optimizations

### Code Splitting
```typescript
// Dynamic imports for heavy components
const CalendarView = dynamic(() => import("./calendar-view"))
const MyDuties = dynamic(() => import("./my-duties"))
```

### Query Optimizations
- **Parallel queries** for independent data
- **Dependent queries** with proper enabling
- **Background refetching** for stale data
- **Pagination** for large datasets

### Rendering Optimizations
- **React.memo** for expensive components
- **useMemo** for expensive calculations
- **useCallback** for stable function references
- **Optimistic updates** for better UX

## Development Patterns

### Code Organization
- **Clear separation of concerns**
- **Type-safe throughout** with TypeScript
- **Consistent error handling**
- **Modular component architecture**

### Testing Strategy
- **TypeScript** for compile-time checks
- **Zod** for runtime validation
- **ESLint** for code quality
- **Prisma** for database safety

### Build & Deployment
- **Vercel** for hosting and serverless functions
- **Neon Database** for PostgreSQL hosting
- **Environment-based configuration**
- **Automatic deployments** from Git

## Security Considerations

### Authentication & Authorization
- **JWT tokens** with proper expiration
- **Role-based access control**
- **Protected API routes**
- **Secure password handling**

### Data Protection
- **Input validation** on client and server
- **SQL injection protection** via Prisma
- **XSS prevention** via proper escaping
- **CSRF protection** via NextAuth.js

## Recent Changes & Current State

### Latest Modifications
- **Dashboard statistics** now use real-time API data (src/components/dashboard/dashboard-content.tsx)
- **Profile page** Select.Item error has been fixed
- **Unavailable period creation** API validation improvements
- **Comprehensive user profile** management system implemented

### Current Git Status
- **Branch**: master
- **Modified files**: src/components/dashboard/dashboard-content.tsx
- **Recent commits**: Focus on bug fixes and feature enhancements

This knowledge graph provides a comprehensive understanding of the ResLife Duty Calendar application architecture, enabling informed decision-making for future development and maintenance tasks.