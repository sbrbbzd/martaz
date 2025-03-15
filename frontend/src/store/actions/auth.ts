import { Dispatch } from 'redux';
import { ActionTypes } from '../types';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

// Action Types
export interface SetAuthLoadingAction {
  type: ActionTypes.SET_AUTH_LOADING;
  payload: boolean;
}

export interface SetUserAction {
  type: ActionTypes.SET_USER;
  payload: User | null;
}

export interface LoginSuccessAction {
  type: ActionTypes.LOGIN_SUCCESS;
  payload: User;
}

export interface LogoutAction {
  type: ActionTypes.LOGOUT;
}

export interface AuthErrorAction {
  type: ActionTypes.AUTH_ERROR;
  payload: string;
}

export type AuthAction =
  | SetAuthLoadingAction
  | SetUserAction
  | LoginSuccessAction
  | LogoutAction
  | AuthErrorAction;

// Action Creators
export const setAuthLoading = (loading: boolean): SetAuthLoadingAction => ({
  type: ActionTypes.SET_AUTH_LOADING,
  payload: loading,
});

export const setUser = (user: User | null): SetUserAction => ({
  type: ActionTypes.SET_USER,
  payload: user,
});

export const loginSuccess = (user: User): LoginSuccessAction => ({
  type: ActionTypes.LOGIN_SUCCESS,
  payload: user,
});

export const authError = (message: string): AuthErrorAction => ({
  type: ActionTypes.AUTH_ERROR,
  payload: message,
});

export const logout = (): LogoutAction => ({
  type: ActionTypes.LOGOUT,
});

// Thunk Action Creators
export const loginUser = (credentials: LoginCredentials) => {
  return async (dispatch: Dispatch<AuthAction>) => {
    dispatch(setAuthLoading(true));
    
    try {
      // Make actual API call to login
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      
      // Save auth token to localStorage
      localStorage.setItem('token', data.token);
      
      // Dispatch success action
      dispatch(loginSuccess(data.user));
      return data.user;
    } catch (error) {
      dispatch(authError('Invalid email or password'));
      throw error;
    } finally {
      dispatch(setAuthLoading(false));
    }
  };
};

export const registerUser = (credentials: RegisterCredentials) => {
  return async (dispatch: Dispatch<AuthAction>) => {
    dispatch(setAuthLoading(true));
    
    try {
      // Make actual API call to register
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: credentials.name.split(' ')[0],
          lastName: credentials.name.split(' ').slice(1).join(' '),
          email: credentials.email,
          phone: credentials.phone,
          password: credentials.password
        }),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      
      // Save auth token to localStorage
      localStorage.setItem('token', data.token);
      
      // Dispatch success action
      dispatch(loginSuccess(data.user));
      return data.user;
    } catch (error) {
      dispatch(authError('An error occurred during registration'));
      throw error;
    } finally {
      dispatch(setAuthLoading(false));
    }
  };
};

export const logoutUser = () => {
  return (dispatch: Dispatch<AuthAction>) => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Dispatch logout action
    dispatch(logout());
  };
};

export const checkAuthStatus = () => {
  return async (dispatch: Dispatch<AuthAction>) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      dispatch(setUser(null));
      return;
    }
    
    dispatch(setAuthLoading(true));
    
    try {
      // Verify token with the API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Token verification failed');
      }
      
      const data = await response.json();
      dispatch(setUser(data.user));
    } catch (error) {
      localStorage.removeItem('token');
      dispatch(setUser(null));
    } finally {
      dispatch(setAuthLoading(false));
    }
  };
}; 