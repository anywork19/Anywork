import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Eye, EyeOff, 
  Upload, Camera, CheckCircle, AlertTriangle, Shield, CreditCard, FileText, Clock, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

const ID_TYPES = [
  { id: 'passport', name: 'Passport', icon: FileText },
  { id: 'driving_license', name: 'UK Driving Licence', icon: CreditCard },
  { id: 'national_id', name: 'National ID Card', icon: CreditCard },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginWithGoogle, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Signup flow step: 'form' | 'id-type' | 'id-upload' | 'selfie' | 'result'
  const [signupStep, setSignupStep] = useState('form');
  const [verificationResult, setVerificationResult] = useState(null);

  const from = location.state?.from || '/';

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer'
  });

  // ID Verification states
  const [idType, setIdType] = useState('');
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  const idFrontRef = useRef(null);
  const idBackRef = useRef(null);
  const selfieRef = useRef(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupBasic = async (e) => {
    e.preventDefault();
    if (signupData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(signupData);
      toast.success('Account created! Now verify your identity.');
      setSignupStep('id-type');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'idFront') {
        setIdFront(file);
        setIdFrontPreview(reader.result);
      } else if (type === 'idBack') {
        setIdBack(file);
        setIdBackPreview(reader.result);
      } else if (type === 'selfie') {
        setSelfie(file);
        setSelfiePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type) => {
    if (type === 'idFront') {
      setIdFront(null);
      setIdFrontPreview(null);
    } else if (type === 'idBack') {
      setIdBack(null);
      setIdBackPreview(null);
    } else if (type === 'selfie') {
      setSelfie(null);
      setSelfiePreview(null);
    }
  };

  const handleSubmitVerification = async () => {
    if (!idType || !idFront || !selfie) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      const idFrontBase64 = await toBase64(idFront);
      const idBackBase64 = idBack ? await toBase64(idBack) : null;
      const selfieBase64 = await toBase64(selfie);

      const response = await api.submitVerification({
        id_type: idType,
        id_front: idFrontBase64,
        id_back: idBackBase64,
        selfie: selfieBase64
      });

      setVerificationResult(response.data);
      
      if (response.data.status === 'verified') {
        toast.success('Your ID has been verified automatically!');
      } else if (response.data.status === 'rejected') {
        toast.error('Verification failed. Please try again.');
      } else {
        toast.success('Verification submitted for review!');
      }
      
      setSignupStep('result');
      
      if (checkAuth) {
        await checkAuth();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleSkipVerification = () => {
    toast.info('You can verify your ID later from your dashboard');
    navigate(from, { replace: true });
  };

  // Render signup step progress
  const renderSignupProgress = () => {
    const steps = [
      { key: 'form', label: '1' },
      { key: 'id-type', label: '2' },
      { key: 'id-upload', label: '3' },
      { key: 'selfie', label: '4' },
    ];
    const currentIndex = steps.findIndex(s => s.key === signupStep);
    
    if (signupStep === 'result') return null;

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              i < currentIndex ? 'bg-[#10B981] text-white' :
              i === currentIndex ? 'bg-[#0052CC] text-white' :
              'bg-slate-200 text-[#64748B]'
            }`}
          >
            {i < currentIndex ? <CheckCircle className="h-4 w-4" /> : s.label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-[#0052CC]">AnyWork</h1>
          </Link>
          <p className="text-[#64748B] mt-2">Connect with trusted local helpers</p>
        </div>

        <div className="card-base p-8">
          {/* Show tabs only on form step */}
          {signupStep === 'form' ? (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">Log In</TabsTrigger>
                <TabsTrigger value="signup" data-testid="signup-tab">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                      <Input
                        id="login-email"
                        data-testid="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                      <Input
                        id="login-password"
                        data-testid="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span className="text-[#64748B]">Remember me</span>
                    </label>
                    <a href="/forgot-password" className="text-[#0052CC] hover:underline">
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary"
                    data-testid="login-submit"
                  >
                    {loading ? 'Logging in...' : 'Log In'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab - Basic Info */}
              <TabsContent value="signup">
                <form onSubmit={handleSignupBasic} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                      <Input
                        id="signup-name"
                        data-testid="signup-name"
                        type="text"
                        placeholder="John Smith"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                      <Input
                        id="signup-email"
                        data-testid="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-phone">Phone (optional)</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                      <Input
                        id="signup-phone"
                        data-testid="signup-phone"
                        type="tel"
                        placeholder="07123 456789"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                      <Input
                        id="signup-password"
                        data-testid="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1">At least 8 characters</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary"
                    data-testid="signup-submit"
                  >
                    {loading ? 'Creating account...' : 'Continue'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <p className="text-xs text-center text-[#94A3B8]">
                    By signing up, you agree to our{' '}
                    <a href="/terms" className="text-[#0052CC] hover:underline">Terms</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-[#0052CC] hover:underline">Privacy Policy</a>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {/* Verification Flow Steps */}
              {renderSignupProgress()}

              {/* Step 2: Select ID Type */}
              {signupStep === 'id-type' && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-[#0052CC]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Shield className="h-7 w-7 text-[#0052CC]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Verify Your Identity</h2>
                    <p className="text-sm text-[#64748B] mt-1">Select your ID type to continue</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {ID_TYPES.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setIdType(type.id)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                            idType === type.id
                              ? 'border-[#0052CC] bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          data-testid={`id-type-${type.id}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            idType === type.id ? 'bg-[#0052CC]' : 'bg-slate-100'
                          }`}>
                            <IconComponent className={`h-5 w-5 ${
                              idType === type.id ? 'text-white' : 'text-slate-600'
                            }`} />
                          </div>
                          <span className="font-medium text-[#0F172A]">{type.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSkipVerification}
                      className="flex-1"
                    >
                      Skip for now
                    </Button>
                    <Button
                      onClick={() => setSignupStep('id-upload')}
                      disabled={!idType}
                      className="flex-1 btn-primary"
                      data-testid="continue-id-type"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Upload ID */}
              {signupStep === 'id-upload' && (
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setSignupStep('id-type')}
                    className="mb-4 text-[#64748B] -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-[#0052CC]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Upload className="h-7 w-7 text-[#0052CC]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Upload Your ID</h2>
                    <p className="text-sm text-[#64748B] mt-1">
                      Take a clear photo of your {ID_TYPES.find(t => t.id === idType)?.name || 'ID'}
                    </p>
                  </div>

                  {/* Front of ID */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">Front of ID *</Label>
                    {idFrontPreview ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-green-500">
                        <img src={idFrontPreview} alt="ID Front" className="w-full h-36 object-cover" />
                        <button
                          onClick={() => removeFile('idFront')}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => idFrontRef.current?.click()}
                        className="w-full h-36 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#0052CC] hover:bg-blue-50/50 transition-colors"
                        data-testid="upload-id-front"
                      >
                        <Upload className="h-6 w-6 text-[#94A3B8]" />
                        <span className="text-sm text-[#64748B]">Click to upload</span>
                      </button>
                    )}
                    <input
                      ref={idFrontRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'idFront')}
                    />
                  </div>

                  {/* Back of ID (if not passport) */}
                  {idType !== 'passport' && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Back of ID (optional)</Label>
                      {idBackPreview ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-green-500">
                          <img src={idBackPreview} alt="ID Back" className="w-full h-36 object-cover" />
                          <button
                            onClick={() => removeFile('idBack')}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => idBackRef.current?.click()}
                          className="w-full h-36 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#0052CC] hover:bg-blue-50/50 transition-colors"
                          data-testid="upload-id-back"
                        >
                          <Upload className="h-6 w-6 text-[#94A3B8]" />
                          <span className="text-sm text-[#64748B]">Click to upload (optional)</span>
                        </button>
                      )}
                      <input
                        ref={idBackRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'idBack')}
                      />
                    </div>
                  )}

                  <Button
                    onClick={() => setSignupStep('selfie')}
                    disabled={!idFront}
                    className="w-full btn-primary"
                    data-testid="continue-id-upload"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 4: Take Selfie */}
              {signupStep === 'selfie' && (
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setSignupStep('id-upload')}
                    className="mb-4 text-[#64748B] -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-[#0052CC]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Camera className="h-7 w-7 text-[#0052CC]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Take a Selfie</h2>
                    <p className="text-sm text-[#64748B] mt-1">
                      We'll compare this with your ID photo
                    </p>
                  </div>

                  <div className="mb-6">
                    {selfiePreview ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-green-500">
                        <img src={selfiePreview} alt="Selfie" className="w-full h-48 object-cover" />
                        <button
                          onClick={() => removeFile('selfie')}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => selfieRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#0052CC] hover:bg-blue-50/50 transition-colors"
                        data-testid="upload-selfie"
                      >
                        <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center">
                          <User className="h-8 w-8 text-[#94A3B8]" />
                        </div>
                        <span className="text-sm text-[#64748B]">Click to take a selfie</span>
                      </button>
                    )}
                    <input
                      ref={selfieRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'selfie')}
                    />
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 mb-6 text-sm text-[#64748B]">
                    <p className="font-medium text-[#0F172A] mb-1">Tips:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Face the camera directly</li>
                      <li>• Ensure good lighting</li>
                      <li>• Remove sunglasses or hats</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleSubmitVerification}
                    disabled={!selfie || loading}
                    className="w-full btn-primary"
                    data-testid="submit-verification"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <>
                        Verify My Identity
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Step 5: Result */}
              {signupStep === 'result' && (
                <div className="text-center">
                  {verificationResult?.status === 'verified' && (
                    <>
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-7 w-7 text-green-600" />
                      </div>
                      <h2 className="text-xl font-bold text-[#0F172A] mb-2">Verified!</h2>
                      <p className="text-sm text-[#64748B] mb-4">
                        Your identity has been verified automatically. Welcome to AnyWork!
                      </p>
                      <div className="bg-green-50 rounded-xl p-3 mb-6 text-left">
                        <p className="text-sm text-green-700">
                          AI verified with {verificationResult.ai_result?.confidence || 0}% confidence
                        </p>
                      </div>
                    </>
                  )}

                  {verificationResult?.status === 'rejected' && (
                    <>
                      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="h-7 w-7 text-red-600" />
                      </div>
                      <h2 className="text-xl font-bold text-[#0F172A] mb-2">Verification Failed</h2>
                      <p className="text-sm text-[#64748B] mb-4">
                        The face in your selfie doesn't match your ID. Please try again.
                      </p>
                      <Button
                        onClick={() => {
                          setSignupStep('id-type');
                          setIdType('');
                          setIdFront(null);
                          setIdBack(null);
                          setSelfie(null);
                          setIdFrontPreview(null);
                          setIdBackPreview(null);
                          setSelfiePreview(null);
                          setVerificationResult(null);
                        }}
                        className="btn-primary mb-3"
                      >
                        Try Again
                      </Button>
                    </>
                  )}

                  {verificationResult?.status === 'pending' && (
                    <>
                      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-7 w-7 text-amber-600" />
                      </div>
                      <h2 className="text-xl font-bold text-[#0F172A] mb-2">Under Review</h2>
                      <p className="text-sm text-[#64748B] mb-4">
                        Your documents are being reviewed. This usually takes 24-48 hours.
                      </p>
                    </>
                  )}

                  <Button
                    onClick={() => navigate(from, { replace: true })}
                    className={verificationResult?.status === 'rejected' ? '' : 'btn-primary'}
                    variant={verificationResult?.status === 'rejected' ? 'outline' : 'default'}
                  >
                    {verificationResult?.status === 'rejected' ? 'Continue Without Verification' : 'Get Started'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Social Login - only show on form step */}
          {signupStep === 'form' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-[#94A3B8]">Or continue with</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full"
                  data-testid="google-login"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  data-testid="apple-login"
                  onClick={() => toast.info('Apple login coming soon')}
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.08-.5-2.06-.52-3.2 0-1.44.66-2.2.47-3.06-.4C3.11 15.61 3.67 9.3 8.64 9c1.18.06 2 .57 2.72.62 1.04-.22 2.04-.85 3.16-.76 1.35.11 2.37.63 3.03 1.6-2.77 1.66-2.12 5.32.5 6.35-.62 1.62-1.42 3.23-3 4.47zM12.46 8.94c-.12-2.22 1.64-4.14 3.77-4.31.27 2.48-2.19 4.44-3.77 4.31z"/>
                  </svg>
                  Continue with Apple
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
