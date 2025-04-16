import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Portfolio } from '../../types/financialTypes';
import { 
  getPortfolios, 
  getPortfolioById, 
  createPortfolio, 
  updatePortfolio, 
  deletePortfolio 
} from '../../services/financialService';

interface PortfoliosState {
  items: Portfolio[];
  currentPortfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
}

const initialState: PortfoliosState = {
  items: [],
  currentPortfolio: null,
  loading: false,
  error: null,
};

export const fetchPortfolios = createAsyncThunk(
  'portfolios/fetchPortfolios',
  async (_, { rejectWithValue }) => {
    try {
      return await getPortfolios();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch portfolios');
    }
  }
);

export const fetchPortfolioById = createAsyncThunk(
  'portfolios/fetchPortfolioById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await getPortfolioById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch portfolio');
    }
  }
);

export const addPortfolio = createAsyncThunk(
  'portfolios/addPortfolio',
  async (portfolio: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      return await createPortfolio(portfolio);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create portfolio');
    }
  }
);

export const editPortfolio = createAsyncThunk(
  'portfolios/editPortfolio',
  async ({ id, portfolio }: { id: number; portfolio: Partial<Portfolio> }, { rejectWithValue }) => {
    try {
      return await updatePortfolio(id, portfolio);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update portfolio');
    }
  }
);

export const removePortfolio = createAsyncThunk(
  'portfolios/removePortfolio',
  async (id: number, { rejectWithValue }) => {
    try {
      await deletePortfolio(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete portfolio');
    }
  }
);

const portfoliosSlice = createSlice({
  name: 'portfolios',
  initialState,
  reducers: {
    clearCurrentPortfolio: (state) => {
      state.currentPortfolio = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all portfolios
      .addCase(fetchPortfolios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolios.fulfilled, (state, action: PayloadAction<Portfolio[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPortfolios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch portfolio by id
      .addCase(fetchPortfolioById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioById.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.loading = false;
        state.currentPortfolio = action.payload;
      })
      .addCase(fetchPortfolioById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add portfolio
      .addCase(addPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPortfolio.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.loading = false;
        state.items.push(action.payload);
        state.currentPortfolio = action.payload;
      })
      .addCase(addPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Edit portfolio
      .addCase(editPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editPortfolio.fulfilled, (state, action: PayloadAction<Portfolio>) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.currentPortfolio = action.payload;
      })
      .addCase(editPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove portfolio
      .addCase(removePortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removePortfolio.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        if (state.currentPortfolio?.id === action.payload) {
          state.currentPortfolio = null;
        }
      })
      .addCase(removePortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentPortfolio } = portfoliosSlice.actions;
export default portfoliosSlice.reducer; 