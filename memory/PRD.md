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
3. ✅ Helper Profile - About, services, reviews tabs, booking calendar, Report User
4. ✅ Post a Job - 4-step form (details, location, budget, review)
5. ✅ Become a Helper - 5-step onboarding
6. ✅ Login/Signup - JWT + Google OAuth
7. ✅ Messages - Real-time chat with Socket.IO (fully wired)
8. ✅ Checkout - Stripe payment integration with escrow
9. ✅ Trust & Safety - Information page
10. ✅ Dashboard - User/helper profile management with Leave Review for completed bookings
11. ✅ Admin Dashboard - Payment management (escrow release/refund)

### Backend APIs
- /api/auth/* (register, login, session, me, logout)
- /api/helpers/* (CRUD, search, filters)
- /api/jobs/* (CRUD)
- /api/bookings/* (CRUD)
- /api/messages/* (conversations, real-time)
- /api/reviews/* (CRUD, create review, get helper reviews)
- /api/reports/* (Report user functionality)
- /api/payments/* (Stripe checkout, status)
- /api/admin/payments/* (Admin: list, release, refund transactions)
- /api/admin/reports (Admin: view all user reports)
- /api/helper/earnings (Helper earnings summary)
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

### New Features (March 2026)
- ✅ **Real-time Chat**: Socket.IO wired to frontend with room-based messaging
- ✅ **Review System**: Star ratings + comments, auto-updates helper rating average
- ✅ **Report User**: 7 report reasons (inappropriate, fraud, harassment, fake profile, no show, poor service, other)
- ✅ **Map View Toggle**: MapLibre map with helper location markers showing prices
- ✅ **Email Notifications** (MOCKED): Booking confirmations, new booking alerts, payment released emails - ready for Resend API
- ✅ **Push Notifications**: In-app notification bell with dropdown, unread count badge
- ✅ **Featured Helpers**: Top-rated helpers section on homepage with gold star badges
- ✅ **Seasonal Pricing**: "In demand this month" section showing high-demand services with % indicators

### Features
- ✅ Responsive design (mobile-first)
- ✅ MapLibre map integration with List/Map view toggle
- ✅ WebSocket real-time chat (fully functional)
- ✅ Stripe payment flow with escrow
- ✅ Sample data seeding
- ✅ Trust badges (Verified ID, Insured)
- ✅ Reliability scoring
- ✅ Category-based filtering
- ✅ Report User dialog with 7 reasons
- ✅ Review/Rating system for completed bookings

## Prioritized Backlog

### P0 (Critical for MVP)
- All core features implemented ✅
- Payment escrow system ✅
- Real-time chat ✅
- Review/rating system ✅
- Report User functionality ✅
- Map view toggle ✅
- Email notifications ✅ (MOCKED - ready for Resend API key)
- Push notifications ✅
- Featured helpers ✅
- Seasonal pricing ✅

### P1 (High Priority)
- Enable real email sending (add Resend API key)
- Helper verification document upload flow
- Booking calendar sync

### P2 (Medium Priority)
- Advanced availability calendar management
- Customer booking history
- Helper analytics dashboard

### P3 (Low Priority/Future)
- Mobile app (React Native)
- Helper analytics dashboard
- Referral program
- Multi-language support

## Database Collections
- users: email, name, role, is_helper
- helper_profiles: bio, categories, hourly_rate, availability, badges
- jobs: title, description, category, postcode, budget
- bookings: customer_id, helper_id, status, payment_status
- payment_transactions: booking_id, amount, platform_fee, helper_amount, payment_status, payout_status
- payouts: transaction_id, helper_id, amount, status
- messages: conversation_id, sender_id, content
- reviews: booking_id, helper_id, rating, comment
- reports: reporter_id, reported_user_id, reason, details, status

## Test Credentials
- Customer: testcustomer@test.com / Test123!
- Admin: admin@anywork.co.uk / Admin123!
