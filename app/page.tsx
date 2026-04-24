'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
} from '@tanstack/react-query';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const queryClient = new QueryClient();

// --- PREMIUM COMPONENTS ---

const SplashScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[1000] bg-[#0b0b0d] flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-24 h-24 bg-blue-600 rounded-[30px] flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(37,99,235,0.3)]">
          🇫🇯
        </div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-blue-600 rounded-[30px] blur-2xl -z-10"
        />
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 text-2xl font-black tracking-[0.3em] uppercase text-white"
      >
        Viti Pulse
      </motion.h1>
      
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: 100 }}
        transition={{ delay: 1, duration: 1.5 }}
        className="mt-4 h-[2px] bg-blue-600/50 rounded-full"
      />
    </motion.div>
  );
};

const StatusLight = ({ color, blink = false, isDarkMode }: { color: string, blink?: boolean, isDarkMode: boolean }) => (
  <div className="relative flex items-center justify-center w-4 h-4">
    {blink && (
      <motion.div 
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`absolute inset-0 rounded-full ${color === 'green' ? 'bg-green-400' : 'bg-red-400'}`}
      />
    )}
    <div className={`h-2 w-2 rounded-full z-10 ${color === 'green' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`} />
  </div>
);

// --- MAIN APPLICATION CONTENT ---

function VitiPulseContent() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore');
  const [activeCategory, setActiveCategory] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');

  // Splash logic
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities', activeCategory],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data } = await supabase
        .from('directory')
        .select('*')
        .eq('category', activeCategory)
        .order('is_featured', { ascending: false }); // Sort featured first
      return data || [];
    },
  });

  const filtered = facilities.filter((f: any) => {
    const matchesSearch = f.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLoc = selectedLocation === 'All' || f.address?.toUpperCase().includes(selectedLocation);
    return matchesSearch && matchesLoc;
  });

  const handleGetDirections = (name: string, address: string) => {
    const destination = encodeURIComponent(`${name}, ${address}, Fiji`);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className={`${isDarkMode ? 'bg-[#0b0b0d] text-white' : 'bg-[#f8f9fa] text-zinc-900'} min-h-screen font-sans selection:bg-blue-500/30`}>
      <AnimatePresence>
        {loading && <SplashScreen key="splash" />}
      </AnimatePresence>

      {/* HEADER & FILTER STICKY ZONE */}
      <div className="sticky top-0 z-[100]">
        <div className={`px-6 pt-8 pb-6 border-b backdrop-blur-xl ${isDarkMode ? 'bg-[#0b0b0d]/80 border-zinc-800/50' : 'bg-white/80 border-zinc-200'}`}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-xs font-black tracking-[0.3em] uppercase text-blue-600 mb-1">Viti Pulse</h1>
              <p className="text-lg font-bold tracking-tight">Essential Directory</p>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-white border-zinc-200 text-blue-600'}`}
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
          </div>

          {/* PREMIUM CATEGORY SWITCHER */}
          <div className="flex gap-2 mb-6 p-1 bg-zinc-900/40 rounded-[22px] border border-zinc-800/50">
            {['pharmacy', 'supermarket', 'retail'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {cat === 'retail' ? 'Shops' : cat + 's'}
              </button>
            ))}
          </div>

          {/* LOCATION FILTER SYSTEM */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['All', 'SUVA', 'NADI', 'LAUTOKA', 'NASINU', 'NAUSORI', 'LAMI', 'NAVUA'].map((loc) => (
              <button 
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedLocation === loc ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 bg-zinc-900/20 hover:bg-zinc-800/50'}`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="px-6 py-10 pb-40 max-w-2xl mx-auto">
        {/* SEARCH EXPERIENCE */}
        <div className="relative group mb-10">
          <input 
            type="text" 
            placeholder={`Search ${activeCategory}s...`}
            className="w-full h-16 px-6 rounded-3xl bg-zinc-900/30 border border-zinc-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-zinc-600"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">🔍</div>
        </div>

        {/* FACILITY CARDS */}
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? filtered.map((f: any) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={f.id}
                className={`group relative p-7 rounded-[40px] border transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-zinc-900/20 border-zinc-800/50' : 'bg-white border-zinc-200/60 shadow-sm'}`}
              >
                {f.is_featured && (
                  <div className="absolute -top-3 left-10 px-4 py-1.5 bg-blue-600 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 text-white">
                    Premium Partner
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-8 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <StatusLight color={f.is_open ? 'green' : 'red'} blink={f.is_open} isDarkMode={isDarkMode} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${f.is_open ? 'text-green-500' : 'text-zinc-500'}`}>
                        {f.is_open ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-2 leading-tight">{f.name}</h3>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest opacity-60">{f.address}</p>
                  </div>
                </div>

                {/* ACTION SUITE */}
                <div className="grid grid-cols-4 gap-3">
                  <a href={`tel:${f.phone_number}`} className="h-14 rounded-2xl bg-zinc-800/30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.133-5.118-3.427-6.25-6.25l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                  </a>
                  <a href={`https://wa.me/${f.phone_number?.replace(/\D/g,'')}`} className="h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 hover:bg-green-500/20 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </a>
                  <button onClick={() => window.location.href=`viber://add?number=${f.phone_number?.replace(/\D/g,'')}`} className="h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-[#7360f2] hover:bg-purple-500/20 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.1 13.9s-.1-.1-.1-.2V9.5c0-3.5-2.8-6.4-6.3-6.4-3.5 0-6.3 2.9-6.3 6.4v7.3c0 .3.2.6.5.6h3.4c.3 0 .5-.2.5-.5v-3.4c0-.3-.2-.5-.5-.5H8.7v-3.4c0-2.3 1.9-4.2 4.1-4.2 2.3 0 4.1 1.9 4.1 4.2v3.4h-1.6c-.3 0-.5.2-.5.5v3.4c0 .3.2.5.5.5H19c.3 0 .5-.2.5-.6v-.1c-.1-.3-.2-.5-.4-.7zm-8.8-.5h-.9v-1.8h.9c.5 0 .9.4.9.9s-.4.9-.9.9zm0-2.8h-.9v-1.8h.9c.5 0 .9.4.9.9s-.4.9-.9.9zm4.2 5.6h-.9v-1.8h.9c.5 0 .9.4.9.9s-.4.9-.9.9zm0-2.8h-.9v-1.8h.9c.5 0 .9.4.9.9s-.4.9-.9.9zM22.1 10.4c0-5.4-4.4-9.7-9.8-9.7S2.5 5 2.5 10.4c0 2.2.7 4.3 2.1 6L3 22.1l5.9-1.5c1.6 1.1 3.5 1.7 5.4 1.7 5.4 0 9.8-4.3 9.8-9.7z"/></svg>
                  </button>
                  <button 
                    onClick={() => handleGetDirections(f.name, f.address)}
                    className="h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-20 opacity-30 text-xs font-black uppercase tracking-[0.2em]">No Matches Found</div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FIXED FOOTER NAV */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[200]">
        <div className="bg-zinc-950/80 border border-zinc-800/50 backdrop-blur-2xl rounded-full p-2 flex gap-1 shadow-2xl">
          {['explore', 'about'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VitiPulseContent />
    </QueryClientProvider>
  );
}