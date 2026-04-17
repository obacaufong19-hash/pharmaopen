'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
} from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient();

// --- LOGIC HELPERS ---

const triggerHaptic = (pattern = 10) => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// --- COMPONENTS ---

const StatusLight = ({ color, blink = false, isDarkMode }: { color: string, blink?: boolean, isDarkMode: boolean }) => {
  const colorClasses: any = {
    // Premium glow for dark mode, tighter focus for light mode
    green: isDarkMode ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]' : 'bg-green-500 border border-green-600',
    orange: isDarkMode ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.9)]' : 'bg-orange-500 border border-orange-600',
    red: isDarkMode ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-red-500 border border-red-600'
  };

  return (
    <div className="relative flex items-center justify-center w-4 h-4">
      {blink && (
        <motion.div 
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: isDarkMode ? 2 : 1.6, opacity: 0 }}
          transition={{ repeat: Infinity, duration: isDarkMode ? 1.5 : 1.2 }}
          className={`absolute inset-0 rounded-full ${color === 'orange' ? 'bg-orange-400' : 'bg-green-400'}`}
        />
      )}
      <div className={`h-2.5 w-2.5 rounded-full z-10 ${colorClasses[color]} ${blink ? 'animate-pulse' : ''}`} />
    </div>
  );
};

function PharmacyAppContent() {
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true); // Starting with Dark Mode
  const [lang, setLang] = useState('ENG');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [onlyFreeMeds, setOnlyFreeMeds] = useState(false);
  
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) setShowNav(false);
      else setShowNav(true);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: pharmacies = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data, error } = await supabase.from('pharmacies').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleGetDirections = (address: string) => {
    triggerHaptic(20);
    const destination = encodeURIComponent(`${address}, Fiji`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
  };

  const filteredPharmacies = pharmacies.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || p.address.toUpperCase().includes(selectedLocation);
    const matchesFreeMeds = !onlyFreeMeds || p.free_medicine === true;
    return matchesSearch && matchesLocation && matchesFreeMeds;
  });

  return (
    // Premium off-white base for light mode
    <div className={`${isDarkMode ? 'dark bg-[#0b0b0d] text-white' : 'bg-[#f6f6fb] text-black'} min-h-screen transition-colors duration-500 pb-40 font-sans`}>
      
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-50">
        {/* Soft blur for light mode */}
        <motion.div className={`${isDarkMode ? 'bg-[#0b0b0d]/90 border-zinc-800' : 'bg-[#f6f6fb]/80 border-white/40'} backdrop-blur-3xl p-6 border-b`}>
          <header className="flex justify-between items-center mb-6 gap-3">
            <h1 className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-500">Bula Health</h1>
            
            <div className="flex-1 flex gap-2 justify-end">
              {/* Premium Language Switcher */}
              <div className={`flex rounded-full p-1 border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-inner'}`}>
                {['ENG', 'TAU', 'HIN'].map((l) => (
                  <button key={l} onClick={() => setLang(l)} className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${lang === l ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>{l}</button>
                ))}
              </div>
              
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => refetch()} className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600 shadow-inner'}`}>
                <svg className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-white border-zinc-100 text-blue-600 shadow-inner'}`}>
                {isDarkMode ? '🌙' : '☀️'}
              </motion.button>
            </div>
          </header>

          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
            {['All', 'NAVUA', 'NASINU', 'NAUSORI', 'SUVA'].map((loc) => (
              <button key={loc} onClick={() => setSelectedLocation(loc)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedLocation === loc ? 'bg-blue-600 text-white shadow-lg' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' : 'bg-white text-zinc-400 border border-zinc-100 shadow-sm')}`}>{loc}</button>
            ))}
          </div>

          <div className="flex gap-3">
            <input type="text" placeholder="Search directory..." className={`flex-1 p-4 rounded-[22px] border outline-none text-sm font-bold ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50 text-white' : 'border-zinc-100 bg-white shadow-inner text-black'}`} onChange={(e) => setSearchQuery(e.target.value)} />
            <button onClick={() => setOnlyFreeMeds(!onlyFreeMeds)} className={`px-4 rounded-[22px] border flex items-center gap-2 transition-all ${onlyFreeMeds ? 'bg-blue-600 border-blue-600 text-white' : (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-zinc-500 shadow-sm')}`}>
              <span className="text-[10px] font-black uppercase tracking-tighter">Free Meds</span>
            </button>
          </div>
        </motion.div>
      </div>

      <main className="max-w-xl mx-auto p-6 pt-10">
        <motion.div layout className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPharmacies.map((p: any) => (
              // Premium White cards on off-white base for light mode
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={p.id} className={`p-7 rounded-[40px] border transition-all ${isDarkMode ? 'border-zinc-800/50 bg-zinc-900/40 shadow-2xl' : 'border-zinc-100/40 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]'}`}>
                <div className="flex justify-between items-start mb-8 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <StatusLight color={p.is_open ? "green" : "red"} blink={p.is_open} isDarkMode={isDarkMode} />
                      {p.free_medicine && <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Free Medicine Program</span>}
                    </div>
                    <h2 className="text-xl font-black tracking-tight mb-1">{p.name}</h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest opacity-60">{p.address}</p>
                  </div>
                  <a href={`tel:${p.phone_number}`} className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5c-1.242 0-2.25 1.008-2.25 2.25z"/></svg>
                  </a>
                </div>
                
                {/* Premium Inset Buttons for Light Mode */}
                <div className="grid grid-cols-3 gap-3">
                  <a href={`https://wa.me/${p.phone_number?.replace(/\s/g, '')}`} className={`py-4 rounded-[20px] border flex justify-center items-center ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700' : 'bg-white border-zinc-200 shadow-inner'}`}>
                    <svg className="w-4.5 h-4.5 fill-green-600" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.402-.003 6.557-5.338 11.892-11.893 11.892-1.992-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.467c1.489.881 3.153 1.345 4.856 1.346h.005c5.42 0 9.832-4.412 9.835-9.832.001-2.625-1.022-5.093-2.882-6.954-1.859-1.86-4.327-2.883-6.954-2.883-5.42 0-9.831 4.412-9.835 9.832-.001 1.761.469 3.483 1.359 4.987l-1.021 3.725 3.812-.999z"/></svg>
                  </a>
                  <button className={`py-4 rounded-[20px] border flex justify-center items-center ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700' : 'bg-white border-zinc-200 shadow-inner'}`}>
                    <div className="w-4.5 h-4.5 rounded-full border-2 border-purple-500 flex items-center justify-center text-[8.5px] font-black text-purple-500">V</div>
                  </button>
                  <button onClick={() => handleGetDirections(p.address)} className={`py-4 rounded-[20px] border flex justify-center items-center ${isDarkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-white border-zinc-200 shadow-inner text-zinc-600'}`}>
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      <AnimatePresence>
        {showNav && (
          <motion.nav initial={{ y: 100, x: '-50%' }} animate={{ y: 0, x: '-50%' }} exit={{ y: 100, x: '-50%' }} className="fixed bottom-10 left-1/2 w-[92%] max-w-lg z-[100]">
            <div className={`${isDarkMode ? 'bg-zinc-900/95 border-zinc-800 shadow-2xl' : 'bg-white/95 border-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]'} backdrop-blur-3xl rounded-[44px] border p-2.5 flex items-center justify-around`}>
              {['pharmacy', 'map', 'sos', 'pro'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-[32px] transition-all ${activeTab === tab ? 'bg-blue-600/10 text-blue-500 shadow-inner' : 'text-zinc-500'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{tab}</span>
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
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