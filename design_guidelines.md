# Real Estate Platform Design Guidelines

## Design Approach

**Reference-Based Strategy**: Drawing from Airbnb (property browsing), Zillow (real estate UX patterns), and Linear (dashboard workflows). This combines visual appeal for property showcases with professional utility for transactions.

**Development Priority**: Web application first (comprehensive admin/agent tools), then responsive mobile views, finally native mobile app enhancements.

## Core Features by User Type

**Buyers**: Advanced property search/filters, saved searches, favorites, comparison tools, virtual tour viewing, inquiry messaging, offer submission, document uploads

**Sellers**: Property listing creation (multi-step form), photo/video uploads, pricing tools, analytics dashboard, lead management, document signing

**Agents**: Multi-property management, client CRM, commission tracking, bulk listing operations, calendar/showing scheduler, performance analytics, team collaboration

**Admin**: User verification/management, listing approval workflows, payment processing, dispute resolution, analytics dashboard, content moderation, system configuration

## Typography System

**Families**: Inter (UI/body), Plus Jakarta Sans (headings)

**Scale**:
- Hero: text-5xl to text-7xl, font-bold
- H1: text-4xl, font-bold
- H2: text-3xl, font-semibold
- H3: text-2xl, font-semibold
- Body: text-base, font-normal
- Caption: text-sm, text-gray-600

## Layout & Spacing

**Spacing Units**: Standardize on 4, 6, 8, 12, 16, 24 for all padding/margins (p-4, gap-8, my-12, etc.)

**Grid Systems**:
- Property cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboards: 12-column grid for complex layouts
- Mobile: Always single-column stacked

**Container Widths**: max-w-7xl for main content, max-w-4xl for forms, full-width for property galleries

## Component Library

**Navigation**:
- Sticky header with mega-menu for property types
- User role-specific navigation items
- Mobile: Hamburger menu with full-screen overlay
- Quick actions: Search bar always visible

**Property Cards**:
- Large image gallery (carousel on hover)
- Price, location, key specs overlay
- Save/favorite heart icon
- Agent contact quick action
- Verified badge for authenticated listings

**Search & Filters**:
- Persistent filter sidebar (desktop) / bottom sheet (mobile)
- Map view toggle
- Save search functionality
- Advanced filters: collapsible accordion sections
- Active filter chips with clear-all option

**Forms**:
- Multi-step wizard for property listing (6-8 steps)
- Drag-and-drop image upload with preview grid
- Auto-save drafts
- Inline validation with helpful error messages
- Progress indicator for multi-step flows

**Dashboards**:
- Card-based metrics with trend indicators
- Data tables with sorting, filtering, pagination
- Chart visualizations (property performance, market trends)
- Activity feeds for recent actions

**Messaging**:
- Chat interface: Buyer-Seller/Agent communication
- Thread list + message pane layout
- Quick replies, document sharing
- Real-time indicators

**Modals & Overlays**:
- Property detail: Full-screen modal with image gallery
- Virtual tours: Immersive viewer overlay
- Document signing: Step-through modal
- Confirmation dialogs: Center-aligned, 500px max-width

## Images & Media

**Hero Section**: Full-width hero with high-quality property photography showcasing featured listings. Rotating carousel of 3-5 hero properties. CTA buttons with backdrop-blur-md background.

**Property Images**:
- Listing cards: 16:9 aspect ratio thumbnails
- Detail pages: Full-screen gallery with lightbox
- Multiple angles: exterior, interior, amenities
- Professional photography required for verified listings

**Supporting Visuals**:
- Agent profile photos (circular avatars, 48px-96px)
- Trust badges (verified seller, featured agent)
- Map integration (embedded Google Maps/Mapbox)
- Placeholder images for listings without photos

**Image Descriptions**:
1. **Hero**: Luxurious modern home exterior at golden hour, wide-angle architectural photography
2. **Feature Section**: Split-screen showing mobile app interface on left, happy family in new home on right
3. **Agent Section**: Professional headshots in consistent circular frames
4. **Testimonials**: Authentic customer photos with their new properties

## Mobile-Specific Patterns

**Bottom Navigation**: Fixed tab bar for primary actions (Search, Saved, Messages, Profile)

**Swipe Gestures**: Card swipe for favorites/pass on properties, gallery swipe for images

**Touch Targets**: Minimum 44px height for all interactive elements

**Map View**: Fullscreen with overlay cards, cluster pins for multiple properties

## Accessibility Standards

- WCAG 2.1 AA compliance throughout
- Keyboard navigation for all interactions
- Screen reader labels for icons and images
- Focus indicators visible and consistent (ring-2 ring-offset-2)
- Form labels always visible (no placeholder-only fields)

## Animation Strategy

**Minimal & Purposeful**:
- Page transitions: Subtle fade (150ms)
- Card interactions: Gentle scale on hover (scale-105)
- Image loading: Skeleton screens, smooth fade-in
- No parallax, no scroll-triggered animations
- Modal entrance: Fade + slight scale

## Responsive Breakpoints

- Mobile: < 768px (single column, stacked layout)
- Tablet: 768px-1024px (2-column grids, condensed filters)
- Desktop: > 1024px (3-column grids, sidebar filters, expanded dashboards)

## Key UX Principles

1. **Progressive Disclosure**: Hide complexity behind clear actions (Advanced Filters, Show More Details)
2. **Immediate Feedback**: Loading states, success confirmations, error handling
3. **Trust Building**: Verification badges, agent credentials, secure payment indicators
4. **Efficiency**: Saved searches, bulk actions for agents, keyboard shortcuts for power users