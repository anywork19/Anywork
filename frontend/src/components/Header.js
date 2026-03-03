import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, MessageCircle, Briefcase, Settings, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-header">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo">
            <span className="text-2xl font-bold text-[#0052CC]">AnyWork</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/browse"
              data-testid="nav-browse"
              className={`text-sm font-medium transition-colors ${
                isActive('/browse') ? 'text-[#0052CC]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Browse Helpers
            </Link>
            <Link
              to="/post-job"
              data-testid="nav-post-job"
              className={`text-sm font-medium transition-colors ${
                isActive('/post-job') ? 'text-[#0052CC]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Post a Job
            </Link>
            <Link
              to="/become-helper"
              data-testid="nav-become-helper"
              className={`text-sm font-medium transition-colors ${
                isActive('/become-helper') ? 'text-[#0052CC]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Become a Helper
            </Link>
            <Link
              to="/trust-safety"
              data-testid="nav-trust"
              className={`text-sm font-medium transition-colors ${
                isActive('/trust-safety') ? 'text-[#0052CC]' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Trust & Safety
            </Link>
          </nav>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                
                <Link to="/messages" data-testid="nav-messages">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageCircle className="h-5 w-5 text-[#64748B]" />
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu">
                      <div className="w-8 h-8 rounded-full bg-[#0052CC] flex items-center justify-center">
                        {user?.picture ? (
                          <img src={user.picture} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {user?.name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-[#0F172A]">{user?.name?.split(' ')[0]}</span>
                      <ChevronDown className="h-4 w-4 text-[#64748B]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-[#0F172A]">{user?.name}</p>
                      <p className="text-xs text-[#64748B]">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/bookings')} data-testid="menu-bookings">
                      <Briefcase className="h-4 w-4 mr-2" />
                      My Bookings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/messages')} data-testid="menu-messages">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')} data-testid="menu-settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="menu-logout">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" data-testid="nav-login">Log in</Button>
                </Link>
                <Link to="/login">
                  <Button className="bg-[#0052CC] hover:bg-[#0043A6] rounded-full" data-testid="nav-signup">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-[#0F172A]" />
            ) : (
              <Menu className="h-6 w-6 text-[#0F172A]" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 animate-fade-in">
            <nav className="flex flex-col gap-4">
              <Link
                to="/browse"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#0F172A] font-medium py-2"
              >
                Browse Helpers
              </Link>
              <Link
                to="/post-job"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#0F172A] font-medium py-2"
              >
                Post a Job
              </Link>
              <Link
                to="/become-helper"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#0F172A] font-medium py-2"
              >
                Become a Helper
              </Link>
              <Link
                to="/trust-safety"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#0F172A] font-medium py-2"
              >
                Trust & Safety
              </Link>
              
              <div className="pt-4 border-t border-slate-100">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <Link
                      to="/messages"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-[#0F172A] font-medium py-2"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Messages
                    </Link>
                    <Link
                      to="/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-[#0F172A] font-medium py-2"
                    >
                      <Briefcase className="h-5 w-5" />
                      My Bookings
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-red-600 font-medium py-2"
                    >
                      <LogOut className="h-5 w-5" />
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">Log in</Button>
                    </Link>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-[#0052CC] hover:bg-[#0043A6]">Sign up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
