# ResLife Duty Calendar

A modern duty management system for residential life teams with a clean, accessible interface.

## Tech Stack

- **Frontend**: HTML5, Tailwind CSS, DaisyUI Components
- **Backend**: Node.js with Vercel Serverless Functions
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT-based auth
- **Deployment**: Vercel

## Features

- 📅 Monthly calendar view for duty scheduling
- 🔄 Duty swap requests between team members
- 👥 Team member management (admin)
- 📱 Mobile-responsive design
- 🎨 Custom green/white ResLife theme
- 📧 Email notifications for swap requests
- 📲 iCal feed for calendar subscriptions
- 🔐 Secure authentication system

## Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```env
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_jwt_secret
```

3. Build CSS:
```bash
npm run build:css
```

4. Run locally:
```bash
npm run dev
```

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/duties` - Get duties (with filters)
- `POST /api/duties` - Create duty (admin)
- `PUT /api/duties` - Update duty (admin)
- `DELETE /api/duties` - Delete duty (admin)
- `GET /api/swaps` - Get swap requests
- `POST /api/swaps` - Create swap request
- `PUT /api/swaps` - Accept/reject swap
- `GET /api/calendar` - Get iCal feed
- `GET /api/health` - Health check

## UI Components

The application uses DaisyUI component library for consistent styling:
- **Hero** sections for landing pages
- **Card** components for content sections
- **Form controls** with consistent styling
- **Badges** for status indicators
- **Alerts** for notifications
- **Tabs** for navigation
- **Navbar** and **Drawer** for mobile navigation

## Custom Theme

The application uses a custom "reslife" theme with:
- Primary color: Green (#22c55e)
- Secondary color: Dark green (#16a34a)
- Accent color: Lime (#84cc16)
- Clean white backgrounds with subtle gray accents

## Deployment

The application is configured for Vercel deployment with serverless functions. Each API endpoint is a separate serverless function for optimal performance.

```bash
vercel
```

## Project Structure

```
/
├── api/                 # Serverless API functions
│   ├── auth/           # Authentication endpoints
│   ├── duties.js       # Duty management
│   ├── swaps.js        # Swap requests
│   └── calendar.js     # iCal feed
├── index.html          # Main application
├── auth.html           # Login/Register page
├── script.js           # Frontend JavaScript
├── output.css          # Compiled CSS (Tailwind + DaisyUI)
└── manifest.json       # PWA manifest
```

## License

MIT