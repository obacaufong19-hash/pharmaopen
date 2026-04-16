'use client';
import { useEffect, useState, useRef } from 'react';

// Custom Premium Logo Component
const Logo = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className="relative w-10 h-10 flex items-center justify-center">
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

export default function Home() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [isVisible, setIsVisible] = useState(false); // For staggered entry
  const [now, setNow] = useState(new Date());
  const lastScrollY = useRef(0);

  const loadData = async () => {
    setIsSyncing(true);
    setIsVisible(false); // Reset visibility for animation
    try {
      const { supabase } = await import('./utils/supabase');
      const { data } = await supabase.from('pharmacies').select('*');
      if (data) {
        setList(data);
        // Trigger staggered animation after data is set
        setTimeout(() => setIsVisible(true), 100);
      }
    } catch (err) { console.error("Sync failed"); }
    finally { setTimeout(() => setIsSyncing(false), 800); }
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
    if (p.is_open === null || p.is_open === undefined) return { color: 'bg-zinc-400', label: 'Unknown' };
    if (!p.is_open) return { color: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]', label: 'Closed' };
    if (p.closing_time) {
      try {
        const [h, m] = p.closing_time.split(':').map(Number);
        const closeDate = new Date(now);
        closeDate.setHours(h, m, 0);
        const diff = (closeDate.getTime() - now.getTime()) / 60000;
        if (diff > 0 && diff <= 60) return { color: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]', label: 'Closing Soon' };
      } catch (e) {}
    }
    return { color: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]', label: 'Open' };
  };

  if (!mounted) return null;

  return (
    <div className={`${isDarkMode ? 'dark bg-zinc-950 text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen font-sans transition-colors duration-500 pb-10`}>
      
      {/* Header logic remains the same */}
      <div className={`sticky top-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`${isDarkMode ? 'bg-zinc-950/80' : 'bg-[#F2F2F7]/80'} backdrop-blur-xl p-6 pb-4`}>
          <header className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo isDarkMode={isDarkMode} />
              <div>
                <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Bula Health
                </h1>
                <div className="h-[2px] w-8 bg-blue-500/30 rounded-full mt-[-2px]" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={loadData} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-sm'}`}>
                <span className={`text-sm ${isSyncing ? 'animate-spin' : ''}`}>🔄</span>
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-sm'}`}>
                <span className="text-sm">{isDarkMode ? '🌙' : '☀️'}</span>
              </button>
            </div>
          </header>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Find a pharmacy..." 
              className={`w-full p-4 rounded-2xl border-none shadow-sm outline-none text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500/20 ${isDarkMode ? 'bg-zinc-900/50 text-white placeholder:text-zinc-600' : 'bg-white text-black placeholder:text-gray-300'}`}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {['All', 'Suva', 'Lami', 'Navua'].map(loc => (
                <button 
                  key={loc} 
                  onClick={() => setFilter(loc)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filter === loc ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-gray-400')}`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 -mt-4">
        <div className="grid gap-4">
          {list
            .filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) && (filter === 'All' || p.address?.toLowerCase().includes(filter.toLowerCase())))
            .map((p, index) => {
              const status = getStatusData(p);
              return (
                <div 
                  key={p.id} 
                  // STAGGERED ANIMATION CLASSES
                  style={{ 
                    transitionDelay: `${index * 50}ms`, // Each card waits slightly longer
                  }}
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
                    <a href={`https://wa.me/${p.phone_number?.replace(/\s+/g, '')}?text=Bula!`} target="_blank" className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-600'}`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}