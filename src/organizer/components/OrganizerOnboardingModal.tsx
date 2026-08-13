import React, { useState } from 'react';
import { Building2, Sparkles, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { OrganizerType } from '../../types/database';
import { createOrganization, CreateOrganizationInput } from '../services/organizerService';

interface OrganizerOnboardingModalProps {
  userId: string;
  onSuccess: (org: any) => void;
  onClose?: () => void;
}

export const OrganizerOnboardingModal: React.FC<OrganizerOnboardingModalProps> = ({
  userId,
  onSuccess,
  onClose,
}) => {
  const [form, setForm] = useState<CreateOrganizationInput>({
    name: '',
    type: 'INDIVIDUAL',
    country: 'Nigeria',
    phone_number: '',
    description: '',
    website: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Organization name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createOrganization(userId, form);
    setLoading(false);

    if (res.success && res.organization) {
      onSuccess(res.organization);
    } else {
      setError(res.error || 'Failed to create organization profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative text-slate-100">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00b894]/20 border border-[#00b894]/30 text-[#00b894] font-black flex items-center justify-center text-xl shadow-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create Organizer Profile</h2>
            <p className="text-xs text-slate-400">
              Set up your organization in Supabase PostgreSQL to publish events and receive payouts
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Organization / Brand Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rhythm Nation Entertainment, Tech Fest Africa"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Organizer Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as OrganizerType })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none cursor-pointer"
              >
                <option value="INDIVIDUAL">Individual Organizer</option>
                <option value="BUSINESS">Registered Business</option>
                <option value="NON_PROFIT">Non-Profit / NGO</option>
                <option value="AGENCY">Event Agency</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Country</label>
              <input
                type="text"
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="+234 800 000 0000"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Short Bio / Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of the events you host..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none resize-none placeholder:text-slate-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00b894] hover:bg-[#00a383] text-white font-bold shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Organization</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
