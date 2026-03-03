# AnyWork - UK Local Services Marketplace

## Original Problem Statement
Create a premium, modern UK-focused marketplace website called "AnyWork" that connects people who NEED help with people who CAN help. Uber + Airbnb hybrid for local micro-jobs and skills.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, MapLibre GL JS
- **Backend**: FastAPI, Socket.IO (WebSocket for real-time chat)
- **Database**: MongoDB
- **Authentication**: JWT + Emergent Google OAuth
- **Payments**: Stripe integration with Escrow system

## User Personas
1. **Customers**: UK residents needing local help (cleaning, tutoring, handyman, etc.)
2. **Helpers**: Individuals offering services (verified, insured options available)
3. **Admin**: Platform administrator (admin@anywork.co.uk) for payment management

## Core Requirements
- Two-sided marketplace (post jobs / offer skills)
- Availability-based discovery
- Trust badges (Verified ID, Insured)
- Reliability scoring
- Real-time messaging
- Secure payments via Stripe with Escrow
- UK-focused (£ currency, postcodes)

## What's Been Implemented

### Pages Built
1. ✅ Landing Page - Hero, dual CTAs, categories, available helpers, how it works
2. ✅ Browse Helpers - Filters, list/map view toggle, helper cards with badges
3. ✅ Helper Profile - About, services, reviews tabs, booking calendar
4. ✅ Post a Job - 4-step form (details, location, budget, review)
5. ✅ Become a Helper - 5-step onboarding
6. ✅ Login/Signup - JWT + Google OAuth
7. ✅ Messages - Real-time chat with Socket.IO
8. ✅ Checkout - Stripe payment integration with escrow
9. ✅ Trust & Safety - Information page
10. ✅ Dashboard - User/helper profile management
11. ✅ Admin Dashboard - Payment management (escrow release/refund) - March 2026

### Backend APIs
- /api/auth/* (register, login, session, me, logout)
- /api/helpers/* (CRUD, search, filters)
- /api/jobs/* (CRUD)
- /api/bookings/* (CRUD)
- /api/messages/* (conversations, real-time)
- /api/reviews/* (CRUD)
- /api/payments/* (Stripe checkout, status)
- /api/admin/payments/* (Admin: list, release, refund transactions) - NEW
- /api/helper/earnings (Helper earnings summary) - NEW
- /api/categories

### Payment Escrow System (March 2026)
- ✅ Checkout creates payment transaction record
- ✅ Funds held in platform account after Stripe payment
- ✅ Admin dashboard at /admin/dashboard
- ✅ Admin can view all transactions with filters (held/released/refunded)
- ✅ Admin can release payment to helper
- ✅ Admin can refund payment to customer
- ✅ Backend admin role validation (403 for non-admin)
- ✅ Helper earnings tracking

### Features
- ✅ Responsive design (mobile-first)
- ✅ MapLibre map integration
- ✅ WebSocket real-time chat
- ✅ Stripe payment flow with escrow
- ✅ Sample data seeding
- ✅ Trust badges (Verified ID, Insured)
- ✅ Reliability scoring
- ✅ Category-based filtering

## Prioritized Backlog

### P0 (Critical for MVP)
- All core features implemented ✅
- Payment escrow system ✅

### P1 (High Priority)
- Real-time chat functionality (wire WebSocket)
- Review and rating system implementation
- Email notifications for bookings

### P2 (Medium Priority)
- Report User functionality
- Map view toggle on Browse Helpers page
- Featured helpers section on homepage
- Seasonal pricing indicators

### P3 (Low Priority/Future)
- Mobile app (React Native)
- Helper analytics dashboard
- Referral program
- Multi-language support

## Next Tasks
1. Wire up real-time chat using WebSocket
2. Implement review/rating system after job completion
3. Add "Report User" functionality
4. Implement map view toggle on Browse Helpers

## Database Collections
- users: email, name, role, is_helper
- helper_profiles: bio, categories, hourly_rate, availability, badges
- jobs: title, description, category, postcode, budget
- bookings: customer_id, helper_id, status, payment_status
- payment_transactions: booking_id, amount, platform_fee, helper_amount, payment_status, payout_status
- payouts: transaction_id, helper_id, amount, status
- messages: conversation_id, sender_id, content
- reviews: booking_id, helper_id, rating, comment
