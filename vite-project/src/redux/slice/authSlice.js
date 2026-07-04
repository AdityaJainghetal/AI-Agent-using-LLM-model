import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../services';

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try { const r = await authApi.login(data); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed'); }
});
export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try { const r = await authApi.register(data); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Register failed'); }
});
export const loadMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { const r = await authApi.me(); return r.data.user; }
  catch (e) { return rejectWithValue('Not authenticated'); }
});

const slice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (s) => {
      s.user = null; s.token = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(login.fulfilled, (s, a) => {
        s.loading = false; s.user = a.payload.user; s.token = a.payload.token;
        localStorage.setItem('token', a.payload.token);
      })
     .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(register.fulfilled, (s, a) => {
        s.user = a.payload.user; s.token = a.payload.token;
        localStorage.setItem('token', a.payload.token);
      })
     .addCase(register.rejected, (s, a) => { s.error = a.payload; })
     .addCase(loadMe.fulfilled, (s, a) => { s.user = a.payload; })
     .addCase(loadMe.rejected, (s) => { s.token = null; localStorage.removeItem('token'); });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
