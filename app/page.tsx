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

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
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

// --- MAIN APP ---

function VitiPulseContent() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('explore');
  const [activeCategory, setActiveCategory] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
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
        .order('is_featured', { ascending: false });
      return data || [];
    },
  });

  const filtered = facilities.filter((f: any) => {
    const matchesSearch = f.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLoc = selectedLocation === 'All' || f.address?.toUpperCase().includes(selectedLocation);
    return matchesSearch && matchesLoc;
  });

  const handleGetDirections = (name: string, address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name + ", " + address + ", Fiji")}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`${isDarkMode ? 'bg-[#0b0b0d] text-white' : 'bg-[#f8f9fa] text-zinc-900'} min-h-screen font-sans selection:bg-blue-500/30`}>
      <AnimatePresence>
        {loading && <SplashScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-[100]">
        <div className={`px-6 pt-8 pb-6 border-b backdrop-blur-xl ${isDarkMode ? 'bg-[#0b0b0d]/80 border-zinc-800/50' : 'bg-white/80 border-zinc-200'}`}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-xs font-black tracking-[0.3em] uppercase text-blue-600 mb-1">Viti Pulse</h1>
              <p className="text-lg font-bold tracking-tight">Fiji Directory</p>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-12 h-12 rounded-2xl flex items-center justify-center border border-zinc-800 bg-zinc-900/50 text-xl shadow-inner">
              {isDarkMode ? '✨' : '🌙'}
            </button>
          </div>

          {/* CATEGORIES */}
          <div className="flex gap-2 mb-6 p-1 bg-zinc-900/40 rounded-[22px] border border-zinc-800/50">
            {['pharmacy', 'supermarket', 'retail'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* LOCATION PILLS */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['All', 'SUVA', 'NADI', 'LAUTOKA', 'NASINU', 'NAUSORI'].map((loc) => (
              <button 
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedLocation === loc ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 bg-zinc-900/20'}`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SEARCH FIELD */}
      <div className="px-6 mt-8">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search name or street..."
            className="w-full h-16 px-6 rounded-3xl bg-zinc-900/30 border border-zinc-800 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</div>
        </div>
      </div>

      {/* BUSINESS LIST */}
      <main className="px-6 py-10 pb-40">
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((f: any) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={f.id}
                className={`group relative p-6 rounded-[35px] border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'bg-zinc-900/20 border-zinc-800/50 hover:bg-zinc-900/40' : 'bg-white border-zinc-200/60 shadow-sm'}`}
              >
                {f.is_featured && (
                  <div className="absolute -top-3 left-8 px-4 py-1 bg-blue-600 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20">
                    Premium Partner
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <StatusLight color={f.is_open ? 'green' : 'red'} blink={f.is_open} isDarkMode={isDarkMode} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${f.is_open ? 'text-green-500' : 'text-zinc-500'}`}>
                        {f.is_open ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-1">{f.name}</h3>
                    <p className="text-zinc-500 text-xs font-medium">{f.address}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <a href={`tel:${f.phone_number}`} className="h-14 rounded-2xl bg-zinc-800/30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">📞</a>
                  <a href={`https://wa.me/${f.phone_number?.replace(/\D/g,'')}`} className="h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 hover:bg-green-500/20 transition-colors">💬</a>
                  <button onClick={() => window.location.href=`viber://add?number=${f.phone_number?.replace(/\D/g,'')}`} className="h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-[#7360f2] hover:bg-purple-500/20 transition-colors">🟣</button>
                  <button 
                    onClick={() => handleGetDirections(f.name, f.address)}
                    className="h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors"
                  >
                    📍
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[200]">
        <div className="bg-zinc-950/80 border border-zinc-800/50 backdrop-blur-2xl rounded-full p-2 flex gap-1 shadow-2xl">
          {['explore', 'about'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-black' : 'text-zinc-500'}`}
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