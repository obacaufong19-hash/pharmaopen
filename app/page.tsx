'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  useQueryClient 
} from '@tanstack/react-query';

// 1. Enterprise Cache Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // Keep in local memory for 24 hours
      retry: 2, // Auto-retry twice on failure (great for spotty 4G)
    },
  },
});

// Logo Component
const Logo = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="35" y="10" width="30" height="80" rx="15" fill="url(#logoGrad)" />
      <rect x="10" y="35" width="80" height="30" rx="15" fill="url(#logoGrad)" />
      <circle cx="50" cy="50" r="12" fill={isDarkMode ? "#09090b" : "#f2f2f7"} />
    </svg>
  </div>
);

function PharmacyAppContent() {
  const [isOnline, setIsOnline] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  // 2. Connectivity Listener
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    
    // Animation trigger
    setTimeout(() => setIsVisible(true), 100);

    const handleScroll = () => {
      if (window.scrollY > lastScrollY.current && window.scrollY > 80) setShowHeader(false);
      else setShowHeader(true);
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 3. Data Fetching with Edge Caching
  const { data: pharmacies = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data, error } = await supabase.from('pharmacies').select('*');
      if (error) throw error;
      return data;
    },
  });

  const getStatusData = (p: any) => {
    if (!p.is_open) return { color: 'bg-red-500', label: 'Closed', open: false };
    return { color: 'bg-green-500', label: 'Open', open: true };
  };

  const filteredItems = pharmacies.filter((p: any) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.address?.toLowerCase().includes(filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-[#09090b] text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen transition-colors duration-500 pb-32`}>
      
      {/* 4. Graceful Degradation Header */}
      {!isOnline && (
        <div className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest py-2 text-center sticky top-0 z-[110] animate-pulse">
          Offline Mode • Showing Last Known Data
        </div>
      )}

      {/* STICKY HEADER */}
      <div className={`sticky ${isOnline ? 'top-0' : 'top-8'} z-50 transition-all duration-500 ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`${isDarkMode ? 'bg-[#09090b]/90 border-zinc-800/50' : 'bg-[#F2F2F7]/90 border-white/20'} backdrop-blur-2xl p-6 pb-4 border-b shadow-sm`}>
          <header className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo isDarkMode={isDarkMode} />
              <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">Bula Health</h1>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => isOnline && refetch()} 
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm transition-all ${isFetching ? 'animate-spin' : 'active:scale-90'} ${!isOnline ? 'opacity-20 grayscale' : (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200')}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-11 h-11 rounded-2xl flex items-center justify-center border bg-zinc-900 border-zinc-800 text-orange-500">{isDarkMode ? '🌙' : '☀️'}</button>
            </div>
          </header>

          <input 
            type="text" 
            placeholder="Search pharmacies..." 
            className={`w-full p-4 rounded-2xl border-none shadow-sm outline-none text-sm ${isDarkMode ? 'bg-zinc-900/60 text-white placeholder:text-zinc-600' : 'bg-white text-black placeholder:text-gray-300'}`}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* MAIN LIST */}
      <main className="max-w-xl mx-auto p-6">
        {activeTab === 'pharmacy' ? (
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-20 opacity-30 font-black uppercase tracking-widest text-xs">Syncing Directory...</div>
            ) : (
              filteredItems.map((p: any, index: number) => {
                const status = getStatusData(p);
                const cleanPhone = p.phone_number?.replace(/\s+/g, '');
                return (
                  <div key={p.id} className={`p-5 rounded-[32px] flex flex-col gap-4 border transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white border-transparent shadow-sm'} hover:scale-[1.005] active:scale-[0.99]`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                          <h2 className="text-[17px] font-bold leading-tight">{p.name}</h2>
                        </div>
                        <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wide">{p.address}</p>
                      </div>
                      <a href={`tel:${p.phone_number}`} className="w-11 h-11 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </a>
                    </div>

                    <div className="flex gap-2 border-t pt-4 border-zinc-800/50">
                      <a href={`https://wa.me/${cleanPhone}`} target="_blank" className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase bg-green-500/10 text-green-400">WA</a>
                      <a href={`viber://contact?number=${cleanPhone}`} className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase bg-purple-500/10 text-purple-400">Viber</a>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.name + ' ' + p.address)}`} target="_blank" className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase bg-zinc-800 text-zinc-300">Map</a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="text-center py-20 opacity-30 font-black uppercase text-xs tracking-widest">{activeTab} Coming Soon</div>
        )}
      </main>

      {/* NAVIGATION BAR */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100]">
        <div className={`${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-white'} backdrop-blur-2xl rounded-[32px] border p-2 shadow-2xl flex items-center justify-around`}>
          {['pharmacy', 'hospitals', 'emergency', 'medpass'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`relative flex flex-col items-center gap-1 p-3 transition-all duration-300 ${activeTab === tab ? 'text-blue-500' : 'text-zinc-500'}`}>
              <div className="text-[10px] font-black uppercase tracking-tighter">{tab}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// Global Provider Wrapper
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PharmacyAppContent />
    </QueryClientProvider>
  );
}