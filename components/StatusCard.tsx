import React, { useState } from 'react';
import { RefreshCw, Moon, Sun, CheckCircle2, ExternalLink, FileText, HelpCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { TrafficStatus } from '../types';

interface StatusCardProps {
  isLoading: boolean;
  status: TrafficStatus | null;
  onRefresh: () => void;
}

// Helper to identify trusted domains
const isTrustedSource = (url: string): boolean => {
  const trustedDomains = [
    'stradeanas.it',
    'poliziadistato.it',
    'cciss.it',
    'mit.gov.it',
    'leccotoday.it',
    'sondriotoday.it',
    'monzatoday.it',
    'laprovinciadisondrio.it',
    'laprovinciadilecco.it',
    'primalecco.it',
    'primamonza.it',
    'teleunica.com',
    'valsassinanews.com',
    'quibrianza.it',
    'ilgiorno.it',
    'rainews.it'
  ];
  try {
    const hostname = new URL(url).hostname;
    return trustedDomains.some(domain => hostname.includes(domain));
  } catch (e) {
    return false;
  }
};

export const StatusCard: React.FC<StatusCardProps> = ({ isLoading, status, onRefresh }) => {
  const [showSources, setShowSources] = useState(false);

  // If no status and loading, parent handles skeleton. 
  // If no status and NOT loading, it's an error state (handled by parent) or empty.
  if (!status) return null;

  const isNightClosed = status.nightStatus === 'CLOSED';
  const isNightWarning = status.nightStatus === 'PARTIAL';
  const isGeneralWarning = status.status !== 'OPEN';

  // Determine main visual state
  let mainColor = 'bg-emerald-500';
  let mainIcon = <CheckCircle2 className="w-10 h-10 text-white" />;
  let mainText = "Via Libera";
  let subText = "Nessuna criticità rilevata al momento.";

  if (isNightClosed) {
    mainColor = 'bg-red-600';
    mainIcon = <Moon className="w-10 h-10 text-white" />;
    mainText = "CHIUSO STANOTTE";
    subText = "Chiusura totale confermata.";
  } else if (isNightWarning || isGeneralWarning) {
    mainColor = 'bg-orange-500';
    mainIcon = <HelpCircle className="w-10 h-10 text-white" />;
    mainText = "Possibile Chiusura";
    subText = "Attendere aggiornamenti ufficiali.";
  }

  // Sort sources: trusted first
  const sortedSources = [...(status.sources || [])].sort((a, b) => {
    const aTrusted = isTrustedSource(a.uri);
    const bTrusted = isTrustedSource(b.uri);
    if (aTrusted && !bTrusted) return -1;
    if (!aTrusted && bTrusted) return 1;
    return 0;
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-6 relative transition-all duration-300">
      {/* Top Main Status Section */}
      <div className={`${mainColor} p-6 flex items-center justify-between text-white transition-colors duration-500`}>
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            {mainIcon}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{mainText}</h2>
            <p className="text-white/90 text-sm font-medium">{subText}</p>
          </div>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all ${isLoading ? 'animate-spin bg-white/30' : ''}`}
        >
          <RefreshCw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Collapsible Source Links Section */}
      {sortedSources.length > 0 && (
        <div className="bg-slate-50 border-b border-slate-100">
           <button 
             onClick={() => setShowSources(!showSources)}
             className="w-full flex items-center justify-between p-4 text-slate-500 hover:bg-slate-100 transition-colors"
           >
             <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Fonti Rilevate ({sortedSources.length})</span>
             </div>
             {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
           </button>
           
           {showSources && (
             <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
               {sortedSources.slice(0, 5).map((source, idx) => {
                 const isTrusted = isTrustedSource(source.uri);
                 return (
                   <a 
                     key={idx}
                     href={source.uri}
                     target="_blank"
                     rel="noopener noreferrer"
                     className={`flex items-start gap-2 p-3 bg-white border rounded-lg hover:shadow-sm transition-all group ${isTrusted ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}
                   >
                     <ExternalLink className={`w-4 h-4 mt-0.5 flex-shrink-0 group-hover:text-blue-500 ${isTrusted ? 'text-blue-500' : 'text-slate-400'}`} />
                     <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-semibold leading-snug line-clamp-2 ${isTrusted ? 'text-blue-700' : 'text-slate-700'}`}>
                            {source.title || "Fonte Web"}
                          </p>
                          {isTrusted && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-100 text-[9px] font-bold text-blue-700 uppercase tracking-wide border border-blue-200 whitespace-nowrap">
                              <ShieldCheck className="w-3 h-3" /> Ufficiale
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[250px]">
                          {new URL(source.uri).hostname.replace('www.', '')}
                        </p>
                     </div>
                   </a>
                 );
               })}
             </div>
           )}
        </div>
      )}

      {/* Mini Dashboard Footer */}
      <div className="px-6 py-3 bg-white flex items-center justify-between text-xs text-slate-400 font-medium">
         <div className="flex items-center gap-1.5">
           {new Date().getHours() > 19 || new Date().getHours() < 6 ? <Moon className="w-3 h-3"/> : <Sun className="w-3 h-3"/>}
           <span>{status.lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
         </div>
         <div className="flex items-center gap-1">
            {isLoading ? <span className="text-blue-500 font-semibold animate-pulse">Aggiornamento...</span> : <span className="uppercase tracking-widest text-[10px]">Aggiornato Live</span>}
         </div>
      </div>
      
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-100 z-10">
          <div className="h-full bg-blue-600 animate-progress"></div>
        </div>
      )}
    </div>
  );
};