import { createSlice } from '@reduxjs/toolkit';
import { message } from 'antd';

const initialState = { user: null, loading: true, error: null };

async function readJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `API trả về lỗi ${response.status}`);
  }
  return data;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => { state.user = action.payload; state.loading = false; state.error = null; },
    setAuthLoading: (state, action) => { state.loading = action.payload; },
    setAuthError: (state, action) => { state.error = action.payload; state.loading = false; },
    clearUser: (state) => { state.user = null; state.error = null; state.loading = false; },
    resetAuth: () => initialState,
  },
});

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(setAuthLoading(true));
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await readJsonResponse(response);
    dispatch(setUser(data.user));
    message.success('Đăng nhập thành công');
    return data.user;
  } catch (error) {
    message.error(error.message || 'Đăng nhập thất bại');
    dispatch(setAuthError(error.message));
    throw error;
  }
};

export const logout = () => async (dispatch) => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    dispatch(clearUser());
    message.success('Đăng xuất thành công');
  } catch (error) {
    dispatch(setAuthError(error.message));
  }
};

export const listenToAuthChanges = () => (dispatch) => {
  dispatch(setAuthLoading(true));
  return fetch('/api/auth/me', { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) return null;
      const data = await response.json();
      return data?.authenticated ? data.user : null;
    })
    .then((user) => {
      if (user) dispatch(setUser(user));
      else dispatch(clearUser());
      return user;
    })
    .catch(() => {
      dispatch(clearUser());
      return null;
    });
};

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export const { setUser, setAuthLoading, setAuthError, clearUser, resetAuth } = authSlice.actions;

export default authSlice.reducer;
