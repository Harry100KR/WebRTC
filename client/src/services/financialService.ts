import { api } from './api';
import { FinancialInstrument, FinancialCategory, Portfolio, Watchlist, ComparisonGroup } from '../types/financialTypes';

// Financial Instruments
export const getFinancialInstruments = async (): Promise<FinancialInstrument[]> => {
  const response = await api.get('/financial-instruments');
  return response.data;
};

export const getFinancialInstrumentById = async (id: number): Promise<FinancialInstrument> => {
  const response = await api.get(`/financial-instruments/${id}`);
  return response.data;
};

// Categories
export const getCategories = async (): Promise<FinancialCategory[]> => {
  const response = await api.get('/categories');
  return response.data;
};

// Portfolios
export const getPortfolios = async (): Promise<Portfolio[]> => {
  const response = await api.get('/portfolios');
  return response.data;
};

export const getPortfolioById = async (id: number): Promise<Portfolio> => {
  const response = await api.get(`/portfolios/${id}`);
  return response.data;
};

export const createPortfolio = async (portfolio: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>): Promise<Portfolio> => {
  const response = await api.post('/portfolios', portfolio);
  return response.data;
};

export const updatePortfolio = async (id: number, portfolio: Partial<Portfolio>): Promise<Portfolio> => {
  const response = await api.put(`/portfolios/${id}`, portfolio);
  return response.data;
};

export const deletePortfolio = async (id: number): Promise<void> => {
  await api.delete(`/portfolios/${id}`);
};

// Watchlists
export const getWatchlists = async (): Promise<Watchlist[]> => {
  const response = await api.get('/watchlists');
  return response.data;
};

export const getWatchlistById = async (id: number): Promise<Watchlist> => {
  const response = await api.get(`/watchlists/${id}`);
  return response.data;
};

export const createWatchlist = async (watchlist: Omit<Watchlist, 'id' | 'created_at' | 'updated_at'>): Promise<Watchlist> => {
  const response = await api.post('/watchlists', watchlist);
  return response.data;
};

export const updateWatchlist = async (id: number, watchlist: Partial<Watchlist>): Promise<Watchlist> => {
  const response = await api.put(`/watchlists/${id}`, watchlist);
  return response.data;
};

export const deleteWatchlist = async (id: number): Promise<void> => {
  await api.delete(`/watchlists/${id}`);
};

// Comparison Groups
export const getComparisonGroups = async (): Promise<ComparisonGroup[]> => {
  const response = await api.get('/comparison-groups');
  return response.data;
};

export const createComparisonGroup = async (group: Omit<ComparisonGroup, 'id' | 'created_at'>): Promise<ComparisonGroup> => {
  const response = await api.post('/comparison-groups', group);
  return response.data;
};

export const updateComparisonGroup = async (id: number, group: Partial<ComparisonGroup>): Promise<ComparisonGroup> => {
  const response = await api.put(`/comparison-groups/${id}`, group);
  return response.data;
};

export const deleteComparisonGroup = async (id: number): Promise<void> => {
  await api.delete(`/comparison-groups/${id}`);
}; 