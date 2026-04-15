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
  const [filter, setFilter] = useState('All'); // Supports: All, Open, Suva, Lami, Navua
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  const fetchPharmacies = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('pharmacies').select('*');
      if (error) throw error;
      if (data) setList(data as Pharmacy[]);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      // Small delay for visual feedback on the sync icon
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  useEffect(() => {
    fetchPharmacies();

    // 1. Initial Theme Detection
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    // 2. Connectivity Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Geolocation for sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied - sorting disabled")
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
      // Checks if the area name is part of the address string
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

  return (
    <div className={`${isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} min-h-screen transition-colors duration-300 font-sans`}>
      
      {/* 1. Network Alert Banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest py-2 text-center sticky top-0 z-50 animate-pulse">
          ⚠️ Connection Lost - Using Offline Data
        </div>
      )}

      <div className="max-w-xl mx-auto p-6 pb-20">
        
        {/* 2. Header Section */}
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>
              Bula Health 🌴
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                {isOnline ? 'System Online' : 'Network Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-3 rounded-2xl shadow-md transition-all active:scale-90 ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600'}`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={fetchPharmacies} 
              disabled={!isOnline}
              className={`p-3 rounded-2xl shadow-md transition-all active:scale-90 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} ${isSyncing ? 'animate-spin' : ''} ${!isOnline ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <span className="text-xl leading-none block">🔄</span>
            </button>
          </div>
        </header>

        {/* 3. Search & Filter Controls */}
        <div className="sticky top-4 z-10 mb-8 space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by name..." 
              className={`w-full p-5 rounded-2xl border-none shadow-xl outline-none ring-2 ring-transparent focus:ring-blue-500 text-lg transition-all ${
                isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-white text-slate-900 placeholder:text-slate-400'
              }`}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All', 'Open', 'Suva', 'Lami', 'Navua'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${
                  filter === cat 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30 shadow-lg scale-105' 
                  : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-100 text-slate-500')
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Pharmacy Result List */}
        <div className="space-y-4">
          {filteredList.map((p) => (
            <div key={p.id} className={`p-6 rounded-[2.5rem] shadow-sm border flex justify-between items-center transition-all active:scale-[0.98] ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 hover:border-blue-100'
            }`}>
              <div className="pr-4">
                <h2 className="text-xl font-extrabold leading-tight tracking-tight">
                  {p.name}
                </h2>
                <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-tight">
                  {p.address}
                </p>
                <div className="mt-3">
                  <a 
                    href={`tel:${p.phone_number}`} 
                    className={`text-[10px] font-bold px-3 py-1 rounded-lg ${isDarkMode ? 'bg-slate-700 text-blue-400' : 'bg-slate-100 text-blue-600'}`}
                  >
                    📞 {p.phone_number}
                  </a>
                </div>
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

          {/* Empty State */}
          {filteredList.length === 0 && (
            <div className="text-center py-20">
              <span className="text-4xl block mb-4">🔍</span>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">
                No pharmacies found in {filter}
              </p>
            </div>
          )}
        </div>

        {/* 5. Footer */}
        <footer className="mt-20 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
            Fiji's Community Pharmacy Network
          </p>
        </footer>
      </div>
    </div>
  );
}