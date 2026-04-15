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
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  const fetchPharmacies = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    const { data } = await supabase.from('pharmacies').select('*');
    if (data) setList(data as Pharmacy[]);
    setTimeout(() => setIsSyncing(false), 500);
  };

  useEffect(() => {
    fetchPharmacies();

    // Theme Detection
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    // Connectivity Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Location Tracking
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied")
      );
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredList = list
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!userLoc) return 0;
      const distA = Math.hypot(a.lat - userLoc.lat, a.lng - userLoc.lng);
      const distB = Math.hypot(b.lat - userLoc.lat, b.lng - userLoc.lng);
      return distA - distB;
    });

  return (
    <div className={`${isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} min-h-screen transition-colors duration-300 font-sans`}>
      {/* Network Alert Banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest py-2 text-center sticky top-0 z-50 animate-pulse">
          ⚠️ Connection Lost - Showing Cached Data
        </div>
      )}

      <div className="max-w-xl mx-auto p-6">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>
              Bula Health 🌴
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                {isOnline ? 'System Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-3 rounded-2xl shadow-md transition-all active:scale-90 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={fetchPharmacies} 
              disabled={!isOnline}
              className={`p-3 rounded-2xl shadow-md transition-all active:scale-90 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} ${isSyncing ? 'animate-spin' : ''} ${!isOnline ? 'opacity-30' : ''}`}
            >
              <span className="text-xl">🔄</span>
            </button>
          </div>
        </header>

        <div className="sticky top-4 z-10 mb-8">
          <input 
            type="text" 
            placeholder="Search pharmacy name..." 
            className={`w-full p-5 rounded-2xl border-none shadow-xl outline-blue-500 text-lg transition-colors ${
              isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-white text-slate-900'
            }`}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filteredList.map((p) => (
            <div key={p.id} className={`p-6 rounded-[2.5rem] shadow-sm border flex justify-between items-center transition-all active:scale-[0.98] ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}>
              <div className="pr-4">
                <h2 className="text-xl font-extrabold leading-tight">{p.name}</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-1">{p.address}</p>
              </div>
              <div className={`shrink-0 px-5 py-2.5 rounded-full font-black text-[10px] tracking-tighter border-2 ${
                p.is_open 
                ? (isDarkMode ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-green-50 border-green-100 text-green-600')
                : (isDarkMode ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-red-50 border-red-100 text-red-500')
              }`}>
                {p.is_open ? '● OPEN' : '○ CLOSED'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}