import React, { useState } from 'react';
import { X, Ticket, Mail, Lock, User, Phone, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'signin' | 'signup';
  actionTitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
  actionTitle = 'Sign in to continue your ticket checkout',
}) => {
  const { signIn, signUpAttendee, resendVerificationEmail } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unverifiedSuccess, setUnverifiedSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMsg, setResendMsg] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signInEmail.trim() || !signInPassword) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setLoading(true);

    const res = await signIn({ email: signInEmail, password: signInPassword });

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to sign in.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signUpName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }

    if (!signUpEmail.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }

    if (!signUpPhone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    const res = await signUpAttendee({
      fullName: signUpName,
      email: signUpEmail,
      phoneNumber: signUpPhone,
      password: signUpPassword,
    });

    setLoading(false);

    if (res.success) {
      if (res.requiresEmailVerification) {
        setUnverifiedSuccess(true);
      } else {
        onSuccess();
        onClose();
      }
    } else {
      setErrorMsg(res.error || 'Failed to create account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#00b894] flex items-center justify-center text-white mx-auto shadow-xs">
            <Ticket className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-black text-slate-900">{actionTitle}</h3>
          
          {/* Tabs */}
          {!unverifiedSuccess && (
            <div className="flex bg-slate-200 p-1 rounded-xl max-w-xs mx-auto mt-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {unverifiedSuccess ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00b894] border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">Check Your Email</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A verification link was sent to <strong className="text-slate-900">{signUpEmail}</strong>. Please check your inbox or spam folder to activate your account.
                </p>
              </div>

              {resendMsg && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] flex items-start space-x-1.5 text-left ${
                    resendStatus === 'sent'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {resendStatus === 'sent' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{resendMsg}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 text-left space-y-1">
                <p className="font-semibold text-slate-800">Didn’t receive the email?</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li>Check your <strong>Spam</strong> / <strong>Junk</strong> folder.</li>
                  <li>Click resend below to request a new link.</li>
                </ul>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setUnverifiedSuccess(false);
                    setSignInEmail(signUpEmail);
                    setMode('signin');
                  }}
                  className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I’ve Verified — Sign In</span>
                </button>

                <button
                  onClick={async () => {
                    if (!signUpEmail) return;
                    setResendStatus('sending');
                    setResendMsg('');
                    const res = await resendVerificationEmail(signUpEmail);
                    if (res.success) {
                      setResendStatus('sent');
                      setResendMsg('Verification email resent! Please check your inbox & spam folder.');
                    } else {
                      setResendStatus('error');
                      setResendMsg(res.error || 'Failed to resend verification email.');
                    }
                  }}
                  disabled={resendStatus === 'sending'}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 rounded-xl cursor-pointer transition-all"
                >
                  {resendStatus === 'sending' ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {mode === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00b894]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00b894]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs py-3 rounded-xl cursor-pointer shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In &amp; Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Makinde Isaiah O"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00b894]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00b894]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+2347033295471"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00b894]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 chars"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00b894]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Confirm</label>
                      <input
                        type="password"
                        required
                        placeholder="Re-enter"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#00b894]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs py-3 rounded-xl cursor-pointer shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Account &amp; Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
