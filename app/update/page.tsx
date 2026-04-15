'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../utils/supabase'; // Corrected path (one level up)

function UpdateContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      const { data } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', id)
        .eq('update_token', token)
        .single();
      
      if (data) setPharmacy(data);
      setLoading(false);
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

  if (loading) return <div className="p-10 text-center">Verifying...</div>;
  if (!pharmacy) return <div className="p-10 text-center text-red-500 font-bold uppercase tracking-widest">Access Denied</div>;

  return (
    <div className="max-w-md mx-auto p-8 text-center bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-black mb-10">Pharmacy Portal</h1>
      <div 
        onClick={toggleStatus}
        className={`w-48 h-48 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-2xl ${
          pharmacy.is_open ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'
        }`}
      >
        <span className="text-4xl font-black">{pharmacy.is_open ? 'OPEN' : 'CLOSED'}</span>
      </div>
      <p className="mt-10 text-slate-400 text-xs tracking-widest uppercase">Tap button to toggle status</p>
    </div>
  );
}

export default function UpdatePortal() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpdateContent />
    </Suspense>
  );
}