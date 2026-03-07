# AnyWork - UK Local Services Marketplace

## Original Problem Statement
Create a premium, modern UK-focused marketplace website called "AnyWork" that connects people who NEED help with people who CAN help. Uber + Airbnb hybrid for local micro-jobs and skills.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, MapLibre GL JS
- **Backend**: FastAPI, Socket.IO (WebSocket for real-time chat)
- **Database**: MongoDB
- **Authentication**: JWT + Emergent Google OAuth
- **Payments**: Direct payment model (no payment processing - like Vinted)
- **AI Integration**: GPT-5.2 vision via emergentintegrations (face verification)

## User Personas
1. **Customers**: UK residents needing local help (cleaning, tutoring, handyman, etc.)
2. **Helpers**: Individuals offering services (verified, insured options available)
3. **Admin**: Platform administrator (admin@anywork.co.uk) for verification management

## Core Requirements
- Two-sided marketplace (post jobs / offer skills)
- Availability-based discovery
- Trust badges (Verified ID, Insured)
- Real-time messaging (Socket.IO)
- AI-powered ID Verification with auto face matching
- UK-focused (£ currency, postcodes)

## What's Been Implemented

### Pages Built
1. ✅ Landing Page - Hero, dual CTAs, categories, featured helpers, how it works
2. ✅ Browse Helpers - Filters, list/map view toggle, helper cards with badges
3. ✅ Helper Profile - About, services, reviews tabs, booking calendar, Report User
4. ✅ Post a Job - 4-step form (details, location, budget, review)
5. ✅ Become a Helper - 5-step onboarding
6. ✅ Login/Signup - JWT + Google OAuth
7. ✅ Messages - Real-time chat with Socket.IO (fully wired, Vinted-style)
8. ✅ Booking Request - Request booking without payment, message exchange
9. ✅ Trust & Safety - Information page
10. ✅ Dashboard - User/helper profile management, booking management
11. ✅ Admin Dashboard - Verification management, reports management
12. ✅ Verify Identity - 3-step ID verification with AI face comparison
13. ✅ Legal Pages - Terms, Privacy, Cookies

### Backend APIs
- /api/auth/* (register, login, session, me, logout)
- /api/helpers/* (CRUD, search, filters, featured)
- /api/jobs/* (CRUD)
- /api/bookings/* (CRUD, helper bookings, status update)
- /api/messages/* (conversations, real-time via Socket.IO)
- /api/reviews/* (CRUD, create review, get helper reviews)
- /api/reports/* (Report user functionality)
- /api/verification/* (submit with AI face comparison, status)
- /api/admin/verifications/* (list, detail, approve/reject)
- /api/admin/reports (Admin: view all user reports)
- /api/notifications/* (list, read, read-all)
- /api/categories

### AI-Powered ID Verification System (March 2026 - COMPLETED & TESTED)
- ✅ Helper submits ID (passport/driving license/national ID) + selfie at /verify-identity
- ✅ **AI Face Comparison**: GPT-5.2 vision compares ID photo with selfie
- ✅ **Auto-Approve**: If AI confidence ≥80% match → instant verification
- ✅ **Auto-Reject**: If AI confidence ≥70% NO match → instant rejection with tips
- ✅ **Manual Review**: Uncertain cases flagged for admin review
- ✅ ai_verification field stores AI decision details (match, confidence, reason)
- ✅ Frontend shows appropriate result UI (verified/rejected/pending)
- ✅ Full end-to-end testing completed (10/10 backend tests passed)

### Real-time Chat System (Vinted-style - ALREADY IMPLEMENTED)
- ✅ Socket.IO server setup with room-based messaging
- ✅ Frontend MessagesPage with real-time updates
- ✅ Conversation creation from helper profile (Request Quote)
- ✅ Message to helper option in booking flow
- ✅ Users can discuss payment details directly

### Features
- ✅ Responsive design (mobile-first)
- ✅ MapLibre map integration with List/Map view toggle
- ✅ WebSocket real-time chat (fully functional)
- ✅ Sample data seeding
- ✅ Trust badges (Verified ID, Insured)
- ✅ Category-based filtering
- ✅ Report User dialog with 7 reasons
- ✅ Review/Rating system for completed bookings
- ✅ Featured helpers on homepage
- ✅ Seasonal pricing indicators
- ✅ In-app notifications

## Database Collections
- users: email, name, role, is_helper, verification_status, is_verified
- helper_profiles: bio, categories, hourly_rate, availability, badges
- jobs: title, description, category, postcode, budget
- bookings: customer_id, helper_id, status, preferred_payment
- verifications: user_id, id_type, id_front, id_back, selfie, status, ai_verification, rejection_reason
- messages: conversation_id, sender_id, content
- conversations: participants, booking_id
- reviews: booking_id, helper_id, rating, comment
- reports: reporter_id, reported_user_id, reason, details, status
- notifications: user_id, type, title, message, read

## Prioritized Backlog

### P0 (Critical for MVP) - COMPLETED
- ✅ Core marketplace features
- ✅ Real-time chat (Socket.IO)
- ✅ ID Verification system with AI face comparison
- ✅ Review/rating system
- ✅ Report User functionality
- ✅ Direct payment model (Vinted-style)

### P1 (High Priority)
- Enable real email sending (add Resend API key - currently MOCKED)
- Display verification badge prominently on helper profiles
- Booking calendar sync

### P2 (Medium Priority)
- Implement "Reliability Score" based on completed jobs
- Advanced availability calendar management
- Customer booking history
- Helper analytics dashboard

### P3 (Low Priority/Future)
- Mobile app (React Native)
- Referral program
- Multi-language support

## Test Credentials
- Customer: testcustomer@test.com / Test123!
- Admin: admin@anywork.co.uk / Admin123!

## Technical Notes
- Email service is MOCKED - logs to console with `[EMAIL MOCKED]` prefix
- Payment processing removed - direct payment model like Vinted
- Socket.IO path: /api/socket.io
- AI Face Verification: Uses EMERGENT_LLM_KEY with GPT-5.2 vision
- Auto-approve threshold: 80% confidence match
- Auto-reject threshold: 70% confidence NO match
