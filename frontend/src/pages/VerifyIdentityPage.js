import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  CreditCard, 
  User,
  FileText,
  Eye,
  X,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

const ID_TYPES = [
  { id: 'passport', name: 'Passport', icon: FileText },
  { id: 'driving_license', name: 'UK Driving Licence', icon: CreditCard },
  { id: 'national_id', name: 'National ID Card', icon: CreditCard },
];

export default function VerifyIdentityPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
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

  const [verificationResult, setVerificationResult] = useState(null);

  const handleSubmit = async () => {
    if (!idType || !idFront || !selfie) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      // Convert files to base64 for API submission
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

      // Store result for display
      setVerificationResult(response.data);
      
      if (response.data.status === 'verified') {
        toast.success('Your ID has been verified automatically!');
      } else if (response.data.status === 'rejected') {
        toast.error('Verification failed. Please try again with clearer photos.');
      } else {
        toast.success('Verification submitted for review!');
      }
      
      setStep(4); // Result step
      
      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  // Already verified
  if (user?.verification_status === 'verified') {
    return (
      <div className="min-h-screen bg-[#F9FAFB] py-8">
        <div className="container-app max-w-lg">
          <div className="card-base p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Already Verified</h1>
            <p className="text-[#64748B] mb-6">
              Your identity has been verified. You have full access to AnyWork.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="btn-primary">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pending verification
  if (user?.verification_status === 'pending') {
    return (
      <div className="min-h-screen bg-[#F9FAFB] py-8">
        <div className="container-app max-w-lg">
          <div className="card-base p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Verification In Progress</h1>
            <p className="text-[#64748B] mb-6">
              Your documents are being reviewed. This usually takes 24-48 hours.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="btn-primary">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="container-app max-w-2xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="mb-6 text-[#64748B]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step > 1 ? 'Back' : 'Cancel'}
        </Button>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                s < step ? 'bg-[#10B981] text-white' :
                s === step ? 'bg-[#0052CC] text-white' :
                'bg-slate-200 text-[#64748B]'
              }`}
            >
              {s < step ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
          ))}
        </div>

        {/* Step 1: Select ID Type */}
        {step === 1 && (
          <div className="card-base p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#0052CC]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-[#0052CC]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Verify Your Identity</h1>
              <p className="text-[#64748B]">
                To keep AnyWork safe, we need to verify your identity. This helps build trust with other users.
              </p>
            </div>

            <div className="mb-6">
              <Label className="text-base font-medium mb-4 block">Select your ID type</Label>
              <div className="space-y-3">
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
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        idType === type.id ? 'bg-[#0052CC]' : 'bg-slate-100'
                      }`}>
                        <IconComponent className={`h-6 w-6 ${
                          idType === type.id ? 'text-white' : 'text-slate-600'
                        }`} />
                      </div>
                      <span className="font-medium text-[#0F172A]">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Important</p>
                  <p className="text-amber-700 mt-1">
                    Your ID must be valid and not expired. We'll verify your name matches the name on your account.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!idType}
              className="w-full btn-primary h-12"
              data-testid="continue-step1"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Upload ID */}
        {step === 2 && (
          <div className="card-base p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#0052CC]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-[#0052CC]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Upload Your ID</h1>
              <p className="text-[#64748B]">
                Take a clear photo of your {ID_TYPES.find(t => t.id === idType)?.name || 'ID'}
              </p>
            </div>

            {/* Front of ID */}
            <div className="mb-6">
              <Label className="text-base font-medium mb-3 block">Front of ID *</Label>
              {idFrontPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-green-500">
                  <img src={idFrontPreview} alt="ID Front" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => removeFile('idFront')}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Uploaded
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => idFrontRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#0052CC] hover:bg-blue-50/50 transition-colors"
                  data-testid="upload-id-front"
                >
                  <Upload className="h-8 w-8 text-[#94A3B8]" />
                  <span className="text-[#64748B]">Click to upload front of ID</span>
                  <span className="text-xs text-[#94A3B8]">JPG, PNG up to 10MB</span>
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

            {/* Back of ID (optional for passport) */}
            {idType !== 'passport' && (
              <div className="mb-6">
                <Label className="text-base font-medium mb-3 block">Back of ID (if applicable)</Label>
                {idBackPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-green-500">
                    <img src={idBackPreview} alt="ID Back" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => removeFile('idBack')}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Uploaded
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => idBackRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#0052CC] hover:bg-blue-50/50 transition-colors"
                    data-testid="upload-id-back"
                  >
                    <Upload className="h-8 w-8 text-[#94A3B8]" />
                    <span className="text-[#64748B]">Click to upload back of ID</span>
                    <span className="text-xs text-[#94A3B8]">Optional - JPG, PNG up to 10MB</span>
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

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-[#64748B]">
                <strong className="text-[#0F172A]">Tips for a good photo:</strong>
              </p>
              <ul className="text-sm text-[#64748B] mt-2 space-y-1">
                <li>• Ensure all text is clearly visible</li>
                <li>• Avoid glare or shadows</li>
                <li>• Include all four corners of the ID</li>
              </ul>
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={!idFront}
              className="w-full btn-primary h-12"
              data-testid="continue-step2"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Take Selfie */}
        {step === 3 && (
          <div className="card-base p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#0052CC]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-[#0052CC]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Take a Selfie</h1>
              <p className="text-[#64748B]">
                We'll compare this with your ID photo to verify it's you
              </p>
            </div>

            <div className="mb-6">
              <Label className="text-base font-medium mb-3 block">Your Selfie *</Label>
              {selfiePreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-green-500">
                  <img src={selfiePreview} alt="Selfie" className="w-full h-64 object-cover" />
                  <button
                    onClick={() => removeFile('selfie')}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Uploaded
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => selfieRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#0052CC] hover:bg-blue-50/50 transition-colors"
                  data-testid="upload-selfie"
                >
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center">
                    <User className="h-12 w-12 text-[#94A3B8]" />
                  </div>
                  <span className="text-[#64748B]">Click to take or upload a selfie</span>
                  <span className="text-xs text-[#94A3B8]">JPG, PNG up to 10MB</span>
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

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-[#64748B]">
                <strong className="text-[#0F172A]">Tips for a good selfie:</strong>
              </p>
              <ul className="text-sm text-[#64748B] mt-2 space-y-1">
                <li>• Face the camera directly</li>
                <li>• Ensure good lighting on your face</li>
                <li>• Remove sunglasses or hats</li>
                <li>• Keep a neutral expression</li>
              </ul>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-[#0F172A] mb-2">Ready to submit:</p>
              <div className="flex items-center gap-4">
                {idFrontPreview && (
                  <img src={idFrontPreview} alt="ID" className="w-16 h-12 object-cover rounded-lg" />
                )}
                {selfiePreview && (
                  <img src={selfiePreview} alt="Selfie" className="w-12 h-12 object-cover rounded-full" />
                )}
                <span className="text-sm text-[#64748B]">
                  {ID_TYPES.find(t => t.id === idType)?.name} + Selfie
                </span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!selfie || loading}
              className="w-full btn-primary h-12"
              data-testid="submit-verification"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <>
                  Submit for Verification
                  <CheckCircle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && (
          <div className="card-base p-8 text-center">
            {/* Auto-Verified Success */}
            {verificationResult?.status === 'verified' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Verified!</h1>
                <p className="text-[#64748B] mb-6">
                  Your identity has been verified automatically. You now have full access to AnyWork!
                </p>
                
                <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">AI Verification Complete</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Our AI system has confirmed your identity with {verificationResult.ai_result?.confidence || 0}% confidence.
                    A "Verified" badge now appears on your profile.
                  </p>
                </div>
              </>
            )}

            {/* Auto-Rejected */}
            {verificationResult?.status === 'rejected' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Verification Failed</h1>
                <p className="text-[#64748B] mb-6">
                  We couldn't verify your identity automatically. The face in your selfie doesn't appear to match your ID photo.
                </p>
                
                <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
                  <h3 className="font-semibold text-red-800 mb-2">Please try again:</h3>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      Make sure the ID photo is clear and not blurry
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      Take the selfie in good lighting, facing the camera directly
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      Remove sunglasses, hats, or anything covering your face
                    </li>
                  </ul>
                </div>
                
                <Button
                  onClick={() => {
                    setStep(1);
                    setIdType('');
                    setIdFront(null);
                    setIdBack(null);
                    setSelfie(null);
                    setIdFrontPreview(null);
                    setIdBackPreview(null);
                    setSelfiePreview(null);
                    setVerificationResult(null);
                  }}
                  className="btn-primary mr-3"
                >
                  Try Again
                </Button>
              </>
            )}

            {/* Pending Manual Review */}
            {verificationResult?.status === 'pending' && (
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Verification Under Review</h1>
                <p className="text-[#64748B] mb-6">
                  Your documents have been submitted and are being reviewed by our team. This usually takes 24-48 hours.
                </p>
                
                <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-800">Manual Review Required</h3>
                  </div>
                  <p className="text-sm text-amber-700">
                    Our AI couldn't automatically verify your identity. A team member will review your documents and you'll receive a notification once complete.
                  </p>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                  <h3 className="font-semibold text-[#0F172A] mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-[#64748B]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#0052CC] font-bold">1.</span>
                      Our team reviews your documents
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0052CC] font-bold">2.</span>
                      You'll receive a notification when verified
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0052CC] font-bold">3.</span>
                      A "Verified" badge appears on your profile
                    </li>
                  </ul>
                </div>
              </>
            )}

            <Button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
