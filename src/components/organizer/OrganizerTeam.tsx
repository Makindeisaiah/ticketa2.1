import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Mail, UserCheck, AlertCircle, X } from 'lucide-react';
import { OrgMemberRole } from '../../types/database';
import { getOrganizationMembers, inviteOrganizationMember } from '../../services/organizerService';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white">Team Members &amp; Permissions</h2>
          <p className="text-xs text-slate-400">
            Manage organization members, assign roles, and delegate scanner check-in rights
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-4">
          Organization Members ({members.length})
        </h3>

        <div className="divide-y divide-slate-800/60">
          {members.map((mem) => (
            <div key={mem.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#00b894]/20 text-[#00b894] font-black text-xs flex items-center justify-center border border-[#00b894]/30">
                  {mem.full_name ? mem.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <span className="block font-bold text-white text-xs">{mem.full_name}</span>
                  <span className="block text-[10px] text-slate-400">{mem.email}</span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  mem.role === 'OWNER'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : mem.role === 'ADMIN'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-300'
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Invite Team Member</h3>

            {error && (
              <div className="bg-rose-500/10 text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">User Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Organization Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as OrgMemberRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-xs outline-none"
                >
                  <option value="ADMIN">Admin (Full Event &amp; Finance access)</option>
                  <option value="MANAGER">Manager (Event setup &amp; Orders)</option>
                  <option value="MEMBER">Member / Scanner Staff</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold py-3 rounded-xl shadow-lg mt-2 cursor-pointer"
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
