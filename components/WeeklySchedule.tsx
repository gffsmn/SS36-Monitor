import React, { useState } from 'react';
import { Moon, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { DayForecast, DirectionStatus } from '../types';

interface WeeklyScheduleProps {
  forecast: DayForecast[];
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ forecast }) => {
  const [startIndex, setStartIndex] = useState<number>(0);
  const visibleCount = 5; // Show 5 days on mobile for better sizing, CSS can adapt

  if (!forecast || forecast.length === 0) return null;

  const maxIndex = Math.max(0, forecast.length - visibleCount);
  const currentData = forecast.slice(startIndex, startIndex + visibleCount);

  // Pad if needed
  while (currentData.length < visibleCount && forecast.length > 0) {
      currentData.push({ day: '-', date: '--', north: { status: 'UNKNOWN', details: '' }, south: { status: 'UNKNOWN', details: '' } });
  }

  const getDateRange = () => {
    if (currentData.length === 0) return "";
    return `${currentData[0].date} - ${currentData[currentData.length - 1].date}`;
  };

  const handleNext = () => setStartIndex(prev => Math.min(prev + 1, maxIndex));
  const handlePrev = () => setStartIndex(prev => Math.max(prev - 1, 0));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/80">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Moon className="w-4 h-4 text-blue-600" />
            Calendario Notturno
          </h3>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 ml-6">
            Lavori previsti dopo le 21:00
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm ml-auto">
             <button 
                onClick={handlePrev} 
                disabled={startIndex === 0}
                className={`p-1.5 rounded-md hover:bg-slate-50 transition-colors ${startIndex === 0 ? 'text-slate-200' : 'text-blue-600'}`}
             >
                <ChevronLeft className="w-5 h-5" />
             </button>
             <span className="text-xs font-mono font-semibold text-slate-600 min-w-[60px] text-center">
                {getDateRange()}
             </span>
             <button 
                onClick={handleNext} 
                disabled={startIndex >= maxIndex}
                className={`p-1.5 rounded-md hover:bg-slate-50 transition-colors ${startIndex >= maxIndex ? 'text-slate-200' : 'text-blue-600'}`}
             >
                <ChevronRight className="w-5 h-5" />
             </button>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        {/* Days Header */}
        <div className="grid grid-cols-5 gap-2 mb-6">
           {currentData.map((day, idx) => (
              <div key={idx} className="text-center">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day.day}</div>
                 <div className="text-sm font-bold text-slate-700">{day.date.split('/')[0]}</div>
              </div>
           ))}
        </div>

        <div className="space-y-6">
            
            {/* VERSO CHIAVENNA (NORD) */}
            <div>
               <div className="flex items-center gap-2 mb-2">
                   <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <ArrowUp className="w-3 h-3" />
                   </div>
                   <span className="text-xs font-bold text-slate-700">Verso Chiavenna/Sondrio</span>
               </div>
               <div className="grid grid-cols-5 gap-2">
                   {currentData.map((day, idx) => (
                      <div key={`n-${idx}`} className="flex justify-center h-10 items-center bg-slate-50 rounded-lg border border-slate-100">
                          {day.date !== '--' && <DirectionDot day={day} dirData={day.north} direction="Nord" />}
                      </div>
                   ))}
               </div>
            </div>

            {/* VERSO MILANO (SUD) */}
             <div>
               <div className="flex items-center gap-2 mb-2">
                   <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <ArrowDown className="w-3 h-3" />
                   </div>
                   <span className="text-xs font-bold text-slate-700">Verso Milano</span>
               </div>
               <div className="grid grid-cols-5 gap-2">
                   {currentData.map((day, idx) => (
                      <div key={`s-${idx}`} className="flex justify-center h-10 items-center bg-slate-50 rounded-lg border border-slate-100">
                          {day.date !== '--' && <DirectionDot day={day} dirData={day.south} direction="Sud" />}
                      </div>
                   ))}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const DirectionDot: React.FC<{ day: DayForecast, dirData: DirectionStatus, direction: string }> = ({ day, dirData, direction }) => {
    const status = dirData?.status || 'UNKNOWN';
    let details = dirData?.details || 'Nessun dato';
    
    // Color Logic
    let colorClass = 'bg-slate-300'; // Unknown
    let shadowClass = '';
    
    if (status === 'CLOSED') {
        colorClass = 'bg-rose-500';
        shadowClass = 'shadow-[0_0_10px_rgba(244,63,94,0.5)]';
    } else if (status === 'PARTIAL') {
        colorClass = 'bg-amber-400';
        shadowClass = 'shadow-[0_0_8px_rgba(251,191,36,0.5)]';
    } else if (status === 'OPEN') {
        colorClass = 'bg-emerald-400';
        shadowClass = 'shadow-[0_0_8px_rgba(52,211,153,0.4)]';
    }

    return (
        <div className="group relative w-full h-full flex items-center justify-center cursor-pointer">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${colorClass} ${shadowClass} group-hover:scale-125`} />
            
            {/* Popover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="bg-slate-800 text-white rounded-xl p-3 shadow-xl text-xs border border-slate-700">
                    <div className="font-bold text-blue-200 mb-1 border-b border-slate-600 pb-1">
                        {day.day} {day.date} - {direction}
                    </div>
                    <div className="text-slate-300 leading-tight">
                        {details}
                    </div>
                </div>
                {/* Triangle */}
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800 absolute left-1/2 -translate-x-1/2 top-full"></div>
            </div>
        </div>
    )
}