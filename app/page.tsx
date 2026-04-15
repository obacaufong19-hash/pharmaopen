'use client';

import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';

// Properly defining the type fixes the "lat does not exist" error
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

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Location access denied."),
        { enableHighAccuracy: true }
      );
    }

    const channel = supabase.channel('realtime_pharmacies')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pharmacies' }, () => {
        fetchPharmacies();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPharmacies() {
    const { data } = await supabase.from('pharmacies').select('*');
    if (data) setList(data as Pharmacy[]);
  }

  // Filtering Logic
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
    <div className="max-w-3xl mx-auto p-4 bg-slate-50 min-h-screen font-sans">
      <header className="py-8 text-center">
        <h1 className="text-4xl font-black text-blue-800 tracking-tighter">Bula Health 🌴</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Fiji Pharmacy Tracker</p>
      </header>

      {/* SEARCH AND FILTER BAR - Fixed Deployment */}
      <div className="sticky top-2 z-20 mb-6 space-y-3">
        <input 
          type="text" 
          placeholder="Search by name..." 
          className="w-full p-5 rounded-2xl border-none shadow-xl focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'Suva', 'Navua', 'Lami', 'Samabula'].map((city) => (
            <button
              key={city}
              onClick={() => setFilter(city)}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all shadow-sm whitespace-nowrap ${
                filter === city ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Pharmacy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                p.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {p.is_open ? '● Open Now' : '○ Closed'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-1">{p.name}</h2>
            <p className="text-[11px] text-slate-400 font-medium mb-6 line-clamp-1">{p.address}</p>
            <div className="flex gap-2">
              <a href={`tel:${p.phone_number}`} className="flex-1 bg-slate-900 text-white text-center py-4 rounded-2xl font-bold text-sm">Call</a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.address)}`} target="_blank" className="flex-1 border-2 border-slate-100 text-slate-700 text-center py-4 rounded-2xl font-bold text-sm">Map</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}