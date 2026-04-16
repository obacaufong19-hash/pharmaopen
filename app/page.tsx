'use client';
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [now, setNow] = useState(new Date());
  const lastScrollY = useRef(0);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const { supabase } = await import('./utils/supabase');
      const { data } = await supabase.from('pharmacies').select('*');
      if (data) setList(data);
    } catch (err) {
      console.error("Sync failed");
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDarkMode(true);
      setIsOnline(navigator.onLine);

      const handleScroll = () => {
        if (window.scrollY > lastScrollY.current && window.scrollY > 100) setShowHeader(false);
        else setShowHeader(true);
        lastScrollY.current = window.scrollY;
      };

      const timer = setInterval(() => setNow(new Date()), 60000);
      window.addEventListener('scroll', handleScroll);
      loadData();

      return () => {
        window.removeEventListener('scroll', handleScroll);
        clearInterval(timer);
      };
    }
  }, []);

  // Logic for the Blinking Status Light
  const getStatusData = (p: any) => {
    if (p.is_open === null || p.is_open === undefined) return { color: 'bg-zinc-400', label: 'Unknown' };
    if (!p.is_open) return { color: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]', label: 'Closed' };

    // Check for "Almost Closing" (within 60 mins)
    if (p.closing_time) {
      try {
        const [hours, minutes] = p.closing_time.split(':').map(Number);
        const closeDate = new Date(now);
        closeDate.setHours(hours, minutes, 0);
        const diff = (closeDate.getTime() - now.getTime()) / 60000;
        if (diff > 0 && diff <= 60) {
          return { color: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]', label: 'Closing Soon' };
        }
      } catch (e) { /* Fallback to open */ }
    }

    return { color: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]', label: 'Open' };
  };

  if (!mounted) return null;

  const filteredList = list.filter(p => {
    const nameMatch = p.name?.toLowerCase().includes(search.toLowerCase());
    const areaMatch = filter === 'All' ? true : p.address?.toLowerCase().includes(filter.toLowerCase());
    return nameMatch && areaMatch;
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-zinc-950 text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen font-sans transition-colors duration-500 pb-10`}>
      
      <div className={`sticky top-0 z-50 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className={`${isDarkMode ? 'bg-zinc-950/90' : 'bg-[#F2F2F7]/90'} backdrop-blur-md p-6 pb-4`}>
          <header className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-black">Bula Health 🌴</h1>
            <div className="flex gap-2">
              <button onClick={loadData} className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}>
                <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}>
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>
          </header>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Search..." 
              className={`w-full p-3.5 rounded-2xl outline-none text-sm ${isDarkMode ? 'bg-zinc-900 text-white placeholder:text-zinc-600' : 'bg-white text-black'}`}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {['All', 'Suva', 'Lami', 'Navua'].map(loc => (
                <button 
                  key={loc} 
                  onClick={() => setFilter(loc)}
                  className={`px-5 py-2 rounded-xl text-[11px] font-black transition-all ${filter === loc ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-gray-400')}`}
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
          {filteredList.map((p) => {
            const status = getStatusData(p);
            return (
              <div key={p.id} className={`p-5 rounded-[28px] flex items-center justify-between border transition-all ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white border-transparent shadow-sm'}`}>
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    {/* VISIBLE BLINKING STATUS LIGHT */}
                    <div className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.color}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${status.color}`}></span>
                    </div>
                    <h2 className="text-lg font-black leading-tight">{p.name}</h2>
                  </div>
                  <p className={`${isDarkMode ? 'text-zinc-500' : 'text-gray-400'} text-[11px] font-bold uppercase tracking-wide`}>{status.label} • {p.address}</p>
                </div>

                <div className="flex gap-2">
                  <a href={`tel:${p.phone_number}`} className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </a>
                  <a href={`https://wa.me/${p.phone_number?.replace(/\s+/g, '')}?text=Bula!`} target="_blank" className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all ${isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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