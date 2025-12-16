import React, { useState, useEffect, useCallback } from 'react';
import { AppHeader } from './components/AppHeader';
import { StatusCard } from './components/StatusCard';
import { InfoList } from './components/InfoList';
import { WeeklySchedule } from './components/WeeklySchedule';
import { fetchTrafficUpdates } from './services/geminiService';
import { TrafficStatus } from './types';
import { ShieldCheck, Linkedin, Coffee, Loader2 } from 'lucide-react';

const CACHE_KEY = 'ss36_traffic_data_v1';
const CACHE_VALIDITY_MS = 15 * 60 * 1000; // 15 mins fresh
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours max before force discard

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-6 w-full">
    <div className="h-48 bg-slate-200 rounded-2xl w-full"></div>
    <div className="h-16 bg-slate-200 rounded-2xl w-full"></div>
    <div className="h-64 bg-slate-200 rounded-2xl w-full"></div>
  </div>
);

// Helper for "X minutes ago"
const getTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "pochi secondi fa";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ore fa`;
  return date.toLocaleDateString();
};

const App: React.FC = () => {
  const [data, setData] = useState<TrafficStatus | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const lastUpdated = new Date(parsed.data.lastUpdated);
        const age = Date.now() - parsed.timestamp;
        
        // If data is ancient (> 6 hours), discard it to avoid confusion
        if (age > CACHE_MAX_AGE_MS) {
          return null;
        }
        
        parsed.data.lastUpdated = lastUpdated;
        return parsed.data;
      }
    } catch (e) {
      return null;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!data);
  const [isBackgroundUpdating, setIsBackgroundUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>("");

  // Update "Time Ago" ticker
  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(data.lastUpdated));
    }, 60000);
    setTimeAgo(getTimeAgo(data.lastUpdated)); // Immediate
    return () => clearInterval(interval);
  }, [data]);

  const analyzeStatus = (text: string): 'OPEN' | 'WARNING' | 'CLOSED' => {
    const lower = text.toLowerCase();
    if (lower.includes('chiusa') || lower.includes('bloccata') || lower.includes('chiusura totale')) return 'CLOSED';
    if (lower.includes('lavori') || lower.includes('restringimento') || lower.includes('coda') || lower.includes('rallentamenti')) return 'WARNING';
    return 'OPEN';
  };

  const handleRefresh = useCallback(async (force: boolean = false) => {
    const isStale = data ? (Date.now() - data.lastUpdated.getTime() > CACHE_VALIDITY_MS) : true;

    // If we have data, it's fresh, and not forcing -> Do nothing
    if (!force && data && !isStale) {
      setLoading(false);
      return;
    }

    if (data) setIsBackgroundUpdating(true);
    else setLoading(true);
    
    setError(null);

    try {
      const result = await fetchTrafficUpdates();
      
      const newData: TrafficStatus = {
        summary: "Analisi completata",
        status: analyzeStatus(result.text),
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
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newData,
        timestamp: Date.now()
      }));

    } catch (err: any) {
      console.error(err);
      if (!data) setError(err.message || "Errore di connessione.");
    } finally {
      setLoading(false);
      setIsBackgroundUpdating(false);
    }
  }, [data]);

  useEffect(() => {
    handleRefresh(false);
  }, [handleRefresh]);

  return (
    <div className="min-h-screen flex flex-col font-inter text-slate-900">
      <AppHeader />

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-6">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoraggio SS36</h2>
            <p className="text-slate-500 text-sm">
              Situazione aggiornata Tunnel e Cantieri
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             {isBackgroundUpdating ? (
               <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold animate-pulse">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 Aggiorno...
               </span>
             ) : data && (
               <span className="text-xs text-slate-400 font-medium">
                 Aggiornato {timeAgo}
               </span>
             )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 text-sm text-center shadow-sm">
            {error}
            <button onClick={() => handleRefresh(true)} className="block mx-auto mt-2 font-bold underline">Riprova</button>
          </div>
        )}

        {loading && !data ? (
          <SkeletonLoader />
        ) : (
          <div className="space-y-6 fade-in">
            {/* Weekly Schedule */}
            {data && data.weeklyForecast && data.weeklyForecast.length > 0 && (
              <WeeklySchedule forecast={data.weeklyForecast} />
            )}

            {/* Info Accordion */}
            <InfoList data={data} />

            {/* Main Status Card */}
            <StatusCard 
              isLoading={isBackgroundUpdating || loading} 
              status={data} 
              onRefresh={() => handleRefresh(true)} 
            />
          </div>
        )}
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 mt-12 py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
           <div className="mb-8">
             <a 
               href="https://paypal.me/SimoneGoffredo779" 
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFC439] hover:bg-[#F4BB29] text-slate-900 font-bold rounded-full shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
             >
               <Coffee className="w-5 h-5 text-slate-800" />
               <span>Offrimi un caffè</span>
             </a>
           </div>

           <div className="flex justify-center items-center gap-2 text-slate-400 mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">AI Powered Analysis</span>
           </div>
           
           <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto mb-6">
             Questo servizio utilizza Gemini AI per analizzare fonti pubbliche. Non è ufficiale ANAS. Le informazioni potrebbero essere imprecise.
           </p>

           <div className="pt-6 border-t border-slate-200 max-w-xs mx-auto">
              <a 
                href="https://www.linkedin.com/in/simone-goffredo/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/50 px-3 py-1.5 rounded-full"
              >
                <Linkedin className="w-3 h-3" />
                Simone Goffredo
              </a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;