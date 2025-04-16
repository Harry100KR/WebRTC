import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FiltersState {
  searchTerm: string;
  category: string | null;
  minInvestment: number | null;
  maxInvestment: number | null;
  minInterestRate: number | null;
  maxInterestRate: number | null;
  sortBy: 'name' | 'interestRate' | 'minimumInvestment' | null;
  sortOrder: 'asc' | 'desc';
}

const initialState: FiltersState = {
  searchTerm: '',
  category: null,
  minInvestment: null,
  maxInvestment: null,
  minInterestRate: null,
  maxInterestRate: null,
  sortBy: null,
  sortOrder: 'asc',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setCategory: (state, action: PayloadAction<string | null>) => {
      state.category = action.payload;
    },
    setInvestmentRange: (
      state,
      action: PayloadAction<{ min: number | null; max: number | null }>
    ) => {
      state.minInvestment = action.payload.min;
      state.maxInvestment = action.payload.max;
    },
    setInterestRateRange: (
      state,
      action: PayloadAction<{ min: number | null; max: number | null }>
    ) => {
      state.minInterestRate = action.payload.min;
      state.maxInterestRate = action.payload.max;
    },
    setSortBy: (
      state,
      action: PayloadAction<'name' | 'interestRate' | 'minimumInvestment' | null>
    ) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    resetFilters: (state) => {
      return initialState;
    },
  },
});

export const {
  setSearchTerm,
  setCategory,
  setInvestmentRange,
  setInterestRateRange,
  setSortBy,
  setSortOrder,
  resetFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer; 