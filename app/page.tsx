'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const { supabase } = await import('./utils/supabase');
      const { data, error } = await supabase.from('pharmacies').select('*');
      if (error) throw error;
      setList(data || []);
      setErrorLog(null);
    } catch (err: any) {
      setErrorLog("Sync failed: " + err.message);
    } finally {
      // Small timeout so the user actually sees the progress circle spin
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // 1. Check Initial Theme & Online Status
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDarkMode(true);
      setIsOnline(navigator.onLine);
      
      // 2. Listen for Network Changes
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
    }

    loadData();
    
    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  if (!mounted) return null;

  const filteredList = list.filter(p => {
    const nameMatch = p.name?.toLowerCase().includes(search.toLowerCase());
    const areaMatch = filter === 'All' ? true : p.address?.toLowerCase().includes(filter.toLowerCase());
    return nameMatch && areaMatch;
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-zinc-950 text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen font-sans transition-colors duration-500 pb-20`}>
      
      {/* 1. Online/Offline Banner */}
      {!isOnline && (
        <div className="bg-orange-500 text-white text-[10px] font-black text-center py-1 tracking-widest uppercase sticky top-0 z-50 animate-pulse">
          Offline Mode — Viewing Cached Data
        </div>
      )}

      <div className="max-w-xl mx-auto p-6">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Bula Health 🌴</h1>
            <p className={`${isDarkMode ? 'text-zinc-500' : 'text-gray-400'} text-[10px] font-bold uppercase tracking-widest mt-1`}>
              Fiji Pharmacy Finder
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* 2. Sync Button with Progress Circle */}
            <button 
              onClick={loadData}
              disabled={isSyncing}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}
            >
              <div className={`${isSyncing ? 'animate-spin' : ''} transition-transform`}>
                {isSyncing ? (
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : '🔄'}
              </div>
            </button>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        {errorLog && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-6 text-xs font-mono">
            {errorLog}
          </div>
        )}

        <div className="sticky top-6 z-30 mb-8 space-y-4">
          <input 
            type="text" 
            placeholder="Search pharmacies..." 
            className={`w-full p-4 rounded-2xl border-none shadow-xl outline-none ${isDarkMode ? 'bg-zinc-900 text-white placeholder:text-zinc-600' : 'bg-white text-black'}`}
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
          {filteredList.map((p) => (
            <div 
              key={p.id} 
              className={`p-6 rounded-[28px] shadow-sm flex flex-col gap-5 border transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800/50' : 'bg-white border-transparent'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <h2 className="text-xl font-black tracking-tight mb-1">{p.name}</h2>
                  <p className={`${isDarkMode ? 'text-zinc-500' : 'text-gray-400'} text-[13px] font-medium`}>
                    {p.address}
                  </p>
                </div>
                <div className={`shrink-0 px-3 py-1.5 rounded-lg font-black text-[10px] tracking-tighter ${p.is_open ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                  {p.is_open ? '● OPEN' : '○ CLOSED'}
                </div>
              </div>

              <div className="flex gap-3">
                <a href={`tel:${p.phone_number}`} className="flex-1 bg-blue-600 text-white text-center py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-transform">Call</a>
                <a href={`https://wa.me/${p.phone_number?.replace(/\s+/g, '')}?text=Bula!`} target="_blank" className="flex-1 bg-green-600 text-white text-center py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-green-500/20 active:scale-95 transition-transform">WhatsApp</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}