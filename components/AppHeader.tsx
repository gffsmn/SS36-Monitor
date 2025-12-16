import React from 'react';
import { Route, MapPin } from 'lucide-react';

export const AppHeader: React.FC = () => {
  return (
    <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg bg-opacity-20 backdrop-blur-sm">
             <Route className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">SS36 Monitor</h1>
            <p className="text-xs text-blue-200 mt-1 font-medium">Milano ↔ Chiavenna</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm bg-blue-800 px-3 py-1 rounded-full bg-opacity-50">
          <MapPin className="w-4 h-4 text-blue-300" />
          <span>Lombardia, IT</span>
        </div>
      </div>
    </header>
  );
};