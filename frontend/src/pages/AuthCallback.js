import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { processGoogleSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        try {
          const user = await processGoogleSession(sessionId);
          // Navigate to dashboard with user data to skip auth check
          navigate('/dashboard', { replace: true, state: { user } });
        } catch (error) {
          console.error('Error processing Google session:', error);
          navigate('/login', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [location.hash, navigate, processGoogleSession]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#0052CC] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-[#64748B]">Signing you in...</p>
      </div>
    </div>
  );
}
