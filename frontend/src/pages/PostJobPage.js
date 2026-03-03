import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Calendar, Clock, Upload, Home, Building, MapPinned, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

const CATEGORIES = [
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

// Group categories for display
const CATEGORY_GROUPS = ['Home Services', 'Vehicle Services', 'Personal Services', 'Business Support', 'Digital Services', 'Events & Staffing'];

const STEPS = [
  { id: 1, title: 'Task Details' },
  { id: 2, title: 'Location & Time' },
  { id: 3, title: 'Budget' },
  { id: 4, title: 'Review' }
];

export default function PostJobPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location_type: 'home',
    postcode: '',
    address: '',
    date_needed: '',
    time_needed: '',
    duration_hours: 2,
    budget_type: 'hourly',
    budget_amount: '',
    photos: []
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.category && formData.description;
      case 2:
        return formData.postcode && formData.date_needed && formData.time_needed;
      case 3:
        return formData.budget_amount;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to post a job');
      navigate('/login', { state: { from: '/post-job' } });
      return;
    }

    setLoading(true);
    try {
      const response = await api.createJob({
        ...formData,
        duration_hours: Number(formData.duration_hours),
        budget_amount: Number(formData.budget_amount)
      });
      toast.success('Job posted successfully!');
      navigate('/job-posted', { state: { job: response.data } });
    } catch (error) {
      toast.error('Failed to post job. Please try again.');
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
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
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${
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
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Post a Job</h1>
          <p className="text-[#64748B] mb-8">Tell us what you need help with</p>

          {/* Step 1: Task Details */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label htmlFor="title" className="text-[#0F172A] font-medium">Job Title</Label>
                <Input
                  id="title"
                  data-testid="job-title"
                  placeholder="e.g. Deep clean 2-bed flat"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-[#0F172A] font-medium">Category</Label>
                <Select value={formData.category} onValueChange={(v) => updateFormData('category', v)}>
                  <SelectTrigger className="mt-2" data-testid="job-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-[#0F172A] font-medium">Description</Label>
                <Textarea
                  id="description"
                  data-testid="job-description"
                  placeholder="Describe the task in detail. Include any specific requirements or things the helper should know."
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-[#0F172A] font-medium mb-3 block">Photos (optional)</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#0052CC] transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-[#94A3B8] mb-2" />
                  <p className="text-[#64748B]">Click to upload photos</p>
                  <p className="text-sm text-[#94A3B8]">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location & Time */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label className="text-[#0F172A] font-medium mb-3 block">Location Type</Label>
                <RadioGroup
                  value={formData.location_type}
                  onValueChange={(v) => updateFormData('location_type', v)}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="home" id="home" className="peer sr-only" />
                    <Label
                      htmlFor="home"
                      className="flex flex-col items-center p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-[#0052CC] peer-data-[state=checked]:border-[#0052CC] peer-data-[state=checked]:bg-[#0052CC]/5"
                    >
                      <Home className="h-6 w-6 text-[#0052CC] mb-2" />
                      <span className="font-medium">Home</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="workplace" id="workplace" className="peer sr-only" />
                    <Label
                      htmlFor="workplace"
                      className="flex flex-col items-center p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-[#0052CC] peer-data-[state=checked]:border-[#0052CC] peer-data-[state=checked]:bg-[#0052CC]/5"
                    >
                      <Building className="h-6 w-6 text-[#0052CC] mb-2" />
                      <span className="font-medium">Workplace</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="other" id="other" className="peer sr-only" />
                    <Label
                      htmlFor="other"
                      className="flex flex-col items-center p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-[#0052CC] peer-data-[state=checked]:border-[#0052CC] peer-data-[state=checked]:bg-[#0052CC]/5"
                    >
                      <MapPinned className="h-6 w-6 text-[#0052CC] mb-2" />
                      <span className="font-medium">Other</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postcode" className="text-[#0F172A] font-medium">Postcode</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="postcode"
                      data-testid="job-postcode"
                      placeholder="e.g. SW1A 1AA"
                      value={formData.postcode}
                      onChange={(e) => updateFormData('postcode', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="text-[#0F172A] font-medium">
                    Address <span className="text-[#94A3B8] font-normal">(hidden until confirmed)</span>
                  </Label>
                  <Input
                    id="address"
                    data-testid="job-address"
                    placeholder="Your full address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-[#0F172A] font-medium">Date Needed</Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="date"
                      data-testid="job-date"
                      type="date"
                      value={formData.date_needed}
                      onChange={(e) => updateFormData('date_needed', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="time" className="text-[#0F172A] font-medium">Time</Label>
                  <div className="relative mt-2">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <Input
                      id="time"
                      data-testid="job-time"
                      type="time"
                      value={formData.time_needed}
                      onChange={(e) => updateFormData('time_needed', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[#0F172A] font-medium">Estimated Duration</Label>
                <Select value={String(formData.duration_hours)} onValueChange={(v) => updateFormData('duration_hours', v)}>
                  <SelectTrigger className="mt-2" data-testid="job-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="3">3 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="5">5 hours</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="8">Full day (8 hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label className="text-[#0F172A] font-medium mb-3 block">Budget Type</Label>
                <RadioGroup
                  value={formData.budget_type}
                  onValueChange={(v) => updateFormData('budget_type', v)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="hourly" id="hourly" className="peer sr-only" />
                    <Label
                      htmlFor="hourly"
                      className="flex flex-col items-center p-6 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-[#0052CC] peer-data-[state=checked]:border-[#0052CC] peer-data-[state=checked]:bg-[#0052CC]/5"
                    >
                      <Clock className="h-8 w-8 text-[#0052CC] mb-2" />
                      <span className="font-semibold text-lg">Hourly Rate</span>
                      <span className="text-sm text-[#64748B]">Pay per hour worked</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                    <Label
                      htmlFor="fixed"
                      className="flex flex-col items-center p-6 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-[#0052CC] peer-data-[state=checked]:border-[#0052CC] peer-data-[state=checked]:bg-[#0052CC]/5"
                    >
                      <Check className="h-8 w-8 text-[#0052CC] mb-2" />
                      <span className="font-semibold text-lg">Fixed Price</span>
                      <span className="text-sm text-[#64748B]">One price for the job</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="budget" className="text-[#0F172A] font-medium">
                  Your Budget {formData.budget_type === 'hourly' ? '(per hour)' : '(total)'}
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] font-medium">£</span>
                  <Input
                    id="budget"
                    data-testid="job-budget"
                    type="number"
                    placeholder="0.00"
                    value={formData.budget_amount}
                    onChange={(e) => updateFormData('budget_amount', e.target.value)}
                    className="pl-8 text-lg"
                  />
                </div>
                <p className="text-sm text-[#64748B] mt-2">
                  {formData.budget_type === 'hourly' 
                    ? 'Helpers typically charge £10-50/hour depending on the task'
                    : 'Set a competitive price to attract quality helpers'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-[#0F172A]">Job Summary</h3>
                
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Title</span>
                    <span className="font-medium text-[#0F172A]">{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Category</span>
                    <span className="font-medium text-[#0F172A] capitalize">
                      {CATEGORIES.find(c => c.id === formData.category)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Location</span>
                    <span className="font-medium text-[#0F172A]">{formData.postcode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Date & Time</span>
                    <span className="font-medium text-[#0F172A]">
                      {formData.date_needed} at {formData.time_needed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Duration</span>
                    <span className="font-medium text-[#0F172A]">{formData.duration_hours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Budget</span>
                    <span className="font-medium text-[#0F172A]">
                      £{formData.budget_amount}{formData.budget_type === 'hourly' ? '/hr' : ' fixed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-[#0052CC]">
                  <strong>Note:</strong> Your exact address will only be shared with the helper after you confirm a booking.
                </p>
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

            {currentStep < 4 ? (
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
                data-testid="submit-job"
              >
                {loading ? 'Posting...' : 'Post Job'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
