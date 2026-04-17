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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  // --- ANIMATION VARIANTS (TS SAFE) ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 25, stiffness: 400 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const modalVariants: Variants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { y: "100%", opacity: 0 }
  };

  // --- DATA FETCHING ---
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

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResult(true);
      }, 2500);
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark bg-[#0b0b0d] text-white' : 'bg-[#f6f6fb] text-black'} min-h-screen transition-colors duration-500 pb-40 font-sans`}>
      
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-50">
        <div className={`${isDarkMode ? 'bg-[#0b0b0d]/90 border-zinc-800' : 'bg-[#f6f6fb]/80 border-white/40'} backdrop-blur-3xl p-6 border-b`}>
          <header className="flex justify-between items-center mb-6 gap-3">
            <h1 className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-500">Bula Health</h1>
            <div className="flex gap-2">
              <button onClick={() => refetch()} className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 shadow-inner'}`}>
                <svg className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-white border-zinc-100 text-blue-600 shadow-inner'}`}>
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>
          </header>

          {activeTab === 'pharmacy' && (
            <>
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                {['All', 'NAVUA', 'NASINU', 'NAUSORI', 'SUVA'].map((loc) => (
                  <button key={loc} onClick={() => setSelectedLocation(loc)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedLocation === loc ? 'bg-blue-600 text-white shadow-lg' : (isDarkMode ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' : 'bg-white text-zinc-400 border border-zinc-100 shadow-sm')}`}>{loc}</button>
                ))}
              </div>
              <input type="text" placeholder="Search pharmacy..." className={`w-full p-4 rounded-[22px] border outline-none text-sm font-bold ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50 text-white' : 'border-zinc-100 bg-white shadow-inner text-black'}`} onChange={(e) => setSearchQuery(e.target.value)} />
            </>
          )}
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6 pt-10">
        {activeTab === 'pharmacy' ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" layout className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPharmacies.map((p: any) => (
                <motion.div layout variants={cardVariants} key={p.id} className={`p-7 rounded-[40px] border ${isDarkMode ? 'border-zinc-800/50 bg-zinc-900/40 shadow-2xl' : 'border-zinc-100/40 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]'}`}>
                  <div className="flex justify-between items-start mb-8 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusLight color={p.is_open ? "green" : "red"} blink={p.is_open} isDarkMode={isDarkMode} />
                        <span className={`text-[10px] font-black uppercase ${p.is_open ? 'text-green-500' : 'text-red-500'}`}>{p.is_open ? 'Open Now' : 'Closed'}</span>
                      </div>
                      <h2 className="text-xl font-black tracking-tight mb-1">{p.name}</h2>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest opacity-60">{p.address}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <a href={`tel:${p.phone_number}`} className={`py-4 rounded-[20px] border flex justify-center items-center gap-2 ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700' : 'bg-white border-zinc-200 shadow-inner'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest">Call</span>
                    </a>
                    <a href={`https://wa.me/${p.phone_number?.replace(/\s/g, '')}`} className={`py-4 rounded-[20px] border flex justify-center items-center gap-2 ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700' : 'bg-white border-zinc-200 shadow-inner'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-600">WhatsApp</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-28 h-28 rounded-[40px] mb-8 flex items-center justify-center rotate-3 ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white shadow-2xl border border-zinc-50'}`}>
               <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Prescription Lens</h2>
            <p className="text-zinc-500 text-sm mt-3 max-w-xs leading-relaxed">Simply take a photo of your medicine label. AI will translate instructions into clear steps.</p>
            <label className="mt-12 cursor-pointer relative">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} disabled={isAnalyzing} />
              <motion.div whileTap={{ scale: 0.95 }} className={`px-12 py-6 rounded-[35px] font-black text-white shadow-2xl transition-all flex items-center gap-3 ${isAnalyzing ? 'bg-zinc-700' : 'bg-blue-600 shadow-blue-500/25'}`}>
                {isAnalyzing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isAnalyzing ? "SCANNING..." : "START SCAN"}
              </motion.div>
            </label>
          </div>
        )}
      </main>

      {/* AI ANALYSIS POPUP MODAL */}
      <AnimatePresence>
        {showResult && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResult(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]" />
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className={`fixed bottom-0 left-0 right-0 z-[201] rounded-t-[50px] border-t p-8 max-h-[85vh] overflow-y-auto ${isDarkMode ? 'bg-[#121214] border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl'}`}>
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8 opacity-20" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest">AI Analysis</span>
                  <h2 className="text-2xl font-black mt-3">Amoxicillin 500mg</h2>
                  <p className="text-zinc-500 font-bold italic">Antibiotic / Wai ni mate ni mavoa</p>
                </div>
                <button onClick={() => setShowResult(false)} className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-6">
                <section className={`p-6 rounded-[30px] ${isDarkMode ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-blue-50/50 border border-blue-100'}`}>
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-2">Instruction</h4>
                  <p className="text-sm leading-relaxed font-medium">Take one capsule every 8 hours. Complete the entire course.</p>
                </section>
                <section className={`p-6 rounded-[30px] border-2 border-dashed ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20' : 'border-zinc-200 bg-white'}`}>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 text-center">Translation (iTaukei)</h4>
                  <p className="text-sm text-center italic font-medium">Gunuva e dua na medesini ena veiyatolu na auwa. Kua ni muduka me yacova ni sa oti.</p>
                </section>
                <button onClick={() => setShowResult(false)} className="w-full py-5 rounded-[25px] bg-blue-600 text-white font-black text-sm">DISMISS</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-[150]">
        <div className={`${isDarkMode ? 'bg-zinc-900/95 border-zinc-800 shadow-2xl' : 'bg-white/95 border-white shadow-2xl'} backdrop-blur-3xl rounded-[44px] border p-2 flex items-center justify-around`}>
          <button onClick={() => setActiveTab('pharmacy')} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[32px] transition-all ${activeTab === 'pharmacy' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">Pharmacy</span>
          </button>
          <button onClick={() => setActiveTab('ai')} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[32px] transition-all ${activeTab === 'ai' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">AI Meds</span>
          </button>
          <button onClick={() => setActiveTab('pro')} className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[32px] transition-all ${activeTab === 'pro' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </nav>
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