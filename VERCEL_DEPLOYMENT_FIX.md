# Vercel Deployment Fix Guide

## Problem
Your Vercel deployment is failing with a `MIDDLEWARE_INVOCATION_FAILED` error (500: INTERNAL_SERVER_ERROR). This is typically caused by missing environment variables or database connection issues.

## Root Causes
1. **Missing Environment Variables**: The middleware and auth system require specific environment variables
2. **Database Connection Issues**: Prisma can't connect to the database in production
3. **NextAuth Configuration**: Missing secrets for authentication

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://username:password@host:port/database?sslmode=require
```

### Authentication Secrets
```
NEXTAUTH_SECRET=your-random-secret-here
AUTH_SECRET=your-random-secret-here
```

### Optional (for better security)
```
NEXTAUTH_URL=https://reslifecal.vercel.app
```

## How to Fix

### 1. Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project (`reslifecal`)
3. Go to **Settings** → **Environment Variables**
4. Add each required variable:

   **DATABASE_URL**
   - Name: `DATABASE_URL`
   - Value: Your PostgreSQL connection string (with pooling)
   - Environment: Production, Preview, Development

   **POSTGRES_URL_NON_POOLING**
   - Name: `POSTGRES_URL_NON_POOLING`
   - Value: Your PostgreSQL connection string (without pooling)
   - Environment: Production, Preview, Development

   **NEXTAUTH_SECRET**
   - Name: `NEXTAUTH_SECRET`
   - Value: Generate a random string (32+ characters)
   - Environment: Production, Preview, Development

   **AUTH_SECRET**
   - Name: `AUTH_SECRET`
   - Value: Same as NEXTAUTH_SECRET
   - Environment: Production, Preview, Development

### 2. Generate a Secure Secret

You can generate a secure secret using:
```bash
openssl rand -base64 32
```

Or use an online generator and copy a 32+ character random string.

### 3. Database Setup

Ensure your database is properly set up:

1. **If using Neon (recommended for Vercel)**:
   - Create a new project in Neon
   - Get both the pooled and non-pooled connection strings
   - Run `npx prisma db push` locally with the production DATABASE_URL

2. **If using another PostgreSQL provider**:
   - Ensure SSL is enabled
   - Use connection pooling for DATABASE_URL
   - Use direct connection for POSTGRES_URL_NON_POOLING

### 4. Deploy and Test

1. After setting environment variables, redeploy your project
2. Test the health endpoints:
   - `https://reslifecal.vercel.app/api/health`
   - `https://reslifecal.vercel.app/api/db-check`

### 5. Verify Database Connection

The `/api/db-check` endpoint will show you:
- Whether environment variables are set
- Database connection status
- User count (if connected)

## What I Fixed in the Code

### 1. Enhanced Middleware (`src/middleware.ts`)
- Added graceful handling of missing environment variables
- Added try-catch blocks to prevent middleware crashes
- Added proper TypeScript types for Node.js globals

### 2. Improved Auth Configuration (`src/lib/auth.ts`)
- Added database availability checks
- Enhanced error logging
- Added debug mode for development

### 3. Better Health Checks
- Enhanced `/api/health` endpoint
- Created `/api/db-check` endpoint for detailed diagnostics
- Added environment variable status reporting

## Testing Your Fix

After deployment, test these endpoints:

1. **Health Check**: `https://reslifecal.vercel.app/api/health`
2. **Database Check**: `https://reslifecal.vercel.app/api/db-check`
3. **Main App**: `https://reslifecal.vercel.app/`

## Common Issues and Solutions

### Issue: "Database connection failed"
**Solution**: Check your DATABASE_URL and POSTGRES_URL_NON_POOLING are correct

### Issue: "Missing environment variables"
**Solution**: Ensure all required variables are set in Vercel

### Issue: "Authentication failed"
**Solution**: Verify NEXTAUTH_SECRET and AUTH_SECRET are set

### Issue: "Prisma client not generated"
**Solution**: Ensure your build command includes `prisma generate`

## Build Command Verification

Your `package.json` should have:
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

This ensures Prisma client is generated before the build.

## Next Steps

1. Set all environment variables in Vercel
2. Redeploy your project
3. Test the health endpoints
4. Verify the main application works

If you still encounter issues, check the Vercel function logs for more detailed error messages.