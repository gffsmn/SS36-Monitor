import { GoogleGenAI } from "@google/genai";
import { SearchResult, NightStatus, DayForecast } from "../types";

export const fetchTrafficUpdates = async (): Promise<SearchResult> => {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.error("API Key missing.");
      throw new Error("Configurazione mancante. Verifica API_KEY.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";
    
    // Logic: Before 6 AM, we care about the night that started yesterday.
    const now = new Date();
    const isEarlyMorning = now.getHours() < 6;
    const effectiveDate = new Date(now);
    if (isEarlyMorning) {
        effectiveDate.setDate(effectiveDate.getDate() - 1);
    }

    const reportStartDate = effectiveDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    const currentHour = now.getHours();

    const prompt = `
      Sei il Supervisore Traffico SS36 (Milano-Lecco-Sondrio).
      OBIETTIVO: Identificare chiusure notturne, lavori in galleria e restringimenti.

      DATA RIFERIMENTO: ${reportStartDate} 
      (Se ore ${currentHour}:00 < 06:00, analizza la notte iniziata ieri sera).

      ### 1. SEARCH STRATEGY (High Precision)
      Cerca specificamente:
      - "SS36 ordinanze lavori notturni questa settimana"
      - "Chiusura Galleria Monte Barro orari"
      - "Chiusura Attraversamento Lecco tunnel"
      - "Lavori notturni SS36 tratto Civate Pescate"
      - "LeccoToday viabilità SS36 oggi"
      - "Valsassinanews SS36 ultime notizie"

      ### 2. STRICT RULES
      - **CHIUSO (CLOSED)**: Solo se confermato da ANAS o 2+ giornali locali (LeccoToday, La Provincia).
      - **PARZIALE (PARTIAL)**: Corsia unica, scambio carreggiata o svincoli chiusi.
      - **DATE**: Ignora notizie più vecchie di 5 giorni.

      ### 3. OUTPUT FORMAT
      
      RIGA 1: TAG SINTETICO
      Scegli UNO: ##NIGHT_CLOSED##, ##NIGHT_PARTIAL##, ##NIGHT_OPEN##, ##NIGHT_UNKNOWN##.

      RIGA VUOTA

      RIGA 2: TITOLO FLASH
      Esempio: "Galleria Monte Barro chiusa verso Nord" o "Viabilità regolare".

      RIGA VUOTA

      TESTO LIBERO:
      Spiegazione chiara e concisa in italiano. Cita i nomi dei tunnel (es. Monte Barro, San Martino).

      RIGA VUOTA

      JSON BLOCK (Strict Syntax):
      Devi coprire ESATTAMENTE 7-14 giorni partendo da ${reportStartDate}.
      "north" = Verso Chiavenna/Sondrio.
      "south" = Verso Milano.
      
      \`\`\`json
      {
        "start": "Civate",
        "end": "Pescate",
        "location": "Tratto Lecco-Brianza",
        "forecast": [
          { 
            "day": "Lun", 
            "date": "10/02", 
            "north": { "status": "CLOSED", "details": "Chiusura Monte Barro 21:00-06:00" }, 
            "south": { "status": "OPEN", "details": "Regolare" } 
          }
        ]
      }
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      },
    });

    let fullText = response.text || "Nessuna informazione disponibile.";
    
    // 1. Parse Tags
    let nightStatus: NightStatus = 'UNKNOWN';
    if (fullText.includes('##NIGHT_CLOSED##')) nightStatus = 'CLOSED';
    else if (fullText.includes('##NIGHT_PARTIAL##')) nightStatus = 'PARTIAL';
    else if (fullText.includes('##NIGHT_OPEN##')) nightStatus = 'OPEN';
    
    // Cleanup tags from text display
    fullText = fullText
      .replace(/##NIGHT_[A-Z]+##/g, '')
      .trim();

    // 2. Robust JSON Extraction
    let weeklyForecast: DayForecast[] = [];
    let closureLocation: string | undefined;
    let closureStart: string | undefined;
    let closureEnd: string | undefined;

    // Regex to find JSON block, handling potential loose formatting
    const jsonMatch = fullText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    let cleanText = fullText;

    if (jsonMatch && jsonMatch[1]) {
      try {
        // Remove comments if any (simple stripper)
        const jsonStr = jsonMatch[1].replace(/\/\/.*$/gm, ''); 
        const parsed = JSON.parse(jsonStr);
        
        if (Array.isArray(parsed)) {
            weeklyForecast = parsed;
        } else {
            weeklyForecast = parsed.forecast || [];
            closureLocation = parsed.location;
            closureStart = parsed.start;
            closureEnd = parsed.end;
        }
        // Remove the JSON block from the readable text
        cleanText = fullText.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error("JSON Parse Error:", e);
        // Fallback: don't crash, just show text
      }
    }

    // 3. Extract & Deduplicate Sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
      }))
      .filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uri === v.uri) === i) // Uniq by URI
      .filter((s: any) => !s.uri.includes('google.com/search') && !s.uri.includes('vertexaisearch'));

    return {
      text: cleanText,
      sources,
      nightStatus,
      weeklyForecast,
      closureLocation,
      closureStart,
      closureEnd
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("Servizio momentaneamente non disponibile. Riprova tra poco.");
  }
};