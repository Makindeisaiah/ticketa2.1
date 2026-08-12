import React, { useState } from 'react';
import { Ticket, Mail, Lock, User, Phone, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignUpPageProps {
  onNavigateToSignIn: () => void;
  onSuccessRedirect?: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onNavigateToSignIn,
  onSuccessRedirect,
}) => {
  const { signUpAttendee, isConfigured } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccessUnverified, setIsSuccessUnverified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Valid email address is required.');
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setLoading(true);

    const result = await signUpAttendee({
      fullName,
      email,
      phoneNumber,
      password,
    });

    setLoading(false);

    if (result.success) {
      if (result.requiresEmailVerification) {
        setIsSuccessUnverified(true);
      } else {
        if (onSuccessRedirect) {
          onSuccessRedirect();
        }
      }
    } else {
      setErrorMsg(result.error || 'Failed to create account.');
    }
  };

  if (isSuccessUnverified) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-100 text-[#00b894] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Check Your Email</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              We sent a verification link to <strong className="text-slate-900">{email}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 text-left space-y-2 border border-slate-200">
            <span className="font-bold text-slate-900 block">Next steps:</span>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open your email inbox and click the verification link.</li>
              <li>Return to Ticketa and sign in with your credentials.</li>
            </ol>
          </div>

          <button
            onClick={onNavigateToSignIn}
            className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Header Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#00b894] flex items-center justify-center text-white shadow-md">
            <Ticket className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Create Attendee Account
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-600">
          Join Ticketa to purchase event tickets and access your digital wallet
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-2xl space-y-6">

          {!isConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Demo Auth Active:</strong> Account creation will immediately register your attendee profile locally.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Registration Error</span>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Makinde Isaiah O"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/20 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/20 transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="+2347033295471"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/20 transition-all"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/20 transition-all"
                />
              </div>
            </div>

            {/* Account Role notice */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#00b894] flex-shrink-0" />
              <span>Registering as an <strong>Attendee</strong>. You can buy tickets and manage your wallet.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Footer Toggle */}
          <div className="text-center border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToSignIn}
                className="font-bold text-[#00b894] hover:text-[#00a383] cursor-pointer underline underline-offset-2"
              >
                Sign In
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
