'use client';
import { useEffect, useState } from 'react';
// We are moving the supabase import check inside to prevent the "Millisecond Crash"

export default function Home() {
  const [list, setList] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [criticalError, setCriticalError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    async function initApp() {
      try {
        // Dynamic import to catch initialization errors
        const { supabase } = await import('./utils/supabase');
        
        if (!supabase) {
          setCriticalError("Supabase client failed to initialize. Check your utils/supabase.ts file.");
          return;
        }

        const { data, error } = await supabase.from('pharmacies').select('*');
        if (error) {
          setCriticalError(`Database Error: ${error.message}`);
        } else {
          setList(data || []);
        }
      } catch (err: any) {
        setCriticalError(`System Crash: ${err.message}`);
      }
    }

    initApp();
  }, []);

  if (!mounted) return null;

  if (criticalError) {
    return (
      <div className="min-h-screen bg-red-950 text-white p-10 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold mb-4">🚨 App Error</h1>
        <div className="bg-black/30 p-4 rounded-lg border border-white/20 font-mono text-sm mb-6">
          {criticalError}
        </div>
        <p className="text-white/60 text-xs mb-6">This error is happening in your Vercel Production environment.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-white text-black px-8 py-3 rounded-full font-bold"
        >
          Try Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-5">
      <h1 className="text-3xl font-extrabold text-black">Bula Health 🌴</h1>
      <p className="text-gray-500 mb-8 font-medium">If you see this, the app is finally stable.</p>
      
      <div className="space-y-4">
        {list.length > 0 ? (
          list.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-black">{p.name}</h2>
              <p className="text-gray-400 text-sm font-medium">{p.address}</p>
            </div>
          ))
        ) : (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-24 bg-gray-200 rounded-3xl" />
            <div className="h-24 bg-gray-200 rounded-3xl" />
          </div>
        )}
      </div>
    </div>
  );
}