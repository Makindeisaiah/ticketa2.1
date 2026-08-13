import React, { useState } from 'react';
import { Ticket, Mail, Lock, User, Phone, AlertCircle, ArrowRight, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OrganizerAuthProps {
  onSuccess?: () => void;
}

export const OrganizerAuth: React.FC<OrganizerAuthProps> = ({ onSuccess }) => {
  const { signIn, signUpAttendee, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccessUnverified, setIsSuccessUnverified] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!signInEmail.trim() || !signInPassword) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    const result = await signIn({ email: signInEmail, password: signInPassword });
    setLoading(false);

    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.error || 'Invalid credentials. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!signUpEmail.trim()) {
      setErrorMsg('Valid email address is required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await signUpAttendee({
      fullName,
      email: signUpEmail,
      phoneNumber,
      password: signUpPassword,
    });
    setLoading(false);

    if (result.success) {
      if (result.requiresEmailVerification) {
        setIsSuccessUnverified(true);
      } else {
        if (onSuccess) onSuccess();
      }
    } else {
      setErrorMsg(result.error || 'Failed to create organizer account.');
    }
  };

  if (isSuccessUnverified) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-[#00b894] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Verify Your Email</h2>
            <p className="text-xs text-slate-400">
              We sent a verification link to <strong className="text-white">{signUpEmail}</strong>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl text-xs text-slate-300 text-left space-y-2 border border-slate-800">
            <span className="font-bold text-white block">Next steps:</span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-400">
              <li>Open your email inbox and click the verification link.</li>
              <li>Return to Ticketa Organizer Portal and sign in.</li>
            </ol>
          </div>

          <button
            onClick={() => {
              setIsSuccessUnverified(false);
              setMode('signin');
            }}
            className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 px-4 rounded-xl cursor-pointer transition-all shadow-lg text-xs"
          >
            Go to Organizer Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Logo & Branding */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00b894] to-emerald-400 flex items-center justify-center text-white shadow-xl">
            <Building2 className="w-8 h-8" />
          </div>
        </div>

        <h2 className="mt-5 text-center text-2xl sm:text-3xl font-black text-white tracking-tight">
          Ticketa Organizer Portal
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-400">
          {mode === 'signin'
            ? 'Sign in to manage your organizations, events and ticket sales'
            : 'Create an organizer account to start hosting events & selling tickets'}
        </p>

        {/* Tab Toggle */}
        <div className="mt-6 bg-slate-900 border border-slate-800 p-1 rounded-2xl flex items-center text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer text-center ${
              mode === 'signin' ? 'bg-[#00b894] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Organizer Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer text-center ${
              mode === 'signup' ? 'bg-[#00b894] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Organizer Account
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 border border-slate-800 sm:rounded-3xl shadow-2xl space-y-6">
          {!isConfigured && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Demo Auth Mode:</strong> Sign in or register with any valid email and password format.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Authentication Error</span>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {mode === 'signin' ? (
            /* Sign In Form */
            <form className="space-y-4 text-xs" onSubmit={handleSignIn}>
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="organizer@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 text-xs mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Sign Up Form */
            <form className="space-y-4 text-xs" onSubmit={handleSignUp}>
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Makinde Isaiah O"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Organizer Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="organizer@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="+2347033295471"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00b894] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 text-xs mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Organizer Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center border-t border-slate-800/80 pt-4">
            <a
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
            >
              ← Go to Ticketa Attendee Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
