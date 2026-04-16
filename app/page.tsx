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
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-6 flex justify-between items-center group">
        <span className="text-xs font-black uppercase tracking-widest group-active:text-blue-500 transition-colors">{title}</span>
        <span className={`transition-transform duration-300 text-zinc-500 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="p-6 pt-0 border-t border-zinc-800/10 animate-in fade-in slide-in-from-top-2">{children}</div>}
    </div>
  );
};

function PharmacyAppContent() {
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

  const { data: pharmacies = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const { supabase } = await import('./utils/supabase');
      const { data, error } = await supabase.from('pharmacies').select('*');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-[#09090b] text-white' : 'bg-[#F2F2F7] text-black'} min-h-screen transition-colors duration-500 pb-40`}>
      
      {/* HEADER */}
      <div className={`sticky top-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`${isDarkMode ? 'bg-[#09090b]/90 border-zinc-800/50' : 'bg-[#F2F2F7]/90 border-zinc-200'} backdrop-blur-2xl p-6 pb-4 border-b`}>
          <header className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo isDarkMode={isDarkMode} />
              <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">Bula Health</h1>
            </div>
            <div className="flex gap-2">
              {/* SYNC BUTTON */}
              <button 
                onClick={() => refetch()} 
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all active:scale-90 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`}
              >
                <svg className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all active:scale-90 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-white border-zinc-200 text-blue-600'}`}>{isDarkMode ? '🌙' : '☀️'}</button>
            </div>
          </header>
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6">
        {/* RX TAB */}
        {activeTab === 'pharmacy' && (
          <div className="grid gap-4">
            {isLoading ? <div className="text-center py-20 opacity-20 font-black text-xs tracking-widest uppercase">Synchronizing...</div> : pharmacies.map((p: any) => (
              <div key={p.id} className={`p-6 rounded-[40px] border transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-1">
                  {/* BLINKING STATUS LIGHT */}
                  <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${p.is_open ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`} />
                  <h2 className="text-lg font-black tracking-tight">{p.name}</h2>
                </div>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4 ml-5.5">{p.address}</p>
                
                <div className="flex gap-2">
                  <a href={`https://wa.me/${p.phone_number}`} className="flex-1 py-4 rounded-2xl bg-[#25D366]/10 flex justify-center items-center active:scale-95 transition-transform">
                    <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.107l-.696 2.54 2.595-.681a5.71 5.71 0 002.844.757h.001c3.181 0 5.766-2.586 5.767-5.766.001-3.18-2.585-5.766-5.766-5.766zm3.377 8.203c-.145.405-.837.739-1.166.786-.299.043-.687.07-1.104-.064-.242-.078-.544-.184-1.127-.435-1.135-.487-1.851-1.636-1.907-1.711-.056-.075-.461-.611-.461-1.166 0-.555.291-.827.394-.938.104-.111.225-.138.3-.138s.15.001.214.004c.067.003.157-.026.245.187.089.214.303.739.33.794s.045.111.015.172c-.03.06-.045.091-.09.143l-.135.158c-.044.053-.092.11-.039.202.053.092.235.388.504.628.345.308.636.403.726.447.09.045.142.038.195-.023.053-.06.225-.262.285-.353.06-.091.12-.076.202-.045s.526.248.616.293c.09.045.15.067.172.105.023.038.023.218-.122.623z"/></svg>
                  </a>
                  <a href={`viber://add?number=${p.phone_number}`} className="flex-1 py-4 rounded-2xl bg-[#7360F2]/10 flex justify-center items-center active:scale-95 transition-transform">
                    <svg className="w-5 h-5 fill-[#7360F2]" viewBox="0 0 24 24"><path d="M17.51 19.186c-4.14 0-7.497-3.357-7.497-7.497 0-1.107.243-2.157.676-3.1l-1.332-1.332C8.36 8.435 8.013 9.774 8.013 11.19c0 5.24 4.257 9.497 9.497 9.497 1.415 0 2.755-.347 3.933-.945l-1.332-1.332a7.464 7.464 0 01-3.1.676zM18 1c3.866 0 7 3.134 7 7s-3.134 7-7 7-7-3.134-7-7 3.134-7 7-7zm0 2c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z"/></svg>
                  </a>
                  <button className="flex-1 py-4 rounded-2xl bg-zinc-800 flex justify-center items-center active:scale-95 transition-transform">
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SOS TAB */}
        {activeTab === 'emergency' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
               <h2 className="text-3xl font-black tracking-tighter text-red-500 uppercase">Emergency</h2>
               <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Direct Assistance • Central Division</p>
            </div>

            <Collapsible title="Smart Dispatch" isDarkMode={isDarkMode}>
              <div className="grid grid-cols-2 gap-3">
                <a href="tel:911" className="p-6 rounded-3xl bg-red-500 text-center text-white font-black text-xs shadow-lg shadow-red-500/20 active:scale-95 transition-all">POLICE (911)</a>
                <a href="tel:917" className="p-6 rounded-3xl bg-red-600 text-center text-white font-black text-xs shadow-lg shadow-red-600/20 active:scale-95 transition-all">AMBULANCE</a>
              </div>
            </Collapsible>

            <Collapsible title="Location Ping" isDarkMode={isDarkMode}>
              <div className={`p-6 rounded-3xl border mb-4 text-center ${isDarkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="text-[10px] font-black text-zinc-500 uppercase mb-2">Current Coordinates</div>
                <div className="text-xl font-mono font-bold tracking-tighter text-blue-500">-18.226, 178.165</div>
              </div>
              <button className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all">Broadcast Location</button>
            </Collapsible>

            <Collapsible title="First Aid Assistant" isDarkMode={isDarkMode}>
              <div className="space-y-4">
                {[
                  { t: 'Severe Bleeding', d: '1. Apply firm direct pressure with clean cloth. 2. Raise limb above heart. 3. Call 917 if bleeding persists.' },
                  { t: 'Choking Protocol', d: '1. Lean forward and give 5 sharp back blows. 2. Perform 5 abdominal thrusts. 3. Repeat until airway is clear.' },
                  { t: 'Unconscious Victim', d: '1. Check airway and breathing. 2. Move to recovery position. 3. Prepare for CPR if breathing stops.' }
                ].map(aid => (
                  <div key={aid.t} className={`p-4 rounded-2xl border ${isDarkMode ? 'border-zinc-800/60 bg-zinc-900/40' : 'border-zinc-200 bg-white'}`}>
                    <div className="text-[10px] font-black uppercase mb-1.5 text-red-500 tracking-tight">{aid.t}</div>
                    <div className="text-[11px] text-zinc-400 leading-relaxed font-medium">{aid.d}</div>
                  </div>
                ))}
              </div>
            </Collapsible>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-black tracking-tighter mb-8">Settings</h2>
            <div className="space-y-3">
              <div className={`p-6 rounded-[30px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white shadow-sm'}`}>
                <div className="text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest">General</div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold">Dark Appearance</span>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-zinc-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Offline Sync</span>
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Enabled</div>
                </div>
              </div>
              
              <div className={`p-6 rounded-[30px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white shadow-sm'}`}>
                <div className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest">About</div>
                <div className="text-xs font-bold">Bula Health Prototype</div>
                <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-tighter">v0.3.0 • Local Build</div>
              </div>
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
           <div className={`w-full h-[65vh] rounded-[40px] overflow-hidden border shadow-2xl ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <iframe width="100%" height="100%" frameBorder="0" style={{ filter: isDarkMode ? 'invert(90%) hue-rotate(180deg)' : 'none' }} src="https://www.openstreetmap.org/export/embed.html?bbox=178.14,-18.25,178.50,-18.00&layer=mapnik" />
           </div>
        )}
      </main>

      {/* NAVIGATION */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-[100]">
        <div className={`${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-white'} backdrop-blur-3xl rounded-[44px] border p-2.5 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.3)]`}>
          <button onClick={() => setActiveTab('pharmacy')} className={`flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-[32px] transition-all duration-300 ${activeTab === 'pharmacy' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}>
             <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
             <span className="text-[9px] font-black uppercase tracking-tighter">RX</span>
          </button>
          <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-[32px] transition-all duration-300 ${activeTab === 'map' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}>
             <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A2 2 0 013 15.483V4.321a2 2 0 012.894-1.789L10 5l6-3 5.447 2.724A2 2 0 0123 6.517v11.162a2 2 0 01-2.894 1.789L15 17l-6 3z"/></svg>
             <span className="text-[9px] font-black uppercase tracking-tighter">MAP</span>
          </button>
          <button onClick={() => setActiveTab('emergency')} className={`flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-[32px] transition-all duration-300 ${activeTab === 'emergency' ? 'text-red-500 bg-red-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}>
             <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             <span className="text-[9px] font-black uppercase tracking-tighter">SOS</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-[32px] transition-all duration-300 ${activeTab === 'settings' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}>
             <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
             <span className="text-[9px] font-black uppercase tracking-tighter">Settings</span>
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