import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';

interface FavoriteItem {
  id: string;
  type: 'product' | 'listing';
  addedAt: string;
}

interface FavoritesState {
  items: FavoriteItem[];
  loading: boolean;
  error: string | null;
}

const initialState: FavoritesState = {
  items: [],
  loading: false,
  error: null,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addToFavorites: (state, action: PayloadAction<{ id: string; type: 'product' | 'listing' }>) => {
      const newFavorite: FavoriteItem = {
        id: action.payload.id,
        type: action.payload.type,
        addedAt: new Date().toISOString(),
      };
      state.items.push(newFavorite);
    },
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    setFavorites: (state, action: PayloadAction<FavoriteItem[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Export actions
export const {
  addToFavorites,
  removeFromFavorites,
  setFavorites,
  setLoading,
  setError,
} = favoritesSlice.actions;

// Export selectors
export const selectFavorites = (state: RootState) => state.favorites.items;
export const selectFavoritesLoading = (state: RootState) => state.favorites.loading;
export const selectFavoritesError = (state: RootState) => state.favorites.error;

// Export reducer
export default favoritesSlice.reducer; 