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
- In-memory storage for MVP phase
- Role-based access control on frontend
- Property search and filtering
- Inquiry messaging system

## Known Limitations
- No persistent database (using in-memory storage)
- Client-side authentication (no server sessions for MVP)
- Images use placeholder URLs from Unsplash
