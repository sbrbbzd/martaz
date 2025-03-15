import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  loading: boolean;
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
}

const initialState: UiState = {
  theme: 'light',
  sidebarOpen: false,
  loading: false,
  toast: {
    show: false,
    message: '',
    type: 'info'
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    showToast: (state, action: PayloadAction<{ message: string; type: UiState['toast']['type'] }>) => {
      state.toast = {
        show: true,
        message: action.payload.message,
        type: action.payload.type
      };
    },
    hideToast: (state) => {
      state.toast.show = false;
    }
  }
});

export const {
  toggleTheme,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  showToast,
  hideToast
} = uiSlice.actions;

export default uiSlice.reducer; 