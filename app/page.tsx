'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
} from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const queryClient = new QueryClient();

// --- COMPONENTS ---

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
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  // --- SCROLL HIDE LOGIC ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide when scrolling down, show when scrolling up
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } }
  };

  const { data: pharmacies = [], isFetching, refetch } = useQuery({
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

  // Fix for Viber: using the specific intent protocol
  const handleViber = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '').replace('+', '');
    window.location.href = `viber://add?number=${cleanPhone}`;
  };

  return (
    <div className={`${isDarkMode ? 'dark bg-[#0b0b0d] text-white' : 'bg-[#f6f6fb] text-black'} min-h-screen transition-colors duration-500 pb-40 font-sans`}>
      
      {/* HEADER */}
      <div className="sticky top-0 z-50">
        <div className={`${isDarkMode ? 'bg-[#0b0b0d]/90 border-zinc-800' : 'bg-[#f6f6fb]/80 border-white/40'} backdrop-blur-3xl p-6 border-b`}>
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-500">Bula Health</h1>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-white border-zinc-100 text-blue-600 shadow-inner'}`}>
              {isDarkMode ? '🌙' : '☀️'}
            </button>
          </header>

          {activeTab === 'pharmacy' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                {['All', 'NAVUA', 'NASINU', 'NAUSORI', 'SUVA'].map((loc) => (
                  <button key={loc} onClick={() => setSelectedLocation(loc)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedLocation === loc ? 'bg-blue-600 text-white shadow-lg' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' : 'bg-white text-zinc-400 border border-zinc-100 shadow-sm')}`}>{loc}</button>
                ))}
              </div>
              <input type="text" placeholder="Search pharmacy..." className={`w-full p-4 rounded-[22px] border outline-none text-sm font-bold ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50 text-white' : 'border-zinc-100 bg-white shadow-inner text-black'}`} onChange={(e) => setSearchQuery(e.target.value)} />
            </motion.div>
          )}
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6 pt-10">
        {activeTab === 'pharmacy' ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" layout className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPharmacies.map((p: any) => (
                <motion.div layout variants={cardVariants} key={p.id} className={`p-7 rounded-[40px] border ${isDarkMode ? 'border-zinc-800/50 bg-zinc-900/40 shadow-2xl' : 'border-zinc-100/40 bg-white shadow-lg'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <StatusLight color={p.is_open ? "green" : "red"} blink={p.is_open} isDarkMode={isDarkMode} />
                        <span className={`text-[10px] font-black uppercase ${p.is_open ? 'text-green-500' : 'text-red-500'}`}>{p.is_open ? 'Open Now' : 'Closed'}</span>
                      </div>
                      <h2 className="text-xl font-black tracking-tight">{p.name}</h2>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">{p.address}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <a href={`tel:${p.phone_number}`} className={`py-4 rounded-[20px] border flex justify-center items-center font-black text-[9px] uppercase tracking-widest ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700' : 'bg-white border-zinc-200 shadow-inner'}`}>Call</a>
                    <a href={`https://wa.me/${p.phone_number?.replace(/\s/g, '')}`} className={`py-4 rounded-[20px] border flex justify-center items-center font-black text-[9px] uppercase tracking-widest text-green-600 ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700' : 'bg-white border-zinc-200 shadow-inner'}`}>WA</a>
                    <button onClick={() => handleViber(p.phone_number)} className={`py-4 rounded-[20px] border flex justify-center items-center font-black text-[9px] uppercase tracking-widest text-purple-500 ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700' : 'bg-white border-zinc-200 shadow-inner'}`}>Viber</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20">🇫🇯</div>
            <h2 className="text-3xl font-black mb-2">About Bula Health</h2>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
              Designed for the people of Fiji to easily locate open pharmacies and essential health services in their local area.
            </p>
            
            <div className="mt-12 space-y-4 text-left">
              <div className={`p-6 rounded-[35px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <h3 className="font-black text-xs uppercase tracking-widest text-blue-500 mb-2">Our Mission</h3>
                <p className="text-sm leading-relaxed">To bridge the gap between patients and healthcare providers through simple, localized technology.</p>
              </div>
              <div className={`p-6 rounded-[35px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-2">Version</h3>
                <p className="text-sm font-bold">1.0.4 - "Viti Levu" Build</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* AUTO-HIDING BOTTOM NAV */}
      <AnimatePresence>
        {showNav && (
          <motion.nav 
            initial={{ y: 100, x: '-50%' }} 
            animate={{ y: 0, x: '-50%' }} 
            exit={{ y: 100, x: '-50%' }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="fixed bottom-10 left-1/2 w-[90%] max-w-lg z-[150]"
          >
            <div className={`${isDarkMode ? 'bg-zinc-900/95 border-zinc-800 shadow-2xl' : 'bg-white/95 border-white shadow-2xl'} backdrop-blur-3xl rounded-[44px] border p-2 flex items-center justify-around`}>
              <button onClick={() => setActiveTab('pharmacy')} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[32px] transition-all ${activeTab === 'pharmacy' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">Directory</span>
              </button>
              <button onClick={() => setActiveTab('about')} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[32px] transition-all ${activeTab === 'about' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">About</span>
              </button>
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