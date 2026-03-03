import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Upload, Check, Camera, Plus, Minus, CheckCircle, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

// Category groups with subcategories
const CATEGORY_GROUPS = [
  {
    id: 'home-services',
    name: 'Home Services',
    categories: [
      { id: 'handyman', name: 'Handyman' },
      { id: 'plumbing', name: 'Plumbing' },
      { id: 'electrical', name: 'Electrical Work' },
      { id: 'painting', name: 'Painting & Decorating' },
      { id: 'cleaning', name: 'Cleaning' },
      { id: 'gardening', name: 'Gardening' },
      { id: 'moving', name: 'Moving Help' },
      { id: 'furniture-assembly', name: 'Furniture Assembly' },
      { id: 'pressure-washing', name: 'Pressure Washing' },
      { id: 'gutter-cleaning', name: 'Gutter Cleaning' },
    ]
  },
  {
    id: 'vehicle-services',
    name: 'Vehicle Services',
    categories: [
      { id: 'mobile-mechanic', name: 'Mobile Mechanic' },
      { id: 'car-servicing', name: 'Car Servicing' },
      { id: 'brake-replacement', name: 'Brake & Pad Replacement' },
      { id: 'car-diagnostics', name: 'Car Diagnostics' },
      { id: 'battery-replacement', name: 'Battery Replacement' },
      { id: 'tyre-fitting', name: 'Tyre Fitting (Mobile)' },
      { id: 'jump-start', name: 'Jump Start' },
      { id: 'car-wash', name: 'Car Wash at Home' },
      { id: 'driving-cover', name: 'Driving Cover' },
    ]
  },
  {
    id: 'personal-services',
    name: 'Personal Services',
    categories: [
      { id: 'tutoring', name: 'Tutoring' },
      { id: 'childcare', name: 'Childcare' },
      { id: 'eldercare', name: 'Elder Care' },
      { id: 'pets', name: 'Pets' },
      { id: 'personal-assistant', name: 'Personal Assistant' },
      { id: 'grocery-pickup', name: 'Grocery Pickup' },
      { id: 'parcel-collection', name: 'Parcel Collection' },
      { id: 'home-help', name: 'Home Help' },
    ]
  },
  {
    id: 'business-support',
    name: 'Business Support',
    categories: [
      { id: 'temporary-staff', name: 'Temporary Staff' },
      { id: 'retail-staff', name: 'Retail Staff Cover' },
      { id: 'warehouse-support', name: 'Warehouse Support' },
      { id: 'delivery-drivers', name: 'Delivery Drivers' },
      { id: 'admin-support', name: 'Admin Support' },
      { id: 'event-setup', name: 'Event Setup Crew' },
      { id: 'labourers', name: 'Labourers' },
    ]
  },
  {
    id: 'digital-services',
    name: 'Digital Services',
    categories: [
      { id: 'graphic-design', name: 'Graphic Design' },
      { id: 'video-editing', name: 'Video Editing' },
      { id: 'cv-writing', name: 'CV Writing' },
      { id: 'website-setup', name: 'Website Setup' },
      { id: 'social-media', name: 'Social Media Management' },
      { id: 'data-entry', name: 'Data Entry' },
      { id: 'translation', name: 'Translation' },
    ]
  },
  {
    id: 'events-staffing',
    name: 'Events & Staffing',
    categories: [
      { id: 'event-staff', name: 'Event Staff' },
      { id: 'waiters', name: 'Waiters' },
      { id: 'bartenders', name: 'Bartenders' },
      { id: 'security', name: 'Security' },
      { id: 'dj-services', name: 'DJ Services' },
      { id: 'photographer', name: 'Photographer' },
      { id: 'videographer', name: 'Videographer' },
      { id: 'decoration-setup', name: 'Decoration Setup' },
    ]
  },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const STEPS = [
  { id: 1, title: 'Profile' },
  { id: 2, title: 'Skills' },
  { id: 3, title: 'Availability' },
  { id: 4, title: 'Pricing' },
  { id: 5, title: 'Verification' }
];

export default function BecomeHelperPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    bio: '',
    categories: [],
    postcode: '',
    hourly_rate: '',
    fixed_rate: '',
    availability: {},
    verified_id: false,
    insured: false
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const toggleDayAvailability = (day) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: prev.availability[day] ? undefined : ['09:00-17:00']
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.bio && formData.postcode;
      case 2:
        return formData.categories.length > 0;
      case 3:
        return Object.keys(formData.availability).filter(k => formData.availability[k]).length > 0;
      case 4:
        return formData.hourly_rate;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a helper profile');
      navigate('/login', { state: { from: '/become-helper' } });
      return;
    }

    setLoading(true);
    try {
      await api.createHelperProfile({
        ...formData,
        hourly_rate: Number(formData.hourly_rate),
        fixed_rate: formData.fixed_rate ? Number(formData.fixed_rate) : null
      });
      toast.success('Your helper profile is now live!');
      navigate('/profile-live');
    } catch (error) {
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="container-app max-w-3xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-[#64748B]"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Progress Steps */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      currentStep > step.id
                        ? 'bg-[#10B981] text-white'
                        : currentStep === step.id
                        ? 'bg-[#0052CC] text-white'
                        : 'bg-slate-200 text-[#64748B]'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    currentStep >= step.id ? 'text-[#0F172A]' : 'text-[#94A3B8]'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-[#10B981]' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="card-base p-8">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Become a Helper</h1>
          <p className="text-[#64748B] mb-8">Start earning by helping people in your area</p>

          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center mb-4 relative group cursor-pointer">
                  <Camera className="h-10 w-10 text-[#94A3B8]" />
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-[#64748B]">Upload a profile photo</p>
              </div>

              <div>
                <Label htmlFor="bio" className="text-[#0F172A] font-medium">About You</Label>
                <Textarea
                  id="bio"
                  data-testid="helper-bio"
                  placeholder="Tell potential customers about yourself, your experience, and what makes you great at what you do..."
                  value={formData.bio}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  rows={5}
                  className="mt-2"
                />
                <p className="text-sm text-[#94A3B8] mt-2">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <div>
                <Label htmlFor="postcode" className="text-[#0F172A] font-medium">Your Postcode</Label>
                <Input
                  id="postcode"
                  data-testid="helper-postcode"
                  placeholder="e.g. SW1A 1AA"
                  value={formData.postcode}
                  onChange={(e) => updateFormData('postcode', e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-[#94A3B8] mt-2">
                  This helps us show you to customers nearby
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label className="text-[#0F172A] font-medium mb-4 block">
                  What services can you offer? (Select all that apply)
                </Label>
                <div className="space-y-4">
                  {CATEGORY_GROUPS.map(group => (
                    <div key={group.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 font-semibold text-[#0F172A] text-sm">
                        {group.name}
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-3">
                        {group.categories.map(category => (
                          <div
                            key={category.id}
                            data-testid={`category-${category.id}`}
                            onClick={() => toggleCategory(category.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                              formData.categories.includes(category.id)
                                ? 'border-[#0052CC] bg-[#0052CC]/5'
                                : 'border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`${formData.categories.includes(category.id) ? 'text-[#0052CC] font-medium' : 'text-[#0F172A]'}`}>
                                {category.name}
                              </span>
                              {formData.categories.includes(category.id) && (
                                <Check className="h-4 w-4 text-[#0052CC]" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#64748B] mt-4">
                  Selected: {formData.categories.length} service{formData.categories.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label className="text-[#0F172A] font-medium mb-4 block">
                  When are you available? (Select your working days)
                </Label>
                <div className="space-y-3">
                  {DAYS.map(day => (
                    <div
                      key={day}
                      data-testid={`day-${day}`}
                      onClick={() => toggleDayAvailability(day)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        formData.availability[day]
                          ? 'border-[#0052CC] bg-[#0052CC]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-medium text-[#0F172A] capitalize">{day}</span>
                      <div className="flex items-center gap-4">
                        {formData.availability[day] && (
                          <span className="text-sm text-[#64748B]">9:00 AM - 5:00 PM</span>
                        )}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          formData.availability[day]
                            ? 'border-[#0052CC] bg-[#0052CC]'
                            : 'border-slate-300'
                        }`}>
                          {formData.availability[day] && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#94A3B8] mt-4">
                  You can customise your hours later from your dashboard
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label htmlFor="hourly_rate" className="text-[#0F172A] font-medium">
                  Hourly Rate
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] font-medium">£</span>
                  <Input
                    id="hourly_rate"
                    data-testid="hourly-rate"
                    type="number"
                    placeholder="15"
                    value={formData.hourly_rate}
                    onChange={(e) => updateFormData('hourly_rate', e.target.value)}
                    className="pl-8 text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B]">/hour</span>
                </div>
                <p className="text-sm text-[#94A3B8] mt-2">
                  Most helpers in your area charge £10-30 per hour
                </p>
              </div>

              <div>
                <Label htmlFor="fixed_rate" className="text-[#0F172A] font-medium">
                  Fixed Rate (optional)
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] font-medium">£</span>
                  <Input
                    id="fixed_rate"
                    data-testid="fixed-rate"
                    type="number"
                    placeholder="50"
                    value={formData.fixed_rate}
                    onChange={(e) => updateFormData('fixed_rate', e.target.value)}
                    className="pl-8 text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B]">/job</span>
                </div>
                <p className="text-sm text-[#94A3B8] mt-2">
                  Offer a fixed price for standard jobs if you prefer
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Verification */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-[#0052CC]">
                  Verification is optional but helps build trust with customers. Verified helpers get more bookings!
                </p>
              </div>

              {/* ID Verification */}
              <div className="p-6 rounded-xl border-2 border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0052CC]/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-[#0052CC]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0F172A]">ID Verification</h3>
                    <p className="text-sm text-[#64748B] mt-1">
                      Verify your identity with a government-issued ID. This adds a "Verified" badge to your profile.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      data-testid="verify-id-btn"
                      onClick={() => toast.info('ID verification coming soon')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload ID
                    </Button>
                  </div>
                </div>
              </div>

              {/* Insurance */}
              <div className="p-6 rounded-xl border-2 border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-[#10B981]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#0F172A]">Insurance (Optional)</h3>
                    <p className="text-sm text-[#64748B] mt-1">
                      If you have public liability insurance, upload proof to get an "Insured" badge.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      data-testid="upload-insurance-btn"
                      onClick={() => toast.info('Insurance upload coming soon')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Insurance
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="terms"
                  data-testid="terms-checkbox"
                />
                <Label htmlFor="terms" className="text-sm text-[#64748B] cursor-pointer">
                  I agree to the <a href="/terms" className="text-[#0052CC] hover:underline">Terms of Service</a> and understand that AnyWork connects independent helpers with customers.
                </Label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                onClick={prevStep}
                className="rounded-full"
                data-testid="prev-step"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid()}
                className="btn-primary"
                data-testid="next-step"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
                data-testid="submit-profile"
              >
                {loading ? 'Creating Profile...' : 'Go Live'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
