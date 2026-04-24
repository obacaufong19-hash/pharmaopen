'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
} from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const queryClient = new QueryClient();

// --- REUSABLE COMPONENTS ---

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

// --- MAIN APPLICATION CONTENT ---

function VitiPulseContent() {
  const [activeTab, setActiveTab] = useState('directory');
  const [activeCategory, setActiveCategory] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  // Scroll Behavior: Hide nav on scroll down, show on scroll up
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

  // Fetching Logic from Supabase
  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ['facilities', activeCategory],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data, error } = await supabase
        .from('directory') // Make sure your table is named 'directory'
        .select('*')
        .eq('category', activeCategory)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Filtering Logic
  const filteredFacilities = facilities.filter((f: any) => {
    const name = f.name?.toLowerCase() || '';
    const address = f.address?.toUpperCase() || '';
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || address.includes(selectedLocation);
    return matchesSearch && matchesLocation;
  });

  // Action Handlers
  const handleViber = (phone: string) => {
    const cleanPhone = phone?.replace(/\s/g, '').replace('+', '') || '';
    window.location.href = `viber://add?number=${cleanPhone}`;
  };

  const handleGetDirections = (name: string, address: string) => {
    // Construct Google Maps URL (Current Location to Destination)
    const destination = encodeURIComponent(`${name}, ${address}, Fiji`);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  const categories = [
    { id: 'pharmacy', label: 'Pharmacies', icon: '💊' },
    { id: 'supermarket', label: 'Supermarkets', icon: '🛒' },
    { id: 'retail', label: 'Shops', icon: '🛍️' }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } }
  };

  return (
    <div className={`${isDarkMode ? 'dark bg-[#0b0b0d] text-white' : 'bg-[#f6f6fb] text-black'} min-h-screen transition-colors duration-500 pb-40 font-sans`}>
      
      {/* HEADER & FILTERS */}
      <div className="sticky top-0 z-50">
        <div className={`${isDarkMode ? 'bg-[#0b0b0d]/90 border-zinc-800' : 'bg-[#f6f6fb]/80 border-white/40'} backdrop-blur-3xl p-6 border-b`}>
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-500 uppercase">Viti Pulse</h1>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-white border-zinc-100 text-blue-600 shadow-inner'}`}>
              {isDarkMode ? '🌙' : '☀️'}
            </button>
          </header>

          {activeTab === 'directory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Category Switching */}
              <div className="flex gap-3 mb-6">
                {categories.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex-1 py-3 rounded-2xl border transition-all flex flex-col items-center gap-1 ${activeCategory === cat.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-zinc-400 shadow-sm')}`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[9px] font-black uppercase tracking-tighter">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Location Pill Filters */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                {['All', 'SUVA', 'NASINU', 'NAUSORI', 'NADI', 'LAUTOKA', 'LAMI', 'NAVUA'].map((loc) => (
                  <button key={loc} onClick={() => setSelectedLocation(loc)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedLocation === loc ? 'bg-blue-600 text-white shadow-lg' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' : 'bg-white text-zinc-400 border border-zinc-100 shadow-sm')}`}>{loc}</button>
                ))}
              </div>

              {/* Search Bar */}
              <input 
                type="text" 
                placeholder={`Search ${activeCategory}s in Fiji...`} 
                className={`w-full p-4 rounded-[22px] border outline-none text-sm font-bold ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50 text-white' : 'border-zinc-100 bg-white shadow-inner text-black'}`} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </motion.div>
          )}
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6 pt-10">
        {activeTab === 'directory' ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" layout className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {filteredFacilities.length > 0 ? filteredFacilities.map((f: any) => (
                <motion.div layout variants={cardVariants} key={f.id} className={`p-7 rounded-[40px] border ${isDarkMode ? 'border-zinc-800/50 bg-zinc-900/40 shadow-2xl' : 'border-zinc-100/40 bg-white shadow-lg'}`}>
                  <div className="flex justify-between items-start mb-8 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Status logic toggled by is_open in DB */}
                        <StatusLight color={f.is_open ? "green" : "red"} blink={f.is_open} isDarkMode={isDarkMode} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${f.is_open ? 'text-green-500' : 'text-red-500'}`}>
                          {f.is_open ? 'Open Now' : 'Closed'}
                        </span>
                      </div>
                      <h2 className="text-xl font-black tracking-tight">{f.name}</h2>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-60">{f.address}</p>
                    </div>
                  </div>
                  
                  {/* ICON GRID ACTIONS */}
                  <div className="grid grid-cols-4 gap-3">
                    <a href={`tel:${f.phone_number}`} className={`h-14 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-zinc-800/40 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                    </a>
                    <a href={`https://wa.me/${f.phone_number?.replace(/\s/g, '')}`} className={`h-14 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-zinc-800/40 text-green-500' : 'bg-green-50 text-green-600'}`}>
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </a>
                    <button onClick={() => handleViber(f.phone_number)} className={`h-14 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-zinc-800/40 text-[#7360f2]' : 'bg-purple-50 text-[#7360f2]'}`}>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.1 13.9s-.1-.1-.1-.2V9.5c0-3.5-2.8-6.4-6.3-6.4-3.5 0-6.3 2.9-6.3 6.4v7.3c0 .3.2.6.5.6h3.4c.3 0 .5-.2.5-.5v-3.4c0-.3-.2-.5-.5-.5H8.7v-3.4c0-2.3 1.9-4.2 4.1-4.2 2.3 0 4.1 1.9 4.1 4.2v3.4h-1.6c-.3 0-.5.2-.5.5v3.4c0 .3.2.5.5.5H19c.3 0 .5-.2.5-.6v-.1c-.1-.3-.2-.5-.4-.7zm-8.8-.5h-.9v-1.8h.9c.5 0 .9.4.9.9s-.4.9-.9.9zm0-2.8h-.9v-1.8h.9c.5 0 .9.4.9.9s-.4.9-.9.9zm4.2 5.6h-.9v-1.8h.9c.5 0 .9.4.9.9s-.4.9-.9.9zm0-2.8h-.9v-1.8h.9c.5 0 .9.4.9.9s-.4.9-.9.9zM22.1 10.4c0-5.4-4.4-9.7-9.8-9.7S2.5 5 2.5 10.4c0 2.2.7 4.3 2.1 6L3 22.1l5.9-1.5c1.6 1.1 3.5 1.7 5.4 1.7 5.4 0 9.8-4.3 9.8-9.7z"/></svg>
                    </button>
                    {/* GET DIRECTIONS BUTTON */}
                    <button 
                      onClick={() => handleGetDirections(f.name, f.address)} 
                      className={`h-14 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-20 opacity-50">No results found for your search.</div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ABOUT PAGE CONTENT */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-[35px] mx-auto mb-8 flex items-center justify-center text-4xl shadow-2xl">🇫🇯</div>
            <h2 className="text-3xl font-black mb-3 tracking-tight uppercase">Viti Pulse</h2>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed mb-12">Your all-in-one directory for local pharmacies, supermarkets, and essential retail in Fiji.</p>
            <div className="space-y-4 text-left">
              <div className={`p-8 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-500 mb-3">Community Hub</h3>
                <p className="text-sm font-medium leading-relaxed opacity-80 italic text-zinc-400">"Check the pulse before you head out."</p>
                <p className="text-sm mt-4">Real-time operating statuses updated directly by local shop owners and administrators.</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <AnimatePresence>
        {showNav && (
          <motion.nav 
            initial={{ y: 100, x: '-50%' }} 
            animate={{ y: 0, x: '-50%' }} 
            exit={{ y: 100, x: '-50%' }}
            className="fixed bottom-10 left-1/2 w-[92%] max-w-lg z-[150]"
          >
            <div className={`${isDarkMode ? 'bg-zinc-900/95 border-zinc-800 shadow-2xl' : 'bg-white/95 border-white shadow-2xl'} backdrop-blur-3xl rounded-[44px] border p-2 flex items-center justify-around`}>
              <button onClick={() => setActiveTab('directory')} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[32px] transition-all ${activeTab === 'directory' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">Explore</span>
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

// Root Wrapper
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VitiPulseContent />
    </QueryClientProvider>
  );
}