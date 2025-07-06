# ResLife Duty Calendar

A modern web application for managing residential life duties, built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- 🔐 Secure authentication with NextAuth.js
- 📅 Interactive calendar for duty management
- 🔄 Duty swap requests between team members
- 📱 Responsive design with shadcn/ui components
- 🔍 Real-time search and filtering
- 📊 Admin dashboard for duty oversight
- 🔗 Calendar subscription feeds

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/enterSys/reslife-duty-calendar.git
cd reslife-duty-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials and NextAuth secret.

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/enterSys/reslife-duty-calendar)

### Environment Variables

Set these environment variables in your deployment:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your deployment URL
- `NEXTAUTH_SECRET`: Random secret for NextAuth

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## License

MIT License - see [LICENSE](LICENSE) for details.