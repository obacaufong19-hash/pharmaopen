'use client'; // This is required for App Router to use state/effects
import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';

export default function Home() {
  const [list, setList] = useState([]);
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    // Get location for sorting
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log("Location denied"),
      { enableHighAccuracy: true }
    );

    fetchPharmacies();

    // Enable Realtime updates
    const channel = supabase.channel('realtime_pharmacies')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pharmacies' }, 
      () => fetchPharmacies())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchPharmacies() {
    const { data } = await supabase.from('pharmacies').select('*');
    if (data) setList(data);
  }

  // Sort by distance if location is available
  const sortedList = [...list].sort((a, b) => {
    if (!userLoc) return 0;
    const distA = Math.hypot(a.lat - userLoc.lat, a.lng - userLoc.lng);
    const distB = Math.hypot(b.lat - userLoc.lat, b.lng - userLoc.lng);
    return distA - distB;
  });

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-50 min-h-screen font-sans">
      <header className="mb-8 mt-4">
        <h1 className="text-4xl font-black text-blue-700 tracking-tight">Bula Health 🌴</h1>
        <p className="text-slate-500 font-medium">Navua & Lami Pharmacy Tracker</p>
      </header>

      <div className="space-y-4">
        {sortedList.length === 0 && <p className="text-center py-10 text-slate-400">Loading pharmacies...</p>}
        
        {sortedList.map(p => (
          <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="font-bold text-xl text-slate-800">{p.name}</h2>
                <p className="text-sm text-slate-500 mb-3">{p.address}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${p.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {p.is_open ? 'Open' : 'Closed'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              <a href={`tel:${p.phone_number}`} className="flex items-center justify-center bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all">
                Call Now
              </a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" className="flex items-center justify-center border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all">
                Directions
              </a>
            </div>
          </div>
        ))}
      </div>
      
      <footer className="mt-12 text-center text-slate-400 text-xs">
        <p>Data updated in real-time by pharmacists.</p>
      </footer>
    </div>
  );
}