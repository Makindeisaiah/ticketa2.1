import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { OrgMemberRole } from '../../types/database';
import { getOrganizationMembers, inviteOrganizationMember } from '../services/organizerService';

interface OrganizerTeamProps {
  orgId: string;
  userId: string;
}

export const OrganizerTeam: React.FC<OrganizerTeamProps> = ({ orgId, userId }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgMemberRole>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadMembers = async () => {
    const data = await getOrganizationMembers(orgId);
    setMembers(data);
  };

  useEffect(() => {
    if (orgId) {
      loadMembers();
    }
  }, [orgId]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const res = await inviteOrganizationMember(orgId, email, role, userId);
    if (res.success) {
      setSuccessMsg(`Successfully invited ${email} as ${role}!`);
      setEmail('');
      setIsInviteOpen(false);
      loadMembers();
    } else {
      setError(res.error || 'Failed to invite team member.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Team Members &amp; Permissions</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage organization collaborators, assign roles, and delegate scanner check-in rights
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#00b894]/20 transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-[#00b894]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-4">
          Organization Members ({members.length})
        </h3>

        <div className="divide-y divide-slate-100">
          {members.map((mem) => (
            <div key={mem.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#e6faf5] text-[#00b894] font-black text-xs flex items-center justify-center border border-[#00b894]/30">
                  {mem.full_name ? mem.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <span className="block font-extrabold text-slate-900 text-xs">{mem.full_name}</span>
                  <span className="block text-[11px] text-slate-400">{mem.email}</span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  mem.role === 'OWNER'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : mem.role === 'ADMIN'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {mem.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-900">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900">Invite Team Member</h3>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">User Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-xs outline-hidden focus:border-[#00b894]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Organization Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as OrgMemberRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-xs outline-hidden focus:border-[#00b894]"
                >
                  <option value="ADMIN">Admin (Full Event &amp; Finance access)</option>
                  <option value="MANAGER">Manager (Event setup &amp; Orders)</option>
                  <option value="MEMBER">Member / Scanner Staff</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold py-3 rounded-xl shadow-md shadow-[#00b894]/20 mt-2 cursor-pointer transition-all"
              >
                Send Invite
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
