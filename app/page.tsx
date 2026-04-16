'use client';
import { useEffect, useState, useRef } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
} from '@tanstack/react-query';

const queryClient = new QueryClient();

// --- LOCALIZATION DICTIONARY ---
const translations: any = {
  en: {
    rx: "Pharmacy",
    map: "Map",
    sos: "SOS",
    settings: "Settings",
    emergency_title: "Emergency Hub",
    emergency_sub: "Direct Assistance • Fiji Central",
    dispatch: "Smart Dispatch",
    ping: "Location Ping",
    first_aid: "First Aid Assistant",
    police: "POLICE",
    ambulance: "AMBULANCE",
    broadcast: "Broadcast Location",
    syncing: "Synchronizing...",
    bleeding: "Severe Bleeding",
    bleeding_desc: "1. Apply firm direct pressure with clean cloth. 2. Raise limb above heart.",
    choking: "Choking Protocol",
    choking_desc: "1. Give 5 sharp back blows. 2. Perform 5 abdominal thrusts.",
  },
  fj: {
    rx: "Wainimate",
    map: "Mape",
    sos: "SOS",
    settings: "Sema",
    emergency_title: "Leqa Vakacalaka",
    emergency_sub: "Veivuke Totolo • Fiji Central",
    dispatch: "Vakatotolo ni Veivuke",
    ping: "Vanua o tiko kina",
    first_aid: "Veivuke ni Bera na Vuniwai",
    police: "OVANI",
    ambulance: "AMBULANCE",
    broadcast: "Vakauta na vanua o tiko kina",
    syncing: "Vakavoutaki tiko...",
    bleeding: "Turunidra Vakalevu",
    bleeding_desc: "1. Tabaka dei na vanua e mavoa ena isulu savasava. 2. Laveta na liga se yava.",
    choking: "Sogo na iLolo",
    choking_desc: "1. Mokuta vakalima na daku. 2. Tabaka vakalima na kete.",
  },
  hi: {
    rx: "दवाखाना",
    map: "नक्शा",
    sos: "एसओएस",
    settings: "सेटिंग्स",
    emergency_title: "आपातकालीन",
    emergency_sub: "सीधी सहायता • Fiji Central",
    dispatch: "स्मार्ट डिस्पैच",
    ping: "स्थान पिंग",
    first_aid: "प्राथमिक चिकित्सा",
    police: "पुलिस",
    ambulance: "एम्बुलेंस",
    broadcast: "स्थान साझा करें",
    syncing: "सिंक हो रहा है...",
    bleeding: "भारी रक्तस्राव",
    bleeding_desc: "1. साफ कपड़े से घाव पर दबाव डालें। 2. अंग को ऊपर उठाएं।",
    choking: "दम घुटना",
    choking_desc: "1. पीठ पर 5 बार थपथपाएं। 2. पेट पर 5 बार धक्का दें।",
  }
};

// --- HELPER COMPONENTS ---

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
    <div className={`mb-4 rounded-[28px] overflow-hidden border transition-all ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-6 flex justify-between items-center group">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] group-active:text-blue-500 transition-colors opacity-80">{title}</span>
        <span className={`transition-transform duration-300 text-zinc-500 text-xs ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="p-6 pt-0 border-t border-zinc-800/10 animate-in fade-in slide-in-from-top-2">{children}</div>}
    </div>
  );
};

function PharmacyAppContent() {
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [showHeader, setShowHeader] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const lastScrollY = useRef(0);
  
  const t = translations[lang];

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

  const filteredPharmacies = pharmacies.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === 'All' || p.address.toUpperCase().includes(selectedLocation);
    return matchesSearch && matchesLocation;
  });

  return (
    <div className={`${isDarkMode ? 'dark bg-[#09090b] text-white' : 'bg-[#f2f2f7] text-black'} min-h-screen transition-colors duration-500 pb-40 font-sans tracking-tight`}>
      
      {/* HEADER */}
      <div className={`sticky top-0 z-50 transition-all duration-500 ${showHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`${isDarkMode ? 'bg-[#09090b]/90 border-zinc-800/50' : 'bg-[#f2f2f7]/90 border-white'} backdrop-blur-2xl p-6 pb-4 border-b shadow-sm`}>
          <header className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Logo isDarkMode={isDarkMode} />
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-[-0.05em] leading-none text-blue-500">Bula Health</h1>
                <div className="flex gap-2 mt-1.5">
                  {['en', 'fj', 'hi'].map((l) => (
                    <button 
                      key={l} 
                      onClick={() => setLang(l)} 
                      className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-all border ${lang === l ? 'bg-blue-600 border-blue-500 text-white' : (isDarkMode ? 'bg-transparent border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400')}`}
                    >
                      {l === 'en' ? 'ENG' : l === 'fj' ? 'TAU' : 'HIN'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => refetch()} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all active:scale-90 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-100 text-zinc-500 shadow-inner'}`}>
                <svg className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all active:scale-90 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-white border-zinc-100 text-blue-600 shadow-inner'}`}>{isDarkMode ? '🌙' : '☀️'}</button>
            </div>
          </header>

          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
            {['All', 'NAVUA', 'NASINU', 'NAUSORI'].map((loc) => (
              <button 
                key={loc} 
                onClick={() => setSelectedLocation(loc)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${selectedLocation === loc ? 'bg-blue-600 text-white shadow-lg' : (isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-zinc-400 border border-zinc-100 shadow-sm')}`}
              >
                {loc}
              </button>
            ))}
          </div>

          <input 
            type="text" 
            placeholder="Search directory..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full p-4 rounded-3xl border shadow-inner outline-none text-sm font-bold ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-700' : 'bg-white border-zinc-100 text-black'}`} 
          />
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6">
        {/* PHARMACY TAB */}
        {activeTab === 'pharmacy' && (
          <div className="grid gap-4">
            {isLoading ? <div className="text-center py-20 opacity-20 font-black text-[10px] tracking-[0.3em] uppercase">{t.syncing}</div> : filteredPharmacies.map((p: any) => (
              <div key={p.id} className={`p-6 rounded-[32px] border transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white border-zinc-100/50 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${p.is_open ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`} />
                      <h2 className="text-lg font-black tracking-[-0.02em]">{p.name}</h2>
                    </div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.15em] opacity-70 ml-5">{p.address}</p>
                  </div>
                  <a href={`tel:${p.phone_number}`} className="w-11 h-11 rounded-full border border-blue-500/20 bg-blue-500/10 flex items-center justify-center text-blue-500 active:scale-90 transition-all shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5c-1.242 0-2.25 1.008-2.25 2.25z"/></svg>
                  </a>
                </div>
                
                <div className="flex gap-2">
                  <a href={`https://wa.me/${p.phone_number}`} className={`flex-1 py-4 rounded-2xl border flex justify-center items-center active:scale-95 transition-all ${isDarkMode ? 'bg-zinc-800/30 border-zinc-800' : 'bg-green-50 border-green-100'}`}>
                    <svg className="w-5 h-5 fill-green-500" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.402-.003 6.557-5.338 11.892-11.893 11.892-1.992-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.467c1.489.881 3.153 1.345 4.856 1.346h.005c5.42 0 9.832-4.412 9.835-9.832.001-2.625-1.022-5.093-2.882-6.954-1.859-1.86-4.327-2.883-6.954-2.883-5.42 0-9.831 4.412-9.835 9.832-.001 1.761.469 3.483 1.359 4.987l-1.021 3.725 3.812-.999z"/></svg>
                  </a>
                  <a href={`viber://add?number=${p.phone_number}`} className={`flex-1 py-4 rounded-2xl border flex justify-center items-center active:scale-95 transition-all ${isDarkMode ? 'bg-zinc-800/30 border-zinc-800' : 'bg-purple-50 border-purple-100'}`}>
                    <svg className="w-5 h-5 fill-purple-500" viewBox="0 0 24 24"><path d="M19.742 16.378c.497.568.587 2.48.207 2.892-.19.206-.485.32-.828.34-.764.043-1.888-.094-3.137-.606a17.411 17.411 0 0 1-5.242-3.415 15.961 15.961 0 0 1-3.535-4.73c-.684-1.414-.943-2.671-.741-3.454.1-.387.348-.732.738-.97.477-.29 2.185-.14 2.824.312.4.282.603 1.382.744 1.907.131.49.02.825-.333 1.25-.13.157-.26.313-.393.468-.204.238-.204.38.016.701a9.912 9.912 0 0 0 1.94 2.08 10.855 10.855 0 0 0 2.566 1.664c.34.153.486.115.69-.124.133-.155.267-.312.4-.467.433-.502.735-.64 1.18-.465l1.914.811zm-4.742-15.378c4.665.462 8.514 4.047 9 8.618l-1.487.114c-.407-3.83-3.665-6.841-7.551-7.228l.038-1.504z"/></svg>
                  </a>
                  <button className={`flex-1 py-4 rounded-2xl border flex justify-center items-center active:scale-95 transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500 shadow-sm'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SOS TAB */}
        {activeTab === 'emergency' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 p-8 rounded-[40px] bg-red-600 text-white shadow-xl">
               <h2 className="text-3xl font-black tracking-[-0.06em] uppercase">{t.emergency_title}</h2>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">{t.emergency_sub}</p>
            </div>

            <Collapsible title={t.dispatch} isDarkMode={isDarkMode}>
              <div className="grid grid-cols-2 gap-3">
                <a href="tel:911" className="p-6 rounded-[24px] bg-red-600 text-center text-white font-black text-[11px] tracking-widest active:scale-95 transition-all shadow-lg">{t.police}</a>
                <a href="tel:917" className="p-6 rounded-[24px] bg-red-700 text-center text-white font-black text-[11px] tracking-widest active:scale-95 transition-all shadow-lg">{t.ambulance}</a>
              </div>
            </Collapsible>

            <Collapsible title={t.ping} isDarkMode={isDarkMode}>
              <div className={`p-6 rounded-[24px] border mb-4 text-center ${isDarkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
                <div className="text-[9px] font-black text-zinc-500 uppercase mb-2 tracking-[0.25em]">{t.ping}</div>
                <div className="text-2xl font-mono font-bold tracking-[-0.05em] text-blue-600">18° 13' 33.6" S</div>
              </div>
              <button className="w-full py-5 rounded-[24px] bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all shadow-lg">{t.broadcast}</button>
            </Collapsible>

            <Collapsible title={t.first_aid} isDarkMode={isDarkMode}>
              <div className="space-y-4">
                {[
                  { t: t.bleeding, d: t.bleeding_desc },
                  { t: t.choking, d: t.choking_desc },
                ].map(aid => (
                  <div key={aid.t} className={`p-5 rounded-[24px] border ${isDarkMode ? 'border-zinc-800/60 bg-zinc-900/40' : 'border-zinc-100 bg-white shadow-sm'}`}>
                    <div className="text-[11px] font-black uppercase mb-2 text-red-600 tracking-wider">{aid.t}</div>
                    <div className="text-[12px] text-zinc-500 leading-relaxed font-bold">{aid.d}</div>
                  </div>
                ))}
              </div>
            </Collapsible>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
           <div className={`w-full h-[65vh] rounded-[48px] overflow-hidden border shadow-2xl animate-in zoom-in-95 duration-500 ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-white bg-white'}`}>
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                style={{ filter: isDarkMode ? 'invert(90%) hue-rotate(180deg) grayscale(1)' : 'none' }} 
                src="https://www.openstreetmap.org/export/embed.html?bbox=178.14,-18.25,178.50,-18.00&layer=mapnik&marker=-18.12,178.43" 
              />
           </div>
        )}

        {/* PRO/SETTINGS TAB */}
        {activeTab === 'pro' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-black tracking-[-0.05em] mb-10">{t.settings}</h2>
            <div className="space-y-4">
              <div className={`p-8 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <div className="text-[10px] font-black text-zinc-500 uppercase mb-6 tracking-[0.2em]">Interface Engine</div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black tracking-tight uppercase">Dark Protocol</span>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-7 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-zinc-200 shadow-inner'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* NAVIGATION BAR */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-[100]">
        <div className={`${isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-white'} backdrop-blur-3xl rounded-[48px] border p-2.5 flex items-center justify-around shadow-2xl`}>
          <button onClick={() => setActiveTab('pharmacy')} className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-full transition-all duration-400 ${activeTab === 'pharmacy' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-500'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
             <span className="text-[9px] font-black uppercase tracking-widest">{t.rx}</span>
          </button>
          <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-full transition-all duration-400 ${activeTab === 'map' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-500'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A2 2 0 013 15.483V4.321a2 2 0 012.894-1.789L10 5l6-3 5.447 2.724A2 2 0 0123 6.517v11.162a2 2 0 01-2.894 1.789L15 17l-6 3z"/></svg>
             <span className="text-[9px] font-black uppercase tracking-widest">{t.map}</span>
          </button>
          <button onClick={() => setActiveTab('emergency')} className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-full transition-all duration-400 ${activeTab === 'emergency' ? 'text-red-500 bg-red-500/10' : 'text-zinc-500'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             <span className="text-[9px] font-black uppercase tracking-widest">{t.sos}</span>
          </button>
          <button onClick={() => setActiveTab('pro')} className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-full transition-all duration-400 ${activeTab === 'pro' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-500'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
             <span className="text-[9px] font-black uppercase tracking-widest">PRO</span>
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