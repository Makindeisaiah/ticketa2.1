import React, { useState } from 'react';
import { User, Mail, Phone, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, LogOut, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfilePageProps {
  onNavigateToTickets: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateToTickets }) => {
  const { user, signOut, updatePassword, refreshProfile } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4">
        <User className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Not Signed In</h2>
        <p className="text-xs text-slate-500">Please sign in to view and manage your attendee profile.</p>
      </div>
    );
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPwLoading(true);

    const res = await updatePassword(newPassword);

    setPwLoading(false);

    if (res.success) {
      setPwMsg({ type: 'success', text: 'Your password has been updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwMsg({ type: 'error', text: res.error || 'Failed to update password.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-[#00b894]/10 border border-[#00b894]/30 flex items-center justify-center text-[#00b894] font-black text-2xl">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900">{user.fullName}</h1>
              <span className="bg-emerald-100 text-[#00b894] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateToTickets}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Ticket className="w-4 h-4" />
            <span>My Ticket Wallet</span>
          </button>
          
          <button
            onClick={signOut}
            className="border border-slate-300 text-rose-600 hover:bg-rose-50 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Profile Information */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <User className="w-5 h-5 text-[#00b894]" />
            <span>Profile Details</span>
          </h2>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Full Name</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                {user.fullName}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Email Address</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 flex items-center justify-between">
                <span>{user.email}</span>
                {user.isEmailVerified ? (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Phone Number</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900">
                {user.phoneNumber || 'Not provided'}
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Account Role</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 flex items-center justify-between">
                <span className="font-bold">{user.role}</span>
                <span className="text-[11px] text-slate-500">Attendee Platform Permissions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security / Update Password */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-[#00b894]" />
            <span>Security &amp; Password</span>
          </h2>

          {pwMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                pwMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {pwMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{pwMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#00b894]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#00b894]"
              />
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs py-3 px-4 rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center space-x-2"
            >
              {pwLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
