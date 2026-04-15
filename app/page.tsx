'use client';
import { useEffect, useState } from 'react';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  lat: number;
  lng: number;
  is_open: boolean;
  closing_time: string | null;
}

export default function Home() {
  const [list, setList] = useState<Pharmacy[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    setMounted(true);
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDarkMode(true);

    async function initApp() {
      try {
        const { supabase } = await import('./utils/supabase');
        const { data, error } = await supabase.from('pharmacies').select('*');
        if (error) throw error;
        setList(data || []);
      } catch (err: any) {
        setCriticalError(err.message);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied")
      );
    }

    initApp();
  }, []);

  if (!mounted) return null;

  if (criticalError) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-red-500 mb-2">Connection Issue</h1>
        <p className="text-zinc-500 text-sm mb-6">{criticalError}</p>
        <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 rounded-full font-bold">Retry</button>
      </div>
    );
  }

  const filteredList = list
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filter === 'Open' ? p.is_open : true;
      const matchesArea = ['Suva', 'Lami', 'Navua'].includes(filter) 
        ? p.address.toLowerCase().includes(filter.toLowerCase()) : true;
      return matchesSearch && matchesStatus && matchesArea;
    })
    .sort((a, b) => {
      if (!userLoc) return 0;
      return Math.hypot(a.lat - userLoc.lat, a.lng - userLoc.lng) - Math.hypot(b.lat - userLoc.lat, b.lng - userLoc.lng);
    });

  return (
    <div className={`${isDarkMode ? 'dark bg-black text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen font-sans transition-colors duration-300`}>
      <div className="max-w-xl mx-auto p-5 pb-24">
        
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bula Health 🌴</h1>
            <p className="text-zinc-500 font-bold text-[10px] uppercase mt-1 tracking-widest">Fiji Pharmacy Finder</p>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </header>

        <div className="sticky top-4 z-20 mb-6 space-y-4">
          <input 
            type="text" 
            placeholder="Search name or street..." 
            className={`w-full p-4 rounded-2xl border-none shadow-lg text-base focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-zinc-900 text-white placeholder:text-zinc-600' : 'bg-white text-black placeholder:text-zinc-400'}`} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {['All', 'Open', 'Suva', 'Lami', 'Navua'].map((cat) => (
              <button 
                key={cat} 
                onClick={() => setFilter(cat)} 
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shadow-sm ${filter === cat ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' : 'bg-white text-zinc-500')}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {filteredList.map((p) => {
            const waMessage = encodeURIComponent(`Bula ${p.name}, do you have medicine in stock?`);
            return (
              <div key={p.id} className={`p-5 rounded-[24px] shadow-sm flex flex-col gap-4 border transition-transform active:scale-[0.98] ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-transparent'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h2 className="text-xl font-black leading-tight tracking-tight">{p.name}</h2>
                    <p className={`text-xs font-bold mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{p.address}</p>
                  </div>
                  <div className={`shrink-0 px-3 py-1 rounded-lg font-black text-[10px] tracking-tighter ${p.is_open ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                    {p.is_open ? 'OPEN NOW' : 'CLOSED'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <a href={`tel:${p.phone_number}`} className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl font-bold text-xs">Call</a>
                  <a href={`https://wa.me/${p.phone_number.replace(/\s+/g, '')}?text=${waMessage}`} target="_blank" className="flex-1 bg-green-600 text-white text-center py-3 rounded-xl font-bold text-xs">WhatsApp</a>
                </div>
              </div>
            );
          })}
          {filteredList.length === 0 && <p className="text-center py-10 text-zinc-500 font-bold">No pharmacies found in this area.</p>}
        </div>
      </div>
    </div>
  );
}