import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, Star, CheckCircle, Shield, Clock, ChevronDown, X, Map as MapIcon, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import api from '../lib/api';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  // Home Services
  { id: 'handyman', name: 'Handyman', group: 'Home Services' },
  { id: 'plumbing', name: 'Plumbing', group: 'Home Services' },
  { id: 'electrical', name: 'Electrical Work', group: 'Home Services' },
  { id: 'painting', name: 'Painting & Decorating', group: 'Home Services' },
  { id: 'cleaning', name: 'Cleaning', group: 'Home Services' },
  { id: 'gardening', name: 'Gardening', group: 'Home Services' },
  { id: 'moving', name: 'Moving Help', group: 'Home Services' },
  { id: 'furniture-assembly', name: 'Furniture Assembly', group: 'Home Services' },
  { id: 'pressure-washing', name: 'Pressure Washing', group: 'Home Services' },
  { id: 'gutter-cleaning', name: 'Gutter Cleaning', group: 'Home Services' },
  // Vehicle Services
  { id: 'mobile-mechanic', name: 'Mobile Mechanic', group: 'Vehicle Services' },
  { id: 'car-servicing', name: 'Car Servicing', group: 'Vehicle Services' },
  { id: 'brake-replacement', name: 'Brake & Pad Replacement', group: 'Vehicle Services' },
  { id: 'car-diagnostics', name: 'Car Diagnostics', group: 'Vehicle Services' },
  { id: 'battery-replacement', name: 'Battery Replacement', group: 'Vehicle Services' },
  { id: 'tyre-fitting', name: 'Tyre Fitting (Mobile)', group: 'Vehicle Services' },
  { id: 'jump-start', name: 'Jump Start', group: 'Vehicle Services' },
  { id: 'car-wash', name: 'Car Wash at Home', group: 'Vehicle Services' },
  { id: 'driving-cover', name: 'Driving Cover', group: 'Vehicle Services' },
  // Personal Services
  { id: 'tutoring', name: 'Tutoring', group: 'Personal Services' },
  { id: 'childcare', name: 'Childcare', group: 'Personal Services' },
  { id: 'eldercare', name: 'Elder Care', group: 'Personal Services' },
  { id: 'pets', name: 'Pets', group: 'Personal Services' },
  { id: 'personal-assistant', name: 'Personal Assistant', group: 'Personal Services' },
  { id: 'grocery-pickup', name: 'Grocery Pickup', group: 'Personal Services' },
  { id: 'parcel-collection', name: 'Parcel Collection', group: 'Personal Services' },
  { id: 'home-help', name: 'Home Help', group: 'Personal Services' },
  // Business Support
  { id: 'temporary-staff', name: 'Temporary Staff', group: 'Business Support' },
  { id: 'retail-staff', name: 'Retail Staff Cover', group: 'Business Support' },
  { id: 'warehouse-support', name: 'Warehouse Support', group: 'Business Support' },
  { id: 'delivery-drivers', name: 'Delivery Drivers', group: 'Business Support' },
  { id: 'admin-support', name: 'Admin Support', group: 'Business Support' },
  { id: 'event-setup', name: 'Event Setup Crew', group: 'Business Support' },
  { id: 'labourers', name: 'Labourers', group: 'Business Support' },
  // Digital Services
  { id: 'graphic-design', name: 'Graphic Design', group: 'Digital Services' },
  { id: 'video-editing', name: 'Video Editing', group: 'Digital Services' },
  { id: 'cv-writing', name: 'CV Writing', group: 'Digital Services' },
  { id: 'website-setup', name: 'Website Setup', group: 'Digital Services' },
  { id: 'social-media', name: 'Social Media Management', group: 'Digital Services' },
  { id: 'data-entry', name: 'Data Entry', group: 'Digital Services' },
  { id: 'translation', name: 'Translation', group: 'Digital Services' },
  // Events & Staffing
  { id: 'event-staff', name: 'Event Staff', group: 'Events & Staffing' },
  { id: 'waiters', name: 'Waiters', group: 'Events & Staffing' },
  { id: 'bartenders', name: 'Bartenders', group: 'Events & Staffing' },
  { id: 'security', name: 'Security', group: 'Events & Staffing' },
  { id: 'dj-services', name: 'DJ Services', group: 'Events & Staffing' },
  { id: 'photographer', name: 'Photographer', group: 'Events & Staffing' },
  { id: 'videographer', name: 'Videographer', group: 'Events & Staffing' },
  { id: 'decoration-setup', name: 'Decoration Setup', group: 'Events & Staffing' },
];

// Sample helpers with coordinates for map
const SAMPLE_HELPERS = [
  {
    helper_id: 'helper_1',
    user_name: 'Sarah Johnson',
    user_picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    categories: ['cleaning', 'home-help'],
    rating: 4.9,
    total_reviews: 47,
    reliability_score: 98,
    hourly_rate: 15,
    verified_id: true,
    insured: true,
    postcode: 'SW1A 1AA',
    lat: 51.501,
    lng: -0.141
  },
  {
    helper_id: 'helper_2',
    user_name: 'James Williams',
    user_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    categories: ['pets'],
    rating: 4.8,
    total_reviews: 89,
    reliability_score: 99,
    hourly_rate: 12,
    verified_id: true,
    insured: true,
    postcode: 'E1 6AN',
    lat: 51.515,
    lng: -0.072
  },
  {
    helper_id: 'helper_3',
    user_name: 'Dr. Emily Chen',
    user_picture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    categories: ['tutoring'],
    rating: 5.0,
    total_reviews: 23,
    reliability_score: 100,
    hourly_rate: 35,
    verified_id: true,
    insured: false,
    postcode: 'NW1 4RY',
    lat: 51.527,
    lng: -0.154
  },
  {
    helper_id: 'helper_4',
    user_name: 'Mike Thompson',
    user_picture: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    categories: ['handyman', 'home-help'],
    rating: 4.7,
    total_reviews: 156,
    reliability_score: 96,
    hourly_rate: 25,
    verified_id: true,
    insured: true,
    postcode: 'SE1 9SG',
    lat: 51.503,
    lng: -0.087
  },
  {
    helper_id: 'helper_5',
    user_name: 'David Green',
    user_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    categories: ['gardening'],
    rating: 4.9,
    total_reviews: 67,
    reliability_score: 97,
    hourly_rate: 20,
    verified_id: true,
    insured: true,
    postcode: 'W8 4PT',
    lat: 51.499,
    lng: -0.192
  }
];

export default function BrowseHelpersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [helpers, setHelpers] = useState(SAMPLE_HELPERS);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list or map
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedHelper, setSelectedHelper] = useState(null);

  // Filter states
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [postcode, setPostcode] = useState(searchParams.get('postcode') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [insuredOnly, setInsuredOnly] = useState(false);

  const fetchHelpers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category && category !== 'all') params.category = category;
      if (postcode) params.postcode = postcode;
      if (minRating > 0) params.min_rating = minRating;
      if (verifiedOnly) params.verified_only = true;
      if (insuredOnly) params.insured_only = true;

      const response = await api.getHelpers(params);
      if (response.data.helpers?.length > 0) {
        // Add coordinates to fetched helpers
        setHelpers(response.data.helpers.map((h, i) => ({
          ...h,
          lat: 51.5 + (Math.random() - 0.5) * 0.05,
          lng: -0.1 + (Math.random() - 0.5) * 0.1
        })));
      }
    } catch (error) {
      console.error('Error fetching helpers:', error);
      // Keep sample data on error
    } finally {
      setLoading(false);
    }
  }, [category, postcode, minRating, verifiedOnly, insuredOnly]);

  useEffect(() => {
    fetchHelpers();
  }, [fetchHelpers]);

  // Filter helpers client-side for additional filters
  const filteredHelpers = helpers.filter(helper => {
    if (priceRange[0] > 0 && helper.hourly_rate < priceRange[0]) return false;
    if (priceRange[1] < 100 && helper.hourly_rate > priceRange[1]) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!helper.user_name?.toLowerCase().includes(query) &&
          !helper.categories?.some(c => c.toLowerCase().includes(query))) {
        return false;
      }
    }
    return true;
  });

  const clearFilters = () => {
    setCategory('all');
    setPostcode('');
    setSearchQuery('');
    setPriceRange([0, 100]);
    setMinRating(0);
    setVerifiedOnly(false);
    setInsuredOnly(false);
    setSearchParams({});
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-2">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-testid="category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Postcode */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-2">Postcode</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <Input
            data-testid="postcode-filter"
            placeholder="e.g. SW1A"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-2">
          Price Range: £{priceRange[0]} - £{priceRange[1]}/hr
        </label>
        <Slider
          data-testid="price-range-slider"
          value={priceRange}
          onValueChange={setPriceRange}
          max={100}
          step={5}
          className="mt-4"
        />
      </div>

      {/* Min Rating */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-2">Minimum Rating</label>
        <Select value={String(minRating)} onValueChange={(v) => setMinRating(Number(v))}>
          <SelectTrigger data-testid="rating-filter">
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any rating</SelectItem>
            <SelectItem value="3">3+ stars</SelectItem>
            <SelectItem value="4">4+ stars</SelectItem>
            <SelectItem value="4.5">4.5+ stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Checkbox
            id="verified"
            data-testid="verified-checkbox"
            checked={verifiedOnly}
            onCheckedChange={setVerifiedOnly}
          />
          <label htmlFor="verified" className="text-sm text-[#0F172A] cursor-pointer">
            Verified ID only
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="insured"
            data-testid="insured-checkbox"
            checked={insuredOnly}
            onCheckedChange={setInsuredOnly}
          />
          <label htmlFor="insured" className="text-sm text-[#0F172A] cursor-pointer">
            Insured only
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        data-testid="clear-filters"
        variant="outline"
        onClick={clearFilters}
        className="w-full"
      >
        Clear all filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-30">
        <div className="container-app py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
              <Input
                data-testid="search-helpers"
                type="text"
                placeholder="Search helpers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl w-full"
              />
            </div>

            {/* Filter Button (Mobile) */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  data-testid="mobile-filters-btn"
                  variant="outline"
                  className="md:hidden w-full h-12 rounded-xl"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
              <Button
                data-testid="list-view-btn"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                data-testid="map-view-btn"
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className={viewMode === 'map' ? 'bg-white shadow-sm' : ''}
              >
                <MapIcon className="h-4 w-4 mr-1" />
                Map
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(category !== 'all' || verifiedOnly || insuredOnly || minRating > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {category !== 'all' && (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {CATEGORIES.find(c => c.id === category)?.name}
                  <button onClick={() => setCategory('all')} className="ml-2">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {verifiedOnly && (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Verified ID
                  <button onClick={() => setVerifiedOnly(false)} className="ml-2">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {insuredOnly && (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Insured
                  <button onClick={() => setInsuredOnly(false)} className="ml-2">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {minRating > 0 && (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {minRating}+ stars
                  <button onClick={() => setMinRating(0)} className="ml-2">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container-app py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden md:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-36">
              <h3 className="font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </h3>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[#64748B]">
                {loading ? 'Loading...' : `${filteredHelpers.length} helpers found`}
              </p>
              <Select defaultValue="relevance">
                <SelectTrigger className="w-40" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {viewMode === 'list' ? (
              /* List View */
              <div className="grid gap-4">
                {filteredHelpers.map((helper) => (
                  <Link
                    key={helper.helper_id}
                    to={`/helpers/${helper.helper_id}`}
                    data-testid={`helper-card-${helper.helper_id}`}
                    className="card-base card-interactive"
                  >
                    <div className="p-6 flex flex-col sm:flex-row gap-6">
                      <img
                        src={helper.user_picture || 'https://via.placeholder.com/100'}
                        alt={helper.user_name}
                        className="w-24 h-24 rounded-2xl object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-[#0F172A]">{helper.user_name}</h3>
                              {helper.verified_id && (
                                <CheckCircle className="h-5 w-5 text-[#0052CC]" />
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {helper.categories?.map(cat => (
                                <Badge key={cat} variant="secondary" className="rounded-full capitalize">
                                  {cat.replace('-', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <p className="text-xl font-bold text-[#0F172A]">
                            £{helper.hourly_rate}<span className="text-sm font-normal text-[#64748B]">/hr</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-6 mt-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-[#F59E0B] fill-[#F59E0B]" />
                            <span className="font-medium">{helper.rating || 0}</span>
                            <span className="text-[#94A3B8]">({helper.total_reviews || 0})</span>
                          </div>
                          <div className="text-sm text-[#64748B]">
                            {helper.reliability_score || 100}% reliability
                          </div>
                          {helper.verified_id && (
                            <span className="flex items-center gap-1 text-sm text-[#0052CC]">
                              <CheckCircle className="h-4 w-4" />
                              Verified
                            </span>
                          )}
                          {helper.insured && (
                            <span className="flex items-center gap-1 text-sm text-[#10B981]">
                              <Shield className="h-4 w-4" />
                              Insured
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-[#64748B]">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          {helper.postcode}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Map View */
              <div className="h-[600px] rounded-2xl overflow-hidden border border-slate-200">
                <Map
                  initialViewState={{
                    longitude: -0.118,
                    latitude: 51.509,
                    zoom: 11
                  }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                >
                  {filteredHelpers.map((helper) => (
                    <Marker
                      key={helper.helper_id}
                      longitude={helper.lng}
                      latitude={helper.lat}
                      anchor="bottom"
                      onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        setSelectedHelper(helper);
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#0052CC] border-4 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                        <span className="text-white text-sm font-bold">£{helper.hourly_rate}</span>
                      </div>
                    </Marker>
                  ))}
                  {selectedHelper && (
                    <Popup
                      longitude={selectedHelper.lng}
                      latitude={selectedHelper.lat}
                      anchor="bottom"
                      onClose={() => setSelectedHelper(null)}
                      closeOnClick={false}
                      className="rounded-xl"
                    >
                      <Link to={`/helpers/${selectedHelper.helper_id}`} className="block p-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedHelper.user_picture}
                            alt={selectedHelper.user_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-[#0F172A]">{selectedHelper.user_name}</h4>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 text-[#F59E0B] fill-[#F59E0B]" />
                              <span>{selectedHelper.rating}</span>
                              <span className="text-[#64748B]">• £{selectedHelper.hourly_rate}/hr</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </Popup>
                  )}
                </Map>
              </div>
            )}

            {filteredHelpers.length === 0 && !loading && (
              <div className="text-center py-16">
                <p className="text-[#64748B] text-lg">No helpers found matching your criteria</p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mt-4"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
