import React, { useState } from 'react';
import { Ticket, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignInPageProps {
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
  onSuccessRedirect?: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onNavigateToSignUp,
  onNavigateToForgotPassword,
  onSuccessRedirect,
}) => {
  const { signIn, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showUnverifiedNotice, setShowUnverifiedNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setShowUnverifiedNotice(false);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    setLoading(true);

    const result = await signIn({ email, password });

    setLoading(false);

    if (result.success) {
      if (result.user?.role === 'ORGANIZER') {
        window.history.pushState({}, '', '/organizer');
        window.dispatchEvent(new Event('popstate'));
      } else if (onSuccessRedirect) {
        onSuccessRedirect();
      }
    } else {
      if (result.error?.toLowerCase().includes('email not confirmed')) {
        setShowUnverifiedNotice(true);
      } else {
        setErrorMsg(result.error || 'Invalid email or password.');
      }
    }
  };

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
          Welcome Back to Ticketa
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-600">
          Sign in to access your digital tickets, wallet and orders
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-2xl space-y-6">

          {!isConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Demo Auth Mode Active:</strong> You can test sign-in with any valid email and password format.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Sign In Failed</span>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {showUnverifiedNotice && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Email Verification Required</span>
              </div>
              <p>
                Your email address has not been confirmed yet. Please check your email inbox for the Supabase confirmation link before logging in.
              </p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Email Field */}
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

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateToForgotPassword}
                  className="text-xs font-bold text-[#00b894] hover:text-[#00a383] cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00b894] focus:ring-2 focus:ring-[#00b894]/20 transition-all"
                />
              </div>
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
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Footer Toggle */}
          <div className="text-center border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-600">
              Don't have an attendee account?{' '}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="font-bold text-[#00b894] hover:text-[#00a383] cursor-pointer underline underline-offset-2"
              >
                Sign Up for Ticketa
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
