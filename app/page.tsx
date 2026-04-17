'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
} from '@tanstack/react-query';

const queryClient = new QueryClient();

// --- LOGIC HELPERS ---

const getClosingCountdown = (closingTimeStr: string) => {
  if (!closingTimeStr) return null;
  const now = new Date();
  const [hours, minutes] = closingTimeStr.split(':').map(Number);
  const closingDate = new Date();
  closingDate.setHours(hours, minutes, 0);
  const diffMs = closingDate.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  return (diffMins > 0 && diffMins <= 60) ? diffMins : null;
};

// --- COMPONENTS ---

const StatusLight = ({ color, blink = false }: { color: string, blink?: boolean }) => {
  const colorClasses: any = {
    green: 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]',
    orange: 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.9)]',
    red: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
  };
  return (
    <div className="relative flex items-center justify-center w-4 h-4">
      {blink && <div className={`absolute inset-0 rounded-full opacity-40 animate-ping ${color === 'orange' ? 'bg-orange-400' : 'bg-green-400'}`} />}
      <div className={`h-2.5 w-2.5 rounded-full z-10 ${colorClasses[color]} ${blink ? 'animate-pulse' : ''}`} />
    </div>
  );
};

const CountdownStatus = ({ closingTime, isOpen }: { closingTime: string, isOpen: boolean }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setTimeLeft(getClosingCountdown(closingTime));
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [closingTime]);

  if (!isOpen) return (
    <div className="flex items-center gap-3">
      <StatusLight color="red" />
      <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Closed</span>
    </div>
  );
  if (timeLeft !== null) return (
    <div className="flex items-center gap-3">
      <StatusLight color="orange" blink={true} />
      <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter">Closing in {timeLeft}m</span>
    </div>
  );
  return (
    <div className="flex items-center gap-3">
      <StatusLight color="green" blink={true} />
      <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-tighter">Open Now</span>
    </div>
  );
};

function PharmacyAppContent() {
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  
  // NEW: Scroll state for Navigation
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowNav(false); // Scrolling down - hide
      } else {
        setShowNav(true); // Scrolling up - show
      }
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
    // This specific URL format triggers "Directions from My Location"
    const destination = encodeURIComponent(`${address}, Fiji`);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  const filteredPharmacies = pharmacies.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || p.address.toUpperCase().includes(selectedLocation);
    return matchesSearch && matchesLocation;
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-[#0b0b0d] text-white' : 'bg-[#f4f4f9] text-black'} min-h-screen transition-colors duration-500 pb-20 font-sans`}>
      
      {/* HEADER */}
      <div className="sticky top-0 z-50">
        <div className={`${isDarkMode ? 'bg-[#0b0b0d]/80 border-zinc-800' : 'bg-[#f4f4f9]/80 border-white'} backdrop-blur-3xl p-6 border-b shadow-sm`}>
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-500">Bula Health</h1>
            <div className="flex gap-2">
              <button onClick={() => refetch()} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all active:scale-90 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-500 shadow-sm'}`}>
                <svg className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all active:scale-90 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-white border-zinc-200 text-blue-600 shadow-sm'}`}>
                {isDarkMode ? '🌙' : '☀️'}
              </button>
            </div>
          </header>

          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
            {['All', 'NAVUA', 'NASINU', 'NAUSORI'].map((loc) => (
              <button 
                key={loc} 
                onClick={() => setSelectedLocation(loc)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${selectedLocation === loc ? 'bg-blue-600 text-white shadow-lg' : (isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-zinc-400 border border-zinc-100')}`}
              >
                {loc}
              </button>
            ))}
          </div>

          <input 
            type="text" 
            placeholder="Search Pharmacy or Street..." 
            className={`w-full p-4 rounded-[24px] border shadow-inner outline-none text-sm font-bold transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-black'}`}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6">
        {activeTab === 'pharmacy' ? (
          <div className="grid gap-5">
            {isLoading ? (
               <div className="text-center py-20 opacity-30 font-black tracking-[0.4em] text-[9px] uppercase">Connecting...</div>
            ) : filteredPharmacies.map((p: any) => (
              <div key={p.id} className={`p-7 rounded-[40px] border transition-all active:scale-[0.97] ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50 shadow-2xl' : 'bg-white border-zinc-100 shadow-md'}`}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="mb-2">
                      <CountdownStatus closingTime={p.closing_time || "17:00"} isOpen={p.is_open} />
                    </div>
                    <h2 className="text-xl font-black tracking-tight mb-1">{p.name}</h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest opacity-60">{p.address}</p>
                  </div>
                  <a href={`tel:${p.phone_number}`} className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shadow-inner active:scale-90 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5c-1.242 0-2.25 1.008-2.25 2.25z"/></svg>
                  </a>
                </div>
                
                <div className="flex gap-3">
                  <a href={`https://wa.me/${p.phone_number}`} className={`flex-1 py-4 rounded-[20px] border flex justify-center items-center active:scale-95 transition-all ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700' : 'bg-green-50 border-green-100'}`}>
                    <svg className="w-5 h-5 fill-green-600" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.402-.003 6.557-5.338 11.892-11.893 11.892-1.992-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.467c1.489.881 3.153 1.345 4.856 1.346h.005c5.42 0 9.832-4.412 9.835-9.832.001-2.625-1.022-5.093-2.882-6.954-1.859-1.86-4.327-2.883-6.954-2.883-5.42 0-9.831 4.412-9.835 9.832-.001 1.761.469 3.483 1.359 4.987l-1.021 3.725 3.812-.999z"/></svg>
                  </a>
                  <button 
                    onClick={() => handleGetDirections(p.address)}
                    className={`flex-1 py-4 rounded-[20px] border flex justify-center items-center active:scale-95 transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600 shadow-sm'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="ml-2 text-[10px] font-black uppercase tracking-tight">Directions</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center opacity-30 font-black uppercase tracking-[0.5em] text-[10px]">Portal Locked</div>
        )}
      </main>

      {/* INTELLIGENT NAVIGATION BAR */}
      <nav 
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-[100] transition-all duration-500 ease-in-out ${
          showNav ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
      >
        <div className={`${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/95 border-white'} backdrop-blur-3xl rounded-[40px] border p-2.5 flex items-center justify-around shadow-2xl`}>
          {['pharmacy', 'emergency', 'pro'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-7 py-3 rounded-[28px] transition-all duration-300 font-black text-[9px] uppercase tracking-widest ${activeTab === tab ? 'text-blue-500 bg-blue-500/10 shadow-inner' : 'text-zinc-500'}`}
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
      <PharmacyAppContent />
    </QueryClientProvider>
  );
}