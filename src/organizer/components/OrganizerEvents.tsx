import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  Globe,
  Tag,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
} from 'lucide-react';
import { updateEventStatus } from '../services/organizerService';
import { EventStatus } from '../../types/database';

interface OrganizerEventsProps {
  events: any[];
  orgId: string;
  userId: string;
  onOpenCreateModal: () => void;
  onRefreshEvents: () => void;
}

export const OrganizerEvents: React.FC<OrganizerEventsProps> = ({
  events,
  orgId,
  userId,
  onOpenCreateModal,
  onRefreshEvents,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredEvents = events.filter((e) => {
    if (filterStatus === 'ALL') return true;
    return e.status === filterStatus;
  });

  const handleStatusChange = async (eventId: string, newStatus: EventStatus) => {
    const success = await updateEventStatus(eventId, newStatus, userId, orgId);
    if (success) {
      onRefreshEvents();
    } else {
      alert('Failed to update event status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white">Events &amp; Ticketing Inventory</h2>
          <p className="text-xs text-slate-400">
            Manage live published events, draft configurations, venue details, and ticket tiers
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-2 rounded-2xl max-w-md">
        {['ALL', 'PUBLISHED', 'DRAFT', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-[#00b894] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((evt) => {
          const isPublished = evt.status === 'PUBLISHED';
          return (
            <div
              key={evt.id}
              className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all hover:border-slate-700"
            >
              <div>
                <div className="h-44 bg-slate-900 relative overflow-hidden">
                  <img
                    src={evt.banner_image_url}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${
                        isPublished
                          ? 'bg-emerald-500/90 text-white'
                          : evt.status === 'DRAFT'
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-rose-500/90 text-white'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-extrabold text-base text-white line-clamp-1">{evt.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {evt.description || 'No description provided.'}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-[#00b894]" />
                      <span>{new Date(evt.start_time).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-400">
                      {evt.is_online ? (
                        <>
                          <Globe className="w-3.5 h-3.5 text-[#00b894]" />
                          <span>Online Stream</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-[#00b894]" />
                          <span className="truncate">
                            {evt.venues?.name || evt.venues?.city || 'Main Venue'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {evt.ticket_types && evt.ticket_types.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Ticket Tiers ({evt.ticket_types.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {evt.ticket_types.map((tt: any) => (
                          <span
                            key={tt.id}
                            className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg text-[10px] font-bold"
                          >
                            {tt.name}: ₦{Number(tt.price).toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-800/80 flex items-center justify-between mt-4">
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {evt.id.slice(0, 8)}...
                </span>

                <div className="flex items-center space-x-2">
                  {isPublished ? (
                    <button
                      onClick={() => handleStatusChange(evt.id, 'CANCELLED')}
                      className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 cursor-pointer"
                    >
                      Cancel Event
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(evt.id, 'PUBLISHED')}
                      className="text-xs font-bold text-[#00b894] hover:text-emerald-300 bg-[#00b894]/10 px-3 py-1.5 rounded-xl border border-[#00b894]/20 cursor-pointer"
                    >
                      Publish Live
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
