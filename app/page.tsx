'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    async function loadData() {
      try {
        // We import supabase inside the effect to prevent top-level crashes
        const { supabase } = await import('./utils/supabase');
        const { data, error } = await supabase.from('pharmacies').select('*');
        
        if (error) {
          setErrorLog(error.message);
        } else {
          setList(data || []);
        }
      } catch (err: any) {
        setErrorLog("System Error: " + err.message);
      }
    }

    loadData();
  }, []);

  // If the browser hasn't fully taken over, show nothing to prevent hydration crashes
  if (!mounted) return null;

  const filteredList = list.filter(p => {
    const nameMatch = p.name?.toLowerCase().includes(search.toLowerCase());
    const areaMatch = filter === 'All' ? true : p.address?.toLowerCase().includes(filter.toLowerCase());
    return nameMatch && areaMatch;
  });

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-black font-sans p-5">
      <div className="max-w-md mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-black">Bula Health 🌴</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Pharmacy Finder</p>
        </header>

        {errorLog && (
          <div className="bg-red-100 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-xs font-mono">
            {errorLog}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full p-4 rounded-2xl border-none shadow-sm outline-none"
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['All', 'Suva', 'Lami', 'Navua'].map(loc => (
              <button 
                key={loc}
                onClick={() => setFilter(loc)}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-colors ${filter === loc ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'}`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {filteredList.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold leading-tight">{p.name}</h2>
                <div className={`text-[9px] font-black px-2 py-1 rounded ${p.is_open ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {p.is_open ? 'OPEN' : 'CLOSED'}
                </div>
              </div>
              <p className="text-gray-400 text-xs mb-4">{p.address}</p>
              <div className="flex gap-2">
                <a href={`tel:${p.phone_number}`} className="flex-1 bg-blue-50 text-blue-600 text-center py-2 rounded-xl text-[11px] font-bold">Call</a>
                <a href={`https://wa.me/${p.phone_number?.replace(/\s/g, '')}`} className="flex-1 bg-green-50 text-green-600 text-center py-2 rounded-xl text-[11px] font-bold">WhatsApp</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}