import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Watchlist } from '../../types/financialTypes';
import { 
  getWatchlists, 
  getWatchlistById, 
  createWatchlist, 
  updateWatchlist, 
  deleteWatchlist 
} from '../../services/financialService';

interface WatchlistsState {
  items: Watchlist[];
  currentWatchlist: Watchlist | null;
  loading: boolean;
  error: string | null;
}

const initialState: WatchlistsState = {
  items: [],
  currentWatchlist: null,
  loading: false,
  error: null,
};

export const fetchWatchlists = createAsyncThunk(
  'watchlists/fetchWatchlists',
  async (_, { rejectWithValue }) => {
    try {
      return await getWatchlists();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch watchlists');
    }
  }
);

export const fetchWatchlistById = createAsyncThunk(
  'watchlists/fetchWatchlistById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await getWatchlistById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch watchlist');
    }
  }
);

export const addWatchlist = createAsyncThunk(
  'watchlists/addWatchlist',
  async (watchlist: Omit<Watchlist, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      return await createWatchlist(watchlist);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create watchlist');
    }
  }
);

export const editWatchlist = createAsyncThunk(
  'watchlists/editWatchlist',
  async ({ id, watchlist }: { id: number; watchlist: Partial<Watchlist> }, { rejectWithValue }) => {
    try {
      return await updateWatchlist(id, watchlist);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update watchlist');
    }
  }
);

export const removeWatchlist = createAsyncThunk(
  'watchlists/removeWatchlist',
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteWatchlist(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete watchlist');
    }
  }
);

const watchlistsSlice = createSlice({
  name: 'watchlists',
  initialState,
  reducers: {
    clearCurrentWatchlist: (state) => {
      state.currentWatchlist = null;
    },
    addInstrumentToWatchlist: (state, action: PayloadAction<{ watchlistId: number; instrumentId: string }>) => {
      const { watchlistId, instrumentId } = action.payload;
      const watchlist = state.items.find(item => item.id === watchlistId);
      if (watchlist && !watchlist.instruments.includes(instrumentId)) {
        watchlist.instruments.push(instrumentId);
        if (state.currentWatchlist?.id === watchlistId) {
          state.currentWatchlist.instruments.push(instrumentId);
        }
      }
    },
    removeInstrumentFromWatchlist: (state, action: PayloadAction<{ watchlistId: number; instrumentId: string }>) => {
      const { watchlistId, instrumentId } = action.payload;
      const watchlist = state.items.find(item => item.id === watchlistId);
      if (watchlist) {
        watchlist.instruments = watchlist.instruments.filter(id => id !== instrumentId);
        if (state.currentWatchlist?.id === watchlistId) {
          state.currentWatchlist.instruments = state.currentWatchlist.instruments.filter(id => id !== instrumentId);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all watchlists
      .addCase(fetchWatchlists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchlists.fulfilled, (state, action: PayloadAction<Watchlist[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWatchlists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch watchlist by id
      .addCase(fetchWatchlistById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchlistById.fulfilled, (state, action: PayloadAction<Watchlist>) => {
        state.loading = false;
        state.currentWatchlist = action.payload;
      })
      .addCase(fetchWatchlistById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add watchlist
      .addCase(addWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addWatchlist.fulfilled, (state, action: PayloadAction<Watchlist>) => {
        state.loading = false;
        state.items.push(action.payload);
        state.currentWatchlist = action.payload;
      })
      .addCase(addWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Edit watchlist
      .addCase(editWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editWatchlist.fulfilled, (state, action: PayloadAction<Watchlist>) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.currentWatchlist = action.payload;
      })
      .addCase(editWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove watchlist
      .addCase(removeWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeWatchlist.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        if (state.currentWatchlist?.id === action.payload) {
          state.currentWatchlist = null;
        }
      })
      .addCase(removeWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentWatchlist, addInstrumentToWatchlist, removeInstrumentFromWatchlist } = watchlistsSlice.actions;
export default watchlistsSlice.reducer; 