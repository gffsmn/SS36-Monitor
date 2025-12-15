import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { InfoList } from './components/InfoList';
import { WeeklySchedule } from './components/WeeklySchedule';
import { fetchTrafficUpdates } from './services/geminiService';
import { TrafficStatus } from './types';
import { ShieldCheck, Linkedin, Coffee } from 'lucide-react';

const CACHE_KEY = 'ss36_traffic_data_v1';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<TrafficStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to determine status severity based on keywords in text
  const analyzeStatus = (text: string): 'OPEN' | 'WARNING' | 'CLOSED' => {
    const lower = text.toLowerCase();
    if (lower.includes('chiusa') || lower.includes('chiusura totale') || lower.includes('bloccata')) return 'CLOSED';
    if (lower.includes('lavori') || lower.includes('restringimento') || lower.includes('coda') || lower.includes('rallentamenti') || lower.includes('notturna')) return 'WARNING';
    if (lower.includes('regolare') || lower.includes('aperta') || lower.includes('nessuna segnalazione')) return 'OPEN';
    return 'WARNING'; // Default to warning to be safe
  };

  const saveDataToCache = (data: TrafficStatus) => {
    try {
      const cachePayload = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
    } catch (e) {
      console.warn("Failed to save to local storage", e);
    }
  };

  const loadFromCache = (): TrafficStatus | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      if (age < CACHE_DURATION) {
        // Re-hydrate Date object
        parsed.data.lastUpdated = new Date(parsed.data.lastUpdated);
        return parsed.data;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const handleRefresh = useCallback(async (force: boolean = false) => {
    setLoading(true);
    setError(null);

    // Try cache first if not forced
    if (!force) {
      const cachedData = loadFromCache();
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
    }

    try {
      const result = await fetchTrafficUpdates();
      
      const statusSeverity = analyzeStatus(result.text);

      const newData: TrafficStatus = {
        summary: "Analisi completata",
        status: statusSeverity,
        nightStatus: result.nightStatus,
        weeklyForecast: result.weeklyForecast,
        closureLocation: result.closureLocation,
        closureStart: result.closureStart,
        closureEnd: result.closureEnd,
        lastUpdated: new Date(),
        sources: result.sources,
        rawText: result.text
      };

      setData(newData);
      saveDataToCache(newData);

    } catch (err: any) {
      setError(err.message || "Errore durante il caricamento.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    handleRefresh(false);
  }, [handleRefresh]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-6">
        
        {/* Intro / Context */}
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Monitoraggio SS36</h2>
          <p className="text-slate-500">
            Controlla in tempo reale lo stato della Strada Statale 36 del Lago di Como e dello Spluga.
            I dati sono elaborati dall'IA basandosi su ricerche web recenti.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 text-sm text-center">
            {error}
            <button onClick={() => handleRefresh(true)} className="block mx-auto mt-2 underline font-medium">Riprova</button>
          </div>
        )}

        {/* Weekly Schedule Table - Now First */}
        {data && data.weeklyForecast && data.weeklyForecast.length > 0 && (
          <WeeklySchedule forecast={data.weeklyForecast} />
        )}

        {/* Info List - Now Second */}
        <InfoList data={data} />

        {/* Live Status Card - Now Last */}
        <div className="mt-8">
           <StatusCard 
             isLoading={loading} 
             status={data} 
             onRefresh={() => handleRefresh(true)} 
           />
        </div>

      </main>

      <footer className="bg-slate-100 border-t border-slate-200 mt-12 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
           
           {/* Donation Section */}
           <div className="mb-10">
             <a 
               href="https://paypal.me/SimoneGoffredo779" 
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFC439] hover:bg-[#F4BB29] text-slate-900 font-bold rounded-full shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 group"
             >
               <Coffee className="w-5 h-5 text-slate-800 group-hover:rotate-12 transition-transform" />
               <span>Offrimi un caffè</span>
             </a>
           </div>

           <div className="flex justify-center items-center gap-2 text-slate-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-medium">AI Powered Monitoring</span>
           </div>
           
           <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mb-8">
             Disclaimer: Questa applicazione utilizza l'intelligenza artificiale per aggregare notizie pubbliche. 
             Non è un servizio ufficiale ANAS. Verifica sempre le informazioni sui canali ufficiali prima di metterti in viaggio.
           </p>

           <div className="border-t border-slate-200 pt-6 max-w-xs mx-auto">
              <p className="text-xs text-slate-500 mb-2">Sviluppato da <span className="font-semibold text-slate-700">Simone Goffredo</span></p>
              <a 
                href="https://www.linkedin.com/in/simone-goffredo/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100"
              >
                <Linkedin className="w-3 h-3" />
                Per suggerimenti o segnalazioni
              </a>
           </div>

           <p className="text-[10px] text-slate-300 mt-6">
             &copy; {new Date().getFullYear()} SS36 Monitor
           </p>
        </div>
      </footer>
      
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress {
          animation: progress 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default App;