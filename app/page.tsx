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

  // Scroll Listener for Auto-Hiding Nav
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } }
  };

  const { data: pharmacies = [], isFetching } = useQuery({
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
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400 shadow-xl' : 'bg-white border-zinc-100 text-blue-600 shadow-inner'}`}>
              {isDarkMode ? '🌙' : '☀️'}
            </button>
          </header>

          {activeTab === 'pharmacy' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
                {['All', 'NAVUA', 'NASINU', 'NAUSORI', 'SUVA'].map((loc) => (
                  <button key={loc} onClick={() => setSelectedLocation(loc)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedLocation === loc ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' : 'bg-white text-zinc-400 border border-zinc-100 shadow-sm')}`}>{loc}</button>
                ))}
              </div>
              <div className="relative">
                <input type="text" placeholder="Search pharmacy..." className={`w-full p-4 rounded-[22px] border outline-none text-sm font-bold ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50 text-white' : 'border-zinc-100 bg-white shadow-inner text-black'}`} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6 pt-10">
        {activeTab === 'pharmacy' ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" layout className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPharmacies.map((p: any) => (
                <motion.div layout variants={cardVariants} key={p.id} className={`p-7 rounded-[40px] border ${isDarkMode ? 'border-zinc-800/50 bg-zinc-900/40 shadow-2xl' : 'border-zinc-100/40 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]'}`}>
                  <div className="flex justify-between items-start mb-8 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <StatusLight color={p.is_open ? "green" : "red"} blink={p.is_open} isDarkMode={isDarkMode} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${p.is_open ? 'text-green-500' : 'text-red-500'}`}>{p.is_open ? 'Open Now' : 'Closed'}</span>
                      </div>
                      <h2 className="text-xl font-black tracking-tight leading-tight">{p.name}</h2>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-60 leading-relaxed">{p.address}</p>
                    </div>
                  </div>
                  
                  {/* ICON BUTTONS GRID */}
                  <div className="grid grid-cols-4 gap-3">
                    <a href={`tel:${p.phone_number}`} className={`h-14 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-zinc-800/40 hover:bg-zinc-800' : 'bg-[#f8f9ff] border border-blue-50 text-blue-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M2.25 6.622c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5V6.622z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </a>
                    <a href={`https://wa.me/${p.phone_number?.replace(/\s/g, '')}`} className={`h-14 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-zinc-800/40 text-green-500 hover:bg-zinc-800' : 'bg-green-50 border border-green-100 text-green-600'}`}>
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </a>
                    <button onClick={() => handleViber(p.phone_number)} className={`h-14 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-zinc-800/40 text-purple-400 hover:bg-zinc-800' : 'bg-purple-50 border border-purple-100 text-purple-600'}`}>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.107 14.887a.972.972 0 0 1 .49-.49.972.972 0 0 1 .49.49.972.972 0 0 1-.49.49.972.972 0 0 1-.49-.49zm-4.706-6.176c.265 0 .52.105.707.293.188.188.293.442.293.707 0 .552.448 1 1 1s1-.448 1-1c0-1.547-1.253-2.8-2.8-2.8-1.547 0-2.8 1.253-2.8 2.8 0 .552.448 1 1 1s1-.448 1-1c0-.265.105-.52.293-.707.188-.188.442-.293.707-.293zm8.013 1.936c0 .552.448 1 1 1s1-.448 1-1c0-4.302-3.498-7.8-7.8-7.8-.552 0-1 .448-1 1s.448 1 1 1c3.2 0 5.8 2.6 5.8 5.8zm1.086 11.082c-.22.46-.48.88-.78 1.26-1.29 1.63-3.08 2.61-4.99 2.61-3.5 0-8.2-2.7-11.33-5.83C2.267 15.61 0 12.01 0 8.01c0-2.22 1.34-4.51 3.42-5.71 1.03-.6 2.05-.8 3.01-.8.74 0 1.4.12 1.92.35.48.21.91.56 1.25 1.03l1.83 2.51c.64.88.64 2.11 0 2.99l-.79 1.08c-.14.19-.17.43-.07.64 1.14 2.39 3.08 4.33 5.47 5.47.21.1.45.07.64-.07l1.08-.79c.88-.64 2.11-.64 2.99 0l2.51 1.83c.47.34.82.77 1.03 1.25.23.52.35 1.18.35 1.92 0 .96-.2 1.98-.8 3.01z"/></svg>
                    </button>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.name + ' ' + p.address)}`} target="_blank" className={`h-14 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-2xl shadow-blue-500/30">🇫🇯</div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">About Bula Health</h2>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
              Designed for Fiji to help everyone find local pharmacies and essential health services instantly.
            </p>
            <div className="mt-12 space-y-4 text-left">
              <div className={`p-7 rounded-[35px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-500 mb-3">Our Mission</h3>
                <p className="text-sm font-medium leading-relaxed opacity-80">Empowering health through simple, localized technology that works for every Fijian.</p>
              </div>
              <div className={`p-7 rounded-[35px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-3">Software Version</h3>
                <p className="text-sm font-bold">1.0.5 - Suva Edition</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* AUTO-HIDING NAVIGATION */}
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