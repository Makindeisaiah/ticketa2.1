import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SeedEventData } from '../data/seedEvents';
import { getAllEvents, EventFilterOptions } from '../services/eventService';
import { EventCard } from '../components/EventCard';

interface BrowseEventsPageProps {
  initialCategory?: string;
  initialSearchQuery?: string;
  onSelectEvent: (event: SeedEventData) => void;
}

export const BrowseEventsPage: React.FC<BrowseEventsPageProps> = ({
  initialCategory = 'all',
  initialSearchQuery = '',
  onSelectEvent,
}) => {
  const [events, setEvents] = useState<SeedEventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [category, setCategory] = useState<string>(initialCategory);
  const [location, setLocation] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this-week' | 'this-month' | 'upcoming'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid' | 'under-50k' | 'over-50k'>('all');
  const [sortBy, setSortBy] = useState<'trending' | 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc'>('trending');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const options: EventFilterOptions = {
        searchQuery,
        category,
        location,
        dateFilter,
        priceFilter,
        sortBy,
      };
      const result = await getAllEvents(options);
      setEvents(result);
      setLoading(false);
    }
    loadData();
  }, [searchQuery, category, location, dateFilter, priceFilter, sortBy]);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(events.length / itemsPerPage) || 1;
  const paginatedEvents = events.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setLocation('all');
    setDateFilter('all');
    setPriceFilter('all');
    setSortBy('trending');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Browse Events</h1>
        <p className="text-slate-500 text-sm mt-1">Find events happening near you</p>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="space-y-4">
        
        {/* Search Bar matching Figma */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-xl px-4 py-2.5 shadow-xs focus-within:border-[#00b894] focus-within:ring-2 focus-within:ring-[#00b894]/20">
            <Search className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search events or artists"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-sm outline-none text-slate-900 placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setCurrentPage(1)}
            className="bg-[#00b894] hover:bg-[#00a383] text-white font-semibold px-8 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-sm"
          >
            Search
          </button>
        </div>

        {/* Filter Dropdowns Grid matching Figma */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            
            {/* Category Dropdown */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-slate-700 font-medium px-3 py-2 rounded-lg shadow-xs focus:outline-none focus:border-[#00b894] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="concert">Concert</option>
              <option value="tech-startups">Tech &amp; Startups</option>
              <option value="comedy">Comedy</option>
              <option value="festivals">Festivals</option>
            </select>

            {/* Location Dropdown */}
            <select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-slate-700 font-medium px-3 py-2 rounded-lg shadow-xs focus:outline-none focus:border-[#00b894] cursor-pointer"
            >
              <option value="all">All Locations</option>
              <option value="lagos">Lagos, Nigeria</option>
              <option value="washington">Washington, DC</option>
              <option value="edmonton">Edmonton, AB</option>
              <option value="chicago">Chicago, IL</option>
              <option value="london">London, UK</option>
            </select>

            {/* Date Dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-slate-700 font-medium px-3 py-2 rounded-lg shadow-xs focus:outline-none focus:border-[#00b894] cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
            </select>

            {/* Price Dropdown */}
            <select
              value={priceFilter}
              onChange={(e) => {
                setPriceFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-slate-700 font-medium px-3 py-2 rounded-lg shadow-xs focus:outline-none focus:border-[#00b894] cursor-pointer"
            >
              <option value="all">Any Price</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
              <option value="under-50k">Under ₦50,000</option>
              <option value="over-50k">Over ₦50,000</option>
            </select>

            {(category !== 'all' || location !== 'all' || priceFilter !== 'all' || searchQuery) && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}

          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <span className="text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-300 text-slate-800 font-semibold px-3 py-2 rounded-lg shadow-xs focus:outline-none focus:border-[#00b894] cursor-pointer"
            >
              <option value="trending">Trending</option>
              <option value="date-asc">Date: Soonest</option>
              <option value="date-desc">Date: Latest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

        </div>

      </div>

      {/* Showing count indicator */}
      <div className="text-xs text-slate-500 font-medium border-b border-slate-200 pb-3">
        Showing {events.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{' '}
        {Math.min(currentPage * itemsPerPage, events.length)} of {events.length} events
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#00b894] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <p className="text-base font-semibold text-slate-700">No events match your current search or filters.</p>
          <button
            onClick={resetFilters}
            className="bg-[#00b894] text-white font-semibold text-xs px-5 py-2.5 rounded-lg cursor-pointer shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {paginatedEvents.map((evt) => (
            <EventCard key={evt.id} event={evt} onClick={onSelectEvent} />
          ))}
        </div>
      )}

      {/* Pagination Bar matching Figma */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const isSelected = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#00b894] text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
