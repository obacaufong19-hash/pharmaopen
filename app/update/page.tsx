'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../utils/supabase';

function UpdateForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    async function verify() {
      const { data } = await supabase.from('pharmacies').select('*').eq('id', id).eq('update_token', token).single();
      if (data) setPharmacy(data);
    }
    if (id && token) verify();
  }, [id, token]);

  const updateField = async (field: string, value: any) => {
    const { error } = await supabase.from('pharmacies').update({ [field]: value }).eq('id', id);
    if (!error) setPharmacy({ ...pharmacy, [field]: value });
  };

  if (!pharmacy) return <div className="p-10 text-center font-bold text-zinc-600 bg-black min-h-screen pt-40">Verifying...</div>;

  return (
    <div className="max-w-md mx-auto p-8 text-center bg-black min-h-screen text-white font-[-apple-system,sans-serif]">
      <h1 className="text-2xl font-extrabold mb-10">{pharmacy.name}</h1>
      
      <button 
        onClick={() => updateField('is_open', !pharmacy.is_open)}
        className={`w-48 h-48 mx-auto rounded-full mb-10 border-[8px] transition-all active:scale-95 ${pharmacy.is_open ? 'bg-green-500 border-green-400' : 'bg-zinc-800 border-zinc-700'}`}
      >
        <span className="text-4xl font-black block">{pharmacy.is_open ? 'OPEN' : 'CLOSED'}</span>
      </button>

      <div className="bg-zinc-900 p-6 rounded-3xl text-left">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Set Closing Time Today</label>
        <input 
          type="time" 
          value={pharmacy.closing_time || ""} 
          onChange={(e) => updateField('closing_time', e.target.value)}
          className="w-full bg-zinc-800 p-4 rounded-xl text-white font-bold text-xl border-none outline-none"
        />
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><UpdateForm /></Suspense>; }