'use client';
import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';

// ... (Pharmacy interface remains the same)

export default function Home() {
  const [list, setList] = useState<Pharmacy[]>([]);
  const [search, setSearch] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchPharmacies();

    // Connection Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchPharmacies = async () => {
    if (!navigator.onLine) return; // Don't try if offline
    setIsSyncing(true);
    const { data } = await supabase.from('pharmacies').select('*');
    if (data) setList(data as Pharmacy[]);
    setTimeout(() => setIsSyncing(false), 500);
  };

  // ... (Filtering logic remains the same)

  return (
    <div className={`${isDarkMode ? 'dark bg-slate-900' : 'bg-slate-50'} min-h-screen transition-colors duration-300 font-sans`}>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-2 text-center sticky top-0 z-50 animate-pulse">
          ⚠️ You are currently offline
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
                {isOnline ? 'System Online' : 'Connection Lost'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-2xl shadow-md ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={fetchPharmacies} 
              disabled={!isOnline}
              className={`p-3 rounded-2xl shadow-md ${isDarkMode ? 'bg-slate-800' : 'bg-white'} ${isSyncing ? 'animate-spin' : ''} ${!isOnline ? 'opacity-30' : ''}`}
            >
              <span className="text-xl">🔄</span>
            </button>
          </div>
        </header>

        {/* ... (Search and List remain the same) */}
      </div>
    </div>
  );
}