import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import listingReducer from './slices/listingSlice';
import uiReducer from './slices/uiSlice';
import adminReducer from './slices/adminSlice';
import { api } from '../services/api';

// Configure persist options
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'] // only persist auth state
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, authReducer);

// Configure store
export const store = configureStore({
  reducer: {
    auth: persistedReducer,
    listings: listingReducer,
    ui: uiReducer,
    admin: adminReducer,
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(api.middleware)
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 