'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [errorLog, setErrorLog] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    // Refresh "now" every minute for accurate countdowns
    const timer = setInterval(() => setNow(new Date()), 60000);

    async function loadData() {
      try {
        const { supabase } = await import('./utils/supabase');
        const { data, error } = await supabase.from('pharmacies').select('*');
        if (error) setErrorLog(error.message);
        else setList(data || []);
      } catch (err: any) {
        setErrorLog("System Error: " + err.message);
      }
    }
    loadData();
    return () => clearInterval(timer);
  }, []);

  // Failsafe time calculation
  const getClosingSoonLabel = (closingTime: string | null, isOpen: boolean) => {
    if (!closingTime || !isOpen) return null;
    try {
      const [hours, minutes] = closingTime.split(':').map(Number);
      const closeDate = new Date(now);
      closeDate.setHours(hours, minutes, 0);
      
      const diffInMs = closeDate.getTime() - now.getTime();
      const diffInMins = Math.round(diffInMs / 60000);

      if (diffInMins > 0 && diffInMins <= 60) {
        return `Closing in ${diffInMins}m`;
      }
      return null;
    } catch {
      return null; // Silent fail if string format is wrong
    }
  };

  if (!mounted) return null;

  const filteredList = list.filter(p => {
    const nameMatch = p.name?.toLowerCase().includes(search.toLowerCase());
    const areaMatch = filter === 'All' ? true : p.address?.toLowerCase().includes(filter.toLowerCase());
    return nameMatch && areaMatch;
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-zinc-950 text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen font-sans transition-colors duration-500`}>
      <div className="max-w-xl mx-auto p-6 pb-24">
        
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Bula Health 🌴</h1>
            <p className={`${isDarkMode ? 'text-zinc-500' : 'text-gray-400'} text-[10px] font-bold uppercase tracking-widest mt-1`}>
              Fiji Pharmacy Finder
            </p>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </header>

        <div className="sticky top-6 z-30 mb-8 space-y-4">
          <input 
            type="text" 
            placeholder="Search name or area..." 
            className={`w-full p-4 rounded-2xl border-none shadow-xl text-base outline-none ${isDarkMode ? 'bg-zinc-900 text-white placeholder:text-zinc-600' : 'bg-white text-black placeholder:text-gray-300'}`}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {['All', 'Suva', 'Lami', 'Navua'].map(loc => (
              <button 
                key={loc}
                onClick={() => setFilter(loc)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${filter === loc ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' : 'bg-white text-gray-400')}`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          {filteredList.map((p) => {
            const closingLabel = getClosingSoonLabel(p.closing_time, p.is_open);
            
            return (
              <div 
                key={p.id} 
                className={`p-6 rounded-[28px] shadow-sm flex flex-col gap-5 border transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-white border-transparent'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h2 className="text-xl font-black leading-tight tracking-tight mb-1">{p.name}</h2>
                    <p className={`${isDarkMode ? 'text-zinc-500' : 'text-gray-400'} text-[13px] font-medium`}>
                      {p.address}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`shrink-0 px-3 py-1.5 rounded-lg font-black text-[10px] tracking-tighter ${p.is_open ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                      {p.is_open ? '● OPEN' : '○ CLOSED'}
                    </div>
                    {closingLabel && (
                      <div className="bg-orange-500/10 text-orange-600 px-2 py-1 rounded-md text-[9px] font-black animate-pulse">
                        ⚠️ {closingLabel}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <a href={`tel:${p.phone_number}`} className="flex-1 bg-blue-600 text-white text-center py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-transform">Call Now</a>
                  <a href={`https://wa.me/${p.phone_number?.replace(/\s+/g, '')}?text=Bula!`} target="_blank" className="flex-1 bg-green-600 text-white text-center py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-green-500/20 active:scale-95 transition-transform">WhatsApp</a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}