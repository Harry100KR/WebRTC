import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  interestRate?: number;
  term?: string;
  minimumInvestment: number;
  features: string[];
  risks: string[];
  documents: string[];
}

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
  selectedProduct: Product | null;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
  selectedProduct: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch products');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedProduct, clearSelectedProduct } = productsSlice.actions;
export default productsSlice.reducer; 