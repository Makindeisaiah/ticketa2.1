import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, Clock } from 'lucide-react';
import { AuditLog } from '../../types/database';
import { getAuditLogs } from '../services/organizerService';

interface OrganizerAuditLogsProps {
  orgId: string;
}

export const OrganizerAuditLogs: React.FC<OrganizerAuditLogsProps> = ({ orgId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    async function loadLogs() {
      if (orgId) {
        const data = await getAuditLogs(orgId);
        setLogs(data);
      }
    }
    loadLogs();
  }, [orgId]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-1">
        <h2 className="text-xl font-bold text-white">Organization Security Audit Trail</h2>
        <p className="text-xs text-slate-400">
          Immutable system log records for administrative events, staff scans, and publishing actions
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No audit log records recorded yet.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Action</th>
                <th className="pb-3 pr-4">Entity Type</th>
                <th className="pb-3 pr-4">Actor ID</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 pr-4 font-mono font-bold text-[#00b894]">{log.action}</td>
                  <td className="py-3.5 pr-4 text-slate-300 font-bold uppercase text-[10px]">
                    {log.entity_type}
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-slate-400 text-[10px]">
                    {log.actor_id || 'System'}
                  </td>
                  <td className="py-3.5 text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
