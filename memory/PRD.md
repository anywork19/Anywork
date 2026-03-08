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

## Admin Panel (NEW)

### Access
- **URL**: `/admin`
- **Credentials**: `nabeel.ucp@gmail.com` / `sana7860`
- **Backup Admin**: `admin@anywork.co.uk` / `Admin123!`

### Features
1. **Dashboard**
   - Total users, jobs, bookings stats
   - Active & completed jobs
   - Helpers count, verified users count
   - Pending verifications & reports
   - Last 7 days chart (users/jobs per day)
   - Recent activity feed

2. **User Management**
   - View all registered users
   - Search by name/email
   - Filter: All / Helpers / Customers / Verified / Suspended
   - View user details (jobs, bookings)
   - Suspend/Activate users

3. **Job Management**
   - View all posted jobs
   - Search by title/description
   - Filter: All / Open / Active / Closed / Removed
   - View job details with applications
   - Remove inappropriate jobs

4. **Bookings**
   - View all bookings
   - Filter by status: Pending / Confirmed / In Progress / Completed / Declined
   - Track customer-helper connections

5. **Verifications**
   - Review ID verification requests
   - View ID photo, selfie, AI result
   - Approve or reject with reason

6. **Reports**
   - View user reports
   - See reason, details, reported user info

## User Personas
1. **Customers**: UK residents needing local help
2. **Helpers**: Individuals offering services (verified, insured)
3. **Admin**: Platform administrator for moderation

## Core Requirements
- Two-sided marketplace
- Availability-based discovery
- Trust badges (Verified ID, Insured)
- Real-time messaging (Socket.IO)
- AI-powered ID Verification
- UK-focused (£ currency, postcodes)

## What's Been Implemented

### Pages Built
1. ✅ Landing Page
2. ✅ Browse Helpers
3. ✅ Helper Profile
4. ✅ Post a Job
5. ✅ Become a Helper
6. ✅ Login/Signup (with integrated ID verification)
7. ✅ Messages (real-time chat)
8. ✅ Booking Request
9. ✅ Trust & Safety
10. ✅ Dashboard
11. ✅ Admin Panel (NEW - comprehensive admin dashboard)
12. ✅ Verify Identity
13. ✅ Legal Pages

### Backend APIs
- /api/auth/* (register, login, session, me, logout)
- /api/helpers/* (CRUD, search, filters, featured)
- /api/jobs/* (CRUD)
- /api/bookings/* (CRUD, helper bookings, status update)
- /api/messages/* (conversations, real-time via Socket.IO)
- /api/reviews/* (CRUD)
- /api/reports/* (Report user)
- /api/verification/* (submit with AI, status)
- /api/admin/dashboard/* (stats, activity, charts)
- /api/admin/users/* (list, detail, status update)
- /api/admin/jobs/* (list, detail, status update, delete)
- /api/admin/bookings (list with enriched data)
- /api/admin/verifications/* (list, detail, approve/reject)
- /api/admin/reports (list)
- /api/notifications/*
- /api/categories

### Integrated Signup + ID Verification (AI-Powered)
1. Form: name, email, phone, password
2. ID Type: passport, driving license, national ID
3. Upload ID (front required, back optional)
4. Take selfie
5. AI verifies face match (GPT-5.2 vision)
   - Auto-approve: ≥80% confidence match
   - Auto-reject: ≥70% confidence NO match
   - Manual review: uncertain cases

### Real-time Chat (Vinted-style)
- Socket.IO room-based messaging
- Conversation creation from helper profile
- Users discuss payment directly

## Database Collections
- users: email, name, role, is_helper, verification_status, is_verified, is_suspended
- helper_profiles: bio, categories, hourly_rate, availability, badges
- jobs: title, description, category, postcode, budget, status
- bookings: customer_id, helper_id, status, preferred_payment
- verifications: user_id, id_type, id_front, id_back, selfie, status, ai_verification
- messages: conversation_id, sender_id, content
- conversations: participants, booking_id
- reviews: booking_id, helper_id, rating, comment
- reports: reporter_id, reported_user_id, reason, details, status
- notifications: user_id, type, title, message, read

## Prioritized Backlog

### P0 (Critical for MVP) - COMPLETED
- ✅ Core marketplace features
- ✅ Real-time chat
- ✅ AI-powered ID verification
- ✅ Admin Panel with full management capabilities
- ✅ Review/rating system
- ✅ Report User functionality

### P1 (High Priority)
- Enable real email sending (Resend API - currently MOCKED)
- Display verification badge prominently on helper profiles

### P2 (Medium Priority)
- Implement "Reliability Score"
- Advanced availability calendar
- Customer booking history
- Helper analytics dashboard

### P3 (Low Priority/Future)
- Mobile app (React Native)
- Referral program
- Multi-language support

## Test Credentials
- Primary Admin: `nabeel.ucp@gmail.com` / `sana7860`
- Secondary Admin: `admin@anywork.co.uk` / `Admin123!`
- Customer: `testcustomer@test.com` / `Test123!`

## Technical Notes
- Email service is MOCKED
- Payment processing removed - direct payment model
- Socket.IO path: /api/socket.io
- AI Face Verification: EMERGENT_LLM_KEY + GPT-5.2
- Admin access: role='admin' or email in ADMIN_EMAILS list
