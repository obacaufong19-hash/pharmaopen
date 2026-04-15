'use client';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { supabase } from '../utils/supabase';

function UpdateContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('toggle_pharmacy_status', { p_id: id, p_token: token });
    if (error) alert("Access Denied: Invalid Token");
    else setStatus(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-900 text-white text-center">
      <h1 className="text-2xl font-bold mb-2">Pharmacy Portal</h1>
      <p className="text-slate-400 mb-10 text-sm italic">Tap the button to switch your status</p>
      
      <button 
        onClick={handleToggle}
        disabled={loading}
        className={`w-64 h-64 rounded-full text-3xl font-black shadow-2xl transition-all active:scale-90 border-8 ${
          status === null ? 'bg-slate-700 border-slate-600' : 
          status ? 'bg-green-500 border-green-400 shadow-green-500/50' : 
          'bg-red-500 border-red-400 shadow-red-500/50'
        }`}
      >
        {loading ? '...' : (status === null ? 'START' : (status ? 'OPEN' : 'CLOSED'))}
      </button>

      <p className="mt-10 text-xs text-slate-500 max-w-xs">
        Bookmark this page on your phone home screen for 1-tap updates.
      </p>
    </div>
  );
}

export default function UpdateStatus() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpdateContent />
    </Suspense>
  );
}