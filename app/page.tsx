'use client';
import { useEffect, useState, useRef } from 'react';

// 1. Premium SVG Logo Component
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

// 2. Skeleton Card Component
const SkeletonCard = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className={`p-5 rounded-[32px] flex items-center justify-between border animate-pulse ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white border-transparent shadow-sm'}`}>
    <div className="flex-1 pr-4 space-y-3">
      <div className={`h-4 w-3/4 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
      <div className={`h-3 w-1/2 rounded-full ${isDarkMode ? 'bg-zinc-800/50' : 'bg-gray-50'}`} />
    </div>
    <div className="flex gap-2">
      <div className={`w-11 h-11 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
      <div className={`w-11 h-11 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`} />
    </div>
  </div>
);

export default function Home() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [now, setNow] = useState(new Date());
  const lastScrollY = useRef(0);

  const loadData = async () => {
    setIsSyncing(true);
    setIsVisible(false);
    try {
      const { supabase } = await import('./utils/supabase');
      const { data } = await supabase.from('pharmacies').select('*');
      if (data) {
        setList(data);
        setTimeout(() => {
          setIsVisible(true);
          setIsSyncing(false);
        }, 800); 
      }
    } catch (err) {
      console.error("Sync failed");
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDarkMode(true);
      const handleScroll = () => {
        if (window.scrollY > lastScrollY.current && window.scrollY > 80) setShowHeader(false);
        else setShowHeader(true);
        lastScrollY.current = window.scrollY;
      };
      window.addEventListener('scroll', handleScroll);
      loadData();
      const timer = setInterval(() => setNow(new Date()), 60000);
      return () => {
        window.removeEventListener('scroll', handleScroll);
        clearInterval(timer);
      };
    }
  }, []);

  const getStatusData = (p: any) => {
    if (p.is_open === null || p.is_open === undefined) return { color: 'bg-zinc-400', label: 'Unknown', open: true };
    if (!p.is_open) return { color: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]', label: 'Closed', open: false };
    if (p.closing_time) {
      try {
        const [h, m] = p.closing_time.split(':').map(Number);
        const closeDate = new Date(now);
        closeDate.setHours(h, m, 0);
        const diff = (closeDate.getTime() - now.getTime()) / 60000;
        if (diff > 0 && diff <= 60) return { color: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]', label: 'Closing Soon', open: true };
      } catch (e) {}
    }
    return { color: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]', label: 'Open', open: true };
  };

  if (!mounted) return null;

  const filteredItems = list.filter(p => {
    const status = getStatusData(p);
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.address?.toLowerCase().includes(filter.toLowerCase());
    const matchesOpen = showOnlyOpen ? status.open : true;
    return matchesSearch && matchesFilter && matchesOpen;
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-[#09090b] text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen font-sans transition-colors duration-700 pb-10`}>
      
      {/* 3. STICKY HEADER CONTAINER */}
      <div className={`sticky top-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`${isDarkMode ? 'bg-[#09090b]/90 border-zinc-800/50' : 'bg-[#F2F2F7]/90 border-white/20'} backdrop-blur-2xl p-6 pb-4 border-b shadow-sm`}>
          
          {/* Logo & Controls */}
          <header className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo isDarkMode={isDarkMode} />
              <div>
                <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent leading-none">
                  Bula Health
                </h1>
                <div className="h-[2px] w-6 bg-blue-500/40 rounded-full mt-1" />
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <button 
                onClick={loadData}
                disabled={isSyncing}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shadow-sm ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
              >
                {!isSyncing ? (
                   <svg className={`w-5 h-5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                ) : (
                  <svg className="w-6 h-6 animate-spin text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                    <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </button>

              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative w-14 h-8 rounded-full transition-all duration-500 p-1 border shadow-inner ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-200 border-zinc-300'}`}
              >
                <div className={`w-6 h-6 rounded-full shadow-lg flex items-center justify-center transition-all duration-500 transform ${isDarkMode ? 'translate-x-6 bg-zinc-950 text-blue-400' : 'translate-x-0 bg-white text-orange-500'}`}>
                  {isDarkMode ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> : <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7a5 5 0 100 10 5 5 0 000-10zM2 13h2a1 1 0 100-2H2a1 1 0 100 2zm18 0h2a1 1 0 100-2h-2a1 1 0 100 2zM11 2v2a1 1 0 102 0V2a1 1 0 10-2 0zm0 18v2a1 1 0 102 0v-2a1 1 0 10-2 0zM5.99 4.58a1 1 0 111.41 1.41L6.34 7.05a1 1 0 11-1.41-1.41l1.06-1.06z"/></svg>}
                </div>
              </button>
            </div>
          </header>

          <div className="space-y-4">
            {/* PINNED SEARCH BAR */}
            <div className={`sticky top-0 z-10 py-1 ${isDarkMode ? 'bg-[#09090b]/5' : 'bg-[#F2F2F7]/5'}`}>
              <input 
                type="text" 
                placeholder="Search pharmacies..." 
                className={`w-full p-4 rounded-2xl border-none shadow-sm outline-none text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500/20 ${isDarkMode ? 'bg-zinc-900/60 text-white placeholder:text-zinc-600' : 'bg-white text-black placeholder:text-gray-300'}`}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {/* SCROLLABLE FILTERS (Underneath Search) */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1 -mx-6 px-6 relative z-0">
              <button 
                onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border
                  ${showOnlyOpen 
                    ? 'bg-green-500 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                    : (isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-gray-400 shadow-sm')}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${showOnlyOpen ? 'bg-white animate-pulse' : 'bg-green-500'}`} />
                Open Now
              </button>

              <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-800 shrink-0 mx-1" />

              {['All', 'Suva', 'Lami', 'Navua', 'Nasinu', 'Nausori'].map(loc => (
                <button 
                  key={loc} 
                  onClick={() => setFilter(loc)}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border
                    ${filter === loc 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] scale-105' 
                      : (isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-gray-400 shadow-sm')}`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-xl mx-auto p-6 -mt-4">
        <div className="grid gap-4">
          {isSyncing ? (
            [1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} isDarkMode={isDarkMode} />)
          ) : (
            filteredItems.map((p, index) => {
              const status = getStatusData(p);
              return (
                <div 
                  key={p.id} 
                  style={{ transitionDelay: `${index * 50}ms` }}
                  className={`p-5 rounded-[32px] flex items-center justify-between border transition-all duration-700 transform 
                    ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
                    ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white border-transparent shadow-sm'}
                    hover:scale-[1.01] active:scale-[0.98]
                  `}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${status.color}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.color}`}></span>
                      </div>
                      <h2 className="text-[17px] font-bold leading-tight tracking-tight">{p.name}</h2>
                    </div>
                    <p className={`${isDarkMode ? 'text-zinc-500' : 'text-gray-400'} text-[11px] font-bold uppercase tracking-wide`}>{status.label} • {p.address}</p>
                  </div>

                  <div className="flex gap-2">
                    <a href={`tel:${p.phone_number}`} className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </a>
                    <a href={`https://wa.me/${p.phone_number?.replace(/\s+/g, '')}?text=Bula! I'm inquiring about...`} target="_blank" rel="noopener noreferrer" className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-600'}`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}