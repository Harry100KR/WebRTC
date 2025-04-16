export interface FinancialInstrument {
  id: string;
  name: string;
  description: string;
  category_id: number;
  category?: string;
  interest_rate?: number;
  term?: string;
  minimum_investment: number;
  risk_level: string;
  currency: string;
  is_active: boolean;
  features: string[];
  risks: string[];
  documents: string[];
  created_at: string;
  updated_at: string;
}

export interface FinancialCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: number;
  name: string;
  description: string;
  user_id: number;
  is_public: boolean;
  instruments: string[]; // Array of instrument IDs (changed from number[] to string[])
  created_at: string;
  updated_at: string;
}

export interface Watchlist {
  id: number;
  name: string;
  description: string;
  user_id: number;
  instruments: string[]; // Array of instrument IDs (changed from number[] to string[])
  created_at: string;
  updated_at: string;
}

export interface ComparisonGroup {
  id: number;
  name: string;
  user_id: number;
  instruments: string[]; // Array of instrument IDs (changed from number[] to string[])
  created_at: string;
} 