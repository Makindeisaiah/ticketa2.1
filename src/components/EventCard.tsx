import React from 'react';
import { MapPin, Calendar, Ticket } from 'lucide-react';
import { SeedEventData } from '../data/seedEvents';

interface EventCardProps {
  event: SeedEventData;
  onClick: (event: SeedEventData) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  // Format price
  const prices = event.ticket_types.map((t) => t.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  
  const priceDisplay =
    minPrice === 0
      ? 'Free'
      : `From ₦${minPrice.toLocaleString()}`;

  // Format date string
  const dateObj = new Date(event.start_time);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      onClick={() => onClick(event)}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Event Poster Image */}
      <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden">
        <img
          src={event.banner_image_url}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        
        {/* Category tag */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md border border-white/10 shadow-xs">
          {event.category}
        </div>

        {/* Featured tag if applicable */}
        {event.is_featured && (
          <div className="absolute top-3 right-3 bg-[#00b894] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
            Featured
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-[#00b894] transition-colors">
            {event.title}
          </h3>
          
          {/* Date & Time */}
          <div className="mt-1.5 flex items-center text-xs text-slate-500 font-medium">
            <span className="text-[#00b894] font-semibold">{formattedDate}</span>
            <span className="mx-1.5">•</span>
            <span>{formattedTime}</span>
          </div>

          {/* Location */}
          <div className="mt-1 flex items-center text-xs text-slate-500 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
            <span className="truncate">{event.venue_name}, {event.venue_city}</span>
          </div>
        </div>

        {/* Price Action Button matching Figma mockup */}
        <button className="w-full bg-[#00b894] hover:bg-[#00a383] text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer">
          <Ticket className="w-3.5 h-3.5" />
          <span>{priceDisplay}</span>
        </button>
      </div>
    </div>
  );
};
