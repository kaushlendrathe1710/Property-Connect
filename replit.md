# PropMarket - Real Estate Platform

## Overview
A comprehensive real estate platform with four user types (Admins, Agents, Sellers, Buyers) where sellers/agents can list properties for sale or lease, buyers can browse and inquire about properties, and admins have full control over user management and listing approvals.

## User Roles
- **Buyer**: Browse properties, save favorites, send inquiries
- **Seller**: List properties for sale/lease, manage listings, receive inquiries
- **Agent**: Same as seller, professional real estate agents
- **Admin**: Full access, approve/reject listings, manage users

## Architecture

### Frontend (client/)
- React with TypeScript
- TanStack Query for data fetching
- Wouter for routing
- Shadcn UI components
- Tailwind CSS for styling

### Backend (server/)
- Express.js with TypeScript
- In-memory storage (MemStorage) for MVP
- REST API endpoints

### Shared (shared/)
- schema.ts: Data models with Drizzle ORM and Zod validation

## Key Routes

### Public
- `/` - Landing page with featured properties
- `/properties` - Browse all properties with filters
- `/properties/:id` - Property detail page
- `/login` - User login
- `/register` - User registration

### Buyer
- `/favorites` - Saved favorite properties

### Seller/Agent
- `/my-listings` - Manage your property listings
- `/create-listing` - Create a new property listing
- `/inquiries` - View and respond to buyer inquiries

### Admin
- `/admin` - Admin dashboard with stats
- `/admin/approvals` - Approve/reject pending listings
- `/admin/users` - Manage platform users

## Test Accounts
- Admin: username `admin`, password `admin123`
- Agent: username `agent1`, password `agent123`
- Seller: username `seller1`, password `seller123`
- Buyer: username `buyer1`, password `buyer123`

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration

### Properties
- GET `/api/properties` - List all properties
- GET `/api/properties/featured` - Featured properties
- GET `/api/properties/:id` - Single property with owner
- POST `/api/properties` - Create property
- PATCH `/api/properties/:id` - Update property
- DELETE `/api/properties/:id` - Delete property

### Favorites
- GET `/api/favorites` - User's favorites (requires userId query param)
- POST `/api/favorites` - Add favorite
- DELETE `/api/favorites/:propertyId` - Remove favorite

### Inquiries
- GET `/api/inquiries` - Inquiries for seller (requires userId)
- GET `/api/my-inquiries` - Inquiries sent by buyer
- POST `/api/inquiries` - Send inquiry

### Admin
- GET `/api/admin/stats` - Dashboard statistics
- GET `/api/admin/pending-listings` - Pending approvals
- GET `/api/admin/users` - All users
- PATCH `/api/admin/properties/:id/approve` - Approve listing
- PATCH `/api/admin/properties/:id/reject` - Reject listing
- PATCH `/api/admin/users/:id/status` - Update user status

## Recent Changes
- Initial MVP implementation with all core features
- PostgreSQL database with Drizzle ORM for permanent data storage
- Role-based access control on frontend
- Property search and filtering
- Inquiry messaging system

## Database
The application uses PostgreSQL (Neon) for data persistence. Tables:
- `users` - User accounts with roles
- `properties` - Property listings
- `inquiries` - Buyer inquiries to sellers
- `favorites` - User saved properties

To reseed the database: `npx tsx server/seed.ts`

## Mobile App (mobile/)

A complete React Native mobile app built with Expo that connects to the same backend API.

### Features
- Passwordless OTP authentication
- Property browsing with search and filters
- Favorites (buyers)
- Inquiry messaging
- My Listings (sellers/agents)
- User profile management
- Light/dark mode support

### Running the Mobile App
```bash
cd mobile
npm install
npm start
```

### Building for Production
```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android

# Build for iOS  
eas build --platform ios
```

### App Store Requirements
- iOS: Apple Developer account ($99/year)
- Android: Google Play Developer account ($25 one-time)

### API Configuration
The app connects to `https://property.lelekart.com`. To change, edit `mobile/lib/api.ts`.

## Known Limitations
- Client-side authentication (no server sessions for MVP)
- Images use placeholder URLs from Unsplash

## Railway Deployment

To deploy to Railway:

1. **Add PostgreSQL database** - Railway will create DATABASE_URL automatically
2. **Set environment variables**:
   - `SESSION_SECRET` - Random session string
   - `SMTP_HOST` - Email SMTP host (e.g., smtp.gmail.com)
   - `SMTP_PORT` - Usually 587
   - `SMTP_USER` - Email username
   - `SMTP_PASS` - Email password/app password
3. **Build command**: `npm run build` (automatically pushes DB schema)
4. **Start command**: `npm run start`
