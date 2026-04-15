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
    setIsOnline(navigator.onLine);
    const o = () => setIsOnline(true);
    const f = () => setIsOnline(false);
    window.addEventListener('online', o);
    window.addEventListener('offline', f);
    
    async function verify() {
      const { data } = await supabase.from('pharmacies').select('*').eq('id', id).eq('update_token', token).single();
      if (data) setPharmacy(data);
    }
    if (id && token) verify();

    return () => { window.removeEventListener('online', o); window.removeEventListener('offline', f); };
  }, [id, token]);

  const toggleStatus = async () => {
    if (!isOnline) {
      alert("Cannot update while offline. Please check your data connection.");
      return;
    }
    const newStatus = !pharmacy.is_open;
    const { error } = await supabase.from('pharmacies').update({ is_open: newStatus }).eq('id', id);
    if (!error) setPharmacy({ ...pharmacy, is_open: newStatus });
  };

  if (!pharmacy) return <div className="p-10 text-center text-white bg-slate-900 min-h-screen">Verifying...</div>;

  return (
    <div className={`max-w-md mx-auto p-10 text-center transition-colors min-h-screen text-white font-sans ${isOnline ? 'bg-slate-900' : 'bg-red-950'}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-black">{pharmacy.name}</h1>
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ${isOnline ? 'text-green-500' : 'text-red-400'}`}>
          {isOnline ? '● Ready to Sync' : '⚠️ Offline - Check Connection'}
        </p>
      </div>
      
      <button 
        onClick={toggleStatus}
        disabled={!isOnline}
        className={`w-56 h-56 mx-auto rounded-full flex items-center justify-center transition-all active:scale-95 border-8 ${!isOnline ? 'opacity-50 grayscale' : ''} ${
          pharmacy.is_open ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'
        }`}
      >
        <span className="text-4xl font-black">{pharmacy.is_open ? 'OPEN' : 'CLOSED'}</span>
      </button>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="bg-slate-900 min-h-screen" />}><UpdateForm /></Suspense>;
}