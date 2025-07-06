# ResLife Duty Calendar Setup Guide

## Features Added

1. **User Authentication**
   - Login/Register system
   - Password reset via email
   - JWT-based authentication

2. **Database Integration**
   - PostgreSQL database via Vercel Postgres
   - Stores users, duties, swap requests, and calendar subscriptions

3. **Duty Swap System**
   - Request swaps between team members
   - Both parties must agree for swap to complete
   - Email notifications for swap requests

4. **Calendar Subscription**
   - Generate iCal feeds for calendar apps
   - Subscribe in Google Calendar, Apple Calendar, etc.
   - Option to include all team duties or just personal

## Vercel Setup

1. **Database Setup**
   - Go to your Vercel dashboard
   - Navigate to the Storage tab
   - Create a new Postgres database
   - Copy the environment variables

2. **Environment Variables**
   Add these in Vercel project settings:
   ```
   # From Vercel Postgres
   POSTGRES_URL=
   POSTGRES_PRISMA_URL=
   POSTGRES_URL_NO_SSL=
   POSTGRES_URL_NON_POOLING=
   POSTGRES_USER=
   POSTGRES_HOST=
   POSTGRES_PASSWORD=
   POSTGRES_DATABASE=

   # Authentication
   JWT_SECRET=your-random-secret-key
   JWT_EXPIRE=7d

   # Email (for password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-specific-password

   # Application
   APP_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

3. **Database Migration**
   Run this SQL in Vercel Postgres query console:
   ```sql
   -- Copy contents from api/db/schema.sql
   ```

4. **Deploy**
   - Push changes to GitHub
   - Vercel will auto-deploy
   - Visit /auth.html to create first account

## Email Setup (Gmail)

1. Enable 2-factor authentication on Gmail
2. Generate app-specific password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this password in EMAIL_PASS variable

## Usage

- **Login**: Navigate to /auth.html or click login
- **Request Swap**: Click on your duty day, then "Request Swap"
- **Calendar Subscription**: User menu → Calendar Subscription
- **View Swaps**: Click the swap icon in sidebar

## Migration from Static Version

The original static calendar is preserved as:
- `index.html` (original)
- `script.js` (original)

The enhanced version uses:
- `index-enhanced.html` 
- `script-enhanced.js`
- `auth.html`

To switch back to static version, update vercel.json to serve index.html as default.