'use client';
import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase'; // Correct path for root level

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

  useEffect(() => {
    fetchPharmacies();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied")
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
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!userLoc) return 0;
      const distA = Math.hypot(a.lat - userLoc.lat, a.lng - userLoc.lng);
      const distB = Math.hypot(b.lat - userLoc.lat, b.lng - userLoc.lng);
      return distA - distB;
    });

  return (
    <div className="max-w-xl mx-auto p-6 bg-slate-50 min-h-screen font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black text-blue-600 tracking-tight">Bula Health 🌴</h1>
        <p className="text-slate-500 font-bold">Pharmacy Tracker</p>
      </header>

      <input 
        type="text" 
        placeholder="Search pharmacy name..." 
        className="w-full p-4 rounded-2xl border-none shadow-lg mb-8 outline-blue-500"
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-4">
        {filteredList.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{p.name}</h2>
              <p className="text-xs text-slate-400">{p.address}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-black text-xs ${
              p.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {p.is_open ? 'OPEN' : 'CLOSED'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}