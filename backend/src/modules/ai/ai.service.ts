import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../shared/config/index.js';
import { nlpCache } from '../../shared/cache/index.js';
import type { SearchIntent, AIParseResponse } from './ai.types.js';
import { TURKISH_CATEGORIES, TURKISH_CITIES } from './ai.types.js';

/**
 * AI Service for NLP Search
 * Uses Google Gemini API for natural language understanding
 */
class AIService {
  private client: GoogleGenerativeAI | null = null;
  private model: string;
  private timeout: number;

  constructor() {
    this.model = env.GEMINI_MODEL;
    this.timeout = env.NLP_SEARCH_TIMEOUT;

    if (env.GEMINI_API_KEY) {
      this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Parse natural language query into structured SearchIntent
   */
  async parseSearchQuery(query: string): Promise<SearchIntent | null> {
    // Check cache first
    const cachedIntent = nlpCache.getIntent<SearchIntent>(query);
    if (cachedIntent) {
      console.log('[AIService] Cache hit for intent:', query.substring(0, 50));
      return cachedIntent;
    }

    // If AI is not available, use fallback
    if (!this.client) {
      console.warn('[AIService] Gemini API key not configured, using fallback');
      const fallbackIntent = this.fallbackParse(query);
      nlpCache.setIntent(query, fallbackIntent);
      return fallbackIntent;
    }

    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      const prompt = this.buildPrompt(query);

      // Call Gemini API with timeout
      const result = await Promise.race([
        model.generateContent(prompt),
        this.createTimeout(),
      ]);

      if (!result) {
        console.warn('[AIService] Gemini API timeout');
        const fallbackIntent = this.fallbackParse(query);
        nlpCache.setIntent(query, fallbackIntent);
        return fallbackIntent;
      }

      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const parsed = this.parseResponse(text);
      if (!parsed) {
        console.warn('[AIService] Failed to parse Gemini response');
        const fallbackIntent = this.fallbackParse(query);
        nlpCache.setIntent(query, fallbackIntent);
        return fallbackIntent;
      }

      const intent = this.convertToSearchIntent(parsed);

      // Cache the intent
      nlpCache.setIntent(query, intent);

      return intent;
    } catch (error) {
      console.error('[AIService] Error calling Gemini API:', error);
      const fallbackIntent = this.fallbackParse(query);
      nlpCache.setIntent(query, fallbackIntent);
      return fallbackIntent;
    }
  }

  /**
   * Build prompt for Gemini API
   */
  private buildPrompt(query: string): string {
    const today = new Date();
    const currentDay = today.toLocaleDateString('tr-TR', { weekday: 'long' });
    const currentDate = today.toISOString().split('T')[0];

    return `Sen bir etkinlik arama asistanısın. Kullanıcının Türkçe doğal dil sorgusunu analiz et ve yapılandırılmış bir JSON yanıtı döndür.

Bugünün tarihi: ${currentDate} (${currentDay})

Kullanıcı sorgusu: "${query}"

Aşağıdaki JSON formatında yanıt ver (sadece JSON, başka bir şey yazma):
{
  "searchType": "event" | "venue" | "artist" | "mixed",
  "keywords": ["anahtar", "kelimeler"],
  "dateRange": {
    "start": "YYYY-MM-DD" veya null,
    "end": "YYYY-MM-DD" veya null
  },
  "location": "şehir adı" veya null,
  "categories": ["kategori1", "kategori2"] veya [],
  "priceRange": {
    "min": sayı veya null,
    "max": sayı veya null
  },
  "confidence": 0.0 ile 1.0 arası güven skoru
}

Tarih ifadeleri için:
- "bu hafta sonu" = bu Cumartesi ve Pazar
- "gelecek hafta" = gelecek Pazartesi'den itibaren 7 gün
- "bu akşam" = bugün
- "yarın" = yarın
- "gelecek ay" = bir sonraki ayın tamamı
- "cuma akşamı" = bu haftanın Cuması (veya gelecek hafta eğer geçtiyse)

Kategoriler: music, comedy, theater, sports, art, food, nightlife, outdoor, workshop, conference

Sadece JSON döndür, açıklama yapma.`;
  }

  /**
   * Create timeout promise
   */
  private createTimeout(): Promise<null> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(null), this.timeout);
    });
  }

  /**
   * Parse Gemini response text to JSON
   */
  private parseResponse(text: string): AIParseResponse | null {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]) as AIParseResponse;

      // Validate required fields
      if (!parsed.searchType || !Array.isArray(parsed.keywords)) {
        return null;
      }

      // Ensure confidence is a valid number
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        parsed.confidence = 0.7; // Default confidence
      }

      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Convert AI response to SearchIntent
   */
  private convertToSearchIntent(parsed: AIParseResponse): SearchIntent {
    const intent: SearchIntent = {
      searchType: parsed.searchType,
      keywords: parsed.keywords,
      confidence: parsed.confidence,
    };

    // Parse date range
    if (parsed.dateRange) {
      intent.dateRange = {};
      if (parsed.dateRange.start) {
        intent.dateRange.start = new Date(parsed.dateRange.start);
      }
      if (parsed.dateRange.end) {
        intent.dateRange.end = new Date(parsed.dateRange.end);
      }
    }

    // Normalize location
    if (parsed.location) {
      intent.location = this.normalizeCity(parsed.location);
    }

    // Set categories
    if (parsed.categories && parsed.categories.length > 0) {
      intent.categories = parsed.categories;
    }

    // Set price range
    if (parsed.priceRange) {
      intent.priceRange = {};
      if (typeof parsed.priceRange.min === 'number') {
        intent.priceRange.min = parsed.priceRange.min;
      }
      if (typeof parsed.priceRange.max === 'number') {
        intent.priceRange.max = parsed.priceRange.max;
      }
    }

    return intent;
  }

  /**
   * Fallback parser for when AI is unavailable
   * Uses simple keyword matching and pattern recognition
   */
  private fallbackParse(query: string): SearchIntent {
    const lowerQuery = query.toLowerCase();
    const keywords: string[] = [];
    let searchType: SearchIntent['searchType'] = 'mixed';
    let location: string | undefined;
    let categories: string[] = [];
    let dateRange: SearchIntent['dateRange'] | undefined;
    let priceRange: SearchIntent['priceRange'] | undefined;

    // Extract location
    for (const [alias, city] of Object.entries(TURKISH_CITIES)) {
      if (lowerQuery.includes(alias)) {
        location = city;
        break;
      }
    }

    // Extract categories
    for (const [category, terms] of Object.entries(TURKISH_CATEGORIES)) {
      for (const term of terms) {
        if (lowerQuery.includes(term)) {
          if (!categories.includes(category)) {
            categories.push(category);
          }
          if (!keywords.includes(term)) {
            keywords.push(term);
          }
        }
      }
    }

    // Detect search type
    if (lowerQuery.includes('mekan') || lowerQuery.includes('bar') || lowerQuery.includes('venue')) {
      searchType = 'venue';
    } else if (lowerQuery.includes('sanatçı') || lowerQuery.includes('artist') || lowerQuery.includes('şarkıcı')) {
      searchType = 'artist';
    } else if (categories.length > 0 || lowerQuery.includes('etkinlik') || lowerQuery.includes('event')) {
      searchType = 'event';
    }

    // Extract date range
    dateRange = this.extractDateRange(lowerQuery);

    // Extract price range
    priceRange = this.extractPriceRange(lowerQuery);

    // Extract remaining keywords
    const words = query.split(/\s+/).filter(
      (word) =>
        word.length > 2 &&
        !Object.keys(TURKISH_CITIES).includes(word.toLowerCase()) &&
        !['için', 'içinde', 'olan', 'var', 'mı', 'mi', 'ne', 'hangi', 'kadar', 'tl', 'lira'].includes(word.toLowerCase())
    );

    for (const word of words) {
      if (!keywords.includes(word.toLowerCase())) {
        keywords.push(word.toLowerCase());
      }
    }

    return {
      searchType,
      keywords: keywords.slice(0, 10), // Limit to 10 keywords
      location,
      categories: categories.length > 0 ? categories : undefined,
      dateRange,
      priceRange,
      confidence: 0.4, // Low confidence for fallback
    };
  }

  /**
   * Normalize city name
   */
  private normalizeCity(city: string): string {
    const lowerCity = city.toLowerCase();
    return TURKISH_CITIES[lowerCity] || city;
  }

  /**
   * Extract date range from query
   */
  private extractDateRange(query: string): SearchIntent['dateRange'] | undefined {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // "bu hafta sonu" - this weekend
    if (query.includes('bu hafta sonu') || query.includes('hafta sonu')) {
      const dayOfWeek = today.getDay();
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + (6 - dayOfWeek));
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      return { start: saturday, end: sunday };
    }

    // "bu akşam" or "bugün" - tonight/today
    if (query.includes('bu akşam') || query.includes('bugün')) {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: today, end };
    }

    // "yarın" - tomorrow
    if (query.includes('yarın')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const end = new Date(tomorrow);
      end.setHours(23, 59, 59, 999);
      return { start: tomorrow, end };
    }

    // "gelecek hafta" - next week
    if (query.includes('gelecek hafta') || query.includes('önümüzdeki hafta')) {
      const dayOfWeek = today.getDay();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + (8 - dayOfWeek) % 7);
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);
      return { start: nextMonday, end: nextSunday };
    }

    // "gelecek ay" - next month
    if (query.includes('gelecek ay') || query.includes('önümüzdeki ay')) {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { start: nextMonth, end: endOfNextMonth };
    }

    // Day names (cuma, cumartesi, etc.)
    const dayNames: Record<string, number> = {
      'pazartesi': 1,
      'salı': 2,
      'çarşamba': 3,
      'perşembe': 4,
      'cuma': 5,
      'cumartesi': 6,
      'pazar': 0,
    };

    for (const [dayName, dayNum] of Object.entries(dayNames)) {
      if (query.includes(dayName)) {
        const targetDate = new Date(today);
        const currentDay = today.getDay();
        let daysUntil = dayNum - currentDay;
        if (daysUntil <= 0) {
          daysUntil += 7; // Next week
        }
        targetDate.setDate(today.getDate() + daysUntil);
        const end = new Date(targetDate);
        end.setHours(23, 59, 59, 999);
        return { start: targetDate, end };
      }
    }

    return undefined;
  }

  /**
   * Extract price range from query
   */
  private extractPriceRange(query: string): SearchIntent['priceRange'] | undefined {
    // "X TL altında" - under X TL
    const underMatch = query.match(/(\d+)\s*(?:tl|lira)?\s*altında/i);
    if (underMatch) {
      return { max: parseInt(underMatch[1], 10) };
    }

    // "X TL üstünde" - over X TL
    const overMatch = query.match(/(\d+)\s*(?:tl|lira)?\s*(?:üstünde|üzerinde)/i);
    if (overMatch) {
      return { min: parseInt(overMatch[1], 10) };
    }

    // "X-Y TL arası" - between X-Y TL
    const rangeMatch = query.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:tl|lira)/i);
    if (rangeMatch) {
      return {
        min: parseInt(rangeMatch[1], 10),
        max: parseInt(rangeMatch[2], 10),
      };
    }

    // "ücretsiz" or "bedava" - free
    if (query.includes('ücretsiz') || query.includes('bedava')) {
      return { max: 0 };
    }

    return undefined;
  }
}

export const aiService = new AIService();
