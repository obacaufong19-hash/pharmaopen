'use client';
import { useEffect, useState, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Initialize Query Client
const queryClient = new QueryClient();

// --- COMPONENTS ---

// Branded Splash Screen for Premium Feel
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-[#0b0b0d] flex flex-col items-center justify-center text-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/40 mb-8"
      >
        🇫🇯
      </motion.div>
      <h1 className="text-3xl font-black text-white tracking-tighter">Bula Health</h1>
      <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Connecting Fiji</p>
    </motion.div>
  );
};

// Subtle Heartbeat Status Light
const StatusLight = ({ color, blink, isDarkMode }: { color: string, blink?: boolean, isDarkMode: boolean }) => (
  <div className="relative flex items-center justify-center w-4 h-4">
    {blink && (
      <motion.div 
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
        className={`absolute inset-0 rounded-full ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`}
      />
    )}
    <div className={`h-2 w-2 rounded-full ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`} />
  </div>
);

function PharmacyAppContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  // Scroll visibility logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowNav(currentScrollY <= lastScrollY.current || currentScrollY < 50);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data } = await supabase.from('pharmacies').select('*').order('name', { ascending: true });
      return data || [];
    },
  });

  const filtered = pharmacies.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (selectedLocation === 'All' || p.address.toUpperCase().includes(selectedLocation))
  );

  return (
    <div className={`${isDarkMode ? 'dark bg-[#0b0b0d] text-white' : 'bg-[#f6f6fb] text-black'} min-h-screen font-sans transition-colors duration-500`}>
      <AnimatePresence>
        {!isLoaded && <SplashScreen onComplete={() => setIsLoaded(true)} />}
      </AnimatePresence>

      {isLoaded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-40">
          {/* Header */}
          <div className="sticky top-0 z-50 bg-[#0b0b0d]/80 backdrop-blur-xl border-b border-zinc-800 p-6">
            <header className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-black text-blue-500">Bula Health</h1>
              <button onClick={() => setIsDarkMode(!isDarkMode)}>🌙</button>
            </header>
            <input 
              type="text" 
              placeholder="Search pharmacy..." 
              className="w-full p-4 rounded-[22px] bg-zinc-900 border border-zinc-800 text-white text-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Directory List */}
          <main className="max-w-xl mx-auto p-6 grid gap-6">
            {filtered.map((p: any) => (
              <motion.div key={p.id} className="p-7 rounded-[40px] bg-zinc-900/40 border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <StatusLight color={p.is_open ? "green" : "red"} blink={p.is_open} isDarkMode={isDarkMode} />
                  <div>
                    <h2 className="font-bold text-lg">{p.name}</h2>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold">{p.address}</p>
                  </div>
                </div>
                
                {/* Premium Icon Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <a href={`tel:${p.phone_number}`} className="h-12 flex items-center justify-center bg-zinc-800 rounded-2xl hover:bg-zinc-700">📞</a>
                  <a href={`https://wa.me/${p.phone_number?.replace(/\s/g, '')}`} className="h-12 flex items-center justify-center bg-zinc-800 rounded-2xl hover:bg-zinc-700">💬</a>
                  <a href={`viber://add?number=${p.phone_number?.replace(/\s/g, '')}`} className="h-12 flex items-center justify-center bg-zinc-800 rounded-2xl hover:bg-zinc-700">V</a>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(p.address)}`} className="h-12 flex items-center justify-center bg-blue-600 rounded-2xl">📍</a>
                </div>
              </motion.div>
            ))}
          </main>

          {/* Navigation */}
          <AnimatePresence>
            {showNav && (
              <motion.nav 
                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="fixed bottom-10 left-6 right-6 z-[150] bg-zinc-900 rounded-[44px] p-2 flex"
              >
                <button onClick={() => setActiveTab('pharmacy')} className="flex-1 py-3 bg-blue-600 rounded-[32px] text-xs font-black">DIRECTORY</button>
                <button onClick={() => setActiveTab('about')} className="flex-1 py-3 text-zinc-500 text-xs font-black">ABOUT</button>
              </motion.nav>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PharmacyAppContent />
    </QueryClientProvider>
  );
}