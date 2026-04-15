'use client';
import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';

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
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    
    // 1. Safe Theme Check
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    // 2. Safe Data Fetch
    const fetchInitialData = async () => {
      setIsSyncing(true);
      try {
        const { data } = await supabase.from('pharmacies').select('*');
        if (data) setList(data as Pharmacy[]);
      } catch (e) {
        console.error("Supabase fail:", e);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchInitialData();

    // 3. Ultra-Safe Geolocation (The likely crash point)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos.coords) {
            setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        },
        (err) => console.warn("Location denied:", err.message),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Prevent hydration errors
  if (!mounted) return <div className="min-h-screen bg-zinc-950" />;

  const getClosingSnippet = (closingTime: string | null) => {
    if (!closingTime || !currentTime) return null;
    try {
      const [hours, minutes] = closingTime.split(':').map(Number);
      const closeDate = new Date(currentTime);
      closeDate.setHours(hours, minutes, 0);
      const diffMins = Math.round((closeDate.getTime() - currentTime.getTime()) / 60000);
      return (diffMins > 0 && diffMins <= 120) ? `Closing in ${diffMins}m` : null;
    } catch { return null; }
  };

  const filteredList = list
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filter === 'Open' ? p.is_open : true;
      const matchesArea = ['Suva', 'Lami', 'Navua'].includes(filter) 
        ? p.address.toLowerCase().includes(filter.toLowerCase()) : true;
      return matchesSearch && matchesStatus && matchesArea;
    })
    .sort((a, b) => {
      if (!userLoc) return 0;
      // Distance formula with safety check
      const distA = Math.sqrt(Math.pow(a.lat - userLoc.lat, 2) + Math.pow(a.lng - userLoc.lng, 2));
      const distB = Math.sqrt(Math.pow(b.lat - userLoc.lat, 2) + Math.pow(b.lng - userLoc.lng, 2));
      return distA - distB;
    });

  return (
    <div className={`${isDarkMode ? 'dark bg-black text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen font-sans transition-colors duration-300`}>
      <div className="max-w-xl mx-auto p-5 pb-24">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bula Health 🌴</h1>
            <p className="text-zinc-500 font-bold text-[10px] uppercase mt-1 tracking-widest">Pharmacy Tracker</p>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </header>

        <div className="sticky top-4 z-20 mb-6 space-y-4">
          <input 
            type="text" 
            placeholder="Search name or area..." 
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
            const closingSoon = p.is_open ? getClosingSnippet(p.closing_time) : null;
            const waMessage = encodeURIComponent(`Bula ${p.name}, do you have medicine in stock?`);
            
            return (
              <div key={p.id} className={`p-5 rounded-[24px] shadow-sm flex flex-col gap-4 border transition-transform active:scale-[0.98] ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-transparent'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-black leading-tight tracking-tight">{p.name}</h2>
                    <p className={`text-xs font-bold mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{p.address}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg font-black text-[10px] tracking-tighter ${p.is_open ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                    {p.is_open ? 'OPEN NOW' : 'CLOSED'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <a href={`tel:${p.phone_number}`} className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl font-bold text-xs">Call</a>
                  <a href={`https://wa.me/${p.phone_number.replace(/\s+/g, '')}?text=${waMessage}`} target="_blank" className="flex-1 bg-green-600 text-white text-center py-3 rounded-xl font-bold text-xs">WhatsApp</a>
                </div>

                {closingSoon && (
                  <div className="bg-orange-500/10 py-2 px-3 rounded-lg flex items-center gap-2">
                    <span className="text-orange-500 animate-pulse">●</span>
                    <span className="text-orange-500 font-bold text-[10px] uppercase tracking-wider">{closingSoon}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}