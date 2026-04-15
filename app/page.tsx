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
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchPharmacies = async () => {
    setIsSyncing(true);
    const { data } = await supabase.from('pharmacies').select('*');
    if (data) setList(data as Pharmacy[]);
    // Artificial delay so the user sees the "spin" feedback
    setTimeout(() => setIsSyncing(false), 500);
  };

  useEffect(() => {
    fetchPharmacies();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied")
      );
    }

    // Realtime listener (keeps trying in the background)
    const channel = supabase.channel('realtime_pharmacies')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pharmacies' }, () => {
        fetchPharmacies();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
    <div className="max-w-xl mx-auto p-6 bg-slate-50 min-h-screen font-sans">
      <header className="mb-8 flex justify-between items-start">
        <div className="text-left">
          <h1 className="text-4xl font-black text-blue-700 tracking-tighter">Bula Health 🌴</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Pharmacy Tracker</p>
        </div>
        
        {/* The Sync Button */}
        <button 
          onClick={fetchPharmacies}
          className={`p-3 rounded-2xl bg-white shadow-md transition-all active:scale-90 ${isSyncing ? 'animate-spin' : ''}`}
        >
          <span className="text-xl">🔄</span>
        </button>
      </header>

      <div className="sticky top-4 z-10 mb-8">
        <input 
          type="text" 
          placeholder="Search pharmacy name..." 
          className="w-full p-5 rounded-2xl border-none shadow-xl outline-blue-500 bg-white text-lg"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredList.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center transition-transform active:scale-[0.98]">
            <div className="pr-4">
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{p.name}</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-1">{p.address}</p>
            </div>
            <div className={`shrink-0 px-5 py-2.5 rounded-full font-black text-[10px] tracking-tighter border-2 ${
              p.is_open 
              ? 'bg-green-50 border-green-100 text-green-600' 
              : 'bg-red-50 border-red-100 text-red-500'
            }`}>
              {p.is_open ? '● OPEN' : '○ CLOSED'}
            </div>
          </div>
        ))}
        
        {filteredList.length === 0 && (
          <p className="text-center text-slate-400 mt-10 font-bold uppercase text-xs tracking-widest">No pharmacies found</p>
        )}
      </div>
      
      <footer className="mt-12 text-center pb-8">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Real-time updates from local pharmacies</p>
      </footer>
    </div>
  );
}