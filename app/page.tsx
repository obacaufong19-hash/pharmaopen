'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
} from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const queryClient = new QueryClient();

// --- WELCOME SPLASH SCREEN ---
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200); // 2.2 seconds for brand recognition
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[1000] bg-[#0b0b0d] flex flex-col items-center justify-center text-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/40 mb-8"
      >
        🇫🇯
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-3xl font-black tracking-tighter text-white mb-2"
      >
        Bula Health
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.6 }}
        className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]"
      >
        Connecting Fiji
      </motion.p>
      
      {/* Loading Bar */}
      <div className="mt-12 w-32 h-1 bg-zinc-900 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-full h-full bg-blue-500"
        />
      </div>
    </motion.div>
  );
};

// --- PREVIOUS COMPONENTS RETAINED ---
const StatusLight = ({ color, blink = false, isDarkMode }: { color: string, blink?: boolean, isDarkMode: boolean }) => {
  const colorClasses: Record<string, string> = {
    green: isDarkMode ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]' : 'bg-green-500 border border-green-600',
    red: isDarkMode ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-red-500 border border-red-600'
  };
  return (
    <div className="relative flex items-center justify-center w-4 h-4">
      {blink && (
        <motion.div 
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: isDarkMode ? 2 : 1.6, opacity: 0 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={`absolute inset-0 rounded-full ${color === 'green' ? 'bg-green-400' : 'bg-red-400'}`}
        />
      )}
      <div className={`h-2.5 w-2.5 rounded-full z-10 ${colorClasses[color]} ${blink ? 'animate-pulse' : ''}`} />
    </div>
  );
};

function PharmacyAppContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data, error } = await supabase.from('pharmacies').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filteredPharmacies = pharmacies.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || p.address.toUpperCase().includes(selectedLocation);
    return matchesSearch && matchesLocation;
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05, delayChildren: 0.3 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } }
  };

  return (
    <div className={`${isDarkMode ? 'dark bg-[#0b0b0d] text-white' : 'bg-[#f6f6fb] text-black'} min-h-screen transition-colors duration-500 font-sans`}>
      
      <AnimatePresence>
        {!isLoaded && <SplashScreen onComplete={() => setIsLoaded(true)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="pb-40"
      >
        {/* HEADER */}
        <div className="sticky top-0 z-50">
          <div className={`${isDarkMode ? 'bg-[#0b0b0d]/90 border-zinc-800' : 'bg-[#f6f6fb]/80 border-white/40'} backdrop-blur-3xl p-6 border-b`}>
            <header className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-500">Bula Health</h1>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400 shadow-xl' : 'bg-white border-zinc-100 text-blue-600 shadow-inner'}`}>
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </header>

            {activeTab === 'pharmacy' && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                {['All', 'NAVUA', 'NASINU', 'NAUSORI', 'SUVA'].map((loc) => (
                  <button key={loc} onClick={() => setSelectedLocation(loc)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedLocation === loc ? 'bg-blue-600 text-white shadow-lg' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' : 'bg-white text-zinc-400 border border-zinc-100 shadow-sm')}`}>{loc}</button>
                ))}
              </div>
            )}
            <input type="text" placeholder="Search directory..." className={`w-full p-4 rounded-[22px] border outline-none text-sm font-bold ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50 text-white' : 'border-zinc-100 bg-white shadow-inner text-black'}`} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <main className="max-w-xl mx-auto p-6 pt-10">
          {activeTab === 'pharmacy' ? (
            <motion.div variants={containerVariants} initial="hidden" animate={isLoaded ? "show" : "hidden"} layout className="grid gap-6">
              {filteredPharmacies.map((p: any) => (
                <motion.div layout variants={cardVariants} key={p.id} className={`p-7 rounded-[40px] border ${isDarkMode ? 'border-zinc-800/50 bg-zinc-900/40' : 'bg-white border-zinc-100 shadow-lg'}`}>
                  {/* Card Content (Retained from previous build) */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <StatusLight color={p.is_open ? "green" : "red"} blink={p.is_open} isDarkMode={isDarkMode} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{p.name}</span>
                      </div>
                      <p className="text-zinc-500 text-[10px] uppercase font-black">{p.address}</p>
                    </div>
                  </div>
                  {/* Button Grid (Viber fixed) */}
                  <div className="grid grid-cols-4 gap-3">
                    <a href={`tel:${p.phone_number}`} className="h-14 rounded-2xl bg-zinc-800/40 flex items-center justify-center">📞</a>
                    <a href={`https://wa.me/${p.phone_number}`} className="h-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">💬</a>
                    <button onClick={() => window.location.href = `viber://add?number=${p.phone_number}`} className="h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">V</button>
                    <a href={`https://maps.google.com/?q=${p.name}`} className="h-14 rounded-2xl bg-blue-600 flex items-center justify-center">📍</a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
               <h2 className="text-2xl font-black">About Bula Health</h2>
               <p className="mt-4 opacity-50">Version 1.0.5 - Suva Edition</p>
            </div>
          )}
        </main>

        <AnimatePresence>
          {showNav && (
            <motion.nav 
              initial={{ y: 100, x: '-50%' }} 
              animate={{ y: 0, x: '-50%' }} 
              exit={{ y: 100, x: '-50%' }}
              className="fixed bottom-10 left-1/2 w-[90%] max-w-lg z-[150]"
            >
              <div className={`${isDarkMode ? 'bg-zinc-900/95 border-zinc-800 shadow-2xl' : 'bg-white/95 border-white shadow-2xl'} backdrop-blur-3xl rounded-[44px] border p-2 flex items-center justify-around`}>
                <button onClick={() => setActiveTab('pharmacy')} className={`flex-1 py-3 rounded-[32px] transition-all ${activeTab === 'pharmacy' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">Directory</span>
                </button>
                <button onClick={() => setActiveTab('about')} className={`flex-1 py-3 rounded-[32px] transition-all ${activeTab === 'about' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">About</span>
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
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