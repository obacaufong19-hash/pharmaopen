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
  const [activeTab, setActiveTab] = useState('pharmacy');
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
      
      {/* STICKY HEADER */}
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
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1 -mx-6 px-6 relative z-0">
              <button 
                onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border
                  ${showOnlyOpen ? 'bg-green-500 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : (isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-gray-400 shadow-sm')}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${showOnlyOpen ? 'bg-white animate-pulse' : 'bg-green-500'}`} />
                Open Now
              </button>
              <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-800 shrink-0 mx-1" />
              {['All', 'Suva', 'Lami', 'Navua', 'Nasinu', 'Nausori'].map(loc => (
                <button key={loc} onClick={() => setFilter(loc)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border ${filter === loc ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] scale-105' : (isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-gray-400 shadow-sm')}`}>{loc}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LIST */}
      <main className="max-w-xl mx-auto p-6 -mt-4">
        {activeTab === 'pharmacy' ? (
          <div className="grid gap-4">
            {isSyncing ? [1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} isDarkMode={isDarkMode} />) : 
              filteredItems.map((p, index) => {
                const status = getStatusData(p);
                const cleanPhone = p.phone_number?.replace(/\s+/g, '');
                return (
                  <div key={p.id} style={{ transitionDelay: `${index * 50}ms` }} className={`p-5 rounded-[32px] flex flex-col gap-4 border transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white border-transparent shadow-sm'} hover:scale-[1.01] active:scale-[0.98]`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <div className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                          <h2 className="text-[17px] font-bold leading-tight tracking-tight">{p.name}</h2>
                        </div>
                        <p className={`${isDarkMode ? 'text-zinc-500' : 'text-gray-400'} text-[11px] font-bold uppercase tracking-wide`}>{status.label} • {p.address}</p>
                      </div>
                      
                      <a href={`tel:${p.phone_number}`} className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </a>
                    </div>

                    {/* ACTION BUTTONS ROW */}
                    <div className="flex gap-2 border-t pt-4 dark:border-zinc-800/50">
                      {/* WhatsApp */}
                      <a href={`https://wa.me/${cleanPhone}`} target="_blank" className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'}`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WA
                      </a>
                      {/* Viber */}
                      <a href={`viber://contact?number=${cleanPhone}`} className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                        Viber
                      </a>
                      {/* Directions */}
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.address)}`} target="_blank" className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        Map
                      </a>
                    </div>
                  </div>
                );
              })
            }
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50"><p className="text-sm font-bold uppercase tracking-widest">{activeTab} Coming Soon</p></div>
        )}
      </main>

      {/* NAVIGATION BAR */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100]">
        <div className={`${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-white'} backdrop-blur-2xl rounded-[32px] border p-2 shadow-2xl flex items-center justify-around`}>
          <button onClick={() => setActiveTab('pharmacy')} className={`relative flex flex-col items-center gap-1 p-3 transition-all duration-300 ${activeTab === 'pharmacy' ? 'text-blue-500' : (isDarkMode ? 'text-zinc-600' : 'text-zinc-400')}`}>
            {activeTab === 'pharmacy' && <div className="absolute inset-0 bg-blue-500/10 rounded-2xl scale-75 blur-sm" />}
            <svg className="w-6 h-6" fill={activeTab === 'pharmacy' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.503 1.508a2 2 0 01-1.185 1.253l-3.328 1.109a2 2 0 01-1.63-.122L5.43 17.58a2 2 0 00-2.311.166l-1.045.836a2 2 0 00-.733 1.947l.477 2.387a2 2 0 001.414 1.96l1.508.503a2 2 0 011.253 1.185l1.109 3.328a2 2 0 01-.122 1.63L7.42 32.57a2 2 0 00.166 2.311l.836 1.045a2 2 0 001.947.733l2.387-.477a2 2 0 001.96-1.414l.503-1.508a2 2 0 011.185-1.253l3.328-1.109a2 2 0 011.63.122l1.982 1.189a2 2 0 002.311-.166l1.045-.836a2 2 0 00.733-1.947l-.477-2.387a2 2 0 00-1.414-1.96l-1.508-.503a2 2 0 01-1.253-1.185l-1.109-3.328a2 2 0 01.122-1.63l1.189-1.982a2 2 0 00-.166-2.311l-.836-1.045z"/></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Pharmacy</span>
          </button>
          <button onClick={() => setActiveTab('hospitals')} className={`flex flex-col items-center gap-1 p-3 ${activeTab === 'hospitals' ? 'text-blue-500' : 'text-zinc-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Hospitals</span>
          </button>
          <button onClick={() => setActiveTab('emergency')} className={`flex flex-col items-center gap-1 p-3 ${activeTab === 'emergency' ? 'text-red-500' : 'text-zinc-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Emergency</span>
          </button>
          <button onClick={() => setActiveTab('medpass')} className={`flex flex-col items-center gap-1 p-3 ${activeTab === 'medpass' ? 'text-blue-500' : 'text-zinc-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">Med-Pass</span>
          </button>
        </div>
      </nav>
    </div>
  );
}