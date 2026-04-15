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
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    async function verify() {
      const { data } = await supabase.from('pharmacies').select('*').eq('id', id).eq('update_token', token).single();
      if (data) setPharmacy(data);
    }
    if (id && token) verify();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id, token]);

  const toggleStatus = async () => {
    if (!isOnline) return;
    const newStatus = !pharmacy.is_open;
    const { error } = await supabase.from('pharmacies').update({ is_open: newStatus }).eq('id', id);
    if (!error) {
      setPharmacy({ ...pharmacy, is_open: newStatus });
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  if (!pharmacy) return <div className="p-10 text-center text-white bg-slate-900 min-h-screen font-black">VALIDATING ACCESS...</div>;

  return (
    <div className={`max-w-md mx-auto p-10 text-center transition-colors min-h-screen text-white font-sans ${isOnline ? 'bg-slate-900' : 'bg-red-950'}`}>
      <div className="mb-12">
        <h1 className="text-3xl font-black tracking-tight">{pharmacy.name}</h1>
        <p className={`text-[10px] font-bold uppercase tracking-[0.3em] mt-3 ${isOnline ? 'text-green-500' : 'text-red-400'}`}>
          {isOnline ? '● Ready to Update' : '⚠️ Offline - Connection Lost'}
        </p>
      </div>
      
      <button 
        onClick={toggleStatus}
        disabled={!isOnline}
        className={`w-64 h-64 mx-auto rounded-full flex flex-col items-center justify-center transition-all active:scale-90 border-[12px] ${!isOnline ? 'opacity-40 grayscale' : 'shadow-2xl'} ${
          pharmacy.is_open 
          ? 'bg-green-500 border-green-400 shadow-green-500/40' 
          : 'bg-red-500 border-red-400 shadow-red-500/40'
        }`}
      >
        <span className="text-5xl font-black mb-1">{pharmacy.is_open ? 'OPEN' : 'CLOSED'}</span>
        <span className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Tap to Toggle</span>
      </button>

      <div className="mt-16 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
        {isOnline ? 'Instantly visible to all users' : 'Please reconnect to save changes'}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="bg-slate-900 min-h-screen" />}>
      <UpdateForm />
    </Suspense>
  );
}