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
  const [activeTab, setActiveTab] = useState('home');
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
    <div className={`${isDarkMode ? 'dark bg-[#09090b] text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen font-sans transition-colors duration-700 pb-32`}>
      
      {/* 3. STICKY HEADER */}
      <div className={`sticky top-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`${isDarkMode ? 'bg-[#09090b]/90 border-zinc-800/50' : 'bg-[#F2F2F7]/90 border-white/20'} backdrop-blur-2xl p-6 pb-4 border-b shadow-sm`}>
          
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
              <button onClick={loadData} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shadow-sm ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`}>
                {isSyncing ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"/> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
              </button>

              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`relative w-14 h-8 rounded-full transition-all duration-500 p-1 border shadow-inner ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-200 border-zinc-300'}`}>
                <div className={`w-6 h-6 rounded-full shadow-lg flex items-center justify-center transition-all duration-500 transform ${isDarkMode ? 'translate-x-6 bg-zinc-950 text-blue-400' : 'translate-x-0 bg-white text-orange-500'}`}>
                  {isDarkMode ? '🌙' : '☀️'}
                </div>
              </button>
            </div>
          </header>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Search pharmacies..." 
              className={`w-full p-4 rounded-2xl border-none shadow-sm outline-none text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500/20 ${isDarkMode ? 'bg-zinc-900/60 text-white placeholder:text-zinc-600' : 'bg-white text-black placeholder:text-gray-300'}`}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1 -mx-6 px-6">
              <button 
                onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border
                  ${showOnlyOpen ? 'bg-green-500 border-green-400 text-white' : (isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-gray-400')}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${showOnlyOpen ? 'bg-white animate-pulse' : 'bg-green-500'}`} />
                Open Now
              </button>
              {['All', 'Suva', 'Lami', 'Navua', 'Nasinu', 'Nausori'].map(loc => (
                <button key={loc} onClick={() => setFilter(loc)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border ${filter === loc ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105' : (isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-gray-400')}`}>{loc}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LIST */}
      <div className="max-w-xl mx-auto p-6 -mt-4">
        <div className="grid gap-4">
          {isSyncing ? [1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} isDarkMode={isDarkMode} />) : 
            filteredItems.map((p, index) => {
              const status = getStatusData(p);
              return (
                <div key={p.id} style={{ transitionDelay: `${index * 50}ms` }} className={`p-5 rounded-[32px] flex items-center justify-between border transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white border-transparent shadow-sm'} hover:scale-[1.01] active:scale-[0.98]`}>
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                      <h2 className="text-[17px] font-bold leading-tight tracking-tight">{p.name}</h2>
                    </div>
                    <p className={`${isDarkMode ? 'text-zinc-500' : 'text-gray-400'} text-[11px] font-bold uppercase tracking-wide`}>{status.label} • {p.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${p.phone_number}`} className={`w-11 h-11 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </a>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* 4. PREMIUM NAVIGATION BAR */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100]">
        <div className={`${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-white'} backdrop-blur-2xl rounded-[32px] border p-2 shadow-2xl flex items-center justify-around overflow-hidden`}>
          
          {/* Nav Item: Home */}
          <button onClick={() => setActiveTab('home')} className={`relative flex flex-col items-center gap-1 p-3 transition-all duration-300 ${activeTab === 'home' ? 'text-blue-500' : (isDarkMode ? 'text-zinc-600' : 'text-zinc-400')}`}>
            {activeTab === 'home' && <div className="absolute inset-0 bg-blue-500/10 rounded-2xl scale-75 blur-sm" />}
            <svg className="w-6 h-6" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Health</span>
          </button>

          {/* Nav Item: Logistics (Future Placeholder) */}
          <button onClick={() => setActiveTab('vonu')} className={`relative flex flex-col items-center gap-1 p-3 transition-all duration-300 ${activeTab === 'vonu' ? 'text-blue-500' : (isDarkMode ? 'text-zinc-600' : 'text-zinc-400')}`}>
            <svg className="w-6 h-6" fill={activeTab === 'vonu' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Logistics</span>
          </button>

          {/* Nav Item: Agri-Link (Future Placeholder) */}
          <button onClick={() => setActiveTab('agri')} className={`relative flex flex-col items-center gap-1 p-3 transition-all duration-300 ${activeTab === 'agri' ? 'text-blue-500' : (isDarkMode ? 'text-zinc-600' : 'text-zinc-400')}`}>
            <svg className="w-6 h-6" fill={activeTab === 'agri' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Agri-Link</span>
          </button>

          {/* Nav Item: More/Profile */}
          <button onClick={() => setActiveTab('more')} className={`relative flex flex-col items-center gap-1 p-3 transition-all duration-300 ${activeTab === 'more' ? 'text-blue-500' : (isDarkMode ? 'text-zinc-600' : 'text-zinc-400')}`}>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${activeTab === 'more' ? 'border-blue-500' : 'border-zinc-400 dark:border-zinc-600'}`}>
              <div className={`w-3 h-3 rounded-full ${activeTab === 'more' ? 'bg-blue-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}