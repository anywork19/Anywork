import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Star, CheckCircle, Shield, Clock, ArrowRight, Home, Sparkles, PawPrint, GraduationCap, Car, Truck, Laptop, Wrench, Flower2, Baby, Heart, PartyPopper, ChevronRight, Users, BadgeCheck, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const CATEGORIES = [
  { id: 'home-help', name: 'Home Help', icon: Home, color: 'bg-blue-50 text-blue-600' },
  { id: 'cleaning', name: 'Cleaning', icon: Sparkles, color: 'bg-purple-50 text-purple-600' },
  { id: 'pets', name: 'Pets', icon: PawPrint, color: 'bg-orange-50 text-orange-600' },
  { id: 'tutoring', name: 'Tutoring', icon: GraduationCap, color: 'bg-green-50 text-green-600' },
  { id: 'driving', name: 'Driving Cover', icon: Car, color: 'bg-red-50 text-red-600' },
  { id: 'moving', name: 'Moving Help', icon: Truck, color: 'bg-yellow-50 text-yellow-700' },
  { id: 'tech', name: 'Tech Help', icon: Laptop, color: 'bg-cyan-50 text-cyan-600' },
  { id: 'handyman', name: 'Handyman', icon: Wrench, color: 'bg-slate-100 text-slate-600' },
  { id: 'gardening', name: 'Gardening', icon: Flower2, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'childcare', name: 'Childcare', icon: Baby, color: 'bg-pink-50 text-pink-600' },
  { id: 'eldercare', name: 'Elder Care', icon: Heart, color: 'bg-rose-50 text-rose-600' },
  { id: 'events', name: 'Events', icon: PartyPopper, color: 'bg-indigo-50 text-indigo-600' },
];

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
    category: 'Pets',
    rating: 4.8,
    reviews: 89,
    reliability: 99,
    hourlyRate: 12,
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
    category: 'Handyman',
    rating: 4.7,
    reviews: 156,
    reliability: 96,
    hourlyRate: 25,
    verified: true,
    insured: true,
    nextAvailable: 'Today, 5pm',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
  }
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Tell us what you need',
    description: 'Post a job with details about the task, when you need it, and your budget.',
    icon: MessageCircle
  },
  {
    step: 2,
    title: 'Get matched',
    description: 'Browse verified helpers nearby or receive quotes from interested helpers.',
    icon: Users
  },
  {
    step: 3,
    title: 'Book with confidence',
    description: 'Choose your helper, book securely, and pay through our protected platform.',
    icon: BadgeCheck
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [postcode, setPostcode] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(searchQuery)}&postcode=${encodeURIComponent(postcode)}`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white" />
        <div className="container-app relative py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] leading-tight">
                Get things done<br />
                <span className="text-[#0052CC]">while you live your life.</span>
              </h1>
              <p className="text-lg text-[#64748B] max-w-xl leading-relaxed">
                Connect with trusted local helpers for any task. From cleaning to tutoring, 
                find the right person for the job in your neighbourhood.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button
                  data-testid="need-help-btn"
                  onClick={() => navigate('/post-job')}
                  className="btn-primary text-lg px-10 py-6"
                >
                  I need help
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  data-testid="can-help-btn"
                  onClick={() => navigate('/become-helper')}
                  variant="outline"
                  className="btn-secondary text-lg px-10 py-6"
                >
                  I can help
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <CheckCircle className="h-5 w-5 text-[#10B981]" />
                  <span>Verified helpers</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Shield className="h-5 w-5 text-[#0052CC]" />
                  <span>Secure payments</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Star className="h-5 w-5 text-[#F59E0B]" />
                  <span>Rated & reviewed</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block animate-fade-in animate-fade-in-delay-2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1640549709652-4d083bf189ce?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                  alt="London residential street"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 animate-fade-in animate-fade-in-delay-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F172A]">10,000+</p>
                    <p className="text-sm text-[#64748B]">Jobs completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="container-app">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="What do you need help with?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-xl border-slate-200 text-base"
              />
            </div>
            <div className="w-full md:w-48 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
              <Input
                data-testid="postcode-input"
                type="text"
                placeholder="Postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="pl-12 h-14 rounded-xl border-slate-200 text-base"
              />
            </div>
            <Button
              data-testid="search-btn"
              type="submit"
              className="h-14 px-8 bg-[#0052CC] hover:bg-[#0043A6] rounded-xl text-base font-semibold"
            >
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Popular tasks</h2>
            <p className="text-[#64748B] text-lg">Find help for almost anything</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.id}
                to={`/browse?category=${category.id}`}
                data-testid={`category-${category.id}`}
                className="card-base card-interactive p-6 text-center group"
              >
                <div className={`w-14 h-14 mx-auto rounded-2xl ${category.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <category.icon className="h-7 w-7" />
                </div>
                <p className="font-medium text-[#0F172A]">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Available Now Section */}
      <section className="py-20 bg-white">
        <div className="container-app">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Available now near you</h2>
              <p className="text-[#64748B]">Trusted helpers ready to assist</p>
            </div>
            <Link
              to="/browse"
              data-testid="view-all-helpers"
              className="hidden md:flex items-center gap-2 text-[#0052CC] font-medium hover:underline"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SAMPLE_HELPERS.map((helper) => (
              <Link
                key={helper.id}
                to={`/helpers/${helper.id}`}
                data-testid={`helper-card-${helper.id}`}
                className="card-base card-interactive group"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <img
                      src={helper.image}
                      alt={helper.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#0F172A] truncate">{helper.name}</h3>
                        {helper.verified && (
                          <CheckCircle className="h-4 w-4 text-[#0052CC] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-[#64748B]">{helper.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-4 w-4 text-[#F59E0B] fill-[#F59E0B]" />
                        <span className="font-medium text-sm">{helper.rating}</span>
                        <span className="text-sm text-[#94A3B8]">({helper.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {helper.verified && (
                        <span className="flex items-center gap-1 text-[#0052CC]">
                          <BadgeCheck className="h-4 w-4" />
                          Verified
                        </span>
                      )}
                      {helper.insured && (
                        <span className="flex items-center gap-1 text-[#10B981]">
                          <Shield className="h-4 w-4" />
                          Insured
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-[#0F172A]">£{helper.hourlyRate}/hr</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-[#10B981]">
                    <Clock className="h-4 w-4" />
                    <span>{helper.nextAvailable}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 text-[#0052CC] font-medium"
            >
              View all helpers <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-[#F9FAFB]">
        <div className="container-app">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-4">How it works</h2>
            <p className="text-[#64748B] text-lg">Get help in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, index) => (
              <div
                key={item.step}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#0052CC]/10 flex items-center justify-center">
                    <item.icon className="h-10 w-10 text-[#0052CC]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-[#0F172A] mb-3">{item.title}</h3>
                <p className="text-[#64748B] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-20 bg-white">
        <div className="container-app">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Trust & Safety</h2>
              <p className="text-[#64748B] text-lg">Your safety is our top priority</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="card-base p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#0052CC]/10 flex items-center justify-center mb-4">
                  <BadgeCheck className="h-7 w-7 text-[#0052CC]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0F172A] mb-2">ID Verification</h3>
                <p className="text-[#64748B]">
                  All helpers can verify their identity. Look for the blue "Verified" badge 
                  to know you're dealing with a real, vetted person.
                </p>
              </div>
              <div className="card-base p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-[#10B981]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0F172A] mb-2">Insurance Status</h3>
                <p className="text-[#64748B]">
                  Many helpers carry their own insurance. Check profiles for the "Insured" 
                  badge for added peace of mind.
                </p>
              </div>
              <div className="card-base p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center mb-4">
                  <Star className="h-7 w-7 text-[#F59E0B]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0F172A] mb-2">Reviews & Ratings</h3>
                <p className="text-[#64748B]">
                  Read honest reviews from real customers. Our two-way rating system keeps 
                  everyone accountable.
                </p>
              </div>
              <div className="card-base p-8">
                <div className="w-14 h-14 rounded-2xl bg-[#FF5A5F]/10 flex items-center justify-center mb-4">
                  <Clock className="h-7 w-7 text-[#FF5A5F]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0F172A] mb-2">Reliability Score</h3>
                <p className="text-[#64748B]">
                  See how reliable each helper is based on their job completion rate and 
                  punctuality history.
                </p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link
                to="/trust-safety"
                data-testid="learn-trust-safety"
                className="inline-flex items-center gap-2 text-[#0052CC] font-medium hover:underline"
              >
                Learn more about Trust & Safety <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0052CC]">
        <div className="container-app text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of people in the UK who use AnyWork to get things done 
            or earn money helping others.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              data-testid="cta-post-job"
              onClick={() => navigate('/post-job')}
              className="bg-white text-[#0052CC] hover:bg-blue-50 rounded-full px-8 py-6 text-lg font-semibold"
            >
              Post a job
            </Button>
            <Button
              data-testid="cta-become-helper"
              onClick={() => navigate('/become-helper')}
              variant="outline"
              className="border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg font-semibold"
            >
              Become a helper
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
