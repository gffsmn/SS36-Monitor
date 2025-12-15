
export interface Source {
  title: string;
  uri: string;
}

export type NightStatus = 'OPEN' | 'CLOSED' | 'PARTIAL' | 'UNKNOWN';

export interface DirectionStatus {
  status: 'OPEN' | 'CLOSED' | 'PARTIAL' | 'UNKNOWN';
  details: string;
}

export interface DayForecast {
  day: string; // e.g., "Lun"
  date: string; // e.g., "10/02"
  north: DirectionStatus; // Milano -> Chiavenna
  south: DirectionStatus; // Chiavenna -> Milano
}

export interface TrafficStatus {
  summary: string;
  status: 'OPEN' | 'WARNING' | 'CLOSED' | 'UNKNOWN';
  nightStatus: NightStatus;
  weeklyForecast: DayForecast[];
  closureLocation?: string; // Fallback general string
  closureStart?: string; // New: Start point of closure
  closureEnd?: string;   // New: End point of closure
  lastUpdated: Date;
  sources: Source[];
  rawText: string;
}

export interface SearchResult {
  text: string;
  sources: Source[];
  nightStatus: NightStatus;
  weeklyForecast: DayForecast[];
  closureLocation?: string;
  closureStart?: string; // New
  closureEnd?: string;   // New
}
