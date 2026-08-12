import React, { useState } from 'react';
import { Ticket, Mail, AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ForgotPasswordPageProps {
  onNavigateToSignIn: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateToSignIn }) => {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);

    const result = await resetPassword(email);

    setLoading(false);

    if (result.success) {
      setIsSent(true);
    } else {
      setErrorMsg(result.error || 'Failed to request password reset.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Header Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#00b894] flex items-center justify-center text-white shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Reset Password
        </h2>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-slate-600">
          Enter your registered email address to receive password reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-2xl space-y-6">

          {isSent ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-[#00b894] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-lg">Reset Link Sent</h3>
                <p className="text-xs text-slate-600">
                  If an account exists for <strong className="text-slate-900">{email}</strong>, you will receive password reset instructions in your inbox shortly.
                </p>
              </div>

              <button
                onClick={onNavigateToSignIn}
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Reset Request Failed</span>
                    <p>{errorMsg}</p>
                  </div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </button>
              </form>

              <div className="text-center border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
