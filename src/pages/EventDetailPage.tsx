import React, { useState } from 'react';
import { Calendar, MapPin, CheckCircle, ChevronRight, Minus, Plus, Share2, Mail, ExternalLink, ShieldCheck } from 'lucide-react';
import { SeedEventData } from '../data/seedEvents';
import { EventCard } from '../components/EventCard';

interface EventDetailPageProps {
  event: SeedEventData;
  allEvents: SeedEventData[];
  onSelectEvent: (event: SeedEventData) => void;
  onNavigateToCheckout: (event: SeedEventData, selectedQuantities: Record<string, number>) => void;
  onNavigateToBrowse: () => void;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({
  event,
  allEvents,
  onSelectEvent,
  onNavigateToCheckout,
  onNavigateToBrowse,
}) => {
  // Quantities state per ticket type name
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    event.ticket_types.forEach((tt, idx) => {
      // Default first tier to 2 tickets like Figma screenshot if available!
      initial[tt.name] = idx === 0 ? 2 : 0;
    });
    return initial;
  });

  const updateQuantity = (typeName: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[typeName] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [typeName]: next };
    });
  };

  const totalTicketsSelected = Object.values(quantities).reduce((a: number, b: number) => a + b, 0);

  const handleContinueToCheckout = () => {
    if (totalTicketsSelected === 0) return;
    onNavigateToCheckout(event, quantities);
  };

  // Related events
  const relatedEvents = allEvents
    .filter((e) => e.id !== event.id)
    .slice(0, 4);

  const formattedDate = new Date(event.start_time).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(event.start_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb Navigation matching Figma */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <button onClick={onNavigateToBrowse} className="hover:text-slate-900 cursor-pointer">
          Browse Events
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{event.title}</span>
      </nav>

      {/* Main Grid: Left Details vs Right Ticket Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Poster & Detailed Description */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* High-res Event Poster Banner */}
          <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900">
            <img
              src={event.banner_image_url}
              alt={event.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>

          {/* About the Event / Artist */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">
              About the event
            </h2>
            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-bold text-slate-900">Date &amp; Time</h3>
            <div className="flex items-center space-x-3 text-sm text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <Calendar className="w-5 h-5 text-[#00b894] flex-shrink-0" />
              <span>{formattedDate} &nbsp;•&nbsp; {formattedTime}</span>
            </div>
          </div>

          {/* Location & Map Preview */}
          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-bold text-slate-900">Location</h3>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#00b894] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{event.venue_name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{event.venue_address}</p>
                </div>
              </div>

              {/* Map Box Placeholder */}
              <div className="relative h-48 w-full bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center group">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80"
                  alt="Venue map"
                  className="w-full h-full object-cover opacity-60"
                />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${event.venue_name} ${event.venue_address}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold px-4 py-2 rounded-lg shadow-md flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#00b894]" />
                  <span>View on Google Maps</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Ticket Selection & Organizer Card */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          {/* Event Title & Ticket Selector Widget */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-6">
            
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{event.title}</h1>
                
                <div className="mt-2 space-y-1 text-xs text-slate-600 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#00b894]" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00b894]" />
                    <span>{event.venue_name}</span>
                  </div>
                </div>
              </div>

              <span className="bg-emerald-100 text-[#00b894] font-semibold text-[11px] px-2.5 py-1 rounded-full flex-shrink-0">
                Upcoming
              </span>
            </div>

            {/* Ticket Tiers Counter List matching Figma */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Select Tickets</span>
              
              {event.ticket_types.map((tt) => {
                const qty = quantities[tt.name] || 0;
                return (
                  <div
                    key={tt.name}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{tt.name}</span>
                      <span className="text-xs font-semibold text-[#00b894]">
                        {tt.price === 0 ? 'Free' : `₦${tt.price.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 bg-white border border-slate-300 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(tt.name, -1)}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                        disabled={qty === 0}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-bold text-slate-900 text-sm">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(tt.name, 1)}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Action Button */}
            <button
              onClick={handleContinueToCheckout}
              disabled={totalTicketsSelected === 0}
              className="w-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-98"
            >
              Continue ({totalTicketsSelected} {totalTicketsSelected === 1 ? 'ticket' : 'tickets'})
            </button>

          </div>

          {/* Event Organizer Profile Card matching Figma */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Event Organizer</span>
            
            <div className="flex items-center space-x-3">
              <img
                src={event.organizer_logo}
                alt={event.organizer_name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-slate-900 text-sm">{event.organizer_name}</h3>
                  <CheckCircle className="w-4 h-4 text-[#00b894] fill-[#00b894] stroke-white" />
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Verified Organizer</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {event.organizer_description}
            </p>

            <button
              onClick={() => alert(`Connecting you to organizer: ${event.organizer_name}`)}
              className="w-full border border-[#00b894] text-[#00b894] hover:bg-[#00b894]/10 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Organizer</span>
            </button>
          </div>

          {/* Refund Policy Card matching Figma */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Refund Policy</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>All ticket sales are final unless the event organizer states otherwise.</li>
              <li>Refund requests must be submitted at least 48 hours before start time.</li>
              <li>Service fees are non-refundable once a ticket has been purchased.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* Related Events Section matching Figma */}
      <div className="border-t border-slate-200 pt-10 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Related Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {relatedEvents.map((evt) => (
            <EventCard key={evt.id} event={evt} onClick={onSelectEvent} />
          ))}
        </div>
      </div>

    </div>
  );
};
