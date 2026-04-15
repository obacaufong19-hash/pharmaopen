'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../utils/supabase'; // Corrected path to go up one level

function UpdateForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function verify() {
      const { data } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', id)
        .eq('update_token', token)
        .single();
      
      if (data) setPharmacy(data);
      else setError(true);
    }
    if (id && token) verify();
  }, [id, token]);

  const toggleStatus = async () => {
    const newStatus = !pharmacy.is_open;
    const { error } = await supabase
      .from('pharmacies')
      .update({ is_open: newStatus })
      .eq('id', id);
    
    if (!error) setPharmacy({ ...pharmacy, is_open: newStatus });
  };

  if (error) return <div className="p-10 text-center text-white bg-slate-900 min-h-screen">Invalid Token or ID</div>;
  if (!pharmacy) return <div className="p-10 text-center text-white bg-slate-900 min-h-screen">Verifying Access...</div>;

  return (
    <div className="max-w-md mx-auto p-10 text-center bg-slate-900 min-h-screen text-white font-sans">
      <h1 className="text-2xl font-black mb-2">{pharmacy.name}</h1>
      <p className="text-slate-400 mb-12 text-sm">Tap the button to switch status</p>
      
      <button 
        onClick={toggleStatus}
        className={`w-56 h-56 mx-auto rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl border-8 ${
          pharmacy.is_open 
          ? 'bg-green-500 border-green-400 shadow-green-500/40' 
          : 'bg-red-500 border-red-400 shadow-red-500/40'
        }`}
      >
        <span className="text-4xl font-black tracking-tighter">
          {pharmacy.is_open ? 'OPEN' : 'CLOSED'}
        </span>
      </button>
      
      <p className="mt-12 text-xs text-slate-500 uppercase font-bold tracking-widest">
        Bookmark this page for 1-tap updates
      </p>
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