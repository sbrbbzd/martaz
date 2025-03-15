import { createSlice, PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../types';
import authService from '../../services/authService';

// Load persisted state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('authState');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Error loading auth state:', err);
    return undefined;
  }
};

// Helper to save state to localStorage
const saveState = (state: AuthState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('authState', serializedState);
  } catch (err) {
    console.error('Error saving auth state:', err);
  }
};

// Load persisted auth state
const persistedState = loadState();

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  username?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

const initialState: AuthState = persistedState || {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  token: null
};

export const updateProfile = createAsyncThunk<
  User,
  Partial<User>,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateProfileImage = createAsyncThunk<
  { profileImage: string },
  FormData,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'auth/updateProfileImage',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfileImage(formData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile image');
    }
  }
);

export const login = createAsyncThunk<
  { user: User; token: string },
  LoginCredentials,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // authService.login now returns a normalized response
      const response = await authService.login(credentials);
      console.log('Normalized login response:', response);
      return response; // Already in the correct format: { user: User, token: string }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk<
  { user: User; token: string },
  RegisterData,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      // authService.register now returns a normalized response
      const response = await authService.register(userData);
      return response; // Already in the correct format: { user: User, token: string }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
      // Save to localStorage
      saveState({
        ...state,
        loading: false,
        error: null
      });
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      // Clear from localStorage
      localStorage.removeItem('authState');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        state.error = null;
        // Save to localStorage
        saveState({
          ...state,
          loading: false,
          error: null
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user && action.payload) {
          state.user = {
            ...state.user,
            ...action.payload
          };
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateProfileImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user && action.payload) {
          state.user = {
            ...state.user,
            profileImage: action.payload.profileImage
          };
        }
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError
} = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export const selectAuthUser = createSelector(
  [selectAuth],
  (auth) => auth.user
);

export const selectIsAuthenticated = createSelector(
  [selectAuth],
  (auth) => auth.isAuthenticated
);

export const selectAuthState = createSelector(
  [selectAuth],
  (auth) => ({
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
  })
);

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthToken = (state: RootState) => state.auth.token;

export default authSlice.reducer; 