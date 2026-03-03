import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Star, CheckCircle, Shield, Clock, ArrowRight, ChevronRight, 
  Home, Car, User, Briefcase, Monitor, PartyPopper, X,
  Wrench, Droplet, Zap, Paintbrush, Sparkles, Flower2, Truck, Armchair, Droplets,
  CircleStop, Battery, Circle, PawPrint, ClipboardList, ShoppingCart, Package,
  Users, Store, Warehouse, FileText, Tent, HardHat,
  Palette, Film, Globe, Share2, Keyboard, Languages,
  UtensilsCrossed, Wine, ShieldCheck, Music, Camera, Video, GraduationCap, Baby, Heart, TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';

// Icon mapping for subcategories
const SUBCATEGORY_ICONS = {
  // Home Services
  'handyman': Wrench,
  'plumbing': Droplet,
  'electrical': Zap,
  'painting': Paintbrush,
  'cleaning': Sparkles,
  'gardening': Flower2,
  'moving': Truck,
  'furniture-assembly': Armchair,
  'pressure-washing': Droplets,
  'gutter-cleaning': Home,
  // Vehicle Services
  'mobile-mechanic': Wrench,
  'car-servicing': Car,
  'brake-replacement': CircleStop,
  'car-diagnostics': Search,
  'battery-replacement': Battery,
  'tyre-fitting': Circle,
  'jump-start': Zap,
  'car-wash': Droplet,
  'driving-cover': Car,
  // Personal Services
  'tutoring': GraduationCap,
  'childcare': Baby,
  'eldercare': Heart,
  'pets': PawPrint,
  'personal-assistant': ClipboardList,
  'grocery-pickup': ShoppingCart,
  'parcel-collection': Package,
  'home-help': Home,
  // Business Support
  'temporary-staff': Users,
  'retail-staff': Store,
  'warehouse-support': Warehouse,
  'delivery-drivers': Truck,
  'admin-support': FileText,
  'event-setup': Tent,
  'labourers': HardHat,
  // Digital Services
  'graphic-design': Palette,
  'video-editing': Film,
  'cv-writing': FileText,
  'website-setup': Globe,
  'social-media': Share2,
  'data-entry': Keyboard,
  'translation': Languages,
  // Events & Staffing
  'event-staff': Users,
  'waiters': UtensilsCrossed,
  'bartenders': Wine,
  'security': ShieldCheck,
  'dj-services': Music,
  'photographer': Camera,
  'videographer': Video,
  'decoration-setup': Sparkles,
};

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

// Subcategories for each main category with pricing guidance
const SUBCATEGORIES = {
  'home-services': [
    { id: 'handyman', name: 'Handyman', priceRange: '£25-45/hr' },
    { id: 'plumbing', name: 'Plumbing', priceRange: '£40-70/hr' },
    { id: 'electrical', name: 'Electrical Work', priceRange: '£45-75/hr' },
    { id: 'painting', name: 'Painting & Decorating', priceRange: '£20-35/hr' },
    { id: 'cleaning', name: 'Cleaning', priceRange: '£12-20/hr' },
    { id: 'gardening', name: 'Gardening', priceRange: '£15-30/hr' },
    { id: 'moving', name: 'Moving Help', priceRange: '£20-35/hr' },
    { id: 'furniture-assembly', name: 'Furniture Assembly', priceRange: '£25-40/hr' },
    { id: 'pressure-washing', name: 'Pressure Washing', priceRange: '£30-50/hr' },
    { id: 'gutter-cleaning', name: 'Gutter Cleaning', priceRange: '£80-150/job' },
  ],
  'vehicle-services': [
    { id: 'mobile-mechanic', name: 'Mobile Mechanic', priceRange: '£45-80/hr' },
    { id: 'car-servicing', name: 'Car Servicing', priceRange: '£100-250/service' },
    { id: 'brake-replacement', name: 'Brake & Pad Replacement', priceRange: '£120-300/job' },
    { id: 'car-diagnostics', name: 'Car Diagnostics', priceRange: '£40-80/check' },
    { id: 'battery-replacement', name: 'Battery Replacement', priceRange: '£80-180/job' },
    { id: 'tyre-fitting', name: 'Tyre Fitting (Mobile)', priceRange: '£20-40/tyre' },
    { id: 'jump-start', name: 'Jump Start', priceRange: '£40-70/callout' },
    { id: 'car-wash', name: 'Car Wash at Home', priceRange: '£20-60/wash' },
    { id: 'driving-cover', name: 'Driving Cover', priceRange: '£12-20/hr' },
  ],
  'personal-services': [
    { id: 'tutoring', name: 'Tutoring', priceRange: '£25-60/hr' },
    { id: 'childcare', name: 'Childcare', priceRange: '£10-18/hr' },
    { id: 'eldercare', name: 'Elder Care', priceRange: '£12-22/hr' },
    { id: 'pets', name: 'Pets', priceRange: '£10-20/hr' },
    { id: 'personal-assistant', name: 'Personal Assistant', priceRange: '£15-30/hr' },
    { id: 'grocery-pickup', name: 'Grocery Pickup', priceRange: '£10-20/trip' },
    { id: 'parcel-collection', name: 'Parcel Collection', priceRange: '£8-15/trip' },
    { id: 'home-help', name: 'Home Help', priceRange: '£12-20/hr' },
  ],
  'business-support': [
    { id: 'temporary-staff', name: 'Temporary Staff', priceRange: '£12-25/hr' },
    { id: 'retail-staff', name: 'Retail Staff Cover', priceRange: '£11-18/hr' },
    { id: 'warehouse-support', name: 'Warehouse Support', priceRange: '£12-20/hr' },
    { id: 'delivery-drivers', name: 'Delivery Drivers', priceRange: '£14-22/hr' },
    { id: 'admin-support', name: 'Admin Support', priceRange: '£15-30/hr' },
    { id: 'event-setup', name: 'Event Setup Crew', priceRange: '£12-20/hr' },
    { id: 'labourers', name: 'Labourers', priceRange: '£12-18/hr' },
  ],
  'digital-services': [
    { id: 'graphic-design', name: 'Graphic Design', priceRange: '£25-60/hr' },
    { id: 'video-editing', name: 'Video Editing', priceRange: '£30-70/hr' },
    { id: 'cv-writing', name: 'CV Writing', priceRange: '£50-150/CV' },
    { id: 'website-setup', name: 'Website Setup', priceRange: '£200-1000/site' },
    { id: 'social-media', name: 'Social Media Management', priceRange: '£200-600/month' },
    { id: 'data-entry', name: 'Data Entry', priceRange: '£12-20/hr' },
    { id: 'translation', name: 'Translation', priceRange: '£0.08-0.15/word' },
  ],
  'events-staffing': [
    { id: 'event-staff', name: 'Event Staff', priceRange: '£12-20/hr' },
    { id: 'waiters', name: 'Waiters', priceRange: '£12-18/hr' },
    { id: 'bartenders', name: 'Bartenders', priceRange: '£14-25/hr' },
    { id: 'security', name: 'Security', priceRange: '£15-25/hr' },
    { id: 'dj-services', name: 'DJ Services', priceRange: '£150-400/event' },
    { id: 'photographer', name: 'Photographer', priceRange: '£100-300/hr' },
    { id: 'videographer', name: 'Videographer', priceRange: '£150-400/hr' },
    { id: 'decoration-setup', name: 'Decoration Setup', priceRange: '£15-30/hr' },
  ],
};

// Popular services by UK region (based on postcode prefix)
const POPULAR_BY_REGION = {
  // London areas
  'SW': ['cleaning', 'handyman', 'tutoring', 'pets'],
  'SE': ['cleaning', 'moving', 'handyman', 'gardening'],
  'E': ['cleaning', 'moving', 'delivery-drivers', 'handyman'],
  'W': ['cleaning', 'tutoring', 'pets', 'personal-assistant'],
  'N': ['cleaning', 'handyman', 'tutoring', 'moving'],
  'NW': ['cleaning', 'tutoring', 'pets', 'childcare'],
  'EC': ['admin-support', 'delivery-drivers', 'cleaning', 'event-staff'],
  'WC': ['cleaning', 'admin-support', 'event-staff', 'waiters'],
  // Other major cities
  'M': ['cleaning', 'handyman', 'moving', 'delivery-drivers'], // Manchester
  'B': ['cleaning', 'handyman', 'gardening', 'mobile-mechanic'], // Birmingham
  'L': ['cleaning', 'handyman', 'moving', 'pets'], // Liverpool
  'LS': ['cleaning', 'handyman', 'tutoring', 'moving'], // Leeds
  'S': ['cleaning', 'handyman', 'gardening', 'mobile-mechanic'], // Sheffield
  'BS': ['cleaning', 'handyman', 'gardening', 'moving'], // Bristol
  'G': ['cleaning', 'handyman', 'moving', 'gardening'], // Glasgow
  'EH': ['cleaning', 'handyman', 'tutoring', 'moving'], // Edinburgh
  'CF': ['cleaning', 'handyman', 'gardening', 'moving'], // Cardiff
  'BT': ['cleaning', 'handyman', 'gardening', 'plumbing'], // Belfast
  // Default for other areas
  'default': ['cleaning', 'handyman', 'gardening', 'moving']
};

// Get all subcategories as flat array for lookup
const ALL_SUBCATEGORIES = Object.values(SUBCATEGORIES).flat();

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
  const [popularServices, setPopularServices] = useState([]);

  // Update popular services when postcode changes
  useEffect(() => {
    if (postcode.length >= 1) {
      const prefix = postcode.toUpperCase().replace(/[0-9]/g, '').substring(0, 2);
      const popularIds = POPULAR_BY_REGION[prefix] || POPULAR_BY_REGION['default'];
      const services = popularIds.map(id => ALL_SUBCATEGORIES.find(s => s.id === id)).filter(Boolean);
      setPopularServices(services);
    } else {
      // Default popular services
      const defaultIds = ['cleaning', 'handyman', 'tutoring', 'pets'];
      const services = defaultIds.map(id => ALL_SUBCATEGORIES.find(s => s.id === id)).filter(Boolean);
      setPopularServices(services);
    }
  }, [postcode]);

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

  const handlePopularClick = (service) => {
    navigate(`/browse?category=${service.id}&postcode=${encodeURIComponent(postcode)}`);
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

            {/* Two Big CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                data-testid="need-help-btn"
                onClick={() => navigate('/post-job')}
                className="h-14 px-8 bg-[#0052CC] hover:bg-[#0043A6] rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                I need help
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                data-testid="can-help-btn"
                onClick={() => navigate('/become-helper')}
                variant="outline"
                className="h-14 px-8 border-2 border-slate-300 hover:border-[#0052CC] rounded-full text-lg font-semibold hover:bg-slate-50 transition-all"
              >
                I can help
              </Button>
            </div>

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
                    onChange={(e) => setPostcode(e.target.value.toUpperCase())}
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

      {/* Popular in Your Area Section */}
      {popularServices.length > 0 && (
        <section className="py-8 bg-gradient-to-b from-white to-[#F9FAFB]">
          <div className="container-app">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[#FF5A5F]" />
              <h2 className="text-lg font-semibold text-[#0F172A]">
                Popular {postcode ? `in ${postcode.split(' ')[0]}` : 'near you'}
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {popularServices.map((service) => {
                const IconComponent = SUBCATEGORY_ICONS[service.id] || Wrench;
                return (
                  <button
                    key={service.id}
                    data-testid={`popular-${service.id}`}
                    onClick={() => handlePopularClick(service)}
                    className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-[#0052CC] hover:shadow-md transition-all whitespace-nowrap group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#0052CC]/10 transition-colors">
                      <IconComponent className="h-5 w-5 text-[#64748B] group-hover:text-[#0052CC]" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[#0F172A] text-sm">{service.name}</p>
                      <p className="text-xs text-[#10B981]">{service.priceRange}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

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

      {/* Category Modal - Subcategories with Icons */}
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
                {SUBCATEGORIES[selectedCategory.id]?.map((sub) => {
                  const IconComponent = SUBCATEGORY_ICONS[sub.id] || Wrench;
                  return (
                    <button
                      key={sub.id}
                      data-testid={`subcategory-${sub.id}`}
                      onClick={() => handleSubcategoryClick(sub)}
                      className="p-4 rounded-xl border-2 border-slate-100 hover:border-[#0052CC] hover:bg-[#0052CC]/5 transition-all text-left group"
                    >
                      <div className={`w-10 h-10 rounded-lg ${selectedCategory.lightColor} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`h-5 w-5 ${selectedCategory.textColor}`} />
                      </div>
                      <p className="font-medium text-[#0F172A] text-sm group-hover:text-[#0052CC]">
                        {sub.name}
                      </p>
                      <p className="text-xs text-[#10B981] mt-1">{sub.priceRange}</p>
                    </button>
                  );
                })}
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
