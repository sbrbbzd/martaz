import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ListingState {
  filters: {
    search: string;
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    location: string | null;
    condition: string | null;
    sortBy: string;
    order: 'ASC' | 'DESC';
  };
  page: number;
  limit: number;
  selectedListing: any | null; // Replace 'any' with your Listing type when available
}

const initialState: ListingState = {
  filters: {
    search: '',
    category: null,
    minPrice: null,
    maxPrice: null,
    location: null,
    condition: null,
    sortBy: 'createdAt',
    order: 'DESC'
  },
  page: 1,
  limit: 12,
  selectedListing: null
};

const listingSlice = createSlice({
  name: 'listing',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ListingState['filters']>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
      state.page = 1; // Reset page when filters change
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
      state.page = 1; // Reset page when limit changes
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.page = 1;
    },
    setSelectedListing: (state, action: PayloadAction<any | null>) => {
      state.selectedListing = action.payload;
    }
  }
});

export const {
  setFilters,
  setPage,
  setLimit,
  resetFilters,
  setSelectedListing
} = listingSlice.actions;

export default listingSlice.reducer; 