import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi, tenantApi } from '../../services/api';
import { User, Tenant, TenantListItem, LoginResponse } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  tenant: Tenant | null;
  tenants: TenantListItem[];
  requiresTenantSelection: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  tenant: JSON.parse(localStorage.getItem('tenant') || 'null'),
  tenants: [],
  requiresTenantSelection: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, password, tenantSlug }: { email: string; password: string; tenantSlug?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await authApi.login(email, password, tenantSlug);
      const data: LoginResponse = response.data;

      if (data.requiresTenantSelection) {
        localStorage.setItem('token', data.access_token);
        return data;
      }

      const ADMIN_ROLES = ['super_admin', 'admin'];
      if (data.user && !ADMIN_ROLES.includes(data.user.role)) {
        return rejectWithValue('Access denied. Only administrators can access this portal.');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.tenant) {
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
      }
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

export const selectTenant = createAsyncThunk(
  'auth/selectTenant',
  async ({ tenantSlug }: { tenantSlug: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.selectTenant(tenantSlug);
      const data: LoginResponse = response.data;

      const ADMIN_ROLES = ['super_admin', 'admin'];
      if (data.user && !ADMIN_ROLES.includes(data.user.role)) {
        localStorage.removeItem('token');
        return rejectWithValue('Access denied. Only administrators can access this portal.');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.tenant) {
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
      }
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to select school');
    }
  },
);

export const fetchTenantSettings = createAsyncThunk(
  'auth/fetchTenantSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tenantApi.getSettings();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load settings');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tenant');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.tenant = action.payload.tenant;
        state.tenants = action.payload.tenants || [];
        state.requiresTenantSelection = action.payload.requiresTenantSelection;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(selectTenant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(selectTenant.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.tenant = action.payload.tenant;
        state.requiresTenantSelection = false;
        state.tenants = [];
      })
      .addCase(selectTenant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.tenant = null;
        state.tenants = [];
        state.requiresTenantSelection = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
