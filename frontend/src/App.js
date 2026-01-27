import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import BrowseHelpersPage from './pages/BrowseHelpersPage';
import HelperProfilePage from './pages/HelperProfilePage';
import PostJobPage from './pages/PostJobPage';
import BecomeHelperPage from './pages/BecomeHelperPage';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import MessagesPage from './pages/MessagesPage';
import CheckoutPage from './pages/CheckoutPage';
import TrustSafetyPage from './pages/TrustSafetyPage';
import JobPostedPage from './pages/JobPostedPage';
import ProfileLivePage from './pages/ProfileLivePage';
import DashboardPage from './pages/DashboardPage';
import api from './lib/api';

// AppRouter component to handle auth callback detection during render
function AppRouter() {
  const location = useLocation();
  
  // Check for session_id in URL fragment during render (not in useEffect)
  // This prevents race conditions with ProtectedRoute
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/browse" element={<BrowseHelpersPage />} />
          <Route path="/helpers/:helperId" element={<HelperProfilePage />} />
          <Route path="/post-job" element={<PostJobPage />} />
          <Route path="/become-helper" element={<BecomeHelperPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
          <Route path="/checkout/:helperId" element={<CheckoutPage />} />
          <Route path="/booking/:bookingId/success" element={<CheckoutPage />} />
          <Route path="/trust-safety" element={<TrustSafetyPage />} />
          <Route path="/job-posted" element={<JobPostedPage />} />
          <Route path="/profile-live" element={<ProfileLivePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookings" element={<DashboardPage />} />
          <Route path="/settings" element={<DashboardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#0052CC] mb-4">404</h1>
        <p className="text-xl text-[#64748B] mb-6">Page not found</p>
        <a href="/" className="btn-primary inline-block px-8 py-3 rounded-full bg-[#0052CC] text-white font-semibold hover:bg-[#0043A6] transition-colors">
          Go Home
        </a>
      </div>
    </div>
  );
}

function App() {
  // Seed sample data on app load (for demo purposes)
  useEffect(() => {
    const seedData = async () => {
      try {
        await api.seedData();
        console.log('Sample data seeded');
      } catch (error) {
        // Ignore errors - data might already exist
      }
    };
    seedData();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
