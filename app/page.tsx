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
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    fetchPharmacies();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location denied")
      );
    }

    const channel = supabase.channel('realtime_pharmacies')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pharmacies' }, () => {
        fetchPharmacies();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPharmacies() {
    const { data } = await supabase.from('pharmacies').select('*');
    if (data) setList(data as Pharmacy[]);
  }

  const filteredList = list
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesArea = filter === 'All' || p.address.toLowerCase().includes(filter.toLowerCase());
      return matchesSearch && matchesArea;
    })
    .sort((a, b) => {
      if (!userLoc) return 0;
      const distA = Math.hypot(a.lat - userLoc.lat, a.lng - userLoc.lng);
      const distB = Math.hypot(b.lat - userLoc.lat, b.lng - userLoc.lng);
      return distA - distB;
    });

  return (
    <div className="max-w-3xl mx-auto p-4 bg-slate-50 min-h-screen">
      <header className="py-8 text-center">
        <h1 className="text-4xl font-black text-blue-800 tracking-tighter">Bula Health 🌴</h1>
      </header>

      <div className="sticky top-2 z-20 mb-6 space-y-3">
        <input 
          type="text" 
          placeholder="Search pharmacies..." 
          className="w-full p-5 rounded-2xl border-none shadow-xl bg-white"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
              p.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {p.is_open ? '● Open' : '○ Closed'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-4">{p.name}</h2>
            <p className="text-[11px] text-slate-400 mb-6">{p.address}</p>
            <div className="flex gap-2">
              <a href={`tel:${p.phone_number}`} className="flex-1 bg-slate-900 text-white text-center py-4 rounded-2xl font-bold text-sm">Call</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}