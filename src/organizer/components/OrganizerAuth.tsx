import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  Landmark,
  MapPin,
  CheckCircle2,
  Calendar,
  Building,
  CreditCard,
  ShieldCheck,
  Smartphone,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createOrganization, addPayoutAccount } from '../services/organizerService';

interface OrganizerAuthProps {
  onSuccess?: (user?: any) => void;
  initialMode?: 'signin' | 'signup';
}

export const OrganizerAuth: React.FC<OrganizerAuthProps> = ({ onSuccess, initialMode = 'signup' }) => {
  const { user: currentAuthUser, signInOrganizer, signUpOrganizer, resendVerificationEmail, isConfigured } = useAuth();
  
  // 'signin' or 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Step in signup flow (1 to 4)
  const [step, setStep] = useState<number>(1);

  // Resend state
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMsg, setResendMsg] = useState('');

  // Step 1: User Account
  const [fullName, setFullName] = useState(currentAuthUser?.fullName || '');
  const [signUpEmail, setSignUpEmail] = useState(currentAuthUser?.email || '');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // Step 2: Organization Info
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('Event Agency');
  const [country, setCountry] = useState('Nigeria');
  const [phoneNumber, setPhoneNumber] = useState(currentAuthUser?.phoneNumber || '');

  // Keep fields synced if currentAuthUser loads
  useEffect(() => {
    if (currentAuthUser) {
      if (!fullName && currentAuthUser.fullName) setFullName(currentAuthUser.fullName);
      if (!signUpEmail && currentAuthUser.email) setSignUpEmail(currentAuthUser.email);
      if (!phoneNumber && currentAuthUser.phoneNumber) setPhoneNumber(currentAuthUser.phoneNumber);
    }
  }, [currentAuthUser]);

  const countryData: Record<string, { flag: string; code: string; currency: string; currencySymbol: string }> = {
    Nigeria: { flag: '🇳🇬', code: '+234', currency: 'NGN', currencySymbol: '₦' },
    Ghana: { flag: '🇬🇭', code: '+233', currency: 'GHS', currencySymbol: 'GH₵' },
    'Côte d’Ivoire': { flag: '🇨🇮', code: '+225', currency: 'XOF', currencySymbol: 'CFA' },
  };

  // Step 3: Payout Setup
  const [payoutOption, setPayoutOption] = useState<'CHOICE' | 'FORM'>('CHOICE');
  const [bankName, setBankName] = useState('Guaranty Trust Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountHolderType, setAccountHolderType] = useState<'Individual' | 'Business / Organization'>('Individual');
  const [holderFullName, setHolderFullName] = useState('');

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccessUnverified, setIsSuccessUnverified] = useState(false);

  // Complete Signup Process
  const handleCompleteRegistration = async (includeBankDetails: boolean = true) => {
    setLoading(true);
    setErrorMsg('');

    try {
      // If user is already authenticated in Supabase as an attendee, create their organizer organization directly
      if (currentAuthUser?.id && currentAuthUser.email.toLowerCase() === signUpEmail.trim().toLowerCase()) {
        const orgRes = await createOrganization(currentAuthUser.id, {
          name: orgName || `${fullName}'s Organization`,
          type: (orgType === 'Event Agency' ? 'AGENCY' : orgType === 'Registered Business' ? 'BUSINESS' : 'INDIVIDUAL') as any,
          country: country || 'Nigeria',
          phone_number: phoneNumber || currentAuthUser.phoneNumber || '',
        });

        if (orgRes.success && orgRes.organization) {
          if (includeBankDetails && accountNumber) {
            try {
              await addPayoutAccount(orgRes.organization.id, {
                account_type: accountHolderType === 'Individual' ? 'INDIVIDUAL' : 'BUSINESS',
                account_holder_name: holderFullName || fullName || currentAuthUser.fullName,
                bank_name: bankName,
                bank_code: '058',
                account_number: accountNumber,
              });
            } catch (payoutErr) {
              console.warn('Payout account setup notice:', payoutErr);
            }
          }
          setLoading(false);
          if (onSuccess) onSuccess(currentAuthUser);
          return;
        } else {
          setErrorMsg(orgRes.error || 'Failed to create organization. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Store pending organization setup in localStorage so it persists until email verification + login
      const pendingKey = `pending_organizer_${signUpEmail.trim().toLowerCase()}`;
      localStorage.setItem(
        pendingKey,
        JSON.stringify({
          orgName,
          orgType,
          country,
          phoneNumber,
          fullName,
          bankName: includeBankDetails ? bankName : '',
          accountNumber: includeBankDetails ? accountNumber : '',
          accountHolderType,
          holderFullName,
        })
      );

      // Register user account with Supabase Auth as ORGANIZER
      const signUpRes = await signUpOrganizer({
        fullName,
        email: signUpEmail,
        phoneNumber,
        password: signUpPassword,
        role: 'ORGANIZER',
        redirectTo: '/organizer',
      });

      if (!signUpRes.success) {
        setErrorMsg(signUpRes.error || 'Failed to create user account.');
        setLoading(false);
        return;
      }

      setSignInEmail(signUpEmail);

      if (signUpRes.requiresEmailVerification) {
        setIsSuccessUnverified(true);
        setLoading(false);
        return;
      }

      // If email verification was not required / autoconfirmed
      const signInRes = await signInOrganizer({ email: signUpEmail, password: signUpPassword });
      if (signInRes.success && signInRes.user) {
        const orgRes = await createOrganization(signInRes.user.id, {
          name: orgName || 'My Organization',
          type: (orgType === 'Event Agency' ? 'AGENCY' : orgType === 'Registered Business' ? 'BUSINESS' : 'INDIVIDUAL') as any,
          country: country || 'Nigeria',
          phone_number: phoneNumber,
        });

        if (orgRes.success && orgRes.organization && includeBankDetails && accountNumber) {
          await addPayoutAccount(orgRes.organization.id, {
            account_type: accountHolderType === 'Individual' ? 'INDIVIDUAL' : 'BUSINESS',
            account_holder_name: holderFullName || fullName,
            bank_name: bankName,
            bank_code: '058',
            account_number: accountNumber,
          });
        }
        localStorage.removeItem(pendingKey);
        setLoading(false);
        if (onSuccess) onSuccess(signInRes.user);
      } else {
        setMode('signin');
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'An error occurred during account registration.');
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!signUpEmail.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!orgName.trim()) {
      setErrorMsg('Organization name is required.');
      return;
    }
    setStep(3);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!signInEmail.trim() || !signInPassword) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    const result = await signInOrganizer({ email: signInEmail, password: signInPassword });

    if (result.success) {
      const activeUser = result.user;
      if (activeUser?.id) {
        // Check for pending organization setup
        const pendingKey = `pending_organizer_${signInEmail.trim().toLowerCase()}`;
        const pendingRaw = localStorage.getItem(pendingKey);
        if (pendingRaw) {
          try {
            const pending = JSON.parse(pendingRaw);
            const orgRes = await createOrganization(activeUser.id, {
              name: pending.orgName || 'My Organization',
              type: (pending.orgType === 'Event Agency' ? 'AGENCY' : pending.orgType === 'Registered Business' ? 'BUSINESS' : 'INDIVIDUAL') as any,
              country: pending.country || 'Nigeria',
              phone_number: pending.phoneNumber || '',
            });

            if (orgRes.success && orgRes.organization && pending.accountNumber) {
              await addPayoutAccount(orgRes.organization.id, {
                account_type: pending.accountHolderType === 'Individual' ? 'INDIVIDUAL' : 'BUSINESS',
                account_holder_name: pending.holderFullName || pending.fullName,
                bank_name: pending.bankName || 'Guaranty Trust Bank',
                bank_code: '058',
                account_number: pending.accountNumber,
              });
            }
            localStorage.removeItem(pendingKey);
          } catch (err) {
            console.error('Failed to apply pending organization setup:', err);
          }
        }
      }

      setLoading(false);
      if (onSuccess) onSuccess(activeUser);
    } else {
      setLoading(false);
      setErrorMsg(result.error || 'Invalid email or password.');
    }
  };

  const handleResendVerification = async () => {
    if (!signUpEmail) return;
    setResendStatus('sending');
    setResendMsg('');
    const res = await resendVerificationEmail(signUpEmail);
    if (res.success) {
      setResendStatus('sent');
      setResendMsg('Verification email resent successfully! Please check your inbox and spam folder.');
    } else {
      setResendStatus('error');
      setResendMsg(res.error || 'Failed to resend verification email.');
    }
  };

  if (isSuccessUnverified) {
    return (
      <div className="min-h-screen bg-[#365870] flex flex-col justify-center items-center p-6 text-slate-900 antialiased">
        <div className="max-w-md w-full bg-white border border-slate-100 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-[#00b894]/15 border border-[#00b894]/30 text-[#00b894] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Verify Your Email</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We sent a verification link to <strong className="text-slate-900">{signUpEmail}</strong>. Please click the link to activate your organizer account.
            </p>
          </div>

          {resendMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start space-x-2 text-left ${
                resendStatus === 'sent'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {resendStatus === 'sent' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{resendMsg}</span>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-[11px] text-slate-600 text-left space-y-1.5">
            <p className="font-semibold text-slate-800">Didn’t receive the email?</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              <li>Check your <strong>Spam</strong> or <strong>Junk</strong> folder.</li>
              <li>Wait 30–60 seconds for email delivery.</li>
              <li>Click the resend button below to request a new email.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setIsSuccessUnverified(false);
                setMode('signin');
              }}
              className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3 px-4 rounded-xl cursor-pointer transition-all shadow-md text-xs flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I’ve Verified My Email — Sign In</span>
            </button>

            <button
              onClick={handleResendVerification}
              disabled={resendStatus === 'sending'}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl cursor-pointer transition-all text-xs"
            >
              {resendStatus === 'sending' ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#365870] flex items-center justify-center p-4 sm:p-6 lg:p-10 text-slate-800 antialiased font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col lg:flex-row min-h-[620px]">
        
        {/* LEFT COLUMN: FORM CONTENT */}
        <div className="flex-1 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Header Brand Logo */}
            <div className="flex items-center space-x-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl bg-[#00b894] text-white flex items-center justify-center font-black text-xl shadow-md relative overflow-hidden">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-white rounded-r-full"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 bg-white rounded-l-full"></div>
                <span>T</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">TICKETA</span>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'signup' ? (
              /* SIGN UP STEPS */
              <div>
                {step === 1 && (
                  /* STEP 1: CREATE ACCOUNT */
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Create Your Organizer Account
                      </h1>
                      <p className="mt-2 text-xs sm:text-sm text-slate-500">
                        Set up your organizer account to start selling tickets and managing events.
                      </p>
                    </div>

                    <form onSubmit={handleStep1Submit} className="space-y-4 text-xs sm:text-sm">
                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00b894]">
                            <User className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00b894]">
                            <Mail className="h-4 w-4" />
                          </div>
                          <input
                            type="email"
                            required
                            placeholder="Email Address"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00b894]">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            type={showPassword1 ? 'text' : 'password'}
                            required
                            placeholder="Password"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword1(!showPassword1)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showPassword1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00b894]">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            type={showPassword2 ? 'text' : 'password'}
                            required
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword2(!showPassword2)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs sm:text-sm mt-4"
                      >
                        Continue
                      </button>
                    </form>
                  </div>
                )}

                {step === 2 && (
                  /* STEP 2: ORGANIZATION DETAILS */
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Tell us about your organization
                      </h1>
                      <p className="mt-2 text-xs sm:text-sm text-slate-500">
                        Help us understand who you are to offer the best event management experience.
                      </p>
                    </div>

                    <form onSubmit={handleStep2Submit} className="space-y-4 text-xs sm:text-sm">
                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00b894]">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="Organization Name"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00b894]">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <select
                            value={orgType}
                            onChange={(e) => setOrgType(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all appearance-none cursor-pointer text-xs sm:text-sm"
                          >
                            <option value="Event Agency">Event Agency</option>
                            <option value="Individual Organizer">Individual Organizer</option>
                            <option value="Registered Business">Registered Business</option>
                            <option value="Non-Profit / NGO">Non-Profit / NGO</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#00b894]">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00b894]">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all appearance-none cursor-pointer text-xs sm:text-sm"
                          >
                            <option value="Nigeria">Nigeria</option>
                            <option value="Ghana">Ghana</option>
                            <option value="Côte d’Ivoire">Côte d’Ivoire</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#00b894]">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center space-x-1.5 pointer-events-none text-slate-600 font-medium text-xs">
                            <span className="text-base">{countryData[country]?.flag || '🇳🇬'}</span>
                            <span>{countryData[country]?.code || '+234'}</span>
                          </div>
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full pl-24 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-xs transition-all flex items-center"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" /> Back
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs sm:text-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {step === 3 && (
                  /* STEP 3: PAYOUT SETTINGS */
                  <div>
                    {payoutOption === 'CHOICE' ? (
                      /* CHOICE CARDS */
                      <div className="space-y-6">
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Set Up How You'll Get Paid
                          </h1>
                          <p className="mt-2 text-xs sm:text-sm text-slate-500">
                            Add your payout details to receive ticket sales earnings.
                          </p>
                        </div>

                        <div className="space-y-4 pt-2">
                          {/* Option 1: Set up payout now */}
                          <div className="border border-slate-200 rounded-2xl p-5 hover:border-[#00b894] transition-all bg-slate-50/30">
                            <div className="flex items-start space-x-3.5">
                              <div className="w-10 h-10 rounded-xl bg-[#00b894]/15 text-[#00b894] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Landmark className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Set Up Payout Now</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Connect your bank account to receive earnings.</p>
                                <button
                                  type="button"
                                  onClick={() => setPayoutOption('FORM')}
                                  className="mt-3.5 w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                                >
                                  Add Bank Account
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Option 2: Skip for now */}
                          <div className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all bg-slate-50/30">
                            <div className="flex items-start space-x-3.5">
                              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Skip for Now</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Set up payout later in the settings.</p>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleCompleteRegistration(false)}
                                  className="mt-3.5 w-full border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center"
                                >
                                  {loading ? (
                                    <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <span>Skip for Now</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* PAYOUT BANK DETAILS FORM */
                      <div className="space-y-5">
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Set up your payout account
                          </h1>
                          <p className="mt-1 text-xs sm:text-sm text-slate-500">
                            This is where we'll send your ticket sales revenue
                          </p>
                        </div>

                        <div className="space-y-4 pt-1 text-xs">
                          {/* Country & Currency */}
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs mb-2">Country & Currency</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2 p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-700 font-medium">
                                <span className="text-base">{countryData[country]?.flag || '🇳🇬'}</span>
                                <span>{country}</span>
                              </div>
                              <div className="flex items-center space-x-2 p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-700 font-medium">
                                <div className="w-4 h-4 rounded-full bg-[#00b894] text-white text-[10px] flex items-center justify-center font-bold">
                                  {countryData[country]?.currencySymbol || '₦'}
                                </div>
                                <span>{countryData[country]?.currency || 'NGN'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Bank Account Details */}
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs mb-2">Bank Account Details</h4>
                            <div className="space-y-2.5">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <div className="w-5 h-5 rounded bg-orange-600 text-white text-[9px] font-black flex items-center justify-center">GT</div>
                                </div>
                                <select
                                  value={bankName}
                                  onChange={(e) => setBankName(e.target.value)}
                                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#00b894] focus:bg-white appearance-none cursor-pointer"
                                >
                                  <option value="Guaranty Trust Bank">Guaranty Trust Bank</option>
                                  <option value="Zenith Bank">Zenith Bank</option>
                                  <option value="Access Bank">Access Bank</option>
                                  <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                                  <option value="Kuda Microfinance Bank">Kuda Microfinance Bank</option>
                                  <option value="United Bank for Africa">United Bank for Africa</option>
                                  <option value="Sterling Bank">Sterling Bank</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#00b894]">
                                  <ChevronDown className="h-4 w-4" />
                                </div>
                              </div>

                              <input
                                type="text"
                                maxLength={11}
                                placeholder="Account number (up to 11 digits)"
                                value={accountNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                  setAccountNumber(val);
                                }}
                                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs"
                              />

                              {accountName && (
                                <input
                                  type="text"
                                  readOnly
                                  value={accountName}
                                  className="w-full px-3.5 py-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-800 font-bold focus:outline-none text-xs"
                                />
                              )}
                            </div>
                          </div>

                          {/* Account holder type */}
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs mb-2">Account holder type</h4>
                            <div className="flex items-center space-x-6">
                              <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700">
                                <input
                                  type="radio"
                                  name="holderType"
                                  checked={accountHolderType === 'Individual'}
                                  onChange={() => setAccountHolderType('Individual')}
                                  className="accent-[#00b894] w-4 h-4 cursor-pointer"
                                />
                                <span>Individual</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700">
                                <input
                                  type="radio"
                                  name="holderType"
                                  checked={accountHolderType === 'Business / Organization'}
                                  onChange={() => setAccountHolderType('Business / Organization')}
                                  className="accent-[#00b894] w-4 h-4 cursor-pointer"
                                />
                                <span>Business / Organization</span>
                              </label>
                            </div>

                            <div className="mt-2.5 space-y-1">
                              <label className="block text-xs font-semibold text-slate-700">
                                {accountHolderType === 'Individual' ? 'Full Name' : 'Business Name'}
                              </label>
                              <input
                                type="text"
                                placeholder={accountHolderType === 'Individual' ? 'Full Name' : 'Registered Business Name'}
                                value={holderFullName}
                                onChange={(e) => setHolderFullName(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Your bank details are encrypted and securely stored.</span>
                          </div>

                          <div className="flex items-center space-x-3 pt-2">
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleCompleteRegistration(true)}
                              className="flex-1 bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all cursor-pointer text-xs text-center flex items-center justify-center"
                            >
                              {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span>Save bank account</span>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleCompleteRegistration(false)}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer text-xs text-center flex items-center justify-center"
                            >
                              <span>Skip for now</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* SIGN IN FORM ("Welcome back") */
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome back
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500">
                    Sign in to manage your events, sales, and payouts.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00b894]">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#00b894]">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:bg-white transition-all text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="text-right mt-1.5">
                      <a href="#forgot" className="text-xs text-[#00b894] hover:underline font-medium">
                        Forgot your password?
                      </a>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-center space-x-2 disabled:opacity-60 mt-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Continue</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* FOOTER SWITCHERS */}
          <div className="pt-8 text-center text-xs text-slate-600 font-medium">
            {mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                  }}
                  className="text-[#00b894] font-bold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            ) : (
              <p>
                Don't have an organizer account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setStep(1);
                    setErrorMsg('');
                  }}
                  className="text-[#00b894] font-bold hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: GRAPHIC PANEL WITH MINT BACKDROP & STEPPER */}
        <div className="w-full lg:w-1/2 bg-[#f2fbf8] p-8 lg:p-12 flex flex-col justify-between items-center border-t lg:border-t-0 lg:border-l border-emerald-100/60 relative overflow-hidden">
          
          {/* Mint Circular Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#d5f5ed] via-[#e8f8f5] to-emerald-50/30 -z-0"></div>

          {/* Illustration Container */}
          <div className="relative z-10 my-auto w-full max-w-md flex flex-col items-center justify-center py-6">
            {mode === 'signup' && step === 1 && <OnboardingIllustrationStep1 />}
            {mode === 'signup' && step === 2 && <OnboardingIllustrationStep2 />}
            {mode === 'signup' && step === 3 && <OnboardingIllustrationStep3 />}
            {mode === 'signin' && <OnboardingIllustrationStep4 />}
          </div>

          {/* Stepper Dots (1 - 2 - 3) */}
          {mode === 'signup' && (
            <div className="relative z-10 flex items-center space-x-3 pt-4">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= 1 ? 'bg-[#00b894] text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                1
              </div>
              <div className={`w-6 h-0.5 ${step >= 2 ? 'bg-[#00b894]' : 'bg-slate-200'}`}></div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= 2 ? 'bg-[#00b894] text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </div>
              <div className={`w-6 h-0.5 ${step >= 3 ? 'bg-[#00b894]' : 'bg-slate-200'}`}></div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= 3 ? 'bg-[#00b894] text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                3
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

/* VECTOR ILLUSTRATION COMPONENTS matching the exact artwork from screenshots */

function OnboardingIllustrationStep1() {
  return (
    <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 rounded-full bg-emerald-200/40 blur-3xl"></div>

      {/* Main Graphic Elements */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-48 h-32 bg-white rounded-2xl shadow-xl border border-emerald-100/80 p-4 relative flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[#00b894]">
              <User className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="w-20 h-2 bg-slate-200 rounded"></div>
              <div className="w-12 h-1.5 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="w-16 h-2 bg-emerald-100 rounded"></div>
            <div className="w-6 h-6 rounded-full bg-[#00b894] text-white flex items-center justify-center text-[10px]">✓</div>
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute -top-3 -right-2 bg-white p-2.5 rounded-2xl shadow-lg border border-emerald-100 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-[#00b894]" />
          <div className="text-[10px] font-bold text-slate-700">Events Active</div>
        </div>

        <div className="absolute -bottom-2 -left-2 bg-white p-2.5 rounded-2xl shadow-lg border border-emerald-100 flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-[#00b894]" />
          <div className="text-[10px] font-bold text-slate-700">Mobile Tickets</div>
        </div>
      </div>
    </div>
  );
}

function OnboardingIllustrationStep2() {
  return (
    <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-emerald-200/40 blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col items-center space-y-4">
        {/* Organization Building / Storefront SVG Graphic */}
        <div className="w-52 bg-white p-5 rounded-3xl shadow-xl border border-emerald-100 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] flex items-center justify-center mx-auto border border-emerald-100">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Flytimefest</h4>
            <p className="text-[10px] text-slate-400 font-medium">Event Agency • Nigeria</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-around text-[10px] text-slate-600 font-bold">
            <span className="text-[#00b894]">12 Events</span>
            <span>•</span>
            <span>Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingIllustrationStep3() {
  return (
    <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-emerald-200/40 blur-3xl"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-48 bg-white p-5 rounded-3xl shadow-xl border border-emerald-100 space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#00b894]/15 text-[#00b894] flex items-center justify-center mx-auto">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#00b894]">Payout Connected</span>
            <h4 className="font-bold text-slate-800 text-xs mt-0.5">Guaranty Trust Bank</h4>
            <p className="text-[10px] text-slate-400 mt-1">•••• 4829 • NGN Revenue</p>
          </div>
          <div className="bg-emerald-50 p-2 rounded-xl text-[10px] text-emerald-700 font-bold flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted & Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingIllustrationStep4() {
  return (
    <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-emerald-200/40 blur-3xl"></div>

      <div className="relative z-10 w-full max-w-[260px] bg-white p-5 rounded-3xl shadow-2xl border border-emerald-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Organizer Portal</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Total Sales</span>
            <span className="font-extrabold text-[#00b894]">₦ 2,450,000</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#00b894] h-full w-3/4 rounded-full"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="block font-bold text-slate-800 text-xs">1,240</span>
            <span className="text-slate-400">Tickets Sold</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="block font-bold text-slate-800 text-xs">98.4%</span>
            <span className="text-slate-400">Checked In</span>
          </div>
        </div>
      </div>
    </div>
  );
}
