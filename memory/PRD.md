# AnyWork - UK Local Services Marketplace

## Original Problem Statement
Create a premium, modern UK-focused marketplace website called "AnyWork" that connects people who NEED help with people who CAN help. Uber + Airbnb hybrid for local micro-jobs and skills.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, MapLibre GL JS
- **Backend**: FastAPI, Socket.IO (WebSocket for real-time chat)
- **Database**: MongoDB
- **Authentication**: JWT + Emergent Google OAuth
- **Payments**: Stripe integration

## User Personas
1. **Customers**: UK residents needing local help (cleaning, tutoring, handyman, etc.)
2. **Helpers**: Individuals offering services (verified, insured options available)

## Core Requirements
- Two-sided marketplace (post jobs / offer skills)
- Availability-based discovery
- Trust badges (Verified ID, Insured)
- Reliability scoring
- Real-time messaging
- Secure payments via Stripe
- UK-focused (£ currency, postcodes)

## What's Been Implemented (January 2025)

### Pages Built
1. ✅ Landing Page - Hero, dual CTAs, categories, available helpers, how it works
2. ✅ Browse Helpers - Filters, list/map view toggle, helper cards with badges
3. ✅ Helper Profile - About, services, reviews tabs, booking calendar
4. ✅ Post a Job - 4-step form (details, location, budget, review)
5. ✅ Become a Helper - 5-step onboarding
6. ✅ Login/Signup - JWT + Google OAuth
7. ✅ Messages - Real-time chat with Socket.IO
8. ✅ Checkout - Stripe payment integration
9. ✅ Trust & Safety - Information page
10. ✅ Dashboard - User/helper profile management

### Backend APIs
- /api/auth/* (register, login, session, me, logout)
- /api/helpers/* (CRUD, search, filters)
- /api/jobs/* (CRUD)
- /api/bookings/* (CRUD)
- /api/messages/* (conversations, real-time)
- /api/reviews/* (CRUD)
- /api/payments/* (Stripe checkout, status)
- /api/categories

### Features
- ✅ Responsive design (mobile-first)
- ✅ MapLibre map integration
- ✅ WebSocket real-time chat
- ✅ Stripe payment flow
- ✅ Sample data seeding
- ✅ Trust badges (Verified ID, Insured)
- ✅ Reliability scoring
- ✅ Category-based filtering

## Prioritized Backlog

### P0 (Critical for MVP)
- All core features implemented ✅

### P1 (High Priority)
- Email notifications for bookings
- Push notifications
- ID verification upload flow
- Insurance document upload

### P2 (Medium Priority)
- Advanced availability calendar management
- Booking calendar sync
- Payment history
- Review responses

### P3 (Low Priority/Future)
- Mobile app (React Native)
- Helper analytics dashboard
- Referral program
- Multi-language support

## Next Tasks
1. Implement email notifications (SendGrid/Resend)
2. Add ID verification document upload
3. Build notification system
4. Add payment history page
5. Implement review response feature
