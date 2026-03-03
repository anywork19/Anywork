import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, CheckCircle, Shield, Clock, ArrowRight, ChevronRight, Home, Car, User, Briefcase, Monitor, PartyPopper, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

// Main Categories with Icons
const MAIN_CATEGORIES = [
  { 
    id: 'home-services', 
    name: 'Home Services', 
    icon: Home, 
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    description: 'Repairs, cleaning & maintenance'
  },
  { 
    id: 'vehicle-services', 
    name: 'Vehicle Services', 
    icon: Car, 
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    description: 'Mechanics, servicing & care'
  },
  { 
    id: 'personal-services', 
    name: 'Personal Services', 
    icon: User, 
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    description: 'Tutoring, care & assistance'
  },
  { 
    id: 'business-support', 
    name: 'Business Support', 
    icon: Briefcase, 
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    description: 'Staffing & admin help'
  },
  { 
    id: 'digital-services', 
    name: 'Digital Services', 
    icon: Monitor, 
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    description: 'Design, writing & tech'
  },
  { 
    id: 'events-staffing', 
    name: 'Events & Staffing', 
    icon: PartyPopper, 
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    description: 'Event staff & services'
  },
];

// Subcategories for each main category
const SUBCATEGORIES = {
  'home-services': [
    { id: 'handyman', name: 'Handyman', icon: '🔧' },
    { id: 'plumbing', name: 'Plumbing', icon: '🚿' },
    { id: 'electrical', name: 'Electrical Work', icon: '⚡' },
    { id: 'painting', name: 'Painting & Decorating', icon: '🎨' },
    { id: 'cleaning', name: 'Cleaning', icon: '✨' },
    { id: 'gardening', name: 'Gardening', icon: '🌱' },
    { id: 'moving', name: 'Moving Help', icon: '📦' },
    { id: 'furniture-assembly', name: 'Furniture Assembly', icon: '🪑' },
    { id: 'pressure-washing', name: 'Pressure Washing', icon: '💦' },
    { id: 'gutter-cleaning', name: 'Gutter Cleaning', icon: '🏠' },
  ],
  'vehicle-services': [
    { id: 'mobile-mechanic', name: 'Mobile Mechanic', icon: '🔧' },
    { id: 'car-servicing', name: 'Car Servicing', icon: '🚗' },
    { id: 'brake-replacement', name: 'Brake & Pad Replacement', icon: '🛑' },
    { id: 'car-diagnostics', name: 'Car Diagnostics', icon: '🔍' },
    { id: 'battery-replacement', name: 'Battery Replacement', icon: '🔋' },
    { id: 'tyre-fitting', name: 'Tyre Fitting (Mobile)', icon: '🛞' },
    { id: 'jump-start', name: 'Jump Start', icon: '⚡' },
    { id: 'car-wash', name: 'Car Wash at Home', icon: '🧽' },
    { id: 'driving-cover', name: 'Driving Cover', icon: '🚙' },
  ],
  'personal-services': [
    { id: 'tutoring', name: 'Tutoring', icon: '📚' },
    { id: 'childcare', name: 'Childcare', icon: '👶' },
    { id: 'eldercare', name: 'Elder Care', icon: '❤️' },
    { id: 'pets', name: 'Pets', icon: '🐕' },
    { id: 'personal-assistant', name: 'Personal Assistant', icon: '📋' },
    { id: 'grocery-pickup', name: 'Grocery Pickup', icon: '🛒' },
    { id: 'parcel-collection', name: 'Parcel Collection', icon: '📬' },
    { id: 'home-help', name: 'Home Help', icon: '🏡' },
  ],
  'business-support': [
    { id: 'temporary-staff', name: 'Temporary Staff', icon: '👥' },
    { id: 'retail-staff', name: 'Retail Staff Cover', icon: '🏪' },
    { id: 'warehouse-support', name: 'Warehouse Support', icon: '📦' },
    { id: 'delivery-drivers', name: 'Delivery Drivers', icon: '🚚' },
    { id: 'admin-support', name: 'Admin Support', icon: '💼' },
    { id: 'event-setup', name: 'Event Setup Crew', icon: '🎪' },
    { id: 'labourers', name: 'Labourers', icon: '👷' },
  ],
  'digital-services': [
    { id: 'graphic-design', name: 'Graphic Design', icon: '🎨' },
    { id: 'video-editing', name: 'Video Editing', icon: '🎬' },
    { id: 'cv-writing', name: 'CV Writing', icon: '📝' },
    { id: 'website-setup', name: 'Website Setup', icon: '🌐' },
    { id: 'social-media', name: 'Social Media Management', icon: '📱' },
    { id: 'data-entry', name: 'Data Entry', icon: '⌨️' },
    { id: 'translation', name: 'Translation', icon: '🌍' },
  ],
  'events-staffing': [
    { id: 'event-staff', name: 'Event Staff', icon: '🎉' },
    { id: 'waiters', name: 'Waiters', icon: '🍽️' },
    { id: 'bartenders', name: 'Bartenders', icon: '🍸' },
    { id: 'security', name: 'Security', icon: '🛡️' },
    { id: 'dj-services', name: 'DJ Services', icon: '🎧' },
    { id: 'photographer', name: 'Photographer', icon: '📸' },
    { id: 'videographer', name: 'Videographer', icon: '🎥' },
    { id: 'decoration-setup', name: 'Decoration Setup', icon: '🎈' },
  ],
};

const SAMPLE_HELPERS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    category: 'Cleaning',
    rating: 4.9,
    reviews: 47,
    reliability: 98,
    hourlyRate: 15,
    verified: true,
    insured: true,
    nextAvailable: 'Today, 2pm',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  },
  {
    id: '2',
    name: 'James Williams',
    category: 'Handyman',
    rating: 4.8,
    reviews: 89,
    reliability: 99,
    hourlyRate: 25,
    verified: true,
    insured: true,
    nextAvailable: 'Today, 3pm',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  {
    id: '3',
    name: 'Dr. Emily Chen',
    category: 'Tutoring',
    rating: 5.0,
    reviews: 23,
    reliability: 100,
    hourlyRate: 35,
    verified: true,
    insured: false,
    nextAvailable: 'Tomorrow, 4pm',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  },
  {
    id: '4',
    name: 'Mike Thompson',
    category: 'Mobile Mechanic',
    rating: 4.7,
    reviews: 156,
    reliability: 96,
    hourlyRate: 40,
    verified: true,
    insured: true,
    nextAvailable: 'Today, 5pm',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
  }
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Choose a service',
    description: 'Browse categories or search for what you need help with.',
  },
  {
    step: 2,
    title: 'Get matched',
    description: 'View verified local helpers with ratings and availability.',
  },
  {
    step: 3,
    title: 'Book with confidence',
    description: 'Pay securely and get the job done by trusted professionals.',
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [postcode, setPostcode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(searchQuery)}&postcode=${encodeURIComponent(postcode)}`);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setCategoryModalOpen(true);
  };

  const handleSubcategoryClick = (subcategory) => {
    setCategoryModalOpen(false);
    navigate(`/browse?category=${subcategory.id}&postcode=${encodeURIComponent(postcode)}`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Hero Section - Simplified & Mobile First */}
      <section className="bg-white">
        <div className="container-app py-8 lg:py-16">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] leading-tight mb-4">
              Get things done,<br />
              <span className="text-[#0052CC]">locally.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] mb-6">
              Find trusted local helpers for any task in the UK
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="What do you need help with?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-slate-200 text-base w-full"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                  <Input
                    data-testid="postcode-input"
                    type="text"
                    placeholder="Enter postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-slate-200 text-base"
                  />
                </div>
                <Button
                  data-testid="search-btn"
                  type="submit"
                  className="h-14 px-6 bg-[#0052CC] hover:bg-[#0043A6] rounded-2xl"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-[#64748B]">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#10B981]" />
              <span>Verified helpers</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#0052CC]" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F59E0B]" />
              <span>Rated & reviewed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Categories Section */}
      <section className="py-10 sm:py-16">
        <div className="container-app">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2">What do you need?</h2>
            <p className="text-[#64748B]">Choose a category to get started</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {MAIN_CATEGORIES.map((category) => (
              <button
                key={category.id}
                data-testid={`category-${category.id}`}
                onClick={() => handleCategoryClick(category)}
                className="card-base p-5 sm:p-6 text-left group hover:border-[#0052CC] transition-all duration-200"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${category.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <category.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <h3 className="font-semibold text-[#0F172A] text-sm sm:text-base mb-1">{category.name}</h3>
                <p className="text-xs sm:text-sm text-[#64748B] hidden sm:block">{category.description}</p>
                <ChevronRight className="h-4 w-4 text-[#94A3B8] mt-2 group-hover:text-[#0052CC] group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Modal - Subcategories */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b border-slate-100">
            {selectedCategory && (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${selectedCategory.color} flex items-center justify-center`}>
                  <selectedCategory.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-left">{selectedCategory.name}</DialogTitle>
                  <p className="text-sm text-[#64748B]">Select a service</p>
                </div>
              </div>
            )}
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 py-4">
            {selectedCategory && (
              <div className="grid grid-cols-2 gap-3">
                {SUBCATEGORIES[selectedCategory.id]?.map((sub) => (
                  <button
                    key={sub.id}
                    data-testid={`subcategory-${sub.id}`}
                    onClick={() => handleSubcategoryClick(sub)}
                    className={`p-4 rounded-xl border-2 border-slate-100 hover:border-[#0052CC] hover:bg-[#0052CC]/5 transition-all text-left group`}
                  >
                    <span className="text-2xl mb-2 block">{sub.icon}</span>
                    <span className="font-medium text-[#0F172A] text-sm block group-hover:text-[#0052CC]">
                      {sub.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Become a Worker CTA */}
          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/become-helper"
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div>
                <p className="font-medium text-[#0F172A]">Want to offer this service?</p>
                <p className="text-sm text-[#64748B]">Become a helper and start earning</p>
              </div>
              <ArrowRight className="h-5 w-5 text-[#0052CC]" />
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Available Now Section */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="container-app">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-1">Available now</h2>
              <p className="text-sm text-[#64748B]">Trusted helpers ready to assist</p>
            </div>
            <Link
              to="/browse"
              data-testid="view-all-helpers"
              className="hidden sm:flex items-center gap-1 text-[#0052CC] font-medium text-sm hover:underline"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SAMPLE_HELPERS.map((helper) => (
              <Link
                key={helper.id}
                to={`/helpers/${helper.id}`}
                data-testid={`helper-card-${helper.id}`}
                className="card-base card-interactive p-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={helper.image}
                    alt={helper.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-[#0F172A] text-sm truncate">{helper.name}</h3>
                      {helper.verified && (
                        <CheckCircle className="h-3.5 w-3.5 text-[#0052CC] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#64748B]">{helper.category}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3.5 w-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="font-medium text-xs">{helper.rating}</span>
                      <span className="text-xs text-[#94A3B8]">({helper.reviews})</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-[#10B981]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{helper.nextAvailable}</span>
                  </div>
                  <p className="font-semibold text-[#0F172A] text-sm">£{helper.hourlyRate}/hr</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              to="/browse"
              className="inline-flex items-center gap-1 text-[#0052CC] font-medium text-sm"
            >
              View all helpers <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-10 sm:py-16">
        <div className="container-app">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-2">How it works</h2>
            <p className="text-sm text-[#64748B]">Simple, fast, reliable</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#0052CC] text-white flex items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-[#0F172A] mb-2">{item.title}</h3>
                <p className="text-sm text-[#64748B]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="container-app">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-4">Built on trust</h2>
            <p className="text-[#64748B] mb-8">
              Every helper is verified. Every payment is secure. Every job is backed by our guarantee.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50">
                <CheckCircle className="h-6 w-6 text-[#0052CC] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#0F172A]">ID Verified</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50">
                <Shield className="h-6 w-6 text-[#10B981] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#0F172A]">Insured</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50">
                <Star className="h-6 w-6 text-[#F59E0B] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#0F172A]">Reviewed</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50">
                <Clock className="h-6 w-6 text-[#FF5A5F] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#0F172A]">Reliable</p>
              </div>
            </div>
            <Link
              to="/trust-safety"
              className="inline-flex items-center gap-1 text-[#0052CC] font-medium text-sm mt-6 hover:underline"
            >
              Learn more about Trust & Safety <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-16 bg-[#0052CC]">
        <div className="container-app text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Join thousands across the UK who use AnyWork to get things done or earn money helping others.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              data-testid="cta-post-job"
              onClick={() => navigate('/post-job')}
              className="bg-white text-[#0052CC] hover:bg-blue-50 rounded-full px-8 py-6 text-base font-semibold"
            >
              Post a job
            </Button>
            <Button
              data-testid="cta-become-helper"
              onClick={() => navigate('/become-helper')}
              variant="outline"
              className="border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-base font-semibold"
            >
              Become a helper
            </Button>
          </div>
        </div>
      </section>

      {/* Fixed Bottom CTA - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 sm:hidden z-40">
        <Button
          data-testid="fixed-post-job-btn"
          onClick={() => navigate('/post-job')}
          className="w-full h-12 bg-[#0052CC] hover:bg-[#0043A6] rounded-xl font-semibold"
        >
          Post a Job
        </Button>
      </div>

      {/* Spacer for fixed bottom CTA on mobile */}
      <div className="h-20 sm:hidden" />
    </div>
  );
}
