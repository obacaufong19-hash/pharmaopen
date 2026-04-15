'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../utils/supabase';

export default function UpdatePortal() {
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
        .eq('update_token', token) // Only find if token matches
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
      .update({ is_open: newStatus, last_updated: new Date().toISOString() })
      .eq('id', id);

    if (!error) setPharmacy({ ...pharmacy, is_open: newStatus });
  };

  if (loading) return <div className="p-10 text-center">Verifying Access...</div>;
  if (!pharmacy) return <div className="p-10 text-center text-red-500">Invalid Secure Link.</div>;

  return (
    <div className="max-w-md mx-auto p-8 text-center bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-2">{pharmacy.name}</h1>
      <p className="text-slate-500 mb-8 text-sm">Pharmacist Control Portal</p>
      
      <div className={`p-10 rounded-3xl mb-8 transition-all ${pharmacy.is_open ? 'bg-green-100' : 'bg-red-100'}`}>
        <p className="text-sm uppercase font-black mb-2">Current Status</p>
        <h2 className={`text-5xl font-black ${pharmacy.is_open ? 'text-green-600' : 'text-red-600'}`}>
          {pharmacy.is_open ? 'OPEN' : 'CLOSED'}
        </h2>
      </div>

      <button 
        onClick={toggleStatus}
        className="w-full py-6 bg-blue-600 text-white rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-transform"
      >
        TAP TO TOGGLE STATUS
      </button>

      <p className="mt-8 text-xs text-slate-400 leading-relaxed">
        This link is private to your pharmacy. <br/>
        Add this page to your <b>Home Screen</b> for quick access.
      </p>
    </div>
  );
}