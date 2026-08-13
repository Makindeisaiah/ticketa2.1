import React, { useState } from 'react';
import { Building2, Globe, Phone, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { OrganizerType } from '../../types/database';
import { createOrganization, CreateOrganizationInput } from '../../services/organizerService';

interface OrganizerOnboardingModalProps {
  userId: string;
  onSuccess: (org: any) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const OrganizerOnboardingModal: React.FC<OrganizerOnboardingModalProps> = ({
  userId,
  onSuccess,
  onClose,
  canClose = true,
}) => {
  const [formData, setFormData] = useState<CreateOrganizationInput>({
    name: '',
    type: 'INDIVIDUAL',
    country: 'Nigeria',
    phone_number: '',
    description: '',
    website: '',
    logo_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Organization name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createOrganization(userId, formData);
    setLoading(false);

    if (res.success && res.organization) {
      onSuccess(res.organization);
    } else {
      setError(res.error || 'Failed to create organization. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative text-slate-100 animate-in fade-in zoom-in-95">
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#00b894]/20 border border-[#00b894]/30 text-[#00b894] font-black text-2xl flex items-center justify-center mx-auto shadow-lg">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white">Create Your Organization</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Set up your organization entity on Ticketa 2.0 to publish events and sell tickets with Supabase.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Organization Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lagos Music Festival Group, Apex Events"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Entity Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as OrganizerType })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all cursor-pointer"
              >
                <option value="INDIVIDUAL">Individual Organizer</option>
                <option value="BUSINESS">Registered Business</option>
                <option value="NON_PROFIT">Non-Profit / NGO</option>
                <option value="AGENCY">Event Agency</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Country</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="+234 800 000 0000"
                  value={formData.phone_number || ''}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl pl-10 pr-4 py-3 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Website URL</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="url"
                  placeholder="https://myorg.com"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl pl-10 pr-4 py-3 text-white text-xs outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Short Bio / Description</label>
            <textarea
              rows={2}
              placeholder="Tell attendees about your organization and event hosting history..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none transition-all placeholder:text-slate-600 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Organization &amp; Open Dashboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
