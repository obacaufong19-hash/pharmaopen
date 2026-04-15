'use client';
import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';

type Location = { lat: number; lng: number } | null;

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
  const [userLoc, setUserLoc] = useState<Location>(null);

  useEffect(() => {
    fetchPharmacies();
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.log("Location denied"),
      { enableHighAccuracy: true }
    );

    const channel = supabase.channel('realtime_pharmacies')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pharmacies' }, () => fetchPharmacies())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPharmacies() {
    const { data } = await supabase.from('pharmacies').select('*');
    if (data) setList(data as Pharmacy[]);
  }

  // Filter and Sort Logic
  const filteredList = list
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesArea = filter === 'All' || p.address.includes(filter);
      return matchesSearch && matchesArea;
    })
    .sort((a, b) => {
      if (!userLoc) return 0;
      const distA = Math.hypot(a.lat - userLoc.lat, a.lng - userLoc.lng);
      const distB = Math.hypot(b.lat - userLoc.lat, b.lng - userLoc.lng);
      return distA - distB;
    });

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gray-50 min-h-screen">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight">Bula Health 🌴</h1>
        <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">Fiji Pharmacy Tracker</p>
      </header>

      {/* Modern Search & Filter Bar */}
      <div className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-10 py-4 space-y-3">
        <input 
          type="text" 
          placeholder="Search pharmacy name..." 
          className="w-full p-4 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-lg"
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'Navua', 'Suva', 'Lami'].map(area => (
            <button 
              key={area}
              onClick={() => setFilter(area)}
              className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${filter === area ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Pharmacy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {filteredList.map(p => (
          <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {p.is_open ? '● Open Now' : '○ Closed'}
                </span>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-tighter">
                  {p.address.includes('Suva') ? 'Suva' : 'Navua'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{p.name}</h2>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.address}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-6">
              <a href={`tel:${p.phone_number}`} className="flex items-center justify-center py-3 bg-gray-900 text-white rounded-xl text-sm font-bold active:scale-95 transition-all">
                Call
              </a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" className="flex items-center justify-center py-3 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-bold active:scale-95 transition-all">
                Map
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}