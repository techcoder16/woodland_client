import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { get } from '../../helper/api';

// Types
interface DashboardStats {
  totalProperties: number;
  publishedProperties: number;
  draftProperties: number;
  totalTenants: number;
  activeTenants: number;
  monthlyRevenue: number;
  occupancyRate: number;
  recentActivities: Activity[];
}

interface Activity {
  id: string;
  type: 'property' | 'tenant' | 'payment' | 'system';
  action: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: any;
}

interface DashboardState {
  stats: DashboardStats | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  activities: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await get('/dashboard/stats');
      if (response.error) {
        return rejectWithValue(response.error.message);
      }
      // Handle the response data structure from your backend
      return response.data || {};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchRecentActivities = createAsyncThunk(
  'dashboard/fetchActivities',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await get(`/dashboard/activities?limit=${limit}`);
      if (response.error) {
        return rejectWithValue(response.error.message);
      }
      // Handle the response data structure from your backend
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch activities');
    }
  }
);

// Slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
      // Keep only the last 50 activities
      if (state.activities.length > 50) {
        state.activities = state.activities.slice(0, 50);
      }
    },
    updateStats: (state, action: PayloadAction<Partial<DashboardStats>>) => {
      if (state.stats) {
        state.stats = { ...state.stats, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch recent activities
      .addCase(fetchRecentActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure activities is always an array
        state.activities = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, addActivity, updateStats } = dashboardSlice.actions;
export default dashboardSlice.reducer;
