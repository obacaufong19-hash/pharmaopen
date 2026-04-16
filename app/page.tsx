'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
} from '@tanstack/react-query';

const queryClient = new QueryClient();

// --- COMPONENTS ---

const Logo = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="35" y="10" width="30" height="80" rx="15" fill="url(#logoGrad)" />
      <rect x="10" y="35" width="80" height="30" rx="15" fill="url(#logoGrad)" />
      <circle cx="50" cy="50" r="12" fill={isDarkMode ? "#09090b" : "#f2f2f7"} />
    </svg>
  </div>
);

const Collapsible = ({ title, children, isDarkMode }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`mb-4 rounded-[32px] overflow-hidden border transition-all ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-6 flex justify-between items-center">
        <span className="text-xs font-black uppercase tracking-widest">{title}</span>
        <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="p-6 pt-0 border-t border-zinc-800/20">{children}</div>}
    </div>
  );
};

function PharmacyAppContent() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY.current && window.scrollY > 80) setShowHeader(false);
      else setShowHeader(true);
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: pharmacies = [], isLoading, refetch } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data, error } = await supabase.from('pharmacies').select('*');
      if (error) throw error;
      return data;
    },
  });

  const filteredItems = pharmacies.filter((p: any) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.address?.toLowerCase().includes(filter.toUpperCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-[#09090b] text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen transition-colors duration-500 pb-40`}>
      
      {/* HEADER */}
      <div className={`sticky top-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`${isDarkMode ? 'bg-[#09090b]/90 border-zinc-800/50' : 'bg-[#F2F2F7]/90 border-zinc-200'} backdrop-blur-2xl p-6 pb-4 border-b`}>
          <header className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo isDarkMode={isDarkMode} />
              <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">Bula Health</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => refetch()} className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200'}`}>🔄</button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-white border-zinc-200 text-blue-600'}`}>{isDarkMode ? '🌙' : '☀️'}</button>
            </div>
          </header>
          {activeTab === 'pharmacy' && (
            <input type="text" placeholder="Search directory..." className={`w-full p-4 rounded-3xl outline-none text-sm font-bold ${isDarkMode ? 'bg-zinc-900/60 text-white' : 'bg-white text-black shadow-sm'}`} onChange={(e) => setSearch(e.target.value)} />
          )}
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6">
        {/* PHARMACY TAB */}
        {activeTab === 'pharmacy' && (
          <div className="grid gap-4">
            {isLoading ? <div className="text-center py-20 opacity-20 font-black text-xs">LOADING...</div> : filteredItems.map((p: any) => (
              <div key={p.id} className={`p-6 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white shadow-sm'}`}>
                <h2 className="text-lg font-black mb-1">{p.name}</h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4">{p.address}</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-4 rounded-2xl bg-green-500/10 text-green-500 text-[10px] font-black">WA</button>
                  <button className="flex-1 py-4 rounded-2xl bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase">Map</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className={`w-full h-[60vh] rounded-[40px] overflow-hidden border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <iframe width="100%" height="100%" frameBorder="0" style={{ filter: isDarkMode ? 'invert(90%) hue-rotate(180deg)' : 'none' }} src="https://www.openstreetmap.org/export/embed.html?bbox=178.14,-18.25,178.50,-18.00&layer=mapnik" />
          </div>
        )}

        {/* SOS TAB */}
        {activeTab === 'emergency' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 p-6 bg-red-600 rounded-[40px] shadow-2xl shadow-red-900/20">
               <h2 className="text-2xl font-black text-white tracking-tighter">Emergency Hub</h2>
               <p className="text-red-100 text-[10px] font-black uppercase tracking-widest mt-1">Navua Region Response</p>
            </div>

            <Collapsible title="Smart Dispatch" isDarkMode={isDarkMode}>
              <div className="grid grid-cols-2 gap-3">
                <a href="tel:911" className="p-6 rounded-3xl bg-red-500 text-center text-white font-black text-xs">POLICE (911)</a>
                <a href="tel:917" className="p-6 rounded-3xl bg-red-600 text-center text-white font-black text-xs">AMBULANCE</a>
                <a href="tel:910" className="p-6 rounded-3xl bg-orange-600 text-center text-white font-black text-xs col-span-2">FIRE AUTHORITY</a>
              </div>
            </Collapsible>

            <Collapsible title="Location Ping" isDarkMode={isDarkMode}>
              <div className={`p-6 rounded-3xl border mb-4 text-center ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-[10px] font-black text-zinc-500 uppercase mb-2">Current Coordinates</div>
                <div className="text-xl font-mono font-bold tracking-tighter">-18.226, 178.165</div>
              </div>
              <button className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest">Send Location to Contacts</button>
            </Collapsible>

            <Collapsible title="First Aid Assistant" isDarkMode={isDarkMode}>
              <div className="space-y-3">
                {['Severe Bleeding', 'Choking', 'Unconscious Person', 'Heat Stroke'].map(aid => (
                  <button key={aid} className={`w-full p-4 rounded-2xl text-left text-xs font-bold border ${isDarkMode ? 'border-zinc-800 bg-zinc-900/60' : 'border-zinc-200 bg-white'}`}>{aid}</button>
                ))}
              </div>
            </Collapsible>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 rounded-[30px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl">👤</div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter">Osea Bula</h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Enterprise Member • Navua</p>
              </div>
            </div>

            <div className="space-y-3">
               {['Personal Information', 'Health Pass Credentials', 'App Notifications', 'Sync Logs', 'Privacy Policy'].map(item => (
                 <button key={item} className={`w-full p-6 rounded-[30px] text-left text-xs font-black uppercase tracking-widest border transition-all active:scale-[0.98] ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-100'}`}>
                   {item}
                 </button>
               ))}
               <button className="w-full p-6 rounded-[30px] text-left text-xs font-black uppercase tracking-widest text-red-500 border border-red-500/20 bg-red-500/5 mt-6">Log Out</button>
            </div>
          </div>
        )}
      </main>

      {/* NAVIGATION */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-[100]">
        <div className={`${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-white'} backdrop-blur-3xl rounded-[40px] border p-3 flex items-center justify-around shadow-2xl`}>
          <button onClick={() => setActiveTab('pharmacy')} className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-3xl transition-all ${activeTab === 'pharmacy' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-600'}`}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
             <span className="text-[9px] font-black uppercase">RX</span>
          </button>
          <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-3xl transition-all ${activeTab === 'map' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-600'}`}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A2 2 0 013 15.483V4.321a2 2 0 012.894-1.789L10 5l6-3 5.447 2.724A2 2 0 0123 6.517v11.162a2 2 0 01-2.894 1.789L15 17l-6 3z"/></svg>
             <span className="text-[9px] font-black uppercase">MAP</span>
          </button>
          <button onClick={() => setActiveTab('emergency')} className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-3xl transition-all ${activeTab === 'emergency' ? 'text-red-500 bg-red-500/10' : 'text-zinc-600'}`}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             <span className="text-[9px] font-black uppercase">SOS</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-3xl transition-all ${activeTab === 'settings' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-600'}`}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
             <span className="text-[9px] font-black uppercase">Settings</span>
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