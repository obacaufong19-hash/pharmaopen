'use client';
import { useEffect, useState, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const queryClient = new QueryClient();

// Animation Variants (Fixes type errors)
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } }
};

// --- COMPONENTS ---

// Premium Branded Splash Screen
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-[#0b0b0d] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/40 mb-8">🇫🇯</div>
      <h1 className="text-3xl font-black text-white tracking-tighter">Bula Health</h1>
      <div className="mt-12 w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div className="h-full bg-blue-500" animate={{ width: ['0%', '100%'] }} transition={{ duration: 1.8, ease: "easeInOut" }} />
      </div>
    </motion.div>
  );
};

function PharmacyAppContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('directory');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [search, setSearch] = useState('');

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data } = await supabase.from('pharmacies').select('*');
      return data || [];
    },
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-[#0b0b0d] text-white' : 'bg-[#f6f6fb] text-black'} min-h-screen transition-colors duration-500`}>
      <AnimatePresence>{!isLoaded && <SplashScreen onComplete={() => setIsLoaded(true)} />}</AnimatePresence>

      {isLoaded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto p-6 pb-40">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black text-blue-600">Bula Health</h1>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-2xl bg-zinc-800/50">{isDarkMode ? '☀️' : '🌙'}</button>
          </header>

          {activeTab === 'directory' ? (
            <div className="grid gap-6">
              <input type="text" placeholder="Search pharmacy..." className="w-full p-4 rounded-[22px] bg-zinc-900/40 border border-zinc-800" onChange={(e) => setSearch(e.target.value)} />
              {pharmacies.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase())).map((p: any) => (
                <motion.div key={p.id} variants={cardVariants} initial="hidden" animate="show" className={`p-7 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-lg'}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-2 h-2 rounded-full ${p.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                    <h2 className="font-bold">{p.name}</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <a href={`tel:${p.phone_number}`} className="h-14 flex items-center justify-center bg-zinc-800/50 rounded-2xl">📞</a>
                    <a href={`https://wa.me/${p.phone_number}`} className="h-14 flex items-center justify-center bg-green-500/10 text-green-500 rounded-2xl">💬</a>
                    <a href={`viber://add?number=${p.phone_number}`} className="h-14 flex items-center justify-center bg-purple-500/10 text-purple-500 rounded-2xl">V</a>
                    <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`, '_blank')} className="h-14 flex items-center justify-center bg-blue-600 text-white rounded-2xl">📍</button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-6">
              <h2 className="text-2xl font-black">About Bula Health</h2>
              <p className="opacity-60 text-sm">Version 1.0.5 | Built for Fiji Pharmacies</p>
              <a href="mailto:admin@bulahealth.com" className="block p-4 bg-blue-600 rounded-2xl text-white font-bold">Contact Developer</a>
            </div>
          )}

          <nav className="fixed bottom-10 left-6 right-6 bg-zinc-900 rounded-[44px] p-2 flex border border-zinc-800 shadow-2xl">
            <button onClick={() => setActiveTab('directory')} className={`flex-1 py-3 ${activeTab === 'directory' ? 'bg-blue-600' : ''} rounded-[32px] text-[10px] font-black transition-all`}>DIRECTORY</button>
            <button onClick={() => setActiveTab('about')} className={`flex-1 py-3 ${activeTab === 'about' ? 'bg-blue-600' : ''} rounded-[32px] text-[10px] font-black transition-all`}>ABOUT</button>
          </nav>
        </motion.div>
      )}
    </div>
  );
}

export default function App() {
  return <QueryClientProvider client={queryClient}><PharmacyAppContent /></QueryClientProvider>;
}