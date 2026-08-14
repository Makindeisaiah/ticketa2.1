import React, { useState } from 'react';
import { Search, MapPin, Calendar, ShieldCheck, UserCheck, RefreshCw, Zap, ArrowRight, Music, Cpu, Smile, Flame } from 'lucide-react';
import { SeedEventData } from '../data/seedEvents';
import { EventCard } from '../components/EventCard';

interface HomePageProps {
  events: SeedEventData[];
  onSelectEvent: (event: SeedEventData) => void;
  onNavigateToBrowse: (params?: { category?: string; searchQuery?: string }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ events, onSelectEvent, onNavigateToBrowse }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const trendingEvents = events.filter((e) => e.is_trending || e.is_featured).slice(0, 8);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateToBrowse({ searchQuery });
  };

  const categories = [
    {
      name: 'Concert',
      slug: 'concert',
      icon: Music,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Tech & Startups',
      slug: 'tech-startups',
      icon: Cpu,
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Comedy',
      slug: 'comedy',
      icon: Smile,
      image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Festivals',
      slug: 'festivals',
      icon: Flame,
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      
      {/* Hero Section */}
      <section className="relative min-h-[480px] lg:min-h-[520px] bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16 text-white overflow-hidden">
        {/* Background Overlay Image matching Figma */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1920&q=80"
            alt="Concert background"
            className="w-full h-full object-cover opacity-25 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Find Events &amp; <br />
            <span className="text-[#00b894]">Buy Tickets Easily</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto font-normal">
            Concert, tech events, comedy shows and more all in one place
          </p>

          {/* Search Bar Widget matching Figma */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-white/20 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-2 text-slate-800 text-left"
          >
            {/* Event Name / Artist */}
            <div className="sm:col-span-5 flex items-center px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200/60 focus-within:ring-2 focus-within:ring-[#00b894]">
              <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Event name / Artist"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-900 placeholder-slate-400 font-medium"
              />
            </div>

            {/* Location */}
            <div className="sm:col-span-3 flex items-center px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200/60 focus-within:ring-2 focus-within:ring-[#00b894]">
              <MapPin className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-900 placeholder-slate-400 font-medium"
              />
            </div>

            {/* Date */}
            <div className="sm:col-span-2 flex items-center px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200/60 focus-within:ring-2 focus-within:ring-[#00b894]">
              <Calendar className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-900 placeholder-slate-400 font-medium"
              />
            </div>

            {/* Search Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full h-full bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Popular Categories
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.slug}
              onClick={() => onNavigateToBrowse({ category: cat.slug })}
              className="group relative h-36 sm:h-44 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
                <span className="text-white font-bold text-base sm:text-lg group-hover:text-[#00b894] transition-colors">
                  {cat.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Trending Events
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Popular concerts, festivals, and live comedy shows</p>
          </div>

          <button
            onClick={() => onNavigateToBrowse()}
            className="text-xs sm:text-sm font-semibold text-[#00b894] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {trendingEvents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trendingEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} onClick={onSelectEvent} />
            ))}
          </div>
        ) : (
          <div className="text-center py-14 px-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 mb-1">No upcoming events yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no active public events. Stay tuned or check back later!
            </p>
          </div>
        )}
      </section>

      {/* Trust Badges matching Figma */}
      <section className="bg-slate-50 border-y border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center tracking-tight">
            Feel confident Buying Tickets on Ticketa
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00b894] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Secure Payments</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Safe and encrypted transactions.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00b894] flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Verified Organizers</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Only trusted event organizers.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00b894] flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Easy Refunds</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Simple, stress-free refunds.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00b894] flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Fast Payouts</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Get paid quickly and securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
