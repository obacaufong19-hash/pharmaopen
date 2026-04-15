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
    const hO = () => setIsOnline(true);
    const hF = () => setIsOnline(false);
    window.addEventListener('online', hO);
    window.addEventListener('offline', hF);
    
    async function verify() {
      const { data } = await supabase.from('pharmacies').select('*').eq('id', id).eq('update_token', token).single();
      if (data) setPharmacy(data);
    }
    if (id && token) verify();
    return () => { window.removeEventListener('online', hO); window.removeEventListener('offline', hF); };
  }, [id, token]);

  const toggleStatus = async () => {
    if (!isOnline) return;
    const newStatus = !pharmacy.is_open;
    const { error } = await supabase.from('pharmacies').update({ is_open: newStatus }).eq('id', id);
    if (!error) {
      setPharmacy({ ...pharmacy, is_open: newStatus });
      if (navigator.vibrate) navigator.vibrate(80); 
    }
  };

  if (!pharmacy) return <div className="p-10 text-center font-bold text-zinc-600 bg-black min-h-screen pt-40 tracking-widest uppercase text-xs">Verifying Access...</div>;

  const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  return (
    <div style={{ fontFamily: fontStack }} className={`max-w-md mx-auto p-10 text-center transition-colors min-h-screen ${isOnline ? 'bg-black text-white' : 'bg-red-950 text-white'}`}>
      <div className="mb-20">
        <h1 className="text-3xl font-extrabold tracking-tight">{pharmacy.name}</h1>
        <p className={`text-xs font-bold mt-2 uppercase tracking-[0.2em] ${isOnline ? 'text-zinc-500' : 'text-red-400'}`}>
          {isOnline ? 'Cloud Sync Active' : 'Offline - Check Data'}
        </p>
      </div>
      
      <button 
        onClick={toggleStatus}
        disabled={!isOnline}
        className={`w-64 h-64 mx-auto rounded-full flex flex-col items-center justify-center transition-all active:scale-95 border-[10px] shadow-2xl ${!isOnline ? 'opacity-30' : ''} ${
          pharmacy.is_open ? 'bg-green-500 border-green-400' : 'bg-zinc-800 border-zinc-700'
        }`}
      >
        <span className="text-5xl font-black">{pharmacy.is_open ? 'OPEN' : 'CLOSED'}</span>
        <span className="text-[11px] font-bold opacity-60 mt-2">TAP TO TOGGLE</span>
      </button>

      <p className="mt-20 text-zinc-600 text-[11px] font-bold uppercase tracking-[0.3em]">
        Status Syncs Instantly
      </p>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="bg-black min-h-screen" />}><UpdateForm /></Suspense>;
}