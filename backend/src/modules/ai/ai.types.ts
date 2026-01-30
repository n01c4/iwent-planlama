/**
 * AI Module Types
 * Phase 8: NLP Search
 */

/**
 * Search Intent extracted from natural language query
 */
export interface SearchIntent {
  searchType: 'event' | 'venue' | 'artist' | 'mixed';
  keywords: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  location?: string;
  categories?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  confidence: number; // 0-1 score
}

/**
 * Raw AI response from Gemini
 */
export interface AIParseResponse {
  searchType: 'event' | 'venue' | 'artist' | 'mixed';
  keywords: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  location?: string;
  categories?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  confidence: number;
}

/**
 * AI Service configuration
 */
export interface AIConfig {
  apiKey: string;
  model: string;
  timeout: number;
  cacheTTL: number;
}

/**
 * Turkish date expressions mapping
 */
export interface DateExpression {
  pattern: RegExp;
  resolver: () => { start: Date; end: Date };
}

/**
 * Turkish category mapping
 */
export const TURKISH_CATEGORIES: Record<string, string[]> = {
  music: ['konser', 'müzik', 'canlı müzik', 'festival', 'dj', 'sahne'],
  comedy: ['stand-up', 'komedi', 'gösteri', 'güldürü'],
  theater: ['tiyatro', 'oyun', 'sahne sanatları', 'drama'],
  sports: ['spor', 'maç', 'turnuva', 'fitness', 'yoga'],
  art: ['sergi', 'sanat', 'galeri', 'resim', 'heykel'],
  food: ['yemek', 'gastronomi', 'tadım', 'şarap', 'meyhane'],
  nightlife: ['gece hayatı', 'bar', 'kulüp', 'parti', 'disko'],
  outdoor: ['açık hava', 'doğa', 'piknik', 'kamp', 'yürüyüş'],
  workshop: ['atölye', 'workshop', 'kurs', 'eğitim', 'seminer'],
  conference: ['konferans', 'toplantı', 'summit', 'panel'],
};

/**
 * Turkish city aliases
 */
export const TURKISH_CITIES: Record<string, string> = {
  'istanbul': 'İstanbul',
  'ist': 'İstanbul',
  'ankara': 'Ankara',
  'ank': 'Ankara',
  'izmir': 'İzmir',
  'izm': 'İzmir',
  'antalya': 'Antalya',
  'bursa': 'Bursa',
  'adana': 'Adana',
  'konya': 'Konya',
  'gaziantep': 'Gaziantep',
  'mersin': 'Mersin',
  'eskişehir': 'Eskişehir',
  'bodrum': 'Bodrum',
  'çeşme': 'Çeşme',
  'kapadokya': 'Nevşehir',
};
