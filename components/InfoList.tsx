import React, { useState } from 'react';
import { ExternalLink, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { TrafficStatus } from '../types';

interface InfoListProps {
  data: TrafficStatus | null;
}

export const InfoList: React.FC<InfoListProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  // Simple parser (kept from previous version)
  const renderText = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-2" />;
      
      if (trimmed.startsWith('**') || trimmed.endsWith('**') || trimmed.includes(': **')) {
          return <p key={index} className="mb-2 font-semibold text-slate-800">{line.replace(/\*\*/g, '')}</p>
      }
      
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        return (
          <div key={index} className="flex gap-2 mb-2 ml-1">
            <span className="text-blue-500 mt-1.5">•</span>
            <span className="text-slate-700 leading-relaxed flex-1">
                {line.replace(/^[-*•]\s*/, '').split(/(\*\*.*?\*\*)/).map((part, i) => 
                    part.startsWith('**') && part.endsWith('**') 
                    ? <strong key={i} className="text-slate-900 font-medium">{part.replace(/\*\*/g, '')}</strong> 
                    : part
                )}
            </span>
          </div>
        );
      }
      return <p key={index} className="mb-2 text-slate-600 leading-relaxed">{line.replace(/\*\*/g, '')}</p>;
    });
  };

  return (
    <div className="space-y-4">
      {/* Collapsible AI Report */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Info className="w-5 h-5 text-blue-500" />
            <span>Leggi Report Completo</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        
        {isOpen && (
          <div className="p-6 border-t border-slate-100 text-sm md:text-base bg-slate-50/50">
            {renderText(data.rawText)}
            
            {/* Sources nested inside */}
            {data.sources.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Fonti</h4>
                <div className="flex flex-wrap gap-2">
                  {data.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <span className="truncate max-w-[150px]">{source.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
