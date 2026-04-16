'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
} from '@tanstack/react-query';

const queryClient = new QueryClient();

// --- ICONS ---

const WhatsAppIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const ViberIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.006 14.286c-.234-.14-.543-.223-.88-.223-.337 0-.646.084-.88.223-.235.14-.37.337-.37.562 0 .225.135.422.37.562.234.139.543.223.88.223.337 0 .646-.084.88-.223.235-.14.37-.337.37-.562 0-.225-.135-.422-.37-.562zm-3.088-2.617c-.31-.137-.714-.236-1.157-.236-.443 0-.847.1-1.157.236-.31.137-.488.358-.488.59 0 .232.178.453.488.59.31.137.714.236 1.157.236.443 0 .847-.1 1.157-.236.31-.137.488-.358.488-.59 0-.232-.178-.453-.488-.59zM24 11.453c0-1.89-.356-3.664-1.025-5.266a12.022 12.022 0 00-2.822-4.242A11.95 11.95 0 0014.5 0a12.162 12.162 0 00-5.464 1.258A12.097 12.097 0 004.81 4.54a11.977 11.977 0 00-2.22 3.655c-.538 1.487-.822 3.08-.822 4.75 0 1.673.284 3.267.822 4.755.538 1.488 1.304 2.825 2.22 3.96a12.106 12.106 0 004.225 3.28A12.11 12.11 0 0014.5 24a12.057 12.057 0 005.41-.125 12.003 12.003 0 004.065-2.203 11.964 11.964 0 003-3.623c.67-1.584 1.025-3.34 1.025-5.204a1.36 1.36 0 00-.001-.115c.001-.137.001-.274 0-.411z"/>
  </svg>
);

const MapIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

function PharmacyAppContent() {
  const [isOnline, setIsOnline] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    setTimeout(() => setIsVisible(true), 100);

    const handleScroll = () => {
      if (window.scrollY > lastScrollY.current && window.scrollY > 80) setShowHeader(false);
      else setShowHeader(true);
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const { data: pharmacies = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data, error } = await supabase.from('pharmacies').select('*');
      if (error) throw error;
      return data;
    },
  });

  const getStatusData = (p: any) => {
    if (!p.is_open) return { color: 'bg-red-500', label: 'CLOSED' };
    return { color: 'bg-green-500', label: 'OPEN' };
  };

  const filteredItems = pharmacies.filter((p: any) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.address?.toLowerCase().includes(filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-[#09090b] text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen transition-colors duration-500 pb-40`}>
      
      {!isOnline && (
        <div className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest py-2 text-center sticky top-0 z-[110] animate-pulse">
          Offline Mode • Viewing Cached Data
        </div>
      )}

      {/* HEADER */}
      <div className={`sticky ${isOnline ? 'top-0' : 'top-8'} z-50 transition-all duration-500 ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`${isDarkMode ? 'bg-[#09090b]/90' : 'bg-[#F2F2F7]/90'} backdrop-blur-2xl p-6 pb-4`}>
          <div className="flex justify-between items-center mb-6">
             <div className="flex gap-2">
                {['All', 'NAVUA', 'NASINU', 'NAUSORI'].map((loc) => (
                  <button key={loc} onClick={() => setFilter(loc)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === loc ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>{loc}</button>
                ))}
             </div>
          </div>
          <input 
            type="text" 
            placeholder="Search pharmacies..." 
            className={`w-full p-4 rounded-3xl border-none shadow-sm outline-none text-sm font-bold ${isDarkMode ? 'bg-zinc-900/60 text-white placeholder:text-zinc-700' : 'bg-white text-black'}`}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* CARDS */}
      <main className="max-w-xl mx-auto p-6 space-y-4">
        {isLoading ? (
           <div className="text-center py-20 opacity-20 font-black tracking-widest text-xs">SYNCHRONIZING...</div>
        ) : (
          filteredItems.map((p: any) => {
            const status = getStatusData(p);
            const cleanPhone = p.phone_number?.replace(/\s+/g, '');
            return (
              <div key={p.id} className={`p-6 rounded-[40px] border transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white border-transparent shadow-sm'} active:scale-[0.98]`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                      <h2 className="text-lg font-black tracking-tight">{p.name}</h2>
                    </div>
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">{status.label} • {p.address}</p>
                  </div>
                  <a href={`tel:${p.phone_number}`} className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </a>
                </div>

                <div className="flex gap-2">
                  <a href={`https://wa.me/${cleanPhone}`} target="_blank" className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest bg-[#075e54]/10 text-[#25d366]">
                    <WhatsAppIcon /> WA
                  </a>
                  <a href={`viber://contact?number=${cleanPhone}`} className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest bg-[#7360f2]/10 text-[#7360f2]">
                    <ViberIcon /> VIBER
                  </a>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.address)}`} target="_blank" className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400">
                    <MapIcon /> MAP
                  </a>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-[100]">
        <div className={`${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-white'} backdrop-blur-3xl rounded-[40px] border p-3 flex items-center justify-around shadow-2xl`}>
          
          <button onClick={() => setActiveTab('pharmacy')} className={`flex flex-col items-center gap-1.5 px-5 py-2 rounded-3xl transition-all ${activeTab === 'pharmacy' ? 'text-blue-500' : 'text-zinc-600'}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/></svg>
            <span className="text-[9px] font-black uppercase tracking-tighter">PHARMACY</span>
          </button>

          <button onClick={() => setActiveTab('hospitals')} className={`flex flex-col items-center gap-1.5 px-5 py-2 rounded-3xl transition-all ${activeTab === 'hospitals' ? 'text-blue-500' : 'text-zinc-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <span className="text-[9px] font-black uppercase tracking-tighter">HOSPITALS</span>
          </button>

          <button onClick={() => setActiveTab('emergency')} className={`flex flex-col items-center gap-1.5 px-5 py-2 rounded-3xl transition-all ${activeTab === 'emergency' ? 'text-blue-500' : 'text-zinc-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span className="text-[9px] font-black uppercase tracking-tighter">EMERGENCY</span>
          </button>

          <button onClick={() => setActiveTab('medpass')} className={`flex flex-col items-center gap-1.5 px-5 py-2 rounded-3xl transition-all ${activeTab === 'medpass' ? 'text-blue-500' : 'text-zinc-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span className="text-[9px] font-black uppercase tracking-tighter">MED-PASS</span>
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