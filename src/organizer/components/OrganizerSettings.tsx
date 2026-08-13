import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Organization, OrganizerType } from '../../types/database';
import { supabase } from '../../lib/supabase';

interface OrganizerSettingsProps {
  activeOrg: Organization;
  onRefreshOrg: () => void;
}

export const OrganizerSettings: React.FC<OrganizerSettingsProps> = ({ activeOrg, onRefreshOrg }) => {
  const [form, setForm] = useState({
    name: activeOrg.name || '',
    type: activeOrg.type || ('INDIVIDUAL' as OrganizerType),
    country: activeOrg.country || 'Nigeria',
    phone_number: activeOrg.phone_number || '',
    website: activeOrg.website || '',
    logo_url: activeOrg.logo_url || '',
    description: activeOrg.description || '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const { error } = await supabase
      .from('organizations')
      .update({
        name: form.name,
        type: form.type,
        country: form.country,
        phone_number: form.phone_number || null,
        website: form.website || null,
        logo_url: form.logo_url || null,
        description: form.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeOrg.id);

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Organization settings updated successfully!');
      onRefreshOrg();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-1">
        <h2 className="text-xl font-bold text-white">Organization Profile &amp; Settings</h2>
        <p className="text-xs text-slate-400">
          Update public organizer branding, contact details, and location
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Organization Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Organizer Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as OrganizerType })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none"
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
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Phone Number</label>
              <input
                type="text"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Website URL</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Logo Image URL</label>
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-white text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Description / Bio</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-2.5 text-white text-xs outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
