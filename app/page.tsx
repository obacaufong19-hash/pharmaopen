'use client';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const qc = new QueryClient();

const Splash = () => (
  <motion.div exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-[#0b0b0d] flex flex-col items-center justify-center">
    <motion.div animate={{ scale: [0.9, 1.1, 1] }} className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(37,99,235,0.4)]">🇫🇯</motion.div>
    <h1 className="mt-6 text-[10px] font-black tracking-[0.5em] uppercase text-white opacity-50">Viti Pulse</h1>
  </motion.div>
);

const VitiPulse = () => {
  const [load, setLoad] = useState(true), [cat, setCat] = useState('pharmacy'), [loc, setLoc] = useState('All'), [q, setQ] = useState(''), [dark, setDark] = useState(true);
  useEffect(() => { setTimeout(() => setLoad(false), 1800) }, []);

  const { data: list = [] } = useQuery({
    queryKey: ['f', cat],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      return (await supabase.from('directory').select('*').eq('category', cat).order('is_featured', { ascending: false })).data || [];
    }
  });

  const filtered = list.filter((f: any) => f.name?.toLowerCase().includes(q.toLowerCase()) && (loc === 'All' || f.address?.includes(loc)));

  const Action = ({ h, c, i }: any) => <a href={h} className={`h-12 rounded-2xl flex items-center justify-center transition-all ${c}`}>{i}</a>;

  return (
    <div className={`${dark ? 'bg-[#0b0b0d] text-white' : 'bg-[#f8f9fa] text-zinc-900'} min-h-screen font-sans transition-colors`}>
      <AnimatePresence>{load && <Splash />}</AnimatePresence>
      
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-zinc-800/40 p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Viti Pulse</span>
          <button onClick={() => setDark(!dark)} className="text-lg">{dark ? '🌙' : '☀️'}</button>
        </div>
        <div className="flex gap-1 p-1 bg-zinc-900/40 rounded-2xl mb-4 border border-zinc-800/50">
          {['pharmacy', 'supermarket', 'retail'].map(t => <button key={t} onClick={() => setCat(t)} className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider ${cat === t ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>{t === 'retail' ? 'Shops' : t+'s'}</button>)}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['All', 'SUVA', 'NADI', 'LAUTOKA', 'NASINU'].map(l => <button key={l} onClick={() => setLoc(l)} className={`px-4 py-2 rounded-full text-[9px] font-bold border whitespace-nowrap ${loc === l ? 'bg-white text-black' : 'border-zinc-800 text-zinc-500'}`}>{l}</button>)}
        </div>
      </header>

      <main className="p-6 pb-32 max-w-xl mx-auto space-y-6">
        <input onChange={e => setQ(e.target.value)} placeholder={`Search ${cat}s...`} className="w-full h-14 px-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 outline-none focus:border-blue-500/50 transition-all text-sm" />
        
        <AnimatePresence mode="popLayout">
          {filtered.map((f: any) => (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={f.id} className={`p-6 rounded-[32px] border ${dark ? 'bg-zinc-900/20 border-zinc-800/50' : 'bg-white border-zinc-100 shadow-sm'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 border border-zinc-700/40 flex items-center justify-center overflow-hidden">
                  {f.logo_url ? <img src={f.logo_url} className="w-full h-full object-contain p-2" /> : <span className="text-xl font-bold opacity-20">{f.name[0]}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${f.is_open ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                    <span className="text-[8px] font-black uppercase text-zinc-500">{f.is_open ? 'Open' : 'Closed'}</span>
                  </div>
                  <h3 className="font-bold text-lg">{f.name}</h3>
                  <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-tighter">{f.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Action h={`tel:${f.phone_number}`} c="bg-zinc-800/40 text-zinc-400" i="📞" />
                <Action h={`https://wa.me/${f.phone_number?.replace(/\D/g,'')}`} c="bg-green-500/10 text-green-500" i="💬" />
                <Action h={`viber://add?number=${f.phone_number?.replace(/\D/g,'')}`} c="bg-purple-500/10 text-purple-400" i="🟣" />
                <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(f.name + ' ' + f.address)}`)} className="h-12 rounded-2xl bg-blue-600 text-white">📍</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() { return <QueryClientProvider client={qc}><VitiPulse /></QueryClientProvider> }