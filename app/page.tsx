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
}

export default function Home() {
  const [list, setList] = useState<Pharmacy[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  const fetchPharmacies = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const { data } = await supabase.from('pharmacies').select('*');
      if (data) setList(data as Pharmacy[]);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  useEffect(() => {
    fetchPharmacies();
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDarkMode(true);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location denied")
      );
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredList = list
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filter === 'Open' ? p.is_open : true;
      const matchesArea = ['Suva', 'Lami', 'Navua'].includes(filter) 
        ? p.address.toLowerCase().includes(filter.toLowerCase()) 
        : true;
      return matchesSearch && matchesStatus && matchesArea;
    })
    .sort((a, b) => {
      if (!userLoc) return 0;
      const distA = Math.hypot(a.lat - userLoc.lat, a.lng - userLoc.lng);
      const distB = Math.hypot(b.lat - userLoc.lat, b.lng - userLoc.lng);
      return distA - distB;
    });

  const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  return (
    <div style={{ fontFamily: fontStack }} className={`${isDarkMode ? 'dark bg-black text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen transition-colors duration-300`}>
      
      {!isOnline && (
        <div className="bg-red-500 text-white text-[11px] font-bold py-2 text-center sticky top-0 z-50">
          No Internet Connection
        </div>
      )}

      <div className="max-w-xl mx-auto p-5 pb-24">
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bula Health 🌴</h1>
            <p className="text-gray-500 font-semibold text-xs mt-1">
              {isOnline ? '● Connected' : '○ Working Offline'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={fetchPharmacies} className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isSyncing ? 'animate-spin' : ''} ${isDarkMode ? 'bg-zinc-800' : 'bg-white'}`}>
              🔄
            </button>
          </div>
        </header>

        <div className="sticky top-4 z-10 mb-6 space-y-4">
          <input 
            type="text" 
            placeholder="Search Pharmacies" 
            className={`w-full p-4 rounded-xl border-none shadow-sm text-base ${isDarkMode ? 'bg-zinc-800 placeholder:text-zinc-500' : 'bg-white placeholder:text-gray-400'}`}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {['All', 'Open', 'Suva', 'Lami', 'Navua'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                  filter === cat 
                  ? 'bg-blue-600 text-white' 
                  : (isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-gray-500')
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredList.map((p) => (
            <div key={p.id} className={`p-5 rounded-2xl shadow-sm flex justify-between items-center active:opacity-70 transition-opacity ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex-1 pr-4">
                <h2 className="text-lg font-bold tracking-tight">{p.name}</h2>
                <p className="text-[13px] text-gray-500 font-medium leading-snug mb-3">{p.address}</p>
                <a href={`tel:${p.phone_number}`} className="text-[11px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg inline-block">
                  📞 {p.phone_number}
                </a>
              </div>
              <div className={`shrink-0 px-4 py-1.5 rounded-full font-bold text-[11px] ${
                p.is_open ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500'
              }`}>
                {p.is_open ? 'OPEN' : 'CLOSED'}
              </div>
            </div>
          ))}
        </div>

        {filteredList.length === 0 && (
          <div className="text-center mt-20 text-gray-400 font-bold text-xs uppercase tracking-widest">
            No pharmacies found
          </div>
        )}
      </div>
    </div>
  );
}