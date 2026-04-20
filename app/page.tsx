'use client';
import { useEffect, useState, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient();

// --- COMPONENTS ---

// 1. Premium Branded Splash Screen
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-[#0b0b0d] flex flex-col items-center justify-center">
      <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/40 mb-8">🇫🇯</div>
      <h1 className="text-3xl font-black text-white tracking-tighter">Bula Health</h1>
      <div className="mt-12 w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div className="h-full bg-blue-500" animate={{ width: ['0%', '100%'] }} transition={{ duration: 1.8 }} />
      </div>
    </motion.div>
  );
};

// 2. Subtle Heartbeat Status Light
const StatusLight = ({ color, blink }: { color: string, blink?: boolean }) => (
  <div className="relative flex items-center justify-center w-4 h-4">
    {blink && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className={`absolute inset-0 rounded-full ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`} />}
    <div className={`h-2 w-2 rounded-full ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`} />
  </div>
);

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

  // Navigation Helper
  const openMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className={`${isDarkMode ? 'dark bg-[#0b0b0d] text-white' : 'bg-[#f6f6fb] text-black'} min-h-screen transition-colors duration-500`}>
      <AnimatePresence>{!isLoaded && <SplashScreen onComplete={() => setIsLoaded(true)} />}</AnimatePresence>

      {isLoaded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto p-6 pb-40">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black text-blue-600">Bula Health</h1>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-2xl bg-zinc-800/50">{isDarkMode ? '☀️' : '🌙'}</button>
          </header>

          {activeTab === 'directory' ? (
            <div className="grid gap-6">
              <input type="text" placeholder="Search pharmacy..." className="w-full p-4 rounded-[22px] bg-zinc-900/40 border border-zinc-800" onChange={(e) => setSearch(e.target.value)} />
              {pharmacies.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase())).map((p: any) => (
                <div key={p.id} className={`p-7 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-lg'}`}>
                  <div className="flex items-center gap-3 mb-6"><StatusLight color={p.is_open ? 'green' : 'red'} blink={p.is_open} /> <h2 className="font-bold">{p.name}</h2></div>
                  <div className="grid grid-cols-4 gap-3">
                    <a href={`tel:${p.phone}`} className="h-14 flex items-center justify-center bg-zinc-800/50 rounded-2xl">📞</a>
                    <a href={`https://wa.me/${p.phone}`} className="h-14 flex items-center justify-center bg-green-500/10 text-green-500 rounded-2xl">💬</a>
                    <a href={`viber://add?number=${p.phone}`} className="h-14 flex items-center justify-center bg-purple-500/10 text-purple-500 rounded-2xl">V</a>
                    <button onClick={() => openMaps(p.address)} className="h-14 flex items-center justify-center bg-blue-600 text-white rounded-2xl">📍</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-6">
              <h2 className="text-2xl font-black">About Bula Health</h2>
              <p className="opacity-60 text-sm">Version 1.0.5 | Built for Fiji Community</p>
              <a href="mailto:your@email.com" className="block p-4 bg-blue-600 rounded-2xl">Contact Developer</a>
            </div>
          )}

          {/* Navigation */}
          <nav className="fixed bottom-10 left-6 right-6 bg-zinc-900 rounded-[44px] p-2 flex">
            <button onClick={() => setActiveTab('directory')} className={`flex-1 py-3 ${activeTab === 'directory' ? 'bg-blue-600' : ''} rounded-[32px] text-[10px] font-black`}>DIRECTORY</button>
            <button onClick={() => setActiveTab('about')} className={`flex-1 py-3 ${activeTab === 'about' ? 'bg-blue-600' : ''} rounded-[32px] text-[10px] font-black`}>ABOUT</button>
          </nav>
        </motion.div>
      )}
    </div>
  );
}

export default function App() {
  return <QueryClientProvider client={queryClient}><PharmacyAppContent /></QueryClientProvider>;
}